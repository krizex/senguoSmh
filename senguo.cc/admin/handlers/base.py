from libs.webbase import BaseHandler
import dal.models as models
from libs.utils import Logger
import json
import urllib
import hashlib
import traceback
from settings import KF_APPID, KF_APPSECRET, APP_OAUTH_CALLBACK_URL, MP_APPID, MP_APPSECRET, ROOT_HOST_NAME
from settings import QQ_APPID,QQ_APPKEY
import tornado.escape
from dal.dis_dict import dis_dict
import time
import tornado.web
from sqlalchemy import desc,or_,and_
from sqlalchemy.orm.exc import NoResultFound
import datetime
import qiniu
from settings import *
import requests
import math

import threading

from concurrent.futures import ThreadPoolExecutor
from functools import partial, wraps

import chardet
import random


# 非阻塞
EXECUTOR = ThreadPoolExecutor(max_workers=4)

def unblock(f):

	@tornado.web.asynchronous
	@wraps(f)
	def wrapper(*args, **kwargs):
		self = args[0]

		def callback(future):
			# pass
			self.finish()

		EXECUTOR.submit(
			partial(f, *args, **kwargs)
		).add_done_callback(
			lambda future: tornado.ioloop.IOLoop.instance().add_callback(
				partial(callback, future)))

	return wrapper

def get_unblock(f):

	@tornado.web.asynchronous
	@wraps(f)
	def wrapper(*args, **kwargs):
		self = args[0]

		def callback(future):
			pass
			# self.finish()

		EXECUTOR.submit(
			partial(f, *args, **kwargs)
		).add_done_callback(
			lambda future: tornado.ioloop.IOLoop.instance().add_callback(
				partial(callback, future)))

	return wrapper

# 定时器
class Pysettimer(threading.Thread):
	def __init__(self,function,args = None ,timeout = 1 ,is_loop = False):
		threading.Thread.__init__(self)
		self.event = threading.Event()
		self.function = function
		self.args  = args
		self.timeout = timeout
		self.is_loop = is_loop

	def run(self):
		while not self.event.is_set():
			self.event.wait(self.timeout)
			self.function(self.args)
			if not self.is_loop:
				self.event.set()
	def stop(self):
		self.event.set()

# 模版消息URL
order_url = 'http://i.senguo.cc/admin'
staff_order_url = 'http://i.senguo.cc/staff'

# 全局基类方法
class GlobalBaseHandler(BaseHandler):
	@property
	def session(self):
		if hasattr(self, "_session"):
			return self._session
		self._session = models.DBSession()
		return self._session

	def on_finish(self):
		# release db connection
		if hasattr(self, "_session"):
			self._session.close()

	def timestamp_to_str(self, timestamp):
		return time.strftime("%Y-%m-%d %H:%M", time.gmtime(timestamp))

	#通过两点经纬度计算距离
	def get_distance(self,lat1,lon1,lat2,lon2):
		EARTH_RADIUS = 6378.137
		radLat1 = lat1 * math.pi / 180.0
		radLat2 = lat2 * math.pi / 180.0
		a = radLat1 - radLat2
		b = lon1 * math.pi / 180.0 - lon2 * math.pi / 180.0
		s = 2 * math.asin(math.sqrt(math.pow(math.sin(a / 2), 2) + math.cos(radLat1) * math.cos(radLat2) * math.pow(math.sin(b / 2), 2)))
		s = s * EARTH_RADIUS
		s*= 1000
		return s;

	# 更新店铺、用户的优惠券
	def updatecouponbase(self,shop_id,customer_id):
		current_customer_id=customer_id
		now_date=int(time.time())
		q=self.session.query(models.CouponsCustomer).filter_by(shop_id=shop_id,customer_id=current_customer_id).with_lockmode('update').all()
		for x in q:
			qq=self.session.query(models.CouponsShop).filter_by(shop_id=shop_id,coupon_id=x.coupon_id,closed=0).with_lockmode('update').first()
			if  qq!=None:
				if now_date>qq.to_get_date:
					qq.closed=1
				if x.coupon_status>0:
					if now_date>x.uneffective_time:
						x.update(self.session,coupon_status=3)
				self.session.flush()
		self.session.commit()
		return None

	# 数字代号转换为文字描述
	def code_to_text(self, column_name, code):
		text = ""

		# 将服务区域的编码转换为文字显示
		if column_name == "service_area":
			if code & models.SHOP_SERVICE_AREA.HIGH_SCHOOL:
				text += "高校"
			if code & models.SHOP_SERVICE_AREA.COMMUNITY:
				text += "社区"
			if code & models.SHOP_SERVICE_AREA.TRADE_CIRCLE:
				text += "商圈"
			if code & models.SHOP_SERVICE_AREA.OTHERS:
				text += "其他"
			return text

		# 将商店审核状态编码转换为文字显示
		elif column_name == "shop_status":
			if code == models.SHOP_STATUS.APPLYING:
				text = "审核中"
			elif code == models.SHOP_STATUS.ACCEPTED:
				text = "审核通过"
			elif code == models.SHOP_STATUS.DECLINED:
				text = "拒绝申请"
			return text

		# 将城市编码转换为文字显示（可以由城市编码算出城市所在省份的编码）
		elif column_name == "shop_city":
			if code:
				text += dis_dict[int(code/10000)*10000]["name"]
				if "city" in dis_dict[int(code/10000)*10000].keys():
					text += " " + dis_dict[int(code/10000)*10000]["city"][code]["name"]
			else:
				text = ""
			return text

		elif column_name == "city":
			if code:
				if "city" in dis_dict[int(code/10000)*10000].keys():
					text = dis_dict[int(code/10000)*10000]["city"][code]["name"]
			else:
				text = ""
			return text

		elif column_name == "province":
			if code:
				text = dis_dict[int(code)]["name"]
			else:
				text = ""
			return text

		# 将订单状态编码转换为文字显示
		elif column_name == "order_status":
			text = ""
			if code == models.SYS_ORDER_STATUS.TEMP:
				text = "待支付"
			elif code == models.SYS_ORDER_STATUS.SUCCESS:
				text = "已支付"
			elif code == models.SYS_ORDER_STATUS.ABORTED:
				text = "已取消"
			else:
				text = "SYS_ORDER_STATUS: 此编码不存在"
			return text

		# add 6.10pm by jyj
		# 将时间戳转换为时间字符串
		elif column_name == "create_date_timestamp":
			text = ""
			import datetime
			import time
			ltime=time.localtime(int(code))
			timeStr=time.strftime("%Y-%m-%d %H:%M:%S", ltime)
			text = timeStr
			return text
		##
		# add by jyj 2015-6-15
		# 将实体店状态编码转换为文字显示
		elif column_name == "have_offline_entity":
			text = ""
			if code == 0:
				text = "没有实体店，水果o2o探索中"
			elif code == 1:
				text = "已有实体店，并在经营中"
			else:
				text = "没有卖过水果想尝试"
			return text
		##

	# 获取订单详情
	def get_order_detail(self,session,order_id):
		data = {}
		try:
			order = session.query(models.Order).filter_by(id = order_id).first()
		except NoResultFound:
			order = None

		goods = []
		f_d = eval(order.fruits)
		m_d = eval(order.mgoods)
		for f in f_d:
			goods.append([f_d[f].get('fruit_name'),f_d[f].get('charge'),f_d[f].get('num')])
		for m in m_d:
			goods.append([m_d[m].get('mgoods_name'), m_d[m].get('charge') ,m_d[m].get('num')])

		staff_id = order.SH2_id
		staff_info = session.query(models.Accountinfo).filter_by(id = staff_id).first()
		if staff_info is not None:
			sender_phone = staff_info.phone
			sender_img = staff_info.headimgurl_small
		else:
			sender_phone =None
			sender_img = None

		data['totalPrice']    = order.totalPrice
		data['charge_types']  = session.query(models.ChargeType).\
		filter(models.ChargeType.id.in_(eval(order.fruits).keys())).all()
		data['mcharge_types'] = session.query(models.MChargeType).\
		filter(models.MChargeType.id.in_(eval(order.mgoods).keys())).all()
		data['shop_name']     = order.shop.shop_name
		data['create_date']   = order.create_date
		data['receiver']      = order.receiver
		data['phone']         = order.phone
		data['address']       = order.address_text
		data['send_time']     = order.send_time
		data['remark']        = order.remark
		data['pay_type']      = order.pay_type
		data['online_type']   = order.online_type
		data['status']        = order.status
		data['freight']       = order.shop.config.freight_on_time if order.type == 2 else order.shop.config.freight_now
		data['goods']         = goods
		data['sender_phone']  = sender_phone
		data['sender_img']    = sender_img

		return data

	# 获取店铺信息
	def get_shopInfo(self,shop):
		data = {}
		data['shop_name']     = shop.shop_name
		data['shop_code']     = shop.shop_code
		data['shop_province'] = shop.shop_province
		data['shop_city']     = shop.shop_city
		data['shop_address_detail'] = shop.shop_address_detail
		data['shop_intro']    = shop.shop_intro
		data['shop_trademark_url']  = shop.shop_trademark_url
		data['shop_admin_name']= shop.admin.accountinfo.nickname
		data['order_count']   = shop.order_count
		data['shop_auth']     = shop.shop_auth
		data['shop_status']   = shop.shop_status
		data['auth_change']   = shop.auth_change
		data['status']        = shop.status

		return data

	# 将商品计价方式编码转换为计价方式文字显示
	def getUnit(self,unit):
		if unit == 1:
			name ='个'
		elif unit == 2 :
			name ='斤'
		elif unit == 3 :
			name ='份'
		elif unit == 4 :
			name ='kg'
		elif unit == 5 :
			name ='克'
		elif unit == 6 :
			name ='升'
		elif unit == 7 :
			name ='箱'
		elif unit == 8 :
			name ='盒'
		elif unit == 9 :
			name ='件'
		elif unit == 10 :
			name ='筐'
		elif unit == 11 :
			name ='包'
		else:
			name =''
		return name

	# 将森果社区文章类型编码转换为文字
	def article_type(self,_type):
		types=['官方公告','产品更新','运营干货','水果百科','使用教程','水果供求','森果前沿']
		return types[_type]

	# 获取商品信息
	def getGoodsData(self,datalist,_type):
		data = []
		shop_id = self.current_shop.id
		for d in datalist:
			add_time = d.add_time.strftime('%Y-%m-%d %H:%M:%S') if d.add_time else ''
			delete_time = d.delete_time.strftime('%Y-%m-%d %H:%M:%S') if d.delete_time else ''
			if d.img_url:
				img_url= d.img_url.split(";")
			else:
				img_url = ''
			intro = '' if not d.intro else d.intro
			detail_describe = '' if not d.detail_describe else d.detail_describe

			group_id = d.group_id
			if  group_id == 0:
				group_name = "默认分组"
			elif group_id == -1:
				group_name = "店铺推荐"
			else:
				try:
					group_name = self.session.query(models.GoodsGroup).filter_by(id=group_id,shop_id=shop_id,status=1).first().name
				except:
					group_name = None
				# print("[GlobalBaseHandler]getGoodsData, group_name:",group_name)

			charge_types = []
			for charge in d.charge_types:
				if charge.active !=0 :
					market_price ="" if charge.market_price == None else charge.market_price
					unit = int(charge.unit)
					unit_name = self.getUnit(unit)
					unit_num = int(charge.unit_num) if charge.unit_num else 0
					select_num = int(charge.select_num) if charge.select_num else 0
					charge_types.append({'id':charge.id,'price':charge.price,'unit':unit,'unit_name':unit_name,\
						'num':charge.num,'unit_num':unit_num,'market_price':market_price,'select_num':select_num})

			_unit = int(d.unit)
			_unit_name = self.getUnit(_unit)
			data.append({'id':d.id,'fruit_type_id':d.fruit_type_id,'name':d.name,'active':d.active,'current_saled':d.current_saled,\
				'saled':d.saled,'storage':d.storage,'unit':_unit,'unit_name':_unit_name,'tag':d.tag,'imgurl':img_url,'intro':intro,'priority':d.priority,\
				'limit_num':d.limit_num,'add_time':add_time,'delete_time':delete_time,'group_id':group_id,'group_name':group_name,\
				'detail_describe':detail_describe,'favour':d.favour,'charge_types':charge_types,'fruit_type_name':d.fruit_type.name,'code':d.fruit_type.code})
		if _type and _type=="one":
			data = data[0]
		# print([GlobalBaseHandler]getGoodsData, data:",data)
		return data

	# 获取森果社区文章
	def getArticle(self,article):
		great_if = False
		try:
			article_great=self.session.query(models.ArticleGreat).filter_by(article_id=article[0].id,account_id=self.current_user.id).one()
		except:
			article_great=None
		if article_great and article_great.great == 1:
			great_if=True
		data={"id":article[0].id,"title":article[0].title,"time":self.timedelta(article[0].create_time),\
			"type":self.article_type(article[0].classify),"nickname":article[1],"great_num":article[0].great_num,\
			"comment_num":article[0].comment_num,"great_if":great_if}
		return data

	# 获取森果社区文章评论
	def getArticleComment(self,new_comment):
		great_if = False
		comment_author = False
		try:
			comment_great=self.session.query(models.ArticleCommentGreat).filter_by(comment_id = new_comment[0].id,account_id = self.current_user.id).one()
		except:
			comment_great=None
		if comment_great:
			great_if=True
		if self.current_user and new_comment[0].account_id == self.current_user.id:
			comment_author = True
		data={"id":new_comment[0].id,"nickname":new_comment[0].accountinfo.nickname,"imgurl":new_comment[0].accountinfo.headimgurl_small,\
				"comment":new_comment[0].comment,"time":self.timedelta(new_comment[0].create_time),"great_num":new_comment[0].great_num,"nick_name":new_comment[1],
				"type":new_comment[0]._type,"great_if":great_if,"comment_author":comment_author}
		return data

