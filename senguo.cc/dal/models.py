from sqlalchemy import create_engine, func, ForeignKey, Column
from sqlalchemy.types import String, Integer, Boolean, Float, Date, BigInteger, DateTime, Time, SMALLINT
from sqlalchemy.orm import relationship, backref
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.dialects.mysql import TINYINT

from dal.db_configs import MapBase, DBSession
from dal.dis_dict import dis_dict
import json
import time
import datetime

class DistrictCodeError(Exception):
	pass

class FruitTypeError(Exception):
	pass

# 常量

#woody
class POINT_TYPE:
	TOTALPRICE = 1  # +totalprice
	FOLLOW     = 2  # +10
	SIGNIN     = 3  # +1
	SERIES_SIGNIN = 4 # +5
	PREPARE_PAY= 5  # +2
	FAVOUR     = 6 # +1
	COMMENT    = 7 # +5
	FIRST_ORDER= 8 # +5
	BING_PHONE = 9

class SHOP_SERVICE_AREA:
	"""服务区域, 使用方法：HIGH_SCHOOL | COMMUNITY，实现多选"""
	HIGH_SCHOOL = 1
	COMMUNITY = 2
	TRADE_CIRCLE = 4
	OTHERS = 8

class SHOPADMIN_ROLE_TYPE:
	"""管理员角色"""
	SHOP_OWNER = 1
	SYSTEM_USER = 2

class SHOPADMIN_PRIVILEGE:
	"""权限"""
	NONE = -1
	ALL = 0

class SHOPADMIN_CHARGE_TYPE:
	"""付费类型"""
	THREEMONTH_588 = 1
	SIXMONTH_988 = 2
	TWELVEMONTH_1788 = 3

class SHOP_STATUS:
	"""商店状态"""
	APPLYING = 1
	ACCEPTED = 2
	DECLINED = 3
	
	DATA_LIST = [APPLYING, ACCEPTED, DECLINED]

class INFO_TYPE:
	"""信息类型"""
	SUPPLY = 1
	DEMAND = 2
	OTHER = 3

class ORDER_STATUS:
	"""订单状态"""
	DELETED = 0
	ORDERED = 1
	JH = 2
	SH1 = 3
	SH2 = 4
	FINISH = 5
	AFTER_SALE = 6

class ORDER_TYPE:
	"""订单类型"""
	NOW = 1
	ON_TIME = 2

class TAG:
	"""商品标签"""
	NULL = 1
	DISC = 2 #折扣
	HOT = 3
	S_P = 4 #特价
	NEW = 5

## TODO: 账户支付及账户升级功能


class _CommonApi:

	@classmethod
	def get_by_id(cls, session, id):
		s = session
		try:u = s.query(cls).filter_by(id=id).one()
		except:u = None
		return u

	def save(self, session):
		s = session
		s.add(self)
		s.commit()

	def update(self, session, **kwargs):
		for key in kwargs.keys():
			setattr(self, key, kwargs[key])
		self.save(session)

	"""将数据实例对象转换为dict数据，便于与前端通信，目前支持2级展开关系表"""
	# 定义需要保护的对象名:
	__protected_props__ = []
	__relationship_props__ = []
	def safe_props(self, with_relationship=True):
		output_data = {}
		for key in self.__dict__:
			if type(key) == str and \
			   not key.startswith("_") and \
			   not key in self.__protected_props__:
				output_data[key] = self.__dict__[key]
		# 支持账户类型数据
		if "accountinfo" in self.__relationship_props__:
			output_data["accountinfo"] = getattr(self, "accountinfo").safe_props(False)

		if with_relationship:
			for rel_prop_name in self.__relationship_props__:
				if not rel_prop_name in self.__protected_props__:
					if rel_prop_name == "accountinfo":
						continue
					rel_prop_data = getattr(self, rel_prop_name)

					try:
						out_prop_data = []
						for prop_data in  rel_prop_data:
							out_prop_data.append(prop_data.safe_props(False))
					except:
						out_prop_data = rel_prop_data.safe_props(False)
					output_data[rel_prop_name] = out_prop_data

		return output_data

	def all_props(self, with_relationship=True):
		output_data = {}
		for key in self.__dict__:
			if type(key) == str and \
			   not key.startswith("_"):
				output_data[key] = self.__dict__[key]

		# 支持账户类型数据
		if "accountinfo" in self.__relationship_props__:
			output_data["accountinfo"] = getattr(self, "accountinfo").safe_props(False)

		if with_relationship:
			for rel_prop_name in self.__relationship_props__:
				if rel_prop_name == "accountinfo":
						continue
				rel_prop_data = getattr(self, rel_prop_name)
				try:
					out_prop_data = []
					for prop_data in  rel_prop_data:
						out_prop_data.append(prop_data.all_props(False))
				except:
					out_prop_data = rel_prop_data.all_props(False)
				output_data[rel_prop_name] = out_prop_data
		return output_data


