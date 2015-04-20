from handlers.base import CustomerBaseHandler,WxOauth2
# from handlers.weixinSign import *
# from handlers.wxpay import *
import dal.models as models
import tornado.web
from settings import *
import datetime, time
from sqlalchemy import desc, and_, or_
import qiniu
import random
import base64
import json
from libs.msgverify import gen_msg_token,check_msg_token

from urls import handlers

class Access(CustomerBaseHandler):
	def initialize(self, action):
		self._action = action

	def get(self):
		next_url = self.get_argument('next', '')
		print(next_url,'xxxxxx')
		if self._action == "login":
			next_url = self.get_argument("next", "")
			return self.render("login/m_login.html",
								 context=dict(next_url=next_url))
		elif self._action == "logout":
			self.clear_current_user()
			return self.redirect(self.reverse_url("customerHome"))
		elif self._action == "oauth":
			self.handle_oauth(next_url)
		else:
			return self.send_error(404)


	#@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("phone", "password", "next?")
	def post(self):
		phone = self.args['phone']
		password = self.args['password']
		next = self.args['next']
		print(next)
		# u = models.ShopAdmin.login_by_phone_password(self.session, self.args["phone"], self.args["password"])
		print(phone,password)
		u = self.session.query(models.Accountinfo).filter_by(phone = phone ,password = password).first()
		if not u:
			return self.send_fail(error_text = '用户不存在或密码不正确 ')
		self.set_current_user(u, domain=ROOT_HOST_NAME)
		return self.redirect( self.reverse_url("test"))
		# print('before redirect')
		# return self.redirect('http://www.baidu.com')
		# return self.send_success()

	@CustomerBaseHandler.check_arguments("code", "state?", "mode")
	def handle_oauth(self,next_url):
		# todo: handle state
		code =self.args["code"]
		mode = self.args["mode"]
		# print("mode: ", mode , ", code get:", code)
		if mode not in ["mp", "kf"]:
			return self.send_error(400)

		userinfo = self.get_wx_userinfo(code, mode)
		if not userinfo:
			return self.redirect(self.reverse_url("customerLogin"))
		u = models.Customer.register_with_wx(self.session, userinfo)
		self.set_current_user(u, domain=ROOT_HOST_NAME)

		next_url = self.get_argument("next", next_url)
		return self.redirect(next_url)

class RegistByPhone(CustomerBaseHandler):
	def get(self):
		return self.render("login/m_register.html")

	@CustomerBaseHandler.check_arguments("phone:str","code:int")
	def handle_checkcode_regist(self):
		if not check_msg_token(phone = self.args["phone"],code = self.args["code"]):
			return self.send_fail(error_text = "验证码过期或者不正确")
		else:
			u = models.Accountinfo(phone = phone ,password = password)
			self.session.add(u)
			self.session.commit()
			self.set_current_user(u, domain=ROOT_HOST_NAME)
			return self.send_success()

	@CustomerBaseHandler.check_arguments("phone:str")
	def handle_gencode(self):
		a=self.session.query(models.Accountinfo).filter(models.Accountinfo.phone==self.args["phone"]).first() 
		if a:
			return self.send_fail(error_text="手机号已经绑定其他账号")
		gen_msg_token(phone=self.args["phone"])
		return self.send_success()

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

			u = self.session.query(models.Accountinfo).filter_by(phone = phone).first()
			if u:
				return self.send_fail("该手机号 已被注册，请直接登入")
			else:
				u = models.Accountinfo(phone = phone ,password = password)
				self.session.add(u)
				self.session.commit()
				self.set_current_user(u, domain=ROOT_HOST_NAME)
				print(u.id)
				return self.send_success()




class Home(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self,shop_code):
		# shop_id = self.shop_id
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code =shop_code).first()
		except:
			return self.send_fail('shop error')
		if shop:
			shop_name = shop.shop_name
			shop_id   = shop.id
			shop_logo  = shop.shop_trademark_url
		else:
			return self.send_fail('shop not found')
		customer_id = self.current_user.id
		self.set_cookie("market_shop_id", str(shop.id))  # 执行完这句时浏览器的cookie并没有设置好，所以执行get_cookie时会报错
		self._shop_code = shop.shop_code
		self.set_cookie("market_shop_code",str(shop.shop_code))
		shop_point = 0
		try:
			shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = \
				customer_id,shop_id =shop_id).first()
		except:
			self.send_fail("point show error")
		if shop_follow:
			if shop_follow.shop_point:
				shop_point = shop_follow.shop_point
			else:
				shop_point = 0
		count = {3: 0, 4: 0, 5: 0, 6: 0}  # 3:未处理 4:待收货，5：已送达，6：售后订单
		for order in self.current_user.orders:
			if order.status == 1:
				count[3] += 1
			elif order.status in (2, 3, 4):
				count[4] += 1
			elif order.status in (5, 6):
				count[5] += 1
			elif order.status == 10:
				count[6] += 1
		return self.render("customer/personal-center.html", count=count,shop_point =shop_point, \
			shop_name = shop_name,shop_logo = shop_logo, context=dict(subpage='center'))
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

class CustomerProfile(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self):
	   # 模板中通过current_user获取当前admin的相关数据，
	   # 具体可以查看models.ShopAdmin中的属性
	   time_tuple = time.localtime(self.current_user.accountinfo.birthday)
	   birthday = time.strftime("%Y-%m", time_tuple)
	   self.render("customer/profile.html", context=dict(birthday=birthday))

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
			try:
				birthday = datetime.datetime(year=year, month=month, day=19)
			except ValueError as e:
				return self.send_fail("月份必须为1~12")
			self.current_user.accountinfo.update(session=self.session, birthday=time.mktime(birthday.timetuple()))
		elif action == 'add_password':
			self.current_user.accountinfo.update(session = self.session , password = data)
		elif action == 'modify_password':
			old_password = self.args['old_password']
			if old_password != self.current_user.accountinfo.password:
				return self.send_fail("密码错误")
			else:
				self.current_user.accountinfo.update(session = self.session ,password = data)
		else:
			return self.send_error(404)
		return self.send_success()

