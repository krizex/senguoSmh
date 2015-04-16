from libs.webbase import BaseHandler
import dal.models as models
from libs.utils import Logger
import json
import urllib
import hashlib
import traceback
from settings import KF_APPID, KF_APPSECRET, APP_OAUTH_CALLBACK_URL, MP_APPID, MP_APPSECRET, ROOT_HOST_NAME
import tornado.escape
from dal.dis_dict import dis_dict
import time
import re
import tornado.web
from sqlalchemy import desc
import datetime
import qiniu
from settings import *
import requests

import threading


# import time
# import random
# # import urllib2
# import threading
# from urllib import quote
# import xml.etree.ElementTree as ET


# try:
#     import pycurl
#     from cStringIO import StringIO
# except ImportError:
#     pycurl = None

# 4.14 woody
class Pysettimer(threading.Thread):
    def __init__(self,function,args = None ,timeout = 1 ,is_loop = False):
        threading.Thread.__init__(self)
        self.event = threading.Event()
        self.function = function
        self.args  = args
        self.timeout = timeout
        self.is_loop = is_loop

    def run(self):
        while not self.event.is_set():
            self.event.wait(self.timeout)
            self.function(self.args)
            if not self.is_loop:
                self.event.set()
    def stop(self):
        self.event.set()

#woody
order_url = 'http://m.senguo.cc:8887/admin'
staff_order_url = 'http://m.senguo.cc/staff'

class GlobalBaseHandler(BaseHandler):

    @property
    def session(self):
        if hasattr(self, "_session"):
            return self._session
        self._session = models.DBSession()
        return self._session
    
    def on_finish(self):
        # release db connection
        if hasattr(self, "_session"):
            self._session.close()

    def timestamp_to_str(self, timestamp):
        return time.strftime("%Y-%m-%d %H:%M", time.gmtime(timestamp))

    def code_to_text(self, column_name, code):
        text = ""

        #将服务区域的编码转换为文字显示
        if column_name == "service_area":
            if code & models.SHOP_SERVICE_AREA.HIGH_SCHOOL:
                text += "高校 "
            if code & models.SHOP_SERVICE_AREA.COMMUNITY:
                text += "社区 "
            if code & models.SHOP_SERVICE_AREA.TRADE_CIRCLE:
                text += "商圈 "
            if code & models.SHOP_SERVICE_AREA.OTHERS:
                text += "其他"
            return text

        #将商店审核状态编码转换为文字显示
        elif column_name == "shop_status":
            if code == models.SHOP_STATUS.APPLYING:
                text = "审核中"
            elif code == models.SHOP_STATUS.ACCEPTED:
                text = "审核通过"
            elif code == models.SHOP_STATUS.DECLINED:
                text = "拒绝申请"
            return text

        #将城市编码转换为文字显示（可以由城市编码算出城市所在省份的编码）
        elif column_name == "shop_city":
            text += dis_dict[int(code/10000)*10000]["name"]
            if "city" in dis_dict[int(code/10000)*10000].keys():
                text += " " + dis_dict[int(code/10000)*10000]["city"][code]["name"]
            return text
        
        elif column_name == "order_status":
            text = ""
            if code == models.SYS_ORDER_STATUS.TEMP:
                text = "待支付"
            elif code == models.SYS_ORDER_STATUS.SUCCESS:
                text = "已支付"
            elif code == models.SYS_ORDER_STATUS.ABORTED:
                text = "已取消"
            else:
                text = "SYS_ORDER_STATUS: 此编码不存在"
            return text

class FrontBaseHandler(GlobalBaseHandler):
    pass



