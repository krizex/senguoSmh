from handlers.base import CustomerBaseHandler
import dal.models as models
import tornado.web
from settings import *
import time
from sqlalchemy import desc, and_
import qiniu

class Access(CustomerBaseHandler):
    def initialize(self, action):
        self._action = action

    def get(self):
        next_url = self.get_argument('next', '')
        if self._action == "login":
            next_url = self.get_argument("next", "")
            return self.render("customer/login.html",
                                 context=dict(next_url=next_url))
        elif self._action == "logout":
            self.clear_current_user()
            return self.redirect(self.reverse_url("customerHome"))
        elif self._action == "oauth":
            self.handle_oauth()
        else:
            return self.send_error(404)

    @CustomerBaseHandler.check_arguments("phone", "password", "next?")
    def post(self):
        u = models.ShopAdmin.login_by_phone_password(self.session, self.args["phone"], self.args["password"])
        if not u:
            return self.send_fail(error_text = "用户名或密码错误")
        self.set_current_user(u, domain=ROOT_HOST_NAME)
        self.redirect(self.args.get("next", self.reverse_url("customerHome")))
        return self.send_success()

    @CustomerBaseHandler.check_arguments("code", "state?", "mode")
    def handle_oauth(self):
        # todo: handle state
        code =self.args["code"]
        mode = self.args["mode"]
        print("mode: ", mode , ", code get:", code)
        if mode not in ["mp", "kf"]:
            return self.send_error(400)

        userinfo = self.get_wx_userinfo(code, mode)
        if not userinfo:
            return self.redirect(self.reverse_url("customerLogin"))
        # 尝试登录
        u = models.Customer.login_by_unionid(self.session, userinfo["unionid"])
        if not u:# 新建用户
            u = models.Customer.register_with_wx(self.session, userinfo)
        self.set_current_user(u, domain=ROOT_HOST_NAME)

        next_url = self.get_argument("next", self.reverse_url("customerHome"))
        return self.redirect(next_url)

class Home(CustomerBaseHandler):
    @tornado.web.authenticated
    def get(self):
        return self.render("customer/home.html", context=dict())

class Market(CustomerBaseHandler):
    @tornado.web.authenticated
    def get(self, shop_id):
        try:shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
        except:return self.send_error(404)
        try:cart = self.session.query(models.Cart).filter_by(id=self.current_user.id, shop_id=shop_id).one()
        except:
            self.session.add(models.Cart(id=self.current_user.id, shop_id=shop_id))
            self.session.commit()
        cart_f, cart_m = self.read_cart(shop_id)
        fruits = [x for x in shop.fruits if x.fruit_type_id != 1000 and x.active == 1].sort(key=lambda f:f.priority)#水果
        dry_fruits = [x for x in shop.fruits if x.fruit_type_id == 1000 and x.active == 1].sort(key=lambda f:f.priority)#干果
        mgoods={}
        for menu in shop.menus:
            mgoods[menu.id] = menu.mgoods.sort(key=lambda f:f.priority)
        return self.render("", context=dict(fruits, dry_fruits, mgoods=mgoods, cart_f=cart_f, cart_m=cart_m))

    @tornado.web.authenticated
    @CustomerBaseHandler.check_arguments("action:int", "charge_type_id:int", "menu_type:int")
    #action==2: +1，action==1: -1, action==0: delete；menu_type==0：fruit，menu_type==1：menu
    def post(self, shop_id):
        inc = self.args["action"]
        charge_type_id = self.args["charge_type_id"]
        menu_type = self.args["menu_type"]
        self.save_cart(charge_type_id, shop_id, inc, menu_type)


class Cart(CustomerBaseHandler):
    @tornado.web.authenticated
    @CustomerBaseHandler.check_arguments("shop_id:int")
    def get(self):
        shop_id = self.args["shop_id"]
        try:shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
        except:return self.send_error(404)
        cart = [cart for cart in self.current_user.carts if cart.shop_id==shop_id]
        if not cart or (cart[0].fruits=="" and cart[0].mgoods==""): #购物车为空
            return self.redirect("")
        cart_f, cart_m = self.read_cart(shop_id)

        periods = [x for x in shop.config.periods if x.active == 1]
        return self.render("", cart_f=cart_f, cart_m=cart_m, periods=periods)

    @tornado.web.authenticated
    @CustomerBaseHandler.check_arguments("shop_id:int", "action:str", "charge_type_id?:int", "data?")
    def post(self):
        action = self.args["action"]
        shop_id = self.args["shop_id"]
        if action == "order":
            data = self.args["data"]
            order =



    def _save_goods(self, data):
        unit = {1:"个", 2:"斤", 3:"份"}
        charge_types = self.session.query(models.ChargeType).\
            filter(models.ChargeType.id.in_(data["fruits"].keys())).all()
        f_d={}
        m_d={}
        for charge_type in charge_types:
            f_d[charge_type.id]={"fruit_name":charge_type.fruit.name, "num":data["fruits"][charge_type.id],
                                 "charge":"%d元/%d%s" % (charge_type.price, charge_type.num, unit[charge_type.unit])}
        mcharge_types = self.session.query(models.MChargeType).\
            filter(models.ChargeType.id.in_(data["fruits"].keys())).all()
        for mcharge_type in mcharge_types:
            m_d[mcharge_type.id]={"mgoods_name":mcharge_type.mgoods.name, "num":data["mgoods"][mcharge_type.id],
                                  "charge":"%d元/%d%s" % (mcharge_type.price, mcharge_type.num, unit[mcharge_type.unit])}
        return f_d, m_d