class _AccountApi(_CommonApi):
	"""
	a common account access api, should be inherit by every 
	account.

	* 难题：解决有奖
	问题1： session中的实例什么时候会被系统回收？如果实例一直未被detached会不会一直不会被系统回收？
	问题2： 在本模块中，对象内置的一些方法可能会用到会话，怎么管理这些会话？
		  1. 全局唯一会话：带来并发问题，可能会导致并发处理异常。
		  2. 全局多个会话，并实现访问排队：可能导致性能受影响。
	最粗暴的解决方法：传一个外部控制的session参数进来，由外部控制session的死活。
	"""
	
	# 微信登录API
	@classmethod
	def login_by_unionid(cls, session, wx_unionid):
		s = session
		try:
			u = s.query(cls).filter(
				Accountinfo.id==cls.id, 
				Accountinfo.wx_unionid==wx_unionid).one()
		except NoResultFound:
			u = None
		return u
	# 微信注册API（注意）
	@classmethod
	def register_with_wx(cls, session, wx_userinfo):
		# 判断是否在本账户里存在该用户
		u = cls.login_by_unionid(session, wx_userinfo["unionid"])
		print("[微信登录]用户登录")
		if u:
			# 已存在用户，则更新微信信息
			print("[微信登录]用户存在，更新用户资料")
			u.accountinfo.wx_country=wx_userinfo["country"]
			u.accountinfo.wx_province=wx_userinfo["province"]
			u.accountinfo.wx_city=wx_userinfo["city"]
			u.accountinfo.headimgurl=wx_userinfo["headimgurl"]
			u.accountinfo.headimgurl_small = wx_userinfo["headimgurl"][0:-1] + "132"
			#u.accountinfo.nickname = wx_userinfo["nickname"]

			#####################################################################################
			# update wx_openid
			#####################################################################################
			print("[微信登录]用户老OpenID：",u.accountinfo.wx_openid)
			old = u.accountinfo.wx_openid
			old_start = old[0:2]
			if old_start == "o7":
				start = wx_userinfo['openid'][0:2]
				print("[微信登录]用户新OpenID为",start,"开头")
				if start == "o5":
					u.accountinfo.wx_openid = wx_userinfo["openid"]
					print("[微信登录]更新用户OpenID")
			print("[微信登录]用户新OpenID：",wx_userinfo["openid"])
			session.commit()
		
			return u
		# 判断是否在基本信息表里存在该用户
		
		try:
			account_info = session.query(Accountinfo).filter_by(wx_unionid=wx_userinfo["unionid"]).one()
		except NoResultFound:
			account_info = None
		# 基本账户中存在该账户，直接添加
		if account_info:
			u = cls(id=account_info.id)

			session.add(u)
			session.commit()
			return u
		
		# 基本账户中不存在，先创建基本信息，再添加到该用户账户中去
		print("[微信登录]用户不存在，注册为新用户")
		headimgurl_small = wx_userinfo["headimgurl"][0:-1] + "132"
		account_info = Accountinfo(
			wx_unionid=wx_userinfo["unionid"],
			wx_openid=wx_userinfo["openid"],
			wx_country=wx_userinfo["country"],
			wx_province=wx_userinfo["province"],
			wx_city=wx_userinfo["city"],
			headimgurl=wx_userinfo["headimgurl"],
			headimgurl_small = headimgurl_small,
			nickname=wx_userinfo["nickname"],
			sex = wx_userinfo["sex"])
		u = cls()
		u.accountinfo = account_info
		session.add(u)
		session.commit()
		return u
	
	# 手机号密码登录
	@classmethod
	def login_by_phone_password(cls, session, phone, password):
		s = session
		try:
			u = s.query(cls).filter(
				cls.id == Accountinfo.id,
				Accountinfo.phone==phone,
				Accountinfo.password != None,
				Accountinfo.password == password
			).one()
		except NoResultFound:
			u = None
		return u

	#regist by phone
	# woody
	@classmethod
	def regist_by_phone_password(cls,session,phone,password):
		u = cls.login_by_phone_password(session,phone,password)
		if u:
			return u
		try:
			account_info = session.query(Accountinfo).filter_by(phone = phone,\
				password = password).one()
		except NoResultFound:
			account_info = None
		if account_info:
			u = cls(id = account_info.id)
			session.add(u)
			session.commit()
			return u
		account_info = Accountinfo(phone = phone,password = password)
		u = cls()
		u.accountinfo = account_info
		session.add(u)
		session.commit()
		return u

	# 手机号验证码登录
	@classmethod
	def login_by_phone(cls, session, phone):
		s = session
		try:
			u = s.query(cls).filter(
				cls.id == Accountinfo.id,
				Accountinfo.phone==phone
			).one()
		except NoResultFound:
			u = None
		return u
	# * TODO 手机号注册

class AccessToken(MapBase,_CommonApi):
	__tablename__ = 'access_token'
	id = Column(Integer,primary_key = True , nullable = False)
	create_timestamp = Column(Float)
	access_token = Column(String(200))

#用户的基本信息，每个角色类型都连接到这个表，即一人可能有多个角色，但只有一种基本信息
class Accountinfo(MapBase, _CommonApi):
	__tablename__ = "account_info"
	
	__protected_props__ = ["password", "phone", "email", "wx_unionid", "sex", 
						   "realname", "birthday", "wx_openid", "wx_country", "wx_province", "wx_city"]

	def __init__(self, **kwargs):
		if not "create_date_timestamp" in kwargs:
			kwargs["create_date_timestamp"] = time.time()
		super().__init__(**kwargs)
	
	id = Column(Integer, primary_key=True, nullable=False)
	create_date_timestamp = Column(Integer, nullable=False)

	# 账户访问信息 (phone/email, password)/(wx_unionid)用来登录
	phone = Column(String(32), unique=True, default=None)
	email = Column(String(64), default=None)
	password = Column(String(128), default=None)
	wx_unionid = Column(String(64), unique=True)
	
	# 基本账户信息

	# 性别，男1, 女2, 其他0
	sex = Column(Integer, default=0)
	# 昵称
	nickname = Column(String(64), default="")
	# 真实姓名
	realname = Column(String(128))
	# 头像url
	headimgurl = Column(String(1024))
	headimgurl_small = Column(String(1024))
	# 生日
	birthday = Column(Integer)# timestamp
	# 微信数据
	wx_openid = Column(String(64))          #pc
	wx_username = Column(String(64))
	wx_country = Column(String(32))
	wx_province = Column(String(32))
	wx_city = Column(String(32))

	is_new   = Column(Integer,default = 0) # 0:new , 1:old
	subscribe  = Column(Integer,default = 0) #0:not foucus,1:foucus#4.24 yy
	# mp_openid = Column(String(64)) 

	# mp_openid = Column(Integer(64))     #mobile

# 角色：超级管理员
class SuperAdmin(MapBase, _AccountApi):
	__tablename__ = "super_admin"
	__relationship_props__ = ["accountinfo"]

	id = Column(Integer, ForeignKey(Accountinfo.id), primary_key=True, nullable=False)
	accountinfo = relationship(Accountinfo)

	def __repr__(self):
		return "<SuperAdmin ({nickname}, {id})>".format(id=self.id, nickname=self.accountinfo.nickname)

# 店铺申请表
class ShopTemp(MapBase, _CommonApi):
	"""申请中和拒绝的店铺放在临时表中"""
	def __init__(self, **kwargs):
		if ("shop_province" in kwargs) and ("shop_city" in kwargs):
			if not self._check_city_code(
					kwargs["shop_province"], kwargs["shop_city"]):
				raise DistrictCodeError
		# 如果没有二级city，将city设为province
		if not "shop_city" in kwargs:
			kwargs["shop_city"] = kwargs["shop_province"]

		if not "create_date_timestamp" in kwargs:
			kwargs["create_date_timestamp"] = time.time()

		super().__init__(**kwargs)

	def _check_city_code(self, shop_province, shop_city):
		if shop_province not in dis_dict.keys():
			return False
		if "city" not in dis_dict[shop_province].keys():
			return True
		if shop_city not in dis_dict[shop_province]["city"]:
			return False
		return True

	__tablename__ = "shop_temp"

	id = Column(Integer, primary_key=True, nullable=False)
	admin_id = Column(Integer,ForeignKey("shop_admin.id"),nullable=False)
	shop_name = Column(String(128), nullable=False)
	create_date_timestamp = Column(Integer, nullable=False)
	shop_status = Column(Integer, default=SHOP_STATUS.APPLYING)
	declined_reason = Column(String(256), default="")
	shop_trademark_url = Column(String(2048))
	shop_service_area = Column(Integer, default=SHOP_SERVICE_AREA.OTHERS)
	# 地址
	shop_province = Column(Integer)
	shop_city = Column(Integer)
	shop_address_detail = Column(String(1024), nullable=False)
	# 是否做实体店
	have_offline_entity = Column(Integer, default=False)
	# 店铺介绍
	shop_intro = Column(String(568))
	shop_phone=Column(String(16))

	admin = relationship("ShopAdmin")