class FrontBaseHandler(GlobalBaseHandler):
	pass

# 登录、账户等基类方法
class _AccountBaseHandler(GlobalBaseHandler):
	# overwrite this to specify which account is used
	__account_model__ = None
	__account_cookie_name__ = "customer_id"
	__login_url_name__ = ""
	__wexin_oauth_url_name__ = ""
	__wexin_check_url_name__ = ""

	_wx_oauth_pc = "https://open.weixin.qq.com/connect/qrconnect?appid={appid}&redirect_uri={redirect_uri}&response_type=code&scope=snsapi_login&state=ohfuck#wechat_redirect"
	_wx_oauth_weixin = "https://open.weixin.qq.com/connect/oauth2/authorize?appid={appid}&redirect_uri={redirect_uri}&response_type=code&scope=snsapi_userinfo&state=onfuckweixin#wechat_redirect"

	# 判断是否为微信浏览器
	def is_wexin_browser(self):
		if "User-Agent" in self.request.headers:
			ua = self.request.headers["User-Agent"]
		else:
			ua = ""
		return "MicroMessenger" in ua
	# 判断是否为PC浏览器
	def is_pc_browser(self):
		if "User-Agent" in self.request.headers:
			ua = self.request.headers["User-Agent"]
		else:
			ua = ""
		return not ("Mobile" in ua)

	def get_qq_oauth_link(self,next_url=""):
		client_id = QQ_APPID
		client_secret = QQ_APPKEY
		HOME_URL = 'http://zone.senguo.cc'
		print(APP_OAUTH_CALLBACK_URL,'APP_OAUTH_CALLBACK_URL')
		para_str = "?next="+tornado.escape.url_escape(next_url)
		print(para_str,'para_str')

		redirect_uri = tornado.escape.url_escape(
			HOME_URL + self.reverse_url('customerQOauth'))
		print(redirect_uri)
		url = "https://graph.qq.com/oauth2.0/authorize"
		url = url+"?grant_type=authorization_code&"+ \
		"response_type=code"+\
		"&client_id="+client_id+ \
		"&client_secret="+client_secret+ \
		"&redirect_uri="+redirect_uri+\
		"&state=test"
		print(url)
		return url

	def get_qq_login_url(self,next_url):
		if next_url is '':
			next_url = self.reverse_url('customerProfile')
		print('login get_qq_login_url',next_url)
		return self.get_qq_oauth_link(next_url = next_url)

	def get_wexin_oauth_link(self, next_url=""):
		if not self.__wexin_oauth_url_name__:
			raise Exception("you have to complete this wexin oauth config.")

		if next_url:
			para_str = "?next="+tornado.escape.url_escape(next_url)
		else:
			para_str = ""
		# print("[WxAuth]next_url:",next_url)

		if self.is_wexin_browser():
			if para_str: para_str += "&"
			else: para_str = "?"
			para_str += "mode=mp"
			redirect_uri = tornado.escape.url_escape(
				APP_OAUTH_CALLBACK_URL+\
				self.reverse_url(self.__wexin_oauth_url_name__) + para_str)
			link =  self._wx_oauth_weixin.format(appid=MP_APPID, redirect_uri=redirect_uri)
		else:
			if para_str: para_str += "&"
			else: para_str = "?"
			para_str += "mode=kf"
			redirect_uri = tornado.escape.url_escape(
				APP_OAUTH_CALLBACK_URL+\
				self.reverse_url(self.__wexin_oauth_url_name__) + para_str)
			link = self._wx_oauth_pc.format(appid=KF_APPID, redirect_uri=redirect_uri)
		# print("[WxAuth]Auth link:",link)
		return link

	def get_wexin_oauth_link2(self, next_url=""):
		if not self.__wexin_check_url_name__:
			raise Exception("you have to complete this wexin oauth config.")

		if next_url:
			para_str = "?next="+tornado.escape.url_escape(next_url)
		else:
			para_str = ""
		# print('[WxAuth]login in get_weixin_oauth_link2, next_url:',self,next_url)

		if self.is_wexin_browser():
			if para_str: para_str += "&"
			else: para_str = "?"
			para_str += "mode=mp"
			redirect_uri = tornado.escape.url_escape(
				APP_OAUTH_CALLBACK_URL+\
				self.reverse_url(self.__wexin_check_url_name__) + para_str)
			link =  self._wx_oauth_weixin.format(appid=MP_APPID, redirect_uri=redirect_uri)
		else:
			if para_str: para_str += "&"
			else: para_str = "?"
			para_str += "mode=kf"
			redirect_uri = tornado.escape.url_escape(
				APP_OAUTH_CALLBACK_URL+\
				self.reverse_url(self.__wexin_check_url_name__) + para_str)
			link = self._wx_oauth_pc.format(appid=KF_APPID, redirect_uri=redirect_uri)
		# print("[WxAuth]Auth link:",link)
		return link

	def get_login_url(self):
		#return self.get_wexin_oauth_link(next_url=self.request.full_url())
		return self.reverse_url('customerLogin')

	def get_weixin_login_url(self):
		# print("[WxAuth]Login URL:",self.request.full_url())
		# next_url =  self.reverse_url("fruitzoneShopList")
		next_url = self.get_cookie('next_url')
		if next_url is None:
			next_url = self.reverse_url('customerProfile')
		return self.get_wexin_oauth_link(next_url = next_url)

	# 获取当前用户
	def get_current_user(self):
		# print("[_AccountBaseHandler]self.__account_model__:",self.__account_model__,', self.__account_cookie_name__:',self.__account_cookie_name__)
		if not self.__account_model__ or not self.__account_cookie_name__:
			raise Exception("overwrite model to support authenticate.")

		if hasattr(self, "_user"):
			return self._user

		user_id = self.get_secure_cookie(self.__account_cookie_name__) or b'0'
		user_id = int(user_id.decode())
		# print("[_AccountBaseHandler]current user_id:",user_id)
		# print("[_AccountBaseHandler]type(self):",type(self))
		# print("[_AccountBaseHandler]self.__account_model__:",self.__account_model__)

		if not user_id:
			self._user = None
		else:
			# print("[_AccountBaseHandler]get_current_user: user_id: ",user_id)
			self._user = self.__account_model__.get_by_id(self.session, user_id)
			# print("[_AccountBaseHandler]get_current_user: self._user: ",self._user)
			# self._user   = self.session.query(models.Accountinfo).filter_by(id = user_id).first()
			if not self._user:
				print("[_AccountBaseHandler]get_current_user: self._user not found")
		return self._user

	_ARG_DEFAULT = []
	def set_current_user(self, user, domain=_ARG_DEFAULT):
		if not self.__account_model__ or not self.__account_cookie_name__:
			raise Exception("overwrite model to support authenticate.")
		if domain is _AccountBaseHandler._ARG_DEFAULT:
			self.set_secure_cookie(self.__account_cookie_name__, str(user.id))
		else:
			self.set_secure_cookie(self.__account_cookie_name__, str(user.id), domain=domain)
	def clear_current_user(self):
		if not self.__account_model__ or not self.__account_cookie_name__:
			raise Exception("overwrite model to support authenticate.")
		self.clear_cookie(self.__account_cookie_name__, domain=ROOT_HOST_NAME)

	def get_wx_userinfo(self, code, mode):
		return WxOauth2.get_userinfo(code, mode)

	def send_qiniu_token(self, action, id):
		q = qiniu.Auth(ACCESS_KEY, SECRET_KEY)

		token = q.upload_token(BUCKET_SHOP_IMG, expires = 60*30*100,

							  policy={"callbackUrl": "http://i.senguo.cc/fruitzone/imgcallback",
									  "callbackBody": "key=$(key)&action=%s&id=%s" % (action, id), "mimeLimit": "image/*"})
		# token = q.upload_token(BUCKET_SHOP_IMG,expires = 120)
		# print("[QiniuAuth]Send Token:",token)
		return self.send_success(token=token, key=action + ':' + str(time.time())+':'+str(id))

	# 编辑器获取七牛Token
	def get_editor_token(self, action, id):
		q = qiniu.Auth(ACCESS_KEY, SECRET_KEY)
		token = q.upload_token(BUCKET_SHOP_IMG, expires = 60*30*100,
							  policy={"returnUrl": "http://i.senguo.cc/admin/editorCallback",
									  "returnBody": "key=$(key)&action=%s&id=%s" % (action, id), "mimeLimit": "image/*"})
		# print("[QiniuAuth]Send Token:",token)
		return self.send_success(token=token, key=action + ':' + str(time.time())+':'+str(id))
	# 获取七牛Token
	def get_qiniu_token(self,action,id):
		q = qiniu.Auth(ACCESS_KEY,SECRET_KEY)
		token = q.upload_token(BUCKET_SHOP_IMG, expires = 60*30*100)
		# print("[QiniuAuth]Get Token:",token)
		return token

	# 获取评论
	def get_comments(self, shop_id, page=0, page_size=5, anonymous=True):
		comments_new = {}
		comments_result = []
		comments_array  = []
		comments_list =self.session.query(models.Order.comment, models.Order.comment_create_date, models.Order.num,\
			models.Order.comment_reply,models.Order.id,models.CommentApply.has_done,models.Accountinfo.headimgurl_small, \
			models.Accountinfo.nickname,models.CommentApply.delete_reason,\
			models.CommentApply.decline_reason,models.Order.comment_imgUrl,models.Order.commodity_quality,models.Order.send_speed,models.Order.shop_service).\
		outerjoin(models.CommentApply, models.Order.id == models.CommentApply.order_id).\
		join(models.Accountinfo,models.Order.customer_id == models.Accountinfo.id).\
		filter(models.Order.shop_id == shop_id, models.Order.status == 6).filter(or_(models.CommentApply.has_done !=1,models.CommentApply.has_done ==None )).\
		order_by(desc(models.Order.comment_create_date))
		comments_count = comments_list.count()-page*page_size
		comments = comments_list.offset(page*page_size).limit(page_size).all()
		for item in comments:
			# comments_new['comments']      = item[0]
			# comments_new['create_date']   = item[1]
			# comments_new['order_num']     = item[2]
			# comments_new['comment_reply'] = item[3]
			# comments_new['order_id']      = item[4]
			# comments_new['comment_has_done'] = item[5]
			# comments_new['headimgurl']    = item[6]
			if anonymous:
				if len(item[7]) == 0:
					comments_new['nickname'] = '***'
				else:
					comments_new['nickname'] = item[7][0]+'***'+item[7][-1]
			else:
				comments_new['nickname']  = item[7]
			# comments_new['delete_reason'] = item[8]
			# comments_new['decline_reason']= item[9]
			if item[10]:
				comments_new['comment_imgUrl'] = item[10].split(',')
			else:
				comments_new['comment_imgUrl'] = None
			# comments_new['commodity_quality'] = item[11]
			# comments_new['send_speed']        = item[12]
			# comments_new['shop_service']      = item[13]
			comments_new['index'] = comments_count
			# comments_result.append(comments_new)
			comments_array.append([item[0],item[1],item[2],item[3],item[4],item[5],item[6],comments_new['nickname'],item[8],item[9],\
				comments_new['comment_imgUrl'],item[11],item[12],item[13],comments_new['index']])
			comments_count = comments_count-1
		# print("[_AccountBaseHandler]comments_result:",comments_result)
		# return comments_result
		return comments_array

	# 根据当前时间返回经过的时间
	def timedelta(self, date):
		if not date:
			return "1年前"
		timedelta = datetime.datetime.now()-date
		if timedelta.days >= 365:
			return "%d年前" % (timedelta.days/365)
		elif timedelta.days >= 30:
			return "%d个月前" % (timedelta.days/30)
		elif timedelta.days > 0:
			return "%d天前" % timedelta.days
		elif timedelta.seconds >= 3600:
			return "%d小时前" % (timedelta.seconds/3600)
		elif timedelta.seconds >= 60:
			return "%d分钟前" % (timedelta.seconds/60)
		else:
			return "刚刚"

	def timeday(self,date):
		return date.strftime("%m-%d")

	def if_super(self):
		if_super = False
		try:
			current_user = self.session.query(models.SuperAdmin).filter_by(id=self.current_user.id).first()
		except:
			current_user = None
		if current_user:
			if_super = True
		return if_super

	def write_error(self, status_code, **kwargs):
		if status_code == 404:
			self.render('notice/404.html')
		elif status_code == 500:
			self.render('notice/500.html')
		elif status_code == 400:
			self.render('notice/400.html')
		else:
			super(GlobalBaseHandler, self).write_error(status_code, **kwargs)

	def monthdelta(self, date, delta):
		m, y = (date.month+delta) % 12, date.year + (date.month+delta-1) // 12
		if not m:
			m = 12
		d = [31, 29 if y % 4 == 0 and not y % 400 == 0 else 28,
			 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m-1]
		return date.replace(day=d, month=m, year=y)

	def signature(self, noncestr, timestamp, url):
		jsapi_ticket = WxOauth2.get_jsapi_ticket()
		string = "jsapi_ticket={jsapi_ticket}&noncestr={noncestr}&timestamp={timestamp}&url={url}".\
			format(jsapi_ticket=jsapi_ticket, noncestr=noncestr, timestamp=timestamp, url=url)

		h = hashlib.sha1(string.encode())
		return h.hexdigest()

	# 发送新订单模版消息给配送员, woody,6.17
	@classmethod
	def send_staff_message(self,session,order):
		# print('[TempMsg]login in send_staff_message')
		# print("[TempMsg]Send staff message to staff ID:",order.SH2_id)
		try:
			staff_info = session.query(models.Accountinfo).filter_by(id = order.SH2_id).first()
		except NoResultFound:
			return self.send_fail('[_AccountBaseHandler]send_staff_message: staff_info not found')
		openid = staff_info.wx_openid
		staff_name = staff_info.nickname
		order_id = order.num
		order_type = order.type
		create_date = order.create_date
		customer_name = order.receiver
		order_totalPrice = order.totalPrice
		send_time = order.send_time
		phone = order.phone
		address = order.address_text
		shop_name = order.shop.shop_name

		WxOauth2.post_staff_msg(openid,staff_name,shop_name,order_id,order_type,create_date,customer_name,\
			order_totalPrice,send_time,phone,address,)
		# print('[TempMsg]Send staff message SUCCESS')

	# 发送新订单模版消息给管理员 & 自动打印订单
	@classmethod
	def send_admin_message(self,session,order,other_access_token = None):
		access_token = other_access_token if other_access_token else None
		admin_name = order.shop.admin.accountinfo.nickname
		customer_id = order.customer_id
		admin_id    = order.shop.admin.id
		if order.shop.admin.has_mp:
			mp_customer = session.query(models.Mp_customer_link).filter_by(admin_id = admin_id ,customer_id = customer_id).first()
			if mp_customer:
				touser = mp_customer.wx_openid
			else:
				touser = order.shop.admin.accountinfo.wx_openid

		else:
			touser = order.shop.admin.accountinfo.wx_openid
		shop_id    = order.shop.id
		shop_name  = order.shop.shop_name
		order_id   = order.num
		order_type = order.type
		online_type= order.online_type
		pay_type   = order.pay_type
		phone      = order.phone
		totalPrice = order.totalPrice
		order_type = '立即送' if order_type == 1 else '按时达'
		create_date= order.create_date
		customer_name=order.receiver

		try:
			customer = session.query(models.Customer).filter_by(id = customer_id).first()
		except NoResultFound:
			return self.send_fail('customer not found')
		c_tourse   =customer.accountinfo.wx_openid
		goods = []
		f_d = eval(order.fruits)
		for f in f_d:
			goods.append([f_d[f].get('fruit_name'),f_d[f].get('charge'),f_d[f].get('num')])
		goods = str(goods)[1:-1]
		order_totalPrice = float('%.2f' % totalPrice)
		send_time = order.send_time
		address = order.address_text
		order_realid = order.id
		if order.shop.super_temp_active != 0:
			WxOauth2.post_order_msg(touser,admin_name,shop_name,order_id,order_type,create_date,customer_name,order_totalPrice,send_time,goods,
				phone,address,access_token)
		try:
			other_admin = session.query(models.HireLink).filter_by(shop_id = shop_id,active = 1, work = 9 , temp_active = 1).first()
		except NoResultFound:
			other_admin = None
		if other_admin:
			info = session.query(models.Accountinfo).join(models.ShopStaff,models.Accountinfo.id == models.ShopStaff.id).filter(models.ShopStaff.id
				== other_admin.staff_id).first()
			other_name = info.nickname
			other_customer_id = info.id
			if order.shop.admin.has_mp:
				mp_customer = session.query(models.Mp_customer_link).filter_by(admin_id=admin_id,customer_id = other_customer_id).first()
				if mp_customer:
					other_touser = mp_customer.wx_openid
				else:
					# print("[_AccountBaseHandle]send_admin_message: mp_customer not found")
					other_touser = info.wx_openid
			else:
				other_touser = info.wx_openid
			WxOauth2.post_order_msg(other_touser,other_name,shop_name,order_id,order_type,create_date,customer_name,order_totalPrice,
				send_time,goods,phone,address,access_token)
		WxOauth2.order_success_msg(c_tourse,shop_name,create_date,goods,order_totalPrice,order_realid,access_token)

		auto_print = order.shop.config.auto_print
		print_type = order.shop.config.receipt_type
		wireless_type = order.shop.config.wireless_type
		if auto_print == 1 and print_type == 1:
			if wireless_type == 0:
				_action = "ylyprint"
			elif wireless_type == 1:
				_action = "fyprint"
			self.autoPrint(session,order.id,order.shop,_action)

	# 发送订单完成模版消息给用户
	@classmethod
	def order_done_msg(self,session,order):
		# print('[TempMsg]login order_done_msg')
		order_num = order.num
		order_sendtime = order.arrival_day  + " " + order.arrival_time
		shop_phone = order.shop.shop_phone
		customer_id= order.customer_id
		shop_name = order.shop.shop_name
		order_id = order.id
		# print('[TempMsg]order_num:',order_num,', order_sendtime:',order_sendtime,', shop_phone:',shop_phone)
		try:
			customer_info = session.query(models.Accountinfo).filter_by(id = customer_id).first()
		except NoResultFound:
			return self.send_fail('[TempMsg]order_done_msg: customer not found')
		touser = customer_info.wx_openid
		WxOauth2.order_done_msg(touser,order_num,order_sendtime,shop_phone,shop_name,order_id)

	# 发送店铺认证状态更新模版消息给管理员
	@classmethod
	def shop_auth_msg(self,shop,success):
		touser = shop.admin.accountinfo.wx_openid
		shop_name = shop.shop_name
		WxOauth2.shop_auth_msg(touser,shop_name,success)

	# 发送订单取消模版消息给管理员
	@classmethod
	def order_cancel_msg(self,session,order,cancel_time,other_access_token = None):
		access_token = other_access_token if other_access_token else None
		touser = order.shop.admin.accountinfo.wx_openid
		order_num = order.num
		shop_name = order.shop.shop_name
		cancel_time = cancel_time
		WxOauth2.order_cancel_msg(touser,order_num,cancel_time,shop_name,access_token)
		concel_auto_print = order.shop.config.concel_auto_print
		print_type = order.shop.config.receipt_type
		wireless_type = order.shop.config.wireless_type
		if concel_auto_print == 1 and print_type == 1:
			if wireless_type == 0:
				_action = "ylyprint_concel"
			elif wireless_type == 1:
				_action = "fyprint_concel"
			self.autoPrint(session,order.id,order.shop,_action)

	# 无线打印订单
	@classmethod
	def autoPrint(self,session,order_id,current_shop,action):
		import hashlib
		import time
		import requests
		partner='1693' #用户ID
		apikey='664466347d04d1089a3d373ac3b6d985af65d78e' #API密钥
		username='senguo' #用户名
		timenow=str(int(time.time())) #当前时间戳
		order  = session.query(models.Order).filter_by(id=order_id).first()
		order_num = order.num
		order_time = order.create_date.strftime("%Y-%m-%d %H:%M")
		phone = order.phone
		receiver = order.receiver
		address = order.address_text
		send_time = order.send_time
		message = order.message
		fruits = eval(order.fruits)
		totalPrice = str(order.totalPrice)
		pay_type = order.pay_type
		receipt_msg = current_shop.config.receipt_msg
		if not receipt_msg:
			receipt_msg = ""
		if not message:
			message = "无"
		if pay_type == 1:
			_type = "货到付款"
		elif pay_type == 2:
			_type = "余额支付"
		elif pay_type == 3:
			_type = "在线支付"
		i=1
		fruit_list = []
		fruits = sorted(fruits.items(), key=lambda d:d[0])
		for key in fruits:
			fruit_list.append(str(i)+":"+key[1]["fruit_name"]+"  "+key[1]["charge"]+" * "+str(key[1]["num"])+"\r\n")
			i = i +1
		if action in ["ylyprint","ylyprint_concel"]:
			if action == "ylyprint":
				#打印内容
				content="@@2              订单信息\r\n"+\
						"------------------------------------------------\r\n"+\
						"订单编号："+order_num+"\r\n"+\
						"下单时间："+order_time+"\r\n"+\
						"顾客姓名："+receiver+"\r\n"+\
						"顾客电话："+phone+"\r\n"+\
						"配送时间："+send_time+"\r\n"+\
						"配送地址："+address+"\r\n"+\
						"买家留言："+message+"\r\n"+\
						"------------------------------------------------\r\n"+\
						"@@2             商品清单\r\n"+\
						"------------------------------------------------\r\n"+\
						''.join(fruit_list)+"\r\n"+\
						"\r\n"+\
						"总价："+totalPrice+"元\r\n"+\
						"支付方式："+_type+"\r\n"+\
						"------------------------------------------------\r\n"+\
						"\r\n"+receipt_msg+"\r\n"
			elif action == "ylyprint_concel":
				content="------------------------------------------------\r\n"+\
						"@@2 订单"+order_num+"已取消\r\n"+\
						"------------------------------------------------\r\n"
			machine_code=current_shop.config.wireless_print_num #打印机终端号 520
			mkey=current_shop.config.wireless_print_key #打印机密钥 110110
			if machine_code and mkey:
				sign=apikey+'machine_code'+machine_code+'partner'+partner+'time'+timenow+mkey #生成的签名加密
				sign=hashlib.md5(sign.encode("utf-8")).hexdigest().upper()
			else:
				print('[autoPrint]sign error')
				sign = None
			data={"partner":partner,"machine_code":machine_code,"content":content,"time":timenow,"sign":sign}
			r=requests.post("http://open.10ss.net:8888",data=data)

			# print("======WirelessPrint======")
			# print("res url        :",r.url)
			# print("res status_code:",r.status_code)
			# print("res text       :",r.text)
			# print("=========================")

		elif action in ["fyprint","fyprint_concel"]:
			reqTime = int(time.time()*1000)
			memberCode = 'e6f90e5826b011e5a1b652540008b6e6'
			API_KEY = '47519b0f'
			deviceNo = current_shop.config.wireless_print_num #'9602292847397158'
			mode = 2
			if action == "fyprint":
				#打印内容
				msgDetail = "        <Font# Bold=1 Width=2 Height=2>订单信息</Font#>\n"+\
							"-------------------------\n"+\
							"订单编号："+order_num+"\n"+\
							"下单时间："+order_time+"\n"+\
							"顾客姓名："+receiver+"\n"+\
							"顾客电话："+phone+"\n"+\
							"配送时间："+send_time+"\n"+\
							"配送地址："+address+"\n"+\
							"买家留言："+message+"\n"+\
							"-------------------------\n"+\
							"        <Font# Bold=1 Width=2 Height=2>商品清单</Font#>\n"+\
							"-------------------------\n"+\
							''.join(fruit_list)+"\r\n"+\
							"\n"+\
							"总价："+totalPrice+"元\n"+\
							"支付方式："+_type+"\n"+\
							"-------------------------\n"+\
							"\n"+receipt_msg+"\n"

			elif action == "fyprint_concel":
				msgDetail = "-------------------------\n"+\
							"<Font# Bold=1 Width=2 Height=2>订单"+order_num+"已取消</Font#>\n"+\
							"-------------------------\n"
			content = memberCode+msgDetail+deviceNo+str(reqTime)+API_KEY
			securityCode = hashlib.md5(content.encode('utf-8')).hexdigest()
			data={"reqTime":reqTime,"securityCode":securityCode,"memberCode":memberCode,"deviceNo":deviceNo,"mode":mode,"msgDetail":msgDetail}
			r=requests.post("http://my.feyin.net/api/sendMsg",data=data)
			# print(r.url)
			# print(r.status_code)
			# print(r.text)

	# 获取绑定的微信第三方服务号 Access Token
	@classmethod
	def get_other_accessToken(self,session,admin_id):
		now = datetime.datetime.now().timestamp()
		try:
			admin_info = self.session.query(models.ShopAdmin).filter_by(id = admin_id).first()
		except:
			return None
		if admin_info.mp_name and admin_info.mp_appid and admin_info.mp_appsecret:
			if admin_info.access_token and now - admin_info.token_creatime < 3600:
				print("[WxAuth]get_other_accessToken: access_token:",admin_info.access_token,", token_creatime:",admin_info.token_creatime)
				return admin_info.access_token
			else:
				appid = admin_info.mp_appid
				appsecret = admin_info.mp_appsecret
				client_access_token_url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential" \
									  "&appid={appid}&secret={appsecret}".format(appid=appid, appsecret=appsecret)
				data = json.loads(urllib.request.urlopen(client_access_token_url).read().decode("utf-8"))
				if "access_token" in data:
					admin_info.access_token = data['access_token']
					admin_info.token_creatime = now
					session.commit()
					print("[WxAuth]get_other_accessToken: access_token:",admin_info.access_token)
					return data['access_token']
				else:
					# print("[WxAuth]Token error")
					return None
		else:
			return None

	##############################################################################################
	# 订单完成后 ，积分 相应增加 ，店铺可提现余额相应增加
	# 同时生成相应的积分记录 和 余额记录
	# 若是余额 支付 会产生 额外的2分积分
	# 客户 对 平台 和 该店铺来说都变成 老客户
	##############################################################################################
	@classmethod
	def order_done(self,session,order):
		# print('[_AccountBaseHandler]login order_done')
		now = datetime.datetime.now()
		order.arrival_day = now.strftime("%Y-%m-%d")
		order.arrival_time= now.strftime("%H:%M")
		customer_id       = order.customer_id
		shop_id           = order.shop_id
		totalprice        = order.totalPrice

		self.order_done_msg(session,order)

		order.shop.is_balance = 1
		order.shop.order_count += 1  #店铺订单数加1

		#add by jyj 2015-6-15
		totalprice_inc = order.totalPrice
		order.shop.shop_property += totalprice_inc
		# print("[_AccountBaseHandler]order_done: order.shop.shop_property:",order.shop.shop_property)

		fruits = eval(order.fruits)
		if fruits:
			# print("[_AccountBaseHandler]order_done: fruits.keys():",fruits.keys())
			ss = session.query(models.Fruit, models.ChargeType).join(models.ChargeType)\
			.filter(models.ChargeType.id.in_(fruits.keys())).all()
			for s in ss:
				num = fruits[s[1].id]["num"]*s[1].unit_num*s[1].num
				s[0].current_saled -= num

		try:
			customer_info = session.query(models.Accountinfo).filter_by(id = customer_id).first()
		except NoResultFound:
			return self.send_fail('[_AccountBaseHandler]order_done: customer not found')
		customer_info.is_new = 1
		name = customer_info.nickname

		try:
			shop_follow = session.query(models.CustomerShopFollow).filter_by(customer_id = customer_id,shop_id = shop_id).first()
		except NoResultFound:
			return self.send_fail('[_AccountBaseHandler]order_done: shop_follow error')
		if shop_follow.shop_new == 0:
			shop_follow.shop_new = 1
		try:
			order_count = session.query(models.Order).filter_by(customer_id = customer_id,shop_id = shop_id).count()
		except:
			self.send_fail("[_AccountBaseHandler]order_done: find order by customer_id and shop_id error")
		#首单 积分 加5 ,woody
		if order_count==1:
			if shop_follow.shop_point == None:
				shop_follow.shop_point =0
			shop_follow.shop_point += 5
			# print(shop_follow.shop_point,'shop_follow.shop_point')
			try:
				point_history = models.PointHistory(customer_id = customer_id,shop_id = shop_id)
			except NoResultFound:
				self.send_fail("[_AccountBaseHandler]order_done: point_history error, First_order")
			if point_history:
				point_history.point_type = models.POINT_TYPE.FIRST_ORDER
				point_history.each_point = 5
				session.add(point_history)

		if order.pay_type == 2:    #余额 支付
			if shop_follow.shop_point == None:
				shop_follow.shop_point =0
			shop_follow.shop_point += 2
			# print("[_AccountBaseHandler]shop_follow.shop_point:",shop_follow.shop_point)
			try:
				point_history = models.PointHistory(customer_id = customer_id,shop_id = shop_id)
			except:
				self.send_fail("[_AccountBaseHandler]order_done: point_history error, PREPARE_PAY")
			if point_history:
				point_history.point_type = models.POINT_TYPE.PREPARE_PAY
				point_history.each_point = 2
				session.add(point_history)

			# 订单完成后，将相应店铺可提现 余额相应增加
			order.shop.available_balance += totalprice
			# print("[_AccountBaseHandler]order.shop.available_balance:",order.shop.available_balance)

			balance_history = models.BalanceHistory(customer_id = customer_id , shop_id = shop_id,balance_record = "可提现额度入账：订单"+order.num+"完成",
				name = name,balance_value = totalprice,shop_totalPrice=order.shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,
				available_balance=order.shop.available_balance,balance_type = 6,shop_province=order.shop.shop_province,shop_name=order.shop.shop_name)
			session.add(balance_history)

		if order.pay_type == 3:  #在线支付
			order.shop.available_balance += totalprice
			balance_history = models.BalanceHistory(customer_id = customer_id , shop_id = shop_id,balance_record = "可提现额度入账：订单"+order.num+"完成",
				name = name,balance_value = totalprice,shop_totalPrice=order.shop.shop_balance,customer_totalPrice = shop_follow.shop_balance,
				available_balance=order.shop.available_balance,balance_type = 7,shop_province=order.shop.shop_province,shop_name=order.shop.shop_name)
			session.add(balance_history)

		#增 与订单总额相等的积分
		if shop_follow.shop_point == None:
			shop_follow.shop_point = 0
			shop_follow.shop_point += totalprice
			session.flush()
			try:
				point_history = models.PointHistory(customer_id = customer_id,shop_id = shop_id)
			except:
				self.send_fail("[_AccountBaseHandler]order_done: point_history error, totalprice")
			if point_history:
				point_history.point_type = models.POINT_TYPE.TOTALPRICE
				point_history.each_point = totalprice
				session.add(point_history)
		session.commit()

	# woody 7.23
	# 生成是否关注微信公众号的二维码
	@classmethod
	def get_ticket_url(self):
		access_token = WxOauth2.get_client_access_token()
		# print("[_AccountBaseHandler]get_ticket_url: access_token:",access_token)
		scene_id = self.make_scene_id()
		# print("[_AccountBaseHandler]get_ticket_url: scene_id:",scene_id)
		url = 'https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token={0}'.format(access_token)
		data = {"action_name": "QR_SCENE", "action_info": {"scene": {"scene_id": scene_id}}}
		r = requests.post(url,data = json.dumps(data))
		result = json.loads(r.text)
		# print("[_AccountBaseHandler]get_ticket_url: result:",result)
		ticket_url = result.get('url',None)
		return ticket_url,scene_id

	def make_scene_id():
		session = models.DBSession()
		while True:
			scene_id = random.randint(1,2**20)
			scene_openid = session.query(models.Scene_Openid).filter_by(scene_id=scene_id).first()
			if not scene_openid:
				break
		return scene_id

