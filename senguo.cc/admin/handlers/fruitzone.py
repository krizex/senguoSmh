from handlers.base import FruitzoneBaseHandler, _AccountBaseHandler,WxOauth2,unblock

import dal.models as models
import tornado.web
from  dal.db_configs import DBSession
from sqlalchemy import select
from sqlalchemy import desc,func
from dal.dis_dict import dis_dict

import datetime, time, random
from libs.msgverify import gen_msg_token,check_msg_token,user_subscribe
from libs.alipay import WapAlipay
from settings import *
from libs.utils import Logger
import libs.xmltodict as xmltodict
import qiniu
from qiniu.services.storage.bucket import BucketManager
from settings import APP_OAUTH_CALLBACK_URL, MP_APPID, MP_APPSECRET, ROOT_HOST_NAME
import requests
import json
import tornado.gen
from tornado.concurrent import run_on_executor
from concurrent.futures import ThreadPoolExecutor
import decimal

class Home(FruitzoneBaseHandler):
	def get(self):
	   shop_count = self.get_shop_count()
	   return self.render("fruitzone/index.html",context=dict(shop_count = shop_count,subpage=""))

# 店铺搜索
class SearchList(FruitzoneBaseHandler):
	def get(self):

	   return self.render("fruitzone/search-list.html")

