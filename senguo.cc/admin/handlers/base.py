from libs.webbase import BaseHandler
import dal.models as models
from libs.utils import Logger
import json
import urllib
import traceback
from settings import KF_APPID, KF_APPSECRET, APP_OAUTH_CALLBACK_URL, MP_APPID, MP_APPSECRET
import tornado.escape
from dal.dis_dict import dis_dict
import time

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
            if code == models.ORDER_STATUS.TEMP:
                text = "待支付"
            elif code == models.ORDER_STATUS.SUCCESS:
                text = "已支付"
            elif code == models.ORDER_STATUS.ABORTED:
                text = "已取消"
            else:
                text = "ORDER_STATUS: 此编码不存在"
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
        self.clear_cookie(self.__account_cookie_name__)

    def get_wx_userinfo(self, code, mode):
        return WxOauth2.get_userinfo(code, mode)
        
    
class SuperBaseHandler(_AccountBaseHandler):
    __account_model__ = models.SuperAdmin
    __account_cookie_name__ = "super_id"
    __wexin_oauth_url_name__ = "superOauth"

class AdminBaseHandler(_AccountBaseHandler):
    __account_model__ = models.ShopAdmin
    __account_cookie_name__ = "admin_id"
    __wexin_oauth_url_name__ = "adminOauth"
    
class StaffBaseHandler(_AccountBaseHandler):
    __account_model__ = models.ShopStaff
    __account_cookie_name__ = "staff_id"

class CustomerBaseHandler(_AccountBaseHandler):
    __account_model__ = models.Customer
    __account_cookie_name__ = "customer_id"


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
                nickname=data["nickname"],
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
