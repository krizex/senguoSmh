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
from handlers.base import WxOauth2

#from handlers.WXBizMsgCrypt import WXBizMsgCrypt

try:
	import xml.etree.cElementTree as ET
except:
	import xml.etree.ElementTree as ET



import libs.geetest as geetest


BASE_URL = "api.geetest.com/get.php?gt="

# captcha_id = "a40fd3b0d712165c5d13e6f747e948d4"
captcha_id = '552f9475a37933c10d31b3073123e36a'
# private_key = "0f1a37e33c9ed10dd2e133fe2ae9c459"
private_key = '6b75401374e76b11ff54d45a24896d33'
product = "embed"

# 弹出式
# product = "popup&popupbtnid=submit-button"

# 极验验证码
class GeeTest(CustomerBaseHandler):
	def get(self):
		gt = geetest.geetest(captcha_id, private_key)
		url = ""
		httpsurl = ""
		try:
			challenge = gt.geetest_register()
		except:
			challenge = ""
		# print(challenge,'challenge',len(challenge))
		if isinstance(challenge,bytes):
			challenge = challenge.decode('utf-8')
		if len(challenge) == 32:
			url = "http://%s%s&challenge=%s&product=%s" % (BASE_URL, captcha_id, challenge, product)
			httpsurl = "https://%s%s&challenge=%s&product=%s" % (BASE_URL, captcha_id, challenge, product)
			# print(url)
		self.render("apply/login.html", url=url)

	def post(self):
		username = self.get_argument("email")
		password = self.get_argument("password")

		challenge = self.get_argument("geetest_challenge")
		validate = self.get_argument("geetest_validate")
		seccode = self.get_argument("geetest_seccode")
		# print(challenge)
		# print(seccode)
		# print(validate,'validate')
		gt = geetest.geetest(captcha_id, private_key)
		result = gt.geetest_validate(challenge, validate, seccode)
		if result:
			self.write("success")
		else:
			self.write("fail")

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
				customer = self.session.query(models.Customer).filter_by(id = accountinfo.id).first()
				if customer:
					# print("[ApplyLogin]customer:",customer)
					self.set_current_user(customer,domain=ROOT_HOST_NAME)
			# print("[ApplyLogin]True")
			return self.send_success(login=True)
		else:
			# print("[ApplyLogin]False")
			return self.send_success(login=False)

# class WxOpen(CustomerBaseHandler):
# 	def get(self):
# 		return self.send_success()
# 	@CustomerBaseHandler.check_arguments('timestamp?:str','signature?:str','nonce?:str','encrypt_type?:str','msg_signature?:str','')
# 	def post(self):
# 		encodingAESKey = '1bvcmN6qGFEvM2zKfT7jDFy54rZt9senguo123WmmnJ'
# 		token = 'senguotest'
# 		appid = 'wxc30d9acccf942f82'
# 		appsecret = '0c79e1fa963cd80cc0be99b20a18faeb'

# 		timestamp = self.args.get('timestamp',None)
# 		signature = self.args.get('signature',None)
# 		nonce     = self.args.get('nonce',None)
# 		encrypt_type = self.args.get('encrypt_type',None)
# 		msg_signature= self.args.get('msg_signature',None)

# 		print(timestamp,signature,nonce,encrypt_type,msg_signature)

# 		decrypt_test = WXBizMsgCrypt(token,encodingAESKey,appid)

# 		raw_data = self.request.body
# 		print(raw_data)
# 		data = self.xmlToDic(raw_data)
# 		AppId = data.get('AppId',None)
# 		Encrypt = data.get('Encrypt',None)
# 		print(AppId,Encrypt)
# 		ret,decryp_xml = decrypt_test.DecryptMsg(raw_data,msg_signature,timestamp,nonce)
# 		print(ret,decryp_xml)
# 		if isinstance(decryp_xml,bytes):
# 			decryp_xml = decryp_xml.decode('utf-8')
# 		index = decryp_xml.find('<ComponentVerifyTicket>')
# 		end   = decryp_xml.find('</ComponentVerifyTicket>')
# 		length = len('<ComponentVerifyTicket><![CDATA[')
# 		if index != -1 and end != -1:
# 			ComponentVerifyTicket = decryp_xml[index+length:end-3]
# 			print('ComponentVerifyTicket correct:',ComponentVerifyTicket)
# 		else:
# 			print('get ComponentVerifyTicket error')
# 		return self.write('success')