class ShopProfile(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self, shop_code):
		# print(shop_code)
		#self.set_cookie("market_shop_id", shop_id)
		# shop_code = self.shop_code
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code=shop_code).first()
		except:
			return self.send_fail('shop not found')
		if not shop:
			print("error shop")
			return self.send_error(404)
		shop_id = shop.id
		shop_name = shop.shop_name
		shop_logo   = shop.shop_trademark_url

		self.set_cookie("market_shop_id", str(shop.id))  # 执行完这句时浏览器的cookie并没有设置好，所以执行get_cookie时会报错
		self._shop_code = shop.shop_code
		self.set_cookie("market_shop_code",str(shop.shop_code))


		#是否关注判断
		follow = True
		if not self.session.query(models.CustomerShopFollow).filter_by(
				customer_id=self.current_user.id, shop_id=shop.id).first():
			follow = False
		# 今天是否 signin
		signin = False
		q=self.session.query(models.ShopSignIn).filter_by(
						  customer_id=self.current_user.id, shop_id=shop.id).first()
		if q and q.last_date == datetime.date.today():
			signin = True
		operate_days = (datetime.datetime.now() - datetime.datetime.fromtimestamp(shop.create_date_timestamp)).days
		fans_sum = self.session.query(models.CustomerShopFollow).filter_by(shop_id=shop_id).count()
		order_sum = self.session.query(models.Order).filter_by(shop_id=shop_id).count()
		goods_sum = self.session.query(models.Fruit).filter_by(shop_id=shop_id, active=1).count() + \
					self.session.query(models.MGoods).join(models.Menu).filter(
						models.Menu.shop_id == shop_id, models.Menu.active == 1).count()
		address = self.code_to_text("shop_city", shop.shop_city) + " " + shop.shop_address_detail
		service_area = self.code_to_text("service_area", shop.shop_service_area)
		staffs = self.session.query(models.HireLink).filter_by(shop_id=shop_id).all()
		shop_members_id = [shop.admin_id]+[x.staff_id for x in staffs]
		headimgurls = self.session.query(models.Accountinfo.headimgurl_small).\
			filter(models.Accountinfo.id.in_(shop_members_id)).all()
		comment_sum = self.session.query(models.Order).filter_by(shop_id=shop_id, status=6).count()
		session = self.session
		w_id = self.current_user.id

		session.commit()
		# try:
		#     point = session.query(models.Points).filter_by(id = w_id).first()
		# except:
		#     point = models.Points(id =w_id)
		#     session.add(point)
		# if point:
		#     point.get_count(session,w_id)
		# else:
		#     print("have ran?")
		return self.render("customer/shop-info.html", shop=shop, follow=follow, operate_days=operate_days,
						   fans_sum=fans_sum, order_sum=order_sum, goods_sum=goods_sum, address=address,
						   service_area=service_area, headimgurls=headimgurls, signin=signin,
						   comments=self.get_comments(shop_id, page_size=2), comment_sum=comment_sum,
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
				print("shop_follow error")
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
						# point.count += 1
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
		return self.send_success()

class Members(CustomerBaseHandler):
	def get(self):
		# shop_id = self.shop_id
		shop_id = int(self.get_cookie("market_shop_id"))
		print(shop_id)
		admin_id = self.session.query(models.Shop.admin_id).filter_by(id=shop_id).first()
		if not admin_id:
			return self.send_error(404)
		admin_id = admin_id[0]
		members = self.session.query(models.Accountinfo, models.HireLink.work).filter(
			models.HireLink.shop_id == shop_id, or_(models.Accountinfo.id == models.HireLink.staff_id,
													models.Accountinfo.id == admin_id)).all()
		member_list = []
		def work(id, w):
			if id == admin_id:
				return "店长"
			elif w == 1:
				return "挑货"
			else:
				return "送货"
		for member in members:
			member_list.append({"img":member[0].headimgurl_small,
								"name":member[0].nickname,
								"birthday":time.strftime("%Y-%m", time.localtime(member[0].birthday)),
								"work":work(member[0].id,member[1]),
								"phone":member[0].phone,
								"wx_username":member[0].wx_username})
		return self.render("customer/shop-staff.html", member_list=member_list)

class Comment(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("page:int")
	def get(self):
		shop_id = int(self.get_cookie("market_shop_id"))
		page = self.args["page"]
		comments = self.get_comments(shop_id, page, 10)
		date_list = []
		for comment in comments:
			date_list.append({"img": comment[0], "name": comment[1],
							  "comment": comment[2], "time": self.timedelta(comment[3]), "reply":comment[5]})
		if page == 0:
			return self.render("customer/comment.html", date_list=date_list)
		return self.write(dict(date_list=date_list))

class Market(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self, shop_code):
		# print('self',self)
		w_follow = True
		fruits=''
		dry_fruits=''
		shop = self.session.query(models.Shop).filter_by(shop_code=shop_code).first()
		if not shop:
			return self.send_error(404)
		shop_name = shop.shop_name
		shop_logo = shop.shop_trademark_url
		self.set_cookie("market_shop_id", str(shop.id))  # 执行完这句时浏览器的cookie并没有设置好，所以执行get_cookie时会报错
		self._shop_code = shop.shop_code
		# self.set_cookie("market_shop_name",str(shop.shop_name))
		#woody
		self.set_cookie("market_shop_code",str(shop.shop_code))
		if not self.session.query(models.CustomerShopFollow).filter_by(
				customer_id=self.current_user.id, shop_id=shop.id).first():
			# return self.redirect("/customer/shopProfile")  # 还没关注的话就重定向到店铺信息页
			w_follow = False
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


		if not self.session.query(models.Cart).filter_by(id=self.current_user.id, shop_id=shop.id).first():
			self.session.add(models.Cart(id=self.current_user.id, shop_id=shop.id))  # 如果没有购物车，就增加一个
			self.session.commit()
		cart_f, cart_m = self.read_cart(shop.id)
		cart_count = len(cart_f) + len(cart_m)
		cart_fs = [(key, cart_f[key]['num']) for key in cart_f]
		cart_ms = [(key, cart_m[key]['num']) for key in cart_m]
		fruits = [x for x in shop.fruits if x.fruit_type_id < 1000 and x.active == 1]
		dry_fruits = [x for x in shop.fruits if x.fruit_type_id > 1000 and x.active == 1]
		mgoods={}
		count_mgoods = []
		mgoods_page = []
		mgoods_len = 0

		for menu in shop.menus:
			mgoods[menu.id] = [x for x in menu.mgoods if x.active == 1]
			count_mgoods .append([menu.id,len(mgoods[menu.id])])
			mgoods_len += len(mgoods[menu.id])

		mgoods_page = [[int(x[1]/10) if x[1] % 10 == 0 else int(x[1]/10)+1,x[0]] for x in count_mgoods]
		notices = [(x.summary, x.detail) for x in shop.config.notices if x.active == 1]
		total_count = len(fruits) + len(dry_fruits)  + mgoods_len
		if total_count % 10 is 0 :
			page_count = total_count /10
		else:
			page_count = int( total_count / 10) + 1
		# print('page_count' , page_count)
		fruit_page = int(len(fruits)/10) if len(fruits)% 10 == 0 else int(len(fruits)/10) +1
		dry_page   = int(len(dry_fruits)/10) if len(dry_fruits)% 10 == 0 else int(len(dry_fruits)/10) +1
		# mgoods_page = int(count_mgoods/10) if count_mgoods % 10 == 0 else int(count_mgoods/10) + 1
		self.set_cookie("cart_count", str(cart_count))
		return self.render("customer/home.html",
						   context=dict(cart_count=cart_count, subpage='home', menus=shop.menus,notices=notices,\
							shop_name=shop.shop_name,w_follow = w_follow,page_count = page_count,fruit_page = fruit_page,\
							dry_page = dry_page ,mgoods_page = mgoods_page,cart_fs=cart_fs,cart_ms=cart_ms,\
							shop_logo = shop_logo))

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
	@classmethod
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
					charge_types.append({'id':charge_type.id,'price':charge_type.price,'num':charge_type.num, 'unit':charge_type.unit})
				if fruit.fruit_type_id >= 1000:
					w_tag = "dry_fruit"
				else:
					w_tag = "fruit"
				data.append([w_tag,{'id':fruit.id,'code':fruit.fruit_type.code,'charge_types':charge_types,'storage':fruit.storage,'tag':fruit.tag,\
				'img_url':fruit.img_url,'intro':fruit.intro,'name':fruit.name,'saled':fruit.saled,'favour':fruit.favour,'favour_today':favour_today}])
			return data

	def mgood_list(self):
		page = self.args["page"]
		menu_id = self.args["menu_id"]
		offset = (page - 1) * 10
		shop_id = int(self.get_cookie("market_shop_id"))
		shop  = self.session.query(models.Shop).filter_by(id = shop_id).first()
		if not shop:
			return self.send_error(404)
		try:
			menu = self.session.query(models.Menu).filter_by(id = menu_id).first()
		except:
			return self.send_fail("menu error")

		mgoods = {}
		w_mgoods = []
		# for menu in shop.menus:
		mgoods[menu_id] = [x for x in menu.mgoods if x.active == 1]
		temp_goods = []
		if menu:
			for mgood in menu.mgoods:
				# print(mgood.id,mgood.unit)
				charge_types = []
				for charge_type in mgood.mcharge_types:
					charge_types.append({'id':charge_type.id,'price':charge_type.price,'num':charge_type.num, 'unit':charge_type.unit})
				if mgood.active == 1:
					try:
						# print('mgood id',mgood.id)
						favour = self.session.query(models.FruitFavour).filter_by(customer_id = self.current_user.id,\
							f_m_id = mgood.id , type = 1).first()

					except:
						# print(' favour_today error mgood')
						favour = None
					if favour is None:
						favour_today = False
					else:
						favour_today = favour.create_date == datetime.date.today()
					# print('favour_today',favour_today,'mgood')
					w_mgoods.append(["mgoods",{'id':mgood.id,'name':mgood.name,'unit':mgood.unit,'active':mgood.active,\
						'favour_today':favour_today ,'current_saled':mgood.current_saled,'saled':mgood.saled,\
						'storage':mgood.storage,'favour':mgood.favour,'tag':mgood.tag,'img_url':mgood.img_url,\
						'intro':mgood.intro,'charge_types':charge_types,'favour_today' : favour_today},menu.id])
		count_mgoods = len(w_mgoods)
		if offset + 10 <=count_mgoods:
			mgood_list = w_mgoods[offset:offset+10]
		elif offset < count_mgoods and offset + 10 > count_mgoods:
			mgood_list = w_mgoods[offset:]
		else:
			self.send_fail("mgood_list page error")
		return self.send_success(mgood_list = mgood_list , page = page)



	@CustomerBaseHandler.check_arguments("page?:int")
	def dry_list(self):
		page = self.args["page"]
		offset = (page - 1) * 10
		shop_id = int(self.get_cookie("market_shop_id"))
		customer_id = self.current_user.id
		shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
		if not shop:
			return self.send_error(404)
		dry_fruits =[]
		dry_fruits = [x for x in shop.fruits if x.fruit_type_id >=1000 and x.active ==1]
		w_dry_fruits = []
		session = self.session
		w_dry_fruits = self.w_getdata(session,dry_fruits,customer_id)
		count_dry = len(w_dry_fruits)
		page = int(count_dry/10) if count_dry % 10 ==0 else int(count_dry/10) +1
		# print(page)
		if offset + 10 <= count_dry:
			dry_fruit_list = w_dry_fruits[offset:offset+10]
		elif offset < count_dry and offset + 10 > count_dry:
			dry_fruit_list = w_dry_fruits[offset:]
		else:
			self.send_fail("dry_fruit_list page error")
		return self.send_success(dry_fruit_list = dry_fruit_list ,page =page)


	@CustomerBaseHandler.check_arguments("page?:int")
	def fruit_list(self):
		page = self.args["page"]
		offset = (page-1) * 10
		shop_id = int(self.get_cookie("market_shop_id"))
		customer_id = self.current_user.id
		shop   = self.session.query(models.Shop).filter_by(id = shop_id).first()
		if not shop:
			return self.send_error(404)
		fruits = []
		fruits = [x for x in shop.fruits if x.fruit_type_id < 1000 and x.active ==1]
		w_fruits = []
		session = self.session
		w_fruits = self.w_getdata(session,fruits,customer_id)
		count_fruit = len(w_fruits)
		page = int(count_fruit/10) if count_fruit % 10 == 0 else int(count_fruit/10)+1
		# page = (count_fruit % 10 == 0)?int(count_fruit/10):int(count_fruit/10)+1
		# print(page)
		if offset + 10 <= count_fruit:
			fruit_list = w_fruits[offset:offset+10]
		elif offset < count_fruit and offset +10 > count_fruit:
			fruit_list = w_fruits[offset:]
		else:
			self.send_fail("fruit_list page error")
		return self.send_success(fruit_list = fruit_list ,page = page)

	@CustomerBaseHandler.check_arguments("page?:int")
	def commodity_list(self):
		#
		# page = 2
		page = self.args["page"]
		offset = (page -1) * 10
		customer_id = self.current_user.id
		shop_id = int(self.get_cookie('market_shop_id'))
		shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
		cart_f,cart_m = self.read_cart(shop.id)
		cart_fs = {}
		cart_ms = {}
		cart_fs = [(key,cart_f[key]['num']) for key in cart_f]
		cart_ms = [(key,cart_m[key]['num']) for key in cart_m]
		#
		count = 0
		count_mgoods = 0
		count_fruit =0
		count_dry = 0
		w_orders = []

		if not shop:
			return self,send_error(404)
		fruits = []
		dry_fruits = []
		fruits = [x for x in shop.fruits if x.fruit_type_id < 1000 and x.active ==1]
		dry_fruits = [x for x in shop.fruits if x.fruit_type_id >= 1000 and x.active == 1]

		mgoods = {}
		w_mgoods = []
		for menu in shop.menus:
			mgoods[menu.id] = [x for x in menu.mgoods if x.active == 1]
			temp_goods = []
			for mgood in menu.mgoods:
				# print(mgood.id,mgood.unit)
				try:

					# print('mgood id',mgood.id)
					favour = self.session.query(models.FruitFavour).filter_by(customer_id = self.current_user.id,\
						f_m_id = mgood.id , type = 1).first()

				except:
					print(' favour_today error mgood')

					favour = None
				if favour is None:
					favour_today = False
				else:
					favour_today = favour.create_date == datetime.date.today()

				# print('favour_today',favour_today,'mgood')

				charge_types = []
				for charge_type in mgood.mcharge_types:
					charge_types.append({'id':charge_type.id,'price':charge_type.price,'num':charge_type.num, 'unit':charge_type.unit})
				if mgood.active == 1:
					w_mgoods.append(["mgoods",{'id':mgood.id,'name':mgood.name,'unit':mgood.unit,'active':mgood.active,\
						'current_saled':mgood.current_saled,'saled':mgood.saled,'storage':mgood.storage,'favour':mgood.favour,\
						'tag':mgood.tag,'img_url':mgood.img_url,'intro':mgood.intro,'charge_types':charge_types,\
						'favour_today':favour_today},menu.id])
				count_mgoods += 1

		w_fruits = []
		w_dry_fruits = []
		# def w_getdata(m):
		#     data = []
		#     w_tag = ''
		#     for fruit in m:
		#         charge_types= []
		#         for charge_type in fruit.charge_types:
		#             charge_types.append({'id':charge_type.id,'price':charge_type.price,'num':charge_type.num, 'unit':charge_type.unit})
		#         if fruit.fruit_type_id >= 1000:
		#             w_tag = "dry_fruit"
		#         else:
		#             w_tag = "fruit"
		#         data.append([w_tag,{'id':fruit.id,'code':fruit.fruit_type.code,'charge_types':charge_types,'storage':fruit.storage,'tag':fruit.tag,\
		#         'img_url':fruit.img_url,'intro':fruit.intro,'name':fruit.name,'saled':fruit.saled,'favour':fruit.favour}])
		#     return data
		# pages
		# woody
		session = self.session
		w_fruits = self.w_getdata(session,fruits,customer_id)
		count_fruit = len(w_fruits)

		w_dry_fruits = self.w_getdata(session, dry_fruits,customer_id)
		count_dry   = len(w_dry_fruits)

		if offset +10 <= count_fruit:
			w_orders = w_fruits[offset:offset+10]

		elif offset >= count_fruit and offset + 10 <= count_fruit + count_dry:
			w_orders = w_dry_fruits[offset - count_fruit:offset+10 - count_fruit ]

		elif offset >= count_dry +count_fruit and offset +10 <= count_fruit + count_dry + count_mgoods:
			w_orders = w_mgoods[offset-(count_dry+count_fruit):offset + 10-(count_dry+count_fruit)]

		elif offset >= count_dry + count_fruit:
			w_orders = w_mgoods[offset-(count_fruit+count_dry):]

		elif offset < count_fruit and offset + 10 <= count_fruit +count_dry:
			w_orders =w_fruits[offset:] + w_dry_fruits[0:offset + 10 - count_fruit ]

		elif offset >= count_fruit and offset < count_fruit + count_dry and offset + 10 <= count_dry + count_fruit + count_mgoods:
			w_orders = w_dry_fruits[offset - count_fruit:] + w_mgoods[0:offset + 10 - (count_dry + count_fruit)]

		elif offset >=  count_fruit and offset < count_fruit + count_dry and offset +10 >= count_fruit + count_dry + count_mgoods:
			w_orders = w_dry_fruits[offset - count_fruit:] + w_mgoods

		elif offset < count_fruit and offset + 10 >= count_fruit + count_dry and offset + 10 <= count_fruit +count_dry + count_mgoods:
			w_orders = w_fruits[offset:] + w_dry_fruits + w_mgoods[0:offset + 10 - (count_fruit+ count_dry)]

		elif offset < count_fruit and offset + 10 >= count_fruit + count_dry + count_mgoods:
			w_orders = w_fruits[offset:] + w_dry_fruits + w_mgoods

		else:
			self.send_error("pages error")

		total_count = count_dry + count_fruit + count_mgoods

		# print('w_orders ',w_orders)
		# print('w_mgoods',w_mgoods)
		# for m in w_mgoods:
		#     print(m)
		# print("total_count",total_count ,"count_fruit",count_fruit,"count_dry",count_dry,'count_mgoods',count_mgoods)

		return self.send_success(w_orders = w_orders)

	@CustomerBaseHandler.check_arguments("charge_type_id:int", "menu_type:int")  # menu_type(0：fruit，1：menu)
	def favour(self):
		charge_type_id = self.args["charge_type_id"]
		# print('charge_type_id',charge_type_id)
		# print(self.args)
		# print('use id',self.current_user.id)
		menu_type = self.args["menu_type"]
		shop_id = int(self.get_cookie("market_shop_id"))
		favour = self.session.query(models.FruitFavour).\
			filter_by(customer_id=self.current_user.id,f_m_id=charge_type_id, type=menu_type).first()

		#woody
		# #???
		# try:
		#     point = self.session.query(models.Points).filter_by(id = self.current_user.id).first()
		#     if point is None:
		#         print("start ,point is None ")
		# except:
		#     self.send_fail("point find error")

		# shop_point add by one
		# woody

		try:
			shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = self.current_user.id \
				,shop_id = shop_id).first()
		except:
			self.send_fail("shop_point error")

		# if point is None:
		#     point = models.Points(id = self.current_user.id)
		#     self.session.add(point)
		#     self.session.commit()
		# if point is None:
		#     print("point make fail")
		# print("success?",point)

		# if point:
		#     print(" before favour:" , point.favour_count)
		if favour:
			# print("login favour")
			if favour.create_date == datetime.date.today():
				return self.send_fail("亲，你今天已经为该商品点过赞了，一天只能对一个商品赞一次哦")
			else:  # 今天没点过赞，更新时间
				#favour_count add by one
				#woody
				# print("true favour")
				# if point:
				#     point.favour_count += 1
				#     # point.totalCount +=1
				#     print("after favour:")
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
					print("point_history None")
				# else:
				#     print("point is None...")

				if shop_follow:
					shop_follow.shop_point += 1
					now = datetime.datetime.now()
					# print(now,shop_follow.shop_point,'favour')

				favour.create_date = datetime.date.today()
		else:  # 没找到点赞记录，插入一条
			self.session.add(models.FruitFavour(customer_id=self.current_user.id,
					  f_m_id=charge_type_id, type=menu_type))
			self.session.commit()

			#add favour point history
			# print('add favour')

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
				print("point_history None")

			if shop_follow:
					shop_follow.shop_point += 1
					now = datetime.datetime.now()
					# print(now,shop_follow.shop_point,'favour')
			else:
				print('customer_shop_follow not fount')

			# if point:
			#     point.favour_count += 1
				# print("new favour",point.favour_count)
		# 商品赞+1
		if menu_type == 0:
			try:
				f = self.session.query(models.Fruit).filter_by(id=charge_type_id).one()
			except:
				return self.send_error(404)
		elif menu_type == 1:
			try:
				f = self.session.query(models.MGoods).filter_by(id=charge_type_id).one()
			except:
				return self.send_error(404)
		else:
			return self.send_error(404)
		f.favour += 1
		self.session.commit()
		return self.send_success()


	@CustomerBaseHandler.check_arguments("fruits", "mgoods")
	def cart_list(self):
		fruits = self.args["fruits"]
		mgoods = self.args["mgoods"]

		cart = self.session.query(models.Cart).filter_by(id=self.current_user.id, shop_id=self.shop_id).one()
		fruits2 = {}
		mgoods2 = {}
		for key in fruits:
			fruits2[int(key)] = fruits[key]
		for key in mgoods:
			mgoods2[int(key)] = mgoods[key]
		cart.fruits = str(fruits2)
		cart.mgoods = str(mgoods2)

		self.session.commit()
		return self.send_success()

	@CustomerBaseHandler.check_arguments("charge_type_id:int", "menu_type:int")
	def cart(self, action):
		charge_type_id = self.args["charge_type_id"]
		menu_type = self.args["menu_type"]
		self.save_cart(charge_type_id, self.shop_id, action, menu_type)
		return self.send_success()


class Cart(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self,shop_code):
		# shop_id = self.shop_id
		customer_id = self.current_user.id
		phone = self.get_phone(customer_id)

		storages = {}
		shop = self.session.query(models.Shop).filter_by(shop_code=shop_code).one()
		if not shop:return self.send_error(404)
		shop_name = shop.shop_name
		shop_id = shop.id
		shop_logo = shop.shop_trademark_url
		self.set_cookie("market_shop_id", str(shop.id))  # 执行完这句时浏览器的cookie并没有设置好，所以执行get_cookie时会报错
		self._shop_code = shop.shop_code
		self.set_cookie("market_shop_code",str(shop.shop_code))
		cart = next((x for x in self.current_user.carts if x.shop_id == shop_id), None)
		if not cart or (not (eval(cart.fruits) or eval(cart.mgoods))): #购物车为空
			return self.render("notice/cart-empty.html",context=dict(subpage='cart'))
		cart_f, cart_m = self.read_cart(shop_id)
		# print(cart_f)
		# print(cart_m)
		for item in cart_f:
			fruit = cart_f[item].get('charge_type').fruit
			fruit_id = fruit.id
			fruit_storage = fruit.storage
			if fruit_id not in storages:
				storages[fruit_id] = fruit_storage
		for item in cart_m:
			mgood = cart_m[item].get('mcharge_type').mgoods
			mgood_id = mgood.id
			mgood_storage = mgood.storage
			if mgood_id not in storages:
				storages[mgood_id] = mgood_storage
		periods = [x for x in shop.config.periods if x.active == 1]
		# print('storages',storages)

		# for period in periods:
		# 	print(period.start_time)

		return self.render("customer/cart.html", cart_f=cart_f, cart_m=cart_m, config=shop.config,
						   periods=periods,phone=phone, storages = storages,\
						   shop_name  = shop_name ,shop_logo = shop_logo,context=dict(subpage='cart'))

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("fruits", "mgoods", "pay_type:int", "period_id:int",
										 "address_id:int", "message:str", "type:int", "tip?:int",
										 "today:int")
	def post(self,shop_code):#提交订单
		# print(self)
		shop_id = self.shop_id
		fruits = self.args["fruits"]
		mgoods = self.args["mgoods"]

		if not (fruits or mgoods):
			return self.send_fail('请至少选择一种商品')
		unit = {1:"个", 2:"斤", 3:"份"}
		f_d={}
		m_d={}
		totalPrice=0

		if fruits:
			# print("login fruits")
			charge_types = self.session.query(models.ChargeType).\
				filter(models.ChargeType.id.in_(fruits.keys())).all()
			for charge_type in charge_types:

				if fruits[str(charge_type.id)] == 0:  # 有可能num为0，直接忽略掉
					continue
				totalPrice += charge_type.price*fruits[str(charge_type.id)] #计算订单总价
				num = fruits[str(charge_type.id)]*charge_type.unit_num*charge_type.num

				charge_type.fruit.storage -= num  # 更新库存
				charge_type.fruit.saled += num  # 更新销量
				charge_type.fruit.current_saled += num  # 更新售出
				if charge_type.fruit.storage < 0:
					return self.send_fail('"%s"库存不足' % charge_type.fruit.name)
				# print(charge_type.price)
				f_d[charge_type.id]={"fruit_name":charge_type.fruit.name, "num":fruits[str(charge_type.id)],
									 "charge":"%.2f元/%.1f %s" % (float(charge_type.price), charge_type.num, unit[charge_type.unit])}
		if mgoods:
			# print("login mgoods")
			mcharge_types = self.session.query(models.MChargeType).\
				filter(models.MChargeType.id.in_(mgoods.keys())).all()
			for mcharge_type in mcharge_types:
				if mgoods[str(mcharge_type.id)] == 0:    # 有可能num为0，直接忽略掉
					continue
				totalPrice += mcharge_type.price*mgoods[str(mcharge_type.id)]
				num = mgoods[str(mcharge_type.id)]*mcharge_type.unit_num*mcharge_type.num
				mcharge_type.mgoods.storage -= num  # 更新库存
				mcharge_type.mgoods.saled += num  # 更新销量
				mcharge_type.mgoods.current_saled += num  # 更新售出
				if mcharge_type.mgoods.storage < 0:
					return self.send_fail('"%s"库存不足' % mcharge_type.mgoods.name)
				# print(mcharge_type.price)
				m_d[mcharge_type.id]={"mgoods_name":mcharge_type.mgoods.name, "num":mgoods[str(mcharge_type.id)],
									  "charge":"%.2f元/%.1f%s" % (float(mcharge_type.price), mcharge_type.num, unit[mcharge_type.unit])}

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
			if totalPrice < config.min_charge_on_time:
				return self.send_fail("订单总价没达到起送价，请再增加商品")
			freight = config.freight_on_time  # 运费
			totalPrice += freight
			today=int(self.args["today"])
			try:period = self.session.query(models.Period).filter_by(id=self.args["period_id"]).one()
			except:return self.send_fail("找不到时间段")
			if today == 1:
				if period.start_time.hour*60 + period.start_time.minute - \
					config.stop_range < datetime.datetime.now().hour*60 + datetime.datetime.now().minute:
					return self.send_fail("下单失败：已超过了该送货时间段的下单时间!请选择下一个时间段！")
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
		print(address.receiver,'******************************************')

		# 已支付、付款类型、余额、积分处理
		money_paid = False
		pay_type = 1
		if self.args["pay_type"] == 2:
			if self.current_user.balance >= totalPrice:
				self.current_user.balance -= totalPrice
				self.current_user.credits += totalPrice
				self.session.commit()
				money_paid = True
				pay_type = 2
			else:return self.send_fail("余额不足")

		count = self.session.query(models.Order).filter_by(shop_id=shop_id).count()
		num = str(shop_id) + '%06d' % count
		########################################################################
		# add default sender
		# 3.11
		# woody
		########################################################################
		w_admin = self.session.query(models.Shop).filter_by(id = shop_id).first()
		if w_admin is not None:
			w_SH2_id = w_admin.admin.id
			# print(w_SH2_id)
		# print("*****************************************************************")
		# print(f_d)
		# print(mgoods)
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
							 totalPrice=totalPrice,
							 money_paid=money_paid,
							 pay_type=pay_type,
							 today=self.args["today"],#1:今天；2：明天
							 start_time=start_time,
							 end_time=end_time,
							 fruits=str(f_d),
							 mgoods=str(m_d),
							 send_time=send_time,
							 )

		try:
			self.session.add(order)
			self.session.commit()
		except:
			return self.send_fail("订单提交失败")

		#####################################################################################
		# where the order sueessed , send a message to the admin of shop
		# woody
		#####################################################################################
		admin_name    = w_admin.admin.accountinfo.nickname
		touser        = w_admin.admin.accountinfo.wx_openid
		shop          = self.session.query(models.Shop).filter_by(id = shop_id).first()
		shop_name     = shop.shop_name
		order_id      = order.num
		order_type    = order.type
		if order_type == 1:
			order_type = '立即送'
		else:
			order_type = '按时达'
		create_date   = order.create_date
		customer_info = self.session.query(models.Accountinfo).filter_by(id = self.current_user.id).first()
		customer_name = address.receiver
		c_tourse      = customer_info.wx_openid
		print(c_tourse,'******************************************')

		##################################################
		#goods
		goods = []
		print(f_d,m_d)
		session = self.session
		for f in f_d:
			goods.append([f_d[f].get('fruit_name'),f_d[f].get('charge'),f_d[f].get('num')])
			# num = f_d[f].get('num')
			# fruit_id = f_d[f].get('fruit_name')
			# fruit = session.query(models.Fruit).filter_by(id = fruit_id).first()
			# if not fruit:
			# 	return self.send_fail('fruit not found')
			# fruit_name = fruit.name
			# charge = f_d[f].get('charge')
			# goods.append([fruit_name,charge,num])
		for m in m_d:
			goods.append([m_d[m].get('mgoods_name'), m_d[m].get('charge') ,m_d[m].get('num')])
			# num = m_d[m].get('num')
			# mgood_id = m_d[m].get('mgoods_name')
			# mgood = session.query(models.MGoods).filter_by(id = mgood_id).first()
			# if not mgood:
			# 	return self.send_fail('mgood not found')
			# mgood_name = mgood.name
			# charge =m_d[m].get('charge')
			# goods.append([mgood_name,charge,num])
			# print('m',m)
		goods = str(goods)[1:-1]
		order_totalPrice = float('%.1f'% totalPrice)
		print(order_totalPrice,"*******************8")
		session = self.session
		# send_time     = order.get_sendtime(session,order.id)
		send_time = order.send_time
		print(goods,'************************************************')
		WxOauth2.post_order_msg(touser,admin_name,shop_name,order_id,order_type,create_date,\
			customer_name,order_totalPrice,send_time,goods)
		# send message to customer
		WxOauth2.order_success_msg(c_tourse,shop_name,create_date,goods,order_totalPrice)

		cart = next((x for x in self.current_user.carts if x.shop_id == int(shop_id)), None)
		cart.update(session=self.session, fruits='{}', mgoods='{}')#清空购物车
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

