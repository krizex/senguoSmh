from handlers.base import AdminBaseHandler
import dal.models as models
import tornado.web
from  dal.db_configs import DBSession
from sqlalchemy import select
from dal.dis_dict import dis_dict

import datetime, time, random
from libs.msgverify import gen_msg_token,check_msg_token
from libs.alipay import WapAlipay
from settings import subject, seller_account_name, call_back_url, notify_url


class Home(AdminBaseHandler):
    _page_count = 20

    def get(self):
        q = self.session.query(models.Shop).order_by(models.Shop.id)#\
            #.filter(models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED)
        shops = q.all()
        fruit_types = []
        for f_t in self.session.query(models.FruitType).all():
            fruit_types.append(f_t.safe_props())
        return self.render("fruitzone/home.html", context=dict(shops=shops, fruit_types=fruit_types, now=time.time()))
    
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
                                      "city?:int", "service_area?:int", "live_month?:int", "onsalefruit_ids?:list")
    def handle_filter(self):
        # 按什么排序？暂时采用id排序
        q = self.session.query(models.Shop).order_by(models.Shop.id).\
            filter(models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED)
        if "city" in self.args:
            q = q.filter_by(shop_city=self.args["city"])
        if "service_area" in self.args:
            q = q.filter(models.Shop.shop_service_area.op("&")(self.args["service_area"])>0)
        if "live_month" in self.args:
            q = q.filter(models.Shop.shop_start_timestamp < time.time()-self.args["live_month"]*(30*24*60*60))

        if "onsalefruit_ids" in self.args and self.args["onsalefruit_ids"]:
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
            shops.append(shop.safe_props())
        return self.send_success(shops=shops)

    @AdminBaseHandler.check_arguments("q")
    def handle_search(self):
        q = self.session.query(models.Shop).order_by(models.Shop.id).\
            filter(models.Shop.shop_name.like("%{0}%".format(self.args["q"])),
                   models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED)
        shops = []
        for shop in q.all():
            shops.append(shop.safe_props())
        return self.send_success(shops=shops)

class AdminHome(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self):
       # 模板中通过current_user获取当前admin的相关数据，
       # 具体可以查看models.ShopAdmin中的属性
       self.render("fruitzone/admin-home.html")

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "feedback_text")
    def post(self):
        if self.args["action"] == "feedback":
            feedback = models.Feedback(
                text=self.args["feedback_text"],
                create_date_timestamp = int(time.time())
            )
            self.current_user.feedback.append(feedback)
            self.session.commit()
            return self.send_success()
        else:
            return self.send_error(404)

class AdminProfile(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self):
       # 模板中通过current_user获取当前admin的相关数据，
       # 具体可以查看models.ShopAdmin中的属性
       time_tuple = time.localtime(self.current_user.accountinfo.birthday)
       birthday = time.strftime("%Y-%m", time_tuple)
       self.render("fruitzone/admin-profile.html", context=dict(birthday=birthday))

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
            self.current_user.accountinfo.update(session=self.session, realname=data)
        elif action == "edit_wx_username":
            self.current_user.accountinfo.update(session=self.session, wx_username=data)
        elif action == "edit_email":
            self.current_user.accountinfo.update(session=self.session, email=data)
        elif action == "edit_sex":
            self.current_user.accountinfo.update(session=self.session, sex=data)
        elif action == "edit_birthday":
            year = int(data["year"])
            month = int(data["month"])
            try:
                birthday = datetime.datetime(year=year, month=month, day=19)
            except ValueError as e:
                return self.send_fail("月份必须为1~12")
            self.current_user.accountinfo.update(session=self.session, birthday=time.mktime(birthday.timetuple()))
        elif action == "edit_intro":
            if len(data) >= 300:
                self.send_fail("太长了，请控制在300字以内")
            self.current_user.update(session=self.session, briefintro=data)
        else:
            return self.send_error(404)
        return self.send_success()

class ApplySuccess(AdminBaseHandler):
    def get(self):
        return self.render("fruitzone/apply-success.html")
	
