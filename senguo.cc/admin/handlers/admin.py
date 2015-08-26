from handlers.base import AdminBaseHandler,WxOauth2,unblock,get_unblock
import dal.models as models
import tornado.web
from settings import *
import time
import datetime
from sqlalchemy import func, desc, and_, or_, exists,not_
import qiniu
from dal.dis_dict import dis_dict
from libs.msgverify import gen_msg_token,check_msg_token
import requests
import base64
import decimal
import json

import urllib
import hashlib
# add by cm 2015.5.15
import string
import random
import codecs
codecs.register(lambda name: codecs.lookup('utf8') if name == 'utf8mb4' else None)

import tornado.websocket
from dal.db_configs import DBSession

# 登录处理
class Access(AdminBaseHandler):
	def initialize(self, action):
		self._action = action
	def prepare(self):
		"""prepare会在get、post等函数运行前运行，如果不想父类的prepare函数起作用的话就把他覆盖掉"""
		pass
	@AdminBaseHandler.check_arguments("openid?","unionid?","country?","province?","city?","headimgurl?","nickname?","sex?")
	def get(self):
		next_url = self.get_argument('next', '')
		if self._action == "login":
			next_url = self.get_argument("next", "")
			return self.render("admin/login.html",context=dict(next_url=next_url))
		elif self._action == "logout":
			self.clear_cookie("shop_id", domain=ROOT_HOST_NAME)
			self.clear_current_user()
			return self.redirect(self.reverse_url("OfficialHome"))
		elif self._action == "oauth":
			self.handle_oauth()
		elif self._action=="weixinphoneadmin":
			openid=str(self.args["openid"])
			unionid=str(self.args["unionid"])
			country=str(self.args["country"])
			province=str(self.args["province"])
			city=str(self.args["city"])
			headimgurl=str(self.args["headimgurl"])
			nickname=str(self.args["nickname"])
			sex=int(self.args["sex"])
			userinfo={"openid":openid,"unionid":unionid,"country":country,"province":province,"city":city,"headimgurl":headimgurl,"nickname":nickname,"sex":sex}
			q=self.session.query(models.Accountinfo).filter_by(wx_unionid=unionid).first()
			if  q==None:
				u = models.Customer.register_with_wx(self.session,userinfo)
				self.set_current_user(u,domain = ROOT_HOST_NAME)
			else:
				self.set_current_user(q,domain = ROOT_HOST_NAME)
			return self.redirect(self.reverse_url("customerProfile"))
		else:
			return self.send_error(404)

	@AdminBaseHandler.check_arguments("phone", "password", "next?")
	def post(self):
		u = models.ShopAdmin.login_by_phone_password(self.session, self.args["phone"], self.args["password"])
		if not u:
			return self.send_fail(error_text = "用户名或密码错误")
		self.set_current_user(u, domain=ROOT_HOST_NAME)
		self.redirect(self.args.get("next", self.reverse_url("OfficialHome")))
		return self.send_success()

	@AdminBaseHandler.check_arguments("code", "state?", "mode")
	def handle_oauth(self):
		# todo: handle state
		code = self.args["code"]
		mode = self.args["mode"]
		# print("[AdminAccess]LoginMode:",mode,", Code:", code)
		if mode not in ["mp", "kf"]:
			return self.send_error(400)

		userinfo = self.get_wx_userinfo(code, mode)
		if not userinfo:
			return self.redirect(self.reverse_url("adminLogin"))
		u = models.ShopAdmin.register_with_wx(self.session, userinfo)
		self.set_current_user(u, domain=ROOT_HOST_NAME)

		next_url = self.get_argument("next", self.reverse_url("OfficialHome"))
		return self.redirect(next_url)

