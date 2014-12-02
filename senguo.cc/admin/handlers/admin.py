from handlers.base import AdminBaseHandler
import dal.models as models
import tornado.web
from settings import *
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
    def initialize(self, order_type, order_status):
        self._order_type = order_type
        self._order_status = order_status

    @tornado.web.authenticated
    def get(self):
        orders = self.session.query(models.Order).filter(and_(models.Order.type == self._order_type,
                                                              models.Order.status != models.STATUS.DELETED))
        if self._order_status < 10:
            orders = orders.filter(models.Order.status == self._order_status).all()
        elif self._order_status == 10:#all
            orders = orders.all()
        elif self._order_status == 11:#unfinish
            orders = orders.filter(models.Order.status.in_([models.STATUS.JH, models.STATUS.SH1, models.STATUS.SH2])).all()
        else:
            return self.send.send_error(404)
        count = {"on_time_unhandle":_count(models.ORDER_TYPE.ON_TIME,models.ORDER_STATUS.ORDERED),
                 "on_time_unfinish":_count(models.ORDER_TYPE.ON_TIME,11),
                 "on_time_finish":_count(models.ORDER_TYPE.ON_TIME,models.ORDER_STATUS.FINISH),
                 "now_unhandle":_count(models.ORDER_TYPE.NOW,models.ORDER_STATUS.ORDERED),
                 "now_unfinish":_count(models.ORDER_TYPE.NOW,11),
                 "now_finish":_count(models.ORDER_TYPE.NOW,models.ORDER_STATUS.FINISH)}
        return self.render("", orders=orders, count=count)


    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data")
    def post(self):
        action = self.args["action"]
        data = self.args["data"]
        if action == "edit_period":
            pass

    def _count(self, order_type, order_status):
        orders = self.session.query(models.Order).filter(and_(models.Order.type == self._order_type,
                                                              models.Order.status != models.STATUS.DELETED))
        count = 0
        if self._order_status < 10:
            count = orders.filter(models.Order.status == self._order_status).count()
        elif self._order_status == 10:#all
            count = orders.count()
        elif self._order_status == 11:#unfinish
            count = orders.filter(models.Order.status.in_([models.STATUS.JH, models.STATUS.SH1, models.STATUS.SH2])).count()
        return count


class Shelf(AdminBaseHandler):
    def initialize(self, action):
        self._action = action

    @tornado.web.authenticated
    def get(self,shop_id):
        try:shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
        except:return self.send_error(404)
        if shop not in self.current_user.shops:
            return self.send_error(403)
        if self._action == "single_item":
            return self.render("", single_items = shop.single_items)
        elif self._action == "package":
            return self.render("", packages = shop.packages)

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data")
    def post(self, shop_id):
        action = self.args["action"]
        data = self.args["data"]
        single_item_id = data["single_item_id"]
        try:shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
        except:return self.send_error(404)
        if shop not in self.current_user.shops:
            return self.send_error(403)

        if action == "add_single_item":
            single_item = models.SingleItem(shop_id=data["shop_id"],
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
        elif action == "add_img":
            q = qiniu.Auth(ACCESS_KEY, SECRET_KEY)
            token = q.upload_token(BUCKET_SINGLE_ITEM_IMG, expires=120)
            return self.send_success(token=token, key=str(time.time()))
        try:single_item = self.session.query(models.SingleItem).filter_by(id=single_item_id).one()
        except:return self.send_error(404)
        if single_item not in shop.single_items:
            return self.send_error(403)

        if action == "add_charge_type":
            charge_type = models.ChargeType(single_item_id=data["single_item_id"],
                                            price=data["price"],
                                            unit=data["unit"],
                                            number=data["number"])
            self.session.add(single_item)
            self.session.commit()
            return self.send_success()
        if action == "edit_active":
            if single_item.active == 0:
                single_item.active = 1
            else:single_item.active = 0
        if action == "edit_single_item":
            single_item.update(session=self.session,fruit_type_id = data["fruit_type_id"],
                                            name = data["name"],
                                            saled = data["saled"],
                                            storage = data["storage"],
                                            is_new = data["is_new"],
                                            img_url = data["img_url"],
                                            intro = data["intro"])
        if action == "edit_img":
            q = qiniu.Auth(ACCESS_KEY, SECRET_KEY)
            token = q.upload_token(BUCKET_SINGLE_ITEM_IMG, expires=120, policy={"callbackUrl": "http://zone.senguo.cc/admin/shelf/singleItemImgCallback",
                                                                         "callbackBody": "key=$(key)&id=%s" % shop_id, "mimeLimit": "image/*"})
            return self.send_success(token=token, key=str(time.time())+':'+str(shop_id))