# 店铺
class Shop(MapBase, _CommonApi):
	# def __init__(self, **kwargs):
	#     self.config=Config()
	#     super().__init__(**kwargs)

	__relationship_props__ = ["admin", "demand_fruits", "onsale_fruits"]
	__tablename__ = "shop"
	
	id = Column(Integer, primary_key=True, nullable=False)
	shop_name = Column(String(128), nullable=False)
	shop_code = Column(String(128), nullable=False, default="not set")
	create_date_timestamp = Column(Integer, nullable=False)
	shop_status = Column(Integer, default=SHOP_STATUS.ACCEPTED)  # 1：申请中 2：申请成功 3：拒绝
	shop_auth =Column(Integer,default =0)#0:未认证 1:个人认证 2:企业认证 3:个人认证转企业认证 4:企业认证转个人认证 #yy4.29
	auth_change=Column(Integer,default =0)#0未认证 1:认证一次 2:认证两次 #yy4.30
	# on or off
	status   = Column(Integer,default = 1) # 1:on ,0:off

	admin_id = Column(Integer, ForeignKey("shop_admin.id"), nullable=False)
	admin = relationship("ShopAdmin")

	# 店铺标志
	shop_trademark_url = Column(String(2048))
	
	# 服务区域，SHOP_SERVICE_AREA
	shop_service_area = Column(Integer, default=SHOP_SERVICE_AREA.OTHERS)
	deliver_area = Column(String(100))  # 配送区域

	# 地址
	shop_province = Column(Integer)
	shop_city = Column(Integer)
	shop_address_detail = Column(String(1024), nullable=False)
	shop_sales_range = Column(String(128))

	# 是否做实体店
	have_offline_entity = Column(Integer, default=False)

###################################################
	#the phone of shop ,   added by woody
	shop_phone=Column(String(16))

	# 店铺介绍
	shop_intro = Column(String(568))
	# 总用户数
	total_users = Column(Integer)
	# 日均销售（元）
	daily_sales = Column(Integer)
	# 单次采购（元）
	single_stock_size = Column(Integer)
	# 求购水果
	demand_fruits = relationship("FruitType", secondary="shop_demandfruit_link")
	# 在售水果
	onsale_fruits = relationship("FruitType", secondary="shop_onsalefruit_link")
	# 店铺url
	shop_url = Column(String(2048))
	# 运营时间
	shop_start_timestamp = Column(Integer)
	# 团队人数
	team_size = Column(Integer)
	new_order_sum = Column(Integer, default=0)
	new_follower_sum = Column(Integer, default=0)

	have_wx_mp = Column(Boolean)
	wxapi_token = Column(String(128))
	wx_accountname = Column(String(128))
	wx_nickname = Column(String(128))
	wx_qr_code = Column(String(1024))

	#店铺  余额 和 冻结 余额
	shop_balance = Column(Float,default = 0) 
	shop_blockage= Column(Float,default = 0) #当用户下单后，店铺冻结余额增加，当订单完成后 冻结 余额 转入 店铺余额

	orders = relationship("Order")
	staffs = relationship("ShopStaff", secondary="hire_link")
	fruits = relationship("Fruit", order_by="desc(Fruit.priority)")
	menus = relationship("Menu", uselist=True)
	config = relationship("Config", uselist=False)
	def __repr__(self):
		return "<Shop: {0} (id={1}, code={2})>".format(
			self.shop_name, self.id, self.shop_code)
	
	#get order_count of this shop
	def get_orderCount(self,shop_id):
		try:
			order_count = self.session.query(Order).filter_by(shop_id = shop_id).count()
		except:
			print('print mark 3: error')
			return None
		print('print mark 4: success')
		return order_count

class ShopAuthenticate(MapBase,_AccountApi):
	__tablename__ = "shop_auth"
	id  = Column(Integer,primary_key = True ,nullable = False)
	shop_type  = Column(Integer) # 1:person 2:company
	company_name = Column(String(128))
	business_licence = Column(String(2048))
	realname   = Column(String(16))
	card_id    = Column(String(32))
	handle_img   = Column(String(2048))
	front_img  = Column(String(2048))
	behind_img = Column(String(2048))
	has_done   = Column(Integer,default = 0) # 0:before done 1:success 2:decline 
	shop_id = Column(Integer,ForeignKey(Shop.id))#yy4.29
	decline_reason =Column(String(200))#yy4.29
	shop = relationship('Shop')
	create_time = Column(DateTime, default=func.now())
	# code       = Column(Integer)


