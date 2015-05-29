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

# 登陆处理
class Access(AdminBaseHandler):
	def initialize(self, action):
		self._action = action
	def prepare(self):
		"""prepare会在get、post等函数运行前运行，如果不想父类的prepare函数起作用的话就把他覆盖掉"""
		pass
	def get(self):
		next_url = self.get_argument('next', '')
		if self._action == "login":
			next_url = self.get_argument("next", "")
			return self.render("admin/login.html",
								 context=dict(next_url=next_url))
		elif self._action == "logout":
			self.clear_cookie("shop_id", domain=ROOT_HOST_NAME)
			self.clear_current_user()
			return self.redirect(self.reverse_url("OfficialHome"))
		elif self._action == "oauth":
			self.handle_oauth()
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
		code =self.args["code"]
		mode = self.args["mode"]
		# print("[微信登录]登录模式：", mode , "，返回码：", code)
		if mode not in ["mp", "kf"]:
			return self.send_error(400)

		userinfo = self.get_wx_userinfo(code, mode)
		if not userinfo:
			return self.redirect(self.reverse_url("adminLogin"))
		u = models.ShopAdmin.register_with_wx(self.session, userinfo)
		self.set_current_user(u, domain=ROOT_HOST_NAME)

		next_url = self.get_argument("next", self.reverse_url("OfficialHome"))
		return self.redirect(next_url)