class _AccountBaseHandler(GlobalBaseHandler):
    # overwrite this to specify which account is used
    __account_model__ = None
    __account_cookie_name__ = ""
    __login_url_name__ = ""
    __wexin_oauth_url_name__ = ""

    _wx_oauth_pc = "https://open.weixin.qq.com/connect/qrconnect?appid={appid}&redirect_uri={redirect_uri}&response_type=code&scope=snsapi_login&state=ohfuck#wechat_redirect"
    _wx_oauth_weixin = "https://open.weixin.qq.com/connect/oauth2/authorize?appid={appid}&redirect_uri={redirect_uri}&response_type=code&scope=snsapi_userinfo&state=onfuckweixin#wechat_redirect"

    def is_wexin_browser(self):
        if "User-Agent" in self.request.headers:
            ua = self.request.headers["User-Agent"]
        else:
            ua = ""
        return  "MicroMessenger" in ua
    def is_pc_browser(self):
        if "User-Agent" in self.request.headers:
            ua = self.request.headers["User-Agent"]
        else:
            ua = ""
        return not ("Mobile" in ua)

    def get_wexin_oauth_link(self, next_url=""):
        if not self.__wexin_oauth_url_name__:
            raise Exception("you have to complete this wexin oauth config.")
        
        if next_url: 
            para_str = "?next="+tornado.escape.url_escape(next_url)
        else:
            para_str = ""
        
        if self.is_wexin_browser():
            if para_str: para_str += "&"
            else: para_str = "?"
            para_str += "mode=mp"
            redirect_uri = tornado.escape.url_escape(
                APP_OAUTH_CALLBACK_URL+\
                self.reverse_url(self.__wexin_oauth_url_name__) + para_str)
            link =  self._wx_oauth_weixin.format(appid=MP_APPID, redirect_uri=redirect_uri)
        else:
            if para_str: para_str += "&"
            else: para_str = "?"
            para_str += "mode=kf"
            redirect_uri = tornado.escape.url_escape(
                APP_OAUTH_CALLBACK_URL+\
                self.reverse_url(self.__wexin_oauth_url_name__) + para_str)
            link = self._wx_oauth_pc.format(appid=KF_APPID, redirect_uri=redirect_uri)
        return link
    
    def get_login_url(self):
        return self.get_wexin_oauth_link(next_url=self.request.full_url())
    def get_current_user(self):
        if not self.__account_model__ or not self.__account_cookie_name__:
            raise Exception("overwrite model to support authenticate.")

        if hasattr(self, "_user"):
            return self._user

        user_id = self.get_secure_cookie(self.__account_cookie_name__) or b'0'
        user_id = int(user_id.decode())
        if not user_id:
            self._user = None
        else:
            self._user = self.__account_model__.get_by_id(self.session, user_id)
            if not self._user:
                Logger.warn("Suspicious Access", "may be trying to fuck you")
        return self._user
    _ARG_DEFAULT = []
    def set_current_user(self, user, domain=_ARG_DEFAULT):
        if not self.__account_model__ or not self.__account_cookie_name__:
            raise Exception("overwrite model to support authenticate.")
        if domain is _AccountBaseHandler._ARG_DEFAULT:            
            self.set_secure_cookie(self.__account_cookie_name__, str(user.id))
        else:
            self.set_secure_cookie(self.__account_cookie_name__, str(user.id), domain=domain)
    def clear_current_user(self):
        if not self.__account_model__ or not self.__account_cookie_name__:
            raise Exception("overwrite model to support authenticate.")
        self.clear_cookie(self.__account_cookie_name__, domain=ROOT_HOST_NAME)

    def get_wx_userinfo(self, code, mode):
        return WxOauth2.get_userinfo(code, mode)
        
    def send_qiniu_token(self, action, id):
        q = qiniu.Auth(ACCESS_KEY, SECRET_KEY)
        token = q.upload_token(BUCKET_SHOP_IMG, expires=120,
                              policy={"callbackUrl": "http://m.senguo.cc/fruitzone/imgcallback",
                                      "callbackBody": "key=$(key)&action=%s&id=%s" % (action, id), "mimeLimit": "image/*"})
#        token = q.upload_token(BUCKET_SHOP_IMG,expires = 120)
        return self.send_success(token=token, key=action + ':' + str(time.time())+':'+str(id))

    def get_comments(self, shop_id, page=0, page_size=5):
        return self.session.query(models.Accountinfo.headimgurl_small, models.Accountinfo.nickname,
                                  models.Order.comment, models.Order.comment_create_date, models.Order.num,
                                  models.Order.comment_reply,models.Order.id).\
            filter(models.Order.shop_id == shop_id, models.Order.status == 6,
                   models.Order.customer_id == models.Accountinfo.id).\
            order_by(desc(models.Order.comment_create_date)).offset(page*page_size).limit(page_size).all()

    def timedelta(self, date):
        if not date:
            return "1年前"
        timedelta = datetime.datetime.now()-date
        if timedelta.days >= 365:
            return "%d年前" % (timedelta.days/365)
        elif timedelta.days >= 30:
            return "%d月前" % (timedelta.days/30)
        elif timedelta.days > 0:
            return "%d天前" % timedelta.days
        elif timedelta.seconds >= 3600:
            return "%d小时前" % (timedelta.seconds/3600)
        elif timedelta.seconds >= 60:
            return "%d分钟前" % (timedelta.seconds/60)
        else:
            return "%d秒前" % timedelta.seconds

    def write_error(self, status_code, **kwargs):
        if status_code == 404:
            self.render('notice/404.html')
        elif status_code == 500:
            self.render('notice/500.html')
        else:
            super(GlobalBaseHandler, self).write_error(status_code, **kwargs)

    def monthdelta(self, date, delta):
        m, y = (date.month+delta) % 12, date.year + (date.month+delta-1) // 12
        if not m:
            m = 12
        d = [31, 29 if y % 4 == 0 and not y % 400 == 0 else 28,
             31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m-1]
        return date.replace(day=d, month=m, year=y)

    def signature(self, noncestr, timestamp, url):
        jsapi_ticket = WxOauth2.get_jsapi_ticket()
        string = "jsapi_ticket={jsapi_ticket}&noncestr={noncestr}&timestamp={timestamp}&url={url}".\
            format(jsapi_ticket=jsapi_ticket, noncestr=noncestr, timestamp=timestamp, url=url)

        h = hashlib.sha1(string.encode())
        return h.hexdigest()


