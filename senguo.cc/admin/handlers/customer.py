from handlers.base import CustomerBaseHandler,WxOauth2,QqOauth,get_unblock,unblock
from handlers.wxpay import JsApi_pub, UnifiedOrder_pub, Notify_pub
import dal.models as models
import tornado.web
from settings import *
import datetime, time
from sqlalchemy import desc, and_, or_,func
import qiniu
import random
import base64
import json
from libs.msgverify import gen_msg_token,check_msg_token,shop_auth_fail_msg
from settings import APP_OAUTH_CALLBACK_URL, MP_APPID, MP_APPSECRET, ROOT_HOST_NAME

from concurrent.futures import ThreadPoolExecutor
from functools import partial, wraps

from threading import Timer

import tornado.websocket

from dal.db_configs import DBSession
import urllib

from sqlalchemy.orm.exc import NoResultFound

import datetime
# from wxpay import QRWXpay

# 登录处理
class Access(CustomerBaseHandler):
	def initialize(self, action):
		self._action = action

	def get(self):
		next_url = self.get_argument('next', '')
		# print("[用户登录]跳转URL：",next_url)
		if self._action == "login":
			next_url = self.get_argument("next", "")
			if self.current_user:
				return self.redirect(self.reverse_url("customerProfile"))
			else:
				return self.render("login/m_login.html",context=dict(next_url=next_url))
		elif self._action == "logout":
			self.clear_current_user()
			return self.redirect(self.reverse_url("customerLogin"))
		elif self._action == "oauth":
			self.handle_oauth(next_url)
		elif self._action == "weixin":
			return self.redirect(self.get_weixin_login_url(next_url))
		elif self._action == 'qq':
			print('login in qq')
			return self.redirect(self.get_qq_login_url(next_url))
		elif self._action == 'qqoauth':
			print('login qqoauth')
			self.handle_qq_oauth(next_url)
		else:
			return self.send_error(404)

	#@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("phone", "password", "next?")
	def post(self):
		phone = self.args['phone']
		password = self.args['password']

		u = models.Customer.login_by_phone_password(self.session, self.args["phone"], self.args["password"])
		# print("[手机登录]用户ID：",u.id)
		# print("[手机登录]手机号码：",phone,"，密码：",password)
		# u = self.session.query(models.Accountinfo).filter_by(phone = phone ,password = password).first()
		if not u:
			return self.send_fail(error_text = '用户不存在或密码不正确 ')
		self.set_current_user(u, domain=ROOT_HOST_NAME)
		return self.send_success()

	@CustomerBaseHandler.check_arguments("code")
	def handle_qq_oauth(self,next_url):
		print('login in handle_qq_oauth')
		code = self.args['code']
		print(code,'handle_qq_oauth code')
		userinfo = QqOauth.get_qqinfo(code)
		if not userinfo:
			return self.redirect(self.reverse_url("customerLogin"))
		u = models.Customer.register_with_qq(self.session,userinfo)
		self.set_current_user(u,domain = ROOT_HOST_NAME)
		return self.redirect(next_url)

	@CustomerBaseHandler.check_arguments("code", "state?", "mode")
	def handle_oauth(self,next_url):
		# todo: handle state
		code =self.args["code"]
		mode = self.args["mode"]
		if mode not in ["mp", "kf"]:
			return self.send_error(400)

		userinfo = self.get_wx_userinfo(code, mode)
		if not userinfo:
			return self.redirect(self.reverse_url("customerLogin"))
		u = models.Customer.register_with_wx(self.session, userinfo)
		self.set_current_user(u, domain=ROOT_HOST_NAME)
		return self.redirect(next_url)

# 第三方登录
class Third(CustomerBaseHandler):
	def initialize(self, action):
		self._action = action
	def get(self):
		action =self._action
		if self._action == "weixin":
			return self.redirect(self.get_weixin_login_url())

# 商品详情
class customerGoods(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self,shop_code,goods_id):
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code=shop_code).first()
		except:
			return self.send_error(404)
		if shop:
			self.set_cookie("market_shop_id", str(shop.id))  # 执行完这句时浏览器的cookie并没有设置好，所以执行get_cookie时会报错
			self._shop_code = shop.shop_code
			self.set_cookie("market_shop_code",str(shop.shop_code))
			shop_name = shop.shop_name
			shop_code = shop.shop_code
		else:
			shop_name =''
		good = self.session.query(models.Fruit).filter_by(id=goods_id).first()
		try:
			favour = self.session.query(models.FruitFavour).filter_by(customer_id = self.current_user.id,f_m_id = goods_id,type = 0).first()
		except:
			favour = None
		if favour is None:
			good.favour_today = False
		else:
			good.favour_today = favour.create_date == datetime.date.today()

		if good:
			if good.img_url:
				img_url= good.img_url.split(";")
			else:
				img_url= ''
		else:
			good = []
			img_url = ''

		charge_types= []
		for charge_type in good.charge_types:
			if charge_type.active != 0:
				unit  = charge_type.unit
				unit =self.getUnit(unit)
				limit_today = False
				allow_num = ''
				try:
					limit_if = self.session.query(models.GoodsLimit).filter_by(charge_type_id = charge_type.id,customer_id = self.current_user.id)\
					.order_by(models.GoodsLimit.create_time.desc()).first()
				except:
					limit_if = None
				if limit_if and good.limit_num !=0:
					time_now = datetime.datetime.now().strftime('%Y-%m-%d')
					create_time = limit_if.create_time.strftime('%Y-%m-%d')
					if time_now == create_time:
						limit_today = True
						if limit_if.limit_num == good.limit_num:
							allow_num = limit_if.allow_num
						else:
							allow_num = good.limit_num - limit_if.buy_num
				charge_types.append({'id':charge_type.id,'price':charge_type.price,'num':charge_type.num, 'unit':unit,\
					'market_price':charge_type.market_price,'relate':charge_type.relate,"limit_today":limit_today,"allow_num":allow_num})
		if not self.session.query(models.Cart).filter_by(id=self.current_user.id, shop_id=shop.id).first():
			self.session.add(models.Cart(id=self.current_user.id, shop_id=shop.id))  # 如果没有购物车，就增加一个
			self.session.commit()
		cart_f = self.read_cart(shop.id)
		cart_fs = [(key, cart_f[key]['num']) for key in cart_f]
		cart_count = len(cart_f)
		self.set_cookie("cart_count", str(cart_count))
		return self.render(self.tpl_path(shop.shop_tpl)+'/goods-detail.html',good=good,img_url=img_url,shop_name=shop_name,charge_types=charge_types,cart_fs=cart_fs)

# 手机注册
class RegistByPhone(CustomerBaseHandler):
	def get(self):
		return self.render("login/m_register.html")

	@CustomerBaseHandler.check_arguments("phone:str","code:int")
	def handle_checkcode_regist(self):
		phone = self.args['phone']
		if not check_msg_token(phone = self.args["phone"],code = self.args["code"]):
			return self.send_fail(error_text = "验证码过期或者不正确")
		else:
			# u = models.Accountinfo(phone = phone ,password = password)
			# self.session.add(u)
			# self.session.commit()
			# self.set_current_user(u, domain=ROOT_HOST_NAME)
			return self.send_success()

	@CustomerBaseHandler.check_arguments("phone:str")
	def handle_gencode(self):
		a=self.session.query(models.Accountinfo).filter(models.Accountinfo.phone==self.args["phone"]).first()
		if a:
			return self.send_fail(error_text="手机号已经绑定其他账号")
		# print("[手机注册]发送验证码到手机：",self.args["phone"])
		resault = gen_msg_token(phone=self.args["phone"])
		if resault == True:
			# print("[手机注册]向手机号",phone,"发送短信验证",resault,"成功")
			return self.send_success()
		else:
			return self.send_fail(resault)

	@CustomerBaseHandler.check_arguments( "action:str",  "phone?:str","password?:str")
	def post(self):
		action = self.args['action']
		if action == "get_code":
			self.handle_gencode()
		elif action == 'check_code':
			self.handle_checkcode_regist()
		elif action == 'regist':
			phone = self.args['phone']
			password = self.args['password']
			# u = self.regist_by_phone_password(self.session,phone,password)
			u = models.Customer.regist_by_phone_password(self.session,phone,password)

			# u = self.session.query(models.Accountinfo).filter_by(phone = phone).first()
			# if u:
			# 	return self.send_fail("该手机号 已被注册，请直接登入")
			# else:
			# 	u = models.Accountinfo(phone = phone ,password = password)
			# 	self.session.add(u)
			# 	self.session.commit()
			self.set_current_user(u, domain=ROOT_HOST_NAME)
			# print("[手机注册]手机号",phone,"注册成功，用户ID为：",u.id)
			return self.send_success()

# 重置密码
class Password(CustomerBaseHandler):
	def get(self):
		return self.render("login/m_password.html")

	@CustomerBaseHandler.check_arguments("phone:str","code:int")
	def handle_checkcode_reset(self):
		phone = self.args['phone']
		if not check_msg_token(phone = self.args["phone"],code = self.args["code"]):
			return self.send_fail(error_text = "验证码过期或者不正确")
		else:
			return self.send_success()

	@CustomerBaseHandler.check_arguments("phone:str")
	def handle_gencode(self):
		a=self.session.query(models.Accountinfo).filter(models.Accountinfo.phone==self.args["phone"]).first()
		if a:
			resault = gen_msg_token(phone=self.args["phone"])
			if resault == True:
				return self.send_success()
			else:
				return self.send_fail(resault)
		else:
			return self.send_fail(error_text="该手机号不存在")

	@CustomerBaseHandler.check_arguments( "action:str",  "phone?:str","password?:str")
	def post(self):
		action = self.args['action']
		if action == "get_code":
			self.handle_gencode()
		elif action == 'check_code':
			self.handle_checkcode_reset()
		elif action == 'reset':
			phone = self.args['phone']
			password = self.args['password']
			u = self.session.query(models.Accountinfo).filter(models.Accountinfo.phone==self.args["phone"]).first()
			u.update(self.session,password=password)
			return self.send_success()

# 我的
class Home(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self,shop_code):
		# shop_id = self.shop_id
		# print("[个人中心]店铺号：",shop_code)

		# 用于标识 是否现实 用户余额 ，当 店铺 认证 通过之后 为 True ，否则为False
		show_balance = False
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code =shop_code).first()
		except:
			return self.send_fail('shop error')
		# print(shop.shop_code)
		if shop is not None:
			shop_name = shop.shop_name
			shop_id   = shop.id
			shop_logo = shop.shop_trademark_url
			balance_on = shop.config.balance_on_active
			if shop.marketing:
				shop_marketing = shop.marketing.confess_active
			else:
				shop_marketing = 0
			if shop.shop_auth in [1,2,3,4]:
				show_balance = True
			# print(shop,shop.shop_auth)
		else:
			# print("[个人中心]店铺不存在：",shop_code)
			return self.send_fail('shop not found')
		customer_id = self.current_user.id
		self.set_cookie("market_shop_id", str(shop.id))  # 执行完这句时浏览器的cookie并没有设置好，所以执行get_cookie时会报错
		self._shop_code = shop.shop_code
		self.set_cookie("market_shop_code",str(shop.shop_code))
		self.set_cookie("shop_marketing", str(shop_marketing))
		shop_point = 0
		shop_balance = 0
		try:
			shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = \
				customer_id,shop_id =shop_id).first()
		except:
			return self.send_fail("point show error")
		if shop_follow:
			if shop_follow.shop_point:
				shop_point = int(shop_follow.shop_point)
				shop_balance = format(shop_follow.shop_balance,'.2f')
			else:
				shop_point = 0
				shop_balance = 0
		count = {3: 0, 4: 0, 5: 0, 6: 0}  # 3:未处理 4:待收货，5：已送达，6：售后订单
		for order in self.current_user.orders:
			if order.status == 1 or order.status == -1:
				count[3] += 1
			elif order.status in (2, 3, 4):
				count[4] += 1
			elif order.status == 5:
				count[5] += 1
			elif order.status == 10:
				count[6] += 1
		a=self.session.query(models.CouponsCustomer).filter_by(shop_id=shop.id,customer_id=customer_id).count()
		return self.render(self.tpl_path(shop.shop_tpl)+"/personal-center.html", count=count,shop_point =shop_point, \
			shop_name = shop_name,shop_logo = shop_logo, shop_balance = shop_balance ,\
			a=a,show_balance = show_balance,balance_on=balance_on,context=dict(subpage='center'))

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action", "data")
	def post(self,shop_code):
		action = self.args["action"]
		data = self.args["data"]
		if action == "add_address":
			address = models.Address(customer_id=self.current_user.id,
									 phone=data["phone"],
									 receiver=data["receiver"],
									 address_text=data["address_text"])
			self.session.add(address)
			self.session.commit()
			return self.send_success(address_id=address.id)
		elif action == "edit_address":
			address = next((x for x in self.current_user.addresses if x.id == int(data["address_id"])), None)
			if not address:
				return self.send_fail("修改地址失败", 403)
			address.update(session=self.session, phone=data["phone"],
						   receiver=data["receiver"],
						   address_text=data["address_text"])
		elif action == "del_address":
			try: q = self.session.query(models.Address).filter_by(id=int(data["address_id"]))
			except:return self.send_error(404)
			q.delete()
			self.session.commit()
		return self.send_success()

