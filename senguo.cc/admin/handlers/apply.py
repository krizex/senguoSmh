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
from libs.utils import Logger
import hashlib
import chardet

try:
	import xml.etree.cElementTree as ET
except:
	import xml.etree.ElementTree as ET

# woody
# 扫码获取用户openid
class Login(CustomerBaseHandler):
	def get(self):
		if self.current_user:
			return self.redirect(self.reverse_url('ApplyHome'))
		if self.is_wexin_browser():
			return self.redirect(self.get_weixin_login_url())
		ticket_url , scene_id = self.get_ticket_url()
		return self.render("apply/wx-login.html",ticket_url=ticket_url,scene_id=scene_id)
	@CustomerBaseHandler.check_arguments('scene_id')
	def post(self):
		scene_id = int(self.args['scene_id'])
		# print("[ApplyLogin]scene_id:",scene_id)
		scene_openid = self.session.query(models.Scene_Openid).filter_by(scene_id=scene_id).first()
		if scene_openid:
			openid = scene_openid.openid
			# print("[ApplyLogin]openid:",openid)
			accountinfo = self.session.query(models.Accountinfo).filter_by(wx_openid = openid).first()
			if accountinfo:
				# print("[ApplyLogin]accountinfo:",accountinfo)
				customer = self.session.query(models.ShopAdmin).filter_by(id = accountinfo.id).first()
				if customer:
					# print("[ApplyLogin]customer:",customer)
					self.set_current_user(customer,domain=ROOT_HOST_NAME)
			# print("[ApplyLogin]True")
			return self.send_success(login=True)
		else:
			# print("[ApplyLogin]False")
			return self.send_success(login=False)

class WxOpen(CustomerBaseHandler):
	def get(self):
		return self.send_success()
	def post(self):
		data = self.request.body
		print(data)
		return self.write('success')