# 角色：商家，即店铺的管理员
class ShopAdmin(MapBase, _AccountApi):
	__tablename__ = "shop_admin"

	__relationship_props__ = ["accountinfo"]
	__protected_props__ = ["system_orders"]

	id = Column(Integer, ForeignKey(Accountinfo.id), primary_key=True, nullable=False)
	accountinfo = relationship(Accountinfo)
	
	# 角色类型，SHOPADMIN_ROLE_TYPE: [SHOP_OWNER, SYSTEM_USER]
	role = Column(Integer, nullable=False, default=SHOPADMIN_ROLE_TYPE.SHOP_OWNER)
	# 权限类型，SHOPADMIN_PRIVILEGE: [ALL, ]
	privileges = Column(Integer, default=SHOPADMIN_PRIVILEGE.NONE)
	# 过期时间
	expire_time = Column(Integer, default=0)
	# 系统购买数据
	system_orders = relationship("SystemOrder", uselist=True)

	# 商城1.0系统账户密码(目前一个商家给一个店铺账户和密码)
	system_username = Column(String(32))
	system_password = Column(String(128))
	system_market_url = Column(String(256))

	briefintro = Column(String(300), default="")

	shops = relationship(Shop, uselist=True)
	shops_collect = relationship("Shop",secondary="shops_collect")
	feedback = relationship("Feedback")

	info = relationship("Info")
	info_collect = relationship("Info", secondary="info_collect")
	comment = relationship("Comment")

	def success_orders(self, session):
		if not hasattr(self, "_success_orders"):
			self._success_orders = session.query(SystemOrder).\
								   filter_by(admin_id=self.id, 
											 order_status=SYS_ORDER_STATUS.SUCCESS
								   ).all()
		return self._success_orders

	def add_shop(self, session, **kwargs):
		kwargs["admin_id"] = self.id
		if "shops" in kwargs:
			del kwargs["shops"]

		sp = Shop(**kwargs)
		#sp.config=Config()
		s = session
		s.add(self)
		self.shops.append(sp)
		s.commit()
	
	def add_tmp_order(self, session, charge_data):
		"""添加一个临时订单"""
		o = SystemOrder.create_one(
			session,
			admin_id=self.id,
			charge_id=charge_data.id,
			charge_good_name=charge_data.good_name,
			charge_price= charge_data.price,
			charge_month=charge_data.month,
			charge_description=charge_data.description
		)
		return o
	
	def finish_order(self, session, *, order_id, ali_trade_no):
		"""用户付款完成一个订单[一般由用户支付成功回调时使用]"""
		try:
			o = session.query(SystemOrder).filter_by(order_id=order_id).one()
		except NoResultFound:
			return None
		t_now = int(time.time())
		# TODO 改成事物性处理，不用update来实现
		if o.order_status == SYS_ORDER_STATUS.SUCCESS:
			return o
		# 更新订单状态
		o.update(session, order_status=SYS_ORDER_STATUS.SUCCESS, ali_trade_no=ali_trade_no)

		if self.role != SHOPADMIN_ROLE_TYPE.SYSTEM_USER:
			self.role = SHOPADMIN_ROLE_TYPE.SYSTEM_USER
		# 设置过期时间
		if t_now > self.expire_time: 
			self.expire_time = t_now+o.charge_month*30*24*3600
		else:
			self.expire_time = self.expire_time + o.charge_month*30*24*3600
		
		session.commit()
		return o
	
	@classmethod
	def set_system_info(cls,session, *,
						admin_id, system_username, system_password, system_code):
		try:
			admin = session.query(ShopAdmin).filter_by(id=admin_id).one()
		except NoResultFound:
			return None
		
		admin.system_username = system_username
		admin.system_password = system_password
		admin.system_market_url = "http://open.wexinfruit.com/market/"+system_code
		session.commit()
		return admin

	def __repr__(self):
		return "<ShopAdmin (nickname, id)>".format(self.accountinfo.nickname, 
												   self.id)

# 角色：店铺员工
class ShopStaff(MapBase, _AccountApi):
	__tablename__ = "shop_staff"
	__relationship_props__ = ["accountinfo"]
	id = Column(Integer, ForeignKey(Accountinfo.id), primary_key=True, nullable=False)
	shop_id = Column(Integer, ForeignKey(Shop.id))

	address = Column(String(100))#员工住址

	accountinfo = relationship(Accountinfo)
	shops = relationship("Shop", secondary="hire_link")

# 雇佣关系表
class HireLink(MapBase, _CommonApi):
	__tablename__ = "hire_link"

	staff_id = Column(Integer, ForeignKey(ShopStaff.id), primary_key=True)
	shop_id = Column(Integer, ForeignKey(Shop.id), primary_key=True)
	work = Column(TINYINT, default=3) #工作类型：1:JH,2:SH1,3:SH2
	money = Column(Float, default=0)  # 已收货款
	address1 = Column(String(100)) #责任区域一级地址（可多选，空格隔开）
	address2 = Column(String(200)) #二级
	remark = Column(String(500))
	active = Column(TINYINT, default=1)#1:上班 2：下班

# 角色：顾客
class Customer(MapBase, _AccountApi):
	__tablename__ = "customer"
	__relationship_props__ = ["accountinfo"]
	id = Column(Integer, ForeignKey(Accountinfo.id), primary_key=True, nullable=False)
	accountinfo = relationship(Accountinfo)

	balance = Column(Float, default=0)
	credits = Column(Float, default=0)

	orders = relationship("Order")
	carts = relationship("Cart", uselist=True)
	addresses = relationship("Address", backref="customer")

	#added by woody
	points = relationship("Points")
	shop_new = Column(Integer,default = 0) # 0:new ,1:old

#woody
class Points(MapBase,_CommonApi):
	__tablename__ = "points"
	id = Column(Integer,ForeignKey(Customer.id) ,primary_key = True ,nullable = False)
	signIn_count = Column(Float,default=0)
	totalPrice = Column(Float,default = 0)
	follow_count = Column(Float,default = 0)
	favour_count = Column(Float,default = 0)
	comment_count = Column(Float,default = 0)
	# count        = Column(Float,default = 0)
	totalCount = Column(Float,default = 0)
	balance_count = Column(Float,default =0)
	phone_count   = Column(Float,default = 0)
	address_count = Column(Float,default = 0)

	# def get_count(self,session,id):
	#     try:
	#         address = session.query().filter_by(customer_id = id).first()
	#     except:
	#         address_count = 0
	#     address_count =5
	#     try:
	#         follows = session.query(CustomerShopFollow).filter_by(customer_id =id).count()
	#         print(follows)
	#     except:
	#         follows = 0
	#     try:
	#         orders_count  = session.query(Order).filter_by(customer_id = id ,pay_type = 2).count()
	#     except:
	#         print("orders_count error")
	#         orders_count = 0
	#     try:
	#         #woody
	#         # I don't know how to query filter "!="
	#         no_comment_count = session.query(Order).filter_by(customer_id =id ,comment = None).count()
	#         total_comment_count = session.query(Order).filter_by(customer_id = id).count()
	#         comment_count = total_comment_count - no_comment_count
	#         print("comment_count",comment_count)
	#     except:
	#         print("comment_count error?")
	#         comment_count = 0
	#     try:
	#         totalPrice = session.query(func.sum(Order.totalPrice)).filter(models.Order.status >=5 ).all()
	#     except:
	#         totalPrice = 0
	#     try:
	#         point   = session.query(Points).filter_by(id = id).first()
	#         accountinfo = session.query(Accountinfo).filter_by(id = id).first()
	#     except:
	#         return None
	#     point.follow_count = follows * 10
	#     point.balance_count = orders_count
	#     point.comment_count = comment_count * 5
	#     point.address_count = address_count
	#     point.totalPrice = totalPrice
	#     if not accountinfo.phone:
	#         point.phone_count = 0
	#     else:
	#         point.phone_count = 5
	#     totalCount = point.follow_count + orders_count + point.favour_count + point.signIn_count +point.comment_count+\
	#     point.phone_count + point.address_count + totalPrice
	#     point.totalCount = totalCount
	#     session.commit()
	#     print("follow_count","yu'e","dian zan ","qian dao " )
	#     print(follows,orders_count,point.favour_count,point.signIn_count,point.comment_count,point.phone_count\
	#         ,point.address_count,point.totalPrice,point.totalCount)
	#     return totalCount


