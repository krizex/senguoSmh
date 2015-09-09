from handlers.base import FruitzoneBaseHandler,WxOauth2
import dal.models as models
import tornado.web
from settings import *
import datetime, time
from sqlalchemy import desc, and_, or_,func
import qiniu
import random
import base64
import json
from collections import OrderedDict

class getHotInfo(FruitzoneBaseHandler):
	@FruitzoneBaseHandler.check_arguments("action")
	def get(self):
		action = self.args["action"]
		if action == "article":
			return self.send_success(datalist=self.getHotArticle)
		elif action == "customer":
			return self.send_success(datalist=self.getHotCustomer)
			
	@property
	def getHotArticle(self):
		datalist = []
		try:
			article_list = self.session.query(models.Article.id,models.Article.title,models.Article.scan_num,models.Accountinfo.nickname)\
				.join(models.Accountinfo,models.Article.account_id==models.Accountinfo.id).filter(models.Article.status==1)\
				.distinct(models.Article.id).order_by(models.Article.scan_num.desc()).limit(5).all()
		except:
			article_list = None
		for article in article_list:
			datalist.append({"id":article[0],"title":article[1],"scan_num":article[2],"nickname":article[3]})
		return datalist

	@property
	def getHotCustomer(self):
		customers = self.session.query(models.Accountinfo.id,models.Accountinfo.nickname,models.Accountinfo.headimgurl_small)\
		.outerjoin(models.Article,models.Accountinfo.id==models.Article.account_id)\
		.outerjoin(models.ArticleComment,models.Accountinfo.id==models.ArticleComment.account_id)\
		.distinct(models.Article.id,models.ArticleComment.id).all()
		customer_list = []
		for customer in customers:
			article_num=self.session.query(models.Article).filter_by(account_id=customer[0]).filter(models.Article.status>0).count()
			comment_num=self.session.query(models.ArticleComment).filter_by(account_id=customer[0],status=1).count()
			if article_num !=0 or comment_num !=0 :
				customer_list.append({"nickname":customer[1],"imgurl":customer[2],"article_num":article_num,"comment_num":comment_num})
		customer_list.sort(key=lambda x:(x["article_num"],x["comment_num"]),reverse=True)
		customer_list=customer_list[0:5]
		return customer_list



class Main(FruitzoneBaseHandler):
	# @tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("type?","page?")
	def get(self):
		# print("[BbsMain]self.get_secure_cookie("customer_id"):",self.get_secure_cookie("customer_id"))
		if "page" in self.args and self.args["page"] !=[]:
			if self.args["page"]==[]:
				page = 0
			else:
				page = int(self.args["page"])
			if self.args["type"]==[]:
				_type = 100
			else:
				_type = int(self.args["type"])
			page_size = 20
			nomore = False
			datalist = []
			today =  time.strftime('%Y-%m-%d', time.localtime() )
			time_now = datetime.datetime.now()
			try:
				article_lsit = self.session.query(models.Article,models.Accountinfo.nickname)\
					.join(models.Accountinfo,models.Article.account_id==models.Accountinfo.id)\
					.filter(models.Article.status>=1,models.Article.no_public==0,models.Article.public_time<=time_now)\
					.distinct(models.Article.id).order_by(models.Article.public_time.desc())
			except:
				article_lsit = None
			if _type<100:
					article_lsit=article_lsit.filter(models.Article.classify==_type)
			if article_lsit:
				if page >= article_lsit.count()//page_size:
					nomore = True
				article_lsit = article_lsit.offset(page*page_size).limit(page_size).all()
				for article in article_lsit:
					datalist.append(self.getArticle(article))
			return self.send_success(datalist=datalist,nomore=nomore)

		if_admin = self.if_super()
		return self.render("{0}/main.html".format(self.getBbsPath),if_admin=if_admin)

