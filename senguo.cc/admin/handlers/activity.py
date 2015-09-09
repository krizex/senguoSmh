from handlers.base import CustomerBaseHandler,AdminBaseHandler,WxOauth2
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
import tornado.gen
from tornado.concurrent import run_on_executor
from concurrent.futures import ThreadPoolExecutor

# 发现 - 告白墙 - 首页
class ConfessionHome(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action?","page?:int")
	def get(self,shop_code):
		shop_name=''
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code =shop_code).first()
		except:
			return self.send_fail('shop error')
		if shop:
			self.set_cookie("market_shop_id", str(shop.id))
			self.set_cookie("market_shop_code",str(shop.shop_code))
			shop_name = shop.shop_name
			shop_code = shop.shop_code
			notice = shop.marketing.confess_notice
		else:
			return self.send_error(404)

		try:
			confess_list =self.session.query(models.ConfessionWall).filter_by( shop_id = shop.id,customer_id =self.current_user.id).all()
			for confess in confess_list :
				confess.scan = 1
			self.session.commit()
		except:
			confess_list = []

		action = self.args["action"]
		if action != []:
			customer_id = self.current_user.id
			try:
				shop = self.session.query(models.Shop).filter_by(shop_code =shop_code).first()
			except:
				return self.send_fail('shop error')
			if shop:
				shop_id = shop.id
			else :
				return self.send_fail('shop error')
			data = []
			page_size = 10
			page = int(self.args["page"])
			nomore = False
			datalist = []
			if action == "public":
				try:
					data = self.session.query(models.ConfessionWall).\
					filter_by(customer_id = customer_id,shop_id=shop_id,status = 1).order_by(models.ConfessionWall.create_time.desc()).offset(page*page_size).limit(page_size).all()
				except:
					print("[ConfessionHome]haven't public any confession")
			elif action == "receive":
				try:
					data = self.session.query(models.ConfessionWall).\
					filter_by(other_phone = self.current_user.accountinfo.phone,shop_id=shop_id,status = 1).order_by(models.ConfessionWall.create_time.desc()).offset(page*page_size).limit(page_size).all()
				except:
					print("[ConfessionHome]current_user didn't tie the cell phone")
			elif action == "comment":
				try:
					data = self.session.query(models.ConfessionWall).\
					join(models.ConfessionComment,models.ConfessionWall.id == models.ConfessionComment.wall_id).filter(models.ConfessionWall.status == 1,models.ConfessionWall.shop_id == shop_id,models.ConfessionComment.customer_id==customer_id).distinct().order_by(models.ConfessionWall.create_time.desc()).offset(page*page_size).limit(page_size).all()
				except:
					print("[ConfessionHome]current_user didn't comment any confession")
			for d in data:
				info = self.session.query(models.Customer).filter_by(id=d.customer_id).first()
				user = info.accountinfo.nickname
				sex = info.accountinfo.sex
				imgurl = info.accountinfo.headimgurl_small
				time = d.create_time.strftime('%Y-%m-%d %H:%M')
				datalist.append({'id':d.id,'user':user,'imgurl':imgurl,'time':time,'name':d.other_name,\
					'type':d.confession_type,'confession':d.confession,'great':d.great,'comment':d.comment,'floor':d.floor,'sex':sex})
			if datalist == [] or len(datalist) < page_size:
				nomore = True
			if page == 0:
				if len(datalist)<page_size:
					nomore = True
				return self.render("confession/home.html", context=dict(datalist=datalist),nomore=nomore,shop_name=shop_name,shop_code=shop_code,notice = notice)
			else :
				return self.send_success(datalist = datalist,nomore=nomore)
		else:
			return self.render('confession/home.html',shop_name=shop_name,shop_code=shop_code,nomore='',notice = notice,context=dict())

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("page?:int","action:str","data?")
	def post(self,shop_code):
		action = self.args["action"]
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code = shop_code).first()
		except:
			return self.send_fail('店铺不存在')
		shop_id = shop.id
		if action == "new":
			page_size = 10
			page = self.args["page"]
			nomore = False
			datalist = []
			confession = self.session.query(models.ConfessionWall).filter_by(shop_id=shop_id,status = 1).\
			order_by(models.ConfessionWall.create_time.desc()).offset(page*page_size).limit(page_size).all()
			for data in confession:
				info = self.session.query(models.Customer).filter_by(id=data.customer_id).first()
				user = info.accountinfo.nickname
				imgurl = info.accountinfo.headimgurl_small
				sex = info.accountinfo.sex
				time = data.create_time.strftime('%Y-%m-%d %H:%M')
				datalist.append({'id':data.id,'user':user,'imgurl':imgurl,'time':time,'name':data.other_name,\
					'type':data.confession_type,'confession':data.confession,'great':data.great,'comment':data.comment,'floor':data.floor,'sex':sex})
			if datalist == [] or len(datalist) < page_size:
				nomore = True
			return self.send_success(datalist=datalist,nomore=nomore)
		elif action == "hot":
			page_size = 10
			page = self.args["page"]
			nomore = False
			datalist = []
			confession = self.session.query(models.ConfessionWall).filter_by(shop_id=shop_id,status = 1).\
			order_by(models.ConfessionWall.great.desc()).offset(page*page_size).limit(page_size).all()
			for data in confession:
				info = self.session.query(models.Customer).filter_by(id=data.customer_id).first()
				user = info.accountinfo.nickname
				imgurl = info.accountinfo.headimgurl_small
				sex = info.accountinfo.sex
				time = data.create_time.strftime('%Y-%m-%d %H:%M')
				datalist.append({'id':data.id,'user':user,'imgurl':imgurl,'time':time,'name':data.other_name,\
					'type':data.confession_type,'confession':data.confession,'great':data.great,'comment':data.comment,'floor':data.floor,'sex':sex})
			if datalist == [] or len(datalist) < page_size:
				nomore = True
			return self.send_success(datalist=datalist,nomore=nomore)
		elif action =="great":
			import time  # why??????????????????????????????????????????
			now =  time.strftime('%Y-%m-%d', time.localtime() )
			confess_list = self.session.query(models.ConfessionGreat).filter_by(wall_id = self.args["data"]["id"],customer_id = \
				self.current_user.id).order_by(models.ConfessionGreat.create_time).all()
			for _list in confess_list:
				if _list.create_time.strftime('%Y-%m-%d') == now:
					return self.send_fail('您已经点过赞啦！')
			confession = self.session.query(models.ConfessionWall).filter_by( id = self.args["data"]["id"]).first()
			great = models.ConfessionGreat(
				wall_id = self.args["data"]["id"],
				customer_id = self.current_user.id
			)
			confession.great = confession.great +1
			confession.scan = 0
			self.session.add(great)
			self.session.commit()
			return self.send_success()
		elif action == "comment":
			confession = self.session.query(models.ConfessionWall).filter_by( id = self.args["data"]["id"]).first()
			comment =models.ConfessionComment(
				wall_id = self.args["data"]["id"],
				customer_id = self.current_user.id,
				comment = self.args["data"]["comment"]
			)
			confession.comment = confession.comment +1
			confession.scan = 0
			self.session.add(comment)
			self.session.commit()
			return self.send_success()

