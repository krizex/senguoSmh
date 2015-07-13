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
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments('action')
	def post(self):
		if action == 'to_do':
			shop_list = self.session.query(models.Spider_Shop).filter_by(has_done = 0).all()
		elif action == 'has_done':
			shop_list = self.session.query(models.Spider_Shop).filter_by(has_done = 1).all()
		else:
			return self.send_fail("action error")
		shops  = self.get_shop_data(shop_list)
		return self.send_success(shops = shops)

	@classmethod
	def get_shop_data(self,shop_list):
		data = []
		for shop in shop_list:
			shop_data['id'] = shop.id
			shop_data['shop_name']  = shop.shop_name
			shop_data['lat']  = shop.lat
			shop_data['lon']  = shop.lon
			shop_data['shop_address'] = shop.shop_address
			data.append(shop_data)
		return data


#店铺信息
class Info(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments('id')

	def get(self):
		id = int(self.args['id'])
		try:
			shop = self.session.query(models.Spider_Shop).filter_by(id = id).one()
		except:
			return self.send_fail(' shop not found')

		token = self.get_qiniu_token("Market_cookie",shop.id)

		shop_logo = shop.shop_logo
		shop_name = shop.shop_name
		shop_phone = shop.shop_phone
		shop_address = shop.shop_address
		deliver_area = shop.deliver_area

		shop_auth   = shop.shop_auth  if shop.shop_auth else '未录入'
		admin_info = shop.admin_info  if shop.admin_info else '未录入'
		staff_info = shop.staff_info  if shop.staff_info else '为录入'
		description = shop.description if shop.description else '无备注'

		return self.render("market/shop-info.html",shop_logo = shop_logo,shop_name = shop_name,shop_phone=shop_phone,
			shop_address = shop_address,deliver_area = deliver_area,shop_auth = shop_auth ,
			admin_info = admin_info , staff_info = staff_info , description = description,token = token)

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments('id','action','shop_logo?:str','shop_name?:str','shop_phone?:str','deliver_area?:str',
		'shop_address?:str','description?:str','admin_info?:str','staff_info?:str','shop_auth?:str')
	def post(self):
		id = int(self.args['id'])
		try:
			shop = self.session.query(models.Spider_Shop).filter_by(id = id).one()
		except:
			return self.send_fail('shop not found')
		if action == 'logo':
			shop.shop_logo = self.args['shop_logo']
		elif action == 'name':
			shop.shop_name = self.args['shop_name']
		elif action == 'phone':
			shop.shop_phone = self.args['shop_phone']
		elif action == 'deliver_area':
			shop.deliver_area = self.args['deliver_area']
		elif action == 'shop_address':
			shop.shop_address = self.args['shop_address']
		elif action == 'description':
			shop.description = self.args['description']
		elif action == 'admin_info':
			pass
		elif action == 'staff_info':
			pass
		elif action == 'shop_auth':
			pass
		else:
			return self.send_fail('action error')

		self.session.commit()
		return self.send_success()
	@AdminBaseHandler.check_arguments('admin_name?:str','admin_phone?:str','wx_nickname')
	def bing_admin(self):
		admin_name = self.args.get('admin_name',None)
		admin_phone = self.args.get('admin_phone',None)

#店长信息
class ShopAdminInfo(AdminBaseHandler):
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments('id?')
	def get(self):
		id = self.args.get('id',None)
		if id:
			try:
				shop = self.session.query(models.Spider_Shop).filter_by(id = int(id)).one()
			except:
				return self.send_fail('shop not found')
			admin_info = shop.admin_info
			if admin_info:
				admin_name,admin_phone,wx_nickname = admin_info.split('-')
			else:
				admin_name = admin_phone = wx_nickname = None
		else:
			return self.send_fail('id error')
		return self.send_success()
	@AdminBaseHandler.check_arguments('shop_id?','admin_name?:str','admin_phone?:str','wx_nickname?:str')
	def post(self):
		id = self.args.get('id',None)
		if id:
			try:
				shop = self.session.query(models.Spider_Shop).filter_by(id = int(id)).one()
			except:
				return self.send_fail('shop not found')
			admin_name = self.args['admin_name']
			admin_phone= self.args['admin_phone']

	








		
		