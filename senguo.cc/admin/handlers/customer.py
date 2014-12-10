from handlers.base import CustomerBaseHandler
import dal.models as models
import tornado.web
from settings import *
import time
from sqlalchemy import and_, or_
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
    @CustomerBaseHandler.check_arguments("action", "id?:int")
    def get(self,id):
        try:shop = self.session.query(models.Shop).filter_by(id=id).one()
        except:return self.send_error(404)
        if "id" not in self.args.keys():

        action = self.args["action"]
        id = self.args["id"]
        if action == "fruit":
            fruits=[]
            for fruit in shop.fruits:
                if fruit.fruit_type_id != 1000:#干果id
                fruits.append(fruit)
            re
    def save_cart(self, fruits, mgoodses):
        fruits_str=""
        for fruit in fruits:
            fruits_str += "%d:%d:%d " % (fruit["fruit_id"], fruit["charge_type_id"], fruit["num"])
        mgoodses_str=""
        for mgoods in mgoodses:
            mgoodses_str += "%d:%d:%d " % (mgoods["mgoods_id"], fruit["mcharge_type_id"], fruit["num"])
        fruits_str = fruits_str.rstrip()
        mgoodses_str = mgoodses_str.rstrip()
        try:cart = self.session.query(models.Cart).filter_by(id=self.current_user.id).one()
        except:cart=None
        if not cart:
            self.session.add(models.Cart(id=self.current_user.id,
                                            fruits=fruits_str,mgoods=mgoodses_str))
        else:
            cart.fruits = fruits_str
            cart.mgoods = mgoodses_str
            self.session.add(cart)
            self.session.commit()
    def read_cart(self, id):
        try:cart = self.session.query(models.Cart).filter_by(id=id).one()
        except:return None
        fruits ＝ cart.fruits.split(' ')
        mgoodses = cart.mgoodses.split(' ')
        fs=[]
        ms=[]
        for fruit in fruits:
            f=fruit.split(":")
            d={}
            d["fruit_id"]=f[0]
            d["charge_type_id"]=f[1]
            d["num"]=f[2]
            fs.append(d)
        for mgoods in mgoodses:
            m=mgoods.split(":")
            d={}
            d["mgoods_id"]=m[0]
            d["mcharge_type_id"]=m[1]
            d["num"]=m[2]
            ms.append(d)
        return fs,ms