# 社区 - 文章详情
class Detail(FruitzoneBaseHandler):
	# @tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("action:?","page?")
	def get(self,_id):
		try:
			article = self.session.query(models.Article,models.Accountinfo.nickname,models.Accountinfo.id,models.Accountinfo.headimgurl_small)\
				.join(models.Accountinfo,models.Article.account_id==models.Accountinfo.id)\
				.filter(models.Article.id==_id,models.Article.status>=1,models.Article.public_time<=datetime.datetime.now()).first()
		except:
			return self.write("没有该文章的任何信息")

		# if not article[3]:
		# 	article[0].scan_num = article[0].scan_num +1
		# 	self.session.add(models.ArticleGreat(article_id = _id,
		# 			account_id = self.current_user.id,
		# 			scan=1))
		# else:
		# 	if article[3].scan==0 :
		# 		article[3].scan = 1
		# 		article[0].scan_num = article[0].scan_num +1
		if article:
			article[0].scan_num = article[0].scan_num +1
			self.session.flush()
		else:
			return self.write("您访问的地址错误或该文章已被删除")
		

		great_if = False
		collect_if = False
		try:
			article_great=self.session.query(models.ArticleGreat).filter_by(article_id=article[0].id,account_id=self.current_user.id).one()
		except:
			article_great=None
		if article_great:
			if article_great.great == 1:
				great_if=True
			if article_great.collect == 1 :
				collect_if=True

		author_if = False
		if self.current_user and article[0].account_id == self.current_user.id:
			author_if = True
		article_data={"id":article[0].id,"title":article[0].title,"time":article[0].public_time,"article":article[0].article,\
						"type":self.article_type(article[0].classify),"nickname":article[1],"imgurl":article[3],\
						"great_num":article[0].great_num,"comment_num":article[0].comment_num,"private":article[0].comment_private,\
						"scan_num":article[0].scan_num,"collect_num":article[0].collect_num,"great_if":great_if,"collect_if":collect_if}
		if "action" in self.args and self.args["action"] == "comment":
			if self.args["page"]==[]:
				page = 0
			else:
				page = int(self.args["page"])
			nomore = False
			page_size = 20
			comments_list = []
			_comments_ = self.DetailArticleComment(_id,page,page_size)
			if article[0].comment_private == 0:
				comments_list = _comments_[0]
				nomore = _comments_[1]
			else:
				if article[0].account_id == self.current_user.id:
					comments_list = _comments_[0]
					nomore = _comments_[1]
				else:
					nomore = True
			return self.send_success(data=comments_list,nomore=nomore)
		if_admin = self.if_super()
		self.session.commit()
		return self.render("{0}/artical-detail.html".format(self.getBbsPath),article=article_data,author_if=author_if,if_admin=if_admin)

	def DetailArticleComment(self,_id,page,page_size):
		comments_list = []
		nomore = False
		try:
			comments = self.session.query(models.ArticleComment,models.Accountinfo.nickname)\
				.outerjoin(models.Accountinfo,models.ArticleComment.comment_author_id==models.Accountinfo.id)\
				.filter(models.ArticleComment.article_id==_id,models.ArticleComment.status==1)\
				.order_by(models.ArticleComment.create_time.desc())
		except:
			comments = None
		if comments:
			if page >= comments.count()//page_size:
				nomore = True
			comments = comments.offset(page*page_size).limit(page_size).all()
			for comment in comments:
				comments_list.append(self.getArticleComment(comment))
		return comments_list,nomore

	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("action:str","data?")
	def post(self,_id):
		action=self.args["action"]
		if "data" in self.args:
			data=self.args["data"]

		if action in ["article_great","collect"]:

			try:
				record = self.session.query(models.ArticleGreat).filter_by(article_id = _id,account_id = self.current_user.id).one()
			except:
				record = None

			num_1 = 1
			num_2 = 1
			if record:
				if action == "article_great":
					if record.great == 0:
						record.great = 1
					else:
						num_1 = -1
						record.great = 0
				elif action == "collect":
					if record.collect ==0 :
						record.collect = 1
					else:
						num_2 = -1
						record.collect = 0
			else:
				if action == "article_great":
					great = models.ArticleGreat(
						article_id = _id,
						account_id = self.current_user.id,
						great = 1
					)
				elif action == "collect":
					great = models.ArticleGreat(
						article_id = _id,
						account_id = self.current_user.id,
						collect = 1
					)
				self.session.add(great)

			try:
				article = self.session.query(models.Article).filter_by( id = _id).first()
			except:
				return self.send_fail("[BbsDetail]no such article")
			if article:
				if action == "article_great":
					if article.great_num>=0:
						article.great_num = article.great_num +num_1
					else:
						article.great_num = 0
					article.if_scan = 0
				elif action == "collect":
					if article.collect_num>=0:
						article.collect_num = article.collect_num +num_2
					else:
						article.collect_num = 0
			self.session.commit()
			return self.send_success()

		elif action == "comment_great":
			comment_id = int(data["comment_id"])
			great_record = self.session.query(models.ArticleCommentGreat).filter_by(comment_id = comment_id,account_id = self.current_user.id)
			try:
				_great = great_record.first()
			except:
				_great = None

			num_1= 1
			if _great:
				great_record.delete()
				num_1=-1
			else:
				great = models.ArticleCommentGreat(
					comment_id = comment_id,
					account_id = self.current_user.id
				)
				self.session.add(great)

			try:
				_comment = self.session.query(models.ArticleComment).filter_by(id=comment_id).first()
			except:
				_comment = None
			# print("[BbsDetail]num_1:",num_1,", _comment:",_comment)
			if _comment:
				_comment.great_num = _comment.great_num +num_1
				_comment.if_scan = 0
			self.session.commit()
			return self.send_success()

		elif action in ["comment","reply"]:
			try:
				article = self.session.query(models.Article).filter_by( id = _id).first()
			except:
				return self.send_fail("[BbsDetail]no such article")
			# print("[BbsDetail]article:",article)
			if action == "comment":
				_type = 0
				comment_author_id = 0
			elif action == "reply":
				_type = 1
				_comment_ = self.session.query(models.ArticleComment).filter_by(id=data["comment_id"]).first()
				comment_author_id = _comment_.account_id
				_comment_.reply_num = _comment_.reply_num+1
			else:
				return send_fail("[BbsDetail]no such action")
			comment = models.ArticleComment(
				article_id = _id,
				account_id = self.current_user.id,
				comment = self.args["data"]["comment"][0:500].replace("script","-/script/-"),
				comment_author_id = comment_author_id,
				_type = _type
			)
			article.comment_num = article.comment_num +1
			article.if_scan = 0
			self.session.add(comment)
			self.session.commit()
			new_comment = self.session.query(models.ArticleComment,models.Accountinfo.nickname)\
				.outerjoin(models.Accountinfo,models.ArticleComment.comment_author_id==models.Accountinfo.id)\
				.filter(models.ArticleComment.article_id==_id,models.ArticleComment._type==_type).order_by(models.ArticleComment.create_time.desc()).first()
			data=self.getArticleComment(new_comment)
			return self.send_success(data=data)

		elif action == "del_comment":
			try:
				comment = self.session.query(models.ArticleComment,models.Article)\
				.join(models.Article,models.ArticleComment.article_id==models.Article.id)\
				.filter(models.ArticleComment.id==int(data["id"])).one()
			except:
				comment = None
			if comment and comment[1] :
				if comment[1].account_id == self.current_user.id or comment[0].account_id == self.current_user.id:
					comment[0].status=0
					comment[1].comment_num=comment[1].comment_num-1
					self.session.commit()
					return self.send_success()
			else:
				return self.send_fail("该评论不存在或您没有操作权限")

		elif action == "delete":
			try:
				article = self.session.query(models.Article).filter_by( id = _id).first()
			except:
				return self.send_fail("[BbsDetail]no such article")
			try:
				current_user = self.session.query(models.SuperAdmin).filter_by(id=self.current_user.id).first()
			except:
				return self.send_fail("[BbsDetail]you have no priority to delete this article")
			article.status=0
			self.session.commit()
			return self.send_success()

