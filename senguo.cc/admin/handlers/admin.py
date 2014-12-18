from handlers.base import AdminBaseHandler
import dal.models as models
import tornado.web
from settings import *
import time, datetime
from sqlalchemy import desc, and_, or_
import qiniu

class Access(AdminBaseHandler):
    def initialize(self, action):
        self._action = action

    def get(self):
        next_url = self.get_argument('next', '')
        if self._action == "login":
            next_url = self.get_argument("next", "")
            return self.render("admin/login.html", 
                                 context=dict(next_url=next_url))
        elif self._action == "logout":
            self.clear_cookie("shop_id", domain=ROOT_HOST_NAME)
            self.clear_current_user()
            return self.redirect(self.reverse_url("fruitzoneHome"))
        elif self._action == "oauth":
            self.handle_oauth()
        else:
            return self.send_error(404)

    @AdminBaseHandler.check_arguments("phone", "password", "next?")
    def post(self):
        u = models.ShopAdmin.login_by_phone_password(self.session, self.args["phone"], self.args["password"])
        if not u:
            return self.send_fail(error_text = "用户名或密码错误")
        self.set_current_user(u, domain=ROOT_HOST_NAME)
        self.redirect(self.args.get("next", self.reverse_url("fruitzoneHome")))
        return self.send_success()

    @AdminBaseHandler.check_arguments("code", "state?", "mode")
    def handle_oauth(self):
        # todo: handle state
        code =self.args["code"]
        mode = self.args["mode"]
        print("mode: ", mode , ", code get:", code)
        if mode not in ["mp", "kf"]:
            return self.send_error(400)

        userinfo = self.get_wx_userinfo(code, mode)
        if not userinfo:
            return self.redirect(self.reverse_url("adminLogin"))
        # 尝试登录
        u = models.ShopAdmin.login_by_unionid(self.session, userinfo["unionid"])
        if not u:# 新建用户
            u = models.ShopAdmin.register_with_wx(self.session, userinfo)
        self.set_current_user(u, domain=ROOT_HOST_NAME)
        
        next_url = self.get_argument("next", self.reverse_url("fruitzoneHome"))
        return self.redirect(next_url)

class Home(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self):
        if not self.current_user.shops:
            return self.write("你还没有店铺，请先申请")
        if not self.current_shop: #设置默认店铺
            self.current_shop=self.current_user.shops[0]
            self.set_secure_cookie("shop_id", str(self.current_shop.id), domain=ROOT_HOST_NAME)
        return self.render("admin/base.html", context=dict())
    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("shop_id:int")
    def post(self):
        shop_id = self.args["shop_id"]
        try:shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
        except:return self.send_error(404)
        if shop.admin != self.current_user:
            return self.send_error(403)#必须做权限检查：可能这个shop并不属于current_user
        self.set_secure_cookie("shop_id", str(shop_id), domain=ROOT_HOST_NAME)
        return self.send_success()