# 发现
class Discover(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self,shop_code):
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code =shop_code).first()
		except:
			return self.send_fail('shop error')
		if shop:
			if shop.marketing:
				shop_marketing = shop.marketing.confess_active
				confess_active = shop.marketing.confess_active
			else:
				shop_marketing = 0
				confess_active = 0
			shop_auth = shop.shop_auth
			self.set_cookie("market_shop_id", str(shop.id))  # 执行完这句时浏览器的cookie并没有设置好，所以执行get_cookie时会报错
			self.set_cookie("market_shop_code",str(shop.shop_code))
			self.set_cookie("shop_marketing", str(shop_marketing))
		else:
			shop_auth = 0
			confess_active = 0
		try:
			confess_count =self.session.query(models.ConfessionWall).filter_by( shop_id = shop.id,customer_id =self.current_user.id,scan=0).count()
		except:
			confess_count = 0
		q=self.session.query(models.CouponsShop).filter_by(shop_id=shop.id,closed=0,coupon_type=0).all()
		a=0
		now_date=int(time.time())
		for x in q :
			if now_date>=x.from_get_date:
				a+=1
		return self.render(self.tpl_path(shop.shop_tpl)+'/discover.html',context=dict(subpage='discover'),shop_code=shop_code,shop_auth=shop_auth,confess_active=confess_active,confess_count=confess_count,a=a)

# 店铺 - 店铺地图
class ShopArea(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self,shop_code):
		address = None
		shop =  self.session.query(models.Shop).filter_by(shop_code = shop_code).first()
		if not shop:
			return self.send_fail('shop not found')
		lat = shop.lat
		lon = shop.lon
		shop_name = shop.shop_name
		address = self.code_to_text("shop_city", shop.shop_city) + " " + shop.shop_address_detail
		area_type = shop.area_type
		roundness = shop.roundness
		area_radius = shop.area_radius
		area_list = shop.area_list
		return self.render('customer/shop-area.html',context=dict(subpage=''),\
			address = address,lat = lat ,lon = lon,shop_name=shop_name,area_type=area_type,roundness=roundness,area_radius=area_radius,area_list=area_list)

# 个人中心
class CustomerProfile(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action?")
	def get(self):
		# 模板中通过current_user获取当前admin的相关数据，
		# 具体可以查看models.ShopAdmin中的属性
		customer_id = self.current_user.id
		time_tuple = time.localtime(self.current_user.accountinfo.birthday)
		birthday = time.strftime("%Y-%m-%d", time_tuple)
		shop_info = []
		follow = ''
		wxnotice=''
		if 'action' in self.args:
			action = self.args['action']
			if action == 'wxsuccess':
				wxnotice='微信绑定成功'
			elif action == 'wxrepeat':
				wxnotice='您已绑定该微信，无需重复绑定'
			elif action == 'wxbinded':
				wxnotice='该微信账号已被绑定，请更换其它微信账号'
		try:
			follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = self.current_user.id).order_by(models.CustomerShopFollow.create_time.desc()).limit(3).all()
		except:
			# print('[个人中心]该用户未关注任何店铺')
			print('[PersonalCenter]Current_user have not followed any shop')
		for shopfollow in follow:
			shop=self.session.query(models.Shop).filter_by(id = shopfollow.shop_id).first()
			shop_info.append({'logo':shop.shop_trademark_url,'shop_code':shop.shop_code})
		# print(self.current_shop,self.current_shop.shop_auth)

		third=[]
		accountinfo =self.session.query(models.Accountinfo).filter_by(id = self.current_user.accountinfo.id).first()
		if accountinfo.wx_unionid:
			third.append({'weixin':True})
		self.render("customer/profile.html", context=dict(birthday=birthday,third=third,shop_info=shop_info,wxnotice=wxnotice))


	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action", "data","old_password?:str")
	def post(self):
		action = self.args["action"]
		data = self.args["data"]

		if action == "edit_realname":
			self.current_user.accountinfo.update(session=self.session, realname=data)
		elif action == "edit_email":
			self.current_user.accountinfo.update(session=self.session, email=data)
		elif action == "edit_sex":
			self.current_user.accountinfo.update(session=self.session, sex=data)
		elif action == "edit_birthday":
			year = int(data["year"])
			month = int(data["month"])
			day = int(data["day"])
			try:
				birthday = datetime.datetime(year=year, month=month, day=day)
			except ValueError as e:
				return self.send_fail("请填写正确的年月日格式")
			self.current_user.accountinfo.update(session=self.session, birthday=time.mktime(birthday.timetuple()))
			#time_tuple = time.localtime(birthday)
			#print(type(time_tuple))
			birthday = birthday.strftime("%Y-%m-%d")
			return self.send_success(birthday=birthday)
		elif action == 'add_password':
			self.current_user.accountinfo.update(session = self.session , password = data)
			# print("[设置密码]设置成功，密码：",data)
		elif action == 'modify_password':
			old_password = self.args['old_password']
			# print("[更改密码]输入老密码：",old_password)
			# print("[更改密码]验证老密码：",self.current_user.accountinfo.password)
			if old_password != self.current_user.accountinfo.password:
				# print("[更改密码]密码验证错误")
				return self.send_fail("密码错误")
			else:
				self.current_user.accountinfo.update(session = self.session ,password = data)
				# print("[更改密码]更改成功，新密码：",data)
		elif action =='wx_bind':
			wx_bind = False
			if self.current_user.accountinfo.wx_unionid:
				wx_bind = True
			return self.send_success(wx_bind=wx_bind)
		elif action == 'reset_password':
			data = self.args["data"]
			new_password = data['password']
			self.current_user.accountinfo.update(session = self.session ,password = password)

		else:
			return self.send_error(404)
		return self.send_success()

# 个人中心 - 绑定微信
class WxBind(CustomerBaseHandler):
	@tornado.web.authenticated
	def initialize(self, action):
		self._action = action
	def get(self):
		next_url = self.get_argument('next', '')
		if self._action == 'wx_auth':
			return self.redirect(self.get_wexin_oauth_link2(next_url=next_url))
		elif self._action == 'wx_bind':
			# return self.bind_wx(next_url)
			if self.is_wexin_browser():
				return self.bind_wx(next_url)
			else:
				return self.write('this operate  must  on the cell phone')

	@CustomerBaseHandler.check_arguments("code", "state?", "mode")
	def bind_wx(self,next_url):
		# todo: handle state
		code =self.args["code"]
		mode = self.args["mode"]
		u = self.current_user
		user =''
		if mode not in ["mp", "kf"]:
			return self.send_error(400)
		wx_userinfo = self.get_wx_userinfo(code, mode)
		if u.accountinfo.wx_unionid == wx_userinfo["unionid"]:
			return self.redirect('/customer/profile?action=wxrepeat')
			# return self.render('notice/bind-notice.html',title='您已绑定该微信，无需重复绑定')
		try:
			user = self.session.query(models.Accountinfo).filter_by(wx_unionid=wx_userinfo["unionid"]).first()
		except:
			# print("[微信绑定]微信不存在")
			print("[WeixinBind]Weixin unionid not found")
		if user:
			return self.redirect('/customer/profile?action=wxbinded')
			# return self.render('notice/bind-notice.html',title='该微信账号已被绑定，请更换其它微信账号')
		if u:
			# print("[微信绑定]更新用户资料")
			u.accountinfo.wx_country=wx_userinfo["country"]
			u.accountinfo.wx_province=wx_userinfo["province"]
			u.accountinfo.wx_city=wx_userinfo["city"]
			u.accountinfo.sex=wx_userinfo["sex"]
			if wx_userinfo["headimgurl"] not in [None,'']:
				u.accountinfo.headimgurl=wx_userinfo["headimgurl"]
				u.accountinfo.headimgurl_small = wx_userinfo["headimgurl"][0:-1] + "132"
			else:
				u.accountinfo.headimgurl=None
				u.accountinfo.headimgurl_small = None
			u.accountinfo.wx_username = wx_userinfo["nickname"]
			u.accountinfo.nickname = wx_userinfo["nickname"]
			u.accountinfo.wx_openid = wx_userinfo["openid"]
			u.accountinfo.wx_unionid = wx_userinfo["unionid"]
			self.session.commit()
			return self.redirect('/customer/profile?action=wxsuccess')
		else:
			# print('[微信绑定]微信绑定错误')
			print("[WeixinBind]Bind Error")

# 店铺
class ShopProfile(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self, shop_code):
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code=shop_code).first()
		except:
			return self.send_fail('shop not found')
		if not shop:
			# print("[访问店铺]店铺不存在：",shop_code)
			return self.send_error(404)
		shop_id = shop.id
		shop_name = shop.shop_name
		shop_logo = shop.shop_trademark_url
		if shop.marketing:
			shop_marketing = shop.marketing.confess_active
		else:
			shop_marketing = 0

		self.set_cookie("market_shop_id", str(shop.id))  # 执行完这句时浏览器的cookie并没有设置好，所以执行get_cookie时会报错
		self._shop_code = shop.shop_code
		self.set_cookie("market_shop_code",str(shop.shop_code))
		self.set_cookie("shop_marketing", str(shop_marketing))
		satisfy = 0
		commodity_quality = 0
		send_speed        = 0
		satisfy           = 0
		#是否关注判断
		follow = True
		shop_follow =self.session.query(models.CustomerShopFollow).filter_by(customer_id=self.current_user.id, \
			shop_id=shop.id).first()
		if not shop_follow:
				follow = False
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
			else:
				satisfy = format(1,'.0%')
		# 今天是否 signin
		signin = False
		q=self.session.query(models.ShopSignIn).filter_by(
						  customer_id=self.current_user.id, shop_id=shop.id).first()
		if q and q.last_date == datetime.date.today():
			signin = True
		operate_days = (datetime.datetime.now() - datetime.datetime.fromtimestamp(shop.create_date_timestamp)).days
		fans_sum = shop.fans_count
		order_sum = shop.order_count
		goods_sum = self.session.query(models.Fruit).filter_by(shop_id=shop_id, active=1).count()
		address = self.code_to_text("shop_city", shop.shop_city) + " " + shop.shop_address_detail
		service_area = self.code_to_text("service_area", shop.shop_service_area)
		staffs = self.session.query(models.HireLink).filter_by(shop_id=shop_id,active=1).all()
		shop_members_id = [shop.admin_id]+[x.staff_id for x in staffs]
		headimgurls = self.session.query(models.Accountinfo.headimgurl_small).\
					filter(models.Accountinfo.id.in_(shop_members_id)).all()
		comment_sum = self.session.query(models.Order).filter_by(shop_id=shop_id, status=6).count()
		session = self.session
		w_id = self.current_user.id
		session.commit()
		return self.render(self.tpl_path(shop.shop_tpl)+"/shop-info.html", shop=shop, follow=follow, operate_days=operate_days,
						   fans_sum=fans_sum, order_sum=order_sum, goods_sum=goods_sum, address=address,
						   service_area=service_area, headimgurls=headimgurls, signin=signin,satisfy=satisfy,
						   comments=self.get_comments(shop_id, page_size=3), comment_sum=comment_sum,
						   context=dict(subpage='shop'),shop_name = shop_name,shop_logo = shop_logo)

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action:str")
	def post(self,shop_code):
		shop_id = self.shop_id
		action = self.args["action"]
		if action == "favour":
			if not shop_id:
				return self.send_fail()
			try:
				self.session.add(models.CustomerShopFollow(customer_id=self.current_user.id, shop_id=shop_id))
				self.session.commit()
			except:
				return self.send_fail("已关注成功")
		elif action == "signin":
			# try:
			#     point = self.session.query(models.Points).filter_by(id = self.current_user.id).first()
			# except:
			#     self.send_fail("signin point error")
			# if point is None:
			#     point =models.Points(id = self.current_user.id )
			#     self.session.add(point)
			#     self.session.commit()

			signin = self.session.query(models.ShopSignIn).filter_by(
				customer_id=self.current_user.id, shop_id=shop_id).first()

			try:
				shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = self.current_user.id\
					,shop_id = shop_id).first()
			except:
				# print("[访问店铺]店铺关注出错")
				self.send_fail("shop_follow error")
			if signin:



				if signin.last_date == datetime.date.today():
					return self.send_fail("亲，你今天已经签到了，一天只能签到一次哦")
				else:  # 今天没签到
					# signIN_count add by one
					# woody
					# if point is not None:
					#     print("before sign:",point.signIn_count)
					#     point.signIn_count += 1
					#     print("after sign:",point.signIn_count)
					#	  point.count += 1
					point_history = models.PointHistory(customer_id = self.current_user.id,shop_id = shop_id)
					if point_history:
						point_history.each_point = 1
						point_history.point_type = models.POINT_TYPE.SIGNIN
						# print("point_history",point_history.each_point)
						self.session.add(point_history)
						self.session.commit()

					#shop_point add by one
					#woody
					if shop_follow is not None:
						if shop_follow.shop_point is not None:
							shop_follow.shop_point += 1
							# print("sigin success")
							self.session.commit()

					else:
						shop_follow = models.CustomerShopFollow(customer_id = self.current_user.id,shop_id = shop_id)
						shop_follow.shop_point = 1
						self.session.add(shop_follow)
						self.session.commit()
						# print("new shop_follow",shop_follow.shop_point)
					if datetime.date.today() - signin.last_date == datetime.timedelta(1):  # 判断是否连续签到
						self.current_user.credits += signin.keep_days
						signin.keep_days += 1
						if signin.keep_days >= 7:    # when keep_days is 7 ,point add by 5,set keep_day as 0
							# if point is not None:
							#     point.signIn_count += 5
								# point.count += 5
							if shop_follow:
								shop_follow.shop_point += 5
								try:
									point_history = models.PointHistory(customer_id = self.current_user.id,shop_id = shop_id)
								except:
									self.send_fail("point_history error:SERIES_SIGNIN")
								if point_history:
									point_history.point_type = models.POINT_TYPE.SERIES_SIGNIN
									point_history.each_point = 5
									self.session.add(point_history)
									self.session.commit()
									return self.send_success(notice='连续签到7天，积分+5')

							signin.keep_days = 0
					else:
						self.current_user.credits += 1
						signin.keep_days = 1
					signin.last_date = datetime.date.today()

			else:  # 没找到签到记录，插入一条
				self.session.add(models.ShopSignIn(customer_id=self.current_user.id, shop_id=shop_id))
				self.session.commit()

				point_history = models.PointHistory(customer_id = self.current_user.id,shop_id = shop_id)
				if point_history:
					point_history.each_point = 1
					point_history.point_type = models.POINT_TYPE.SIGNIN
					# print("point_history",point_history.each_point)
					self.session.add(point_history)
					self.session.commit()
				#shop_point add by one
				#woody
				if shop_follow is not None:
					if shop_follow.shop_point is not None:
						shop_follow.shop_point += 1
						# print("sigin success")
						self.session.commit()


				# if point:
				#     point.signIn_count += 1
				#     print("new signin:",point.signIn_count)
			self.session.commit()
		return self.send_success(notice='签到成功，积分+1')

