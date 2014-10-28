from sqlalchemy import create_engine, func, ForeignKey, Column
from sqlalchemy.types import String, Integer, DateTime, Text, Boolean, Float
from sqlalchemy.orm import relationship, backref, sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from settings import MYSQL_DRIVER, MYSQL_USERNAME, MYSQL_PASSWORD, DB_NAME

engine = create_engine("mysql+{driver}://{username}:{password}@127.0.0.1/{database}".format(
    driver=MYSQL_DRIVER,username=MYSQL_USERNAME,password=MYSQL_PASSWORD, database=DB_NAME))
MapBase = declarative_base(bind=engine)
DBSession = sessionmaker(bind=engine)

class _AccountApi:
    """
    a common account access api, should be inherit by every 
    account.
    """
    
    @classmethod
    def get_by_id(cls, id):
        s = DBSession()
        try:u = s.query(cls).filter_by(id=id).one()
        except:u = None
        s.close()
        return u
    
    @classmethod
    def get_by_unionid(cls, wx_unionid):
        s = DBSession()
        try:u = s.query(cls).filter_by(wx_unionid=wx_unionid).one()
        except:u = None
        s.close()
        return u
    @classmethod
    def get_or_create_with_unionid(cls, wx_unionid, userinfo={}):
        u = cls.get_by_unionid(wx_unionid)
        if u: return u
        u = cls(wx_unionid=userinfo["unionid"],
                wx_openid=userinfo["openid"],
                wx_sex=userinfo["sex"],
                wx_nickname=userinfo["nickname"],
                wx_country=userinfo["country"],
                wx_province=userinfo["province"],
                wx_city=userinfo["city"],
                wx_headimgurl=data["headimgurl"])
        s = DBSession()
        s.add(u)
        s.commit()
        s.close()
        return u
    
    @classmethod
    def get_by_phone(cls, phone):
        s = DBSession()
        try:u = s.query(cls).filter_by(phone=phone).one()
        except:u = None
        s.close()
        return u


class SuperAdmin(MapBase, _AccountApi):
    __tablename__ = "super_admin"
    
    id = Column(Integer, primary_key=True, nullable=False)
    username = Column(String(64),unique=True, nullable=False)
    password = Column(String(2048), nullable=False)
    email = Column(String(2048), nullable=False)

    def __repr__(self):
        return "<SiteAdmin: ({id}, {username})>".\
            format(id=self.id,username=self.username)

class Shop(MapBase):
    __tablename__ = "shop"
    
    id = Column(Integer, primary_key=True, nullable=False)
    shop_name = Column(String(128), nullable=False)
    shop_code = Column(String(128), nullable=False)
    create_date = Column(DateTime, nullable=False, default=func.now())
    shop_status = Column(String(16))

    admin_id = Column(Integer, ForeignKey("shop_admin.id"), nullable=False)

    # 店铺标志
    shop_trademark_url = Column(String(2048))
    
    # 服务区域，列表序列化存储, SHOP_SERVICE_AREA:[]
    shop_service_areas = relationship("ShopServiceAreaLink", uselist=True, 
                                     backref=backref("shop"))

    # 地址
    shop_province = Column(String(128))
    shop_city = Column(String(128))
    shop_address_detail = Column(String(1024), nullable=False)
    shop_sales_range = Column(String(128))
    
    # 是否做实体店
    have_offline_entity = Column(Boolean)

    # 店铺介绍
    shop_intro = Column(String(568))
    # 总用户数
    total_users = Column(Integer)
    # 日均销售（元）
    daily_sales = Column(Integer)
    # 单次采购（元）
    single_stock_size = Column(Integer)
    # 求购水果, 列表序列化存储，直接存名字，用;分开
    intent_fruits = Column(String(2048))
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