# 发现 - 告白墙 - 评论详情
class ConfessionComment(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("num:int")
	def get(self,shop_code):
		_id = self.args["num"]
		shop_name = ''
		confess = []
		comment = []
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code =shop_code).first()
		except:
			return self.send_fail('shop error')
		if shop:
			shop_name = shop.shop_name
		try:
			confess_list = self.session.query(models.ConfessionWall).filter_by( id = _id).first()
			confess_customer = self.session.query(models.Customer).filter_by( id = confess_list.customer_id).first()
		except:
			confess_list = None
		try:
			comment_list = self.session.query(models.ConfessionComment).filter_by(wall_id = _id).all()
		except:
			comment_list = None

		if confess_list:
			confess_time = confess_list.create_time.strftime('%Y-%m-%d %H:%M')
			if confess_list.confession_type == 0 :
				user = '匿名用户'
				imgurl = '/static/images/TDSG.png'
			else :
				user = confess_customer.accountinfo.nickname
				imgurl = confess_customer.accountinfo.headimgurl_small
			confess.append({'id':confess_list.id,'user':user,'imgurl':imgurl,\
				'time':confess_time,'name':confess_list.other_name,'type':confess_list.confession_type,'confession':confess_list.confession,'great':confess_list.great,\
				'comment':confess_list.comment,'floor':confess_list.floor,'sex':confess_customer.accountinfo.sex})
		if comment_list:
			for c in comment_list:
				info = self.session.query(models.Customer).filter_by( id = c.customer_id).first()
				author_info = self.session.query(models.Customer).filter_by( id = c.comment_author_id).first()
				comment_author = ''
				if author_info:
					if author_info.accountinfo:
						comment_author = author_info.accountinfo.nickname
				time = c.create_time.strftime('%Y-%m-%d')
				comment.append({'id':c.id,'nickname':info.accountinfo.nickname,'time':time,'comment':c.comment,'type':c._type,\
					'comment_author':comment_author})
		return self.render("confession/comment.html",shop_code=shop_code,shop_name=shop_name,confess=confess,comment=comment)

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action:str","data")
	def post(self,shop_code):
		action = self.args["action"]
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code =shop_code).first()
		except:
			return self.send_fail('shop error')
		if shop:
			shop_id = shop.id
		else :
			return self.send_fail('shop error')
		if action == "comment":
			confession = self.session.query(models.ConfessionWall).filter_by( id = self.args["data"]["id"]).first()
			comment =models.ConfessionComment(
				wall_id = self.args["data"]["id"],
				customer_id = self.current_user.id,
				comment = self.args["data"]["comment"]
			)
			confession.comment = confession.comment +1
			confession.scan = 0
			self.session.add(comment)
			self.session.commit()
			info = self.session.query(models.Customer).filter_by( id = self.current_user.id).first()
			comment_data = self.session.query(models.ConfessionComment)\
			.filter_by(wall_id = self.args["data"]["id"],customer_id = self.current_user.id,_type = 0).order_by(models.ConfessionComment.create_time.desc()).first()
			data = {}
			if info:
				data['id'] = comment_data.id
				data['nickname'] = info.accountinfo.nickname
				data['time'] = comment_data.create_time.strftime('%Y-%m-%d')
				data['comment'] = comment_data.comment
			else:
				return send_fail('no such customer')
			self.set_cookie('confess_new',str(1))
			self.set_cookie('confess_shop_id',str(shop_id))
			return self.send_success(data=data)
		elif action =="replay":
			confession = self.session.query(models.ConfessionWall).filter_by( id = self.args["data"]["wall_id"]).first()
			comment = self.session.query(models.ConfessionComment).filter_by( id = self.args["data"]["id"]).first()
			reply =  models.ConfessionComment(
				wall_id = self.args["data"]["wall_id"],
				customer_id = self.current_user.id,
				comment = self.args["data"]["comment"],
				_type = 1,
				comment_author_id = comment.customer_id
			)
			confession.comment = confession.comment +1
			confession.scan = 0
			self.session.add(reply)
			self.session.commit()
			info = self.session.query(models.Customer).filter_by( id = self.current_user.id).first()
			author_info = self.session.query(models.Customer).filter_by( id = comment.customer_id).first()
			comment_data = self.session.query(models.ConfessionComment)\
			.filter_by(wall_id = self.args["data"]["wall_id"],customer_id = self.current_user.id,_type = 1).order_by(models.ConfessionComment.create_time.desc()).first()
			data = {}
			if info:
				data['id'] = comment_data.id
				data['nickname'] = info.accountinfo.nickname
				data['time'] = comment_data.create_time.strftime('%Y-%m-%d')
				data['comment'] = comment_data.comment
				data['comment_author']  = author_info.accountinfo.nickname
			else:
				return send_fail('no such customer')
			self.set_cookie('confess_new',str(1))
			self.set_cookie('confess_shop_id',str(shop_id))
			return self.send_success(data=data)

