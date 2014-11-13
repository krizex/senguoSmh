from handlers.base import AdminBaseHandler
import dal.models as models
import tornado.web
from  dal.db_configs import DBSession
from sqlalchemy import select
from dal.dis_dict import dis_dict

import datetime, time, random
from libs.msgverify import gen_msg_token,check_msg_token
from libs.alipay import WapAlipay
from settings import ALIPAY_PID, ALIPAY_KEY, ALIPAY_SELLER_ACCOUNT, ALIPAY_HANDLE_HOST
from libs.utils import Logger
import libs.xmltodict as xmltodict

class Home(AdminBaseHandler):
    _page_count = 20

    def get(self):
        q = self.session.query(models.Shop).order_by(models.Shop.id)\
            .filter(models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED)
        shops = q.all()
        fruit_types = []
        for f_t in self.session.query(models.FruitType).all():
            fruit_types.append(f_t.safe_props())
        return self.render("fruitzone/home.html", context=dict(shops=shops, fruit_types=fruit_types, now=time.time(),subpage="home"))
    
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
                   models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED
                   )
        shops = []
        for shop in q.all():
            shops.append(shop.safe_props())
        return self.send_success(shops=shops)

class Community(AdminBaseHandler):
    def get(self):
       return self.render("fruitzone/community.html",context=dict(subpage="cummunity"))

class AdminHome(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self):
       # 模板中通过current_user获取当前admin的相关数据，
       # 具体可以查看models.ShopAdmin中的属性
       self.render("fruitzone/admin-home.html",context=dict(subpage="adminHome"))

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
        action = self.args["action"]
        data = self.args["data"]
        shop = models.Shop.get_by_id(self.session, shop_id)
        #如果该店铺不属于该用户，禁止修改
        if shop not in self.current_user.shops:
            return self.send_error(403)
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