# 超级管理员基类方法
class SuperBaseHandler(_AccountBaseHandler):
	__account_model__ = models.SuperAdmin
	__account_cookie_name__ = "super_id"
	__wexin_oauth_url_name__ = "superOauth"

	# 关闭店铺
	def shop_close(self):
		print("[Timer]Shop Close")
		session = models.DBSession()
		try:
			shops = session.query(models.Shop).filter_by(status = 1).all()
		except:
			shops = None
			print("[Timer]Shop Close Error")
		if shops:
			for shop in shops:
				shop_code = shop.shop_code
				shop_id = shop.id
				fruits = shop.fruits
				menus = shop.menus
				fans_count = shop.fans_count
				create_date = shop.create_date_timestamp
				x = datetime.datetime.fromtimestamp(create_date)
				now = datetime.datetime.now()
				days = (now - x).days
				if days > 14:
					if (shop_code == 'not set') or (fans_count < 2) or (len(fruits)+len(menus) == 0):
						shop.status = 0
						print("[Timer]Shop Close Success, shop_id:",shop_id)
			session.commit()
			print("[Timer]Shop Close Done")
			# return self.send_success(close_shop_list = close_shop_list)

	def get_login_url(self):
		return self.get_wexin_oauth_link(next_url=self.request.full_url())
		# return self.reverse_url('customerLogin')