# 发现 - 告白墙 - 发布
class ConfessionPublic(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self,shop_code):
		_type=''
		shop_name=''
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code =shop_code).first()
		except:
			return self.send_fail('shop error')
		if shop:
			_type = shop.marketing.confess_type
			shop_name = shop.shop_name
		return self.render('confession/public.html',shop_code=shop_code,shop_name=shop_name,_type=_type)

	@tornado.web.authenticated
	# @tornado.web.asynchronous
	# @tornado.gen.engine
	def post(self,shop_code):
		self.handle_public(shop_code)
		# self.finish()

	# @run_on_executor
	@CustomerBaseHandler.check_arguments("data")
	def handle_public(self,shop_code):
		data = self.args["data"]
		floor = 0
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code =shop_code).first()
		except:
			return self.send_fail('shop error')
		if shop:
			shop_id = shop.id
		else :
			return self.send_fail('shop error')

		try:
			floor = self.session.query(models.ConfessionWall).filter_by(shop_id = shop_id).count()
			floor = floor+1
		except:
			floor = 0
		confess_type = shop.marketing.confess_type
		confess_only = shop.marketing.confess_only
		if confess_only == 1:
			now =  time.strftime('%Y-%m-%d', time.localtime( time.time() ) )
			confess_list = self.session.query(models.ConfessionWall).filter_by(shop_id = shop_id).order_by(models.ConfessionWall.create_time).all()
			for _list in confess_list:
				if _list.create_time.strftime('%Y-%m-%d') == now:
					return self.send_fail('一天只能发布一条告白哦')
		if  confess_type == 1:
			confession = models.ConfessionWall(
				customer_id = self.current_user.id,
				shop_id = shop_id,
				other_name = data["name"],
				other_phone = data["phone"],
				other_address =data["address"],
				confession_type = int(data["type"]),
				confession = data["confession"],
				floor = floor
			)
		else :
			confession = models.ConfessionWall(
				customer_id = self.current_user.id,
				shop_id = shop_id,
				confession_type = int(data["type"]),
				confession = data["confession"],
				floor = floor
			)
		self.session.add(confession)
		self.session.commit()
		self.set_cookie('confess_new',str(1))
		self.set_cookie('confess_shop_id',str(shop_id))
		return self.send_success()

# 发现 - 告白墙 - 个人中心
class ConfessionCenter(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self,shop_code):
		customer_id = self.current_user.id
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code =shop_code).first()
		except:
			return self.send_fail('shop error')
		if shop:
			shop_id = shop.id
			shop_code = shop.shop_code
			shop_name = shop.shop_name
		else :
			return self.send_fail('shop error')
		pub_count = self.session.query(models.ConfessionWall).filter_by(customer_id = customer_id,shop_id=shop_id,status = 1).count()
		receive_count = self.session.query(models.ConfessionWall).filter_by(other_phone = self.current_user.accountinfo.phone,shop_id=shop_id,status = 1).count()
		comment_count =  self.session.query(models.ConfessionWall).\
		join(models.ConfessionComment,models.ConfessionWall.id == models.ConfessionComment.wall_id).filter(models.ConfessionWall.status == 1,models.ConfessionWall.shop_id == shop_id,models.ConfessionComment.customer_id==customer_id).distinct().count()
		return self.render('confession/center.html',shop_name=shop_name,pub_count=pub_count,receive_count=receive_count,comment_count=comment_count,shop_code=shop_code)

# 发现 - 告白墙 - 告白列表
class ConfessionList(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action","page:int")
	def get(self,shop_code):
		action = self.args["action"]
		customer_id = self.current_user.id
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code =shop_code).first()
		except:
			return self.send_fail('shop error')
		if shop:
			shop_id = shop.id
		else :
			return self.send_fail('shop error')
		data = []
		datalist = []
		page_size = 10
		page = int(self.args["page"])
		nomore = False
		if action == "public":
			try:
				data = self.session.query(models.ConfessionWall).\
				filter_by(customer_id = customer_id,shop_id=shop_id).offset(page*page_size).limit(page_size).all()
			except:
				print("[ConfessionList]haven't public any confession")
		elif action == "receive":
			try:
				data = self.session.query(models.ConfessionWall).\
				filter_by(other_phone = self.current_user.accountinfo.phone).offset(page*page_size).limit(page_size).all()
			except:
				print("[ConfessionList]current_user didn't tie the cell phone")
		elif action == "comment":
			try:
				data = self.session.query(models.ConfessionWall).\
				join(models.ConfessionComment,models.ConfessionWall.id == models.ConfessionComment.wall_id).offset(page*page_size).limit(page_size).all()
			except:
				print("[ConfessionList]current_user didn't comment any confession")
		for d in data:
			info = self.session.query(models.Customer).filter_by(id=d.customer_id).first()
			fromwho = info.accountinfo.nickname
			imgurl = info.accountinfo.headimgurl_small
			datalist.append({'time':d.create_time.strftime('%Y-%m-%d %H:%M'),'confession':d.confession,'name':d.other_name,\
				'fromwho':fromwho,'imgurl':imgurl,'type':d.confession_type})
		if datalist == [] or len(datalist) < page_size:
			nomore = True
		if page == 0:
			if len(datalist)<page_size:
				nomore = True
			return self.render("confession/list.html", datalist=datalist,action=action,nomore=nomore)
		else :
			return self.send_success(datalist = datalist,nomore=nomore)

