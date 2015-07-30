from handlers.base import AdminBaseHandler,WxOauth2,unblock,get_unblock,CustomerBaseHandler
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
import json
from random import Random

# 市场推广 - 首页
class Home(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self):
		#return self.send_success()
		logo_img = self.current_user.accountinfo.headimgurl_small
		return self.render('market/shop-list.html',logo_img=logo_img)
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments('action',"page?:int","lat","lon")
	def post(self):
		action = self.args['action']
		page_size = 20
		nomore = False

		_shop = self.session.query(models.Spider_Shop)
		lat1 = float(self.args['lat'])
		lon1 = float(self.args['lon'])
		if "page" in self.args:
			page = int(self.args["page"])
		else:
			page = 0
		if action == 'to_do':
			shop_list = _shop.filter_by(has_done = 0).all()
			shop_count = _shop.filter_by(has_done = 0).count()
		elif action == 'has_done':
			shop_list = _shop.filter_by(has_done = 1).all()
			shop_count = _shop.filter_by(has_done = 1).count()
		else:
			return self.send_fail("action error")
		shops  = self.get_shop_data(shop_list)
		for shop in shops:
			lat2 = shop["lat"]
			lon2 = shop["lon"]
			if lat1 and lon1 and lat2 and lon2:
				shop['distance'] = int(self.get_distance(lon1,lat1,lon2,lat2))
			else:
				shop['distance'] = 9999999
		shops.sort(key = lambda shop:shop['distance'])
		shops = shops[page_size*page:page_size*page+page_size]
		total_page = int(shop_count/page_size) if shop_count % page_size == 0 else int(shop_count/page_size)+1
		if total_page <= page:
			nomore = True
		return self.send_success(shops = shops,nomore=nomore)

	@classmethod
	def get_shop_data(self,shop_list):
		shop_data = []
		for shop in shop_list:
			shop_data.append({"id":shop.id,"shop_name":shop.shop_name,"shop_address":shop.shop_address\
			,"curator":shop.curator,"done_time":shop.done_time,"shop_logo":shop.shop_logo,"lat":shop.lat,"lon":shop.lon})
		return shop_data

# 市场推广 - 店铺信息录入
class Info(CustomerBaseHandler):
	@CustomerBaseHandler.check_arguments('id')

	def get(self):
		id = int(self.args['id'])
		try:
			shop = self.session.query(models.Spider_Shop).filter_by(id = id).one()
		except:
			return self.send_fail(' shop not found')

		token = self.get_qiniu_token("Market_cookie",shop.id)
		self.set_secure_cookie("spider_shop", str(id), domain=ROOT_HOST_NAME)
		shop_logo = shop.shop_logo
		shop_name = shop.shop_name
		shop_phone = shop.shop_phone
		shop_address = shop.shop_address
		delivery_area = shop.delivery_area
		#shop.curator = self.current_user.accountinfo.nickname
		shop_auth   = "已录入"  if shop.shop_auth else '未录入'
		admin_info = shop.admin_info  if shop.admin_info else '未录入'
		staff_info = shop.staff_info  if shop.staff_info else '未录入'
		description = shop.description if shop.description else '无备注'
		self.session.commit()
		return self.render("market/shop-info.html",id =id,shop_logo = shop_logo,shop_name = shop_name,shop_phone=shop_phone,
			shop_address = shop_address,delivery_area = delivery_area,shop_auth = shop_auth ,
			admin_info = admin_info , staff_info = staff_info , description = description,token = token)
	@CustomerBaseHandler.check_arguments('id','action','shop_logo?:str','shop_name?:str','shop_phone?:str','deliver_area?:str',
		'shop_address?:str','description?:str','admin_info?:str','staff_info?:str','shop_auth?:str','data')
	def post(self):
		id = int(self.args['id'])
		action = self.args['action']
		try:
			shop = self.session.query(models.Spider_Shop).filter_by(id = id).one()
		except:
			return self.send_fail('shop not found')
		if action == 'logo':
			shop.shop_logo = self.args['data']['shop_logo']
		elif action == 'name':
			shop.shop_name = self.args['data'].get('shop_name',None)
		elif action == 'phone':
			shop.shop_phone = self.args['data'].get('shop_phone',None)
		elif action == 'deliver_area':
			shop.delivery_area = self.args['data'].get('deliver_area',None)
		elif action == 'shop_address':
			shop.shop_address = self.args['data'].get('shop_address',None)
		elif action == 'description':
			shop.description = self.args['data'].get('description',None)
		elif action == 'admin_info':
			pass
		elif action == 'staff_info':
			pass
		elif action == 'shop_auth':
			shop.shop_auth = self.args['data']['shop_auth']
		else:
			return self.send_fail('[MarketInfo]action error')

		self.session.commit()
		return self.send_success()
	@CustomerBaseHandler.check_arguments('admin_name?:str','admin_phone?:str','wx_nickname')
	def bing_admin(self):
		admin_name = self.args.get('admin_name',None)
		admin_phone = self.args.get('admin_phone',None)

