from handlers.base import AdminBaseHandler
import dal.models as models
import tornado.web
from  dal.db_configs import DBSession
from sqlalchemy import select
from dal.dis_dict import dis_dict

import datetime,time
from libs.msgverify import gen_msg_token,check_msg_token


class Home(AdminBaseHandler):
    _page_count = 20

    def get(self):
        q = self.session.query(models.Shop).order_by(models.Shop.id).\
            filter(models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED)
        shops = q.all()
        return self.render("fruitzone/home.html", context=dict(shops=shops))
    
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
                                      "city?:int", "service_area?:int", "live_month?:int", "onsalefruit_ids:list")
    def handle_filter(self):
        # 按什么排序？暂时采用id排序
        q = self.session.query(models.Shop).order_by(models.Shop.id).\
            filter(models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED)
        if "city" in self.args:
            q = q.filter_by(shop_city=self.args["city"])
        if "service_area" in self.args:
            # 目前只支持服务区域完全匹配
            q = q.filter_by(shop_service_area=self.args["service_area"])
        if "live_month" in self.args:
            q = q.filter(models.Shop.live_month>self.args["live_month"])

        if "onsalefruit_ids" in self.args:
            q = q.filter(models.Shop.id.in_(
                select([models.ShopOnsalefruitLink.shop_id]).\
                where(models.ShopOnsalefruitLink.fruit_id.in_(
                    self.args["onsalefruit_ids"]))
            ))
        
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

    @AdminBaseHandler.check_arguments("q")
    def handle_search(self):
        q = self.session.query(models.Shop).order_by(models.Shop.id).\
            filter(models.Shop.shop_name.like("%{0}%".format(self.args["q"])),
                   models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED)
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

    @tornado.web.authenticated
    def post(self):
        feedback = models.Feedback()
        feedback.text = self.args["feedback"]
        self.current_user.feedback.append(feedback)
        return self.send_success()

class AdminProfile(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self):
       # 模板中通过current_user获取当前admin的相关数据，
       # 具体可以查看models.ShopAdmin中的属性
       self.render("fruitzone/admin-profile.html")

    # @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data")
    def post(self):
        action = self.args["action"]
        data = self.args["data"]

        if action == "edit_headimg":
            pass
        elif action == "edit_nickname":
            pass
        elif action == "edit_realname":
            self.current_user.update(session=self.session, realname=data)
        elif action == "edit_wx_username":
            self.current_user.update(session=self.session, wx_username=data)
        elif action == "edit_phone":
            self.current_user.update(session=self.session, phone=data)
        elif action == "edit_email":
            self.current_user.update(session=self.session, email=data)
        elif action == "edit_sex":
            pass
        elif action == "edit_birthday":
            year = int(data["year"])
            month = int(data["month"])
            birthday = datetime.datetime(year=year, month=month, day=19)
            self.current_user.update(birthday=time.mktime(birthday.timetuple()))
        elif action == "edit_intro":
            self.current_user.update(session=self.session, briefintro=data)
        else:
            return self.send_error(404)
        return self.send_success()

class ApplySuccess(AdminBaseHandler):
    def get(self):
        return self.render("fruitzone/apply-success.html")

