from handlers.base import CustomerBaseHandler,WxOauth2
from handlers.wxpay import JsApi_pub, UnifiedOrder_pub, Notify_pub
import dal.models as models
import tornado.web
from settings import *
import datetime, time
from sqlalchemy import desc, and_, or_,func
import qiniu
import random
import base64
import json
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

		jsApi  = JsApi_pub()
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
		return self.render("fruitzone/paytest.html",renderPayParams = renderPayParams,wxappid = wxappid,\
			noncestr = noncestr ,timestamp = timestamp,signature = signature,totalPrice = totalPrice)

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
			
			# 修改店铺余额

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
				balance_value = totalPrice,balance_record = '微信在线支付：用户 '+ name  , name = name , balance_type = 3,\
				shop_totalPrice = shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,transaction_id=transaction_id)
			self.session.add(balance_history)
			print(balance_history , '钱没有白充吧？！')
			self.session.commit()
			return self.write('success')


