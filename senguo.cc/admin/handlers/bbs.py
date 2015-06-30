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

class Main(FruitzoneBaseHandler):
	# @tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("type?","page?")
	def get(self):
		if "page" in self.args and self.args["page"] !=[]:
			_type = int(self.args["type"])
			page = int(self.args["page"])
			page_size = 20
			nomore = False
			datalist = []
			today =  time.strftime('%Y-%m-%d', time.localtime() )
			try:
				article_lsit = self.session.query(models.Article,models.Accountinfo.nickname,models.ArticleGreat)\
					.join(models.Accountinfo,models.Article.account_id==models.Accountinfo.id)\
					.outerjoin(models.ArticleGreat,models.Article.id==models.ArticleGreat.article_id)\
					.filter(models.Article.status==1).distinct().order_by(models.Article.create_time.desc())
			except:
				article_lsit = None

			if _type<100:
					article_lsit=article_lsit.filter(models.Article.classify==_type)
			if article_lsit:
				if page == article_lsit.count()//page_size:
					nomore = True
				article_lsit = article_lsit.offset(page*page_size).limit(page_size).all()
				for article in article_lsit:
					datalist.append(self.getArticle(article))
			return self.send_success(datalist=datalist,nomore=nomore)

		if_admin = self.if_super()
		return self.render("bbs/main.html",if_admin=if_admin)

class Detail(FruitzoneBaseHandler):
	# @tornado.web.authenticated
	def get(self,_id):
		try:
			article = self.session.query(models.Article,models.Accountinfo.nickname,models.Accountinfo.id,models.ArticleGreat)\
				.join(models.Accountinfo,models.Article.account_id==models.Accountinfo.id)\
				.outerjoin(models.ArticleGreat,models.Article.id==models.ArticleGreat.article_id)\
				.filter(models.Article.id==_id,models.Article.status==1).first()
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
		article[0].scan_num = article[0].scan_num +1
		self.session.commit()

		great_if = False
		collect_if = False
		if article[3]:
			if article[3].great == 1:
				great_if=True
			if article[3].collect == 1 :
				collect_if=True
		article_data={"id":article[0].id,"title":article[0].title,"time":article[0].create_time,"article":article[0].article,\
						"type":self.article_type(article[0].classify),"nickname":article[1],"great_num":article[0].great_num,\
						"comment_num":article[0].comment_num,"scan_num":article[0].scan_num,"great_if":great_if,"collect_if":collect_if}

		try:
			comments = self.session.query(models.ArticleComment,models.Accountinfo.nickname,models.ArticleCommentGreat)\
				.outerjoin(models.Accountinfo,models.ArticleComment.comment_author_id==models.Accountinfo.id)\
				.outerjoin(models.ArticleCommentGreat,models.ArticleComment.id==models.ArticleCommentGreat.comment_id)\
				.filter(models.ArticleComment.article_id==_id).order_by(models.ArticleComment.create_time.desc()).all()
		except:
			comments = None
		comments_list=[]
		if comments:
			for comment in comments:
				comments_list.append(self.getArticleComment(comment))
		if_admin = self.if_super()
		return self.render("bbs/artical-detail.html",article=article_data,comments_list=comments_list,if_admin=if_admin)
	
	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("action:str","data?")
	def post(self,_id):
		action=self.args["action"]
		if "data" in self.args:
			data=self.args["data"]

		if action in ["article_great","collect"]:

			try:
				record = self.session.query(models.ArticleGreat).filter_by(article_id = _id,account_id = self.current_user.id).first()
			except:
				record = None

			num_1 = 1
			if record:
				if action == "article_great":
					if record.great == 0:
						record.great = 1 
					else:
						num_1 = -1
						record.great = 0
				elif action == "collect":
					record.collect = 1 if record.collect ==0 else 0
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

			if action == "article_great":
				try:
					article = self.session.query(models.Article).filter_by( id = _id).first()
				except:
					return self.send_fail("no such article")
				if article:
					article.great_num = article.great_num +num_1
					article.if_scan = 0
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
			print(num_1,_comment)
			if _comment:
				_comment.great_num = _comment.great_num +num_1
				_comment.if_scan = 0
			self.session.commit()
			return self.send_success()

		elif action in ["comment","reply"]:
			try:
				article = self.session.query(models.Article).filter_by( id = _id).first()
			except:
				return self.send_fail("no such article")
			print(article)
			if action == "comment":
				_type = 0
				comment_author_id = 0
			elif action == "reply":
				_type = 1
				comment_author_id = self.session.query(models.ArticleComment).filter_by(id=data["comment_id"]).first().account_id
			else:
				return send_fail("no such action")
			comment = models.ArticleComment(
				article_id = _id,
				account_id = self.current_user.id,
				comment = self.args["data"]["comment"],
				comment_author_id = comment_author_id,
				_type = _type
			)
			article.comment_num = article.comment_num +1
			article.if_scan = 0
			self.session.add(comment)
			self.session.commit()
			new_comment = self.session.query(models.ArticleComment,models.Accountinfo.nickname,models.ArticleCommentGreat)\
				.outerjoin(models.Accountinfo,models.ArticleComment.comment_author_id==models.Accountinfo.id)\
				.filter(models.ArticleComment.article_id==_id,models.ArticleComment._type==_type).order_by(models.ArticleComment.create_time.desc()).first()
			data=self.getArticleComment(new_comment)
			return self.send_success(data=data)

		elif action == "delete":
			try:
				article = self.session.query(models.Article).filter_by( id = _id).first()
			except:
				return self.send_fail("no such article")
			try:
				current_user = self.session.query(models.SuperAdmin).filter_by(id=self.current_user.id).first()
			except:
				return self.send_fail("you has no priority to delete this article")
			article.status=0
			self.session.commit()
			return self.send_success()

