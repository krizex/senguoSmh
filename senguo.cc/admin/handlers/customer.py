from handlers.base import CustomerBaseHandler
import dal.models as models
import tornado.web
from settings import *
import datetime, time
from sqlalchemy import desc, and_, or_
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
        count = {3: 0, 4: 0, 5: 0, 6: 0}  # 3:未处理 4:待收货，5：已送达，6：售后订单
        for order in self.current_user.orders:
            if order.status == 1:
                count[3] += 1
            elif order.status in (2, 3, 4):
                count[4] += 1
            elif order.status in (5, 6):
                count[5] += 1
            elif order.status == 10:
                count[6] += 1
        return self.render("customer/personal-center.html", count=count, context=dict(subpage='center'))
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

class ShopProfile(CustomerBaseHandler):
    @tornado.web.authenticated
    def get(self, shop_id):
        self.set_cookie("market_shop_id", shop_id)
        shop = self.session.query(models.Shop).filter_by(id=shop_id).first()
        if not shop:
            return self.send_error(404)
        #是否关注判断
        follow = True
        if not self.session.query(models.CustomerShopFollow).filter_by(
                customer_id=self.current_user.id, shop_id=shop_id).first():
            follow = False
        operate_days = (datetime.datetime.now() - datetime.datetime.fromtimestamp(shop.create_date_timestamp)).days
        fans_sum = self.session.query(models.CustomerShopFollow).filter_by(shop_id=shop_id).count()
        order_sum = self.session.query(models.Order).filter_by(shop_id=shop_id).count()
        goods_sum = self.session.query(models.Fruit).filter_by(shop_id=shop_id, active=1).count() + \
                    self.session.query(models.MGoods).join(models.Menu).filter(
                        models.Menu.shop_id == shop_id, models.Menu.active == 1).count()
        address = self.code_to_text("shop_city", shop.shop_city) + " " + shop.shop_address_detail
        service_area = self.code_to_text("service_area", shop.shop_service_area)
        staffs = self.session.query(models.HireLink).filter_by(shop_id=shop_id).all()
        shop_members_id = [shop.admin_id]+[x.staff_id for x in staffs]
        headimgurls = self.session.query(models.Accountinfo.headimgurl).filter(models.Accountinfo.id.in_(shop_members_id)).all()
        return self.render("customer/shop-info.html", shop=shop, follow=follow, operate_days=operate_days, fans_sum=fans_sum, order_sum=order_sum,
                           goods_sum=goods_sum, address=address, service_area=service_area, headimgurls=headimgurls,
                           comments=self.get_comments(shop_id, page_size=2), context=dict(subpage='shop'))

    @tornado.web.authenticated
    def post(self, shop_id):
        shop_id = self.get_cookie("market_shop_id")
        self.session.add(models.CustomerShopFollow(customer_id=self.current_user.id, shop_id=shop_id))
        self.session.commit()
        return self.send_success()

class Members(CustomerBaseHandler):
    def get(self):
        shop_id = int(self.get_cookie("market_shop_id"))
        admin_id = self.session.query(models.Shop.admin_id).filter_by(id=shop_id).first()
        if not admin_id:
            return self.send_error(404)
        admin_id = admin_id[0]
        members = self.session.query(models.Accountinfo, models.HireLink.work).filter(
            models.HireLink.shop_id == shop_id, or_(models.Accountinfo.id == models.HireLink.staff_id,
                                                    models.Accountinfo.id == admin_id)).all()
        member_list = []
        def work(id, w):
            if id == admin_id:
                return "店长"
            elif w == 1:
                return "挑货"
            else:
                return "送货"
        for member in members:
            member_list.append({"img":member[0].headimgurl,
                                "name":member[0].nickname,
                                "birthday":time.strftime("%Y-%m", time.localtime(member[0].birthday)),
                                "work":work(member[0].id,member[1]),
                                "phone":member[0].phone,
                                "wx_username":member[0].wx_username})
        return self.render("", member_list=member_list)