# 店剖 - 店铺成员
class Members(CustomerBaseHandler):
	def get(self):
		# shop_id = self.shop_id
		try:
			shop_id = int(self.get_cookie("market_shop_id"))
		except:
			return self.send_fail("您访问的店铺有错，请返回后刷新重新访问")
		# print("[店铺成员]当前店铺ID：",shop_id)
		admin_id = self.session.query(models.Shop.admin_id).filter_by(id=shop_id).first()
		if not admin_id:
			return self.send_error(404)
		admin_id = admin_id[0]
		members = self.session.query(models.Accountinfo, models.HireLink.work).filter(
			models.HireLink.shop_id == shop_id,models.HireLink.active==1, or_(models.Accountinfo.id == models.HireLink.staff_id,
			models.Accountinfo.id == admin_id)).all()
		member_list = []
		# print(members)
		def work(id, w):
			if id == admin_id:
				return "店长"
			elif w == 1:
				return "挑货"
			else:
				return "送货"
		idlist =[]
		for member in members:
			if member[0].id not in idlist:
				idlist.append(member[0].id)
				member_list.append({"img":member[0].headimgurl_small,
									"name":member[0].nickname,
									"birthday":time.strftime("%Y-%m", time.localtime(member[0].birthday)),
									"work":work(member[0].id,member[1]),
									"phone":member[0].phone,
									"wx_username":member[0].wx_username})
		# print(member_list)
		return self.render("customer/shop-staff.html", member_list=member_list)

