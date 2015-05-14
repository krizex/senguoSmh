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

class ConfessionWall(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self,shop_code):
		self.render('confession/home.html')

class ConfessionPublic(CustomerBaseHandler):
	@tornado.web.authenticated
	def get(self):
		self.render('confession/public.html')

	@tornado.web.authenticated
	@CustomerBaseHandler.check_arguments("data")
	def post(self):
		data = self.args["data"]
		confession = models.ConfessionWall(
			customer_id=self.current_user.id,
			other_name = data["name"],
			other_phone = data["phone"],
			confession_type = data["type"],
			confession = data["confession"],
		)
		self.session.add(confession)
		self.session.commit()
		return self.send_success()
		