class ShopApply(AdminBaseHandler):
    def initialize(self, action):
        self._action = action

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("shop_id?:int")
    def get(self):
        if self._action == "apply":
            return self.render("fruitzone/apply.html")
        elif self._action == "reApply":
            if not "shop_id" in self.args:
                return  self.send_error(404)
            shop_id = self.args["shop_id"]
            try:
                shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
            except:
                shop = None
            if not shop:
                return self.send_error(404)
            return self.render("fruitzone/apply.html", context=dict(shop=shop))

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments(
        "shop_name", "shop_id?:int",
        "shop_province:int", "shop_city:int", "shop_address_detail",
        "have_offline_entity:bool", "shop_service_area:int",
        "shop_intro")
    def post(self):
        #* todo 检查合法性

        if self._action == "apply":
            try:
               self.current_user.add_shop(self.session,
                  shop_name=self.args["shop_name"],
                  shop_province=self.args["shop_province"],
                  shop_city = self.args["shop_city"],
                  shop_address_detail=self.args["shop_address_detail"],
                  have_offline_entity=self.args["have_offline_entity"],
                  shop_service_area=self.args["shop_service_area"],
                  shop_intro=self.args["shop_intro"]
               )
            except DistrictCodeError as e:
               return self.send_fail(error_text = "城市编码错误！")
            return self.send_success()

        elif self._action == "reApply":
            if not "shop_id" in self.args:
                return  self.send_error(404)
            shop_id = self.args["shop_id"]
            try:
                shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
            except:
                shop = None
            if not shop:
                return self.send_error(404)
            shop.shop_name = self.args["shop_name"],
            shop.shop_province = self.args["shop_province"],
            shop.shop_city = self.args["shop_city"],
            shop.shop_address_detail = self.args["shop_address_detail"],
            shop.have_offline_entity = self.args["have_offline_entity"],
            shop.shop_service_area = self.args["shop_service_area"],
            shop.shop_intro = self.args["shop_intro"]
            shop.shop_status = models.SHOP_STATUS.APPLYING
            self.session.add(shop)
            self.seeeion.commit()

class Shop(AdminBaseHandler):
    def get(self,id):
        try:
            shop = self.session.query(models.Shop).filter_by(id=id).one()
        except:
            shop = None
        if not shop:
            return self.send_error(404)
        time_tuple = time.localtime(shop.admin.birthday)
        birthday = time.strftime("%Y-%m", time_tuple)
        return self.render("fruitzone/shop.html", context=dict(
                    shop=shop, shop_admin=shop.admin, birthday=birthday, edit=False))


class AdminShops(AdminBaseHandler):
   @tornado.web.authenticated
   def get(self):
       return self.render("fruitzone/shops.html", context=dict(shops=self.current_user.shops))

class AdminShop(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self,id):
        try:
            shop = self.session.query(models.Shop).filter_by(id=id).one()
        except:
            shop = None
        if not shop:
            return self.send_error(404)
        return self.render("fruitzone/shop.html", context=dict(shop=shop,edit=True))

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data", "shop_id")
    def post(self):
        action=self.args["action"]
        data=self.args["data"]
        shop_id=self.args["shop_id"]
        shop = models.Shop.get_by_id(self.session, shop_id)

        if action == "edit_shop_url":
            shop.update(session=self.session, shop_url=data)
        elif action == "edit_live_month":
            shop.update(session=self.session, live_month=int(data))
        elif action == "edit_total_users":
            shop.update(session=self.session, total_users=int(data))
        elif action == "edit_daily_sales":
            shop.update(session=self.session, daily_sales=int(data))
        elif action == "edit_single_stock_size":
            shop.update(session=self.session, single_stock_size=int(data))
        elif action == "edit_shop_intro":
            shop.update(session=self.session, shop_intro=data)
        elif action == "edit_onsale_fruits":
            for fruit_id in data:
                fruit_type = self.session.query(models.FruitType).filter(id == fruit_id).one()
                shop.onsale_fruits.append(fruit_type)
        elif action == "edit_demand_fruits":
            for fruit_id in data:
                fruit_type = self.session.query(models.FruitType).filter(id == fruit_id).one()
                shop.demand_fruits.append(fruit_type)
        else:
            return self.send_error(404)
        return self.send_success()

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
        gen_msg_token(wx_id=self.current_user.wx_unionid, phone=self.args["phone"])
        return self.send_success()

    @AdminBaseHandler.check_arguments("phone:str", "code:int")
    def handle_checkcode(self):
        print("check msg code for phone: {0} with code: {1}".\
              format( self.args["phone"],
                      self.args["code"]))
        if not check_msg_token(wx_id=self.current_user.wx_unionid, code=self.args["code"]):
           return send_fail(error_text="验证码过期或者不正确")
        return self.send_success()
    
