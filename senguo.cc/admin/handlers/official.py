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
		print(self)
		shop_count = self.get_shop_count()
		try:
			q = self.session.query(models.Shop).order_by(desc(models.Shop.id))\
			.filter(models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
				models.Shop.shop_code !='not set' )
		except:
			return self.send_fail("shoplist error")
		shops = []

		for shop in q:
			try:
				print(shop.id)
				order_count = self.session.query(models.Order).filter_by(shop_id=shop.id).count()
			except:
				print('error')
				return self.send_fail('order_count error')
			if order_count:
				shop.order_count = order_count
				print('shop success',shop.order_count)
			else:
				shop.order_count = 0
				print('shop',order_count)
			print(order_count)
			print(shop.order_count)
			shops.append(dict(shop_name=shop.shop_name,shop_code = shop.shop_code,\
				shop_province = shop.shop_province ,shop_city = shop.shop_city ,\
				shop_address_detail = shop.shop_address_detail,\
				shop_intro = shop.shop_intro ,shop_trademark_url=shop.shop_trademark_url,\
				order_count = shop.order_count))
		shops = sorted(shops,key = lambda x:x['order_count'],reverse = True)
		# shops = shops.sort(key = lambda x:x['order_count'])
		shoplist = shops[0:8]
		print(shoplist)
		return self.send_success( shoplist = shoplist,shop_count = shop_count ,)
		# return self.render("official/index.html",context=dict(shop_count = shop_count,subpage=""))
	   # return self.send_success(shop_count = shop_count)

	def post(self):
		action = self.args['action']
		if action == 'filter':
			return self.handle_filter()
		elif action == 'search':
			return self.handler_search()
		elif action == 'shop':
			return self.handle_shop()
		else:
			return self.send_error(403)

	@FruitzoneBaseHandler.check_arguments("page?:int")
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
			print('province')
			q = q.filter_by(shop_province=self.args["province"])
			shop_count = q.count()
			page_total = int(shop_count /8) if shop_count % 8 == 0 else int(shop_count/8) +1
			q = q.offset(page * _page_count).limit(_page_count).all()
		else:
			print("province not in args")

		shops = []
		for shop in q:
			shops.append(dict(shop_name=shop.shop_name,shop_code = shop.shop_code,\
				shop_province = shop.shop_province ,shop_city = shop.shop_city ,\
				shop_address_detail = shop.shop_address_detail,\
				shop_intro = shop.shop_intro ,shop_trademark_url=shop.shop_trademark_url,\
				order_count = shop.order_count))
		return self.send_success(shops=shops,page_total = page_total)

	def hander_search(self):
		_page_count = 8
		page = self.args["page"] - 1
		q = self.session.query(models.Shop).order_by(desc(models.Shop.id)).\
			filter(models.Shop.shop_name.like("%{0}%".format(self.args["q"])),
					models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
					models.Shop.shop_code !='not set' )
		shops = []
		shop_count = q.count()
		page_total = int(shop_count /8) if shop_count % 8 == 0 else int(shop_count/8) +1
		q = q.offset(page * _page_count).limit(_page_count).all()
		
		for shop in q:
			shops.append(dict(shop_name=shop.shop_name,shop_code = shop.shop_code,\
				shop_province = shop.shop_province ,shop_city = shop.shop_city ,\
				shop_address_detail = shop.shop_address_detail,\
				shop_intro = shop.shop_intro ,shop_trademark_url=shop.shop_trademark_url,\
				order_count = shop.order_count))
		return self.send_success(shops=shops ,page_total = page_total)






  