# 店铺列表
class ShopList(FruitzoneBaseHandler):
	def initialize(self):
		self.remote_ip = self.request.headers.get('X-Forwarded_For',\
			self.request.headers.get('X-Real-Ip',self.request.remote_ip))
	@FruitzoneBaseHandler.check_arguments('action?:str')

	def get(self):
		remote_ip = self.remote_ip
		# print(remote_ip)
		url = 'http://ip.taobao.com/service/getIpInfo.php?ip={0}'.format(remote_ip)
		res =  requests.get(url,headers = {"connection":"close"})
		content = res.text
		# print(content)
		t = json.loads(content)
		data = t.get('data',None)
		if data:
			city = data.get('city',None)
			city_id = data.get('city_id',None)
		else:
			city = None
			city_id = None
			print('ShopList: get city by ip error!')

		province_count=self.get_shop_group()
		shop_count = self.get_shop_count()
		# fruit_types = []
		# for f_t in self.session.query(models.FruitType).all():
		#     fruit_types.append(f_t.safe_props())
		# print(city_id+"===========")
		return self.render("fruitzone/list.html", context=dict(province_count=province_count,\
			city = city ,city_id = city_id,shop_count=shop_count,subpage="home"))

	@unblock
	@FruitzoneBaseHandler.check_arguments("action")
	def post(self):
		action = self.args["action"]
		if action == "filter":
			return self.handle_filter()
		elif action == "search":
			return self.handle_search()
		elif action == "qsearch":
			return self.handle_qsearch()
		elif action =="shop":
			return self.handle_shop()
		elif action == 'admin_shop':
			return self.handle_admin_shop()
		else:
			return self.send_error(403)

	def get_data(self,q):
		shops = []
		for shop in q:
				if shop.shop_code !='not set' and shop.status !=0:
					satisfy = 0
					shop.__protected_props__ = ['admin', 'create_date_timestamp', 'admin_id', 'id', 'wx_accountname','auth_change',
												 'wx_nickname', 'wx_qr_code','wxapi_token','shop_balance',\
												 'alipay_account','alipay_account_name','available_balance',\
												 'new_follower_sum','new_order_sum']
					orders = self.session.query(models.Order).filter_by(shop_id = shop.id ,status =6).first()
					if orders:
						commodity_quality = 0
						send_speed = 0
						shop_service = 0
						q = self.session.query(func.avg(models.Order.commodity_quality),\
							func.avg(models.Order.send_speed),func.avg(models.Order.shop_service)).filter_by(shop_id = shop.id).all()
						if q[0][0]:
							commodity_quality = int(q[0][0])
						if q[0][1]:
							send_speed = int(q[0][1])
						if q[0][2]:
							shop_service = int(q[0][2])
						if commodity_quality and send_speed and shop_service:
							satisfy = float((commodity_quality + send_speed + shop_service)/300)
						else:
							satisfy = 0
					comment_count = self.session.query(models.Order).filter_by(shop_id = shop.id ,status =6).count()
					fruit_count = self.session.query(models.Fruit).filter_by(shop_id = shop.id,active = 1).count()
					mgoods_count =self.session.query(models.MGoods).join(models.Menu,models.MGoods.menu_id == models.Menu.id)\
					.filter(models.Menu.shop_id == shop.id,models.MGoods.active == 1).count()
					shop.satisfy = "%.0f%%"  %(round(decimal.Decimal(satisfy),2)*100)
					shop.comment_count = comment_count
					shop.goods_count = fruit_count
					shops.append(shop.safe_props())
		# print(shops,'shops')
		return shops

	@FruitzoneBaseHandler.check_arguments("page:int")
	def handle_shop(self):

		_page_count =15
		page=self.args["page"]-1
		nomore = False
		q = self.session.query(models.Shop).order_by(models.Shop.shop_auth.desc(),models.Shop.id.desc())\
		.filter(models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
			models.Shop.shop_code !='not set' ,models.Shop.status !=0 )
		shop_count = q.count()
		# page_total = int(shop_count /_page_count) if shop_count % _page_count == 0 else int(shop_count/_page_count) +1
		q=q.offset(page*_page_count).limit(_page_count).all()
		shops = self.get_data(q)
		if shops == [] or len(shops)<_page_count:
			nomore =True
		return self.send_success(shops=shops,nomore = nomore)

	@FruitzoneBaseHandler.check_arguments("skip?:int","limit?:int","province?:int",
									  "city?:int", "service_area?:int", "live_month?:int",
									  "onsalefruit_ids?:list","page:int","key_word?:int",'lat?:str','lon?:str')
	def handle_filter(self):
		# 按什么排序？暂时采用id排序
		_page_count = 15
		page = self.args["page"] - 1
		nomore = False
		q = self.session.query(models.Shop).order_by(models.Shop.shop_auth.desc(),models.Shop.id.desc()).\
			filter(models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
				models.Shop.shop_code !='not set',models.Shop.status !=0 )
		shops = []

		if "service_area" in self.args:
			service_area = int(self.args['service_area'])
			if service_area > 0:
				q = q.filter(models.Shop.shop_service_area.op("&")(self.args["service_area"])>0)
			# q = q.filter_by(shop_service_area = service_area)

		if "city" in self.args:
			q = q.filter_by(shop_city=self.args["city"])
			shop_count = q.count()
			#print('shop_count',shop_count)
			# page_total = int(shop_count /_page_count) if shop_count % _page_count == 0 else int(shop_count/_page_count) +1
			#print('page_total',page_total)
			q = q.offset(page * _page_count).limit(_page_count).all()

		elif "province" in self.args:
			# print('province')
			q = q.filter_by(shop_province=self.args["province"])
			shop_count = q.count()
			# page_total = int(shop_count /_page_count) if shop_count % _page_count == 0 else int(shop_count/_page_count) +1
			q = q.offset(page * _page_count).limit(_page_count).all()
		else:
			print("ShopList: handle_filter error")


		# if "live_month" in self.args:
		#     q = q.filter(models.Shop.shop_start_timestamp < time.time()-self.args["live_month"]*(30*24*60*60))


		# if "onsalefruit_ids" in self.args and self.args["onsalefruit_ids"]:
		#     q = q.filter(models.Shop.id.in_(
		#         select([models.ShopOnsalefruitLink.shop_id]).\
		#         where(models.ShopOnsalefruitLink.fruit_id.in_(
		#             self.args["onsalefruit_ids"]))
		#     ))

		# if "skip" in self.args:
		#     q = q.offset(self.args["skip"])

		# if "limit" in self.args:
		#     q = q.limit(self.args["limit"])
		# else:
		#     q = q.limit(self._page_count)
		shops = self.get_data(q)
		if "key_word" in self.args:
			key_word = int(self.args['key_word'])
			if key_word == 1: #商品最多
				shops.sort(key = lambda shop:shop['goods_count'],reverse = True)
			elif key_word == 2: #距离最近
				lat1 = float(self.args['lat'])
				lon1 = float(self.args['lon'])
				for shop in shops:
					lat2 = shop['lat']
					lon2 = shop['lon']
					if lat1 and lon1 and lat2 and lon2:
						shop['distance'] = int(self.get_distance(lat1,lon1,lat2,lon2))
					else:
						shop['distance'] = 9999999
				shops.sort(key = lambda shop:shop['distance'])
			elif key_word == 3: #满意度最高
				shops.sort(key = lambda shop:shop['satisfy'],reverse = True)
			elif key_word == 4: #评价最多
				shops.sort(key = lambda shop:shop['comment_count'],reverse = True)
			else:
				return self.send_fail(error_text = 'key_word error')
		shops = shops[_page_count*page:_page_count*page+_page_count]
		print(shops+"*******店铺数据**********")
		if shops == [] or len(shops)<_page_count:
			nomore =True
		return self.send_success(shops=shops,nomore = nomore)

	@FruitzoneBaseHandler.check_arguments('id:int')
	def handle_admin_shop(self):
		admin_id = int(self.args['id'])
		shop_admin = self.session.query(models.ShopAdmin).filter_by(id = admin_id).first()
		if not shop_admin:
			return self.send_fail('shop_admin not found!')
		shop_list = shop_admin.shops
		shops = self.get_data(shop_list)
		return self.send_success(shops=shops)


	@FruitzoneBaseHandler.check_arguments("q","page:int")
	def handle_search(self):
		_page_count = 15
		page = self.args["page"] - 1
		nomore = False
		q = self.session.query(models.Shop).order_by(models.Shop.shop_auth.desc(),models.Shop.id.desc()).\
			filter(models.Shop.shop_name.like("%{0}%".format(self.args["q"])),
				   models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
				   models.Shop.shop_code !='not set',models.Shop.status !=0 )
		shops = []
		shop_count = q.count()
		# page_total = int(shop_count /_page_count) if shop_count % _page_count == 0 else int(shop_count/_page_count) +1
		q = q.offset(page * _page_count).limit(_page_count).all()
		shops = self.get_data(q)
		if shops == [] or len(shops)<_page_count:
			nomore =True
		return self.send_success(shops=shops ,nomore = nomore)
	##快速搜索
	@FruitzoneBaseHandler.check_arguments("q")
	def handle_qsearch(self):
		q = self.session.query(models.Shop).order_by(models.Shop.shop_auth.desc(),models.Shop.id.desc()).\
			filter(models.Shop.shop_name.like("%{0}%".format(self.args["q"])),
				   models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
				   models.Shop.shop_code !='not set',models.Shop.status !=0 )
		shops = []

		q = q.distinct().count()
		# for i in q:
		# 	count = self.session.query(models.Shop).order_by(models.Shop.shop_auth.desc(),models.Shop.id.desc()).\
		# 	filter(models.Shop.shop_name==i[0],models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
		# 		   models.Shop.shop_code !='not set',models.Shop.status !=0 ).count()
		# 	shops.append({'name':i[0],'count':count})
		return self.send_success(q=q)

class Community(FruitzoneBaseHandler):
	def get(self):
	   return self.render("fruitzone/community.html",context=dict(subpage="cummunity"))

