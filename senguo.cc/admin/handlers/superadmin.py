from handlers.base import SuperBaseHandler
import dal.models as models
import tornado.web
import time

class Access(SuperBaseHandler):
    
    def initialize(self, action):
        self._action = action
    
    def get(self):
        if self._action == "login":
            return self.render("superAdmin/login.html")
        elif self._action == "logout":
            self.clear_current_user()
            return self.redirect(self.reverse_url("superHome"))
        else:
            return self.send_error(404)
    @SuperBaseHandler.check_arguments("username", "password")
    def post(self):
        if self._action != "login":
            raise Exception("Superadmin Only support login post!")
        #try:
        user = self.session.query(models.SuperAdmin).filter_by(
                username= self.args["username"], 
                password= self.args["password"]).one()
        #except:
        #user = None
        if not user:
            return self.send_fail(error_text = "username account not match!")
        self.set_current_user(user)
        return self.send_success()


class ShopAdminManage(SuperBaseHandler):
    """商家管理，基本上是信息展示"""
    
    _page_count = 20
    
    def initialize(self, action):
        self._action = action
    
    @tornado.web.authenticated
    @SuperBaseHandler.check_arguments("page?:int")
    def get(self):
        offset = (self.args.get("page", 1)-1) * self._page_count
        q = self.session.query(models.ShopAdmin)
        t = int(time.time())
        if self._action == "all":
            pass
        elif self._action == "using":
            q = q.filter(models.ShopAdmin.role == models.SHOPADMIN_ROLE_TYPE.SYSTEM_USER,
                         models.ShopAdmin.expire_time > t)
        elif self._action == "expire":
            q = q.filter(models.ShopAdmin.role == models.SHOPADMIN_ROLE_TYPE.SYSTEM_USER, 
                         models.ShopAdmin.expire_time <= t)
        elif self._action == "common":
            q = q.filter(models.ShopAdmin.role == models.SHOPADMIN_ROLE_TYPE.SHOP_OWNER)
        else:
            return self.send_error(404)
        # 排序规则id, offset 和 limit
        q = q.order_by(models.ShopAdmin.id.desc()).offset(offset).limit(self._page_count)
        
        admins = q.all()
        # admins 是models.ShopAdmin的实例的列表，具体属性可以去dal/models.py中看到
        return self.render("superAdmin/shop-admin-manage.html", context=dict(admins = admins))
    @tornado.web.authenticated
    def post(self):
        return self.send_error(404)


class ShopManage(SuperBaseHandler):
    _page_count = 20
    
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
        return self.render("superAdmin/shop-manage.html", context=dict(shops = shops))

    @tornado.web.authenticated
    @SuperBaseHandler.check_arguments("action")
    def post(self):
        action = self.args["action"]
        if action == "updateShopStatus":
            self.handle_updateStatus()
        else:
            return self.send(400)
    @SuperBaseHandler.check_arguments("shop_id:int", "new_status:int")
    def handle_updateStatus(self):
        shop = models.Shop.get_by_id(self.args["shop_id"])
        if not shop:
            return self.send_error(403)
        shop.update(self.session, self.args["new_status"])
        return self.send_success()