class SuperBaseHandler(_AccountBaseHandler):
    __account_model__ = models.SuperAdmin
    __account_cookie_name__ = "super_id"
    __wexin_oauth_url_name__ = "superOauth"

    def shop_close(self):
        # print(self)
        print('close shop')
        session = models.DBSession()
        close_shop_list = []
        try:
            shops = session.query(models.Shop).filter_by(status = 1).all()
        except:
            print('shops error')
        if shops:
            for shop in shops:
                shop_code = shop.shop_code
                shop_id = shop.id
                fruits = shop.fruits
                menus = shop.menus
                # print(menus)
                create_date = shop.create_date_timestamp
                x = datetime.datetime.fromtimestamp(create_date)
                # print(x)
                now = datetime.datetime.now()
                days = (now -x).days
                if days >14:
                    if shop_code =='not set':
                        shop.status = 0
                        close_shop_list.append(shop_code)
                    if len(fruits) == 0 and len(menus) == 0:
                        shop.status = 0 
                        close_shop_list.append(shop_code)
                    try:
                        follower_count = session.query(models.CustomerShopFollow).filter_by(shop_id = shop_id).count()
                    except:
                        return self.send_fail('follower_count error')
                    if follower_count <2:
                        shop.status =0
                        close_shop_list.append(shop_code)
                session.commit()
            print(close_shop_list)
            # return self.send_success(close_shop_list = close_shop_list)

class FruitzoneBaseHandler(_AccountBaseHandler):
    __account_model__ = models.ShopAdmin
    __account_cookie_name__ = "admin_id"
    __wexin_oauth_url_name__ = "adminOauth"

    # get the total,privince,city count of shop
    # woody 4.4
    def get_shop_count(self):
        try:
            shop_count = self.session.query(models.Shop).filter(models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
                models.Shop.shop_code !='not set' ).count()
        except:
            return self.send_fail("shop count error")
        return shop_count
    def get_province_shop_count(self,shop_province):
        try:
            shop_count = self.session.query(models.Shop).filter(shop_province == shop_province,shop_code !='not set' ).count()
        except:
            return self.send_fail('shop_province error')
        return shop_count
    def get_city_shop_count(self,shop_city):
        try:
            shop_count = self.session.query(models.Shop).filter(shop_city == shop_city,shop_code !='not set' ).count()
        except:
            return self.send_fail('shop_city error')
        return shop_count

    def get_shop_group(self):
        from sqlalchemy import func
        try:
            shop_count = self.session.query(models.Shop.shop_province,func.count(models.Shop.shop_province)).\
            filter(models.Shop.shop_code != 'not set').group_by(models.Shop.shop_province).all()
        except:
            return self.send_fail('group error')
        #print(type(shop_count))
        shoplist = []
        # shop_count = shop_count.filter(shop_code != 'not set')
        for shop in shop_count:
            #print(shop[0],shop[1])
            shoplist.append([shop[0],shop[1]])

        return shoplist


