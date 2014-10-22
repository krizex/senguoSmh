#! /usr/bin/env python3

import tornado.web
import tornado.ioloop
from tornado.options import options, define

import os

import handlers.front
import handlers.admin

class Application(tornado.web.Application):
    def __init__(self):
        settings = {
            "debug": bool(options.debug),
            "login_url": r"/admin/login",
            "static_path": os.path.join(os.path.dirname(__file__), "static"),
            "static_url_prefix": "/static/",
            "template_path": os.path.join(os.path.dirname(__file__), "templates"),
            "cookie_secret": "shabianishishabianishi",
            "xsrf_cookies": True
        }
        handlers_ = [
            (r"/", handlers.front.Home,{}, "frontHome"),
            (r"/super/login", handlers.superadmin.Access,{"action":"login"}, "superLogin"),
            (r"/super/logout", handlers.superadmin.Access,{"action":"logout"}, "superLogout" ),
            (r"/super/", handlers.superadmin.Home, {},"superHome"),

            (r"/admin/login", handlers.admin.Access,
             {"action":"login"}, "adminLogin"),
            (r"/admin/logout", handlers.admin.Access, 
             {"action":"logout"}, "adminLogout"),
            (r"/admin/register", handlers.admin.Access, 
             {"action":"register"}, "adminRegister")
            (r"/admin/", handlers.admin.Home, {},  "adminHome"),# 匹配参数为admin_id
            (r"/admin/shelf", handlers.admin.Shelf, {}, "adminShelf"),# 货架管理/商品管理
            # (r"/admin/order", handlers.admin.Order, {}, "adminOrder"), 
            # (r"/admin/customer", handlers.admin.Customer, {}, "adminCustomer"),
            # (r"/admin/staff", handlers.admin.Staff, {}, "adminStaff"),
            # (r"/admin/finance", handlers.admin.Finance, {}, "adminFinance"),
            # (r"/admin/settings/profile", handlers.admin.Settings, 
            #  {"action":"profile"}, "adminSettingsProfile")
            # (r"/staff/", handlers.staff.Home, {}, "staffHome"),
            # (r"/staff/...")
        ]        
        super().__init__(handlers_, **settings)

def main():
    define("debug", default=0, help="debug mode: 1 to open, 0 to close")
    define("port", default=8888, help="port, defualt: 8888")
    tornado.options.parse_command_line()
    app = Application()
    app.listen(options.port)
    if options.debug:debug_str = "in debug mode"
    else:debug_str = "in production mode"
    print("running sim_blog {0} @ {1}...".format(debug_str, 
                                                 options.port))
    tornado.ioloop.IOLoop.instance().start()

    
if __name__ == "__main__":
    main()
