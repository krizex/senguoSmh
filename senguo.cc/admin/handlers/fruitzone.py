from handlers.base import AdminBaseHandler
import dal.models as models
import tornado.web

class Apply(AdminBaseHandler):
    
    @tornado.web.authenticated
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
        return self.write(self.request.body)

class ShopList(AdminBaseHandler):
    pass

class Shop(AdminBaseHandler):
    pass


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
        return self.send_success
    