class AdminHome(FruitzoneBaseHandler):
	@tornado.web.authenticated
	def get(self):
	   # 模板中通过current_user获取当前admin的相关数据，
	   # 具体可以查看models.ShopAdmin中的属性
	   self.render("fruitzone/admin-home.html",context=dict(subpage="adminHome"))

	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("action", "feedback_text")
	def post(self):
		if self.args["action"] == "feedback":
			feedback = models.Feedback(
				text=self.args["feedback_text"],
				create_date_timestamp = int(time.time())
			)
			self.current_user.feedback.append(feedback)
			self.session.commit()
			return self.send_success()
		else:
			return self.send_error(404)

class AdminProfile(FruitzoneBaseHandler):
	@tornado.web.authenticated
	def get(self):
	   # 模板中通过current_user获取当前admin的相关数据，
	   # 具体可以查看models.ShopAdmin中的属性
	   time_tuple = time.localtime(self.current_user.accountinfo.birthday)
	   birthday = time.strftime("%Y-%m", time_tuple)
	   self.render("fruitzone/admin-profile.html", context=dict(birthday=birthday))

	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("action", "data")
	def post(self):
		action = self.args["action"]
		data = self.args["data"]

		if action == "edit_headimg":
			pass
		elif action == "edit_nickname":
			pass
		elif action == "edit_realname":
			self.current_user.accountinfo.update(session=self.session, realname=data)
		elif action == "edit_wx_username":
			self.current_user.accountinfo.update(session=self.session, wx_username=data)
		elif action == "edit_email":
			self.current_user.accountinfo.update(session=self.session, email=data)
		elif action == "edit_sex":
			self.current_user.accountinfo.update(session=self.session, sex=data)
		elif action == "edit_birthday":
			year = int(data["year"])
			month = int(data["month"])
			try:
				birthday = datetime.datetime(year=year, month=month, day=19)
			except ValueError as e:
				return self.send_fail("月份必须为1~12")
			self.current_user.accountinfo.update(session=self.session, birthday=time.mktime(birthday.timetuple()))
		elif action == "edit_intro":
			if len(data) >= 300:
				self.send_fail("太长了，请控制在300字以内")
			self.current_user.update(session=self.session, briefintro=data)
		else:
			return self.send_error(404)
		return self.send_success()

# 店铺申请引导到微信的扫码界面
class ToWeixin(FruitzoneBaseHandler):
	def get(self):
		return self.render("fruitzone/toweixin.html")

# 店铺申请提交成功
class ApplySuccess(FruitzoneBaseHandler):
	def get(self):
		return self.render("fruitzone/apply-success.html")

# 店铺申请
class ShopApply(FruitzoneBaseHandler):
	MAX_APPLY_COUNT = 150

	def initialize(self, action):
		self._action = action

	def prepare(self):
		if not self.is_wexin_browser():
			return self.render("fruitzone/toweixin.html")
		pass

	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("shop_id?:int")
	def get(self):
		if self._action == "apply":
			##############################################################################
			# user's subscribe
			##############################################################################
			# print('apply')

			# shop = self.session.query(models.ShopTemp).filter_by(id=shop_id).one()
			# account_info = self.session.query(models.Accountinfo).get(shop.admin_id)
			wx_openid = self.current_user.accountinfo.wx_openid
			# wx_openid = 'o5SQ5tyC5Ab_g6PP2uaJV1xe2AZQ'
			subscribe = WxOauth2.get_user_subcribe(wx_openid)
			# print("subscribe",subscribe,wx_openid)
			# subscribe = 0
			# if not self.current_user.accountinfo.phone or \
			#     not self.current_user.accountinfo.email or\
			#     not self.current_user.accountinfo.wx_username:
			#     return self.render("fruitzone/apply.html", context=dict(reApply=False,
			#         need_complete_accountinfo=True))

			return self.render("fruitzone/apply.html", context=dict(reApply=False,subscribe=subscribe))
		elif self._action == "reApply":
			if "shop_id" not in self.args:
				return self.send_error(404)
			shop_id = self.args["shop_id"]
			# print('reApply')
			try:
				shop = self.session.query(models.ShopTemp).filter_by(id=shop_id).one()
				# useless  lookup the value of user's subscribe
				wx_openid = self.current_user.accountinfo.wx_openid
				subscribe = user_subscribe(wx_openid)
				# print(subscribe)
			except:
				shop = None
			if not shop:
				return self.send_error(404)
			return self.render("fruitzone/apply.html", context=dict(shop=shop,reApply=True,subscribe=subscribe))

	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments(
		"shop_name", "shop_id?:int",
		"shop_province:int", "shop_city:int", "shop_address_detail",
		"have_offline_entity:bool", "shop_service_area:int","shop_phone",
		"shop_intro", "realname:str", "wx_username:str", "code:int","lat","lon")
	def post(self):
		#* todo 检查合法性

		if self._action == "apply":
			account_id = self.current_user.accountinfo.id
			#判断申请店铺的微信是否已是某店铺的管理员身份
			try:
				if_admin = self.session.query(models.HireLink).join(models.ShopStaff,models.HireLink.staff_id == models.ShopStaff.id)\
				.filter(models.HireLink.active==1,models.HireLink.work ==9 ,models.ShopStaff.id == account_id).first()
			except:
				if_admin = None
			try:
				if_shop = self.session.query(models.Shop).filter_by(id = if_admin.shop_id).first()
			except:
				if_shop = None
			if if_admin:
				return self.send_fail('该账号已是'+if_shop.shop_name+'的管理员，不能使用该账号申请店铺，若要使用该账号，请退出'+if_shop.shop_name+'管理员身份更换或其它账号')


			#首个店铺未进行店铺认证不允许再申请店铺
			try:
				shops = self.session.query(models.Shop).filter_by(admin_id=account_id)
			except:
				shops = None

			if shops:
				shop_frist = shops.first()
				if shop_frist:
					if shop_frist.shop_auth==0:
						return self.send_fail("您的第一个店铺还未进行认证，店铺认证后才可申请多个店铺。个人认证可申请5个店铺，企业认证可申请15个店铺。")
					elif shop_frist.shop_auth in [1,4] and shops.count() >= 5:
						return self.send_fail("首个店铺为个人认证最多只可申请5个店铺")
					elif shop_frist.shop_auth in [2,3] and shops.count() >= 15:
						return self.send_fail("首个店铺为企业认证最多只可申请15个店铺")

			if not check_msg_token(phone=self.args['shop_phone'], code=self.args["code"]):
				# print('check_msg_token' + self.current_user.accountinfo.wx_unionid)
				return self.send_fail(error_text="验证码过期或者不正确")  #
			# 这种检查方式效率比较低
			if len(self.current_user.shops) >= self.MAX_APPLY_COUNT:
				return self.send_fail(error_text="您申请的店铺数量超过限制！最多能申请{0}家".format(self.MAX_APPLY_COUNT))
			self.session.add(models.ShopTemp(admin_id=self.current_user.id,
			  shop_name=self.args["shop_name"],
			  shop_province=self.args["shop_province"],
			  shop_city = self.args["shop_city"],
			  shop_address_detail=self.args["shop_address_detail"],
			  shop_phone =self.args["shop_phone"],
			  have_offline_entity=self.args["have_offline_entity"],
			  shop_service_area=self.args["shop_service_area"],
			  shop_intro=self.args["shop_intro"],
			  lat=self.args["lat"],
			  lon=self.args["lon"]),
			)

			self.current_user.accountinfo.realname = self.args["realname"]
			self.current_user.accountinfo.wx_username = self.args["wx_username"]
			self.session.commit()
			return self.send_success()

		elif self._action == "reApply":
			if not "shop_id" in self.args:
				return  self.send_error(404)
			shop_id = self.args["shop_id"]
			try:
				shop_temp = self.session.query(models.ShopTemp).filter_by(id=shop_id).one()
			except:
				shop_temp = None
			if not shop_temp:
				return self.send_error(404)
			shop_temp.update(session=self.session, shop_name=self.args["shop_name"],
						shop_province=self.args["shop_province"],
						shop_city=self.args["shop_city"],
						shop_address_detail=self.args["shop_address_detail"],
						have_offline_entity=self.args["have_offline_entity"],
						shop_service_area=self.args["shop_service_area"],
						shop_intro=self.args["shop_intro"],
						shop_phone = self.args["shop_phone"],
						shop_status = models.SHOP_STATUS.APPLYING)
			return self.send_success()