class Order(AdminBaseHandler):
    # def initialize(self, order_type, order_status):
    #     self._order_type = order_type
    #     self._order_status = order_status

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("order_type:int", "order_status:int")
    def get(self, id): #shop_id
        try:shop = self.session.query(models.Shop).filter_by(id=id).one()
        except:return self.send_error(404)
        if shop.admin != self.current_user:
            return self.send_error(403)#必须做权限检查：可能这个shop并不属于current_user
        order_type = self.args["order_type"]
        order_status = self.args["order_status"]
        orders = self.session.query(models.Order).filter_by(shop_id=id).\
            filter(and_(models.Order.type == order_type, models.Order.status != models.STATUS.DELETED))
        if order_status < 10:
            orders = orders.filter(models.Order.status == order_status).all()
        elif order_status == 10:#all
            orders = orders.all()
        elif order_status == 11:#unfinish
            orders = orders.filter(models.Order.status.in_(
                [models.STATUS.JH, models.STATUS.SH1, models.STATUS.SH2])).all()
        else:
            return self.send.send_error(404)
        count = {"on_time_unhandle":_count(models.ORDER_TYPE.ON_TIME, models.ORDER_STATUS.ORDERED, id),
                 "on_time_unfinish":_count(models.ORDER_TYPE.ON_TIME, 11, id),
                 "on_time_finish":_count(models.ORDER_TYPE.ON_TIME, models.ORDER_STATUS.FINISH, id),
                 "now_unhandle":_count(models.ORDER_TYPE.NOW, models.ORDER_STATUS.ORDERED, id),
                 "now_unfinish":_count(models.ORDER_TYPE.NOW, 11, id),
                 "now_finish":_count(models.ORDER_TYPE.NOW, models.ORDER_STATUS.FINISH, id)}
        return self.render("", orders=orders, count=count)


    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data")
    def post(self):
        action = self.args["action"]
        data = self.args["data"]
        if action == "add_period":
            start_time = datetime.time(data["start_hour"],data["start_minute"])
            end_time = datetime.time(data["end_hour"],data["end_minute"])
            period = models.Period(config_id=self.current_shop.id,
                                   name=data["name"],
                                   start_time=start_time,
                                   end_time=end_time)
            self.session.add(period)
            self.session.commit()
            return self.send_success(period_id=period.id)
        elif action == "edit_period":
            period = next((x for x in self.current_shop.config.periods if x.id == data["period_id"]), None)
            if not period:
                return self.send_fail("没找到该时间段", 403)
            start_time = datetime.time(data["start_hour"], data["start_minute"])
            end_time = datetime.time(data["end_hour"], data["end_minute"])
            period.name = data["name"]
            period.start_time = start_time
            period.end_time = end_time
            self.session.commit()
        elif action == "del_period":
            try: q = self.session.query(models.Period).filter_by(id=int(data["period_id"]))
            except:return self.send_error(404)
            q.delete()
            self.session.commit()
        else:
            return self.send_error(404)
        return self.send_success()

    def _count(self, order_type, order_status, shop_id):
        orders = self.session.query(models.Order).filter_by(shop_id=id).\
            filter(and_(models.Order.type == self._order_type,models.Order.status != models.STATUS.DELETED))
        count = 0
        if self._order_status < 10:
            count = orders.filter(models.Order.status == self._order_status).count()
        elif self._order_status == 10:#all
            count = orders.count()
        elif self._order_status == 11:#unfinish
            count = orders.filter(models.Order.status.in_(
                [models.STATUS.JH, models.STATUS.SH1, models.STATUS.SH2])).count()
        return count


