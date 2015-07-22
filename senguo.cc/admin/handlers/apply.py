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

# 店铺申请 - 首页 成为卖家
class Home(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self):
		# try:
		# 	if_admin = self.session.query(models.ShopAdmin).filter_by(id=self.current_user.id).first()
		# except:
		# 	if_admin = None
		# if if_admin:
		# 	return self.redirect(self.reverse_url("switchshop"))
		phone = self.current_user.accountinfo.phone if self.current_user.accountinfo.phone else ""
		logo_img = self.current_user.accountinfo.headimgurl_small
		nickname = self.current_user.accountinfo.nickname
		realname = self.current_user.accountinfo.realname if self.current_user.accountinfo.phone else ""
		return self.render('apply/home.html',logo_img=logo_img,nickname=nickname,phone=phone,realname=realname)

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("phone:str","realname:str","code:int")
	def post(self):
		try:
			if_admin = self.session.query(models.ShopAdmin).filter_by(id=self.current_user.id).first()
		except:
			if_admin = None
		if if_admin:
			return self.send_fail("您已是卖家")

		if not self.args['phone']:
			return self.send_fail("please input your phone number")
		if not self.args["realname"]:
			return self.send_fail("please input your realname")
		if not check_msg_token(phone=self.args['phone'], code=int(self.args["code"])):
			return self.send_fail(error_text="验证码过期或者不正确")
		
		self.current_user.account_info.phone=self.args["phone"]
		self.current_user.account_info.realname=self.args["realname"]
		self.session.add(models.ShopAdmin(id=self.current_user.id))
		self.session.commit()
		return self.send_success()

#创建店铺
class CreateShop(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		token = self.get_qiniu_token("Market_cookie","apply")
		return self.render("apply/shop-create.html",token = token)

	@tornado.web.authenticated
	@AdminBaseHandler.check_arguments("action","data")
	def post(self):
		action = self.args["action"]
		data = self.args["data"]
		if not action or not data:
			return self.send_error(403)

		#权限检查,目前仅超级管理员可以创建店铺
		if self.current_shop.admin_id != self.current_user.id :
			return self.send_fail("您不是店铺的超级管理员，无法创建新的店铺")

		#检查申请店铺数量
		try:
			shops = self.session.query(models.Shop).filter_by(admin_id=self.current_shop.admin_id)
		except:
			shops = None
		if shops:
			shop_frist = shops.first()
			if shop_frist:
				if shop_frist.shop_auth==0:
					return self.send_fail("您的第一个店铺还未进行认证，店铺认证后才可创建多个店铺。最多可创建30个店铺。")
				elif shop_frist.shop_auth !=0 and shops.count() >= 30:
					return self.send_fail("最多可创建30个店铺")

		if action == "diy":
			args["admin_id"] = self.current_shop.admin_id
			args["shop_name"] = data["shop_name"]
			args["shop_logo"] = data["shop_logo"]
			args["shop_phone"] = data["shop_phone"]
			args["shop_province"] = data["shop_province"]
			args["shop_city"] = data["shop_city"]
			args["shop_address_detail"] = data["shop_address_detail"]
			args["lat"] = data["lat"]
			args["lon"] = data["lon"]
			args["shop_code"] = self.make_shop_code()
			
			shop = models.Shop(**args)

			# 添加系统默认的时间段
			period1 = models.Period(name="中午", start_time="12:00", end_time="12:30")
			period2 = models.Period(name="下午", start_time="17:30", end_time="18:00")
			period3 = models.Period(name="晚上", start_time="21:00", end_time="22:00")

			config = models.Config()
			config.periods.extend([period1, period2, period3])
			marketing = models.Marketing()
			shop.config = config
			shop.marketing = marketing
			shop.shop_start_timestamp = time.time()

			self.session.add(shop)
			self.session.commit()  # 要commit一次才有shop.id

			temp_staff = self.session.query(models.ShopStaff).get(shop.admin_id)
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
			return self.send_success()

		elif action == "search":
			shop_name = data["shop_name"]
			try:
				shops = self.session.query(models.Spider_Shop).filter(models.Spider_Shop.shop_name.like("%%%s%%" %shop_name)).all()
			except:
				shops = None

			data=[]
			if shops:
				for shop in shops:
					data.append({"shop_name":shop.shop_name,"address":shop.shop_address,"logo":shop.shop_logo,"id":shop.id})
			return self.send_success(data=data)

		elif action == "import":
			market_member_id = data["code"]
			try:
				if_market = self.session.query(models.SpreadMember).filter_by(code=data["code"]).first()
			except:
				if_market = None
			if not if_market:
				return self.send_fail("请输入正确的市场推广人员ID")

			shop_list = data["shop_list"]
			shop_number = len(self.current_shop.admin.shops)
			if len(shop_list) + shop_number >=30:
				return self.send_fail("您已创建%s家店铺 ，至多还可创建%s家店铺",shop_number,30-shop_number)
			shops  = self.session.query(models.Spider_Shop).filter(models.Spider_Shop.id.in_(shop_list)).all()
			
			# 添加系统默认的时间段
			period1 = models.Period(name="中午", start_time="12:00", end_time="12:30")
			period2 = models.Period(name="下午", start_time="17:30", end_time="18:00")
			period3 = models.Period(name="晚上", start_time="21:00", end_time="22:00")

			config = models.Config()
			config.periods.extend([period1, period2, period3])
			marketing = models.Marketing()
			for shop in shops:
				shop = models.Shop(
					admin_id = self.current_shop.admin_id,
					shop_name = shop.shop_name,
					shop_trademark_url = shop.shop_logo,
					shop_province = shop.shop_province,
					shop_city = shop.shop_city,
					shop_address_detail = shop.address,
					create_date_timestamp = time.time(),
					shop_intro = shop.description,
					shop_code = self.make_shop_code(),
					shop_phone = shop.shop_phone,
					lat = shop.lat,
					lon = shop.lon
				)
				shop.config = config
				shop.marketing = marketing
				shop.shop_start_timestamp = time.time()
				self.session.add(shop)
				self.session.commit()
				# 添加商品
				spider_goods = self.session.query(models.Spider_Good).filter_by(shop_id = shop.shop_id).all()
				for temp_good in spider_goods:
					new_good = models.Fruit(shop_id = shop.id , fruit_type_id = 999,name = temp_good.goods_name,
						storage = 100,unit = 2,img_url = temp_good.good_img_url ,)
					new_good.charge_types.append(models.ChargeType(price = temp_good.goods_price,unit = 2,num =1,market_price = temp_good.goods_price))
					self.session.add(new_good)
					self.session.commit()
				######################################################################################
				# inspect whether staff exited
				######################################################################################
				temp_staff = self.session.query(models.ShopStaff).get(shop.admin_id)
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

			return self.send_success()

		
	def make_shop_code(self):
		chars = 'abc0123456789'
		str = ''
		random = Random()
		for i in range(6):
			str += chars[random.randint(0,len(chars)-1)]
		while True:
			shop = self.session.query(models.Shop).filter_by(shop_code = str).first()
			if not shop:
				break
		return str