class ShopApplyImg(FruitzoneBaseHandler):
	@tornado.web.authenticated
	def post(self):
		q = qiniu.Auth(ACCESS_KEY, SECRET_KEY)
		token = q.upload_token(BUCKET_SHOP_IMG, expires=120)
		return self.send_success(token=token, key=str(time.time()))

class Shop(FruitzoneBaseHandler):
	def get(self,id):
		try:
			shop = self.session.query(models.Shop).filter_by(id=id).one()
		except:
			shop = None
		if not shop:
			return self.send_error(404)
		time_tuple = time.localtime(shop.admin.accountinfo.birthday)
		birthday = time.strftime("%Y-%m", time_tuple)
		return self.render("fruitzone/shop.html", context=dict(
					shop=shop, shop_admin=shop.admin, birthday=birthday, edit=False))

	#收藏店铺
	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("shop_id:int")
	def post(self,shop_id):
		try:
			shop = self.session.query(models.Shop).filter_by(id = shop_id).one()
		except:
			return self.send_error(404)
		self.current_user.shops_collect.append(shop)
		self.session.commit()
		return self.send_success()


class AdminShops(FruitzoneBaseHandler):
   @tornado.web.authenticated
   def get(self):
	   shop_temps = self.session.query(models.ShopTemp).filter_by(admin_id=self.current_user.id).all()
	   return self.render("fruitzone/shops.html", context=dict(shops=self.current_user.shops,
															   shop_temps=shop_temps, collect=False))

class AdminShopsCollect(FruitzoneBaseHandler):
   @tornado.web.authenticated
   def get(self):
	   return self.render("fruitzone/shops.html", context=dict(shops=self.current_user.shops_collect,collect=True))

