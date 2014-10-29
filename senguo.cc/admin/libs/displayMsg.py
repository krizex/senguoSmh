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
        return
