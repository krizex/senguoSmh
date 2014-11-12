from handlers.base import SuperBaseHandler
import dal.models as models
import tornado.web
import time

class Access(SuperBaseHandler):
    
    def initialize(self, action):
        self._action = action
    
    def get(self):
        if self._action == "oauth":
            self.handle_oauth()
        elif self._action == "logout":
            self.clear_current_user()
            return self.redirect(self.reverse_url("superHome"))
        else:
            return self.send_error(404)
    @SuperBaseHandler.check_arguments("code", "state?", "mode")
    def handle_oauth(self):
        # todo: handle state
        code =self.args["code"]
        mode = self.args["mode"]
        if mode not in ["mp", "kf"]:
            return self.send_error(400)

        userinfo = self.get_wx_userinfo(code, mode)
        if not userinfo:
            return self.write("登录失败或过期，请重新登录")
        # 登录
        u = models.SuperAdmin.login_by_unionid(self.session, userinfo["unionid"])
        if not u:
            return self.write("对不起，你不属于此系统用户，我们拒绝你的加入。")
        self.set_current_user(u)

        next_url = self.get_argument("next", self.reverse_url("superHome"))
        return self.redirect(next_url)

class ShopAdminManage(SuperBaseHandler):
    """商家管理，基本上是信息展示"""

    _page_count = 10

    def initialize(self, action):
        self._action = action

    @tornado.web.authenticated
    @SuperBaseHandler.check_arguments("page?:int")
    def get(self):
        offset = (self.args.get("page", 1)-1) * self._page_count
        q = self.session.query(models.ShopAdmin)
        count = q.count()
        t = int(time.time())
        if self._action == "all":
            pass
        elif self._action == "using":
            q = q.filter(models.ShopAdmin.role == models.SHOPADMIN_ROLE_TYPE.SYSTEM_USER,
                         models.ShopAdmin.expire_time > t)
            count = q.count()
        elif self._action == "expire":
            q = q.filter(models.ShopAdmin.role == models.SHOPADMIN_ROLE_TYPE.SYSTEM_USER,
                         models.ShopAdmin.expire_time <= t)
            count = q.count()
        elif self._action == "common":
            q = q.filter(models.ShopAdmin.role == models.SHOPADMIN_ROLE_TYPE.SHOP_OWNER)
            count = q.count()
        else:
            return self.send_error(404)
        # 排序规则id, offset 和 limit
        q = q.order_by(models.ShopAdmin.id.desc()).offset(offset).limit(self._page_count)

        admins = q.all()
        # admins 是models.ShopAdmin的实例的列表，具体属性可以去dal/models.py中看到
        return self.render("superAdmin/shop-admin-manage.html", context=dict(admins = admins, count=count,sunpage='shopAadminManage',action=self._action))
    @tornado.web.authenticated
    def post(self):
        return self.send_error(404)

class ShopAdminProfile(SuperBaseHandler):

    @tornado.web.authenticated
    #@SuperBaseHandler.check_arguments("id:int")
    def get(self, id):
        try:
            admin = self.session.query(models.ShopAdmin).filter_by(id=id).one()
        except:
            admin = None
        if not admin:
            return self.send_error(404)
        time_tuple = time.localtime(admin.accountinfo.birthday)
        birthday = time.strftime("%Y-%m", time_tuple)
        return self.render("superAdmin/admin-profile.html", context=dict(admin=admin, birthday=birthday))
class ShopProfile(SuperBaseHandler):
    @tornado.web.authenticated
    #@SuperBaseHandler.check_arguments("id:int")
    def get(self, id):
        try:
            shop = self.session.query(models.Shop).filter_by(id=id).one()
        except:
            shop = None
        if not shop:
            return self.send_error(404)
        return self.render("superAdmin/shop-profile.html", context=dict(shop=shop))