# 社区 - 发表文章
class Publish(FruitzoneBaseHandler):
	@tornado.web.authenticated
	def get(self):
		_id = str(time.time())
		qiniuToken = self.get_qiniu_token('article',_id)
		if_admin = self.if_super()
		return self.render("{0}/publish.html".format(self.getBbsPath),token=qiniuToken,edit=False,if_admin=if_admin)

	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("data")
	def post(self):
		data=self.args["data"]
		classify=int(data["classify"])
		title=data["title"][0:100].replace("script","-/script/-")
		article=data["article"].replace("script","-/script/-")
		time_now=datetime.datetime.now()
		public_time = time_now
		if "public" in data and data["public"]:
			try:
				no_public = int(data["public"])
			except:
				no_public = 0
		else:
			no_public=0
		if "type" in data and data["type"]:
			try:
				if int(data["type"]) in [-1,1,2]:
					status=int(data["type"])
					if int(data["type"]) == 2:
						if "publictime" in data and data["publictime"]:
							public_time = data["publictime"]
							try:
								if public_time < time_now.strftime("%Y-%m-%d %H:%M:%S"):
									public_time = time_now
							except:
								public_time = time_now
						else:
							public_time=time_now
			except:
				status = 1
		else:
			status=1
		if "private" in data and data["private"]:
			try:
				comment_private = int(data["private"])
			except:
				comment_private = 0
		else:
			comment_private=0
		new_article=models.Article(
			title=title,
			article=article,
			classify=classify,
			account_id=self.current_user.id,
			status = status,
			no_public = no_public,
			public_time = public_time,
			comment_private = comment_private,
			if_admin = self.if_super()
		)
		self.session.add(new_article)
		self.session.commit()
		_id = new_article.id
		return self.send_success(id=_id)