# 发现 - 优惠券
class Coupon(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("coupon/coupon.html")

		
class CouponProfile(CustomerBaseHandler):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action?:str","coupon_id?","shop_id?")
	def get(self):
		current_customer_id=self.current_user.id
		action=self.args["action"]
		shop_id = self.args['shop_id']
		if action=="get_all":
			current_shop_id=self.get_cookie("market_shop_id")
			self.updatecoupon(current_customer_id)
			now_date=int(time.time())
			data=[]
			q=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_type=0,closed=0).all()
			for x in q:
				if  x.to_get_date>now_date:
					if x.use_goods_group==0:
						use_goods_group="默认分组"
					elif x.use_goods_group==-1:
						use_goods_group="店铺推荐"
					elif x.use_goods_group==-2:
						use_goods_group="所有分组"
					else:
						q1=self.session.query(models.GoodsGroup).filter_by(shop_id=current_shop_id,id=x.use_goods_group).first()
						use_goods_group=q1.name
					if x.use_goods==-1:
						use_goods="所有商品"
					else:
						q1=self.session.query(models.Fruit).filter_by(shop_id=current_shop_id,id=x.use_goods).first()
						use_goods=q1.name
					from_valid_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.from_valid_date))
					to_valid_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.to_valid_date))
					from_get_date=time.strftime('%Y-%m-%d ',time.localtime(x.from_get_date))
					to_get_date=time.strftime('%Y-%m-%d ',time.localtime(x.to_get_date))
					get_able=0
					if x.from_get_date<now_date:
						get_able=1
					x_coupon={"get_able":get_able,"coupon_id":x.coupon_id,"coupon_money":x.coupon_money,"get_limit":x.get_limit,"use_rule":x.use_rule,"use_goods_group":use_goods_group,"use_number":x.use_number,"valid_way":x.valid_way,\
						"get_number":x.get_number,"coupon_id":x.coupon_id,"remain_number":x.total_number-x.get_number,"use_goods":use_goods,"from_valid_date":from_valid_date,"to_valid_date":to_valid_date,"last_day":x.last_day,\
						"from_get_date":from_get_date,"to_get_date":to_get_date}
					data.append(x_coupon)
				else:
					pass
			return self.render("coupon/coupon-profile.html",shop_id = shop_id ,output_data=data)
		elif action=="get_one":
			market_shop_id=self.args["shop_id"]
			try:
				shop = self.session.query(models.Shop).filter_by(id=market_shop_id).first()
				current_shop_id=shop.id
				self.set_cookie("market_shop_id",str(current_shop_id))
			except:
				return self.render("coupon/coupon-profile.html",shop_id = market_shop_id, output_data=[])
			self.updatecoupon(current_customer_id)
			now_date=int(time.time())
			data=[]
			coupon_id=self.args["coupon_id"]
			x=self.session.query(models.CouponsShop).filter_by(shop_id=shop_id,coupon_type=0,closed=0,coupon_id=coupon_id).first()
			if x:
				if  x.to_get_date>now_date:
					if x.use_goods_group==0:
						use_goods_group="默认分组"
					elif x.use_goods_group==-1:
						use_goods_group="店铺推荐"
					elif x.use_goods_group==-2:
						use_goods_group="所有分组"
					else:
						q1=self.session.query(models.GoodsGroup).filter_by(shop_id=current_shop_id,id=x.use_goods_group).first()
						use_goods_group=q1.name
					if x.use_goods==-1:
						use_goods="所有商品"
					else:
						q1=self.session.query(models.Fruit).filter_by(shop_id=current_shop_id,id=x.use_goods).first()
						use_goods=q1.name
					from_valid_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.from_valid_date))
					to_valid_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.to_valid_date))
					from_get_date=time.strftime('%Y-%m-%d ',time.localtime(x.from_get_date))
					to_get_date=time.strftime('%Y-%m-%d ',time.localtime(x.to_get_date))
					get_able=0
					if x.from_get_date<now_date:
						get_able=1
					x_coupon={"get_able":get_able,"coupon_id":x.coupon_id,"coupon_money":x.coupon_money,"get_limit":x.get_limit,"use_rule":x.use_rule,"use_goods_group":use_goods_group,"use_number":x.use_number,"valid_way":x.valid_way,\
						"get_number":x.get_number,"coupon_id":x.coupon_id,"remain_number":x.total_number-x.get_number,"use_goods":use_goods,"from_valid_date":from_valid_date,"to_valid_date":to_valid_date,"last_day":x.last_day,\
						"from_get_date":from_get_date,"to_get_date":to_get_date}
					data.append(x_coupon)
			return self.render("coupon/coupon-profile.html",shop_id=shop_id,output_data=data)