class Order(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action")
	def get(self):
		action = self.args["action"]
		orders = []
		session = self.session
		return self.render("customer/order-list.html", context=dict(subpage='center'))



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
				'create_month':order.create_date.month,'create_day':order.create_date.day})
		return data

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action", "data?","page?:int")
	def post(self):
		action = self.args["action"]
		session = self.session
		if action == "unhandled":
			page = self.args['page']
			offset = (page - 1) * 10
			orders = [x for x in self.current_user.orders if x.status == 1]
			# woody	
			# for order in orders:
			# 	order.send_time = order.get_sendtime(session,order.id)

			orders.sort(key = lambda order:order.send_time)
			total_count = len(orders)
			total_page  =  int(total_count/10) if (total_count % 10 == 0) else int(total_count/10) + 1
			if offset + 10 <= total_count:
				orders = orders[offset:offset + 10]
			elif offset <= total_count and offset + 10 >= total_count:
				orders = orders[offset:]
			else:
				return self.send_fail("order pages errors")
			# print('orders',orders)
			orders = self.get_orderData(session,orders)
			# print('after ',orders)
			return self.send_success(orders = orders ,total_page= total_page)
		elif action == "waiting":
			page = self.args["page"]
			offset = (page - 1) * 10
			orders = [x for x in self.current_user.orders if x.status in (2, 3, 4)]
			# for order in orders:
			# 	order.send_time = order.get_sendtime(session,order.id)
			orders.sort(key = lambda order:order.send_time)
			total_count = len(orders)
			total_page  =  int(total_count/10) if (total_count % 10 == 0) else int(total_count/10) + 1
			print(offset)
			print(total_count)
			if offset + 10 <= total_count:
				orders = orders[offset:offset + 10]
			elif offset < total_count and offset + 10 >= total_count:
				orders = orders[offset:]
			else:
				return self.send_fail("没有待收货订单")
			orders = self.get_orderData(session,orders)
			return self.send_success(orders = orders ,total_page= total_page)
		elif action == "finish":
			page = self.args['page']
			offset = (page - 1) * 10
			try:
				orderlist = self.session.query(models.Order).order_by(desc(models.Order.arrival_day),models.Order.arrival_time).\
				filter_by(customer_id = self.current_user.id).all()
			except:
				return self.send_fail("orderlist error")

			order5 = []
			order6 = []
			for x in orderlist:
				if x.status == 5:
					order5.append(x)
				if x.status == 6:
					order6.append(x)
			orders = order5 + order6
			# for order in orders:
			# 	order.send_time = order.get_sendtime(session,order.id)
			total_count = len(orders)
			total_page  =  int(total_count/10) if (total_count % 10 == 0) else int(total_count/10) + 1
			if offset + 10 <= total_count:
				orders = orders[offset:offset + 10]
			elif offset < total_count and offset + 10 >= total_count:
				orders = orders[offset:]
			else:
				return self.send_fail("order pages errors")
			orders = self.get_orderData(session,orders)
			return self.send_success(orders = orders ,total_page= total_page)
		elif action == "all":
			page = self.args["page"]
			offset = (page - 1) * 10
			orders = self.current_user.orders
			session = self.session
			# for order in orders:
			# 	order.send_time = order.get_sendtime(session,order.id)
			orders.sort(key = lambda order:order.send_time)
			total_count = len(orders)
			# print(total_count)
			total_page  =  int(total_count/10) if (total_count % 10 == 0) else int(total_count/10) + 1
			if offset + 10 <= total_count:
				orders = orders[offset:offset + 10]
			elif offset < total_count and offset + 10 >= total_count:
				orders = orders[offset:]
			else:
				return self.send_fail("order pages errors")
			orders = self.get_orderData(session,orders)
			# print(orders)
			return self.send_success(orders = orders ,total_page= total_page)
		elif action == "cancel_order":
			data = self.args["data"]
			order = next((x for x in self.current_user.orders if x.id == int(data["order_id"])), None)
			if not order:return self.send_error(404)
			order.status = 0
			# recover the sale and storage
			# woody
			# 3.27
			session = self.session
			order.get_num(session,order.id)
		elif action == "comment":
			data = self.args["data"]
			order = next((x for x in self.current_user.orders if x.id == int(data["order_id"])), None)
			if not order:return self.send_error(404)
			order.status = 6
			order.comment_create_date = datetime.datetime.now()
			order.comment = data["comment"]

			# shop_point add by 5
			# woody
			try:
				shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = \
					order.customer_id,shop_id = order.shop_id).first()
			except:
				self.send_fail("shop_point error")
			if shop_follow:
				if shop_follow.shop_point:
					shop_follow.shop_point += 5
				try:
					point_history = models.PointHistory(customer_id = self.current_user.id , shop_id = order.shop_id)
				except:
					self.send_fail("point_history error:COMMENT")
				if point_history:
					point_history.point_type = models.POINT_TYPE.COMMENT
					point_history.each_point = 5
					self.session.add(point_history)
					self.session.commit()
		elif action == "delete_comment":
			data = self.args['data']
			order_id = data['order_id']
			order = self.session.query(models.Order).filter_by(id = order_id).first()
			if not order:
				return self.send_fail('order not found')
			order.status = 5
			order.comment = 'NULL'
			order.comment_reply = 'NULL'
			self.session.commit()

			# recover point
			shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = \
				order.customer_id , shop_id = order.shop_id).first()
			if not shop_follow:
				return self.send_fail('shop_follow not found')
			if shop_follow.shop_point:
				shop_follow.shop_point -= 5
			#need to rocord this poist history?
		else:
			return self.send_error(404)
		self.session.commit()
		return self.send_success()