class Comment(CustomerBaseHandler):
    @tornado.web.authenticated
    @CustomerBaseHandler.check_arguments("page:int")
    def get(self):
        shop_id = int(self.get_cookie("market_shop_id"))
        page = self.args["page"]
        comments = self.get_comments(shop_id, page, 10)
        date_list = []
        for comment in comments:
            date_list.append({"img": comment[0], "name": comment[1],
                              "comment": comment[2], "time": self.timedelta(comment[3])})
        if page == 0:
            return self.render("customer/comment.html", date_list=date_list)
        return self.write(date_list=date_list)

class Market(CustomerBaseHandler):
    @tornado.web.authenticated
    def get(self):
        shop_id = int(self.get_cookie("market_shop_id"))
        try:shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
        except:return self.send_error(404)
        try:cart = self.session.query(models.Cart).filter_by(id=self.current_user.id, shop_id=shop_id).one()
        except:
            self.session.add(models.Cart(id=self.current_user.id, shop_id=shop_id))
            self.session.commit()
        cart_f, cart_m = self.read_cart(shop_id)
        fruits = [x for x in shop.fruits if x.fruit_type_id != 1000 and x.active == 1]
        dry_fruits = [x for x in shop.fruits if x.fruit_type_id == 1000 and x.active == 1]
        mgoods={}
        for menu in shop.menus:
            mgoods[menu.id] = [x for x in menu.mgoods if x.active == 1]
        return self.render("customer/home.html", context=dict(fruits=fruits, dry_fruits=dry_fruits,menus=shop.menus,
                                                              mgoods=mgoods, cart_f=cart_f, cart_m=cart_m,subpage='home',notices=shop.config.notices))

    @tornado.web.authenticated
    @CustomerBaseHandler.check_arguments("action:int", "charge_type_id:int", "menu_type:int")
    #action==2: +1，action==1: -1, action==0: delete；menu_type==0：fruit，menu_type==1：menu
    def post(self):
        shop_id = int(self.get_cookie("market_shop_id"))
        inc = self.args["action"]
        charge_type_id = self.args["charge_type_id"]
        menu_type = self.args["menu_type"]
        self.save_cart(charge_type_id, shop_id, inc, menu_type)
        #    self.render("notice/cart-empty.html",context=dict(subpage='cart'))
        return self.send_success()


