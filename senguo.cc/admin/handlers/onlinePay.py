#coding:utf-8
from handlers.base import CustomerBaseHandler,WxOauth2
from handlers.wxpay import JsApi_pub, UnifiedOrder_pub, Notify_pub
import dal.models as models
import tornado.web
from settings import *
from libs.alipay import WapAlipay
import datetime, time
from sqlalchemy import desc, and_, or_,func
import qiniu
import random
import base64
import json
import libs.xmltodict as xmltodict
from libs.msgverify import gen_msg_token,check_msg_token
from settings import APP_OAUTH_CALLBACK_URL, MP_APPID, MP_APPSECRET, ROOT_HOST_NAME

class QrWxpay(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments('order_id?:str')
	def get(self):
		order = self.session.query(models.Order).filter_by(id = order_id).first()
		if not order:
			return self.send_fail('order not found')
		totalPrice = order.new_totalprice

class OnlineWxPay(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments('code?:str','order_id?:str')
	def get(self):
		order_id = self.get_cookie("order_id")
		order = self.session.query(models.Order).filter_by(id = order_id).first()
		if not order:
			return self.send_fail('order not found')
		totalPrice = order.new_totalprice
		wxPrice =int(totalPrice * 100)

		# print("[WeixinPay]full_url:",self.request.full_url())
		path_url = self.request.full_url()

		shop_id   = order.shop_id
		shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
		if not shop:
			return self.send_fail('shop not found')
		shop_name = shop.shop_name
		shop_code = shop.shop_code
		jsApi  = JsApi_pub()

		# order detail
		create_date = order.create_date
		receiver    = order.receiver
		phone       = order.phone
		address     = order.address_text
		send_time   = order.send_time
		remark      = order.remark
		pay_type    = order.pay_type
		online_type = order.online_type
		status      = order.status
		order_num	= order.num

		charge_types = self.session.query(models.ChargeType).filter(
			models.ChargeType.id.in_(eval(order.fruits).keys())).all()
		if order.type == 2:
			freight = order.shop.config.freight_on_time
		else:
			freight = order.shop.config.freight_now
		staff_id = order.SH2_id
		staff_info = self.session.query(models.Accountinfo).filter_by(id = staff_id).first()
		if staff_info is not None:
				sender_phone = staff_info.phone
				sender_img = staff_info.headimgurl_small
		else:
				sender_phone = None
				sender_img = None
		goods = []
		f_d = eval(order.fruits)
		for f in f_d:
			goods.append([f_d[f].get('fruit_name'),f_d[f].get('charge'),f_d[f].get('num')])

		qr_url=""
		if not self.is_wexin_browser():
			qr_url = self._qrwxpay()
			# print("[WeixinPay]qr_url:",qr_url)
			return self.render('customer/online-qrwxpay.html',qr_url = qr_url,totalPrice = totalPrice,\
			shop_name = shop_name,create_date=create_date,receiver=receiver,phone=phone,address=address,\
			send_time = send_time,remark=remark,pay_type=pay_type,online_type=online_type,freight = freight,\
			goods = goods,sender_phone=sender_phone,sender_img=sender_img,charge_types=charge_types,\
			order=order)

		path = APP_OAUTH_CALLBACK_URL + self.reverse_url('onlineWxPay')
		code = self.args.get('code',None)
		if len(code) is 2:
			url = jsApi.createOauthUrlForCode(path)
			# print("[WeixinPay]code url:",url)
			return self.redirect(url)
		else:
			jsApi.setCode(code)
			openid = jsApi.getOpenid()
			# print("[WeixinPay]current code:",code)
			if not openid:
				print("[WeixinPay]OpenID not found")
			unifiedOrder =   UnifiedOrder_pub()
			# totalPrice = self.args['totalPrice']
			# totalPrice =float( self.get_cookie('money'))
			# print("[WeixinPay]totalPrice:",totalPrice)
			unifiedOrder.setParameter("body",'charge')
			unifiedOrder.setParameter("notify_url",'http://zone.senguo.cc/customer/onlinewxpay')
			unifiedOrder.setParameter("openid",openid)
			unifiedOrder.setParameter("out_trade_no",order_num)
			# orderPriceSplite = (order.price) * 100
			wxPrice =int(totalPrice * 100)
			# print("[WeixinPay]wxPrice:",wxPrice)
			unifiedOrder.setParameter('total_fee',wxPrice)
			unifiedOrder.setParameter('trade_type',"JSAPI")
			prepay_id = unifiedOrder.getPrepayId()
			# print("[WeixinPay]prepay_id:",prepay_id)
			jsApi.setPrepayId(prepay_id)
			renderPayParams = jsApi.getParameters()
			# print("[WeixinPay]renderPayParams:",renderPayParams)
			noncestr = "".join(random.sample('zyxwvutsrqponmlkjihgfedcba0123456789', 10))
			timestamp = datetime.datetime.now().timestamp()
			wxappid = 'wx0ed17cdc9020a96e'
			signature = self.signature(noncestr,timestamp,path_url)

			qr_url = self._qrwxpay()
		return self.render("fruitzone/paywx.html",qr_url = qr_url ,renderPayParams = renderPayParams,wxappid = wxappid,\
			noncestr = noncestr ,timestamp = timestamp,signature = signature,totalPrice = totalPrice,\
			shop_name = shop_name,create_date=create_date,receiver=receiver,phone=phone,address=address,\
			send_time = send_time,remark=remark,pay_type=pay_type,online_type=online_type,freight = freight,\
			goods = goods,sender_phone=sender_phone,sender_img=sender_img,charge_types=charge_types,\
			order=order,shop_code = shop_code)

	def check_xsrf_cookie(self):
		print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!wxpay xsrf pass!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		pass
		return

	def _qrwxpay(self):
		import chardet
		order_id = self.get_cookie("order_id")
		order = self.session.query(models.Order).filter_by(id = order_id).first()
		if not order:
			return self.send_fail('order not found')
		totalPrice = order.new_totalprice
		# print("[WeixinQrPay]totalPrice:",totalPrice)
		wxPrice =int(totalPrice * 100)
		unifiedOrder =  UnifiedOrder_pub()
		unifiedOrder.setParameter("body",'QrWxpay')
		unifiedOrder.setParameter("notify_url",'http://zone.senguo.cc/customer/onlinewxpay')
		unifiedOrder.setParameter("out_trade_no",str(order.num) + 'a' )
		unifiedOrder.setParameter('total_fee',wxPrice)
		unifiedOrder.setParameter('trade_type',"NATIVE")
		res = unifiedOrder.postXml()
		if isinstance(res,bytes):
			bianma = chardet.detect(res)['encoding']
			res = res.decode(bianma)
		else:
			print("[WeixinQrPay]encoding error")
		res_dict = unifiedOrder.xmlToArray(res)
		if 'code_url' in res_dict:
				qr_url = res_dict['code_url']
		else:
			qr_url = ""
		return qr_url

	@CustomerBaseHandler.check_arguments('totalPrice?:float','action?:str')
	def post(self):
			##############################################################
			# 微信在线支付成功回调
			# 修改订单状态 :支付订单刚生成时 状态为-1.完成支付后状态变为1
			# 增加相应店铺 相应的余额
			# 生成一条余额记录
			# 给店铺管理员 和 顾客 发送微信消息
			##############################################################
			# print("[WeixinPay]Callback success")
			data = self.request.body
			# print("[WeixinPay]request.body:",self.request.body)
			xml = data.decode('utf-8')
			UnifiedOrder = UnifiedOrder_pub()
			xmlArray     = UnifiedOrder.xmlToArray(xml)
			status       = xmlArray['result_code']
			order_num    = str(xmlArray['out_trade_no'])
			order_num    = order_num.split('a')[0]

			# result       = orderId.split('a')
			# customer_id  = int(result[0])
			# shop_id      = int(result[1])
			# totalPrice   = (float(result[2]))/100
			transaction_id = str(xmlArray['transaction_id'])

			if status != 'SUCCESS':
				return False

			order = self.session.query(models.Order).filter_by(num = order_num).first()
			if not order:
				return self.send_fail('order not found')
			customer_id = order.customer_id
			shop_id     = order.shop_id
			totalPrice  = order.new_totalprice

			order.status = 1  #修改订单状态

			#判断是否已经回调过，如果记录在表中，则不执行接下来操作
			old_balance_history=self.session.query(models.BalanceHistory).filter_by(transaction_id=transaction_id).first()
			if old_balance_history:
				return self.write('success')
			shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = customer_id,\
				shop_id = shop_id).first()
			if not shop_follow:
				return self.send_fail('shop_follow not found')

			# 修改店铺总余额
			shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
			if not shop:
				return self.send_fail('shop not found')
			shop.shop_balance += totalPrice
			self.session.flush()
			# print("[WeixinPay]shop_balance:",shop.shop_balance)

			# 支付成功后  生成一条余额支付记录
			customer = self.session.query(models.Customer).filter_by(id = customer_id).first()
			if customer:
				name = customer.accountinfo.nickname
			else:
				return self.send_fail('customer not found')
			balance_history = models.BalanceHistory(customer_id =customer_id ,shop_id = shop_id,\
				balance_value = totalPrice,balance_record = '在线支付(微信)：订单'+ order.num, name = name , balance_type = 3,\
				shop_totalPrice = shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,transaction_id=transaction_id,
				shop_province=shop.shop_province)
			self.session.add(balance_history)
			# print("[WeixinPay]balance_history:",balance_history)
			self.session.commit()

			# 发送订单模版消息给管理员/自动打印订单
			self.send_admin_message(self.session,order)

			return self.write('success')

class wxpayCallBack(CustomerBaseHandler):
	def get(self):
		order_id = self.get_cookie("order_id")
		order = self.session.query(models.Order).filter_by(id = order_id).first()
		if not order:
			return self.send_fail('order not found')
		totalPrice = order.new_totalprice
		wxPrice =int(totalPrice * 100)
		unifiedOrder =  UnifiedOrder_pub()
		unifiedOrder.setParameter("body",'QrWxpay')
		unifiedOrder.setParameter("notify_url",'http://zone.senguo.cc/customer/onlinewxpay')
		unifiedOrder.setParameter("out_trade_no",str(order.num) + 'a' )
		unifiedOrder.setParameter('total_fee',wxPrice)
		unifiedOrder.setParameter('trade_type',"NATIVE")
		res = unifiedOrder.postXml().decode('utf-8')
		res_dict = unifiedOrder.xmlToArray(res)
		if 'code_url' in res_dict:
			qr_url = res_dict['code_url']
		else:
			qr_url = ""
		return self.send_success(qr_url=qr_url)


class OrderDetail(CustomerBaseHandler):
	#@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("alipayUrl?:str","order_id?:str")
	def get(self):
		alipayUrl = self.args['alipayUrl']
		order_id = self.args['order_id']
		# print("[AliPay]order_id:",order_id)
		order = self.session.query(models.Order).filter_by(id = order_id).first()
		if not order:
			return self.send_fail('order not found')
		return self.render("customer/alipay-tip.html",alipayUrl = alipayUrl,order_id = order_id)

class JustOrder(CustomerBaseHandler):
	@CustomerBaseHandler.check_arguments("order_id?:str")
	def get(self):
		order_id = int(self.args['order_id'])
		order = models.Order.get_by_id(self.session,order_id)
		if not order:
			return self.send_fail(error_text = 'class OrderDetail:order not found!')
		if order.status == -1:
			return self.redirect(self.reverse_url('onlineAliPay'))
		elif order.status == 1:
			return self.redirect(self.reverse_url('noticeSuccess'))
		else:
			return self.send_fail(error_text ='order status error')

class OnlineAliPay(CustomerBaseHandler):
	def initialize(self,action):
		self._action = action
		self.order_num = None
		# print("[AliPay]action:",self._action)

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("order_id?:str")
	def get(self):
		if self._action == 'AliPayCallback':
			return self.handle_onAlipay_callback()
		# 在线支付提交订单
		elif self._action == "AliPay":
			# print("[AliPay]login AliPay")
			order_id = int(self.get_cookie("order_id"))
			# print("[AliPay]order_id:",order_id)
			#self.order_num = order_num
			#order_id = int(self.args['order_id'])
			order = self.session.query(models.Order).filter_by(id = order_id).first()
			if not order:
				return self.send_fail('order not found')
			totalPrice = order.new_totalprice
			alipayUrl =  self.handle_onAlipay(order.num)
			self.order_num = order.num
			# print("[AliPay]alipayUrl:",alipayUrl)
			# print("[AliPay]order_num:",self.order_num)

			charge_types = self.session.query(models.ChargeType).filter(models.ChargeType.id.in_(eval(order.fruits).keys())).all()
			# mcharge_types = self.session.query(models.MChargeType).filter(models.MChargeType.id.in_(eval(order.mgoods).keys())).all()

			shop_id   = order.shop_id
			shopName  = order.shop.shop_name
			shop_code = order.shop.shop_code
			# order detail
			create_date = order.create_date
			receiver    = order.receiver
			phone       = order.phone
			address     = order.address_text
			send_time   = order.send_time
			remark      = order.remark
			pay_type    = order.pay_type
			online_type = order.online_type
			status      = order.status
			if order.type == 2:
				freight = order.shop.config.freight_on_time
			else:
				freight = order.shop.config.freight_now
			staff_id = order.SH2_id
			staff_info = self.session.query(models.Accountinfo).filter_by(id = staff_id).first()
			if staff_info is not None:
					order.sender_phone = staff_info.phone
					order.sender_img = staff_info.headimgurl_small
			else:
					order.sender_phone =None
					order.sender_img = None
			goods = []
			f_d = eval(order.fruits)
			for f in f_d:
				goods.append([f_d[f].get('fruit_name'),f_d[f].get('charge'),f_d[f].get('num')])
			# for m in m_d:
			# 	goods.append([m_d[m].get('mgoods_name'), m_d[m].get('charge') ,m_d[m].get('num')])
			return self.render("fruitzone/payali.html",totalPrice = totalPrice,shopName = shopName,\
				alipayUrl = alipayUrl,create_date=create_date,receiver=receiver,phone=phone,\
				address=address,send_time=send_time,remark=remark,pay_type=pay_type,online_type=\
				online_type,status=status,freight=freight,goods = goods,order=order,charge_types=\
				charge_types,shop_code = shop_code)
		else:
			return self.send_fail('404')
	# @tornado.web.authenticated
	def post(self):
		if self._action == 'AliNotify':
			return self.handle_onAlipay_notify()
		#if not self.current_user:
		#	return self.send_error(403)
		if self._action == "AliPay":
			return self.handle_onAlipay(order_num)
		else:
			return self.send_error(404)

	# @CustomerBaseHandler.check_arguments("order_id:str","price?:float")
	def handle_onAlipay(self,order_num):
		# print("[AliPay]login handle_onAlipay")
		# order_num = self.order_num if self.order_num else 'NULL'
		# print("[AliPay]order_num:",order_num)
		# order = models.Order.get_by_id(self.session,int(self.args['order_id']))
		order = self.session.query(models.Order).filter_by(num = str(order_num)).first()
		if not order:
			# print("[AliPay]order not found")
			return self.send_fail(error_text="抱歉，此订单不存在")
		#跳转到支付页
		#else:
		#	print("[AliPay]order:",order)
		order_id = order.id
		price    = order.new_totalprice

		try:
			url = self.create_alipay_url(price,order_id)
		except Exception as e:
			return self.send_fail(error_text = '系统繁忙，请稍后再试')
		# return self.redirect(url)
		# print("[AliPay]redirect url:",url)
		return url

	_alipay = WapAlipay(pid=ALIPAY_PID, key=ALIPAY_KEY, seller_email=ALIPAY_SELLER_ACCOUNT)

	def create_alipay_url(self,price,order_id):
		# print("[AliPay]login create_alipay_url:",price,order_id)
		authed_url = self._alipay.create_direct_pay_by_user_url(
			out_trade_no = str(order_id),
			subject      = 'alipay',
			total_fee    = float(price),
			#defaultbank  = CMB,
			seller_account_name = ALIPAY_SELLER_ACCOUNT,
			call_back_url = "%s%s"%(ALIPAY_HANDLE_HOST,self.reverse_url("noticeSuccess")),
			notify_url="%s%s"%(ALIPAY_HANDLE_HOST, self.reverse_url("onlineAliNotify")),
			)
		# print("[AliPay]authed_url:",authed_url)
		return authed_url

	def check_xsrf_cookie(self):
		if self._action == 'onlineAliNotify':
			return True
		return super().check_xsrf_cookie()

	@CustomerBaseHandler.check_arguments("service","v","sec_id","sign","notify_data")
	def handle_onAlipay_notify(self):
		sign = self.args.pop('sign')
		signmethod = self._alipay.getSignMethod(**self.args)
		# print("[AliPay]Callback success")
		if signmethod(self.args) != sign:
			return self.send_error(403)
		# print("[AliPay]Callback data:",self.args['notify_data'])
		notify_data = xmltodict.parse(self.args['notify_data'])['notify']
		orderId = notify_data["out_trade_no"]
		ali_trade_no=notify_data["trade_no"]
		# print("[AliPay]ali_trade_no:",ali_trade_no)
		old_balance_history = self.session.query(models.BalanceHistory).filter_by(transaction_id = ali_trade_no).first()
		if old_balance_history:
			return self.send_success()
		order = models.Order.get_by_id(self.session,orderId)
		if not order:
			return self.send_fail(error_text = '抱歉，此订单不存在！')
		##############################################################
		# 在线支付成功回调业务处理
		# 修改订单状态 :支付订单刚生成时 状态为-1.完成支付后状态变为1
		# 增加相应店铺 相应的余额
		# 生成一条余额记录
		# 给店铺管理员 和 顾客 发送微信消息
		##############################################################
		customer_id = order.customer_id
		shop_id     = order.shop_id
		totalPrice  = order.new_totalprice

		order.status = 1  #修改订单状态
		shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = customer_id,\
			shop_id = shop_id).first()
		if not shop_follow:
			return self.send_fail('shop_follow not found')

		# 修改店铺总余额
		shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
		if not shop:
			return self.send_fail('shop not found')
		shop.shop_balance += totalPrice
		self.session.flush()
		# print("[AliPay]shop_balance:",shop.shop_balance)

		# 支付成功后  生成一条余额支付记录
		customer = self.session.query(models.Customer).filter_by(id = customer_id).first()
		if customer:
			name = customer.accountinfo.nickname
		else:
			return self.send_fail('customer not found')
		balance_history = models.BalanceHistory(customer_id =customer_id ,shop_id = shop_id,\
			balance_value = totalPrice,balance_record = '在线支付(支付宝)：订单'+ order.num, name = name , balance_type = 3,\
			shop_totalPrice = shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,transaction_id= ali_trade_no,
			shop_province = shop.shop_province)
		self.session.add(balance_history)
		# print("[AliPay]balance_history:",balance_history)
		self.session.commit()

		# 发送订单模版消息给管理员/自动打印订单
		self.send_admin_message(self.session,order)
		
		return self.write('success')

	@CustomerBaseHandler.check_arguments("sign","result","out_trade_no","trade_no","request_token")
	def handle_onAlipay_callback(self):
		sign = self.args.pop("sign")
		signmethod = self._alipay.getSignMethod()
		if signmethod(self.args) != sign:
			print("[AliPay]sign from onlineAlipay error")
			return self.send_error(403)
		orderId=str(self.args["out_trade_no"])
		ali_trade_no=self.args["trade_no"]
		old_balance_history = self.session.query(models.BalanceHistory).filter_by(transaction_id = ali_trade_no).first()
		if old_balance_history:
			return self.redirect(self.reverse_url("customerRecharge"))
		order = models.Order.get_by_id(self.session,orderId)
		if not order:
			return self.send_fail(error_text = '抱歉，此订单不存在！')
		##############################################################
		# 在线支付成功回调业务处理
		# 修改订单状态 :支付订单刚生成时 状态为-1.完成支付后状态变为1
		# 增加相应店铺 相应的余额
		# 生成一条余额记录
		# 给店铺管理员 和 顾客 发送微信消息
		##############################################################
		customer_id = order.customer_id
		shop_id     = order.shop_id
		totalPrice  = order.new_totalprice

		order.status = 1  #修改订单状态
		shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = customer_id,\
			shop_id = shop_id).first()
		if not shop_follow:
			return self.send_fail('shop_follow not found')

		# 修改店铺总余额
		shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
		if not shop:
			return self.send_fail('shop not found')
		shop.shop_balance += totalPrice
		self.session.flush()
		# print("[AliPay]shop_balance:",shop.shop_balance)

		# 支付成功后  生成一条余额支付记录
		customer = self.session.query(models.Customer).filter_by(id = customer_id).first()
		if customer:
			name = customer.accountinfo.nickname
		else:
			return self.send_fail('customer not found')
		balance_history = models.BalanceHistory(customer_id =customer_id ,shop_id = shop_id,\
			balance_value = totalPrice,balance_record = '在线支付(支付宝)：订单'+ order.num, name = name , balance_type = 3,\
			shop_totalPrice = shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,transaction_id=ali_trade_no,
			shop_province = shop.shop_province)
		self.session.add(balance_history)
		# print("[AliPay]balance_history:",balance_history)
		self.session.commit()

		# 发送订单模版消息给管理员/自动打印订单
		self.send_admin_message(self.session,order)

		return self.redirect(self.reverse_url("noticeSuccess"))