class Publish(FruitzoneBaseHandler):
	@tornado.web.authenticated
	def get(self):
		_id = str(time.time())
		qiniuToken = self.get_qiniu_token('article',_id)
		return self.render("bbs/publish.html",token=qiniuToken,edit=False)

	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("data")	
	def post(self):
		data=self.args["data"]
		classify=int(data["classify"])
		title=data["title"]
		article=data["article"]
		new_article=models.Article(
			title=title,
			article=article,
			classify=classify,
			account_id=self.current_user.id,
			status = 1
		)
		self.session.add(new_article)
		self.session.commit()
		return self.send_success()

class DetailEdit(FruitzoneBaseHandler):
	@tornado.web.authenticated
	def get(self,_id):
		try:
			article = self.session.query(models.Article,models.Accountinfo.nickname,models.Accountinfo.id)\
				.join(models.Accountinfo,models.Article.account_id==models.Accountinfo.id).filter(models.Article.id==_id,models.Article.status==1).first()
		except:
			return self.write("没有该文章的任何信息")

		article_data={"id":article[0].id,"title":article[0].title,"article":article[0].article,\
						"type":self.article_type(article[0].classify),"type_id":article[0].classify}
		_id = str(time.time())
		qiniuToken = self.get_qiniu_token('article',_id)
		return self.render("bbs/publish.html",token=qiniuToken,edit=True,article_data=article_data)

	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("data")	
	def post(self,_id):
		data=self.args["data"]
		article = self.session.query(models.Article).filter_by(id=_id).first()
		article.title=data["title"]
		article.article=data["article"]
		article.classify=data["classify"]
		self.session.commit()
		return self.send_success()

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
		try:
			article_lsit = self.session.query(models.Article,models.Accountinfo.nickname)\
				.join(models.Accountinfo,models.Article.account_id==models.Accountinfo.id)\
				.filter(models.Article.status==1,models.Article.title.like("%%%s%%" % data))\
				.order_by(models.Article.create_time.desc())
		except:
			nomore = True
		if article_lsit:
			if page == article_lsit.count()//page_size:
				nomore = True
			article_lsit = article_lsit.offset(page*page_size).limit(page_size).all()
			for article in article_lsit:
				datalist.append(self.getArticle(article))
		return self.send_success(datalist=datalist,nomore=nomore)

class Profile(FruitzoneBaseHandler):
	def get(self):
		return self.render("bbs/profile.html") 