class AdminBaseHandler(_AccountBaseHandler):
    __account_model__ = models.ShopAdmin
    __account_cookie_name__ = "admin_id"
    __wexin_oauth_url_name__ = "adminOauth"
    current_shop = None
    @tornado.web.authenticated
    def prepare(self):
        """这个函数在get、post等函数运行前运行"""
        shop_id = self.get_secure_cookie("shop_id") or b'0'
        shop_id = int(shop_id.decode())
        if not self.current_user.shops:
            return self.finish("你还没有店铺，请先申请")
        shop = next((x for x in self.current_user.shops if x.id == shop_id), None)
        if not shop_id or not shop:#初次登陆，默认选择一个店铺
            self.current_shop = self.current_user.shops[0]
            self.set_secure_cookie("shop_id", str(self.current_shop.id), domain=ROOT_HOST_NAME)
            return
        else:
            self.current_shop = shop


class StaffBaseHandler(_AccountBaseHandler):
    __account_model__ = models.ShopStaff
    __account_cookie_name__ = "staff_id"
    __wexin_oauth_url_name__ = "staffOauth"
    shop_id = None
    shop_name = None
    hirelink = None
    @tornado.web.authenticated
    def prepare(self):
        shop_id = self.get_secure_cookie("staff_shop_id") or b'0'
        shop_id = int(shop_id.decode())
        if not self.current_user.shops:
            return self.finish("你还没有店铺，请先申请")
        if not shop_id:
            shop_id = self.current_user.shops[0].id
            self.set_secure_cookie("staff_shop_id", str(shop_id), domain=ROOT_HOST_NAME)
        elif not next((x for x in self.current_user.shops if x.id == shop_id), None):
            return self.finish('你不是这个店铺的员工,可能已经被解雇了')
        self.shop_id = shop_id
        self.shop_name = next(x for x in self.current_user.shops if x.id == shop_id).shop_name
        self.hirelink = self.session.query(models.HireLink).filter_by(
            staff_id=self.current_user.id, shop_id=self.shop_id).one()
        self.current_user.work = self.hirelink.work