# 店铺 - 店铺评价
class Comment(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("page:int")
	def get(self):
		customer_id = self.current_user.id
		shop_id     = self.get_cookie("market_shop_id")
		shop_code = self.get_cookie("market_shop_code")
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
		page = self.args["page"]
		page_size = 20
		comments = self.get_comments(shop_id, page, page_size)
		date_list = []
		nomore = False
		for comment in comments:
			date_list.append({"img": comment[6], "name": comment[7],
							"comment": comment[0], "time": self.timedelta(comment[1]), "reply":comment[3], "imgurls":comment[10]})
		if date_list == []:
			nomore = True
		if page == 0:
			if len(date_list)<page_size:
				nomore = True
			return self.render("customer/comment.html", date_list=date_list,nomore=nomore,satisfy = satisfy,send_speed=send_speed,\
				shop_service = shop_service,commodity_quality=commodity_quality)
		return self.send_success(date_list=date_list,nomore=nomore)

# 店铺 - 评价详情
class ShopComment(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("customer/comment.html")

class StorageChange(tornado.websocket.WebSocketHandler):
	session = DBSession()
	def open(self):
		print('open')
	def onclose(self):
		print('on_close')
	def on_message(self,message):
		print(self,message)
		s =  message.split(',')
		print(s)
		try:
			add      = int(s[0])
			fruit_id = int(s[1])
			storage_change = float(s[2])
		except:
			self.write_message('error')
		fruit = self.session.query(models.Fruit).filter_by(id = fruit_id).first()
		if not fruit:
			print('fruit not found')
			return self.write_message('error')
		print(fruit)
		if add == 1: #购物车添加
			cart_storage = fruit.cart_storage + storage_change
			if fruit.storage < cart_storage:
				self.write_message('error')
			else:
				print(fruit.cart_storage)
				fruit.cart_storage = cart_storage
				self.session.commit()
				self.write_message('success')
		elif add == 0:
			fruit.cart_storage -= storage_change
			self.session.commit()
			self.write_message('success')
		else:
			self.write_message('error')

# 商城入口
class Market(CustomerBaseHandler):
	@tornado.web.authenticated
	# @get_unblock
	def get(self, shop_code):
		# print('login in ')
		w_follow = True
		# fruits=''
		# page_size = 10
		# return self.send_success()

		try:
			shop = self.session.query(models.Shop).filter_by(shop_code=shop_code).one()
		except NoResultFound:
			# return self.write('您访问的店铺不存在')
			pass
		print(shop.admin.id)

		if shop.admin.has_mp:
			print('haaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
			appid = shop.admin.mp_appid
			appsecret = shop.admin.mp_appsecret
			customer_id = self.current_user.id
			admin_id    = shop.admin.id
			wx_openid   = self.session.query(models.Mp_customer_link).first()
			if wx_openid:
				print('whatttttttttttttttt')
			else:
				#生成wx_openid
				if self.is_wexin_browser():
					print('weixin aaaaaaaaaaaaaaaaaaaaaaaaaaaaa',appid,appsecret)
					wx_openid = self.get_customer_openid(appid,appsecret,shop.shop_code)
					print(wx_openid,appid,appsecret)
					if wx_openid:
						admin_customer_openid = models.Mp_customer_link(admin_id = admin_id ,customer_id = customer_id , wx_openid = wx_openid)
						self.session.add(admin_customer_openid)
						self.session.commit()
					else:
						print('获取openid失败')
				else:
					print('haahahahah')
		else:
			pass
		print('success??????????????????????????????????')

		# self.current_shop = shop
		# print(self,self.current_shop)
		shop_name = shop.shop_name
		shop_logo = shop.shop_trademark_url
		shop_status = shop.status
		if shop.marketing:
			shop_marketing = shop.marketing.confess_active
		else:
			shop_marketing = 0


		self.set_cookie("market_shop_id", str(shop.id))  # 执行完这句时浏览器的cookie并没有设置好，所以执行get_cookie时会报错
		self._shop_code = shop.shop_code
		self.set_cookie("market_shop_code",str(shop.shop_code))
		self.set_cookie("shop_marketing", str(shop_marketing))

		if not self.session.query(models.CustomerShopFollow).filter_by(
				customer_id=self.current_user.id, shop_id=shop.id).first():
			w_follow = False
			shop.fans_count = shop.fans_count + 1
			shop_follow = models.CustomerShopFollow(customer_id = self.current_user.id ,shop_id = shop.id,shop_point = 0)
			if shop_follow:
				if shop_follow.shop_point is not None:
					shop_follow.shop_point += 10
					now = datetime.datetime.now()
					# print(now,shop_follow.shop_point,'follow')
				else:
					shop_follow.shop_point = 10
			if shop_follow.bing_add_point == 0:
				if self.current_user.accountinfo.phone != None:
					shop_follow.shop_point += 10
					shop_follow.bing_add_point = 1
					now = datetime.datetime.now()
					# print(now,shop_follow.shop_point,'phone')

			self.session.add(shop_follow)
			self.session.commit()

			point_history = models.PointHistory(customer_id = self.current_user.id,shop_id = shop.id)
			if point_history:
				point_history.each_point = 10
				point_history.point_type = models.POINT_TYPE.FOLLOW
				# print("point_history",point_history,point_history.each_point)

			self.session.add(point_history)
			  # 添加关注
			self.session.commit()

		# print('login in second ')
		if not self.session.query(models.Cart).filter_by(id=self.current_user.id, shop_id=shop.id).first():
			self.session.add(models.Cart(id=self.current_user.id, shop_id=shop.id))  # 如果没有购物车，就增加一个
			self.session.commit()
		cart_f = self.read_cart(shop.id)
		cart_count = len(cart_f)

		cart_fs = [(key, cart_f[key]['num']) for key in cart_f]  if cart_count > 0 else []
		# print(cart_fs)
		notices = [(x.summary, x.detail,x.img_url) for x in shop.config.notices if x.active == 1]
		self.set_cookie("cart_count", str(cart_count))
		# print(notices)

		group_list=[]

		# try:
		# 	fruits= self.session.query(models.Fruit).filter_by(shop_id = shop.id).all()
		# except:
		# 	fruits = None
		# if fruits and fruits!=[]:
		# 	goods = self.session.query(models.Fruit).filter_by(shop_id = shop.id)
		# 	group_priority = self.session.query(models.GroupPriority).filter_by(shop_id = shop.id).order_by(models.GroupPriority.priority).all()
		# 	default_count = goods.filter_by(group_id=0,active=1).count()
		# 	record_count = goods.filter_by(group_id=-1,active=1).count()
		# 	if group_priority:
		# 		for temp in group_priority:
		# 			group_id = temp.group_id
		# 			if group_id == -1 and record_count !=0:
		# 				group_list.append({'id':-1,'name':'店铺推荐'})
		# 			elif group_id == 0 and default_count !=0:
		# 				group_list.append({'id':0,'name':' 默认分组'})
		# 			else:
		# 				_group = self.session.query(models.GoodsGroup).filter_by(id=group_id,shop_id = shop.id,status = 1).first()
		# 				if _group:
		# 					goods_count = goods.filter_by( group_id = _group.id,active=1).count()
		# 					if goods_count !=0 :
		# 						group_list.append({'id':_group.id,'name':_group.name})
		# 	else:
		# 		if record_count !=0 :
		# 			group_list.append({'id':-1,'name':'店铺推荐'})
		# 		if default_count !=0 :
		# 			group_list.append({'id':0,'name':'默认分组'})
		try:
			goods = self.session.query(models.Fruit.group_id,models.GroupPriority.priority).outerjoin(models.GroupPriority,and_(models.Fruit.shop_id ==
				models.GroupPriority.shop_id,models.GroupPriority.group_id == models.Fruit.group_id)).filter(
			models.Fruit.shop_id == shop.id,models.Fruit.active == 1).order_by(models.GroupPriority.priority).distinct(models.Fruit.id)
		except:
			goods = None

		if goods:
			for temp in goods:
				# print(temp)
				if temp[0] == 0:
					if temp[1]:
						group_list.append({'id':0,'name':'默认分组'})
					else:
						group_list.insert(1,{'id':0,'name':'默认分组'})
				elif temp[0] == -1:
					if temp[1]:
						group_list.append({'id':-1,'name':'店铺推荐'})
					else:
						group_list.insert(0,{'id':-1,'name':'店铺推荐'})
				else:
					_group = self.session.query(models.GoodsGroup).filter_by(id=temp.group_id,shop_id = shop.id,status = 1).first()
					if _group:
						group_list.append({'id':_group.id,'name':_group.name})
		return self.render(self.tpl_path(shop.shop_tpl)+"/home.html",
						   context=dict(cart_count=cart_count, subpage='home',notices=notices,shop_name=shop.shop_name,\
							w_follow = w_follow,cart_fs=cart_fs,shop_logo = shop_logo,shop_status=shop_status,group_list=group_list))

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("code?")
	def get_customer_openid(self,appid,appsecret,shop_code):
		print('login in get_customer_openid')
		code = self.args.get('code',None)
		print('code',code)
		if len(code) == 0:
			print('get code')
			appid = 'wx0ed17cdc9020a96e'
			redirect_uri = APP_OAUTH_CALLBACK_URL + '/' + shop_code
			url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid={0}&redirect_uri={1}&response_type=code&scope=snsapi_base&state=123#wechat_redirect'.format(appid,redirect_uri)
			print(url)
			return self.redirect(url)
		else:
			print('has code')
			wx_openid = WxOauth2.get_access_token_openid_other(code,appid,appsecret)
			print(wx_openid)
			return wx_openid

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action:int","page?:int","menu_id?:int")
	#action(2: +1，1: -1, 0: delete, 3: 赞+1, 4:商城首页打包发送的购物车)；
	def post(self, shop_code):
		action = self.args["action"]
		if action == 3:
			return self.favour()
		elif action == 4:
			return self.cart_list()
		elif action == 5:
			return self.commodity_list()
		elif action in (2, 1, 0):  # 更新购物车
			return self.cart(action)
		elif action == 6:
			return self.fruit_list()
		elif action == 7:
			return self.dry_list()
		elif action == 8:
			return self.mgood_list()
		elif action == 9:
			return self.search_list()
	# @classmethod
	def w_getdata(self,session,m,customer_id):
			data = []
			w_tag = ''
			# print(customer_id)
			for fruit in m:
				try:
					# print('fruit id',fruit.id)
					favour = session.query(models.FruitFavour).filter_by(customer_id = customer_id,\
						f_m_id = fruit.id , type = 0).first()

				except:
					# print('favour_today error')
					favour = None
				if favour is None:
					favour_today = False
				else:
					favour_today = favour.create_date == datetime.date.today()
				# print('favour_today',favour_today)

				charge_types= []
				for charge_type in fruit.charge_types:
					if charge_type.active !=0:
						unit  = charge_type.unit
						unit =self.getUnit(unit)

						limit_today = False
						allow_num = ''
						try:
							limit_if = session.query(models.GoodsLimit).filter_by(charge_type_id = charge_type.id,customer_id = customer_id)\
							.order_by(models.GoodsLimit.create_time.desc()).first()
						except:
							limit_if = None
						if limit_if and fruit.limit_num !=0:
							time_now = datetime.datetime.now().strftime('%Y-%m-%d')
							create_time = limit_if.create_time.strftime('%Y-%m-%d')
							if time_now == create_time:
								limit_today = True
								if limit_if.limit_num == fruit.limit_num:
									allow_num = limit_if.allow_num
								else:
									allow_num = fruit.limit_num - limit_if.buy_num
						charge_types.append({'id':charge_type.id,'price':charge_type.price,'num':charge_type.num, 'unit':unit,\
							'market_price':charge_type.market_price,'relate':charge_type.relate,'limit_today':str(limit_today),'allow_num':allow_num})

				img_url = fruit.img_url.split(";")[0] if fruit.img_url else None
				saled = fruit.saled if fruit.saled else 0
				# print(fruit.name,fruit.len(fruit.img_url.split(";")),fruit.detail_describe)
				if img_url == None or len(fruit.img_url.split(";"))==1 and fruit.detail_describe ==None:
					detail_no = True
				else:
					detail_no = False

				data.append({'id':fruit.id,'shop_id':fruit.shop_id,'active':fruit.active,'code':fruit.fruit_type.code,'charge_types':charge_types,\
					'storage':fruit.storage,'tag':fruit.tag,'img_url':img_url,'intro':fruit.intro,'name':fruit.name,'saled':saled,'favour':fruit.favour,\
					'favour_today':str(favour_today),'group_id':fruit.group_id,'limit_num':fruit.limit_num,'detail_no':str(detail_no)})
			return data

	@CustomerBaseHandler.check_arguments("page?:int","group_id?:int")
	def fruit_list(self):
		page = int(self.args["page"])
		group_id = int(self.args['group_id'])
		# print(group_id,'group_id')
		page_size = 10
		nomore = False
		offset = (page-1) * page_size
		shop_id = int(self.get_cookie("market_shop_id"))
		customer_id = self.current_user.id

		# fruits_test = self.session.query(models.Fruit,models.FruitFavour,models.FruitFavour.create_date).join(models.FruitFavour,models.FruitFavour.f_m_id ==
		# 	models.Fruit.id).filter(models.Fruit.shop_id == shop_id,models.FruitFavour.customer_id == customer_id)

		# for temp in fruits_test:
		# 	print(temp)

		try:
			fruits = self.session.query(models.Fruit).filter_by(shop_id = shop_id,group_id = group_id,active=1)\
			.order_by(models.Fruit.priority.desc(),models.Fruit.add_time.desc())
		except:
			return self.send_fail("fruits not found")
		count_fruit = fruits.count()
		total_page = int(count_fruit/page_size) if count_fruit % page_size == 0 else int(count_fruit/page_size)+1
		if total_page <= page:
			nomore = True
		fruits = fruits.offset(offset).limit(page_size).all()
		fruit_list = self.w_getdata(self.session,fruits,customer_id)
		# print(total_page)
		return self.send_success(data = fruit_list ,nomore = nomore,group_id=group_id)

	@CustomerBaseHandler.check_arguments("page?:int","search?:str")
	def search_list(self):
		page = int(self.args["page"])
		name = urllib.parse.unquote(self.args['search'])
		page_size = 10
		nomore = False
		offset = (page-1) * page_size
		shop_id = int(self.get_cookie("market_shop_id"))
		customer_id = self.current_user.id
		try:
			fruits = self.session.query(models.Fruit).filter_by(shop_id = shop_id,active=1).filter(models.Fruit.name.like("%%%s%%" % name)).order_by(models.Fruit.add_time.desc())
		except:
			return self.send_fail('fruits not found')
		count_fruit = fruits.count()
		total_page = int(count_fruit/page_size) if count_fruit % page_size == 0 else int(count_fruit/page_size)+1
		if total_page <= page:
			nomore = True
		#fruits = fruits.offset(offset).limit(page_size).all()
		fruits = fruits.all()
		fruit_list = self.w_getdata(self.session,fruits,customer_id)
		return self.send_success(data = fruit_list ,nomore = nomore)

	@unblock
	@CustomerBaseHandler.check_arguments("page?:int")
	def commodity_list(self):
		page = self.args["page"]
		page_size = 10
		offset = (page -1) * page_size
		nomore = False
		# print('login in commodity_list')

		customer_id = self.current_user.id
		shop_id = int(self.get_cookie('market_shop_id'))
		shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
		if not shop:
			return self,send_error(404)
		fruit_only = self.session.query(models.Fruit).filter_by(shop_id = shop_id,active =1)
		group_only = self.session.query(models.GroupPriority).filter_by(shop_id = shop_id)
		fruits = self.session.query(models.Fruit).join(models.Shop,models.Fruit.shop_id == models.Shop.id,\
			).join(models.GroupPriority,models.Fruit.group_id == models.GroupPriority.group_id).filter(models.Fruit.shop_id == shop_id,\
			models.Fruit.active == 1,models.Fruit.id !=None).order_by(models.GroupPriority.group_id,models.Fruit.priority.desc(),\
			models.Fruit.add_time.desc()).distinct(models.Fruit.id).all()
		# for fruit in fruits:
		# 	print(fruit.id,fruit.shop_id,fruit.group_id,fruit.priority,fruit.add_time)
		count_fruit =fruits.distinct().count()
		total_page = int(count_fruit/page_size) if count_fruit % page_size == 0 else int(count_fruit/page_size)+1
		if total_page <= page:
			nomore = True
		fruits = fruits.offset(offset).limit(page_size).all() if count_fruit >10  else fruits.all()
		fruits_data = self.w_getdata(self.session,fruits,customer_id)
		return self.send_success(data = fruits_data,nomore=nomore)

	@CustomerBaseHandler.check_arguments("charge_type_id:int")  # menu_type(0：fruit，1：menu)
	def favour(self):
		fruit_id = int(self.args["charge_type_id"])
		shop_id = int(self.get_cookie("market_shop_id"))
		favour = self.session.query(models.FruitFavour).\
			filter_by(customer_id=self.current_user.id,f_m_id=fruit_id).first()
		try:
			shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = self.current_user.id \
				,shop_id = shop_id).first()
		except:
			self.send_fail("shop_point error")
		if favour:
			if favour.create_date == datetime.date.today():
				return self.send_fail("亲，你今天已经为该商品点过赞了，一天只能对一个商品赞一次哦")
			else:  # 今天没点过赞，更新时间
				try:
					point_history = models.PointHistory(customer_id = self.current_user.id ,shop_id =shop_id)
				except:
					self.send_fail("point_history error:FAVOUR")
				if point_history is not None:
					point_history.point_type = models.POINT_TYPE.FAVOUR
					point_history.each_point = 1
					self.session.add(point_history)
					self.session.commit()
				else:
					print("Market: point_history None")
				if shop_follow:
					shop_follow.shop_point += 1
					now = datetime.datetime.now()
					# print(now,shop_follow.shop_point,'favour')

				favour.create_date = datetime.date.today()
		else:  # 没找到点赞记录，插入一条
			self.session.add(models.FruitFavour(customer_id=self.current_user.id,
					  f_m_id=fruit_id, type=0))
			self.session.commit()

			try:
				point_history = models.PointHistory(customer_id = self.current_user.id ,shop_id =shop_id)
			except:
				self.send_fail("point_history error:FAVOUR")
			if point_history is not None:
				point_history.point_type = models.POINT_TYPE.FAVOUR
				point_history.each_point = 1
				self.session.add(point_history)
				self.session.commit()
			else:
				print("Market: point_history None")

			if shop_follow:
					shop_follow.shop_point += 1
					now = datetime.datetime.now()
			else:
				print('Market: customer_shop_follow not fount')
		# 商品赞+1

		try:
			f = self.session.query(models.Fruit).filter_by(id=fruit_id).one()
		except:
			return self.send_error(404)

		f.favour += 1
		self.session.commit()
		return self.send_success(notice='点赞成功，积分+1')


	@CustomerBaseHandler.check_arguments("fruits")
	def cart_list(self):
		fruits = self.args["fruits"]
		if len(fruits) > 20:
			return self.send_fail("你往购物篮里塞了太多东西啦！请不要一次性购买超过20种物品～")
		cart = self.session.query(models.Cart).filter_by(id=self.current_user.id, shop_id=self.shop_id).one()
		fruits2 = {}
		for key in fruits:
			fruits2[int(key)] = fruits[key]
		cart.fruits = str(fruits2)
		self.session.commit()
		return self.send_success()

	@CustomerBaseHandler.check_arguments("charge_type_id:int")
	def cart(self, action):
		charge_type_id = self.args["charge_type_id"]
		self.save_cart(charge_type_id, self.shop_id, action)
		return self.send_success()

# 商品 - 商品搜索
class GoodsSearch(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self):
		shop_id = self.shop_id
		shop = self.session.query(models.Shop).filter_by(id=shop_id ).first()
		if not shop:
			return self.send_error(404)
		return self.render("customer/search-goods-list.html",context=dict(subpage='home'))

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("search:str")
	def post(self):
		shop_id = self.shop_id
		search = self.args["search"]
		data = []
		name_list = self.session.query(models.Fruit.name).filter_by(shop_id = shop_id,active=1).filter(models.Fruit.name.like("%%%s%%" % search))
		names = name_list.distinct().all()
		if names:
			for name in names:
				count = self.session.query(models.Fruit).filter_by(shop_id = shop_id,active=1,name = name[0]).count()
				data.append({'name':name[0],'num':count})
		else:
			data = []
		return self.send_success(data=data)

# 购物篮
class Cart(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self,shop_code):

		customer_id = self.current_user.id
		phone = self.get_phone(customer_id)

		show_balance = False
		balance_value = 0
		storages = {}
		shop_new = 0
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code=shop_code).one()
		except:
			return self.send_fail('shop error')
		if not shop:return self.send_error(404)

		self.set_cookie("market_shop_code",str(shop.shop_code))
		if self.get_cookie("market_shop_code") != shop_code:
			print("Cart: present market_shop_code doesn't exist in cookie" )

		# print("[购物篮]当前店铺：",shop)
		if shop.shop_auth in [1,2,3,4]:
			show_balance = True

		shop_code = shop.shop_code
		shop_name = shop.shop_name
		shop_id = shop.id
		shop_logo = shop.shop_trademark_url
		shop_status = shop.status
		if shop.marketing:
			shop_marketing = shop.marketing.confess_active
		else:
			shop_marketing = 0
		try:
			customer_follow =self.session.query(models.CustomerShopFollow).\
			filter_by(customer_id = customer_id,shop_id =shop_id ).first()
		except:
			print('Cart: custormer_balance error')
		if customer_follow:
			if customer_follow.shop_balance:
				balance_value = format(customer_follow.shop_balance,'.2f')
			shop_new = customer_follow.shop_new
		self.set_cookie("market_shop_id", str(shop.id))  # 执行完这句时浏览器的cookie并没有设置好，所以执行get_cookie时会报错
		self._shop_code = shop.shop_code
		self.set_cookie("shop_marketing", str(shop_marketing))
		cart = next((x for x in self.current_user.carts if x.shop_id == shop_id), None)
		if not cart or (not (eval(cart.fruits))): #购物车为空
			return self.render(self.tpl_path(shop.shop_tpl)+"/cart-empty.html",context=dict(subpage='cart'))
		cart_f = self.read_cart(shop_id)
		for item in cart_f:
			fruit = cart_f[item].get('charge_type').fruit
			fruit_id = fruit.id
			fruit_storage = fruit.storage
			if fruit_id not in storages:
				storages[fruit_id] = fruit_storage
		periods = self.session.query(models.Period).filter_by(config_id = shop_id ,active = 1).all()
		data=[]
		q=self.session.query(models.CouponsCustomer).filter_by(customer_id=customer_id,shop_id=shop.id,coupon_status=1).all()
		coupon_number=0
		for x in q:
			now_date=int(time.time())
			if now_date<x.effective_time:
				pass
			else:
				coupon_number+=1
				effective_time=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.effective_time))
				uneffective_time=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.uneffective_time))
				get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.get_date))
				q1=self.session.query(models.CouponsShop).filter_by(shop_id=x.shop_id,coupon_id=x.coupon_id).first()
				use_goods=None
				use_goods_group=None
				if q1.use_goods_group==0:
					use_goods_group="默认分组"
				elif q1.use_goods_group==-1:
					use_goods_group="店铺推荐"
				elif q1.use_goods_group==-2:
					use_goods_group="所有分组"
				else:
					q2=self.session.query(models.GoodsGroup).filter_by(shop_id=shop.id,id=q1.use_goods_group).first()
					use_goods_group=q2.name
				if q1.use_goods==-1:
					use_goods="所有分组"
				else:
					q2=self.session.query(models.Fruit).filter_by(shop_id=shop.id,id=q1.use_goods).first()
					use_goods=q2.name
				x_coupon={"effective_time":effective_time,"use_rule":q1.use_rule,"coupon_key":x.coupon_key,"coupon_money":q1.coupon_money,"get_date":get_date,\
				"uneffective_time":uneffective_time,"coupon_status":x.coupon_status,"use_goods_group":use_goods_group,"use_goods":use_goods}
				data.append(x_coupon)
		return self.render(self.tpl_path(shop.shop_tpl)+"/cart.html", cart_f=cart_f,config=shop.config,output_data=data,coupon_number=coupon_number,\
						   periods=periods,phone=phone, storages = storages,show_balance = show_balance,\
						   shop_name = shop_name,shop_logo = shop_logo,balance_value=balance_value,\
						   shop_new=shop_new,shop_status=shop_status,context=dict(subpage='cart'))

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("fruits", "pay_type:int", "period_id:int",
										 "address_id:int", "message:str", "type:int", "tip?:int",
										 "today:int",'online_type?:str',"coupon_key?:str")
	def post(self,shop_code):#提交订单
		# print("[提交订单]支付类型：",self.args['pay_type'])
		shop_id = self.shop_id
		customer_id = self.current_user.id
		fruits = self.args["fruits"]
		# print(json.dumps(self.args))
		current_shop = self.session.query(models.Shop).filter_by( id = shop_id).first()
		online_type = ''
		shop_status = current_shop.status
		can_use_coupon=0  #标记能否使用优惠券
		coupon_key=self.args["coupon_key"]
		q=[]
		qshop=[]
		if coupon_key!='None':
			q=self.session.query(models.CouponsCustomer).filter_by(coupon_key=coupon_key).first()
			qshop=self.session.query(models.CouponsShop).filter_by(shop_id=q.shop_id,coupon_id=q.coupon_id).first()
			now_date=int(time.time())
			if now_date>q.uneffective_time:
				return self.send_fail("下单失败，因为该优惠券已经过期！")
		if shop_status == 0:
			return self.send_fail('该店铺已关闭，暂不能下单(っ´▽`)っ')
		elif shop_status == 2:
			return self.send_fail('该店铺正在筹备中，暂不能下单(っ´▽`)っ')
		elif shop_status == 3:
			return self.send_fail('该店铺正在休息中，暂不能下单(っ´▽`)っ')
		if not fruits:
			return self.send_fail('请至少选择一种商品')
		unit = {1:"个", 2:"斤", 3:"份",4:"kg",5:"克",6:"升",7:"箱",8:"盒",9:"件",10:"筐",11:"包",12:""}
		if len(fruits) > 20:
			return self.send_fail("你的购物篮太满啦！请不要一次性下单超过20种物品")
		f_d={}
		totalPrice=0

		if fruits:
			if type(fruits) == str:
				fruits = json.loads(fruits)
			# print("login fruits")
			charge_types = self.session.query(models.ChargeType).filter(models.ChargeType.id.in_(fruits.keys())).all()
			for charge_type in charge_types:
				if fruits[str(charge_type.id)] in [0,None]:  # 有可能num为0，直接忽略掉
					continue
				totalPrice += charge_type.price*fruits[str(charge_type.id)] #计算订单总价
				singlemoney=charge_type.price*fruits[str(charge_type.id)] 
				fruit=charge_type.fruit
				if qshop:
					if qshop.use_goods_group==fruit.group_id and qshop.use_goods==fruit.id and singlemoney>=qshop.coupon_money:
						totalPrice-=qshop.coupon_money
						can_use_coupon=1
					if qshop.use_goods_group==-2  and qshop.use_goods==-1:
						totalPrice-=qshop.coupon_money
						can_use_coupon=1
					if qshop.use_goods_group==fruit.group_id  and qshop.use_goods==-1:
						totalPrice-=qshop.coupon_money
						can_use_coupon=1


				###使用优惠券

				num = fruits[str(charge_type.id)]*charge_type.relate*charge_type.num  #转换为库存单位对应的个数

				limit_num = charge_type.fruit.limit_num
				buy_num = int(fruits[str(charge_type.id)])

				try:
					limit_if = self.session.query(models.GoodsLimit).filter_by(charge_type_id = charge_type.id,customer_id = customer_id)\
					.order_by(models.GoodsLimit.create_time.desc()).first()
				except:
					limit_if = None
				# print(limit_num)
				if limit_num !=0:
					allow_num = limit_num - buy_num
					if allow_num < 0:
						return self.send_fail("限购商品"+charge_type.fruit.name+"购买数量已达上限")
					else:  #购买数量未超过限购数量
						if limit_if:  #有限购记录
							time_now = datetime.datetime.now().strftime('%Y-%m-%d')
							create_time = limit_if.create_time.strftime('%Y-%m-%d')
							if time_now == create_time:  #有今天的限购记录，表示今天已经购买，故禁止再次购买
								return self.send_fail('今天已经购买过该限购商品')
								# buy_num = limit_if.buy_num+buy_num
								# if limit_if.limit_num == limit_num:
								# 	allow_num = limit_if.limit_num-buy_num
								# else:
								# 	allow_num = limit_num-buy_num
								# 	if allow_num <=0:
								# 		return self.send_fail("限购商品"+charge_type.fruit.name+"购买数量已达上限")
								# goods_limit = models.GoodsLimit(charge_type_id = charge_type.id,customer_id = customer_id,limit_num=limit_num,buy_num=buy_num,allow_num = allow_num)
								# self.session.add(goods_limit)
							else:     #没有今天的限购记录，表示今天可以购买，并产生一条限购记录
								goods_limit = models.GoodsLimit(charge_type_id = charge_type.id,customer_id = customer_id,limit_num=limit_num,buy_num=buy_num,allow_num = allow_num)
								self.session.add(goods_limit)
						else:    #之前没有限购记录
							goods_limit = models.GoodsLimit(charge_type_id = charge_type.id,customer_id = customer_id,limit_num=limit_num,buy_num=buy_num,allow_num = allow_num)
							self.session.add(goods_limit)
					self.session.commit()

				charge_type.fruit.storage -= num  # 更新库存
				if charge_type.fruit.saled:
					charge_type.fruit.saled += num  # 更新销量
				else:
					charge_type.fruit.saled = num
				charge_type.fruit.current_saled += num  # 更新售出
				if charge_type.fruit.storage < 0:
					return self.send_fail('“%s”库存不足' % charge_type.fruit.name)
				# print(charge_type.price)

				f_d[charge_type.id]={"fruit_name":charge_type.fruit.name, "num":fruits[str(charge_type.id)],
									 "charge":"%.2f元/%.2f%s" % (charge_type.price, charge_type.num, unit[charge_type.unit])}

		if can_use_coupon==0 and coupon_key!='None':
			return self.send_fail("对不起，你使用的优惠券不满足使用条件，请重新选择")
		#按时达/立即送 的时间段处理
		start_time = 0
		end_time = 0
		freight = 0
		tip = 0
		send_time = 0
		now = datetime.datetime.now()
		try:config = self.session.query(models.Config).filter_by(id=shop_id).one()
		except:return self.send_fail("找不到店铺")
		if self.args["type"] == 2: #按时达
			if coupon_key=='None':
				if totalPrice< config.min_charge_on_time:
					return self.send_fail("订单总价没达到起送价，请再增加商品")
			else:
				if totalPrice+qshop.coupon_money < config.min_charge_on_time:
					return self.send_fail("订单总价没达到起送价，请再增加商品")
			freight = config.freight_on_time  # 运费
			totalPrice += freight
			today=int(self.args["today"])
			try:period = self.session.query(models.Period).filter_by(id=self.args["period_id"]).one()
			except:return self.send_fail("找不到时间段")
			if today == 1:
				if period.start_time.hour*60 + period.start_time.minute - \
					config.stop_range < datetime.datetime.now().hour*60 + datetime.datetime.now().minute:
					return self.send_fail("下单失败：已超过了该送货时间段的下单时间，请选择下一个时间段！")
				send_time = (now).strftime('%Y-%m-%d')+' '+(period.start_time).strftime('%H:%M')+'~'+(period.end_time).strftime('%H:%M')
			elif today == 2:
				tomorrow = now + datetime.timedelta(days = 1)
				send_time = (tomorrow).strftime('%Y-%m-%d')+' '+(period.start_time).strftime('%H:%M')+'~'+(period.end_time).strftime('%H:%M')
			start_time = period.start_time
			end_time = period.end_time


		elif self.args["type"] == 1:#立即送
			if totalPrice < config.min_charge_now:
				return self.send_fail("订单总价没达到起送价，请再增加商品")
			freight = config.freight_now
			totalPrice += freight
			if "tip" in self.args:
				tip = self.args["tip"]  # 立即送的小费
				totalPrice += tip
			later = now + datetime.timedelta(minutes = config.intime_period)
			start_time = datetime.time(now.hour, now.minute, now.second)
			end_time = datetime.time(later.hour,later.minute,later.second)
			send_time =  (now).strftime('%Y-%m-%d %H:%M') +'~'+ later.strftime('%H:%M')

		#按时达/立即送 开启/关闭
		if config.ontime_on == False and self.args["type"] == 2:
			return self.send_fail('该店铺已把“按时达”关闭，请选择“立即送”')
		if config.now_on == False and self.args["type"] == 1:
			return self.send_fail('该店铺已把“立即送”关闭，请选择“按时达”')
		#送货地址处理
		address = next((x for x in self.current_user.addresses if x.id == self.args["address_id"]), None)
		if not address:
			return self.send_fail("没找到地址", 404)

		# 已支付、付款类型、余额、积分处理
		money_paid = False
		pay_type = 1

		####################################################
		#  当订单 选择余额付款时 ，应判断 用户在 当前店铺的余额是否大于订单总额
		####################################################
		pay_type = self.args['pay_type']
		if pay_type == 2:
			if current_shop.shop_auth == 0:
				return self.send_fail('当前店铺未认证，余额支付不可用')
			shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = self.current_user.id,\
				shop_id = shop_id).first()
			if not shop_follow:
				return self.send_fail('shop_follow not found')
			if shop_follow.shop_balance < totalPrice:
				return self.send_fail("账户余额小于订单总额，请及时充值或选择其它支付方式")
			self.session.commit()


		count = self.session.query(models.Order).filter_by(shop_id=shop_id).count()
		num = str(shop_id) + '%06d' % count
		########################################################################
		# add default sender
		# 3.11
		# woody
		########################################################################
		w_admin = self.session.query(models.Shop).filter_by(id = shop_id).first()
		default_staff=[]
		try:
			default_staff = self.session.query(models.HireLink).filter_by( shop_id =shop_id,default_staff=1).first()
		except:
			print('Cart: this shop has no default staff')
		if default_staff:
			w_SH2_id =default_staff.staff_id
		else:
			if w_admin is not None:
					w_SH2_id = w_admin.admin.id
		if self.args['pay_type'] == 3:
			if current_shop.shop_auth == 0:
				return self.send_fail('当前店铺未认证，在线支付不可用')
			order_status = -1
			online_type = self.args['online_type']
		else:
			order_status = 1
		if  totalPrice<0:
			totalPrice=0
		if qshop:
			coupon_money=qshop.coupon_money
		else:
			coupon_money=0
		order = models.Order(customer_id=self.current_user.id,
							 shop_id=shop_id,
							 num=num,
							 phone=address.phone,
							 receiver=address.receiver,
							 address_text = address.address_text,
							 message=self.args["message"],
							 type=self.args["type"],
							 freight=freight,
							 SH2_id = w_SH2_id,
							 tip=tip,
							 totalPrice=totalPrice,  #订单总价 ，单位 元
							 money_paid=money_paid,
							 pay_type=pay_type,
							 today=self.args["today"],#1:今天；2：明天
							 start_time=start_time,
							 end_time=end_time,
							 fruits=str(f_d),
							 send_time=send_time,
							 status  = order_status,
							 online_type = online_type,
							 coupon_key=coupon_key,
							 coupon_money=coupon_money
							 )

		try:
			self.session.add(order)
			self.session.commit()
		except:
			return self.send_fail("订单提交失败")
		#使用优惠券
		coupon_key=order.coupon_key
		if coupon_key!='None':
			use_date=int(time.time())
			q=self.session.query(models.CouponsCustomer).filter_by(coupon_key=coupon_key).with_lockmode("update").first()
			q.update(session=self.session,use_date=use_date,order_id=order.id,coupon_status=2)
			qq=self.session.query(models.CouponsShop).filter_by(shop_id=order.shop_id,coupon_id=q.coupon_id).with_lockmode("update").first()
			use_number=qq.use_number+1
			qq.update(self.session,use_number=use_number)
			self.session.commit()

		cart = next((x for x in self.current_user.carts if x.shop_id == int(shop_id)), None)
		cart.update(session=self.session, fruits='{}')#清空购物车

		#如果提交订单是在线支付 ，则 将订单号存入 cookie
		if self.args['pay_type'] == 3:
			Timer(60*15,self.order_cancel_auto,(self.session,order.id,)).start()
			online_type = self.args['online_type']
			self.set_cookie('order_id',str(order.id))
			self.set_cookie('online_totalPrice',str(order.totalPrice))
			order.online_type = online_type
			self.session.commit()
			if online_type == 'wx':
				success_url = self.reverse_url('onlineWxPay')
			elif online_type == 'alipay':
				success_url = self.reverse_url('onlineAliPay')
			else:
				print("Cart: online_type error")

			return self.send_success(success_url=success_url,order_id = order.id)


		# 执行后续的记录修改

		return self.send_success(order_id = order.id)

	def order_cancel_auto(self,session,order_id):
		# print("[定时任务]订单取消：",order_id,self)
		order = session.query(models.Order).filter_by(id = order_id).first()
		if not order:
			return self.send_fail('order_cancel_auto: order not found!')
		if order.status == -1:
			order.status = 0
			order.del_reason = "timeout"
			order.get_num(session,order.id)
			# print("[定时任务]订单取消成功：",order.num)
		#else:
		#	print("[定时任务]订单取消错误，该订单已完成支付或已被店家删除：",order.num)