class AdminShop(FruitzoneBaseHandler):
	@tornado.web.authenticated
	def get(self,id):
		try:
			shop = self.session.query(models.Shop).filter_by(id=id).one()
		except:
			shop = None
		if not shop:
			return self.send_error(404)
		fruit_types = []
		for f_t in self.session.query(models.FruitType).all():
			fruit_types.append(f_t.all_props())

		time_tuple = time.localtime(shop.admin.accountinfo.birthday)
		birthday = time.strftime("%Y-%m", time_tuple)

		return self.render("fruitzone/shop.html", context=dict(shop=shop, edit=True, birthday=birthday,
															   fruit_types=fruit_types, now=time.time()))

	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("action", "data")
	def post(self,shop_id):
		action = self.args["action"]
		data = self.args["data"]
		shop = models.Shop.get_by_id(self.session, shop_id)
		if shop not in self.current_user.shops:         #如果该店铺不属于该用户，禁止修改
			return self.send_error(403)
		if action== "edit_shop_img":
			# print('**********shop_id*************\n',shop_id)
			return self.send_qiniu_token("shop", shop_id)
		elif action == "edit_shop_url":
			shop.update(session=self.session, shop_url=data)
		elif action == "edit_live_month":
			year = int(data["year"])
			month = int(data["month"])
			try:
				shop_start_timestamp = datetime.datetime(year=year, month=month, day=1)
			except ValueError:
				return self.send_fail("月份必须为1~12")
			shop.update(session=self.session, shop_start_timestamp=time.mktime(shop_start_timestamp.timetuple()))
			return self.send_success(now=time.time(),shop_start_timestamp=time.mktime(shop_start_timestamp.timetuple()))
		elif action == "edit_total_users":
			shop.update(session=self.session, total_users=int(data))
		elif action == "edit_daily_sales":
			shop.update(session=self.session, daily_sales=int(data))
		elif action == "edit_single_stock_size":
			shop.update(session=self.session, single_stock_size=int(data))
		elif action == "edit_shop_intro":
			if len(data) > 568:
				return self.send_fail("字数超出了568个")
			shop.update(session=self.session, shop_intro=data)
		elif action == "edit_onsale_fruits":
			shop.onsale_fruits = []
			for fruit_id in data:
				fruit_type = self.session.query(models.FruitType).filter_by(id = fruit_id).one()
				shop.onsale_fruits.append(fruit_type)
			self.session.commit()
		elif action == "edit_demand_fruits":
			shop.demand_fruits=[]
			for fruit_id in data:
				fruit_type = self.session.query(models.FruitType).filter_by(id = fruit_id).first()
				shop.demand_fruits.append(fruit_type)
			self.session.commit()
		else:
			return self.send_error(404)
		return self.send_success()

class QiniuCallback(FruitzoneBaseHandler):

	def initialize(self, action):
		self._action = action


	def post(self):
		key = self.get_argument("key")
		id = int(self.get_argument("id"))
		# print('ID',id,key)
		action = self.get_argument("action")
		# print(key,id,action)

		# print('shop'==action)

		if action == "shop":
			try:
				shop = self.session.query(models.Shop).filter_by(id=id).one()
			except:
				print("QiniuCallback: not found shop")
				return self.send_error(404)
			shop_trademark_url = shop.shop_trademark_url  # 要先跟新图片url，防止删除旧图片时出错
			shop.update(session=self.session, shop_trademark_url=SHOP_IMG_HOST+key)
			# print('shop_url',shop_trademark_url)
			# self.session.commit()
			if shop_trademark_url:  # 先要把旧的的图片删除
				m = BucketManager(auth=qiniu.Auth(ACCESS_KEY,SECRET_KEY))
				m.delete(bucket=BUCKET_SHOP_IMG, key=shop_trademark_url.split('/')[3])
			return self.send_success()
		elif action == "receipt":
			try:
				config = self.session.query(models.Config).filter_by(id=id).one()
			except:
				return self.send_error(404)
			receipt_img = config.receipt_img
			config.update(session=self.session, receipt_img=SHOP_IMG_HOST+key)
			if receipt_img:  # 先要把旧的的图片删除
				m = BucketManager(auth=qiniu.Auth(ACCESS_KEY, SECRET_KEY))
				m.delete(bucket=BUCKET_SHOP_IMG, key=receipt_img.split('/')[3])
			return self.send_success()
		elif self._action == "edit_info_img":
			# try:
			#     self.session.query(models.Info).filter_by(id=int(id)).one()
			# except:
			#     print("qiniu callback:info id %s don't exit" % id)
			#     return self.send_error(404)
			# fruit_img = models.FruitImg(info_id=int(id), img_url=INFO_IMG_HOST+key)
			# self.session.add(fruit_img)
			# self.session.commit()
			return self.send_success()
		elif action == "fruit":
			try:
				fruit = self.session.query(models.Fruit).filter_by(id=id).one()
			except:
				return self.send_error(404)
			img_url = fruit.img_url
			fruit.update(session=self.session, img_url=SHOP_IMG_HOST+key)
			if img_url:  # 先要把旧的的图片删除
				m = BucketManager(auth=qiniu.Auth(ACCESS_KEY, SECRET_KEY))
				m.delete(bucket=BUCKET_SHOP_IMG, key=img_url.split('/')[3])
			return self.send_success()
		elif action == "mgoods":
			try:
				mgoods = self.session.query(models.MGoods).filter_by(id=id).one()
			except:
				return self.send_error(404)
			img_url = mgoods.img_url
			mgoods.update(session=self.session, img_url=SHOP_IMG_HOST+key)
			if img_url:  # 先要把旧的的图片删除
				m = BucketManager(auth=qiniu.Auth(ACCESS_KEY,SECRET_KEY))
				m.delete(bucket=BUCKET_SHOP_IMG, key=img_url.split('/')[3])
			return self.send_success()
		elif action == "add":  #什么都不用做
			return self.send_success()
		elif action == "shopAuth_cookie":
			return self.send_success()
		elif action =="editor":
			import json
			import base64
			upload_ret = self.get_argument("upload_ret")
			if upload_ret:
				s = json.loads(base64.b64decode(upload_ret).replace('-','_').replace('+','/'))
			return self.write('{"error":0, "url": "'+s['url']+'"}')
		return self.send_error(404)


	def check_xsrf_cookie(self):  #必须要复写tornado自带的检查_xsrf 参数，否则回调不成功
		pass
		return