class CustomerBaseHandler(_AccountBaseHandler):
    __account_model__ = models.Customer
    __account_cookie_name__ = "customer_id"
    __wexin_oauth_url_name__ = "customerOauth"
    @tornado.web.authenticated
    def save_cart(self, charge_type_id, shop_id, inc, menu_type):
        """
        用户购物车操作函数，对购物车进行修改或者删除商品：
        charge_type_id：要删除的商品的计价类型
        shop_id：用户在每个店铺都有一个购物车
        inc：购物车操作类型
        menu_type：商品类型（fruit：系统内置，menu：商家自定义）
        #inc==0 删,inc==1:减，inc==2：增；type==0：fruit，type==1：menu
        """
        cart = self.session.query(models.Cart).filter_by(id=self.current_user.id, shop_id=shop_id).one()
        if menu_type == 0:
            self._f(cart, "fruits", charge_type_id, inc)
        else:
            self._f(cart, "mgoods", charge_type_id, inc)
        if not (eval(cart.fruits) or eval(cart.mgoods)):#购物车空了
            return True
        return False

    def _f(self, cart, menu, charge_type_id, inc):
        d = eval(getattr(cart, menu))
        # print(type(d[charge_type_id]))
        if d:
            if inc == 2:#加1
                if charge_type_id in d.keys(): d[charge_type_id] =   int(d[charge_type_id]) + 1
                else: d[charge_type_id] = 1
            elif inc == 1:#减1
                if charge_type_id in d.keys():
                    if d[charge_type_id] == 1:
                        del d[charge_type_id]
                    else:
                        d[charge_type_id] =  d[charge_type_id]  -1
                else:return
            elif inc == 0:#删除
                if charge_type_id in d.keys(): del d[charge_type_id]
            else:return
            setattr(cart, menu, str(d))#数据库cart.fruits 保存的是字典（计价类型id：数量）
        else:
            if inc == 2:
                d={charge_type_id:1}
                setattr(cart, menu, str(d))
        self.session.commit()

    def read_cart(self, shop_id):
        """
        读购物车函数，把数据库里的str转换为dict，同时删除购物车里已经过时的商品
        """
        try:cart = self.session.query(models.Cart).filter_by(id=self.current_user.id, shop_id=shop_id).one()
        except:cart = None
        if not cart or (cart.fruits == "" and cart.mgoods == ""): #购物车为空
            return None, None
        fruits={}
        mgoodses={}
        if cart.fruits:
            d = eval(cart.fruits)
            charge_types=self.session.query(models.ChargeType).\
                filter(models.ChargeType.id.in_(d.keys())).all()
            charge_types = [x for x in charge_types if x.fruit.active == 1]#过滤掉下架商品
            l = [x.id for x in charge_types]
            keys = list(d.keys())
            for key in keys:#有些计价方式可能已经被删除，so购物车也要相应删除
                if key not in l:
                    del d[key]
            cart.update(session=self.session, fruits=str(d)) #更新购物车
            for charge_type in charge_types:
                fruits[charge_type.id] = {"charge_type": charge_type, "num": d[charge_type.id],
                                          "code": charge_type.fruit.fruit_type.code}
        if cart.mgoods:
            d = eval(cart.mgoods)
            mcharge_types=self.session.query(models.MChargeType).\
                filter(models.MChargeType.id.in_(d.keys())).all()
            mcharge_types = [x for x in mcharge_types if x.mgoods.active == 1]#过滤掉下架商品
            l = [x.id for x in mcharge_types]
            keys = list(d.keys())
            for key in keys:
                if key not in l:
                    del d[key]
            cart.update(session=self.session, mgoods=str(d))
            for mcharge_type in mcharge_types:
                mgoodses[mcharge_type.id]={"mcharge_type": mcharge_type, "num": d[mcharge_type.id]}
        return fruits, mgoodses


    @property
    def shop_id(self):
        if hasattr(self, "_shop_id"):
            return self._shop_id
        shop_id = self.get_cookie("market_shop_id")
        if not shop_id:
            return self.send_fail("shop_id error")
            #return self.redirect("/shop/1")  #todo 这里应该重定向到商铺列表
        self._shop_id = int(shop_id)
        # if not self.session.query(models.CustomerShopFollow).filter_by(
        #         customer_id=self.current_user.id, shop_id=shop_id).first():
        #     return self.redirect("/customer/market/1")  #todo 这里应该重定向到商铺列表
        return self._shop_id
    @property
    def shop_code(self):
        if hasattr(self, "_shop_code"):
            return self._shop_code

        #woody
        #3.23
        shop_id = self.get_cookie("market_shop_id")
        shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
        if shop:
            self._shop_code = shop.shop_code
        else:
            self._shop_code = None

        return self._shop_code

    def get_phone(self,customer_id):
        try:
            account_info  = self.session.query(models.Accountinfo).filter_by(id = customer_id).first()
        except:
            return self.send_fail('customer error')
        if account_info:
            phone = account_info.phone
        else:
            phone = None
        return phone


    # get the total,privince,city count of shop
    # woody 4.4
    def get_shop_count(self):
        try:
            shop_count = self.session.query(models.Shop).count()
        except:
            return self.send_fail("shop count error")
        return shop_count
    def get_province_shop_count(self,shop_province):
        try:
            shop_count = self.session.query(models.Shop).filter_by(shop_province = shop_province).count()
        except:
            return self.send_fail('shop_province error')
        return shop_count
    def get_city_shop_count(self,shop_city):
        try:
            shop_count = self.session.query(models.Shop).filter_by(shop_city = shop_city).count()
        except:
            return self.send_fail('shop_city error')
        return shop_count

    def get_shop_group(self):
        from sqlalchemy import func
        try:
            shop_count = self.session.query(models.Shop.shop_province,func.count(models.Shop.shop_province)).\
            group_by(models.Shop.shop_province).all()
        except:
            return self.send_fail('group error')
        #print(shop_count)
        return shop_count




jsapi_ticket = {"jsapi_ticket": '', "create_timestamp": 0}  # 用全局变量存好，避免每次都要申请
access_token = {"access_token": '', "create_timestamp": 0}

