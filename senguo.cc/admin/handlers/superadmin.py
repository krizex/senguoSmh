from handlers.base import SuperBaseHandler, WxOauth2
import dal.models as models
import tornado.web
import time, datetime
from settings import ROOT_HOST_NAME
from sqlalchemy import exists, func, extract, DATE, desc,or_
from dal.dis_dict import dis_dict
from libs.msgverify import check_msg_token,get_access_token,user_subscribe,shop_auth_msg,shop_auth_fail_msg

#add by jyj 2015-6-15
from sqlalchemy import func, desc, and_, or_, exists,not_
import operator
##

############################
# added by woody  2015.3.6
import requests

# 登录处理
class Access(SuperBaseHandler):

	def initialize(self, action):
		self._action = action

	def get(self):
		if self._action == "oauth":
			self.handle_oauth()
		elif self._action == "logout":
			self.clear_current_user()
			return self.redirect(self.reverse_url("superShopManage"))
		else:
			return self.send_error(404)
	@SuperBaseHandler.check_arguments("code", "state?", "mode")
	def handle_oauth(self):
		# todo: handle state
		code =self.args["code"]
		mode = self.args["mode"]
		if mode not in ["mp", "kf"]:
			return self.send_error(400)

		userinfo = self.get_wx_userinfo(code, mode)
		if not userinfo:
			return self.write("登录失败或过期，请重新登录")
		# 登录
		u = models.SuperAdmin.login_by_unionid(self.session, userinfo["unionid"])
		if not u:
			return self.write("对不起，你不属于此系统的用户")
		self.set_current_user(u, domain=ROOT_HOST_NAME)

		next_url = self.get_argument("next", self.reverse_url("superShopManage")) + '?action=all_temp&search&shop_auth=2&shop_status=1&shop_sort_key=1&if_reverse=1&page=1&flag=1'
		return self.redirect(next_url)

# 店铺
class ShopAdminManage(SuperBaseHandler):
	"""商家管理，基本上是信息展示"""

	_page_count = 20

	def initialize(self, action):
		self._action = action

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("page?:int")
	def get(self):
		return self.redirect('/super/shopManage?action=all_temp&search&shop_auth=2&shop_status=1&shop_sort_key=1&if_reverse=1&page=1&flag=1')
		offset = (self.args.get("page", 1)-1) * self._page_count
		try:
		    q = self.session.query(models.ShopAdmin)
		except:
		    return self.send_error('error')
		q_all = q
		t = int(time.time())
		q_using = q.filter(models.ShopAdmin.role == models.SHOPADMIN_ROLE_TYPE.SYSTEM_USER,
						 models.ShopAdmin.expire_time > t)
		q_expire = q.filter(models.ShopAdmin.role == models.SHOPADMIN_ROLE_TYPE.SYSTEM_USER,
						 models.ShopAdmin.expire_time <= t)
		q_common = q.filter(models.ShopAdmin.role == models.SHOPADMIN_ROLE_TYPE.SHOP_OWNER)
		count = {
			"all":q.count(),
			"using":q_using.count(),
			"expire":q_expire.count(),
			"common":q_common.count()
			}

		if self._action == "all":
			pass
		elif self._action == "using":
			q = q_using
		elif self._action == "expire":
			q = q_expire
		elif self._action == "common":
			q = q_common
		else:
			return self.send_error(404)
		# 排序规则id, offset 和 limit
		q = q.order_by(models.ShopAdmin.id.desc()).offset(offset).limit(self._page_count)
		#print("[超级管理员]",q,'*******************************')

		admins = q.all()
		#print(q.count())
		#print(admins)
		#for admin in admins:
		#    print(admin)
		# admins 是models.ShopAdmin的实例的列表，具体属性可以去dal/models.py中看到
		return self.render("superAdmin/shop-admin-manage.html", context=dict(admins = admins, count=count,sunpage='shopAadminManage',action=self._action))
	@tornado.web.authenticated
	def post(self):
		return self.send_error(404)

class ShopAdminProfile(SuperBaseHandler):

	@tornado.web.authenticated
	#@SuperBaseHandler.check_arguments("id:int")
	def get(self, id):
		try:
			admin = self.session.query(models.ShopAdmin).filter_by(id=id).one()
		except:
			admin = None
		if not admin:
			return self.send_error(404)
		time_tuple = time.localtime(admin.accountinfo.birthday)
		birthday = time.strftime("%Y-%m", time_tuple)
		return self.render("superAdmin/admin-profile.html", context=dict(admin=admin, birthday=birthday,))


class ShopProfile(SuperBaseHandler):
	@tornado.web.authenticated
	#@SuperBaseHandler.check_arguments("id:int")
	def get(self, id):
		try:
			shop = self.session.query(models.Shop).filter_by(id=id).one()
		except:
			shop = None
		if not shop:
			return self.send_error(404)
		return self.render("superAdmin/shop-profile.html", context=dict(shop=shop,subpage='shop'))

