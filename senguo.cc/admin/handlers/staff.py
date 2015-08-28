from handlers.base import StaffBaseHandler
import dal.models as models
import tornado.web
from settings import *
import time, datetime
from sqlalchemy import desc, and_, or_
import qiniu

class Access(StaffBaseHandler):
	def initialize(self, action):
		self._action = action
	def prepare(self):
		"""prepare会在get、post等函数运行前运行，如果不想父类的prepare函数起作用的话就把他覆盖掉"""
		pass
	def get(self):
		next_url = self.get_argument('next', '')
		if self._action == "login":
			next_url = self.get_argument("next", "")
			return self.render("staff/login.html",context=dict(next_url=next_url))
		elif self._action == "logout":
			self.clear_current_user()
			return self.redirect(self.reverse_url("staffHome"))
		elif self._action == "oauth":
			self.handle_oauth()
		else:
			return self.send_error(404)

	@StaffBaseHandler.check_arguments("phone", "password", "next?")
	def post(self):
		u = models.ShopAdmin.login_by_phone_password(self.session, self.args["phone"], self.args["password"])
		if not u:
			return self.send_fail(error_text = "用户名或密码错误")
		self.set_current_user(u, domain=ROOT_HOST_NAME)
		self.redirect(self.args.get("next", self.reverse_url("staffHome")))
		return self.send_success()

	@StaffBaseHandler.check_arguments("code", "state?", "mode")
	def handle_oauth(self):
		# todo: handle state
		code =self.args["code"]
		mode = self.args["mode"]
		# print("[StaffAccess]Weixin Auth, mode:",mode,",code:",code)
		if mode not in ["mp", "kf"]:
			return self.send_error(400)

		userinfo = self.get_wx_userinfo(code, mode)
		if not userinfo:
			return self.redirect(self.reverse_url("staffLogin"))
		u = models.ShopStaff.register_with_wx(self.session, userinfo)
		self.set_current_user(u, domain=ROOT_HOST_NAME)

		next_url = self.get_argument("next", self.reverse_url("staffHome"))
		return self.redirect(next_url)

class Home(StaffBaseHandler):
	#def prepare(self):
	#    pass

	@tornado.web.authenticated
	@StaffBaseHandler.check_arguments("action?:str","shop?:int")
	def get(self):
		# print("[StaffHome]Shop ID:",self.shop_id)
		if "action" in self.args and self.args["action"] =="home" and "shop" in self.args:
			_shop_id=int(self.args["shop"])
			self.shop_id = _shop_id
			self.set_secure_cookie("staff_shop_id", str(_shop_id), domain=ROOT_HOST_NAME)
			_shop = self.session.query(models.Shop.shop_code,models.Shop.shop_name).filter_by(id=_shop_id).first()
			try:
				self.shop_code = _shop[0]
				self.shop_name = _shop[1]
			except:
				pass
		try:
			hirelink = self.session.query(models.HireLink).\
				filter_by(staff_id=self.current_user.id, shop_id=self.shop_id).one()
		except:
			return self.send_error(404)
		work = hirelink.work
		self.current_user.work = work #增加work属性
		orders = []
		page = ''

		if work == 1: #JH
			orders = self.session.query(models.Order).filter_by(shop_id=self.shop_id,
				JH_id=self.current_user.id, status=models.ORDER_STATUS.JH)
			history_orders = self.session.query(models.Order).filter(models.Order.shop_id==self.shop_id,
											 models.Order.JH_id==self.current_user.id, models.Order.status.in_([3,4,5,6,7])).order_by(models.Order.id.desc())
		elif work ==2: #SH1
			orders = self.session.query(models.Order).filter_by(shop_id=self.shop_id,
				SH1_id=self.current_user.id, status=models.ORDER_STATUS.SH1)
			history_orders = self.session.query(models.Order).filter(models.Order.shop_id==self.shop_id,
								  models.Order.SH1_id==self.current_user.id,models.Order.status.in_([4,5,6,7])).order_by(models.Order.id.desc())
		elif work ==3: #SH2
			orders = self.session.query(models.Order).filter(models.Order.shop_id==self.shop_id,
				models.Order.SH2_id==self.current_user.id, models.Order.status.in_([4]))
			history_orders = self.session.query(models.Order).filter(models.Order.shop_id==self.shop_id,
								  models.Order.SH2_id==self.current_user.id, models.Order.status.in_([5,6,7])).order_by(models.Order.id.desc())
		else:
			return self.send_error(404)
		orders_intime = orders.filter_by(type=1).all()
		orders_ontime = orders.filter_by(type=2).all()
		day = datetime.datetime.now().day
		# orders_ontime = [x for x in orders_ontime if (x.today == 1 and x.create_date.day == day) or
		#           (x.today == 2 and x.create_date.day+1 == day)]#过滤掉明天的订单

		orders_intime = len(orders_intime)
		orders_ontime = len(orders_ontime)

		# print("[StaffHome]orders_intime:",orders_intime)
		# print("[StaffHome]orders_ontime:",orders_ontime)
		self.set_cookie("orders_intime",str(orders_intime))
		self.set_cookie("orders_ontime",str(orders_ontime))
		return self.render("staff/home.html", page="home")
	@tornado.web.authenticated
	@StaffBaseHandler.check_arguments("shop_id:int")
	def post(self):#店铺切换
		shop_id = self.args["shop_id"]
		if not next((x for x in self.current_user.shops if x.id == shop_id), None):
			return self.send_error(404)
		self.set_secure_cookie("staff_shop_id", str(shop_id), domain=ROOT_HOST_NAME)
		return self.send_success()

