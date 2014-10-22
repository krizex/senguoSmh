from merryweb.webbase import BaseHandler
import models
from libs.utils import Logger


class GlobalBaseHandler(BaseHandler):
    @property
    def session(self):
        if hasattr(self, "_session"):
            return self._session
        self._session = models.DBSession()
        return self._session
    
    def on_close(self):
        # release db connection
        if hasattr(self, "_session"):
            self._session.close()

class FrontBaseHandler(GlobalBaseHandler):
    pass

class AccountBaseHandler(GlobalBaseHandler):
    # overwrite this to specify which account is used
    __account_model__ = None
    __account_cookie_name__ = ""
    
    
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
            self._user = __account_model__.get_by_id(user_id)
            if not self._user:
                Logger.warn("Suspicious Access", "may be trying to fuck you")
        return self._user
    def set_current_user(self, user):
        if not self.__account_model__ or not self.__account_cookie_name__:
            raise Exception("overwrite model to support authenticate.")
        self.set_secure_cookie(self.__account_cookie_name__, user.id)
    def clear_current_user(self):
        if not self.__account_model__ or not self.__account_cookie_name__:
            raise Exception("overwrite model to support authenticate.")
        self.clear_cookie(self.__account_cookie_name__)

class SuperBaseHandler(AccountBaseHandler):
    __account_model__ = models.SuperAdmin
    __account_cookie_name__ = "super_id"

class AdminBaseHandler(AccountBaseHandler):
    __account_model__ = models.ShopAdmin
    __account_cookie_name__ = "admin_id"
    
class StaffBaseHandler(AccountBaseHandler):
    __account_model__ = models.ShopStaff
    __account_cookie_name__ = "staff_id"

class CustomerBaseHandler(AccountBaseHandler):
    __account_model__ = models.Customer
    __account_cookie_name__ = "customer_id"

