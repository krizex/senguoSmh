from sqlalchemy import create_engine, func, ForeignKey, Column
from sqlalchemy.types import String, Integer, Text, Boolean, Float, Date, BigInteger, DateTime
from sqlalchemy.orm import relationship, backref
from sqlalchemy.orm.exc import NoResultFound

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
        if u: return u
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
        account_info = Accountinfo(
            wx_unionid=wx_userinfo["unionid"],
            wx_openid=wx_userinfo["openid"],
            wx_country=wx_userinfo["country"],
            wx_province=wx_userinfo["province"],
            wx_city=wx_userinfo["city"],
            headimgurl=wx_userinfo["headimgurl"],
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

class Accountinfo(MapBase, _CommonApi):
    __tablename__ = "account_info"
    
    __protected_props__ = ["password", "phone", "email", "wx_unionid", "sex", 
                           "realname", "headimgurl", "birthday", "wx_openid", "wx_country", "wx_province", "wx_city"]

    def __init__(self, **kwargs):
        if not "create_date_timestamp" in kwargs:
            kwargs["create_date_timestamp"] = time.time()
        super().__init__(**kwargs)
    
    id = Column(Integer, primary_key=True, nullable=False)
    create_date_timestamp = Column(Integer, nullable=False)    

    # 账户访问信息 (phone/email, password)/(wx_unionid)用来登录
    phone = Column(String(32), unique=True, default=None)
    email = Column(String(64), unique=True, default=None)
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
    # 生日
    birthday = Column(Integer)# timestamp
    # 微信数据
    wx_openid = Column(String(64)) 
    wx_username = Column(String(64))
    wx_country = Column(String(32))
    wx_province = Column(String(32))
    wx_city = Column(String(32))


class SuperAdmin(MapBase, _AccountApi):
    __tablename__ = "super_admin"
    __relationship_props__ = ["accountinfo"]

    id = Column(Integer, ForeignKey(Accountinfo.id), primary_key=True, nullable=False)
    accountinfo = relationship(Accountinfo)

    def __repr__(self):
        return "<SuperAdmin ({nickname}, {id})>".\
            format(id=self.id, nickname=self.accountinfo.nickname)

class Shop(MapBase, _CommonApi):
    __relationship_props__ = ["admin", "demand_fruits", "onsale_fruits"]
    
    
    def __init__(self, **kwargs):
        if "shop_province" in kwargs or "shop_city" in kwargs:
            if not self._check_city_code(
                    kwargs["shop_province"], kwargs["shop_city"]):
                raise DistrictCodeError
        # 如果没有二级city，将city设为province
        if not "shop_city" in kwargs:
            kwargs["shop_city"] = "shop_province"

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

    __tablename__ = "shop"
    
    id = Column(Integer, primary_key=True, nullable=False)
    shop_name = Column(String(128), nullable=False)
    shop_code = Column(String(128), nullable=False, default="not set")
    create_date_timestamp = Column(Integer, nullable=False)
    shop_status = Column(Integer, default=SHOP_STATUS.APPLYING)
    declined_reason = Column(String(256), default="")

    admin_id = Column(Integer, ForeignKey("shop_admin.id"), nullable=False)
    admin  = relationship("ShopAdmin")

    # 店铺标志
    shop_trademark_url = Column(String(2048))
    
    # 服务区域，SHOP_SERVICE_AREA
    shop_service_area = Column(Integer, default=SHOP_SERVICE_AREA.OTHERS)

    # 地址
    shop_province = Column(Integer)
    shop_city = Column(Integer)
    shop_address_detail = Column(String(1024), nullable=False)
    shop_sales_range = Column(String(128))
    
    # 是否做实体店
    have_offline_entity = Column(Boolean, default=False)

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

    have_wx_mp = Column(Boolean)
    wxapi_token = Column(String(128))
    wx_accountname = Column(String(128))
    wx_nickname = Column(String(128))
    wx_qr_code = Column(String(1024))


    def __repr__(self):
        return "<Shop: {0} (id={1}, code={2})>".format(
            self.shop_name, self.id, self.shop_code)

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
    info_collect = relationship("Info", secondary="info_collect", backref="shop_admin")
    comment = relationship("Comment", backref="shop_admin")

    def success_orders(self, session):
        if not hasattr(self, "_success_orders"):
            self._success_orders = session.query(SystemOrder).\
                                   filter_by(admin_id=self.id, 
                                             order_status=ORDER_STATUS.SUCCESS
                                   ).all()
        return self._success_orders

    def add_shop(self, session, **kwargs):
        kwargs["admin_id"] = self.id
        if "shops" in kwargs:
            del kwargs["shops"]

        sp = Shop(**kwargs)

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

        o.update(session, order_status=ORDER_STATUS.SUCCESS, ali_trade_no=ali_trade_no)
        self.update(session, role=SHOPADMIN_ROLE_TYPE.SYSTEM_USER)
        return o
    

    def update_order_notify_data(self, session, *,
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
        return admin

    def __repr__(self):
        return "<ShopAdmin (nickname, id)>".format(self.accountinfo.nickname, 
                                                   self.id)


class ShopStaff(MapBase, _AccountApi):
    __tablename__ = "shop_staff"
    __relationship_props__ = ["accountinfo"]
    id = Column(Integer, ForeignKey(Accountinfo.id), primary_key=True, nullable=False)
    accountinfo = relationship(Accountinfo)


class Customer(MapBase, _AccountApi):
    __tablename__ = "customer"
    __relationship_props__ = ["accountinfo"]
    id = Column(Integer, ForeignKey(Accountinfo.id), primary_key=True, nullable=False)
    accountinfo = relationship(Accountinfo)

    balance = Column(Float, default=0)
    credits = Column(Float, default=0)
    addresses = relationship("Address", backref="customer")

class COUNTER_TYPE:
    SYSTEM_ORDER_COUNTER = 1

class Counter(MapBase):
    __tablename__ = "counter"
    type = Column(Integer, nullable=False, primary_key=True, unique=True)
    count = Column(Integer, nullable=False)
    # 初始化数据的时间戳
    init_date = Column(Date, nullable=False)

class ORDER_STATUS:
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
        

    # 订单id， 构成如"年月日订单当日编号", 2014110700001
    order_id = Column(BigInteger, nullable=False, unique=True, primary_key=True)
    order_status = Column(Integer, nullable=False, default=ORDER_STATUS.TEMP)
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

class Address(MapBase,  _CommonApi):
    __tablename__ = "address"

    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    phone = Column(String(30), nullable=False)
    receiver = Column(String(64), nullable=False)
    address_text = Column(String(1024), nullable=False)
    owner_id = Column(Integer, ForeignKey(Customer.id))

#信息墙＝＝＝＝
class Info(MapBase, _CommonApi):
    __tablename__ = "info"
    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    #信息的作者id
    admin_id = Column(Integer, ForeignKey(ShopAdmin.id), nullable=False)

    text = Column(String(568))
    #板块类型：供应1、求购2、其他3
    type = Column(Integer, default=INFO_TYPE.SUPPLY)
    #collect_sum = Column(Integer)
    create_date_timestamp = Column(DateTime, default=func.now())

    fruit_img = relationship("FruitImg")
    comment = relationship("Comment")
    fruit_type = relationship("FruitType", secondary="info_fruit_link")

#admin、info关系表
class InfoCollect(MapBase, _CommonApi):
    __tablename__= "info_collect"
    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    admin_id = Column(Integer, ForeignKey(ShopAdmin.id), nullable=False)
    info_id = Column(Integer, ForeignKey(Info.id), nullable=False)

class FruitImg(MapBase, _CommonApi):
    __tablename__ = "fruit_img"
    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    info_id = Column(Integer, ForeignKey(Info.id), nullable=False)
    img_url = Column(String(1024))

class Comment(MapBase, _CommonApi):
    __tablename__ = "comment"
    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    info_id = Column(Integer, ForeignKey(Info.id), nullable=False)
    #该评论的作者的id
    admin_id = Column(Integer, ForeignKey(ShopAdmin.id), nullable=False)
    text = Column(String(100))

class InfofruitLink(MapBase):
    """信息墙的信息的水果种类"""
    __tablename__ = "info_fruit_link"
    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)

    info_id = Column(Integer, ForeignKey(Info.id), nullable=False)
    fruit_id = Column(Integer, ForeignKey("fruit_type.id"), nullable=False)
#＝＝＝＝信息墙

class FruitType(MapBase,  _CommonApi):
    __tablename__ = "fruit_type"
    
    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    code = Column(String(128), default="", unique=True)
    
    name = Column(String(64), unique=True)

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

class ShopsCollect(MapBase, _CommonApi):
    __tablename__ = "shops_collect"

    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    admin_id = Column(Integer, ForeignKey(ShopAdmin.id), nullable=False)
    shop_id = Column(Integer, ForeignKey(Shop.id), nullable=False)

class Feedback(MapBase, _CommonApi):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    create_date_timestamp = Column(Integer, nullable=False)
    admin_id = Column(Integer, ForeignKey(ShopAdmin.id), nullable=False)
    text = Column(String(500))
    processed = Column(Boolean, default=False)

class ChargeType(MapBase, _CommonApi):
    __tablename__ = "charge_type"

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
    create_time = Column(DateTime, default=func.now())
    count = Column(Integer)

def init_db_data():
    MapBase.metadata.create_all()
    # add fruittypes to database
    s = DBSession()
    if not s.query(FruitType).count():
        from dal.db_initdata import fruit_types as fruits
        for fruit in fruits:
            s.add(FruitType(name=fruit["name"], code=fruit["code"]))
        s.commit()
        print("init fruittypes success")
    else:
        print("fruit types exists in db, jump init.")
    # add chargetypes to database    
    if not s.query(ChargeType).count():
        from dal.db_initdata import charge_types
        for c in charge_types:
            s.add(ChargeType(**c))
        s.commit()
        print("init chargetypes success")
    else:
        print("charge types exists in db, jump init.")
    s.close()
    print("init db success")
    return True


