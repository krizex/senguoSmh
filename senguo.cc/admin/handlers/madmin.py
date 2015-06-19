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
		if self.get_secure_cookie("shop_id"):
			shop_id = int(self.get_secure_cookie("shop_id").decode())
			self.clear_cookie("shop_id", domain=ROOT_HOST_NAME)
			shop = self.session.query(models.Shop).filter_by(id=shop_id).first()
			self.current_shop = shop
			self.set_secure_cookie("shop_id", str(shop.id), domain=ROOT_HOST_NAME)

		show_balance = False
		shop_auth =  self.current_shop.shop_auth

		if shop_auth in [1,2]:
			show_balance = True
		order_sum = self.session.query(models.Order).filter(models.Order.shop_id==self.current_shop.id,\
			not_(models.Order.status.in_([-1,0]))).count()
		new_order_sum = order_sum - (self.current_shop.new_order_sum or 0)

		follower_sum = self.session.query(models.CustomerShopFollow).filter_by(shop_id=self.current_shop.id).count()
		new_follower_sum = follower_sum - (self.current_shop.new_follower_sum or 0)
		self.current_shop.new_follower_sum = follower_sum

		try:
			total_money = self.session.query(func.sum(models.Order.totalPrice)).filter_by(shop_id = shop.id ,status =6).all()[0][0]
		except:
			total_money = None
		if total_money:		
			total_money = format(total_money,'.2f')
		else:		
			total_money=0

		order_list=self.session.query(models.Order).filter_by(shop_id=shop.id)
		intime_count = order_list.filter_by(type=1,status=1).count()
		ontime_count = order_list.filter_by(type=2,status=1).count()
		self_count = order_list.filter_by(type=3,status=1).count()
		comment_count = order_list.filter_by(status = 6).count()
		staff_count = self.session.query(models.HireLink).filter_by(shop_id = shop.id,active=1).count()
		goods_count = self.session.query(models.Fruit).filter_by(shop_id=shop_id, active=1).count()

		return self.render("m-admin/shop-profile.html", new_order_sum=new_order_sum, order_sum=order_sum,
						   new_follower_sum=new_follower_sum, follower_sum=follower_sum,show_balance = show_balance,\
						   shop=shop,total_money=total_money,intime_count=intime_count,ontime_count=ontime_count,\
						   self_count=self_count,comment_count=comment_count,staff_count=staff_count,goods_count=goods_count)
		
class OrderSearch(AdminBaseHandler):
	# @tornado.web.authenticated
	def get(self):
		return self.render("m-admin/order-search.html")

class Comment(AdminBaseHandler):
	# @tornado.web.authenticated
	@AdminBaseHandler.check_arguments("page?:int")
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
		try:
			page = self.args["page"]
		except:
			page = 0
		page_size = 20
		comments = self.get_comments(shop_id, page, page_size)
		date_list = []
		nomore = False
		for comment in comments:
			date_list.append({"id":comment[4],"img": comment[6], "name": comment[7],"comment": comment[0],
			 "time": comment[1].strftime('%Y-%m-%d'), "reply":comment[3], "imgurls":comment[10],"commodity_quality":comment[11],
			 "send_speed": comment[12],"shop_service": comment[13],'order_num':comment[2],'index':comment[14]})
		if date_list == []:
			nomore = True
		if page == 0:
			if len(date_list)<page_size:
				nomore = True
			return self.render("m-admin/comment.html", date_list=date_list,nomore=nomore,satisfy = satisfy,send_speed=send_speed,\
				shop_service = shop_service,commodity_quality=commodity_quality,shop_code=shop_code)
		return self.send_success(date_list=date_list,nomore=nomore)