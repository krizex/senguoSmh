from sqlalchemy import create_engine, func, ForeignKey, Column
from sqlalchemy.types import String, Integer, Text, Boolean, Float
from sqlalchemy.orm import relationship, backref

from dal.db_configs import MapBase, DBSession
from dal.dis_dict import dis_dict
import json
import time

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


## TODO: 账户支付及账户升级功能

class _SafeOutputTransfer:
    """
    当需要向前端发送数据时，有些数据是不能被发送的，比如密码等敏感数据，
    所以需要进行数据保护
    另外，支持一级relationship对象
    
    这里定义了一个接口：
    @ func: props()，可以用来向外界发送经过处理的数据
    """

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
        if with_relationship:
            for rel_prop_name in self.__relationship_props__:
                if not rel_prop_name in self.__protected_props__:
                    rel_prop_data = getattr(self, rel_prop_name)

                    try:
                        out_prop_data = []
                        for prop_data in  rel_prop_data:
                            out_prop_data.append(prop_data.safe_props(False))
                    except:
                        out_prop_data = rel_prop_data.safe_props(False)
                    output_data[rel_prop_name] = out_prop_data

        return output_data

    def all_props(self, with_relationship=False):
        output_data = {}
        for key in self.__dict__:
            if type(key) == str and \
               not key.startswith("_"):
                output_data[key] = self.__dict__[key]
        if with_relationship:
            for rel_prop_name in self.__relationship_props__:
                rel_prop_data = getattr(self, rel_prop_name)
                try:
                    out_prop_data = []
                    for prop_data in  rel_prop_data:
                        out_prop_data.append(prop_data.all_props(False))
                except:
                    out_prop_data = rel_prop_data.all_props(False)
                output_data[rel_prop_name] = out_prop_data
        return output_data

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

    
    @classmethod
    def get_by_unionid(cls, session, wx_unionid):
        s = session
        try:u = s.query(cls).filter_by(wx_unionid=wx_unionid).one()
        except:u = None
        return u
    @classmethod
    def get_or_create_with_unionid(cls, session, wx_unionid, userinfo={}):
        u = cls.get_by_unionid(session, wx_unionid)
        if u: return u
        u = cls(wx_unionid=userinfo["unionid"],
                wx_openid=userinfo["openid"],
                wx_sex=userinfo["sex"],
                wx_nickname=userinfo["nickname"],
                wx_country=userinfo["country"],
                wx_province=userinfo["province"],
                wx_city=userinfo["city"],
                wx_headimgurl=userinfo["headimgurl"],
                headimgurl=userinfo["headimgurl"],
                nickname=userinfo["nickname"],
                sex = userinfo["sex"],
                create_date_timestamp=int(time.time()))
        s = session
        s.add(u)
        s.commit()
        return u
    
    @classmethod
    def get_by_phone(cls, session, phone):
        s = session
        try:u = s.query(cls).filter_by(phone=phone).one()
        except:u = None
        return u


class SuperAdmin(MapBase, _AccountApi, _SafeOutputTransfer):
    __tablename__ = "super_admin"
    
    __protected_props__ = ["password"]
    id = Column(Integer, primary_key=True, nullable=False)
    username = Column(String(64),unique=True, nullable=False)
    password = Column(String(2048), nullable=False)
    email = Column(String(2048), nullable=False)

    def __repr__(self):
        return "<SiteAdmin: ({id}, {username})>".\
            format(id=self.id,username=self.username)

class Shop(MapBase, _SafeOutputTransfer,_CommonApi):
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
    admin  = relationship("ShopAdmin", uselist=False)

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
    live_month = Column(Integer)
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