class ShopApply(AdminBaseHandler):
    MAX_APPLY_COUNT = 15

    def initialize(self, action):
        self._action = action

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("shop_id?:int")
    def get(self):
        if self._action == "apply":
            if not self.current_user.accountinfo.phone or \
                not self.current_user.accountinfo.email or\
                not self.current_user.accountinfo.wx_username:
                return self.render("fruitzone/apply.html", context=dict(reApply=False,
                    need_complete_accountinfo=True))

            return self.render("fruitzone/apply.html", context=dict(reApply=False))
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
            return self.render("fruitzone/apply.html", context=dict(shop=shop,reApply=True))

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments(
        "shop_name", "shop_id?:int",
        "shop_province:int", "shop_city:int", "shop_address_detail",
        "have_offline_entity:bool", "shop_service_area:int",
        "shop_intro")
    def post(self):
        #* todo 检查合法性

        if self._action == "apply":
            # 这种检查方式效率比较低
            if len(self.current_user.shops) >= self.MAX_APPLY_COUNT:
                return self.send_fail(error_text="您申请的店铺数量超过限制！最多能申请{0}家".format(self.MAX_APPLY_COUNT))
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
            shop.update(session=self.session,shop_name = self.args["shop_name"])
            shop.update(session=self.session,shop_province = self.args["shop_province"])
            shop.update(session=self.session,shop_city = self.args["shop_city"])
            shop.update(session=self.session,shop_address_detail = self.args["shop_address_detail"])
            shop.update(session=self.session,have_offline_entity = self.args["have_offline_entity"])
            shop.update(session=self.session,shop_service_area = self.args["shop_service_area"])
            shop.update(session=self.session,shop_intro = self.args["shop_intro"])
            shop.update(session=self.session,shop_status = models.SHOP_STATUS.APPLYING)
            return self.send_success()

class Shop(AdminBaseHandler):
    def get(self,id):
        try:
            shop = self.session.query(models.Shop).filter_by(id=id).one()
        except:
            shop = None
        if not shop:
            return self.send_error(404)
        time_tuple = time.localtime(shop.admin.accountinfo.birthday)
        birthday = time.strftime("%Y-%m", time_tuple)
        return self.render("fruitzone/shop.html", context=dict(
                    shop=shop, shop_admin=shop.admin, birthday=birthday, edit=False))

    #收藏店铺
    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("shop_id:int")
    def post(self,shop_id):
        try:
            shop = self.session.query(models.Shop).filter_by(id = shop_id).one()
        except:
            return self.send_error(404)
        self.current_user.shops_collect.append(shop)
        self.session.commit()
        return self.send_success()


class AdminShops(AdminBaseHandler):
   @tornado.web.authenticated
   def get(self):
       return self.render("fruitzone/shops.html", context=dict(shops=self.current_user.shops,collect=False))

class AdminShopsCollect(AdminBaseHandler):
   @tornado.web.authenticated
   def get(self):
       return self.render("fruitzone/shops.html", context=dict(shops=self.current_user.shops_collect,collect=True))