class Order(StaffBaseHandler):
	@tornado.web.authenticated
	@StaffBaseHandler.check_arguments("order_type","day_type?","shop?:int")
	def get(self):
		if "shop" in self.args:
			_shop_id=int(self.args["shop"])
			self.shop_id = _shop_id
			self.set_secure_cookie("staff_shop_id", str(_shop_id), domain=ROOT_HOST_NAME)
			_shop = self.session.query(models.Shop.shop_code,models.Shop.shop_name).filter_by(id=_shop_id).first()
			try:
				self.shop_code = _shop[0]
				self.shop_name = _shop[1]
			except:
				pass

		order_type = self.args["order_type"]
		try:
			hirelink = self.session.query(models.HireLink).\
				filter_by(staff_id=self.current_user.id, shop_id=self.shop_id).one()
		except:
			return self.send_error(404)

		work = hirelink.work
		self.current_user.work = work #增加work属性
		orders = []
		page = ''

		if work == 1: #JH
			orders = self.session.query(models.Order).filter_by(shop_id=self.shop_id,
				JH_id=self.current_user.id, status=models.ORDER_STATUS.JH)
			history_orders = self.session.query(models.Order).filter(models.Order.shop_id==self.shop_id,
											 models.Order.JH_id==self.current_user.id, models.Order.status.in_([3,4,5,6,7])).order_by(models.Order.id.desc())
		elif work == 2: #SH1
			orders = self.session.query(models.Order).filter_by(shop_id=self.shop_id,
				SH1_id=self.current_user.id, status=models.ORDER_STATUS.SH1)
			history_orders = self.session.query(models.Order).filter(models.Order.shop_id==self.shop_id,
								  models.Order.SH1_id==self.current_user.id,models.Order.status.in_([4,5,6,7])).order_by(models.Order.id.desc())
		elif work == 3: #SH2
			orders = self.session.query(models.Order).filter(models.Order.shop_id==self.shop_id,
				models.Order.SH2_id==self.current_user.id, models.Order.status.in_([4,5]))
			orders_len = self.session.query(models.Order).filter(models.Order.shop_id==self.shop_id,
				models.Order.SH2_id==self.current_user.id, models.Order.status.in_([4]))
			history_orders = self.session.query(models.Order).filter(models.Order.shop_id==self.shop_id,
								  models.Order.SH2_id==self.current_user.id, models.Order.status.in_([5,6,7])).order_by(models.Order.id.desc())
		else:
			return self.send_error(404)

		orders_intime = 0
		orders_ontime = 0

		orders_len1 = orders_len.filter_by(type=1).all()
		orders_intime = len(orders_len1)
		self.set_cookie("orders_intime",str(orders_intime))

		orders_len2 = orders_len.filter_by(type=2).all()
		day = datetime.datetime.now().day
		# orders_len2 = [x for x in orders_len2 if (x.today == 1 and x.create_date.day == day) or
		#               (x.today == 2 and x.create_date.day+1 == day)]#过滤掉明天的订单
		orders_ontime = len(orders_len2)
		self.set_cookie("orders_ontime",str(orders_ontime))


		if order_type == "now":
			orders = orders.filter_by(type=1).filter(models.Order.status!=5 or 6 or 7).order_by(models.Order.id.desc()).all()
			page = 'now'
		elif order_type == "on_time":
			orders = orders.filter_by(type=2).filter(models.Order.status!=5 or 6 or 7).order_by(models.Order.send_time).all()
			# orders = [x for x in orders if (x.today == 1 and x.create_date.day == day) or
			#           (x.today == 2 and x.create_date.day+1 == day)]#过滤掉明天的订单
			page = 'on_time'
		elif order_type == "history":
			orders = history_orders
			page = 'history'
		elif order_type == "self":
			orders = orders.filter_by(type=3).filter(models.Order.status!=5 or 6 or 7).order_by(models.Order.send_time).all()
			page = 'self'
		else:
			return self.send_error(404)
		if "day_type" in self.args:
			day_type=self.args["day_type"]
			today = datetime.date.today()
			timedelta=datetime.timedelta(days=1)
			tomorrow=(today+timedelta).strftime("%Y-%m-%d")
			today=today.strftime("%Y-%m-%d")
			if day_type == "today":
				orders = [x for x in orders if (x.today == 1 and x.create_date.strftime("%Y-%m-%d") == today) or (x.today == 2 and (x.create_date+datetime.timedelta(days=1)).strftime("%Y-%m-%d") == today)]#过滤掉明天的订单
			elif day_type == "tomorrow":
				orders = [x for x in orders if(x.today == 2 and (x.create_date+datetime.timedelta(days=1)).strftime("%Y-%m-%d") == tomorrow)]
			elif day_type == "overtime":
				orders = [x for x in orders if(x.today == 1 and x.create_date.strftime("%Y-%m-%d") < today) or (x.today == 2 and (x.create_date+datetime.timedelta(days=1)).strftime("%Y-%m-%d") < today)]

		return self.render("staff/orders.html", orders=orders, page=page)

	@tornado.web.authenticated 
	@StaffBaseHandler.check_arguments("action", "order_id:int", "data")
	def post(self):
		action = self.args["action"]
		try:order = self.session.query(models.Order).filter_by(id=self.args["order_id"]).one()
		except:return self.send_fail("没找到该订单", 404)
		if action == "finish":
			if order.status in [5,6,7]:
				return self.send_fail('订单已完成，不允许重复操作')
			if self.current_user.work == 1:#JH
				if order.status == 3:
					return self.send_fail("已完成操作，请勿重复")
				status = 3
			elif self.current_user.work == 2:#SH1
				if order.status == 4:
					return self.send_fail("已完成操作，请勿重复")
				status = 4
			elif self.current_user.work == 3:#SH2
				if order.status not in [1,2,3,4]:
					return self.send_fail("已完成操作，请勿重复")
				status = 5
				if order.shop.admin.mp_name and order.shop.admin.mp_appid and order.shop.admin.mp_appsecret:
					# print("[CustomerCart]cart_callback: shop.admin.mp_appsecret:",shop.admin.mp_appsecret,shop.admin.mp_appid)
					access_token = self.get_other_accessToken(self.session,order.shop.admin.id)
					print(order.shop.admin.mp_name,order.shop.admin.mp_appid,order.shop.admin.mp_appsecret,access_token)
				else:
					access_token = None
				self.order_done(self.session,order,access_token)
				if order.pay_type == 1:  # 货到付款订单，员工需收款
					self.hirelink.money += order.totalPrice

			else:
				return self.send.fail("你还没分配工作，请联系商家")
			order.status = status

		elif action == "remark":
			order.staff_remark = self.args["data"]
		self.session.commit()
		return self.send_success()

