from handlers.base import AdminBaseHandler
import dal.models as models
import tornado.web
from  dal.db_configs import DBSession
from dal.models import Shop, ShopAdmin

import datetime

class Home(AdminBaseHandler):
    _page_count = 20

    def get(self):
        return self.render("fruitzone/home.html")
    
    @AdminBaseHandler.check_arguments("action")
    def post(self):
        action = self.args["action"]
        if action == "filter":
            return self.handle_filter()
        elif action == "search":
            return self.handle_search()
        else:
            return self.send_error(403)
    @AdminBaseHandler.check_arguments("skip?:int","limit?:int",
                                      "city?:int", "service_area?:int", "live_month?:int")
    def handle_filter(self):
        # 按什么排序？暂时采用id排序
        q = self.session.query(models.Shop).order_by(models.Shop.id)
        if "city" in self.args:
            q = q.filter_by(shop_city=self.args["city"])
        if "service_area" in self.args:
            # 目前只支持服务区域完全匹配
            q = q.filter_by(shop_service_area=self.args["service_area"])
        if "live_month" in self.args:
            q = q.filter(models.Shop.live_month>self.args["live_month"])
        
        if "skip" in self.args:
            q = q.offset(self.args["skip"])
        
        if "limit" in self.args:
            q = q.limit(self.args["limit"])
        else:
            q = q.limit(self._page_count)

        shops = []
        for shop in q.all():
            shops.append(shop.safe_props)
        return self.send_success(shops=shops)
class AdminHome(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self):
       # 模板中通过current_user获取当前admin的相关数据，
       # 具体可以查看models.ShopAdmin中的属性
       self.render("fruitzone/admin-home.html")
class AdminProfile(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self):
       # 模板中通过current_user获取当前admin的相关数据，
       # 具体可以查看models.ShopAdmin中的属性
       self.render("fruitzone/admin-profile.html")

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
            year = int(data["year"])
            month = int(data["month"])
            birthday = datetime.datetime(year=year, month=month, day=19)
            self.current_user.update(birthday=birthday)
        elif action == "edit_intro":
            self.current_user.update(briefintro=data)
        else:
            return self.send_error(404)
        return self.send_success()

class ApplySuccess(AdminBaseHandler):
    def get(self):
        return self.render("fruitzone/apply-success.html")

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
        "shop_name",
        "shop_province:int", "shop_city:int", "shop_address_detail",
        "have_offline_entity:bool", "shop_service_areas:list"        
        "shop_intro")
    def post(self):
        #* todo 检查合法性
        try:
           self.current_user.add_shop(
              shop_name=self.args["shop_name"],
              shop_province=self.args["shop_province"],
              shop_city = self.args["shop_city"],
              shop_address_detail=self.args["shop_address_detail"],
              have_offline_entity=self.args["have_offline_entity"],
              shop_service_areas=self.args["shop_service_areas"],
              shop_intro=self.args["shop_intro"]
           )
        except DistrictCodeError as e:
           return self.send_fail(error_text = "城市编码错误！")
        return self.send_success()

class Shop(AdminBaseHandler):
    def get(self, shop_id):
        shop = models.Shop.get_by_id(shop_id)
        if not shop:
            return self.send_error(404)
        return self.render("fruitzone/shop.html", context=dict(
                    shop=shop, shop_admin=shop.admin))


class AdminShops(AdminBaseHandler):
   pass

class AdminShop(AdminBaseHandler):
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
        return self.send_success()
    