# 社区 - 编辑文章
class DetailEdit(FruitzoneBaseHandler):
	@tornado.web.authenticated
	def get(self,_id):
		try:
			article = self.session.query(models.Article,models.Accountinfo.nickname,models.Accountinfo.id,models.Accountinfo.headimgurl_small)\
				.join(models.Accountinfo,models.Article.account_id==models.Accountinfo.id).filter(models.Article.id==_id,models.Article.status!=0).one()
		except:
			return self.write("没有该文章的任何信息")
		if article[0].account_id != self.current_user.id:
			return self.redirect(self.reverse_url("BbsMain"))
		public_time = article[0].public_time
		year = public_time.strftime("%Y")
		month = public_time.strftime("%m")
		day = public_time.strftime("%d")
		hour = public_time.strftime("%H")
		minute = public_time.strftime("%M")
		seconds = public_time.strftime("%S")
		article_data={"id":article[0].id,"title":article[0].title,"article":article[0].article,"type":self.article_type(article[0].classify)\
		,"type_id":article[0].classify,"public":article[0].no_public,"private":article[0].comment_private,"status":article[0].status,\
		"year":year,"month":month,"day":day,"hour":hour,"minute":minute,"seconds":seconds}
		_id = str(time.time())
		qiniuToken = self.get_qiniu_token('article',_id)
		if_admin = self.if_super()
		return self.render("{0}/publish.html".format(self.getBbsPath),token=qiniuToken,edit=True,article_data=article_data,if_admin=if_admin)

	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("data")
	def post(self,_id):
		data=self.args["data"]
		article = self.session.query(models.Article).filter_by(id=_id).first()
		if article.account_id != self.current_user.id:
			return self.send_fail("您不是该文章的作者")
		if article.status == 0 :
			return self.send_fail("该文章已删除")
		article.classify=int(data["classify"])
		article.title=data["title"][0:100].replace("script","-/script/-")
		article.article=data["article"].replace("script","-/script/-")
		time_now=datetime.datetime.now()
		if "public" in data and data["public"]:
			try:
				article.no_public = int(data["public"])
			except:
				no_public = 0
		else:
			no_public=0
		if "public" in data and data["public"]:
			try:
				no_public = int(data["public"])
			except:
				no_public = 0
		else:
			no_public=0
		if "type" in data and data["type"]:
			try:
				if int(data["type"]) in [-1,1,2]:
					if article.status == 1 and int(data["type"]) == -1:
						return send_fail("该文章不允许保存为草稿")
					if int(data["type"]) == 2:
						if "publictime" in data and data["publictime"]:
							public_time = data["publictime"]
							try:
								if public_time < time_now.strftime("%Y-%m-%d %H:%M:%S"):
									public_time = time_now
							except:
								public_time = time_now
						else:
							public_time=time_now
					else:
						public_time=time_now
					status=int(data["type"])
			except:
				status = 1
		else:
			status=1

		if "private" in data and data["private"]:
			try:
				comment_private = int(data["private"])
			except:
				comment_private = 0
		else:
			comment_private=0
		article.no_public=no_public
		article.status=status
		article.public_time=public_time
		article.comment_private=comment_private
		self.session.commit()
		return self.send_success(id=_id)