class Hire(StaffBaseHandler):
	def prepare(self):
		pass
	@tornado.web.authenticated
	def get(self, config_id):
		try:config = self.session.query(models.Config).filter_by(id=config_id).one()
		except:return self.send_error(404)
		if not config.hire_on:
			return self.write("<center><font color='green'>招募已结束</font></center>")  # 招募已结束
		for shop in self.current_user.shops:
			if shop.id == int(config_id):return self.write("<center><font color='green'>"
														   "你已经是该店铺的员工</font></center>")
		shop_name = self.session.query(models.Shop.shop_name).filter_by(id=config_id).scalar()
		return self.render("staff/hire.html", config=config, shop_name=shop_name,page='')
	@tornado.web.authenticated
	@StaffBaseHandler.check_arguments("action", "data")
	def post(self, shop_id):
		action = self.args["action"]
		data = self.args["data"]
		if action == "add_hire_form":
			shop = self.session.query(models.Shop).filter_by(id=shop_id)
			if not shop:
				return self.send_error(404)
			try:
				hireform = self.session.query(models.HireForm).filter_by(
					staff_id=self.current_user.id, shop_id=shop_id).one()
				hireform.intro = data["intro"]
				hireform.advantage = data["advantage"]
				hireform.status = 1
				hireform.work = 3
			except:
				self.session.add(models.HireForm(staff_id=self.current_user.id, shop_id=shop_id,
								intro=data["intro"], advantage=data["advantage"]))
			self.current_user.address = data["address"]
			self.session.commit()
			# todo 不能直接把手机号存在accountinfo里，会出bug，比如手机号重复
			kwargs = {"name":data["name"], "phone":data["phone"], "email":data["email"]}
			self.current_user.accountinfo.update(session=self.session, **kwargs)
		return self.send_success()