class OrderDetail(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self,order_id):
		order = next((x for x in self.current_user.orders if x.id == int(order_id)), None)
		if not order:return self.send_error(404)
		charge_types = self.session.query(models.ChargeType).filter(
			models.ChargeType.id.in_(eval(order.fruits).keys())).all()
		mcharge_types = self.session.query(models.MChargeType).filter(
			models.MChargeType.id.in_(eval(order.mgoods).keys())).all()

		###################################################################
		# time's format
		# woody
		# 3.9
		###################################################################
		staff_id = order.SH2_id
		staff_info = self.session.query(models.Accountinfo).filter_by(id = staff_id).first()
		if staff_info is not None:
				order.sender_phone = staff_info.phone
				order.sender_img = staff_info.headimgurl_small
		else:
				order.sender_phone =None
				order.sender_img = None
		delta = datetime.timedelta(1)
		#print(delta)
		# if order.start_time.minute <10:
		#    w_start_time_minute ='0' + str(order.start_time.minute)
		# else:
		#    w_start_time_minute = str(order.start_time.minute)
		# if order.end_time.minute < 10:
		#    w_end_time_minute = '0' + str(order.end_time.minute)
		# else:
		#    w_end_time_minute = str(order.end_time.minute)

		# if order.type == 2 and order.today==2:
		#    w_date = order.create_date + delta
		# else:
		#    w_date = order.create_date
		# order.send_time = "%s %d:%s ~ %d:%s" % ((w_date).strftime('%Y-%m-%d'),
		# 								order.start_time.hour, w_start_time_minute,
		# 								  order.end_time.hour, w_end_time_minute)
		return self.render("customer/order-detail.html", order=order,
						   charge_types=charge_types, mcharge_types=mcharge_types)