# 商家后台首页
class Home(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		# if not self.current_user.shops:
		#     return self.write("你还没有店铺，请先申请")
		# if not self.current_shop: #设置默认店铺
		#     self.current_shop=self.current_user.shops[0]
		#     self.set_secure_cookie("shop_id", str(self.current_shop.id), domain=ROOT_HOST_NAME)

		# 用于标识是否显示  店铺 余额
		show_balance = False

		shop_auth =  self.current_shop.shop_auth
		if shop_auth in [1,2]:
			show_balance = True
		order_sum = self.session.query(models.Order).filter(models.Order.shop_id==self.current_shop.id,\
			not_(models.Order.status.in_([-1,0]))).count()
		new_order_sum = order_sum - (self.current_shop.new_order_sum or 0)
		# self.current_shop.new_order_sum = order_sum

		follower_sum = self.session.query(models.CustomerShopFollow).filter_by(shop_id=self.current_shop.id).count()
		new_follower_sum = follower_sum - (self.current_shop.new_follower_sum or 0)
		self.current_shop.new_follower_sum = follower_sum

		new_sys_notices = self.session.query(models.SysNotice).\
			filter((models.SysNotice.create_time >= datetime.datetime.now()-datetime.timedelta(10))).all()
		sys_notices = self.session.query(models.SysNotice).\
			filter((models.SysNotice.create_time < datetime.datetime.now()-datetime.timedelta(10))).all()
		self.session.commit()
		return self.render("admin/home.html", new_order_sum=new_order_sum, order_sum=order_sum,
						   new_follower_sum=new_follower_sum, follower_sum=follower_sum,\
						   show_balance = show_balance,new_sys_notices=new_sys_notices, \
						   sys_notices=sys_notices, context=dict())
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("shop_id:int")
	def post(self):  # 商家多个店铺之间的切换
		shop_id = self.args["shop_id"]
		try:shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
		except:return self.send_error(404)
		if shop.admin != self.current_user:
			return self.send_error(403)#必须做权限检查：可能这个shop并不属于current_user
		self.set_secure_cookie("shop_id", str(shop_id), domain=ROOT_HOST_NAME)
		return self.send_success()

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

#admin 店铺切换
class SwitchShop(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):

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
			orders = self.session.query(models.Order).filter_by(shop_id = shop.id ,status =6).first()
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
			shop.goods_count = fruit_count+mgoods_count	
			shop.fans_sum = self.session.query(models.CustomerShopFollow).filter_by(shop_id=shop.id).count()
			shop.satisfy = "%.0f%%"  %(round(decimal.Decimal(satisfy),2)*100)
			shop.order_sum = self.session.query(models.Order).filter_by(shop_id=shop.id).count()
			total_money = self.session.query(func.sum(models.Order.totalPrice)).filter_by(shop_id = shop.id).filter( or_(models.Order.status ==5,models.Order.status ==6 )).all()[0][0]
			shop.total_money = self.session.query(func.sum(models.Order.totalPrice)).filter_by(shop_id = shop.id ,status =6).all()[0][0]
			if total_money:		
				shop.total_money = format(total_money,'.2f')
			else:		
				shop.total_money=0
			shop.address = self.code_to_text("shop_city", self.current_shop.shop_city) +" " + self.current_shop.shop_address_detail
			shop_list.append(shop.safe_props())
		return shop_list

#admin后台轮询
class Realtime(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		order_sum,new_order_sum,follower_sum,new_follower_sum,on_num = 0,0,0,0,0
		order_sum = self.session.query(models.Order).filter(models.Order.shop_id==self.current_shop.id,\
			not_(models.Order.status.in_([-1,0]))).count()
		new_order_sum = order_sum - (self.current_shop.new_order_sum or 0)
		follower_sum = self.session.query(models.CustomerShopFollow).filter_by(shop_id=self.current_shop.id).count()
		new_follower_sum = follower_sum - (self.current_shop.new_follower_sum or 0)
		on_num = self.session.query(models.Order).filter_by(shop_id=self.current_shop.id).filter_by(type=1,status=1).count()
		return self.send_success(new_order_sum=new_order_sum, order_sum=order_sum,new_follower_sum=new_follower_sum, follower_sum=follower_sum,on_num=on_num)
# 订单统计
class OrderStatic(AdminBaseHandler):

	def get(self):
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
		if page == 0:
			now = datetime.datetime.now()
			start_date = datetime.datetime(now.year, now.month, 1)
			end_date = now
		else:
			date = self.monthdelta(datetime.datetime.now(), page)
			start_date = datetime.datetime(date.year, date.month, 1)
			end_date = datetime.datetime(date.year, date.month, date.day)

		orders = self.session.query(models.Order.id, models.Order.create_date,
									models.Order.totalPrice, models.Order.type,
									models.Order.pay_type). \
			filter(models.Order.shop_id == self.current_shop.id,
				   models.Order.create_date >= start_date,
				   models.Order.create_date <= end_date,
				   not_(models.Order.status.in_([-1,0]))).all()

		data = {}
		for x in range(1, end_date.day+1):  # 初始化数据
			data[x] = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
		if type == 1:
			for order in orders:
				data[order[1].day][1] += 1
				if order[3] == 2:
					data[order[1].day][2] += 1
				else:
					data[order[1].day][3] += 1
				if order[4] == 1:
					data[order[1].day][4] += 1
				else:
					data[order[1].day][5] += 1
		elif type == 2:
			for order in orders:
				data[order[1].day][1] += order[2]
				if order[3] == 2:
					data[order[1].day][2] += order[2]
				else:
					data[order[1].day][3] += order[2]
				if order[4] == 1:
					data[order[1].day][4] += order[2]
				else:
					data[order[1].day][5] += order[2]
		else:
			return self.send_error(404)
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
			end_date = datetime.datetime(now.year, now.month, now.day, 23)
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
			end_date = datetime.datetime(now.year, now.month, now.day, 23)
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
		end_date = datetime.datetime.now() - datetime.timedelta(page*page_size)

		# 日订单数，日总订单金额
		s = self.session.query(models.Order.create_date, func.count(), func.sum(models.Order.totalPrice)).\
			filter_by(shop_id=self.current_shop.id).\
			filter(models.Order.create_date >= start_date,
				   models.Order.create_date <= end_date,not_(models.Order.status.in_([-1,0]))).\
			group_by(func.year(models.Order.create_date),
					 func.month(models.Order.create_date),
					 func.day(models.Order.create_date)).\
			order_by(desc(models.Order.create_date)).all()

		# 总订单数
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
			if i < len(s) and (datetime.datetime.now()-s[i][0]).days == x+(page*page_size):
				if j < len(s_old) and (datetime.datetime.now()-s_old[j][0]).days == x+(page*page_size):
					data.append((date.strftime('%Y-%m-%d'), s[i][1], total[1], format(float(s[i][2]),'.2f'), format(float(total[0]),'.2f'), s_old[j][1], old_total))
					total[1] -= s[i][1]
					total[0] -= s[i][2]
					old_total -= s_old[j][1]
					i += 1
					j += 1
				else:
					data.append((date.strftime('%Y-%m-%d'), s[i][1], total[1], format(float(s[i][2]),'.2f'), format(float(total[0]),'.2f'), 0, old_total))
					total[1] -= s[i][1]
					total[0] -= s[i][2]
					i += 1
			else:
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

class Comment(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action:str", "page:int")
	def get(self):
		action = self.args["action"]
		page = self.args["page"]
		page_size = 10
		pages=0
		# print("[用户评价]当前店铺：",self.current_shop)
		if action == "all":
			comments = self.get_comments(self.current_shop.id, page, page_size)
			# print("[用户评价]详情：",comments,len(comments))
			all_comments = self.session.query(models.Order).filter(models.Order.shop_id == self.current_shop.id,\
				models.Order.status == 6).count()
			self.current_shop.old_msg = all_comments
			self.session.commit()
			pages = all_comments/10
			# print("[用户评价]页数：",pages)
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
			# print(comments)
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
			# print('login replay')
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
		elif action =="apply_delete_comment":
			delete_reason = data["delete_reason"]
			shop_id  = self.current_shop.id
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
	@AdminBaseHandler.check_arguments("order_type:int", "order_status:int","page:int","action?")
	#order_type(1:立即送 2：按时达);order_status(1:未处理，2：未完成，3：已送达，4：售后，5：所有订单)
	def get(self):
		order_type = self.args["order_type"]
		order_status = self.args["order_status"]
		page = self.args["page"]
		page_size = 10
		count = 0
		page_sum = 0
		orders = []
		if self.args['action'] == "realtime":  #订单管理页实时获取未处理订单的接口
			atonce,ontime,new_order_sum = 0,0,0
			count = self._count()
			atonce = count[11]
			ontime = count[21]
			new_order_sum = self.session.query(models.Order).filter(models.Order.shop_id==self.current_shop.id,\
				not_(models.Order.status.in_([-1,0]))).count() -(self.current_shop.new_order_sum or 0)
			return self.send_success(atonce=atonce,ontime=ontime,new_order_sum=new_order_sum)
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
		elif order_type == 10:  # 搜索订单：为了格式统一，order_status为order.num
			orders = self.session.query(models.Order).filter(models.Order.num==order_status,\
				models.Order.shop_id==self.current_shop.id,not_(models.Order.status.in_([-1,0]))).all()
			order_type = 1
			count = self.session.query(models.Order).filter(models.Order.type==order_type,models.Order.status==order_status,\
				models.Order.shop_id==self.current_shop.id,not_(models.Order.status.in_([-1,0]))).count()
		elif order_status == 1:
			order_sum = self.session.query(models.Order).filter(models.Order.shop_id==self.current_shop.id,\
				not_(models.Order.status.in_([-1,0]))).count()
			new_order_sum = order_sum - (self.current_shop.new_order_sum or 0)
			self.current_shop.new_order_sum = order_sum
			orders = [x for x in self.current_shop.orders if x.type == order_type and x.status == 1]
			count = len(orders)
			# woody 4.3
			session = self.session
			# for order in orders:
			# 	order.send_time = order.get_sendtime(session,order.id)
			orders.sort(key = lambda order:order.send_time,reverse = False)
			session.commit()
		elif order_status == 5:#all
			orders = [x for x in self.current_shop.orders if x.type == order_type ]
			count = len(orders)
			session = self.session
			# for order in orders:
			# 	order.send_time = order.get_sendtime(session,order.id)
			orders.sort(key = lambda order:order.send_time,reverse = True)
		elif order_status == 2:#unfinish
			orders = [x for x in self.current_shop.orders if x.type == order_type and x.status in [2, 3, 4]]
			count = len(orders)
			# woody 4.3
			session = self.session
			# for order in orders:
			# 	order.send_time = order.get_sendtime(session,order.id)
			orders.sort(key = lambda order:order.send_time,reverse = True)

		elif order_status == 3:
			try:
				orderlist = self.session.query(models.Order).order_by(desc(models.Order.arrival_day),models.Order.arrival_time\
					).filter(models.Order.type == order_type,models.Order.shop_id == self.current_shop.id,\
					not_(models.Order.status.in_([-1,0]))).all()
			except:
				return self.send_fail("orderlist error")
			# orders = [x for x in self.current_shop.orders if x.type == order_type and x.status in (5, 6)]
			orders = [x for x in orderlist if x.type == order_type and x.status in (5, 6)]
			count = len(orders)
		elif order_status == 4:
			pass
		else:
			return self.send.send_error(404)

		page_sum = count /10
		session = self.session
		page_area = page * page_size
		orders = orders[page_area:page_area+10]
		# print("after sort",orders)
		# for order in orders:
		#     print(order.w_send_time)

		data = []
		delta = datetime.timedelta(1)
		# print("[订单管理]当前店铺：",self.current_shop)
		for order in orders:
			order.__protected_props__ = ['shop_id', 'JH_id', 'SH1_id', 'SH2_id',
										 'comment_create_date', 'start_time', 'end_time',        'create_date','today','type']
			d = order.safe_props(False)
			d['fruits'] = eval(d['fruits'])
			d['mgoods'] = eval(d['mgoods'])
			d['create_date'] = order.create_date.strftime('%Y-%m-%d')
			d["sent_time"] = order.send_time
			info = self.session.query(models.Customer).filter_by(id = order.customer_id).first()
			d["nickname"] = info.accountinfo.nickname
			d["customer_id"] = order.customer_id
			staffs = self.session.query(models.ShopStaff).join(models.HireLink).filter(and_(
				models.HireLink.work == 3, models.HireLink.shop_id == self.current_shop.id,models.HireLink.active == 1)).all()
			d["shop_new"] = 0
			follow = self.session.query(models.CustomerShopFollow).filter(models.CustomerShopFollow.shop_id == order.shop_id,\
				models.CustomerShopFollow.customer_id == order.customer_id).first()
			if follow:
				d["shop_new"]=follow.shop_new
				# print("[订单管理]读取订单，订单用户ID：",order.customer_id,"，新用户标识：",d["shop_new"])
			SH2s = []
			for staff in staffs:
				staff_data = {"id": staff.id, "nickname": staff.accountinfo.nickname,"realname": staff.accountinfo.realname, "phone": staff.accountinfo.phone}
				SH2s.append(staff_data)
				if staff.id == order.SH2_id:  # todo JH、SH1
					d["SH2"] = staff_data
					# print(d["SH2"],'i am admin order' )
			d["SH2s"] = SH2s
			data.append(d)
		return self.render("admin/orders.html", data = data, order_type=order_type,
						   count=self._count(),page_sum=page_sum, context=dict(subpage='order'))


	def edit_status(self,order,order_status):
		if order_status == 4:
			order.update(self.session, status=order_status,send_admin_id = self.current_user.accountinfo.id)
		elif order_status == 5:
			order.update(self.session, status=order_status,finish_admin_id = self.current_user.accountinfo.id)
		# when the order complete ,
		# woody
		shop_id = self.current_shop.id
		#shop_point add by order.totalPrice
		staff_info = []
		if order_status == 4:
			try:
				staff_info = self.session.query(models.Accountinfo).join(models.HireLink,models.Accountinfo.id == models.HireLink.staff_id )\
				.filter(models.HireLink.shop_id == shop_id,models.HireLink.default_staff == 1).first()
			except:
				print("didn't find default staff")
			if staff_info:
				openid = staff_info.wx_openid
				staff_name = staff_info.nickname
			else:
				openid = self.current_shop.admin.accountinfo.wx_openid
				staff_name = self.current_shop.admin.accountinfo.nickname
			shop_name = self.current_shop.shop_name
			order_id = order.num
			order_type = order.type
			create_date = order.create_date
			customer_name = order.receiver
			order_totalPrice = order.totalPrice
			# send_time = order.get_sendtime(self.session,order.id)
			send_time = order.send_time
			phone = order.phone
			address = order.address_text
			# print("ready to send message")

			WxOauth2.post_staff_msg(openid,staff_name,shop_name,order_id,order_type,create_date,customer_name,order_totalPrice,send_time,phone,address) 
		if order_status == 5:
			now = datetime.datetime.now()
			order.arrival_day = now.strftime("%Y-%m-%d")
			order.arrival_time= now.strftime("%H:%M")
			self.session.commit()
			customer_id = order.customer_id
			shop_id = order.shop_id
			totalprice = order.totalPrice

			shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
			if not shop:
				return self.send_fail('shop not found')
			shop.is_balance = 1
			shop.order_count += 1  #店铺订单数加1


			#
			customer_info = self.session.query(models.Accountinfo).filter_by(id = customer_id).first()
			if not customer_info:
				return self.send_fail('customer not found')
			customer_info.is_new = 1
			name = customer_info.nickname
			self.session.commit()

			#
			customer = self.session.query(models.CustomerShopFollow).filter_by(customer_id = customer_id,\
				shop_id = shop_id).first()
			if not customer:
				return self.send_fail('customer error')
			customer.shop_new = 1
			# print("[订单管理]用户",customer_id,"完成订单，新用户标识置为：",customer.shop_new)
			self.session.commit()

			try:
				shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = \
					customer_id,shop_id = shop_id).first()
			except:
				self.send_fail("shop_point error")
			try:
				order_count = self.session.query(models.Order).filter(models.Order.customer_id == customer_id,\
					models.Order.shop_id == shop_id,not_(models.Order.status.in_([-1,0]))).count()
			except:
				self.send_fail("find order by customer_id and shop_id error")
			# the first order , shop_point add by 5
			if order_count==1:
				if shop_follow:
					if shop_follow.shop_point == None:
						shop_follow.shop_point =0
					shop_follow.shop_point += 5
					self.session.commit()
					try:
						point_history = models.PointHistory(customer_id = customer_id,shop_id = shop_id)
					except:
						self.send_fail("point_history error:First_order")
					if point_history:
						point_history.point_type = models.POINT_TYPE.FIRST_ORDER
						point_history.each_point = 5
						# print(point_history.each_point)
						self.session.add(point_history)
						self.session.commit()

			if order.pay_type == 2:    #余额 支付
				if shop_follow:
					if shop_follow.shop_point == None:
						shop_follow.shop_point =0
					shop_follow.shop_point += 2
					self.session.commit()

					try:
						point_history = models.PointHistory(customer_id = customer_id,shop_id = shop_id)
					except:
						self.send_fail("point_history error:PREPARE_PAY")
					if point_history:
						point_history.point_type = models.POINT_TYPE.PREPARE_PAY
						point_history.each_point = 2
						self.session.add(point_history)
						self.session.commit()

				shop.available_balance += totalprice
				balance_history = models.BalanceHistory(customer_id = customer_id , shop_id = shop_id,\
					balance_record = "可提现额度入账：订单"+order.num+"完成",name = name,balance_value = totalprice,shop_totalPrice=\
					shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,available_balance=\
					shop.available_balance,balance_type = 6)
				self.session.add(balance_history)
				self.session.commit()

			if order.pay_type == 3:
				shop.available_balance += totalprice
				balance_history = models.BalanceHistory(customer_id = customer_id , shop_id = shop_id,\
					balance_record = "可提现额度入账：订单"+order.num+"完成",name = name,balance_value = totalprice,shop_totalPrice=\
					shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,available_balance=\
					shop.available_balance,balance_type = 7)
				self.session.add(balance_history)
				self.session.commit()


			if shop_follow: 
				if shop_follow.shop_point == None:
					shop_follow.shop_point =0
				shop_follow.shop_point += totalprice
				self.session.commit()
				try:
					point_history = models.PointHistory(customer_id = customer_id,shop_id = shop_id)
				except:
					self.send_fail("point_history error:totalprice")
				if point_history:
					point_history.point_type = models.POINT_TYPE.TOTALPRICE
					point_history.each_point = totalprice
					self.session.add(point_history)
					self.session.commit()
	@tornado.web.authenticated
	@unblock
	@AdminBaseHandler.check_arguments("action", "data")
	def post(self):
		action = self.args["action"]
		data = self.args["data"]
		# print("[订单管理]当前店铺：",self.current_shop)
		if action == "add_period":
			start_time = datetime.time(data["start_hour"],data["start_minute"])
			end_time = datetime.time(data["end_hour"],data["end_minute"])
			period = models.Period(config_id=self.current_shop.id,
								   name=data["name"],
								   start_time=start_time,
								   end_time=end_time)
			# print("[订单管理]添加按时达时段，Shop ID：",period.config_id,"，时间段：",start_time,"~",end_time)
			self.session.add(period)
			self.session.commit()
			return self.send_success(period_id=period.id)
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
				# print("[订单管理]修改按时达时段，Shop ID：",period.config_id,"，时间段：",start_time,"~",end_time)
			elif action == "edit_period_active":
				period.active = 1 if period.active == 2 else 2
				# print("[订单管理]按时达时段启用/停用，Shop ID：",period.config_id,"，状态：",period.active)
			self.session.commit()
		elif action == "del_period":
			try: q = self.session.query(models.Period).filter_by(id=int(data["period_id"]))
			except:return self.send_error(404)
			q.delete()
			self.session.commit()
		elif action == "edit_ontime_on":
			self.current_shop.config.ontime_on = not self.current_shop.config.ontime_on
			self.session.commit()
		elif action == "edit_min_charge_on_time":  # 按时达起送金额
			self.current_shop.config.min_charge_on_time = data["min_charge_on_time"]
			self.session.commit()
		elif action == "edit_stop_range":  # 下单截止时间（分钟）
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
		elif action in ("edit_remark", "edit_SH2", "edit_status", "edit_totalPrice", 'del_order', 'print'):
			order = next((x for x in self.current_shop.orders if x.id==int(data["order_id"])), None)
			if not order:
				return self.send_fail("没找到该订单")
			if action == "edit_remark":
				order.update(session=self.session, remark=data["remark"])
			elif action == "edit_SH2":
				if order.status in [5,6,10]:
					return self.send_fail('订单已完成，不允许操作该订单')
				SH2 = next((x for x in self.current_shop.staffs if x.id == int(data["staff_id"])), None)
				if not SH2:
					return self.send_fail("没找到该送货员")
				order.update(session=self.session, status=4, SH2_id=int(data["staff_id"]))
				#########################################################################################################
				# send message to staff
				# woody
				# 3.21
				id = SH2.id
				try:
					staff_info = self.session.query(models.Accountinfo).filter_by(id = id).first()
				except:
					self.send_fail("staff'infomation error")
				openid = staff_info.wx_openid
				staff_name = staff_info.nickname
				shop_name = self.current_shop.shop_name
				order_id = order.num
				order_type = order.type
				create_date = order.create_date
				customer_name = order.receiver
				order_totalPrice = order.totalPrice
				# send_time = order.get_sendtime(self.session,order.id)
				send_time = order.send_time
				phone = order.phone
				address = order.address_text
				# print("ready to send message")

				WxOauth2.post_staff_msg(openid,staff_name,shop_name,order_id,order_type,create_date,customer_name,order_totalPrice,send_time,phone,address)
				# print("success?")

			elif action == "edit_status":
				if order.status in[5,6,10]:
					return self.send_fail("订单已完成。不能修改状态")
				self.edit_status(order,data['status'])

			elif action == "edit_totalPrice":
				if order.pay_type == 2:
					return self.send_fail("余额支付，不能修改价格")
				order.update(session=self.session, totalPrice=data["totalPrice"])
			elif action == "del_order":
				if order.status == 0:
					return self.send_fail('订单已经被删除，不能重复操作')
				if order.pay_type == 3:
					return self.send_fail("在线支付订单 不允许删除")
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
						print('old histtory not found')
					else:
						old_balance_history.is_cancel = 1
						self.session.commit()

				#恢复用户账户余额，同时产生一条记录
					shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = order.customer_id,\
						shop_id = order.shop_id).first()
					if not shop_follow:
						return self.send_fail('shop_follow not found')
					shop_follow.shop_balance += order.totalPrice

					balance_history = models.BalanceHistory(customer_id = order.customer_id , shop_id = order.shop_id ,\
						balance_value = order.totalPrice,balance_record = '余额退款：订单'+ order.num+'删除', name = self.current_user.accountinfo.nickname,\
						balance_type = 4,shop_totalPrice = self.current_shop.shop_balance,customer_totalPrice = \
						shop_follow.shop_balance)
					self.session.add(balance_history)
				self.session.commit()

			elif action == "print":
				order.update(session=self.session, isprint=1)
		elif action == "batch_edit_status":
			order_list_id = data["order_list_id"]
			notice = ''
			for key in order_list_id:	
				order = next((x for x in self.current_shop.orders if x.id==int(key)), None)
				if order.status == 4 and data['status'] ==4:
					notice = "订单"+str(order.num)+"订单已在配送中,请不要重复操作"
					return self.send_fail(notice)
				if order.status == 5 and data['status'] ==5:
					notice = "订单"+str(order.num)+"已完成,请不要重复操作"
					return self.send_fail(notice)
				if order.status in[5,6,10]:
					notice = "订单"+str(order.num)+"已完成,请不要重复操作"
					return self.send_fail(notice)
				if not order:
					notice = "没找到订单",order.onum
					return self.send_fail(notice)
				self.edit_status(order,data['status'])
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

	def _count(self):
		count = {10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0,
				 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0}
		for order in self.current_shop.orders:
			count[order.type*10+5] += 1
			if order.status == 0:
				count[order.type*10] += 1
			elif order.status == 1:
				count[order.type*10+1] += 1
			elif order.status in (2, 3, 4):
				count[order.type*10+2] += 1
			elif order.status in (5, 6):
				count[order.type*10+3] += 1
			elif order.status == 10:
				count[order.type*10+4] += 1
		return count

# 商品管理
class Shelf(AdminBaseHandler):

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action", "id:int")
	def get(self):
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
				return self.send_fail("商品简介不能超过100字噢亲，再精简谢吧！")
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
				# print('num',data["num"],data["unit"],data["price"])
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
					return self.send_fail("商品简介不能超过100字噢亲，再精简谢吧！")
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
					return self.send_fail("商品简介不能超过100字噢亲，再精简谢吧！")
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

# 商品管理
class Goods(AdminBaseHandler):
	@tornado.web.authenticated
	def initialize(self, action):
		self._action = action
	@AdminBaseHandler.check_arguments("type_id?","page?:int")
	def get(self):
		action = self._action
		if action == "all":
			type_id = self.args["type_id"]
			page = self.args["page"]
			page_size = 10
			offset = (page-1) * page_size
			history     = []
			data = []
			nomore = False
			try:
				goods = self.session.query(models.Fruit).filter_by(shop_id=self.current_shop.id).all()
			except:
				nomore=True

			if goods:
				for good in goods:
					if good.add_time:
						add_time = good.add_time.strftime('%Y-%m-%d %H:%M:%S')
					if good.delete_time:
						delete_time = good.delete_time.strftime('%Y-%m-%d %H:%M:%S')
					data.append({})
					fruit_type_id = Column(Integer, ForeignKey(FruitType.id), nullable=False)

					name = Column(String(20))
					active = Column(TINYINT, default=1)#0删除，１:上架，２:下架
					current_saled = Column(Integer, default=0) #售出：未处理的订单数
					saled = Column(Integer) #销量
					storage = Column(Float)
					favour = Column(Integer, default=0)  # 赞
					unit = Column(TINYINT)#库存单位,1:个 2：斤 3：份
					tag = Column(TINYINT, default=TAG.NULL) #标签
					img_url = Column(String(500))
					intro = Column(String(100))
					priority = Column(SMALLINT, default=1)
					limit_num =  Column(Integer, default=0) #max number could buy #5.27
					add_time = Column(DateTime, default=func.now()) #5.27
					delete_time = Column(DateTime) #5.27
					group_name =  Column(Integer, default=0) #group name 0:default group 1000:record group GoodsGroup.id #5.27
					clssify  = Column(Integer, default=0) 
			else:
				nomore=True
			count = len(goods)
			goods = goods[::-1]
			if page==1 and count<=page_size:
				nomore=True
			if offset + page_size <= count:
				data = goods[offset:offset+page_size]
			elif offset <= count and offset + page_size >=count:
				data = goods[offset:]
			else:
				nomore=True
			if data == []:
				nomore = True
			if page == 0:
				if len(data)<page_size:
					nomore = True
				return self.render("admin/goods-all.html",context=dict(subpage="goods"))
			# return self.send_success(data=data,nomore=nomore)
			
		elif action == "classify":
			return self.render("admin/goods-classify.html",context=dict(subpage="goods"))
		elif action == "group":
			return self.render("admin/goods-group.html",context=dict(subpage="goods"))
		elif action == "delete":
			return self.render("admin/goods-delete.html",context=dict(subpage="goods"))


	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action", "data", "id?:int", "charge_type_id?:int")
	def post(self):
		action = self.args["action"]
		data = self.args["data"]
		if action == "add_goods":
			if not (data["charge_types"] and data["charge_types"]):  # 如果没有计价方式、打开market时会有异常
				return self.send_fail("请至少添加一种计价方式")
			if len(data["intro"]) > 100:
				return self.send_fail("商品简介不能超过100字噢亲，再精简谢吧！")
			args={}
			args["name"] = data["name"]
			args["saled"] = data["saled"]
			args["storage"] = data["storage"]
			args["unit"] = data["unit"]
			if data["tag"]:
				args["tag"] = data["tag"]
			if data["limit_num"]:
				args["limit_num"] = data["limit_num"]
			if data["group_name"]:
				args["group_name"] = data["group_name"]
			if data["clssify"]:
				args["clssify"] = data["clssify"]
			if data["img_url"]:  # 前端可能上传图片不成功，发来一个空的，所以要判断
				args["img_url"] = SHOP_IMG_HOST + data["img_url"]
			args["intro"] = data["intro"]
			args["priority"] = data["priority"]
			args["fruit_type_id"] = data["fruit_type_id"]
			args["shop_id"] = self.current_shop.id
			goods = models.Fruit(**args)
			for charge_type in data["charge_types"]:
				goods.charge_types.append(models.ChargeType(price=charge_type["price"],
										unit=charge_type["unit"],
										num=charge_type["num"],
										unit_num=charge_type["unit_num"]))
			self.session.add(goods)
			self.session.commit()
			return self.send_success()
		elif action == "edit_goods_img":
			return self.send_qiniu_token("fruit", self.args["id"])
		elif action == "apply_cookie":
			return self.send_qiniu_token("apply_cookie",self.args["id"])
		elif action in ["add_charge_type", "edit_active", "edit_goods", "default_goods_img","delete_goods"]:  # fruit_id
			try:fruit = self.session.query(models.Fruit).filter_by(id=self.args["id"]).one()
			except:return self.send_error(404)
			if fruit.shop != self.current_shop:
				return self.send_error(403)

			if action == "add_charge_type":
				# print('num',data["num"],data["unit"],data["price"])
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
			elif action == "edit_goods":
				if len(data["intro"]) > 100:
					return self.send_fail("商品简介不能超过100字噢亲，再精简谢吧！")
				fruit.update(session=self.session,
						name = data["name"],
						saled = data["saled"],
						storage = data["storage"],
						unit=data["unit"],
						tag = data["tag"],
						img_url = data["img_url"],
						intro=data["intro"],
						priority=data["priority"],
						limit_num=data["limit_num"],
						group_name=data["group_name"],
						clssify=data["clssify"]
						)

			elif action == "default_goods_img":  # 恢复默认图
				fruit.img_url = ''
				self.session.commit()
			elif action == "delete_goods":
				time_now = datetime.datetime.now()
				fruit.update(session=self.session, active = 0,delete_time = time_now)

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

		else:
			return self.send_error(404)

		return self.send_success()

# 用户管理
class Follower(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action:str", "order_by:str", "page:int", "wd?:str")
	def get(self):
		action = self.args["action"]
		order_by = self.args["order_by"]
		page = self.args["page"]
		page_size = 10
		count = 0
		page_sum = 0
		shop_id = self.current_shop.id
		if action in ("all", "old","charge"):
			if action == "all":  # 所有用户
				q = self.session.query(models.Customer).join(models.CustomerShopFollow).\
					filter(models.CustomerShopFollow.shop_id == self.current_shop.id)
				if order_by == "time":
					q = q.order_by(desc(models.CustomerShopFollow.create_time))
			elif action == "old":  # 老用户
				q = self.session.query(models.Customer).\
					join(models.Order).filter( and_(models.Order.shop_id == self.current_shop.id,\
						or_(models.Order.status==5,models.Order.status==6,models.Order.status==10))).distinct()
			elif action == "charge":
				q = self.session.query(models.Customer).join(models.BalanceHistory,models.Customer.id == models.BalanceHistory.customer_id).\
					filter(models.BalanceHistory.shop_id == self.current_shop.id,models.BalanceHistory.balance_type==1).distinct()
			if order_by == "credits":
				q = q.order_by(desc(models.Customer.credits))
			elif order_by == "balance":
				q = q.order_by(desc(models.Customer.balance))
			count = q.count()
			customers = q.offset(page*page_size).limit(page_size).all()

		elif action == "search":  # 用户搜索，支持根据手机号/真名/昵称搜索
			wd = self.args["wd"]
			if wd.isdigit():  # 判断是否为纯数字，纯数字就按照手机号搜索
				customers = self.session.query(models.Customer).join(models.CustomerShopFollow).\
					filter(models.CustomerShopFollow.shop_id == self.current_shop.id).\
					join(models.Accountinfo).filter(models.Accountinfo.phone == int(wd)).all()
			else:  # 按照名字搜索
				customers = self.session.query(models.Customer).join(models.CustomerShopFollow).\
					filter(models.CustomerShopFollow.shop_id == self.current_shop.id).\
					join(models.Accountinfo).filter(or_(models.Accountinfo.nickname.like("%%%s%%" % wd),
														models.Accountinfo.realname.like("%%%s%%" % wd))).all()
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
			customers[x].shop_point = shop_point.shop_point
			customers[x].shop_names = [y[0] for y in shop_names]
			customers[x].shop_balance = shop_point.shop_balance
			customers[x].remark = shop_point.remark

		page_sum=count/page_size
		if page_sum == 0:
			page_sum=1
		return self.render("admin/user-manage.html", customers=customers, count=count, page_sum=page_sum,
						   context=dict(subpage='user'))
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action:str", "data")
	def post(self):
		action = self.args["action"]
		data = self.args["data"]
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


class Staff(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action")
	def get(self):
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
				# print(phone)
				try:
					# print(self.current_shop.id)
					hire_forms =self.session.query(models.HireForm).filter_by(status = 2,shop_id=self.current_shop.id).all()
					# print(len(hire_forms))
					temp_phone =[]
					for temp in hire_forms:
						temp_phone.append(temp.staff.accountinfo.phone)
					# print(temp_phone)
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
				print('this man is not admin')
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


class SearchOrder(AdminBaseHandler):  # 用户历史订单
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action", "id:int")
	def get(self):
		action = self.args["action"]
		subpage=''
		if action == 'customer_order':
			orders = self.session.query(models.Order).filter(
				models.Order.customer_id==self.args['id'], models.Order.shop_id==self.current_shop.id,\
				not_(models.Order.status.in_([-1,0]))).all()
			subpage='user'
		elif action == 'SH2_order':
			orders = self.session.query(models.Order).filter(
				models.Order.SH2_id==self.args['id'], models.Order.shop_id==self.current_shop.id,\
				not_(models.Order.status.in_([-1,0]))).all()
			subpage='staff'
		elif action == 'order':
			orders = self.session.query(models.Order).filter(
				models.Order.num==self.args['id'], models.Order.shop_id==self.current_shop.id,\
				not_(models.Order.status.in_([-1,0]))).all()
			subpage='order'
		else:
			return self.send_error(404)

		data = []
		delta = datetime.timedelta(1)
		for order in orders:
			order.__protected_props__ = [ 'shop_id', 'JH_id', 'SH1_id', 'SH2_id',
										 'comment_create_date', 'start_time', 'end_time', 'create_date']
			d = order.safe_props(False)
			d['fruits'] = eval(d['fruits'])
			d['mgoods'] = eval(d['mgoods'])
			d['create_date'] = order.create_date.strftime('%Y-%m-%d')
			d["send_time"] = order.send_time
			d["customer_id"] = order.customer_id

			#yy
			d["shop_new"] = 0
			follow = self.session.query(models.CustomerShopFollow).filter(models.CustomerShopFollow.shop_id == order.shop_id,\
				models.CustomerShopFollow.customer_id == order.customer_id).first()
			# print("[订单查询]读取订单，订单用户ID：",follow.customer_id)
			if follow:
				d["shop_new"]=follow.shop_new
			staffs = self.session.query(models.ShopStaff).join(models.HireLink).filter(and_(
				models.HireLink.work == 3, models.HireLink.shop_id == self.current_shop.id,models.HireLink.active ==1 )).all()
			SH2s = []
			for staff in staffs:
				staff_data = {"id": staff.id, "nickname": staff.accountinfo.nickname,"realname": staff.accountinfo.realname, "phone": staff.accountinfo.phone}
				SH2s.append(staff_data)
				if staff.id == order.SH2_id:  # todo JH、SH1
					d["SH2"] = staff_data
			d["SH2s"] = SH2s
			data.append(d)

		return self.render("admin/order-list.html", data=data, context=dict(subpage=subpage))

class Config(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action",'status?')
	def get(self):
		try:config = self.session.query(models.Config).filter_by(id=self.current_shop.id).one()
		except:return self.send_error(404)
		action = self.args["action"]
		if action == "delivery":
			return self.render("admin/shop-address-set.html", addresses=config.addresses,context=dict(subpage='shop_set',shopSubPage='delivery_set'))
		elif action == "notice":
			return self.render("admin/shop-notice-set.html", notices=config.notices,context=dict(subpage='shop_set',shopSubPage='notice_set'))
		elif action == "recharge":
			pass
		elif action == "receipt":
			return self.render("admin/shop-receipt-set.html", receipt_msg=config.receipt_msg,context=dict(subpage='shop_set',shopSubPage='receipt_set'))

		elif action == "cert":
			pass
			#return self.render("admin/shop-cert-set.html",context=dict(subpage='shop_set',shopSubPage='cert_set'))
		elif action == "pay":
			if self.current_shop.shop_auth !=0:
				return self.render("admin/shop-pay-set.html",context=dict(subpage='shop_set',shopSubPage='pay_set'))
			else:
				return self.redirect(self.reverse_url('adminShopConfig'))
		elif action == "phone":
			return self.render('admin/shop-phone-set.html',context=dict(subpage='shop_set',shopSubPage='phone_set'))
		elif action == "admin":
			if self.current_shop.shop_auth !=0:
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
			else:
				return self.redirect(self.reverse_url('adminShopConfig'))
			
		else:
			return self.send_error(404)


	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action", "data")
	def post(self):
		action = self.args["action"]
		data = self.args["data"]

		if action in ["add_addr1", "add_notice", "edit_receipt", "edit_hire"]:
			if action == "add_addr1":
				addr1 = models.Address1(name=data)
				self.current_shop.config.addresses.append(addr1)
				self.session.commit()
				return self.send_success(address1_id=addr1.id)#commit后id会自动生成
			elif action == "add_notice":
				notice = models.Notice(
					summary=data["summary"],
					detail=data["detail"])
				self.current_shop.config.notices.append(notice)
				self.session.commit()
			elif action == "edit_receipt": #小票设置
				self.current_shop.config.update(session=self.session,
												receipt_msg=data["receipt_msg"])
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
			notice = next((x for x in self.current_shop.config.notices if x.id == data["notice_id"]), None)
			if not notice:
				return self.send_error(404)
			if action == "edit_notice_active":
				notice.active = 1 if notice.active == 2 else 2
			elif action == "edit_notice":
				notice.summary = data["summary"]
				notice.detail = data["detail"]
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
		elif action =="search_user":
			_id = int(self.args["data"]["id"])
			data = []
			info  = self.session.query(models.Accountinfo).filter_by(id = _id).first()
			if not info:
				return self.send_fail('该用户不存在')
			customer = self.session.query(models.Customer).filter_by(id = info.id).first()
			if not customer:
				return self.send_fail('该用户还没有关注您的店铺')
			customer_shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id= customer.id,shop_id=self.current_shop.id).first()
			if not customer_shop_follow:
				return self.send_fail('该用户还没有关注您的店铺')
			if info and customer and customer_shop_follow:
				data.append({'imgurl':info.headimgurl_small,'nickname':info.nickname,'id':info.id})
				return self.send_success(data=data)
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
				return self.send_fail('至多可添加三个管理员')
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
		elif action =="delete_admin":
			if self.current_shop.admin.id !=self.current_user.id:
				return self.send_fail('您没有删除管理员的权限')
			_id = int(self.args["data"]["id"])
			try:
				admin = self.session.query(models.HireLink).filter_by(shop_id = self.current_shop.id,staff_id = _id,active=1,work=9).first()
			except:
				return self.send_fail('该管理员不存在')
			admin.active = 0
			self.session.commit()
			return self.send_success()
		elif action =="super_temp_active":
			super_temp_active = self.current_shop.super_temp_active
			if self.current_shop.admin.id !=self.current_user.id:
				return self.send_fail('您没有这项操作的权限')
			self.current_shop.super_temp_active = 0 if super_temp_active == 1 else 1
			self.session.commit()
			return self.send_success()
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
		else:
			return self.send_error(404)
		return self.send_success()

class AdminAuth(AdminBaseHandler):
	@tornado.web.authenticated
	def initialize(self, action):
		self._action = action
	def get(self):
		next_url = self.get_argument('next', '')
		if self._action == 'wxauth':
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
			#超级管理员授权成功,将临时管理员表信息放入关系表中
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
			self.session.commit()
			url = 'http://106.ihuyi.cn/webservice/sms.php?method=Submit'     # message'url
			account_info = self.session.query(models.Accountinfo).filter_by(id=temp.staff.accountinfo.id).first()
			message_name = account_info.nickname
			mobile = account_info.phone
			message_shop_name = self.current_shop.shop_name
			normal_admin = self.session.query(models.ShopAdmin).filter_by(id = account_info.id)
			if not normal_admin:
				normal_admin = models.ShopAdmin(id = account_info.id,role=3,privileges = 2)
				self.session.add(normal_admin)
				self.session.commit()
			message_content ='尊敬的{0}，您好，被{1}添加为管理员！'.format(message_name,message_shop_name)
			postdata = dict(account='cf_senguocc',
				password='sg201404',
				mobile=mobile,
				content = message_content)
			headers = dict(Host = '106.ihuyi.cn',)
			r = requests.post(url,data = postdata , headers = headers)
			print(r.text)
			WxOauth2.post_add_msg(account_info.wx_openid, message_shop_name,account_info.nickname)
			return self.redirect('/admin/config?action=admin')

		else:
			return self.redirect('/admin/config?action=admin&status=fail')


class ShopBalance(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
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
		# print(available_balance)
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
			print('apply_cash error')
			
		if shop_auth in [1,2,3,4]:
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
			# print("[店铺提现]发送验证码到手机：",phone)
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
			applicant_name = self.current_user.accountinfo.nickname
			phone = self.args['phone']
			if not check_msg_token(phone,code):
				return self.send_fail('验证码过期或不存在')
			if apply_value>shop_balance:
				return self.send_fail('您的店铺没有这么多余额')
			applyCash_history = models.ApplyCashHistory(shop_id = shop_id , value = apply_value ,has_done =0,\
				shop_code = shop_code,shop_auth = shop_auth , shop_balance = shop_balance,alipay_account = \
				alipay_account,applicant_name = applicant_name,account_name = account_name)
			self.session.add(applyCash_history)
			self.current_shop.update(self.session,alipay_account=alipay_account,alipay_account_name=account_name)
			self.session.commit()
			return self.send_success()

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
			#	print('cash history_list error')
			for temp in history_list:
				create_time = temp.create_time.strftime("%Y-%m-%d %H:%M:%S")
				shop_totalBalance = temp.shop_totalPrice
				if shop_totalBalance == None:
					shop_totalBalance=0
				shop_totalBalance = format(shop_totalBalance,'.2f')
				history.append({'name':temp.name,'record':temp.balance_record,'time':create_time,'value':temp.balance_value,\
					'type':temp.balance_type,'total':shop_totalBalance})

			return self.send_success(history = history,page_sum=page_sum,total=total,times=times)

		elif action == 'all_history':
			history = []
			page=int(self.args['page'])-1
			balance_history = self.session.query(models.BalanceHistory).filter_by(shop_id = shop_id).filter(models.BalanceHistory.balance_type.in_([0,1,2,3,4,5]))
			history_list = balance_history.order_by(desc(models.BalanceHistory.create_time)).offset(page*page_size).limit(page_size).all()
			count =balance_history.count()
			page_sum=int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1
			#if not history_list:
			#	print('get all history error')
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
			#	print('get all recharge error')
			for temp in history_list:
				create_time = temp.create_time.strftime("%Y-%m-%d %H:%M:%S")
				shop_totalBalance = temp.shop_totalPrice
				if shop_totalBalance == None:
					shop_totalBalance=0
				shop_totalBalance = format(shop_totalBalance,'.2f')
				history.append({'name':temp.name,'record':temp.balance_record,'time':create_time,'value':temp.balance_value,\
					'type':temp.balance_type,'total':shop_totalBalance})
			return self.send_success(history = history,page_sum=page_sum,total=total,pay=pay,left=left)

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
			#	print('get all BalanceHistory error')
			for temp in history_list:
				create_time = temp.create_time.strftime("%Y-%m-%d %H:%M:%S")
				shop_totalBalance = temp.shop_totalPrice
				if shop_totalBalance == None:
					shop_totalBalance=0
				shop_totalBalance = format(shop_totalBalance,'.2f')
				history.append({'name':temp.name,'record':temp.balance_record,'time':create_time,'value':temp.balance_value,\
					'type':temp.balance_type,'total':shop_totalBalance})
			return self.send_success(history = history,page_sum=page_sum,total=total,times=times,persons=persons)

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
			#	print('get all BalanceHistory error')
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

		elif action == 'available':
			history = []
			page = int(self.args['page']-1)
			history_list = self.session.query(models.BalanceHistory).filter_by(shop_id = shop_id).filter(models.BalanceHistory.balance_type.in_([2,6,7])).\
			order_by(models.BalanceHistory.create_time.desc()).offset(page*page_size).limit(page_size).all()
			count =  self.session.query(models.BalanceHistory).filter_by(shop_id = shop_id).filter(models.BalanceHistory.balance_type.in_([2,6,7])).count()
			page_sum = int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1
			#if not history_list:
			#	print('get all BalanceHistory error')
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

class ShopConfig(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
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
		shop = self.current_shop
		if action == "edit_shop_name":
			shop.shop_name = data["shop_name"]
		elif action == "edit_shop_img":
			return self.send_qiniu_token("shop", shop.id)
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
			lat       = float(data["lat"])
			lon       = float(data['lon'])
			shop_address_detail = data["shop_address_detail"]
			if shop_city//10000*10000 not in dis_dict:
				return self.send_fail("没有该省份")
			shop.shop_province = shop_city//10000*10000
			shop.shop_city = shop_city
			shop.lat       = lat
			shop.lon       = lon
			shop.shop_address_detail = shop_address_detail
		elif action == "edit_deliver_area":
			shop.deliver_area = data["deliver_area"]
		elif action == "edit_have_offline_entity":
			shop.have_offline_entity = data["have_offline_entity"]
		elif action =="shop_status":
			shop.status = int(data["shop_status"])
		self.session.commit()
		return self.send_success()


class ShopAuthenticate(AdminBaseHandler):
	@tornado.web.authenticated
	# @AdminBaseHandler.check_arguments()
	def get(self):
		shop_id = self.current_shop.id
		token = self.get_qiniu_token("shopAuth_cookie",shop_id)
		try:
			auth_apply=self.session.query(models.ShopAuthenticate).filter(models.ShopAuthenticate.shop_id == shop_id).\
			order_by(desc(models.ShopAuthenticate.id)).first()
		except:
			auth_apply = None
			print('auth_apply error')
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
		# print("[店铺认证]当前店铺：",self.current_shop)
		action = self.args["action"]
		data = self.args["data"]
		auth_change = self.current_shop.auth_change
		try:
			shop_auth_apply = self.session.query(models.ShopAuthenticate).filter_by(shop_id = shop_id)
		except:
			print('shop_auth_apply error')
		if action == "get_code":
			# print("[店铺认证]发送验证码到手机：",data["phone"])
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


class BalanceManage(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.send_success(haha = 'haha')

class Marketing(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action:str")
	def get(self):
		action = self.args["action"]
		if action == "lovewall":
			return self.render("admin/lovewall.html",context=dict(subpage = 'marketing'))

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action:str","data?:str")
	def post(self):
		action = self.args["action"]
		current_shop = self.current_shop
		if action == "confess_active":
			active = current_shop.marketing.confess_active
			current_shop.marketing.confess_active = 0 if active == 1 else 1
		elif action == "confess_notice":
			current_shop.marketing.confess_notice = self.args["data"]
		elif action =="confess_type":
			_type = current_shop.marketing.confess_type
			print(_type)
			current_shop.marketing.confess_type = 0 if _type == 1 else 1
		elif action == "confess_only":
			only = current_shop.marketing.confess_only
			current_shop.marketing.confess_only = 0 if only == 1 else 1
		else:
			return self.send_fail('something must wrong')
		self.session.commit()
		return self.send_success()


class Confession(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action:str", "page:int")
	def get(self):
		action = self.args["action"]
		page = self.args["page"]
		page_size = 10
		pages=0
		confession = ''
		datalist = []
		if action == "all":
			q = self.session.query(models.ConfessionWall).filter_by( shop_id = self.current_shop.id,status = 1).order_by(models.ConfessionWall.create_time.desc())
		elif action == "hot":
			q = self.session.query(models.ConfessionWall).filter_by( shop_id = self.current_shop.id,status = 1).order_by(models.ConfessionWall.great.desc())	
		else:
			return self.send_error(404)
		confession = q.offset(page*page_size).limit(page_size).all()
		count = q.count()
		pages = count/page_size
		for data in confession:
			info = self.session.query(models.Customer).filter_by(id=data.customer_id).first()
			user = info.accountinfo.nickname
			imgurl = info.accountinfo.headimgurl_small
			sex = info.accountinfo.sex
			time = data.create_time.strftime('%Y-%m-%d %H:%M:%S')
			datalist.append({'id':data.id,'user':user,'imgurl':imgurl,'time':time,'name':data.other_name,\
				'type':data.confession_type,'confession':data.confession,'great':data.great,\
				'comment':data.comment,'floor':data.floor,'sex':sex,'address':data.other_address,'phone':data.other_phone})
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


