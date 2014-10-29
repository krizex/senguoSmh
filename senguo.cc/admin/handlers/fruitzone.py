from handlers.base import AdminBaseHandler
import dal.models as models
import tornado.web
from  dal.db_configs import DBSession
from dal.models import Shop, ShopAdmin
import datetime

class Home(AdminBaseHandler):
   def get(self):
           return self.render("fruitzone/peer-circles.html")

class ApplySuccess(AdminBaseHandler):
    def get(self):
        return self.render("fruitzone/apply-success.html")

class ShopApply(AdminBaseHandler):
    
    # @tornado.web.authenticated
    def get(self):
        # 是否允许多个申请
        return self.render("fruitzone/apply.html")
    
    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments(
        "shop_name", "shop_service_areas:list",
        "shop_province", "shop_city", "shop_address_detail",
        "have_offline_entity:bool", 
        
        "admin_realname","admin_email","admin_wx_username", "admin_use_system:bool",
        "admin_charge_type:int", "admin_phone")
    def post(self):
        # return self.send_fail(error_text ="用户名不合法")
        return self.send_success()

class ShopList(AdminBaseHandler):
    pass

class Shop(AdminBaseHandler):
    def get(self, shop_id):
        shop = models.Shop.get_by_id(shop_id)
        if not shop:
            return self.send_error(404)
        return self.render("fruitzone/shop.html", context=dict(
                    shop=shop, shop_admin=shop.admin))

class AdminHome(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self):
        self.render("fruitzone/admin_home.html")
class AdminProfile(AdminBaseHandler):
    # @tornado.web.authenticated
    def get(self):
        self.render("fruitzone/admin_profile.html")

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data")
    def post(self):
        action = self.args["action"]
        data = self.args["data"]

        if action == "edit_headimg":
            pass
        elif action == "edit_nickname":
            pass
        elif action == "edit_realname":
            self.current_user.update(realname=data)
        elif action == "edit_wx_username":
            self.current_user.update(wx_username=data)
        elif action == "edit_phone":
            self.current_user.update(phone=data)
        elif action == "edit_email":
            self.current_user.update(email=data)
        elif action == "edit_sex":
            pass
        elif action == "edit_birthday":
            year = data["year"]
            month = data["month"]
            birthday = datetime.datetime(year=year, month=month)
            self.current_user.update(birthday=birthday)
        elif action == "edit_intro":
            self.current_user.update(briefintro=data)
        else:
            return self.send_error(404)

class PhoneVerify(AdminBaseHandler):
    
    def initialize(self, action):
        self._action = action
    
    @tornado.web.authenticated
    def post(self):
        if self._action == "gencode":
            self.handle_gencode()
        elif self._action == "checkcode":
            self.handle_checkcode()
        else:
            return self.send_error(404)
    
    @AdminBaseHandler.check_arguments("phone:str")
    def handle_gencode(self):
        print("gen msg code for phone: ", self.args["phone"])
        return self.send_success()
    
    @AdminBaseHandler.check_arguments("phone:str", "code:int")
    def handle_checkcode(self):
        print("check msg code for phone: {0} with code: {1}".\
              format( self.args["phone"],
                      self.args["code"]))
        return self.send_success()
    
