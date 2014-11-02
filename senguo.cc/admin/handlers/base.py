from libs.webbase import BaseHandler
import dal.models as models
from libs.utils import Logger
import json
import urllib
import traceback
from settings import APPID, APPSECRET, APP_OAUTH_CALLBACK_URL
import tornado.escape

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

class FrontBaseHandler(GlobalBaseHandler):
    pass

class _AccountBaseHandler(GlobalBaseHandler):
    # overwrite this to specify which account is used
    __account_model__ = None
    __account_cookie_name__ = ""
    __login_url_name__ = ""
    __wexin_oauth_url_name__ = ""

    def get_wexin_oauth_link(self, next_url=""):
        if not self.__wexin_oauth_url_name__:
            raise Exception("you have to complete this wexin oauth config.")
        
        if next_url: 
            para_str = "?next="+next_url
        else:
            para_str = ""
        
        redirect_uri = tornado.escape.url_escape(
            APP_OAUTH_CALLBACK_URL+\
            self.reverse_url(self.__wexin_oauth_url_name__) + para_str)
        return "https://open.weixin.qq.com/connect/qrconnect?appid={appid}&redirect_uri={redirect_uri}&response_type=code&scope=snsapi_login&state=ohfuck#wechat_redirect".format(appid=APPID, redirect_uri=redirect_uri)
    
    def get_login_url(self):
        if not self.__login_url_name__:
            raise Exception("you should complete this config in the subclass.")
        return self.reverse_url(self.__login_url_name__)
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
    def set_current_user(self, user):
        if not self.__account_model__ or not self.__account_cookie_name__:
            raise Exception("overwrite model to support authenticate.")
        self.set_secure_cookie(self.__account_cookie_name__, str(user.id))
    def clear_current_user(self):
        if not self.__account_model__ or not self.__account_cookie_name__:
            raise Exception("overwrite model to support authenticate.")
        self.clear_cookie(self.__account_cookie_name__)

    def get_wx_userinfo(self, code):
        return WxOauth2.get_userinfo(code)
        
    
class SuperBaseHandler(_AccountBaseHandler):
    __account_model__ = models.SuperAdmin
    __account_cookie_name__ = "super_id"
    __login_url_name__ = "superLogin"

class AdminBaseHandler(_AccountBaseHandler):
    __account_model__ = models.ShopAdmin
    __account_cookie_name__ = "admin_id"
    __login_url_name__ = "adminLogin"
    __wexin_oauth_url_name__ = "adminOauth"
    
class StaffBaseHandler(_AccountBaseHandler):
    __account_model__ = models.ShopStaff
    __account_cookie_name__ = "staff_id"

class CustomerBaseHandler(_AccountBaseHandler):
    __account_model__ = models.Customer
    __account_cookie_name__ = "customer_id"

from settings import APPID, APPSECRET

class WxOauth2:
    token_url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid={appid}&secret={appsecret}&code={code}&grant_type=authorization_code"
    userinfo_url = "https://api.weixin.qq.com/sns/userinfo?access_token={access_token}&openid={openid}"
    @classmethod
    def get_userinfo(cls, code):
        # 需要改成异步请求
        token_url = cls.token_url.format(code=code, appid=APPID, appsecret=APPSECRET)
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
            if data["sex"] == 2: # female
                sex = "female"
            else:
                sex = "male"
            userinfo_data = dict(
                openid=data["openid"],
                nickname=data["nickname"],
                sex=sex,
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
