from handlers.base import CustomerBaseHandler,WxOauth2
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
					filter_by(customer_id = customer_id,shop_id=shop_id).order_by(models.ConfessionWall.create_time.desc()).offset(page*page_size).limit(page_size).all()
				except:
					print("haven't public any confession")
			elif action == "receive":
				try:
					data = self.session.query(models.ConfessionWall).\
					filter_by(other_phone = self.current_user.accountinfo.phone).order_by(models.ConfessionWall.create_time.desc()).offset(page*page_size).limit(page_size).all()
				except:
					print("current_user didn't tie the cell phone")
			elif action == "comment":
				try:
					data = self.session.query(models.ConfessionWall).\
					join(models.ConfessionComment,models.ConfessionWall.id == models.ConfessionComment.wall_id).order_by(models.ConfessionWall.create_time.desc()).offset(page*page_size).limit(page_size).all()
				except:
					print("current_user didn't comment any confession")
			for d in data:
				info = self.session.query(models.Customer).filter_by(id=d.customer_id).first()
				user = info.accountinfo.nickname
				sex = info.accountinfo.sex
				imgurl = info.accountinfo.headimgurl_small
				time = d.create_time.strftime('%Y-%m-%d %H:%M:%S')
				datalist.append({'user':user,'imgurl':imgurl,'time':time,'name':d.other_name,\
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
		if action == "get":
			page_size = 10
			page = self.args["page"]
			nomore = False
			datalist = []
			confession = self.session.query(models.ConfessionWall).filter_by(shop_id=shop_id).\
			order_by(models.ConfessionWall.create_time.desc()).offset(page*page_size).limit(page_size).all()
			for data in confession:
				info = self.session.query(models.Customer).filter_by(id=data.customer_id).first()
				user = info.accountinfo.nickname
				imgurl = info.accountinfo.headimgurl_small
				sex = info.accountinfo.sex
				time = data.create_time.strftime('%Y-%m-%d %H:%M:%S')
				datalist.append({'user':user,'imgurl':imgurl,'time':time,'name':data.other_name,\
					'type':data.confession_type,'confession':data.confession,'great':data.great,'comment':data.comment,'floor':data.floor,'sex':sex})
			if datalist == [] or len(datalist) < page_size:
				nomore = True
			return self.send_success(datalist=datalist,nomore=nomore)
		elif action =="great":
			confession = self.session.query(models.ConfessionWall).filter_by( id = self.args["data"]["id"]).first()
			great = models.ConfessionGreat(
				wall_id = self.args["data"]["id"],
				customer_id = self.current_user.id
			)
			confession.great = confession.great +1
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
			confession.conmment = confession.conmment +1
			self.session.add(comment)
			self.session.commit()
			return self.send_success()

class ConfessionPublic(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self,shop_code):
		return self.render('confession/public.html',shop_code=shop_code)

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("data")
	def post(self,shop_code):
		data = self.args["data"]
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code =shop_code).first()
		except:
			return self.send_fail('shop error')
		if shop:
			shop_id = shop.id
		else :
			return self.send_fail('shop error')
		floor = 0
		try:
			shop = self.session.query(models.Shop).filter_by(id = shop_id).first()
		except:
			return self.send_fail('店铺不存在')
		try:
			floor = self.session.query(models.ConfessionWall).filter_by(shop_id = shop.id).count()
			floor = floor+1
		except:
			floor = 0
		shop_id = shop.id
		confession = models.ConfessionWall(
			customer_id = self.current_user.id,
			shop_id = shop_id,
			other_name = data["name"],
			other_phone = data["phone"],
			confession_type = int(data["type"]),
			confession = data["confession"],
			floor = floor
		)
		self.session.add(confession)
		self.session.commit()
		return self.send_success()

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
		else :
			return self.send_fail('shop error')
		pub_count = self.session.query(models.ConfessionWall).filter_by(customer_id = customer_id,shop_id=shop_id).count()
		receive_count = self.session.query(models.ConfessionWall).filter_by(other_phone = self.current_user.accountinfo.phone).count()
		comment_count =  self.session.query(models.ConfessionWall).\
		join(models.ConfessionComment,models.ConfessionWall.id == models.ConfessionComment.wall_id).distinct().count()
		return self.render('confession/center.html',pub_count=pub_count,receive_count=receive_count,comment_count=comment_count,shop_code=shop_code)

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
			datalist.append({'time':d.create_time.strftime('%Y-%m-%d %H:%M:%S'),'confession':d.confession,'name':d.other_name,\
				'fromwho':fromwho,'imgurl':imgurl,'type':d.confession_type})
		if datalist == [] or len(datalist) < page_size:
			nomore = True
		if page == 0:
			if len(datalist)<page_size:
				nomore = True
			return self.render("confession/list.html", datalist=datalist,action=action,nomore=nomore)
		else :
			return self.send_success(datalist = datalist,nomore=nomore)