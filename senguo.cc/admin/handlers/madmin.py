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

class Comment(AdminBaseHandler):
	# @tornado.web.authenticated
	@AdminBaseHandler.check_arguments("page:int")
	def get(self):
		customer_id = self.current_user.id
		shop_id     = self.get_cookie("market_shop_id")
		shop_code = self.get_cookie("market_shop_code")
		satisfy = 0
		commodity_quality = 0
		send_speed = 0
		shop_service = 0
		orders = self.session.query(models.Order).filter_by(shop_id = shop_id ,status =6).first()
		if orders:
			q = self.session.query(func.avg(models.Order.commodity_quality),\
				func.avg(models.Order.send_speed),func.avg(models.Order.shop_service)).filter_by(shop_id = shop_id).all()
			if q[0][0]:
				commodity_quality = int(q[0][0])
			if q[0][1]:
				send_speed = int(q[0][1])
			if q[0][2]:
				shop_service = int(q[0][2])
			if commodity_quality and send_speed and shop_service:
				satisfy = format((commodity_quality + send_speed + shop_service)/300,'.0%')
		page = self.args["page"]
		page_size = 20
		comments = self.get_comments(shop_id, page, page_size)
		date_list = []
		nomore = False
		for comment in comments:
			date_list.append({"img": comment[6], "name": comment[7],
							"comment": comment[0], "time": self.timedelta(comment[1]), "reply":comment[3], "imgurls":comment[10]})
		if date_list == []:
			nomore = True
		if page == 0:
			if len(date_list)<page_size:
				nomore = True
			return self.render("m-admin/comment.html", date_list=date_list,nomore=nomore,satisfy = satisfy,send_speed=send_speed,\
				shop_service = shop_service,commodity_quality=commodity_quality,shop_code=shop_code)
		return self.send_success(date_list=date_list,nomore=nomore)