class ShopManage(SuperBaseHandler):
    _page_count = 10
    
    def initialize(self, action):
        self._action = action

    @tornado.web.authenticated
    @SuperBaseHandler.check_arguments("page?:int")
    def get(self):
        offset = (self.args.get("page", 1) - 1) * self._page_count
        q = self.session.query(models.Shop)
        if self._action == "all":
            pass
        elif self._action == "applying":
            q = q.filter_by(shop_status=models.SHOP_STATUS.APPLYING)
        elif self._action == "accepted":
            q = q.filter_by(shop_status=models.SHOP_STATUS.ACCEPTED)
        elif self._action == "declined":
            q = q.filter_by(shop_status=models.SHOP_STATUS.DECLINED)
        else:
            return self.send_error(404)
        # 排序规则id, offset 和 limit
        q = q.order_by(models.Shop.id.desc()).offset(offset).limit(self._page_count)
        
        shops = q.all()
        # shops 是models.Shop实例的列表
        return self.render("superAdmin/shop-manage.html", context=dict(shops = shops,subpage='shopManage',action=self._action))

    @tornado.web.authenticated
    @SuperBaseHandler.check_arguments("action")
    def post(self):
        action = self.args["action"]
        if action == "updateShopStatus":
            self.handle_updateStatus()
        else:
            return self.send(400)
    @SuperBaseHandler.check_arguments("shop_id:int", "new_status:int", "declined_reason?")
    def handle_updateStatus(self):
        shop = models.Shop.get_by_id(self.session, self.args["shop_id"])
        if not shop:
            return self.send_error(403)
        if not self.args["new_status"] in models.SHOP_STATUS.DATA_LIST:
            return self.send_error(400)

        if self.args["new_status"] == models.SHOP_STATUS.DECLINED:
            shop.update(self.session, shop_status = self.args["new_status"],
                        declined_reason=self.args["declined_reason"])
        else:
            shop.update(self.session, shop_status = self.args["new_status"])
            
        return self.send_success()

class Feedback(SuperBaseHandler):
    _page_count = 20

    def initialize(self, action):
        self._action = action

    @tornado.web.authenticated
    @SuperBaseHandler.check_arguments("page?:int")
    def get(self):
        offset = self._page_count * (self.args.get("page", 1) - 1)
        q = self.session.query(models.Feedback)
        if self._action == "all":
            pass
        elif self._action == "unprocessed":
            q = q.filter_by(processed=False)
        elif self._action == "processed":
            q = q.filter_by(processed=True)
        else:
            return self.send_error(404)
        q = q.order_by(models.Feedback.create_date_timestamp.desc()).\
            offset(offset).limit(self._page_count)
        
        return self.render("superAdmin/feedback.html", context=dict(
            feedbacks = q.all()))
        
    @tornado.web.authenticated
    @SuperBaseHandler.check_arguments("action", "feedback_id:int")
    def post(self):
        if self.args["action"] == "set_processed":
            f  = Feedback.get_by_id(self.session, self.args["feedback_id"])
            if not f:
                return self.send_error(404)
            f.update(self.session, processed=False)
            return self.send_success()
        else:
            return self.send_error(404)
        
    
class OrderManage(SuperBaseHandler):
    _page_count = 20
    
    def initialize(self, action):
        self._action = action

    @tornado.web.authenticated
    @SuperBaseHandler.check_arguments("page?:int")
    def get(self):
        q_all = self.session.query(models.SystemOrder).filter_by(
            order_status = models.ORDER_STATUS.SUCCESS)
        q_new = q_all.filter_by(have_read=False)
        q_processed = q_all.filter_by(have_read=True)
        # 被放弃或者还未付款的订单
        q_aborted = self.session.query(models.SystemOrder).filter(
            models.SystemOrder.order_status != models.ORDER_STATUS.SUCCESS)
        count = {
            "all":q_all.count(),
            "new":q_new.count(),
            "processed":q_processed.count(),
            "aborted":q_aborted.count()
        }
        
        offset = self._page_count * (self.args.get("page", 1) - 1)

        if self._action == "all":
            q = q_all
        elif self._action == "new":
            q = q_new
        elif self._action == "processed":
            q = q_processed
        elif self._action == "aborted":
            q = q_aborted
        else:
            return self.send_error(404)
        
        q = q.order_by(models.SystemOrder.create_date_timestamp.desc()).\
            offset(offset).limit(self._page_count)
        orders = q.all()
        subpage = self._action
        
        return self.render("superAdmin/order-manage.html", context=dict(
            orders = orders,subpage = subpage,count=count))

    @tornado.web.authenticated
    @SuperBaseHandler.check_arguments("order_id:int", "system_username",
                                      "system_password","system_code" ,
                                      "action")
    def post(self):
        if self.args["action"] == "set_read":
            o = self.session.query(models.SystemOrder).\
                filter_by(order_id=self.args["order_id"]).one()
            if not o:
                return self.send_fail(error_text="订单不存在！")
            o.set_read(self.session)
            models.ShopAdmin.set_system_info(
                self.session, 
                admin_id = o.admin.id,
                system_username=self.args["system_username"],
                system_password=self.args["system_password"], 
                system_code=self.args["system_code"])
            return self.send_success()