class ShopAdmin(MapBase, _AccountApi, _SafeOutputTransfer):
    
    def __init__(self, **kwargs):
        if not "create_date_timestamp" in kwargs:
            kwargs["create_date_timestamp"] = time.time()
        super().__init__(**kwargs)


    __tablename__ = "shop_admin"
    
    __protected_props__ = ["password"]
    
    id = Column(Integer, primary_key=True, nullable=False)
    phone = Column(String(64), unique=True)
    email = Column(String(128), unique=True)
    password = Column(String(2048))
    
    # 角色类型，SHOPADMIN_ROLE_TYPE: [SHOP_OWNER, SYSTEM_USER]
    role = Column(Integer, nullable=False, default=SHOPADMIN_ROLE_TYPE.SHOP_OWNER)
    # 权限类型，SHOPADMIN_PRIVILEGE: [ALL, ]
    privileges = Column(Integer, default=SHOPADMIN_PRIVILEGE.NONE)
    # 付费类型，SHOPADMIN_CHARGE_TYPE: 
    # [ThreeMonth_588, SixMonth_988, TwelveMonth_1788]
    charge_type = Column(Integer)
    # 过期时间
    expire_time = Column(Integer, default=0)
    # 性别，男1, 女2, 其他0
    sex = Column(Integer)
    # 昵称
    nickname = Column(String(128), default="")
    # 姓名
    realname = Column(String(128))
    # 头像url
    headimgurl = Column(String(1024))
    birthday = Column(Integer)# timestamp
    qr_code_url = Column(String(2048))
    create_date_timestamp = Column(Integer, nullable=False)
    briefintro = Column(String(300), default="")

    shops = relationship(Shop, uselist=True)
    username = Column(String(128)) # not used now
    feedback = relationship("Feedback")

    wx_openid = Column(String(1024)) 
    wx_unionid = Column(String(1024))
    wx_nickname = Column(String(128))
    wx_username = Column(String(128))
    wx_sex = Column(String(20))
    wx_country = Column(String(128))
    wx_province = Column(String(128))
    wx_city = Column(String(128))
    wx_headimgurl = Column(String(2048))

    def add_shop(self, session, **kwargs):
        kwargs["admin_id"] = self.id
        if "shops" in kwargs:
            del kwargs["shops"]

        sp = Shop(**kwargs)

        s = session
        s.add(self)
        self.shops.append(sp)
        s.commit()

    def __repr__(self):
        return "<ShopAdmin: {0}({1})>".format(self.username, self.id)


class ShopStaff(MapBase, _AccountApi, _SafeOutputTransfer):
    __tablename__ = "shop_staff"

    __protected_props__ = ["password"]

    def __init__(self, **kwargs):
        if not "create_date_timestamp" in kwargs:
            kwargs["create_date_timestamp"] = time.time()
        super().__init__(**kwargs)

    id = Column(Integer, primary_key=True, nullable=False)
    phone = Column(String(30))
    password = Column(String(2048))
    create_date_timestamp = Column(Integer, nullable=False)
    
    email = Column(String(2048))
    nickname = Column(String(128), default="")

    username = Column(String(64),unique=True) # not used now
    # 头像url
    headimgurl = Column(String(1024))
    # 性别，男1, 女2, 其他0
    sex = Column(Integer)

    wx_openid = Column(String(1024)) 
    wx_unionid = Column(String(1024))
    wx_nickname = Column(String(128))
    wx_sex = Column(String(20))
    wx_country = Column(String(128))
    wx_province = Column(String(128))
    wx_city = Column(String(128))
    wx_headimgurl = Column(String(2048))    



class Customer(MapBase, _AccountApi, _SafeOutputTransfer):
    __tablename__ = "customer"

    __protected_props__ = ["password"]

    def __init__(self, **kwargs):
        if not "create_date_timestamp" in kwargs:
            kwargs["create_date_timestamp"] = time.time()
        super().__init__(**kwargs)

    id = Column(Integer, primary_key=True, nullable=False)
    phone = Column(String(30))
    password = Column(String(2048), nullable=False)
    create_date_timestamp = Column(Integer, nullable=False)

    nickname = Column(String(64), unique=True, nullable=False)
    email = Column(String(2048))
    balance = Column(Float, default=0)
    credits = Column(Float, default=0)
    addresses = relationship("Address", backref="customer")

    username = Column(String(64)) # not used
    # 头像url
    headimgurl = Column(String(1024))
    # 性别，男1, 女2, 其他0
    sex = Column(Integer)

    wx_openid = Column(String(1024)) 
    wx_unionid = Column(String(1024))
    wx_nickname = Column(String(128))
    wx_sex = Column(String(20))
    wx_country = Column(String(128))
    wx_province = Column(String(128))
    wx_city = Column(String(128))
    wx_headimgurl = Column(String(2048))


class Address(MapBase,  _SafeOutputTransfer):
    __tablename__ = "address"

    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    phone = Column(String(30), nullable=False)
    receiver = Column(String(64), nullable=False)
    address_text = Column(String(1024), nullable=False)
    owner_id = Column(Integer, ForeignKey(Customer.id))

class FruitType(MapBase,  _SafeOutputTransfer):
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

class Feedback(MapBase, _CommonApi, _SafeOutputTransfer):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    create_date_timestamp = Column(Integer, nullable=False)
    admin_id = Column(Integer, ForeignKey(ShopAdmin.id), nullable=False)
    text = Column(String(500))
    processed = Column(Boolean, default=False)

def init_db_data():
    MapBase.metadata.create_all()
    # add fruittypes to database
    s = DBSession()
    if s.query(FruitType).count():
        s.close()
        return True
    from dal.db_fruits import fruit_types as fruits
    for fruit in fruits:
        s.add(FruitType(name=fruit["name"], code=fruit["code"]))
    s.commit()
    s.close()
    return True


