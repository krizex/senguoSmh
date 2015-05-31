from handlers.base import FruitzoneBaseHandler,WxOauth2
import dal.models as models
import tornado.web
from settings import *
import datetime, time
from sqlalchemy import desc, and_, or_
import qiniu
import random
import base64
import json

class Home(FruitzoneBaseHandler):
	def get(self):
		# print(self)
		shop_count = self.get_shop_count()
		return self.render("official/home.html",context=dict(shop_count = shop_count,subpage="home"))

class About(FruitzoneBaseHandler):
	def get(self):
		return self.render("official/about.html",context=dict(subpage="about"))

class ShopList(FruitzoneBaseHandler):
	def get(self):
		# print(self)
		shop_count = self.get_shop_count()
		shop_province = self.get_shop_group()
		return self.render("official/shoplist.html",context=dict(shop_count = shop_count, shop_province = shop_province,\
		 subpage="shop"))
	 
	@FruitzoneBaseHandler.check_arguments("action")	   
	def post(self):
		action = self.args['action']
		if action == 'filter':
			return self.handle_filter()
		elif action == 'search':
			return self.handler_search()
		elif action == 'shop':
			return self.handle_shop()
		elif action == 'top':
			return self.handle_top()
		else:
			return self.send_error(403)
	def handle_top(self):
		try:
			q = self.session.query(models.Shop).order_by(desc(models.Shop.id))\
			.filter(models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
				models.Shop.shop_code !='not set' )
		except:
			return self.send_fail("shoplist error")
		shops = []

		for shop in q:
			try:
				order_count = self.session.query(models.Order).filter_by(shop_id=shop.id).count()
			except:
				print("[官网店铺列表]错误")
				return self.send_fail('order_count error')
			if order_count:
				shop.order_count = order_count
				self.session.commit()
			else:
				shop.order_count = 0
			shops.append(dict(shop_name=shop.shop_name,shop_code = shop.shop_code,\
				shop_province = shop.shop_province ,shop_city = shop.shop_city ,\
				shop_address_detail = shop.shop_address_detail,\
				shop_intro = shop.shop_intro ,shop_trademark_url=shop.shop_trademark_url,\
				order_count = shop.order_count,shop_admin_name = shop.admin.accountinfo.nickname))
		shops = sorted(shops,key = lambda x:x['order_count'],reverse = True)
		# shops = shops.sort(key = lambda x:x['order_count'])
		shoplist = shops[0:8]
		return self.send_success(shoplist = shoplist)


	@FruitzoneBaseHandler.check_arguments("page?:int",'province?:int','city?:int')
	def handle_filter(self):
		_page_count = 8
		page = self.args["page"] - 1
		q = self.session.query(models.Shop).order_by(desc(models.Shop.id)).\
			filter(models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
				models.Shop.shop_code !='not set' )
		# if "city" in self.args:
		#     q = q.filter_by(shop_city=self.args["city"])
		#     shop_count = q.count()
		#     #print('shop_count',shop_count)
		#     page_total = int(shop_count /10) if shop_count % 10 == 0 else int(shop_count/10) +1
		#     #print('page_total',page_total)
		#     q = q.offset(page * _page_count).limit(_page_count).all()
			
		if "province" in self.args:
			# print('province')
			q = q.filter_by(shop_province=self.args["province"])
			shop_count = q.count()
			page_total = int(shop_count /8) if shop_count % 8 == 0 else int(shop_count/8) +1
			q = q.offset(page * _page_count).limit(_page_count).all()
		else:
			print("[官网店铺列表]省份不存在")

		shoplist = []
		for shop in q:
			shoplist.append(dict(shop_name=shop.shop_name,shop_code = shop.shop_code,\
				shop_province = shop.shop_province ,shop_city = shop.shop_city ,\
				shop_address_detail = shop.shop_address_detail,\
				shop_intro = shop.shop_intro ,shop_trademark_url=shop.shop_trademark_url,\
				shop_admin_name = shop.admin.accountinfo.nickname))
		return self.send_success(shoplist=shoplist,page_total = page_total)
	@FruitzoneBaseHandler.check_arguments("q?:str",'page?:int')
	def hander_search(self):
		_page_count = 8
		page = self.args["page"] - 1
		q = self.session.query(models.Shop).order_by(desc(models.Shop.id)).\
			filter(models.Shop.shop_name.like("%{0}%".format(self.args["q"])),
					models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
					models.Shop.shop_code !='not set' )
		shoplist = []
		shop_count = q.count()
		page_total = int(shop_count /8) if shop_count % 8 == 0 else int(shop_count/8) +1
		q = q.offset(page * _page_count).limit(_page_count).all()
		
		for shop in q:
			shoplist.append(dict(shop_name=shop.shop_name,shop_code = shop.shop_code,\
				shop_province = shop.shop_province ,shop_city = shop.shop_city ,\
				shop_address_detail = shop.shop_address_detail,\
				shop_intro = shop.shop_intro ,shop_trademark_url=shop.shop_trademark_url,\
				shop_admin_name = shop.admin.accountinfo.nickname))
		return self.send_success(shoplist=shoplist ,page_total = page_total)






  