class Cart(CustomerBaseHandler):
    @tornado.web.authenticated
    def get(self):
        shop_id = int(self.get_cookie("market_shop_id"))  #todo：如果没有cookie呢？
        shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
        if not shop:return self.send_error(404)
        cart = next((x for x in self.current_user.carts if x.shop_id == shop_id), None)
        if not cart or (not (eval(cart.fruits) or eval(cart.mgoods))): #购物车为空
            return self.render("notice/cart-empty.html",context=dict(subpage='cart'))
        cart_f, cart_m = self.read_cart(shop_id)

        periods = [x for x in shop.config.periods if x.active == 1]
        return self.render("customer/cart.html", cart_f=cart_f, cart_m=cart_m,config=shop.config,
                           periods=periods, context=dict(subpage='cart'))

    @tornado.web.authenticated
    @CustomerBaseHandler.check_arguments("fruits", "mgoods", "pay_type:int", "period_id:int",
                                         "address_id:int", "message:str", "type:int",
                                         "today:int")
    def post(self):#提交订单
        shop_id = int(self.get_cookie("market_shop_id"))
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
                totalPrice += charge_type.price*fruits[str(charge_type.id)] #计算订单总价
                charge_type.fruit.storage -= fruits[str(charge_type.id)]*charge_type.unit_num #更新库存
                f_d[charge_type.id]={"fruit_name":charge_type.fruit.name, "num":fruits[str(charge_type.id)],
                                     "charge":"%d元/%d%s" % (charge_type.price, charge_type.num, unit[charge_type.unit])}
        if mgoods:
            mcharge_types = self.session.query(models.MChargeType).\
                filter(models.MChargeType.id.in_(mgoods.keys())).all()
            for mcharge_type in mcharge_types:
                totalPrice+=mcharge_type.price*mgoods[str(mcharge_type.id)]
                mcharge_type.mgoods.storage -= mgoods[str(mcharge_type.id)]*mcharge_type.unit_num #更新库存
                m_d[mcharge_type.id]={"mgoods_name":mcharge_type.mgoods.name, "num":mgoods[str(mcharge_type.id)],
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

        #按时达/立即送 的时间段处理
        start_time = 0
        end_time = 0
        try:config = self.session.query(models.Config).filter_by(id=shop_id).one()
        except:return self.send_fail("找不到店铺")
        if self.args["type"] == 2: #按时达
            try:period = self.session.query(models.Period).filter_by(id=self.args["period_id"]).one()
            except:return self.send_fail("找不到时间段")
            if int(self.args["today"]) == 1 and period.start_time.hour - config.stop_range < datetime.datetime.now().hour:
                return self.send_fail("下单失败：已超过了该送货时间段的下单时间!请选择下一个时间段！")
            start_time = period.start_time
            end_time = period.end_time
        elif self.args["type"] == 1:#立即送
            now = datetime.datetime.now()
            start_time = datetime.time(now.hour, now.minute, now.second)
            end_time = datetime.time(config.end_time_now.hour, config.end_time_now.minute)

        #送货地址处理
        address = next((x for x in self.current_user.addresses if x.id == self.args["address_id"]), None)
        if not address:
            return self.send_fail("没找到地址", 404)
        order = models.Order(customer_id=self.current_user.id,
                             shop_id=shop_id,
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
        try:
            self.session.add(order)
            self.session.commit()
        except:
            return self.send_fail("订单提交失败")
        cart = next((x for x in self.current_user.carts if x.shop_id == int(shop_id)), None)
        cart.update(session=self.session, fruits='{}', mgoods='{}')#清空购物车
        return self.send_success()

class Notice(CustomerBaseHandler):
    def get(self):
        return self.render("notice/order-success.html",context=dict(subpage='cart'))

class Order(CustomerBaseHandler):
    @tornado.web.authenticated
    @CustomerBaseHandler.check_arguments("action")
    def get(self):
        action = self.args["action"]
        orders = []
        if action == "unhandled":  # 未处理
            orders = [x for x in self.current_user.orders if x.status == 1]
        elif action == "waiting":#待收货
            orders = [x for x in self.current_user.orders if x.status in (2, 3, 4)]
        elif action == "finish":#已完成
            orders = [x for x in self.current_user.orders if x.status == 5]
        else:return self.send_error(404)
        return self.render("customer/order-list.html", orders=orders, context=dict(subpage='center'))

    @tornado.web.authenticated
    @CustomerBaseHandler.check_arguments("action", "data")
    def post(self):
        action = self.args["action"]
        data = eval(self.args["data"])
        order = next((x for x in self.current_user.orders if x.id == int(data["order_id"])), None)
        if not order:return self.send_error(404)
        if action == "cancel_order":
            order.status = 0
        elif action == "comment":
            order.status = 6
            order.comment_create_date = datetime.datetime.now()
            order.comment = data["comment"]
        self.session.commit()
        return self.send_success()

class OrderDetail(CustomerBaseHandler):
    @tornado.web.authenticated
    def get(self,order_id):
        order = next((x for x in self.current_user.orders if x.id == int(order_id)), None)
        if not order:return self.send_error(404)
        charge_types = self.session.query(models.ChargeType).filter(
            models.ChargeType.id.in_(eval(order.fruits).keys())).all()
        mcharge_types = self.session.query(models.MChargeType).filter(
            models.MChargeType.id.in_(eval(order.mgoods).keys())).all()
        return self.render("customer/order-detail.html", order=order,
                           charge_types=charge_types, mcharge_types=mcharge_types)
