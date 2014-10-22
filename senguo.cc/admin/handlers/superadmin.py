from handlers.base import SuperBaseHandler
import models


class Access(SuperBaseHandler):
    
    def initialize(self, action):
        self._action = action
    
    def get(self):
        if self._action == "login":
            return self.render("superAdmin/login.html")
        elif self._action == "logout":
            pass
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
        self.set_current_user(user.id)
        return self.send_success()