# 购物篮 - 订单提交回调
class CartCallback(CustomerBaseHandler):

	@CustomerBaseHandler.check_arguments('order_id')
	@tornado.web.authenticated
	def post(self):
		pass
		try:
			order_id = int(self.args['order_id'])
			# print(order_id)
		except:
			Logger.error("CartCallback: get order_id error")
			return self.send_fail("CartCallback: get order_id error")
		order = self.session.query(models.Order).filter_by(id = order_id).first()
		if not order:
			Logger.warn("CartCallback: order not found")
			return self.send_fail("CartCallback: order not found")
		totalPrice = order.totalPrice
		shop_id = order.shop_id
		customer_id = order.customer_id
		customer = self.session.query(models.Customer).filter_by(id = customer_id).first()
		shop    =  self.session.query(models.Shop).filter_by(id = shop_id).first()
		if not shop or not customer:
			Logger.warn("CartCallback: shop/customer not found")
			return self.send_fail('CartCallback: shop/customer not found')
		# 送货地址处理
		# address = next((x for x in self.current_user.addresses if x.id == self.args["address_id"]), None)
		# if not address:
		# 	return self.send_fail("没找到地址", 404)
		if shop.admin.mp_name and shop.admin.mp_appid and shop.admin.mp_appsecret:
			print(shop.admin.mp_appsecret,shop.admin.mp_appid)
			access_token = self.get_other_accessToken(self.session,shop.admin.id)
		else:
			access_token = None

		# 如果非在线支付订单，则发送模版消息（在线支付订单支付成功后再发送，处理逻辑在onlinePay.py里）
		if order.pay_type != 3:
			print(access_token,'access_token')
			self.send_admin_message(self.session,order,access_token)


		####################################################
		# 订单提交成功后 ，用户余额减少，
		# 同时生成余额变动记录,
		# 订单完成后 店铺冻结资产相应转入 店铺可提现余额
		# woody 4.29
		####################################################
		# print(self.args['pay_type'],'好难过')
		if order.pay_type == 2:
			shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = self.current_user.id,\
				shop_id = shop_id).first()
			if not shop_follow:
				return self.send_fail('shop_follow not found')
			shop_follow.shop_balance -= totalPrice   #用户对应 店铺余额减少 ，单位：元
			self.session.commit()
			#生成一条余额交易记录
			balance_record = '余额支付：订单' + order.num
			balance_history = models.BalanceHistory(customer_id = self.current_user.id,\
				shop_id = shop_id ,name = self.current_user.accountinfo.nickname,balance_value = totalPrice ,\
				balance_record = balance_record,shop_totalPrice = shop.shop_balance,\
				customer_totalPrice = shop_follow.shop_balance)
			self.session.add(balance_history)
			self.session.commit()
		return self.send_success()



