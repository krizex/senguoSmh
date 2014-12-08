from handlers.base import StaffBaseHandler
import dal.models as models
import tornado.web
from settings import *
import time
from sqlalchemy import desc, and_, or_
import qiniu

class Access(StaffBaseHandler):
    def initialize(self, action):
        self._action = action

    def get(self):
        next_url = self.get_argument('next', '')
        if self._action == "login":
            next_url = self.get_argument("next", "")
            return self.render("staff/login.html",
                                 context=dict(next_url=next_url))
        elif self._action == "logout":
            self.clear_current_user()
            return self.redirect(self.reverse_url("staffHome"))
        elif self._action == "oauth":
            self.handle_oauth()
        else:
            return self.send_error(404)

    @StaffBaseHandler.check_arguments("phone", "password", "next?")
    def post(self):
        u = models.ShopAdmin.login_by_phone_password(self.session, self.args["phone"], self.args["password"])
        if not u:
            return self.send_fail(error_text = "用户名或密码错误")
        self.set_current_user(u, domain=ROOT_HOST_NAME)
        self.redirect(self.args.get("next", self.reverse_url("staffHome")))
        return self.send_success()

    @StaffBaseHandler.check_arguments("code", "state?", "mode")
    def handle_oauth(self):
        # todo: handle state
        code =self.args["code"]
        mode = self.args["mode"]
        print("mode: ", mode , ", code get:", code)
        if mode not in ["mp", "kf"]:
            return self.send_error(400)

        userinfo = self.get_wx_userinfo(code, mode)
        if not userinfo:
            return self.redirect(self.reverse_url("staffLogin"))
        # 尝试登录
        u = models.ShopStaff.login_by_unionid(self.session, userinfo["unionid"])
        if not u:# 新建用户
            u = models.ShopStaff.register_with_wx(self.session, userinfo)
        self.set_current_user(u, domain=ROOT_HOST_NAME)

        next_url = self.get_argument("next", self.reverse_url("staffHome"))
        return self.redirect(next_url)

class Home(StaffBaseHandler):
    @tornado.web.authenticated
    def get(self):
        return self.render("staff/home.html", context=dict())
class order(StaffBaseHandler):
    @tornado.web.authenticated
    def get(self):
        work = self.current_user.work
        if work == 0: #JH
            orders = self.session.query(models.Order).filter_by(
                and_(JH_id=self.current_user.id, status=models.ORDER_STATUS.JH))
        elif work ==1: #SH1
            orders = self.session.query(models.Order).filter_by(
                and_(SH1_id=self.current_user.id, status=models.ORDER_STATUS.SH1))
        elif work ==2: #SH2
            orders = self.session.query(models.Order).filter_by(
                and_(SH2_id=self.current_user.id, status=models.ORDER_STATUS.SH2))
        else:
            pass
        orders = orders.order_by(desc(models.Order.create_date)).all()
        return self.render("", orders=orders)

    #@tornado.web.authenticated
