#! /usr/bin/env python3
#import gc

import dal.models as models
import tornado.web
import tornado.ioloop
from  handlers  import superadmin,admin
from handlers.base import Pysettimer,SuperBaseHandler
import time
from tornado.options import options, define
define("debug", default=0, help="debug mode: 1 to open, 0 to close")
define("port", default=8887, help="port, defualt: 8888")
import os

from urls import handlers
from dal.db_configs import DBSession
settings = {
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
    "static_url_prefix": "/static/",
    "template_path": os.path.join(os.path.dirname(__file__), "templates"),
    "cookie_secret": "shabianishishabianishi",
    "xsrf_cookies": False
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
    # for sub_handler in sub_handlers:
    #     application.add_handlers(sub_handler[0],sub_handler[1])
    # application.add_handlers(r"^b.senguo.cc$",[(r"/admin", admin.Home, {},  "adminHome"),]),
    application.listen(options.port)
    if options.debug:debug_str = "in debug mode"
    else:debug_str = "in production mode"
    print("running senguo.cc {0} @ {1}...".format(debug_str,
                                                 options.port))
    timer_main()
   # print("garbage collector: collected %d objecs"%gc.collect())
    tornado.ioloop.IOLoop.instance().start()

def functest(args):
    print('hello world,this is',args[0])
def delete(args):
    session =  DBSession()
    session.query(models.AccessToken).delete()
    print("[AccessToken] update ",session.query(models.AccessToken).count())
    session.commit()

def timer_main():
    mytime = Pysettimer(SuperBaseHandler.shop_close,(),60*60*24,True)
    mytime.start()
    deletToken = Pysettimer(delete,(),60*10,True)
    deletToken.start()
    # time.sleep(10)
    # print('time over')


if __name__ == "__main__":
    main()