class Points(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self):
		customer_id = self.current_user.id
		shop_id     = self.shop_id
		shop_point  = 0
		history     = []
		# print(customer_id,shop_id)
		try:
			shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = \
				customer_id,shop_id =shop_id).first()
		except:
			self.send_fail("point show error")
		if shop_follow:
			if shop_follow.shop_point:
				shop_point = shop_follow.shop_point
			else:
				shop_point = 0

		try:
			shop_history = self.session.query(models.PointHistory).filter_by(customer_id =\
				customer_id,shop_id = shop_id).all()
		except:
			self.send_fail("point history error")
		if shop_history:
			for temp in shop_history:
				temp.create_time = temp.create_time.strftime('%Y-%m-%d %H:%M')
				history.append([temp.point_type,temp.each_point,temp.create_time])
			# print(history)
		count = len(history)
		pages = int(count /10) if count % 10 ==0 else int(count/10) + 1

		return self.render("customer/points.html",shop_point = shop_point,pages = pages)



	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("page")
	def post(self):
		page = self.args["page"]
		offset = (page-1) * 10
		customer_id = self.current_user.id
		shop_id     = self.shop_id
		history     = []
		data = []

		try:
			shop_history = self.session.query(models.PointHistory).filter_by(customer_id =\
				customer_id,shop_id = shop_id).all()
		except:
			self.send_fail("point history error")
		if shop_history:
			for temp in shop_history:
				temp.create_time = temp.create_time.strftime('%Y-%m-%d %H:%M')
				history.append([temp.point_type,temp.each_point,temp.create_time])
			# print(history)

		count = len(history)
		history = history[::-1]
		# print('history',history)
		if offset + 10 <= count:
			data = history[offset:offset+10]
		elif offset <= count and offset + 10 >=count:
			data = history[offset:]
		else:
			self.send_fail("history page error")
		# print("data\n",data)

		return self.send_success(data = data)