# 店铺管理
class ShopManage(SuperBaseHandler):
	_page_count = 20

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("action","search","shop_auth:int","shop_status:int","shop_status:int","shop_sort_key:int","if_reverse:int","page?:int","flag:int")
	def get(self):
		action = self.args["action"]
		flag=self.args["flag"]


		#add by jyj 2015-6-16
		output_data_count = {}
		output_data_count["status_5_count"] = self.session.query(models.Shop).count()
		output_data_count["status_4_count"] = self.session.query(models.Shop).filter(models.Shop.shop_code == 'not set').count()
		output_data_count["status_2_count"] = self.session.query(models.Shop).filter(models.Shop.status == 2).count()
		output_data_count["status_1_count"] = self.session.query(models.Shop).filter(models.Shop.status == 1).count()
		output_data_count["status_3_count"] = self.session.query(models.Shop).filter(models.Shop.status == 3).count()
		output_data_count["status_0_count"] = self.session.query(models.Shop).filter(models.Shop.status == 0).count()

		output_data_count["auth_4_count"] = self.session.query(models.Shop).count()
		output_data_count["auth_3_count"] = self.session.query(models.Shop).filter(models.Shop.shop_auth.in_([1,2,3,4])).count()

		output_data_count["auth_2_count"] = self.session.query(models.Shop).filter(models.Shop.shop_auth.in_([1,4])).count()
		output_data_count["auth_1_count"] = self.session.query(models.Shop).filter(models.Shop.shop_auth.in_([2,3])).count()
		output_data_count["auth_0_count"] = self.session.query(models.Shop).filter(models.Shop.shop_auth == 0).count()
		##

		#add 6.6pm search(根据店铺号或店铺名搜索的功能):
		if 'search' in self.args:
			from sqlalchemy.sql import or_
			search = self.args["search"]
			if search == '':
				q = self.session.query(models.Shop)  #把所有店铺查询出来，存放在q中
				shops = q.order_by(models.Shop.id).all()
			else:
				q = self.session.query(models.Shop).filter(or_(models.Shop.shop_name.like("%{0}%".format(self.args["search"])),
				  	models.Shop.shop_code.like("%{0}%".format(self.args["search"]))),\
				  	models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
				   	models.Shop.shop_code !='not set',models.Shop.status !=0 ).all()
				shops = q
		else:
		#add6.4pm
			q = self.session.query(models.Shop)  #把所有店铺查询出来，存放在q中
			shops = q.order_by(models.Shop.id).all()

		shop_auth = self.args["shop_auth"]
		shop_status = self.args["shop_status"]
		shop_sort_key = self.args["shop_sort_key"]
		if_reverse = self.args["if_reverse"]
		page_num = self.args["page"]
		if_reverse_val = [False,True]
		##

		offset = (self.args.get("page", 1) - 1) * self._page_count
		#print("**************offset = %d"%(offset))


		#add6.5pm shop_auth:
		if shop_auth == 4:
			pass
		elif shop_auth == 3:
			shops = [x for x in shops if x.shop_auth in [1,2,3,4]]
		elif shop_auth == 2:
			shops = [x for x in shops if x.shop_auth in [1,4]]
		elif shop_auth == 1:
			shops = [x for x in shops if x.shop_auth in [2,3]]
		elif shop_auth == 0:
			shops = [x for x in shops if x.shop_auth == 0]
		else:
			return self.send_error(404)
		##
		#print(len(shops))

		#add6.5pm shop_status:
		if shop_status == 5:
			pass
		elif shop_status == 4:
			shops = [x for x in shops if x.shop_code=="not set"]
		elif shop_status == 3:
			shops = [x for x in shops if x.status==3]
		elif shop_status == 2:
			shops = [x for x in shops if x.status==2]
		elif shop_status == 1:
			shops = [x for x in shops if x.status==1]
		elif shop_status == 0:
			shops = [x for x in shops if x.status==0]
		else:
			return self.send_error(404)
		##
		#print(len(shops))

		#add 6.4pm sort:
		if shop_sort_key == 0:
			shops.sort(key = lambda shop : shop.create_date_timestamp,reverse = if_reverse_val[if_reverse])
		elif shop_sort_key == 1:
			shops.sort(key = lambda shop : shop.old_msg,reverse = if_reverse_val[if_reverse])
		elif shop_sort_key == 2:
			shops.sort(key = lambda shop : shop.available_balance,reverse = if_reverse_val[if_reverse])
		elif shop_sort_key == 3:
			shops.sort(key = lambda shop : shop.fans_count,reverse = if_reverse_val[if_reverse])
		elif shop_sort_key == 4:
			shops.sort(key = lambda shop : shop.order_count,reverse = if_reverse_val[if_reverse])
		elif shop_sort_key == 5:
			shops.sort(key = lambda shop : shop.shop_property,reverse = if_reverse_val[if_reverse])
		elif shop_sort_key == 6:
			tmp_shops0 = []
			tmp_shops1 = []
			for shop in shops:
				if shop.order_count == 0:
					tmp_shops0.append(shop)
				else:
					tmp_shops1.append(shop)
			tmp_shops1.sort(key = lambda shop : shop.shop_property/shop.order_count,reverse = if_reverse_val[if_reverse])
			if if_reverse == 0:
				shops = tmp_shops0 + tmp_shops1
			else:
				shops = tmp_shops1 + tmp_shops0
		else:
			pass
		##


		#add 6.6pm by jyj,search_count:
		search_count = len(shops)
		##

		q_temp = self.session.query(models.ShopTemp)
		q_applying = q_temp.filter_by(shop_status=models.SHOP_STATUS.APPLYING)
		q_declined = q_temp.filter_by(shop_status=models.SHOP_STATUS.DECLINED)
		q_accepted = q_temp.filter_by(shop_status=models.SHOP_STATUS.ACCEPTED)
		comment = self.session.query(models.Order).filter(models.Order.status.in_([6,7])).count()
		auth_apply=self.session.query(models.ShopAuthenticate).filter_by(has_done = 0).count()

		count = {
			"all_temp": q_temp.count(),
			"applying": q_applying.count(),
			"accepted": q_accepted.count(),
			"declined": q_declined.count(),

			#change 6.6pm by jyj
			#old:"all" : q.count(),
			"all": self.session.query(models.Shop).count(),
			##

			"comment":comment,
			"auth_apply":auth_apply
			}
		if action == "all_temp":
			q = q_temp
		elif action == "applying":
			q = q_applying
		elif action == "accepted":
			q = q_accepted
		elif action == "declined":
			q = q_declined
		elif action == "all":

			#add6.4 pm
			shops = shops[20*page_num-20:20*page_num:1]
			##

			output_data = []
			for shop in shops:
				data = {}
				##############################################################################
				# user's subscribe
				##############################################################################
				account_info = self.session.query(models.Accountinfo).get(shop.admin_id)
				wx_openid = account_info.wx_openid
				#subscribe = user_subscribe(wx_openid)
				data["subscribe"] = account_info.subscribe

				data["shop_trademark_url"] = shop.shop_trademark_url
				data["shop_name"] = shop.shop_name
				data["city"] = self.code_to_text('shop_city', shop.shop_city)
				data["staff_count"] = len(shop.staffs)
				data["follower_count"] = shop.fans_count
				data["old_user"] = self.session.query(models.Customer).join(models.CustomerShopFollow).filter(models.CustomerShopFollow.shop_id == shop.id,models.CustomerShopFollow.shop_new == 1).count()
				data["admin_name"] = shop.admin.accountinfo.realname
				data["operate_days"] = (datetime.datetime.now() - datetime.datetime.
										fromtimestamp(shop.create_date_timestamp)).days
				data["order_count"] = shop.order_count
				data["price_sum"] = shop.shop_property

				#add 6.8am by jyj]
				if shop.order_count == 0:
					single_price = 0
				else:
					single_price = shop.shop_property/shop.order_count
				single_price = format(single_price,".2f")
				data["single_price"] = single_price
				data["available_balance"] = shop.available_balance

				auth_type_array = ['未认证','个人认证','企业认证','企业认证','个人认证']
				data["auth_type"] = auth_type_array[shop.shop_auth]

				data["admin_nickname"] = shop.admin.accountinfo.nickname
				data["shop_address_detail"] = shop.shop_address_detail
				data["shop_code"] = shop.shop_code
				shop_status_array = ['关闭','营业中','筹备中','休息中']

				data["shop_shop_status"] = shop_status_array[shop.status]

				create_date_trans = self.session.query(func.from_unixtime(shop.create_date_timestamp)).scalar()
				data["create_date"] = self.session.query(func.date_format(create_date_trans,'%Y-%m-%d %H:%i:%s')).scalar()

				data["old_msg"] = shop.old_msg

				#satisfy
				satisfy = 0.0
				shop_id = shop.id
				orders = self.session.query(models.Order).filter_by(shop_id = shop_id ,status =6).first()
				if orders:
					q = self.session.query(func.avg(models.Order.commodity_quality),\
						func.avg(models.Order.send_speed),func.avg(models.Order.shop_service)).filter_by(shop_id = shop_id).all()
					if q[0][0]:
						commodity_quality = int(q[0][0])
					if q[0][1]:
						send_speed = int(q[0][1])
					if q[0][2]:
						shop_service = int(q[0][2])
					if commodity_quality and send_speed and shop_service:
						satisfy = format((commodity_quality + send_speed + shop_service)/300,'.0%')
					else:
						satisfy = format(1,'.0%')
				data["satisfy"] = satisfy

				data["order_count"] = shop.order_count

				#chang by jyj 2015-6-16
				data["goods_count"] = self.session.query(models.Fruit).filter_by(shop_id=shop_id, active=1).count()
				##

				data["shop_property"] = shop.shop_property

				if shop.order_count == 0:
					single_price = 0
				else:
					single_price = shop.shop_property/shop.order_count
				single_price = format(single_price,".2f")
				data["single_price"] = single_price

				data["available_balance"] = shop.available_balance
				data["fans_count"] = shop.fans_count
				output_data.append(data)

			if flag==1:
				print("@@@@@@@@@")
				return self.render("superAdmin/shop-manage.html", output_data=output_data,output_data_count=output_data_count,context=dict(subpage='all',action=action,count=count))
			else :
				print("###########")
				return self.send_success(output_data=output_data,output_data_count=output_data_count)


		else:
			return self.send_error(404)

		# 排序规则id, offset 和 limit
		q = q.order_by(models.ShopTemp.id.desc()).offset(offset).limit(self._page_count)

		shops = q.all()
		# shops 是models.Shop实例的列表

		return self.render("superAdmin/apply-manage.html", context=dict(
				shops = shops,subpage='apply', action=action,
				count=count))
	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("action")
	def post(self):
		action = self.args["action"]
		if action == "updateShopStatus":
			self.handle_updateStatus()
		elif action == "shopclose":
			self.handle_shopclose()
		else:
			return self.send(400)

	@SuperBaseHandler.check_arguments("shop_id:int")
	def handle_shopclose(self):
		shop = models.Shop.get_by_id(self.session,self.args["shop_id"])
		if not shop:
			return self.send_error(404)
		shop.status = 0
		self.session.commit()
		return self.send_success()


	@SuperBaseHandler.check_arguments("shop_id:int", "new_status:int", "declined_reason?")
	def handle_updateStatus(self):

		shop_temp = models.ShopTemp.get_by_id(self.session, self.args["shop_id"])
		if not shop_temp:
			return self.send_error(403)
		mobile = shop_temp.shop_phone
		if not self.args["new_status"] in models.SHOP_STATUS.DATA_LIST:
			return self.send_error(400)

		#首个店铺未进行店铺认证不允许再申请店铺
		try:
			shops = self.session.query(models.Shop).filter_by(admin_id=shop_temp.admin_id)
		except:
			shops = None

		if shops:
			shop_frist = shops.first()
			if shop_frist:
				if shop_frist.shop_auth==0:
					return self.send_fail("该商家第一个店铺还未进行认证")
				elif shop_frist.shop_auth in [1,4] and shops.count() >= 5:
					return self.send_fail("该商家第首个店铺为个人认证,最多只可申请5个店铺")
				elif shop_frist.shop_auth in [2,3] and shops.count() >= 15:
					return self.send_fail("该商家第首个店铺为企业认证,最多只可申请15个店铺")

		if self.args["new_status"] == models.SHOP_STATUS.DECLINED:
			shop_temp.update(self.session, shop_status=3,
						declined_reason=self.args["declined_reason"])

			########################################
			# the message of decline
			account_info = self.session.query(models.Accountinfo).get(shop_temp.admin_id)
			url = 'http://106.ihuyi.cn/webservice/sms.php?method=Submit'
			message_reason =self.args["declined_reason"]
			message_name = account_info.realname
			message_shop_name = shop_temp.shop_name
			# mobile = '18162664593'
			# mobile = '13163263783'
			# mobile = account_info.phone
			# if mobile is not None:
			message_fail_content = '尊敬的{0}，您好，您在森果平台申请的店铺{1}由于{2}未通过审核，您点击右边链接，关注森果微信平台http://dwz.cn/CSZiH，了解更多平台动态，再行申请。'.format(message_name,message_shop_name,message_reason)
			postdata = dict(account='cf_senguocc',
				password='sg201404',
				mobile=mobile,
				content = message_fail_content)
			headers = dict(Host = '106.ihuyi.cn',connection = "close")
			r = requests.post(url,data = postdata , headers = headers)
			# print("[超级管理员]审核通知短信平台返回信息：",r.text)

			reason = "原因：" + message_reason

			# weixin message
			WxOauth2.fail_template_msg(account_info.wx_openid, shop_temp.shop_name,
									   account_info.realname, account_info.phone,reason)  # 发送微信模板消息通知用户

		else:
			if shop_temp.shop_status == 2:
				return self.send_fail("店铺已经申请成功")

			# 添加系统默认的时间段
			period1 = models.Period(name="中午", start_time="12:00", end_time="12:30")
			period2 = models.Period(name="下午", start_time="17:30", end_time="18:00")
			period3 = models.Period(name="晚上", start_time="21:00", end_time="22:00")

			config = models.Config()
			config.periods.extend([period1, period2, period3])
			marketing = models.Marketing()

			# 把临时表的内容复制到shop表
			shop = models.Shop(admin_id=shop_temp.admin_id,
										 shop_name=shop_temp.shop_name,
										 create_date_timestamp=shop_temp.create_date_timestamp,
										 shop_trademark_url=shop_temp.shop_trademark_url,
										 shop_service_area=shop_temp.shop_service_area,
										 shop_province=shop_temp.shop_province,
										 shop_city=shop_temp.shop_city,
										 shop_address_detail=shop_temp.shop_address_detail,
										 have_offline_entity=shop_temp.have_offline_entity,
										 shop_intro=shop_temp.shop_intro,
										 lat=shop_temp.lat,
										 lon=shop_temp.lon)
			shop.config = config
			shop.marketing = marketing
			# shop.create_date_timestamp = time.time()
			# woody
			shop.shop_start_timestamp = time.time()
			self.session.add(shop)
			shop_temp.shop_status = 2
			self.session.commit()  # 要commit一次才有shop.id

			######################################################################################
			# inspect whether staff exited
			######################################################################################
			temp_staff = self.session.query(models.ShopStaff).get(shop.admin_id)
			# print('temp_staff')
			# print(shop.admin_id)
			# print(temp_staff)
			if temp_staff is None:
				# print('passssssssssssssssssssssssssssssssssssssssss')
				self.session.add(models.ShopStaff(id=shop.admin_id, shop_id=shop.id))  # 添加默认员工时先添加一个员工，否则报错
				self.session.commit()

			self.session.add(models.HireLink(staff_id=shop.admin_id, shop_id=shop.id,default_staff=1))  # 把管理者默认为新店铺的二级配送员
			self.session.commit()

			#把管理员同时设为顾客的身份
			customer_first = self.session.query(models.Customer).get(shop.admin_id)
			if customer_first is None:
				self.session.add(models.Customer(id = shop.admin_id,balance = 0,credits = 0,shop_new = 0))
				self.session.commit()

			account_info = self.session.query(models.Accountinfo).get(shop_temp.admin_id)

			###################################################################################
			# added by woody
			# send messages
			###################################################################################
			url = 'http://106.ihuyi.cn/webservice/sms.php?method=Submit'     # message'url
			message_name = account_info.realname
			message_shop_name = shop_temp.shop_name
			# mobile = account_info.phone
			# print(mobile)

			message_content ='尊敬的{0}，您好，您在森果平台申请的店铺{1}已经通过审核，点击链接查看使用教程 http://dwz.cn/CSY6L'.format(message_name,message_shop_name)

			postdata = dict(account='cf_senguocc',
				password='sg201404',
				mobile=mobile,
				content = message_content)
			headers = dict(Host = '106.ihuyi.cn',connection="close")
			r = requests.post(url,data = postdata , headers = headers)
			# print(r.text)
			# test_openid = 'o5SQ5tyC5Ab_g6PP2uaJV1xe2AZQ'

			WxOauth2.post_template_msg(account_info.wx_openid, shop_temp.shop_name,
									   account_info.realname, account_info.phone)  # 发送微信模板消息通知用户
		return self.send_success()