# 后台首页
class Home(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		self.if_current_shops()
		if self.is_pc_browser()==False:
			return self.redirect(self.reverse_url("MadminHome"))

		# if not self.current_user.shops:
		#     return self.write("你还没有店铺，请先申请")
		# if not self.current_shop: #设置默认店铺
		#     self.current_shop=self.current_user.shops[0]
		#     self.set_secure_cookie("shop_id", str(self.current_shop.id), domain=ROOT_HOST_NAME)

		# 用于标识是否显示  店铺 余额
		show_balance = False

		shop_auth =  self.current_shop.shop_auth
		if self.get_secure_cookie("shop_id"):
			shop_id = int(self.get_secure_cookie("shop_id").decode())
			self.clear_cookie("shop_id", domain=ROOT_HOST_NAME)
			shop = self.session.query(models.Shop).filter_by(id=shop_id).first()
			self.current_shop = shop
			self.set_secure_cookie("shop_id", str(shop.id), domain=ROOT_HOST_NAME)

		if shop_auth in [1,2]:
			show_balance = True
		order_sum = self.session.query(models.Order).filter(models.Order.shop_id==self.current_shop.id,\
			not_(models.Order.status.in_([-1,0]))).count()
		new_order_sum = order_sum - (self.current_shop.new_order_sum or 0)
		if new_order_sum < 0:
			new_order_sum = 0
		# self.current_shop.new_order_sum = order_sum

		follower_sum = self.session.query(models.CustomerShopFollow).filter_by(shop_id=self.current_shop.id).count()
		new_follower_sum = follower_sum - (self.current_shop.new_follower_sum or 0)
		self.current_shop.new_follower_sum = follower_sum

		new_sys_notices = self.session.query(models.SysNotice).\
			filter((models.SysNotice.create_time >= datetime.datetime.now()-datetime.timedelta(10))).all()
		sys_notices = self.session.query(models.SysNotice).\
			filter((models.SysNotice.create_time < datetime.datetime.now()-datetime.timedelta(10))).all()
		self.session.commit()

		try:
			articles = self.session.query(models.Article).filter_by(status=1)
		except:
			articles = None
		if articles:
			notice_articles = articles.filter_by(classify=0).order_by(models.Article.create_time.desc()).limit(3).all()
			update_articles = articles.filter_by(classify=1).order_by(models.Article.create_time.desc()).limit(3).all()
			dry_articles = articles.filter_by(classify=2).order_by(models.Article.create_time.desc()).limit(3).all()
		article_list = {"notice":notice_articles,"update":update_articles,"dry":dry_articles}

		return self.render("admin/home.html", new_order_sum=new_order_sum, order_sum=order_sum,
						   new_follower_sum=new_follower_sum, follower_sum=follower_sum,\
						   show_balance = show_balance,new_sys_notices=new_sys_notices, \
						   sys_notices=sys_notices,article_list=article_list, context=dict())
	# @tornado.web.authenticated
	# @AdminBaseHandler.check_arguments("shop_id:int")
	# def post(self):  # 商家多个店铺之间的切换
	# 	shop_id = self.args["shop_id"]
	# 	try:shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
	# 	except:return self.send_error(404)
	# 	if shop.admin != self.current_user:
	# 		return self.send_error(403)#必须做权限检查：可能这个shop并不属于current_user
	# 	self.set_secure_cookie("shop_id", str(shop_id), domain=ROOT_HOST_NAME)
	# 	return self.send_success()
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action","data?")
	def post(self):  # 商家 or 管理员多个店铺之间的切换
		action = self.args["action"]
		if action == 'shop_change':
			shop_id = int(self.args["data"]["shop_id"])
			try:shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
			except:return self.send_error(404)
			admin = self.session.query(models.HireLink).filter_by(shop_id=shop_id,staff_id=self.current_user.id,active=1,work=9).first()
			if not admin and shop.admin != self.current_user:
				return self.send_error(403)#必须做权限检查：可能这个shop并不属于current_user
			self.clear_cookie("shop_id", domain=ROOT_HOST_NAME)
			self.current_shop = shop
			self.set_secure_cookie("shop_id", str(shop.id), domain=ROOT_HOST_NAME)
			return self.send_success()
		elif action == 'other_shop':
			shoplist=[]
			try:
				hire_link = self.session.query(models.HireLink).filter_by(staff_id =self.current_user.accountinfo.id,active=1,work=9).all()
			except:
				hire_link = None
			if hire_link:
				for hire in hire_link:
					shop = self.session.query(models.Shop).filter_by(id=hire.shop_id).first()
					shoplist.append({'id':shop.id,'shop_name':shop.shop_name})
			return self.send_success(data=shoplist)
		else:
			return self.send_error(404)

# 店铺切换
class SwitchShop(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		if self.is_pc_browser()==False:
			return self.redirect(self.reverse_url("MadminHome"))
		shop_list = []
		try:
			shops = self.current_user.shops
		except:
			shops = None
		try:
			other_shops  = self.session.query(models.Shop).join(models.HireLink,models.Shop.id==models.HireLink.shop_id)\
		.filter(models.HireLink.staff_id == self.current_user.accountinfo.id,models.HireLink.active==1,models.HireLink.work==9).all()
		except:
			other_shops = None

		if shops:
			shop_list += self.getshop(shops)
		if other_shops:
			shop_list += self.getshop(other_shops)
		return self.render("admin/switch-shop.html", context=dict(shop_list=shop_list))
	def getshop(self,shops):
		shop_list = []
		for shop in shops:
			satisfy = 0
			shop.__protected_props__ = ['admin', 'create_date_timestamp', 'admin_id',  'wx_accountname','auth_change',
										'wx_nickname', 'wx_qr_code','wxapi_token','shop_balance',\
										'alipay_account','alipay_account_name','available_balance',\
										'new_follower_sum','new_order_sum']
			orders = self.session.query(models.Order).filter_by(shop_id = shop.id ,status = 6).first()
			if orders:
				commodity_quality = 0
				send_speed = 0
				shop_service = 0
				q = self.session.query(func.avg(models.Order.commodity_quality),\
					func.avg(models.Order.send_speed),func.avg(models.Order.shop_service)).filter_by(shop_id = shop.id).all()
				if q[0][0]:
					commodity_quality = int(q[0][0])
				if q[0][1]:
					send_speed = int(q[0][1])
				if q[0][2]:
					shop_service = int(q[0][2])
				if commodity_quality and send_speed and shop_service:
					satisfy = float((commodity_quality + send_speed + shop_service)/300)
			comment_count = self.session.query(models.Order).filter_by(shop_id = shop.id ,status =6).count()
			fruit_count = self.session.query(models.Fruit).filter_by(shop_id = shop.id,active = 1).count()
			mgoods_count =self.session.query(models.MGoods).join(models.Menu,models.MGoods.menu_id == models.Menu.id)\
			.filter(models.Menu.shop_id == shop.id,models.MGoods.active == 1).count()
			shop.satisfy = satisfy
			shop.comment_count = comment_count
			shop.goods_count = fruit_count
			shop.fans_sum = self.session.query(models.CustomerShopFollow).filter_by(shop_id=shop.id).count()
			shop.satisfy = "%.0f%%"  %(round(decimal.Decimal(satisfy),2)*100)
			shop.order_sum = self.session.query(models.Order).filter_by(shop_id=shop.id).count()
			total_money = self.session.query(func.sum(models.Order.totalPrice)).filter_by(shop_id = shop.id).filter( or_(models.Order.status ==5,models.Order.status ==6 )).all()[0][0]
			shop.total_money = self.session.query(func.sum(models.Order.totalPrice)).filter_by(shop_id = shop.id ,status =6).all()[0][0]
			if total_money:
				shop.total_money = format(total_money,'.2f')
			else:
				shop.total_money=0
			shop_city = self.code_to_text("shop_city",shop.shop_city)
			shop.address = shop_city +" " + shop.shop_address_detail  if shop_city  else shop.shop_address_detail
			shop_list.append(shop.safe_props())
		return shop_list

# 后台轮询
class Realtime(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		order_sum,new_order_sum,follower_sum,new_follower_sum,on_num = 0,0,0,0,0
		if self.current_shop.orders:
			order_sum = self.session.query(models.Order).filter(models.Order.shop_id==self.current_shop.id,\
				not_(models.Order.status.in_([-1,0]))).count()
			new_order_sum = order_sum - (self.current_shop.new_order_sum or 0)
			follower_sum = self.session.query(models.CustomerShopFollow).filter_by(shop_id=self.current_shop.id).count()
			new_follower_sum = follower_sum - (self.current_shop.new_follower_sum or 0)
			on_num = self.session.query(models.Order).filter_by(shop_id=self.current_shop.id).filter_by(type=1,status=1).count()
			if new_order_sum < 0:
				new_order_sum = 0
		return self.send_success(new_order_sum=new_order_sum, order_sum=order_sum,new_follower_sum=new_follower_sum,
			follower_sum=follower_sum,on_num=on_num)

# # websocket 版后台轮询
# class Realtime(AdminBaseHandler,tornado.websocket.WebSocketHandler):

# 	session = DBSession()
# 	socket_handlers = set ()

# 	@tornado.web.asynchronous
# 	def send_data(self):
# 		import time
# 		import threading
# 		print('[AdminRealtimeWebsocket]self:',self)
# 		order_sum,new_order_sum,follower_sum,new_follower_sum,on_num = 0,0,0,0,0
# 		order_sum = self.session.query(models.Order).filter(models.Order.shop_id==self.current_shop.id,\
# 			not_(models.Order.status.in_([-1,0]))).count()
# 		new_order_sum = order_sum - (self.current_shop.new_order_sum or 0)
#		if new_order_sum < 0:
#			new_order_sum = 0
# 		follower_sum = self.session.query(models.CustomerShopFollow).filter_by(shop_id=self.current_shop.id).count()
# 		new_follower_sum = follower_sum - (self.current_shop.new_follower_sum or 0)
# 		on_num = self.session.query(models.Order).filter_by(shop_id=self.current_shop.id).filter_by(type=1,status=1).count()
# 		data = dict(new_order_sum = new_order_sum , order_sum = order_sum , new_follower_sum = new_follower_sum,
# 			follower_sum = follower_sum , on_num = on_num)
# 		self.write_message(json.dumps(data))
# 		threading.Timer(5.0, self.send_data()).start()

# 	def check_origin(self, origin):
# 		return True

# 	def open(self):
# 		print('[AdminRealtimeWebsocket]open')
# 		Realtime.socket_handlers.add(self.send_data)

# 	def onclose(self):
# 		print('[AdminRealtimeWebsocket]onclose')
# 		Realtime.socket_handlers.remove(self.send_data)

# 	def on_message(self,message):
# 		self.send_data()

# websocket 版后台轮询
class RealtimeWebsocket(tornado.websocket.WebSocketHandler):
	session = DBSession()
	def open(self):
		print('[AdminRealtimeWebsocket]open')
	def onclose(self):
		print('[AdminRealtimeWebsocket]onclose')
	def on_message(self,message):
		order_sum,new_order_sum,follower_sum,new_follower_sum,on_num = 0,0,0,0,0
		order_sum = self.session.query(models.Order).filter(models.Order.shop_id==self.current_shop.id,\
			not_(models.Order.status.in_([-1,0]))).count()
		new_order_sum = order_sum - (self.current_shop.new_order_sum or 0)
		if new_order_sum < 0:
			new_order_sum = 0
		follower_sum = self.session.query(models.CustomerShopFollow).filter_by(shop_id=self.current_shop.id).count()
		new_follower_sum = follower_sum - (self.current_shop.new_follower_sum or 0)
		on_num = self.session.query(models.Order).filter_by(shop_id=self.current_shop.id).filter_by(type=1,status=1).count()
		data = dict(new_order_sum = new_order_sum , order_sum = order_sum , new_follower_sum = new_follower_sum,
			follower_sum = follower_sum , on_num = on_num)
		return self.write_message(json.dumps(data))

# 销售统计 add by jyj 2015-7-8
class SellStatic(AdminBaseHandler):
	def get(self):
		self.if_current_shops()
		return self.render("admin/sell-count.html",context=dict(subpage='sellstatic'))

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action:str","start_date:str","end_date:str","type_name?:str","goods_name?:str")
	def post(self):
		action = self.args["action"]
		start_date = self.args["start_date"]
		end_date = self.args["end_date"]

		output_data = {}
		# 查询店铺所有的水果类目
		shop_all_fruit_type_query = self.session.query(models.FruitType.id,models.FruitType.name).join(models.Fruit).filter(models.Fruit.shop_id == self.current_shop.id).distinct(models.Fruit.fruit_type_id).all()
		shop_all_mgoods_type_query = self.session.query(models.Menu.id,models.Menu.name).filter(models.Menu.shop_id == self.current_shop.id).all()

		if len(shop_all_fruit_type_query) == 0 and len(shop_all_mgoods_type_query) == 0:
			output_data = {
				'type_data':[],
				'name_data':[],
				'has_goods':0
			}
			return self.send_success(output_data = output_data)

		shop_all_type_name = [[],[]]
		shop_all_type_name[0] = []
		shop_all_type_name[1] = []
		for item in shop_all_fruit_type_query:
			tmp = []
			tmp.append(item[0])
			tmp.append(item[1])
			if tmp[0] == 999:
				tmp[1] = '其他水果'
			elif tmp[0] == 1999:
				tmp[1] = '其他干果'
			elif tmp[0] == 2000:
				tmp[1] = '其他'
			else:
				pass
			shop_all_type_name[0].append(tmp[0])
			shop_all_type_name[1].append(tmp[1])

		for item in shop_all_mgoods_type_query:
			shop_all_type_name[0].append(item[0])
			shop_all_type_name[1].append(item[1])

		# print("[AdminSellStatic]shop_all_type_name:",shop_all_type_name)
		shop_all_goods = {}
		shop_all_fruit = {}
		shop_all_mgoods = {}

		shop_fruit_id_name_list = self.session.query(models.Fruit.id,models.Fruit.name).filter(models.Fruit.shop_id == self.current_shop.id).all()
		shop_charge_type_fruit_dict = {}
		shop_charge_type_list = []
		for item in shop_fruit_id_name_list:
			charge_type_id = self.session.query(models.ChargeType.id).filter(models.ChargeType.fruit_id == item[0]).all()[0][0]
			shop_charge_type_fruit_dict[str(charge_type_id)] = [item[0],item[1]]
			shop_charge_type_list.append(charge_type_id)
			shop_all_fruit[str(item[0])] = item[1]

		shop_mgoods_id_name_list = self.session.query(models.MGoods.id,models.MGoods.name).join(models.Menu).filter(models.Menu.shop_id == self.current_shop.id).all()
		shop_mcharge_type_mgoods_dict = {}
		shop_mcharge_type_list = []
		for item in shop_mgoods_id_name_list:
			mcharge_type_id = self.session.query(models.MChargeType.id).filter(models.MChargeType.mgoods_id == item[0]).all()[0][0]
			shop_mcharge_type_mgoods_dict[str(mcharge_type_id)] = [item[0],item[1]]
			shop_mcharge_type_list.append(mcharge_type_id)
			shop_all_mgoods[str(item[0])] = item[1]

		shop_all_goods = shop_all_fruit.copy()
		shop_all_goods.update(shop_all_mgoods)

		shop_charge_type_goods_dict = shop_charge_type_fruit_dict.copy()
		shop_charge_type_goods_dict.update(shop_mcharge_type_mgoods_dict)
		shop_charge_type_list = shop_charge_type_list + shop_mcharge_type_list
		shop_goods_id_name_list = shop_fruit_id_name_list + shop_mgoods_id_name_list

		# 查询店铺的所有水果名称：
		shop_all_goods = self.session.query(models.Fruit.name).filter(models.Fruit.shop_id == self.current_shop.id).all()

		if action == 'all':
			shop_all_goods = shop_all_fruit.copy()
			shop_all_goods.update(shop_all_mgoods)

			now = datetime.datetime.now()
			now_date = datetime.datetime(now.year,now.month,now.day)
			now_date = now_date.strftime("%Y-%m-%d")
			yesterday_date = datetime.datetime(now.year,now.month,now.day-1)
			yesterday_date = yesterday_date.strftime("%Y-%m-%d")

			# 从order表中查询出一天店铺的所有有效订单（status字段的值大于等于5）的fruits字段：
			now_date_str = now_date + '%'
			yesterday_date_str = yesterday_date + '%'
			today_fruits_list_query = self.session.query(models.Order.fruits).filter(models.Order.shop_id == self.current_shop.id,models.Order.status >= 5,\
									  or_(and_(models.Order.create_date.like(now_date_str),models.Order.today == 1),\
									        and_(models.Order.create_date.like(yesterday_date_str),models.Order.today == 2))).all()
			today_mgoods_list_query = self.session.query(models.Order.mgoods).filter(models.Order.shop_id == self.current_shop.id,models.Order.status >= 5,\
						       			or_(and_(models.Order.create_date.like(now_date_str),models.Order.today == 1),\
									        and_(models.Order.create_date.like(yesterday_date_str),models.Order.today == 2))).all()

			fruit_list = []
			mgoods_list = []

			for item in today_fruits_list_query:
				if item[0] != '{}' and item[0] != None:
					fruit_list.append(item[0])

			for item in today_mgoods_list_query:
				if item[0] != '{}' and item[0] != None:
					mgoods_list.append(item[0])
			order_goods_list = fruit_list + mgoods_list

			#每单种水果的销售额
			total_price_list = []
			name_list = []
			for goods_item in order_goods_list:
				goods_item = eval(goods_item)
				for key in goods_item:
					if key not in shop_charge_type_list:
						continue
					tmp = {}
					fl_value = goods_item[key]
					num = float(fl_value["num"])
					single_price = float(fl_value["charge"].split('元')[0])
					total_price = single_price * num

					tmp["fruit_id"] = shop_charge_type_goods_dict[str(key)][0]
					tmp["fruit_name"] = shop_charge_type_goods_dict[str(key)][1]

					tmp["total_price"] = total_price
					for tpl in total_price_list:
						name_list.append(tpl['fruit_name'])

					if tmp["fruit_name"] not in name_list:
						total_price_list.append(tmp)
					else:
						for i in range(len(total_price_list)):
							if total_price_list[i]["fruit_name"] == tmp["fruit_name"]:
								total_price_list[i]['total_price'] += total_price

			id_list = []
			for i in range(len(total_price_list)):
				id_list.append(str(total_price_list[i]['fruit_id']))

			for id_item in list(shop_all_goods.keys()):
				if id_item not in id_list:
					tmp = {}
					tmp["fruit_id"] = int(id_item)
					tmp["fruit_name"] = shop_all_goods[id_item]
					tmp["total_price"] = 0
					total_price_list.append(tmp)
			# 按销量排序：
			total_price_list.sort(key = lambda item:item["total_price"],reverse = False)

			shop_fruit_id_list = []
			shop_mgoods_id_list = []
			for item in shop_fruit_id_name_list:
				shop_fruit_id_list.append(item[0])
			for item in shop_mgoods_id_name_list:
				shop_mgoods_id_list.append(item[0])

			# 查询total_price_list表中所有商品的类目，并存到一个字典中：
			goods_type_list = {}
			for tpl in total_price_list:
				if tpl["fruit_name"] not in list(goods_type_list.keys()):
					if tpl["fruit_id"] in shop_fruit_id_list:
						goods_type_list[tpl["fruit_name"]] = self.session.query(models.FruitType.name).join(models.Fruit).filter(models.Fruit.id == tpl["fruit_id"]).all()[0][0]
					else:
						goods_type_list[tpl["fruit_name"]] = self.session.query(models.Menu.name).join(models.MGoods).filter(models.MGoods.id == tpl["fruit_id"]).all()[0][0]

			# 每一个类目的总销售额(内部包含该类目下的所有种类的商品的名称及销售额):
			type_total_price_list = []
			for type_name in shop_all_type_name[1]:
				tmp = {}
				tmp["type_name"] = type_name
				tmp["type_total_price"] = 0.0
				tmp["per_name_total_price"] = {}
				for tpl in total_price_list:
					if goods_type_list[tpl["fruit_name"]] == type_name:
						tmp["type_total_price"] += tpl["total_price"]
						tmp["per_name_total_price"][tpl["fruit_name"]] = tpl["total_price"]
				type_total_price_list.append(tmp)
			type_total_price_list.sort(key = lambda item:item["type_total_price"],reverse=False)

			output_data = {
				'type_data':type_total_price_list,
				'name_data':total_price_list
			}
			return self.send_success(output_data = output_data)

		elif action == 'all_single':
			shop_all_goods = shop_all_fruit.copy()
			shop_all_goods.update(shop_all_mgoods)

			output_data = {}

			output_data["all_type"] = shop_all_type_name[1]
			output_data["all_goods"] = list(shop_all_goods.values())

			# 从order表中查询出某个日期区间内某个店铺的所有有效订单（status字段的值大于等于5）的fruits字段(比如2015-07-15和2015-07-16两天的)：
			start_date_str = start_date
			end_date_str = end_date

			start_date = datetime.datetime.strptime(start_date_str,'%Y-%m-%d')
			start_date_pre = start_date + datetime.timedelta(days = -1)
			start_date_pre = datetime.datetime(start_date_pre.year,start_date_pre.month,start_date_pre.day)
			start_date_pre_str = start_date_pre.strftime('%Y-%m-%d')

			end_date = datetime.datetime.strptime(end_date_str,'%Y-%m-%d')
			end_date_next = end_date + datetime.timedelta(days = 1)
			end_date_next = datetime.datetime(end_date_next.year,end_date_next.month,end_date_next.day)
			end_date_next_str = end_date_next.strftime('%Y-%m-%d')
			fruit_list_query = self.session.query(models.Order.fruits).filter(models.Order.shop_id == self.current_shop.id,models.Order.status >= 5,\
						        or_(and_(models.Order.create_date >= start_date_str,models.Order.create_date < end_date_next_str,models.Order.today == 1),\
						        	and_(models.Order.create_date >= start_date_pre_str,models.Order.create_date < end_date_str,models.Order.today == 2))).all()
			mgoods_list_query = self.session.query(models.Order.mgoods).filter(models.Order.shop_id == self.current_shop.id,models.Order.status >= 5,\
						        or_(and_(models.Order.create_date >= start_date_str,models.Order.create_date < end_date_next_str,models.Order.today == 1),\
						        	and_(models.Order.create_date >= start_date_pre_str,models.Order.create_date < end_date_str,models.Order.today == 2))).all()
			fruit_list = []
			mgoods_list = []

			for item in fruit_list_query:
				if item[0] != '{}' and item[0] != None:
					fruit_list.append(item[0])

			for item in mgoods_list_query:
				if item[0] != '{}' and item[0] != None:
					mgoods_list.append(item[0])
			order_goods_list = fruit_list + mgoods_list

			total_price_list = []
			name_list = []

			for goods_item in order_goods_list:
				goods_item = eval(goods_item)
				for key in goods_item:
					if key not in shop_charge_type_list:
						continue
					tmp = {}
					fl_value = goods_item[key]
					num = float(fl_value["num"])
					single_price = float(fl_value["charge"].split('元')[0])
					total_price = single_price * num

					tmp["fruit_id"] = shop_charge_type_goods_dict[str(key)][0]
					tmp["fruit_name"] = shop_charge_type_goods_dict[str(key)][1]

					tmp["total_price"] = total_price
					for tpl in total_price_list:
						name_list.append(tpl['fruit_name'])

					if tmp["fruit_name"] not in name_list:
						total_price_list.append(tmp)
					else:
						for i in range(len(total_price_list)):
							if total_price_list[i]["fruit_name"] == tmp["fruit_name"]:
								total_price_list[i]['total_price'] += total_price

			id_list = []
			for i in range(len(total_price_list)):
				id_list.append(str(total_price_list[i]['fruit_id']))

			for id_item in list(shop_all_goods.keys()):
				if id_item not in id_list:
					tmp = {}
					tmp["fruit_id"] = int(id_item)
					tmp["fruit_name"] = shop_all_goods[id_item]
					tmp["total_price"] = 0
					total_price_list.append(tmp)
			# 按销量排序：
			total_price_list.sort(key = lambda item:item["total_price"],reverse = True)
			output_data["name_max"] = total_price_list[0]["fruit_name"]

			shop_fruit_id_list = []
			shop_mgoods_id_list = []
			for item in shop_fruit_id_name_list:
				shop_fruit_id_list.append(item[0])
			for item in shop_mgoods_id_name_list:
				shop_mgoods_id_list.append(item[0])

			# 查询total_price_list表中所有商品的类目，并存到一个字典中：
			goods_type_list = {}
			for tpl in total_price_list:
				if tpl["fruit_name"] not in list(goods_type_list.keys()):
					if tpl["fruit_id"] in shop_fruit_id_list:
						goods_type_list[tpl["fruit_name"]] = self.session.query(models.FruitType.name).join(models.Fruit).filter(models.Fruit.id == tpl["fruit_id"]).all()[0][0]
					else:
						goods_type_list[tpl["fruit_name"]] = self.session.query(models.Menu.name).join(models.MGoods).filter(models.MGoods.id == tpl["fruit_id"]).all()[0][0]

			# 每一个类目的总销售额(内部包含该类目下的所有种类的商品的名称及销售额):
			type_total_price_list = []
			for type_name in shop_all_type_name[1]:
				tmp = {}
				tmp["type_name"] = type_name
				tmp["type_total_price"] = 0.0
				tmp["per_name_total_price"] = {}
				for tpl in total_price_list:
					if goods_type_list[tpl["fruit_name"]] == type_name:
						tmp["type_total_price"] += tpl["total_price"]
						tmp["per_name_total_price"][tpl["fruit_name"]] = tpl["total_price"]
				type_total_price_list.append(tmp)

			type_total_price_list.sort(key = lambda item:item["type_total_price"],reverse=True)
			output_data["type_max"] = type_total_price_list[0]["type_name"]

			return self.send_success(output_data = output_data)

		elif action == 'type' or action == 'name':
			shop_all_goods = shop_all_fruit.copy()
			shop_all_goods.update(shop_all_mgoods)
			# 从order表中查询出某个日期区间内某个店铺的所有有效订单（status字段的值大于等于5）的fruits字段(比如2015-07-15和2015-07-16两天的)：
			start_date_str = start_date
			end_date_str = end_date

			start_date = datetime.datetime.strptime(start_date_str,'%Y-%m-%d')
			start_date_pre = start_date + datetime.timedelta(days = -1)
			start_date_pre = datetime.datetime(start_date_pre.year,start_date_pre.month,start_date_pre.day)
			start_date_pre_str = start_date_pre.strftime('%Y-%m-%d')

			end_date = datetime.datetime.strptime(end_date_str,'%Y-%m-%d')
			end_date_next = end_date + datetime.timedelta(days = 1)
			end_date_next = datetime.datetime(end_date_next.year,end_date_next.month,end_date_next.day)
			end_date_next_str = end_date_next.strftime('%Y-%m-%d')
			fruit_list_query = self.session.query(models.Order.fruits).filter(models.Order.shop_id == self.current_shop.id,models.Order.status >= 5,\
						        or_(and_(models.Order.create_date >= start_date_str,models.Order.create_date < end_date_next_str,models.Order.today == 1),\
						        	and_(models.Order.create_date >= start_date_pre_str,models.Order.create_date < end_date_str,models.Order.today == 2))).all()
			mgoods_list_query = self.session.query(models.Order.mgoods).filter(models.Order.shop_id == self.current_shop.id,models.Order.status >= 5,\
						        or_(and_(models.Order.create_date >= start_date_str,models.Order.create_date < end_date_next_str,models.Order.today == 1),\
						        	and_(models.Order.create_date >= start_date_pre_str,models.Order.create_date < end_date_str,models.Order.today == 2))).all()

			fruit_list = []
			mgoods_list = []

			for item in fruit_list_query:
				if item[0] != '{}' and item[0] != None:
					fruit_list.append(item[0])

			for item in mgoods_list_query:
				if item[0] != '{}' and item[0] != None:
					mgoods_list.append(item[0])
			order_goods_list = fruit_list + mgoods_list

			total_price_list = []
			name_list = []

			for goods_item in order_goods_list:
				goods_item = eval(goods_item)
				for key in goods_item:
					if key not in shop_charge_type_list:
						continue
					tmp = {}
					fl_value = goods_item[key]
					num = float(fl_value["num"])
					single_price = float(fl_value["charge"].split('元')[0])
					total_price = single_price * num

					tmp["fruit_id"] = shop_charge_type_goods_dict[str(key)][0]
					tmp["fruit_name"] = shop_charge_type_goods_dict[str(key)][1]

					tmp["total_price"] = total_price
					for tpl in total_price_list:
						name_list.append(tpl['fruit_name'])

					if tmp["fruit_name"] not in name_list:
						total_price_list.append(tmp)
					else:
						for i in range(len(total_price_list)):
							if total_price_list[i]["fruit_name"] == tmp["fruit_name"]:
								total_price_list[i]['total_price'] += total_price

			id_list = []
			for i in range(len(total_price_list)):
				id_list.append(str(total_price_list[i]['fruit_id']))

			for id_item in list(shop_all_goods.keys()):
				if id_item not in id_list:
					tmp = {}
					tmp["fruit_id"] = int(id_item)
					tmp["fruit_name"] = shop_all_goods[id_item]
					tmp["total_price"] = 0
					total_price_list.append(tmp)
			# 按销量排序：
			total_price_list.sort(key = lambda item:item["total_price"],reverse = False)

			if action == 'type':
				shop_fruit_id_list = []
				shop_mgoods_id_list = []
				for item in shop_fruit_id_name_list:
					shop_fruit_id_list.append(item[0])
				for item in shop_mgoods_id_name_list:
					shop_mgoods_id_list.append(item[0])

				# 查询total_price_list表中所有商品的类目，并存到一个字典中：
				goods_type_list = {}
				for tpl in total_price_list:
					if tpl["fruit_name"] not in list(goods_type_list.keys()):
						if tpl["fruit_id"] in shop_fruit_id_list:
							goods_type_list[tpl["fruit_name"]] = self.session.query(models.FruitType.name).join(models.Fruit).filter(models.Fruit.id == tpl["fruit_id"]).all()[0][0]
						else:
							goods_type_list[tpl["fruit_name"]] = self.session.query(models.Menu.name).join(models.MGoods).filter(models.MGoods.id == tpl["fruit_id"]).all()[0][0]

				# 每一个类目的总销售额(内部包含该类目下的所有种类的商品的名称及销售额):
				type_total_price_list = []
				for type_name in shop_all_type_name[1]:
					tmp = {}
					tmp["type_name"] = type_name
					tmp["type_total_price"] = 0.0
					tmp["per_name_total_price"] = {}
					for tpl in total_price_list:
						if goods_type_list[tpl["fruit_name"]] == type_name:
							tmp["type_total_price"] += tpl["total_price"]
							tmp["per_name_total_price"][tpl["fruit_name"]] = tpl["total_price"]
					type_total_price_list.append(tmp)
				type_total_price_list.sort(key = lambda item:item["type_total_price"],reverse=False)
				return self.send_success(output_data = type_total_price_list)
			else:
				return self.send_success(output_data = total_price_list)
		elif action == 'single_type':
			shop_all_goods = shop_all_fruit.copy()
			shop_all_goods.update(shop_all_mgoods)

			type_name = self.args["type_name"]

			start_date_str = start_date
			start_date = datetime.datetime.strptime(start_date_str,'%Y-%m-%d')
			now = datetime.datetime.now()
			now_date = datetime.datetime(now.year,now.month,now.day)
			if start_date.month == now.month:
				flag_date = now_date
			else:
				if start_date.month in [1,3,5,7,8,10,12]:
					flag_date = datetime.datetime(start_date.year,start_date.month,31)
				elif start_date.month in [4,6,9,11]:
					flag_date = datetime.datetime(start_date.year,start_date.month,30)
				elif start_date.month == 2:
					year = start_date.year
					if (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0):
						flag_date = datetime.datetime(start_date.year,start_date.month,29)
					else:
						flag_date = datetime.datetime(start_date.year,start_date.month,28)

			month_price_list = []
			name_item_list = []
			count_num = 1
			sum_time = 0

			while start_date <=flag_date:
				start_date_str = start_date.strftime('%Y-%m-%d')
				start_date_pre = start_date + datetime.timedelta(days = -1)
				start_date_pre = datetime.datetime(start_date_pre.year,start_date_pre.month,start_date_pre.day)
				start_date_pre_str = start_date_pre.strftime('%Y-%m-%d')

				end_date = start_date
				end_date_str = start_date_str
				end_date_next = end_date + datetime.timedelta(days = 1)
				end_date_next = datetime.datetime(end_date_next.year,end_date_next.month,end_date_next.day)
				end_date_next_str = end_date_next.strftime('%Y-%m-%d')


				fruit_list_query = self.session.query(models.Order.fruits).filter(models.Order.shop_id == self.current_shop.id,models.Order.status >= 5,\
							        or_(and_(models.Order.create_date >= start_date_str,models.Order.create_date < end_date_next_str,models.Order.today == 1),\
							        	and_(models.Order.create_date >= start_date_pre_str,models.Order.create_date < end_date_str,models.Order.today == 2))).all()
				mgoods_list_query = self.session.query(models.Order.mgoods).filter(models.Order.shop_id == self.current_shop.id,models.Order.status >= 5,\
							        or_(and_(models.Order.create_date >= start_date_str,models.Order.create_date < end_date_next_str,models.Order.today == 1),\
							        	and_(models.Order.create_date >= start_date_pre_str,models.Order.create_date < end_date_str,models.Order.today == 2))).all()
				fruit_list = []
				mgoods_list = []

				for item in fruit_list_query:
					if item[0] != '{}' and item[0] != None:
						fruit_list.append(item[0])

				for item in mgoods_list_query:
					if item[0] != '{}' and item[0] != None:
						mgoods_list.append(item[0])
				order_goods_list = fruit_list + mgoods_list

				total_price_list = []
				name_list = []

				for goods_item in order_goods_list:
					goods_item = eval(goods_item)
					for key in goods_item:
						if key not in shop_charge_type_list:
							continue
						tmp = {}
						fl_value = goods_item[key]
						num = float(fl_value["num"])
						single_price = float(fl_value["charge"].split('元')[0])
						total_price = single_price * num

						tmp["fruit_id"] = shop_charge_type_goods_dict[str(key)][0]
						tmp["fruit_name"] = shop_charge_type_goods_dict[str(key)][1]

						tmp["total_price"] = total_price
						for tpl in total_price_list:
							name_list.append(tpl['fruit_name'])

						if tmp["fruit_name"] not in name_list:
							total_price_list.append(tmp)
						else:
							for i in range(len(total_price_list)):
								if total_price_list[i]["fruit_name"] == tmp["fruit_name"]:
									total_price_list[i]['total_price'] += total_price

				id_list = []
				for i in range(len(total_price_list)):
					id_list.append(str(total_price_list[i]['fruit_id']))

				for id_item in list(shop_all_goods.keys()):
					if id_item not in id_list:
						tmp = {}
						tmp["fruit_id"] = int(id_item)
						tmp["fruit_name"] = shop_all_goods[id_item]
						tmp["total_price"] = 0
						total_price_list.append(tmp)
				# 按销量排序：
				total_price_list.sort(key = lambda item:item["total_price"],reverse = False)

				shop_fruit_id_list = []
				shop_mgoods_id_list = []
				for item in shop_fruit_id_name_list:
					shop_fruit_id_list.append(item[0])
				for item in shop_mgoods_id_name_list:
					shop_mgoods_id_list.append(item[0])

				# 查询total_price_list表中所有商品的类目，并存到一个字典中：
				goods_type_list = {}
				for tpl in total_price_list:
					if tpl["fruit_name"] not in list(goods_type_list.keys()):
						if tpl["fruit_id"] in shop_fruit_id_list:
							goods_type_list[tpl["fruit_name"]] = self.session.query(models.FruitType.name).join(models.Fruit).filter(models.Fruit.id == tpl["fruit_id"]).all()[0][0]
						elif tpl["fruit_id"] in shop_mgoods_id_list:
							goods_type_list[tpl["fruit_name"]] = self.session.query(models.Menu.name).join(models.MGoods).filter(models.MGoods.id == tpl["fruit_id"]).all()[0][0]
						else:
							# goods_type_list[tpl["fruit_name"]] = "其他"
							pass


				# 每一个类目的总销售额(内部包含该类目下的所有种类的商品的名称及销售额):
				type_total_price_list = []

				tmp = {}
				tmp["date"] = start_date_str
				tmp["per_name_total_price"] = {}
				for tpl in total_price_list:
					if goods_type_list[tpl["fruit_name"]] == type_name:
						tmp["per_name_total_price"][tpl["fruit_name"]] = tpl["total_price"]

				if(count_num == 1):
					name_item_list = list(tmp["per_name_total_price"].keys())
				name_price_item_list = []
				for i in range(len(name_item_list)):
					if name_item_list[i] not in list(tmp["per_name_total_price"].keys()):
						name_price_item_list.append(0.0)
						continue
					name_price_item_list.append(tmp["per_name_total_price"][name_item_list[i]])

				month_price_list.append(name_price_item_list)
				start_date = start_date + datetime.timedelta(days = 1)
				count_num += 1

			output_data = []
			output_data.append(name_item_list)
			output_data.append(month_price_list)

			return self.send_success(output_data = output_data)

		elif action == 'single_name':
			goods_name = self.args["goods_name"]

			start_date_str = start_date
			start_date = datetime.datetime.strptime(start_date_str,'%Y-%m-%d')
			now = datetime.datetime.now()
			now_date = datetime.datetime(now.year,now.month,now.day)
			if start_date.month == now.month:
				flag_date = now_date
			else:
				if start_date.month in [1,3,5,7,8,10,12]:
					flag_date = datetime.datetime(start_date.year,start_date.month,31)
				elif start_date.month in [4,6,9,11]:
					flag_date = datetime.datetime(start_date.year,start_date.month,30)
				elif start_date.month == 2:
					year = start_date.year
					if (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0):
						flag_date = datetime.datetime(start_date.year,start_date.month,29)
					else:
						flag_date = datetime.datetime(start_date.year,start_date.month,28)

			month_price_list = []
			while start_date <= flag_date:
				start_date_str = start_date.strftime('%Y-%m-%d')
				start_date_pre = start_date + datetime.timedelta(days = -1)
				start_date_pre = datetime.datetime(start_date_pre.year,start_date_pre.month,start_date_pre.day)
				start_date_pre_str = start_date_pre.strftime('%Y-%m-%d')

				end_date = start_date
				end_date_str = start_date_str
				end_date_next = end_date + datetime.timedelta(days = 1)
				end_date_next = datetime.datetime(end_date_next.year,end_date_next.month,end_date_next.day)
				end_date_next_str = end_date_next.strftime('%Y-%m-%d')

				fruit_list_query = self.session.query(models.Order.fruits).filter(models.Order.shop_id == self.current_shop.id,models.Order.status >= 5,\
							        or_(and_(models.Order.create_date >= start_date_str,models.Order.create_date < end_date_next_str,models.Order.today == 1),\
							        	and_(models.Order.create_date >= start_date_pre_str,models.Order.create_date < end_date_str,models.Order.today == 2))).all()
				mgoods_list_query = self.session.query(models.Order.mgoods).filter(models.Order.shop_id == self.current_shop.id,models.Order.status >= 5,\
							        or_(and_(models.Order.create_date >= start_date_str,models.Order.create_date < end_date_next_str,models.Order.today == 1),\
							        	and_(models.Order.create_date >= start_date_pre_str,models.Order.create_date < end_date_str,models.Order.today == 2))).all()
				fruit_list = []
				mgoods_list = []

				for item in fruit_list_query:
					if item[0] != '{}' and item[0] != None:
						fruit_list.append(item[0])

				for item in mgoods_list_query:
					if item[0] != '{}' and item[0] != None:
						mgoods_list.append(item[0])
				order_goods_list = fruit_list + mgoods_list

				#每单种水果每天的销售额
				total = 0.0
				for goods_item in order_goods_list:
					goods_item = eval(goods_item)
					for key in goods_item:
						if key not in shop_charge_type_list:
							continue
						tmp = {}
						fl_value = goods_item[key]
						fruit_id = shop_charge_type_goods_dict[str(key)][0]
						fruit_name = shop_charge_type_goods_dict[str(key)][1]
						if fruit_name == goods_name:
							num = float(fl_value["num"])
							single_price = float(fl_value["charge"].split('元')[0])
							total_price = single_price * num
							total += total_price
				month_price_list.append(total)
				start_date = start_date + datetime.timedelta(days = 1)

			return self.send_success(output_data = month_price_list)
		else:
			return self.send_error(404)
##

# 订单统计
class OrderStatic(AdminBaseHandler):
	def get(self):
		self.if_current_shops()
		return self.render("admin/order-count.html",context=dict(subpage='orderstatic'))

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action:str")
	def post(self):
		action = self.args["action"]
		if action == "sum":
			return self.sum()
		elif action == "order_time":
			return self.order_time()
		elif action == "recive_time":
			return self.recive_time()
		elif action == "order_table":
			return self.order_table()

	@AdminBaseHandler.check_arguments("page:int", "type:int")
	def sum(self):
		page = self.args["page"]
		type = self.args["type"]
		# print("[AdminOrderStatic]type:",type)
		if page == 0:
			now = datetime.datetime.now()
			start_date = datetime.datetime(now.year, now.month, 1)
			end_date = now
		else:
			date = self.monthdelta(datetime.datetime.now(), page)
			start_date = datetime.datetime(date.year, date.month, 1)
			end_date = datetime.datetime(date.year, date.month, date.day)

		orders = self.session.query(
			models.Order.id,
			models.Order.create_date,
			models.Order.totalPrice,
			models.Order.type,
			models.Order.pay_type).filter(models.Order.shop_id == self.current_shop.id,
				   models.Order.create_date >= start_date,
				   models.Order.create_date <= end_date,
				   not_(models.Order.status.in_([-1,0]))).all()

		data = {}
		for x in range(1, end_date.day+1):  # 初始化数据
			data[x] = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
		if type == 1:
			for order in orders:
				data[order[1].day][1] += 1  #订单总数
				if order[3] == 2:    # 按时达订单数
					data[order[1].day][2] += 1
				else:                #立即送订单数
					data[order[1].day][3] += 1
				if order[4] == 1:    # 货到付款订单数
					data[order[1].day][4] += 1
				else:                #余额订单数(其实还包含货到付款)
					data[order[1].day][5] += 1
		elif type == 2:
			for order in orders:
				data[order[1].day][1] += order[2] #订单总价
				if order[3] == 2:                #按时达订单总价
					data[order[1].day][2] += order[2]
				else:                            #立即送订单总价
					data[order[1].day][3] += order[2]
				if order[4] == 1:                #货到付款订单总价
					data[order[1].day][4] += order[2]
				else:                            # #余额订单总价(其实还包含货到付款)
					data[order[1].day][5] += order[2]
		else:
			return self.send_error(404)
		# print("[AdminOrderStatic]data:",data)
		return self.send_success(data=data)

	@AdminBaseHandler.check_arguments("type:int")
	def order_time(self):
		type = self.args["type"]
		q = self.session.query(func.hour(models.Order.create_date), func.count()).\
				filter(models.Order.shop_id==self.current_shop.id,not_(models.Order.status.in_([-1,0])))
		if type == 1:  # 累计数据
			pass
		elif type == 2:  # 昨天数据
			now = datetime.datetime.now() - datetime.timedelta(1)
			start_date = datetime.datetime(now.year, now.month, now.day, 0)
			end_date = datetime.datetime(now.year, now.month, now.day, 23,59,59)
			q = q.filter(models.Order.create_date >= start_date,
						 models.Order.create_date <= end_date)
		else:
			return self.send_error(404)
		ss = q.group_by(func.hour(models.Order.create_date)).all()
		data = {}
		for key in range(0, 24):
			data[key] = 0
		for s in ss:
			data[s[0]] = s[1]
		return self.send_success(data=data)

	@AdminBaseHandler.check_arguments("type:int")
	def recive_time(self):
		type = self.args["type"]
		q = self.session.query(models.Order.type, models.Order.start_time, models.Order.end_time).\
			filter(models.Order.shop_id==self.current_shop.id,not_(models.Order.status.in_([-1,0])))
		if type == 1:
			orders = q.all()
		elif type == 2:
			now = datetime.datetime.now() - datetime.timedelta(1)
			start_date = datetime.datetime(now.year, now.month, now.day, 0)
			end_date = datetime.datetime(now.year, now.month, now.day, 23,59,59)
			orders = q.filter(models.Order.create_date >= start_date,
							  models.Order.create_date <= end_date).all()
		else:
			return self.send_error(404)
		stop_range = self.current_shop.config.stop_range
		data = {}
		for key in range(0, 24):
			data[key] = 0
		for order in orders:
			if order[0] == 1:  # 立即送收货时间估计
				data[order[1].hour + (order[1].minute+stop_range)//60] += 1
			else:  # 按时达收货时间估计
				data[(order[1].hour+order[2].hour)//2] += 1
		return self.send_success(data=data)

	@AdminBaseHandler.check_arguments("page:int")
	def order_table(self):
		page = self.args["page"]
		page_size = 15
		start_date = datetime.datetime.now() - datetime.timedelta((page+1)*page_size)
		start_date = datetime.datetime(start_date.year,start_date.month,start_date.day,23,59,59)
		end_date = datetime.datetime.now() - datetime.timedelta(page*page_size)
		# print("[AdminOrderStatic]order_table: start_date:",start_date,", end_date:",end_date,end_date-start_date)

		# 以15天为一次查询，查询:日期，日订单数，日总订单金额
		s = self.session.query(models.Order.create_date, func.count(), func.sum(models.Order.totalPrice)).\
			filter_by(shop_id=self.current_shop.id).\
			filter(models.Order.create_date > start_date,
				   models.Order.create_date < end_date,not_(models.Order.status.in_([-1,0]))).\
			group_by(func.year(models.Order.create_date),
					 func.month(models.Order.create_date),
					 func.day(models.Order.create_date)).\
			order_by(desc(models.Order.create_date)).all()
		# print("[AdminOrderStatic]start_date: s:",s)

		# 总订单数
		# 截止到end_date的:总订单总价,总订单数
		total = self.session.query(func.sum(models.Order.totalPrice), func.count()).\
			filter(models.Order.shop_id==self.current_shop.id,not_(models.Order.status.in_([-1,0]))).\
			filter(models.Order.create_date <= end_date).all()
		total = list(total[0])

		# 日老用户订单数
		ids = self.old_follower_ids(self.current_shop.id)
		s_old = self.session.query(models.Order.create_date, func.count()).\
			filter(models.Order.create_date >= start_date,
				   models.Order.create_date <= end_date,
				   models.Order.customer_id.in_(ids),not_(models.Order.status.in_([-1,0]))).\
			group_by(func.year(models.Order.create_date),
					 func.month(models.Order.create_date),
					 func.day(models.Order.create_date)).\
			order_by(desc(models.Order.create_date)).all()

		# 总老用户订单数
		old_total = self.session.query(models.Order).\
			filter_by(shop_id=self.current_shop.id).\
			filter(models.Order.create_date <= end_date,
				   models.Order.customer_id.in_(ids),not_(models.Order.status.in_([-1,0]))).count()

		data = []
		i = 0
		j = 0
		# data的封装格式为：[日期，日订单数，累计订单数，日订单总金额，累计订单总金额，日老用户订单数，累计老用户订单数]
		for x in range(0, 15):
			date = (datetime.datetime.now() - datetime.timedelta(x+page*page_size))
			# print("[AdminOrderStatic]date:",date.strftime('%Y-%m-%d'))
			# print(s[0])
			# if i < len(s) and (datetime.datetime.now()-s[i][0]).days == x+(page*page_size):
			# if i < len(s):
			#	print('haha',s[i][0].strftime('%Y-%m-%d'),date.strftime('%Y-%m-%d'),s[i][0].strftime('%Y-%m-%d')==date.strftime('%Y-%m-%d'))
			if i < len(s) and (s[i][0].strftime('%Y-%m-%d') == date.strftime('%Y-%m-%d')):
				if j < len(s_old) and (datetime.datetime.now()-s_old[j][0]).days == x+(page*page_size):
					data.append((date.strftime('%Y-%m-%d'), s[i][1], total[1], format(float(s[i][2]),'.2f'), format(float(total[0]),'.2f'), s_old[j][1], old_total))
					# print("[AdminOrderStatic]",s[i][1],date.strftime('%Y-%m-%d'),s[i][0].strftime('%Y-%m-%d'),s[i][2])
					total[1] -= s[i][1]
					total[0] -= s[i][2]
					old_total -= s_old[j][1]
					i += 1
					j += 1
				else:
					# print("[AdminOrderStatic]",s[i][1],date.strftime('%Y-%m-%d'),s[i][0].strftime('%Y-%m-%d'),s[i][2])
					data.append((date.strftime('%Y-%m-%d'), s[i][1], total[1], format(float(s[i][2]),'.2f'), format(float(total[0]),'.2f'), 0, old_total))
					total[1] -= s[i][1]
					total[0] -= s[i][2]
					i += 1
			else:
				# print("[AdminOrderStatic]date:",date.strftime('%Y-%m-%d'))
				if total[0]:
					data.append((date.strftime('%Y-%m-%d'), 0, total[1], 0, format(float(total[0]),'.2f'), 0, old_total))
				else:
					data.append((date.strftime('%Y-%m-%d'), 0, total[1], 0, total[0], 0, old_total))
			if total[1] <= 0:
				break
		first_order = self.session.query(models.Order).\
			filter(models.Order.shop_id==self.current_shop.id,not_(models.Order.status.in_([-1,0]))).\
			order_by(models.Order.create_date).first()
		if first_order:  # 新开的店铺一个order都没有，所以要判断一下
			page_sum = (datetime.datetime.now() - first_order.create_date).days//15 + 1
		else:
			page_sum = 0
		# print("[AdminOrderStatic]data:",data)
		return self.send_success(page_sum=page_sum, data=data)

	# 老用户的id
	def old_follower_ids(self, shop_id):
		q = self.session.query(models.Order.customer_id).\
			filter(models.Order.shop_id==shop_id,not_(models.Order.status.in_([-1,0]))).\
			group_by(models.Order.customer_id).\
			having(func.count(models.Order.customer_id) > 1).all()
		ids = [x[0] for x in q]
		return ids

# 用户统计
class FollowerStatic(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		self.if_current_shops()
		return self.render("admin/user-count.html",context=dict(subpage='userstatic'))

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action:str", "page?:int")
	def post(self):
		action = self.args["action"]

		if action == "curve":
			page = self.args["page"]
			if page == 0:
				now = datetime.datetime.now()
				start_date = datetime.datetime(now.year, now.month, 1)
				end_date = now
			else:
				date = self.monthdelta(datetime.datetime.now(), page)
				start_date = datetime.datetime(date.year, date.month, 1)
				end_date = datetime.datetime(date.year, date.month, date.day)
			followers = self.session.query(models.CustomerShopFollow).\
				filter(models.CustomerShopFollow.shop_id == self.current_shop.id,
					   models.CustomerShopFollow.create_time >= start_date,
					   models.CustomerShopFollow.create_time <= end_date).all()
			data = {}
			for x in range(1, end_date.day+1):  # 初始化数据
				data[x] = 0
			for follower in followers:
				data[follower.create_time.day] += 1
			return self.send_success(data=data)

		elif action == "table":
			page = self.args["page"]
			page_size = 15

			start_date = datetime.datetime.now() - datetime.timedelta((page+1)*page_size)
			end_date = datetime.datetime.now() - datetime.timedelta(page*page_size)

			s = self.session.query(models.CustomerShopFollow.create_time, func.count()).\
				filter_by(shop_id=self.current_shop.id).\
				filter(models.CustomerShopFollow.create_time >= start_date,
					   models.CustomerShopFollow.create_time <= end_date).\
				group_by(func.year(models.CustomerShopFollow.create_time),
						 func.month(models.CustomerShopFollow.create_time),
						 func.day(models.CustomerShopFollow.create_time)).\
				order_by(desc(models.CustomerShopFollow.create_time)).all()

			total = self.session.query(models.CustomerShopFollow).\
				filter_by(shop_id=self.current_shop.id).\
				filter(models.CustomerShopFollow.create_time <= end_date).count()
			data = []
			i = 0
			for x in range(0, 15):
				date = (datetime.datetime.now() - datetime.timedelta(x+page*page_size))
				# print("[FollowerStatic]date:",date)
				if i < len(s) and (datetime.datetime.now()-s[i][0]).days == x+(page*page_size):
					data.append((date.strftime('%Y-%m-%d'), s[i][1], total))
					total -= s[i][1]
					i += 1
				else:
					data.append((date.strftime('%Y-%m-%d'), 0, total))
				if total <= 0:
					break
			first_follower = self.session.query(models.CustomerShopFollow).\
				filter_by(shop_id=self.current_shop.id).\
				order_by(models.CustomerShopFollow.create_time).first()
			if first_follower:
				page_sum = (datetime.datetime.now() - first_follower.create_time).days//15 + 1
			else:
				page_sum = 0
			return self.send_success(page_sum=page_sum, data=data)

		elif action == "sex":
			male_sum = self.session.query(models.Accountinfo).\
				join(models.CustomerShopFollow,
					 models.Accountinfo.id == models.CustomerShopFollow.customer_id).\
				filter(models.CustomerShopFollow.shop_id == self.current_shop.id,
					   models.Accountinfo.sex == 1).count()
			female_sum = self.session.query(models.Accountinfo).\
				join(models.CustomerShopFollow,
					 models.Accountinfo.id == models.CustomerShopFollow.customer_id).\
				filter(models.CustomerShopFollow.shop_id == self.current_shop.id, models.Accountinfo.sex == 2).count()
			total = self.session.query(models.Accountinfo).\
				join(models.CustomerShopFollow,
					 models.Accountinfo.id == models.CustomerShopFollow.customer_id).\
				filter(models.CustomerShopFollow.shop_id == self.current_shop.id).count()
			return self.send_success(male_sum=male_sum, female_sum=female_sum, total=total)

# 消息与评价
class Comment(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action:str", "page:int")
	def get(self):
		self.if_current_shops()
		action = self.args["action"]
		page = self.args["page"]
		page_size = 10
		pages=0
		# print("[AdminComment]current_shop:",self.current_shop)
		if action == "all":
			comments = self.get_comments(self.current_shop.id, page, page_size, False)
			# print("[AdminComment]comments:",comments,len(comments))
			all_comments = self.session.query(models.Order).filter(models.Order.shop_id == self.current_shop.id,\
				models.Order.status == 6).count()
			self.current_shop.old_msg = all_comments
			self.session.commit()
			pages = all_comments/10
			# print("[AdminComment]pages:",pages)
		elif action == "favor":
			s = self.session.query(models.ShopFavorComment.order_id).\
				filter(models.ShopFavorComment.shop_id == self.current_shop.id).all()
			order_ids = [x[0] for x in s]
			comments = self.session.query(models.Accountinfo.headimgurl, models.Accountinfo.nickname,
										  models.Order.comment, models.Order.comment_create_date, models.Order.num,
										  models.Order.comment_reply).\
				filter(models.Order.id.in_(order_ids), models.Order.status == 6,
					   models.Order.customer_id == models.Accountinfo.id).\
				order_by(desc(models.Order.comment_create_date)).offset(page*page_size).limit(page_size).all()
			all_comments = self.session.query(models.Accountinfo.headimgurl, models.Accountinfo.nickname,
											  models.Order.comment, models.Order.comment_create_date, models.Order.num,
											  models.Order.comment_reply).\
				filter(models.Order.id.in_(order_ids), models.Order.status == 6,models.Order.customer_id == models.Accountinfo.id).count()
			pages = all_comments/10
			# print("[AdminComment]comments:",comments)
		else:
			return self.send_error(404)

		return self.render("admin/comment.html", action = action, comments=comments, pages=pages,context=dict(subpage='comment'))

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action", "reply?:str", "order_id:int","data?")
	def post(self):
		action = self.args["action"]
		reply = self.args["reply"]
		order_id = self.args["order_id"]
		data = self.args["data"]
		if action == "reply":
			# print('[AdminComment]login replay')
			try:
				order = self.session.query(models.Order).filter_by(id=order_id).one()
			except:
				return self.send_error(404)
			if order.shop_id != self.current_shop.id:
				return self.send_error(403)
			order.comment_reply = reply
			self.session.commit()
		elif action == "favor":
			try:
				self.session.add(models.ShopFavorComment(shop_id=self.current_shop.id, order_id=order_id))
				self.session.commit()
			except:
				return self.send_fail("已收藏成功")
		# shop_admin apply to delete comment
		elif action == "apply_delete_comment":
			delete_reason = data["delete_reason"]
			shop_id = self.current_shop.id
			apply_delete = models.CommentApply(order_id = order_id,delete_reason = delete_reason,has_done\
				=0,shop_id = shop_id)
			self.session.add(apply_delete)
			self.session.commit()
			return self.send_success(status = 0 , msg = 'success',data = {})
		else:
			return self.send_error(404)

		return self.send_success()

# 订单管理
class Order(AdminBaseHandler):
	# todo: 当订单越来越多时，current_shop.orders 会不会越来越占内存？
	@tornado.web.authenticated
	#@get_unblock
	@AdminBaseHandler.check_arguments("order_type:int", "order_status?:int","page?:int","action?","pay_type?:int","user_type?:int","filter?:str","self_id?:int")
	#order_type(1:立即送 2：按时达);order_status(1:未处理，2：未完成，3：已送达，4：售后，5：所有订单)
	def get(self):
		self.if_current_shops()
		order_type = self.args["order_type"]
		
		if self.args['action'] == "realtime":  #订单管理页实时获取未处理订单的接口
			atonce,ontime,new_order_sum = 0,0,0
			count = self._count()
			atonce = count[11]
			ontime = count[21]
			selfPoint = count[31]
			new_order_sum = self.session.query(models.Order).filter(models.Order.shop_id==self.current_shop.id,\
				not_(models.Order.status.in_([-1,0]))).count() -(self.current_shop.new_order_sum or 0)
			return self.send_success(atonce=atonce,ontime=ontime,new_order_sum=new_order_sum,selfPoint=selfPoint)
		elif self.args['action'] == "allreal": #全局实时更新变量
			atonce,msg_num,is_balance,new_order_sum,user_num,staff_sum = 0,0,0,0,0,0
			count = self._count()
			atonce = count[11]
			msg_num = self.session.query(models.Order).filter(models.Order.shop_id == self.current_shop.id,\
				models.Order.status == 6).count() - self.current_shop.old_msg
			is_balance = self.current_shop.is_balance
			staff_sum = self.session.query(models.HireForm).filter_by(shop_id = self.current_shop.id).count()
			new_order_sum = self.session.query(models.Order).filter(models.Order.shop_id==self.current_shop.id,\
				not_(models.Order.status.in_([-1,0]))).count() - (self.current_shop.new_order_sum or 0)
			user_sum = self.session.query(models.CustomerShopFollow).filter_by(shop_id=self.current_shop.id).count() - \
			(self.current_shop.new_follower_sum or 0)
			#new_follower_sum
			return self.send_success(atonce=atonce,msg_num=msg_num,is_balance=is_balance,new_order_sum=new_order_sum,user_num=user_num,staff_sum=staff_sum)

		if "page" in self.args:
			order_status = self.args["order_status"]
			page = self.args["page"]
			page_size = 10
			count = 0
			page_sum = 0
			orders = []
			if self.current_shop.orders:
				order_list = self.session.query(models.Order).filter_by(shop_id=self.current_shop.id)
			else:
				order_list = None

			if "user_type" in self.args:#filter user_type
				user_type = int(self.args["user_type"])
				if user_type != 9:#not all
					order_list = self.session.query(models.Order).\
					join(models.CustomerShopFollow,models.Order.customer_id==models.CustomerShopFollow.customer_id).\
					filter(models.Order.shop_id==self.current_shop.id,models.CustomerShopFollow.shop_new==user_type,\
						models.CustomerShopFollow.shop_id==self.current_shop.id).distinct()

			if "pay_type" in self.args:#filter pay_type
				pay_type = int(self.args["pay_type"])
				if pay_type != 9:#not all
					order_list = order_list.filter(models.Order.pay_type==pay_type)
			if "self_id" in self.args and self.args["self_id"] != "" and int(self.args["self_id"]) !=-1:
				order_list = order_list.filter(models.Order.self_address_id==int(self.args["self_id"]))

			if order_status == 1:#filter order_status
				order_sum = self.session.query(models.Order).filter(models.Order.shop_id==self.current_shop.id,\
					not_(models.Order.status.in_([-1,0]))).count()
				new_order_sum = order_sum - (self.current_shop.new_order_sum or 0)
				self.current_shop.new_order_sum = order_sum
				self.session.commit()
				if order_list:
					orders = [x for x in order_list if x.type == order_type and x.status == 1]

			elif order_status == 2:#unfinish
				if order_list:
					orders = [x for x in order_list if x.type == order_type and x.status in [2, 3, 4]]

			elif order_status == 3:
				if order_list:
					orders = [x for x in order_list if x.type == order_type and x.status in (5, 6, 7)]

			elif order_status == 4:
				pass
			elif order_status == 5:#all
				if order_list:
					orders = [x for x in order_list if x.type == order_type]
			else:
				return self.send.send_error(404)
			if self.args["filter"] !=[]:
				filter_status = self.args["filter"]
				if filter_status  == "send_positive":
					orders.sort(key = lambda order:order.send_time,reverse = False)
				elif filter_status  == "send_desc":
					orders.sort(key = lambda order:order.send_time,reverse = True)
				elif filter_status  == "order_positive":
					orders.sort(key = lambda order:order.create_date,reverse = False)
				elif filter_status  == "order_desc":
					orders.sort(key = lambda order:order.create_date,reverse = True)
				elif filter_status  == "price_positive":
					orders.sort(key = lambda order:order.totalPrice,reverse = False)
				elif filter_status  == "price_desc":
					orders.sort(key = lambda order:order.totalPrice,reverse = True)

			count = len(orders)
			page_sum = int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1
			session = self.session
			page_area = page * page_size
			orders = orders[page_area:page_area+10]
			data = self.getOrder(orders)
			delta = datetime.timedelta(1)
			nomore = False
			if page+1 == page_sum:
				nomore = True
			# print("[AdminOrder]current_shop:",self.current_shop)

			return self.send_success(data = data,page_sum=page_sum,count=self._count(),nomore=nomore)
		if self.is_pc_browser()==False:
			return self.redirect(self.reverse_url("MadminOrder"))

		shop_city,shop_province,shop_lat,shop_lon="","",0,0
		try:
			shop_city = self.code_to_text("city", self.current_shop.shop_city)
			shop_province = self.code_to_text("province", self.current_shop.shop_province)
			shop_lat = self.current_shop.lon
			shop_lon = self.current_shop.lat
		except:
			shop_city,shop_province,shop_lat,shop_lon="","",0,0

		self_address_list=[]
		try:
			self_address=self.session.query(models.SelfAddress).filter_by(config_id=self.current_shop.config.id).\
			filter(models.SelfAddress.active!=0).order_by(models.SelfAddress.if_default.desc()).all()
		except:
			self_address=None
		if self_address:
			try:
				self_address_list=[x for x in self_address]
			except:
				self_address_list=None

		return self.render("admin/orders.html",order_type=order_type,shop_city=shop_city,shop_province=shop_province,\
			shop_lat=shop_lat,shop_lon=shop_lon,self_address_list=self_address_list,context=dict(subpage='order'))

	# 编辑订单状态（order_status == 4:订单配送, order_status == 5:订单送达）
	def edit_status(self,order,order_status,send_message=True):
		# if order_status == 4:
		# when the order complete
		# woody
		shop_id = self.current_shop.id
		#shop_point add by order.totalPrice
		staff_info = []

		if order_status == 4:
			# print('[AdminOrder]edit_status: login in order_status 4')
			order.update(self.session, status=order_status,send_admin_id = self.current_user.accountinfo.id)
			# 发送订单模版消息给送货员
			if send_message:
				self.send_staff_message(self.session,order)

		if order_status == 5:
			# print('[AdminOrder]edit_status: login in order_status 5')
			order.update(self.session, status=order_status,finish_admin_id = self.current_user.accountinfo.id)
			# 更新fruit 的 current_saled
			if order.shop.admin.mp_name and order.shop.admin.mp_appid and order.shop.admin.mp_appsecret:
				# print("[CustomerCart]cart_callback: shop.admin.mp_appsecret:",shop.admin.mp_appsecret,shop.admin.mp_appid)
				access_token = self.get_other_accessToken(self.session,order.shop.admin.id)
				print(order.shop.admin.mp_name,order.shop.admin.mp_appid,order.shop.admin.mp_appsecret,access_token)
			else:
				access_token = None
			self.order_done(self.session,order,access_token)

	# 订单计数
	def _count(self):
		count = {10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0,
				 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0,
				 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0,

				 }
		try:
			orders = self.session.query(models.Order).filter_by(shop_id=self.current_shop.id).all()
		except:
			orders = None
		if orders:
			for order in orders:
				count[order.type*10+5] += 1
				if order.status == 0:
					count[order.type*10] += 1
				elif order.status == 1:
					count[order.type*10+1] += 1
				elif order.status in (2, 3, 4):
					count[order.type*10+2] += 1
				elif order.status in (5, 6, 7):
					count[order.type*10+3] += 1
				elif order.status == 10:
					count[order.type*10+4] += 1
		return count

	@tornado.web.authenticated
	# @unblock
	@AdminBaseHandler.check_arguments("action", "data")
	def post(self):
		action = self.args["action"]
		data = self.args["data"]
		# print("[AdminOrder]current_shop:",self.current_shop)
		
		# 添加按时达时间段 / 添加自提时间段
		if action in ("add_period","add_self_period"):
			start_time = datetime.time(data["start_hour"],data["start_minute"])
			end_time = datetime.time(data["end_hour"],data["end_minute"])
			if action == "add_period":
				config_type = 0
			elif action == "add_self_period":
				config_type = 1
			
			periods = self.session.query(models.Period).filter_by(config_id=self.current_shop.id)
			periods_count = 0
			if periods.count()>0:
					periods_count = periods.filter_by(config_type=config_type).count()
			if periods_count>=10:
				return self.send_fail("至多只能添加10个时间段")

			period = models.Period(config_id=self.current_shop.id,
								   name=data["name"],
								   start_time=start_time,
								   end_time=end_time,
								   config_type=config_type)
			# print("[AdminOrder]Add period time, Shop ID:",period.config_id,", Period:",start_time,"-",end_time)
			self.session.add(period)
			self.session.commit()
			return self.send_success(period_id=period.id)

		# 编辑按时达时间段 / 编辑自提时间段
		elif action in ("edit_period", "edit_period_active"):
			period = next((x for x in self.current_shop.config.periods if x.id == data["period_id"]), None)
			if not period:
				return self.send_fail("没找到该时间段", 403)
			if action == "edit_period":
				start_time = datetime.time(data["start_hour"], data["start_minute"])
				end_time = datetime.time(data["end_hour"], data["end_minute"])
				if start_time >= end_time:
					return self.send_fail("时间段开始时间必须比结束时间小")
				period.name = data["name"]
				period.start_time = start_time
				period.end_time = end_time
				# print("[AdminOrder]Edit period time, Shop ID:",period.config_id,", Period:",start_time,"-",end_time)
			elif action == "edit_period_active":
				period.active = 1 if period.active == 2 else 2
				# print("[AdminOrder]On/Off period time, Shop ID:",period.config_id,", On/Off:",period.active)
			self.session.commit()
		# 删除按时达/自提时间段
		elif action == "del_period":
			try: q = self.session.query(models.Period).filter_by(id=int(data["period_id"]))
			except:return self.send_error(404)
			q.delete()
			self.session.commit()
		# 编辑按时达时间（全部/今天/明天）
		elif action == "edit_send_day":
			self.current_shop.config.day_on_time = int(data["day"])
			self.session.commit()
		elif action == "edit_ontime_on":
			self.current_shop.config.ontime_on = not self.current_shop.config.ontime_on
			self.session.commit()
		# 编辑按时达起送金额
		elif action == "edit_min_charge_on_time":
			self.current_shop.config.min_charge_on_time = data["min_charge_on_time"]
			self.session.commit()
		# 编辑下单截止时间（分钟）
		elif action == "edit_stop_range":
			self.current_shop.config.stop_range = data["stop_range"] or 0
			self.session.commit()
		elif action == "edit_freight_on_time":
			self.current_shop.config.freight_on_time = data["freight_on_time"] or 0
			self.session.commit()
		elif action == "edit_now_on":
			self.current_shop.config.now_on = not self.current_shop.config.now_on
			self.session.commit()
		elif action == "edit_now_config":
			start_time = datetime.time(data["start_hour"], data["start_minute"])
			end_time = datetime.time(data["end_hour"], data["end_minute"])
			self.current_shop.config.update(session=self.session,min_charge_now=data["min_charge_now"],
											start_time_now=start_time, end_time_now=end_time,
											freight_now=data["freight_now"] or 0,intime_period=data["intime_period"] or 30)
		# 开启/关闭自提
		elif action == "edit_self_on":
			self.current_shop.config.self_on = not self.current_shop.config.self_on
			self.session.commit()
		# 编辑自提时间（全部/今天/明天）
		elif action == "edit_day_self": #7.30
			if "day" not in data:
				return self.send_error(403)
			self.current_shop.config.day_self = int(data["day"])
			self.session.commit()
		# 编辑自提截止时间（分钟）
		elif action == "edit_end_self": #7.30
			if "end_self" not in data:
				return self.send_error(403)
			self.current_shop.config.self_end_time = int(data["end_self"])
			self.session.commit()
		# 添加自提点地址
		elif action == "add_self_address": #7.30
			try:
				self_address_count = self.session.query(models.SelfAddress).filter_by(config_id=self.current_shop.config.id)\
				.filter(models.SelfAddress.active!=0).count()
			except:
				self_address_count = 0
			if self.current_shop.shop_auth == 0 and self_address_count >= 1:
				return self.send_fail("未认证店铺只能添加一个自提点")
			if self_address_count >= 10:
				return self.send_fail("最多只能添加10个自提点")
			if "self_address" not in data:
				return self.send_error(403)
			address = data["self_address"]
			lat = data["lat"] or 0
			lon = data["lon"] or 0
			self_address = models.SelfAddress(
							config_id = self.current_shop.config.id,
							address = address,
							lat = lat,
							lon = lon
							)
			self.session.add(self_address)
			self.session.commit()
			return self.send_success(address_id=self_address.id)
		# 编辑自提点地址 / 删除自提点 / 设置默认自提点
		elif action in ("edit_self_address","del_self_address","set_self_address","set_self_default"):
			if "address_id" not in data:
				return self.send_fail(403)
			address_id = int(data["address_id"])
			try:
				self_address = self.session.query(models.SelfAddress).filter_by(id=address_id,config_id=self.current_shop.config.id).first()
			except:
				return self.send_fail(404)
			if action == "edit_self_address":
				if self_address.if_default == 2:
					return self.send_fail(403)
				self_address.address = data["address"] or ''
				self_address.lat = data["lat"] or ''
				self_address.lon = data["lon"] or ''
			elif action == "del_self_address":
				if self_address.if_default == 2:
					return self.send_fail(403)
				self_address.active = 0
				self_address.if_default = 0
			elif action == "set_self_address":
				self_address.active = 2 if self_address.active == 1 else 1
			elif action == "set_self_default":
				self_address.if_default = 1
				try:
					 address_lsit = self.session.query(models.SelfAddress).filter_by(config_id=self.current_shop.config.id).all()
				except:
					 address_lsit = None
				if address_lsit:
					for address in address_lsit:
						if address.id != address_id:
							address.if_default = 0
			self.session.commit()

		# 编辑订单备注 / 编辑（修改）配送员 / 编辑订单状态（开始配送/完成订单） / 编辑订单总价 / 删除订单 / 打印订单
		elif action in ("edit_remark", "edit_SH2", "edit_status", "edit_totalPrice", 'del_order', 'print'):
			try:
				order =  self.session.query(models.Order).filter_by(id=int(data["order_id"])).first()
			except:
				order = None
			try:
				shop = self.session.query(models.Shop).filter_by(id=order.shop_id).first()
			except:
				return self.send_error(404)
			try:
				HireLink = self.session.query(models.HireLink).filter_by(shop_id=order.shop_id,staff_id=self.current_user.id,work=9,active=1).first()
			except:
				pass

			if not shop.admin_id == self.current_user.id and not HireLink:
				return self.send_fail("您没有查看该订单的权限")

			if not order:
				return self.send_fail("没找到该订单")
			if action == "edit_remark":
				order.update(session=self.session, remark=data["remark"])
			elif action == "edit_SH2":
				if order.status == -1:
					return self.send_fail("订单未支付，不能操作该订单")
				elif order.status == 0:
					return self.send_fail("订单已被取消或删除，不能操作该订单")
				elif order.status > 4:
					return self.send_fail("订单已经完成，不能操作该订单")
				SH2 = next((x for x in shop.staffs if x.id == int(data["staff_id"])), None)
				if not SH2:
					return self.send_fail("没找到该送货员")
				order.update(session=self.session, status=4, SH2_id=int(data["staff_id"]))
				
				# 发送订单模版消息给送货员
				self.send_staff_message(self.session,order)

			elif action == "edit_status":
				if order.status == -1:
					return self.send_fail("订单未支付，不能修改状态")
				elif order.status == 0:
					return self.send_fail("订单已被取消或删除，不能修改状态")
				elif order.status > 4:
					return self.send_fail("订单已经完成，不能修改状态")
				self.edit_status(order,data['status'])
			elif action == "edit_totalPrice":
				if order.pay_type != 1:
					return self.send_fail("订单非货到付款订单，不能修改价格")
				elif order.status == 0:
					return self.send_fail("订单已被取消或删除，不能修改价格")
				elif order.status > 4:
					return self.send_fail("订单已经完成，不能修改价格")
				order.update(session=self.session, totalPrice=data["totalPrice"])
			elif action == "del_order":
				if order.status == 0:
					return self.send_fail("订单已被取消或删除")
				elif order.status > 4:
					return self.send_fail("订单已经完成，不能删除")
				if order.pay_type == 3 and order.status != -1:
					return self.send_fail("在线支付『已付款』的订单暂时不能删除")
				session = self.session
				del_reason = data["del_reason"]
				order.update(session=session, status=0,del_reason = del_reason)
				order.get_num(session,order.id)
				customer_id = order.customer_id
				shop_id = order.shop_id
				if order.pay_type == 2:
					#该订单之前 对应的记录作废
					balance_record = ("%{0}%").format(order.num)
					old_balance_history = self.session.query(models.BalanceHistory).filter(models.BalanceHistory.balance_record.like(balance_record)).first()
					if old_balance_history is None:
						print('[AdminOrder]Delete order: old history not found')
					else:
						old_balance_history.is_cancel = 1
						self.session.flush()

					#恢复用户账户余额，同时产生一条记录
					shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = order.customer_id,\
						shop_id = order.shop_id).first()
					if not shop_follow:
						return self.send_fail('shop_follow not found')
					shop_follow.shop_balance += order.totalPrice

					balance_history = models.BalanceHistory(customer_id = order.customer_id , shop_id = order.shop_id ,\
						balance_value = order.totalPrice,balance_record = '余额退款：订单'+ order.num+'删除', name = self.current_user.accountinfo.nickname,\
						balance_type = 4,shop_totalPrice = self.current_shop.shop_balance,customer_totalPrice = \
						shop_follow.shop_balance,shop_province = self.current_shop.shop_province,shop_name=self.current_shop.shop_name)
					self.session.add(balance_history)
				self.session.commit()

			elif action == "print":
				order.update(session=self.session, isprint=1)

		# 批量编辑订单状态（批量配送/批量完成）
		elif action == "batch_edit_status":
			order_list_id = data["order_list_id"]
			notice = ''
			count=0
			for key in order_list_id:
				order = next((x for x in self.current_shop.orders if x.id==int(key)), None)
				if not order:
					notice = "没找到订单",order.onum
					return self.send_fail(notice)
				elif order.status == 4 and data['status'] == 4:
					notice = "订单"+str(order.num)+"已在配送中，请不要重复操作"
					return self.send_fail(notice)
				elif order.status > 4:
					notice = "订单"+str(order.num)+"已完成，请不要重复操作"
					return self.send_fail(notice)
				self.edit_status(order,data['status'],False)
				count += 1
			if count > 0:
				shop_id = self.current_shop.id
				admin_id = self.current_shop.admin.id
				staff_info = []
				try:
					staff_info = self.session.query(models.Accountinfo).join(models.HireLink,models.Accountinfo.id == models.HireLink.staff_id)\
					.filter(models.HireLink.shop_id == shop_id,models.HireLink.default_staff == 1).first()
				except:
					print("[AdminOrder]Batch edit order: didn't find default staff")
				if staff_info:
					openid = staff_info.wx_openid
					staff_name = staff_info.nickname
				else:
					openid = self.current_shop.admin.accountinfo.wx_openid
					staff_name = self.current_shop.admin.accountinfo.nickname
				shop_name = self.current_shop.shop_name
				WxOauth2.post_batch_msg(openid,staff_name,shop_name,count,admin_id)
		# 批量打印订单
		elif action == "batch_print":
			order_list_id = data["order_list_id"]
			for key in order_list_id:
				order = next((x for x in self.current_shop.orders if x.id==int(key)), None)
				if not order:
					return self.send_fail("没找到订单",order.onum)
				order.update(session=self.session, isprint=1)
		else:
			return self.send_error(404)
		return self.send_success()


# 商品管理（老）
class Shelf(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action", "id:int")
	def get(self):
		self.if_current_shops()
		action = self.args["action"]

		fruit_type_d = {}
		if self.args["id"] < 1000:
			fruit_types = self.session.query(models.FruitType).filter("id < 1000").all()
		elif 1000<self.args["id"] < 2000:
			fruit_types = self.session.query(models.FruitType).filter("id > 1000").all()
		else:
			fruit_types = self.session.query(models.FruitType).filter_by( id=2000 ).all()
		for fruit_type in fruit_types:
			fruit_type_d[fruit_type.id] = {"code": fruit_type.code, "name": fruit_type.name, "sum": 0}

		if action in ("all", "fruit"):
			fruits=[]
			if action == "all":
				for fruit in self.current_shop.fruits:  # 水果/干果 过滤
					if (self.args["id"] < 1000 and fruit.fruit_type_id > 1000) or\
						(self.args["id"] > 1000 and fruit.fruit_type_id < 1000) or fruit.fruit_type_id == 1000:
						continue

					if fruit.active == 1:
						fruit_type_d[fruit.fruit_type_id]["sum"] += 1
						fruits.append(fruit)
			elif action == "fruit":
				for fruit in self.current_shop.fruits:
					if fruit.fruit_type_id == self.args["id"]:
						fruits.append(fruit)
					if (self.args["id"] < 1000 and fruit.fruit_type_id > 1000) or\
						(self.args["id"] > 1000 and fruit.fruit_type_id < 1000) or fruit.fruit_type_id == 1000:
						continue
					if fruit.active == 1:
						fruit_type_d[fruit.fruit_type_id]["sum"] += 1
			return self.render("admin/goods-fruit.html", fruits=fruits, fruit_type_d=fruit_type_d,
							   menus=self.current_shop.menus,
							   context=dict(subpage="goods", goodsSubpage="fruit"))
		elif action == "menu":#todo 合法性检查
			_id = int(self.args["id"])
			if _id == 2000:
				mgoodses = self.session.query(models.Fruit).filter_by(fruit_type_id=2000,shop_id=self.current_shop.id).all()

			# try:mgoodses = self.session.query(models.MGoods).filter_by(menu_id=self.args["id"]).all()
			# except:return self.send_error(404)

			return self.render("admin/goods-menu.html", mgoodses=mgoodses, menus=self.current_shop.menus,
							   context=dict(subpage="goods", goodsSubpage="menu"))

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action", "data", "id?:int", "charge_type_id?:int")
	def post(self):
		action = self.args["action"]
		data = self.args["data"]
		if action in ["add_fruit", "add_mgoods"]:
			if not (data["charge_types"] and data["charge_types"]):  # 如果没有计价方式、打开market时会有异常
				return self.send_fail("请至少添加一种计价方式")
			if len(data["intro"]) > 100:
				return self.send_fail("商品简介不能超过100字噢亲，再精简些吧！")
			args={}
			args["name"] = data["name"]
			args["saled"] = data["saled"]
			args["storage"] = data["storage"]
			args["unit"] = data["unit"]
			args["tag"] = data["tag"]
			if data["img_url"]:  # 前端可能上传图片不成功，发来一个空的，所以要判断
				args["img_url"] = SHOP_IMG_HOST + data["img_url"]
			args["intro"] = data["intro"]
			args["priority"] = data["priority"]
			if action == "add_fruit":
				args["fruit_type_id"] = data["fruit_type_id"]
				args["shop_id"] = self.current_shop.id
				fruit = models.Fruit(**args)
				for charge_type in data["charge_types"]:
					fruit.charge_types.append(models.ChargeType(price=charge_type["price"],
																unit=charge_type["unit"],
																num=charge_type["num"],
																unit_num=charge_type["unit_num"]))
				self.session.add(fruit)
			elif action == "add_mgoods":
				args["menu_id"] = data["menu_id"]
				mgoods = models.MGoods(**args)
				for charge_type in data["charge_types"]:
					mgoods.mcharge_types.append(models.MChargeType(price=charge_type["price"],
																unit=charge_type["unit"],
																num=charge_type["num"],
																unit_num=charge_type["unit_num"]))
					self.session.add(mgoods)
			self.session.commit()
			return self.send_success()
		elif action == "add_menu":
			self.session.add(models.Menu(shop_id=self.current_shop.id,name=data["name"]))
			self.session.commit()
		elif action == "edit_menu_name":
			self.session.query(models.Menu).filter_by(id=self.args["id"]).update({models.Menu.name: self.args["data"]})
			self.session.commit()
		elif action == "edit_fruit_img":
			return self.send_qiniu_token("fruit", self.args["id"])
		elif action == "edit_mgoods_img":
			return self.send_qiniu_token("mgoods", self.args["id"])
		elif action == "apply_cookie":
			return self.send_qiniu_token("apply_cookie",self.args["id"])
		elif action in ["add_charge_type", "edit_active", "edit_fruit", "default_fruit_img"]:  # fruit_id
			try:fruit = self.session.query(models.Fruit).filter_by(id=self.args["id"]).one()
			except:return self.send_error(404)
			if fruit.shop != self.current_shop:
				return self.send_error(403)

			if action == "add_charge_type":
				# print("[AdminShelf]Add charge type:",data["num"],data["unit"],data["price"])
				charge_type = models.ChargeType(fruit_id=fruit.id,
												price=data["price"],
												unit=data["unit"],
												num=data["num"],
												unit_num=data["unit_num"])
				self.session.add(charge_type)
				self.session.commit()
				return self.send_success()
			elif action == "edit_active":
				if fruit.active == 1:
					fruit.update(session=self.session, active = 2)
				elif fruit.active == 2:
					fruit.update(session=self.session, active = 1)
			elif action == "edit_fruit":
				if len(data["intro"]) > 100:
					return self.send_fail("商品简介不能超过100字噢亲，再精简些吧！")
				fruit.update(session=self.session,
												name = data["name"],
												saled = data["saled"],
												storage = data["storage"],
												unit=data["unit"],
												tag = data["tag"],
												#img_url = data["img_url"],
												intro=data["intro"],
												priority=data["priority"])

			elif action == "default_fruit_img":  # 恢复默认图
				fruit.img_url = ''
				self.session.commit()

		elif action in ["del_charge_type", "edit_charge_type"]:  # charge_type_id
			charge_type_id = self.args["charge_type_id"]
			try: q = self.session.query(models.ChargeType).filter_by(id=charge_type_id)
			except:return self.send_error(404)
			if action == "del_charge_type":
				q.delete()
			else:
				q.one().update(session=self.session,price=data["price"],
						 unit=data["unit"],
						 num=data["num"],
						 unit_num=data["unit_num"])
			self.session.commit()
		elif action in ["add_mcharge_type", "edit_m_active", "edit_mgoods", "default_mgoods_img"]:  # mgoods_id
			try:mgoods = self.session.query(models.MGoods).filter_by(id=self.args["id"]).one()
			except:return self.send_error(404)
			if mgoods.menu.shop != self.current_shop:
				return self.send_error(403)

			if action == "add_mcharge_type":
				mcharge_type = models.MChargeType(mgoods_id=mgoods.id,
												price=data["price"],
												unit=data["unit"],
												num=data["num"],
												unit_num=data["unit_num"])
				self.session.add(mcharge_type)
				self.session.commit()
				return self.send_success()
			elif action == "edit_m_active":
				if mgoods.active == 1:
					mgoods.update(session=self.session, active = 2)
				elif mgoods.active == 2:
					mgoods.update(session=self.session, active = 1)
			elif action == "edit_mgoods":
				if len(data["intro"]) > 100:
					return self.send_fail("商品简介不能超过100字噢亲，再精简些吧！")
				mgoods.update(session=self.session,
												name = data["name"],
												saled = data["saled"],
												storage = data["storage"],
												unit=data["unit"],
												tag = data["tag"],
												#img_url = data["img_url"],
												intro = data["intro"],
												priority=data["priority"])
			elif action == "default_mgoods_img":  # 恢复默认图
				mgoods.img_url = ''
				self.session.commit()

		elif action in ["del_mcharge_type", "edit_mcharge_type"]:  # mcharge_type_id
			mcharge_type_id = self.args["charge_type_id"]
			try: q = self.session.query(models.MChargeType).filter_by(id=mcharge_type_id)
			except:return self.send_error(404)
			if action == "del_mcharge_type":
				q.delete()
			else:
				q.one().update(session=self.session,price=data["price"],
						 unit=data["unit"],
						 num=data["num"],
						 unit_num=data["unit_num"])
			self.session.commit()
		elif action == "add_img":
			return self.send_qiniu_token("add", 0)

		else:
			return self.send_error(404)

		return self.send_success()

# 商品管理（新）
class Goods(AdminBaseHandler):
	@tornado.web.authenticated
	def initialize(self, action):
		self._action = action

	def token(self,token):
		editorToken = self.get_editor_token("editor", _id)

	@AdminBaseHandler.check_arguments("type?","sub_type?","type_id?:int","page?:int","filter_status?","order_status1?","order_status2?","filter_status2?","content?")
	def get(self):
		self.if_current_shops()
		action = self._action
		_id = str(time.time())
		current_shop = self.current_shop
		shop_id = current_shop.id
		qiniuToken = self.get_qiniu_token('goods',_id)
		shop_code = current_shop.shop_code
		if action == "all":
			try:
				goods = self.session.query(models.Fruit).filter_by(shop_id=shop_id).filter(models.Fruit.active!=0)
			except:
				goods = []
			if self.args["type"] !=[]:
				_type = self.args["type"]
				if _type == "classify":
					data = []
					datalist = []
					page = int(self.args["page"])
					page_size = 10
					offset = page * page_size
					if self.args["sub_type"] != []:
						type_id = int(self.args["sub_type"])
						goods = goods.filter_by(fruit_type_id=type_id).order_by(models.Fruit.add_time.desc())
						count = goods.count()
						count=int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1
						datalist = goods.offset(offset).limit(page_size).all()
						if datalist:
							data = self.getGoodsData(datalist,"all")
						else:
							datalist = []
						return self.send_success(data=data,count=count)

				elif _type =="goods_search":
					name = self.args["content"]
					data = []
					if "page" in self.args:
						page = int(self.args["page"])
					else:
						page = 0
					page_size = 10
					offset = page * page_size
					goods = self.session.query(models.Fruit).filter_by(shop_id=shop_id).filter(models.Fruit.name.like("%%%s%%" % name))
					count = goods.count()
					count=int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1
					datalist = goods.offset(offset).limit(page_size).all()
					if goods:
						data = self.getGoodsData(datalist,"all")
					else:
						data = []
					return self.send_success(data=data,count=count)

			# 商品筛选与排序
			elif self.args["filter_status"] !=[]:
				data = []
				if "page" in self.args:
					page = int(self.args["page"])
				else:
					page = 0
				page_size = 10
				offset = page * page_size
				filter_status = self.args["filter_status"]
				if filter_status == []:
					filter_status = "all"
				order_status1 = self.args["order_status1"]
				order_status2 = self.args["order_status2"]
				filter_status2 = self.args["filter_status2"]

				if filter_status == "all":
					goods = goods.order_by(models.Fruit.active)
				elif filter_status =="on":
					goods = goods.filter_by(active = 1)
				elif filter_status =="off":
					goods = goods.filter_by(active = 2)
				elif filter_status =="sold_out":
					goods = goods.filter_by(storage = 0)
				elif filter_status =="current_sell":
					goods = goods.filter(models.Fruit.current_saled !=0 )

				if filter_status2 != []:
					filter_status2 = int(filter_status2)
					# print("[AdminGoods]filter_status2:",filter_status2)
					if filter_status2 == -2:
						goods = goods
						# print("[AdminGoods]Goods count:",goods.count())
					else:
						goods = goods.filter_by(group_id = filter_status2)

				# add by jyj 2015-8-8
				if order_status1 == "all":
					if order_status2 == "add_time":
						goods = goods.order_by(models.Fruit.add_time.desc())
					elif order_status2 == "name":
						goods = goods.order_by(models.Fruit.name.desc())
					elif order_status2 == "saled":
						goods = goods.order_by(models.Fruit.saled.desc())
					elif order_status2 == "storage":
						goods = goods.order_by(models.Fruit.storage.desc())
					elif order_status2 == "current_saled":
						goods = goods.order_by(models.Fruit.current_saled.desc())
				else:
					if order_status1 =="group":
						case_one = 'models.Fruit.group_id'
					elif order_status1 =="classify":
						case_one = 'models.Fruit.fruit_type_id'

					# changed by jyj 2015-8-7
					if order_status2 == "add_time":
						goods = goods.order_by(eval(case_one),models.Fruit.add_time.desc())
					elif order_status2 == "add_time_desc":
						goods = goods.order_by(eval(case_one),models.Fruit.add_time)
					elif order_status2 == "name":
						goods = goods.order_by(eval(case_one),models.Fruit.name.desc())
					elif order_status2 == "saled":
						goods = goods.order_by(eval(case_one),models.Fruit.saled.desc())
					elif order_status2 == "saled_desc":
						goods = goods.order_by(eval(case_one),models.Fruit.saled)
					elif order_status2 == "storage":
						goods = goods.order_by(eval(case_one),models.Fruit.storage.desc())
					elif order_status2 == "storage_desc":
						goods = goods.order_by(eval(case_one),models.Fruit.storage)
					elif order_status2 == "current_saled":
						goods = goods.order_by(eval(case_one),models.Fruit.current_saled.desc())
					##

				count = goods.count()
				count=int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1

				# added by jyj 2015-8-8 (for sorting by the data-item's name order by pinyin)
				if order_status2 == "name":
					from operator import itemgetter
					data_all_list = goods.all()
					data_all_tmp = self.getGoodsData(data_all_list,"all")
					data_all = []

					for i in range(len(data_all_tmp)):
						name_code = data_all_tmp[i]["name"].encode('gbk')
						data_all_tmp[i]["name_gbk"] = name_code

					if order_status1 =="group":
						data_all_tmp.sort(key = itemgetter('group_id','name_gbk'),reverse = False)
					elif order_status1 == "classify":
						data_all_tmp.sort(key = itemgetter('fruit_type_id','name_gbk'),reverse = False)
					elif order_status1 == "all":
						data_all_tmp.sort(key = itemgetter('name_gbk'),reverse = False)

					for i in range(len(data_all_tmp)):
						data_all_tmp[i]["name_gbk"] = str(data_all_tmp[i]["name_gbk"])

					data = data_all_tmp[offset : offset+page_size]
				else:
					datalist = goods.offset(offset).limit(page_size).all()
					data = self.getGoodsData(datalist,"all")
				##

				return self.send_success(data=data,count=count)

			group_list = []
			groups = self.session.query(models.GoodsGroup).filter_by(shop_id=shop_id,status=1).all()
			default_count = goods.filter_by(group_id=0).count()
			record_count = goods.filter_by(group_id=-1).count()
			group_list.append({"id":0,"name":"默认分组","num":default_count})
			group_list.append({"id":-1,"name":"店铺推荐","num":record_count})
			for g in groups:
				goods_count = goods.filter_by( group_id = g.id ).count()
				group_list.append({"id":g.id,"name":g.name,"num":goods_count})

			c_list = []
			all_count = goods.count()
			on_count = goods.filter_by(active=1).count()
			off_count = goods.filter_by(active=2).count()
			sold_count =goods.filter_by(storage=0).count()
			dealing_count =goods.filter(models.Fruit.current_saled!=0).count()
			c_list.append({"all_count":all_count,"on_count":on_count,"off_count":off_count,"sold_count":sold_count,"dealing_count":dealing_count})

			return self.render("admin/goods-all.html",context=dict(subpage="goods"),token=qiniuToken,group_list=group_list,c_list=c_list,shop_code=shop_code)

		# 商品类目
		elif action == "classify":
			if self.args["type"] != [] :
				_type = self.args["type"]
				sub_type = self.args["sub_type"]
				try:
					fruit_types = self.session.query(models.FruitType)
				except:
					fruit_types = []
				if _type == "fruit":
					fruit_types = fruit_types.filter(models.FruitType.id<1000)
				elif _type == "ganguo":
					fruit_types = fruit_types.filter(and_(models.FruitType.id<2000,models.FruitType.id>1000))
				elif _type == "other":
					fruit_types = fruit_types.filter_by(id=2000)
				datalist = []
				if sub_type == "color":
					for i in range(7):
						if i >0:
							if i ==1:
								color = "red"
								name = '红色'
							elif i == 2:
								color = "yellow"
								name = '黄色'
							elif i == 3:
								color = "green"
								name = '绿色'
							elif i == 4:
								color = "purple"
								name = '紫色'
							elif i == 5:
								color = "white"
								name = '白色'
							elif i == 6:
								color = "blue"
								name = '蓝色'
							types = fruit_types.filter_by(color=i).order_by(models.FruitType.color).all()
							types = self.getClass(types)
							datalist.append({'name':name,'property':color,'data':types})
					types0 = fruit_types.filter_by(color=0).all()
					types0 = self.getClass(types0)
					datalist.append({'name':'其它','property':"unknow",'data':types0})
				elif sub_type == "length":
					for i in range(5):
						if i>0:
							if i == 1:
								name ='一个字'
							elif i == 2:
								name ='两个字'
							elif i == 3:
								name ='三个字'
							elif i == 4:
								name ='四个字'
							types = fruit_types.filter_by(length=i).all()
							types = self.getClass(types)
							datalist.append({'name':name,'property':i,'data':types})
					types0 = fruit_types.filter_by(length=0).all()
					types0 = self.getClass(types0)
					datalist.append({'name':'其它','property':"unknow",'data':types0})
				elif sub_type == "garden":
					for i in range(8):
						if i>0:
							if i ==1:
								garden = "renguo"
								name = "仁果类"
							elif i == 2:
								garden = "heguo"
								name = "核果类"
							elif i == 3:
								garden = "jiangguo"
								name = "浆果类"
							elif i == 4:
								garden = "ganju"
								name = "柑橘类"
							elif i == 5:
								garden = "redai"
								name = "热带及亚热带类"
							elif i == 6:
								garden = "shiguo"
								name = "什果类"
							elif i == 6:
								garden = "jianguo"
								name = "坚果类"
							types = fruit_types.filter_by(garden=i).all()
							types = self.getClass(types)
							datalist.append({'name':name,'property':garden,'data':types})
					types0 = fruit_types.filter_by(garden=0).all()
					types0 = self.getClass(types0)
					datalist.append({'name':'其它','property':"unknow",'data':types0})
				elif sub_type == "nature":
					for i in range(4):
						if i>0:
							if i == 1:
								name = '凉性'
							elif i == 2:
								name = '热性'
							elif i == 3:
								name = '中性'
							types = fruit_types.filter_by(nature=i).all()
							types = self.getClass(types)
							datalist.append({'name':name,'property':i,'data':types})
					types0 = fruit_types.filter_by(nature=0).all()
					types0 = self.getClass(types0)
					datalist.append({'name':'其它','property':"unknow",'data':types0})
				else:
					return self.send_fail(404)
				return self.send_success(data=datalist)
			else:
				return self.render("admin/goods-classify.html",context=dict(subpage="goods"))
		# # 商品分组
		elif action == "group":
			data = []
			goods = self.session.query(models.Fruit).filter_by(shop_id = shop_id)
			default_count = goods.filter_by(group_id=0).count()
			record_count = goods.filter_by(group_id=-1).count()
			group_priority = self.session.query(models.GroupPriority).filter_by(shop_id = shop_id).order_by(models.GroupPriority.priority).all()
			goods = self.session.query(models.Fruit).filter_by(shop_id = self.current_shop.id,active=1)
			# _group = self.session.query(models.GoodsGroup).filter_by(shop_id = self.current_shop.id,status = 1).all()
			# for g in _group:
			# 	goods_count = goods.filter_by( group_id = g.id ).count()
			# 	data.append({'id':g.id,'name':g.name,'intro':g.intro,'num':goods_count})
			if group_priority:
				for g in group_priority:
					group_id = g.group_id
					if group_id != -1:
						if group_id == 0:
							data.append({'id':0,'name':'','intro':'','num':default_count})
						else:
							_group = self.session.query(models.GoodsGroup).filter_by(id=group_id,shop_id = shop_id,status = 1).first()
							if _group:
								goods_count = goods.filter_by( group_id = _group.id ).count()
								data.append({'id':_group.id,'name':_group.name,'intro':_group.intro,'num':goods_count})
			else:
				data.append({'id':0,'name':'','intro':'','num':default_count})
			return self.render("admin/goods-group.html",context=dict(subpage="goods"),data=data,record_count=record_count)
			
		# 商品删除
		elif action == "delete":
			if "page" in self.args:
				data = []
				datalist = []
				page = int(self.args["page"])
				page_size = 10
				offset = page * page_size
				goods = self.session.query(models.Fruit).filter_by(shop_id = shop_id,active = 0)

				if self.args["type"] == "goods_search":
					name = self.args["content"]
					goods = goods.filter(models.Fruit.name.like("%%%s%%" % name))

				count = goods.count()
				count=int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1
				datalist = goods.offset(offset).limit(page_size).all()
				data = self.getGoodsData(datalist,"all")
				return self.send_success(data=data,count=count)
			return self.render("admin/goods-delete.html",context=dict(subpage="goods"))

	def getClass(self,con):
		data = []
		for c in con:
			try:
				num = self.session.query(models.Fruit).filter_by(shop_id=self.current_shop.id,fruit_type_id=c.id).count()
			except:
				num = 0
			data.append({'id':c.id,'code':c.code,'name':c.name,'num':num})
		return data

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action", "data", "charge_type_id?:int")
	def post(self):
		action = self.args["action"]
		data = self.args["data"]
		current_shop = self.current_shop
		shop_id = current_shop.id
		# 添加商品
		if action == "add_goods":
			if not (data["charge_types"] and data["charge_types"]):  # 如果没有计价方式、打开market时会有异常
				return self.send_fail("请至少添加一种计价方式")
			if len(data["intro"]) > 100:
				return self.send_fail("商品简介不能超过100字噢亲，再精简谢吧！")
			args={}
			args["fruit_type_id"] = int(data["fruit_type_id"])
			args["name"] = data["name"]
			args["storage"] = data["storage"]
			args["unit"] = data["unit"]
			if "detail_describe" in data and data["detail_describe"]:
				args["detail_describe"] = data["detail_describe"].replace("script","'/script/'")
			if "tag" in data and  data["tag"]:
				args["tag"] = data["tag"]
			if "limit_num" in data:
				args["limit_num"] = data["limit_num"]
			if "group_id" in data:
				group_id = int(data["group_id"])
				if group_id == -1:
					re_count = self.session.query(models.Fruit).filter_by(shop_id=shop_id,group_id=-1).count()
					if re_count >= 6:
						return self.send_fail("推荐分组最多只能添加六个商品")
				if group_id !=0 and group_id !=-1:
					_group = self.session.query(models.GoodsGroup).filter_by(id = group_id,shop_id = shop_id,status = 1).first()
					if _group:
						args["group_id"] = group_id
					else:
						return self.send_fail('该商品分组不存在或已被删除')
				else:
					args["group_id"] =group_id

			if "img_url" in data:  # 前端可能上传图片不成功，发来一个空的，所以要判断
				index_list = data["img_url"]["index"]
				img_list = data["img_url"]["src"]
				img_urls= []
				for i in range(len(index_list)):
					for index,val in enumerate(index_list):
						val= int(val)
						if val == i:
							imgurl = img_list[index]
							img_urls.append(imgurl)
						args["img_url"] = ";".join(img_urls)  if img_urls else None

			if "priority" in data:
				priority = data["priority"]
			else:
				priority = 0

			if "intro" in data:
				intro = data["intro"]

			args["intro"] = intro
			args["priority"] = priority
			args["fruit_type_id"] = data["fruit_type_id"]
			args["shop_id"] = shop_id
			goods = models.Fruit(**args)
			for charge_type in data["charge_types"]:
				if charge_type["unit_num"] and charge_type["unit_num"] !='':
					unit_num = int(charge_type["unit_num"])
				else:
					unit_num = 1
				if charge_type["select_num"] and charge_type["select_num"] !='':
					select_num = int(charge_type["select_num"])
				else:
					select_num = 1
				if charge_type["market_price"] and charge_type["market_price"] !='':
					market_price = round(float(charge_type["market_price"]),2)
				else:
					market_price = None
				if charge_type["price"] and charge_type["price"] !='':
					price = float(charge_type["price"])
				else:
					price = 0
				if charge_type["num"] and charge_type["num"] !='':
					num = round(float(charge_type["num"]),2)
				else:
					num = 0
				relate = select_num/unit_num
				goods.charge_types.append(models.ChargeType(price=price,
										  unit=int(charge_type["unit"]),
										  num=num,
										  unit_num=unit_num,
										  market_price=market_price,
										  select_num=select_num,
										  relate=relate))

			self.session.add(goods)
			self.session.commit()
			return self.send_success()

		elif action == "edit_goods_img":
			return self.send_qiniu_token("fruit", int(data["goods_id"]))

		elif action == "apply_cookie":
			return self.send_qiniu_token("apply_cookie",int(data["goods_id"]))

		elif action in ["add_charge_type", "edit_active", "edit_goods", "default_goods_img","delete_goods","change_group"]:  # fruit_id
			try:goods = self.session.query(models.Fruit).filter_by(id=int(data["goods_id"])).one()
			except:return self.send_error(404)
			if goods.shop != self.current_shop:
				return self.send_error(403)
			# 添加商品计价方式
			if action == "add_charge_type":
				# print('[AdminGoods]Add charge type, num:',data["num"],data["unit"],data["price"])
				charge_type = models.ChargeType(fruit_id=goods.id,
								price=data["price"],
								unit=data["unit"],
								num=data["num"],
								unit_num=data["unit_num"],
								market_price=data["market_price"],)
				self.session.add(charge_type)
				self.session.commit()
				return self.send_success()
			# 编辑商品上/下架
			elif action == "edit_active":
				if goods.active == 1:
					goods.update(session=self.session, active = 2)
				elif goods.active == 2:
					goods.update(session=self.session, active = 1)
			# 编辑商品分组
			elif action =="change_group":
				group_id = int(data["group_id"])
				if group_id == -1:
					re_count = self.session.query(models.Fruit).filter_by(shop_id=shop_id,group_id=-1).count()
					if re_count >= 6:
						return self.send_fail("推荐分组最多只能添加六个商品")

				if group_id !=0 and group_id !=-1:
						_group = self.session.query(models.GoodsGroup).filter_by(id = group_id,shop_id = shop_id,status = 1).first()
						if _group:
							group_id = _group.id
						else:
							return self.send_fail('该商品分组不存在或已被删除')
				goods.update(session=self.session, group_id = int(data["group_id"]))
			# 编辑商品
			elif action == "edit_goods":
				if len(data["intro"]) > 100:
					return self.send_fail("商品简介不能超过100字噢亲，再精简谢吧！")
				if "group_id" in data:
					group_id = int(data["group_id"])
					if group_id !=0 and group_id !=-1:
						_group = self.session.query(models.GoodsGroup).filter_by(id = group_id,shop_id = shop_id,status = 1).first()
						if _group:
							group_id = group_id
						else:
							return self.send_fail('该商品分组不存在或已被删除')
				if "img_url" in data:  # 前端可能上传图片不成功，发来一个空的，所以要判断
					index_list = data["img_url"]["index"]
					img_list = data["img_url"]["src"]
					img_urls= []
					img_first = ''
					for i in range(len(index_list)):
						for index,val in enumerate(index_list):
							val= int(val)
							if val == i:
								imgurl = img_list[index]
								img_urls.append(imgurl)
							if img_urls:
								_img_urls = ";".join(img_urls)
							else:
								_img_urls = None

				if "charge_types" in data:
					try:
						good = self.session.query(models.Fruit).filter_by(id=int(data["goods_id"])).one()
					except:
						good = None
					for charge_type in data["charge_types"]:
						if charge_type["unit_num"] and charge_type["unit_num"] !='':
							unit_num = int(charge_type["unit_num"])
						else:
							unit_num = 1
						if charge_type["select_num"] and charge_type["select_num"] !='':
							select_num = int(charge_type["select_num"])
						else:
							select_num = 1
						if charge_type["market_price"] and charge_type["market_price"] !='':
							market_price = round(float(charge_type["market_price"]),2)
						else:
							market_price = None
						if charge_type["price"] and charge_type["price"] !='':
							price = round(float(charge_type["price"]),2)
						else:
							price = 0
						if charge_type["num"] and charge_type["num"] !='':
							num = round(float(charge_type["num"]),2)
						else:
							num = 0
						relate = select_num/unit_num
						try:
							q_charge = self.session.query(models.ChargeType).filter_by(id=charge_type['id'])
						except:
							q_charge = None
						if q_charge:
							q_charge.one().update(session=self.session,price=price,
												  unit=charge_type["unit"],
												  num=num,
												  unit_num=unit_num,
												  market_price=market_price,
												  select_num=select_num,
												  relate=relate
												 )
						else:
							charge_types = models.ChargeType(
											fruit_id=int(data["goods_id"]),
											price=price,
											unit=int(charge_type["unit"]),
											num=num,
											unit_num=unit_num,
											market_price=market_price,
											select_num=select_num,
											relate=relate)
							self.session.add(charge_types)

				if "del_charge_types" in data  and  data['del_charge_types']:
					try:
						q = self.session.query(models.ChargeType).filter(models.ChargeType.id.in_(data["del_charge_types"]))
					except:
						return self.send_fail('del_charge_types error')
					# print([AdminGoods]Delete charge type:",q)
					# q.delete(synchronize_session=False)
					for charge in q:
						charge.update(session=self.session,active=0)

				detail_describe = data["detail_describe"].replace("script","'/script/'")
				if (not detail_describe) or detail_describe == "":
					detail_describe = None

				if "fruit_type_id" in data:
					fruit_type_id = int(data["fruit_type_id"])

				goods.update(session=self.session,
						name = data["name"],
						storage = data["storage"],
						unit= data["unit"],
						img_url = _img_urls,
						intro = data["intro"],
						priority = data["priority"],
						limit_num = data["limit_num"],
						group_id = group_id,
						detail_describe = detail_describe,
						tag = int(data["tag"]),
						fruit_type_id = fruit_type_id
						)
				_data = self.session.query(models.Fruit).filter_by(id=int(data["goods_id"])).all()
				data = self.getGoodsData(_data,"one")
				return self.send_success(data=data)

			elif action == "default_goods_img":  # 恢复默认图
				goods.img_url = ''
				self.session.commit()
			elif action == "delete_goods":
				time_now = datetime.datetime.now()
				goods.update(session=self.session, active = 0,delete_time = time_now,group_id = 0)

		elif action in ["del_charge_type", "edit_charge_type"]:  # charge_type_id
			charge_type_id = self.args["charge_type_id"]
			try: q = self.session.query(models.ChargeType).filter_by(id=charge_type_id)
			except:return self.send_error(404)
			if action == "del_charge_type":
				q.delete()
			else:
				q.one().update(session=self.session,price=data["price"],
						 unit=data["unit"],
						 num=data["num"],
						 unit_num=data["unit_num"])
			self.session.commit()

		elif action == "add_img":
			return self.send_qiniu_token("add", 0)

		# 批量上/下架 / 批量分组
		elif action in ["batch_on",'batch_off',"batch_group"]:
			for _id in data["goods_id"]:
				try:
					goods = self.session.query(models.Fruit).filter_by( id = _id ).first()
				except:
					return self.send_error(404)
				if action == 'batch_on':
					goods.active = 1
				elif action == 'batch_off':
					goods.active = 2
				elif action == 'batch_group':
					group_id = int(data["group_id"])
					if group_id == -1:
						re_count = self.session.query(models.Fruit).filter_by(shop_id=shop_id,group_id=-1).count()
						if re_count >= 6:
							return self.send_fail("推荐分组最多只能添加六个商品")
					goods.group_id= group_id
			self.session.commit()

		# 添加商品分组
		elif action =="add_group":
			args={}
			args["shop_id"] = shop_id
			args["name"] = data["name"]
			args["intro"] = data["intro"]
			if "name" not in data:
				return self.send_error(403)
			try:
				groups = self.session.query(models.GoodsGroup).filter_by(shop_id = shop_id,status = 1)
			except:
				groups = None
			if groups:
				group_count = groups.count()
			if group_count >= 5:
				return self.send_fail('最多只能添加五种自定义分组')
			if not args["name"] or not args["intro"]:
				return self.send_fail('请填写相应分组信息')
			_group = models.GoodsGroup(**args)
			self.session.add(_group)
			self.session.flush()

			try:
				old_group = self.session.query(models.GroupPriority).filter_by(shop_id=shop_id).first()
			except:
				old_group = None
			if not old_group:
				defautl_group = models.GroupPriority(shop_id=shop_id,group_id=0,priority=(group_count+1))
				self.session.add(defautl_group)
			new_group_id = _group.id
			group_priority = models.GroupPriority(shop_id=shop_id,group_id=new_group_id,priority=(group_count+2))
			self.session.add(group_priority)
			self.session.commit()
			return self.send_success(id=new_group_id)

		# 删除商品分组 / 编辑商品分组
		elif action in["delete_group","edit_group"]:
			_id = data["id"]
			_group = self.session.query(models.GoodsGroup).filter_by(id=_id,shop_id=shop_id,status=1).first()
			if _group:
				if action == "delete_group":
					_group.status = 0
					goods = self.session.query(models.Fruit).filter_by(shop_id=shop_id,group_id=_id).all()
					for good in goods :
						good.group_id = 0
				elif action =="edit_group":
					_group.name = data["name"]
					_group.intro = data["intro"]
				self.session.commit()
			else:
				return self.send_fail('该商品分组不存在或已被删除')

		# 编辑商品分组优先级
		elif action == "group_priority":
			groups = self.session.query(models.GoodsGroup).filter_by(shop_id=shop_id,status=1)
			id_list = data["id"]
			index_list = data["index"]
			data = []
			self.session.query(models.GroupPriority).filter_by(shop_id=shop_id).delete()
			for index,val in enumerate(index_list):
				_id = id_list[index]
				if _id !=0:
					try:
						group = groups.filter_by(id=_id).first()
					except:
						return self.send_fail('该分组不存在')
					group_priority = models.GroupPriority(shop_id=shop_id,group_id=_id,priority=val)
					self.session.add(group_priority)
			self.session.commit()

		# 商品批量恢复删除
		elif action == "batch_reset_delete":
			for _id in data["goods_id"]:
				try:
					goods = self.session.query(models.Fruit).filter_by( id = _id ).first()
				except:
					return self.send_error(404)
				if goods:
					goods.active = 1
				self.session.commit()

		# 商品恢复删除
		elif action == "reset_delete":
			try:
				goods = self.session.query(models.Fruit).filter_by( id = data["id"] ).first()
			except:
				return self.send_error(404)
			if goods:
				goods.active = 1
			self.session.commit()

		# 商品类目搜索
		elif action =="classify_search":
			classify = data["classify"]
			try:
				fruit_types = self.session.query(models.FruitType).filter(models.FruitType.name.like("%%%s%%" % classify)).all()
			except:
				return self.send_fail('没有该商品类目')
			if fruit_types == []:
				return self.send_fail('没有该商品类目')
			types = self.getClass(fruit_types)
			return self.send_success(data=types)

		else:
			return self.send_error(404)

		return self.send_success()

# 商品导入
class GoodsImport(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action?:str")
	def get(self):
		shop_list = []
		try:
			shops = self.current_user.shops
		except:
			shops = None
		try:
			other_shops = self.session.query(models.Shop).join(models.HireLink,models.Shop.id==models.HireLink.shop_id).\
						  filter(models.HireLink.staff_id == self.current_user.accountinfo.id,models.HireLink.active==1,models.HireLink.work==9).all()
		except:
			other_shops = None

		if shops:
			shop_list += self.getshop(shops)
		if other_shops:
			shop_list += self.getshop(other_shops)
		return self.render("admin/goods-import.html",context=dict(subpage="goods"),shop_list=shop_list)

	def getshop(self,shops):
		shop_list = []
		for shop in shops:
			shop_list.append({"id":shop.id,"name":shop.shop_name})
		return shop_list

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action", "data", "charge_type_id?:int")
	def post(self):
		action = self.args["action"]
		data = self.args["data"]
		current_shop = self.current_shop
		if action == "get_goods":
			shop_id = int(data["id"])
			try:
				shop = self.session.query(models.Shop).filter_by(id=shop_id).first()
			except:
				shop = None
			if not shop:
				return self.send_fail("该店铺不存在")
			if shop not in self.current_shop.admin.shops:
				return self.send_fail("该店铺不属于您，无法获取数据")
			goods_list = []
			for fruit in shop.fruits:
				charge_types = []
				for charge in fruit.charge_types:
					charge_types.append({"price":charge.price,"unit":self.getUnit(charge.unit)})
				img_url = fruit.img_url.split(";")[0] if fruit.img_url else "/static/images/TDSG.png"
				goods_list.append({"id":fruit.id,"name":fruit.name,"charge_types":charge_types,"imgurl":img_url})
			return self.send_success(goods_list=goods_list)

		elif action == "import_goods":
			fruit_list  = data["fruit_list"]
			if len(self.current_shop.fruits) + len(fruit_list) >200:
				return self.send_fail("一家店铺最多可添加200种商品")
			fruits = self.session.query(models.Fruit).filter(models.Fruit.id.in_(fruit_list)).all()
			for fruit in fruits:
				_fruit = models.Fruit(
					shop_id=self.current_shop.id,
					fruit_type_id=fruit.fruit_type_id,
					name=fruit.name,
					storage=0,
					unit=fruit.unit,
					tag=fruit.tag,
					img_url=fruit.img_url,
					intro=fruit.intro,
					classify=fruit.classify,
					detail_describe=fruit.detail_describe,
				)
				self.session.add(_fruit)
				self.session.flush()
				if not fruit.charge_types:
					continue
				for charge in fruit.charge_types:
					_charge=models.ChargeType(
						fruit_id = _fruit.id,
						price = charge.price,
						unit = charge.unit,
						num = charge.num,
						unit_num = charge.unit_num,
						active = charge.active,
						market_price = charge.market_price,
						select_num = charge.select_num,
						relate = charge.relate
					)
					self.session.add(_charge)
				self.session.commit()
			return self.send_success()

		elif  action == "checkyouzan":
			if "appid" in data and "appsecret" in data:
				appid = data["appid"]
				appsecret = data["appsecret"]
			else:
				return self.send_error(403)
			goods_info = self.getYouzan("goods",appid,appsecret)
			goods_list = []
			if goods_info and "total_results" in goods_info:
				goods_total_results=int(goods_info["total_results"])
				if goods_total_results>0:
					for good in goods_info["items"]:
						title = good.get("title","")
						intro = good.get("desc","")
						imgs = good.get("item_imgs","")
						price = good.get("price",0)
						good_img_url = []
						charge_types = []
						if price == "":
							price = 0
						for img in imgs:
							good_img_url.append(img["url"])
						if good_img_url !=[]:
							img_url = good_img_url[0]
						good_img_url=(";").join(good_img_url)
						if len(title)>20:
							title=title[0:20]
						if len(intro)>8000:
							intro=intro[0:8000]
						if len(good_img_url)>500:
							good_img_url=good_img_url[0:500]
						charge_types.append({"price":price,"unit":self.getUnit(3)})
						goods_list.append({"id":"","name":title,"charge_types":charge_types,"imgurl":img_url,"imgs":good_img_url,"intro":str(intro)})
			return self.send_success(goods_list=goods_list)

		elif action == "import_youzan":
			if "datalist" in data:
				datalist = data["datalist"]
			else:
				return self.send_error(403)
			if len(self.current_shop.fruits) + len(datalist) >200:
				return self.send_fail("一家店铺最多可添加200种商品")
			for data in datalist:
				# print("[GoodsImport]data["imgs"]:",data["imgs"])
				# print("[GoodsImport]data.get("imgs",""):",data.get("imgs",""))
				new_good = models.Fruit(shop_id = self.current_shop.id , fruit_type_id = 999,name = data.get("name",""),
				storage = 100,unit = 3,img_url = data.get("imgs",""),detail_describe=data.get("intro",""))
				new_good.charge_types.append(models.ChargeType(price = data.get("price",0),unit = 3,num = 1,market_price = None))
				self.session.add(new_good)
			self.session.commit()
			return self.send_success()

class editorTest(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action?:str")
	def get(self):
		self.if_current_shops()
		if "action" in self.args:
			if self.args["action"] == "editor" :
				shop_id = self.current_shop.id
				token = self.get_editor_token("editor", shop_id)
				return token
		return self.render("admin/test-editor.html",context=dict(subpage="goods"))

class editorCallback(AdminBaseHandler):
	def get(self):
		import base64
		upload_ret = self.get_argument("upload_ret")
		if upload_ret:
			info = bytes.decode(base64.b64decode(upload_ret))
			data = []
			for value in info.split("&"):
				data.append(value.split("="))
			key = data[0][1].replace('"','').strip()
			imgurl = 'http://7rf3aw.com2.z0.glb.qiniucdn.com/'+str(key)+'?imageView2/2/w/800'
		return self.write('{"error":0, "url": "'+imgurl+'"}')

class editorFileManage(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.send_success()

# 用户管理
class Follower(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action:str", "order_by:str","if_reverse?:int", "page?:int", "wd?:str")
	def get(self):
		self.if_current_shops()
		# if self.is_pc_browser()==False:
		# 	return self.redirect(self.reverse_url("MadminComment"))
		action = self.args["action"]
		order_by = self.args["order_by"]
		if "page" in self.args and self.args["page"] !=[]:
			page = self.args["page"]
			if "if_reverse" in self.args:
				if_reverse = self.args["if_reverse"]
			else:
				if_reverse = None
			page_size = 10
			count = 0
			page_sum = 0
			shop_id = self.current_shop.id
			nomore = False
			if action in ("all","old","charge"):
				if action == "all":  # 所有用户
					q = self.session.query(models.Customer).join(models.CustomerShopFollow).\
						filter(models.CustomerShopFollow.shop_id == self.current_shop.id)
				elif action == "old":  # 老用户
					q = self.session.query(models.Customer).join(models.CustomerShopFollow).\
						filter(models.CustomerShopFollow.shop_id == self.current_shop.id,models.CustomerShopFollow.shop_new == 1)
				elif action == "charge":
					query_list = self.session.query(models.BalanceHistory.customer_id).filter_by(shop_id = self.current_shop.id,balance_type = 0).all()
					charge_list = []
					for item in query_list:
						charge_list.append(item[0])
					charge_list = set(charge_list)
					q = self.session.query(models.Customer).outerjoin(models.CustomerShopFollow).\
						filter(models.Customer.id.in_(charge_list),models.CustomerShopFollow.shop_id == self.current_shop.id).distinct()

				if if_reverse == 1:
					if order_by == "time":
						q = q.order_by(desc(models.CustomerShopFollow.create_time))
					elif order_by == "point":
						q = q.order_by(desc(models.CustomerShopFollow.shop_point))
					elif order_by == "balance":
						q = q.order_by(desc(models.CustomerShopFollow.shop_balance))
				elif if_reverse == 0:
					if order_by == "time":
						q = q.order_by(models.CustomerShopFollow.create_time)
					elif order_by == "point":
						q = q.order_by(models.CustomerShopFollow.shop_point)
					elif order_by == "balance":
						q = q.order_by(models.CustomerShopFollow.shop_balance)
				else:
					if order_by == "time":
						q = q.order_by(desc(models.CustomerShopFollow.create_time))
					elif order_by == "point":
						q = q.order_by(desc(models.CustomerShopFollow.shop_point))
					elif order_by == "balance":
						q = q.order_by(desc(models.CustomerShopFollow.shop_balance))

				count = q.count()
				customers = q.offset(page*page_size).limit(page_size).all()

			##################################################################
			# Modify by Sky - 2015.6.1
			# 用户搜索，支持根据手机号/真名/昵称搜索，支持关键字模糊搜索，支持收件人搜索
			# TODO: 搜索性能需改进，应进行多表联合查询
			##################################################################
			elif action == "search":
				wd = self.args["wd"]

				customers = self.session.query(models.Customer).join(models.CustomerShopFollow).\
					filter(models.CustomerShopFollow.shop_id == self.current_shop.id).\
					join(models.Accountinfo).filter(or_(models.Accountinfo.phone.like("%%%s%%" % wd),
														models.Accountinfo.id.like("%%%s%%" % wd),
														models.Accountinfo.nickname.like("%%%s%%" % wd),
														models.Accountinfo.realname.like("%%%s%%" % wd))).all()
				customers += self.session.query(models.Customer).join(models.CustomerShopFollow).\
					filter(models.CustomerShopFollow.shop_id == self.current_shop.id).\
					join(models.Address).filter(or_(models.Address.phone.like("%%%s%%" % wd),
													models.Address.receiver.like("%%%s%%" % wd))).all()

				customer_list=[]
				count = len(customers)
				for customer in customers:
					if customer not in customer_list:
						customer_list.append(customer)
				customers = customer_list

			elif action =="filter":
				wd = self.args["wd"]
				customers = self.session.query(models.Customer).join(models.CustomerShopFollow).\
						filter(models.CustomerShopFollow.shop_id == self.current_shop.id).\
						join(models.Accountinfo).filter(models.Accountinfo.id == int(wd)).all()
			else:
				return self.send_error(404)
			for x in range(0, len(customers)):  #
				shop_names = self.session.query(models.Shop.shop_name).join(models.CustomerShopFollow).\
					filter(models.CustomerShopFollow.customer_id == customers[x].id).all()
				shop_point = self.session.query(models.CustomerShopFollow).filter_by(customer_id = customers[x].id,\
					shop_id = shop_id).first()
				customers[x].shop_point = int(shop_point.shop_point) if shop_point.shop_point else 0
				customers[x].shop_names = [y[0] for y in shop_names]
				customers[x].shop_balance = format(shop_point.shop_balance,".2f") if shop_point.shop_balance else 0
				customers[x].remark = shop_point.remark

			page_sum=count/page_size
			if page == page_sum:
				nomore = True
			if page_sum == 0:
				page_sum=1
			customer_list=[]
			for customer in customers:
				address=[]
				birthday = datetime.datetime.fromtimestamp(customer.accountinfo.birthday).strftime('%Y-%m-%d') if customer.accountinfo.birthday else ""
				for addr in customer.addresses:
					address.append({"address":addr.address_text,"phone":addr.phone,"receiver":addr.receiver})
				customer_list.append({"id":customer.accountinfo.id,"headimgurl_small":customer.accountinfo.headimgurl_small\
					,"nickname":customer.accountinfo.nickname,"sex":customer.accountinfo.sex,"shop_balance":customer.shop_balance\
					,"shop_point":customer.shop_point,"remark":customer.remark,"realname":customer.accountinfo.realname,\
					"phone":customer.accountinfo.phone,"birthday":birthday,"shop_names":customer.shop_names,"address":address})
			return self.send_success(customer_list=customer_list,page_sum=page_sum,count=count)
		return self.render("admin/user-manage.html",context=dict(subpage='user'))
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action:str", "data")
	def post(self):
		action = self.args["action"]
		data = self.args["data"]
		# 用户备注
		if action == 'remark':
			try:
				customer = self.session.query(models.CustomerShopFollow).filter_by(shop_id=self.current_shop.id,customer_id=int(data["id"])).first()
			except:
				customer = None
				return self.send_fail('没有该用户信息')
			if customer:
				customer.remark = data["remark"]
				self.session.commit()
				return self.send_success()

# 员工管理
class Staff(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action")
	def get(self):
		self.if_current_shops()
		action = self.args["action"]
		staffs = self.current_shop.staffs
		if action == "hire":
			hire_forms = self.session.query(models.HireForm).filter_by(shop_id=self.current_shop.id ).filter(models.HireForm.work!=9).all()
			return self.render("admin/staff.html", hire_forms=hire_forms,
							   context=dict(subpage='staff',staffSub='hire'))
		query = self.session.query(models.ShopStaff, models.HireLink).join(models.HireLink).filter(
				models.HireLink.shop_id == self.current_shop.id)
		subpage = 'staff'
		staffSub = ''
		if action == "JH":
			staff_tuple = query.filter(models.HireLink.work == 1).all()
			staffSub = 'jh'
		elif action == "SH1":
			staff_tuple = query.filter(models.HireLink.work == 2).all()
			staffSub = 'sh1'
		elif action == "SH2":
			staff_tuple = query.filter(models.HireLink.work == 3).all()
			staffSub = 'sh2'
		else:
			return self.send_error(404)

		staffs = []
		for item in staff_tuple:
			item[0].hirelink = item[1]
			staffs.append(item[0])

		return self.render("admin/staff.html", staffs=staffs, context=dict(subpage=subpage, staffSub=staffSub))

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action", "data")
	def post(self): #hire_form_id/staff_id
		action = self.args["action"]
		data = self.args["data"]

		if action in ["hire_agree", "hire_refuse"]: #id = hire_form_id
			try:hire_form = self.session.query(models.HireForm).filter_by(
				staff_id=data["id"], shop_id=self.current_shop.id).one()
			except: return self.send_error(404)

			if action == "hire_agree":

				###############################################################################
				# if the staff exited,send_fail
				###############################################################################
				staff_id = data["id"]
				try:staff  = self.session.query(models.ShopStaff).filter_by(id=staff_id).one()
				except: return self.send_error(404)
				phone = staff.accountinfo.phone
				# print("[AdminStaff]phone:",phone)
				try:
					# print([AdminStaff]current_shop.id:",self.current_shop.id)
					hire_forms =self.session.query(models.HireForm).filter_by(status = 2,shop_id=self.current_shop.id).all()
					# print([AdminStaff]hire_forms lenth:",len(hire_forms))
					temp_phone =[]
					for temp in hire_forms:
						temp_phone.append(temp.staff.accountinfo.phone)
					# print("[AdminStaff]temp_phone:",temp_phone)
					if phone in temp_phone:
						return self.send_fail("该电话号码已存在，请换一个")
				except:return self.send_error(404)

				hire_form.status = 2

				try:
					self.session.add(models.HireLink(staff_id=hire_form.staff_id, shop_id=hire_form.shop_id))
					self.session.commit()
				except:
					return self.send_fail("申请表已经通过")
			elif action == "hire_refuse":
				if hire_form.status == 2:
					return self.send_fail("申请已经通过，不能再拒绝")
				hire_form.status = 3
				self.session.commit()
		elif action == "edit_hire_on":
			self.current_shop.config.hire_on = not self.current_shop.config.hire_on
			self.session.commit()
		elif action == "edit_hire_text":
			self.current_shop.config.hire_text = data["hire_text"]
			self.session.commit()
		elif action == "edit_active":
			try:hire_link = self.session.query(models.HireLink).filter_by(
				staff_id=data["staff_id"],shop_id=self.current_shop.id).one()
			except:return self.send_error(404)
			try:
				shop = self.session.query(models.Shop).filter_by(id = self.current_shop.id).one()
				admin_id  =shop.admin.accountinfo.id
			except :
				print('[AdminStaff]Edit staff status: this man is not admin')
			if hire_link.active==2:
					hire_link.active = 1
			else:
				if admin_id and hire_link.staff_id == admin_id:
					return self.send_fail('管理员不可设置为下班状态')
				if hire_link.default_staff == 1:
					return self.send_fail('请先取消该员工的默认员工状态，再让设置该员工为下班')
				else:
					hire_link.active = 2
			self.session.commit()
		elif action == "edit_staff":
			try:hire_link = self.session.query(models.HireLink).filter_by(
				staff_id=data["staff_id"],shop_id=self.current_shop.id).one()
			except:return self.send_error(404)
			hire_link.update(session=self.session, remark=data["remark"])
		elif action == "default_staff":
			try:
				hire_link = self.session.query(models.HireLink).filter_by(staff_id=data["staff_id"],shop_id=self.current_shop.id).one()
				other_hire =self.session.query(models.HireLink).filter(models.HireLink.staff_id!=data["staff_id"],\
					models.HireLink.shop_id==self.current_shop.id).all()
			except:return self.send_error(404)
			if hire_link.default_staff == 0:
				if hire_link.active == 2:
					return self.send_fail('请先设置该员工为上班，才能设置该员工为默认员工')
				else :
					hire_link.default_staff =1
					for hire in other_hire:
						hire.default_staff =0
			else:
				hire_link.default_staff=0
			self.session.commit()
		else:
			return self.send_fail()
		return self.send_success()

# 订单搜索
class SearchOrder(AdminBaseHandler):  # 用户历史订单
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action", "id:int","page?:int")
	def get(self):
		self.if_current_shops()
		action = self.args["action"]
		subpage=''
		if action == 'customer_order':
			subpage='user'
		elif action == 'SH2_order':
			subpage='staff'
		elif action == 'order':
			subpage='order'
		else:
			return self.send_error(404)

		if "page" in self.args:
			if action == 'customer_order':
				orders = self.session.query(models.Order).filter(
					models.Order.customer_id==self.args['id'], models.Order.shop_id==self.current_shop.id,\
					not_(models.Order.status.in_([-1,0]))).all()
			elif action == 'SH2_order':
				orders = self.session.query(models.Order).filter(
					models.Order.SH2_id==self.args['id'], models.Order.shop_id==self.current_shop.id,\
					not_(models.Order.status.in_([-1,0]))).all()
			elif action == 'order':
				orders = self.session.query(models.Order).filter(
					models.Order.num==self.args['id'], models.Order.shop_id==self.current_shop.id).all()
			else:
				return self.send_error(404)
			delta = datetime.timedelta(1)
			data = self.getOrder(orders)
			return self.send_success(data=data,page_sum=0)

		return self.render("admin/order-list.html", context=dict(subpage=subpage))

# 店铺设置
class Config(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action",'status?')
	def get(self):
		self.if_current_shops()
		try:config = self.session.query(models.Config).filter_by(id=self.current_shop.id).one()
		except:return self.send_error(404)
		action = self.args["action"]
		if action == "delivery":
			return self.render("admin/shop-address-set.html", addresses=config.addresses,context=dict(subpage='shop_set',shopSubPage='delivery_set'))
		elif action == "recharge":
			pass
		elif action == "receipt":
			return self.render("admin/shop-receipt-set.html", receipt_msg=config.receipt_msg,context=dict(subpage='shop_set',shopSubPage='receipt_set'))
		elif action == "phone":
			return self.render('admin/shop-phone-set.html',context=dict(subpage='shop_set',shopSubPage='phone_set'))
		elif action == "admin":
			notice=''
			if 'status' in self.args:
				status = self.args["status"]
				if status == 'success':
					notice='管理员添加成功'
				elif status == 'fail':
					notice='您不是超级管理员，无法进行管理员添加操作'
			admin_list = self.session.query(models.HireLink).filter_by(shop_id = self.current_shop.id,active =1,work = 9 ).all()
			datalist =[]
			for admin in admin_list:
				info = self.session.query(models.ShopStaff).filter_by(id=admin.staff_id).first()
				datalist.append({'id':info.accountinfo.id,'imgurl':info.accountinfo.headimgurl_small,'nickname':info.accountinfo.nickname,'temp_active':admin.temp_active})
			return self.render('admin/admin-set.html',context=dict(subpage='shop_set',shopSubPage='admin_set'),notice=notice,datalist=datalist)

		elif action == "template":
			return self.render('admin/shop-template-set.html',context=dict(subpage='market_set',shopSubPage='template_set'))
		elif action == "pay":
			return self.render("admin/shop-pay-set.html",context=dict(subpage='market_set',shopSubPage='pay_set'))
		elif action == "notice":
			token = self.get_qiniu_token("shop_notice_cookie",self.current_shop.id)
			return self.render("admin/shop-notice-set.html", notices=config.notices,token=token,context=dict(subpage='market_set',shopSubPage='notice_set'))
		else:
			return self.send_error(404)


	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action", "data")
	def post(self):
		action = self.args["action"]
		data = self.args["data"]

		if action in ["add_addr1", "add_notice", "edit_receipt", "edit_hire","edit_receipt_img"]:
			if action == "add_addr1":
				addr1 = models.Address1(name=data)
				self.current_shop.config.addresses.append(addr1)
				self.session.commit()
				return self.send_success(address1_id=addr1.id)#commit后id会自动生成
			elif action == "add_notice":
				if "img_url" in data:
					img_url = data["img_url"]
				else:
					img_url = ''
				notice = models.Notice(
					summary=data["summary"],
					detail=data["detail"],
					img_url=img_url)
				self.current_shop.config.notices.append(notice)
				self.session.commit()
			elif action == "edit_receipt": #小票设置
				self.current_shop.config.update(session=self.session,
												receipt_msg=data["receipt_msg"])
			elif action =="edit_receipt_img":
				self.current_shop.config.update(session=self.session,receipt_img=data["receipt_img"])
		elif action in ["add_addr2", "edit_addr1_active"]:
			addr1 = next((x for x in self.current_shop.config.addresses if x.id==data["addr1_id"]), None)
			if action == "add_addr2":
				addr2 = models.Address2(name=data["name"])
				addr1.address2.append(addr2)
				self.session.commit()
			elif action == "edit_addr1_active":
				addr1.update(session=self.session, active=not addr1.active)
		elif action =="edit_addr2_active":#id: addr2_id
			try:addr2 = self.session.query(models.Address2).filter_by(id=data["addr2_id"]).one()
			except:return self.send_error(404)
			addr2.update(session=self.session, active=not addr2.active)
		elif action in ("edit_notice_active", "edit_notice"):  # notice_id
			notice = next((x for x in self.current_shop.config.notices if x.id == int(data["notice_id"])), None)
			if not notice:
				return self.send_error('没有该公告的任何消息')
			if action == "edit_notice_active":
				notice.active = 1 if notice.active == 2 else 2
			elif action == "edit_notice":
				if "img_url" in data:
					img_url = data["img_url"]
				else:
					img_url = ''
				notice.summary = data["summary"]
				notice.detail = data["detail"]
				notice.img_url=img_url
			self.session.commit()
		elif action == "edit_recipe_img":
			return self.send_qiniu_token("receipt", self.current_shop.id)
		elif action == "recipe_img_on":#4.24 yy
			active = self.current_shop.config.receipt_img_active
			if active == 1:
				active = 0
			else:
				active = 1
			self.current_shop.config.update(session=self.session,receipt_img_active=active)
		elif action == "cash_on":
			if self.current_shop.shop_auth ==0:
				return self.send_fail('您的店铺还未认证，不能使用该功能')
			active = self.current_shop.config.cash_on_active
			if active == 1:
				active = 0
			else:
				active = 1
			self.current_shop.config.update(session=self.session,cash_on_active=active)
		elif action == "balance_on":
			if self.current_shop.shop_auth ==0:
				return self.send_fail('您的店铺还未认证，不能使用该功能')
			active = self.current_shop.config.balance_on_active
			balance_on_active =self.current_shop.config.balance_on_active
			shop_balance = self.current_shop.shop_balance
			available_balance = self.current_shop.available_balance
			if shop_balance !=0 and balance_on_active == 1:
				return self.send_fail('您的店铺余额不为0，不可关闭余额支付')
			if available_balance != shop_balance and balance_on_active == 1:
				return self.send_fail('您尚有余额支付的订单未完成，不可关闭余额支付')
			if active == 1:
				active = 0
			else:
				active = 1
			self.current_shop.config.update(session=self.session,balance_on_active=active)
		elif action == "online_on":
			if self.current_shop.shop_auth ==0:
				return self.send_fail('您的店铺还未认证，不能使用该功能')
			active = self.current_shop.config.online_on_active
			if active == 1:
				active = 0
			else:
				active = 1
			self.current_shop.config.update(session=self.session,online_on_active=active)
		elif action =="text_message_on":
			if self.current_shop.shop_auth ==0:
				return self.send_fail('您的店铺还未认证，不能使用该功能')
			active = self.current_shop.config.text_message_active
			if active == 1:
				active = 0
			else:
				active = 1
			self.current_shop.config.update(session=self.session,text_message_active=active)
		# 用户搜索
		elif action =="search_user":
			_id = int(self.args["data"]["id"])
			data = []
			info  = self.session.query(models.Accountinfo).filter_by(id = _id).first()
			if not info:
				return self.send_fail('该用户还不是森果的用户，无法添加其为管理员')
			# customer = self.session.query(models.Customer).filter_by(id = info.id).first()
			# if not customer:
			# 	return self.send_fail('该用户还没有关注您的店铺')
			# customer_shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id= customer.id,shop_id=self.current_shop.id).first()
			# if not customer_shop_follow:
			# 	return self.send_fail('该用户还没有关注您的店铺')
			# if info and customer and customer_shop_follow:
			data.append({'imgurl':info.headimgurl_small,'nickname':info.nickname,'id':info.id})
			return self.send_success(data=data)
		# 添加店铺管理员
		elif action =="add_admin":
			if self.current_shop.shop_auth ==0:
				return self.send_fail('您的店铺还未认证，不能使用该功能')
			if self.current_shop.admin.id !=self.current_user.id:
				return self.send_fail('您没有添加管理员的权限')
			_id = int(self.args["data"]["id"])
			if_shop = self.session.query(models.Shop).filter_by(admin_id =_id).first()
			if if_shop:
				return self.send_fail('该用户已是其它店铺的超级管理员，不能添加其为管理员')
			admin_count = self.session.query(models.HireLink).filter_by(shop_id = self.current_shop.id,active = 1,work=9).count()
			if admin_count == 3:
				return self.send_fail('最多可添加三个管理员')
			if self.current_shop.admin.accountinfo.id == _id:
				return self.send_fail('该用户已经是店铺的管理员')
			admin = self.session.query(models.HireLink).filter_by(shop_id = self.current_shop.id,staff_id = _id,active=1,work=9).first()
			if admin:
				return self.send_fail('该用户已经是店铺的管理员')
			else:
				staff  =self.session.query(models.ShopStaff).filter_by( id = _id).first()
				hire_form = self.session.query(models.HireForm).filter_by(shop_id = self.current_shop.id,staff_id = _id).first()
				if not staff:
					staff_temp = models.ShopStaff(
						id = _id,
						shop_id = self.current_shop.id
						)
					self.session.add(staff_temp)
				if hire_form:
					hire_form.work = 9
					hire_form.status = 2
					hire_form.create_time = datetime.datetime.now()
				else:
					#生成一张临时管理员 申请表
					admin_temp = models.HireForm(
						staff_id = _id,
						shop_id = self.current_shop.id,
						work = 9
						)
					self.session.add(admin_temp)
				self.session.commit()
			return self.send_success()
		# 删除店铺管理员
		elif action =="delete_admin":
			if self.current_shop.admin.id !=self.current_user.id:
				return self.send_fail('您没有删除管理员的权限')
			_id = int(self.args["data"]["id"])
			try:
				admin = self.session.query(models.HireLink).filter_by(shop_id = self.current_shop.id,staff_id = _id,active=1,work=9).first()
			except:
				return self.send_fail('该管理员不存在')
			self.session.query(models.HireLink).filter_by(shop_id = self.current_shop.id,staff_id = _id,active=1,work=9).delete()
			self.session.commit()
			return self.send_success()
		# 店铺超级管理员订单模版消息提醒设置
		elif action =="super_temp_active":
			super_temp_active = self.current_shop.super_temp_active
			if self.current_shop.admin.id !=self.current_user.id:
				return self.send_fail('您没有这项操作的权限')
			self.current_shop.super_temp_active = 0 if super_temp_active == 1 else 1
			self.session.commit()
			return self.send_success()
		# 店铺管理员订单模版消息提醒设置
		elif action =="admin_temp_active":
			_super = self.current_shop.admin
			if _super.id !=self.current_user.id:
				return self.send_fail('您没有这项操作的权限')
			_id = int(self.args["data"]["id"])
			try:
				admin = self.session.query(models.HireLink).filter_by(shop_id = self.current_shop.id,staff_id = _id,active=1,work=9).first()
			except:
				return self.send_fail('该管理员不存在')
			admin.temp_active = 0 if admin.temp_active == 1 else 1
			try:
				other_admin = self.session.query(models.HireLink).filter_by(shop_id = self.current_shop.id,work = 9).filter(models.HireLink.staff_id != _id).all()
			except:
				other_admin = None
			for admin in other_admin:
				admin.temp_active  = 0
			self.session.commit()
			return self.send_success()
		# 商城模版设置
		elif action=="tpl_choose":
			tpl_id=int(self.args["data"]["tpl_id"])
			self.current_shop.shop_tpl=tpl_id
			self.session.commit()
			return self.send_success()
		# 打印类型设置（有线/无线）
		elif action=="receipt_type_set":
			self.current_shop.config.receipt_type = 0 if self.current_shop.config.receipt_type == 1 else 1
			self.session.commit()
		# 订单自动打印设置
		elif action=="auto_print_set":
			self.current_shop.config.auto_print = 0 if self.current_shop.config.auto_print == 1 else 1
			self.session.commit()
		# 自动打印订单取消信息设置
		elif action=="concel_auto_print":
			self.current_shop.config.concel_auto_print = 0 if self.current_shop.config.concel_auto_print == 1 else 1
			self.session.commit()
		# 无线打印机设置
		elif action=="console_set":
			_type = int(self.args["data"]["type"])
			num = self.args["data"]["num"]
			key = self.args["data"]["key"]
			if len(num) > 20:
				return self.send_fail("您输入的打印机终端号过长")
			if len(key) > 20:
				return self.send_fail("您输入的打印机密钥过长")
			self.current_shop.config.wireless_print_num = num
			self.current_shop.config.wireless_print_key = key
			self.current_shop.config.wireless_type = _type
			self.session.commit()
		else:
			return self.send_error(404)
		return self.send_success()

# 店铺设置 - 管理员设置
class AdminAuth(AdminBaseHandler):
	@tornado.web.authenticated
	def initialize(self, action):
		self._action = action
	def get(self):
		self.if_current_shops()
		next_url = self.get_argument('next', '')
		if self._action == 'wxauth':
			if self.is_pc_browser():
				link = self.get_wexin_oauth_link2(next_url=next_url)
				return self.render("admin/wx-auth.html",link=link)
			else:
				return self.redirect(self.get_wexin_oauth_link2(next_url=next_url))
		elif self._action == 'wxcheck':
			return self.check_admin(next_url)

	@AdminBaseHandler.check_arguments("code", "state?", "mode")
	def check_admin(self,next_url):
		# todo: handle state
		code =self.args["code"]
		mode = self.args["mode"]
		user =''
		if mode not in ["mp", "kf"]:
			return self.send_error(400)
		wx_userinfo = self.get_wx_userinfo(code, mode)
		if self.current_shop.admin.accountinfo.wx_unionid == wx_userinfo["unionid"]:
			temp = self.session.query(models.HireForm).filter_by(shop_id = self.current_shop.id,work=9).order_by(models.HireForm.create_time.desc()).first()
			#超级管理员授权成功，将临时管理员表信息放入关系表中
			try:
				staff_already = self.session.query(models.HireLink).filter_by(staff_id=temp.staff_id,shop_id=temp.shop_id).first()
			except:
				staff_already = None
			if staff_already:
				staff_already.active = 1
				staff_already.work = 9
			else:
				admin = models.HireLink(
						staff_id = temp.staff_id,
						shop_id = temp.shop_id,
						work = 9
					)
				self.session.add(admin)
			self.session.flush()
			account_info = self.session.query(models.Accountinfo).filter_by(id=temp.staff.accountinfo.id).first()
			normal_admin = self.session.query(models.ShopAdmin).filter_by(id = account_info.id).first()
			if not normal_admin:
				normal_admin = models.ShopAdmin(id = account_info.id,role=3,privileges = 2)
				self.session.add(normal_admin)
			self.session.commit()
			url = 'http://106.ihuyi.cn/webservice/sms.php?method=Submit'     # message'url
			message_name = account_info.nickname
			mobile = account_info.phone
			message_shop_name = self.current_shop.shop_name
			message_content ='尊敬的{0}，您好，被{1}添加为管理员！'.format(message_name,message_shop_name)
			postdata = dict(account='cf_senguocc',
				password='sg201404',
				mobile=mobile,
				content = message_content)
			headers = dict(Host = '106.ihuyi.cn',connection = 'close')
			r = requests.post(url,data = postdata , headers = headers)
			WxOauth2.post_add_msg(account_info.wx_openid, message_shop_name,account_info.nickname)
			if self.is_pc_browser():
				return self.redirect('/admin/config?action=admin')
			else:
				return self.redirect('/madmin/shopattr?action=admin')
		else:
			if self.is_pc_browser():
				return self.redirect('/admin/config?action=admin&status=fail')
			else:
				return self.redirect('/madmin/shopattr?action=admin&status=fail')

# 账户余额
class ShopBalance(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		self.if_current_shops()
		subpage = 'shopBlance'
		shop = self.current_shop
		shop.is_balance = 0
		self.session.commit()
		shop_id = shop.id
		shop_balance = format(shop.shop_balance,'.2f')
		show_balance = False
		shop_auth = self.current_shop.shop_auth
		has_done = ''
		decline_reason = ''
		apply_value = 0
		available_balance = self.current_shop.available_balance
		if available_balance:
			available_balance = format(available_balance,'.2f')
		else:
			available_balance = format(0,'.2f')
		# print("[AdminShopBalance]available_balance:",available_balance)
		try:
			apply_list = self.session.query(models.ApplyCashHistory).filter_by(shop_id=shop_id)
			apply_cash = apply_list.order_by(desc(models.ApplyCashHistory.create_time)).first()

			has_done = apply_cash.has_done
			decline_reason = apply_cash.decline_reason
			apply_value = apply_cash.value
			if apply_value:
				apply_value = format(apply_value,'.2f')
			else:
				apply_value = format(0,'.2f')

		except:
			print("[AdminShopBalance]no apply_cash found")

		if shop_auth !=0:
			show_balance = True
			return self.render("admin/shop-balance.html",shop_balance = shop_balance,\
				show_balance = show_balance,has_done=has_done,decline_reason=decline_reason,\
				available_balance = available_balance, apply_value=apply_value,context=dict(subpage=subpage))
		else:
			return self.redirect(self.reverse_url('adminHome'))

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments('action','apply_value?:float','alipay_account?:str','account_name?:str','page?:int','code?:int','phone?:str')
	def post(self):
		action = self.args['action']
		shop_id = self.current_shop.id
		page =0
		page_size=10
		page_sum=0
		count=0
		total = 0
		times = 0
		persons = 0
		# 商铺申请提现
		# 提现申请被超级管理员处理后,会产生一条余额变动记录
		if action == "get_code":
			phone = self.args['phone']
			# print("[AdminShopBalance]Cash apply, send verify code to phone:",phone)
			# gen_msg_token(phone=self.args["phone"])
			# return self.send_success()
			admin_phone = self.session.query(models.Shop).filter_by(id = shop_id).first().admin.accountinfo.phone
			if admin_phone == None:
				return send_fail('管理员还未绑定手机号')
			if admin_phone != phone:
				return send_fail('该手机号不是管理员绑定的手机号')
			resault = gen_msg_token(phone = phone)
			if resault == True:
				return self.send_success()
			else:
				return self.send_fail(resault)

		# 申请提现
		elif action == 'cash':
			apply_value = self.args['apply_value']
			if apply_value > self.current_shop.available_balance:
				return self.send_fail("您申请金额大于店铺 可提现的金额，请重新申请")
			alipay_account = self.args['alipay_account']
			account_name = self.args['account_name']
			code = int(self.args['code'])
			shop_id = self.current_shop.id
			shop_code = self.current_shop.shop_code
			shop_auth = self.current_shop.shop_auth
			shop_balance = self.current_shop.shop_balance
			shop_province= self.current_shop.shop_province
			applicant_name = self.current_user.accountinfo.nickname
			phone = self.args['phone']
			if not check_msg_token(phone,code):
				return self.send_fail('验证码过期或不存在')
			if apply_value>shop_balance:
				return self.send_fail('您的店铺没有这么多余额')
			applyCash_history = models.ApplyCashHistory(shop_id = shop_id , value = apply_value ,has_done =0,\
				shop_code = shop_code,shop_auth = shop_auth , shop_balance = shop_balance,alipay_account = \
				alipay_account,applicant_name = applicant_name,account_name = account_name,shop_province=shop_province)
			self.session.add(applyCash_history)
			self.current_shop.update(self.session,alipay_account=alipay_account,alipay_account_name=account_name)
			self.session.commit()
			return self.send_success()

		# 提现记录
		elif action == 'cash_history':
			history = []
			page=int(self.args['page'])-1
			history_list = self.session.query(models.BalanceHistory).filter_by(shop_id = shop_id,balance_type = 2)\
			.order_by(desc(models.BalanceHistory.create_time)).offset(page*page_size).limit(page_size).all()
			q = self.session.query(func.sum(models.BalanceHistory.balance_value),func.count()).filter_by(shop_id = shop_id,balance_type = 2).all()
			count =q[0][1]
			if q[0][0]:
				total=q[0][0]
			total = format(total,'.2f')
			times = count
			page_sum=int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1
			#if not history_list:
			#	print('[AdminShopBalance]cash history_list error')
			for temp in history_list:
				create_time = temp.create_time.strftime("%Y-%m-%d %H:%M:%S")
				shop_totalBalance = temp.shop_totalPrice
				if shop_totalBalance == None:
					shop_totalBalance=0
				shop_totalBalance = format(shop_totalBalance,'.2f')
				history.append({'name':temp.name,'record':temp.balance_record,'time':create_time,'value':temp.balance_value,\
					'type':temp.balance_type,'total':shop_totalBalance})

			return self.send_success(history = history,page_sum=page_sum,total=total,times=times)

		# 所有账单
		elif action == 'all_history':
			history = []
			page=int(self.args['page'])-1
			balance_history = self.session.query(models.BalanceHistory).filter_by(shop_id = shop_id).filter(models.BalanceHistory.balance_type.in_([0,1,2,3,4,5]))
			history_list = balance_history.order_by(desc(models.BalanceHistory.create_time)).offset(page*page_size).limit(page_size).all()
			count =balance_history.count()
			page_sum=int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1
			#if not history_list:
			#	print('[AdminShopBalance]get all history error')
			for temp in history_list:
				create_time = temp.create_time.strftime("%Y-%m-%d %H:%M:%S")
				shop_totalBalance = temp.shop_totalPrice
				value = temp.balance_value
				if temp.balance_type in[1,4,5]:
					value = 0
				if shop_totalBalance == None:
					shop_totalBalance=0
				shop_totalBalance = format(shop_totalBalance,'.2f')
				history.append({'name':temp.name,'record':temp.balance_record,'time':create_time,'value':value,\
					'type':temp.balance_type,'total':shop_totalBalance})
			return self.send_success(history = history,page_sum=page_sum)

		# 用户充值账单
		elif action == 'recharge':
			history = []
			page=int(self.args['page'])-1
			pay = 0
			left = 0
			history_list = self.session.query(models.BalanceHistory).filter_by(shop_id = shop_id,balance_type = 0).\
			order_by(desc(models.BalanceHistory.create_time)).offset(page*page_size).limit(page_size).all()
			q = self.session.query(func.sum(models.BalanceHistory.balance_value),func.count()).filter_by(shop_id = shop_id,balance_type = 0).all()
			q1 = self.session.query(func.sum(models.BalanceHistory.balance_value)).filter_by(shop_id = shop_id,balance_type = 1,is_cancel = 0).all()
			if q[0][0]:
				total =q[0][0]
			count = q[0][1]
			if q1[0][0]:
				pay = q1[0][0]
			total = format(total,'.2f')
			pay = format(pay,'.2f')
			left = float(total)-float(pay)
			left = format(left,'.2f')
			page_sum=int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1
			#if not history_list:
			#	print('[AdminShopBalance]get all recharge error')
			for temp in history_list:
				create_time = temp.create_time.strftime("%Y-%m-%d %H:%M:%S")
				shop_totalBalance = temp.shop_totalPrice
				if shop_totalBalance == None:
					shop_totalBalance=0
				shop_totalBalance = format(shop_totalBalance,'.2f')
				history.append({'name':temp.name,'record':temp.balance_record,'time':create_time,'value':temp.balance_value,\
					'type':temp.balance_type,'total':shop_totalBalance})
			return self.send_success(history = history,page_sum=page_sum,total=total,pay=pay,left=left)

		# 在线支付账单
		elif action == 'online':
			history = []
			page=int(self.args['page'])-1
			history_list = self.session.query(models.BalanceHistory).filter_by(shop_id = shop_id,balance_type = 3)\
			.order_by(desc(models.BalanceHistory.create_time)).offset(page*page_size).limit(page_size).all()
			q = self.session.query(func.sum(models.BalanceHistory.balance_value),func.count()).filter_by(shop_id = shop_id,balance_type =3).all()
			persons = self.session.query(models.BalanceHistory.customer_id).distinct().filter_by(shop_id = shop_id,balance_type = 3).count()
			if q[0][0]:
				total =q[0][0]
			count = q[0][1]
			times = count
			total = format(total,'.2f')
			page_sum=int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1
			#if not history_list:
			#	print('[AdminShopBalance]get all BalanceHistory error')
			for temp in history_list:
				create_time = temp.create_time.strftime("%Y-%m-%d %H:%M:%S")
				shop_totalBalance = temp.shop_totalPrice
				if shop_totalBalance == None:
					shop_totalBalance=0
				shop_totalBalance = format(shop_totalBalance,'.2f')
				history.append({'name':temp.name,'record':temp.balance_record,'time':create_time,'value':temp.balance_value,\
					'type':temp.balance_type,'total':shop_totalBalance})
			return self.send_success(history = history,page_sum=page_sum,total=total,times=times,persons=persons)

		# 余额消费记录
		elif action =='spend':
			history = []
			page=int(self.args['page'])-1
			history_list = self.session.query(models.BalanceHistory).filter_by(shop_id = shop_id).filter(models.BalanceHistory.balance_type.in_([0,1,2,4,5]))\
			.order_by(desc(models.BalanceHistory.create_time)).offset(page*page_size).limit(page_size).all()
			count = self.session.query(models.BalanceHistory).filter_by(shop_id = shop_id).filter(models.BalanceHistory.balance_type.in_([0,1,2,4,5])).count()
			spend_total = self.session.query(func.sum(models.BalanceHistory.balance_value)).filter_by(shop_id = shop_id,balance_type =1,is_cancel = 0).all()
			if spend_total[0][0]:
				total =spend_total[0][0]
			total = format(total,'.2f')
			page_sum = int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1
			#if not history_list:
			#	print('[AdminShopBalance]get all BalanceHistory error')
			for temp in history_list:
				create_time = temp.create_time.strftime("%Y-%m-%d %H:%M:%S")
				shop_totalBalance = temp.shop_totalPrice
				value = temp.balance_value
				if temp.balance_type in[1,4,5]:
					value = 0
				if shop_totalBalance == None:
					shop_totalBalance=0
				shop_totalBalance = format(shop_totalBalance,'.2f')
				history.append({'name':temp.name,'record':temp.balance_record,'time':create_time,'value':value,\
					'type':temp.balance_type,'total':shop_totalBalance})
			return self.send_success(history = history,page_sum=page_sum,total=total,times=times,persons=persons)

		# 可提现额度记录
		elif action == 'available':
			history = []
			page = int(self.args['page']-1)
			history_list = self.session.query(models.BalanceHistory).filter_by(shop_id = shop_id).filter(models.BalanceHistory.balance_type.in_([2,6,7])).\
			order_by(models.BalanceHistory.create_time.desc()).offset(page*page_size).limit(page_size).all()
			count =  self.session.query(models.BalanceHistory).filter_by(shop_id = shop_id).filter(models.BalanceHistory.balance_type.in_([2,6,7])).count()
			page_sum = int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1
			#if not history_list:
			#	print('[AdminShopBalance]get all BalanceHistory error')
			for temp in history_list:
				create_time = ''
				if temp.create_time:
					create_time = temp.create_time.strftime("%Y-%m-%d %H:%M:%S")
				available_balance = temp.available_balance
				if available_balance == None:
					available_balance=0
				available_balance = format(available_balance,'.2f')
				history.append({'record':temp.balance_record,'time':create_time,'value':temp.balance_value,\
					'type':temp.balance_type,'total':available_balance})
			return self.send_success(history = history,page_sum=page_sum)
		else:
			return self.send_fail('action error')

# 店铺设置 - 店铺信息
class ShopConfig(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		self.if_current_shops()
		if self.get_secure_cookie("shop_id"):
			shop_id = int(self.get_secure_cookie("shop_id").decode())
			self.clear_cookie("shop_id", domain=ROOT_HOST_NAME)
			shop = self.session.query(models.Shop).filter_by(id=shop_id).first()
			self.current_shop = shop
			self.set_secure_cookie("shop_id", str(shop.id), domain=ROOT_HOST_NAME)
		city = self.code_to_text("city", self.current_shop.shop_city)
		province = self.code_to_text("province", self.current_shop.shop_province)
		address = self.code_to_text("shop_city", self.current_shop.shop_city) +\
				  " " + self.current_shop.shop_address_detail
		service_area = self.code_to_text("service_area", self.current_shop.shop_service_area)
		lat = self.current_shop.lon
		lon = self.current_shop.lat
		return self.render("admin/shop-info-set.html", city=city,province=province,address=address,lat=lat,lon=lon, \
			service_area=service_area, context=dict(subpage='shop_set',shopSubPage='info_set'))

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action", "data")
	def post(self):
		action = self.args["action"]
		data = self.args["data"]
		# print("[AdminShopConfig]data:",data)
		shop = self.current_shop
		if action == "edit_shop_name":
			shop.shop_name = data["shop_name"]
		elif action == "edit_shop_img":
			return self.send_qiniu_token("shop", shop.id)
		elif action == "edit_shop_logo":
			shop.shop_trademark_url=data["img_url"]
		elif action == "edit_shop_code":
			if len(data["shop_code"]) < 6:
				return self.send_fail("店铺号至少要6位")
			if self.session.query(models.Shop).filter_by(shop_code=data["shop_code"]).first():
				return self.send_fail("店铺号已被注册")
			reserve_code = ('senguo', 'senguocc', 'shuiguobang', 'shuiguo', '000000', '111111', '222222', '333333',
							'444444', '555555', '666666', '777777', '888888', '999999')
			if data["shop_code"] in reserve_code:
				return self.send_fail("该店铺号为系统保留号，不允许注册")
			shop.shop_code = data["shop_code"]
		elif action == "edit_shop_intro":
			shop.shop_intro = data["shop_intro"]
		# woody 2015.3.5
		elif action == "edit_phone":
			shop.shop_phone = data["shop_phone"]
		elif action == "edit_address":
			shop_city = int(data["shop_city"])
			if "lat" in data:
				lat       = float(data["lat"])
				shop.lat       = lat
			if "lon" in data:
				lon       = float(data['lon'])
				shop.lon       = lon
			shop_address_detail = data["shop_address_detail"]
			if shop_city//10000*10000 not in dis_dict:
				return self.send_fail("没有该省份")
			shop.shop_province = shop_city//10000*10000
			shop.shop_city = shop_city
			shop.shop_address_detail = shop_address_detail
			try:
				self_shop_address = self.session.query(models.SelfAddress).filter_by(config_id=shop.config.id,if_default=2).first()
			except:
				self_shop_address = None
			# print("[ShopConfig]shop_address_detail:",shop_address_detail)
			if self_shop_address:
				self_shop_address.address = shop_address_detail
				self_shop_address.lat = lat
				self_shop_address.lon = lon
		elif action == "edit_deliver_area":
			shop.deliver_area = data["deliver_area"]
			if "area_type" in data and data["area_type"] !="":
				shop.area_type  = int(data["area_type"])
			if "roundness" in data and data["roundness"] !="":
				shop.roundness =  data["roundness"]
			if "area_radius" in data and data["area_radius"] !="":
				shop.area_radius  = int(data["area_radius"])
			if "area_list" in data and data["area_list"] !="":
				shop.area_list = data["area_list"]

		elif action == "edit_have_offline_entity":
			shop.have_offline_entity = data["have_offline_entity"]
		elif action =="shop_status":
			shop.status = int(data["shop_status"])
		self.session.commit()
		return self.send_success()

# 店铺设置 - 店铺认证
class ShopAuthenticate(AdminBaseHandler):
	@tornado.web.authenticated
	# @AdminBaseHandler.check_arguments()
	def get(self):
		self.if_current_shops()
		shop_id = self.current_shop.id
		token = self.get_qiniu_token("shopAuth_cookie",shop_id)
		try:
			auth_apply=self.session.query(models.ShopAuthenticate).filter(models.ShopAuthenticate.shop_id == shop_id).\
			order_by(desc(models.ShopAuthenticate.id)).first()
		except:
			auth_apply = None
			print('[AdminShopAuthenticate]auth_apply error')
		person_auth=False
		company_auth=False
		has_done = 0
		apply_type = 0
		decline_reason= ''
		if auth_apply:
			has_done = auth_apply.has_done
			apply_type = auth_apply.shop_type
			decline_reason = auth_apply.decline_reason
			if auth_apply.has_done == 0:
				if auth_apply.shop_type == 1:
					person_auth = True
				if auth_apply.shop_type == 2:
					company_auth =True
		#self.set_secure_cookie('shopAuth',token,domain=ROOT_HOST_NAME)
		return self.render("admin/shop-cert-set.html",context=dict(person_auth=person_auth,company_auth=company_auth,\
			has_done=has_done,apply_type=apply_type,decline_reason=decline_reason,token=token,subpage='shop_set',shopSubPage='cert_set'))

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments('action','data')
	def post(self):
		shop_id = self.current_shop.id
		# print("[AdminShopAuthenticate]current_shop:",self.current_shop)
		action = self.args["action"]
		data = self.args["data"]
		auth_change = self.current_shop.auth_change
		try:
			shop_auth_apply = self.session.query(models.ShopAuthenticate).filter_by(shop_id = shop_id)
		except:
			print('[AdminShopAuthenticate]shop_auth_apply error')
		if action == "get_code":
			# print("[AdminShopAuthenticate]Shop auth, send verify code to phone:,data["phone"])
			# gen_msg_token(phone=self.args["phone"])
			# return self.send_success()
			resault = gen_msg_token(phone=data["phone"])
			if resault == True:
				return self.send_success()
			else:
				return self.send_fail(resault)
		elif action == "customer_auth":
			name = data['name']
			card_id = data['card_id']
			code  = data['code']
			phone = data['phone']
			handle_img = data['handle_img']
			if not check_msg_token(phone,code):
				return self.send_fail('验证码过期或者不正确')
			shop_apply = models.ShopAuthenticate(
				realname = name,
				shop_type = 1,
				card_id = card_id,
				handle_img = handle_img,
				has_done  = 0,
				shop_id = shop_id
				)
			self.session.add(shop_apply)
			self.session.commit()
			return self.send_success()
		elif action == "company_auth":
			name = data['name']
			company_name = data['company_name']
			code = data['code']
			phone = data['phone']
			business_licence = data['business_licence']
			front_img = data['front_img']
			behind_img = data['behind_img']
			if not check_msg_token(phone,code):
				return self.send_fail('验证码过期或者不正确')
			shop_apply = models.ShopAuthenticate(
				realname = name,
				company_name = company_name,
				shop_type = 2,
				business_licence = business_licence,
				front_img = front_img,
				behind_img = behind_img,
				has_done = 0,
				shop_id =shop_id
				)
			self.session.add(shop_apply)
			self.session.commit()
			return self.send_success()

# 营销和玩法
class Marketing(AdminBaseHandler):
	def getcoupon(self,q,data):
		current_shop_id=self.current_shop.id
		current_customer_id=self.current_user.id
		now_date=int(time.time())
		edit_status=None
		for x in q:
			if x.use_goods_group==0:
				use_goods_group="默认分组"
			elif x.use_goods_group==-1:
				use_goods_group="店铺推荐"
			elif x.use_goods_group==-2:
				use_goods_group="所有分组"
			else:
				q1=self.session.query(models.GoodsGroup).filter_by(shop_id=current_shop_id,id=x.use_goods_group).first()
				use_goods_group=q1.name
			if x.use_goods==-1:
				use_goods="所有商品"
			else:
				q1=self.session.query(models.Fruit).filter_by(shop_id=current_shop_id,id=x.use_goods).first()
				use_goods=q1.name
			if now_date<x.from_get_date:
				edit_status=0
			elif now_date<x.to_get_date:
				edit_status=1
			else:
				edit_status=2
			from_valid_date=None
			to_valid_date=None
			last_day=0
			if x.valid_way==0:
				from_valid_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.from_valid_date))
				to_valid_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.to_valid_date))
			else:
				last_day=x.last_day
			from_get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.from_get_date))
			to_get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.to_get_date))
			x_coupon={"shop_id":current_shop_id,"last_day":last_day,"valid_way":x.valid_way,"coupon_id":x.coupon_id,"coupon_money":x.coupon_money,"get_limit":x.get_limit,"use_rule":x.use_rule,"use_goods_group":use_goods_group,"use_number":x.use_number,"edit_status":edit_status,\
			"get_number":x.get_number,"total_number":x.total_number,"use_goods":use_goods,"from_valid_date":from_valid_date,"to_valid_date":to_valid_date,"from_get_date":from_get_date,"to_get_date":to_get_date,"get_rule":x.get_rule,"closed":x.closed}
			data.append(x_coupon)
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action:str","data?:str","coupon_id?:int","select_rule?:int","coupon_type?:int","page?")
	def get(self):
		self.if_current_shops()
		action = self.args["action"]
		current_shop_id=self.current_shop.id
		current_shop=self.current_shop
		current_customer_id=self.current_user.id
		self.updatecoupon(current_customer_id)
		if action == "lovewall":
			return self.render("admin/lovewall.html",context=dict(subpage='marketing',subpage2='love_wall'))
		elif action=="coupon":
			coupon_type=self.args["coupon_type"]
			m=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_type=coupon_type).count()
			data=[]
			data1=[]
			status=[]
			use_goods_group=None
			use_goods=None
			q1=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_type=0,closed=0).order_by(models.CouponsShop.create_date.desc()).all()
			q2=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_type=0,closed=1).order_by(models.CouponsShop.create_date.desc()).all()
			self.getcoupon(q1,data)
			self.getcoupon(q2,data)
			q1=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_type=1,closed=0).order_by(models.CouponsShop.create_date.desc()).all()
			q2=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_type=1,closed=1).order_by(models.CouponsShop.create_date.desc()).all()
			self.getcoupon(q1,data1)
			self.getcoupon(q2,data1)
			coupon_active=self.session.query(models.Marketing).filter_by(id=current_shop_id).first().coupon_active
			return self.render("admin/coupon.html",output_data=data,data1=data1,coupon_active_cm=coupon_active,context=dict(subpage='marketing',subpage2='coupon'))
		elif action=="newcoupon":
			pass
		elif action=="details":
			coupon_type=self.args["coupon_type"]
			max_item=12
			coupon_id=int(self.args["coupon_id"])
			coupon_type=int(self.args["coupon_type"])
			data=[]
			qget=[]
			qnoget=[]
			qgetnum=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_type=coupon_type).filter(models.CouponsCustomer.coupon_status!=0).count()
			qnogetnum=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_type=coupon_type,coupon_status=0).count()
			if qgetnum>=12:
				qget=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_type=coupon_type).filter(models.CouponsCustomer.coupon_status!=0).order_by(models.CouponsCustomer.get_date).offset(0).limit(max_item).all()
				qnoget=[]
			else:
				qget=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_type=coupon_type).filter(models.CouponsCustomer.coupon_status!=0).all()
				qnoget=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_type=coupon_type,coupon_status=0).offset(0).limit(max_item-qgetnum).all()
			for x in qget:
				customer_id=None
				get_date=None
				use_date=None
				order_id=None
				nickname=None
				headimgurl=None
				if x.coupon_status==0:
					pass
				elif x.coupon_status==1:
					customer=self.session.query(models.Accountinfo).filter_by(id=x.customer_id).first()
					nickname=customer.nickname
					headimgurl=customer.headimgurl
					customer_id=x.customer_id
					get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.get_date))
					use_date="未使用"
					order_id="未使用"
				elif x.coupon_status==2:
					customer=self.session.query(models.Accountinfo).filter_by(id=x.customer_id).first()
					nickname=customer.nickname
					headimgurl=customer.headimgurl
					customer_id=x.customer_id
					get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.get_date))
					use_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.use_date))
					order_id=x.order_id
				else:
					pass
				q1=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_type=coupon_type).first()
				x_coupon={"nickname":nickname,"coupon_status":x.coupon_status,"coupon_money":q1.coupon_money,"customer_id":customer_id,\
				"get_date":get_date,"use_date":use_date,"order_id":order_id,"coupon_key":x.coupon_key}
				data.append(x_coupon)
			for x in qnoget:
				customer_id=None
				get_date=None
				use_date=None
				order_id=None
				nickname=None
				headimgurl=None
				if x.coupon_status==0:
					pass
				elif x.coupon_status==1:
					customer=self.session.query(models.Accountinfo).filter_by(id=x.customer_id).first()
					nickname=customer.nickname
					headimgurl=customer.headimgurl
					customer_id=x.customer_id
					get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.get_date))
					use_date="未使用"
					order_id="未使用"
				elif x.coupon_status==2:
					customer=self.session.query(models.Accountinfo).filter_by(id=x.customer_id).first()
					nickname=customer.nickname
					headimgurl=customer.headimgurl
					customer_id=x.customer_id
					get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.get_date))
					use_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.use_date))
					order_id=x.order_id
				else:
					pass
				q1=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_type=coupon_type).first()
				x_coupon={"nickname":nickname,"coupon_status":x.coupon_status,"coupon_money":q1.coupon_money,"customer_id":customer_id,\
				"get_date":get_date,"use_date":use_date,"order_id":order_id,"coupon_key":x.coupon_key}
				data.append(x_coupon)
				data=data[0:max_item]
			q=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_type=coupon_type,coupon_id=coupon_id).first()
			d=0
			q1=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id)
			if q.closed==0:
				d=q1.filter_by(coupon_status=3).count()
			else:
				d1=q1.filter_by(coupon_status=3).count()
				d2=q1.filter_by(coupon_status=0).count()
				d=d1+d2
			total=int(q.total_number/12)
			if total==0:
				total=1
			data1={"a":q.total_number,"b":q.get_number,"c":q.use_number,"d":d,"total":total}
			return self.render("admin/details.html",output_data=data,data1=data1,coupon_type=coupon_type,context=dict(subpage='marketing'))
		elif action=="newcouponpage":
			create_date=int(time.time())
			coupon_type=int(self.args["coupon_type"])
			data=[]
			data0=[]
			data1=[]
			x_goodsgroup={"group_id":0,"group_name":"默认分组"}
			data.append(x_goodsgroup)
			q1=self.session.query(models.Fruit).filter_by(shop_id=current_shop_id,group_id=0,active=1)
			for y in q1:
				x_goodsgroup={"goods_id":y.id,"goods_name":y.name}
				data0.append(x_goodsgroup)
			data1.append(data0)
			data0=[]
			x_goodsgroup={"group_id":-1,"group_name":"店铺推荐"}
			data.append(x_goodsgroup)
			q1=self.session.query(models.Fruit).filter_by(shop_id=current_shop_id,group_id=-1,active=1)
			for y in q1:
				x_goodsgroup={"goods_id":y.id,"goods_name":y.name}
				data0.append(x_goodsgroup)
			data1.append(data0)
			data0=[]
			q=self.session.query(models.GoodsGroup).filter_by(shop_id=current_shop_id,status=1).all()
			for x in q:
				x_goodsgroup={"group_id":x.id,"group_name":x.name}
				data.append(x_goodsgroup)
				q1=self.session.query(models.Fruit).filter_by(shop_id=current_shop_id,group_id=x.id,active=1)
				for y in q1:
					x_goodsgroup={"goods_id":y.id,"goods_name":y.name}
					data0.append(x_goodsgroup)
				data1.append(data0)
				data0=[]
			return self.render("admin/newcoupon.html",output_data=data,data1=data1,coupon_type=coupon_type,context=dict(subpage='marketing'))
		elif action=="editcouponpage":
			coupon_id=int(self.args["coupon_id"])
			data=[]
			data0=[]
			data1=[]
			pre_coupon={}
			x_goodsgroup={"group_id":0,"group_name":"默认分组"}
			data.append(x_goodsgroup)
			q1=self.session.query(models.Fruit).filter_by(shop_id=current_shop_id,group_id=0,active=1)
			for y in q1:
				x_goodsgroup={"goods_id":y.id,"goods_name":y.name}
				data0.append(x_goodsgroup)
			data1.append(data0)
			data0=[]
			x_goodsgroup={"group_id":-1,"group_name":"店铺推荐"}
			data.append(x_goodsgroup)
			q1=self.session.query(models.Fruit).filter_by(shop_id=current_shop_id,group_id=-1,active=1)
			for y in q1:
				x_goodsgroup={"goods_id":y.id,"goods_name":y.name}
				data0.append(x_goodsgroup)
			data1.append(data0)
			data0=[]
			q=self.session.query(models.GoodsGroup).filter_by(shop_id=current_shop_id,status=1).all()
			for x in q:
				x_goodsgroup={"group_id":x.id,"group_name":x.name}
				data.append(x_goodsgroup)
				q1=self.session.query(models.Fruit).filter_by(shop_id=current_shop_id,group_id=x.id,active=1)
				for y in q1:
					x_goodsgroup={"goods_id":y.id,"goods_name":y.name}
					data0.append(x_goodsgroup)
				data1.append(data0)
				data0=[]
			q=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_id=coupon_id).first()
			now_date=int(time.time())
			if now_date<q.from_get_date:
				edit_status=0
			elif now_date<q.to_get_date:
				edit_status=1
			else:
				edit_status=2
			from_get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(q.from_get_date))
			to_get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(q.to_get_date))
			from_valid_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(q.from_valid_date))
			to_valid_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(q.from_valid_date))
			if q.use_goods_group==0:
				use_goods_group="默认分组"
			elif q.use_goods_group==-1:
				use_goods_group="店铺推荐"
			elif q.use_goods_group==-2:
				use_goods_group="所有分组"
			else:
				q1=self.session.query(models.GoodsGroup).filter_by(shop_id=current_shop_id,id=q.use_goods_group).first()
				use_goods_group=q1.name
			if q.use_goods==-1:
				use_goods="所有分组"
			else:
				q1=self.session.query(models.Fruit).filter_by(shop_id=current_shop_id,id=q.use_goods).first()
				use_goods=q1.name
			pre_coupon={"coupon_id":coupon_id,"coupon_type":q.coupon_type,"from_get_date":from_get_date,"to_get_date":to_get_date,"get_rule":q.get_rule, "coupon_money":q.coupon_money,"use_rule":q.use_rule,\
				"total_number":q.total_number,"get_limit":q.get_limit,"use_goods_group":use_goods_group,"use_goods":use_goods,"valid_way":q.valid_way,"from_valid_date":from_valid_date,\
    				"to_valid_date":to_valid_date,"start_day":0,"last_day":q.last_day,"edit_status":edit_status}
			return self.render("admin/editcoupon.html",output_data=data,data1=data1,pre_coupon=pre_coupon,context=dict(subpage='marketing'))
		elif action=="close_one":
			data=self.args["data"]
			coupon_id=int(self.args["coupon_id"])
			q=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_id=coupon_id).first()
			q.closed=1
			self.session.commit()
			return self.send_success()

	@AdminBaseHandler.check_arguments("action:str","data?","coupon_id?:int","select_rule?:int","coupon_type?:int")
	def post(self):
		action = self.args["action"]
		current_shop_id = self.current_shop.id
		current_shop=self.current_shop
		current_customer_id=self.current_user.id
		self.updatecoupon(current_customer_id)
		if action == "confess_active":
			active = current_shop.marketing.confess_active
			current_shop.marketing.confess_active = 0 if active == 1 else 1
		elif action == "confess_notice":
			current_shop.marketing.confess_notice = self.args["data"]
		elif action =="confess_type":
			_type = current_shop.marketing.confess_type
			# print("[AdminMarketing]_type:",_type)
			current_shop.marketing.confess_type = 0 if _type == 1 else 1
		elif action == "confess_only":
			only = current_shop.marketing.confess_only
			current_shop.marketing.confess_only = 0 if only == 1 else 1

		elif action=="newpage":
			data=[]
			q=self.session.query(models.GoodsGroup).filter_by(shop_id=current_shop_id,status=1).all()
			for x in q:
				x_goodsgroup={"group_id":x.id,"group_name":x.name}
				data.append(x_goodsgroup)
			return self.render("admin/newcoupon.html",output_data=data,context=dict(subpage='coupon'))
		elif action=="newcoupon":
			data=self.args["data"]
			coupon_type=int(data["coupon_type"])
			x=data["from_get_date"]
			from_get_date=int(time.mktime(time.strptime(x,'%Y-%m-%d %H:%M:%S')))
			x=data["to_get_date"]
			to_get_date=int(time.mktime(time.strptime(x,'%Y-%m-%d %H:%M:%S')))
			coupon_money=float(data["coupon_money"])
			use_rule=float(data["use_rule"])
			total_number=int(data["total_number"])
			if total_number>1000:
				return self.send_fail("您输入的库存量不能大于1000，请核对后提交！")
			get_limit=int(data["get_limit"])
			use_goods_group=int(data["use_goods_group"])
			use_goods=int(data["use_goods"])
			get_rule = float(data["get_rule"])
			valid_way=int(data["valid_way"])
			from_valid_date=None
			to_valid_date=None
			start_day=None
			last_day=None
			create_date=int(time.time())
			if valid_way==0:
				x=data["from_valid_date"]
				from_valid_date=int(time.mktime(time.strptime(x,'%Y-%m-%d %H:%M:%S')))
				to_valid_date=int(time.mktime(time.strptime(data["to_valid_date"],'%Y-%m-%d %H:%M:%S')))
			else :
				start_day=data["start_day"]
				last_day=data["last_day"]
			#  注意这里获得coupon_id的过程 相当的曲折 ，这里的a 识query类型  而a[0]识 result 类型 只有a[0][0]才是int类型
			coupon_id=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id).count()+1
			new_coupon=models.CouponsShop(shop_id=current_shop_id,coupon_id=coupon_id,coupon_type=coupon_type,coupon_money=coupon_money,\
				from_get_date=from_get_date,to_get_date=to_get_date,use_goods_group=use_goods_group,use_goods=use_goods,use_rule=use_rule,\
				total_number=total_number,use_number=0,get_number=0,valid_way=valid_way,from_valid_date=from_valid_date,\
				to_valid_date=to_valid_date,start_day=start_day,last_day=last_day,get_limit=get_limit,closed=0,get_rule=get_rule,create_date=create_date)
			self.session.add(new_coupon)
			for i in range(0,total_number):
				chars='0123456789abcdefghijklmnopqrstuvwxyz'
				chars=''.join(random.sample(chars*10,4))
				chars=chars+str(coupon_id)+'C'+str(i)+'M'+str(current_shop_id)
				new_coupon=models.CouponsCustomer(shop_id=current_shop_id,coupon_id=coupon_id,coupon_key=chars,coupon_type=coupon_type,coupon_status=0)
				self.session.add(new_coupon)
			self.session.commit()
			return self.send_success()
		elif action=="editcoupon":
			data=self.args["data"]
			coupon_type=int(data["coupon_type"])
			x=data["from_get_date"]
			from_get_date=int(time.mktime(time.strptime(x,'%Y-%m-%d %H:%M:%S')))
			x=data["to_get_date"]
			to_get_date=int(time.mktime(time.strptime(x,'%Y-%m-%d %H:%M:%S')))
			coupon_money=float(data["coupon_money"])
			use_rule=float(data["use_rule"])
			total_number=int(data["total_number"])
			if total_number>1000:
				return self.send_fail("您输入的库存量不能大于1000，请核对后提交！")
			get_limit=int(data["get_limit"])
			use_goods_group=int(data["use_goods_group"])
			use_goods=int(data["use_goods"])
			get_rule = float(data["get_rule"])
			valid_way=int(data["valid_way"])
			coupon_id=int(data["coupon_id"])
			edit_status=int(data["edit_status"])
			from_valid_date=None
			to_valid_date=None
			start_day=None
			last_day=None
			if valid_way==0:
				x=data["from_valid_date"]
				from_valid_date=int(time.mktime(time.strptime(x,'%Y-%m-%d %H:%M:%S')))
				to_valid_date=int(time.mktime(time.strptime(data["to_valid_date"],'%Y-%m-%d %H:%M:%S')))
			elif valid_way==1:
				start_day=data["start_day"]
				last_day=data["last_day"]
			else:
				pass
			#  注意这里获得coupon_id的过程 相当的曲折 ，这里的a 识query类型  而a[0]识 result 类型 只有a[0][0]才是int类型 这里是大傻逼
			now_date=int(time.time())
			q=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_type=coupon_type).first()
			if now_date<q.from_get_date:
				q.update(self.session,coupon_money=coupon_money,from_get_date=from_get_date,to_get_date=to_get_date,use_goods_group=use_goods_group,use_goods=use_goods,use_rule=use_rule,\
				total_number=total_number,valid_way=valid_way,from_valid_date=from_valid_date,\
				to_valid_date=to_valid_date,start_day=start_day,last_day=last_day,get_limit=get_limit,closed=0,get_rule=get_rule)
			elif now_date<q.to_get_date:
				q=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_type=coupon_type).first()
				for x in range(q.total_number,total_number):
					chars=string.digits+string.ascii_letters
					chars=''.join(random.sample(chars*10,4))
					chars=chars+str(coupon_id)+'C'+str(x)+'M'+str(current_shop_id)
					new_coupon=models.CouponsCustomer(shop_id=current_shop_id,coupon_id=coupon_id,coupon_key=chars,coupon_type=coupon_type,coupon_status=0)
					self.session.add(new_coupon)
				q.update(self.session,total_number=total_number,to_get_date=to_get_date)
			self.session.commit()
			return self.send_success(coupon_type=coupon_type)
		elif action=="details":
			data=self.args["data"]
			coupon_id=int(self.args["coupon_id"])
			select_rule=int(data["select_rule"])
			coupon_type=int(data["coupon_type"])
			page=int(data["page"])
			max_item=12
			end=page*max_item
			start=(page-1)*max_item
			data=[]
			q=[]
			qget=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=1).all()
			quse=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=2).all()
			qvalid=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=3).all()
			if select_rule==0:
				q=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id).order_by(models.CouponsCustomer.coupon_status).offset(start).limit(max_item).all()
			elif select_rule==1:
				qgetnum=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=1).count()
				qusenum=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=2).count()
				qvalidnum=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=3).count()
				if end<=qgetnum:
					q=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=1).order_by(models.CouponsCustomer.get_date).offset(start).limit(max_item).all()
				elif end>qgetnum  and start<=qgetnum:
					if end<=qusenum+qgetnum:
						qget=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=1).order_by(models.CouponsCustomer.get_date).offset(start).limit(qgetnum-start).all()
						quse=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=2).order_by(models.CouponsCustomer.use_date).offset(0).limit(max_item-qgetnum+start).all()
						q=qget+quse
					else :
						qget=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=1).order_by(models.CouponsCustomer.get_date).offset(start).limit(qgetnum-start).all()
						quse=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=2).order_by(models.CouponsCustomer.use_date).all()
						qvalid=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=3).order_by(models.CouponsCustomer.get_date).offset(0).limit(max_item-qgetnum-qusenum+start).all()
						q=qget+quse+qvalid
				elif start>qgetnum and end<=qgetnum+qusenum:
					q=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=2).order_by(models.CouponsCustomer.use_date).offset(start).limit(max_item).all()
				elif start>qgetnum and end>qgetnum+qusenum:
					quse=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=2).order_by(models.CouponsCustomer.use_date).offset(start).limit(qusenum-start).all()
					qvalid=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=3).order_by(models.CouponsCustomer.use_date).offset(0).limit(max_item-qgetnum-qusenum+start).all()
					q=quse+qvalid
				elif start>qusenum+qgetnum:
					q=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=3).order_by(models.CouponsCustomer.use_date).offset(start).limit(max_item).all()
			elif select_rule==2:
				q=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=2).order_by(models.CouponsCustomer.use_date).offset(start).limit(max_item).all()
			else :
				qq=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_id=coupon_id).first()
				if qq.closed==0:
					# qn=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=3).order_by(models.CouponsCustomer.use_date).offset(0).limit(max_item-qgetnum-qusenum+start).all()
					q=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=3).order_by(models.CouponsCustomer.get_date).offset(start).limit(max_item).all()
				else:
					qvalidnum=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=3).count()
					if end<=qvalidnum:
						q=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=3).order_by(models.CouponsCustomer.get_date).offset(start).limit(max_item).all()
					elif start<=qvalidnum:
						qgetvalid=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=3).order_by(models.CouponsCustomer.get_date).offset(start).limit(qvalidnum-start).all()
						qvalid=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=0).offset(0).limit(max_item-qvalidnum+start).all()
						q=qgetvalid+qvalid
					elif start>qvalidnum:
						q=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_status=0).offset(start).limit(max_item).all()
			for x in q:
				customer_id=None
				get_date=None
				use_date=None
				order_id=None
				nickname=None
				if x.coupon_status==0:
					pass
				elif x.coupon_status==1:
					customer=self.session.query(models.Accountinfo).filter_by(id=x.customer_id).first()
					nickname=customer.nickname
					customer_id=x.customer_id
					get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.get_date))
					use_date="未使用"
					order_id="未使用"
				elif x.coupon_status==2:
					customer=self.session.query(models.Accountinfo).filter_by(id=x.customer_id).first()
					nickname=customer.nickname
					customer_id=x.customer_id
					get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.get_date))
					use_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.use_date))
					order_id=x.order_id
				else:
					pass
				qq=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_id=x.coupon_id).first()
				x_coupon={"coupon_key":x.coupon_key,"coupon_id":x.coupon_id,"coupon_money":qq.coupon_money,"customer_id":customer_id,\
				"nickname":nickname,"get_date":get_date,"use_date":use_date,"order_id":order_id,"coupon_status":x.coupon_status,"close":qq.closed}
				data.append(x_coupon)
			return self.send_success(output_data=data,context=dict(subpage='coupon')) 

		elif action=="close_one":
			data=self.args["data"]
			coupon_id=int(self.args["coupon_id"])
			q=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_id=coupon_id).first()
			q.closed=1
			self.session.commit()
			return self.send_success()
		elif action=="close_all":
			q=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id).all()
			for x in q:
				if  x.closed==1:
					pass
				else:
					x.closed=1
			self.session.flush()
			q=self.session.query(models.Marketing).filter_by(id=current_shop_id).first()
			if q.coupon_active==0:
				q.coupon_active=1
			else:
				q.coupon_active=0
			coupon_active=q.coupon_active
			self.session.commit()
			return self.send_success(coupon_active_cm=coupon_active)
		else:
			return self.send_fail('something must wrong')
		self.session.commit()
		return self.send_success()

