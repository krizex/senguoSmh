__author__ = 'liaosimin'
from webbase import BaseHandler
from dal.db_configs import DBsession
from dal.models import Shop, ShopAdmin

class ShopMsgHandler(BaseHandler):
    def get(self):
        s = DBsession()
        shop_code = self.get_argument("shop_code")
        shop_msg = s.query(Shop).filter(Shop.shop_code == shop_code).one()
        shop_admin = s.query(ShopAdmin).filter(ShopAdmin.id == shop_msg.admin_id).one()
        self.render("", shop_msg=shop_msg, shop_admin=shop_admin)
        s.close()
        return


class ShopAdminMsgHandler(BaseHandler):
    def get(self):
        s = DBsession()
        admin_id = self.get_argument("admin_id")
        admin_msg = s.query(ShopAdmin).filter(ShopAdmin.id == admin_id).one()
        self.render("", admin_msg=admin_msg)
        s.close()

    def post(self, action):
        s = DBsession()
        admin_id = self.get_argument("admin_id")
        admin_msg = s.query(ShopAdmin).filter(ShopAdmin.id == admin_id).one()

        if action == "modify_realname":
            admin_msg.realname = self.get_argument("admin_text")

        elif action == "modify_wx_username":
            admin_msg.wx_username = self.get_argument("admin_text")

        elif action == "modify_phone":
            admin_msg.phone = self.get_argument("admin_text")

        elif action == "modify_email":
            admin_msg.email = self.get_argument("admin_text")

        elif action == "modify_birthday":
            admin_msg.birthday = self.get_argument("admin_text")

        s.commit()
        s.close()
        return