class ShopAdmin(MapBase, _AccountApi):
    __tablename__ = "shop_admin"
    
    id = Column(Integer, primary_key=True, nullable=False)
    phone = Column(String(64))
    email = Column(String(2048))
    password = Column(String(2048))
    
    # 角色类型，SHOPADMIN_ROLE_TYPE: [SHOP_OWNER, SYSTEM_USER]
    role = Column(Integer, nullable=False)
    # 权限类型，SHOPADMIN_PRIVILEGE: [ALL, ]
    privileges = relationship("ShopAdminPrivilegeLink", uselist=True)
    # 付费类型，SHOPADMIN_CHARGE_TYPE: 
    # [ThreeMonth_588, SixMonth_988, TwelveMonth_1788]
    charge_type = Column(Integer)
    # 性别，男male, 女female
    sex = Column(String(128))
    nickname = Column(String(128), default="")
    realname = Column(String(128))
    birthday = Column(DateTime)
    qr_code_url = Column(String(2048))
    create_date = Column(DateTime, nullable=False, default=func.now())

    shops = relationship(Shop, backref=backref('admin'))
    username = Column(String(128)) # not used now    

    wx_openid = Column(String(1024)) 
    wx_unionid = Column(String(1024))
    wx_nickname = Column(String(128))
    wx_username = Column(String(128))
    wx_sex = Column(String(20))
    wx_country = Column(String(128))
    wx_province = Column(String(128))
    wx_city = Column(String(128))
    wx_headimgurl = Column(String(2048))

    def __repr__(self):
        return "<ShopAdmin: {0}({1})>".format(self.username, self.id)


class ShopStaff(MapBase, _AccountApi):
    __tablename__ = "shop_staff"
    id = Column(Integer, primary_key=True, nullable=False)
    phone = Column(String(30))
    password = Column(String(2048))
    create_date = Column(DateTime, nullable=False, default=func.now())
    
    email = Column(String(2048))
    nickname = Column(String(128), default="")

    username = Column(String(64),unique=True) # not used now

    wx_openid = Column(String(1024)) 
    wx_unionid = Column(String(1024))
    wx_nickname = Column(String(128))
    wx_sex = Column(String(20))
    wx_country = Column(String(128))
    wx_province = Column(String(128))
    wx_city = Column(String(128))
    wx_headimgurl = Column(String(2048))    



class Customer(MapBase, _AccountApi):
    __tablename__ = "customer"
    
    id = Column(Integer, primary_key=True, nullable=False)
    phone = Column(String(30))
    password = Column(String(2048), nullable=False)
    create_date = Column(DateTime, nullable=False, default=func.now())

    nickname = Column(String(64), unique=True, nullable=False)
    email = Column(String(2048))
    balance = Column(Float, default=0)
    credits = Column(Float, default=0)
    addresses = relationship("Address", backref="customer")

    username = Column(String(64)) # not used

    wx_openid = Column(String(1024)) 
    wx_unionid = Column(String(1024))
    wx_nickname = Column(String(128))
    wx_sex = Column(String(20))
    wx_country = Column(String(128))
    wx_province = Column(String(128))
    wx_city = Column(String(128))
    wx_headimgurl = Column(String(2048))


class Address(MapBase):
    __tablename__ = "address"

    id = Column(Integer, primary_key=True, nullable=False)
    phone = Column(String(30), nullable=False)
    receiver = Column(String(64), nullable=False)
    address_text = Column(String(1024), nullable=False)
    owner_id = Column(Integer, ForeignKey(Customer.id))


class ShopServiceAreaLink(MapBase):
    __tablename__ = "shop_service_area_link"
    
    id = Column(Integer, primary_key=True, nullable=False)
    service_type = Column(Integer, nullable=False)
    shop_id = Column(Integer, ForeignKey(Shop.id), nullable=False)

class ShopAdminPrivilegeLink(MapBase):
    __tablename__ = "shop_admin_privilege_link"
    id = Column(Integer, primary_key=True, nullable=False)
    privilege_type = Column(Integer, nullable=False)

# 常量

class SHOP_SERVICE_AREA:
    """服务区域"""
    HIGH_SCHOOL = 1
    COMMUNITY = 2
    TRADE_CIRCLE = 3
    OTHERS = 4

class SHOPADMIN_ROLE_TYPE:
    """管理员角色"""
    SHOP_OWNER = 1
    SYSTEM_USER = 2

class SHOPADMIN_PRIVILEGE:
    """权限"""
    ALL = 1

class SHOPADMIN_CHARGE_TYPE:
    """付费类型"""
    THREEMONTH_588 = 1
    SIXMONTH_988 = 2
    TWELVEMONTH_1788 = 3



MapBase.metadata.create_all()