# Fruitzone基类方法
class FruitzoneBaseHandler(_AccountBaseHandler):
	__account_model__ = models.ShopAdmin
	# __account_cookie_name__ = "admin_id"
	__wexin_oauth_url_name__ = "adminOauth"

	# woody 4.4
	# 获取店铺总数
	def get_shop_count(self):
		try:
			shop_count = self.session.query(models.Shop).filter(models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
				models.Shop.shop_code !='not set').count()
		except:
			return self.send_fail("[FruitzoneBaseHandler]get_shop_count: shop count error")
		return shop_count
	# 获取某个省的店铺总数
	def get_province_shop_count(self,shop_province):
		try:
			shop_count = self.session.query(models.Shop).filter(shop_province == shop_province,shop_code !='not set' ).count()
		except:
			return self.send_fail('[FruitzoneBaseHandler]get_province_shop_count: shop_province error')
		return shop_count
	# 获取某个城市的店铺总数
	def get_city_shop_count(self,shop_city):
		try:
			shop_count = self.session.query(models.Shop).filter(shop_city == shop_city,shop_code !='not set' ).count()
		except:
			return self.send_fail('[FruitzoneBaseHandler]get_city_shop_count: shop_city error')
		return shop_count

	def get_shop_group(self):
		from sqlalchemy import func
		try:
			shop_count = self.session.query(models.Shop.shop_province,func.count(models.Shop.shop_province)).\
			filter(models.Shop.shop_code != 'not set').group_by(models.Shop.shop_province).all()
		except:
			return self.send_fail('[FruitzoneBaseHandler]get_shop_group: group error')
		# print("[FruitzoneBaseHandler]get_shop_group: type(shop_count):",type(shop_count))
		shoplist = []
		# shop_count = shop_count.filter(shop_code != 'not set')
		for shop in shop_count:
			# print("[FruitzoneBaseHandler]get_shop_group: shop[0]:",shop[0],", shop[1]:",shop[1])
			shoplist.append([shop[0],shop[1]])

		return shoplist

	def get_login_url(self):
		return self.get_wexin_oauth_link(next_url=self.request.full_url())
		# return self.reverse_url('customerLogin')

	@property
	def shop_id(self):
		if hasattr(self, "_shop_id"):
			return self._shop_id
		shop_id = self.get_cookie("market_shop_id")
		if not shop_id:
			print(("[FruitzoneBaseHandler]shop_id: shop_id error"))
			#return self.redirect("/shop/1")  #todo 这里应该重定向到商铺列表
		self._shop_id = int(shop_id)
		# if not self.session.query(models.CustomerShopFollow).filter_by(
		#         customer_id=self.current_user.id, shop_id=shop_id).first():
		#     return self.redirect("/customer/market/1")  #todo 这里应该重定向到商铺列表
		return self._shop_id