# 社区 - 搜索
class Search(FruitzoneBaseHandler):
	# @tornado.web.authenticated
	def get(self):
		return self.render("bbs/search.html")

	# @tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("page","data")
	def post(self):
		page = int(self.args["page"])
		data = self.args["data"]
		page_size = 10
		nomore = False
		datalist = []
		time_now = datetime.datetime.now()
		try:
			article_lsit = self.session.query(models.Article,models.Accountinfo.nickname)\
				.join(models.Accountinfo,models.Article.account_id==models.Accountinfo.id)\
				.filter(models.Article.status>=1,models.Article.title.like("%%%s%%" % data),\
					models.Article.public_time<=time_now,models.Article.no_public==0)\
				.order_by(models.Article.create_time.desc()).distinct(models.Article.id)
		except:
			nomore = True
		if article_lsit:
			if page >= article_lsit.count()//page_size:
				nomore = True
			article_lsit = article_lsit.offset(page*page_size).limit(page_size).all()
			for article in article_lsit:
				datalist.append(self.getArticle(article))
		return self.send_success(datalist=datalist,nomore=nomore)

# 社区 - 个人中心
class Profile(FruitzoneBaseHandler):
	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("action?:str","page?:int")
	def get(self):
		page = 0
		page_size = 10
		action = "publish"
		nomore = False
		time_now = datetime.datetime.now()
		datalist = []
		if "action" in self.args:
			action = self.args["action"]
		if "page" in self.args:
			page = int(self.args["page"])
		if action == "publish":
			datalist = self.getListData(1,page)[0]
			nomore = self.getListData(1,page)[1]
			return self.send_success(datalist=datalist,nomore=nomore)
		elif action == "notice":
			articles=self.session.query(models.Article.id,models.Article.title).filter(models.Article.account_id==self.current_user.id).all()
			for item in articles:
				_id = item[0]
				title = item[1]
				if_great = self.session.query(models.Accountinfo.nickname,models.Accountinfo.headimgurl_small,models.ArticleGreat.create_time)\
				.join(models.ArticleGreat,models.Accountinfo.id==models.ArticleGreat.account_id)\
				.filter(models.ArticleGreat.article_id==_id,models.ArticleGreat.great==1).all()
				if if_great:
					for info in if_great:
						datalist.append(self.getChangeList(_id,title,"great",info))

				if_comment = self.session.query(models.Accountinfo.nickname,models.Accountinfo.headimgurl_small,\
					models.ArticleComment.create_time,models.ArticleComment.comment)\
				.join(models.ArticleComment,models.Accountinfo.id==models.ArticleComment.account_id)\
				.filter(models.ArticleComment.article_id==_id,models.ArticleComment._type==0).all()
				if if_comment:
					for info in if_comment:
						datalist.append(self.getChangeList(_id,title,"comment",info))
			_datalist = {}
			if datalist:
				if page >= len(datalist)//page_size:
					nomore = True
				datalist.sort(key=lambda x:x["wholetime"],reverse=True)
				datalist = datalist[page*page_size:page*page_size+page_size]
				_datalist = OrderedDict()
				for data in datalist:
					_datalist[data["date"]] = []
					if data["date"] in _datalist:
						for _data in datalist:
							if _data["date"]==data["date"]:
								_datalist[data["date"]].append(_data)
					else:
						_datalist[data["date"]]=data	
			return self.send_success(datalist=_datalist,nomore=nomore)
		elif action == "collect":
			article_lsit = self.session.query(models.Article).join(models.ArticleGreat,models.Article.id==models.ArticleGreat.article_id)\
			.filter(models.Article.status==1,models.ArticleGreat.account_id==self.current_user.id,\
				models.ArticleGreat.collect==1)\
			.distinct(models.Article.id).order_by(models.Article.create_time.desc())
			if article_lsit:
				if page >= article_lsit.count()//page_size:
					nomore = True
				article_lsit = article_lsit.offset(page*page_size).limit(page_size).all()
				for article in article_lsit:
					datalist.append(self.getArticleData(article))
			return self.send_success(datalist=datalist,nomore=nomore)
		elif action == "draft":
			datalist = self.getListData(-1,page)[0]
			nomore = self.getListData(-1,page)[1]
			return self.send_success(datalist=datalist,nomore=nomore)
		return self.render("bbs/profile.html")


	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("action:str","data")
	def post(self):
		action = self.args["action"]
		data = self.args["data"]
		if action == "del_collect":
			try:
				article_id = int(data["id"])
			except:
				return send_fail("id error")
			try:
				record = self.session.query(models.ArticleGreat).filter_by(article_id = _id,account_id = self.current_user.id).one()
			except:
				return send_fail("该文章不存在")
			if record:
				record.collect = 0
				self.session.commit()

	def getListData(self,status,page):
		page = page
		page_size = 10
		datalist=[]
		nomore = False
		if status == -1:
			status_range = (-1,)
		elif status == 1:
			status_range = (1,2)
		article_list = self.session.query(models.Article.id,models.Article.title,models.Article.create_time,models.Article.article,models.Article.comment_num,models.Article.great_num,models.Article.classify,models.Article.status,models.Article.public_time)\
		.filter(models.Article.account_id==self.current_user.id).filter(models.Article.status.in_(status_range)).order_by(models.Article.create_time.desc())
		if article_list:
			if page >= article_list.count()//page_size:
				nomore = True
			article_list = article_list.offset(page*page_size).limit(page_size).all()
		if article_list:
			for article in article_list:
				public_time = article[8]
				time_now = datetime.datetime.now()
				article_status = 1
				if public_time > time_now:
					article_status = 2
				time = ""
				if status == 1:
					time = public_time.strftime("%Y/%m/%d %H:%M")
				else:
					time = article[2].strftime("%Y/%m/%d %H:%M")
				datalist.append({"id":article[0],"title":article[1],"time":time,"article":article[3],"commentnum":article[4],"greatnum":article[5],"type":self.article_type(article[6]),"status":article_status})
		return datalist,nomore

	def getArticleData(self,article):
		data={"id":article.id,"title":article.title,"time":article.create_time.strftime("%Y/%m/%d %H:%M"),\
			"type":self.article_type(article.classify),"great_num":article.great_num,\
			"comment_num":article.comment_num}
		return data

	def getNotice(self,article):
		data={"id":article[0],"title":article[1],"great_time":article[2].strftime("%H:%M"),\
			"comment_time":article[3].strftime("%H:%M"),"nickname":article[4],"imgurl":article[5]}
		return data

	def getChangeList(self,_id,title,_type,info):
		comment = ""
		if _type == "comment":
			comment = info[3]
		try:
			date = info[2].strftime("%m-%d")
		except:
			date = ""
		return {"id":_id,"title":title,"nickname":info[0],"imgurl":info[1],"type":_type,"time":info[2].strftime("%H:%M"),\
		"date":date,"comment":comment,"wholetime":info[2].strftime("%Y-%m-%d %H:%M:%S")}