# 微信服务器配置，启用开发开发者模式后，用户发给公众号的消息以及开发者所需要的事件推送，将被微信转发到该URL中
class WxMessage(CustomerBaseHandler):
	@CustomerBaseHandler.check_arguments('signature?:str','timestamp?','nonce?','echostr')
	def get(self):
		signature = self.args['signature']
		timestamp = self.args['timestamp']
		nonce     = self.args['nonce']
		echostr   = self.args['echostr']
		if self.check_signature(signature,timestamp,nonce):
			return self.write(echostr)
		else:
			# print('[ApplyWxMessage]the message is not from weixin')
			return self.write(echostr)

	@CustomerBaseHandler.check_arguments('ToUserName?:str','FromUserName?:str','CreateTime?','MsgType?','Event?','EventKey?','Ticket?')
	def post(self):
		try:
			import xml.etree.cElementTree as ET
		except:
			import xml.etree.ElementTree as ET
		raw_data = self.request.body
		data = self.xmlToDic(raw_data) 
		# print('[ApplyWxMessage]raw_data:',raw_data)
		openid = data.get('FromUserName',None)
		event  = data.get('Event',None)
		eventkey = data.get('EventKey',None)
		# print('[ApplyWxMessage]openid:',openid,', event:',event,', eventkey:',eventkey)

		openid = data.get('FromUserName',None)
		event  = data.get('Event',None)
		eventkey = data.get('EventKey',None)
		MsgType = data.get('MsgType',None)
		Content = data.get('Content',None)
		if MsgType == 'text':
			ToUserName = data.get('ToUserName',None) #开发者微信号
			FromUserName = data.get('FromUserName',None) # 发送方openid
			CreateTime  = data.get('CreateTime',None) #接受消息时间
			Content    = data.get('Content',None)
			MsgId = data.get('Content',None)
			CreateTime = str(int(time.time()))
			if Content == '挑选':
				reply_message = 'senguo.cc/bbs/detail/7'
			elif Content == '加工':
				reply_message = 'senguo.cc/bbs/detail/13'
			elif Content == '包装':
				reply_message = 'senguo.cc/bbs/detail/15'
			elif Content == '工具':
				reply_message = 'senguo.cc/bbs/detail/14'
			elif Content == '配送':
				reply_message = 'senguo.cc/bbs/detail/12'
			elif Content == '储存':
				reply_message = 'senguo.cc/bbs/detail/10'
			elif Content == '521':
				reply_message = 'senguo.cc/bbs/detail/17'
			elif Content == '活动':
				reply_message = 'senguo.cc/bbs/detail/18'
			elif Content == '打印机':
				reply_message = 'senguo.cc/bbs/detail/8'
			else:
				MsgType = 'transfer_customer_service'
				reply_message = None
				# reply_message = '您的消息我们已经收到，请耐心等待回复哦～'
			reply = self.make_xml(FromUserName,ToUserName, CreateTime,MsgType,reply_message)
			reply = ET.tostring(reply,encoding='utf8',method='xml')
			# print("[ApplyWxMessage]reply:",reply)
			self.write(reply)

		if event == 'subscribe' or 'scan' or 'SCAN':
			if event == 'subscribe':
				scene_id = int(eventkey.split('_')[1]) if eventkey and eventkey.find('qrscene') !=-1 else None

			elif event == 'scan' or 'SCAN':
				scene_id = int(eventkey)  if eventkey and eventkey.isdigit() else None
			else:
				return self.send_success(error_text = 'error')
			if openid and scene_id:
				# 将openid 和scene_id 存在数据库表里，方便前端轮询
				scene_openid = models.Scene_Openid(scene_id=scene_id,openid=openid)
				self.session.add(scene_openid)
				self.session.commit()
				# print("[ApplyWxMessage]scene_openid.id:",scene_openid.id,", scene_openid.scene_id:",scene_openid.scene_id,", scene_openid.openid:",scene_openid.openid)

				customer = self.session.query(models.Accountinfo).filter_by(wx_openid=openid).first()
				if customer:
					print('[ApplyWxMessage]customer exists')
				else:
					# print('[ApplyWxMessage]add new customer')
					access_token = WxOauth2.get_client_access_token()
					url = 'https://api.weixin.qq.com/cgi-bin/user/info?access_token={0}&openid={1}'.format(access_token,openid)
					r = requests.get(url)
					wx_userinfo = json.loads(r.text)
					# print("[ApplyWxMessage]wx_userinfo:",wx_userinfo)
					if wx_userinfo["headimgurl"] not in [None,'']:
						headimgurl = wx_userinfo.get("headimgurl",None)
						headimgurl_small = wx_userinfo.get("headimgurl",None)[0:-1] + "132"
					else:
						headimgurl = None
						headimgurl_small = None
					account_info = models.Accountinfo(
						wx_unionid=wx_userinfo.get("unionid",None),
						wx_openid=wx_userinfo.get("openid",None),
						wx_country=wx_userinfo.get("country",None),
						wx_province=wx_userinfo.get("province",None),
						wx_city=wx_userinfo.get("city",None),
						headimgurl=headimgurl,
						headimgurl_small = headimgurl_small,
						nickname=wx_userinfo.get("nickname",None),
						sex = wx_userinfo.get("sex",None))
					u = models.Customer()
					u.accountinfo = account_info
					self.session.add(u)
					admin = models.ShopAdmin()
					admin.accountinfo = account_info
					self.session.add(admin)
					self.session.commit()
			if event == 'subscribe':
				ToUserName = data.get('ToUserName',None) #开发者微信号
				FromUserName = data.get('FromUserName',None) # 发送方openid
				CreateTime  = data.get('CreateTime',None) #接受消息时间
				MsgType = 'text'
				reply_message = '再小的水果店，也要有自己的O2O平台！\n互联网时代，水果零售一站式解决方案！\n---------\n赶紧点击http://senguo.cc/apply申请接入,拥有属于你的水果O2O店铺吧\n你也可以点击http://senguo.cc/list进入水果商城 开始选购水果'
				reply = self.make_xml(FromUserName,ToUserName, CreateTime,MsgType,reply_message)
				reply = ET.tostring(reply,encoding='utf8',method='xml')
				# print("[ApplyWxMessage]reply:",reply)
				self.write(reply)

				

	@classmethod
	def make_xml(self,ToUserName,FromUserName,CreateTime,MsgType,Content=None):
		root = ET.Element('xml')
		first = ET.Element('ToUserName')
		first.text = ToUserName
		second = ET.Element('FromUserName')
		second.text = FromUserName
		third = ET.Element('CreateTime')
		third.text=CreateTime
		forth = ET.Element('MsgType')
		forth.text = MsgType
		data = [first,second,third,forth]
		if Content:
			fifth = ET.Element('Content')
			fifth.text = Content
			data.append(fifth)
		data = tuple(data)
		root.extend(data)
		return root

	@classmethod
	def check_signature(self,signature,timestamp,nonce):
		token = 'senguotest123'
		L = [timestamp,nonce,token]
		L.sort()
		s = L[0]+L[1]+L[2]
		if isinstance(s,str):
			s = s.encode('utf-8')
		return hashlib.sha1(s).hexdigest() == signature

	def check_xsrf_cookie(self):
		print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!wxpay xsrf pass!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		pass
		return
	@classmethod
	def xmlToDic(self,xmlstr):
		if isinstance(xmlstr,bytes):
			xmlstr = xmlstr.decode('utf-8')
		else:
			xmlstr = xmlstr
		data = {}
		tree = ET.fromstring(xmlstr)
		for child in tree:
			data[child.tag] = child.text
		return data	