# 店铺管理后台基类方法
class AdminBaseHandler(_AccountBaseHandler):
	__account_model__ = models.ShopAdmin
	# __account_cookie_name__ = "admin_id"
	__wexin_oauth_url_name__ = "adminOauth"
	__wexin_check_url_name__ = "adminwxCheck"
	current_shop = None
	@tornado.web.authenticated
	def prepare(self):
		"""这个函数在get、post等函数运行前运行"""
		shop_id = self.get_secure_cookie("shop_id") or b'0'         
		shop_id = int(shop_id.decode())
		try:
			admin = self.session.query(models.HireLink).filter_by(staff_id=self.current_user.accountinfo.id,active=1,work=9).first()
		except:
			admin = None

		try:
			super_admin = self.session.query(models.ShopAdmin).filter_by(id=self.current_user.id).first()
		except:
			super_admin = None


		if not admin and not super_admin:
			return self.redirect(self.reverse_url("ApplyHome"))

		if admin:
			if shop_id:
				try:
					shop = self.session.query(models.Shop).join(models.HireLink,models.Shop.id == models.HireLink.shop_id)\
					.filter(models.Shop.id == shop_id,models.HireLink.staff_id == self.current_user.accountinfo.id,\
						models.HireLink.active == 1,models.HireLink.work == 9).first()
				except:
					shop = None
			else:
				try:
					shop = self.session.query(models.Shop).join(models.HireLink,models.Shop.id == models.HireLink.shop_id)\
					.filter(models.HireLink.staff_id == self.current_user.accountinfo.id,\
						models.HireLink.active == 1,models.HireLink.work == 9).first()
				except:
					shop = None
			self.current_shop = shop

		if shop_id:
			self.current_shop = self.session.query(models.Shop).filter_by(id = shop_id).first()

		# if not self.current_user.shops:
		# 	if admin:
		# 		try:
		# 			one_shop = self.session.query(models.Shop).filter_by(id = admin.shop_id).first()
		# 		except:
		# 			return self.finish("您还不是任何店铺的管理员，请先申请")
		# 		if not shop_id:
		# 			self.current_shop = one_shop
		# 			self.set_secure_cookie("shop_id", str(self.current_shop.id), domain=ROOT_HOST_NAME)
		# 		else:
		# 			try:
		# 				shop = self.session.query(models.Shop).join(models.HireLink,models.Shop.id == models.HireLink.shop_id)\
		# 				.filter(models.Shop.id == shop_id,models.HireLink.staff_id == self.current_user.accountinfo.id,\
		# 					models.HireLink.active == 1,models.HireLink.work == 9).first()
		# 			except:
		# 				shop = None
		# 			self.current_shop = shop
		# 	else:
		# 		return self.finish("你还没有店铺，请先申请")
		# else:
		# 	if admin:
		# 		shop = next((x for x in self.current_user.shops if x.id == shop_id), \
		# 			self.session.query(models.Shop).join(models.HireLink,models.Shop.id == models.HireLink.shop_id)\
		# 				.filter(models.Shop.id == shop_id,models.HireLink.staff_id == self.current_user.accountinfo.id,\
		# 					models.HireLink.active == 1,models.HireLink.work == 9).first())
		# 	else:
		# 		shop = next((x for x in self.current_user.shops if x.id == shop_id), None)
		# 	if not shop_id or not shop:#初次登录，默认选择一个店铺
		# 		self.current_shop = self.current_user.shops[0]
		# 		self.set_secure_cookie("shop_id", str(self.current_shop.id), domain=ROOT_HOST_NAME)
		# 		return
		# 	else:
		# 		self.current_shop = shop
	def if_current_shops(self):
		if not self.current_user.shops:
			try:
				shop = self.session.query(models.Shop).join(models.HireLink,models.Shop.id == models.HireLink.shop_id)\
				.filter(models.HireLink.staff_id == self.current_user.accountinfo.id,\
					models.HireLink.active == 1,models.HireLink.work == 9).first()
			except:
				shop = None
			if shop:
				self.current_shop = shop
			else:
				return self.redirect(self.reverse_url("switchshop"))

	def get_login_url(self):
		# return self.get_wexin_oauth_link(next_url=self.request.full_url())
		return self.reverse_url('customerLogin')
	
	# 刷新数据库优惠券信息
	def updatecoupon(self,customer_id):
		current_shop_id=self.get_secure_cookie("shop_id") 
		self.updatecouponbase(current_shop_id,customer_id)

	# 获取订单
	def getOrder(self,orders):
		data = []
		for order in orders:
			order.__protected_props__ = ['shop_id', 'JH_id', 'SH1_id', 'SH2_id','comment','comment_imgUrl','comment_reply',
										 'comment_create_date', 'start_time', 'end_time','commodity_quality','create_date','today','active','arrival_day','arrival_time','finish_admin_id','intime_period',
										 'send_admin_id','send_speed','shop_service']
			d = order.safe_props(False)
			if d['fruits']:
				d['fruits'] = eval(d['fruits'])
			else:
				d['fruits'] = {}
			if d['mgoods']:
				d['mgoods'] = eval(d['mgoods'])
			else:
				d['mgoods'] = {}
			d['create_date'] = order.create_date.strftime('%Y-%m-%d %H:%M:%S')
			# d["sent_time"] = order.send_time
			info = self.session.query(models.Customer).filter_by(id = order.customer_id).first()
			d["nickname"] = info.accountinfo.nickname
			d["customer_id"] = order.customer_id
			staffs = self.session.query(models.ShopStaff).join(models.HireLink).filter(and_(
				models.HireLink.work == 3, models.HireLink.shop_id == self.current_shop.id,models.HireLink.active == 1)).all()
			d["shop_new"] = 0
			follow = self.session.query(models.CustomerShopFollow).filter(models.CustomerShopFollow.shop_id == order.shop_id,\
				models.CustomerShopFollow.customer_id == order.customer_id).first()
			if follow:
				d["shop_new"]=follow.shop_new
				# print("[AdminBaseHandler]getOrder: Order's User ID:",order.customer_id,", shop_new:",d["shop_new"])
			SH2s = []
			for staff in staffs:
				staff_data = {"id": staff.id, "nickname": staff.accountinfo.nickname,"realname": staff.accountinfo.realname, "phone": staff.accountinfo.phone,\
				"headimgurl":staff.accountinfo.headimgurl_small}
				SH2s.append(staff_data)
				if staff.id == order.SH2_id:  # todo JH、SH1
					d["SH2"] = staff_data
					# print("[AdminBaseHandler]getOrder:",d["SH2"],'i am admin order' )
			d["SH2s"] = SH2s
			data.append(d)
		return data
		
	def getYouzan(self,action,appid,appsecret):
		if action == "goods":
			method = "kdt.items.get"
		elif action == "shop":
			method = "kdt.shop.basic.get"
		AppID = appid
		AppSecert = appsecret
		app_id = AppID
		_format = "json"
		method  = method
		sign_method = "md5"
		timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
		v = "1.0"
		method = method
		sign = AppSecert+"app_id"+app_id+"format"+_format+"method"+method+"sign_method"+sign_method+"timestamp"+timestamp+"v"+v+AppSecert
		sign = hashlib.md5(sign.encode('utf-8')).hexdigest()
		link_param = "&timestamp="+timestamp+"&v="+v+"&app_id="+app_id+"&method="+method+"&sign_method"+sign_method+"&format"+_format
		link = "https://open.koudaitong.com/api/entry?sign="+sign+link_param
		r = requests.get(link)
		result = r.json()
		if "response" not in result:
			return None
		return result["response"]

