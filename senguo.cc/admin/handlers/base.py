from libs.webbase import BaseHandler
import dal.models as models
from libs.utils import Logger
import json
import urllib
import traceback
from settings import KF_APPID, KF_APPSECRET, APP_OAUTH_CALLBACK_URL, MP_APPID, MP_APPSECRET, ROOT_HOST_NAME
import tornado.escape
from dal.dis_dict import dis_dict
import time
import re
import tornado.web

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
        if column_name == "shop_status":
            if code == models.SHOP_STATUS.APPLYING:
                text = "审核中"
            elif code == models.SHOP_STATUS.ACCEPTED:
                text = "审核通过"
            elif code == models.SHOP_STATUS.DECLINED:
                text = "拒绝申请"
            return text


        #将城市编码转换为文字显示（可以由城市编码算出城市所在省份的编码）
        if column_name == "shop_city":
            text += dis_dict[int(code/10000)*10000]["name"]
            if "city" in dis_dict[int(code/10000)*10000].keys():
                text += " "
                text += dis_dict[int(code/10000)*10000]["city"][code]["name"]
            return text
        
        if column_name == "order_status":
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
    __account_cookie_name__ = "user_id"
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
        
    
class SuperBaseHandler(_AccountBaseHandler):
    __account_model__ = models.SuperAdmin
    #__account_cookie_name__ = "super_id"
    __wexin_oauth_url_name__ = "superOauth"

class AdminBaseHandler(_AccountBaseHandler):
    __account_model__ = models.ShopAdmin
    #__account_cookie_name__ = "admin_id"
    __wexin_oauth_url_name__ = "adminOauth"
    current_shop = None
    @tornado.web.authenticated
    def prepare(self):
        shop_id = self.get_secure_cookie("shop_id") or b'0'
        shop_id = int(shop_id.decode())
        if not self.current_user.shops:
            return self.finish("你还没有店铺，请先申请")
        if not shop_id:#初次登陆，默认选择一个店铺
            self.current_shop = self.current_user.shops[0]
            self.set_secure_cookie("shop_id", str(self.current_shop.id), domain=ROOT_HOST_NAME)
            return
        if not next((x for x in self.current_user.shops if x.id == shop_id), None):
            return self.finish('你没有这个店铺')
        else:
            self.current_shop = models.Shop.get_by_id(self.session, shop_id)

class StaffBaseHandler(_AccountBaseHandler):
    __account_model__ = models.ShopStaff
    #__account_cookie_name__ = "staff_id"
    __wexin_oauth_url_name__ = "staffOauth"
    shop_id = None
    @tornado.web.authenticated
    def prepare(self):
        cookie = self.get_secure_cookie("staff_shop_id")
        if not cookie:shop_id=b'0'
        else:shop_id=cookie
        #shop_id = self.get_secure_cookie("staff_shop_id") or b'0'
        shop_id = int(shop_id.decode())
        if not self.current_user.shops:
            return self.finish("你还没有店铺，请先申请")
        if not shop_id:
            shop_id = self.current_user.shops[0].id
            self.set_secure_cookie("staff_shop_id", str(shop_id), domain=ROOT_HOST_NAME)
        elif not next((x for x in self.current_user.shops if x.id == shop_id), None):
            return self.finish('你不是这个店铺的员工,可能已经被解雇了')
        self.shop_id = shop_id
        hirelink = self.session.query(models.HireLink).filter_by(
            staff_id=self.current_user.id, shop_id=self.shop_id).one()
        self.current_user.work = hirelink.work



class CustomerBaseHandler(_AccountBaseHandler):
    __account_model__ = models.Customer
    #__account_cookie_name__ = "customer_id"
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
        if d:
            if inc == 2:#加1
                if charge_type_id in d.keys(): d[charge_type_id] += 1
                else: d[charge_type_id] = 1
            elif inc == 1:#减1
                if charge_type_id in d.keys():
                    if d[charge_type_id] == 1:del d[charge_type_id]
                    else:d[charge_type_id] -= 1
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
                fruits[charge_type.id]={"charge_type": charge_type, "num": d[charge_type.id]}
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

class WxOauth2:
    token_url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid={appid}&secret={appsecret}&code={code}&grant_type=authorization_code"
    userinfo_url = "https://api.weixin.qq.com/sns/userinfo?access_token={access_token}&openid={openid}"
    @classmethod
    def get_userinfo(cls, code, mode):
        # 需要改成异步请求
        if mode == "kf": # 从PC来的登录请求
            token_url = cls.token_url.format(
                code=code, appid=KF_APPID, appsecret=KF_APPSECRET)
        elif mode == "mp":
            token_url = cls.token_url.format(
                code=code, appid=MP_APPID, appsecret=MP_APPSECRET)
        # 获取access_token
        try:
            data = json.loads(
                urllib.request.urlopen(token_url).read().decode("utf-8"))
            print(data)
            access_token = data["access_token"]
            openid = data["openid"]
        except Exception as e:
            Logger.warn("WxOauth2 Error", "获取access_token失败，注意是否存在攻击")
            traceback.print_exc()
            return None
        
        userinfo_url = cls.userinfo_url.format(access_token=access_token, openid=openid)
        try:            
            data = json.loads(
                urllib.request.urlopen(userinfo_url).read().decode("utf-8"))
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
            print(userinfo_data)
        except Exception as e:
            Logger.warn("Oauth2 Error", "获取用户信息失败")
            traceback.print_exc()
            return None
        
        return userinfo_data
