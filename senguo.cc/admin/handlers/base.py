from libs.webbase import BaseHandler
import dal.models as models
from libs.utils import Logger
import json
import urllib
import traceback
from settings import APPID, APPSECRET, APP_OAUTH_CALLBACK_URL
import tornado.escape
from dal.dis_dict import dis_dict

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

        #将省份编码转换为文字显示
        if column_name == "shop_province":
            text = dis_dict[code]["name"]
            return text

        #将城市编码转换为文字显示（可以由城市编码算出城市所在省份的编码）
        if column_name == "shop_city":
            text += dis_dict[int(code/10000)*10000]["name"]
            text += " "
            text += dis_dict[int(code/10000)*10000]["city"][code]["name"]
            return text

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