class WxOauth2:
    token_url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid={appid}" \
                "&secret={appsecret}&code={code}&grant_type=authorization_code"
    userinfo_url = "https://api.weixin.qq.com/sns/userinfo?access_token={access_token}&openid={openid}"
    client_access_token_url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential" \
                              "&appid={appid}&secret={appsecret}".format(appid=MP_APPID, appsecret=MP_APPSECRET)
    jsapi_ticket_url = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token={access_token}&type=jsapi"
    template_msg_url = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token={access_token}"
    

    @classmethod
    def get_userinfo(cls, code, mode):
        data = cls.get_access_token_openid(code, mode)
        if not data:
            return None
        access_token, openid = data
        userinfo_url = cls.userinfo_url.format(access_token=access_token, openid=openid)
        #print('code',code)
        #print('mode',mode)
        try:            
            data = json.loads(
                urllib.request.urlopen(userinfo_url).read().decode("utf-8"))

            #print("return data")
            #for key in data:
            #    print(key,data[key])
            userinfo_data = dict(
                openid=data["openid"],
                nickname=re.compile(u'[\U00010000-\U0010ffff]').sub(u'',data["nickname"]),#过滤掉Emoji，否则数据库报错
                sex=data["sex"],
                province=data["province"],
                city=data["city"],
                country=data["country"],
                headimgurl=data["headimgurl"],
                unionid=data["unionid"]
            )
            #print(userinfo_data)
        except Exception as e:
            #Logger.warn("Oauth2 Error", "获取用户信息失败")
            #traceback.print_exc()
            return None
        
        return userinfo_data


    @classmethod
    def get_access_token_openid(cls, code, mode):  # access_token接口调用有次数上限，最好全局变量缓存
                                                   #这是需要用户授权才能获取的access_token
        # 需要改成异步请求
        if mode == "kf": # 从PC来的登录请求
            token_url = cls.token_url.format(
                code=code, appid=KF_APPID, appsecret=KF_APPSECRET)
        else :
            token_url = cls.token_url.format(
                code=code, appid=MP_APPID, appsecret=MP_APPSECRET)
        # 获取access_token
        try:
            data = json.loads(urllib.request.urlopen(token_url).read().decode("utf-8"))
            #print(data)
        except Exception as e:
            #Logger.warn("WxOauth2 Error", "获取access_token失败，注意是否存在攻击")
            #traceback.print_exc()
            return None
        if "access_token" not in data:
            return None
        return (data["access_token"], data["openid"])

    @classmethod
    def get_jsapi_ticket(cls):
        global jsapi_ticket
        if datetime.datetime.now().timestamp() - jsapi_ticket["create_timestamp"]\
                < 7100 and jsapi_ticket["jsapi_ticket"]:  # jsapi_ticket过期时间为7200s，但为了保险起见7100s刷新一次
            return jsapi_ticket["jsapi_ticket"]
        access_token = cls.get_client_access_token()
        if not access_token:
            return None
        jsapi_ticket_url = cls.jsapi_ticket_url.format(access_token=access_token)

        data = json.loads(urllib.request.urlopen(jsapi_ticket_url).read().decode("utf-8"))
        if data["errcode"] == 0:
            jsapi_ticket["jsapi_ticket"] = data["ticket"]
            jsapi_ticket["create_timestamp"] = datetime.datetime.now().timestamp()
            #print('ticket',data["ticket"])
            return data["ticket"]
        else:
            #print("获取jsapi_ticket出错：", data)
            return None

    @classmethod
    def get_client_access_token(cls):  # 微信接口调用所需要的access_token,不需要用户授权
        global access_token
        if datetime.datetime.now().timestamp() - access_token["create_timestamp"]\
                < 7100 and access_token["access_token"]:  # jsapi_ticket过期时间为7200s，但为了保险起见7100s刷新一次
            return access_token["access_token"]

        data = json.loads(urllib.request.urlopen(cls.client_access_token_url).read().decode("utf-8"))
        if "access_token" in data:
            access_token["access_token"] = data["access_token"]
            access_token["create_timestamp"] = datetime.datetime.now().timestamp()
            return data["access_token"]
        else:
            #print("获取微信接口调用的access_token出错：", data)
            return None

    @classmethod
    def post_template_msg(cls, touser, shop_name, name, phone):
        #print('####################')
        #print(cls)
        #print(touser)
        time = datetime.datetime.now().strftime('%Y-%m-%d %R')
        postdata = {
            "touser": touser,
            "template_id": "YDIcdYNMLKk3sDw_yJgpIvmcN5qz_2Uz83N7T9i5O3s",
            "url": "http://mp.weixin.qq.com/s?__biz=MzA3Mzk3NTUyNQ==&"
                   "mid=202647288&idx=1&sn=b6b46a394ae3db5dae06746e964e011b#rd",
            "topcolor": "#FF0000",
            "data": {
                "first": {"value": "您好，您所申请的店铺“%s”已经通过审核！" % shop_name, "color": "#173177"},
                "keyword1": {"value": name, "color": "#173177"},
                "keyword2": {"value": phone, "color": "#173177"},
                "keyword3": {"value": time, "color": "#173177"},
                "remark": {"value": "务必点击详情，查看使用教程！", "color": "#FF4040"}}
        }
        access_token = cls.get_client_access_token()
        res = requests.post(cls.template_msg_url.format(access_token=access_token), data=json.dumps(postdata))
        data = json.loads(res.content.decode("utf-8"))
        if data["errcode"] != 0:
            #print("店铺审核模板消息发送失败：", data)
            return False
        return True

    @classmethod
    def fail_template_msg(cls, touser, shop_name, name, phone,reason):
        time = datetime.datetime.now().strftime('%Y-%m-%d %R')
        postdata = {
            "touser": touser,
            "template_id": "YDIcdYNMLKk3sDw_yJgpIvmcN5qz_2Uz83N7T9i5O3s",
            "url": "http://mp.weixin.qq.com/s?__biz=MzA3Mzk3NTUyNQ==&"
                   "mid=202647288&idx=1&sn=b6b46a394ae3db5dae06746e964e011b#rd",
            "topcolor": "#FF0000",
            "data": {
                "first": {"value": "您好，您所申请的店铺“%s”未通过审核！" % shop_name, "color": "#173177"},
                "keyword1": {"value": name, "color": "#173177"},
                "keyword2": {"value": phone, "color": "#173177"},
                "keyword3": {"value": time, "color": "#173177"},
                "remark": {"value": reason, "color": "#FF4040"}}
        }
        access_token = cls.get_client_access_token()
        res = requests.post(cls.template_msg_url.format(access_token=access_token), data=json.dumps(postdata))
        data = json.loads(res.content.decode("utf-8"))
        if data["errcode"] != 0:
            #print("店铺审核模板消息发送失败：", data)
            return False
        return True


    @classmethod
    def post_order_msg(cls,touser,admin_name,shop_name,order_id,order_type,create_date,customer_name,order_totalPrice,send_time,goods):
        remark = "订单总价：" + str(order_totalPrice) + '\n' + "送达时间：" + send_time + '\n' + "商品详情："  + goods + '\n\n'  + \
        '请及时登录森果后台处理订单。'
        postdata = {
            'touser' : touser,
            'template_id':"5s1KVOPNTPeAOY9svFpg67iKAz8ABl9xOfljVml6dRg",
            "url":order_url,
            "topcolor":"#FF0000",
            "data":{
                "first":{"value":"管理员{0}您好，店铺{1}收到了新的订单！".format(admin_name,shop_name),"color": "#173177"},
                "tradeDateTime":{"value":str(create_date),"color":"#173177"},
                "orderType":{"value":order_type,"color":"#173177"},
                "customerInfo":{"value":customer_name,"color":"#173177"},
                "orderItemName":{"value":"订单编号","color":"#173177"},
                "orderItemData":{"value":order_id,"color":"#173177"},
                "remark":{"value":remark,"color":"#173177"},
            }
        }
        access_token = cls.get_client_access_token()
        res = requests.post(cls.template_msg_url.format(access_token = access_token),data = json.dumps(postdata))
        data = json.loads(res.content.decode("utf-8"))
        print('data',data)
        if data["errcode"] != 0:
            #print("订单提醒发送失败:",data)
            return False
        return True

    @classmethod
    def post_staff_msg(cls,touser,staff_name,shop_name,order_id,order_type,create_date,customer_name,order_totalPrice,send_time):
        remark = "订单总价：" + str('%.1' % order_totalPrice) + '\n' + "送达时间：" + send_time + '\n\n' + '请及时处理订单。'
        order_type_temp = int(order_type)
        order_type = "即时送" if order_type_temp == 1 else "按时达"
        postdata = {
            'touser':touser,
            'template_id':'5s1KVOPNTPeAOY9svFpg67iKAz8ABl9xOfljVml6dRg',
            'url':staff_order_url,
            "data":{
                "first":{"value":"{0}您好，店铺{1}收到了新的订单！".format(staff_name,shop_name),"color": "#173177"},
                "tradeDateTime":{"value":str(create_date),"color":"#173177"},
                "orderType":{"value":order_type,"color":"#173177"},
                "customerInfo":{"value":customer_name,"color":"#173177"},
                "orderItemName":{"value":"订单编号","color":"#173177"},
                "orderItemData":{"value":order_id,"color":"#173177"},
                "remark":{"value":remark,"color":"#173177"},
            }
        }
        access_token = cls.get_client_access_token()
        res = requests.post(cls.template_msg_url.format(access_token = access_token),data = json.dumps(postdata))
        data = json.loads(res.content.decode("utf-8"))
        if data["errcode"] != 0:
        #    print("订单提醒发送失败:",data)
            return False
        return True


    @classmethod
    def order_success_msg(cls,touser,shop_name,order_create,goods,order_totalPrice):
        postdata = {
            'touser' : touser,
            'template_id':'NNOXSZsH76hQX7p2HCNudxLhpaJabSMpLDzuO-2q0Z0',
            'url'    : '',
            'topcolor': "#FF0000",
            "data":{
                "first"    : {"value":"您的订单已提交成功","color":"#173177"},
                "keyword1" : {"value":shop_name,"color":"#173177"},
                "keyword2" : {"value":str(order_create),"color":"#173177"},
                "keyword3" : {"value":goods,"color":"#173177"},
                "keyword4" : {"value":float('%.1f' % order_totalPrice),"color":"#173177"},
                "remark"   : {"value":"您的订单我们已经收到，配货后将尽快配送~","color":"#173177"},
            }
        }
        access_token = cls.get_client_access_token()
        res = requests.post(cls.template_msg_url.format(access_token=access_token),data = json.dumps(postdata))
        data = json.loads(res.content.decode("utf-8"))
        if data["errcode"] != 0:
            #print("订单提交成功通知发送失败",data)
            return False
        return True

    @classmethod
    def get_user_subcribe(cls,openid):
        # print(type(openid))
        access_token = cls.get_client_access_token()
        user_subcribe_url = 'https://api.weixin.qq.com/cgi-bin/user/info?access_token={0}&openid={1}'.format(access_token,openid)
        res = requests.get(user_subcribe_url)
        if type(res.content)== bytes:
            s = str(res.content,'utf-8')
        else:
            s = res.content.decode('utf-8')
        data = json.loads(s)
        json_data = json.dumps(data)
        #print(data)
        subscribe = data.get('subscribe')
        return subscribe

    @classmethod
    def get_redriect(cls):
        appid = 'wx0ed17cdc9020a96e'
        redirect_url = 'http://auth.senguo.cc/fruitzone'
        response_type='code'
        scope = 'snsapi_userinfo'
        state = 123
        url = 'https://open.weixin.qq.com/connect/oauth2/\
        authorize?appid={0}&redirect_uri={1}&response_type=code&scope={2}&state={3}#\
        wechat_redirect'.format(appid,redirect_url,scope,state)
        return url

    # @classmethod
    # def formatBizQueryParaMap(cls,paraMap,urlencode):
    #     slist = sorted(paraMap)
    #     buff = []
    #     for k in slist:
    #         v =  quote(paraMap[k]) if urlencode else paraMap[k]
    #         buff.append("{0}={1}".format(k,v))
    #     return "&".join(buff)

    # @classmethod
    # def getSign(self,obj):
    #     #商户支付密钥Key。审核通过后，在微信发送的邮件中查看
    #     KEY = ''
    #     String = self.formatBizQueryParaMap(obj,False)
    #     String = "{0}&key={1}".format(String,KEY)
    #     String = hashlib.md5(String).hexdigest()
    #     result = String.upper()
    #     return result

    # @classmethod
    # def postXML(self,xml,url,second=30 ,post=True):
    #     curl = pycurl.Curl()
    #     curl.setopt(pycurl.URL,url)
    #     curl.setopt(pycurl.TIMEOUT,second)

    #     if post:
    #         curl.setopt(pycurl.POST,True)
    #         curl.setopt(pycurl.POSTFIELDS,xml)
    #     buff = StringIO()
    #     curl.setopt(pycurl.WRITEFUNCTION,buff.write)

    #     curl.perform()
    #     return buff.getvalue()

    # @classmethod
    # def createXml(self):
    #     parameters = {}
    #     parameters["appid"] = MP_APPID
    #     parameters["mch_id"]= ""
    #     parameters["spbill_create_ip"] = "127.0.0.1"
    #     parameters["noncestr_str"] = self.createNoncestr()
    #     parameters["sign"]  = self.getSign(parameters)
    #     return arrayToXml(parameters)

    # @classmethod
    # def createNoncestr(self):
    #     chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    #     strs = []
    #     for x in range(length):
    #         strs.append(chars[random.randrange(0,len(chars))])
    #     return "".join(strs)

    # @classmethod
    # def arrayToXml(self,arr):
    #     xml = ["<xml>"]
    #     for k,v in arr.iteritems():
    #         if v.isdigit()
    #             xml.append("<{0}>{1}</{0}>".format(k,v))
    #         else:
    #             xml.append("<{0}><![CDATA{1}]></{0}>").format(k,v)
    #     xml.append("</xml>")
    #     return "".join(xml)