# 用户关注店铺

class CustomerShopFollow(MapBase, _CommonApi):
	__tablename__ = "customer_shop_follow"
	customer_id = Column(Integer, ForeignKey(Customer.id), primary_key=True, nullable=False)
	shop_id = Column(Integer, ForeignKey(Shop.id), primary_key=True, nullable=False)
	create_time = Column(DateTime, default=func.now())

	# the point of each shop
	# woody
	shop_point = Column(Float,default = 0)
	# pointhistory = relationship("PointHistory")
	bing_add_point = Column(Integer)  # 1 :
	shop_new = Column(Integer,default = 0)
	shop_balance  = Column(Float , default = 0)

#商家申请 提现
class ApplyCashHistory(MapBase,_CommonApi):
	__tablename__ = 'apply_cash'
	id = Column(Integer,primary_key = True , nullable = False)
	shop_id = Column(Integer , ForeignKey(Shop.id) ,nullable= False)
	shop_code = Column(String(64))
	shop_auth  = Column(Integer)
	applicant_name  = Column(String(32))
	shop_balance = Column(Float,default = 0)
	alipay_account = Column(String(64))
	value   = Column(Integer) #申请提现的金额，单位：分
	create_time = Column(DateTime,default = func.now())
	has_done   = Column(Integer , default = 0) # 0:before done,1: done success,2: decline
	decline_reason = Column(String(200)) #当申请提现被拒绝后 给商家的理由

################################################################################
# 余额记录 只会在 三处地方产生:
# 用户充值 ，店铺管理员提现 和 接下来要做的在线支付
# 即只有真正实现 支付的地方才用到。而用户 余额消费 只是数值上的变动
################################################################################

class BalanceHistory(MapBase,_CommonApi):
	__tablename__ = 'balancehistory'
	id = Column(Integer,primary_key = True , nullable = False)
	customer_id = Column(Integer,ForeignKey(CustomerShopFollow.customer_id),nullable = False)
	name = Column(String(32)) #当 balance_type = 0,3 ，时，表示 充值用户的名称 ，
								#当 balance_type为2 的时候，表示申请提现店铺管理员名称
	shop_id  = Column(Integer,ForeignKey(CustomerShopFollow.shop_id),nullable = False)
	balance_record = Column(String(32))  #充值 或者 消费 的 具体记录
	balance_type = Column(Integer,default = 1) # 0:代表充值 ，1:余额消费(没用) 2:提现 3:在线支付
	balance_value  = Column(Float)
	create_time    = Column(DateTime,default = func.now())
	#customer = relationship("CustomerShopFollow")

class PointHistory(MapBase,_CommonApi):
	__tablename__ = 'pointhistory'
	id = Column(Integer, primary_key=True, nullable=False)
	customer_id = Column(Integer, ForeignKey(CustomerShopFollow.customer_id), \
		nullable=False)
	shop_id = Column(Integer, ForeignKey(CustomerShopFollow.shop_id), nullable=False)
	point_type =Column(Integer)
	each_point = Column(Float,default = 0)
	create_time = Column(DateTime,default=func.now())

class COUNTER_TYPE:
	SYSTEM_ORDER_COUNTER = 1

class Counter(MapBase):
	__tablename__ = "counter"
	type = Column(Integer, nullable=False, primary_key=True, unique=True)
	count = Column(Integer, nullable=False)
	# 初始化数据的时间戳
	init_date = Column(Date, nullable=False)

class SYS_ORDER_STATUS:
	TEMP = 1
	SUCCESS = 2
	ABORTED = 3

class SystemOrder(MapBase, _CommonApi):
	"""系统的购买订单"""

	__tablename__ = "system_order"

	@classmethod
	def create_one(cls, session, **kwargs):
		if not "order_id" in kwargs:
			kwargs["order_id"] = cls._create_orderid(session)
		if not "create_date_timestamp" in kwargs:
			kwargs["create_date_timestamp"] = int(time.time())
		order = cls(**kwargs)
		session.add(order)
		session.commit()
		return order

	@classmethod
	def _create_orderid(cls, session):
		# 获取当天计数
		# TODO：需要确认事务性
		try:
			c = session.query(Counter).filter_by(type=COUNTER_TYPE.SYSTEM_ORDER_COUNTER).one()
			if c.init_date != datetime.date.today():
				c.init_date = datetime.date.today()
				c.count = 0
		except NoResultFound:
			c = Counter(type=COUNTER_TYPE.SYSTEM_ORDER_COUNTER, count=0, init_date=datetime.date.today())
			session.add(c)
		c.count += 1
		session.commit()
		count_str = str(c.count)
		# 补齐
		while len(count_str) < 5:
			count_str = "0" + count_str
		order_id_str = time.strftime("%Y%m%d", time.gmtime()) + count_str
		return int(order_id_str)

	def set_read(self, session):
		self.have_read = True
		session.commit()
	@classmethod
	def update_notify_data(cls, session, *,
					order_id, notify_data):
		"""更新订单notify_data[一般由阿里服务器通知]"""
		try:
			o = session.query(SystemOrder).filter_by(order_id=order_id).one()
		except NoResultFound:
			return None
		nd = notify_data
		o.update(session, ali_trade_no=nd["trade_no"],
				 have_more_data=True,
				 buyer_email=nd["buyer_email"],
				 buyer_id=nd["buyer_id"],
				 gmt_create=nd["gmt_create"],
				 gmt_payment=nd.get("gmt_payment", ""),
				 gmt_close=nd.get("gmt_close", ""),
				 quantity=nd["quantity"],
				 trade_status=nd["trade_status"],
				 notify_id = nd["notify_id"])
		return o
		

	# 订单id， 构成如"年月日订单当日编号", 2014110700001
	order_id = Column(BigInteger, nullable=False, unique=True, primary_key=True)
	order_status = Column(Integer, nullable=False, default=SYS_ORDER_STATUS.TEMP)
	# 下单人
	admin_id = Column(Integer, ForeignKey("shop_admin.id"), nullable=False)
	admin  = relationship("ShopAdmin")
	# 订单时间
	create_date_timestamp = Column(Integer, nullable=False)
	# charge数据
	charge_id = Column(Integer, nullable=False)
	charge_good_name = Column(String(32), nullable=False)
	charge_month = Column(Integer, nullable=False)
	charge_price = Column(Float, nullable=False)
	charge_description = Column(String(32), nullable=False)

	have_read = Column(Boolean, default=False)

	# 支付宝相关数据
	ali_trade_no = Column(String(33))
	have_more_data = Column(Boolean, nullable=False, default=False)

	# 异步数据
	buyer_email = Column(String(101))
	buyer_id = Column(String(17))
	# 交易创建时间
	gmt_create = Column(String(32))
	# 交易付款时间
	gmt_payment = Column(String(32))
	# 交易关闭时间
	gmt_close = Column(String(32))

	quantity = Column(String(8))
	# 交易状态
	trade_status = Column(String(32))

	notify_id = Column(String(64))    

