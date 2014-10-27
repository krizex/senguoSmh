from sqlalchemy import create_engine, func, ForeignKey, Column
from sqlalchemy.types import String, Integer, DateTime, Text, Boolean, Float
from sqlalchemy.orm import relationship, backref, sessionmaker
from sqlalchemy.ext.declarative import declarative_base

engine = create_engine("mysql+mysqlconnector://monk:test123@127.0.0.1/test_sqlalchemy")
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

    shop_category = Column(String(64))
    shop_address = Column(String(1024), nullable=False)
    shop_sales_range = Column(String(128))
    
    have_entity = Column(Boolean)

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
    password = Column(String(2048))
    
    nickname = Column(String(128), default="")
    email = Column(String(2048))
    birthday = Column(DateTime)
    qr_code_url = Column(String(2048))
    create_date = Column(DateTime, nullable=False, default=func.now())

    shops = relationship(Shop, backref=backref('admin'))
    username = Column(String(128)) # not used now    

    wx_openid = Column(String(1024)) 
    wx_unionid = Column(String(1024))
    wx_nickname = Column(String(128))
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

MapBase.metadata.create_all()


