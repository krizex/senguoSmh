#coding:utf-8
from handlers.base import CustomerBaseHandler,WxOauth2
from handlers.wxpay import JsApi_pub, UnifiedOrder_pub, Notify_pub,Refund_pub,RefundQuery_pub,DownloadBill_pub
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
import re
import chardet
import datetime
import requests
class QrWxpay(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments('order_id?:str')
	def get(self):
		order = self.session.query(models.Order).filter_by(id = order_id).first()
		if not order:
			return self.send_fail('order not found')
		totalPrice = order.new_totalprice

class RefundCallback(CustomerBaseHandler):
	def get (self):
		return self.write('success')

	@CustomerBaseHandler.check_arguments("service","v","sec_id","sign","notify_data")
	def post(self):
		print("[Alipay refund] notify_url!!!!!!!!")
		session = models.DBSession()
		_alipay = WapAlipay(pid=ALIPAY_PID, key=ALIPAY_KEY, seller_email=ALIPAY_SELLER_ACCOUNT)
		sign = self.args.pop('sign')
		signmethod = _alipay.getSignMethod(**self.args)
		if signmethod(self.args) != sign:
			print('sign error')
			return self.write('sign error')
		notify_data = xmltodict.parse(self.args['notify_data'])['notify']
		result_details = notify_data['result_details']
		transaction_id = result_details.split('^')[0]
		balance_history = session.query(models.BalanceHistory).filter_by(transaction_id=transaction_id).first()
		if not balance_history:
			return self.write('old_balance_history not found')
		order = session.query(models.Order).filter_by(transaction_id=transaction_id).first()
		if not order:
			print('order not found')
			return self.write('order not found')
		##########################################################################
		order.del_reason = 'refund'
		order.get_num(session,order.id)  #取消订单,库存增加，在售减少 	
		shop_id = balance_history.shop_id
		balance_value = balance_history.balance_value
		shop = order.shop 
		#该店铺余额减去订单总额
		shop.shop_balance -= balance_value
		balance_history.is_cancel = 1
		#将这条余额记录作废
		balance_history.balance_type = -1
		customer_id = balance_history.customer_id
		name        = balance_history.name
		shop_province = balance_history.shop_province
		shop_name     = balance_history.shop_name
		balance_record = balance_history.balance_record + '--退款'
		create_time   = datetime.datetime.now()
		shop_totalPrice = shop.shop_balance
		customer_totalPrice = balance_history.customer_totalPrice
		transaction_id   = balance_history.transaction_id
		available_balance = balance_history.available_balance
		#同时生成一条退款记录
		refund_history = models.BalanceHistory(customer_id=customer_id,shop_id=shop_id,shop_province=shop_province,shop_name=shop_name,name=name,
			balance_record=balance_record,create_time=create_time,shop_totalPrice=shop_totalPrice,customer_totalPrice=customer_totalPrice,
			transaction_id=transaction_id,balance_type=9,balance_value=balance_value)
		session.add(refund_history)
		# self.session.flush()
		# # 9.15 woody 
		# # 生成一条支付宝退款记录
		# apply_refund = models.ApplyRefund(customer_id=customer_id,order_id=order_id,refund_type=1,refund_fee=totalPrice,
		# 	transaction_id=transaction_id,order_num=num)
		# self.session.add(apply_refund)
		session.commit()
		return self.write('success')

	def check_xsrf_cookie(self):
		print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!wxpay xsrf pass!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		pass
		return


class RefundWxpay(CustomerBaseHandler):
	# @tornado.web.authenticated
	
	_alipay = WapAlipay(pid=ALIPAY_PID, key=ALIPAY_KEY, seller_email=ALIPAY_SELLER_ACCOUNT)

	@CustomerBaseHandler.check_arguments('order_id?:str','action','bill_date?:str')
	def post(self):
		order_id = self.args['order_id']
		action   = self.args['action']
		bill_date=self.args['bill_date']
		# if len(bill_date)==0:
		if len(order_id) == 0:
				return self.send_fail('order_id error')
		order = self.session.query(models.Order).filter_by(id=order_id).first()
		if not order:
				return self.send_fail('order not found')
		totalPrice = order.new_totalprice
		num = order.num
		if order.is_qrwxpay:
			num = num + 'a'
		transaction_id = order.transaction_id
		customer_id = order.customer_id
		totalPrice  = order.new_totalprice
		# print(transaction_id)
		if action == 'wx':
			wx_price = int(100 * totalPrice)
			refund_pub = Refund_pub()
			refund_pub.setParameter("out_trade_no",num)
			refund_pub.setParameter("out_refund_no",transaction_id)
			refund_pub.setParameter("total_fee",wx_price)
			refund_pub.setParameter('refund_fee',wx_price)
			refund_pub.setParameter('op_user_id','1223121101')
			res = refund_pub.postXmlSSL()
			# print(res)
			if isinstance(res,bytes):
				res    = res.decode('utf-8')
			else:
				print("[weixin Refund_pub] encoding error")
			#print('decode success')
			res_dict = refund_pub.xmlToArray(res)
			#print(res_dict)
			return_code = res_dict.get('result_code',None)
			err_code_des = res_dict.get('err_code_des',None)
			print('refund',return_code)
			if return_code == 'SUCCESS' or return_code == 'success':
				#如果退款成功，则将这笔在线支付记录类型置为-1,同时将店铺余额减去订单总额
				balance_history = self.session.query(models.BalanceHistory).filter_by(transaction_id=transaction_id).first()
				if not balance_history:
					return self.send_fail('余额记录没有找到')
				shop_id = balance_history.shop_id
				balance_value = balance_history.balance_value
				shop = self.session.query(models.Shop).filter_by(id=shop_id).first()
				if not shop:
					return self.send_fail("shop not found")
				order.get_num(self.session,order.id)  #取消订单,库存增加，在售减少
				order.del_reason = 'refund'
				order.status = 0  #将订单标志为已删除  
				#该店铺余额减去订单总额
				shop.shop_balance -= balance_value
				balance_history.is_cancel = 1
				#将这条余额记录作废
				balance_history.balance_type = -1
				customer_id = balance_history.customer_id
				name        = balance_history.name
				shop_province = balance_history.shop_province
				shop_name     = balance_history.shop_name
				balance_record = balance_history.balance_record + '--退款'
				create_time   = datetime.datetime.now()
				shop_totalPrice = shop.shop_balance
				customer_totalPrice = balance_history.customer_totalPrice
				transaction_id   = balance_history.transaction_id
				available_balance = balance_history.available_balance
				#同时生成一条退款记录
				refund_history = models.BalanceHistory(customer_id=customer_id,shop_id=shop_id,shop_province=shop_province,shop_name=shop_name,name=name,
					balance_record=balance_record,create_time=create_time,shop_totalPrice=shop_totalPrice,customer_totalPrice=customer_totalPrice,
					transaction_id=transaction_id,balance_type=8,balance_value=balance_value)
				self.session.add(refund_history)
				self.session.flush()
				# 9.15 woody 
				# 生成一条微信退款记录
				apply_refund = models.ApplyRefund(customer_id=customer_id,order_id=order_id,refund_type=0,refund_fee=totalPrice,
					transaction_id=transaction_id,order_num=num)
				self.session.add(apply_refund)
				self.session.commit()
				return self.send_success()
			else:
				return self.send_fail(err_code_des)
		elif action == 'alipay':
			now = datetime.datetime.now()
			refund_date = now.strftime('%Y-%m-%d %H:%M:%S')
			batch_no = now.strftime("%Y%m%d") + num
			detail_data = transaction_id +'^' + format(totalPrice,'.2f') + '^协商退款'  
			# notify_url = 'http://i.senguo.cc/customer/online/refundcallback'
			refund_url = self._alipay.create_refund_url(partner=ALIPAY_PID,_input_charset='utf-8',
				refund_date=refund_date,seller_user_id=ALIPAY_PID,batch_no=batch_no,batch_num='1',detail_data=detail_data)
			# print(refund_url,'refund_url')
			#################################################################################
			# 9.15 woody
			# 生成一条支付宝退款申请记录
			# 支付宝退款需要后台手动处理，然后确认，微信退款只需要确认
			#################################################################################
			apply_refund = models.ApplyRefund(customer_id=customer_id,order_id=order_id,refund_type=1,refund_fee=totalPrice,
				refund_url=refund_url,transaction_id=transaction_id,order_num=num)
			self.session.add(apply_refund)
			self.session.commit()
			return self.send_success()
		elif action == 'wx_refund_query':
			refund_query = RefundQuery_pub()
			refund_query.setParameter("transaction_id",transaction_id)
			res = refund_query.postXml()
			print(res)
			if isinstance(res,bytes):
				res = res.decode('utf-8')
			res_dict = refund_query.xmlToArray(res)
			return_code = res_dict.get("return_code",None)
			if return_code == 'SUCCESS':
				print('query success')
			else:
				print('query fail')
			return self.send_success()
		elif action == 'downbill':
			print(bill_date,'bill_date')
			downbill = DownloadBill_pub()
			downbill.setParameter('bill_date',bill_date)
			res = downbill.postXml()
			if isinstance(res,bytes):
				res = res.decode('utf-8')
			print(type(res))
			#将BOM头去掉
			# if res.startswith(u'\ufeff'):
			# 	res = res.encode('utf8')[3:].decode('utf8') 
			# import json
			# res_dict = json.loads(res)
			# return_code = res_dict['success']
			# data = res_dict[0][0]
			# print('return_code',return_code,data)
			f = open('20150920.txt','w')
			f.write(res)
			f.close()
			return self.send_success(data=res)	
		elif action == 'alipay_query':
			start_time = '2015-09-20 00:00:00'
			end_time   = '2015-09-20 23:59:59'
			query_url = self._alipay.create_query_url(gmt_start_time=start_time,gmt_end_time=end_time,page_no=1)
			print(query_url,'query_url')
			return self.send_success()
		else:
			return self.send_fail('action error')


class OnlineWxPay(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments('code?:str','order_id?:str')
	def get(self):
		order_id = self.get_cookie("order_id")
		order = self.session.query(models.Order).filter_by(id = order_id).first()
		# print("[WeixinPay]Start Pay order.num:",order.num)
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
		shop_phone = shop.shop_phone
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
			qr_url = self._qrwxpay(shop_name)
			# print("[WeixinPay]qr_url:",qr_url)
			return self.render('customer/online-qrwxpay.html',qr_url = qr_url,totalPrice = totalPrice,\
			shop_name = shop_name,create_date=create_date,receiver=receiver,phone=phone,address=address,\
			send_time = send_time,remark=remark,pay_type=pay_type,online_type=online_type,freight = freight,\
			goods = goods,sender_phone=sender_phone,sender_img=sender_img,charge_types=charge_types,\
			order=order,shop_code=shop_code,shop_phone = shop_phone)

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
			shop_name = re.compile(u'[\U00010000-\U0010ffff]').sub(u'',shop_name)
			unifiedOrder.setParameter("body",shop_name + '-订单号-'+str(order_num))
			url = APP_OAUTH_CALLBACK_URL + '/customer/onlinewxpay'
			unifiedOrder.setParameter("notify_url",url)
			unifiedOrder.setParameter("openid",openid)
			unifiedOrder.setParameter("out_trade_no",order_num)
			# orderPriceSplite = (order.price) * 100
			wxPrice =int(totalPrice * 100)
			# print("[WeixinPay]wxPrice:",wxPrice)
			unifiedOrder.setParameter('total_fee',wxPrice)
			unifiedOrder.setParameter('trade_type',"JSAPI")
			prepay_id = unifiedOrder.getPrepayId()
			# print("[WeixinPay]prepay_id:",prepay_id)
			if not prepay_id:
				return self.send_fail("微信支付失败，请稍后再试！")
			jsApi.setPrepayId(prepay_id)
			renderPayParams = jsApi.getParameters()
			# print("[WeixinPay]renderPayParams:",renderPayParams)
			noncestr = "".join(random.sample('zyxwvutsrqponmlkjihgfedcba0123456789', 10))
			timestamp = datetime.datetime.now().timestamp()
			wxappid = 'wx0ed17cdc9020a96e'
			signature = self.signature(noncestr,timestamp,path_url)

			qr_url = self._qrwxpay(shop_name)
		return self.render("fruitzone/paywx.html",qr_url = qr_url ,renderPayParams = renderPayParams,wxappid = wxappid,\
			noncestr = noncestr ,timestamp = timestamp,signature = signature,totalPrice = totalPrice,\
			shop_name = shop_name,create_date=create_date,receiver=receiver,phone=phone,address=address,\
			send_time = send_time,remark=remark,pay_type=pay_type,online_type=online_type,freight = freight,\
			goods = goods,sender_phone=sender_phone,sender_img=sender_img,charge_types=charge_types,\
			order=order,shop_code = shop_code,shop_phone = shop_phone)

	def check_xsrf_cookie(self):
		print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!wxpay xsrf pass!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		pass
		return

	def _qrwxpay(self,shop_name):
		import chardet
		order_id = self.get_cookie("order_id")
		order = self.session.query(models.Order).filter_by(id = order_id).first()
		if not order:
			return self.send_fail('order not found')
		order.is_qrwxpay = 1 #表示该订单为扫码支付
		order_num = order.num
		totalPrice = order.new_totalprice
		self.session.commit()
		# print("[WeixinQrPay]totalPrice:",totalPrice)
		# shop_name = re.compile(u'[\U00010000-\U0010ffff]').sub(u'',shop_name)
		wxPrice =int(totalPrice * 100)
		url = APP_OAUTH_CALLBACK_URL + '/customer/onlinewxpay'
		unifiedOrder =  UnifiedOrder_pub()
		unifiedOrder.setParameter("body",'Order No. '+str(order_num))
		unifiedOrder.setParameter("notify_url",url)
		unifiedOrder.setParameter("out_trade_no",str(order.num)+'a')
		unifiedOrder.setParameter('total_fee',wxPrice)
		unifiedOrder.setParameter('trade_type',"NATIVE")
		res = unifiedOrder.postXml()
		# print(res)
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
			print("[WeixinPay]handle WeixinPay Callback!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
			data = self.request.body
			# print("[WeixinPay]request.body:",self.request.body)
			xml = data.decode('utf-8')
			UnifiedOrder = UnifiedOrder_pub()
			xmlArray     = UnifiedOrder.xmlToArray(xml)
			status       = xmlArray['result_code']
			total_fee    = float(int(xmlArray['total_fee'])/100)
			order_num    = str(xmlArray['out_trade_no'])
			order_num    = order_num.split('a')[0]
			print("[WeixinPay]Callback order_num:",order_num)

			# result       = orderId.split('a')
			# customer_id  = int(result[0])
			# shop_id      = int(result[1])
			# totalPrice   = (float(result[2]))/100
			transaction_id = str(xmlArray['transaction_id'])

			if status != 'SUCCESS':
				return False

			order = self.session.query(models.Order).filter_by(num = order_num).first()
			if not order:
				# return self.send_fail('order not found')
				#如果没找到订单，也要生成一条余额记录
				#因为customer_id和shop_id 是外键，不能为空，所以给它们赋一个特定的值
				balance_history = models.BalanceHistory(customer_id=0,shop_id=0,balance_value=total_fee,balance_record='在线支付(微信)异常：空订单'+order_num,
					balance_type=3,transaction_id = transaction_id)
				self.session.add(balance_history)
				self.session.commit()
				print("[WeixinPay]No This Order!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
				return self.write('success')

			customer_id = order.customer_id
			shop_id     = order.shop_id
			totalPrice  = order.new_totalprice

			create_date = order.create_date.timestamp()
			now         = datetime.datetime.now().timestamp()
			time_difference = now - create_date
			if time_difference > 60 * 60 * 24 * 7:
				balance_history = models.BalanceHistory(customer_id = customer_id,shop_id = shop_id,balance_value=totalPrice,
					balance_record='在线支付(微信)异常：一星期以前的订单，很可能是线下测试回调到线上的',balance_type=3,transaction_id=transaction_id)
				self.session.add(balance_history)
				self.session.commit()
				print("[WeixinPay]Order Time Wrong!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
				return self.write('success')

			order.status = 1  #修改订单状态
			order.transaction_id = transaction_id 
			self.session.flush()
			print("[WeixinPay]Callback order_num:",order_num,"change order.status to:",order.status)

			# 修改店铺总余额
			# shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
			# if not shop:
			# 	return self.send_fail('shop not found')
			shop = order.shop
			shop.shop_balance += totalPrice
			self.session.flush()

			#判断是否已经回调过，如果记录在表中，则不执行接下来操作
			old_balance_history=self.session.query(models.BalanceHistory).filter_by(transaction_id=transaction_id).first()
			if old_balance_history:
				return self.write('success')
			customer = self.session.query(models.Customer).filter_by(id = customer_id).first()
			if customer:
				name = customer.accountinfo.nickname
			else:
				name = None
			shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = customer_id,\
				shop_id = shop_id).first()
			if not shop_follow:
				# return self.send_fail('shop_follow not found')
				#没有关注店铺也要生成余额记录
				balance_history = models.BalanceHistory(customer_id=customer_id,shop_id=shop_id,balance_value=totalPrice,
					balance_record='在线支付(微信)异常：用户未关注，订单'+ order.num,name = name,balance_type=3,shop_totalPrice=shop.shop_balance,
					transaction_id=transaction_id,shop_province=shop.shop_province,shop_name=shop.shop_name)
				self.session.add(balance_history)
				self.session.commit()
				print("[WeixinPay]No CustomerShopFollow!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
			# print("[WeixinPay]shop_balance:",shop.shop_balance)
			else:	
				balance_history = models.BalanceHistory(customer_id =customer_id ,shop_id = shop_id,\
					balance_value = totalPrice,balance_record = '在线支付(微信)：订单'+ order.num, name = name , balance_type = 3,\
					shop_totalPrice = shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,transaction_id=transaction_id,
					shop_province=shop.shop_province,shop_name=shop.shop_name)
				self.session.add(balance_history)
				self.session.flush()
				# print("[WeixinPay]balance_history:",balance_history)

				#在线支付完成，CustomerSeckillGoods表对应的状态变为2,SeckillGoods表也做相应变化
				fruits = eval(order.fruits)
				charge_type_list = list(fruits.keys())
				seckill_goods = self.session.query(models.SeckillGoods).filter(models.SeckillGoods.seckill_charge_type_id.in_(charge_type_list)).with_lockmode('update').all()
				if seckill_goods:
					seckill_goods_id = []
					for item in seckill_goods:
						seckill_goods_id.append(item.id)
					customer_seckill_goods = self.session.query(models.CustomerSeckillGoods).filter(models.CustomerSeckillGoods.shop_id == order.shop_id,models.CustomerSeckillGoods.customer_id == order.customer_id,\
										models.CustomerSeckillGoods.seckill_goods_id.in_(seckill_goods_id)).with_lockmode('update').all()
					if customer_seckill_goods:
						for item in customer_seckill_goods:
							item.status = 2
						self.session.flush()
					for item in seckill_goods:
						item.storage_piece -= 1
						item.ordered += 1
					self.session.flush()
				self.session.commit()
				print("[WeixinPay]handle WeixinPay Callback SUCCESS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
			# 发送订单模版消息给管理员/自动打印订单
			if shop.admin.mp_name and shop.admin.mp_appid and shop.admin.mp_appsecret and shop.admin.has_mp:
				# print("[CustomerCart]cart_callback: shop.admin.mp_appsecret:",shop.admin.mp_appsecret,shop.admin.mp_appid)
				access_token = self.get_other_accessToken(self.session,shop.admin.id)
				# print(shop.admin.mp_name,shop.admin.mp_appid,shop.admin.mp_appsecret,access_token)
			else:
				access_token = None
			self.send_admin_message(self.session,order,access_token)

			return self.write('success')

class wxpayCallBack(CustomerBaseHandler):
	def get(self):
		print("Shoudn't get into this!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		order_id = self.get_cookie("order_id")
		order = self.session.query(models.Order).filter_by(id = order_id).first()
		if not order:
			return self.send_fail('order not found')
		totalPrice = order.new_totalprice
		wxPrice =int(totalPrice * 100)
		url = APP_OAUTH_CALLBACK_URL + '/customer/onlinewxpay'
		unifiedOrder =  UnifiedOrder_pub()
		unifiedOrder.setParameter("body",str(order_num))
		unifiedOrder.setParameter("notify_url",url)
		unifiedOrder.setParameter("out_trade_no",str(order.num))
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
			# print("[AliPay]Start Pay order.num:",order.num)
			if not order:
				return self.send_fail('order not found')
			totalPrice = order.new_totalprice
			alipayUrl =  self.handle_onAlipay(order.num,order.shop.shop_name)
			self.order_num = order.num
			# print("[AliPay]alipayUrl:",alipayUrl)
			# print("[AliPay]order_num:",self.order_num)

			charge_types = self.session.query(models.ChargeType).filter(models.ChargeType.id.in_(eval(order.fruits).keys())).all()
			# mcharge_types = self.session.query(models.MChargeType).filter(models.MChargeType.id.in_(eval(order.mgoods).keys())).all()

			shop_id   = order.shop_id
			shopName  = order.shop.shop_name
			shop_code = order.shop.shop_code
			shop_phone = order.shop.shop_phone
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
				charge_types,shop_code = shop_code,shop_phone = shop_phone)
		else:
			return self.send_fail('404')
	# @tornado.web.authenticated
	def post(self):
		if self._action == 'AliNotify':
			return self.handle_onAlipay_notify()
		#if not self.current_user:
		#	return self.send_error(403)
		if self._action == "AliPay":
			return self.handle_onAlipay(order_num,shop_name)
		else:
			return self.send_error(404)

	# @CustomerBaseHandler.check_arguments("order_id:str","price?:float")
	def handle_onAlipay(self,order_num,shop_name):
		#print("[AliPay]login handle_onAlipay")
		#order_num = self.order_num if self.order_num else 'NULL'
		#print("[_onAliPay]order_num:",order_num)
		#order = models.Order.get_by_id(self.session,int(self.args['order_id']))
		order = self.session.query(models.Order).filter_by(num = str(order_num)).first()
		if not order:
			print("[AliPay]order not found")
			return self.send_fail(error_text="抱歉，此订单不存在")
		#跳转到支付页
		order_id = order.id
		price    = order.new_totalprice

		try:
			url = self.create_alipay_url(price,order_num,shop_name)
		except Exception as e:
			return self.send_fail(error_text = '系统繁忙，请稍后再试')
		# return self.redirect(url)
		#print("[AliPay]redirect url:",url)
		return url

	_alipay = WapAlipay(pid=ALIPAY_PID, key=ALIPAY_KEY, seller_email=ALIPAY_SELLER_ACCOUNT)

	def create_alipay_url(self,price,order_num,shop_name):
		#print("[AliPay]login create_alipay_url:",price,order_num)
		shop_name = re.compile(u'[\U00010000-\U0010ffff]').sub(u'',shop_name)
		authed_url = self._alipay.create_direct_pay_by_user_url(
			out_trade_no = str(order_num),
			subject      = shop_name + '-订单号：' + str(order_num),
			total_fee    = float(price),
			#defaultbank  = CMB,
			seller_account_name = ALIPAY_SELLER_ACCOUNT,
			call_back_url = "%s%s"%(ALIPAY_HANDLE_HOST,self.reverse_url("noticeSuccess")),
			notify_url="%s%s"%(ALIPAY_HANDLE_HOST, self.reverse_url("onlineAliNotify")),
			)
		#print("[AliPay]authed_url:",authed_url)
		return authed_url

	def check_xsrf_cookie(self):
		if self._action == 'onlineAliNotify':
			return True
		return super().check_xsrf_cookie()

	@CustomerBaseHandler.check_arguments("service","v","sec_id","sign","notify_data")
	def handle_onAlipay_notify(self):
		print("[AliPay]handle_onAlipay_notify!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		sign = self.args.pop('sign')
		signmethod = self._alipay.getSignMethod(**self.args)
		# print("[AliPay]Callback success")
		if signmethod(self.args) != sign:
			return self.send_error(403)
		# print("[AliPay]Callback data:",self.args['notify_data'])
		notify_data = xmltodict.parse(self.args['notify_data'])['notify']
		order_num = notify_data["out_trade_no"]
		print("[AliPay]Callback order_num:",order_num)
		ali_trade_no=notify_data["trade_no"]
		total_fee  = float(notify_data["total_fee"])
		# print("[AliPay]ali_trade_no:",ali_trade_no)
		old_balance_history = self.session.query(models.BalanceHistory).filter_by(transaction_id = ali_trade_no).first()
		if old_balance_history:
			return self.send_success()
		order = self.session.query(models.Order).filter_by(num = str(order_num)).first()
		# order = models.Order.get_by_id(self.session,orderId)
		if not order:
			# return self.send_fail(error_text = '抱歉，此订单不存在！')
			balance_history = models.BalanceHistory(customer_id=0,shop_id=0,balance_value=total_fee,balance_record='在线支付(支付宝)异常：空订单'+order_num,
				balance_type=3,transaction_id = ali_trade_no)
			self.session.add(balance_history)
			self.session.commit()
			print("[AliPay]No This Order!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
			return self.write('success')
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

		create_date = order.create_date.timestamp()
		now         = datetime.datetime.now().timestamp()
		time_difference = now - create_date
		if time_difference > 60 * 60 * 24 * 7:
			balance_history = models.BalanceHistory(customer_id = customer_id,shop_id = shop_id,balance_value=totalPrice,
				balance_record='在线支付(支付宝)异常：一星期以前的订单，很可能是线下测试回调到线上的',balance_type=3,transaction_id=transaction_id)
			self.session.add(balance_history)
			self.session.commit()
			print("[AliPay]Order Time Wrong!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
			return self.write('success')

		order.status = 1  #修改订单状态
		order.transaction_id = ali_trade_no
		print("[AliPay]Callback order.num:",order.num,"change order.status to:",order.status)

		# 修改店铺总余额
		# shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
		# if not shop:
		# 	return self.send_fail('shop not found')
		shop = order.shop
		shop.shop_balance += totalPrice
		self.session.flush()
		# print("[AliPay]shop_balance:",shop.shop_balance)
		customer = self.session.query(models.Customer).filter_by(id = customer_id).first()
		if customer:
			name = customer.accountinfo.nickname
		else:
			# return self.send_fail('customer not found')
			name = None

		shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = customer_id,\
			shop_id = shop_id).first()
		if not shop_follow:
			balance_history = models.BalanceHistory(customer_id =customer_id ,shop_id = shop_id,
				balance_value = totalPrice,balance_record = '在线支付(支付宝)异常：用户未关注，订单'+ order.num, name = name , balance_type = 3,
				shop_totalPrice = shop.shop_balance,customer_totalPrice = 0,transaction_id=ali_trade_no,
				shop_province = shop.shop_province,shop_name=shop.shop_name)
			self.session.add(balance_history)
			# print("[AliPay]balance_history:",balance_history)
			self.session.commit()
			print("[AliPay]No CustomerShopFollow!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		else:
			# 支付成功后  生成一条余额支付记录
			balance_history = models.BalanceHistory(customer_id =customer_id ,shop_id = shop_id,
				balance_value = totalPrice,balance_record = '在线支付(支付宝)：订单'+ order.num, name = name , balance_type = 3,
				shop_totalPrice = shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,transaction_id= ali_trade_no,
				shop_province = shop.shop_province,shop_name=shop.shop_name)
			self.session.add(balance_history)
			# print("[AliPay]balance_history:",balance_history)
			self.session.commit()
			print("[AliPay]handle_onAlipay_notify SUCCESS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

		# 发送订单模版消息给管理员/自动打印订单
		if shop.admin.mp_name and shop.admin.mp_appid and shop.admin.mp_appsecret and shop.admin.has_mp:
			# print("[CustomerCart]cart_callback: shop.admin.mp_appsecret:",shop.admin.mp_appsecret,shop.admin.mp_appid)
			access_token = self.get_other_accessToken(self.session,shop.admin.id)
			# print(shop.admin.mp_name,shop.admin.mp_appid,shop.admin.mp_appsecret,access_token)
		else:
			access_token = None
		self.send_admin_message(self.session,order,access_token)
		return self.write('success')

	@CustomerBaseHandler.check_arguments("sign","result","out_trade_no","trade_no","request_token")
	def handle_onAlipay_callback(self):
		print("[AliPay]handle_onAlipay_callback!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		sign = self.args.pop("sign")
		signmethod = self._alipay.getSignMethod()
		if signmethod(self.args) != sign:
			print("[AliPay]sign from onlineAlipay error")
			return self.send_error(403)
		order_num=str(self.args["out_trade_no"])
		ali_trade_no=self.args["trade_no"]
		old_balance_history = self.session.query(models.BalanceHistory).filter_by(transaction_id = ali_trade_no).first()
		if old_balance_history:
			return self.redirect(self.reverse_url("customerRecharge"))
		# order = models.Order.get_by_id(self.session,orderId)
		order = self.session.query(models.Order).filter_by(num = str(order_num)).first()
		if not order:
			# return self.send_fail(error_text = '抱歉，此订单不存在！')
			balance_history = models.BalanceHistory(customer_id=0,shop_id=0,balance_value=0,balance_record='在线支付(支付宝)异常：空订单'+order_num,
				balance_type=3,transaction_id = ali_trade_no)
			self.session.add(balance_history)
			self.session.commit()
			print("[AliPay]No This Order!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
			return self.write('success')
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

		create_date = order.create_date.timestamp()
		now         = datetime.datetime.now().timestamp()
		time_difference = now - create_date
		if time_difference > 60 * 60 * 24 * 7:
			balance_history = models.BalanceHistory(customer_id = customer_id,shop_id = shop_id,balance_value=totalPrice,
				balance_record='在线支付(支付宝)异常：一星期以前的订单，很可能是线下测试回调到线上的',balance_type=3,transaction_id=transaction_id)
			self.session.add(balance_history)
			self.session.commit()
			print("[AliPay]Order Time Wrong!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
			return self.write('success')

		order.status = 1  #修改订单状态
		order.transaction_id = ali_trade_no
		print("[AliPay]Callback order.num:",order.num,"change order.status to:",order.status)

		# 修改店铺总余额
		# shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
		# if not shop:
		# 	return self.send_fail('shop not found')
		shop = order.shop
		shop.shop_balance += totalPrice
		self.session.flush()
		# print("[AliPay]shop_balance:",shop.shop_balance)

		customer = self.session.query(models.Customer).filter_by(id = customer_id).first()
		if customer:
			name = customer.accountinfo.nickname
		else:
			name = None
		shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = customer_id,\
			shop_id = shop_id).first()
		if not shop_follow:
			balance_history = models.BalanceHistory(customer_id =customer_id ,shop_id = shop_id,
				balance_value = totalPrice,balance_record = '在线支付(支付宝)异常：用户未关注，订单'+ order.num, name = name , balance_type = 3,
				shop_totalPrice = shop.shop_balance,customer_totalPrice = 0,transaction_id=ali_trade_no,
				shop_province = shop.shop_province,shop_name=shop.shop_name)
			self.session.add(balance_history)
			# print("[AliPay]balance_history:",balance_history)
			self.session.commit()
			print("[AliPay]No CustomerShopFollow!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		else:
			# 支付成功后  生成一条余额支付记录
			balance_history = models.BalanceHistory(customer_id =customer_id ,shop_id = shop_id,\
				balance_value = totalPrice,balance_record = '在线支付(支付宝)：订单'+ order.num, name = name , balance_type = 3,\
				shop_totalPrice = shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,transaction_id=ali_trade_no,
				shop_province = shop.shop_province,shop_name=shop.shop_name)
			self.session.add(balance_history)
			# print("[AliPay]balance_history:",balance_history)
			self.session.flush()
			print("handle_onAlipay_callback SUCCESS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

			#在线支付完成，CustomerSeckillGoods表对应的状态变为2,SeckillGoods表也做相应变化
			fruits = eval(order.fruits)
			charge_type_list = list(fruits.keys())
			seckill_goods = self.session.query(models.SeckillGoods).filter(models.SeckillGoods.seckill_charge_type_id.in_(charge_type_list)).with_lockmode('update').all()
			if seckill_goods:
				seckill_goods_id = []
				for item in seckill_goods:
					seckill_goods_id.append(item.id)
				customer_seckill_goods = self.session.query(models.CustomerSeckillGoods).filter(models.CustomerSeckillGoods.shop_id == order.shop_id,models.CustomerSeckillGoods.customer_id == order.customer_id,\
									models.CustomerSeckillGoods.seckill_goods_id.in_(seckill_goods_id)).with_lockmode('update').all()
				if customer_seckill_goods:
					for item in customer_seckill_goods:
						item.status = 2
					self.session.flush()
				for item in seckill_goods:
					item.storage_piece -= 1
					item.ordered += 1
				self.session.flush()
			self.session.commit()
			print("[AliPay]handle_onAlipay_callback SUCCESS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")


		# 发送订单模版消息给管理员/自动打印订单

		if shop.admin.mp_name and shop.admin.mp_appid and shop.admin.mp_appsecret and shop.admin.has_mp:
			# print("[CustomerCart]cart_callback: shop.admin.mp_appsecret:",shop.admin.mp_appsecret,shop.admin.mp_appid)
			access_token = self.get_other_accessToken(self.session,shop.admin.id)
			# print(shop.admin.mp_name,shop.admin.mp_appid,shop.admin.mp_appsecret,access_token)
		else:
			access_token = None
		self.send_admin_message(self.session,order,access_token)

		return self.redirect(self.reverse_url("noticeSuccess"))