# 顾客的购买地址
class Address(MapBase,  _CommonApi):
	__tablename__ = "address"

	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	customer_id = Column(Integer, ForeignKey(Customer.id))
	phone = Column(String(30), nullable=False)
	receiver = Column(String(64), nullable=False)
	address_text = Column(String(1024), nullable=False)


#信息墙＝＝＝＝
class Info(MapBase, _CommonApi):
	__tablename__ = "info"
	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	#信息的作者id
	admin_id = Column(Integer, ForeignKey(ShopAdmin.id), nullable=False)

	text = Column(String(568))
	address = Column(String(100))
	#板块类型：供应1、求购2、其他3
	type = Column(Integer, default=INFO_TYPE.SUPPLY)
	#collect_sum = Column(Integer)
	create_date = Column(DateTime, default=func.now())

	fruit_img = relationship("FruitImg")
	comment = relationship("Comment")
	fruit_type = relationship("FruitType", secondary="info_fruit_link")
	#信息的作者
	admin = relationship(ShopAdmin, uselist=False)
	#信息的收藏者
	collected_admins = relationship(ShopAdmin, secondary="info_collect", uselist=True)

#admin、info关系表
class InfoCollect(MapBase, _CommonApi):
	__tablename__= "info_collect"
	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	admin_id = Column(Integer, ForeignKey(ShopAdmin.id), nullable=False)
	info_id = Column(Integer, ForeignKey(Info.id), nullable=False)

# 信息墙的水果图片
class FruitImg(MapBase, _CommonApi):
	__tablename__ = "fruit_img"
	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	info_id = Column(Integer, ForeignKey(Info.id), nullable=False)
	img_url = Column(String(1024))

#信息墙的评论
class Comment(MapBase, _CommonApi):
	__tablename__ = "comment"
	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	info_id = Column(Integer, ForeignKey(Info.id), nullable=False)
	#该评论的作者的id
	admin_id = Column(Integer, ForeignKey(ShopAdmin.id), nullable=False)
	text = Column(String(100))
	admin = relationship(ShopAdmin, uselist=False)


class InfofruitLink(MapBase):
	"""信息墙的信息的水果种类"""
	__tablename__ = "info_fruit_link"
	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)

	info_id = Column(Integer, ForeignKey(Info.id), nullable=False)
	fruit_id = Column(Integer, ForeignKey("fruit_type.id"), nullable=False)
#＝＝＝＝信息墙

# 系统自定义水果类型
class FruitType(MapBase,  _CommonApi):
	__tablename__ = "fruit_type"
	
	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	code = Column(String(128), default="", unique=True)
	
	name = Column(String(64))

class ShopOnsalefruitLink(MapBase):
	"""
	店铺的在售水果
	"""
	__tablename__ = "shop_onsalefruit_link"
	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)

	shop_id = Column(Integer, ForeignKey(Shop.id), nullable=False)
	fruit_id = Column(Integer,ForeignKey(FruitType.id), nullable=False)

class ShopDemandfruitLink(MapBase):
	"""
	店铺的求购水果
	"""
	__tablename__ = "shop_demandfruit_link"
	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)

	shop_id = Column(Integer, ForeignKey(Shop.id), nullable=False)
	fruit_id = Column(Integer, ForeignKey(FruitType.id), nullable=False)

# 店铺收藏
class ShopsCollect(MapBase, _CommonApi):
	__tablename__ = "shops_collect"

	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	admin_id = Column(Integer, ForeignKey(ShopAdmin.id), nullable=False)
	shop_id = Column(Integer, ForeignKey(Shop.id), nullable=False)

# 反馈
class Feedback(MapBase, _CommonApi):
	__tablename__ = "feedback"
	
	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	create_date_timestamp = Column(Integer, nullable=False)
	admin_id = Column(Integer, ForeignKey(ShopAdmin.id), nullable=False)
	text = Column(String(500))
	processed = Column(Boolean, default=False)

class SysChargeType(MapBase, _CommonApi):
	__tablename__ = "sys_charge_type"

	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	# 商品名，如“森果商城系统1.0（三个月套餐）”
	good_name = Column(String(32), nullable=False)
	# 使用月数
	month = Column(Integer, nullable=False)
	# 套餐价格
	price = Column(Float, nullable=False)
	# 详细描述，如588/三个月
	description = Column(String(32), nullable=False)

class AlembicTest(MapBase):
	__tablename__ = "__alembictest__"

	id = Column(Integer, primary_key=True, nullable=True)
	text = Column(Integer)

class _VerifyCode(MapBase):
	__tablename__ = "__verify_code__"

	id = Column(Integer, primary_key=True, autoincrement=True)
	wx_id = Column(String(100), unique=True)
	code = Column(Integer)
	phone = Column(String(32))
	create_time = Column(DateTime, default=func.now())
	count = Column(Integer)              # modify to define whether  code is usefull , if count = 1, code is usefull ,if count =0 or others ,code is useless

class FruitFavour(MapBase):
	__tablename__ = "__fruit_favour__"

	customer_id = Column(Integer, primary_key=True, nullable=False)
	f_m_id = Column(Integer, primary_key=True, nullable=False)  #fruit/mgoods id
	type = Column(TINYINT, primary_key=True, nullable=False)  # 0：fruit，1：mgoods
	create_date = Column(Date, default=func.curdate())

class ShopSignIn(MapBase):
	__tablename__ = "__shop_sign_in__"  # 店铺签到表

	customer_id = Column(Integer, primary_key=True, nullable=False)
	shop_id = Column(Integer, primary_key=True, nullable=False)
	keep_days = Column(Integer, default=1)  # 已连续签到天数
	last_date = Column(Date, default=func.curdate())  # 最后一次签到的日期