# 	@classmethod
# 	def xmlToDic(self,xmlstr):
# 		if isinstance(xmlstr,bytes):
# 			xmlstr = xmlstr.decode('utf-8')
# 		else:
# 			xmlstr = xmlstr
# 		data = {}
# 		tree = ET.fromstring(xmlstr)
# 		for child in tree:
# 			data[child.tag] = child.text
# 		return data	

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
			elif Content == '报名':
				#利用客服接口发送两条消息
				access_token = WxOauth2.get_client_access_token()
				reply_message = '欢迎报名参加森果商学院~~~\n\n1.请将报名图文分享在朋友圈，并加上“报名参加”等字样的文字。\n\n2.分享后截图给客服MM就成功报名啦~\n\n3.如果是尚未添加客服MM的小伙伴，可以长按下方弹出的二维码关注。\n\n报名成功的小伙伴将在周四上午统一邀请入群~\n按要求报名的小伙伴都会拉群的，请不要急，也不要多次骚扰客服MM。'
				url = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token={0}'.format(access_token)
				# data = {
				# 	"touser":FromUserName,
				# 	"msgtype":"text",
				# 	"text":
				# 	{
				# 		"content":content
				# 	}
				# }
				# r = requests.post(url,data = json.dumps(data))
				# if r.status_code == 200:
				# 	print('message send success')
				pic_data = {
					"touser":FromUserName,
					"msgtype":"image",
					"image":{
						"media_id":"LqIof0sxyEHrCWJaeBky26cla89Rvx8ekiOydXuk6WoyUGxeSH7HE33um6EYPjpO"
					}
				}
				r = requests.post(url,data=json.dumps(pic_data))
				if r.status_code == 200:
					print("picture send success")
				# return self.write('')
			else:
				#MsgType = 'transfer_customer_service'
				#reply_message = None
				reply_message = '您好，相关问题可以添加森果客服微信（senguocc100）进行咨询哦'
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
					#admin = models.ShopAdmin()
					#admin.accountinfo = account_info
					#self.session.add(admin)
					self.session.commit()

			# 用户关注微信服务号
			if event == 'subscribe':
				# 根据场景值统计扫码关注服务号的用户数量
				if scene_id:
					if scene_id >= 100000000:
						scene_id = 999999999
					scene_static = self.session.query(models.SceneStatic).filter_by(scene_id=scene_id).first()
					if scene_static:
						scene_static.times += 1
					else:
						scene_static = models.SceneStatic(scene_id=scene_id,times=1)
						self.session.add(scene_static)
					self.session.commit()
				# 用户关注后自动发送消息
				ToUserName = data.get('ToUserName',None) #开发者微信号
				FromUserName = data.get('FromUserName',None) # 发送方openid
				CreateTime  = data.get('CreateTime',None) #接受消息时间
				MsgType = 'text'
				reply_message = '再小的水果店，也要有自己的O2O平台！\n互联网时代，水果零售一站式解决方案！\n---------\n赶紧点击http://senguo.cc/apply申请接入，拥有属于你的水果O2O店铺吧\n你也可以点击http://senguo.cc/list进入水果商城开始选购水果'
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
		try:
			L.sort()
		except:
			print('L sort error')
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
	#@tornado.web.authenticated
	def get(self):
		if not self.current_user:
			return self.redirect(self.reverse_url("ApplyLogin"))
		try:
			if_admin = self.session.query(models.ShopAdmin).filter_by(id=self.current_user.id,role=1).first()
		except:
			if_admin = None
			
		if if_admin:
			return self.redirect(self.reverse_url("switchshop"))

		# try:
		# 	if_shop_admin = self.session.query(models.HireLink).join(models.ShopStaff,models.HireLink.staff_id == models.ShopStaff.id)\
		# 	.filter(models.HireLink.active==1,models.HireLink.work ==9 ,models.ShopStaff.id == account_id).first()
		# except:
		# 	if_shop_admin = None
		# try:
		# 	if_shop = self.session.query(models.Shop).filter_by(id = if_shop_admin.shop_id).first()
		# except:
		# 	if_shop = None
		# if if_shop_admin:
		# 	return self.redirect(self.reverse_url("switchshop"))
		phone = self.current_user.accountinfo.phone if self.current_user.accountinfo.phone else ""
		logo_img = self.current_user.accountinfo.headimgurl_small
		nickname = self.current_user.accountinfo.nickname
		realname = self.current_user.accountinfo.realname if self.current_user.accountinfo.phone else ""
		wx_username = self.current_user.accountinfo.wx_username if self.current_user.accountinfo.phone else ""
		#添加极验验证码 woody 8.20
		gt = geetest.geetest(captcha_id, private_key)
		url = ""
		httpsurl = ""
		try:
			challenge = gt.geetest_register()
		except:
			challenge = ""
		# print(challenge,'challenge',len(challenge))
		if isinstance(challenge,bytes):
			challenge = challenge.decode('utf-8')
		if len(challenge) == 32:
			url = "http://%s%s&challenge=%s&product=%s" % (BASE_URL, captcha_id, challenge, product)
			httpsurl = "https://%s%s&challenge=%s&product=%s" % (BASE_URL, captcha_id, challenge, product)
			# print(url)
		return self.render('apply/home.html',logo_img=logo_img,nickname=nickname,phone=phone,realname=realname,wx_username=wx_username,url=url)

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("phone:str","realname:str","code:int","wx_username:str")
	def post(self):
		#极验验证
		challenge = self.get_argument("geetest_challenge")
		validate = self.get_argument("geetest_validate")
		seccode = self.get_argument("geetest_seccode")
		# print (challenge,)
		# print (seccode)
		# print (validate,'validate')
		if len(challenge) <2 or len(seccode) <2 or len(validate) <2:
			return self.send_fail('请先完成图形验证')
		gt = geetest.geetest(captcha_id, private_key)
		result = gt.geetest_validate(challenge, validate, seccode)
		if not result:
			return self.send_fail('验证码错误')

		try:
			if_admin = self.session.query(models.ShopAdmin).filter_by(id=self.current_user.id,role=1).first()
		except:
			if_admin = None
		if if_admin:
			return self.send_fail("您已是卖家")
		#判断申请店铺的微信是否已是某店铺的管理员身份
		# try:
		# 	if_shopadmin = self.session.query(models.HireLink).join(models.ShopStaff,models.HireLink.staff_id == models.ShopStaff.id)\
		# 	.filter(models.HireLink.active==1,models.HireLink.work ==9 ,models.ShopStaff.id == self.current_user.id).first()
		# except:
		# 	if_shopadmin = None
		# try:
		# 	if_shop = self.session.query(models.Shop).filter_by(id = if_admin.shop_id).first()
		# except:
		# 	if_shop = None
		# if if_shopadmin:
		# 	return self.send_fail('该账号已是'+if_shop.shop_name+'的管理员，不能使用该账号申请店铺，若要使用该账号，请退出'+if_shop.shop_name+'管理员身份更换或其它账号')

		if not self.args['phone']:
			return self.send_fail("please input your phone number")
		if not self.args["realname"]:
			return self.send_fail("please input your realname")
		if not check_msg_token(phone=self.args['phone'], code=int(self.args["code"])):
			return self.send_fail(error_text="验证码过期或者不正确")

		if len(self.args["phone"])>11:
			return self.send_fail("手机号格式错误")
		if len(self.args["realname"])>20:
			return self.send_fail("真实姓名请不要超过20个字")
		if len(self.args["wx_username"])>20:
			return self.send_fail("微信号请不要超过20个字")

		if_normal_admin = self.session.query(models.ShopAdmin).filter_by(id=self.current_user.id).first()
		# print(if_normal_admin)
		self.current_user.accountinfo.phone=self.args["phone"]
		self.current_user.accountinfo.realname=self.args["realname"]
		self.current_user.accountinfo.wx_username=self.args["wx_username"]
		if if_normal_admin:
			if_normal_admin.role=1
			if_normal_admin.privileges = -1
		else:
			self.session.add(models.ShopAdmin(id=self.current_user.id))
		self.session.commit()
		return self.send_success()

# 创建店铺
class CreateShop(AdminBaseHandler):
	def if_current_shops(self):
		return True
		
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
			super_admin = self.session.query(models.ShopAdmin).filter_by(id=self.current_user.id,role=1).one()
		except:
			super_admin = None
		if not super_admin:
			return self.send_fail("您不是卖家，无法创建新的店铺")
		# try:
		# 	if_shopadmin = self.session.query(models.HireLink).join(models.ShopStaff,models.HireLink.staff_id == models.ShopStaff.id)\
		# 	.filter(models.HireLink.active==1,models.HireLink.work ==9 ,models.ShopStaff.id == self.current_user.id).first()
		# except:
		# 	if_shopadmin = None
		# if if_shopadmin:
		# 	return self.send_fail("您没有创建店铺的权限")
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

		_admin_id = self.current_user.id
		# if self.current_shop:
		# 	_admin_id = self.current_shop.admin_id
		# else:
		# 	_admin_id = self.current_user.id

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
				shop.goods_count = len(spider_goods)
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