# 市场推广 - 店长信息录入
class ShopAdminInfo(CustomerBaseHandler):
	@CustomerBaseHandler.check_arguments('action?:str')
	def get(self,id):
		print("[MarketShopAdminInfo]self.args:",self.args)
		#shop_id = int(self.get_secure_cookie("spider_shop"))
		#shop_id = int(self.args['id'])
		shop_id = int(id)
		action = self.args.get('action',None)
		print("[MarketShopAdminInfo]shop_id:",shop_id)
		if shop_id:
			shop = self.session.query(models.Spider_Shop).filter_by(id = shop_id).first()
			if not shop:
				return self.send_fail('[MarketShopAdminInfo]shop not found')
			print("[MarketShopAdminInfo]action:",action,", self.args:",self.args)
			if action == 'bind':
				#if not self.is_wexin_browser():
				#	return self.send_fail("请在微信中执行此从操作!")
				#else:
				if shop.has_done == 1:
					return self.send_fail('该店铺已录入！')
				admin_id  =  self.wx_bind(shop_id)
				print("[MarketShopAdminInfo]admin_id:",admin_id)
				shop.done_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
				#shop.curator = self.current_user.accountinfo.nickname
				self.session.commit()
				shop_code =  self.add_shop(admin_id,shop_id)
				return self.render('market/shop-success.html')

			else:
				admin_info = shop.admin_info
				if admin_info:
					admin_name,admin_phone,wx_nickname = admin_info.split('-')
				else:
					admin_name = admin_phone = wx_nickname = None
		else:
			return self.send_fail('id error')
		url = "http://i.senguo.cc/market/shopinsert/%s?action=bind" % (str(shop_id))
		print("[MarketShopAdminInfo]url:",url)
		return self.render("market/shop-manager.html",url=url,shop_id = shop_id)

	@CustomerBaseHandler.check_arguments('admin_name?:str','admin_phone?:str','action')
	def post(self,id):
		action = self.args.get('action',None)
		print("[MarketShopAdminInfo]id:",id)
		if action == 'save':
			#id = self.args.get('id',None)
			if id:
				try:
					shop = self.session.query(models.Spider_Shop).filter_by(id = int(id)).one()
				except:
					return self.send_fail('shop not found')
				admin_name = self.args['admin_name']
				admin_phone= self.args['admin_phone']
				if shop.done_time:
					wx_info = '微信已绑定'
				else:
					wx_info = '微信未绑定'
				shop.curator = self.current_user.accountinfo.nickname
				shop.admin_info = "%s-%s-%s" % (admin_name,admin_phone,wx_info)
				self.session.commit()
			return self.send_success()
		else:
			return self.send_fail('action error')

	@CustomerBaseHandler.check_arguments('code')
	def wx_bind(self,shop_id):
		code = self.args.get('code',None)
		next_url = self.get_argument('next', '')
		#next_url = 'http://test123.senguo.cc/market/shopinsert?action=bind'
		if not code:
			#print(self.get_wexin_oauth_link2(next_url = next_url))
			#return self.redirect(self.get_wexin_oauth_link2(next_url = next_url))
			url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid={0}&redirect_uri={1}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect'.format(MP_APPID,'http://auth.senguo.cc/market/shopinsert/%d?action=bind') %(shop_id)
			print("[MarketShopAdminInfo]wx_bind: url:",url)
			return self.redirect(url)
		else:
			code = self.args['code']
			print("[MarketShopAdminInfo]wx_bind: code:",code)
			mode = 'mp'
			wx_userinfo = self.get_wx_userinfo(code,mode)
			user = self.session.query(models.Accountinfo).filter_by(wx_unionid=wx_userinfo["unionid"]).first()
			if user:
				print("[MarketShopAdminInfo]wx_bind: user exists, ID:",user.id)
				return user.id
			else:
				print("[MarketShopAdminInfo]wx_bind: user not exists, regiest as new user")
				if wx_userinfo["headimgurl"] not in [None,'']:
					headimgurl = wx_userinfo["headimgurl"]
					headimgurl_small = wx_userinfo["headimgurl"][0:-1] + "132"
				else:
					headimgurl = None
					headimgurl_small = None
				account_info = models.Accountinfo(
					wx_unionid=wx_userinfo["unionid"],
					wx_openid=wx_userinfo["openid"],
					wx_country=wx_userinfo["country"],
					wx_province=wx_userinfo["province"],
					wx_city=wx_userinfo["city"],
					headimgurl=headimgurl,
					headimgurl_small = headimgurl_small,
					nickname=wx_userinfo["nickname"],
					sex = wx_userinfo["sex"])
				try:
					#self.session.add(account_info)
					u = models.ShopAdmin()
					u.accountinfo = account_info
					self.session.add(u)
					self.session.commit()
					print('[MarketShopAdminInfo]wx_bind: get wx_userinfo success')
				except:
					return False
				return u.id

	# 生成店铺、添加商品
	def add_shop(self,admin_id,shop_id):
		print('[MarketShopAdminInfo]add_shop: login in add_shop')

		shop_admin = self.session.query(models.ShopAdmin).filter_by(id = admin_id).first()
		if not shop_admin:

			return self.send_fail('[MarketShopAdminInfo]add_shop: shop_admin not found')
		temp_shop = self.session.query(models.Spider_Shop).filter_by(id = int(shop_id)).first()
		if not temp_shop:
			return self.send_fail('[MarketShopAdminInfo]add_shop: temp_shop not found')

		# 添加系统默认的时间段
		period1 = models.Period(name="中午", start_time="12:00", end_time="12:30")
		period2 = models.Period(name="下午", start_time="17:30", end_time="18:00")
		period3 = models.Period(name="晚上", start_time="21:00", end_time="22:00")

		config = models.Config()
		config.periods.extend([period1, period2, period3])
		marketing = models.Marketing()
		shop_code = self.make_shop_code()
		print('[MarketShopAdminInfo]add_shop: make shop_code success')
		temp_shop.shop_code = shop_code
		shop = models.Shop(admin_id = admin_id,shop_name = temp_shop.shop_name,
			create_date_timestamp = time.time(),shop_trademark_url = temp_shop.shop_logo,shop_province = 420000,shop_auth = 5,
			shop_city = 420100 , shop_address_detail= temp_shop.shop_address,shop_intro = temp_shop.description,shop_code = shop_code,shop_phone=temp_shop.shop_phone,lat=temp_shop.lat,lon = temp_shop.lon)
		shop.config = config
		shop.marketing = marketing
		shop.shop_start_timestamp = time.time()
		temp_shop.has_done = 1
		self.session.add(shop)
		self.session.commit()
		print('[MarketShopAdminInfo]add_shop: shop add success')

		# 添加商品
		print('[MarketShopAdminInfo]add_shop: start add goods')
		spider_goods = self.session.query(models.Spider_Good).filter_by(shop_id = temp_shop.shop_id).all()
		for temp_good in spider_goods:
			print("[MarketShopAdminInfo]add_shop: shop.id:",shop.id)
			new_good = models.Fruit(shop_id = shop.id , fruit_type_id = 999,name = temp_good.goods_name,
				storage = 100,unit = 2,img_url = temp_good.good_img_url ,)
			new_good.charge_types.append(models.ChargeType(price = temp_good.goods_price,unit = 2,num =1,market_price = temp_good.goods_price))
			self.session.add(new_good)
			self.session.commit()
		######################################################################################
		# inspect whether staff exited
		######################################################################################
		temp_staff = self.session.query(models.ShopStaff).get(shop.admin_id)
		# print('[MarketShopAdminInfo]add_shop: temp_staff:',temp_staff)
		# print('[MarketShopAdminInfo]add_shop: admin_id:',shop.admin_id)
		if temp_staff is None:
			self.session.add(models.ShopStaff(id=shop.admin_id, shop_id=shop.id))  # 添加默认员工时先添加一个员工，否则报错
			self.session.commit()

		self.session.add(models.HireLink(staff_id=shop.admin_id, shop_id=shop.id,default_staff=1))  # 把管理者默认为新店铺的二级配送员
		self.session.commit()

		#把管理员同时设为顾客的身份
		customer_first = self.session.query(models.Customer).get(shop.admin_id)
		if customer_first is None:
			self.session.add(models.Customer(id = shop.admin_id,balance = 0,credits = 0,shop_new = 0))
			self.session.commit()

		return shop.shop_code

	# 生成店铺号，格式：whXXXXXX(6位随机数字)
	def make_shop_code(self):
		chars = '0123456789'
		str = ''
		random = Random()
		while True:
			for i in range(6):
				str += chars[random.randint(0,len(chars)-1)]
			shop = self.session.query(models.Shop).filter_by(shop_code = str).first()
			if not shop:
				break
		return 'wh'+ str

# 店铺录入
# class Insert(AdminBaseHandler):
# 	@tornado.web.authenticated
# 	def get(self):

# 店铺入驻成功
class Success(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments('id')
	def get(self):
		id = self.args['id']
		try:
			shop = self.session.query(models.Spider_Shop).filter_by(id = int(id)).one()
		except:
			return self.send_fail('shop not found')
		shop_name = shop.shop_name
		curator = shop.curator
		done_time = shop.done_time
		shop_code = shop.shop_code
		print('[MarketSuccess]self.current_user.accountinfo.nickname:',self.current_user.accountinfo.nickname)
		print('[MarketSuccess]shop_code:',shop_code,', curator:',curator,', shop_name:',shop_name)
		return self.render("market/success.html",curator = curator , done_time = done_time , shop_code = shop_code, shop_name=shop_name)