# 短信验证
class PhoneVerify(_AccountBaseHandler):
	executor = ThreadPoolExecutor(2)

	def initialize(self, action):
		if action == "admin":
			self.__account_model__ = models.ShopAdmin
			self.__account_cookie_name__ = "customer_id"
			self.__wexin_oauth_url_name__ = "adminOauth"
		elif action == "customer":
			self.__account_model__ = models.Customer
			self.__account_cookie_name__ = "customer_id"
			self.__wexin_oauth_url_name__ = "customerOauth"

	@tornado.web.authenticated
	@tornado.web.asynchronous
	@tornado.gen.engine
	@FruitzoneBaseHandler.check_arguments("action:str")
	def post(self):
		if self.args["action"] == "gencode":
			yield self.handle_gencode()
		elif self.args["action"] == "checkcode":
			yield self.handle_checkcode()
		elif self.args["action"] == "gencode_shop_apply":
			yield self.handle_gencode_shop_apply()
		elif self.args["action"] == "checkcode_regist":
			yield self.handle_checkcode_regist()
		elif self.args["action"] == "regist":
			yield self.handle_regist()
		else:
			yield self.send_error(404)
		self.finish()

	@run_on_executor
	@FruitzoneBaseHandler.check_arguments("phone:str")
	def handle_gencode(self):
		a=self.session.query(models.Accountinfo).filter(models.Accountinfo.phone==self.args["phone"]).first()
		if a:
			if a != self.current_user.accountinfo:
				return self.send_fail(error_text="手机号已经绑定其他账号")
			else:
				return self.send_fail(error_text="手机号已绑定，无需重复绑定")

		resault = gen_msg_token(phone=self.args["phone"])
		if resault == True:
			return self.send_success()
		else:
			return self.send_fail(resault)

	@run_on_executor
	@FruitzoneBaseHandler.check_arguments("phone:str","code:int")
	def handle_checkcode_regist(self):
		if not check_msg_token(phone = self.args["phone"],code = self.args["code"]):
			return self.send_fail(error_text = "验证码过期或者不正确")
		else:
			return self.send_success()


	@run_on_executor
	@FruitzoneBaseHandler.check_arguments("phone:str" , "password")
	def handle_regist(self):
		phone = self.args["phone"]
		password = self.args["password"]
		new_user = models.Accountinfo(phone = phone ,password = password)
		self.session.add(new_user)
		self.session.commit()
		return self.send_success()

	@run_on_executor
	@FruitzoneBaseHandler.check_arguments("phone:str", "code:int", "password?")
	def handle_checkcode(self):
		if not check_msg_token(phone = self.args["phone"], code=self.args["code"]):
		   return self.send_fail(error_text="验证码过期或者不正确")
		# password = self.args['password']
		# print(password)
		# if password:
		# 	self.current_user.accountinfo.update(self.session, phone=self.args["phone"],password=self.args["password"])
		# else:
		self.current_user.accountinfo.update(self.session, phone=self.args["phone"])
		return self.send_success()

	@run_on_executor
	@FruitzoneBaseHandler.check_arguments("phone:str")
	def handle_gencode_shop_apply(self):
		# print("[店铺申请]发送证码到手机：",self.args["phone"])
		resault = gen_msg_token(phone=self.args["phone"])
		# print("handle_gencode_shop_apply" + self.current_user.accountinfo.wx_unionid)
		if resault == True:
			return self.send_success()
		else:
			return self.send_fail(resault)

