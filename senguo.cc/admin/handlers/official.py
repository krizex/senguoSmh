from handlers.base import FruitzoneBaseHandler,WxOauth2
import dal.models as models
import tornado.web
from settings import *
import datetime, time
from sqlalchemy import desc, and_, or_
import qiniu
import random
import base64
import json

class Home(FruitzoneBaseHandler):
	def get(self):
		# print(self)
		shop_count = self.get_shop_count()
		return self.render("official/home.html",context=dict(shop_count = shop_count,subpage="home"))

class About(FruitzoneBaseHandler):
	def get(self):
		return self.render("official/about.html",context=dict(subpage="about"))

class Product(FruitzoneBaseHandler):
	def get(self):
		return self.render("official/product.html",context=dict(subpage="product"))		

class ShopList(FruitzoneBaseHandler):
	def get(self):
		# print(self)
		shop_count = self.get_shop_count()
		shop_province = self.get_shop_group()
		return self.render("official/shoplist.html",context=dict(shop_count = shop_count, shop_province = shop_province,\
		 subpage="shop"))
	 
	@FruitzoneBaseHandler.check_arguments("action")	   
	def post(self):
		action = self.args['action']
		if action == 'filter':
			return self.handle_filter()
		elif action == 'search':
			return self.handler_search()
		elif action == 'shop':
			return self.handle_shop()
		elif action == 'top':
			return self.handle_top()
		else:
			return self.send_error(403)
	def handle_top(self):
		try:
			q = self.session.query(models.Shop).order_by(desc(models.Shop.id))\
			.filter(models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
				models.Shop.shop_code !='not set' )
		except:
			return self.send_fail("shoplist error")
		shops = []

		for shop in q:
			# try:
			# 	order_count = self.session.query(models.Order).filter_by(shop_id=shop.id).count()
			# except:
			# 	print("[官网店铺列表]错误")
			# 	return self.send_fail('order_count error')
			# if order_count:
			# 	shop.order_count = order_count
			# 	self.session.commit()
			# else:
			# 	shop.order_count = 0
			shops.append(dict(shop_name=shop.shop_name,shop_code = shop.shop_code,\
				shop_province = shop.shop_province ,shop_city = shop.shop_city ,\
				shop_address_detail = shop.shop_address_detail,\
				shop_intro = shop.shop_intro ,shop_trademark_url=shop.shop_trademark_url,\
				order_count = shop.order_count,shop_admin_name = shop.admin.accountinfo.nickname))
		shops = sorted(shops,key = lambda x:x['order_count'],reverse = True)
		# shops = shops.sort(key = lambda x:x['order_count'])
		shoplist = shops[0:8]
		return self.send_success(shoplist = shoplist)


	@FruitzoneBaseHandler.check_arguments("page?:int",'province?:int','city?:int')
	def handle_filter(self):
		_page_count = 8
		page = self.args["page"] - 1
		q = self.session.query(models.Shop).order_by(desc(models.Shop.id)).\
			filter(models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
				models.Shop.shop_code !='not set' )
		# if "city" in self.args:
		#     q = q.filter_by(shop_city=self.args["city"])
		#     shop_count = q.count()
		#     #print('shop_count',shop_count)
		#     page_total = int(shop_count /10) if shop_count % 10 == 0 else int(shop_count/10) +1
		#     #print('page_total',page_total)
		#     q = q.offset(page * _page_count).limit(_page_count).all()
			
		if "province" in self.args:
			# print('province')
			q = q.filter_by(shop_province=self.args["province"])
			shop_count = q.count()
			page_total = int(shop_count /8) if shop_count % 8 == 0 else int(shop_count/8) +1
			q = q.offset(page * _page_count).limit(_page_count).all()
		else:
			print("[官网店铺列表]省份不存在")

		shoplist = []
		for shop in q:
			shoplist.append(dict(shop_name=shop.shop_name,shop_code = shop.shop_code,\
				shop_province = shop.shop_province ,shop_city = shop.shop_city ,\
				shop_address_detail = shop.shop_address_detail,\
				shop_intro = shop.shop_intro ,shop_trademark_url=shop.shop_trademark_url,\
				shop_admin_name = shop.admin.accountinfo.nickname))
		return self.send_success(shoplist=shoplist,page_total = page_total)
	@FruitzoneBaseHandler.check_arguments("q?:str",'page?:int')
	def hander_search(self):
		_page_count = 8
		page = self.args["page"] - 1
		q = self.session.query(models.Shop).order_by(desc(models.Shop.id)).\
			filter(models.Shop.shop_name.like("%{0}%".format(self.args["q"])),
					models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
					models.Shop.shop_code !='not set' )
		shoplist = []
		shop_count = q.count()
		page_total = int(shop_count /8) if shop_count % 8 == 0 else int(shop_count/8) +1
		q = q.offset(page * _page_count).limit(_page_count).all()
		
		for shop in q:
			shoplist.append(dict(shop_name=shop.shop_name,shop_code = shop.shop_code,\
				shop_province = shop.shop_province ,shop_city = shop.shop_city ,\
				shop_address_detail = shop.shop_address_detail,\
				shop_intro = shop.shop_intro ,shop_trademark_url=shop.shop_trademark_url,\
				shop_admin_name = shop.admin.accountinfo.nickname))
		return self.send_success(shoplist=shoplist ,page_total = page_total)



class Article(FruitzoneBaseHandler):
	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("action?","page?:int")
	def get(self,shop_code):
		return self.render('official/article.html')

	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("page?:int","action:str","data?")
	def post(self,shop_code):	
		action = self.args["action"]
		try:
			shop = self.session.query(models.Shop).filter_by(shop_code = shop_code).first()
		except:
			return self.send_fail('店铺不存在')
		shop_id = shop.id
		if action =="great":
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

class ArticleComment(FruitzoneBaseHandler):
	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("num:int")
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
	@FruitzoneBaseHandler.check_arguments("action:str","data")
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

class ArticlePublic(FruitzoneBaseHandler):
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
	@FruitzoneBaseHandler.check_arguments("data")
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

class ArticleCenter(FruitzoneBaseHandler):
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



  