# 店铺申请 - 首页 成为卖家
class Home(CustomerBaseHandler):
	# @tornado.web.authenticated
	def get(self):
		if not self.current_user:
			return self.redirect(self.reverse_url("ApplyLogin"))
		try:
			if_admin = self.session.query(models.ShopAdmin).filter_by(id=self.current_user.id).first()
		except:
			if_admin = None
		if if_admin:
			return self.redirect(self.reverse_url("switchshop"))
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

		self.current_user.accountinfo.phone=self.args["phone"]
		self.current_user.accountinfo.realname=self.args["realname"]
		self.session.add(models.ShopAdmin(id=self.current_user.id))
		self.session.commit()
		return self.send_success()

# 创建店铺
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
		try:
			super_admin = self.session.query(models.ShopAdmin).filter_by(id=self.current_user.id).one()
		except:
			super_admin = None
		if not super_admin:
			return self.send_fail("您不是卖家，无法创建新的店铺")

		#检查申请店铺数量
		try:
			shops = self.session.query(models.Shop).filter_by(admin_id=self.current_user.id)
		except:
			shops = None
		if shops:
			shop_frist = shops.first()
			if shop_frist:
				if shop_frist.shop_auth==0:
					return self.send_fail("您的第一个店铺还未进行认证，店铺认证后才可创建多个店铺。最多可创建30个店铺。")
				elif shop_frist.shop_auth !=0 and shops.count() >= 30:
					return self.send_fail("最多可创建30个店铺")

		if self.current_shop:
			_admin_id = self.current_shop.admin_id
		else:
			_admin_id = self.current_user.id

		if action == "diy":
			args={}
			args["admin_id"] = _admin_id
			args["shop_name"] = data["shop_name"]
			args["shop_trademark_url"] = data["shop_logo"]
			args["shop_phone"] = data["shop_phone"]
			args["shop_province"] = data["shop_province"]
			args["shop_city"] = data["shop_city"]
			args["shop_address_detail"] = data["shop_address_detail"]
			args["lat"] = data["lat"]
			args["lon"] = data["lon"]
			args["shop_code"] = self.make_shop_code()
			args["create_date_timestamp"] = time.time()

			shop = models.Shop(**args)
			self.create_shop(shop)
			self.create_staff(shop)
			return self.send_success()

		elif action == "search":
			shop_name = data["shop_name"]
			try:
				shops = self.session.query(models.Spider_Shop).filter(models.Spider_Shop.shop_name.like("%%%s%%" %shop_name)).all()
			except:
				shops = None
				# print("[AdminCreateShop]Shop search error")

			data=[]
			if shops:
				for shop in shops:
					data.append({"shop_name":shop.shop_name,"address":shop.shop_address,"logo":shop.shop_logo,"id":shop.id})
			return self.send_success(data=data)

		elif action == "import":
			if "shop_list" not in data or "code" not in data:
				return self.send_error(403)

			market_member_id = data["code"]
			try:
				if_market = self.session.query(models.SpreadMember).filter_by(code=data["code"]).first()
			except:
				if_market = None
			if not if_market:
				return self.send_fail("请输入正确的市场推广人员ID")

			shop_list = data["shop_list"]
			if self.current_shop:
				shop_number = len(self.current_shop.admin.shops)
				if len(shop_list) + shop_number > 30:
					notice="您已创建"+str(shop_number)+"家店铺，最多还可创建"+str(30-shop_number)+"家店铺"
					return self.send_fail(notice)
			else:
				if len(shop_list)>=30:
					return self.send_fail("最多可创建30家店铺")

			spider_shops  = self.session.query(models.Spider_Shop).filter(models.Spider_Shop.id.in_(shop_list)).all()

			for spider_shop in spider_shops:
				shop = models.Shop(
					admin_id = _admin_id,
					shop_name = spider_shop.shop_name,
					shop_trademark_url = spider_shop.shop_logo,
					shop_province = spider_shop.shop_province,
					shop_city = spider_shop.shop_city,
					shop_address_detail = spider_shop.shop_address,
					create_date_timestamp = time.time(),
					shop_intro = spider_shop.description,
					shop_code = self.make_shop_code(),
					shop_phone = spider_shop.shop_phone,
					lat = spider_shop.lat,
					lon = spider_shop.lon,
					spread_member_code = data["code"]
				)
				self.create_shop(shop)
				# 添加商品
				spider_goods = self.session.query(models.Spider_Good).filter_by(shop_id = spider_shop.shop_id).all()
				for temp_good in spider_goods:
					name = temp_good.goods_name
					if len(name)>20:
						name=name[1:21]
					new_good = models.Fruit(shop_id = shop.id , fruit_type_id = 999,name = name,
						storage = 100,unit = 3,img_url = temp_good.good_img_url ,)
					new_good.charge_types.append(models.ChargeType(price = temp_good.goods_price,unit = 3,num = 1,market_price = None))
					self.session.add(new_good)
				self.session.commit()
				self.create_staff(shop)

			return self.send_success()

	# 生成店铺号（2位随机字母+6位随机数字）
	def make_shop_code(self):
		chars = 'abcdefghijklmnopqrstuvwxyz'
		nums = '0123456789'
		str = ''
		random = Random()
		while True:
			for i in range(2):
				str += chars[random.randint(0,len(chars)-1)]
			for i in range(6):
				str += nums[random.randint(0,len(nums)-1)]
			shop = self.session.query(models.Shop).filter_by(shop_code = str).first()
			if not shop:
				break
		return str

	def create_shop(self,shop):
		# 添加系统默认的时间段
		period1 = models.Period(name="中午", start_time="12:00", end_time="13:00") #按时达默认时间段
		period2 = models.Period(name="下午", start_time="17:00", end_time="18:00") #按时达默认时间段
		period3 = models.Period(name="晚上", start_time="21:00", end_time="22:00") #按时达默认时间段
		period4 = models.Period(name="中午", start_time="12:00", end_time="13:00", config_type=1) #自提时间默认时间段
		period5 = models.Period(name="下午", start_time="17:00", end_time="18:00", config_type=1) #自提时间默认时间段
		period6 = models.Period(name="晚上", start_time="21:00", end_time="22:00", config_type=1) #自提时间默认时间段

		config = models.Config()
		config.periods.extend([period1, period2, period3, period4, period5, period6])
		marketing = models.Marketing()
		shop.config = config
		shop.marketing = marketing
		shop.shop_start_timestamp = time.time()
		self.session.add(shop)
		self.session.flush()  # 要flush一次才有shop.id
		self.session.add(models.SelfAddress(config_id=shop.config.id, if_default=2,address=shop.shop_address_detail,lat=shop.lat,lon=shop.lon))
		self.session.commit()

	def create_staff(self,shop):
		temp_staff = self.session.query(models.ShopStaff).get(shop.admin_id)
		if temp_staff is None:
			self.session.add(models.ShopStaff(id=shop.admin_id, shop_id=shop.id))  # 添加默认员工时先添加一个员工，否则报错
		self.session.flush()

		self.session.add(models.HireLink(staff_id=shop.admin_id, shop_id=shop.id,default_staff=1))  # 把管理者默认为新店铺的二级配送员
		self.session.flush()

		# 把管理员同时设为顾客的身份
		customer_first = self.session.query(models.Customer).get(shop.admin_id)
		if customer_first is None:
			self.session.add(models.Customer(id = shop.admin_id,balance = 0,credits = 0,shop_new = 0))
		self.session.commit()