# 配送员端基类方法
class StaffBaseHandler(_AccountBaseHandler):
	__account_model__ = models.ShopStaff
	# __account_cookie_name__ = "staff_id"
	__wexin_oauth_url_name__ = "staffOauth"
	shop_id = None
	shop_name = None
	hirelink = None
	@tornado.web.authenticated
	def prepare(self):
		shop_id = self.get_secure_cookie("staff_shop_id") or b'0'
		shop_id = int(shop_id.decode())
		if not self.current_user.shops:
			return self.finish("你还没有店铺，请先申请")
		if not shop_id:
			shop_id = self.current_user.shops[0].id
			self.set_secure_cookie("staff_shop_id", str(shop_id), domain=ROOT_HOST_NAME)
		elif not next((x for x in self.current_user.shops if x.id == shop_id), None):
			return self.finish('你不是这个店铺的员工，可能已经被解雇了')
		self.shop_id = shop_id
		self.shop_name = next(x for x in self.current_user.shops if x.id == shop_id).shop_name
		self.shop_code = next(x for x in self.current_user.shops if x.id == shop_id).shop_code
		self.hirelink = self.session.query(models.HireLink).filter_by(
			staff_id=self.current_user.id, shop_id=self.shop_id).one()
		self.current_user.work = self.hirelink.work

	def get_login_url(self):
		return self.get_wexin_oauth_link(next_url=self.request.full_url())
		# return self.reverse_url('customerLogin')

# 商城基类方法
class CustomerBaseHandler(_AccountBaseHandler):
	__account_model__ = models.Customer
	# __account_cookie_name__ = "customer_id"
	__wexin_oauth_url_name__ = "customerOauth"
	__wexin_check_url_name__ = "customerwxBind"
	@tornado.web.authenticated

	# 存储购物车数据
	def save_cart(self, charge_type_id, shop_id, inc):
		"""
		用户购物车操作函数，对购物车进行修改或者删除商品：
		charge_type_id：要删除的商品的计价类型
		shop_id：用户在每个店铺都有一个购物车
		inc：购物车操作类型
		# menu_type：商品类型（fruit：系统内置，menu：商家自定义）
		#inc==0 删,inc==1:减，inc==2：增；type==0：fruit，type==1：menu
		"""
		cart = self.session.query(models.Cart).filter_by(id=self.current_user.id, shop_id=shop_id).one()

		self._f(cart, "fruits", charge_type_id, inc)

		if not eval(cart.fruits):#购物车空了
			return True
		return False
	def get_login_url(self):
		if self.is_wexin_browser():
			return self.get_wexin_oauth_link(next_url=self.request.full_url())
		else:
			return self.reverse_url('customerLogin')

	def _f(self, cart, menu, charge_type_id, inc):
		d = eval(getattr(cart, menu))
		# print("[CustomerBaseHandler]type(d[charge_type_id]):",type(d[charge_type_id]))
		if d:
			if inc == 2:#加1
				if charge_type_id in d.keys(): d[charge_type_id] =   int(d[charge_type_id]) + 1
				else: d[charge_type_id] = 1
			elif inc == 1:#减1
				if charge_type_id in d.keys():
					if int(d[charge_type_id]) == 1:
						del d[charge_type_id]
					else:
						d[charge_type_id] =  int(d[charge_type_id])  -1
				else:return
			elif inc == 0:#删除
				if charge_type_id in d.keys(): del d[charge_type_id]
			else:return
			setattr(cart, menu, str(d))#数据库cart.fruits 保存的是字典（计价类型id：数量）
		else:
			if inc == 2:
				d={charge_type_id:1}
				setattr(cart, menu, str(d))
		self.session.commit()

	# 读取购物车数据，删除过期商品
	def read_cart(self, shop_id):
		"""
		读购物车函数，把数据库里的str转换为dict，同时删除购物车里已经过时的商品
		"""
		try:cart = self.session.query(models.Cart).filter_by(id=self.current_user.id, shop_id=shop_id).one()
		except:cart = None
		if not cart or (cart.fruits == ""): #购物车为空
			return None, None
		fruits={}
		if cart.fruits:
			d = eval(cart.fruits)
			charge_types=self.session.query(models.ChargeType).\
				filter(models.ChargeType.id.in_(d.keys())).all()
			charge_types = [x for x in charge_types if x.fruit.active == 1]#过滤掉下架商品
			l = [x.id for x in charge_types]
			keys = list(d.keys())
			for key in keys:#有些计价方式可能已经被删除，so购物车也要相应删除
				if key not in l:
					del d[key]
			cart.update(session=self.session, fruits=str(d)) #更新购物车
			for charge_type in charge_types:
				if charge_type.fruit.img_url:
					img_url=charge_type.fruit.img_url.split(";")[0]
				else:
					img_url= None
				fruits[charge_type.id] = {"charge_type": charge_type, "num": d[charge_type.id],
										  "code": charge_type.fruit.fruit_type.code,"img_url":img_url,'limit_num':charge_type.fruit.limit_num}
		return fruits

	@property
	def shop_id(self):
		if hasattr(self, "_shop_id"):
			return self._shop_id
		shop_id = self.get_cookie("market_shop_id")
		if not shop_id:
			return self.send_fail("[CustomerBaseHandler]shop_id: shop_id error")
			#return self.redirect("/shop/1")  #todo 这里应该重定向到商铺列表
		self._shop_id = int(shop_id)
		# if not self.session.query(models.CustomerShopFollow).filter_by(
		#         customer_id=self.current_user.id, shop_id=shop_id).first():
		#     return self.redirect("/customer/market/1")  #todo 这里应该重定向到商铺列表
		return self._shop_id
	@property
	def shop_code(self):
		if hasattr(self, "_shop_code"):
			return self._shop_code

		#woody
		#3.23
		shop_id = self.get_cookie("market_shop_id")
		shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
		if shop:
			self._shop_code = shop.shop_code
		else:
			self._shop_code = None

		return self._shop_code

	def get_phone(self,customer_id):
		try:
			account_info  = self.session.query(models.Accountinfo).filter_by(id = customer_id).first()
		except:
			return self.send_fail('[CustomerBaseHandler]get_phone: customer error')
		if account_info:
			phone = account_info.phone
		else:
			phone = None
		return phone

	# woody 4.4
	# 根据省市获取店铺数、获取店铺总数
	def get_shop_count(self):
		try:
			shop_count = self.session.query(models.Shop).count()
		except:
			return self.send_fail("[CustomerBaseHandler]get_shop_count: shop count error")
		return shop_count
	def get_province_shop_count(self,shop_province):
		try:
			shop_count = self.session.query(models.Shop).filter_by(shop_province = shop_province).count()
		except:
			return self.send_fail('[CustomerBaseHandler]get_province_shop_count: shop_province error')
		return shop_count
	def get_city_shop_count(self,shop_city):
		try:
			shop_count = self.session.query(models.Shop).filter_by(shop_city = shop_city).count()
		except:
			return self.send_fail('[CustomerBaseHandler]get_city_shop_count: shop_city error')
		return shop_count

	def get_shop_group(self):
		from sqlalchemy import func
		try:
			shop_count = self.session.query(models.Shop.shop_province,func.count(models.Shop.shop_province)).\
			group_by(models.Shop.shop_province).all()
		except:
			return self.send_fail('[CustomerBaseHandler]get_shop_group: group error')
		# print("[CustomerBaseHandler]get_shop_group: shop_count:",shop_count)
		return shop_count

	# 模板切换
	def tpl_path(self,tpl_id):
		tpl_path = ""
		if tpl_id == 1:
			tpl_path = "beauty"
		else:
			tpl_path = "customer"
		return tpl_path
	# 刷新数据库优惠券信息
	def updatecoupon(self,customer_id):
		current_shop_id= self.get_cookie("market_shop_id") 
		self.updatecouponbase(current_shop_id,customer_id)



import urllib.request

class QqOauth:
	client_id = QQ_APPID
	client_secret = QQ_APPKEY
	redirect_uri = tornado.escape.url_escape('http://i.senguo.cc')
	print(type(redirect_uri))

	@classmethod
	def get_qqinfo(self,code):
		print(code,'codecodecode')
		url1 = "https://graph.qq.com/oauth2.0/token"
		url1 = url1+"?grant_type=authorization_code&"+ \
		"client_id="+self.client_id+ \
		"&client_secret="+self.client_secret+ \
		"&code=" + str(code) + \
		"&redirect_uri="+self.redirect_uri
		response1 = urllib.request.urlopen(url1).read().decode('utf8')
		print(response1,'response1')
		m = response1.split('&')[0]
		access_token = m.split('=')[1]

		# get openid
		url2 = 'https://graph.qq.com/oauth2.0/me'
		url2=url2+"?access_token="+access_token
		response2 = urllib.request.urlopen(url2).read().decode('utf8')
		dic = response2[10:-3]
		ajson = json.loads(dic)
		openid = ajson['openid']

		# get qq_info
		url3 = 'https://graph.qq.com/user/get_user_info?'+ \
		"access_token="+access_token + \
		"&oauth_consumer_key="+self.client_id+ \
		"&openid="+openid

		response3 = urllib.request.urlopen(url3).read().decode('utf8')
		data = json.loads(response3)
		qq_info = {}
		qq_info['nickname'] = data['nickname']
		qq_info['province'] = data['province']
		qq_info['city']     = data['city']
		qq_info['year']     = data['year']
		qq_info['figureurl']= data['figureurl']
		qq_info['qq_openid']= openid

		return qq_info


jsapi_ticket = {"jsapi_ticket": '', "create_timestamp": 0}  # 用全局变量存好，避免每次都要申请
access_token = {"access_token": '', "create_timestamp": 0}