#优惠券列表		
class CouponList(CustomerBaseHandler):
	def getcoupon(self,coupon_status,data):
		current_customer_id=self.current_user.id
		current_shop_id=self.get_cookie("market_shop_id")
		q=self.session.query(models.CouponsCustomer).filter_by(customer_id=current_customer_id,coupon_status=coupon_status).order_by(models.CouponsCustomer.get_date.desc()).all()
		now_date=int(time.time())
		for x in q:
			if (now_date-15*24*60*60)>x.uneffective_time and x.coupon_status!=0:
				pass
			else:
				effective_time=time.strftime('%Y-%m-%d',time.localtime(x.effective_time))
				uneffective_time=time.strftime('%Y-%m-%d',time.localtime(x.uneffective_time))
				get_date=time.strftime('%Y-%m-%d',time.localtime(x.get_date))
				use_date=time.strftime('%Y-%m-%d',time.localtime(x.use_date))
				shop=self.session.query(models.Shop).filter_by(id=x.shop_id).first()
				q1=self.session.query(models.CouponsShop).filter_by(shop_id=x.shop_id,coupon_id=x.coupon_id).first()
				use_goods_group=None
				use_goods=None
				if q1.use_goods_group==0:
					use_goods_group="默认分组"
				elif q1.use_goods_group==-1:
					use_goods_group="店铺推荐"
				elif q1.use_goods_group==-2:
					use_goods_group="所有分组"
				else:
					q2=self.session.query(models.GoodsGroup).filter_by(shop_id=current_shop_id,id=q1.use_goods_group).first()
					use_goods_group=q2.name
				if q1.use_goods==-1:
					use_goods="所有商品"
				else:
					q2=self.session.query(models.Fruit).filter_by(id=q1.use_goods).first()
					use_goods=q2.name
				x_coupon={"use_goods_group":use_goods_group,"use_goods":use_goods,"effective_time":effective_time,"use_rule":q1.use_rule,"coupon_key":x.coupon_key,"coupon_money":q1.coupon_money,"get_date":get_date,"use_date":use_date,"uneffective_time":uneffective_time,"coupon_status":x.coupon_status}
				data.append(x_coupon)
		return None
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action?:str","coupon_key?")
	def get(self):
		action=self.args["action"]
		current_customer_id=self.current_user.id
		current_shop_id=self.get_cookie("market_shop_id")
		self.updatecoupon(current_customer_id)
		if action=="get_all":
			data=[]
			for x in range(1,4):
				self.getcoupon(x,data)
			return self.render("coupon/coupon-list.html",output_data=data)
		elif action=="get_one":
			coupon_key=self.args["coupon_key"]
			data=[]
			q=self.session.query(models.CouponsCustomer).filter_by(coupon_key=coupon_key).first()
			x=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_id=q.coupon_id).first()
			effective_time=time.strftime('%Y-%m-%d',time.localtime(q.effective_time))
			uneffective_time=time.strftime('%Y-%m-%d',time.localtime(q.uneffective_time))
			get_date=time.strftime('%Y-%m-%d',time.localtime(q.get_date))
			use_date=time.strftime('%Y-%m-%d',time.localtime(q.use_date))
			shop=self.session.query(models.Shop).filter_by(id=x.shop_id).first()
			x_coupon={"shop_name":shop.shop_name,"shop_code":shop.shop_code,"effective_time":effective_time,"use_rule":x.use_rule,"coupon_key":q.coupon_key,"coupon_money":x.coupon_money,"get_date":get_date,"use_date":use_date,"uneffective_time":uneffective_time,"coupon_status":q.coupon_status}
			data.append(x_coupon)
			return self.render("coupon/coupon-list.html",output_data=data)

#优惠券状态
class CouponStatus(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("coupon/coupon-status.html")

class CouponDetail(CustomerBaseHandler):	
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action:str","coupon_key:str")
	def get(self):
		action=self.args["action"]
		current_customer_id=self.current_user.id
		current_shop_id=self.get_cookie("market_shop_id")
		mcoupon_key=self.args["coupon_key"]
		self.updatecoupon(current_customer_id)
		if action=="detail":
			q=self.session.query(models.CouponsCustomer).filter_by(customer_id=current_customer_id,coupon_key=mcoupon_key).first()
			x_coupon={}
			if q!=None:
				effective_time=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(q.effective_time))
				uneffective_time=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(q.uneffective_time))
				get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(q.get_date))
				use_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(q.use_date))
				# q2=self.session.query(models.Accountinfo).filter_by(id=current_customer_id).first()
				shop=self.session.query(models.Shop).filter_by(id=q.shop_id).first()
				q3=self.session.query(models.CouponsShop).filter_by(shop_id=q.shop_id,coupon_id=q.coupon_id).first()
				x_coupon={"shop_code":shop.shop_code,"shop_logo":shop.shop_trademark_url,"shop_name":shop.shop_name,"effective_time":effective_time,"use_rule":q3.use_rule,"coupon_key":mcoupon_key,"coupon_money":q3.coupon_money,"get_date":get_date,"use_date":use_date,"uneffective_time":uneffective_time,"coupon_status":q.coupon_status}
			return self.render("coupon/coupon-detail.html",output_data=x_coupon)
		elif action=="exchange":
			self.updatecoupon(current_customer_id)
			qused=self.session.query(models.CouponsCustomer).filter_by(coupon_key=mcoupon_key,coupon_type=0).filter(models.CouponsCustomer.coupon_status!=0).first()
			if qused:
				return self.send_fail("Sorry，该优惠券已经被领取了哦~")
			q=self.session.query(models.CouponsCustomer).filter_by(coupon_key=mcoupon_key,coupon_type=0,coupon_status=0).first()
			if q==None:
				return self.send_fail("对不起，您的优惠券码有误！")
			else:
				qq=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_id=q.coupon_id,coupon_type=0,closed=0).first()
				qnum=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=q.coupon_id,customer_id=current_customer_id).count()
				if qq==None:
					return self.send_fail("对不起，该优惠券已经不存在！")
				elif qnum>=qq.get_limit:
					return self.send_fail("对不起，您的领取次数已经超过了领取数量限制！")
				else:
					shop=self.session.query(models.Shop).filter_by(id=q.shop_id).first()
					effective_time=None
					uneffective_time=None
					get_date=int(time.time())
					m_effective_time=None
					m_uneffective_time=None
					m_get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(get_date))
					if qq.valid_way==0:
						uneffective_time=qq.to_valid_date
						effective_time=qq.from_valid_date
						m_effective_time=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(effective_time))
						m_uneffective_time=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(uneffective_time))
					elif qq.valid_way==1:
						all_days=qq.start_day+qq.last_day
						uneffective_time=get_date+all_days*60*60*24
						effective_time=get_date+qq.start_day*24*60*60
					else :
						pass
					q.update(session=self.session,effective_time=effective_time,uneffective_time=uneffective_time,get_date=get_date,customer_id=current_customer_id,coupon_status=1)
					get_number=qq.get_number+1
					qq.update(session=self.session,get_number=get_number)
					self.session.commit()
					use_goods_group=None
					use_goods=None
					if qq.use_goods_group==0:
						use_goods_group="默认分组"
					elif qq.use_goods_group==-1:
						use_goods_group="店铺推荐"
					elif qq.use_goods_group==-2:
						use_goods_group="所有分组"
					else:
						q2=self.session.query(models.GoodsGroup).filter_by(shop_id=current_shop_id,id=qq.use_goods_group).first()
						use_goods_group=q2.name
					if qq.use_goods==-1:
						use_goods="所有商品"
					else:
						q2=self.session.query(models.Fruit).filter_by(shop_id=current_shop_id,id=qq.use_goods).first()
						use_goods=q2.name
					x_coupon={"use_goods_group":use_goods_group,"use_goods":use_goods,"shop_name":shop.shop_name,"effective_time":m_effective_time,"use_rule":qq.use_rule,"coupon_key":mcoupon_key,"coupon_money":qq.coupon_money,"get_date":m_get_date,"uneffective_time":m_uneffective_time,"coupon_status":1}
					return self.send_success(output_data=x_coupon)