class Shelf(AdminBaseHandler):

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "id:int")
    def get(self):
        # try:shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
        # except:return self.send_error(404)
        # if shop not in self.current_user.shops:
        #     return self.send_error(403)

        action = self.args["action"]
        id = self.args["id"]
        fruit_types = self.session.query(models.FruitType).all()
        if action == "home":
            return self.render("admin/goods-preview.html", fruit_types=fruit_types, menus=self.current_shop.menus,
                                context=dict(subpage="goods", goodsSubpage="home"))
        elif action == "fruit":
            fruits=[]
            for fruit in self.current_shop.fruits:
                if fruit.fruit_type_id == id:
                    fruits.append(fruit)
            return self.render("admin/goods-fruit.html", fruits=fruits, fruit_types=fruit_types, menus=self.current_shop.menus,
                               context=dict(subpage="goods",goodsSubpage="fruit"))
        elif action == "menu":#todo 合法性检查
            try:mgoodses = self.session.query(models.MGoods).filter_by(menu_id=id).all()
            except:return self.send_error(404)
            return self.render("admin/goods-menu.html", mgoodses=mgoodses, fruit_types=fruit_types, menus=self.current_shop.menus,
                               context=dict(subpage="goods",goodsSubpage="menu"))

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data", "id?:int", "charge_type_id?:int")
    def post(self):
        action = self.args["action"]
        data = self.args["data"]
        if action in ["add_fruit", "add_mgoods"]:
            if not (data["charge_types"] and data["charge_types"]):#如果没有计价方式、打开market时会有异常
                return self.send_fail("请至少添加一种计价方式")
            args={}
            args["name"] = data["name"]
            args["saled"] = data["saled"]
            args["storage"] = data["storage"]
            args["unit"] = data["unit"]
            args["tag"] = data["tag"]
            args["img_url"] = data["img_url"]
            args["intro"] = data["intro"]
            args["priority"] = data["priority"]
            if action == "add_fruit":
                args["fruit_type_id"] = data["fruit_type_id"]
                args["shop_id"] = self.current_shop.id
                fruit = models.Fruit(**args)
                for charge_type in data["charge_types"]:
                    fruit.charge_types.append(models.ChargeType(price=charge_type["price"],
                                                                unit=charge_type["unit"],
                                                                num=charge_type["num"],
                                                                unit_num=charge_type["unit_num"]))
                self.session.add(fruit)
            elif action == "add_mgoods":
                args["menu_id"] = data["menu_id"]
                mgoods = models.MGoods(**args)
                for charge_type in data["charge_types"]:
                    mgoods.mcharge_types.append(models.MChargeType(price=charge_type["price"],
                                                                unit=charge_type["unit"],
                                                                num=charge_type["num"],
                                                                unit_num=charge_type["unit_num"]))
                    self.session.add(mgoods)
            self.session.commit()
            return self.send_success()
        elif action == "add_menu":
            self.session.add(models.Menu(shop_id=self.current_shop.id,name=data["name"]))
            self.session.commit()
        elif action == "edit_img":
            q = qiniu.Auth(ACCESS_KEY, SECRET_KEY)
            token = q.upload_token(BUCKET_GOODS_IMG, expires=120,
                                   policy={"callbackUrl": "http://zone.senguo.cc/admin/shelf/fruitImgCallback",
                                           "callbackBody": "key=$(key)&id=%s" % self.current_shop.id, "mimeLimit": "image/*"})
            return self.send_success(token=token, key=str(time.time())+':'+str(self.current_shop.id))

        elif action in ["add_charge_type", "edit_active", "edit_fruit"]: #fruit_id
            try:fruit = self.session.query(models.Fruit).filter_by(id=self.args["id"]).one()
            except:return self.send_error(404)
            if fruit.shop != self.current_shop:
                return self.send_error(403)

            if action == "add_charge_type":
                charge_type = models.ChargeType(fruit_id=fruit.id,
                                                price=data["price"],
                                                unit=data["unit"],
                                                num=data["num"],
                                                unit_num=data["unit_num"])
                self.session.add(charge_type)
                self.session.commit()
                return self.send_success()
            elif action == "edit_active":
                if fruit.active == 1:
                    fruit.update(session=self.session, active = 2)
                elif fruit.active == 2:
                    fruit.update(session=self.session, active = 1)
            elif action == "edit_fruit":
                fruit.update(session=self.session,
                                                name = data["name"],
                                                saled = data["saled"],
                                                storage = data["storage"],
                                                unit=data["unit"],
                                                tag = data["tag"],
                                                img_url = data["img_url"],
                                                intro = data["intro"],
                                                priority=data["priority"])
        elif action in ["del_charge_type", "edit_charge_type"]: #charge_type_id
            charge_type_id = self.args["charge_type_id"]
            try: q = self.session.query(models.ChargeType).filter_by(id=charge_type_id)
            except:return self.send_error(404)
            if action == "del_charge_type":
                q.delete()
            else:
                q.one().update(session=self.session,price=data["price"],
                         unit=data["unit"],
                         num=data["num"],
                         unit_num=data["unit_num"])
            self.session.commit()
        elif action in ["add_mcharge_type", "edit_m_active", "edit_mgoods"]: #menu_id
            try:mgoods = self.session.query(models.MGoods).filter_by(id=self.args["id"]).one()
            except:return self.send_error(404)
            if mgoods.menu.shop != self.current_shop:
                return self.send_error(403)

            if action == "add_mcharge_type":
                mcharge_type = models.MChargeType(mgoods_id=mgoods.id,
                                                price=data["price"],
                                                unit=data["unit"],
                                                num=data["num"],
                                                unit_num=data["unit_num"])
                self.session.add(mcharge_type)
                self.session.commit()
                return self.send_success()
            elif action == "edit_m_active":
                if mgoods.active == 1:
                    mgoods.update(session=self.session, active = 2)
                elif mgoods.active == 2:
                    mgoods.update(session=self.session, active = 1)
            elif action == "edit_mgoods":
                mgoods.update(session=self.session,
                                                name = data["name"],
                                                saled = data["saled"],
                                                storage = data["storage"],
                                                unit=data["unit"],
                                                tag = data["tag"],
                                                img_url = data["img_url"],
                                                intro = data["intro"],
                                                priority=data["priority"])
        elif action in ["del_mcharge_type", "edit_mcharge_type"]: #mcharge_type_id
            mcharge_type_id = self.args["charge_type_id"]
            try: q = self.session.query(models.MChargeType).filter_by(id=mcharge_type_id)
            except:return self.send_error(404)
            if action == "del_mcharge_type":
                q.delete()
            else:
                q.one().update(session=self.session,price=data["price"],
                         unit=data["unit"],
                         num=data["num"],
                         unit_num=data["unit_num"])
            self.session.commit()
        elif action == "add_img":
            q = qiniu.Auth(ACCESS_KEY, SECRET_KEY)
            token = q.upload_token(BUCKET_GOODS_IMG, expires=120)
            return self.send_success(token=token, key=str(time.time()))

        else: return self.send_error(404)

        return self.send_success()

