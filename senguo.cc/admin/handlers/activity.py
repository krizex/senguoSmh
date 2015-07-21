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
					print("haven't public any confession")
			elif action == "receive":
				try:
					data = self.session.query(models.ConfessionWall).\
					filter_by(other_phone = self.current_user.accountinfo.phone,shop_id=shop_id,status = 1).order_by(models.ConfessionWall.create_time.desc()).offset(page*page_size).limit(page_size).all()
				except:
					print("current_user didn't tie the cell phone")
			elif action == "comment":
				try:
					data = self.session.query(models.ConfessionWall).\
					join(models.ConfessionComment,models.ConfessionWall.id == models.ConfessionComment.wall_id).filter(models.ConfessionWall.status == 1,models.ConfessionWall.shop_id == shop_id,models.ConfessionComment.customer_id==customer_id).distinct().order_by(models.ConfessionWall.create_time.desc()).offset(page*page_size).limit(page_size).all()
				except:
					print("current_user didn't comment any confession")
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
				print("haven't public any confession")
		elif action == "receive":
			try:
				data = self.session.query(models.ConfessionWall).\
				filter_by(other_phone = self.current_user.accountinfo.phone).offset(page*page_size).limit(page_size).all()
			except:
				print("current_user didn't tie the cell phone")
		elif action == "comment":
			try:
				data = self.session.query(models.ConfessionWall).\
				join(models.ConfessionComment,models.ConfessionWall.id == models.ConfessionComment.wall_id).offset(page*page_size).limit(page_size).all()
			except:
				print("current_user didn't comment any confession")
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
class Coupon(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("coupon/coupon.html")

#我的优惠券		
class CouponProfile(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("coupon/coupon-profile.html")
#优惠券列表		
class CouponList(AdminBaseHandler):
	def updatecoupon(self):
		current_customer_id=self.current_user.id
		current_shop_id=self.current_shop.id
		now_date=int(time.time())
		q=self.session.query(models.CouponsCustomer).with_lockmode('update').filter_by(shop_id=current_shop_id,customer_id=current_customer_id).all()
		for x in q:
			qq=self.session.query(models.CouponsShop).with_lockmode('update').filter_by(shop_id=current_shop_id,coupon_id=x.coupon_id,closed=0).first()
			if  qq!=None:
				if now_date>qq.to_get_date:
					qq.closed=1
				if now_date>x.uneffective_time and x.coupon_status>0:
					x.update(coupon_status=3)
				self.session.commit()	
		self.session.commit()
		return None			
	def getcoupon(self,coupon_status,data):
		current_customer_id=self.current_user.id
		current_shop_id=self.current_shop.id
		q=self.session.query(models.CouponsCustomer).filter_by(customer_id=current_customer_id,coupon_status=coupon_status).all()
		for x in q:
			effective_time=time.strftime('%Y-%m-%d',time.localtime(x.effective_time))
			uneffective_time=time.strftime('%Y-%m-%d',time.localtime(x.uneffective_time))
			get_date=time.strftime('%Y-%m-%d',time.localtime(x.get_date))
			use_date=time.strftime('%Y-%m-%d',time.localtime(x.use_date))
			shop=self.session.query(models.Shop).filter_by(id=x.shop_id).first()
			q1=self.session.query(models.CouponsShop).filter_by(shop_id=x.shop_id,coupon_id=x.coupon_id).first()
			x_coupon={"shop_name":shop.shop_name,"shop_code":shop.shop_code,"effective_time":effective_time,"use_rule":q1.use_rule,"coupon_key":x.coupon_key,"coupon_money":q1.coupon_money,"get_date":get_date,"use_date":use_date,"uneffective_time":uneffective_time,"coupon_status":x.coupon_status}
			data.append(x_coupon)
		return None
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action?:str")
	def get(self):
		action=self.args["action"]
		current_customer_id=self.current_user.id
		current_shop_id=self.current_shop.id
		self.updatecoupon()
		data=[]
		for x in range(1,3):
			self.getcoupon(x,data)
		return self.render("coupon/coupon-list.html",output_data=data)
#优惠券状态
class CouponStatus(AdminBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("coupon/coupon-status.html")

class CouponDetail(AdminBaseHandler):
	def updatecoupon(self):
		current_customer_id=self.current_user.id
		current_shop_id=self.current_shop.id
		now_date=int(time.time())
		q=self.session.query(models.CouponsCustomer).with_lockmode('update').filter_by(shop_id=current_shop_id,customer_id=current_customer_id).all()
		for x in q:
			qq=self.session.query(models.CouponsShop).with_lockmode('update').filter_by(shop_id=current_shop_id,coupon_id=x.coupon_id,closed=0).first()
			if  qq!=None:
				if now_date>qq.to_get_date:
					qq.closed=1
				if now_date>x.uneffective_time and x.coupon_status>0:
					x.update(coupon_status=3)
				self.session.commit()	
		self.session.commit()
		return None			
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action:str","coupon_key:str")
	def get(self):
		action=self.args["action"]
		current_customer_id=self.current_user.id
		current_shop_id=self.current_shop.id
		mcoupon_key=self.args["coupon_key"]
		self.updatecoupon()
		if action=="detail":
			q=self.session.query(models.CouponsCustomer).filter_by(customer_id=current_customer_id,coupon_key=mcoupon_key).first()
			x_coupon={}
			if q!=None:
				effective_time=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(q.effective_time))
				uneffective_time=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(q.effective_time))
				get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(q.get_date))
				use_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(q.use_date))
				q2=self.session.query(models.Accountinfo).filter_by(id=current_customer_id).first()
				shop=self.session.query(models.Shop).filter_by(id=current_shop_id).first()
				q3=self.session.query(models.CouponsShop).filter_by(shop_id=q.shop_id,coupon_id=q.coupon_id).first()
				x_coupon={"shop_code":shop.shop_code,"shop_logo":q2.headimgurl,"shop_name":shop.shop_name,"effective_time":effective_time,"use_rule":q3.use_rule,"coupon_key":mcoupon_key,"coupon_money":q3.coupon_money,"get_date":get_date,"use_date":use_date,"uneffective_time":uneffective_time,"coupon_status":q.coupon_status}
			return self.render("coupon/coupon-detail.html",output_data=x_coupon)
		elif action=="exchange":
			q=self.session.query(models.CouponsCustomer).filter_by(coupon_key=mcoupon_key,coupon_status=0).first()
			if q==None:
				return self.send_fail("对不起，您的优惠券码有错误！")
			else:
				qq=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_id=q.coupon_id,coupon_type=q.coupon_type,closed=0).first()
				if qq==None:
					return self.send_fail("对不起，您的优惠券码对应优惠券已经被停用！")
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
					print(uneffective_time)
					q.update(session=self.session,effective_time=effective_time,uneffective_time=uneffective_time,get_date=get_date,customer_id=current_customer_id,coupon_status=1)
					get_number=qq.get_number+1
					qq.update(session=self.session,get_number=get_number)
					self.session.commit()
					x_coupon={"shop_name":shop.shop_name,"effective_time":m_effective_time,"use_rule":qq.use_rule,"coupon_key":mcoupon_key,"coupon_money":qq.coupon_money,"get_date":m_get_date,"uneffective_time":m_uneffective_time,"coupon_status":1}
					return self.send_success(output_data=x_coupon)
		# elif action=="":
		# 	q=self.session.query(models.CouponsCustomer).filter_by(customer_id=customer_id,coupon_key=mcoupon_key)
		# 	if q!=None:
		# 		x_coupon={"coupon_money":q.coupon_money,"get_date":q.get_date,"uneffective_time":q.uneffective_time,"if_used":q.if_used}
		# 		data.append(x_coupon)
		# 	return self.render("coupon/detail.html",output_data=data)
		# elif action=="grab":
		# 	pass