class Notice(CustomerBaseHandler):
	def get(self):
		return self.render("notice/order-success.html",context=dict(subpage='cart'))

class Wexin(CustomerBaseHandler):
	@CustomerBaseHandler.check_arguments("action?:str", "url:str")
	def post(self):
		if "action" in self.args and not self.args["action"]:
			# from handlers.base import WxOauth2
			return WxOauth2.post_template_msg('o5SQ5t_xLVtTysosFBbEgaFjlRSI', '良品铺子', '廖斯敏', '13163263783')
		noncestr = "".join(random.sample('zyxwvutsrqponmlkjihgfedcba0123456789', 10))
		timestamp = datetime.datetime.now().timestamp()
		url = self.args["url"]
		# print('url',url)

		return self.send_success(noncestr=noncestr, timestamp=timestamp,
								 signature=self.signature(noncestr, timestamp, url))

# 我的 - 我的订单
class Order(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action")
	def get(self):
		action = self.args["action"]
		orders = []
		session = self.session
		id = str(time.time())
		qiniuToken = self.get_qiniu_token('comment',id)
		return self.render("customer/order-list.html", context=dict(subpage='center',qiniuToken = qiniuToken))

	@classmethod
	def get_orderData(self,session,orders):
		# print('orders',orders)
		data = []
		for order in orders:
			staff_id = order.SH2_id
			staff_info = session.query(models.Accountinfo).filter_by(id = staff_id).first()
			if staff_info is not None:
				order.sender_phone = staff_info.phone
				order.sender_img = staff_info.headimgurl_small
			else:
				order.sender_phone =None
				order.sender_img = None
			send_time = order.send_time
			order_status = order.status
			order_totalPrice = order.totalPrice
			order_num = order.num
			shop_name = order.shop.shop_name
			address_text = order.address_text
			create_date  = order.create_date.strftime(" %Y:%m:%d")
			# print(create_date)
			# print(order)
			data.append({'order_num':order_num,'shop_name':shop_name,'address_text':address_text,\
				'send_time':send_time,'order_totalPrice':order_totalPrice,'order_status':order_status,\
				'sender_phone':order.sender_phone,'sender_img':order.sender_img,'order_id':order.id,\
				'message':order.message,'comment':order.comment,'create_date':create_date,\
				'today':order.today,'type':order.type,'create_year':order.create_date.year,\
				'create_month':order.create_date.month,'create_day':order.create_date.day,'pay_type':order.pay_type,'online_type':order.online_type})
		return data

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action", "data?","page?:int",'imgUrl?:str')
	def post(self):
		# print(self,'self is what?')
		page_size = 10
		action = self.args["action"]
		session = self.session
		if action == "unhandled":

			page = self.args['page']
			offset = (page - 1) * page_size
			orders = [x for x in self.current_user.orders if x.status == 1 or x.status == -1]
			orders.sort(key = lambda order:order.send_time)
			total_count = len(orders)
			total_page  =  int(total_count/page_size) if (total_count % page_size == 0) else int(total_count/page_size) + 1
			if offset + page_size <= total_count:
				orders = orders[offset:offset + page_size]
			elif offset <= total_count and offset + page_size >= total_count:
				orders = orders[offset:]
			else:
				return self.send_fail("暂无订单")
			orders = self.get_orderData(session,orders)
			return self.send_success(orders = orders ,total_page= total_page)
		elif action == "waiting":
			page = self.args["page"]
			offset = (page - 1) * page_size
			orders = [x for x in self.current_user.orders if x.status in (2, 3, 4)]
			orders.sort(key = lambda order:order.send_time)
			total_count = len(orders)
			total_page  =  int(total_count/page_size) if (total_count % page_size == 0) else int(total_count/page_size) + 1
			# print("[订单列表]滚动加载offset：",offset)
			# print("[订单列表]滚动加载total：",total_count)
			if offset + page_size <= total_count:
				orders = orders[offset:offset + page_size]
			elif offset < total_count and offset + page_size >= total_count:
				orders = orders[offset:]
			else:
				return self.send_fail("没有待收货订单")
			orders = self.get_orderData(session,orders)
			return self.send_success(orders = orders ,total_page= total_page)
		elif action == "finish":
			page = self.args['page']
			offset = (page - 1) * page_size
			try:
				orderlist = self.session.query(models.Order).order_by(desc(models.Order.arrival_day),models.Order.arrival_time).\
				filter_by(customer_id = self.current_user.id).all()
			except:
				return self.send_fail("orderlist error")

			# Modify by Sky - 2015.6.5
			# 当前“已完成”只展示“未评价”订单，前台“已完成”改为了“未评价”，但action还未改，仍为finish
			order5 = []
			order6 = []
			for x in orderlist:
				if x.status == 5:
					order5.append(x)
			orders = order5 + order6
			total_count = len(orders)
			total_page  =  int(total_count/page_size) if (total_count % page_size == 0) else int(total_count/page_size) + 1
			if offset + page_size <= total_count:
				orders = orders[offset:offset + page_size]
			elif offset < total_count and offset + page_size >= total_count:
				orders = orders[offset:]
			else:
				return self.send_fail("暂无订单")
			orders = self.get_orderData(session,orders)
			return self.send_success(orders = orders ,total_page= total_page)
		elif action == "all":
			page = self.args["page"]
			offset = (page - 1) * page_size
			orders = self.current_user.orders
			session = self.session
			orders.sort(key = lambda order:order.send_time,reverse = True)
			total_count = len(orders)
			total_page  =  int(total_count/page_size) if (total_count % page_size == 0) else int(total_count/page_size) + 1
			if offset + page_size <= total_count:
				orders = orders[offset:offset + page_size]
			elif offset < total_count and offset + page_size >= total_count:
				orders = orders[offset:]
			else:
				return self.send_fail("暂无订单")
			orders = self.get_orderData(session,orders)
			# print(orders)
			return self.send_success(orders = orders ,total_page= total_page)
		elif action == "cancel_order":
			data = self.args["data"]
			order = next((x for x in self.current_user.orders if x.id == int(data["order_id"])), None)
			if not order:return self.send_error(404)
			if order.status == 0:
				return self.send_fail("该订单已经取消，不能重复操作")
			elif order.status in [2,3,4]:
				return self.send_fail("该订单已在配送中，无法取消")
			elif order.status in [5,6,7]:
				return self.send_fail("该订单已经送达，无法取消")
			if order.pay_type == 3 and order.status != -1:
				return self.send_fail("在线支付『已付款』的订单暂时不能取消，如有疑问请直接与店家联系")
			# print("[订单管理]取消订单，订单原状态：",order.status)
			order.status = 0
			# print("[订单管理]取消订单，订单现状态：",order.status)
			# recover the sale and storage
			# woody
			# 3.27
			session = self.session
			order.get_num(session,order.id)
			########################################################################################
			#订单取消后，如果订单 支付类型是 余额支付时， 余额返回到 用户账户
			#同时产生一条余额记录
			########################################################################################
			customer_id = order.customer_id
			shop_id     = order.shop_id
			if order.pay_type == 2:
				try:
					shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = \
						customer_id , shop_id = shop_id).first()
				except:
					return self.send_fail('shop_follow error')
				if shop_follow:
					shop_follow.shop_balance += order.totalPrice
				shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
				if not shop:
					return self.send_fail('shop not found')

				#将 该订单 对应的 余额记录取出来 ，置为 不可用

				balance_record = ("%{0}%").format(order.num)
				# print(balance_record)

				old_balance_history = self.session.query(models.BalanceHistory).filter(models.BalanceHistory.balance_record.like(balance_record)).first()
				if old_balance_history is None:
					print('Order: old history not found')
				else:
					old_balance_history.is_cancel = 1
					self.session.commit()
				#同时生成一条新的记录
				balance_history = models.BalanceHistory(customer_id = order.customer_id , shop_id = order.shop_id ,\
						balance_value = order.totalPrice,balance_record = '余额退款：订单'+ order.num + '取消', name = self.current_user.accountinfo.nickname,\
						balance_type = 5,shop_totalPrice = shop.shop_balance,customer_totalPrice = \
						shop_follow.shop_balance)
				self.session.add(balance_history)
			self.session.commit()
			cancel_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
			if order.shop.admin.has_mp:
				self.order_cancel_msg(order,cancel_time)
			else:
				self.order_cancel_msg(order,cancel_time,None)
			return self.send_success()
		elif action == "comment_point":
			data = self.args["data"]
			order = next((x for x in self.current_user.orders if x.id == int(data["order_id"])), None)
			order.commodity_quality = int(data["commodity_quality"])
			order.send_speed        = int(data["send_speed"])
			order.shop_service      = int(data["shop_service"])
			notice =''
			if int(data["commodity_quality"])==100 and int(data["send_speed"])==100 and int(data["shop_service"])==100:
				try:
					shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = \
						order.customer_id,shop_id = order.shop_id).first()
				except :
					shop_follow = None
					self.send_fail("shop_point error")

				if shop_follow:
					if shop_follow.shop_point:
						shop_follow.shop_point += 2
					try:
						point_history = models.PointHistory(customer_id = self.current_user.id , shop_id = order.shop_id)
					except:
						self.send_fail("point_history error:COMMENT")
					if point_history:
						point_history.point_type = models.POINT_TYPE.SHOP_FULLPOINT
						point_history.each_point = 2
						notice = '店铺评价满分，积分+2'
						self.session.add(point_history)
			self.session.commit()
			return self.send_success(notice=notice)
			# customer_id = self.current_user.id
			# shop_id     = self.get_cookie("market_shop_id")

			# commodity_quality,send_speed,shop_service = self.session.query(func.avg(models.Order.commodity_quality),\
			# 	func.avg(models.Order.send_speed),func.avg(models.Order.shop_service)).filter_by(customer_id =\
			# 	customer_id,shop_id = shop_id)

			# customer_id = self.current_user.id
			# shop_id     = self.get_cookie("market_shop_id")
			# shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id=customer_id,shop_id=shop_id).first()
			# if not shop_follow:
			# 	return self.send_error(404)
			# print(data["commodity_quality"],data["send_speed"])
			# shop_follow.commodity_quality = commodity_quality
			# shop_follow.send_speed        = send_speed
			# shop_follow.shop_service      = shop_service

			self.session.commit()
			return self.send_success()

		elif action == "comment":
			data = self.args["data"]
			imgUrl = data["imgUrl"]
			order = next((x for x in self.current_user.orders if x.id == int(data["order_id"])), None)
			# print(order,'i am order')
			if not order:return self.send_error(404)
			# print(order.id,'i am ')
			if order.status != 5:
				self.send_fail("只有已送达并且没有评价过的订单才能评价哦！")
			comment = order.comment
			order.status = 6
			order.comment_create_date = datetime.datetime.now()
			order.comment = data["comment"]
			order.comment_imgUrl = imgUrl
			shop_follow = ''
			notice = ''
			# shop_point add by 5
			# woody
			if comment == None:
				try:
					shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = \
						order.customer_id,shop_id = order.shop_id).first()
				except :
					shop_follow = None
					self.send_fail("shop_point error")

				if shop_follow:
					if shop_follow.shop_point:
						shop_follow.shop_point += 2
						if imgUrl:
							shop_follow.shop_point += 2
					try:
						point_history = models.PointHistory(customer_id = self.current_user.id , shop_id = order.shop_id)
					except:
						self.send_fail("point_history error:COMMENT")
					if point_history:
						point_history.point_type = models.POINT_TYPE.COMMENT
						point_history.each_point = 2
						notice = '评论成功，积分+2'
						self.session.add(point_history)
						self.session.commit()
						if imgUrl:
							point_history.point_type = models.POINT_TYPE.COMMENTIMG
							point_history.each_point = 2
							notice = '评论成功，积分+2,评论晒图，积分+2'
							self.session.add(point_history)
							self.session.commit()

			self.session.commit()
			return self.send_success(notice=notice)

			#need to rocord this poist history?
		else:
			return self.send_error(404)

