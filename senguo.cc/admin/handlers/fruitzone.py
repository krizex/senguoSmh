from handlers.base import AdminBaseHandler
import dal.models as models
import tornado.web

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
    pass

class AdminHome(AdminBaseHandler):
     def get(self):
            return self.render("fruitzone/admin-home.html")

class AdminProfile(AdminBaseHandler):
    # @tornado.web.authenticated
    def get(self):
        return self.render("fruitzone/admin-profile.html")
    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action")
    def post(self):
        action = self.args["action"]

        if action == "edit_headimg":
            pass
        elif action == "edit_nickname":
            pass
        elif action == "edit_realname":
            pass
        elif action == "edit_wx_username":
            pass
        elif action == "edit_phone":
            pass
        elif action == "edit_email":
            pass
        elif action == "edit_sex":
            pass
        elif action == "edit_birthday":
            pass
        elif action == "edit_intro":
            pass
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
    
