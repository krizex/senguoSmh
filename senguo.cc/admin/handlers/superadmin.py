from handlers.base import SuperBaseHandler, WxOauth2
import dal.models as models
import tornado.web
import time, datetime
from settings import ROOT_HOST_NAME
from sqlalchemy import exists, func, extract, DATE, desc
from dal.dis_dict import dis_dict
from libs.msgverify import check_msg_token,get_access_token,user_subscribe


############################
# added by woody  2015.3.6
import requests

class Access(SuperBaseHandler):
	
	def initialize(self, action):
		self._action = action
	
	def get(self):
		if self._action == "oauth":
			self.handle_oauth()
		elif self._action == "logout":
			self.clear_current_user()
			return self.redirect(self.reverse_url("superHome"))
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
			return self.write("对不起，你不属于此系统用户，我们拒绝你的加入。")
		self.set_current_user(u, domain=ROOT_HOST_NAME)

		next_url = self.get_argument("next", self.reverse_url("superHome"))
		return self.redirect(next_url)

class ShopAdminManage(SuperBaseHandler):
	"""商家管理，基本上是信息展示"""

	_page_count = 20

	def initialize(self, action):
		self._action = action

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("page?:int")
	def get(self):
		offset = (self.args.get("page", 1)-1) * self._page_count
		q = self.session.query(models.ShopAdmin)
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

		admins = q.all()
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


