from handlers.base import SuperBaseHandler
import dal.models as models
import tornado.web


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
        user = models.SuperAdmin.login(self.args["username"],
                                       self.args["password"])
        if not user:
            return self.send_fail(error_text = "username account not match!")
        self.set_current_user(user)
        return self.send_success()

class Home(SuperBaseHandler):
    _page_count = 20

    def initialize(self, action):
        self._action = action

    @tornado.web.authenticated
    def get(self):
        if self._action == "active":
            self.get_handle_shops("active")
        elif self._action == "frozen":
            self.get_handle_shops("frozen")
        elif self._action == "applying":
            self.get_handle_shops("applying")
        else:
            return self.send_error(404)
    
    @SuperBaseHandler.check_arguments("page?:int")
    def get_handle_shops(self, shop_status):
        page = self.args.get("page", 0)
        try:
            shops = self.session.query(models.Shop).filter_by(shop_status=shop_status).\
                    order_by(models.Shop.id).\
                    offset(page*self._page_count).limit(self._page_count+1).all()
        except:
            shops = []
        if not shops and page !=0: return self.send_error(404)

        if len(shops) > self._page_count: next_page = page+1
        else: next_page = None
        if page: pre_page = page-1
        else: pre_page = None
        return self.render("superAdmin/home.html", context=dict(
            shops=shops, next_page=next_page,
            pre_page=pre_page))
    
        
        