class Staff(AdminBaseHandler):
    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action")
    def get(self, id): #shop_id
        try:shop = self.session.query(models.Shop).filter_by(id=id).one()
        except:return self.send_error(404)
        if shop not in self.current_user.shops:
            return self.send_error(403)
        action = self.args["action"]
        staffs = self.session.query(models.ShopStaff).filter_by(shop_id=id)
        if action == "JH":
            staffs = staffs.filter_by(work=0).all()
        elif action == "TH1":
            staffs = staffs.filter_by(work=1).all()
        elif action == "TH2":
            staffs = staffs.filter_by(work=2).all()
        elif action == "hire":
            hire_forms = self.session.query(models.HireForm).filter_by(shop_id=id).all()
            return self.render("", hire_forms=hire_forms)
        else: return self.send_error(404)
        return self.render("", staffs=staffs)

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data")
    def post(self, id): #hire_form_id/staff_id
        action = self.args["action"]
        data = self.args["data"]

        if action in ["hire_agree", "hire_refuse"]: #id = hire_form_id
            try:hire_form = self.session.query(models.HireForm).filter_by(id=id).one()
            except: return self.send_error(404)
            staff = self.session.query(models.ShopStaff).filter_by(id=hire_form.staff_id).one()
            if action == "hire_agree":
                staff.update(session=self.session, address=hire_form.address,
                             work=hire_form.work, address1=hire_form.address1,
                             address2=hire_form.address2)
                self.session.delete(hire_form)
                self.session.commit()
            elif action == "hire_refuse":
                self.session.delete(hire_form)
                self.session.commit()
        elif action == "edit_staff":
            try:staff = self.session.query(models.ShopStaff).filter_by(id=id).one()
            except:return self.send_error(404)
            staff.update(session=self.session, work=data["work"], address1=data["address1"],
                             address2=data["address2"], remark=data["remark"])
        else:
            return self.send_fail()
        return self.send_success()



class Config(AdminBaseHandler):
    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action")
    def get(self, id): #shop_id
        try:config = self.session.query(models.Config).filter_by(id=id).one()
        except:return self.send_error(404)
        action = self.args["action"]
        if action == "delivery":
            return self.render("admin/shop-set.html", addresses=config.addresses,context=dict(subpage='shop_set',shopSubPage='delivery_set'))
        elif action == "notice":
            return self.render("admin/shop-set.html", notices=config.notices,context=dict(subpage='shop_set',shopSubPage='notice_set'))
        elif action == "recharge":
            pass
        elif action == "receipt":
            return self.render("admin/shop-set.html", title=config.title, receipt_msg=config.receipt_msg,context=dict(subpage='shop_set',shopSubPage='receipt_set'))
        else:
            return self.send_error(404)


    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data")
    def post(self, id):
        action = self.args["action"]
        data = self.args["data"]

        if action in ["add_addr1", "add_notice", "edit_receipt", "edit_hire"]: #id: shop_id
            try: config = self.session.query(models.Config).filter_by(id=id).one()
            except:return self.send_error(404)
            if action == "add_addr1":
                addr1 = models.Address1(name=data)
                config.addresses.append(addr1)
                self.session.commit()
                return self.send_success(address1_id=addr1.id)#commit后id会自动生成
            elif action == "add_notice":
                notice = models.Notice(summary=data["summary"],
                                       detail=data["detail"])
                config.notices.append(notice)
                self.session.commit()
            elif action == "edit_receipt": #小票设置
                config.update(session=self.session, receipt_msg=data["receipt_msg"],
                              title=data["title"])
            elif action == "edit_hire":
                config.update(session=self.session, hire_text=data)
        if action in ["add_addr2", "edit_addr1_active"]:#id: addr1_id
            try:addr1 = self.session.query(models.Address1).filter_by(id=id).one()
            except:return self.send_error(404)
            if action == "add_addr2":
                addr2 = models.Address2(name=data)
                addr1.address2.append(addr2)
                self.session.commit()
            elif action == "edit_addr1_active":
                if addr1.active:
                    active=False
                else:
                    active=True
                addr1.update(session=self.session, active=active)
        if action =="edit_addr2_active":#id: addr2_id
            try:addr2 = self.session.query(models.Address2).filter_by(id=id).one()
            except:return self.send_error(404)
            if addr2.active:
                active=False
            else:
                active=True
            addr2.update(session=self.session, active=active)
        return self.send_success()