# 营销和玩法 - 告白墙管理
class Confession(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action?:str", "page?:int")
	def get(self):
		self.if_current_shops()
		action = self.args["action"]
		page = self.args["page"]
		page_size = 10
		pages=0
		confession = ''
		datalist = []
		q = self.session.query(models.ConfessionWall,
			models.Accountinfo,models.ConfessionWall.create_time).outerjoin(
			models.Accountinfo,
			models.ConfessionWall.customer_id == models.Accountinfo.id).filter(
			models.ConfessionWall.shop_id==self.current_shop.id,
			models.ConfessionWall.status == 1).distinct(models.ConfessionWall.id)
		count = q.count()
		pages = int(count/page_size) if count % page_size == 0 else int(count/page_size) + 1
		if action == 'all':
			q = q.order_by(models.ConfessionWall.create_time).offset(page * page_size).limit(page_size)
		elif action == 'hot':
			q = q.order_by(models.ConfessionWall.great.desc()).offset(page * page_size).limit(page_size)
		for temp in q:
			# print("[AdminConfession]temp.ConfessionWall.id:",temp.ConfessionWall.id,", temp.Accountinfo.id:",temp.Accountinfo.id)
			datalist.append(dict(
				id = temp.ConfessionWall.id,
				user = temp.Accountinfo.nickname,
				imgurl = temp.Accountinfo.headimgurl_small,
				time = temp.create_time.strftime('%Y-%m-%d %H:%M:%S'),
				name = temp.ConfessionWall.other_name,
				type = temp.ConfessionWall.confession_type,
				confession = temp.ConfessionWall.confession ,
				great = temp.ConfessionWall.great,
				comment = temp.ConfessionWall.comment,
				floor = temp.ConfessionWall.floor,
				sex   = temp.Accountinfo.sex,
				address= temp.ConfessionWall.other_address,
				phone = temp.ConfessionWall.other_phone))
		
		return self.render("admin/confession.html", action = action, datalist=datalist, pages=pages,context=dict(subpage='marketing'))

	@AdminBaseHandler.check_arguments("action:str", "data")
	def post(self):
		action = self.args["action"]
		if action == 'del_confess':
			_id = self.args["data"]["id"]
			q = self.session.query(models.ConfessionWall).filter_by( id = _id).first()
			q.status = 0
			self.session.commit()
		return self.send_success()

# 店铺设置 - 微信消息
class MessageManage(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		self.if_current_shops()
		return self.render('admin/shop-wx-set.html',context=dict(subpage='shop_set',shopSubPage='wx_set'))

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments('action?:str','mp_name?:str','mp_appid?:str','mp_appsecret?:str')
	def post(self):
		action = self.args['action']
		if action == 'add_mp':
			mp_name = self.args['mp_name']
			mp_appid= self.args['mp_appid']
			mp_appsecret = self.args['mp_appsecret']
			try:
				shop_admin = self.session.query(models.ShopAdmin).filter_by(id = self.current_user.id).one()
			except:
				return self.send_fail('shop_admin not found')
			shop_admin.has_mp  = 1   #管理员有自己的平台
			shop_admin.mp_name = mp_name
			shop_admin.mp_appid = mp_appid
			shop_admin.mp_appsecret = mp_appsecret
			self.session.commit()
			return self.send_success()

# 无线打印
class WirelessPrint(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments('action?:str',"data?")
	def post(self):
		import hashlib
		import time
		import requests
		action=self.args["action"]
		_data=self.args["data"]
		print_type = self.current_shop.config.receipt_type
		wireless_type =  self.current_shop.config.wireless_type

		if  print_type ==1 :
			if "order_list_id" in _data:
				list_id = _data["order_list_id"]
				orders = self.session.query(models.Order).filter(models.Order.id.in_(list_id)).all()
			elif "id" in _data:
				order_id=int(_data["id"])
				orders  = self.session.query(models.Order).filter_by(id=order_id).all()
			if action in ["ylyprint","ylyadd"]:
				partner='1693' #用户ID
				apikey='664466347d04d1089a3d373ac3b6d985af65d78e' #API密钥
				username='senguo' #用户名
				mobilephone='13800138000' #打印机内的手机号
				timenow=str(int(time.time())) #当前时间戳
				printname='senguo'+timenow #打印机名称
				if action == "ylyprint" :
					if wireless_type == 0:
						self.orderData(orders,"ylyprint")
					else:
						return self.send_fail("请设置为易联云无线打印")
				elif action == "ylyadd":
					machine_code = _data["num"] #打印机终端号
					msign = _data["key"] #打印机密钥
					sign=apikey+'partner'+partner+'machine_code'+machine_code+'username'+username+'printname+'+printname+'mobilephone'+mobilephone+'msign'+msign+msign #生成的签名加密
					sign=hashlib.md5(sign.encode('utf-8')).hexdigest().upper()
					data={"partner":partner,"machine_code":machine_code,"username":username,"printname":printname,"mobilephone":mobilephone,"msign":msign,"sign":sign}
					r=requests.post("http://open.10ss.net:8888/addprint.php",data=data)

					# print("======WirelessPrint Back======")
					# print("res url        :",r.url)
					# print("res status_code:",r.status_code)
					# print("res text       :",r.text)
					# print("==============================")
					text = int(r.text)
					if text == 1:
						return self.send_success()
					elif text == 2:
						return self.send_success()
					elif text == 3:
						return self.send_fail("打印机添加失败")
					elif text == 4:
						return self.send_fail("签名错误")
					elif text == 5:
						return self.send_fail("用户验证失败")
					elif text == 6:
						return self.send_fail("打印机终端号错误")
					else:
						return self.send_fail("未知错误")

			elif action in ["fyprint","fyadd"]:
				import re
				if action == "fyprint":
					if wireless_type == 1:
						self.orderData(orders,"fyprint")
					else:
						return self.send_fail("请设置为飞印无线打印")
				elif action == "fyadd":
					# s = requests.Session()
					headers = {"Cookie":"__utmt=1; sessionid=d2e9cb1cd2c64639f4e18019d35343ee; username=; usertype=1; account=7502; key=e506eb41e1c43558a6abd7618321b6aa; __utma=240375839.1986845255.1436857060.1437040538.1437050867.4; __utmb=240375839.5.10.1437050867; __utmc=240375839; __utmz=240375839.1436857060.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none)","Host":"my.feyin.net","Referer":"http://my.feyin.net/crm/accountIndex","User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.89 Safari/537.36","Connection":"keep-alive"}
					data = {"deviceCode":_data["deviceCode"],"installAddress":"","simCode":"","groupname":""}
					r = requests.post("http://my.feyin.net/activeDevice",data=data,headers=headers)
					content = r.content.decode("utf-8")
					pattern = re.compile('终端编号不存在',re.S)
					result = re.search(pattern,content)
					if result:
						return self.send_fail("终端编号不存在")
					else:
						return self.send_success()
		else:
			return self.send_fail("您当前的打印模式不是无线打印模式")

	def orderData(self,orders,action):
		import hashlib
		import time
		import requests
		for order in orders:
			order_num = order.num
			order_time = order.create_date.strftime("%Y-%m-%d %H:%M")
			phone = order.phone
			receiver = order.receiver
			address = order.address_text
			send_time = order.send_time
			message = order.message
			fruits = eval(order.fruits)
			totalPrice = str(order.totalPrice)
			pay_type = order.pay_type
			receipt_msg = self.current_shop.config.receipt_msg
			if not receipt_msg:
				receipt_msg = ""
			if not message:
				message = "无"
			if pay_type == 1:
				_type = "货到付款"
			elif pay_type == 2:
				_type = "余额支付"
			elif pay_type == 3:
				_type = "在线支付"
			i=1
			fruit_list = []
			fruits = sorted(fruits.items(), key=lambda d:d[0])
			for key in fruits:
				fruit_list.append(str(i)+":"+key[1]["fruit_name"]+"  "+key[1]["charge"]+" * "+str(key[1]["num"])+"\r\n")
				i = i +1
			if action == "ylyprint":
				#打印内容
				content="@@2              订单信息\r\n"+\
						"------------------------------------------------\r\n"+\
						"订单编号："+order_num+"\r\n"+\
						"下单时间："+order_time+"\r\n"+\
						"顾客姓名："+receiver+"\r\n"+\
						"顾客电话："+phone+"\r\n"+\
						"配送时间："+send_time+"\r\n"+\
						"配送地址："+address+"\r\n"+\
						"买家留言："+message+"\r\n"+\
						"------------------------------------------------\r\n"+\
						"@@2             商品清单\r\n"+\
						"------------------------------------------------\r\n"+\
						''.join(fruit_list)+"\r\n"+\
						"\r\n"+\
						"总价："+totalPrice+"元\r\n"+\
						"支付方式："+_type+"\r\n"+\
						"------------------------------------------------\r\n"+\
						"\r\n"+receipt_msg+"\r\n"
				partner='1693' #用户ID
				apikey='664466347d04d1089a3d373ac3b6d985af65d78e' #API密钥
				timenow=str(int(time.time())) #当前时间戳
				machine_code=self.current_shop.config.wireless_print_num #打印机终端号 520
				mkey=self.current_shop.config.wireless_print_key#打印机密钥 110110
				if machine_code and mkey:
					sign=apikey+'machine_code'+machine_code+'partner'+partner+'time'+timenow+mkey #生成的签名加密
					sign=hashlib.md5(sign.encode("utf-8")).hexdigest().upper()
				else:
					print('[WirelessPrint]sign error')
					sign = None
				data={"partner":partner,"machine_code":machine_code,"content":content,"time":timenow,"sign":sign}
				r=requests.post("http://open.10ss.net:8888",data=data)

				# print("======WirelessPrint======")
				# print("res url        :",r.url)
				# print("res status_code:",r.status_code)
				# print("res text       :",r.text)
				# print("=========================")

			elif action == "fyprint":
				reqTime = int(time.time()*1000)
				memberCode = 'e6f90e5826b011e5a1b652540008b6e6' #商户编码
				API_KEY = '47519b0f' #API密钥（ API_KEY ）
				deviceNo = self.current_shop.config.wireless_print_num #飞印打印机的设备编码 9602292847397158/test
				mode = 2
				#打印内容
				msgDetail = "        <Font# Bold=1 Width=2 Height=2>订单信息</Font#>\n"+\
							"-------------------------\n"+\
							"订单编号："+order_num+"\n"+\
							"下单时间："+order_time+"\n"+\
							"顾客姓名："+receiver+"\n"+\
							"顾客电话："+phone+"\n"+\
							"配送时间："+send_time+"\n"+\
							"配送地址："+address+"\n"+\
							"买家留言："+message+"\n"+\
							"-------------------------\n"+\
							"        <Font# Bold=1 Width=2 Height=2>商品清单</Font#>\n"+\
							"-------------------------\n"+\
							''.join(fruit_list)+"\r\n"+\
							"\n"+\
							"总价："+totalPrice+"元\n"+\
							"支付方式："+_type+"\n"+\
							"-------------------------\n"+\
							"\n"+receipt_msg+"\n"

				content = memberCode+msgDetail+deviceNo+str(reqTime)+API_KEY
				securityCode = hashlib.md5(content.encode('utf-8')).hexdigest()
				data={"reqTime":reqTime,"securityCode":securityCode,"memberCode":memberCode,"deviceNo":deviceNo,"mode":mode,"msgDetail":msgDetail}
				r=requests.post("http://my.feyin.net/api/sendMsg",data=data)
				# print(r.url)
				# print(r.status_code)
				# print(r.text)