class Feedback(SuperBaseHandler):
	_page_count = 20

	def initialize(self, action):
		self._action = action

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("page?:int")
	def get(self):
		offset = self._page_count * (self.args.get("page", 1) - 1)
		q = self.session.query(models.Feedback)
		if self._action == "all":
			pass
		elif self._action == "unprocessed":
			q = q.filter_by(processed=False)
		elif self._action == "processed":
			q = q.filter_by(processed=True)
		else:
			return self.send_error(404)
		q = q.order_by(models.Feedback.create_date_timestamp.desc()).\
			offset(offset).limit(self._page_count)

		return self.render("superAdmin/feedback.html", context=dict(
			feedbacks = q.all()))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("action", "feedback_id:int")
	def post(self):
		if self.args["action"] == "set_processed":
			f  = Feedback.get_by_id(self.session, self.args["feedback_id"])
			if not f:
				return self.send_error(404)
			f.update(self.session, processed=False)
			return self.send_success()
		else:
			return self.send_error(404)

class OrderManage(SuperBaseHandler):
	_page_count = 20

	def initialize(self, action):
		self._action = action

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("page?:int")
	def get(self):
		q_all = self.session.query(models.SystemOrder).filter_by(
			order_status = models.SYS_ORDER_STATUS.SUCCESS)
		q_new = q_all.filter_by(have_read=False)
		q_processed = q_all.filter_by(have_read=True)
		# 被放弃或者还未付款的订单
		q_aborted = self.session.query(models.SystemOrder).filter(
			models.SystemOrder.order_status != models.SYS_ORDER_STATUS.SUCCESS)
		count = {
			"all":q_all.count(),
			"new":q_new.count(),
			"processed":q_processed.count(),
			"aborted":q_aborted.count()
		}

		offset = self._page_count * (self.args.get("page", 1) - 1)

		if self._action == "all":
			q = q_all
		elif self._action == "new":
			q = q_new
		elif self._action == "processed":
			q = q_processed
		elif self._action == "aborted":
			q = q_aborted
		else:
			return self.send_error(404)

		q = q.order_by(models.SystemOrder.create_date_timestamp.desc()).\
			offset(offset).limit(self._page_count)
		orders = q.all()
		subpage = self._action

		return self.render("superAdmin/order-manage.html", context=dict(
			orders = orders,subpage = subpage,count=count))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("order_id:int", "system_username",
									  "system_password","system_code" ,
									  "action")
	def post(self):
		if self.args["action"] == "set_read":
			o = self.session.query(models.SystemOrder).\
				filter_by(order_id=self.args["order_id"]).one()
			if not o:
				return self.send_fail(error_text="订单不存在")
			o.set_read(self.session)
			u = models.ShopAdmin.set_system_info(
				self.session,
				admin_id = o.admin_id,
				system_username=self.args["system_username"],
				system_password=self.args["system_password"],
				system_code=self.args["system_code"])
			if not u:
				return self.send_fail(error_text="该用户不存在")
			return self.send_success()