class ShopManage(SuperBaseHandler):
	_page_count = 20

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("action", "page?:int")
	def get(self):
		action = self.args["action"]
		offset = (self.args.get("page", 1) - 1) * self._page_count
		q = self.session.query(models.Shop)
		q_temp = self.session.query(models.ShopTemp)
		q_applying = q_temp.filter_by(shop_status=models.SHOP_STATUS.APPLYING)
		q_declined = q_temp.filter_by(shop_status=models.SHOP_STATUS.DECLINED)
		q_accepted = q_temp.filter_by(shop_status=models.SHOP_STATUS.ACCEPTED)

		

		count = {
			"all_temp": q_temp.count(),
			"applying": q_applying.count(),
			"accepted": q_accepted.count(),
			"declined": q_declined.count(),
			"all": q.count()
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
			shops = q.order_by(models.Shop.id.desc()).offset(offset).limit(self._page_count).all()
			output_data = []
			for shop in shops:
				data = {}
				##############################################################################
				# user's subscribe
				##############################################################################
				account_info = self.session.query(models.Accountinfo).get(shop.admin_id)
				wx_openid = account_info.wx_openid
				subscribe = user_subscribe(wx_openid)
				data["subscribe"] = subscribe
				data["shop_trademark_url"] = shop.shop_trademark_url
				data["shop_name"] = shop.shop_name
				data["shop_code"] = shop.shop_code
				data["city"] = self.code_to_text('shop_city', shop.shop_city)
				data["staff_count"] = len(shop.staffs)
				data["follower_count"] = self.session.query(models.CustomerShopFollow).\
					filter_by(shop_id=shop.id).count()
				data["goods_count"] = len(shop.fruits) + self.session.query(models.MGoods).\
					join(models.Menu).filter(models.Menu.shop_id == shop.id).count()
				data["admin_name"] = shop.admin.accountinfo.realname
				data["operate_days"] = (datetime.datetime.now() - datetime.datetime.
										fromtimestamp(shop.create_date_timestamp)).days
				data["order_count"] = self.session.query(models.Order).filter_by(shop_id=shop.id).count()
				data["price_sum"] = self.session.query(func.sum(models.Order.totalPrice)).\
					filter_by(shop_id=shop.id).scalar()
				output_data.append(data)

			return self.render("superAdmin/shop-manage.html", output_data=output_data,context=dict(subpage='shop',action=action,count=count))
		else:
			return self.send_error(404)
		# 排序规则id, offset 和 limit
		q = q.order_by(models.ShopTemp.id.desc()).offset(offset).limit(self._page_count)
		
		shops = q.all()
		# shops 是models.Shop实例的列表
		return self.render("superAdmin/apply-manage.html", context=dict(
				shops = shops,subpage='shop', action=action,
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
			headers = dict(Host = '106.ihuyi.cn',)
			r = requests.post(url,data = postdata , headers = headers)
			print(r.text)

			reason = "原因 : " + message_reason

			# weixin message
			WxOauth2.fail_template_msg(account_info.wx_openid, shop_temp.shop_name,
									   account_info.realname, account_info.phone,reason)  # 发送微信模板消息通知用户

		else:
			if shop_temp.shop_status == 2:
				return self.send_error("店铺已经申请成功")

			# 添加系统默认的时间段
			period1 = models.Period(name="中午", start_time="12:00", end_time="12:30")
			period2 = models.Period(name="下午", start_time="17:30", end_time="18:00")
			period3 = models.Period(name="晚上", start_time="21:00", end_time="22:00")

			config = models.Config()
			config.periods.extend([period1, period2, period3])



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
										 shop_intro=shop_temp.shop_intro)
			shop.config = config
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

			self.session.add(models.HireLink(staff_id=shop.admin_id, shop_id=shop.id))  # 把管理者默认为新店铺的二级配送员
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
			headers = dict(Host = '106.ihuyi.cn',)
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
				return self.send_fail(error_text="订单不存在！")
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
	@SuperBaseHandler.check_arguments("action:str", "page:int")
	def post(self):
		action = self.args["action"]
		page = self.args["page"]
		page_size = 20

		q = self.session.query(models.Accountinfo.id,
									   models.Accountinfo.headimgurl,
									   models.Accountinfo.nickname,
									   models.Accountinfo.sex,
									   models.Accountinfo.wx_province,
									   models.Accountinfo.wx_city,
									   models.Accountinfo.phone).order_by(desc(models.Accountinfo.id))

		if action == "all":
			pass
		elif action == "admin":
			q = q.filter(exists().where(models.Accountinfo.id == models.Shop.admin_id))
		elif action == "customer":
			q = q.filter(exists().where(models.Accountinfo.id == models.CustomerShopFollow.customer_id))
		elif action == "phone":
			q = q.filter(models.Accountinfo.phone != '')
		else:
			return self.send_error(404)
		users = q.offset(page*page_size).limit(page_size).all()
		for i in range(len(users)):
			f_names = self.session.query(models.Shop.id, models.Shop.shop_code,models.Shop.shop_name).\
				join(models.CustomerShopFollow).\
				filter(models.CustomerShopFollow.customer_id == users[i][0]).all()
			h_names = self.session.query(models.Shop.id,models.Shop.shop_code,models.Shop.shop_name).filter_by(admin_id=users[i][0]).all()
			users[i] = list(users[i])
			users[i].append(f_names)
			users[i].append(h_names)
		return self.send_success(data=users)


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
			end_date = now
		else:
			date = self.monthdelta(datetime.datetime.now(), page)
			start_date = datetime.datetime(date.year, date.month, 1)
			end_date = datetime.datetime(date.year, date.month, date.day)

		q = self.session.query(models.Accountinfo.id, models.Accountinfo.create_date_timestamp).\
			filter(models.Accountinfo.create_date_timestamp >= start_date.timestamp(),
				   models.Accountinfo.create_date_timestamp <= end_date.timestamp())

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


class DistributStatic(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
		return self.render("superAdmin/count-attribute.html",context=dict(subpage='count',subcount='attribute'))

	@tornado.web.authenticated
	def post(self):
		total = self.session.query(models.Accountinfo).count()
		sex = self.session.query(models.Accountinfo.sex, func.count()).group_by(models.Accountinfo.sex).all()
		province = self.session.query(models.Accountinfo.wx_province, func.count()).\
			group_by(models.Accountinfo.wx_province).all()
		city = self.session.query(models.Accountinfo.wx_city, func.count()).\
			group_by(models.Accountinfo.wx_city).all()
		return self.send_success(total=total, sex=sex, province=province, city=city)


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
			end_date = now
		else:
			date = self.monthdelta(datetime.datetime.now(), page)
			start_date = datetime.datetime(date.year, date.month, 1)
			end_date = datetime.datetime(date.year, date.month, date.day)

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
			filter(models.Order.create_date <= end_date,models.Order.status != 0).all()
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

class Official(SuperBaseHandler):
	def get(self):
		return self.render("m-official/home.html")



class ShopClose(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
		try:
			shops = self.session.query(models.Shop).filter_by(status =1).all()
		except:
			return self.send_fail('shopclose error')
		if shops:
			for shop in shops:
				shop_code = shop.shop_code
				shop_id = shop.id
				fruits = shop.fruits
				menus = shop.menus
				# print(menus)
				create_date = shop.create_date_timestamp
				x = datetime.datetime.fromtimestamp(create_date)
				# print(x)
				now = datetime.datetime.now()
				days = (now -x).days
				if days >14:
					if shop_code =='not set':
						shop.status = 0
					if len(fruits) == 0 and len(menus) == 0:
						shop.status = 0 
					try:
						follower_count = self.session.query(models.CustomerShopFollow).filter_by(shop_id = shop_id).count()
					except:
						return self.send_fail('follower_count error')
					if follower_count <2:
						shop.status =0
				self.session.commit()
			return self.send_success()


class Cert(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
	    self.render('superAdmin/shop-cert-apply.html',context=dict(count = {'all':10,'all_temp':10}))

class Comment(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
	    self.render('superAdmin/shop-comment-apply.html',context=dict(count = {'all':10,'all_temp':10}))
				
class CommnetApplyDelete(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
		data = []
		order_info = {}
		apply_list = self.session.query(models.CommentApply).filter_by(hasDone = 0).all()
		if comment_apply in apply_list:
			order = comment_apply.order
			shop  = comment_apply.shop
			shop_code = shop.shop_code
			admin_name= shop.admin.accountinfo.nickname
			# order info
			customer_id = order.customer_id
			customer = self.session.query(models.Accountinfo).filter_by(id = customer_id).first()
			if not customer:
				return self.send_error(404)
			name = customer.name
			comment = order.comment
			order_create_date = order.create_date
			num = order.num
			headimgurl_small = order.headimgurl_small
			create_date = comment_apply.create_date
			order_info = dict(
				headimgurl_small = headimgurl_small,name = name , num = num ,order_create_date = order_create_date,\
				comment = comment)
			data.append([shop_code,admin_name ,create_date, comment_apply.delete_reason,order_info])
		return self.send_success(data = data)

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('action','apply_id:int','decline_reason?:str')
	def post(self):
		comment_id = self.args['apply_id']
		comment_apply = self.session.query(models.CommentApply).filter_by(id = apply_id).first()
		if not comment_apply:
			return self.send_error(404)
		order = comment_apply.order
		if action == 'commit':
			order.status = 5
			order.coment = 'NULL'
			order.comment_reply = 'NULL'
			self.session.commit()
			return self.send_success()
		elif action == 'decline':
			comment_apply.decline_reason = self.args['decline_reason']
			self.session.commit()
			return self.send_success(decline_reason = decline_reason)
		else:
			return self.send_error(404)