class InsertData(CustomerBaseHandler):
	@tornado.web.authenticated
	# @CustomerBaseHandler.check_arguments("code?:str")
	def get(self):
		from sqlalchemy import create_engine, func, ForeignKey, Column
		# print(fun)
		# import pingpp
		# try:
		# 	shop_list = self.session.query(models.Shop).all()
		# except:
		# 	self.send_fail(" get shop error")
		# if shop_list:
		# 	for shop in shop_list:
		# 		if shop.shop_start_timestamp == None:
		# 			shop.shop_start_timestamp = shop.create_date_timestamp
		# 	self.session.commit()

		# try:
		# 	accountinfo_list = self.session.query(models.Accountinfo).all()
		# except:
		# 	self.send_fail("get accountinfo error")
		# if accountinfo_list:
		# 	for accountinfo in accountinfo_list:
		# 		if accountinfo.headimgurl_small is None:
		# 			if accountinfo.headimgurl:
		# 				print(accountinfo.headimgurl)
		# 				accountinfo.headimgurl_small = accountinfo.headimgurl[0:-1]+'132'

		# 	self.session.commit()

		
		# orderlist = self.session.query(models.Order).all()
		# if not orderlist:
		# 	self.send_fail("orderlist error")
		# if orderlist:
		# 	for order in orderlist:
		# 		# if order.send_time =='0' :
		# 			# print('login')
		# 		create_date =  order.create_date
		# 		second_date = create_date + datetime.timedelta(days = 1)
		# 		if order.type == 2: #按时达
		# 			if order.today == 1:
		# 				order.send_time = create_date.strftime('%Y-%m-%d') +' '+\
		# 				(order.start_time).strftime('%H:%M')+'~'+(order.end_time).strftime('%H:%M')
		# 			elif order.today == 2:
		# 				order.send_time = second_date.strftime('%Y-%m-%d')+' '+\
		# 				(order.start_time).strftime('%H:%M')+'~'+(order.end_time).strftime('%H:%M')
		# 		elif order.type == 1:#立即送
		# 			later = order.create_date + datetime.timedelta(minutes = 30)
		# 			order.send_time =  create_date.strftime('%Y-%m-%d %H:%M') +'~'+later.strftime('%H:%M')
		# 			#print(order.send_time)
		# 		# else:
		# 		# 	print('Not NULL')
		# 	self.session.commit()

		# try:
		# 	accountinfo_list = self.session.query(models.Accountinfo).all()
		# except:
		# 	return self.send_fail('accountinfo_list error')
		# if accountinfo_list:
		# 	n = 0
		# 	for accountinfo in accountinfo_list:
		# 		customer_id = accountinfo.id
		# 		order_list = self.session.query(models.Order).filter(and_(models.Order.customer_id == customer_id,or_(models.Order.status == 5,\
		# 			models.Order.status == 6 ,models.Order.status == 10))).all()
		# 		# print(len(order_list))
		# 		if order_list:
		# 			n = n + 1
		# 			accountinfo.is_new = 1
		# 			#print(accountinfo.is_new)
		# 			self.session.commit()
		# 	print(n,'***********8')
		try:
			follow_list = self.session.query(models.CustomerShopFollow).all()
		except:
			return self.send_fail('follow_list error')
		if follow_list:
			for follow in follow_list:
				customer_id = follow.customer_id
				shop_id = follow.shop_id
				order_list = self.session.query(models.Order).filter(and_(models.Order.customer_id == customer_id,models.Order.shop_id == shop_id,or_(models.Order.status == 5,\
					models.Order.status == 6 ,models.Order.status == 10))).all()
				if order_list:
					follow.shop_new = 1
					self.session.commit()


		return self.send_success()