#todo :如果水果
class Order(MapBase, _CommonApi):
	__tablename__ = "order"
	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	customer_id = Column(Integer, ForeignKey(Customer.id), nullable=False)
	shop_id = Column(Integer, ForeignKey(Shop.id), nullable=False)
	num = Column(String(15), nullable=False)  # 订单编号
	phone = Column(String(30), nullable=False)
	receiver = Column(String(64), nullable=False)
	address_text = Column(String(1024), nullable=False)
	message = Column(String(100)) #用户留言
	status = Column(TINYINT, default=ORDER_STATUS.ORDERED)  # 订单状态:DELETED = 0,ORDERED = 1, JH = 2,SH1 = 3
														   # #SH2 = 4,Received=5，FINISH = 6, AFTER_SALE = 10
	type = Column(TINYINT) #订单类型 1:立即送 2：按时达
	intime_period = Column(Integer,default = 0) #when type is 1,it's usefull
	freight = Column(SMALLINT, default=0)  # 订单运费
	tip = Column(SMALLINT, default=0)  # 小费（暂时只有立即送可提供运费）
	remark = Column(String(100)) #商家备注
	totalPrice = Column(Float)
	money_paid = Column(Boolean, default=False)
	pay_type = Column(TINYINT, default=1)#付款方式：1：货到付款，2：余额
	today = Column(TINYINT, default=1) #送货时间1:今天 2：明天
	JH_id = Column(Integer, nullable=True) #捡货员id,(当员工被删除时可能会有问题)
	SH1_id = Column(Integer, nullable=True) #一级送货员id
	SH2_id = Column(Integer, nullable=True) #二级送货员id
	staff_remark = Column(String(100)) #员工备注（订单可能出状况了）
	comment = Column(String(300))  # 评论
	comment_create_date = Column(DateTime)
	comment_reply = Column(String(300))  # 商家回复评论
	start_time = Column(Time)
	end_time = Column(Time)
	arrival_day  = Column(String(32))
	arrival_time = Column(String(16))
	create_date = Column(DateTime, default=func.now())
	active = Column(TINYINT, default=1)  # 0删除
	isprint = Column(Boolean, default=0)  # 是否被打印了 0：否，1：是

	fruits = Column(String(1000))
	mgoods = Column(String(1000))
	shop = relationship("Shop", uselist=False,join_depth=1)
	send_time=Column(String(45))
	del_reason = Column(String(300))


	def get_num(self,session,order_id):
		try:
			order = session.query(Order).filter_by(id = order_id).first()
		except NoResultFound:
			return None
		if order:
			fruits = eval(order.fruits)
			mgoods = eval(order.mgoods)
			# print(fruits)
			# print(type(fruits))
		if fruits:
			charge_types = session.query(ChargeType).filter(ChargeType.id.in_\
				(fruits.keys())).all()

			for charge_type in charge_types:
				# print(charge_type.id)
				# print(charge_type.unit_num)
				# print(charge_type.num)
				if fruits[int(charge_type.id)]==0:
					continue
				# print(fruits[int(charge_type.id)]['num'])
				num = fruits[int(charge_type.id)]['num'] * charge_type.unit_num * charge_type.num
				charge_type.fruit.storage+= num
				charge_type.fruit.current_saled -=num
				charge_type.fruit.saled -= num
				print("[订单管理]取消订单，恢复库存数量(水果)：",num)
		if mgoods:
			#print("print mark 6:",mgoods,'**********************************')
			charge_types = session.query(MChargeType).filter(MChargeType.id.in_(mgoods.keys())).all()
			for charge_type in charge_types:
				# print("before",charge_type.mgoods.storage,charge_type.mgoods.current_saled)
				if mgoods[int(charge_type.id)]==0:
					continue 
				num =mgoods[int(charge_type.id)]['num'] *charge_type.unit_num * charge_type.num
				charge_type.mgoods.storage += num
				charge_type.mgoods.current_saled -= num
				charge_type.mgoods.saled -= num
				print("[订单管理]取消订单，恢复库存数量(其他)：",num)
		session.commit()
		return True

	

	def get_sendtime(self,session,order_id):
		try:
			order = session.query(Order).filter_by(id=order_id).one()
		except NoResultFound:
			return None
		delta = datetime.timedelta(1)
		if order.start_time.minute <10:
			w_start_time_minute ='0' + str(order.start_time.minute)
		else:
			w_start_time_minute = str(order.start_time.minute)
		if order.end_time.minute < 10:
			w_end_time_minute = '0' + str(order.end_time.minute)
		else:
			w_end_time_minute = str(order.end_time.minute)

		if order.type == 2 and order.today==2:
			w_date = order.create_date + delta
		else:
			w_date = order.create_date
		send_time = "%s %d:%s ~ %d:%s" % ((w_date).strftime('%Y-%m-%d'),\
			order.start_time.hour, w_start_time_minute,order.end_time.hour, w_end_time_minute)
		return send_time


class CommentApply(MapBase, _CommonApi):
	__tablename__ = 'commentapply'
	id = Column(Integer , primary_key = True , nullable = False ,autoincrement = True)
	delete_reason = Column(String(200))
	order_id = Column(Integer , ForeignKey(Order.id) , nullable = False)
	shop_id  = Column(Integer , ForeignKey(Shop.id) ,nullable = False)
	create_date = Column(Date, default=func.curdate())
	has_done  = Column(Integer , default = 0) # 0 :applied , 1: applied ,success  2:applied but decline
	order   = relationship("Order")
	shop    = relationship("Shop")
	decline_reason = Column(String(200)) # when

#水果单品
class Fruit(MapBase, _CommonApi):
	__tablename__ = "fruit"
	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	shop_id = Column(Integer, ForeignKey(Shop.id), nullable=False)
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
	charge_types = relationship("ChargeType") #支持多种计价方式
	fruit_type = relationship("FruitType", uselist=False)
	shop = relationship("Shop", uselist=False)

# 用户自定义的商品类型
class Menu(MapBase, _CommonApi):
	__tablename__ = "menu"
	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	shop_id = Column(Integer, ForeignKey(Shop.id), nullable=False)

	name = Column(String(20))
	active = Column(TINYINT, default=1)#0删除
	mgoods = relationship("MGoods", order_by="desc(MGoods.priority)")
	shop = relationship("Shop", uselist=False)


#用户自定义的商品
class MGoods(MapBase, _CommonApi):
	__tablename__ = "m_goods"
	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	menu_id = Column(Integer, ForeignKey(Menu.id), nullable=False)

	name = Column(String(20))
	active = Column(TINYINT, default=1)#0删除，１:上架，２:下架
	current_saled = Column(Integer, default=0) #售出：未处理的订单数
	saled = Column(Integer) #销量
	storage = Column(Float)
	favour = Column(Integer, default=0)  # 赞
	unit = Column(TINYINT)#库存单位,1:个 2：斤 3：份
	tag = Column(TINYINT, default=TAG.NULL) #新品
	img_url = Column(String(500))
	intro = Column(String(100))
	priority = Column(SMALLINT, default=1)
	mcharge_types = relationship("MChargeType") #支持多种计价方式
	menu = relationship("Menu", uselist=False)

