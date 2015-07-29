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

# 移动后台 - 首页
class Home(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		if self.is_pc_browser()==True:
			return self.redirect(self.reverse_url("switchshop"))
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
		return self.render("m-admin/shop-list.html", context=dict(shop_list=shop_list))
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
			shop.address = self.code_to_text("shop_city",shop.shop_city) +" " + shop.shop_address_detail
			shop_list.append(shop.safe_props())
		return shop_list

# 移动后台 - 店铺
class Shop(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		if self.is_pc_browser()==True:
			return self.redirect(self.reverse_url("adminHome"))
		if self.get_secure_cookie("shop_id"):
			shop_id = int(self.get_secure_cookie("shop_id").decode())
			shop = self.session.query(models.Shop).filter_by(id=shop_id).first()
		else:
			shop = self.current_user.shops[0]
			shop_id = self.current_user.shops[0].id
		self.clear_cookie("shop_id", domain=ROOT_HOST_NAME)
		self.current_shop = shop
		self.set_secure_cookie("shop_id", str(shop.id), domain=ROOT_HOST_NAME)

		show_balance = False
		shop_auth =  self.current_shop.shop_auth

		if shop_auth in [1,2]:
			show_balance = True
		order_sum = self.session.query(models.Order).filter(models.Order.shop_id==self.current_shop.id,\
			not_(models.Order.status.in_([-1,0]))).count()
		new_order_sum = order_sum - (self.current_shop.new_order_sum or 0)

		follower_sum = self.session.query(models.CustomerShopFollow).filter_by(shop_id=self.current_shop.id).count()
		new_follower_sum = follower_sum - (self.current_shop.new_follower_sum or 0)
		self.current_shop.new_follower_sum = follower_sum

		try:
			total_money = self.session.query(func.sum(models.Order.totalPrice)).filter_by(shop_id = shop.id ,status =6).all()[0][0]
		except:
			total_money = None
		if total_money:
			total_money = format(total_money,'.2f')
		else:
			total_money=0

		order_list=self.session.query(models.Order).filter_by(shop_id=shop.id)
		intime_count = order_list.filter_by(type=1,status=1).count()
		ontime_count = order_list.filter_by(type=2,status=1).count()
		self_count = order_list.filter_by(type=3,status=1).count()
		comment_count = order_list.filter_by(status = 6).count()
		staff_count = self.session.query(models.HireLink).filter_by(shop_id = shop.id,active=1).count()
		goods_count = self.session.query(models.Fruit).filter_by(shop_id=shop_id, active=1).count()

		return self.render("m-admin/shop-profile.html", new_order_sum=new_order_sum, order_sum=order_sum,
						   new_follower_sum=new_follower_sum, follower_sum=follower_sum,show_balance = show_balance,\
						   shop=shop,total_money=total_money,intime_count=intime_count,ontime_count=ontime_count,\
						   self_count=self_count,comment_count=comment_count,staff_count=staff_count,goods_count=goods_count)

# 移动后台 - 设置
class Set(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("m-admin/shop-set.html")

# 移动后台 - 设置
class SetAttr(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action","id?:int")
	def get(self):
		try:config = self.session.query(models.Config).filter_by(id=self.current_shop.id).one()
		except:return self.send_error(404)
		action= self.args["action"]
		if action=="receipt":
			token = self.get_qiniu_token("shopAuth_cookie","token")
			return self.render("m-admin/shop-set-receipt.html",token=token,receipt_msg=config.receipt_msg,current_shop=self.current_shop,context=dict(subpage='shop_set',shopSubPage='receipt_set'))
		if action=="verify":
			return self.render('m-admin/shop-set-verify.html',text_message_active=self.current_shop.config.text_message_active,context=dict(subpage='shop_set',shopSubPage='phone_set'))
		if action=="admin":
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
			return self.render('m-admin/shop-set-admin.html',current_shop=self.current_shop,context=dict(),notice=notice,datalist=datalist)
		if action=="addAdmin":
			return self.render('m-admin/shop-add-admin.html',context=dict())
		if action=="template":
			shop_tpl = self.current_shop.shop_tpl
			return self.render('m-admin/shop-set-template.html',shop_tpl=shop_tpl,context=dict())
		if action=="notice":
			token = self.get_qiniu_token("shop_notice_cookie",self.current_shop.id)
			return self.render('m-admin/shop-set-notice.html',notices=config.notices,token=token,context=dict())
		if action=="addNotice":
			token = self.get_qiniu_token("shop_notice_cookie",self.current_shop.id)
			notice = ''
			if "id" in self.args:
				n_id = int(self.args["id"])
				for notice in config.notices:
					if notice.id == n_id:
						notice = notice
						break
			return self.render('m-admin/shop-add-notice.html',notice=notice,token=token,context=dict())
		if action=="pay":
			return self.render('m-admin/shop-set-pay.html',context=dict())

# 移动后台 - 设置
class Address(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("m-admin/shop-address.html")

# 移动后台 - 店铺信息
class Info(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
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
		token = self.get_qiniu_token("shopAuth_cookie","token")
		return self.render("m-admin/shop-info.html", token=token,current_shop=self.current_shop,city=city,province=province,address=address,lat=lat,lon=lon, \
			service_area=service_area, context=dict(subpage='shop_set',shopSubPage='info_set'))

# 移动后台 - 订单
class Order(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("m-admin/order.html")

# 移动后台 - 订单详情
class OrderDetail(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self,order_num):
		shop_id = self.current_shop.id
		try:
			order = self.session.query(models.Order).filter(models.Order.num==order_num).first()
		except:
			return self.send_error(404)
		try:
			shop = self.session.query(models.Shop).filter_by(id=order.shop_id).first()
		except:
			return self.send_error(404)
		try:
			HireLink = self.session.query(models.HireLink).filter_by(shop_id=order.shop_id,staff_id=self.current_user.id,work=9,active=1).first()
		except:
			pass
		if not shop.admin_id == self.current_user.id and not HireLink:
			return self.write("<h1>您没有查看该订单的权限</h1>")

		if shop:
			self.current_shop = shop

		charge_types = self.session.query(models.ChargeType).filter(models.ChargeType.id.in_(eval(order.fruits).keys())).all()
		print("[MadminOrderDetail]charge_types:",charge_types)
		if order.pay_type == 1:
			order.pay_type_con = "货到付款"
		elif order.pay_type == 2:
			order.pay_type_con = "余额支付"
		else:
			if order.online_type=="wx":
				order.pay_type_con = "在线支付-微信支付"
			elif order.online_type=="alipay":
				order.pay_type_con = "在线支付-支付宝"

		customer_id = order.customer_id
		customer_info = self.session.query(models.Accountinfo).filter_by(id = customer_id).first()
		if customer_info is not None:
			order.customer_nickname=customer_info.nickname

		SH2s=[]
		order.SH2={}
		staffs = self.session.query(models.ShopStaff).join(models.HireLink).filter(and_(
				models.HireLink.work == 3, models.HireLink.shop_id == shop_id,models.HireLink.active == 1)).all()
		for staff in staffs:
			staff_data = {"id": staff.id, "nickname": staff.accountinfo.nickname,"realname": staff.accountinfo.realname, "phone": staff.accountinfo.phone,\
			"headimgurl":staff.accountinfo.headimgurl_small}
			SH2s.append(staff_data)
			if staff.id == order.SH2_id:  # todo JH、SH1
				order.SH2 = staff_data

		order.SH2s = SH2s
		shop_code = self.current_shop.shop_code
		return self.render("m-admin/order-detail.html",order=order,charge_types=charge_types,shop_code=shop_code)

# 移动后台 - 订单搜索
class OrderSearch(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("m-admin/order-search.html")

# 移动后台 - 评论
class Comment(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("page?:int")
	def get(self):
		customer_id = self.current_user.id
		shop_id     = self.get_secure_cookie("shop_id")
		shop_code = self.session.query(models.Shop).filter_by(id=shop_id).one().shop_code
		satisfy = 0
		commodity_quality = 0
		send_speed = 0
		shop_service = 0
		orders = self.session.query(models.Order).filter_by(shop_id = shop_id ,status =6).first()
		if orders:
			q = self.session.query(func.avg(models.Order.commodity_quality),\
				func.avg(models.Order.send_speed),func.avg(models.Order.shop_service)).filter_by(shop_id = shop_id).all()
			if q[0][0]:
				commodity_quality = int(q[0][0])
			if q[0][1]:
				send_speed = int(q[0][1])
			if q[0][2]:
				shop_service = int(q[0][2])
			if commodity_quality and send_speed and shop_service:
				satisfy = format((commodity_quality + send_speed + shop_service)/300,'.0%')
		try:
			page = self.args["page"]
		except:
			page = 0
		page_size = 20
		comments = self.get_comments(shop_id, page, page_size)
		date_list = []
		nomore = False
		for comment in comments:
			date_list.append({"id":comment[4],"img": comment[6], "name": comment[7],"comment": comment[0],
			 "time": comment[1].strftime('%Y-%m-%d'), "reply":comment[3], "imgurls":comment[10],"commodity_quality":comment[11],
			 "send_speed": comment[12],"shop_service": comment[13],'order_num':comment[2],'index':comment[14]})
		if date_list == []:
			nomore = True
		if page == 0:
			if len(date_list)<page_size:
				nomore = True
				# print(date_list)
			return self.render("m-admin/comment.html", date_list=date_list,nomore=nomore,satisfy = satisfy,send_speed=send_speed,\
				shop_service = shop_service,commodity_quality=commodity_quality,shop_code=shop_code)
		return self.send_success(date_list=date_list,nomore=nomore)
