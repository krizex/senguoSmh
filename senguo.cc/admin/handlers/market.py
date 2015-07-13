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
from random import Random

#市场推广 - 首页
class Home(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		#return self.send_success()

		return self.render('market/shop-list.html')
	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments('action',"page?:int","lat","lon")
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
			url = "http://api.map.baidu.com/geocoder/v2/?address="+shop["shop_address"]+"&output=json&ak=2595684c343d6499bf469da8a9c18231"
			r = requests.get(url)
			result = json.loads(r.text)
			if result["status"] == 0:
				lat2 = float(result["result"]["location"]["lat"])
				lon2 = float(result["result"]["location"]["lng"])
			if lat1 and lon1 and lat2 and lon2:
				shop['distance'] = int(self.get_distance(lat1,lon1,lat2,lon2))
			else:
				shop['distance'] = 9999999
		shops.sort(key = lambda shop:shop['distance'])
		total_page = int(shop_count/page_size) if shop_count % page_size == 0 else int(shop_count/page_size)+1
		if total_page <= page:
			nomore = True
		return self.send_success(shops = shops,nomore=nomore)

	@classmethod
	def get_shop_data(self,shop_list):
		shop_data = []
		for shop in shop_list:
			for shop in shops:
				shop_data.append({"id":shop.id,"shop_name":shop.shop_name,"shop_address":shop.shop_address\
				,"curator":shop.curator,"done_time":shop.done_time,"shop_logo":shop.shop_logo,"distance":distance})
		return shop_data

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
		delivery_area = shop.delivery_area

		shop_auth   = shop.shop_auth  if shop.shop_auth else '未录入'
		admin_info = shop.admin_info  if shop.admin_info else '未录入'
		staff_info = shop.staff_info  if shop.staff_info else '为录入'
		description = shop.description if shop.description else '无备注'

		return self.render("market/shop-info.html",shop_logo = shop_logo,shop_name = shop_name,shop_phone=shop_phone,
			shop_address = shop_address,delivery_area = delivery_area,shop_auth = shop_auth ,
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
			shop.shop_auth = self.args['shop_auth']
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
	@AdminBaseHandler.check_arguments('id?','action?:str')
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

		action = self.args.get('action',None)

		id = self.args.get('id',None)
		id = 1
		if id:
			if action == 'bind':
				if not self.is_wexin_browser():
					return self.send_fail("请在微信中执行此从操作!")
				else:
					admin_id  =  self.wx_bind()
					shop_id   =  int(id)
					real_shop_id =  self.add_shop(admin_id,shop_id)
					return self.send_success(real_shop_id = real_shop_id) 
			else:
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
		# return self.send_success()
		return self.render("market/shop-manager.html")
	
	@AdminBaseHandler.check_arguments('shop_id?','admin_name?:str','admin_phone?:str','wx_nickname?:str')
	def post(self):
		action = self.args.get('action',None)
		if action == 'save':
			id = self.args.get('id',None)
			id = 1
			if id:
				try:
					shop = self.session.query(models.Spider_Shop).filter_by(id = int(id)).one()
				except:
					return self.send_fail('shop not found')
				admin_name = self.args['admin_name']
				admin_phone= self.args['admin_phone']
				wx_nickname = wx_nickname
				shop.admin_info = "%s-%s-%s" % (admin_name,admin_phone,wx_nickname)
				self.session.commit()
			return self.render("market/shop-info.html")

	
		

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments('code','mode')
	def wx_bind(self):
		code = self.args.get('code',None)
		next_url = self.get_argument('next', '')
		#next_url = 'http://test123.senguo.cc/market/shopinsert?action=bind'
		if not code:
			print(self.get_wexin_oauth_link2(next_url = next_url))
			return self.redirect(self.get_wexin_oauth_link2(next_url = next_url))
		else:
			code = self.args['code']
			mode = self.args['mode']
			if mode not in ['mp','kf']:
				return self.send_fail('mode error')
			wx_userinfo = self.get_wx_userinfo(code,mode)
			user = self.session.query(models.Accountinfo).filter_by(wx_unionid=wx_userinfo["unionid"]).first()
			if user:
				return user.id
			else:
				print("[微信登录]用户不存在，注册为新用户")
				if wx_userinfo["headimgurl"] not in [None,'']:
					headimgurl = wx_userinfo["headimgurl"]
					headimgurl_small = wx_userinfo["headimgurl"][0:-1] + "132"
				else:
					headimgurl = None
					headimgurl_small = None
				account_info = Accountinfo(
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
					self.session.add(account_info)
					u = mode.ShopAdmin()
					u.accountinfo = account_info
					self.session.commit()
				except:
					return False
				return user.id

	@tornado.web.authenticated
	def add_shop(self,shop_id,admin_id):
		try:
			shop_admin = self.session.query(models.ShopAdmin).filter_by(id = admin_id).one()
		except:
			return self.send_fail('shop_admin not found')
		try:
			temp_shop = self.session.query(mode.Spider_Shop).filter_by(id = shop_id).one()
		except:
			return self.send_fail('temp_shop not found')

		# 添加系统默认的时间段
		period1 = models.Period(name="中午", start_time="12:00", end_time="12:30")
		period2 = models.Period(name="下午", start_time="17:30", end_time="18:00")
		period3 = models.Period(name="晚上", start_time="21:00", end_time="22:00")

		config = models.Config()
		config.periods.extend([period1, period2, period3])
		marketing = models.Marketing()
		shop_code = self.make_shop_code()
		shop = models.Shop(admin_id = admin_id,shop_name = temp_shop.shop_name,
			create_data_timestamp = time.time(),shop_trademark_url = shop.shop_logo,shop_province = 420000,
			shop_city = 420100 , shop_address_detail= shop.shop_address,shop_intro = shop.description,shop_code = shop_code)
		shop.config = config
		shop.marketing = marketing
		shop.shop_start_timestamp = time.time()
		self.session.add(shop)
		self.session.commit()

		######################################################################################
		# inspect whether staff exited
		######################################################################################
		temp_staff = self.session.query(models.ShopStaff).get(shop.admin_id)
		# print('temp_staff')
		# print(shop.admin_id)
		# print(temp_staff)
		if temp_staff is None:
			# print('passssssssssssssssssssssssssssssssssssssssss')
			self.session.add(models.ShopStaff(id=shop.admin_id, shop_id=shop.id))  # 添加默认员工时先添加一个员工，否则报错
			self.session.commit()

		self.session.add(models.HireLink(staff_id=shop.admin_id, shop_id=shop.id,default_staff=1))  # 把管理者默认为新店铺的二级配送员
		self.session.commit()

		#把管理员同时设为顾客的身份
		customer_first = self.session.query(models.Customer).get(shop.admin_id)
		if customer_first is None:
			self.session.add(models.Customer(id = shop.admin_id,balance = 0,credits = 0,shop_new = 0))
			self.session.commit()

		return shop.id
	
	def make_shop_code(self):
		chars = 'abcdefghijklmnopqrstuvwsyz'
		str = ''
		random = Random()
		for i in range(8):
			str += chars[random.randint(0,len(chars)-1)]
		while True:
			shop = self.session.query(models.Shop).filter_by(shop_code = str).first()
			if not shop:
				break
		return str






		


#店铺录入
# class Insert(AdminBaseHandler):
# 	@tornado.web.authenticated
# 	def get(self):


#店铺入驻成功
class Success(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):

		return self.render("market/success.html")

