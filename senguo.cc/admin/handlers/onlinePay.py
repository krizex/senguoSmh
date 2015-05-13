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
	@CustomerBaseHandler.check_arguments('code?:str','totalPrice?')
	def get(self):
		print(self.request.full_url())
		path_url = self.request.full_url()
		return self.send_success()
		# totalPrice = self.args['totalPrice']

		jsApi  = JsApi_pub()
		#path = 'http://auth.senguo.cc/fruitzone/paytest'
		path = APP_OAUTH_CALLBACK_URL + self.reverse_url('fruitzonePayTest')
		print(path , 'redirect_uri is Ture?')
		print(self.args['code'],'sorry  i dont know')
		code = self.args.get('code',None)
		print(code,'how old are you',len(code))
		if len(code) is 2:
			url = jsApi.createOauthUrlForCode(path)
			print(url,'code?')
			return self.redirect(url)
		else:
			totalPrice =int((float(self.get_cookie('money')))*100)
			orderId = str(self.current_user.id) +'a'+str(self.get_cookie('market_shop_id'))+ 'a'+ str(totalPrice)+'a'+str(int(time.time()))
			print(orderId,'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
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
			unifiedOrder.setParameter("notify_url",'http://zone.senguo.cc/fruitzone/paytest')
			unifiedOrder.setParameter("openid",openid)
			unifiedOrder.setParameter("out_trade_no",orderId)
			#orderPriceSplite = (order.price) * 100
			wxPrice =int(totalPrice )
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
			totalPrice = float(totalPrice/100)
		
		# return self.send_success(renderPayParams = renderPayParams)
		return self.render("fruitzone/paytest.html",renderPayParams = renderPayParams,wxappid = wxappid,\
			noncestr = noncestr ,timestamp = timestamp,signature = signature,totalPrice = totalPrice)

	def check_xsrf_cookie(self):
		print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!wxpay xsrf pass!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		pass
		return


	@CustomerBaseHandler.check_arguments('totalPrice?:float','action?:str')
	def post(self):
			print(self.args,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')

		# 微信 余额 支付
	#	if action == 'wx_pay':
			print('回调成功')
			data = self.request.body
			print(self.request.body,'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')
			xml = data.decode('utf-8')
			UnifiedOrder = UnifiedOrder_pub()
			xmlArray     = UnifiedOrder.xmlToArray(xml)
			status       = xmlArray['result_code']
			orderId      = str(xmlArray['out_trade_no'])
			result       = orderId.split('a')
			customer_id  = int(result[0])
			shop_id      = int(result[1])
			totalPrice   = (float(result[2]))/100
			transaction_id = str(xmlArray['transaction_id'])
			if status != 'SUCCESS':
				return False
		#	shop_code  = self.current_shop.shop_code
		#	shop = self.session.query(models.Shop).filter_by(shop_code = shop_code).first()
		#	if not shop:
		#		return self.send_fail('shop not found')
			
			#shop_id = self.get_cookie('market_shop_id')
			#customer_id = self.current_user.id
			

		#	code = self.args['code']
		#	path_url = self.request.full_url()

			
			
			#totalPrice =float( self.get_cookie('money'))
			print(customer_id,shop_id,totalPrice)
			#########################################################
			# 用户余额增加 
			# 同时店铺余额相应增加 
			# 应放在 支付成功的回调里

			#########################################################

			# 支付成功后，用户对应店铺 余额 增1加
			#判断是否已经回调过，如果记录在表中，则不执行接下来操作
			old_balance_history=self.session.query(models.BalanceHistory).filter_by(transaction_id=transaction_id).first()
			if old_balance_history:
				return self.write('success')
			shop_follow = self.session.query(models.CustomerShopFollow).filter_by(customer_id = customer_id,\
				shop_id = shop_id).first()
			print(customer_id, shop_id,'没充到别家店铺去吧')
			if not shop_follow:
				return self.send_fail('shop_follow not found')
			shop_follow.shop_balance += totalPrice     #充值成功，余额增加，单位为元
			self.session.commit()

			shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
			if not shop:
				return self.send_fail('shop not found')
			shop.shop_balance += totalPrice
			self.session.commit()
			print(shop.shop_balance ,'充值后 商店 总额')

			# 支付成功后  生成一条余额支付记录
			customer = self.session.query(models.Customer).filter_by(id = customer_id).first()
			if customer:
				name = customer.accountinfo.nickname
			#name = self.current_user.accountinfo.nickname
			balance_history = models.BalanceHistory(customer_id =customer_id ,shop_id = shop_id,\
				balance_value = totalPrice,balance_record = '充值：用户 '+ name  , name = name , balance_type = 0,\
				shop_totalPrice = shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,transaction_id=transaction_id)
			self.session.add(balance_history)
			print(balance_history , '钱没有白充吧？！')
			self.session.commit()

			return self.write('success')
	#	else:
	#		return self.send_fail('其它支付方式尚未开发')