class SystemPurchase(FruitzoneBaseHandler):
	"""后台购买相关页面"""
	def initialize(self, action):
		self._action = action
		# print(self._action)

	@tornado.web.authenticated
	def get(self):
		if self._action == "home":
			if self.current_user.role == models.SHOPADMIN_ROLE_TYPE.SYSTEM_USER:
				# 已经是系统用户
				return self.redirect(
					self.reverse_url("fruitzoneSystemPurchaseSystemAccount"))
			else:
				return self.redirect(
					self.reverse_url("fruitzoneSystemPurchaseChargeTypes"))
		elif self._action == "chargeTypes":
			charge_types = self.session.query(models.SysChargeType).\
						   order_by(models.SysChargeType.id).all()
			return self.render("fruitzone/systempurchase-chargetypes.html",
							   context=dict(charge_types=charge_types))
		elif self._action == "chargeDetail":
			# 判断charge_type合法性，不合法从新返回接入申请页
			try:
				charge_type_id = int(self.get_argument("charge_type"))
			except:
				return self.write("抱歉，此商品不存在呵呵(#‵′)凸")
			charge_type = models.SysChargeType.get_by_id(
				self.session, charge_type_id)
			if not charge_type:
				return self.write("抱歉，此商品不存在呵呵(#‵′)凸")
			return self.render("fruitzone/systempurchase-chargedetail.html",
							   context=dict(charge_type=charge_type))
		elif self._action == "dealFinishedCallback":
			return self.handle_deal_finished_callback()
		elif self._action == 'alipayCallBack':
			return self.handle_alipay_finished_callback()
		elif self._action == "history":
			orders = self.current_user.success_orders(self.session)
			return self.render("fruitzone/systempurchase-history.html",
							   context=dict(orders=orders, subpage="history"))
		elif self._action == "systemAccount":
			return self.render("fruitzone/systempurchase-systemaccount.html", context=dict(subpage="account"))
		# elif self._action == "alipaytest":
		# 	return self.render("fruitzone/alipayTest.html",context = dict(subpage="alipaytest"))
		else:
			return self.send_error(404)

	@FruitzoneBaseHandler.check_arguments("sign", "result", "out_trade_no",
									  "trade_no", "request_token")
	def handle_deal_finished_callback(self):
		# 检查是否合法
		sign = self.args.pop("sign")
		signmethod = self._alipay.getSignMethod()
		if signmethod(self.args) != sign:
			Logger.warn("SystemPurchase: sign from alipay error!")
			return self.send_error(403)
		# 创建成功订单记录
		o = self.current_user.finish_order(
			self.session,
			order_id=int(self.args["out_trade_no"]),
			ali_trade_no=self.args["trade_no"])
		if not o:
			# print("tmp order not found!")
			return self.write("交易已完成或不存在!")
		# 重定向到支付成功页面
		return self.redirect(
			"{0}#{1}".format(
				self.reverse_url("fruitzoneSystemPurchaseHistory"),
				o.order_id)
		)

	def post(self):
		if self._action == "dealNotify":
			# print("原来你也没有被调用么")
			return self.handle_deal_notify()
		elif self._action == "aliyNotify":
			# print('aliyNotify aaaaaaaaaaaaaaa')
			return self.handle_alipay_notify()
		if not self.current_user:
			return self.send_error(403)

		if self._action == "chargeDetail":
			return self.handle_confirm_payment()
		elif self._action == "alipaytest":
			# print('is here?')
			return self.handle_alipaytest()
		else:
			return self.send_error(404)

	@FruitzoneBaseHandler.check_arguments('price:str')
	def handle_alipaytest(self):
		shop_id = self.get_cookie("market_shop_id")
		customer_id = self.current_user.id
		# print(shop_id,customer_id,'idddddddddddddddddddddd')
		price = float(self.args['price'])
		# print(price)
		# print('find the correct way to login?')
		try:
			url = self.test_create_tmporder_url(price,shop_id,customer_id)
		except Exception as e:
			return self.send_fail('ca')
		return self.send_success(url = url)

	@FruitzoneBaseHandler.check_arguments("charge_type:int", "pay_type")
	def handle_confirm_payment(self):
		if self.args["pay_type"] == "alipay":
			# 判断charge_type合法性，不合法从新返回接入申请页
			charge_data = models.SysChargeType.get_by_id(self.session, self.args["charge_type"])
			if not charge_data:
				return self.send_fail(error_text="抱歉，此商品不存在呵呵(#‵′)凸")
			# 创建临时订单，跳转到支付宝支付页
			try:
				url = self._create_tmporder_url(charge_data)
			except Exception as e:
				Logger.error("System Purchase: get auth url failed!", e)
				return self.send_fail(error_text="系统繁忙，请稍后重试")
			return self.redirect(url)

	@FruitzoneBaseHandler.check_arguments("service", "v","sec_id","sign","notify_data")
	def handle_deal_notify(self):
		# 验证签名
		sign = self.args.pop("sign")
		signmethod = self._alipay.getSignMethod(**self.args)
		if signmethod(self.args) != sign:
			Logger.warn("SystemPurchase Notify: sign from alipay error!")
			return self.send_error(403)
		# # 验证notify_id是否存在, 这部分是否需要做？
		# if not self._alipay.verify_notify(**self.args):
		#     Logger.warn("Purchase Notify: notify check illegal!")
		#     return self.send_error(403)
		notify_data = xmltodict.parse(self.args["notify_data"])["notify"]
		# 判断该notify是否已经被处理，已处理直接返回success，未处理填补信息

		o = models.SystemOrder.update_notify_data(
			self.session,
			order_id=int(notify_data["out_trade_no"]),
			notify_data=notify_data)
		if not o:
			Logger.error("SystemPurchase Notify Fatal Error: order not found!")
			return self.write("fail")
		return self.write("success")


	@FruitzoneBaseHandler.check_arguments("service", "v","sec_id","sign","notify_data")
	def handle_alipay_notify(self):
		print("login handler_alipay_notify")
		sign = self.args.pop("sign")
		signmethod = self._alipay.getSignMethod(**self.args)
		if signmethod(self.args) != sign:
			return self.send_error(403)
		print(self.args['notify_data'])
		notify_data = xmltodict.parse(self.args["notify_data"])["notify"]
		orderId = notify_data["out_trade_no"]
		ali_trade_no=notify_data["trade_no"]
		print(ali_trade_no,'hehehehehe')
		old_balance_history = self.session.query(models.BalanceHistory).filter_by(transaction_id = ali_trade_no).first()
		if old_balance_history:
			return self.send_success()
		data = orderId.split('a')
		totalPrice = float(data[0])/100
		# shop_id = self.get_cookie('market_shop_id')
		shop_id = int(data[1])
		customer_id = int(data[2])
		print(totalPrice,shop_id ,customer_id,'ididid')
	#	code = self.args['code']
	#	path_url = self.request.full_url()
		# totalPrice =float( self.get_cookie('money'))
		#########################################################
		# 用户余额增加
		# 同时店铺余额相应增加
		# 应放在 支付成功的回调里
		#########################################################

		# 支付成功后，用户对应店铺 余额 增1加
		shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = customer_id,\
			shop_id = shop_id).first()
		# print(customer_id, shop_id,'没充到别家店铺去吧')
		if not shop_follow:
			return self.send_fail('shop_follow not found')
		shop_follow.shop_balance += totalPrice     #充值成功，余额增加，单位为元
		self.session.commit()

		shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
		if not shop:
			return self.send_fail('shop not found')
		shop.shop_balance += totalPrice
		self.session.commit()
		# print(shop.shop_balance ,'充值后 商店 总额')
		customer = self.session.query(models.Accountinfo).filter_by(id = customer_id).first()
		if not customer:
			return self.send_fail("customer not found")
		name = customer.nickname

		# 支付成功后  生成一条余额支付记录
		balance_history = models.BalanceHistory(customer_id =customer_id ,shop_id = shop_id,\
			balance_value = totalPrice,balance_record = '余额充值(支付宝)：用户 '+ name  , name = name , balance_type = 0,\
			shop_totalPrice = shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,transaction_id =ali_trade_no)
		self.session.add(balance_history)
		# print(balance_history , '钱没有白充吧？！')
		self.session.commit()
		print("return success?")
		return self.write("success")


	_alipay = WapAlipay(pid=ALIPAY_PID, key=ALIPAY_KEY, seller_email=ALIPAY_SELLER_ACCOUNT)
	def _create_tmporder_url(self, charge_data):
		# 创建临时订单
		# TODO: 订单失效时间与清除
		tmp_order = self.current_user.add_tmp_order(self.session, charge_data)
		authed_url = self._alipay.create_direct_pay_by_user_url(
			out_trade_no=str(tmp_order.order_id),
			subject = tmp_order.charge_good_name,
			total_fee = tmp_order.charge_price,
			seller_account_name = ALIPAY_SELLER_ACCOUNT,
			call_back_url= "%s%s"%(ALIPAY_HANDLE_HOST, self.reverse_url("fruitzoneSystemPurchaseDealFinishedCallback")),
			notify_url="%s%s"%(ALIPAY_HANDLE_HOST, self.reverse_url("fruitzoneSystemPurchaseDealNotify")),
			merchant_url="%s%s"%(ALIPAY_HANDLE_HOST, self.reverse_url("fruitzoneSystemPurchaseChargeTypes"))
		)
		return authed_url

	def test_create_tmporder_url(self, price,shop_id,customer_id):
		# 创建临时订单
		# TODO: 订单失效时间与清除
		# tmp_order = self.current_user.add_tmp_order(self.session, charge_data)
		data = str(price) +'a'+str(shop_id)+'a'+str(customer_id)
		# url = '/fruitzone/alipaynotify?data={0}'.format(data)
		# print(url,'url')

		authed_url = self._alipay.create_direct_pay_by_user_url(
			out_trade_no= str(price*100) +'a'+str(shop_id)+'a'+ str(customer_id)  + 'a'+ str(int(time.time())),
			subject = 'alipay charge',
			total_fee = price,
			seller_account_name = ALIPAY_SELLER_ACCOUNT,
			# call_back_url= "%s%s"%(ALIPAY_HANDLE_HOST, self.reverse_url("fruitzoneSystemPurchaseDealFinishedCallback")),
			call_back_url = "%s%s"%(ALIPAY_HANDLE_HOST,self.reverse_url("fruitzoneSystemPurchaseAlipayFishedCallback")),
			notify_url="%s%s"%(ALIPAY_HANDLE_HOST, self.reverse_url("fruitzoneSystemPurchaseAliNotify")),
			merchant_url="%s%s"%(ALIPAY_HANDLE_HOST, self.reverse_url("fruitzoneSystemPurchaseChargeTypes"))
		)
		print(self.reverse_url("fruitzoneSystemPurchaseAliNotify"),'urlllllllllllllllllllll')
		return authed_url

	def check_xsrf_cookie(self):
		if self._action == "dealNotify" or self._action == "aliyNotify":
			Logger.info("SystemPurchase: it's a notify post from alipay, pass xsrf cookie check")
			return True
		return super().check_xsrf_cookie()


	def _check_info_complete(self):
		u = self.current_user

		if not u.accountinfo.email or not u.accountinfo.phone or \
		   not u.accountinfo.wx_username or not len(u.shops):
			return False
		return True

	@FruitzoneBaseHandler.check_arguments("sign", "result", "out_trade_no","trade_no", "request_token")
	def handle_alipay_finished_callback(self):
		# data = self.args['data']
		print('login',self)
		sign = self.args.pop("sign")
		signmethod = self._alipay.getSignMethod()
		if signmethod(self.args) != sign:
			Logger.warn("SystemPurchase: sign from alipay error!")
			return self.send_error(403)
		order_id=str(self.args["out_trade_no"])
		ali_trade_no=self.args["trade_no"]
		old_balance_history = self.session.query(models.BalanceHistory).filter_by(transaction_id = ali_trade_no).first()
		if old_balance_history:
			return self.redirect(self.reverse_url("customerBalance"))

		print(order_id,ali_trade_no,'hhhhhhhhhhhhhhhhhhhh')
		data = order_id.split('a')
		totalPrice = float(data[0])/100
		# shop_id = self.get_cookie('market_shop_id')
		shop_id = int(data[1])
		customer_id = self.current_user.id
		print(totalPrice,shop_id ,customer_id,'ididid')
	#	code = self.args['code']
	#	path_url = self.request.full_url()
		# totalPrice =float( self.get_cookie('money'))
		#########################################################
		# 用户余额增加
		# 同时店铺余额相应增加
		# 应放在 支付成功的回调里
		#########################################################

		# 支付成功后，用户对应店铺 余额 增1加
		shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = customer_id,\
			shop_id = shop_id).first()
		# print(customer_id, self.current_user.accountinfo.nickname,shop_id,'没充到别家店铺去吧')
		if not shop_follow:
			return self.send_fail('shop_follow not found')
		shop_follow.shop_balance += totalPrice     #充值成功，余额增加，单位为元
		self.session.commit()

		shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
		if not shop:
			return self.send_fail('shop not found')
		shop.shop_balance += totalPrice
		self.session.commit()
		# print(shop.shop_balance ,'充值后 商店 总额')

		# 支付成功后  生成一条余额支付记录
		name = self.current_user.accountinfo.nickname
		balance_history = models.BalanceHistory(customer_id =self.current_user.id ,shop_id = shop_id,\
			balance_value = totalPrice,balance_record = '余额充值(支付宝)：用户 '+ name  , name = name , balance_type = 0,\
			shop_totalPrice = shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,transaction_id =ali_trade_no)
		self.session.add(balance_history)
		# print(balance_history , '钱没有白充吧？！')
		self.session.commit()
		# return self.send_success(text = 'success')
		return self.redirect(self.reverse_url("customerBalance"))