# 所有需要微信授权调用的东西，模版消息等
class WxOauth2:
	token_url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid={appid}" \
				"&secret={appsecret}&code={code}&grant_type=authorization_code"
	userinfo_url = "https://api.weixin.qq.com/sns/userinfo?access_token={access_token}&openid={openid}&lang=zh_CN"
	client_access_token_url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential" \
							  "&appid={appid}&secret={appsecret}".format(appid=MP_APPID, appsecret=MP_APPSECRET)
	jsapi_ticket_url = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token={access_token}&type=jsapi"
	template_msg_url = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token={access_token}"

	# 获取用户微信信息
	@classmethod
	def get_userinfo(cls, code, mode):
		data = cls.get_access_token_openid(code, mode)
		if not data:
			return None
		access_token, openid = data
		userinfo_url = cls.userinfo_url.format(access_token=access_token, openid=openid)
		# print('[WxOauth2]get_userinfo: mode:',mode,', code:',code)
		try:
			data = json.loads(urllib.request.urlopen(userinfo_url).read().decode("utf-8"))

			# print("[WxOauth2]get_userinfo: return data")
			# for key in data:
			#     print("[WxOauth2]get_userinfo: key:",key,", data[key]:",data[key])
			userinfo_data = dict(
				openid=data["openid"],
				nickname=data["nickname"],
				sex=data["sex"],
				province=data["province"],
				city=data["city"],
				country=data["country"],
				headimgurl=data["headimgurl"],
				unionid=data["unionid"]
			)
			# print("[WxOauth2]get_userinfo: userinfo_data:",userinfo_data)
		except Exception as e:
			print("[WxOauth2]get_userinfo: Oauth2 Error, get userinfo failed")
			# traceback.print_exc()
			return None

		return userinfo_data

	# 获取用户微信 OpenID
	@classmethod
	def get_access_token_openid(cls, code, mode):  # access_token接口调用有次数上限，最好全局变量缓存
												   # 这是需要用户授权才能获取的access_token
		# 需要改成异步请求
		if mode == "kf": # 从PC来的登录请求
			token_url = cls.token_url.format(
				code=code, appid=KF_APPID, appsecret=KF_APPSECRET)
		else :
			token_url = cls.token_url.format(
				code=code, appid=MP_APPID, appsecret=MP_APPSECRET)
		# 获取access_token
		try:
			data = json.loads(urllib.request.urlopen(token_url).read().decode("utf-8"))
			# print("[WxOauth2]get_access_token_openid: data:",data)
		except Exception as e:
			print("[WxOauth2]get_access_token_openid: Oauth2 Error, get access token failed")
			#traceback.print_exc()
			return None
		if "access_token" not in data:
			return None
		return (data["access_token"], data["openid"])

	@classmethod
	def get_access_token_openid_other(cls,code,appid,appsecret):
		token_url = cls.token_url.format(code = code,appid = appid ,appsecret = appsecret)
		#:
		try:
			data = json.loads(urllib.request.urlopen(token_url).read().decode('utf-8'))
		except Exception as e:
			return None
		if "access_token" not in data:
			return None
		else:
			return data['openid']

	# 获取微信 jsapi
	@classmethod
	def get_jsapi_ticket(cls):
		global jsapi_ticket
		if datetime.datetime.now().timestamp() - jsapi_ticket["create_timestamp"]\
				< 7100 and jsapi_ticket["jsapi_ticket"]:  # jsapi_ticket过期时间为7200s，但为了保险起见7100s刷新一次
			return jsapi_ticket["jsapi_ticket"]
		access_token = cls.get_client_access_token()
		if not access_token:
			return None
		jsapi_ticket_url = cls.jsapi_ticket_url.format(access_token=access_token)

		data = json.loads(urllib.request.urlopen(jsapi_ticket_url).read().decode("utf-8"))
		if data["errcode"] == 0:
			jsapi_ticket["jsapi_ticket"] = data["ticket"]
			jsapi_ticket["create_timestamp"] = datetime.datetime.now().timestamp()
			# print('[WxOauth2]get_jsapi_ticket: ticket:',data["ticket"])
			return data["ticket"]
		else:
			# print("[WxOauth2]get_jsapi_ticket: get jsapi ticket failed:",data)
			return None

	# 获取微信 Access Token
	@classmethod
	def get_client_access_token(cls):  # 微信接口调用所需要的access_token,不需要用户授权
		session = models.DBSession()
		# global access_token
		# if datetime.datetime.now().timestamp() - access_token["create_timestamp"]\
		# 		< 7100 and access_token["access_token"]:  # jsapi_ticket过期时间为7200s，但为了保险起见7100s刷新一次
		# 	return access_token["access_token"]

		# data = json.loads(urllib.request.urlopen(cls.client_access_token_url).read().decode("utf-8"))
		# if "access_token" in data:
		# 	access_token["access_token"] = data["access_token"]
		# 	access_token["create_timestamp"] = datetime.datetime.now().timestamp()
		# 	return data["access_token"]
		# else:
		# 	#print("[WxOauth2]get_client_access_token: get access_token error:", data)
		# 	return None
		try:
			access_token = session.query(models.AccessToken).first()
		except:
			access_token = None
		if access_token is not None:
			if datetime.datetime.now().timestamp()- (access_token.create_timestamp) <3600  and access_token.access_token:
				# print("[WxOauth2]get_client_access_token: Current Token:",access_token.access_token)
				return access_token.access_token
			else:
				session.query(models.AccessToken).delete()
				session.commit()
		data = json.loads(urllib.request.urlopen(cls.client_access_token_url).read().decode("utf-8"))
		if "access_token" in data:
			access_token = models.AccessToken(access_token = data["access_token"] , create_timestamp = \
				datetime.datetime.now().timestamp())
			session.add(access_token)
			session.commit()
			return access_token.access_token
		else:
			print("[WxOauth2]get_client_access_token: Get token failed")
			return None

	# 店铺申请成功模版消息（发送给申请者）
	@classmethod
	def post_template_msg(cls, touser, shop_name, name, phone):
		time = datetime.datetime.now().strftime('%Y-%m-%d')
		postdata = {
			"touser": touser,
			"template_id": "YDIcdYNMLKk3sDw_yJgpIvmcN5qz_2Uz83N7T9i5O3s",
			"url": "http://i.senguo.cc/bbs/detail/30",
			"topcolor": "#FF0000",
			"data": {
				"first": {"value": "您好，您所申请的店铺『%s』已经通过审核！\n请添加森果客服微信：senguocc100" % shop_name, "color": "#44b549"},
				"keyword1": {"value": name, "color": "#173177"},
				"keyword2": {"value": phone, "color": "#173177"},
				"keyword3": {"value": time, "color": "#173177"},
				"remark": {"value": "请务必点击详情，查看使用教程", "color": "#FF4040"}}
		}
		access_token = cls.get_client_access_token()
		res = requests.post(cls.template_msg_url.format(access_token=access_token), data=json.dumps(postdata),headers = {"connection":"close"})
		data = json.loads(res.content.decode("ascii"))
		if data["errcode"] != 0:
			print("[TempMsg]Shop apply success message send failed:",data)
			return False
		return True

	# 店铺申请失败模版消息（发送给申请者）
	@classmethod
	def fail_template_msg(cls, touser, shop_name, name, phone,reason):
		time = datetime.datetime.now().strftime('%Y-%m-%d')
		postdata = {
			"touser": touser,
			"template_id": "YDIcdYNMLKk3sDw_yJgpIvmcN5qz_2Uz83N7T9i5O3s",
			"url": "http://i.senguo.cc/bbs/detail/30",
			"topcolor": "#FF0000",
			"data": {
				"first": {"value": "您好，您所申请的店铺『%s』未通过审核。" % shop_name, "color": "#44b549"},
				"keyword1": {"value": name, "color": "#173177"},
				"keyword2": {"value": phone, "color": "#173177"},
				"keyword3": {"value": time, "color": "#173177"},
				"remark": {"value": reason, "color": "#FF4040"}}
		}
		access_token = cls.get_client_access_token()
		res = requests.post(cls.template_msg_url.format(access_token=access_token), data=json.dumps(postdata),headers = {"connection":"close"})
		data = json.loads(res.content.decode("ascii"))
		if data["errcode"] != 0:
			print("[TempMsg]Shop apply fail message send failed:",data)
			return False
		return True

	# 店铺添加管理员成功模版消息（发送给新管理员）
	@classmethod
	def post_add_msg(cls, touser, shop_name, name):
		time = datetime.datetime.now().strftime('%Y-%m-%d')
		postdata = {
			"touser": touser,
			"template_id": "YDIcdYNMLKk3sDw_yJgpIvmcN5qz_2Uz83N7T9i5O3s",
			"url": "http://i.senguo.cc/bbs/detail/30",
			"topcolor": "#FF0000",
			"data": {
				"first": {"value": "您好，%s" % name, "color": "#173177"},
				"keyword1": {"value": "您被店铺『%s』添加为管理员！" % shop_name, "color": "#173177"},
				"keyword3": {"value": time, "color": "#173177"},
				}
		}
		access_token = cls.get_client_access_token()
		res = requests.post(cls.template_msg_url.format(access_token=access_token), data=json.dumps(postdata),headers = {"connection":"close"})
		data = json.loads(res.content.decode("ascii"))
		if data["errcode"] != 0:
			print("[TempMsg]Add admin message send failed:",data)
			return False
		return True

	# 新订单模版消息（发送给管理员）
	@classmethod
	def post_order_msg(cls,touser,admin_name,shop_name,order_id,order_type,create_date,customer_name,\
		order_totalPrice,send_time,goods,phone,address,other_access_token = None):

		access_token = other_access_token if other_access_token else cls.get_client_access_token()

		remark = "订单总价：" + str(order_totalPrice) + '\n'\
			   + "送达时间：" + send_time + '\n'\
			   + "客户电话：" + phone + '\n'\
			   + "送货地址：" + address + '\n'\
			   + "商品详情：" + goods + '\n\n'\
			   + "请及时登录森果后台处理订单。"
		postdata = {
			'touser' : touser,
			'template_id':"5s1KVOPNTPeAOY9svFpg67iKAz8ABl9xOfljVml6dRg",
			"url":"http://i.senguo.cc/madmin/orderDetail/"+order_id,
			"topcolor":"#FF0000",
			"data":{
				"first":{"value":"管理员 {0} 您好，店铺『{1}』收到了新的订单！".format(admin_name,shop_name),"color": "#44b549"},
				"tradeDateTime":{"value":str(create_date),"color":"#173177"},
				"orderType":{"value":order_type,"color":"#173177"},
				"customerInfo":{"value":customer_name,"color":"#173177"},
				"orderItemName":{"value":"订单编号","color":"#173177"},
				"orderItemData":{"value":order_id,"color":"#173177"},
				"remark":{"value":remark,"color":"#173177"},
			}
		}
		res = requests.post(cls.template_msg_url.format(access_token = access_token),data = json.dumps(postdata),headers = {"connection":"close"})
		data = json.loads(res.content.decode("ascii"))
		if data["errcode"] != 0:
			print("[TempMsg]Admin's order message send failed:",data)
			return False
		return True

	# 新订单模版消息（发送给配送员）
	@classmethod
	def post_staff_msg(cls,touser,staff_name,shop_name,order_id,order_type,create_date,customer_name,\
		order_totalPrice,send_time,phone,address,other_access_token = None):

		access_token = other_access_token if other_access_token else cls.get_client_access_token()
		remark = "订单总价：" + str(order_totalPrice)+ '\n'\
			   + "送达时间：" + send_time + '\n'\
			   + "客户电话：" + phone + '\n'\
			   + "送货地址：" + address  +'\n\n'\
			   + "请及时配送订单。"
		order_type_temp = int(order_type)
		order_type = "立即送" if order_type_temp == 1 else "按时达"
		postdata = {
			'touser':touser,
			'template_id':'5s1KVOPNTPeAOY9svFpg67iKAz8ABl9xOfljVml6dRg',
			'url':staff_order_url,
			"data":{
				"first":{"value":"配送员 {0} 您好，店铺『{1}』有新的订单需要配送。".format(staff_name,shop_name),"color": "#44b549"},
				"tradeDateTime":{"value":str(create_date),"color":"#173177"},
				"orderType":{"value":order_type,"color":"#173177"},
				"customerInfo":{"value":customer_name,"color":"#173177"},
				"orderItemName":{"value":"订单编号","color":"#173177"},
				"orderItemData":{"value":order_id,"color":"#173177"},
				"remark":{"value":remark,"color":"#173177"},
			}
		}
		res = requests.post(cls.template_msg_url.format(access_token = access_token),data = json.dumps(postdata),headers = {"connection":"close"})
		data = json.loads(res.content.decode("ascii"))
		if data["errcode"] != 0:
			print("[TempMsg]Staff's order message send failed:",data)
			return False
		return True

	# 批量新订单模版消息（发送给配送员）
	@classmethod
	def post_batch_msg(cls,touser,staff_name,shop_name,count):
		postdata = {
			'touser':touser,
			'template_id':'5s1KVOPNTPeAOY9svFpg67iKAz8ABl9xOfljVml6dRg',
			'url':staff_order_url,
			"data":{
				"first":{"value":"配送员 {0} 您好，店铺『{1}』有 {2} 个新的订单需要配送。".format(staff_name,shop_name,count),"color": "#44b549"},
				"tradeDateTime":{"value":"批量信息","color":"#173177"},
				"orderType":{"value":"批量信息","color":"#173177"},
				"customerInfo":{"value":"批量信息","color":"#173177"},
				"orderItemName":{"value":"订单编号","color":"#173177"},
				"orderItemData":{"value":"批量信息","color":"#173177"},
				"remark":{"value":"\n有多个订单需要配送，具体信息请点击“详情”进入查看。","color":"#173177"},
			}
		}
		access_token = cls.get_client_access_token()
		res = requests.post(cls.template_msg_url.format(access_token = access_token),data = json.dumps(postdata),headers = {"connection":"close"})
		data = json.loads(res.content.decode("ascii"))
		if data["errcode"] != 0:
			print("[TempMsg]Staff's barth order message send failed:",data)
			return False
		return True

	# 订单提交成功模版消息（发送给用户）
	@classmethod
	def order_success_msg(cls,touser,shop_name,order_create,goods,order_totalPrice,order_realid,other_access_token = None):
		access_token = other_access_token if other_access_token else cls.get_client_access_token()
		postdata = {
			'touser' : touser,
			'template_id':'NNOXSZsH76hQX7p2HCNudxLhpaJabSMpLDzuO-2q0Z0',
			'url'    : 'http://i.senguo.cc/customer/orders/detail/' + str(order_realid),
			'topcolor': "#FF0000",
			"data":{
				"first"    : {"value":"您的订单已提交成功！\n","color":"#44b549"},
				"keyword1" : {"value":shop_name,"color":"#173177"},
				"keyword2" : {"value":str(order_create),"color":"#173177"},
				"keyword3" : {"value":goods,"color":"#173177"},
				"keyword4" : {"value":str(order_totalPrice),"color":"#173177"},
				"remark"   : {"value":"\n您的订单我们已经收到，配货后将尽快配送~","color":"#173177"},
			}
		}
		res = requests.post(cls.template_msg_url.format(access_token=access_token),data = json.dumps(postdata),headers = {"connection":"close"})
		data = json.loads(res.content.decode("ascii"))
		if data["errcode"] != 0:
			print("[TempMsg]Order commit message send failed:",data)
			return False
		return True

	# 订单完成模版消息（发送给用户）
	@classmethod
	def order_done_msg(cls,touser,order_num,order_sendtime,shop_phone,shop_name,order_id,other_access_token = None):
		access_token = other_access_token if other_access_token else cls.get_client_access_token()
		describe = '\n如有任何疑问，请拨打商家电话：%s。' % shop_phone if shop_phone else '\n如有任何疑问，请及时联系商家。'
		postdata = {
			'touser':touser,
			'template_id':'5_JWJNqfAAH8bXu2M_v9_MFWJq4ZPUdxHItKQTRbHW0',
			'url':'http://i.senguo.cc/customer/orders/detail/' + str(order_id),
			'topcolor':'#FF0000',
			"data":{
				"first":{"value":"您在『{0}』的订单已完成。\n".format(shop_name),"color":"#44b549"},
				"keyword1":{"value":order_num,"color":"#173177"},
				"keyword2":{"value":order_sendtime,"color":"#173177"},
				"remark"  :{"value":describe+"\n您可以点击“详情”查看订单，并对订单进行评价拿积分哦！","color":"#173177"},
			}
		}
		res = requests.post(cls.template_msg_url.format(access_token=access_token),data = json.dumps(postdata),headers = {"connection":"close"})
		data = json.loads(res.content.decode("ascii"))
		if data["errcode"] != 0:
			print("[TempMsg]Order done message send failed:",data)
			return False
		return True

	# 订单取消模版消息（发送给管理员）
	@classmethod
	def order_cancel_msg(cls,touser,order_num,cancel_time,shop_name,other_access_token = None):
		access_token = other_access_token if other_access_token else cls.get_client_access_token()
		postdata = {
			'touser':touser,
			'template_id':'EcqyvbnALGmeG8O-SJw_XCIlMvBOH5mB8YM_qCsgSwE',
			'url':'i.senguo.cc/admin',
			'topcolor':'#FF0000',
			'data':{
				'first':{'value':'您好，您的店铺『{0}』有一笔订单取消'.format(shop_name),'color':'#44b549'},
				'keyword1':{'value':order_num,'color':'#173177'},
				'keyword2':{'value':cancel_time,'color':'#173177'},
				'remark':{'value':'\n请登入后台查看详情！','color':'#173177'},
			}
		}
		res = requests.post(cls.template_msg_url.format(access_token=access_token),data = json.dumps(postdata),headers = {'connection':'close'})
		data = json.loads(res.content.decode("ascii"))
		if data['errcode'] != 0:
			print("[TempMsg]Order canceled message send failed:",data)
			return False
		else:
			return True

	# 店铺认证状态更新模版消息（发送给管理员）
	@classmethod
	def shop_auth_msg(cls,touser,shop_name,success):
		if success == True:
			remark = '\n您的店铺已获得余额支付、在线支付、店铺营销、模版设置等高级功能。'
			value1 = '您的店铺『{0}』已通过认证'.format(shop_name)
			value2 = '认证成功'
		else:
			remark = '\n请使用电脑登录店铺认证页面查看失败原因，并重新提交认证申请。'
			value1 = '您的店铺『{0}』未通过认证'.format(shop_name)
			value2 = '认证失败'
		postdata = {
			'touser':touser,
			'template_id':'DOLv3DLoy9xJIfLKmfGnjVvNNgc2aKLMBM_v_yHqVwg',
			'url':order_url,
			'topcolor':'#FF0000',
			"data":{
				'first':{'value':'店铺认证状态更新\n','color':'#44b549'},
				'keyword1':{'value':value1,'color':'#173177'},
				'keyword2':{'value':value2,'color':'#173177'},
				'remark':{'value':remark,'color':'#173177'},
			}
		}
		access_token = cls.get_client_access_token()
		res = requests.post(cls.template_msg_url.format(access_token=access_token),data = json.dumps(postdata),headers = {"connection":"close"})
		data = json.loads(res.content.decode("ascii"))
		if data["errcode"] != 0:
			print("[TempMsg]Shop auth message send failed:",data)
			return False
		return True

	@classmethod
	def get_user_subcribe(cls,openid):
		# print("[WxOauth2]get_user_subcribe: type(openid):",type(openid))
		access_token = cls.get_client_access_token()
		user_subcribe_url = 'https://api.weixin.qq.com/cgi-bin/user/info?access_token={0}&openid={1}'.format(access_token,openid)
		res = requests.get(user_subcribe_url,headers = {"connection":"close"})
		if type(res.content)== bytes:
			s = str(res.content,'utf-8')
		else:
			s = res.content.decode('utf-8')
		data = json.loads(s)
		json_data = json.dumps(data)
		# print("[WxOauth2]get_user_subcribe: data:",data)
		subscribe = data.get('subscribe')
		return subscribe

	@classmethod
	def get_redriect(cls):
		appid = 'wx0ed17cdc9020a96e'
		redirect_url = 'http://auth.senguo.cc/fruitzone'
		response_type='code'
		scope = 'snsapi_userinfo'
		state = 123
		url = 'https://open.weixin.qq.com/connect/oauth2/\
		authorize?appid={0}&redirect_uri={1}&response_type=code&scope={2}&state={3}#\
		wechat_redirect'.format(appid,redirect_url,scope,state)
		return url