class UserLimit():
	def getLimit(self,fruit):
		buy_limit = fruit.buy_limit
		userlimit = 0
		if buy_limit !=0:
			if buy_limit in [1,2]:
				try:
					userlimit = self.session.query(models.CustomerShopFollow.shop_new).filter_by(customer_id=customer_id,shop_id=shop_id).first()[0]+1
				except:
					userlimit = 0
			elif buy_limit == 3:
				if_charge = self.session.query(models.BalanceHistory).filter_by(customer_id=customer_id,shop_id=shop_id,balance_type=0).first()
				
				if if_charge:
					userlimit = 3
				else:
					userlimit = 0
		return buy_limit,userlimit

class CouponCustomer(CustomerBaseHandler):	
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action:str","coupon_id?:int")
	def get(self):
		action=self.args["action"]
		current_customer_id=self.current_user.id
		current_shop_id=self.get_cookie("market_shop_id")
		self.updatecoupon(current_customer_id)
		if action=="get_coupon":
			coupon_id=self.args["coupon_id"]
			x_coupon={}
			q=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_type=0,coupon_status=0).with_lockmode("update").first()
			if q!=None:
				qnum=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=q.coupon_id,customer_id=current_customer_id).count()
				qq=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_id=q.coupon_id).first()
				if qnum>=qq.get_limit:
					return self.send_fail("对不起，您的领取次数已经超过了领取数量限制！")
				shop=self.session.query(models.Shop).filter_by(id=q.shop_id).first()
				effective_time=None
				uneffective_time=None
				get_date=int(time.time())
				if get_date<qq.from_get_date:
					return self.send_fail("对不起，该优惠券还没有到领取时间")
				elif get_date>qq.to_get_date:
					return self.send_fail(" 对不起，该优惠券已过了领取时间")
				m_effective_time=None
				m_uneffective_time=None
				m_get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(get_date))
				if qq.valid_way==0:
					uneffective_time=qq.to_valid_date
					effective_time=qq.from_valid_date
					m_effective_time=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(effective_time))
					m_uneffective_time=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(uneffective_time))
				elif qq.valid_way==1:
					all_days=qq.start_day+qq.last_day
					uneffective_time=get_date+all_days*60*60*24
					effective_time=get_date+qq.start_day*24*60*60
				else :
					pass
				q.update(session=self.session,effective_time=effective_time,uneffective_time=uneffective_time,get_date=get_date,customer_id=current_customer_id,coupon_status=1)
				get_number=qq.get_number+1
				qq.update(self.session,get_number=get_number)
				self.session.commit()
				x_coupon={"shop_code":shop.shop_code,"shop_name":shop.shop_name,"shop_logo":shop.shop_trademark_url,"effective_time":m_effective_time,"use_rule":qq.use_rule,"coupon_key":q.coupon_key,"coupon_money":qq.coupon_money,"get_date":m_get_date,"uneffective_time":m_uneffective_time,"coupon_status":1}
				return self.send_success(coupon_money=qq.coupon_money,coupon_key=q.coupon_key)
			else:
				return self.send_fail("对不起，这批优惠券已经被抢空了，下次再来哦！")