# 我的 - 我的订单 - 订单详情
class OrderDetail(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self,order_id):
		order = next((x for x in self.current_user.orders if x.id == int(order_id)), None)
		if not order:return self.send_error(404)
		charge_types = self.session.query(models.ChargeType).filter(
			models.ChargeType.id.in_(eval(order.fruits).keys())).all()
		# mcharge_types = self.session.query(models.MChargeType).filter(
		# 	models.MChargeType.id.in_(eval(order.mgoods).keys())).all()
		if order.pay_type == 3:
			online_type = order.online_type
		else:
			online_type = None
		staff_id = order.SH2_id
		staff_info = self.session.query(models.Accountinfo).filter_by(id = staff_id).first()
		if staff_info is not None:
				order.sender_phone = staff_info.phone
				order.sender_img = staff_info.headimgurl_small
		else:
				order.sender_phone =None
				order.sender_img = None
		delta = datetime.timedelta(1)
		if order.comment_imgUrl:
			comment_imgUrl = order.comment_imgUrl.split(',')
		else:
			comment_imgUrl = None
		shop_code = order.shop.shop_code
		shop_name = order.shop.shop_name
		return self.render("customer/order-detail.html", order=order,charge_types=charge_types,comment_imgUrl=comment_imgUrl,\
						   online_type=online_type,shop_name=shop_name,shop_code=shop_code)

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action", "data?")
	def post(self,order_id):
		action = self.args['action']
		if action == "delete_comment":
			data = self.args['data']
			order_id = data['order_id']
			order = self.session.query(models.Order).filter_by(id = order_id).first()
			apply_list = self.session.query(models.CommentApply).filter_by(order_id = order_id).first()
			if not order:
				return self.send_fail('order not found')
			order.status = 5
			order.comment = None
			order.comment_reply = None
			if apply_list:
				apply_list.has_done=1
			self.session.commit()

			# recover point
			shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = \
				order.customer_id , shop_id = order.shop_id).first()
			if not shop_follow:
				return self.send_fail('shop_follow not found')
			if shop_follow.shop_point:
				shop_follow.shop_point -= 5
			self.session.commit()
			self.send_success()
		if action == 'change_comment':
			data = self.args['data']
			comment = data['comment']
			order_id = data['order_id']
			order = self.session.query(models.Order).filter_by(id = order_id).first()
			if not order:
				return self.send_fail('order not found')
			order.comment = comment
			self.session.commit()
			self.send_success()
		else:
			return self.send_error(404)

# 我的 - 余额详情
class Balance(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self):
		customer_id = self.current_user.id
		shop_id     = self.shop_id
		shop_balance= 0
		history     = []
		try:
			shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = customer_id,\
			shop_id = shop_id).first()
		except:
			print('Balance: shop_follow none')
		try:
			shop=self.session.query(models.Shop).filter_by(id = shop_id).first()
		except:
			print('Balance: shop none')
		if shop:
			shop_name=shop.shop_name
			shop_logo=shop.shop_trademark_url
		if not shop_follow:
			print('Balance: shop_follow not fount')
		if shop_follow:
			if shop_follow.shop_balance:
				shop_balance = shop_follow.shop_balance
				shop_balance = format(shop_balance,'.2f')
			else:
				shop_balance = 0.00

		return self.render("customer/balance.html",shop_balance = shop_balance , shop_name=shop_name, shop_logo=shop_logo)

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("page:int")
	def post(self):
		page_size = 20
		page = int(self.args["page"])
		offset = (page-1) * page_size
		customer_id = self.current_user.id
		shop_id  = self.shop_id
		history   = []
		data = []
		pages = 0
		nomore = False
		shop_balance_history=[]
		history =[]
		try:
			shop_balance_history = self.session.query(models.BalanceHistory).filter_by(customer_id =\
				customer_id , shop_id = shop_id).filter(models.BalanceHistory.balance_type.in_([0,1,4,5])).all()
		except:
			shop_balance_history = None
			# print("balance show error ")

		try:
			count = self.session.query(models.BalanceHistory).filter_by(customer_id =\
				customer_id , shop_id = shop_id).filter(models.BalanceHistory.balance_type.in_([0,1,4,5])).count()
			pages = int(count/page_size) if count % page_size == 0 else int(count/page_size) + 1
		except:
			print('Balance: pages 0')

		if pages == page:
			nomore = True

		if shop_balance_history:
			for temp in shop_balance_history:
				temp.create_time = temp.create_time.strftime('%Y-%m-%d %H:%M')
				history.append({'type':temp.balance_type,'record':temp.balance_record ,'value':temp.balance_value ,'time':temp.create_time})
		count = len(history)
		history = history[::-1]
		if offset + page_size <= count:
			data = history[offset:offset+page_size]
		elif offset <= count and offset + page_size >=count:
			data = history[offset:]
		else:
			nomore = True

		return self.send_success(data = data,nomore=nomore)

# 我的 - 积分详情
class Points(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self):
		customer_id = self.current_user.id
		shop_id     = self.shop_id
		shop_point  = 0
		history     = []
		page_size = 22
		# print(customer_id,shop_id)
		try:
			shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = \
				customer_id,shop_id =shop_id).first()
		except:
			self.send_fail("point show error")
		if shop_follow:
			if shop_follow.shop_point:
				shop_point = int(shop_follow.shop_point)
			else:
				shop_point = 0

		return self.render("customer/points.html",shop_point = shop_point)

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("page")
	def post(self):
		page = int(self.args["page"])
		page_size = 22
		offset = (page-1) * page_size
		customer_id = self.current_user.id
		shop_id     = self.shop_id
		history     = []
		data = []
		nomore = False
		try:
			shop_history = self.session.query(models.PointHistory).filter_by(customer_id =\
				customer_id,shop_id = shop_id).all()
		except:
			print("Points: point history error")

		if shop_history:
			for temp in shop_history:
				temp.create_time = temp.create_time.strftime('%Y-%m-%d %H:%M')
				history.append([temp.point_type,temp.each_point,temp.create_time])
			# print(history)
		else:
			nomore=True

		count = len(history)
		history = history[::-1]
		# print('history',history)
		if page==1 and count<=page_size:
			nomore=True
		if offset + page_size <= count:
			data = history[offset:offset+page_size]
		elif offset <= count and offset + page_size >=count:
			data = history[offset:]
		else:
			nomore=True
			# print("nomore history page")
		# print("data\n",data)

		return self.send_success(data = data,nomore=nomore)

# 余额充值
class Recharge(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments('code?:str','action?:str')
	def get(self):
		code = ''
		url=''
		action = self.args['action']
		next_url = self.get_argument('next', '')
		current_shop_id=shop_id = int(self.get_cookie("market_shop_id"))
		q=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_type=1,closed=0).order_by(models.CouponsShop.get_rule).all()
		get_rule=0
		coupon_money=0
		data=[]
		for x in q:
			qq=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=x.coupon_id,coupon_status=0).first()
			if qq!=None:
				data0={"get_rule":x.get_rule,"coupon_money":x.coupon_money,"get_limit":x.get_limit}
				data.append(data0)
		# print("[微信充值]next_url：",next_url)
		if action == 'get_code':
			# print(self.request.full_url())
			path_url = self.request.full_url()
			jsApi  = JsApi_pub()
			#path = 'http://auth.senguo.cc/fruitzone/paytest'
			path = APP_OAUTH_CALLBACK_URL + self.reverse_url('customerRecharge')
			# print("[微信充值]redirect_uri：",path)
			# print(self.args['code'],'sorry  i dont know')
			code = self.args.get('code',None)
			# print("[微信充值]当前code：",code)
			if len(code) is 2:
				url = jsApi.createOauthUrlForCode(path)
				# print("[微信充值]获取code的url：",url)
				#return self.redirect(url)
			return self.send_success(url = url)
		return self.render("customer/recharge.html",code = code,url=url ,output_data=data)