#水果单品的计价类型
class ChargeType(MapBase, _CommonApi):
	__tablename__ = "charge_type"
	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	fruit_id = Column(Integer, ForeignKey(Fruit.id), nullable=False)
	price = Column(Float)#单价
	unit = Column(TINYINT)#库存单位,1:个 2：斤 3：份
	num = Column(Float)#计价数量
	unit_num = Column(Float, default=1)#单位换算
	active = Column(TINYINT, default=1)#0删除，１:上架，２:下架

	fruit = relationship("Fruit", uselist=False)

#用户自定义商品的计价类型
class MChargeType(MapBase, _CommonApi):
	__tablename__ = "m_charge_type"
	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	mgoods_id = Column(Integer, ForeignKey(MGoods.id), nullable=False)
	price = Column(Float)#单价
	unit = Column(TINYINT)#库存单位,1:个 2：斤 3：份
	num = Column(Float)#计价数量
	unit_num = Column(Float, default=1)#单位换算
	active = Column(TINYINT, default=1)#0删除，１:上架，２:下架

	mgoods = relationship("MGoods", uselist=False)

# 购物车 格式为 {charge_type_id:num}
class Cart(MapBase, _CommonApi):
	__tablename__ = "cart"
	id = Column(Integer, ForeignKey(Customer.id), primary_key=True, nullable=False)
	shop_id = Column(Integer, ForeignKey(Shop.id), primary_key=True, nullable=False)
	fruits = Column(String(1000), default='{}')
	mgoods = Column(String(1000), default='{}')

# 店铺设置
class Config(MapBase, _CommonApi):
	__tablename__ = "config"

	id = Column(Integer, ForeignKey(Shop.id), primary_key=True, nullable=False)
	receipt_msg = Column(String(100)) #小票附加信息设置
	receipt_img = Column(String(1000))  # 小票图片url
	min_charge_on_time = Column(SMALLINT, default=3) #按时达起送金额
	freight_on_time = Column(SMALLINT, default=0)  # 按时达运费
	min_charge_now = Column(SMALLINT, default=25) #立即送起送金额
	freight_now = Column(SMALLINT, default=2)  # 立即送运费
	stop_range = Column(SMALLINT, default=0) #下单截止时间（分钟）
	start_time_now = Column(Time,default="9:00") #立即送起始时间
	end_time_now = Column(Time,default="23:00") #立即送结束时间
	ontime_on = Column(Boolean, default=True)
	now_on = Column(Boolean, default=True)
	hire_on = Column(Boolean, default=True)
	hire_text = Column(String(1000))

	addresses = relationship("Address1") #配送地址设置
	notices = relationship("Notice") #公告设置
	periods = relationship("Period") #时间段设置

	intime_period = Column(Integer,default = 0) 
	#4.24 add receipt_img_active
	receipt_img_active = Column(Integer,default = 1)
	cash_on_active =Column(Integer,default = 1)#0:货到付款关闭 1:货到付款付开启 5.4
	online_on_active =Column(Integer,default = 1) #0:在线支付关闭 1:在线支付开启 5.4
	balance_on_active =Column(Integer,default = 1) #0:余额支付关闭 1:余额支付开启 5.4

#商城首页的公告
class Notice(MapBase):
	__tablename__ = "notice"

	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	config_id = Column(Integer, ForeignKey(Config.id), nullable=False)
	active = Column(TINYINT, default=1)  # 1：开启 2：关闭
	summary = Column(String(100)) #摘要
	detail = Column(String(500)) #详情

#按时达时间段设置
class Period(MapBase):
	__tablename__ = "period"

	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	config_id = Column(Integer, ForeignKey(Config.id), nullable=False)
	active = Column(TINYINT, default=1)  #1:开启 2：关闭
	name = Column(String(20))
	start_time = Column(Time)
	end_time = Column(Time)

#一级地址:
class Address1(MapBase, _CommonApi):
	__tablename__ = "address1"

	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	config_id = Column(Integer, ForeignKey(Config.id), nullable=False)
	name = Column(String(50))
	active = Column(TINYINT, default=1)#0删除，１:上架，２:下架
	address2 = relationship("Address2")

#二级地址
class Address2(MapBase, _CommonApi):
	__tablename__ = "address2"

	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	address1_id = Column(Integer, ForeignKey(Address1.id), nullable=False)
	name = Column(String(50))
	active = Column(TINYINT, default=1)#0删除，１:上架，２:下架

# 员工申请表
class HireForm(MapBase):
	__tablename__ = "hire_form"

	staff_id = Column(Integer, ForeignKey(ShopStaff.id), primary_key=True, nullable=False)
	shop_id = Column(Integer, ForeignKey(Shop.id), primary_key=True, nullable=False)
	work = Column(TINYINT, default=3)#默认为SH2
	intro = Column(String(500))
	advantage = Column(String(500))
	status = Column(TINYINT, default=1)#1：申请中，2：通过，3：未通过

	staff = relationship("ShopStaff", uselist=False, join_depth=2)

# 系统公告
class SysNotice(MapBase):
	__tablename__ = "sys_notice"

	id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
	title = Column(String(100), nullable=False)
	detail = Column(String(1000), nullable=False)
	create_time = Column(DateTime, default=func.now())

# 店铺收藏评论关系表
class ShopFavorComment(MapBase):
	__tablename__ = "shop_favor_comment"

	shop_id = Column(Integer, ForeignKey(Shop.id), primary_key=True, nullable=False)
	order_id = Column(Integer, ForeignKey(Order.id), primary_key=True, nullable=False)

def init_db_data():
	MapBase.metadata.create_all()
	# add fruittypes to database
	s = DBSession()
	from dal.db_initdata import fruit_types as fruits
	if s.query(FruitType).count() >= len(fruits):
		print("fruit types exists in db, jump init.")
	else:
		for fruit in fruits:
			if not s.query(FruitType).get(fruit["id"]):
				s.add(FruitType(id=fruit["id"], name=fruit["name"], code=fruit["code"]))
		s.commit()
		print("init fruittypes success")
	# add chargetypes to database    
	if not s.query(SysChargeType).count():
		from dal.db_initdata import charge_types
		for c in charge_types:
			s.add(SysChargeType(**c))
		s.commit()
		print("init chargetypes success")
	else:
		print("charge types exists in db, jump init.")
	s.close()
	print("init db success")
	return True