class CouponCustomer(AdminBaseHandler):
	def updatecoupon(self):
		current_customer_id=self.current_user.id
		current_shop_id=self.current_shop.id
		now_date=int(time.time())
		q=self.session.query(models.CouponsCustomer).with_lockmode('update').filter_by(shop_id=current_shop_id,customer_id=current_customer_id).all()
		for x in q:
			qq=self.session.query(models.CouponsShop).with_lockmode('update').filter_by(shop_id=current_shop_id,coupon_id=x.coupon_id,closed=0).first()
			if  qq!=None:
				if now_date>qq.to_get_date:
					qq.closed=1
				if now_date>x.uneffective_time and x.coupon_status>0:
					x.update(coupon_status=3)
				self.session.commit()	
		self.session.commit()
		return None			
	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("action:str","coupon_id?:int")
	def get(self):
		action=self.args["action"]
		current_customer_id=self.current_user.id
		currennt_shop_id=self.current_shop.id
		self.updatecoupon()
		if action=="show":
			now_date=int(time.time())
			data=[]
			q=self.session.query(models.CouponsShop).filter_by(shop_id=currennt_shop_id,coupon_type=0,closed=0).all()
			for x in q:
				if x.from_get_date<now_date and x.to_get_date>now_date:
					if q.use_goods_group==0:
						use_goods_group="默认分组"
					elif q.use_goods_group==-1:
						use_goods_group="店铺推荐"
					else:
						q1=self.session.query(models.GoodsGroup).filter_by(shop_id=current_shop_id,id=q.use_goods_group).first()
						use_goods_group=q1.name
					q1=self.session.query(models.Fruit).filter_by(shop_id=current_shop_id,id=q.use_goods).first()
					use_goods=q1.name
					from_valid_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(q.from_valid_date))
					to_valid_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(q.to_valid_date))
					x_coupon={"coupon_id":q.coupon_id,"coupon_money":q.coupon_money,"get_limit":q.get_limit,"use_rule":q.use_rule,"use_goods_group":use_goods_group,"use_number":q.use_number,\
						"get_number":q.get_number,"total_number":q.total_number,"use_goods":use_goods,"from_valid_date":from_valid_date,"to_valid_date":to_valid_date}
					data.append(x_coupon)
				else:
					pass
		elif action=="grub":
			coupon_id=self.args["coupon_id"]
			x_coupon={}
			q=self.session.query(models.CouponsShop).filter_by(shop_id=current_shop_id,coupon_id=coupon_id,coupon_type=0,coupon_status=0).first()
			if q!=None:
				shop=self.session.query(models.Shop).filter_by(id=q.shop_id).first()
				effective_time=None
				uneffective_time=None
				get_date=int(time.time())
				m_effective_time=None
				m_uneffective_time=None
				m_get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(get_date))
				if q.valid_way==0:
					uneffective_time=q.uneffective_time
					effective_time=q.effective_time
					m_effective_time=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(effective_time))
					m_uneffective_time=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(uneffective_time))
				elif q.valid_way==1:
					all_days=q.start_day+q.last_day
					uneffective_time=get_date+all_days*60*60*24
					effective_time=get_date+q.start_day*24*60*60
				else :
					pass
				self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=q.coupon_id).first().update(session=self.session,effective_time=effective_time,uneffective_time=uneffective_time,get_date=get_date,customer_id=customer_id,coupon_status=1)
				get_number=q.get_number+1
				q.update(get_number=get_number)
				self.session.commit()
				x_coupon={"shop_name":shop.shop_name,"effective_time":m_effective_time,"use_rule":qq.use_rule,"coupon_key":mcoupon_key,"coupon_money":qq.coupon_money,"get_date":m_get_date,"uneffective_time":m_uneffective_time,"coupon_status":1}
			return self.send_success(output_data=x_coupon)

		elif action=="can_use":
			data=[]
			q=self.session.query(models.CouponsCustomers).filter_by(customer_id=current_shop_id,shop_id=current_shop_id,coupon_status=1).all()
			number=0
			for x in q:
				effective_time=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.effective_time))
				uneffective_time=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.uneffective_time))
				get_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.get_date))
				use_date=time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(x.use_date))
				shop=self.session.query(models.Shop).filter_by(id=x.shop_id).first()
				q1=self.session.query(models.CouponsShop).filter_by(shop_id=x.shop_id,coupon_id=x.coupon_id).first()
				x_coupon={"shop_name":shop.shop_name,"effective_time":effective_time,"use_rule":q1.use_rule,"coupon_key":mcoupon_key,"x.coupon_money":q1.coupon_money,"get_date":get_date,"use_date":use_date,"uneffective_time":uneffective_time,"coupon_status":x.coupon_status}
				data.append(x_coupon)
				number+=1
			return self.send_success(output_data=data,number=number)
		elif action=="use":
			coupon_ids=self.args["coupon_ids"]
			for x in coupon_ids:
				use_date=int(time.time())
				q=self.session.query(models.CouponsCustomer).filter_by(shop_id=current_shop_id,coupon_id=x).first()
				if  use_date:
					pass
				q.update(session=self.session,use_date=use_date,order_id=order_id,coupon_status=2)
				new_coupon=models.CouponsCustomer(shop_id=current_shop_id,coupon_id=x,use_date=use_date,coupon_status=2)
				self.session.merge(new_coupon)
				use_number=self.session.query(shop_id=current_shop_id,coupon_id=x).first().use_number+1
				merge_coupon=models.CouponsShop(shop_id=current_shop_id,coupon_id=x,get_number=use_number)
				self.session.merge(merge_coupon)
			self.session.commit()
			return self.send_success()