#秒杀
class Seckill(CustomerBaseHandler,UserLimit):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("activity_id?:int")
	def get(self,shop_code):
		shop_id = self.session.query(models.Shop).filter_by(shop_code = shop_code).first().id
		self.update_seckill()
		if 'activity_id' in self.args:
			activity_id = self.args['activity_id']
			activity_list = self.session.query(models.SeckillActivity).filter_by(shop_id = shop_id,id = activity_id).filter(models.SeckillActivity.activity_status.in_([1,2])).all()
		else:
			activity_list = self.session.query(models.SeckillActivity).filter_by(shop_id = shop_id).filter(models.SeckillActivity.activity_status.in_([1,2])).order_by(models.SeckillActivity.start_time).all()

		activity_num = len(activity_list)

		start_date_list = []
		for activity in activity_list:
			date_text = time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(activity.start_time))[0:10]
			start_date_list.append(date_text)
		start_date_list = set(start_date_list)

		daily_list = {}
		for start_date in start_date_list:
			daily_list[start_date] = []

		for activity in activity_list:
			data = {}
			activity_id = activity.id
			data['activity_id'] = activity_id
			data['start_time'] = activity.start_time
			data['start_time_text'] = time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(activity.start_time))[11:16]
			data['continue_time'] = activity.continue_time
			date_text = time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(activity.start_time))[0:10]

			now_time_text = time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(int(time.time())))[0:10]
			if date_text == now_time_text:
				data['date_text'] = '今天'
			elif date_text[0:8] == now_time_text[0:8] and int(date_text[8:10]) == int(now_time_text[8:10])+1:
				data['date_text'] = '明天'
			else:
				tmp = date_text
				data['date_text'] = str(int(tmp[5:7])) + '月' + str(int(tmp[8:10]))  +'日'

			daily_list[date_text].append(data)

		output_data = []
		for key in daily_list:
			data = ['',[],0]
			data[0] = daily_list[key][0]['date_text']
			data[1] = daily_list[key]
			data[2] = daily_list[key][0]['start_time'] #just for sorting
			output_data.append(data)
		output_data.sort(key = lambda item:item[2],reverse=False)

		for i in range(len(output_data)):
			output_data[i][1].sort(key = lambda item:item['start_time'],reverse=False)

		seckill_goods_ids = []
		killing_activity_query = self.session.query(models.SeckillActivity).filter_by(shop_id = shop_id,activity_status = 2).all()
		seckill_activity = []
		for item in killing_activity_query:
			seckill_activity.append(item.id)
		customer_id=self.current_user.id
		seckill_goods_query = self.session.query(models.SeckillGoods).join(models.CustomerSeckillGoods,models.CustomerSeckillGoods.seckill_goods_id == models.SeckillGoods.id).\
							filter(models.SeckillGoods.activity_id.in_(seckill_activity),models.SeckillGoods.status != 0,models.CustomerSeckillGoods.status == 1).all()
		for item in seckill_goods_query:
			seckill_goods_ids.append(item.id)

		query = self.session.query(models.Cart).filter_by(id = customer_id,shop_id = shop_id).first()
		if query:
			fruits = eval(query.fruits)
		else:
			fruits = {}
		return self.render("seckill/seckill.html",output_data=output_data,activity_num=activity_num,shop_code=shop_code,context=dict(seckill_goods_ids=seckill_goods_ids,fruits=fruits))
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action:str","activity_id?:int")
	def post(self,shop_code):
		self.update_seckill()
		action = self.args['action']
		activity_id = self.args['activity_id']
		shop_id = self.session.query(models.Shop).filter_by(shop_code = shop_code).first().id

		output_data = []
		goods_list = self.session.query(models.SeckillGoods).filter_by(activity_id = activity_id).filter(models.SeckillGoods.status != 0).all()
		for goods in goods_list:
			goods_item = {}
			goods_seckill_id = goods.id
			goods_item['goods_seckill_id'] = goods_seckill_id
			goods_item['fruit_id'] = goods.fruit_id

			customer_id = self.current_user.id
			is_bought = self.session.query(models.CustomerSeckillGoods).filter_by(customer_id=customer_id,seckill_goods_id=goods_seckill_id).filter(models.CustomerSeckillGoods.status != 0).first()
			if not is_bought:
				goods_item['is_bought'] = 0
			else:
				goods_item['is_bought'] = 1

			cur_goods = self.session.query(models.Fruit).filter_by(id = goods.fruit_id).first()

			goods_item['buylimit'] = self.getLimit(cur_goods)[0]
			goods_item['userlimit'] = self.getLimit(cur_goods)[1]
			if cur_goods.img_url:
				goods_item['img_url'] = cur_goods.img_url.split(';')[0]
			else:
				goods_item['img_url'] = ""
			goods_item['goods_name'] = cur_goods.name
			goods_item['charge_type_id'] = goods.seckill_charge_type_id

			cur_charge_type = self.session.query(models.ChargeType).filter_by(id = goods.charge_type_id).first()
			if int(cur_charge_type.num) == cur_charge_type.num:
				cur_charge_type_num = int(cur_charge_type.num)
			else:
				cur_charge_type_num = cur_charge_type.num
			goods_item['charge_type_text'] = str(goods.seckill_price) + '元' + '/' + str(cur_charge_type_num) + self.getUnit(cur_charge_type.unit)
			goods_item['price_dif'] = round(float(goods.former_price - goods.seckill_price),2)
			if goods.activity_piece  - goods.ordered > 0:
				goods_item['activity_piece'] = goods.activity_piece  - goods.ordered
			else:
				goods_item['activity_piece'] = 0
			output_data.append(goods_item)

		return self.send_success(output_data = output_data)

