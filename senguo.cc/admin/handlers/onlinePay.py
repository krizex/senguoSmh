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

class OnlineWxPay(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments('code?:str','order_num?:str')
	def get(self):
		print(self.request.full_url())
		path_url = self.request.full_url()
		order_num = self.get_cookie("order_num")
		order = self.session.query(models.Order).filter_by(num = order_num).first()
		if not order:
			return self.send_fail('order not found')
		totalPrice = order.totalPrice
		shop_id   = order.shop_id
		shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
		if not shop:
			return self.send_fail('shop not found')
		shopName = shop.shop_name
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
				sender_phone =None
				sender_img = None
		goods = []
		f_d = eval(order.fruits)
		m_d = eval(order.mgoods)
		for f in f_d:
			goods.append([f_d[f].get('fruit_name'),f_d[f].get('charge'),f_d[f].get('num')])
		for m in m_d:
			goods.append([m_d[m].get('mgoods_name'), m_d[m].get('charge') ,m_d[m].get('num')])
		#path = 'http://auth.senguo.cc/fruitzone/paytest'
		path = APP_OAUTH_CALLBACK_URL + self.reverse_url('onlineWxPay')
		print(path , 'redirect_uri is Ture?')
		print(self.args['code'],'sorry  i dont know')
		code = self.args.get('code',None)
		print(code,'how old are you',len(code))
		if len(code) is 2:
			url = jsApi.createOauthUrlForCode(path)
			print(url,'code?')
			return self.redirect(url)
		else:
			jsApi.setCode(code)
			openid = jsApi.getOpenid()
			print(openid,code,'hope is not []')
			if not openid:
				print('openid not exit')	
			unifiedOrder =   UnifiedOrder_pub()
			# totalPrice = self.args['totalPrice'] 
			#totalPrice =float( self.get_cookie('money'))
			print(totalPrice,'long time no see!')
			unifiedOrder.setParameter("body",'charge')
			unifiedOrder.setParameter("notify_url",'http://zone.senguo.cc/customer/onlinewxpay')
			unifiedOrder.setParameter("openid",openid)
			unifiedOrder.setParameter("out_trade_no",order_num)
			#orderPriceSplite = (order.price) * 100
			wxPrice =int(totalPrice * 100)
			print(wxPrice,'sure')
			unifiedOrder.setParameter('total_fee',wxPrice)
			unifiedOrder.setParameter('trade_type',"JSAPI")
			prepay_id = unifiedOrder.getPrepayId()
			print(prepay_id,'prepay_id================')
			jsApi.setPrepayId(prepay_id)
			renderPayParams = jsApi.getParameters()
			print(renderPayParams)
			noncestr = "".join(random.sample('zyxwvutsrqponmlkjihgfedcba0123456789', 10))
			timestamp = datetime.datetime.now().timestamp()
			wxappid = 'wx0ed17cdc9020a96e'
			signature = self.signature(noncestr,timestamp,path_url)
		return self.render("fruitzone/paywx.html",renderPayParams = renderPayParams,wxappid = wxappid,\
			noncestr = noncestr ,timestamp = timestamp,signature = signature,totalPrice = totalPrice,\
			shopName = shopName,create_date=create_date,receiver=receiver,phone=phone,address=address,\
			send_time = send_time,remark=remark,pay_type=pay_type,online_type=online_type,freight = freight,\
			goods = goods,sender_phone=sender_phone,sender_img=sender_img)

	def check_xsrf_cookie(self):
		print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!wxpay xsrf pass!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		pass
		return


	@CustomerBaseHandler.check_arguments('totalPrice?:float','action?:str')
	def post(self):
			print(self.args,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
			##############################################################
			# 微信在线支付成功回调
			# 修改订单状态 :支付订单刚生成时 状态为-1.完成支付后状态变为1
			# 增加相应店铺 相应的余额
			# 生成一条余额记录
			# 给店铺管理员 和 顾客 发送微信消息
			##############################################################
			print('微信在线支付回调成功')
			data = self.request.body
			print(self.request.body,'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
			xml = data.decode('utf-8')
			UnifiedOrder = UnifiedOrder_pub()
			xmlArray     = UnifiedOrder.xmlToArray(xml)
			status       = xmlArray['result_code']
			order_num    = str(xmlArray['out_trade_no'])

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
			totalPrice  = order.totalPrice

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
			self.session.commit()
			print(shop.shop_balance ,'支付后 商店总额')

			# 支付成功后  生成一条余额支付记录
			customer = self.session.query(models.Customer).filter_by(id = customer_id).first()
			if customer:
				name = customer.accountinfo.nickname
			else:
				return self.send_fail('customer not found')
			balance_history = models.BalanceHistory(customer_id =customer_id ,shop_id = shop_id,\
				balance_value = totalPrice,balance_record = '在线支付(微信)：订单'+ order.num, name = name , balance_type = 3,\
				shop_totalPrice = shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,transaction_id=transaction_id)
			self.session.add(balance_history)
			print(balance_history , '钱没有白充吧？！')
			self.session.commit()

			# send weixin message
			admin_name = shop.admin.accountinfo.nickname
			touser     = shop.admin.accountinfo.wx_openid
			shop_name  = shop.shop_name
			order_id   = order.num
			order_type = "立即送" if order.type == 1 else "按时达"
			phone      = order.phone
			create_date= order.create_date
			customer_name = order.receiver
			c_tourse      = customer.accountinfo.wx_openid
			print("[提交订单]用户OpenID：",c_tourse)

			#goods 
			goods = []
			f_d = eval(order.fruits)
			m_d = eval(order.mgoods)
			for f in f_d:
				goods.append([f_d[f].get('fruit_name'),f_d[f].get('charge'),f_d[f].get('num')])
			for m in m_d:
				goods.append([m_d[m].get('mgoods_name'), m_d[m].get('charge') ,m_d[m].get('num')])
			goods = str(goods)[1:-1]
			print(goods,'goods到底装的什么')
			order_totalPrice = float('%.1f'% totalPrice)
			print("[提交订单]订单总价：",order_totalPrice)
			# send_time     = order.get_sendtime(session,order.id)
			send_time = order.send_time
			address = order.address_text

			WxOauth2.post_order_msg(touser,admin_name,shop_name,order_id,order_type,create_date,\
				customer_name,order_totalPrice,send_time,goods,phone,address)
			# send message to customer
			WxOauth2.order_success_msg(c_tourse,shop_name,create_date,goods,order_totalPrice)
			return self.write('success')



class OnlineAliPay(CustomerBaseHandler):
	def initialize(self,action):
		self._action = action
		self.order_num = None
		print(self._action,'action')

	@tornado.web.authenticated
	def get(self):
		if self._action == 'AliPayCallback':
			return self.handle_onAlipay_callback()
		elif self._action == "AliPay":
			print("login in Alipay")
			order_num = self.get_cookie("order_num",None)
			self.order_num = order_num
			order = self.session.query(models.Order).filter_by(num = order_num).first()
			if not order:
				return self.send_fail('order not found')
			totalPrice = order.totalPrice
			alipayUrl =  self.handle_onAlipay()

			shop_id   = order.shop_id
			shopName  = order.shop.shop_name
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
					sender_phone = staff_info.phone
					sender_img = staff_info.headimgurl_small
			else:
					sender_phone =None
					sender_img = None
			goods = []
			f_d = eval(order.fruits)
			m_d = eval(order.mgoods)
			for f in f_d:
				goods.append([f_d[f].get('fruit_name'),f_d[f].get('charge'),f_d[f].get('num')])
			for m in m_d:
				goods.append([m_d[m].get('mgoods_name'), m_d[m].get('charge') ,m_d[m].get('num')])
				print(order_num,totalPrice,shopName,alipayUrl)
				return self.render("fruitzone/payali.html",totalPrice = totalPrice,shopName = shopName,\
					alipayUrl = alipayUrl,create_date=create_date,receiver=receiver,phone=phone,\
					address=address,send_time=send_time,remark=remark,pay_type=pay_type,online_type=\
					online_type,status=status,freight=freight,sender_phone=sender_phone,sender_img=\
					sender_img,goods = goods)
		else:
			return self.send_fail('404')
	# @tornado.web.authenticated
	def post(self):
		if self._action == 'AliNotify':
			return self.handle_onAlipay_notify()
		#if not self.current_user:
		#	return self.send_error(403)
		if self._action == "AliPay":
			return self.handle_onAlipay()
		else:
			return self.send_error(404)

	# @CustomerBaseHandler.check_arguments("order_id:str","price?:float")
	def handle_onAlipay(self):
		print('login handle_onAlipay')
		order_num = self.order_num if self.order_num else 'NULL'
		print(order_num,'order_num')
		# order = models.Order.get_by_id(self.session,int(self.args['order_id']))
		order = self.session.query(models.Order).filter_by(num = str(order_num)).first()
		if not order:
			print('order not found')
			return self.send_fail(error_text="抱歉 ，此订单不存在")
		#跳转到支付页
		else:
			print(order)
		order_id = order.id
		price    = order.totalPrice

		try:
			url = self.create_alipay_url(price,order_id)
		except Exception as e:
			return self.send_fail(error_text = '系统繁忙 ，请稍后再试')
		# return self.redirect(url)
		print(url,'urlurlurl')
		return url

	_alipay = WapAlipay(pid=ALIPAY_PID, key=ALIPAY_KEY, seller_email=ALIPAY_SELLER_ACCOUNT)

	def create_alipay_url(self,price,order_id):
		print('login create_alipay_url',price,order_id)
		authed_url = self._alipay.create_direct_pay_by_user_url(
			out_trade_no = str(order_id),
			subject      = 'alipay',
			total_fee    = float(price),
			seller_account_name = ALIPAY_SELLER_ACCOUNT,
			call_back_url = "%s%s"%(ALIPAY_HANDLE_HOST,self.reverse_url("onlineAlipayFishedCallback")),
			notify_url="%s%s"%(ALIPAY_HANDLE_HOST, self.reverse_url("onlineAliNotify")),
			)
		print('hhhhhahahahahahahahah')
		print(authed_url,'authed_url')
		return authed_url

	def check_xsrf_cookie(self):
		if self._action == 'onlineAliNotify':
			return True
		return super().check_xsrf_cookie()

	@CustomerBaseHandler.check_arguments("service","v","sec_id","sign","notify_data")
	def handle_onAlipay_notify(self):
		sign = self.args.pop('sign')
		signmethod = self._alipay.getSignMethod(**self.args)
		if signmethod(self.args) != sign:
			return self.send_error(403)
		print(self.args['notify_data'])
		notify_data = xmltodict.parse(self.args['notify_data'])['notify']
		orderId = notify_data["out_trade_no"]
		ali_trade_no=notify_data["trade_no"]
		print(ali_trade_no,'hehehehehe')
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
		totalPrice  = order.totalPrice

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
		self.session.commit()
		print(shop.shop_balance ,'支付后 商店总额')

		# 支付成功后  生成一条余额支付记录
		customer = self.session.query(models.Customer).filter_by(id = customer_id).first()
		if customer:
			name = customer.accountinfo.nickname
		else:
			return self.send_fail('customer not found')
		balance_history = models.BalanceHistory(customer_id =customer_id ,shop_id = shop_id,\
			balance_value = totalPrice,balance_record = '在线支付(支付宝)：订单'+ order.num, name = name , balance_type = 3,\
			shop_totalPrice = shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,transaction_id= ali_trade_no)
		self.session.add(balance_history)
		print(balance_history , '钱没有白充吧？！')
		self.session.commit()

		# send weixin message
		admin_name = shop.admin.accountinfo.nickname
		touser     = shop.admin.accountinfo.wx_openid
		shop_name  = shop.shop_name
		order_id   = order.num
		order_type = "立即送" if order.type == 1 else "按时达"
		phone      = order.phone
		create_date= order.create_date
		customer_name = order.receiver
		c_tourse      = customer.accountinfo.wx_openid
		print("[提交订单]用户OpenID：",c_tourse)

		#goods 
		goods = []
		f_d = eval(order.fruits)
		m_d = eval(order.mgoods)
		for f in f_d:
			goods.append([f_d[f].get('fruit_name'),f_d[f].get('charge'),f_d[f].get('num')])
		for m in m_d:
			goods.append([m_d[m].get('mgoods_name'), m_d[m].get('charge') ,m_d[m].get('num')])
		goods = str(goods)[1:-1]
		print(goods,'goods到底装的什么')
		order_totalPrice = float('%.1f'% totalPrice)
		print("[提交订单]订单总价：",order_totalPrice)
		# send_time     = order.get_sendtime(session,order.id)
		send_time = order.send_time
		address = order.address_text

		WxOauth2.post_order_msg(touser,admin_name,shop_name,order_id,order_type,create_date,\
			customer_name,order_totalPrice,send_time,goods,phone,address)
		# send message to customer
		WxOauth2.order_success_msg(c_tourse,shop_name,create_date,goods,order_totalPrice,order.id)
		return self.write('success')


	@CustomerBaseHandler.check_arguments("sign","result","out_trade_no","trade_no","request_token")
	def handle_onAlipay_callback(self):
		sign = self.args.pop("sign")
		signmethod = self._alipay.getSignMethod()
		if signmethod(self.args) != sign:
			Logger.warn("sign from onlineAlipay error!")
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
		totalPrice  = order.totalPrice

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
		self.session.commit()
		print(shop.shop_balance ,'支付后 商店总额')

		# 支付成功后  生成一条余额支付记录
		customer = self.session.query(models.Customer).filter_by(id = customer_id).first()
		if customer:
			name = customer.accountinfo.nickname
		else:
			return self.send_fail('customer not found')
		balance_history = models.BalanceHistory(customer_id =customer_id ,shop_id = shop_id,\
			balance_value = totalPrice,balance_record = '在线支付(支付宝)：订单'+ order.num, name = name , balance_type = 3,\
			shop_totalPrice = shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,transaction_id=ali_trade_no)
		self.session.add(balance_history)
		print(balance_history , '钱没有白充吧？！')
		self.session.commit()

		# send weixin message
		admin_name = shop.admin.accountinfo.nickname
		touser     = shop.admin.accountinfo.wx_openid
		shop_name  = shop.shop_name
		order_id   = order.num
		order_type = "立即送" if order.type == 1 else "按时达"
		phone      = order.phone
		create_date= order.create_date
		customer_name = order.receiver
		c_tourse      = customer.accountinfo.wx_openid
		print("[提交订单]用户OpenID：",c_tourse)

		#goods 
		goods = []
		f_d = eval(order.fruits)
		m_d = eval(order.mgoods)
		for f in f_d:
			goods.append([f_d[f].get('fruit_name'),f_d[f].get('charge'),f_d[f].get('num')])
		for m in m_d:
			goods.append([m_d[m].get('mgoods_name'), m_d[m].get('charge') ,m_d[m].get('num')])
		goods = str(goods)[1:-1]
		print(goods,'goods到底装的什么')
		order_totalPrice = float('%.1f'% totalPrice)
		print("[提交订单]订单总价：",order_totalPrice)
		# send_time     = order.get_sendtime(session,order.id)
		send_time = order.send_time
		address = order.address_text

		WxOauth2.post_order_msg(touser,admin_name,shop_name,order_id,order_type,create_date,\
			customer_name,order_totalPrice,send_time,goods,phone,address)
		# send message to customer
		WxOauth2.order_success_msg(c_tourse,shop_name,create_date,goods,order_totalPrice,order.id)

		return self.redirect(self.reverse_url("noticeSuccess"))

















