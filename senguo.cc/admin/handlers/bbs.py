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
	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("type?","page?")
	def get(self):
		if "page" in self.args and self.args["page"] !=[]:
			_type = int(self.args["type"])
			page = int(self.args["page"])
			page_size = 10
			nomore = Falsef
			datalist = []
			try:
				article_lsit = self.session.query(models.Article,models.Accountinfo.nickname)\
					.join(models.Accountinfo,models.Article.account_id==models.Accountinfo.id).filter_by(models.Article.status==1)\
					.order_by(models.Article.create_time.desc())
			except:
				article_lsit = None

			if _type<100:
					article_lsit=article_lsit.filter(models.Article.classify==_type)
			if page == article_lsit.count()//page_size:
				nomore = True
			if article_lsit:
				article_lsit = article_lsit.offset(page*page_size).limit(page_size).all()
				for article in article_lsit:
					datalist.append(self.getArticle(article))
			return self.send_success(datalist=datalist,nomore=nomore)
		return self.render("bbs/main.html")

class Detail(FruitzoneBaseHandler):
	@tornado.web.authenticated
	def get(self,_id):
		try:
			article = self.session.query(models.Article,models.Accountinfo.nickname,models.Accountinfo.id)\
				.join(models.Accountinfo,models.Article.account_id==models.Accountinfo.id).filter(models.Article.id==_id).first()
		except:
			return self.write("没有该文章的任何信息")

		article.scan_num = article.scan_num +1
		self.session.commit()
		article_data={"id":article[0].id,"title":article[0].title,"time":article[0].create_time,"article":article[0].article,\
						"type":self.article_type(article[0].classify),"nickname":article[1],"great_num":article[0].great_num,\
						"comment_num":article[0].comment_num,"scan_num":article[0].scan_num}

		try:
			comments = self.session.query(models.ArticleComment,models.Accountinfo.nickname)\
				.outerjoin(models.Accountinfo,models.ArticleComment.comment_author_id==models.Accountinfo.id)\
				.filter(models.ArticleComment.article_id==_id).order_by(models.ArticleComment.create_time.desc()).all()
		except:
			comments = None
		comments_list=[]
		if comments:
			for comment in comments:
				comments_list.append({"id":comment[0].id,"nickname":comment[0].accountinfo.nickname,"imgurl":comment[0].accountinfo.headimgurl_small,\
					"comment":comment[0].comment,"time":self.timedelta(comment[0].create_time),"great_num":comment[0].great_num,"@nickname":comment[1]})
		if_admin = False
		try:
			current_user = self.session.query(models.SuperAdmin).filter_by(id=self.current_user.id).first()
		except:
			current_user = None
		if current_user:
			if_admin = True
		return self.render("bbs/artical-detail.html",article=article,comments_list=comments_list,if_admin=if_admin)
	
	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("action:str","data?")
	def post(self,_id):
		action=self.args["action"]
		if "data" in self.args:
			data=self.args["data"]

		if action in ["article_great","comment_great"]:
			now =  time.strftime('%Y-%m-%d', time.localtime() )
			_great = self.session.query(models.ArticleGreat).filter_by(account_id = self.current_user.id)
			if action == "article_great":
				_type = 0
				comment_id = 0
			else:
				_type = 1
				comment_id = data["comment_id"]

			try:
				new_great = _great.filter_by(article_id = _id,comment_id=comment_id,_type=_type).order_by(models.ArticleGreat.create_time.desc()).first()
			except:
				new_great = None

			if new_great and new_great.create_time.strftime('%Y-%m-%d') == now:
				return self.send_fail('您今天已经点过赞啦！')
			
			if _type == 0:		
				article = self.session.query(models.Article).filter_by( id = _id).first()
				article.great_num = article.great_num +1
				article.if_scan = 0
			else:
				_comment = self.session.query(models.ArticleComment).filter_by(id=comment_id).first()
				_comment.great_num = article.great_num +1
				_comment.if_scan = 0

			great = models.ArticleGreat(
				article_id = _id,
				comment_id = comment_id,
				account_id = self.current_user.id,
				_type = _type
			)
			self.session.add(great)
			self.session.commit()
			return self.send_success()

		elif action in ["comment","replay","collect"]:
			try:
				article = self.session.query(models.Article).filter_by( id = _id).first()
			except:
				return self.send_fail("no such article")
			if action == "comment":
				_type = 0
				comment_author_id = 0
			elif action == "replay":
				_type = 1
				comment_author_id = self.session.query(models.ArticleComment).filter_by(id=data["comment_id"]).first().account_id
			elif action == "collect":
				_type = 2
				comment_author_id = 0

			comment =models.ArticleComment(
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
			new_comment = self.session.query(models.ArticleComment,models.Accountinfo.nickname)\
				.outerjoin(models.Accountinfo,models.ArticleComment.comment_author_id==models.Accountinfo.id)\
				.filter(models.ArticleComment.article_id==_id,models.ArticleComment._type==_type).order_by(models.ArticleComment.create_time.desc()).first()
			data={"id":new_comment[0].id,"nickname":new_comment[0].accountinfo.nickname,"imgurl":new_comment[0].accountinfo.headimgurl_small,\
					"comment":new_comment[0].comment,"time":self.timedelta(new_comment[0].create_time),"great_num":new_comment[0].great_num,"@nickname":new_comment[1]}
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
		return self.render("bbs/publish.html",token=qiniuToken)

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

class Edit(FruitzoneBaseHandler):
	@tornado.web.authenticated
	def get(self):
		_id = str(time.time())
		qiniuToken = self.get_qiniu_token('article',_id)
		return self.render("bbs/publish.html",token=qiniuToken)

	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("data")	
	def post(self):
		data=self.args["data"]
		article = self.session.query(models.Article).filter_by(id=int(data["id"])).first()
		article.title=data["title"]
		article.article=data["article"]
		article.classify=data["classify"]
		self.session.commit()
		return self.send_success()

class Search(FruitzoneBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("bbs/search.html")

	@tornado.web.authenticated
	@FruitzoneBaseHandler.check_arguments("data")	
	def post(self):
		page = int(self.args["page"])
		page_size = 10
		nomore = False
		datalist = []
		try:
			article_lsit = self.session.query(models.Article,models.Accountinfo.nickname)\
				.join(models.Accountinfo,models.Article.account_id==models.Accountinfo.id)\
				.order_by(models.Article.create_time.desc())
		except:
			nomore = True

		if page == article_lsit.count()//page_size:
			nomore = True
		if article_lsit:
			article_lsit = article_lsit.offset(page*page_size).limit(page_size).all()
			for article in article_lsit:
				datalist.append(self.getArticle(article))
		return self.send_success(datalist=datalist,nomore=nomore)

class Profile(FruitzoneBaseHandler):
	def get(self):
		return self.render("bbs/profile.html") 