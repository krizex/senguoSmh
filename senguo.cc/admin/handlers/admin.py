from handlers.base import AdminBaseHandler
import dal.models as models
import tornado.web

class Access(AdminBaseHandler):
    def initialize(self, action):
        self._action = action

    def get(self):
        if self._action == "login":
            return self.render("admin/login.html")
        elif self._action == "logout":
            self.clear_current_user()
            return self.redirect(self.reverse_url("adminHome"))
        elif self._action == "oauth":
            self.handle_oauth()
        else:
            return self.send_error(404)
    @AdminBaseHandler.check_arguments("code?", "state?")
    def handle_oauth(self):
        if not "code" in self.args:
            return self.redirect(self.reverse_url("adminHome"))
        # todo: handle state
        code =self.args["code"]
        print("code get:", code)
        userinfo = self.get_wx_userinfo(code)
        if not userinfo:
            return self.redirect(self.reverse_url("adminLogin"))
        u = models.ShopAdmin.get_or_create_with_unionid(userinfo["unionid"], userinfo)
        self.set_current_user(u)
        return self.redirect(self.reverse_url("adminHome"))

class Home(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self):
        return self.render("admin/home.html", context=dict())

class Shelf(AdminBaseHandler):
    pass
