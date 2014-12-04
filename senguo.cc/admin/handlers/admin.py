from handlers.base import AdminBaseHandler
import dal.models as models
import tornado.web
from settings import *
import time
from sqlalchemy import and_, or_
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
        return self.render("admin/home.html", context=dict())

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
        if action == "edit_period":
            pass

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
    def initialize(self, action):
        self._action = action

    @tornado.web.authenticated
    def get(self, shop_id):
        try:shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
        except:return self.send_error(404)
        if shop not in self.current_user.shops:
            return self.send_error(403)
        fruit_types = self.session.query(models.FruitType).all()
        if self._action == "single_item":
            return self.render("admin/goods-fruit.html", single_items = shop.single_items,fruit_types=fruit_types,context=dict(subpage="goods",goodsSubpage="fruit"))
        elif self._action == "package":
            return self.render("admin/goods-package.html", packages = shop.packages, fruit_types=fruit_types,context=dict(subpage="goods",goodsSubpage="package"))

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data")
    def post(self, id): #shop_id/single_item_id
        action = self.args["action"]
        data = self.args["data"]

        if action == "add_single_item": #shop_id
            try:shop = self.session.query(models.Shop).filter_by(id=id).one()
            except:return self.send_error(404)
            if shop.admin != self.current_user:
                return self.send_error(403)

            single_item = models.SingleItem(shop_id=id,
                                            fruit_type_id=data["fruit_type_id"],
                                            name=data["name"],
                                            saled=data["saled"],
                                            storage=data["storage"],
                                            is_new=data["is_new"],
                                            img_url=data["img_url"],
                                            intro=data["intro"])
            self.session.add(single_item)
            self.session.commit()
            return self.send_success()
        elif action in ["add_charge_type", "edit_active", "edit_single_item"]: #single_item_id
            try:single_item = self.session.query(models.SingleItem).filter_by(id=id).one()
            except:return self.send_error(404)
            if single_item.shop.admin != self.current_user:
                return self.send_error(403)

            if action == "add_charge_type":
                charge_type = models.ChargeType(single_item_id=id,
                                                price=data["price"],
                                                unit=data["unit"],
                                                number=data["number"])
                self.session.add(charge_type)
                self.session.commit()
                return self.send_success()
            elif action == "edit_active":
                if single_item.active == 0:
                    single_item.active = 1
                else:single_item.active = 0
            elif action == "edit_single_item":
                single_item.update(session=self.session,fruit_type_id = data["fruit_type_id"],
                                                name = data["name"],
                                                saled = data["saled"],
                                                storage = data["storage"],
                                                is_new = data["is_new"],
                                                img_url = data["img_url"],
                                                intro = data["intro"])
        elif action == "add_img":
            q = qiniu.Auth(ACCESS_KEY, SECRET_KEY)
            token = q.upload_token(BUCKET_SINGLE_ITEM_IMG, expires=120)
            return self.send_success(token=token, key=str(time.time()))

        elif action == "edit_img":
            q = qiniu.Auth(ACCESS_KEY, SECRET_KEY)
            token = q.upload_token(BUCKET_SINGLE_ITEM_IMG, expires=120, policy={"callbackUrl": "http://zone.senguo.cc/admin/shelf/singleItemImgCallback",
                                                                         "callbackBody": "key=$(key)&id=%s" % shop_id, "mimeLimit": "image/*"})
            return self.send_success(token=token, key=str(time.time())+':'+str(shop_id))
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
<<<<<<< HEAD
        return self.render("shop-set.html", config=config,context=dict(subpage="shop_set")
=======
        action = self.args["action"]
        if action == "delivery":
            return self.render("", addresses=config.addresses)
        elif action == "notice":
            return self.render("", notices=config.notices)
        elif action == "recharge":
            pass
        elif action == "receipt":
            return self.render("", title=config.title, receipt_msg=config.receipt_msg)
        else:
            return self.send_error(404)


    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data")
    def post(self, id):
        action = self.args["action"]
        data = self.args["data"]

        if action in ["add_addr1", "add_notice", "edit_receipt", "edit_hire"]: #id: shop_id
            try config = self.session.query(models.Config).filter_by(id=id).one()
            except:return self.send_error(404)
            if action == "add_addr1":
                addr1 = models.Address1(name=data)
                config.addresses.append(addr1)
                self.session.commit()
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
        elif action == "add_addr2": #id: addr1_id
            try:addr1 = self.session.query(models.Address1).filter_by(id=id).one()
            except:return self.send_error(404)
            addr2 = models.Address2(name=data)
            addr1.address2.append(addr2)
            self.session.commit()