# 域名缩短
class UrlShorten:
	session = models.DBSession()
	code_map = (
		'a' , 'b' , 'c' , 'd' , 'e' , 'f' , 'g' , 'h' ,
		'i' , 'j' , 'k' , 'l' , 'm' , 'n' , 'o' , 'p' ,
		'q' , 'r' , 's' , 't' , 'u' , 'v' , 'w' , 'x' ,
		'y' , 'z' , '0' , '1' , '2' , '3' , '4' , '5' ,
		'6' , '7' , '8' , '9' , 'A' , 'B' , 'C' , 'D' ,
		'E' , 'F' , 'G' , 'H' , 'I' , 'J' , 'K' , 'L' ,
		'M' , 'N' , 'O' , 'P' , 'Q' , 'R' , 'S' , 'T' ,
		'U' , 'V' , 'W' , 'X' , 'Y' , 'Z')

	@classmethod
	def get_md5(self,longurl):
		longurl = longurl.encode('utf8') if isinstance(longurl,str) else longurl
		m = hashlib.md5()
		m.update(longurl)
		return m.hexdigest()

	@classmethod
	def get_short_url(self,long_url):
		url = self.session.query(models.ShortUrl).filter_by(long_url = long_url).first()
		if url:
			short_url = url.short_url
			self.session.commit()
			return short_url
		else:
			hkeys = []
			hex   =  self.get_md5(long_url)
			for i in range(0,1):
				n = int(hex[i*8:(i+1)*8],16)
				v = []
				e = 0
				for j in range(0,8):
					x = 0x0000003D & n
					e |= ((0x00000002 & n ) >> 1) << j
					v.insert(0,self.code_map[x])
					n = n >> 6
				e |= n << 5
				v.insert(0,self.code_map[e & 0x0000003D])
				hkeys.append("".join(v))
			url = models.ShortUrl(short_url = hkeys[0],long_url = long_url)
			self.session.add(url)
			self.session.commit()
			return hkeys[0]
	@classmethod
	def get_long_url(self,short_url):
		url = self.session.query(models.ShortUrl).filter_by(short_url = short_url).first()
		if not url:
			return False
		long_url = url.long_url
		self.session.commit()
		return long_url