class AdminShop(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self,id):
        try:
            shop = self.session.query(models.Shop).filter_by(id=id).one()
        except:
            shop = None
        if not shop:
            return self.send_error(404)
        fruit_types = []
        for f_t in self.session.query(models.FruitType).all():
            fruit_types.append(f_t.all_props())

        time_tuple = time.localtime(shop.admin.accountinfo.birthday)
        birthday = time.strftime("%Y-%m", time_tuple)

        return self.render("fruitzone/shop.html", context=dict(shop=shop, edit=True, birthday=birthday,
                                                               fruit_types=fruit_types, now=time.time()))

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data")
    def post(self,shop_id):
        action=self.args["action"]
        data=self.args["data"]
        shop = models.Shop.get_by_id(self.session, shop_id)

        if action == "edit_shop_url":
            shop.update(session=self.session, shop_url=data)
        elif action == "edit_live_month":
            year = int(data["year"])
            month = int(data["month"])
            try:
                shop_start_timestamp = datetime.datetime(year=year, month=month, day=1)
            except ValueError:
                return self.send_fail("月份必须为1~12")
            shop.update(session=self.session, shop_start_timestamp=time.mktime(shop_start_timestamp.timetuple()))
            return self.send_success(now=time.time(),shop_start_timestamp=time.mktime(shop_start_timestamp.timetuple()))
        elif action == "edit_total_users":
            shop.update(session=self.session, total_users=int(data))
        elif action == "edit_daily_sales":
            shop.update(session=self.session, daily_sales=int(data))
        elif action == "edit_single_stock_size":
            shop.update(session=self.session, single_stock_size=int(data))
        elif action == "edit_shop_intro":
            if len(data) > 568:
                return self.send_fail("字数超出了568个")
            shop.update(session=self.session, shop_intro=data)
        elif action == "edit_onsale_fruits":
            shop.onsale_fruits = []
            for fruit_id in data:
                fruit_type = self.session.query(models.FruitType).filter_by(id = fruit_id).one()
                shop.onsale_fruits.append(fruit_type)
            self.session.commit()
        elif action == "edit_demand_fruits":
            shop.demand_fruits=[]
            for fruit_id in data:
                fruit_type = self.session.query(models.FruitType).filter_by(id = fruit_id).first()
                shop.demand_fruits.append(fruit_type)
            self.session.commit()
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
        gen_msg_token(wx_id=self.current_user.accountinfo.wx_unionid, phone=self.args["phone"])
        return self.send_success()

    @AdminBaseHandler.check_arguments("phone:str", "code:int","password")
    def handle_checkcode(self):
        if not check_msg_token(wx_id=self.current_user.accountinfo.wx_unionid, code=self.args["code"]):
           return self.send_fail(error_text="验证码过期或者不正确")
        self.current_user.accountinfo.update(self.session, phone=self.args["phone"],password=self.args["password"])
        return self.send_success()

class AdminSystemPurchase(AdminBaseHandler):
    """后台购买相关页面"""
    def initialize(self, action):
        self._action == action

    @tornado.web.authenticated
    def get(self):
        if self._action == "chooseChargeType":
            return self.render("fruitzone/admin-choose-charge-type.html")
        elif self._action == "getChargeDetail":
            return self.get_charge_detail()
        else:
            return self.send_error(404)

    @tornado.web.authenticated
    def post(self):
        if self._action == "getChargeDetail":
            return self.handle_confirm_payment()
    
    @AdminBaseHandler.check_arguments("charge_type:int", "pay_type")
    def handle_confirm_payment(self):
        if self.args["pay_type"] == "wx":
            # 判断charge_type合法性，不合法从新返回接入申请页
            # 创建订单，跳转到支付宝支付页
            pass


    @AdminBaseHandler.check_arguments("charge_type:int")
    def get_charge_detail(self):
        # 判断charge_type合法性，不合法从新返回接入申请页
        # 获取商品数据，返回render
        pass
    
    
        













class Order(AdminBaseHandler):
    def get(self):
        pass

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "fee:int")
    def post(self):

        if self.args["fee"] == 1:
            total_fee = "588"
        elif self.args["fee"] == 2:
            total_fee = "988"
        elif self.args["fee"] == 3:
            total_fee = "1788"

        count = 0
        try:
            q = self.session.query(models.Shop).order_by(models.Shop.id).first()
            count = q.count
        except:
            count = 0
        out_trade_no = time.strftime("%Y%m%d%H%M%S", time.gmtime())+self.args["fee"]+str(count)

        # todo out_user 在模块里没传进去
        out_user = ""  #买家在商户系统的唯一标识。当该买家支付成功一次后,再次支付金额在 30 元内时,不需要再次输入密码。
        merchant_url = "http://www.senguo.cc.monklof.com/merchant"#操作中断返回地址
        pay_expire = "3600"#交易自动关闭时间（分钟）


        order = models.Order()
        order.out_trade_no = out_trade_no
        order.subject
        order.total_fee

        alipay = WapAlipay(pid="2088511484939521",key="oknunsvpq83x358worr6obs7zo2h1xxw",seller_email="senguo@senguo.cc")
        url = alipay.create_direct_pay_by_user_url(
            out_trade_no=out_trade_no, 
            subject=subject,
            total_fee=total_fee,
            seller_account_name=seller_account_name,
            call_back_url=call_back_url, 
            notify_url=notify_url)
        print(url)
        self.redirect(url)
