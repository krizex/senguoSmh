from handlers.base import AdminBaseHandler,WxOauth2,unblock,get_unblock
import dal.models as models
import tornado.web
from settings import *
import time
import datetime
from sqlalchemy import func, desc, and_, or_, exists,not_
import qiniu
from dal.dis_dict import dis_dict
from libs.msgverify import gen_msg_token,check_msg_token
import requests
import base64
import decimal

#市场推广 - 首页
class Home(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		
		return self.render('market/market.html')
#店铺信息
class Info(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		
		return self.render("market/shop-info.html")
		