# 限时折扣
class Discount(CustomerBaseHandler,UserLimit):
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action:str")
	def get(self,shop_code):
		current_shop_id=self.get_cookie("market_shop_id")
		shop=self.session.query(models.Shop).filter_by(id=current_shop_id).first()
		current_customer_id=self.current_user.id
		self.updatediscount()
		action=self.args["action"]
		if action=="detail":
			q_cart=self.session.query(models.Cart).filter_by(id=current_customer_id,shop_id=current_shop_id).first()
			fruits={}
			if q_cart:
				fruits=eval(q_cart.fruits)
			q=self.session.query(models.DiscountShopGroup).filter_by(shop_id=current_shop_id,status=1).all()
			data=[]
			data1=[]
			if_all=0 #判断是否有针对所有商品或者某个分组的所有商品 0 ：没有 1：表示所有商品 2：表示某一分组的所有商品
			for x in q:
				end_time=0
				if x.discount_way==0:
					end_time=x.end_date
				else:
					now=datetime.datetime.now()
					now2=datetime.datetime(now.year,now.month,now.day)
					end_time=x.t_time+time.mktime(now2.timetuple())
					if end_time<0:
						end_time=0
				qq=self.session.query(models.DiscountShop).filter_by(shop_id=current_shop_id,discount_id=x.discount_id,status=1).all()
				for y in qq:
					chargesingle=[]
					if y.use_goods_group==-2:
						if_all=1
						data=[]
						fruit=self.session.query(models.Fruit).filter_by(shop_id=current_shop_id,active=1).all()
						for each_frut in fruit:
							for charge in each_frut.charge_types:
								if charge.active==1 and charge.activity_type==2:
									charge_storage=int(each_frut.storage/charge.relate/charge.num)
									if fruits and charge.id in fruits:
										count=fruits[charge.id]
									else:
										count=0
									x_charge={"charge_id":charge.id,"charge":str(round(charge.price*y.discount_rate/10,2))+'元/'+str(charge.num)+self.getUnit(charge.unit),"charge_storage":charge_storage,"count":count}
									chargesingle.append(x_charge)
							if each_frut.img_url:
								img_url = each_frut.img_url.split(';')[0]
							else:
								img_url= ""
							buylimit = self.getLimit(each_frut)[0]
							userlimit = self.getLimit(each_frut)[1]
							tmp={"discount_rate":y.discount_rate,"goods_id":each_frut.id,"goods_name":each_frut.name,"charge_types":chargesingle,"storage":each_frut.storage,"img_url":img_url,"buylimit":buylimit,"userlimit":userlimit}
							data1.append(tmp)
							chargesingle=[]
						data0={"end_time":end_time,"group_data":data1}
						data1=[]
						data.append(data0)
						break
					elif y.use_goods==-1:
						if_all=2
						fruit=self.session.query(models.Fruit).filter_by(shop_id=current_shop_id,active=1,group_id=y.use_goods_group).all()
						for each_frut in fruit:
							for charge in each_frut.charge_types:
								if charge.active==1 and charge.activity_type==2:
									charge_storage=int(each_frut.storage/charge.relate/charge.num)
									if fruits and charge.id in fruits:
										count=fruits[charge.id]
									else:
										count=0
									x_charge={"charge_id":charge.id,"charge":str(round(charge.price*y.discount_rate/10,2))+'元/'+str(charge.num)+self.getUnit(charge.unit),"charge_storage":charge_storage,"count":count}
									chargesingle.append(x_charge)
							if each_frut.img_url:
								img_url = each_frut.img_url.split(';')[0]
							else:
								img_url= ""
							buylimit = self.getLimit(each_frut)[0]
							userlimit = self.getLimit(each_frut)[1]
							tmp={"discount_rate":y.discount_rate,"goods_id":each_frut.id,"goods_name":each_frut.name,"charge_types":chargesingle,"storage":each_frut.storage,"img_url":img_url,"buylimit":buylimit,"userlimit":userlimit}
							data1.append(tmp)
							chargesingle=[]
						data0={"end_time":end_time,"group_data":data1}
						data1=[]	
						data.append(data0)
						break
					else:
						fruit=self.session.query(models.Fruit).filter_by(id=y.use_goods).first()
						charge_type=eval(y.charge_type)
						ChargeType=self.session.query(models.ChargeType).filter(models.ChargeType.id.in_(charge_type)).all()
						for charge in ChargeType:
							if charge.active==1 and charge.activity_type==2:
								charge_storage=int(fruit.storage/charge.relate/charge.num)
								if fruits and charge.id in fruits:
									count=fruits[charge.id]
								else:
									count=0
								x_charge={"charge_id":charge.id,"charge":str(round(charge.price*y.discount_rate/10,2))+'元',"src_price":charge.price+"元","charge_unit":'/'+str(charge.num)+self.getUnit(charge.unit),"charge_storage":charge_storage,"count":count}
								chargesingle.append(x_charge)
						if fruit.img_url:
							img_url = fruit.img_url.split(';')[0]
						else:
							img_url= ""
						buylimit = self.getLimit(fruit)[0]
						userlimit = self.getLimit(fruit)[1]
						tmp={"discount_rate":y.discount_rate,"goods_id":y.use_goods,"goods_name":fruit.name,"charge_types":chargesingle,"storage":fruit.storage,"img_url":img_url,"buylimit":buylimit,"userlimit":userlimit}
						data1.append(tmp)
						chargesingle=[]
						data0={"end_time":end_time,"group_data":data1}
						data1=[]
						data.append(data0)
				if if_all==1:
					break
			return self.render("seckill/discount.html",shop_code=shop_code,output_data=data,context=dict(fruits=fruits))

		elif action=="add_in_cart":
			pass
		elif action=="add_in_order":
			pass
		elif action=="pay_order":
			pass
#团购
class Gbuy(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("seckill/gbuy.html")
#预售
class Presell(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("seckill/presell.html")
#团购详情
class GbuyDetail(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self,shop_code,goods_id):
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code=shop_code).first()
		except:
			return self.send_error(404)

		if shop:
			self.set_cookie("market_shop_id", str(shop.id))  # 执行完这句时浏览器的cookie并没有设置好，所以执行get_cookie时会报错
			self._shop_code = shop.shop_code
			self.set_cookie("market_shop_code",str(shop.shop_code))
			shop_name = shop.shop_name
			shop_code = shop.shop_code
		else:
			shop_name =''
			return self.send_error(404)
			
		good = self.session.query(models.Fruit).filter_by(id=goods_id).first()
		try:
			favour = self.session.query(models.FruitFavour).filter_by(customer_id = self.current_user.id,f_m_id = goods_id,type = 0).first()
		except:
			favour = None
		if favour is None:
			good.favour_today = False
		else:
			good.favour_today = favour.create_date == datetime.date.today()

		if good:
			if good.img_url:
				img_url= good.img_url.split(";")
			else:
				img_url= ''
		else:
			good = []
			img_url = ''

		charge_types= []
		for charge_type in good.charge_types:
			if charge_type.active != 0:
				unit  = charge_type.unit
				unit =self.getUnit(unit)
				limit_today = False
				allow_num = ''
				try:
					limit_if = self.session.query(models.GoodsLimit).filter_by(charge_type_id = charge_type.id,customer_id = self.current_user.id)\
					.order_by(models.GoodsLimit.create_time.desc()).first()
				except:
					limit_if = None
				if limit_if and good.limit_num !=0:
					time_now = datetime.datetime.now().strftime('%Y-%m-%d')
					create_time = limit_if.create_time.strftime('%Y-%m-%d')
					if time_now == create_time:
						limit_today = True
						if limit_if.limit_num == good.limit_num:
							allow_num = limit_if.allow_num
						else:
							allow_num = good.limit_num - limit_if.buy_num
				charge_types.append({'id':charge_type.id,'price':charge_type.price,'num':charge_type.num, 'unit':unit,\
					'market_price':charge_type.market_price,'relate':charge_type.relate,"limit_today":limit_today,"allow_num":allow_num})
		if not self.session.query(models.Cart).filter_by(id=self.current_user.id, shop_id=shop.id).first():
			self.session.add(models.Cart(id=self.current_user.id, shop_id=shop.id))  # 如果没有购物车，就增加一个
			self.session.commit()
		cart_f = self.read_cart(shop.id)
		cart_fs = [(key, cart_f[key]['num']) for key in cart_f]
		cart_count = len(cart_f)
		self.set_cookie("cart_count", str(cart_count))
		return self.render('seckill/gbuy-detail.html',good=good,img_url=img_url,shop_name=shop_name,charge_types=charge_types,cart_fs=cart_fs)	