# 我的 - 我的订单 - 评价订单
class OrderComment(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments('orderid:str')
	def get(self):
		token = self.get_qiniu_token("order",self.current_user.id)
		orderid=self.args["orderid"]
		order = next((x for x in self.current_user.orders if x.id == int(orderid)), None)
		shop_id = order.shop_id
		if order is None:
			return self.send_fail("订单为空")
		imgurls = []
		if order.comment_imgUrl:
			imgurls = order.comment_imgUrl.split(',')
			length = len(imgurls)
		else:
			imgurls = None
			length = 0
		return self.render("customer/comment-order.html",token=token,order_id=orderid,imgurls = imgurls,length = length)

class ShopComment(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments('num:str')
	def get(self):
		orderid=self.args["num"]
		return self.render("customer/comment-shop.html",orderid=orderid)

class QrWxpay(CustomerBaseHandler):
	def get(self):
		import pyqrcode

class payTest(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments('code?:str','totalPrice?')
	def get(self):
		totalPrice = float(self.get_cookie('money'))
		wxPrice    = int(totalPrice * 100)
		orderId = str(self.current_user.id) +'a'+str(self.get_cookie('market_shop_id'))+ 'a'+ str(wxPrice)+'a'+str(int(time.time()))
		qr_url=""
		if not self.is_wexin_browser():
			qr_url=self._qr_pay()
			# print(res_dict['code_url'])
			# url = pyqrcode.create(res_dict['code_url'])
			# url.png('really.png',scale = 8)
			print(qr_url,'chargewxpay no in weixin')
			return self.render("customer/qrwxpay.html" , qr_url =qr_url ,totalPrice=totalPrice)
		else:
			print(self.request.full_url())
			path_url = self.request.full_url()
			jsApi  = JsApi_pub()
			path = APP_OAUTH_CALLBACK_URL + self.reverse_url('fruitzonePayTest')
			print(path , 'redirect_uri is Ture?')
			print(self.args['code'],'sorry  i dont know')
			code = self.args.get('code',None)
			print(code,'how old are you',len(code))
			if len(code) is 2:
				url = jsApi.createOauthUrlForCode(path)
				print(url,'code?')
				return self.redirect(url)
			else:
				jsApi.setCode(code)
				openid = jsApi.getOpenid()
				print(openid,code,'hope is not []')
				if not openid:
					print('openid not exit')
				unifiedOrder =   UnifiedOrder_pub()
				# totalPrice = self.args['totalPrice']
				#totalPrice =float( self.get_cookie('money'))
				print(totalPrice,'long time no see!')
				unifiedOrder.setParameter("body",'charge')
				unifiedOrder.setParameter("notify_url",'http://zone.senguo.cc/fruitzone/paytest')
				unifiedOrder.setParameter("openid",openid)
				unifiedOrder.setParameter("out_trade_no",orderId)
				#orderPriceSplite = (order.price) * 100
				print(wxPrice,'sure')
				unifiedOrder.setParameter('total_fee',wxPrice)
				unifiedOrder.setParameter('trade_type',"JSAPI")
				prepay_id = unifiedOrder.getPrepayId()
				print(prepay_id,'prepay_id================')
				jsApi.setPrepayId(prepay_id)
				renderPayParams = jsApi.getParameters()
				print(renderPayParams)
				noncestr = "".join(random.sample('zyxwvutsrqponmlkjihgfedcba0123456789', 10))
				timestamp = datetime.datetime.now().timestamp()
				wxappid = 'wx0ed17cdc9020a96e'
				signature = self.signature(noncestr,timestamp,path_url)
				# totalPrice = float(totalPrice/100)
				qr_url=self._qr_pay()
			# return self.send_success(renderPayParams = renderPayParams)
			return self.render("fruitzone/paytest.html",qr_url=qr_url,renderPayParams = renderPayParams,wxappid = wxappid,\
				noncestr = noncestr ,timestamp = timestamp,signature = signature,totalPrice = totalPrice)

	def check_xsrf_cookie(self):
		print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!wxpay xsrf pass!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		pass
		return
	def _qr_pay(self):
		totalPrice = float(self.get_cookie('money'))
		wxPrice    = int(totalPrice * 100)
		orderId = str(self.current_user.id) +'a'+str(self.get_cookie('market_shop_id'))+ 'a'+ str(wxPrice)+'a'+str(int(time.time()))
		unifiedOrder =   UnifiedOrder_pub()
		unifiedOrder.setParameter("body",'QrWxpay')
		unifiedOrder.setParameter("notify_url",'http://zone.senguo.cc/fruitzone/paytest')
		unifiedOrder.setParameter("out_trade_no",orderId+"a")
		unifiedOrder.setParameter('total_fee',wxPrice)
		unifiedOrder.setParameter('trade_type',"NATIVE")
		res = unifiedOrder.postXml().decode('utf-8')
		res_dict = unifiedOrder.xmlToArray(res)
		# print(res,type(res_dict))
		if 'code_url' in res_dict:
				qr_url = res_dict['code_url']
		else:
			qr_url = ""
		return qr_url

	@CustomerBaseHandler.check_arguments('totalPrice?:float','action?:str')
	def post(self):
			# print(self.args,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')

		# 微信 余额 支付
	#	if action == 'wx_pay':
			# print("[微信充值]回调成功")
			data = self.request.body
			# print("[微信充值]回调request.body：",self.request.body)
			xml = data.decode('utf-8')
			UnifiedOrder = UnifiedOrder_pub()
			xmlArray     = UnifiedOrder.xmlToArray(xml)
			status       = xmlArray['result_code']
			orderId      = str(xmlArray['out_trade_no'])
			result       = orderId.split('a')
			customer_id  = int(result[0])
			shop_id      = int(result[1])
			totalPrice   = (float(result[2]))/100
			transaction_id = str(xmlArray['transaction_id'])
			if status != 'SUCCESS':
				return False
		#	shop_code  = self.current_shop.shop_code
		#	shop = self.session.query(models.Shop).filter_by(shop_code = shop_code).first()
		#	if not shop:
		#		return self.send_fail('shop not found')

			#shop_id = self.get_cookie('market_shop_id')
			#customer_id = self.current_user.id


		#	code = self.args['code']
		#	path_url = self.request.full_url()



			#totalPrice =float( self.get_cookie('money'))
			#print(customer_id,shop_id,totalPrice)
			#########################################################
			# 用户余额增加
			# 同时店铺余额相应增加
			# 应放在 支付成功的回调里
			#########################################################
			# 支付成功后，用户对应店铺 余额 增加
			#判断是否已经回调过，如果记录在表中，则不执行接下来操作
			old_balance_history=self.session.query(models.BalanceHistory).filter_by(transaction_id=transaction_id).first()
			if old_balance_history:
				return self.write('success')
			shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = customer_id,\
				shop_id = shop_id).first()
			# print(customer_id, shop_id,'没充到别家店铺去吧')
			if not shop_follow:
				return self.send_fail('shop_follow not found')
			shop_follow.shop_balance += totalPrice     #充值成功，余额增加，单位为元
			self.session.commit()

			shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
			if not shop:
				return self.send_fail('shop not found')
			shop.shop_balance += totalPrice
			self.session.commit()
			# print(shop.shop_balance ,'充值后 商店 总额')

			# 支付成功后  生成一条余额支付记录
			customer = self.session.query(models.Customer).filter_by(id = customer_id).first()
			if customer:
				name = customer.accountinfo.nickname
			#name = self.current_user.accountinfo.nickname
			balance_history = models.BalanceHistory(customer_id =customer_id ,shop_id = shop_id,\
				balance_value = totalPrice,balance_record = '余额充值(微信)：用户 '+ name  , name = name , balance_type = 0,\
				shop_totalPrice = shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,transaction_id=transaction_id)
			self.session.add(balance_history)
			# print(balance_history , '钱没有白充吧？！')
			self.session.commit()
			
			# 充值送优惠券
			self.updatecoupon()
			CouponsShops=self.session.query(models.CouponsShop).filter_by(shop_id=shop_id,coupon_type=1,closed=0).order_by(models.CouponsShop.get_rule.desc()).with_lockmode('update').all()
			for x in CouponsShops:
				qhave=self.session.query(models.CouponsCustomer).filter_by(shop_id=shop_id,coupon_id=x.coupon_id,customer_id=customer_id).count()
				if  x.get_limit!=-1:
					if  qhave>=x.get_limit:
						pass
					else:
						CouponsCustomers=self.session.query(models.CouponsCustomer).filter_by(shop_id=shop_id,coupon_id=x.coupon_id,coupon_status=0).with_lockmode('update').first()
						if CouponsCustomers==None:
							pass
						else:
							now_date=int(time.time())
							CouponsCustomers.update(self.session,customer_id=customer_id,coupon_status=1,get_date=now_date)
							self.session.commit()
							break
						self.session.commit()
			return self.write('success')
	#	else:
	#		return self.send_fail('其它支付方式尚未开发')

class wxChargeCallBack(CustomerBaseHandler):
	def get(self):
		totalPrice = float(self.get_cookie('money'))
		wxPrice    = int(totalPrice * 100)
		orderId = str(self.current_user.id) +'a'+str(self.get_cookie('market_shop_id'))+ 'a'+ str(wxPrice)+'a'+str(int(time.time()))
		unifiedOrder =   UnifiedOrder_pub()
		unifiedOrder.setParameter("body",'QrWxpay')
		unifiedOrder.setParameter("notify_url",'http://zone.senguo.cc/fruitzone/paytest')
		unifiedOrder.setParameter("out_trade_no",orderId+"a")
		unifiedOrder.setParameter('total_fee',wxPrice)
		unifiedOrder.setParameter('trade_type',"NATIVE")
		res = unifiedOrder.postXml().decode('utf-8')
		res_dict = unifiedOrder.xmlToArray(res)
		# print(res,type(res_dict))
		if 'code_url' in res_dict:
				qr_url = res_dict['code_url']
		else:
			qr_url = ""
		return self.send_success(qr_url=qr_url)

class InsertData(CustomerBaseHandler):
	# @tornado.web.authenticated
	# @CustomerBaseHandler.check_arguments("code?:str")
	# @tornado.web.asynchronous
	def get(self):
		# import gevent
		import requests
		import json
		shop_list , good_list = self.get_data()
		# print(shop_list)
		for shop in shop_list:
			temp_shop = models.Spider_Shop(shop_id = shop['shop_id'],shop_address = shop['shop_address'],
				shop_logo = shop['shop_logo'],delivery_freight = shop['delivery_freight'] , shop_link = shop['shop_link'],
				delivery_time = shop['delivery_time'],shop_phone = shop['shop_phone'],delivery_mincharge = shop['delivery_mincharge'],
				delivery_area = shop['delivery_area'],shop_name = shop['shop_name'],shop_notice = shop['shop_notice'],lat = shop['lat'],lon = shop['lon'])
			self.session.add(temp_shop)
		self.session.commit()

		for good in good_list:
			temp_good = models.Spider_Good(goods_price = good['goods_price'],good_img_url = good['good_img_url'],shop_id = good['shop_id'],
				sales = good['sales'],goods_name = good['goods_name'])
			self.session.add(temp_good)
		self.session.commit()

		return self.send_success()
		# import multiprocessing
		# from multiprocessing import Process
		# import datetime
		# from sqlalchemy import create_engine, func, ForeignKey, Column
		# session = self.session
		# from handlers.base import UrlShorten
		# short = UrlShorten.get_short_url('http://www.baidu.com/haha/hehe/gaga/memeda')
		# print(short,type(short))
		# print(UrlShorten.get_long_url(short))
		# try:
		# 	shop = self.session.query(models.Shop).filter_by(shop_code = 'woody').first()
		# except:
		# 	return self.send_fail('shop not found')
		# # self.shop_auth_msg(shop,False)
		# # shop_auth_fail_msg('13163263783','woody','woody')
		# self.render('customer/storage-change.html')
		# def async_task():
		#   try:
		# 		shop = self.session.query(models.Shop).filter_by(shop_code = 'woody').first()
		# 	except:
		# 		return self.send_fail('shop not found')
		# 	# self.shop_auth_msg(shop,False)
		# 	# shop_auth_fail_msg('13163263783','woody','woody')
		# 	self.render('customer/storage-change.html')
		# gevent.spawn(async_task)

	def get_data(self):
		import requests
		shop_list = []
		good_list = []
		import os
		f = open(os.path.dirname(__file__)+'/shopData.txt',encoding = 'utf-8')
		c = f.read()
		s = eval(c)
		print(type(s))
		i = 0
		for key in s:
				temp = s.get(key,None)
				if temp:
						shop = {}
						shop['shop_id']            = i
						shop['shop_address']       = temp.get('shop_address',None)
						shop['shop_logo']          = temp.get('shop_logo',None)
						shop['delivery_freight']   = temp.get('delivery_freight',None)
						shop['shop_link']          = temp.get('shop_link',None)
						shop['delivery_time']      = temp.get('delivery_time',None)
						shop['shop_phone']         = temp.get('shop_phone',None)
						shop['delivery_mincharge'] = temp.get('delivery_mincharge',None)
						shop['delivery_area']      = temp.get('delivery_area',None)
						shop['shop_name']          = temp.get('shop_name',None)
						shop['shop_notice']        = temp.get('shop_notice',None)
						url = "http://api.map.baidu.com/geocoder/v2/?address="+temp.get('shop_address',None)+"&output=json&ak=2595684c343d6499bf469da8a9c18231"
						r = requests.get(url)
						result = json.loads(r.text)
						if result["status"] == 0:
							shop['lat']  = float(result["result"]["location"]["lat"])
							shop['lon'] = float(result["result"]["location"]["lng"])
						else:
							shop['lat'] = 0
							shop['lon'] = 0
						shop_list.append(shop)
						temp_goods                 = temp.get('goods_list',None)
						for temp_good in temp_goods:
								good = {}
								good['goods_price']  = temp_good.get('goods_price',None)
								good['good_img_url'] = temp_good.get('good_img_url',None)
								good['shop_id']      = i
								good['sales']       = temp_good.get('sales',None)
								good['goods_name']  = temp_good.get('goods_name',None)
								good_list.append(good)
				i += 1
		print(shop_list)
		print(i)
		return shop_list,good_list







# 支付超时判断
# 返回：
# 		0 - 不超时
# 		1 - 超时
class Overtime(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("order_id?:str")
	def get(self):
		try:
			order_id = int(self.args['order_id'])
		except:
			return self.send_fail("overtime : can not get order_id")
		order = self.session.query(models.Order).filter_by(id = order_id).first()
		if not order:
			return self.send_fail("overtime : order not found")
		shop = self.session.query(models.Shop).filter_by(id = order.shop_id).first()
		if order.status == 0:
			return self.send_success(overtime = 1,shop_code = shop.shop_code)
		else:
			return self.send_success(overtime = 0,shop_code = shop.shop_code)
