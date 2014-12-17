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
            return self.render("admin/login.html",
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
        return self.render("", context=dict())
    @tornado.web.authenticated
    @CustomerBaseHandler.check_arguments("action", "data")
    def post(self):
        action = self.args["action"]
        data = self.args["data"]
        if action == "add_address":
            address = models.Address(customer_id=self.current_user.id,
                                     phone=data["phone"],
                                     receiver=data["receiver"],
                                     address_text=data["address_text"])
            self.session.add(address)
            self.session.commit()
            return self.send_success(address_id=address.id)
        elif action == "edit_address":
            address = next((x for x in self.current_user.addresses if x.id == int(data["address_id"])), None)
            if not address:
                return self.send_fail("修改地址失败", 403)
            address.update(session=self.session, phone=data["phone"],
                           receiver=data["receiver"],
                           address_text=data["address_text"])
        elif action == "del_address":
            try: q = self.session.query(models.Address).filter_by(id=int(data["address_id"]))
            except:return self.send_error(404)
            q.delete()
            self.session.commit()
        return self.send_success()

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
        fruits = [x for x in shop.fruits if x.fruit_type_id != 1000 and x.active == 1]
        fruits.sort(key=lambda f:f.priority, reverse=True)#水果
        dry_fruits = [x for x in shop.fruits if x.fruit_type_id == 1000 and x.active == 1]
        dry_fruits.sort(key=lambda f:f.priority, reverse=True)#干果
        mgoods={}
        for menu in shop.menus:
            mgoods[menu.id] = menu.mgoods.sort(key=lambda f:f.priority)
        return self.render("customer/home.html", context=dict(fruits=fruits, dry_fruits=dry_fruits,
                                                              mgoods=mgoods, cart_f=cart_f, cart_m=cart_m,subpage='home'))

    @tornado.web.authenticated
    @CustomerBaseHandler.check_arguments("action:int", "charge_type_id:int", "menu_type:int")
    #action==2: +1，action==1: -1, action==0: delete；menu_type==0：fruit，menu_type==1：menu
    def post(self, shop_id):
        inc = self.args["action"]
        charge_type_id = self.args["charge_type_id"]
        menu_type = self.args["menu_type"]
        self.save_cart(charge_type_id, shop_id, inc, menu_type)
        return self.send_success()


class Cart(CustomerBaseHandler):
    @tornado.web.authenticated
    def get(self,shop_id):
        shop_id = int(shop_id)
        try:shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
        except:return self.send_error(404)
        cart = [x for x in self.current_user.carts if x.shop_id==shop_id]
        if not cart or (cart[0].fruits=="" and cart[0].mgoods==""): #购物车为空
            return self.render("notice/cart-empty.html",context=dict(subpage='cart'))
        cart_f, cart_m = self.read_cart(shop_id)

        periods = [x for x in shop.config.periods if x.active == 1]
        return self.render("customer/cart.html", cart_f=cart_f, cart_m=cart_m, periods=periods,context=dict(subpage='cart'))

    @tornado.web.authenticated
    @CustomerBaseHandler.check_arguments("fruits", "mgoods", "pay_type:int", "period_id:int",
                                         "address_id:int", "message:str", "type:int",
                                         "today:int")
    def post(self,shop_id):#提交订单
        fruits = self.args["fruits"]
        mgoods = self.args["mgoods"]
        unit = {1:"个", 2:"斤", 3:"份"}
        f_d={}
        m_d={}
        totalPrice=0
        if fruits:
            charge_types = self.session.query(models.ChargeType).\
                filter(models.ChargeType.id.in_(fruits.keys())).all()
            for charge_type in charge_types:
                totalPrice += charge_type.price*fruits[charge_type.id] #计算订单总价
                charge_type.fruit.storage -= fruits[charge_type.id]*charge_type.unit_num #更新库存
                f_d[charge_type.id]={"fruit_name":charge_type.fruit.name, "num":fruits[charge_type.id],
                                     "charge":"%d元/%d%s" % (charge_type.price, charge_type.num, unit[charge_type.unit])}
        if mgoods:
            mcharge_types = self.session.query(models.MChargeType).\
                filter(models.ChargeType.id.in_(mgoods.keys())).all()
            for mcharge_type in mcharge_types:
                totalPrice+=mcharge_type.price*mgoods[mcharge_type.id]
                mcharge_type.mgoods.storage -= mgoods[mcharge_type.id]*mcharge_type.unit_num #更新库存
                m_d[mcharge_type.id]={"mgoods_name":mcharge_type.mgoods.name, "num":mgoods[mcharge_type.id],
                                      "charge":"%d元/%d%s" % (mcharge_type.price, mcharge_type.num, unit[mcharge_type.unit])}

        money_paid = False
        pay_type = 1
        if self.args["pay_type"] == 2:
            if self.current_user.balance >= totalPrice:
                self.current_user.balance -= totalPrice
                self.current_user.credits += totalPrice
                self.session.commit()
                money_paid = True
                pay_type = 2
            else:return self.send_fail("余额不足")
        start_time = 0
        end_time = 0
        if self.args["type"] == 2: #按时达
            try:period = self.session.query(models.Period).filter_by(id=self.args["period_id"]).one()
            except:return self.send_fail("找不到时间段")
            start_time = period.start_time
            end_time = period.end_time
        address = next((x for x in self.current_user.addresses if x.id == self.args["address_id"]), None)
        if not address:
            return self.send_fail("没找到地址", 404)
        order = models.Order(customer_id=self.current_user.id,
                             shop_id=int(shop_id),
                             phone=address.phone,
                             receiver=address.receiver,
                             address_text = address.address_text,
                             message=self.args["message"],
                             type=self.args["type"],
                             totalPrice=totalPrice,
                             money_paid=money_paid,
                             pay_type=pay_type,
                             today=self.args["today"],#1:今天；2：明天
                             start_time=start_time,
                             end_time=end_time,
                             fruits=str(f_d),
                             mgoods=str(m_d))
        self.session.add(order)
        self.session.commit()
        return self.send_success()