# 用户管理
class User(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
		q = self.session.query(models.Accountinfo)
		sum = {}
		sum["all"] = q.count()
		sum["admin"] = q.filter(exists().where(models.Accountinfo.id == models.Shop.admin_id)).count()
		sum["customer"] = q.filter(exists().where(models.Accountinfo.id == models.CustomerShopFollow.customer_id)).count()
		sum["phone"] = q.filter(models.Accountinfo.phone != '').count()
		return self.render("superAdmin/user.html", sum=sum, context=dict(subpage='user'))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("action:str","inputinfo?:str","page:int")
	def post(self):
		action = self.args["action"]
		page = self.args["page"]
		page_size = 20

		#change by jyj 2015-6-22
		q = self.session.query(models.Accountinfo.id,models.Accountinfo.headimgurl_small,models.Accountinfo.nickname,models.Accountinfo.sex, \
					models.Accountinfo.wx_province,models.Accountinfo.wx_city,models.Accountinfo.phone,func.FROM_UNIXTIME(models.Accountinfo.birthday,"%Y-%m-%d")).order_by(desc(models.Accountinfo.id))
		##
		if action == "all":
			pass
		elif action == "admin":
			q = q.filter(exists().where(models.Accountinfo.id == models.Shop.admin_id))
		elif action == "customer":
			q = q.filter(exists().where(models.Accountinfo.id == models.CustomerShopFollow.customer_id))
		elif action == "phone":
			q = q.filter(models.Accountinfo.phone != '')
		# add by jyj 2015-6-23:
		elif action == "search":
			inputinfo = self.args["inputinfo"]
			q = q.filter(or_(models.Accountinfo.nickname.like("%{0}%".format(inputinfo)),(func.concat(models.Accountinfo.id,'')).like("%{0}%".format(inputinfo))))
		else:
			return self.send_error(404)
		users = q.offset(page*page_size).limit(page_size).all()
		for i in range(len(users)):
			f_names = self.session.query(models.Shop.id, models.Shop.shop_code,models.Shop.shop_name).\
				join(models.CustomerShopFollow).\
				filter(models.CustomerShopFollow.customer_id == users[i][0]).all()
			h_names = self.session.query(models.Shop.id,models.Shop.shop_code,models.Shop.shop_name).filter_by(admin_id=users[i][0]).all()

			#add by jyj 2015-6-22
			#将生日的时间戳转换为日期类型：
			# print(users[i][7])
			if users[i][7] == None:
				birthday = 0
			else:
				birthday = users[i][7]
			##
			users[i] = list(users[i])
			users[i].append(birthday)
			users[i].append(f_names)
			users[i].append(h_names)
		return self.send_success(data=users)

# 统计 - 用户增长
class IncStatic(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("superAdmin/count-user.html",context=dict(subpage='count',subcount='user'))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("action:str")
	def post(self):
		action = self.args["action"]
		if action == "curve":
			return self.curve()
		else:
			return self.error(404)

	@SuperBaseHandler.check_arguments("page:int")
	def curve(self):
		page = self.args["page"]

		if page == 0:
			now = datetime.datetime.now()
			start_date = datetime.datetime(now.year, now.month, 1)
			end_date =datetime.datetime(now.year,now.month,now.day,23,59,59)
			print(end_date)
		else:
			date = self.monthdelta(datetime.datetime.now(), page)
			start_date = datetime.datetime(date.year, date.month, 1)
			end_date = datetime.datetime(date.year, date.month, date.day,23,59,59)
			print(end_date)

		q = self.session.query(models.Accountinfo.id, models.Accountinfo.create_date_timestamp).\
			filter(models.Accountinfo.create_date_timestamp >= start_date.timestamp(),
				   models.Accountinfo.create_date_timestamp < end_date.timestamp())

		all_infos = q.all()
		admin_infos = q.filter(exists().where(models.Accountinfo.id == models.Shop.admin_id)).all()  # 至少有一家店铺
		customer_infos = q.filter(exists().where(models.Accountinfo.id == models.Customer.id)).all()
		phone_infos = q.filter(models.Accountinfo.phone != '').all()

		data = {}
		for x in range(1, end_date.day+1):  # 初始化数据
			data[x] = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}

		def count(infos, i):
			for info in infos:
				day = datetime.datetime.fromtimestamp(info[1]).day
				data[day][i] += 1

		count(all_infos, 1)
		count(admin_infos, 2)
		count(customer_infos, 3)
		count(phone_infos, 4)

		total = self.session.query(models.Accountinfo).count()

		for x in range(1, end_date.day+1)[::-1]:
			data[x][5] = total
			total -= data[x][1]
		l = []
		for key in data:
			l.append((end_date.strftime('%Y-%m-') + str(key), key, data[key][1],
					  data[key][2], data[key][3], data[key][4], data[key][5]))
		first_info = self.session.query(models.Accountinfo).first()
		page_sum = (datetime.datetime.now() - datetime.datetime.
					fromtimestamp(first_info.create_date_timestamp)).days//30 + 1
		return self.send_success(data=l[::-1], page_sum=page_sum)

# 统计 - 用户属性分布
class DistributStatic(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("superAdmin/count-attribute.html",context=dict(subpage='count',subcount='attribute'))

	@tornado.web.authenticated
	def post(self):
		total = self.session.query(models.Accountinfo).count()
		sex = self.session.query(models.Accountinfo.sex, func.count()).order_by(func.count().desc()).group_by(models.Accountinfo.sex).all()
		province = self.session.query(models.Accountinfo.wx_province, func.count()).order_by(func.count().desc()).\
			group_by(models.Accountinfo.wx_province).all()
		city = self.session.query(models.Accountinfo.wx_city, func.count()).order_by(func.count().desc()).\
			group_by(models.Accountinfo.wx_city).all()
		return self.send_success(total=total, sex=sex, province=province, city=city)

# 统计 - 店铺数据
class ShopStatic(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("superAdmin/count-shop.html",context=dict(subpage='count',subcount='shop'))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("action:str")
	def post(self):
		action = self.args["action"]

		if action == "num":
			return self.num()

		elif action == "province":
			provinces = self.session.query(models.Shop.shop_province, func.count()).\
				group_by(models.Shop.shop_province).all()
			data = []
			for province in provinces:
				data.append((dis_dict[province[0]]["name"], province[1]))

		elif action == "city":
			cities = self.session.query(models.Shop.shop_city, func.count()).\
				group_by(models.Shop.shop_city).all()
			data = []
			for city in cities:
				code = city[0]
				if "city" in dis_dict[city[0]//10000*10000]:
					name = dis_dict[city[0]//10000*10000]["city"][code]["name"]
				else:
					name = dis_dict[city[0]]["name"]
				data.append((name, city[1]))
		else:
			return self.send_fail()
		total = self.session.query(models.Shop).count()
		return self.send_success(data=data, total=total)

	@SuperBaseHandler.check_arguments("page:int")
	def num(self):
		page = self.args["page"]
		if page == 0:
			now = datetime.datetime.now()
			start_date = datetime.datetime(now.year, now.month, 1)
			# end_date = now +datetime.timedelta(1)
			end_date =datetime.datetime(now.year,now.month,now.day,23,59,59)
		else:
			date = self.monthdelta(datetime.datetime.now(), page)
			start_date = datetime.datetime(date.year, date.month, 1)
			end_date = datetime.datetime(date.year, date.month, date.day,23,59,59)

		# 日订单数，日总订单金额
		s = self.session.query(models.Order.create_date, func.count(), func.sum(models.Order.totalPrice)).\
			filter(models.Order.create_date >= start_date,
				   models.Order.create_date <= end_date,models.Order.status !=0).\
			group_by(func.year(models.Order.create_date),
					 func.month(models.Order.create_date),
					 func.day(models.Order.create_date)).\
			order_by(models.Order.create_date.desc()).all()

		# 总订单数
		total = self.session.query(func.sum(models.Order.totalPrice), func.count()).\
			filter(models.Order.create_date <=end_date,models.Order.status != 0).all()
		total = list(total[0])

		data = []
		i = 0
		date = end_date
		# data的封装格式为：[日期，日，日订单数，累计订单数，日订单总金额，累计订单总金额]
		while 1:
			if i < len(s) and s[i][0].date() == date.date():
				data.append((date.strftime('%Y-%m-%d'), date.day, s[i][1], total[1], format(s[i][2],'.2f'), format(total[0],'.2f')))
				total[1] -= s[i][1]
				total[0] -= s[i][2]
				i += 1
			else:
				data.append((date.strftime('%Y-%m-%d'), date.day, 0, total[1], format(0,'.2f'), format(total[0],'.2f')))
			date -= datetime.timedelta(1)
			if date <= start_date:
				break
		first_order = self.session.query(models.Order).\
			order_by(models.Order.create_date).first()
		page_sum = (datetime.datetime.now() - first_order.create_date).days//30 + 1
		return self.send_success(page_sum=page_sum, data=data)

# 统计 - 订单统计
# add by jyj 2015-6-15
class OrderStatic(SuperBaseHandler):
	def get(self):
		return self.render("superAdmin/count-order.html",context=dict(subcount='orderstatic'))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("action:str")
	def post(self):
		action = self.args["action"]
		if action == "order_time":
			return self.order_time()
		elif action == "receive_time":
			return self.receive_time()

	@SuperBaseHandler.check_arguments("type:int")
	def order_time(self):
		type = self.args["type"]
		q = self.session.query(func.hour(models.Order.create_date), func.minute(models.Order.create_date)).\
				filter(not_(models.Order.status.in_([-1,0])))
		#q = self.session.query(models.Order.create_date).\
		#		filter(not_(models.Order.status.in_([-1,0])))
		if type == 1:  # 累计数据
			pass
		elif type == 2:  # 昨天数据
			now = datetime.datetime.now() - datetime.timedelta(1)
			start_date = datetime.datetime(now.year, now.month, now.day, 0)
			end_date = datetime.datetime(now.year, now.month, now.day, 23,59,59)
			q = q.filter(models.Order.create_date >= start_date,
					   models.Order.create_date <= end_date)
		else:
			return self.send_error(404)
		data = {}
		for key in range(0, 24):
			data[key] = 0
		for e in q.all():
			if e[1] < 30:
				data[e[0]] += 1
			else:
				if e[0]+1 == 24:
					data[0] += 1
				else:
					data[e[0]] += 1

		return self.send_success(data=data)

	@SuperBaseHandler.check_arguments("type:int")
	def receive_time(self):
		type = self.args["type"]
		q = self.session.query(models.Order.type, models.Order.start_time, models.Order.end_time,models.Config.stop_range).\
			filter(not_(models.Order.status.in_([-1,0])),models.Order.shop_id == models.Shop.id,models.Shop.id == models.Config.id)
		if type == 1:
			orders = q.all()
		elif type == 2:
			now = datetime.datetime.now() - datetime.timedelta(1)
			start_date = datetime.datetime(now.year, now.month, now.day, 0)
			end_date = datetime.datetime(now.year, now.month, now.day, 23,59,59)
			orders = q.filter(models.Order.create_date >= start_date,
							  models.Order.create_date <= end_date).all()
		else:
			return self.send_error(404)

		#stop_range = self.current_shop.config.stop_range

		data = {}
		for key in range(0, 24):
			data[key] = 0
		for order in orders:
			if order[0] == 1:  # 立即送收货时间估计
				data[order[1].hour + (order[1].minute+order[3])//60] += 1
			else:  # 按时达收货时间估计
				data[(order[1].hour+order[2].hour)//2] += 1

		#print(data)
		return self.send_success(data=data)
##

class Official(SuperBaseHandler):
	def get(self):
		return self.render("m-official/home.html")

# class ShopClose(SuperBaseHandler):
# 	@tornado.web.authenticated
# 	def get(self):
# 		try:
# 			shops = self.session.query(models.Shop).filter_by(status =1).all()
# 		except:
# 			return self.send_fail('shopclose error')
# 		if shops:
# 			for shop in shops:
# 				shop_code = shop.shop_code
# 				shop_id = shop.id
# 				fruits = shop.fruits
# 				menus = shop.menus
# 				# print(menus)
# 				create_date = shop.create_date_timestamp
# 				x = datetime.datetime.fromtimestamp(create_date)
# 				# print(x)
# 				now = datetime.datetime.now()
# 				days = (now -x).days
# 				if days >14:
# 					if shop_code =='not set':
# 						shop.status = 0
# 					if len(fruits) == 0 and len(menus) == 0:
# 						shop.status = 0
# 					try:
# 						follower_count = self.session.query(models.CustomerShopFollow).filter_by(shop_id = shop_id).count()
# 					except:
# 						return self.send_fail('follower_count error')
# 					if follower_count <2:
# 						shop.status =0
# 				self.session.commit()
# 			return self.send_success()

# class Comment(SuperBaseHandler):
# 	@tornado.web.authenticated
# 	def get(self):
# 	    self.render('superAdmin/shop-comment-apply.html',context=dict(count = {'all':10,'all_temp':10}))

# 店铺 - 删除评论申请
class Comment(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
		data = []
		order_info = {}
		#apply_list = self.session.query(models.CommentApply).filter_by(has_done = 0).all()
		apply_list = self.session.query(models.CommentApply).order_by(desc(models.CommentApply.create_date)).all()
		apply_count = self.session.query(models.CommentApply).filter(models.CommentApply.has_done==0).count()
		for comment_apply in apply_list:
			apply_id =comment_apply.id
			order = comment_apply.order
			shop  = comment_apply.shop
			shop_code = shop.shop_code
			shop_name = shop.shop_name
			has_done = comment_apply.has_done
			admin_name= shop.admin.accountinfo.nickname
			# order info
			customer_id = order.customer_id
			customer = self.session.query(models.Accountinfo).filter_by(id = customer_id).first()
			if not customer:
				return self.send_error(404)
			name = customer.nickname
			comment = order.comment
			order_create_date = order.create_date
			num = order.num
			headimgurl_small = customer.headimgurl_small
			create_date = comment_apply.create_date
			order_info = dict(
				headimgurl_small = headimgurl_small,name = name , num = num ,order_create_date = order_create_date,\
				comment = comment)
			data.append([shop_code,shop_name,admin_name ,create_date, comment_apply.delete_reason,order_info,has_done,apply_id])

		q_temp = self.session.query(models.ShopTemp).count()
		all_shop = self.session.query(models.Shop).count()
		comment = self.session.query(models.Order).filter(models.Order.status.in_([6,7])).count()
		auth_apply=self.session.query(models.ShopAuthenticate).filter_by(has_done = 0).count()

		count = {
			"all_temp": q_temp,
			"all": all_shop,
			"comment":comment,
			"auth_apply":auth_apply
			}
		# return self.send_success(data = data)
		self.render('superAdmin/shop-comment-apply.html',context=dict(count = count,subpage="comment",subpage2="",data=data))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('action','apply_id:int','decline_reason?:str')
	def post(self):
		action = self.args['action']
		comment_id = self.args['apply_id']
		comment_apply = self.session.query(models.CommentApply).filter_by(id = comment_id).first()
		if not comment_apply:
			return self.send_error(404)
		order = comment_apply.order
		if action == 'commit':
			#order.status = 5
			#order.comment = None
			#order.comment_reply = None
			comment_apply.has_done = 1
			self.session.commit()
			return self.send_success(status = 0, msg = 'success',data = {})
		elif action == 'decline':
			comment_apply.decline_reason = self.args['decline_reason']
			comment_apply.has_done = 2
			self.session.commit()
			return self.send_success(status = 0 , msg = 'success' ,data = {})
		else:
			return self.send_error(404)

# add by jyj 2015-7-5
class CommentInfo(SuperBaseHandler):
	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("ajaxFlag")
	def get(self):
		output_data = []
		output_data_tmp = []
		page_size=15
		page = 0
		ajaxFlag = self.args["ajaxFlag"]

		order_list =  self.session.query(models.Order).filter(models.Order.status.in_([6,7])).order_by(desc(models.Order.comment_create_date)).offset(page*page_size).limit(page_size).all()

		all_comment_order = self.session.query(models.Order).filter(models.Order.status.in_([6,7])).order_by(desc(models.Order.comment_create_date))
		all_count = all_comment_order.count()
		full_count = all_comment_order.filter(models.Order.commodity_quality == 100,models.Order.send_speed == 100,models.Order.shop_service == 100).count()
		img_count = all_comment_order.filter(models.Order.comment_imgUrl.like('http:%')).count()

		for order in order_list:
			data = {}
			comment_image_list = []

			data["all_count"] = all_count
			data["full_count"] = full_count
			data["img_count"] = img_count

			data["headimgurl"] = self.session.query(models.Accountinfo.headimgurl_small).\
						filter(models.Accountinfo.id == order.customer_id).first()[0]
			data["nickname"] = self.session.query(models.Accountinfo.nickname).\
						filter(models.Accountinfo.id == order.customer_id).first()[0]
			if len(data["nickname"]) > 6:
				data["nickname"] = data["nickname"][0:6] + '...'
			data["create_date"] = order.create_date.strftime("%Y-%m-%d %H:%M:%S")
			if order.comment_create_date == None:
				data["comment_create_date"] = ''
			else:
				data["comment_create_date"] = order.comment_create_date.strftime("%Y-%m-%d %H:%M:%S")
			data["shop_name"] = self.session.query(models.Shop.shop_name).\
						filter(models.Shop.id == order.shop_id).first()[0]
			if len(data["shop_name"]) > 6:
				data["shop_name"] = data["shop_name"][0:5] + '...'

			data["shop_code"] = self.session.query(models.Shop.shop_code).\
						filter(models.Shop.id == order.shop_id).first()[0]
			data["order_num"] = order.num

			if order.comment == None:
				data["comment"] = "未评价"
			else:
				if len(order.comment) == 0:
					data["comment"] = "未评价"
				else:
					data["comment"] = order.comment

			if order.comment_imgUrl == None:
				data["has_comment_img"] = 0
			else:
				if len(order.comment_imgUrl) == 0:
					data["has_comment_img"] = 0
				else:
					data["has_comment_img"] = 1

			if data["has_comment_img"] == 1:
				comment_image_list = order.comment_imgUrl.split(';')
				data["comment_image_list"] = comment_image_list

			if order.commodity_quality == None:
				data["commodity_quality"] = '未评价'
			else:
				data["commodity_quality"] = order.commodity_quality

			if order.send_speed == None:
				data["send_speed"] = '未评价'
			else:
				data["send_speed"] = order.send_speed

			if order.shop_service == None:
				data["shop_service"] = '未评价'
			else:
				data["shop_service"] = order.shop_service

			if order.comment_reply == None:
				data["comment_reply"] = "无回复"
			else:
				data["comment_reply"] = order.comment_reply
			output_data_tmp.append(data)

		output_data = output_data_tmp

		if all_count//page_size < all_count/page_size:
			page_sum = all_count//page_size + 1
		else:
			page_sum = all_count//page_size


		q_temp = self.session.query(models.ShopTemp).count()
		all_shop = self.session.query(models.Shop).count()
		comment = self.session.query(models.Order).filter(models.Order.status.in_([6,7])).count()
		auth_apply=self.session.query(models.ShopAuthenticate).filter_by(has_done = 0).count()

		count = {
			"all_temp": q_temp,
			"all": all_shop,
			"comment":comment,
			"auth_apply":auth_apply
			}

		if ajaxFlag != '1':
			self.render('superAdmin/shop-comment-info.html',output_data = output_data,page_sum = page_sum,context=dict(count = count,subpage="comment",subpage2="info"))
		else:
			return self.send_success(page_sum = page_sum)
	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('page:int','action:str')
	def post(self):
		page = self.args['page']
		action = self.args['action']
		page_size = 15

		output_data_tmp = []
		output_data = []

		order_list_data = self.session.query(models.Order).filter(models.Order.status.in_([6,7])).order_by(desc(models.Order.comment_create_date))


		if action == 'all':
			order_list = order_list_data.offset(page*page_size).limit(page_size).all()
			for order in order_list:
				data = {}
				comment_image_list = []

				data["headimgurl"] = self.session.query(models.Accountinfo.headimgurl_small).\
							filter(models.Accountinfo.id == order.customer_id).first()[0]
				data["nickname"] = self.session.query(models.Accountinfo.nickname).\
							filter(models.Accountinfo.id == order.customer_id).first()[0]
				if len(data["nickname"]) > 6:
					data["nickname"] = data["nickname"][0:5] + '...'
				data["create_date"] = order.create_date.strftime("%Y-%m-%d %H:%M:%S")
				if order.comment_create_date == None:
					data["comment_create_date"] = ''
				else:
					data["comment_create_date"] = order.comment_create_date.strftime("%Y-%m-%d %H:%M:%S")

				data["shop_name"] = self.session.query(models.Shop.shop_name).\
							filter(models.Shop.id == order.shop_id).first()[0]
				if len(data["shop_name"]) > 6:
					data["shop_name"] = data["shop_name"][0:5] + '...'

				data["shop_code"] = self.session.query(models.Shop.shop_code).\
							filter(models.Shop.id == order.shop_id).first()[0]
				data["order_num"] = order.num

				if order.comment == None:
					data["comment"] = "未评价"
				else:
					if len(order.comment) == 0:
						data["comment"] = "未评价"
					else:
						data["comment"] = order.comment

				if order.comment_imgUrl == None:
					data["has_comment_img"] = 0
				else:
					if len(order.comment_imgUrl) == 0:
						data["has_comment_img"] = 0
					else:
						data["has_comment_img"] = 1

				if data["has_comment_img"] == 1:
					comment_image_list = order.comment_imgUrl.split(';')
					data["comment_image_list"] = comment_image_list

				if order.commodity_quality == None:
					data["commodity_quality"] = '未评价'
				else:
					data["commodity_quality"] = order.commodity_quality

				if order.send_speed == None:
					data["send_speed"] = '未评价'
				else:
					data["send_speed"] = order.send_speed

				if order.shop_service == None:
					data["shop_service"] = '未评价'
				else:
					data["shop_service"] = order.shop_service

				if order.comment_reply == None:
					data["comment_reply"] = "无回复"
				else:
					data["comment_reply"] = order.comment_reply

				output_data_tmp.append(data)

			output_data = output_data_tmp
			all_count = order_list_data.count()
			if all_count//page_size < all_count/page_size:
				page_sum = all_count//page_size + 1
			else:
				page_sum = all_count//page_size

		elif action == 'full':
			order_list = order_list_data.filter(models.Order.commodity_quality == 100,\
							 models.Order.send_speed ==100,models.Order.shop_service == 100).offset(page*page_size).limit(page_size).all()
			for order in order_list:
				data = {}
				comment_image_list = []

				data["headimgurl"] = self.session.query(models.Accountinfo.headimgurl_small).\
							filter(models.Accountinfo.id == order.customer_id).first()[0]
				data["nickname"] = self.session.query(models.Accountinfo.nickname).\
							filter(models.Accountinfo.id == order.customer_id).first()[0]
				if len(data["nickname"]) > 6:
					data["nickname"] = data["nickname"][0:6] + '...'

				data["create_date"] = order.create_date.strftime("%Y-%m-%d %H:%M:%S")
				if order.comment_create_date == None:
					data["comment_create_date"] = ''
				else:
					data["comment_create_date"] = order.comment_create_date.strftime("%Y-%m-%d %H:%M:%S")

				data["shop_name"] = self.session.query(models.Shop.shop_name).\
							filter(models.Shop.id == order.shop_id).first()[0]
				if len(data["shop_name"]) > 6:
					data["shop_name"] = data["shop_name"][0:5] + '...'

				data["shop_code"] = self.session.query(models.Shop.shop_code).\
							filter(models.Shop.id == order.shop_id).first()[0]
				data["order_num"] = order.num

				if order.comment == None:
					data["comment"] = "未评价"
				else:
					if len(order.comment) == 0:
						data["comment"] = "未评价"
					else:
						data["comment"] = order.comment

				if order.comment_imgUrl == None:
					data["has_comment_img"] = 0
				else:
					if len(order.comment_imgUrl) == 0:
						data["has_comment_img"] = 0
					else:
						data["has_comment_img"] = 1

				if data["has_comment_img"] == 1:
					comment_image_list = order.comment_imgUrl.split(';')
					data["comment_image_list"] = comment_image_list

				if order.commodity_quality == None:
					data["commodity_quality"] = '未评价'
				else:
					data["commodity_quality"] = order.commodity_quality

				if order.send_speed == None:
					data["send_speed"] = '未评价'
				else:
					data["send_speed"] = order.send_speed

				if order.shop_service == None:
					data["shop_service"] = '未评价'
				else:
					data["shop_service"] = order.shop_service

				if order.comment_reply == None:
					data["comment_reply"] = "无回复"
				else:
					data["comment_reply"] = order.comment_reply

				output_data_tmp.append(data)

			output_data = output_data_tmp

			full_count = order_list_data.filter(models.Order.commodity_quality == 100,\
							 models.Order.send_speed ==100,models.Order.shop_service == 100).count()
			if full_count//page_size < full_count/page_size:
				page_sum = full_count//page_size + 1
			else:
				page_sum = full_count//page_size

		elif action == 'img':
			order_list = order_list_data.filter(models.Order.comment_imgUrl.like('http:%')).offset(page*page_size).limit(page_size).all()
			for order in order_list:
				data = {}
				comment_image_list = []

				data["headimgurl"] = self.session.query(models.Accountinfo.headimgurl_small).\
							filter(models.Accountinfo.id == order.customer_id).first()[0]
				data["nickname"] = self.session.query(models.Accountinfo.nickname).\
							filter(models.Accountinfo.id == order.customer_id).first()[0]
				if len(data["nickname"]) > 6:
					data["nickname"] = data["nickname"][0:6] + '...'

				data["create_date"] = order.create_date.strftime("%Y-%m-%d %H:%M:%S")
				if order.comment_create_date == None:
					data["comment_create_date"] = ''
				else:
					data["comment_create_date"] = order.comment_create_date.strftime("%Y-%m-%d %H:%M:%S")

				data["shop_name"] = self.session.query(models.Shop.shop_name).\
							filter(models.Shop.id == order.shop_id).first()[0]
				if len(data["shop_name"]) > 6:
					data["shop_name"] = data["shop_name"][0:5] + '...'

				data["shop_code"] = self.session.query(models.Shop.shop_code).\
							filter(models.Shop.id == order.shop_id).first()[0]
				data["order_num"] = order.num

				if order.comment == None:
					data["comment"] = "未评价"
				else:
					if len(order.comment) == 0:
						data["comment"] = "未评价"
					else:
						data["comment"] = order.comment

				if order.comment_imgUrl == None:
					data["has_comment_img"] = 0
				else:
					if len(order.comment_imgUrl) == 0:
						data["has_comment_img"] = 0
					else:
						data["has_comment_img"] = 1

				if data["has_comment_img"] == 1:
					comment_image_list = order.comment_imgUrl.split(',')
					data["comment_image_list"] = comment_image_list

				if order.commodity_quality == None:
					data["commodity_quality"] = '未评价'
				else:
					data["commodity_quality"] = order.commodity_quality

				if order.send_speed == None:
					data["send_speed"] = '未评价'
				else:
					data["send_speed"] = order.send_speed

				if order.shop_service == None:
					data["shop_service"] = '未评价'
				else:
					data["shop_service"] = order.shop_service

				if order.comment_reply == None:
					data["comment_reply"] = "无回复"
				else:
					data["comment_reply"] = order.comment_reply

				output_data_tmp.append(data)
			output_data = output_data_tmp

			img_count = order_list_data.filter(models.Order.comment_imgUrl.like('http:%')).count()
			if img_count//page_size < img_count/page_size:
				page_sum = img_count//page_size + 1
			else:
				page_sum = img_count//page_size

		else:
			return self.send_error(404)
		return self.send_success(output_data = output_data,page_sum = page_sum)
##

# 店铺 - 店铺认证申请
class ShopAuthenticate(SuperBaseHandler):
	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('page')
	def get(self):
		page=int(self.args["page"])
		page_size = 10
		page_area =page*page_size

		apply_list=self.session.query(models.ShopAuthenticate).order_by(desc(models.ShopAuthenticate.id)).offset(page_area).limit(10).all()

		q_temp = self.session.query(models.ShopTemp).count()
		all_shop = self.session.query(models.Shop).count()
		comment = self.session.query(models.Order).filter(models.Order.status.in_([6,7])).count()
		auth_apply=self.session.query(models.ShopAuthenticate).filter_by(has_done = 0).count()

		count = {
			"all_temp": q_temp,
			"all": all_shop,
			"comment":comment,
			"auth_apply":auth_apply
			}

		self.render('superAdmin/shop-cert-apply.html',context=dict(count = count,subpage="auth",auth_apply_list=apply_list))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('action','apply_id','decline_reason?:str','apply_type:int')
	def post(self):
		action = self.args['action']
		apply_id = self.args['apply_id']
		apply_type = int(self.args["apply_type"])
		try:
			shop_auth_apply = self.session.query(models.ShopAuthenticate).filter_by(id = apply_id).first()
		except:
			print('ShopAuthenticate: shop_auth_apply not found')

		try:
			shop = self.session.query(models.Shop).filter_by(id = shop_auth_apply.shop_id).first()
		except:
			print('ShopAuthenticate: shop not found')

		if not shop_auth_apply:
			return self.error(404)
		if action == 'commit':
			shop_auth_apply.has_done = 1
			if apply_type == 1:
				if shop.auth_change == 0:
					shop.shop_auth = 1
					shop.auth_change = 1
				elif shop.auth_change == 1:
					shop.shop_auth = 4
					shop.auth_change = 2
			elif apply_type == 2:
				if shop.auth_change == 0:
					shop.shop_auth = 2
					shop.auth_change = 1
				elif shop.auth_change == 1:
					shop.shop_auth = 3
					shop.auth_change = 2
			self.session.commit()
			#发送短消息提醒
			if shop.shop_phone:
				shop_auth_msg(shop.shop_phone,shop.admin.accountinfo.nickname,shop.name)
			else:
				# print("店铺没有预留电话！")
				print("no phone")
			#发送模板消息
			self.shop_auth_msg(shop,True)
		elif action == 'decline':
			decline_reason = self.args['decline_reason']
			shop_auth_apply.has_done = 2
			shop_auth_apply.decline_reason=decline_reason
			if shop.auth_change == 0:
				shop.shop_auth = 0
			self.session.commit()
			#发送短消息提醒
			if shop.shop_phone:
				shop_auth_fail_msg(shop.shop_phone,shop.admin.accountinfo.nickname,shop.name)
			else:
				# print("店铺没有预留电话！")
				print("no phone")
			#发送模板消息
			self.shop_auth_msg(shop,False)
		else:
			return self.send_error(404)
		return self.send_success(status=0,msg = 'success',data = {})

# 余额 - 余额详情
class Balance(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):

		cash_list = []
		cash_on = 0
		total_balance = 0
		cash_success = 0
		cash_times = 0
		cash_persons = 0
		cash_list = self.session.query(models.ApplyCashHistory).filter_by(has_done=0).all()
		shop_list = self.session.query(models.Shop).all()

		cash_success_list = self.session.query(models.ApplyCashHistory).filter_by(has_done=1).all()
		person_num = self.session.query(models.ApplyCashHistory).distinct(models.ApplyCashHistory.shop_id).count()
		# print(person_num,'haaha')

		for item in cash_list:
			cash_on += item.value
		for item in shop_list:
			total_balance += item.shop_balance

		cash_on = format(cash_on,'.2f')
		total_balance = format(total_balance,'.2f')
		return self.render('superAdmin/balance-detail.html',cash_times=cash_times,cash_success=cash_success,\
			total_balance=total_balance,cash_on=cash_on,context=dict(page="detail"))


	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('action','page:int')
	def post(self):
		history = []
		page =0
		page_size=15
		page_sum=0
		count=0
		action = self.args['action']
		page = self.args['page']-1
		history_list = []
		total = 0
		times = 0
		persons = 0
		pay = 0
		left = 0
		balance_history = self.session.query(models.BalanceHistory).order_by(desc(models.BalanceHistory.create_time))
		if action == 'all_history':
			history_list =balance_history .offset(page*page_size).limit(page_size).all()
			count = balance_history.count()
		elif action == 'recharge':
			history_list = self.session.query(models.BalanceHistory).filter_by(balance_type = 0).\
			order_by(desc(models.BalanceHistory.create_time)).offset(page*page_size).limit(page_size).all()
			q = self.session.query(func.sum(models.BalanceHistory.balance_value),func.count()).filter_by(balance_type = 0).all()
			q1 = self.session.query(func.sum(models.BalanceHistory.balance_value)).filter_by(balance_type = 1,is_cancel = 0).all()
			if q[0][0]:
				total =q[0][0]
			count = q[0][1]
			if q1[0][0]:
				pay = q1[0][0]
			total = format(total,'.2f')
			pay = format(pay,'.2f')
			left = float(total)-float(pay)
			left = format(left,'.2f')
		elif action == 'online':
			history_list = self.session.query(models.BalanceHistory).filter_by(balance_type = 3)\
			.order_by(desc(models.BalanceHistory.create_time)).offset(page*page_size).limit(page_size).all()
			q = self.session.query(func.sum(models.BalanceHistory.balance_value),func.count()).filter_by(balance_type =3).all()
			persons = self.session.query(models.BalanceHistory.customer_id).distinct().filter_by(balance_type = 3).count()
			if q[0][0]:
				total = q[0][0]
			total = format(total,'.2f')
			count = q[0][1]
			times = count
		elif action == 'cash_history':
			history_list = self.session.query(models.BalanceHistory).filter_by(balance_type = 2)\
			.order_by(desc(models.BalanceHistory.create_time)).offset(page*page_size).limit(page_size).all()
			q = self.session.query(func.sum(models.BalanceHistory.balance_value),func.count()).filter_by(balance_type = 2).all()
			count =q[0][1]
			if q[0][0]:
				total=q[0][0]
			total = format(total,'.2f')
			times = count

		# add by jyj 2015-7-4:
		elif action == 'balance_list':
			balance_list = self.session.query(models.BalanceHistory.shop_id,models.BalanceHistory.create_time,models.BalanceHistory.shop_totalPrice).\
					filter(models.BalanceHistory.shop_totalPrice >= 0,models.BalanceHistory.shop_totalPrice != None).order_by(desc(models.BalanceHistory.create_time))
			history_list = balance_list.all()

			exist_id_list = []
			history = []
			for tmp in history_list:
				item = {}
				if tmp[0] not in exist_id_list:
					exist_id_list.append(tmp[0])
					if tmp[2] != 0:
						shop_name = self.session.query(models.Shop.shop_name).filter(models.Shop.id == tmp[0]).all()
						shop_code = self.session.query(models.Shop.shop_code).filter(models.Shop.id == tmp[0]).all()
						item["shop_name"] = shop_name[0][0]
						item["latest_time"] = tmp[1].strftime("%Y-%m-%d %H:%M:%S")
						item["total_price"] =  tmp[2]
						item["shop_code"] = shop_code[0][0]

						history.append(item)
				else:
					pass
			history.sort(key=operator.itemgetter("total_price"),reverse=True)
			if len(history)//page_size < len(history)/page_size:
				page_sum = len(history)//page_size + 1
			else:
				page_sum = len(history)//page_size
			history = history[page*page_size:page*page_size+page_size:1]

			return self.send_success(page_sum=page_sum,history = history)
		##
		else:
			return self.send_error(404)
		if not history_list:
			print('Balance: history_list error')
		for temp in history_list:
				shop = self.session.query(models.Shop).filter_by(id=temp.shop_id).first()
				shop_name = shop.shop_name
				shop_code = shop.shop_code
				create_time = temp.create_time.strftime("%Y-%m-%d %H:%M:%S")
				shop_totalBalance = temp.shop_totalPrice
				if shop_totalBalance == None:
					shop_totalBalance=0
				shop_totalBalance = format(shop_totalBalance,'.2f')
				record = ''
				if temp.balance_type in [0,3]:
					record = temp.balance_record[0:8]
				history.append({'shop_name':shop_name,'shop_code':shop_code,'time':create_time,'balance':shop_totalBalance,\
					'balance_value':temp.balance_value,'type':temp.balance_type,'admin_id':temp.superAdmin_id,'record':record})
		page_sum=int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1
		return self.send_success(history = history,page_sum=page_sum,total = total,times = times,persons=persons,pay=pay,left = left)

		# return self.send_success()

# 余额 - 提现申请
class ApplyCash(SuperBaseHandler):

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('action:?str','page?:int')
	def get(self):
		page_size =10
		page_sum =0
		count = 0
		history = []
		apply_list = None
		action = self.args['action']
		nomore = False
		page = 0
		all_cash = 0
		person_cash = 0
		company_cash = 0
		all_num = 0
		person_num = 0
		company_num = 0
		cash_history = []
		try:
			cash_history = self.session.query(models.ApplyCashHistory).filter_by(has_done = 0).all()
		except:
			print('ApplyCash: no cash_history')
		if cash_history!=[]:
			alls = self.session.query(func.sum(models.ApplyCashHistory.value),func.count()).filter_by(has_done = 0).all()
			persons = self.session.query(func.sum(models.ApplyCashHistory.value),func.count()).filter_by(has_done = 0)\
			.filter(models.ApplyCashHistory.shop_auth.in_([1,4])).all()
			companys = self.session.query(func.sum(models.ApplyCashHistory.value),func.count()).filter_by(has_done = 0)\
			.filter(models.ApplyCashHistory.shop_auth.in_([2,3])).all()
			if alls[0][0]:
				all_num = alls[0][1]
				all_cash = alls[0][0]
			if persons[0][0]:
				person_num = persons[0][1]
				person_cash = persons[0][0]
			if companys[0][0]:
				company_num = companys[0][1]
				company_cash = companys[0][0]

		all_cash=format(all_cash,'.2f')
		person_cash=format(person_cash,'.2f')
		company_cash=format(company_cash,'.2f')

		cash_history = self.session.query(models.ApplyCashHistory).filter_by(has_done = 0)
		if 'page' in self.args:
			page = int(self.args['page'])
		if action == 'all_apply' or action == '[]':
			apply_list =cash_history.offset(page*page_size).limit(page_size).all()
			count = cash_history.count()
		elif action == 'company':
			apply_list = cash_history.filter(models.ApplyCashHistory.shop_auth.in_([2,3])).offset(page*page_size).limit(page_size).all()
			count = cash_history.filter(models.ApplyCashHistory.shop_auth.in_([2,3])).count()
		elif action == 'person':
			apply_list = cash_history.filter(models.ApplyCashHistory.shop_auth.in_([1,4])).offset(page*page_size).limit(page_size).all()
			count = cash_history.filter(models.ApplyCashHistory.shop_auth.in_([1,4])).count()
		if apply_list:
			for temp in apply_list:
				shop_name = self.session.query(models.Shop).filter_by(id=temp.shop_id).first().shop_name
				history.append({"id":temp.id,"shop_code":temp.shop_code,"shop_name":shop_name,"shop_auth":temp.shop_auth,\
					"shop_balance":temp.shop_balance,"create_time":temp.create_time.strftime('%Y-%m-%d %H:%M:%S'),"value":temp.value,\
					"alipay_account":temp.alipay_account,"applicant_name":temp.applicant_name,'account_name':temp.account_name})
		page_sum=int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1
		if action!='[]':
			return self.send_success(history=history,page_sum=page_sum)
		else:
			return self.render('superAdmin/balance-apply.html',history=history,page_sum=page_sum,all_cash=all_cash,person_cash=person_cash,\
				company_cash=company_cash,all_num=all_num,person_num=person_num,company_num=company_num,context=dict(page='cash'))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('action','apply_id?:int','decline_reason?:str')
	def post(self):
		history = []
		apply_list = None
		action = self.args['action']
		apply_cash = ''
		if action == 'decline':
			apply_id = self.args['apply_id']
			apply_cash = self.session.query(models.ApplyCashHistory).filter_by(id = apply_id).first()
			if apply_cash == '':
				return self.send_fail('apply_cash not found')
			apply_cash.has_done = 2
			apply_cash.decline_reason = self.args['decline_reason']
			self.session.commit()

		elif action == 'commit':
			apply_id = self.args['apply_id']
			apply_cash = self.session.query(models.ApplyCashHistory).filter_by(id = apply_id).first()
			if apply_cash == '':
				return self.send_fail('apply_cash not found')
			apply_cash.has_done = 1
			shop = self.session.query(models.Shop).filter_by(id = apply_cash.shop_id).first()
			if not shop:
				return self.send_fail('shop not found')
			shop.is_balance = 1
			shop.shop_balance = shop.shop_balance-apply_cash.value
			shop.available_balance = shop.available_balance - apply_cash.value
			#往 blancehistory中插入一条数据，以免到时候 查看所有记录的时候到两张表中去取 效率低下
			name = apply_cash.applicant_name
			balance_history = models.BalanceHistory(balance_record = '提现：管理员 '+name,balance_type =\
				2,balance_value = apply_cash.value ,customer_id = apply_cash.shop.admin.accountinfo.id,name = \
				name,shop_id = apply_cash.shop_id,shop_totalPrice = shop.shop_balance,superAdmin_id = \
				self.current_user.id,available_balance = shop.available_balance)
			self.session.add(balance_history)
			self.session.commit()
		return self.send_success(history = history)



#add by jyj 2015-6-17
class CheckCash(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("superAdmin/balance-check.html",context=dict(page='check'))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('action','data','page?:int')
	def post(self):
		page_size = 5
		action = self.args["action"]
		if action == 'check':
			data = self.args["data"]

			date_tmp = time.strptime(data["check_date"],"%Y-%m-%d")
			y,m,d = date_tmp[:3]
			check_time = datetime.datetime(y,m,d,23,59,59)
			record = self.session.query(models.CheckProfit).filter(models.CheckProfit.create_time == check_time).first();

			wx = record.wx_record
			wx_count = record.wx_count_record
			alipay = record.alipay_record
			alipay_count = record.alipay_count_record
			widt = record.widt_record
			widt_count = record.widt_count_record
			total = record.total_record
			total_count = record.total_count_record

			data["is_checked"] = int(data["is_checked"] )
			data["wx"] =round(float(data["wx"]),2)
			data["alipay"] =round(float(data["alipay"]),2)
			data["widt"] =round(float(data["widt"]),2)
			data["wx_count"] = int(data["wx_count"])
			data["alipay_count"] = int(data["alipay_count"])
			data["widt_count"] = int(data["widt_count"])

			if data["wx"]==wx and data["wx_count"]==wx_count and data["alipay"]==alipay and data["alipay_count"]==alipay_count and \
			   data["widt"]==widt and data["widt_count"]==widt_count and data["wx"]+data["alipay"]==total and data["wx_count"]+data["alipay_count"]==total_count:
				data["is_checked"] = 1
			else:
				data["is_checked"] = 0

			inserted_query = self.session.query(models.CheckProfit).filter(models.CheckProfit.create_time==check_time,models.CheckProfit.is_checked==1).all()
			if inserted_query == None:
				is_inserted = 0
				data["is_checked"] = 1
			elif len(inserted_query) == 0:
				is_inserted = 0
				data["is_checked"] = 1
			else:
				is_inserted = 1

			if data["is_checked"] == 1 and is_inserted == 0:
				check_history = models.CheckProfit(create_time = check_time,is_checked =\
					1,wx_record = wx,wx_count_record = wx_count,alipay_record = \
					alipay,alipay_count_record = alipay_count,widt_record = widt,widt_count_record = \
					widt_count,total_record = total,total_count_record=total_count,wx=wx,wx_count= \
					wx_count,alipay=alipay,alipay_count=alipay_count,widt=widt,widt_count=widt_count,total=total,total_count=total_count)
				self.session.add(check_history)
				self.session.query(models.CheckProfit).filter(models.CheckProfit.create_time == check_time,models.CheckProfit.is_checked==0).delete()
				self.session.commit()

			output_data = data
			return self.send_success(output_data=output_data)
		elif action == 'history':
			page = self.args["page"]
			check_profit = self.session.query(models.CheckProfit).order_by(desc(models.CheckProfit.create_time))
			check_profit_len = check_profit.count()

			if check_profit_len == 0:
				check_update_start = self.session.query(models.BalanceHistory).filter(models.BalanceHistory.balance_type.in_([0,3])).order_by(models.BalanceHistory.create_time).first().create_time
				check_update_start  = check_update_start - datetime.timedelta(1)
				check_update_start = datetime.datetime(check_update_start.year, check_update_start.month, check_update_start.day, 23,59,59)
			else:
				check_profit_last  = check_profit.first().create_time
				check_update_start = datetime.datetime(check_profit_last.year, check_profit_last.month, check_profit_last.day, 23,59,59)
			# add by jyj 2015-7-7
			now_time = time.localtime(time.time())
			now_time = datetime.datetime(*now_time[:6])
			now_time = datetime.datetime(now_time.year, now_time.month, now_time.day, 0,0,0)
			##

			balance_history_time = self.session.query(models.BalanceHistory).\
				   filter(models.BalanceHistory.balance_type.in_([0,3])).\
				   filter(models.BalanceHistory.create_time > check_update_start,models.BalanceHistory.create_time < now_time).\
				   group_by(func.date_format(models.BalanceHistory.create_time,"%Y-%m-%d")).\
				   order_by(models.BalanceHistory.create_time)
			history_list_time = balance_history_time.all()
			for his in history_list_time:
				create_time = his.create_time
				create_time = datetime.datetime(create_time.year, create_time.month, create_time.day, 23,59,59)
				wx = 0.0
				wx_count = 0
				alipay = 0.0
				alipay_count = 0

				start_time = datetime.datetime(create_time.year, create_time.month, create_time.day, 0,0,0)
				tomorrow = create_time + datetime.timedelta(1)
				end_time = datetime.datetime(tomorrow.year, tomorrow.month, tomorrow.day, 0,0,0)

				balance_his = self.session.query(models.BalanceHistory).\
						   filter(models.BalanceHistory.balance_type.in_([0,3]),models.BalanceHistory.create_time >= start_time,\
						   	models.BalanceHistory.create_time < end_time);
				his_list = balance_his.all()

				for temp in his_list:
					#微信收入和笔数：
					#支付宝收入和笔数：
					if temp.balance_type == 3:
						if temp.balance_record[5:7] == '支付':
							alipay += temp.balance_value
							alipay_count += 1
						elif temp.balance_record[5:7] == '微信':
							wx += temp.balance_value
							wx_count += 1
					#用户充值：
					elif temp.balance_type == 0:
						if temp.balance_record[5:7] == '支付':
							alipay += temp.balance_value
							alipay_count += 1
						elif temp.balance_record[5:7] == '微信':
							wx += temp.balance_value
							wx_count += 1

				#总收入和笔数：
				total = wx + alipay
				total_count = wx_count + alipay_count

				# 提现金额和提现笔数：
				widt = self.session.query(func.sum(models.ApplyCashHistory.value)).filter(models.ApplyCashHistory.has_done==1,\
							models.ApplyCashHistory.create_time >= start_time,models.ApplyCashHistory.create_time < end_time).all()
				widt = widt[0][0]
				if widt == None:
					widt = 0

				widt_count = self.session.query(models.ApplyCashHistory).filter(models.ApplyCashHistory.has_done==1,\
							models.ApplyCashHistory.create_time >= start_time,models.ApplyCashHistory.create_time < end_time).count()
				data = {}
				data["create_time"] = create_time
				data["total"] = format(total,".2f")
				data["total_count"] = total_count
				data["wx"] = format(wx,".2f")
				data["wx_count"] = wx_count
				data["alipay"] = format(alipay,".2f")
				data["alipay_count"] = alipay_count
				data["widt"] = format(widt,".2f")
				data["widt_count"] = widt_count

				self.session.query(models.CheckProfit).filter(models.CheckProfit.create_time == create_time,models.CheckProfit.is_checked==0).delete()
				check_history = models.CheckProfit(create_time = data["create_time"],is_checked =\
					0,wx_record = data["wx"],wx_count_record = data["wx_count"],alipay_record = \
					data["alipay"] ,alipay_count_record = data["alipay_count"] ,widt_record = data["widt"] ,widt_count_record = \
					data["widt_count"] ,total_record = data["total"] ,total_count_record=data["total_count"],wx=0,wx_count= \
					0,alipay=0,alipay_count=0,widt=0,widt_count=0,total=0,total_count=0)
				self.session.add(check_history)
				self.session.commit()

			# #检查昨天的对账单是否创建，如果没有创建，说明balance_history的昨天的在线支付、用户余额充值的记录为空，说明昨天的对账单的记录值为0，
			# #这还是要创建check_profit表的昨天的数据的，只不过收入数据和提现数据每一项都为0.

			page_sum = self.session.query(models.CheckProfit).count();
			if page_sum//page_size < page_sum/page_size:
				page_sum = page_sum//page_size + 1
			else:
				page_sum = page_sum//page_size

			check_history = self.session.query(models.CheckProfit).order_by(desc(models.CheckProfit.create_time)).offset((page-1)*page_size).limit(page_size).all()
			output_data = []
			for check_his in check_history:
				#其实如果对账成功，那么CheckProfit表中的记录值和实际值肯定是一样的；
				#如果还没有对账，那么CheckProfit表中只会有记录值。
				#所以向前台返回数据的时候没有必要把所有数据都返回，而只需要把记录的数据返回即可。
				data = {}
				data["create_time"] = check_his.create_time.strftime("%Y-%m-%d")
				data["is_checked"] = check_his.is_checked
				data["wx_record"] = check_his.wx_record
				data["wx_count_record"] = check_his.wx_count_record
				data["alipay_record"] = check_his.alipay_record
				data["alipay_count_record"] = check_his.alipay_count_record
				data["widt_record"] = check_his.widt_record
				data["widt_count_record"] = check_his.widt_count_record
				data["total_record"] = check_his.total_record
				data["total_count_record"] = check_his.total_count_record
				data["wx"] = check_his.wx
				data["wx_count"] = check_his.wx_count
				data["alipay"] = check_his.alipay
				data["alipay_count"] = check_his.alipay_count
				data["widt"] = check_his.widt
				data["widt_count"] = check_his.widt_count
				data["total"] = check_his.total
				data["total_count"] = check_his.total_count
				output_data.append(data)

			return self.send_success(output_data=output_data,page_sum = page_sum)

#add by jyj 2015-6-16
class ShopBalanceDetail(SuperBaseHandler):
	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("page?:int")
	def get(self,shop_code):
		if shop_code != "not set":
			pass
		else:
			return self.send_error(404)
		history_list = []
		history = []

		shop_id = self.session.query(models.Shop.id).filter(models.Shop.shop_code == shop_code).first()
		shop_id = shop_id[0]

		cash_applying = self.session.query(models.ApplyCashHistory.value).filter(models.ApplyCashHistory.has_done == 0,models.ApplyCashHistory.shop_id == shop_id).first()
		if(cash_applying == None):
			cash_applying = 0
			cash_applying = format(cash_applying,'.2f')
		else:
			cash_applying = cash_applying[0]
			cash_applying = format(cash_applying,'.2f')

		balance_history = self.session.query(models.BalanceHistory).\
				   filter(models.BalanceHistory.shop_id == shop_id,models.BalanceHistory.balance_type.in_([0,2,3])).order_by(desc(models.BalanceHistory.create_time)).offset(0).limit(1)
		history_list = balance_history.all()

		for temp in history_list:
			shop = self.session.query(models.Shop).filter(models.Shop.shop_code == shop_code).first()
			shop_name = shop.shop_name
			create_time = temp.create_time.strftime("%Y-%m-%d %H:%M:%S")
			shop_totalBalance = temp.shop_totalPrice

			if shop_totalBalance == None:
					shop_totalBalance=0
			shop_totalBalance = format(shop_totalBalance,'.2f')

			history.append({'shop_name':shop_name,'balance':shop_totalBalance,'cash_applying':cash_applying})
		return self.render("superAdmin/shop-balance-detail.html",history = history,context=dict())

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('page:int')
	def post(self,shop_code):
		page_size = 20
		page = int(self.args["page"])
		if shop_code != "not set":
			pass
		else:
			return self.send_error(404)
		history_list = []
		history = []

		shop_id = self.session.query(models.Shop.id).filter(models.Shop.shop_code == shop_code).first()
		shop_id = shop_id[0]

		record_num = balance_history = self.session.query(models.BalanceHistory).\
				   filter(models.BalanceHistory.shop_id == shop_id,models.BalanceHistory.balance_type.in_([0,2,3])).order_by(desc(models.BalanceHistory.create_time)).count()
		page_sum = record_num/page_size
		if page == 0:  #如果前台传来的page=0，表示只获取page_sum
			return self.send_success(page_sum=page_sum)

		cash_applying = self.session.query(models.ApplyCashHistory.value).filter(models.ApplyCashHistory.has_done == 0).first()
		if(cash_applying == None):
			cash_applying = 0
			cash_applying = format(cash_applying,'.2f')
		else:
			cash_applying = cash_applying[0]
			cash_applying = format(cash_applying,'.2f')

		balance_history = self.session.query(models.BalanceHistory).\
				   filter(models.BalanceHistory.shop_id == shop_id,models.BalanceHistory.balance_type.in_([0,2,3])).order_by(desc(models.BalanceHistory.create_time)).offset((page-1)*page_size).limit(page_size)

		history_list = balance_history.all()
		count = balance_history.count();

		for temp in history_list:
			shop = self.session.query(models.Shop).filter(models.Shop.shop_code == shop_code).first()
			shop_name = shop.shop_name
			create_time = temp.create_time.strftime("%Y-%m-%d %H:%M:%S")
			shop_totalBalance = temp.shop_totalPrice

			if shop_totalBalance == None:
					shop_totalBalance=0
			shop_totalBalance = format(shop_totalBalance,'.2f')

			record = ''
			order_num = ''
			order_num_txt = ''
			if temp.balance_type == 3:
				record = temp.balance_record[0:4] + ':'
				if temp.balance_record[5:7] == '支付':
					order_num = temp.balance_record[12:32]
				else:
					order_num = temp.balance_record[11:32]
				name = temp.name[0:6]
				order_num_txt = "-订单编号"
			elif temp.balance_type == 2:
				record = "提现:"
				name = "店铺管理员"
			elif temp.balance_type == 0:
				record = "用户充值:"
				name = temp.name

			balance_value = format(temp.balance_value,'.2f')

			history.append({'shop_name':shop_name,'shop_code':shop_code,'time':create_time,'balance':shop_totalBalance,\
					'balance_value':balance_value,'type':temp.balance_type,'record':record,'order_num':order_num,\
					'name':name,'order_num_txt':order_num_txt,'cash_applying':cash_applying})
		return self.send_success(page_sum=page_sum,history = history)
##