class SystemPurchase(AdminBaseHandler):
    """后台购买相关页面"""
    def initialize(self, action):
        self._action = action

    @tornado.web.authenticated
    def get(self):
        if self._action == "home":
            if self.current_user.role == models.SHOPADMIN_ROLE_TYPE.SYSTEM_USER:
                # 已经是系统用户
                return self.redirect(
                    self.reverse_url("fruitzoneSystemPurchaseSystemAccount"))
            else:
                return self.redirect(
                    self.reverse_url("fruitzoneSystemPurchaseChargeTypes"))
        elif self._action == "chargeTypes":
            charge_types = self.session.query(models.ChargeType).\
                           order_by(models.ChargeType.id).all()
            return self.render("fruitzone/systempurchase-chargetypes.html",
                               context=dict(charge_types=charge_types))
        elif self._action == "chargeDetail":
            # 判断charge_type合法性，不合法从新返回接入申请页
            try:
                charge_type_id = int(self.get_argument("charge_type"))
            except:
                return self.write("抱歉，此商品不存在呵呵(#‵′)凸")
            charge_type = models.ChargeType.get_by_id(
                self.session, charge_type_id)
            if not charge_type:
                return self.write("抱歉，此商品不存在呵呵(#‵′)凸")
            return self.render("fruitzone/systempurchase-chargedetail.html", 
                               context=dict(charge_type=charge_type))
        elif self._action == "dealFinishedCallback":
            return self.handle_deal_finished_callback()
        elif self._action == "history":
            orders = self.current_user.success_orders(self.session)
            return self.render("fruitzone/systempurchase-history.html", 
                               context=dict(orders=orders, subpage="history"))
        elif self._action == "systemAccount":
            return self.render("fruitzone/systempurchase-systemaccount.html", context=dict(subpage="account"))
        else:
            return self.send_error(404)

    @AdminBaseHandler.check_arguments("sign", "result", "out_trade_no", 
                                      "trade_no", "request_token")
    def handle_deal_finished_callback(self):
        # 检查是否合法
        sign = self.args.pop("sign")
        signmethod = self._alipay.getSignMethod()
        if signmethod(self.args) != sign:
            Logger.warn("SystemPurchase: sign from alipay error!")
            return self.send_error(403)
        # 创建成功订单记录
        o = self.current_user.finish_order(
            self.session,
            order_id=int(self.args["out_trade_no"]),
            ali_trade_no=self.args["trade_no"])
        if not o:
            print("tmp order not found!")
            return self.write("交易已完成或不存在!")
        # 重定向到支付成功页面
        return self.redirect(
            "{0}#{1}".format(
                self.reverse_url("fruitzoneSystemPurchaseHistory"),
                o.order_id)
        )

    def post(self):
        if self._action == "dealNotify":
            return self.handle_deal_notify()
        if not self.current_user:
            return self.send_error(403)

        if self._action == "chargeDetail":
            return self.handle_confirm_payment()
        else:
            return self.send_error(404)
    
    @AdminBaseHandler.check_arguments("charge_type:int", "pay_type")
    def handle_confirm_payment(self):
        if self.args["pay_type"] == "alipay":
            # 判断charge_type合法性，不合法从新返回接入申请页
            charge_data = models.ChargeType.get_by_id(self.session, self.args["charge_type"])
            if not charge_data:
                return self.send_fail(error_text="抱歉，此商品不存在呵呵(#‵′)凸")
            # 创建临时订单，跳转到支付宝支付页
            try:
                url = self._create_tmporder_url(charge_data)
            except Exception as e:
                Logger.error("System Purchase: get auth url failed!", e)
                return self.send_fail(error_text="系统繁忙，请稍后重试")
            return self.redirect(url)

    @AdminBaseHandler.check_arguments(
        "service", "v","sec_id","sign","notify_data")
    def handle_deal_notify(self):
        # 验证签名
        sign = self.args.pop("sign")
        signmethod = self._alipay.getSignMethod(**self.args)
        if signmethod(self.args) != sign:
            Logger.warn("SystemPurchase Notify: sign from alipay error!")
            return self.send_error(403)        
        # # 验证notify_id是否存在, 这部分是否需要做？
        # if not self._alipay.verify_notify(**self.args):
        #     Logger.warn("Purchase Notify: notify check illegal!")
        #     return self.send_error(403)
        notify_data = xmltodict.parse(self.args["notify_data"])["notify"]
        # 判断该notify是否已经被处理，已处理直接返回success，未处理填补信息
        
        o = models.SystemOrder.update_notify_data(
            self.session, 
            order_id=int(notify_data["out_trade_no"]),
            notify_data=notify_data)
        if not o:
            Logger.error("SystemPurchase Notify Fatal Error: order not found!")
            return self.write("fail")
        return self.write("success")
    
    _alipay = WapAlipay(pid=ALIPAY_PID, key=ALIPAY_KEY, seller_email=ALIPAY_SELLER_ACCOUNT)
    def _create_tmporder_url(self, charge_data):
        # 创建临时订单
        # TODO: 订单失效时间与清除
        tmp_order = self.current_user.add_tmp_order(self.session, charge_data)
        authed_url = self._alipay.create_direct_pay_by_user_url(
            out_trade_no=str(tmp_order.order_id),
            subject = tmp_order.charge_good_name,
            total_fee = tmp_order.charge_price,
            seller_account_name = ALIPAY_SELLER_ACCOUNT,
            call_back_url= "%s%s"%(ALIPAY_HANDLE_HOST, self.reverse_url("fruitzoneSystemPurchaseDealFinishedCallback")),
            notify_url="%s%s"%(ALIPAY_HANDLE_HOST, self.reverse_url("fruitzoneSystemPurchaseDealNotify")),
            merchant_url="%s%s"%(ALIPAY_HANDLE_HOST, self.reverse_url("fruitzoneSystemPurchaseChargeTypes"))
        )
        return authed_url

    def check_xsrf_cookie(self):
        if self._action == "dealNotify":
            Logger.info("SystemPurchase: it's a notify post from alipay, pass xsrf cookie check")
            return True
        return super().check_xsrf_cookie()
        
        
    def _check_info_complete(self):
        u = self.current_user
        
        if not u.accountinfo.email or not u.accountinfo.phone or \
           not u.accountinfo.wx_username or not len(u.shops):
            return False
        
        return True
            
        
