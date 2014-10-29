from handlers.base import AdminBaseHandler
import dal.models as models
import tornado.web

class Home(AdminBaseHandler):
    pass

class ApplySuccess(AdminBaseHandler):
    pass

class ShopApply(AdminBaseHandler):
    
    @tornado.web.authenticated
    def get(self):
        # 判断信息设置是否完全
        u = self.current_user
        if not u.realname or not u.phone or not u.email or\
           not u.wx_username:
            return self.redirect(
                self.reverse_url("fruitzoneAdminProfile"))
        # 返回申请页面
        return self.render("fruitzone/apply.html")
    
    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments(
        "shop_name", ,
        "shop_province", "shop_city", "shop_address_detail",
        "have_offline_entity:bool", "shop_service_areas:list"        
        "shop_intro")
    def post(self):
        #* todo 检查合法性
        self.current_user.add_shop(
            shop_name=self.args["shop_name"],
            shop_province=self.args["shop_province"],
            shop_city = self.args["shop_city"],
            shop_address_detail=self.args["shop_address_detail"],
            have_offline_entity=self.args["have_offline_entity"],
            shop_service_areas=self.args["shop_service_areas"],
            shop_intro=self.args["shop_intro"]
        )
        return self.send_success()

class Shop(AdminBaseHandler):
    pass

class AdminHome(AdminBaseHandler):
    pass

class AdminProfile(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self):
        pass
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
    
