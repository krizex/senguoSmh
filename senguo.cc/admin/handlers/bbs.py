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
	def get(self):
		return self.render("bbs/main.html")

class Detail(FruitzoneBaseHandler):
	def get(self,_id):
		article = self.session.query(models.Article).filter_by(id=_id).first()
		return self.render("bbs/artical-detail.html")

class Publish(FruitzoneBaseHandler):
	def get(self):
		_id = str(time.time())
		qiniuToken = self.get_qiniu_token('article',_id)
		return self.render("bbs/publish.html",token=qiniuToken)

	@FruitzoneBaseHandler.check_arguments("data")	
	def post(self):
		data=self.args["data"]
		classify=int(data["classify"])
		title=data["title"]
		article=data["article"]
		new_article=models.Article(
			title=title,
			article=article,
			classify=classify
		)
		self.session.add(new_article)
		return self.send_success()


class Search(FruitzoneBaseHandler):
	def get(self):
		return self.render("bbs/search.html") 

class Profile(FruitzoneBaseHandler):
	def get(self):
		return self.render("bbs/profile.html") 