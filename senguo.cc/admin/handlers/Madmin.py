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

class Order(AdminBaseHandler):
	# @tornado.web.authenticated
	def get(self):
		return self.render("m-admin/order.html")

class OrderDetail(AdminBaseHandler):
	# @tornado.web.authenticated
	def get(self):
		return self.render("m-admin/order-detail.html")

class ShopProfile(AdminBaseHandler):
	# @tornado.web.authenticated
	def get(self):
		return self.render("m-admin/shop-profile.html")
class OrderSearch(AdminBaseHandler):
	# @tornado.web.authenticated
	def get(self):
		return self.render("m-admin/order-search.html")