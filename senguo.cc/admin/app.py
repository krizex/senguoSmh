#! /usr/bin/env python3
#import gc

import dal.models as models
import tornado.web
import tornado.ioloop
from  handlers  import superadmin,admin
from tornado.options import options, define
define("debug", default=0, help="debug mode: 1 to open, 0 to close")
define("port", default=8887, help="port, defualt: 8888")
import os

from urls import handlers,sub_handlers

settings = {
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
    "static_url_prefix": "/static/",
    "template_path": os.path.join(os.path.dirname(__file__), "templates"),
    "cookie_secret": "shabianishishabianishi",
    "xsrf_cookies": True
}

class Application(tornado.web.Application):
    def __init__(self):
        settings["debug"] =  bool(options.debug)
        super().__init__(handlers, **settings)

def main():
    models.init_db_data()
    tornado.options.parse_command_line()
    application = Application()

    #woody
    # application.add_handlers(r"^e.senguo.cc$",[(r"/m", superadmin.Official),])
    for sub_handler in sub_handlers:
        application.add_handlers(sub_handler[0],sub_handler[1])
    # application.add_handlers(r"^b.senguo.cc$",[(r"/admin", admin.Home, {},  "adminHome"),]),
    application.listen(options.port)
    if options.debug:debug_str = "in debug mode"
    else:debug_str = "in production mode"
    print("running senguo.cc {0} @ {1}...".format(debug_str, 
                                                 options.port))
#    print("garbage collector: collected %d objecs"%gc.collect())
    tornado.ioloop.IOLoop.instance().start()

    
if __name__ == "__main__":
    main()
