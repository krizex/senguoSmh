from handlers.base import SuperBaseHandler, WxOauth2
import dal.models as models
import tornado.web
import time, datetime
from settings import ROOT_HOST_NAME
from sqlalchemy import exists, func, extract, DATE, desc,or_,distinct,and_,not_
from dal.dis_dict import dis_dict
from libs.msgverify import check_msg_token,get_access_token,user_subscribe,shop_auth_msg,shop_auth_fail_msg

#add by jyj 2015-6-15
import operator
##

############################
# added by woody  2015.3.6
import requests

# add by sunmh
import tornado.gen
from tornado.concurrent import run_on_executor
from concurrent.futures import ThreadPoolExecutor

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
	@SuperBaseHandler.check_arguments("action","page?:int","flag?:int")
	def get(self):
		# woody 8.3
		level = self.current_user.level
		shop_province = self.current_user.province
		# level = 1
		# shop_province = 420000
		if level != 1 and level !=0:
			return self.send_fail('level error')

		q_temp = self.session.query(models.ShopTemp)
		q_applying = q_temp.filter_by(shop_status=models.SHOP_STATUS.APPLYING)
		q_declined = q_temp.filter_by(shop_status=models.SHOP_STATUS.DECLINED)
		q_accepted = q_temp.filter_by(shop_status=models.SHOP_STATUS.ACCEPTED)
		if level == 0:
			comment = self.session.query(models.Order.id).filter(models.Order.status == 6).count()
			auth_apply=self.session.query(models.ShopAuthenticate.id).filter_by(has_done = 0).count()
			shop_count = self.session.query(models.Shop.id).count()
		elif level == 1:
			comment = self.session.query(models.Order.id).join(models.Shop,models.Order.shop_id == models.Shop.id).\
				filter(models.Shop.shop_province==shop_province,models.Order.status==6).count()
			auth_apply=self.session.query(models.ShopAuthenticate.id).join(models.Shop,models.ShopAuthenticate.shop_id == models.Shop.id).\
				filter(models.Shop.shop_province==shop_province,models.ShopAuthenticate.has_done==0).distinct(models.ShopAuthenticate.id).count()
			shop_count = self.session.query(models.Shop.id).filter_by(shop_province=shop_province).count()
		# 获取 入驻申请：所有，申请中，已通过和已拒绝的店铺数量
		#	  所有店铺，店铺评论，店铺认证申请的数量
		count = {
			"all_temp": q_temp.count(),
			"applying": q_applying.count(),
			"accepted": q_accepted.count(),
			"declined": q_declined.count(),
			"all":shop_count,
			"comment":comment,
			"auth_apply":auth_apply
		}

		action = self.args["action"]
		# 根据action来进行区分处理
		if action == "all_temp":
			q = q_temp
		elif action == "applying":
			q = q_applying
		elif action == "accepted":
			q = q_accepted
		elif action == "declined":
			q = q_declined
		elif action == "all":
			flag=self.args["flag"]
			# 获取不同店铺状态下的店铺数量
			output_data_count=self.__getShopCountInDiffStatus(level,shop_province)
			# 获取需要返回到前台的店铺信息，
			output_data=self.__getShopInfo(level,shop_province)
			if output_data==[]:
				return self.send_error(404)
			if flag==1:
				return self.render("superAdmin/shop-manage.html",level=level,output_data=output_data,output_data_count=output_data_count,context=dict(subpage='all',action=action,count=count))
			else :
				return self.send_success(output_data=output_data,level=level,output_data_count=output_data_count)
		else:
			return self.send_error(404)
		offset = (self.args.get("page", 1) - 1) * self._page_count

		# 排序规则id, offset 和 limit
		q = q.order_by(models.ShopTemp.id.desc()).offset(offset).limit(self._page_count)

		shops = q.all()
		return self.render("superAdmin/apply-manage.html",level=level,context=dict(
				shops = shops,subpage='apply', action=action,
				count=count))

	# 获取不同店铺状态的店铺数量，和不同认证状态下的店铺数量
	# add commit by sunmh 2015年09月19日17:13:29
	@SuperBaseHandler.check_arguments("action","search","shop_auth:int","shop_status:int","shop_status:int","shop_sort_key:int","if_reverse:int","page?:int","flag:int")
	def __getShopCountInDiffStatus(self,level,shop_province):
		if level == 0:
			#add by jyj 2015-6-16
			output_data_count = {}
			output_data_count["status_5_count"] = self.session.query(models.Shop.id).count()
			output_data_count["status_4_count"] = self.session.query(models.Shop.id).filter(models.Shop.shop_code == 'not set').count()
			output_data_count["status_2_count"] = self.session.query(models.Shop.id).filter(models.Shop.status == 2).count()
			output_data_count["status_1_count"] = self.session.query(models.Shop.id).filter(models.Shop.status == 1).count()
			output_data_count["status_3_count"] = self.session.query(models.Shop.id).filter(models.Shop.status == 3).count()
			output_data_count["status_0_count"] = self.session.query(models.Shop.id).filter(models.Shop.status == 0).count() - output_data_count["status_4_count"]

			output_data_count["auth_4_count"] = self.session.query(models.Shop.id).count()
			output_data_count["auth_3_count"] = self.session.query(models.Shop.id).filter(models.Shop.shop_auth.in_([1,2,3,4])).count()

			output_data_count["auth_2_count"] = self.session.query(models.Shop.id).filter(models.Shop.shop_auth.in_([1,4])).count()
			output_data_count["auth_1_count"] = self.session.query(models.Shop.id).filter(models.Shop.shop_auth.in_([2,3])).count()
			output_data_count["auth_0_count"] = self.session.query(models.Shop.id).filter(models.Shop.shop_auth == 0).count()

		elif level == 1:
			output_data_count = {}
			output_data_count["status_5_count"] = self.session.query(models.Shop.id).filter(models.Shop.shop_province==shop_province).count()
			output_data_count["status_4_count"] = self.session.query(models.Shop.id).filter(models.Shop.shop_code == 'not set',models.Shop.shop_province==shop_province).count()
			output_data_count["status_2_count"] = self.session.query(models.Shop.id).filter(models.Shop.status == 2,models.Shop.shop_province==shop_province).count()
			output_data_count["status_1_count"] = self.session.query(models.Shop.id).filter(models.Shop.status == 1,models.Shop.shop_province==shop_province).count()
			output_data_count["status_3_count"] = self.session.query(models.Shop.id).filter(models.Shop.status == 3,models.Shop.shop_province==shop_province).count()
			output_data_count["status_0_count"] = self.session.query(models.Shop.id).filter(models.Shop.status == 0,models.Shop.shop_province==shop_province).count() - output_data_count["status_4_count"]

			output_data_count["auth_4_count"] = self.session.query(models.Shop.id).filter(models.Shop.shop_province==shop_province).count()
			output_data_count["auth_3_count"] = self.session.query(models.Shop.id).filter(models.Shop.shop_auth.in_([1,2,3,4]),models.Shop.shop_province==shop_province).count()

			output_data_count["auth_2_count"] = self.session.query(models.Shop.id).filter(models.Shop.shop_auth.in_([1,4]),models.Shop.shop_province==shop_province).count()
			output_data_count["auth_1_count"] = self.session.query(models.Shop.id).filter(models.Shop.shop_auth.in_([2,3]),models.Shop.shop_province==shop_province).count()
			output_data_count["auth_0_count"] = self.session.query(models.Shop.id).filter(models.Shop.shop_auth == 0,models.Shop.shop_province==shop_province).count()
		return output_data_count


	# 前端所有店铺标签点击时，返回需要展示到页面的信息
	def __getShopInfo(self,level,shop_province):
		shop_auth = self.args["shop_auth"]
		shop_status = self.args["shop_status"]
		shop_sort_key = self.args["shop_sort_key"]
		if_reverse = self.args["if_reverse"]
		page_num = self.args["page"]
		if_reverse_val = [False,True]
		offset = (self.args.get("page", 1) - 1) * self._page_count
		output_data = []
		# 获取所有店铺
		q = self.session.query(models.Shop)  
		if level == 1:
			q = q.filter_by(shop_province=shop_province)
		# 如果有搜索，加上进一步的过滤
		if 'search' in self.args:
			search = self.args["search"]
			if search !="":
				q=q.filter(or_(models.Shop.shop_name.like("%{0}%".format(search)),
					  	models.Shop.shop_code.like("%{0}%".format(search))),\
					  	models.Shop.shop_status == models.SHOP_STATUS.ACCEPTED,\
					   	models.Shop.shop_code !='not set')
		# 根据店铺认证状态进行过滤
		if shop_auth == 4:
			pass
		elif shop_auth == 3:
			q=q.filter(models.Shop.shop_auth.in_([1,2,3,4]))
		elif shop_auth == 2:
			q=q.filter(models.Shop.shop_auth.in_([1,4]))
		elif shop_auth == 1:
			q=q.filter(models.Shop.shop_auth.in_([2,3]))
		elif shop_auth == 0:
			q=q.filter(models.Shop.shop_auth.in_([0]))
		else:
			return output_data
		# 根据店铺的状态进行过滤
		if shop_status == 5:
			pass
		elif shop_status == 4:
			q=q.filter(models.Shop.shop_code =='not set')
		elif shop_status == 3:
			q=q.filter(models.Shop.status ==3)
		elif shop_status == 2:
			q=q.filter(models.Shop.status ==2)
		elif shop_status == 1:
			q=q.filter(models.Shop.status ==1)
		elif shop_status == 0:
			q=q.filter(models.Shop.status ==0)
		else:
			return output_data

		shops = q.order_by(models.Shop.id).all()

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

		#add6.4 pm
		shops = shops[20*page_num-20:20*page_num:1]
		##

		
		for shop in shops:
			data = {}
			####################
			# user's subscribe
			####################
			account_info = self.session.query(models.Accountinfo).get(shop.admin_id)
			wx_openid = account_info.wx_openid
			# subscribe = user_subscribe(wx_openid)
			data["subscribe"] = account_info.subscribe

			data["shop_trademark_url"] = shop.shop_trademark_url
			data["shop_name"] = shop.shop_name
			data["city"] = self.code_to_text('shop_city', shop.shop_city)
			data["staff_count"] = len(shop.staffs)
			data["follower_count"] = shop.fans_count
			data["old_user"] = self.session.query(models.Customer.id).join(models.CustomerShopFollow).filter(models.CustomerShopFollow.shop_id == shop.id,models.CustomerShopFollow.shop_new == 1).count()
			data["shop_tpl"] = shop.shop_tpl+1
			data["admin_name"] = shop.admin.accountinfo.realname
			data["operate_days"] = (datetime.datetime.now() - datetime.datetime.
									fromtimestamp(shop.create_date_timestamp)).days
			data["order_count"] = shop.order_count
			data["price_sum"] = shop.shop_property

			#add 6.8am by jyj
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

			# added by jyj 2015-8-7
			data["admin_id"] = shop.admin.accountinfo.id
			# #
			shop_city = self.code_to_text("city",shop.shop_city)
			shop_province = self.code_to_text("province",shop.shop_province)
			shop_address_detail=shop.shop_address_detail
			# 如果地址没有省市的信息就将省市的信息加到地址前面,先判断市,再判断省,因为会存在市和省相同的情况，避免加重复了
			# sunmh 2015年09月16日
			if shop_address_detail.find(shop_city)==-1:
				shop_address_detail=shop_city+shop_address_detail
			if shop_address_detail.find(shop_province)==-1:
				shop_address_detail=shop_province+shop_address_detail				
			data["shop_address_detail"] =shop_address_detail
			data["shop_code"] = shop.shop_code
			shop_status_array = ['关闭','营业中','筹备中','休息中']

			data["shop_shop_status"] = shop_status_array[shop.status]

			create_date_trans = self.session.query(func.from_unixtime(shop.create_date_timestamp)).scalar()
			data["create_date"] = self.session.query(func.date_format(create_date_trans,'%Y-%m-%d %H:%i:%s')).scalar()

			data["old_msg"] = shop.old_msg

			#satisfy
			satisfy = 0.0
			shop_id = shop.id
			data["shop_id"] = shop_id
			orders = self.session.query(models.Order).filter_by(shop_id = shop_id ,status =6).first()
			commodity_quality = 0
			send_speed = 0
			shop_service = 0
			if orders:
				q = self.session.query(func.avg(models.Order.commodity_quality),\
					func.avg(models.Order.send_speed),func.avg(models.Order.shop_service)).filter(models.Order.shop_id == shop_id,models.Order.status.in_((6,7))).all()
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

			# 计算店铺的购买转换率和重复购买率
			# modified by sunmh
			fans_count=shop.fans_count
			purchase_count=self.session.query(models.Order.customer_id).filter(models.Order.status.in_([5,6,7,10]),models.Order.shop_id==shop_id).distinct().count()
			purchase_twice_count=self.session.query(models.Order.customer_id).\
									filter(models.Order.shop_id==shop_id,models.Order.status.in_([5,6,7,10])).\
									group_by(models.Order.customer_id).\
									having(func.count(models.Order.customer_id) > 1).count()
			if purchase_count==0:
				data["repeatPurRate"]=0
			else:
				data["repeatPurRate"]=format(purchase_twice_count/purchase_count,'.2%')

			if fans_count==0:
				data["purchaseConverRate"]=0
			else:
				data["purchaseConverRate"]=format(purchase_count/fans_count,'.2%')

			output_data.append(data)
		return output_data

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("action","code?")
	def post(self):
		action = self.args["action"]
		if action == "updateShopStatus":
			self.handle_updateStatus()
		elif action == "shopclose":
			self.handle_shopclose()
		# 进入店铺后台
		elif action == "getin":
			# print(self.session.query(models.Shop.id).filter_by(shop_code= self.args["code"]).first()[0])
			try:
				shop_id=self.session.query(models.Shop.id).filter_by(shop_code= self.args["code"]).first()[0]
			except:
				return self.send_error(403)
			self.set_secure_cookie("shop_id", str(shop_id))
			return self.send_success()
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

		# 首个店铺未进行店铺认证不允许再申请店铺
		try:
			shops = self.session.query(models.Shop).filter_by(admin_id=shop_temp.admin_id)
		except:
			shops = None

		if shops:
			shop_frist = shops.first()
			if shop_frist:
				if shop_frist.shop_auth==0:
					return self.send_fail("该商家首个店铺还未进行认证")
				elif shop_frist.shop_auth in [1,4] and shops.count() >= 5:
					return self.send_fail("该商家首个店铺为个人认证，最多只可申请5个店铺")
				elif shop_frist.shop_auth in [2,3] and shops.count() >= 15:
					return self.send_fail("该商家首个店铺为企业认证，最多只可申请15个店铺")

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

			reason = "原因：" + message_reason

			# 发送店铺申请失败微信模板消息通知用户
			WxOauth2.fail_template_msg(account_info.wx_openid, shop_temp.shop_name,
									   account_info.realname, account_info.phone,reason)

		else:
			if shop_temp.shop_status == 2:
				return self.send_fail("店铺已经申请成功")

			# 添加系统默认的时间段
			period1 = models.Period(name="中午", start_time="12:00", end_time="13:00") #按时达默认时间段
			period2 = models.Period(name="下午", start_time="17:00", end_time="18:00") #按时达默认时间段
			period3 = models.Period(name="晚上", start_time="21:00", end_time="22:00") #按时达默认时间段
			period4 = models.Period(name="中午", start_time="12:00", end_time="13:00", config_type=1) #自提时间默认时间段
			period5 = models.Period(name="下午", start_time="17:00", end_time="18:00", config_type=1) #自提时间默认时间段
			period6 = models.Period(name="晚上", start_time="21:00", end_time="22:00", config_type=1) #自提时间默认时间段

			config = models.Config()
			config.periods.extend([period1, period2, period3, period4, period5, period6])
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
			self.session.flush()  # 要flush一次才有shop.id

			######################################################################################
			# inspect whether staff exited
			######################################################################################
			temp_staff = self.session.query(models.ShopStaff).get(shop.admin_id)
			# print('[SuperShopManage]temp_staff:',temp_staff)
			# print('[SuperShopManage]admin_id:',shop.admin_id)
			if temp_staff is None:
				self.session.add(models.ShopStaff(id=shop.admin_id, shop_id=shop.id))  # 添加默认员工时先添加一个员工，否则报错
			self.session.flush()

			self.session.add(models.HireLink(staff_id=shop.admin_id, shop_id=shop.id,default_staff=1))  # 把管理者默认为新店铺的二级配送员
			self.session.flush()

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

			message_content ='尊敬的{0}，您好，您在森果平台申请的店铺{1}已经通过审核，点击链接查看使用教程 http://dwz.cn/CSY6L'.format(message_name,message_shop_name)

			postdata = dict(account='cf_senguocc',
				password='sg201404',
				mobile=mobile,
				content = message_content)
			headers = dict(Host = '106.ihuyi.cn',connection="close")
			r = requests.post(url,data = postdata , headers = headers)
			
			# 发送微信模板消息通知用户
			# test_openid = 'o5SQ5tyC5Ab_g6PP2uaJV1xe2AZQ'
			WxOauth2.post_template_msg(account_info.wx_openid, shop_temp.shop_name,
									   account_info.realname, account_info.phone)
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
		level = self.current_user.level
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

		return self.render("superAdmin/order-manage.html",level=level, context=dict(
			orders = orders,subpage = subpage,count=count))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("order_id:int", "system_username","system_password","system_code" ,"action")
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
		level = self.current_user.level
		shop_province = self.current_user.province
		# print("[SuperUser]shop_province:",shop_province)
		sum = {}
		if level == 0:
			q = self.session.query(models.Accountinfo.id)
			sum["admin"] = self.session.query(models.Shop.admin_id).group_by(models.Shop.admin_id).count()
			sum['customer'] = self.session.query(models.Customer.id).count()
		elif level == 1:
			shop_province = self.code_to_text('province',shop_province)
			shop_province = shop_province[0:len(shop_province)-1]
			q = self.session.query(models.Accountinfo.id).filter(models.Accountinfo.wx_province.like('{0}'.format(shop_province)))
			sum["admin"] = self.session.query(models.Shop.admin_id).join(models.Accountinfo,models.Shop.admin_id==models.Accountinfo.id).filter(
				models.Accountinfo.wx_province.like('{0}'.format(shop_province))).group_by(models.Shop.admin_id).count()
			sum["customer"] = self.session.query(models.Customer.id).join(models.Accountinfo,models.Accountinfo.id==models.Customer.id).filter(
				models.Accountinfo.wx_province.like('{0}'.format(shop_province))).group_by(models.Customer.id).count()
		else:
			return self.send_fail('level error')
		sum["all"] = q.count()
		# sum["admin"] = q.filter(exists().where(models.Accountinfo.id == models.Shop.admin_id)).count()
		# sum["customer"] = q.filter(exists().where(models.Accountinfo.id == models.CustomerShopFollow.customer_id)).count()
		sum["phone"] = q.filter(models.Accountinfo.phone != '').count()
		return self.render("superAdmin/user.html", sum=sum,level=level, context=dict(subpage='user'))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("action:str","inputinfo?:str","page:int")
	def post(self):
		action = self.args["action"]
		page = self.args["page"]
		page_size = 20
		#woody 8.3
		level = self.current_user.level
		shop_province = self.current_user.province

		if level != 0 and level != 1:
			return self.send_fail('level error')
		# print("[SuperUser]shop_province:",shop_province)
		q = self.session.query(models.Accountinfo.id,models.Accountinfo.headimgurl_small,models.Accountinfo.nickname,models.Accountinfo.sex,
				models.Accountinfo.wx_province,models.Accountinfo.wx_city,models.Accountinfo.phone,
				func.FROM_UNIXTIME(models.Accountinfo.birthday,"%Y-%m-%d"),models.Accountinfo.wx_username)
		if level == 1:
			# shop_province = 420000
			shop_province = self.code_to_text('province',shop_province)  #将省由code转换为汉字
			shop_province = shop_province[0:len(shop_province)-1]        #去掉‘省’字
			q = q.filter(models.Accountinfo.wx_province.like('{0}'.format(shop_province)))

		if action == "all":
			pass
		elif action == "admin":
			q = q.join(models.Shop,models.Accountinfo.id == models.Shop.admin_id)
		elif action == "customer":
			q=q.join(models.Customer,models.Accountinfo.id == models.Customer.id)
		elif action == "phone":
			q = q.filter(models.Accountinfo.phone != '')
		# add by jyj 2015-6-23:
		elif action == "search":
			inputinfo = self.args["inputinfo"]
			q = q.filter(or_(models.Accountinfo.nickname.like("%{0}%".format(inputinfo)),(func.concat(models.Accountinfo.id,'')).like("%{0}%".format(inputinfo))))
		# added by jyj 2015-8-7:
		elif action == "out_link":
			admin_id = int(self.args["inputinfo"])
			q = q.filter(models.Accountinfo.id == admin_id)
		else:
			return self.send_error(404)
		users = q.order_by(desc(models.Accountinfo.id)).offset(page*page_size).limit(page_size).all()
		for i in range(len(users)):
			f_names = self.session.query(models.Shop.id, models.Shop.shop_code,models.Shop.shop_name).\
				join(models.CustomerShopFollow).\
				filter(models.CustomerShopFollow.customer_id == users[i][0]).all()
			h_names = self.session.query(models.Shop.id,models.Shop.shop_code,models.Shop.shop_name).filter_by(admin_id=users[i][0]).all()

			# add by jyj 2015-6-22
			# 将生日的时间戳转换为日期类型：
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
# modified by sunmh 2015年09月04日19:36:03
class IncStatic(SuperBaseHandler):
	executor = ThreadPoolExecutor(2)

	@tornado.web.authenticated
	def get(self):
		# woody
		level = self.current_user.level
		return self.render("superAdmin/count-user.html",level = level, context=dict(subpage='count',subcount='user'))

	@tornado.web.authenticated
	@tornado.web.asynchronous
	@tornado.gen.engine
	@SuperBaseHandler.check_arguments("action:str")
	def post(self):
		action = self.args["action"]
		if action == "user_trend":
			#return self.user_trend()
			yield self.user_trend()
		else:
			#return self.error(404)
			yield self.error(404)
		self.finish()

	@run_on_executor
	@SuperBaseHandler.check_arguments("action:str","type:int","current_year?:str","current_month?:str")
	def user_trend(self):
		level = self.current_user.level
		if level != 0 and level != 1:
			return self.send_fail('level error')

		shop_province = self.current_user.province
		if shop_province:
			shop_province = self.code_to_text('province',shop_province)
			shop_province = shop_province[0:len(shop_province)-1]
		# level = 1
		# shop_province = 420000

		type = self.args["type"]
		current_year = self.args['current_year']
		#type=1表示按天来进行排序,只取当前月份的
		if type == 1:
			#先初始化要用的变量
			current_month = self.args['current_month']
			#1.定义query和join部分
			q_all=self.session.query(func.count(distinct(models.Accountinfo.id)),func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%d'))
			q_admin=q_all.join(models.Shop,models.Accountinfo.id == models.Shop.admin_id)
			q_customer=q_all.join(models.Customer,models.Accountinfo.id == models.Customer.id)
			q_range=self.session.query(func.day(func.now()))
			#2.定义filter部分
			q_all=q_all.filter(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%Y-%m')==current_year+'-'+current_month)
			q_admin=q_admin.filter(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%Y-%m')==current_year+'-'+current_month)
			q_customer=q_customer.filter(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%Y-%m')==current_year+'-'+current_month)
			if level==1:
				q_all=q_all.filter(models.Accountinfo.wx_province.like('{0}'.format(shop_province)))
				q_admin=q_admin.filter(models.Accountinfo.wx_province.like('{0}'.format(shop_province)))
				q_customer=q_customer.filter(models.Accountinfo.wx_province.like('{0}'.format(shop_province)))
			q_phone=q_all.filter(models.Accountinfo.phone != '')
			#3.定义group部分
			q_all=q_all.group_by(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%d'))
			q_admin=q_admin.group_by(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%d'))
			q_customer=q_customer.group_by(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%d'))
			q_phone=q_phone.group_by(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%d'))
		#type=2表示按周来进行排序，取全年的所有周的数据
		elif type==2:	
			#1.定义query和join部分
			q_all=self.session.query(func.count(distinct(models.Accountinfo.id)),func.week(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp),1))
			q_admin=q_all.join(models.Shop,models.Accountinfo.id == models.Shop.admin_id)
			q_customer=q_all.join(models.Customer,models.Accountinfo.id == models.Customer.id)
			q_range=self.session.query(func.week(func.now(),1))
			#2.定义filter部分
			q_all=q_all.filter(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%Y')==current_year)
			q_admin=q_admin.filter(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%Y')==current_year)
			q_customer=q_customer.filter(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%Y')==current_year)
			if level==1:
				q_all=q_all.filter(models.Accountinfo.wx_province.like('{0}'.format(shop_province)))
				q_admin=q_admin.filter(models.Accountinfo.wx_province.like('{0}'.format(shop_province)))
				q_customer=q_customer.filter(models.Accountinfo.wx_province.like('{0}'.format(shop_province)))
			q_phone=q_all.filter(models.Accountinfo.phone != '')
			#3.定义group部分
			q_all=q_all.group_by(func.week(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp),1))
			q_admin=q_admin.group_by(func.week(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp),1))
			q_customer=q_customer.group_by(func.week(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp),1))
			q_phone=q_phone.group_by(func.week(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp),1))
		#type=3表示按月来进行排序，取全年的所有月份的数据
		elif type==3:
			#1.定义query和join部分
			q_all=self.session.query(func.count(distinct(models.Accountinfo.id)),func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%m'))
			q_admin=q_all.join(models.Shop,models.Accountinfo.id == models.Shop.admin_id)
			q_customer=q_all.join(models.Customer,models.Accountinfo.id == models.Customer.id)
			q_range=self.session.query(func.month(func.now()))
			#2.定义filter部分
			q_all=q_all.filter(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%Y')==current_year)
			q_admin=q_admin.filter(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%Y')==current_year)
			q_customer=q_customer.filter(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%Y')==current_year)
			if level==1:
				q_all=q_all.filter(models.Accountinfo.wx_province.like('{0}'.format(shop_province)))
				q_admin=q_admin.filter(models.Accountinfo.wx_province.like('{0}'.format(shop_province)))
				q_customer=q_customer.filter(models.Accountinfo.wx_province.like('{0}'.format(shop_province)))
			q_phone=q_all.filter(models.Accountinfo.phone != '')
			#3.定义group部分
			q_all=q_all.group_by(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%m'))
			q_admin=q_admin.group_by(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%m'))
			q_customer=q_customer.group_by(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%m'))
			q_phone=q_phone.group_by(func.FROM_UNIXTIME(models.Accountinfo.create_date_timestamp,'%m'))
		else:
			return self.send_error(404)

		data = []
		now=datetime.datetime.now()
		#数组的大小
		if type==1 and int(current_year) == now.year and int(current_month) == now.month:
			rangeOfArray=int(q_range.all()[0][0])
		elif type==1:
			if current_month in ('01','03','05','07','08','10','12'):
				rangeOfArray=31
			elif current_month in ('04','06','09','11'):
				rangeOfArray=30
			elif (int(current_year)%4==0 and not int(current_year)%100==0) or int(current_year)%400==0:
				rangeOfArray=29
			else:
				rangeOfArray=28
		elif (type==2 or type==3) and int(current_year) == now.year:
			rangeOfArray=int(q_range.all()[0][0])
		elif type==2:
			rangeOfArray=52
		else:
			rangeOfArray=12

		#初始化返回的数组
		for x in range(0, rangeOfArray):
			data.append({'admin': 0, 'customer': 0, 'phone': 0,'all':0,'addup':0})

		#组装数组
		def assembleArray(s_type,q_infos):
			for info in q_infos:
				index = int(info[1])-1
				value = info[0]
				data[index][s_type] = value

		assembleArray('admin',q_admin.all())
		assembleArray('customer',q_customer.all())
		assembleArray('phone',q_phone.all())
		assembleArray('all',q_all.all())

		#modified by sunmh 计算total时，需要加上过滤条件
		#表中包含时间戳为0的数据，不统计这些数据 sunmh 
		begin_date=datetime.datetime(1970,1,1,8,0,0)
		if level == 0:
			if type==1:
				end_date=datetime.datetime(int(current_year),int(current_month),rangeOfArray,23,59,59)
			else:
				end_date=datetime.datetime(int(current_year),12,31,23,59,59)
			total = self.session.query(models.Accountinfo.id).\
					filter(models.Accountinfo.create_date_timestamp < end_date.timestamp()).filter(models.Accountinfo.create_date_timestamp > begin_date.timestamp()).count()
		elif level == 1:
			if type==1:
				end_date=datetime.datetime(int(current_year),int(current_month),rangeOfArray,23,59,59)
			else:
				end_date=datetime.datetime(int(current_year),12,31,23,59,59)
			total = self.session.query(models.Accountinfo.id).filter(models.Accountinfo.wx_province.like('{0}'.format(shop_province))).\
					filter(models.Accountinfo.create_date_timestamp < end_date.timestamp()).filter(models.Accountinfo.create_date_timestamp > begin_date.timestamp()).count()
		else:
			return self.send_fail('level error')
		#计算累计用户数
		for x in range(0, rangeOfArray)[::-1]:
			data[x]['addup'] = total
			total -= data[x]['all']

		return self.send_success(data=data)

# 统计 - 余额统计
# add by sunmh 2015年09月01日11:26:57
class AmountStatic(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
		level = self.current_user.level
		return self.render("superAdmin/count-amount.html",level=level, context=dict(subpage='count',subcount='amount'))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("action:str")
	def post(self):
		action = self.args["action"]
		if action == "amount_trend":
			return self.amount_trend()
		else:
			return self.error(404)

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("action:str","type:int","current_year?:str","current_month?:str")
	def amount_trend(self):
		type = self.args["type"]
		
		#type=1表示按天来进行排序,只取当前月份的
		if type == 1:  
			current_year = self.args['current_year']
			current_month = self.args['current_month']
			if len(current_month)<2:
				current_month='0'+current_month
			#print(current_month,current_year,'Test')
			#current_month='12'

			q = self.session.query(func.sum(models.BalanceHistory.balance_value), func.day(models.BalanceHistory.create_time)).\
				filter(models.BalanceHistory.balance_type.in_([0,3]))
			# 按天分组，获取所有进入平台的金额
			#q_total=q.filter(func.date_format(models.BalanceHistory.create_time,'%Y-%m')==current_year+'-'+current_month).group_by(func.date_format(models.BalanceHistory.create_time,'%Y-%m-%d'))
			# 按天分组，获取所有的从微信进入平台的金额
			q_wechat=q.filter(models.BalanceHistory.balance_record.like('%(微信)%')).filter(func.date_format(models.BalanceHistory.create_time,'%Y-%m')==current_year+'-'+current_month).group_by(func.date_format(models.BalanceHistory.create_time,'%Y-%m-%d'))
			# 按天分组，获取所有的从支付宝进入平台的金额
			q_alipay=q.filter(models.BalanceHistory.balance_record.like('%(支付宝)%')).filter(func.date_format(models.BalanceHistory.create_time,'%Y-%m')==current_year+'-'+current_month).group_by(func.date_format(models.BalanceHistory.create_time,'%Y-%m-%d'))

			# 按天分组,获取从微信退款的钱
			q_wechat_out=self.session.query(func.sum(models.BalanceHistory.balance_value), func.day(models.BalanceHistory.create_time)).\
					filter(models.BalanceHistory.balance_type==8).filter(func.date_format(models.BalanceHistory.create_time,'%Y-%m')==current_year+'-'+current_month).\
					group_by(func.date_format(models.BalanceHistory.create_time,'%Y-%m-%d'))
			# 按天分组,获取从支付包退款的钱
			q_alipay_out=self.session.query(func.sum(models.BalanceHistory.balance_value), func.day(models.BalanceHistory.create_time)).\
					filter(models.BalanceHistory.balance_type==9).filter(func.date_format(models.BalanceHistory.create_time,'%Y-%m')==current_year+'-'+current_month).\
					group_by(func.date_format(models.BalanceHistory.create_time,'%Y-%m-%d'))
			q_range=self.session.query(func.day(func.now()))
			#print(q_range.all()[0][0])
		elif type==2:	#type=2表示按周来进行排序，取全年的所有周的数据
			#修改，每周是按照周一到周日来算的，所以要给week的第二个参数赋值 sunmh 2015年09月03日14:52:14
			current_year = self.args['current_year']
			q = self.session.query(func.sum(models.BalanceHistory.balance_value), func.week(models.BalanceHistory.create_time,1)).\
				filter(models.BalanceHistory.balance_type.in_([0,3]))
			#q_total = q.filter(func.date_format(models.BalanceHistory.create_time,'%Y')==current_year).group_by(func.week(models.BalanceHistory.create_time,1))
			q_wechat = q.filter(models.BalanceHistory.balance_record.like('%(微信)%')).filter(func.date_format(models.BalanceHistory.create_time,'%Y')==current_year).group_by(func.week(models.BalanceHistory.create_time,1))
			q_alipay = q.filter(models.BalanceHistory.balance_record.like('%(支付宝)%')).filter(func.date_format(models.BalanceHistory.create_time,'%Y')==current_year).group_by(func.week(models.BalanceHistory.create_time,1))
			q_wechat_out=self.session.query(func.sum(models.BalanceHistory.balance_value), func.week(models.BalanceHistory.create_time,1)).\
				filter(models.BalanceHistory.balance_type==8).filter(func.date_format(models.BalanceHistory.create_time,'%Y')==current_year).\
				group_by(func.week(models.BalanceHistory.create_time,1))
			q_alipay_out=self.session.query(func.sum(models.BalanceHistory.balance_value), func.week(models.BalanceHistory.create_time,1)).\
				filter(models.BalanceHistory.balance_type==9).filter(func.date_format(models.BalanceHistory.create_time,'%Y')==current_year).\
				group_by(func.week(models.BalanceHistory.create_time,1))
			q_range=self.session.query(func.week(func.now(),1))
			#print(q_range.all())
		elif type==3:	#type=3表示按月来进行排序，取全年的所有月份的数据
			current_year = self.args['current_year']
			q = self.session.query(func.sum(models.BalanceHistory.balance_value), func.month(models.BalanceHistory.create_time)).\
				filter(models.BalanceHistory.balance_type.in_([0,3]))
			#q_total = q.filter(func.date_format(models.BalanceHistory.create_time,'%Y')==current_year).group_by(func.month(models.BalanceHistory.create_time))
			q_wechat = q.filter(models.BalanceHistory.balance_record.like('%(微信)%')).filter(func.date_format(models.BalanceHistory.create_time,'%Y')==current_year).group_by(func.month(models.BalanceHistory.create_time))
			q_alipay = q.filter(models.BalanceHistory.balance_record.like('%(支付宝)%')).filter(func.date_format(models.BalanceHistory.create_time,'%Y')==current_year).group_by(func.month(models.BalanceHistory.create_time))
			q_wechat_out=self.session.query(func.sum(models.BalanceHistory.balance_value), func.month(models.BalanceHistory.create_time)).\
				filter(models.BalanceHistory.balance_type==8).filter(func.date_format(models.BalanceHistory.create_time,'%Y')==current_year).\
				group_by(func.month(models.BalanceHistory.create_time))
			q_alipay_out=self.session.query(func.sum(models.BalanceHistory.balance_value), func.month(models.BalanceHistory.create_time)).\
				filter(models.BalanceHistory.balance_type==9).filter(func.date_format(models.BalanceHistory.create_time,'%Y')==current_year).\
				group_by(func.month(models.BalanceHistory.create_time))
			q_range=self.session.query(func.month(func.now()))
			#print(q_range.all())
		else:
			return self.send_error(404)

		data = []
		now=datetime.datetime.now()
		#数组的大小
		if type==1 and int(current_year) == now.year and int(current_month) == now.month:
			rangeOfArray=int(q_range.all()[0][0])
		elif type==1:
			if current_month in ('01','03','05','07','08','10','12'):
				rangeOfArray=31
			elif current_month in ('04','06','09','11'):
				rangeOfArray=30
			elif (int(current_year)%4==0 and not int(current_year)%100==0) or int(current_year)%400==0:
				rangeOfArray=29
			else:
				rangeOfArray=28
		elif (type==2 or type==3) and int(current_year) == now.year:
			rangeOfArray=int(q_range.all()[0][0])
		elif type==2:
			rangeOfArray=52
		else:
			rangeOfArray=12

		#初始化返回的数组
		for x in range(0, rangeOfArray):
			data.append({'total': 0, 'wechat': 0, 'alipay': 0,'total_clean':0,'wechat_clean': 0, 'alipay_clean': 0})

		#组装数组,毛收入
		def assembleArray(s_type,q_infos):
			for info in q_infos:
				index = info[1]-1
				value = round(info[0],2)
				data[index][s_type] = value
				data[index][s_type+'_clean'] = value
		
		#assembleArray('total',q_total.all())
		assembleArray('wechat',q_wechat.all())
		assembleArray('alipay',q_alipay.all())

		#组装数组,净收入
		def assembleArray2(s_type,q_infos):
			for info in q_infos:
				index = info[1]-1
				value = round(info[0],2)
				data[index][s_type] = data[index][s_type]-value

		assembleArray('wechat_clean',q_wechat.all())
		assembleArray('alipay_clean',q_alipay.all())

		for x in range(0, rangeOfArray):
			data[x]['total'] = round(data[x]['wechat'] +data[x]['alipay'] ,2)
			data[x]['total_clean'] = round(data[x]['wechat_clean'] +data[x]['alipay_clean'],2)

		return self.send_success(data=data)

# 统计 - 用户属性分布
class DistributStatic(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
		# woody
		level = self.current_user.level
		return self.render("superAdmin/count-attribute.html",level=level, context=dict(subpage='count',subcount='attribute'))

	@tornado.web.authenticated
	def post(self):
		# woody 8.4
		level = self.current_user.level
		shop_province = self.current_user.province
		# level = 1
		# shop_province = 420000
		if level == 0:
			total = self.session.query(models.Accountinfo.id).count()
			sex = self.session.query(models.Accountinfo.sex, func.count()).order_by(func.count().desc()).group_by(models.Accountinfo.sex).all()
			province = self.session.query(models.Accountinfo.wx_province, func.count()).order_by(func.count().desc()).\
				group_by(models.Accountinfo.wx_province).all()
			city = self.session.query(models.Accountinfo.wx_city, func.count()).order_by(func.count().desc()).\
				group_by(models.Accountinfo.wx_city).all()
		elif level == 1:
			shop_province = self.code_to_text('province',shop_province)
			shop_province = shop_province[0:len(shop_province)-1]
			total = self.session.query(models.Accountinfo).filter(models.Accountinfo.wx_province.like('{0}'.format(shop_province))).count()
			sex = self.session.query(models.Accountinfo.sex, func.count()).order_by(func.count().desc()).filter(
				models.Accountinfo.wx_province.like('{0}'.format(shop_province))).group_by(models.Accountinfo.sex).all()
			province = self.session.query(models.Accountinfo.wx_province, func.count()).filter(models.Accountinfo.wx_province.like('{0}'.format(shop_province))).order_by(func.count().desc()).\
				group_by(models.Accountinfo.wx_province).all()
			city = self.session.query(models.Accountinfo.wx_city, func.count()).filter(models.Accountinfo.wx_province.like('{0}'.format(shop_province))).order_by(func.count().desc()).\
				group_by(models.Accountinfo.wx_city).all()
		else:
			return self.send_fail('level error')

		return self.send_success(total=total, sex=sex, province=province, city=city)

# 统计 - 店铺数据
class ShopStatic(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
		# woody
		level = self.current_user.level
		return self.render("superAdmin/count-shop.html",level=level,context=dict(subpage='count',subcount='shop'))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("action:str")
	def post(self):
		action = self.args["action"]
		# woody 8.4 
		level = self.current_user.level
		shop_province = self.current_user.province
		# level = 0
		# shop_province = 420000
		if action == "num":
			return self.num()

		elif action == "province":
			if level == 0:
				provinces = self.session.query(models.Shop.shop_province, func.count()).\
							group_by(models.Shop.shop_province).\
							order_by(func.count().desc()).all()
			elif level == 1:
				provinces = self.session.query(models.Shop.shop_province, func.count()).\
							filter(models.Shop.shop_province==shop_province).\
							group_by(models.Shop.shop_province).\
							order_by(func.count().desc()).all()
			else:
				return self.send_fail('level error')
			data = []
			for province in provinces:
				if dis_dict.get(province[0],None):
					data.append((dis_dict[province[0]]["name"], province[1]))
				else:
					data.append((None,province[1]))

		elif action == "city":
			if level == 0:
				cities = self.session.query(models.Shop.shop_city, func.count()).\
						 group_by(models.Shop.shop_city).\
						 order_by(func.count().desc()).all()
			elif level == 1:
				cities = self.session.query(models.Shop.shop_city, func.count()).\
						 filter(models.Shop.shop_province==shop_province).\
						 group_by(models.Shop.shop_city).\
						 order_by(func.count().desc()).all()
			else:
				return self.send_fail('level error')
			data = []
			for city in cities:
				code = city[0]
				if code:
					if "city" in dis_dict[city[0]//10000*10000]:
						name = dis_dict[city[0]//10000*10000]["city"][code]["name"]
					else:
						name = dis_dict[city[0]]["name"]
					data.append((name, city[1]))
				else:
					data.append((None,None))
		else:
			return self.send_fail()
		if level == 0:
			total = self.session.query(models.Shop.id).count()
		elif level == 1:
			total = self.session.query(models.Shop.id).filter_by(shop_province=shop_province).count()
		else:
			return self.send_fail('level error')
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
		# woody 8.4
		level = self.current_user.level
		shop_province = self.current_user.province
		# level = 1
		# shop_province = 420000
		if level ==0:
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
		elif level == 1:
			s = self.session.query(models.Order.create_date, func.count(), func.sum(models.Order.totalPrice)).join(models.Shop,models.Order.shop_id == models.Shop.id).\
				filter(models.Order.create_date >= start_date,
					   models.Order.create_date <= end_date,models.Order.status !=0,models.Shop.shop_province ==shop_province).distinct(models.Order.id).\
				group_by(func.year(models.Order.create_date),
						 func.month(models.Order.create_date),
						 func.day(models.Order.create_date)).\
				order_by(models.Order.create_date.desc()).all()

			# 总订单数
			total = self.session.query(func.sum(models.Order.totalPrice), func.count()).join(models.Shop,models.Order.shop_id == models.Shop.id).\
				filter(models.Order.create_date <=end_date,models.Order.status != 0,models.Shop.shop_province==shop_province).distinct(models.Order.id).all()
		else:
			return self.send_fail('level error')

		total = list(total[0])

		data = []
		i = 0
		date = end_date
		# data的封装格式为：[日期，日，日订单数，累计订单数，日订单总金额，累计订单总金额]
		while 1:
			try:
				_date = date.strftime('%Y-%m-%d')
			except:
				_date = ""
			try:
				data6 = format(total[0],'.2f')
			except:
				data6 = format(0,'.2f')
			if i < len(s) and s[i][0].date() == date.date():
				try:
					data5 = format(s[i][2],'.2f')
				except:
					data5 = format(0,'.2f')
				data.append((_date, date.day, s[i][1], total[1], data5,data6))
				total[1] -= s[i][1]
				total[0] -= s[i][2]
				i += 1
			else:
				data.append((_date, date.day, 0, total[1], format(0,'.2f'),data6))
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
	#executor = ThreadPoolExecutor(2)

	def get(self):
		# woody
		level = self.current_user.level
		return self.render("superAdmin/count-order.html",level=level,context=dict(subcount='orderstatic'))

	@tornado.web.authenticated
	#@tornado.web.asynchronous
	#@tornado.gen.engine
	@SuperBaseHandler.check_arguments("action:str")
	def post(self):
		action = self.args["action"]
		if action == "order_time":
			return self.order_time()
			##yield self.order_time()
		elif action == "receive_time":
			return self.receive_time()
			#yield self.receive_time()
		else:
			return self.error(404)
			#yield self.error(404)
		#self.finish()

	#@run_on_executor
	@SuperBaseHandler.check_arguments("type:int","start_date?:str","end_date?:str")
	def order_time(self):
		type = self.args["type"]
		# woody 8.4
		level = self.current_user.level
		shop_province = self.current_user.province
		# level = 1
		# shop_province = 420000
		if level == 0:
			q = self.session.query(func.hour(models.Order.create_date), func.minute(models.Order.create_date)).\
					filter(not_(models.Order.status.in_([-1,0])))
		elif level==1:
			q = self.session.query(func.hour(models.Order.create_date), func.minute(models.Order.create_date)).\
					join(models.Shop,models.Order.shop_id==models.Shop.id).\
					filter(not_(models.Order.status.in_([-1,0])),models.Shop.shop_province==shop_province)
		else:
			return self.send_fail('level error')

		if type == 1:  # 如果type=1，表示要获取历史累计数据；如果type=2,表示获取指定时间段的数据
			pass
		elif type == 2:  
			start_date = self.args['start_date']
			end_date = self.args['end_date']
			start_date = datetime.datetime.strptime(start_date,'%Y-%m-%d')
			end_date = datetime.datetime.strptime(end_date,'%Y-%m-%d')

			start_date = datetime.datetime(start_date.year, start_date.month, start_date.day)
			end_date = end_date + datetime.timedelta(1)
			end_date = datetime.datetime(end_date.year, end_date.month, end_date.day)
			q = q.filter(models.Order.create_date >= start_date,
					   models.Order.create_date < end_date)
		else:
			return self.send_error(404)

		orders=q.all()

		data = {}
		for key in range(0, 24):
			data[key] = 0
		for order in orders:
			if  order[1] < 30:
				data[order[0]] += 1
			else:
				data[(order[0]+1)%24] += 1

		return self.send_success(data=data)
	
	#@run_on_executor
	@SuperBaseHandler.check_arguments("type:int","start_date?:str","end_date?:str")
	def receive_time(self):
		type = self.args["type"]
		# woody 8.4
		level = self.current_user.level
		shop_province = self.current_user.province
		# level = 1
		# shop_province = 420000
		if level == 0:
			q = self.session.query(models.Order.type, models.Order.start_time, models.Order.end_time,models.Config.stop_range).\
				filter(not_(models.Order.status.in_([-1,0])),models.Order.shop_id  == models.Config.id)
		elif level == 1:
			q = self.session.query(models.Order.type, models.Order.start_time, models.Order.end_time,models.Config.stop_range).\
				join(models.Shop,models.Order.shop_id==models.Shop.id).\
				filter(not_(models.Order.status.in_([-1,0])),models.Order.shop_id == models.Config.id,models.Shop.shop_province==shop_province)
		else:
			return self.send_fail('level error')

		if type == 1:
			pass
		elif type == 2:
			start_date = self.args['start_date']
			end_date = self.args['end_date']
			start_date = datetime.datetime.strptime(start_date,'%Y-%m-%d')
			end_date = datetime.datetime.strptime(end_date,'%Y-%m-%d')

			start_date = datetime.datetime(start_date.year, start_date.month, start_date.day)
			end_date = end_date + datetime.timedelta(1)
			end_date = datetime.datetime(end_date.year, end_date.month, end_date.day)
			q = q.filter(models.Order.create_date >= start_date,
							  models.Order.create_date < end_date)
		else:
			return self.send_error(404)

		orders = q.all()

		data = {}
		for key in range(0, 24):
			data[key] = 0
		for order in orders:
			if order[0] == 1:  # 立即送收货时间估计
				data[(order[1].hour + (order[1].minute+order[3])//60)%24] += 1
			else:  # 按时达收货时间估计
				data[(order[1].hour+order[2].hour)//2] += 1

		return self.send_success(data=data)
##

# added by jyj 2015-8-3
# 统计 － 销售统计
class SellStatic(SuperBaseHandler):
	def get(self):
		# 管理员的level(总超级管理员:0,省级代理管理员:1,已删除:-1)
		level = self.current_user.level
		return self.render("superAdmin/count-sell.html",level = level,context=dict(subcount='sell'))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('action:str',"start_date:str","end_date:str")
	def post(self):
		action = self.args['action']
		start_date = self.args['start_date']
		end_date = self.args['end_date']
		if action == 'type':
			return self.type_count(start_date,end_date)
		elif action == 'shop':
			return self.shop_count(start_date,end_date)
		elif action == 'group':
			return self.group_count(start_date,end_date)

	def get_order(self,start_date,end_date):
		# added by jyj 2015-8-6 (add level and shop_province filter)
		level = self.current_user.level
		shop_province = self.current_user.province
		##

		start_date_str = start_date
		end_date_str = end_date

		start_date = datetime.datetime.strptime(start_date_str,'%Y-%m-%d')
		start_date_pre = start_date + datetime.timedelta(days = -1)
		start_date_pre = datetime.datetime(start_date_pre.year,start_date_pre.month,start_date_pre.day)
		start_date_pre_str = start_date_pre.strftime('%Y-%m-%d')

		end_date = datetime.datetime.strptime(end_date_str,'%Y-%m-%d')
		end_date_next = end_date + datetime.timedelta(days = 1)
		end_date_next = datetime.datetime(end_date_next.year,end_date_next.month,end_date_next.day)
		end_date_next_str = end_date_next.strftime('%Y-%m-%d')

		if level == 0:
			fruit_list_query = self.session.query(models.Order.fruits).filter(models.Order.status >= 5,\
						        or_(and_(models.Order.create_date >= start_date_str,models.Order.create_date < end_date_next_str,models.Order.today == 1),\
						        	and_(models.Order.create_date >= start_date_pre_str,models.Order.create_date < end_date_str,models.Order.today == 2))).all()
			mgoods_list_query = self.session.query(models.Order.mgoods).filter(models.Order.status >= 5,\
						        or_(and_(models.Order.create_date >= start_date_str,models.Order.create_date < end_date_next_str,models.Order.today == 1),\
						        	and_(models.Order.create_date >= start_date_pre_str,models.Order.create_date < end_date_str,models.Order.today == 2))).all()
		elif level == 1:
			fruit_list_query = self.session.query(models.Order.fruits).join(models.Shop,models.Order.shop_id == models.Shop.id).filter(models.Shop.shop_province == shop_province,models.Order.status >= 5,\
						        or_(and_(models.Order.create_date >= start_date_str,models.Order.create_date < end_date_next_str,models.Order.today == 1),\
						        	and_(models.Order.create_date >= start_date_pre_str,models.Order.create_date < end_date_str,models.Order.today == 2))).all()
			mgoods_list_query = self.session.query(models.Order.mgoods).join(models.Shop,models.Order.shop_id == models.Shop.id).filter(models.Shop.shop_province == shop_province,models.Order.status >= 5,\
						        or_(and_(models.Order.create_date >= start_date_str,models.Order.create_date < end_date_next_str,models.Order.today == 1),\
						        	and_(models.Order.create_date >= start_date_pre_str,models.Order.create_date < end_date_str,models.Order.today == 2))).all()

		return [fruit_list_query,mgoods_list_query]

	def type_count(self,start_date,end_date):
		# 从fruit_type表中查出所有商品类目的id和名称，存到一个字典fruit_type_price_dict中
		# 键为id，值为名称和销售额组成的列表，且销售额都初始化为0．
		fruit_type_price_dict = {}
		query_list = self.session.query(models.FruitType.id,models.FruitType.name).all()
		for item in query_list:
			fruit_type_price_dict[str(item[0])] = [item[1],0]
		
		# 获取指定时间段内的所有订单的fruits字段和mgoods字段并分别存到两个列表中：fruit_list,mgoods_list
		order_list = self.get_order(start_date,end_date)

		fruit_list = []
		mgoods_list = []

		for item in order_list[0]:
			if item[0] != '{}' and item[0] != None:
				fruit_list.append(item[0])

		for item in order_list[1]:
			if item[0] != '{}' and item[0] != None:
				mgoods_list.append(item[0])	

		# 从fruit_list列表的每一项中分离出charge_type_id和对应的金额，
		# 然后从charge_type_id反查到fruit_type_id,最后将fruit_type_price_dict中与此id相同的项的金额自加这个金额．
		# 计价方式-商品类目id对照表:
		charge_type_fruit_type_id = {}
		query_list = self.session.query(models.ChargeType.id,models.Fruit.fruit_type_id).filter(models.ChargeType.fruit_id == models.Fruit.id).all()
		for item in query_list:
			charge_type_fruit_type_id[str(item[0])] = item[1]

		for goods_item in fruit_list:
			goods_item = eval(goods_item)
			for key in goods_item:
				fl_value = goods_item[key]
				num = float(fl_value["num"])
				single_price = float(fl_value["charge"].split('元')[0])
				total_price = single_price * num

				# 如果计价方式被删掉了,金额就统一归为'其他水果'的类目中
				if str(key) not  in list(charge_type_fruit_type_id.keys()):
					fruit_type_price_dict['999'][1] += total_price
					fruit_type_price_dict['999'][1] = round(fruit_type_price_dict['999'][1],2)
					continue

				fruit_type_id = charge_type_fruit_type_id[str(key)]
				fruit_type_price_dict[str(fruit_type_id)][1] += total_price
				fruit_type_price_dict[str(fruit_type_id)][1] = round(fruit_type_price_dict[str(fruit_type_id)][1],2)

		# 从mgoods_list列表的每一项中分离出对应的金额，直接将fruit_type_price_dict中id=2000项(其他商品)的金额自加这个金额．
		for goods_item in mgoods_list:
			goods_item = eval(goods_item)
			for key in goods_item:
				fl_value = goods_item[key]
				num = float(fl_value["num"])
				single_price = float(fl_value["charge"].split('元')[0])
				total_price = single_price * num

				fruit_type_price_dict['2000'][1] += total_price
				fruit_type_price_dict['2000'][1] = round(fruit_type_price_dict['2000'][1],2)

		fruit_type_price_dict['999'][0] = '其他水果'
		fruit_type_price_dict['1999'][0] = '其他干果'
		fruit_type_price_dict['2000'][0] = '其他商品'

		# 将字典fruit_type_price_dict转化成列表fruit_type_price_list,该列表的每一个元素都为一个子列表
		# 子列表有三个元素：商品类目id,名称，金额．将fruit_type_price_list列表按照每一项的金额降序排序
		# 取前30个元素作为output_data，返回给前台．
		output_data = []
		type_select_list = []
		for key in fruit_type_price_dict:
			output_data.append(fruit_type_price_dict[key])
			type_select_list.append([int(key),fruit_type_price_dict[key][0]])
		output_data.sort(key = lambda item : item[1],reverse = True)
		output_data = output_data[0 : 30]
		output_data.sort(key = lambda item : item[1],reverse = False)
		output_data = [item for item in output_data if item[1] != 0]

		type_select_list.sort(key = lambda item : item[0],reverse = False)

		return self.send_success(output_data = output_data,type_select_list = type_select_list)

	@SuperBaseHandler.check_arguments("id:int")
	def shop_count(self,start_date,end_date):
		goods_type_id = self.args['id']

		# 先从fruit表和charge_type表联合查询查出所有fruit_type_id等于cur_selected_type_id的charge_type.id,shop_id,并建立一个字典charge_type_shop_dict
		# 该字典的键是charge_type.id，值是一个列表，列表的第一项是shop_id，第二项是金额，初始化为0.
		charge_type_shop_dict = {}
		query_list = self.session.query(models.ChargeType.id,models.Fruit.shop_id).filter(models.ChargeType.fruit_id == models.Fruit.id,\
				 	            models.Fruit.fruit_type_id == goods_type_id).all()
		for item in query_list:
			charge_type_shop_dict[str(item[0])] = [item[1],0]
		
		# 获取指定时间段内的所有订单的fruits字段和mgoods字段并分别存到两个列表中：fruit_list,mgoods_list
		order_list = self.get_order(start_date,end_date)

		fruit_list = []
		mgoods_list = []

		for item in order_list[0]:
			if item[0] != '{}' and item[0] != None:
				fruit_list.append(item[0])

		if goods_type_id == 2000:
			for item in order_list[1]:
				if item[0] != '{}' and item[0] != None:
					mgoods_list.append(item[0])	

		# 从fruit_list列表的每一项中分离出charge_type_id和对应的金额，然后将charge_type_shop_dict键等于charge_type_id的项的金额自加对应的金额.
		# 如果查不到计价方式对应的shop_id（可能计价方式已经被删除了）那么直接continue.需要建立一个列表cur_charge_type_list，该列表包含cur_selected_type_id对应的所有计价方式的id.
		cur_charge_type_list = []
		query_list = self.session.query(models.ChargeType.id).join(models.Fruit).filter(models.Fruit.fruit_type_id == goods_type_id).all()
		for item in query_list:
			cur_charge_type_list.append(item[0])

		for goods_item in fruit_list:
			goods_item = eval(goods_item)
			for key in goods_item:
				fl_value = goods_item[key]
				num = float(fl_value["num"])
				single_price = float(fl_value["charge"].split('元')[0])
				total_price = single_price * num

				if key not in cur_charge_type_list:
					continue

				if str(key) not in list(charge_type_shop_dict.keys()):
					continue

				charge_type_shop_dict[str(key)][1] += total_price
				charge_type_shop_dict[str(key)][1] = round(charge_type_shop_dict[str(key)][1],2)

		# 将字典charge_type_shop_dict的值([shop_id,price])存到一个列表中，考虑到shop_id会有重复的情况(因为同一个charge_type_id可能对应多个shop_id)，
		# 所以先要把shop_id存到一个列表cur_shop_id中，然后将该列表去重，然后再遍历charge_type_shop_dict的值，累加每个店铺的price，存到each_shop_price_dict字典中，键为shop_id,值为price．
		cur_shop_id_list = []
		for key in charge_type_shop_dict:
			cur_shop_id_list.append(charge_type_shop_dict[key][0])

		# 去重
		cur_shop_id_list = set(cur_shop_id_list)

		each_shop_price_dict = {}
		for item in cur_shop_id_list:
			each_shop_price_dict[str(item)] = 0
		for key in charge_type_shop_dict:
			item = charge_type_shop_dict[key]
			shop_id = item[0]
			price = item[1]
			each_shop_price_dict[str(shop_id)] += price

		# 如果cur_selected_type_id == 2000：从m_charge_type,m_goods,menu三表联合查询，查出所有m_charge_type中id对应的menu表中的shop_id,并建立字典，键为m_charge_type_id,值为shop_id,
		# 然后根据shop_id将金额累加到charge_type_shop_dict中去．如果查不到计价方式对应的shop_id（可能计价方式已经被删除了）那么直接continue.
		# 完了以后再遍历当前字典，如果shop_id在each_shop_price_dict的键列表中，则将这这个键对应的price自加，否则新增键值对.
		if goods_type_id == 2000:
			mcharge_type_shop_dict = {}
			query_list = self.session.query(models.MChargeType.id,models.Menu.shop_id).filter(models.MChargeType.mgoods_id == models.MGoods.id,\
						            models.MGoods.menu_id == models.Menu.id).all()
			for item in query_list:
				mcharge_type_shop_dict[str(item[0])] = [item[1],0]
			# 从mgoods_list列表的每一项中分离出对应的金额
			for goods_item in mgoods_list:
				goods_item = eval(goods_item)
				for key in goods_item:
					fl_value = goods_item[key]
					num = float(fl_value["num"])
					single_price = float(fl_value["charge"].split('元')[0])
					total_price = single_price * num

					if str(key) not in list(mcharge_type_shop_dict.keys()):
						continue

					mcharge_type_shop_dict[str(key)][1] += total_price
					mcharge_type_shop_dict[str(key)][1] = round(mcharge_type_shop_dict[str(key)][1],2)

			for key in mcharge_type_shop_dict:
				item = mcharge_type_shop_dict[key]
				if str(item[0]) not in list(each_shop_price_dict.keys()):
					each_shop_price_dict[str(item[0])] = 0
				each_shop_price_dict[str(item[0])] += item[1]
				each_shop_price_dict[str(item[0])] = round(each_shop_price_dict[str(item[0])],2)

		# 最后新建一个列表each_shop_price_list，每一个元素为一个子列表，子列表的第一项为shop_id,第二项为shop_name,第三项为price,
		# 将each_shop_price_list按照price降序排列，然后取each_shop_price_list的前十项返回到前台．
		each_shop_price_list = []
		for key in each_shop_price_dict:
			shop_id = int(key)
			shop_name = self.session.query(models.Shop.shop_name).filter_by(id = shop_id).first()[0]
			shop_price = each_shop_price_dict[key]
			each_shop_price_list.append([shop_id,shop_name,shop_price])

		each_shop_price_list.sort(key = lambda item : item[2],reverse = True)
		each_shop_price_list = each_shop_price_list[0:10]
		each_shop_price_list.sort(key = lambda item : item[2],reverse = False)
		output_data = each_shop_price_list
		output_data = [item for item in output_data if item[2] != 0]

		return self.send_success(output_data = output_data)

	@SuperBaseHandler.check_arguments("id:int")
	def group_count(self,start_date,end_date):
		group_id = self.args['id']

		charge_type_shop_dict = {}
		# 先从fruit表和charge_type表联合查询查出所有fruit_type_id在当前分组的fruit_type_id的范围之内的charge_type.id,shop_id,并建立一个字典charge_type_shop_dict
		# 该字典的键是charge_type.id，值是一个列表，列表的第一项是shop_id，第二项是金额，初始化为0.
		query_list = []
		if group_id == 0:
			query_list = self.session.query(models.ChargeType.id,models.Fruit.shop_id).filter(models.ChargeType.fruit_id == models.Fruit.id,\
					 	            models.Fruit.fruit_type_id == 2000).all()
		elif group_id == 1:
			query_list = self.session.query(models.ChargeType.id,models.Fruit.shop_id).filter(models.ChargeType.fruit_id == models.Fruit.id,\
					 	            models.Fruit.fruit_type_id < 1000).all()
		elif group_id == 2:	
			query_list = self.session.query(models.ChargeType.id,models.Fruit.shop_id).filter(models.ChargeType.fruit_id == models.Fruit.id,\
					 	            models.Fruit.fruit_type_id > 1000,models.Fruit.fruit_type_id < 2000).all()
		for item in query_list:
			charge_type_shop_dict[str(item[0])] = [item[1],0]

		
		# 获取指定时间段内的所有订单的fruits字段和mgoods字段并分别存到两个列表中：fruit_list,mgoods_list
		order_list = self.get_order(start_date,end_date)

		fruit_list = []
		mgoods_list = []

		for item in order_list[0]:
			if item[0] != '{}' and item[0] != None:
				fruit_list.append(item[0])

		if group_id == 0:
			for item in order_list[1]:
				if item[0] != '{}' and item[0] != None:
					mgoods_list.append(item[0])	

		# 从fruit_list列表的每一项中分离出charge_type_id和对应的金额，然后将charge_type_shop_dict键在当前分组的fruit_type_id的范围之内的项的金额自加对应的金额.
		# 如果查不到计价方式对应的shop_id（可能计价方式已经被删除了）那么直接continue.需要建立一个列表cur_charge_type_list，该列表包含在当前分组的fruit_type_id的范围之内的所有fruit_type_id对应的所有计价方式的id.
		cur_charge_type_list = []
		query_list = []
		if group_id == 0:
			query_list = self.session.query(models.ChargeType.id).join(models.Fruit).filter(models.Fruit.fruit_type_id == 2000).all()
		elif group_id == 1:
			query_list = self.session.query(models.ChargeType.id).join(models.Fruit).filter(models.Fruit.fruit_type_id < 999).all()
		elif group_id == 2:
			query_list = self.session.query(models.ChargeType.id).join(models.Fruit).filter(models.Fruit.fruit_type_id < 2000,models.Fruit.fruit_type_id > 1000).all()
		for item in query_list:
			cur_charge_type_list.append(item[0])

		for goods_item in fruit_list:
			goods_item = eval(goods_item)
			for key in goods_item:
				fl_value = goods_item[key]
				num = float(fl_value["num"])
				single_price = float(fl_value["charge"].split('元')[0])
				total_price = single_price * num

				if key not in cur_charge_type_list:
					continue

				if str(key) not in list(charge_type_shop_dict.keys()):
					continue

				charge_type_shop_dict[str(key)][1] += total_price
				charge_type_shop_dict[str(key)][1] = round(charge_type_shop_dict[str(key)][1],2)

		# 将字典charge_type_shop_dict的值([shop_id,price])存到一个列表中，考虑到shop_id会有重复的情况(因为同一个charge_type_id可能对应多个shop_id)，
		# 所以先要把shop_id存到一个列表cur_shop_id中，然后将该列表去重，然后再遍历charge_type_shop_dict的值，累加每个店铺的price，存到each_shop_price_dict字典中，键为shop_id,值为price．
		cur_shop_id_list = []
		for key in charge_type_shop_dict:
			cur_shop_id_list.append(charge_type_shop_dict[key][0])

		# 去重
		cur_shop_id_list = set(cur_shop_id_list)

		each_shop_price_dict = {}
		for item in cur_shop_id_list:
			each_shop_price_dict[str(item)] = 0
		for key in charge_type_shop_dict:
			item = charge_type_shop_dict[key]
			shop_id = item[0]
			price = item[1]
			each_shop_price_dict[str(shop_id)] += price

		# 如果group_id == 0：从m_charge_type,m_goods,menu三表联合查询，查出所有m_charge_type中id对应的menu表中的shop_id,并建立字典，键为m_charge_type_id,值为shop_id,
		# 然后根据shop_id将金额累加到charge_type_shop_dict中去．如果查不到计价方式对应的shop_id（可能计价方式已经被删除了）那么直接continue.
		# 完了以后再遍历当前字典，如果shop_id在each_shop_price_dict的键列表中，则将这这个键对应的price自加，否则新增键值对.
		if group_id == 0:
			mcharge_type_shop_dict = {}
			query_list = self.session.query(models.MChargeType.id,models.Menu.shop_id).filter(models.MChargeType.mgoods_id == models.MGoods.id,\
						            models.MGoods.menu_id == models.Menu.id).all()
			for item in query_list:
				mcharge_type_shop_dict[str(item[0])] = [item[1],0]
			# 从mgoods_list列表的每一项中分离出对应的金额
			for goods_item in mgoods_list:
				goods_item = eval(goods_item)
				for key in goods_item:
					fl_value = goods_item[key]
					num = float(fl_value["num"])
					single_price = float(fl_value["charge"].split('元')[0])
					total_price = single_price * num

					if str(key) not in list(mcharge_type_shop_dict.keys()):
						continue

					mcharge_type_shop_dict[str(key)][1] += total_price
					mcharge_type_shop_dict[str(key)][1] = round(mcharge_type_shop_dict[str(key)][1],2)

			for key in mcharge_type_shop_dict:
				item = mcharge_type_shop_dict[key]
				if str(item[0]) not in list(each_shop_price_dict.keys()):
					each_shop_price_dict[str(item[0])] = 0
				each_shop_price_dict[str(item[0])] += item[1]
				each_shop_price_dict[str(item[0])] = round(each_shop_price_dict[str(item[0])],2)

		# 最后新建一个列表each_shop_price_list，每一个元素为一个子列表，子列表的第一项为shop_id,第二项为shop_name,第三项为price,
		# 将each_shop_price_list按照price降序排列，然后取each_shop_price_list的前十项返回到前台．
		each_shop_price_list = []
		for key in each_shop_price_dict:
			shop_id = int(key)
			shop_name = self.session.query(models.Shop.shop_name).filter_by(id = shop_id).first()[0]
			shop_price = each_shop_price_dict[key]
			each_shop_price_list.append([shop_id,shop_name,shop_price])

		each_shop_price_list.sort(key = lambda item : item[2],reverse = True)
		each_shop_price_list = each_shop_price_list[0:10]
		each_shop_price_list.sort(key = lambda item : item[2],reverse = False)
		output_data = each_shop_price_list
		output_data = [item for item in output_data if item[2] != 0]
		# print(output_data)

		return self.send_success(output_data = output_data)


##



class Official(SuperBaseHandler):
	def get(self):
		return self.render("m-official/home.html")

# 店铺 - 删除评论申请
class Comment(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
		data = []
		order_info = {}
		level = self.current_user.level
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
			admin_id = shop.admin.accountinfo.id
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
				comment = comment,customer_id = customer_id)
			data.append([shop_code,shop_name,admin_name ,create_date, comment_apply.delete_reason,order_info,has_done,apply_id,admin_id])

		q_temp = self.session.query(models.ShopTemp).count()
		all_shop = self.session.query(models.Shop).count()
		comment = self.session.query(models.Order).filter(models.Order.status == 6).count()
		auth_apply=self.session.query(models.ShopAuthenticate).filter_by(has_done = 0).count()

		count = {
			"all_temp": q_temp,
			"all": all_shop,
			"comment":comment,
			"auth_apply":auth_apply
			}
		# return self.send_success(data = data)
		self.render('superAdmin/shop-comment-apply.html',level=level,context=dict(count = count,subpage="comment",subpage2="",data=data))

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
			comment_apply.shop.comment_count = comment_apply.shop.comment_count -1
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
# modified by sunmh 2015年09月21日15:57:25
# 店铺-店铺评论
class CommentInfo(SuperBaseHandler):
	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments("ajaxFlag")
	def get(self):
		output_data = []
		output_data_tmp = []
		page_size=15
		page = 0
		ajaxFlag = self.args["ajaxFlag"]

		# woody 8.3
		level = self.current_user.level
		shop_province = self.current_user.province
		# level = 1
		# shop_province = 420000

		# 所有评论，满分评论和有图评论
		if level == 0:
			order_list =  self.session.query(models.Order).filter(models.Order.status == 6).order_by(desc(models.Order.comment_create_date)).offset(page*page_size).limit(page_size).all()
			all_comment_order = self.session.query(models.Order.id).filter(models.Order.status == 6).order_by(desc(models.Order.comment_create_date))
			all_count = all_comment_order.count()
			full_count = all_comment_order.filter(models.Order.commodity_quality == 100,models.Order.send_speed == 100,models.Order.shop_service == 100).count()
			img_count = all_comment_order.filter(models.Order.comment_imgUrl.like('http:%')).count()
		elif level == 1:
			order_list = self.session.query(models.Order).join(models.Shop,models.Order.shop_id==models.Shop.id).filter(models.Order.status==6,models.Shop.shop_province==shop_province
				).distinct(models.Order.id).order_by(desc(models.Order.comment_create_date)).offset(page*page_size).limit(page_size).all()
			all_comment_order = self.session.query(models.Order.id).join(models.Shop,models.Order.shop_id==models.Shop.id).filter(models.Order.status==6,models.Shop.shop_province==shop_province
				).distinct(models.Order.id).order_by(desc(models.Order.comment_create_date))
			all_count = all_comment_order.count()
			full_count = all_comment_order.filter(models.Order.commodity_quality == 100,models.Order.send_speed == 100,models.Order.shop_service == 100).count()
			img_count = all_comment_order.filter(models.Order.comment_imgUrl.like('http:%')).count()
		else:
			return self.send_fail('level error')

		for order in order_list:
			data = {}
			data["all_count"] = all_count
			data["full_count"] = full_count
			data["img_count"] = img_count
			# 组装字典
			self.__assemblyDict(order,data)

			output_data_tmp.append(data)

		output_data = output_data_tmp

		if all_count//page_size < all_count/page_size:
			page_sum = all_count//page_size + 1
		else:
			page_sum = all_count//page_size


		q_temp = self.session.query(models.ShopTemp.id).count()
		if level == 0:
			all_shop = self.session.query(models.Shop.id).count()
			comment = self.session.query(models.Order.id).filter(models.Order.status == 6).count()
			auth_apply=self.session.query(models.ShopAuthenticate.id).filter_by(has_done = 0).count()
		elif level == 1:
			all_shop = self.session.query(models.Shop.id).filter_by(shop_province=shop_province).count()
			comment = self.session.query(models.Order.id).join(models.Shop,models.Order.shop_id==models.Shop.id).\
				filter(models.Order.status==6,models.Shop.shop_province==shop_province).distinct(models.Order.id).count()
			auth_apply = self.session.query(models.ShopAuthenticate,models.ShopAuthenticate.shop_id==models.Shop.id).\
				filter(models.ShopAuthenticate.has_done==0,models.Shop.shop_province == shop_province).distinct(models.ShopAuthenticate.id).count()

		count = {
			"all_temp": q_temp,
			"all": all_shop,
			"comment":comment,
			"auth_apply":auth_apply
			}

		if ajaxFlag != '1':
			self.render('superAdmin/shop-comment-info.html',output_data = output_data,level=level,page_sum = page_sum,context=dict(count = count,subpage="comment",subpage2="info"))
		else:
			return self.send_success(page_sum = page_sum)

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('page:int','action:str')
	def post(self):
		page = self.args['page']
		action = self.args['action']
		page_size = 15

		output_data = []

		# woody 8.3
		level = self.current_user.level
		shop_province = self.current_user.province
		if level == 0:
			order_list_data = self.session.query(models.Order).filter(models.Order.status == 6).order_by(desc(models.Order.comment_create_date))
		elif level == 1:
			order_list_data = self.session.query(models.Order).join(models.Shop,models.Order.shop_id == models.Shop.id).filter(models.Order.status==6,
				models.Shop.shop_province==shop_province).distinct(models.Order.id).order_by(desc(models.Order.comment_create_date))
		if action == 'all':
			order_list = order_list_data.offset(page*page_size).limit(page_size).all()
			for order in order_list:
				data = {}
				# 组装字典
				self.__assemblyDict(order,data)
				output_data.append(data)

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
				# 组装字典
				self.__assemblyDict(order,data)
				output_data.append(data)

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
				# 组装字典
				self.__assemblyDict(order,data)
				output_data.append(data)

			img_count = order_list_data.filter(models.Order.comment_imgUrl.like('http:%')).count()
			if img_count//page_size < img_count/page_size:
				page_sum = img_count//page_size + 1
			else:
				page_sum = img_count//page_size

		else:
			return self.send_error(404)
		return self.send_success(output_data = output_data,page_sum = page_sum)


	# 根据订单信息来组装字典
	# add by sunmh 2015年09月21日16:01:15
	def __assemblyDict(self,order,data):
		comment_image_list = []
		q_temp=self.session.query(models.Accountinfo.headimgurl_small,models.Accountinfo.nickname,models.Accountinfo.id).\
				filter(models.Accountinfo.id == order.customer_id).first()
		data["headimgurl"] = q_temp[0]
		data["nickname"] = q_temp[1]
		data["user_id"] = q_temp[2]
		if len(data["nickname"]) > 6:
			data["nickname"] = data["nickname"][0:5] + '...'
		data["create_date"] = order.create_date.strftime("%Y-%m-%d %H:%M:%S")
		if order.comment_create_date == None:
			data["comment_create_date"] = ''
		else:
			data["comment_create_date"] = order.comment_create_date.strftime("%Y-%m-%d %H:%M:%S")

		q_temp=self.session.query(models.Shop.shop_name,models.Shop.shop_code).\
				filter(models.Shop.id == order.shop_id).first()
		data["shop_name"] = q_temp[0]
		data["shop_code"] = q_temp[1]
		if len(data["shop_name"]) > 6:
			data["shop_name"] = data["shop_name"][0:5] + '...'

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
		return
##

# 店铺 - 店铺认证申请
class ShopAuthenticate(SuperBaseHandler):
	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('page:str','out_link?:str','data_id?:int')
	def get(self):
		page=self.args["page"]
		page_size = 10
		page_area = page*page_size
		out_link = ''
		if 'out_link' in self.args:
			if self.args['out_link'] == 'true':
				shop_id = self.args['data_id']
				out_link = 'true'
		# woody 8.3
		level = self.current_user.level
		shop_province = self.current_user.province
		# level = 1
		# shop_province = 420000
		if  level == 0:
			if out_link != 'true':
				apply_list=self.session.query(models.ShopAuthenticate).order_by(desc(models.ShopAuthenticate.id)).offset(page_area).limit(10).all()
			else:
				apply_list=self.session.query(models.ShopAuthenticate).filter_by(shop_id = shop_id).order_by(desc(models.ShopAuthenticate.id)).offset(page_area).limit(10).all()
			q_temp = self.session.query(models.ShopTemp.id).count()
			all_shop = self.session.query(models.Shop.id).count()
			comment = self.session.query(models.Order.id).filter(models.Order.status == 6).count()
			auth_apply=self.session.query(models.ShopAuthenticate.id).filter_by(has_done = 0).count()
			
		elif level == 1:
			if out_link != 'true':
				apply_list = self.session.query(models.ShopAuthenticate).join(models.Shop,models.ShopAuthenticate.shop_id == models.Shop.id
						).filter(models.Shop.shop_province==shop_province).distinct(models.ShopAuthenticate.id
						).order_by(desc(models.ShopAuthenticate.id)).offset(page_area).limit(10).all()
			else:
				apply_list = self.session.query(models.ShopAuthenticate).join(models.Shop,models.ShopAuthenticate.shop_id == models.Shop.id
						).filter(models.Shop.shop_province==shop_province,models.ShopAuthenticate.shop_id == shop_id).distinct(models.ShopAuthenticate.id
						).order_by(desc(models.ShopAuthenticate.id)).offset(page_area).limit(10).all()
			q_temp = self.session.query(models.ShopTemp.id).count()
			all_shop = self.session.query(models.Shop.id).filter_by(shop_province=shop_province).count()
			comment = self.session.query(models.Order.id).join(models.Shop,models.Order.shop_id == models.Shop.id).filter(models.Order.status==6,
				models.Shop.shop_province==shop_province).distinct(models.Order.id).count()
			auth_apply = self.session.query(models.ShopAuthenticate.id).join(models.Shop,models.ShopAuthenticate.shop_id == models.Shop.id).filter(
				models.ShopAuthenticate.has_done==0,models.Shop.shop_province==shop_province).distinct(models.ShopAuthenticate.id).count()

		count = {
			"all_temp": q_temp,
			"all": all_shop,
			"comment":comment,
			"auth_apply":auth_apply
			}

		self.render('superAdmin/shop-cert-apply.html',level=level,context=dict(count = count,subpage="auth",auth_apply_list=apply_list))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('action','apply_id','decline_reason?:str','apply_type:int')
	def post(self):
		action = self.args['action']
		apply_id = self.args['apply_id']
		apply_type = int(self.args["apply_type"])
		try:
			shop_auth_apply = self.session.query(models.ShopAuthenticate).filter_by(id = apply_id).first()
		except:
			print('[ShopAuthenticate]shop_auth_apply not found')

		try:
			shop = self.session.query(models.Shop).filter_by(id = shop_auth_apply.shop_id).first()
		except:
			print('[ShopAuthenticate]shop not found')

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
			# 发送短消息提醒
			if shop.shop_phone:
				shop_auth_msg(shop.shop_phone,shop.admin.accountinfo.nickname,shop.shop_name)
			else:
				print("[ShopAuthenticate]no phone")
			# 发送模板消息
			self.shop_auth_msg(shop,True)
		elif action == 'decline':
			decline_reason = self.args['decline_reason']
			shop_auth_apply.has_done = 2
			shop_auth_apply.decline_reason=decline_reason
			if shop.auth_change == 0:
				shop.shop_auth = 0
			self.session.commit()
			# 发送短消息提醒
			if shop.shop_phone:
				shop_auth_fail_msg(shop.shop_phone,shop.admin.accountinfo.nickname,shop.shop_name)
			else:
				print("[ShopAuthenticate]no phone")
			# 发送模板消息
			self.shop_auth_msg(shop,False)
		else:
			return self.send_error(404)
		return self.send_success(status=0,msg = 'success',data = {})

# 余额 - 余额详情
class Balance(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
		cash_on = 0
		total_balance = 0
		cash_success = 0
		cash_times = 0
		cash_persons = 0
		# 当level=1时，表示区域管理员，只显示该区域的数据
		# woody 8.3
		super_admin = self.current_user
		# print("[SuperBalance]Current super_admin:",super_admin)
		level = super_admin.level
		shop_province = super_admin.province
		# print("[SuperBalance]Current super_admin level:",level,", shop_province:",shop_province)
		if level == 0:
			cash_on = self.session.query(func.sum(models.ApplyCashHistory.value)).filter_by(has_done=0).all()[0][0]
			total_balance = self.session.query(func.sum(models.Shop.shop_balance)).all()[0][0]
			# cash_success_list = self.session.query(models.ApplyCashHistory).filter_by(has_done=1).all()
			# person_num = self.session.query(models.ApplyCashHistory).distinct(models.ApplyCashHistory.shop_id).count()
			# 增加今日新增平台总余额 充值0+在线支付3-微信在线支付退款记录8-支付宝在线支付退款记录9(-提现2   后面不减提现记录)
			# modified by sunmh 2015年09月16日
			today_balance_base=self.session.query(func.sum(models.BalanceHistory.balance_value)).filter(func.datediff(models.BalanceHistory.create_time,func.now())==0)
		elif level == 1:
			cash_on = self.session.query(func.sum(models.ApplyCashHistory.value)).filter_by(has_done = 0,shop_province=shop_province).all()[0][0]
			total_balance = self.session.query(func.sum(models.Shop.shop_balance)).filter_by(shop_province=shop_province).all()[0][0]
			# cash_success_list = self.session.query(models.ApplyCashHistory).filter_by(has_done=1,shop_province=shop_province).all()
			# person_num = self.session.query(models.ApplyCashHistory).filter_by(shop_province=shop_province).distinct(models.ApplyCashHistory.shop_id).count()
			today_balance_base=self.session.query(func.sum(models.BalanceHistory.balance_value)).filter(func.datediff(models.BalanceHistory.create_time,func.now())==0).\
				filter(models.BalanceHistory.shop_province==shop_province)
		today_balance_plus=today_balance_base.filter(models.BalanceHistory.balance_type.in_([0,3])).all()[0][0]
		today_balance_minus=today_balance_base.filter(models.BalanceHistory.balance_type.in_([8,9])).all()[0][0]
		today_balance=format(float(0 if today_balance_plus==None else today_balance_plus)-float(0 if today_balance_minus==None else today_balance_minus),'.2f')
		

		cash_on = format(cash_on,'.2f')
		total_balance = format(total_balance,'.2f')
		return self.render('superAdmin/balance-detail.html',cash_times=cash_times,cash_success=cash_success,\
			total_balance=total_balance,cash_on=cash_on,level=level,today_balance=today_balance,context=dict(page="detail"))

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('action','page:int','shop_name')
	def post(self):
		# 当level=1时，表示区域管理员，只显示该区域的数据
		# woody 8.3
		level = self.current_user.level
		shop_province = self.current_user.province
		if level != 0 and level != 1:
			return self.send_fail('level error')
		
		action = self.args['action']
		page = self.args['page']-1
		page_size=15
		shop_name = self.args.get('shop_name','')
		# add by jyj 2015-7-4:
		# modified by sunmh :Cause it's different with others
		if action == 'balance_list':
			# 余额列表，取余额记录表中店的最新记录，得到该店的最新更新时间和余额
			balance_list = self.session.query(models.BalanceHistory.shop_id,models.BalanceHistory.create_time,models.BalanceHistory.shop_totalPrice).\
				filter(models.BalanceHistory.shop_totalPrice >= 0,
					models.BalanceHistory.shop_totalPrice != None,
					models.BalanceHistory.shop_name.like('%%%s%%' % shop_name))
			if level == 1:
				balance_list = balance_list.filter(models.BalanceHistory.shop_province==shop_province)

			history_list = balance_list.order_by(desc(models.BalanceHistory.create_time)).all()
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
			history.sort(key=operator.itemgetter("total_price"),reverse=True)
			count=len(history)
			page_sum = int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1
			history = history[page*page_size:page*page_size+page_size:1]

			return self.send_success(page_sum=page_sum,history = history)
		##

		# 1.先获取列表记录，包括列表展示和页数
		# 基本查询 sunmh 2015年09月22日09:19:01
		balance_history = self.session.query(models.BalanceHistory.shop_id,models.BalanceHistory.create_time,models.BalanceHistory.shop_totalPrice,models.BalanceHistory.balance_type,
			models.BalanceHistory.balance_value,models.BalanceHistory.superAdmin_id,models.BalanceHistory.balance_record).\
			filter(models.BalanceHistory.shop_name.like('%%%s%%' % shop_name))
		if level == 1:
			balance_history = balance_history.filter(models.BalanceHistory.shop_province==shop_province)
		if action == 'all_history':
			pass
		elif action == 'cash_history':
			# 取提现对应的余额记录
			balance_history=balance_history.filter(models.BalanceHistory.balance_type == 2)
		elif action == 'recharge':
			# 取充值的余额记录
			balance_history=balance_history.filter(models.BalanceHistory.balance_type == 0)
		elif action == 'online':
			# 取在线支付的余额记录
			balance_history=balance_history.filter(models.BalanceHistory.balance_type.in_([3,8,9]))

		history_list =balance_history.order_by(desc(models.BalanceHistory.create_time)).offset(page*page_size).limit(page_size).all()
		count = balance_history.count()
		history = []
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
					record = temp.balance_record.split("：")[0]
				history.append({'shop_name':shop_name,'shop_code':shop_code,'time':create_time,'balance':shop_totalBalance,\
								'balance_value':temp.balance_value,'type':temp.balance_type,'admin_id':temp.superAdmin_id,'record':record})
		page_sum=int(count/page_size) if (count % page_size == 0) else int(count/page_size) + 1

		# 2.列表之外的信息
		context={}
		if action == 'all_history':
			pass
		elif action == 'cash_history':
			q_cash = self.session.query(func.sum(models.BalanceHistory.balance_value),func.count()).\
				filter(models.BalanceHistory.balance_type == 2,
					   models.BalanceHistory.shop_name.like('%%%s%%' % shop_name))
			# 今日已提现 sunmh 2015年09月16日
			q_cash_totay=q_cash.filter(func.datediff(models.BalanceHistory.create_time,func.now())==0)
			if level == 1:
				q_cash = q_cash.filter(models.BalanceHistory.shop_province==shop_province)
				q_cash_totay = q_cash_totay.filter(models.BalanceHistory.shop_province==shop_province)
			q_cash=q_cash.all()
			q_cash_totay=q_cash_totay.all()
			total = format(0 if q_cash[0][0] ==None else q_cash[0][0],'.2f')
			total_today=format(0 if q_cash_totay[0][0] ==None else q_cash_totay[0][0],'.2f')
			context={'total_today':total_today,
					 'total':total}
		elif action == 'recharge':
			q_charge = self.session.query(func.sum(models.BalanceHistory.balance_value),func.count()).\
				filter(models.BalanceHistory.balance_type == 0,
					   models.BalanceHistory.shop_name.like('%%%s%%' % shop_name))
			q_consume = self.session.query(func.sum(models.BalanceHistory.balance_value)).\
				filter(models.BalanceHistory.balance_type == 1,
					   models.BalanceHistory.shop_name.like('%%%s%%' % shop_name),
					   models.BalanceHistory.is_cancel == 0)
			if level == 1:
				q_charge = q_charge.filter(models.BalanceHistory.shop_province==shop_province)
				q_consume= q_consume.filter(models.BalanceHistory.shop_province==shop_province)
			# 增加今日充值和今日已消费
			q_charge_today=q_charge.filter(func.datediff(models.BalanceHistory.create_time,func.now())==0).all()
			q_consume_today=q_consume.filter(func.datediff(models.BalanceHistory.create_time,func.now())==0).all()
			q_charge=q_charge.all()
			q_consume=q_consume.all()
			total_today=format(0 if q_charge_today[0][0] == None else q_charge_today[0][0] ,'.2f')
			pay_today=format(0 if q_consume_today[0][0] == None else q_consume_today[0][0] ,'.2f')
			total=format(0 if q_charge[0][0] == None else q_charge[0][0] ,'.2f')
			pay = format(0 if q_consume[0][0] == None else q_consume[0][0] ,'.2f')
			left = format(float(total)-float(pay),'.2f')
			context={'total_today':total_today,'pay_today':pay_today,
					 'total':total,'pay':pay,'left':left}
		elif action == 'online':
			q_pay = self.session.query(func.sum(models.BalanceHistory.balance_value),func.count()).\
				filter(models.BalanceHistory.balance_type == 3,models.BalanceHistory.is_cancel==0,
					   models.BalanceHistory.shop_name.like('%%%s%%' % shop_name))
			persons = self.session.query(models.BalanceHistory.customer_id).distinct().\
				filter(models.BalanceHistory.balance_type == 3,models.BalanceHistory.is_cancel==0,
					   models.BalanceHistory.shop_name.like('%%%s%%' % shop_name))
			if level == 1:
				q_pay = q_pay.filter(models.BalanceHistory.shop_province==shop_province)
				persons = persons.filter(models.BalanceHistory.shop_province==shop_province)
			# 增加今日支付
			q_pay_today=q_pay.filter(func.datediff(models.BalanceHistory.create_time,func.now())==0).all()
			q_pay=q_pay.all()
			persons_today=persons.filter(func.datediff(models.BalanceHistory.create_time,func.now())==0).count()
			persons=persons.count()
			times_today=0 if q_pay_today[0][1] == None else q_pay_today[0][1]
			total_today=format(0 if q_pay_today[0][0] == None else q_pay_today[0][0] ,'.2f')
			times=0 if q_pay[0][1] == None else q_pay[0][1]
			total=format(0 if q_pay[0][0] == None else q_pay[0][0] ,'.2f')
			context={'times_today':times_today,'total_today':total_today,'persons_today':persons_today,
					 'times':times,'total':total,'persons':persons}
		else:
			return self.send_error(404)
		return self.send_success(history = history,page_sum=page_sum,context=context)

# 退款申请
class ApplyRefund(SuperBaseHandler):
	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('page?:int')
	def get(self):
		data = []
		refund_list = self.session.query(models.ApplyRefund).filter_by(has_done=0).all()
		if refund_list:
			for item in refund_list:
				order = self.session.query(models.Order.del_reason,models.Shop.shop_name).join(models.Shop,models.Shop.id==models.Order.shop_id)\
				.filter(models.Order.id==item.order_id).first()
				item_dict = {}
				item_dict['id'] = item.id
				item_dict['customer_id'] = item.customer_id
				item_dict['refund_fee']  = item.refund_fee
				item_dict['refund_type'] = '支付宝支付' if item.refund_type else '微信支付'
				item_dict['refund_url']  = item.refund_url
				item_dict['create_time'] = item.create_time.strftime("%Y-%m-%d %H:%M")
				item_dict['order_num'] = item.order_num
				item_dict['shop_name'] = order[1]
				item_dict['reason'] = order[0]
				data.append(item_dict)
		return self.render('superAdmin/refund-apply.html',data=data,context=dict(page='refund'))

	@SuperBaseHandler.check_arguments('apply_id','action')
	def post(self):
		action = self.args["action"]
		apply_id = self.args['apply_id']
		if len(apply_id) == 0:
			return self.send_fail('申请记录为空！')
		apply_id = int(apply_id)
		refund_apply = self.session.query(models.ApplyRefund).filter_by(id=apply_id).first()
		if action == "confirm":
			if refund_apply.has_done == 1:
				return self.send_fail('请勿重复处理！')
			refund_apply.has_done = 1 #将申请退款变为已处理状态
			###################################################################
			# 9.17 woody
			# 如果该订单是支付宝支付。将支付记录作废,并改变订单状态
			# 如果是微信支付，则不需要修改
			##################################################################
			transaction_id = refund_apply.transaction_id
			order = self.session.query(models.Order).filter_by(transaction_id=transaction_id).first()
			if not order:
				return self.send_fail('order not found')
			if order.online_type == 'alipay':
				order.del_reason = 'refund'
				order.get_num(self.session,order.id)
				order.status = 0 #将订单状态改为删除
				balance_history = self.session.query(models.BalanceHistory).filter_by(transaction_id=transaction_id).first()
				if not balance_history:
					return self.write('old_balance_history not found')
				shop_id = balance_history.shop_id
				balance_value = balance_history.balance_value
				shop = order.shop 
				shop.shop_balance -= balance_value      #店铺余额减去订单总价，还原店铺余额
				balance_history.is_cancel = 1            #将旧的支付记录作废
				customer_id = balance_history.customer_id
				name        = balance_history.name
				shop_province = balance_history.shop_province
				shop_name     = balance_history.shop_name
				balance_record = '在线支付(支付宝)退款：订单' + order.num + '删除'
				create_time   = datetime.datetime.now()
				shop_totalPrice = shop.shop_balance
				customer_totalPrice = balance_history.customer_totalPrice
				transaction_id   = balance_history.transaction_id
				available_balance = balance_history.available_balance
				#同时生成一条退款记录
				refund_history = models.BalanceHistory(customer_id=customer_id,shop_id=shop_id,shop_province=shop_province,shop_name=shop_name,name=name,
					balance_record=balance_record,create_time=create_time,shop_totalPrice=shop_totalPrice,customer_totalPrice=customer_totalPrice,
					transaction_id=transaction_id,balance_type=9,balance_value=balance_value)
				self.session.add(refund_history)
		elif action == "ignore":
			refund_apply.has_done=-1
		self.session.commit()
		return self.send_success()

# 余额 - 提现申请
class ApplyCash(SuperBaseHandler):

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('action:?str','page?:int')
	def get(self):
		# woody
		level = self.current_user.level
		shop_province = self.current_user.province
		if level != 0 and level != 1:
			return self.send_fail('level error')
		page_size =10
		page_sum =0
		count = 0
		history = []
		apply_list = None
		action = self.args['action']
		page = 0
		all_cash = 0
		person_cash = 0
		company_cash = 0
		all_num = 0
		person_num = 0
		company_num = 0

		cash_history = self.session.query(models.ApplyCashHistory).filter_by(has_done = 0)
		if level == 1:
			cash_history = cash_history.filter_by(shop_province=shop_province)
		# 提现申请界面上的汇总信息
		if cash_history.count()!=0:
			alls = self.session.query(func.sum(models.ApplyCashHistory.value),func.count()).filter_by(has_done = 0)
			persons = self.session.query(func.sum(models.ApplyCashHistory.value),func.count()).filter_by(has_done = 0).\
				filter(models.ApplyCashHistory.shop_auth.in_([1,4]))
			companys = self.session.query(func.sum(models.ApplyCashHistory.value),func.count()).filter_by(has_done = 0).\
				filter(models.ApplyCashHistory.shop_auth.in_([2,3]))
			if level == 1:
				alls = alls.filter_by(shop_province=shop_province)
				persons = persons.filter_by(shop_province=shop_province)
				companys = companys.filter_by(shop_province=shop_province)

			alls=alls.all()
			persons=persons.all()
			companys=companys.all()
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

		# 提现界面上的列表展示
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
		# action='[]'表示是页面加载,其他的则是页面里的ajax get请求
		if action!='[]':
			return self.send_success(history=history,page_sum=page_sum)
		else:
			return self.render('superAdmin/balance-apply.html',history=history,page_sum=page_sum,all_cash=all_cash,person_cash=person_cash,\
				company_cash=company_cash,all_num=all_num,person_num=person_num,level=level,company_num=company_num,context=dict(page='cash'))

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
				return self.send_fail('[SuperApplyCash]apply_cash not found')
			apply_cash.has_done = 2
			apply_cash.decline_reason = self.args['decline_reason']
			self.session.commit()

		elif action == 'commit':
			apply_id = self.args['apply_id']
			apply_cash = self.session.query(models.ApplyCashHistory).filter_by(id = apply_id).first()
			if apply_cash == '':
				return self.send_fail('[SuperApplyCash]apply_cash not found')
			apply_cash.has_done = 1
			shop = self.session.query(models.Shop).filter_by(id = apply_cash.shop_id).first()
			if not shop:
				return self.send_fail('[SuperApplyCash]shop not found')
			shop.is_balance = 1
			shop.shop_balance = shop.shop_balance-apply_cash.value
			shop.available_balance = shop.available_balance - apply_cash.value
			#往 blancehistory中插入一条数据，以免到时候 查看所有记录的时候到两张表中去取 效率低下
			name = apply_cash.applicant_name
			balance_history = models.BalanceHistory(balance_record = '提现：管理员 '+name,balance_type =\
				2,balance_value = apply_cash.value ,customer_id = apply_cash.shop.admin.accountinfo.id,name = \
				name,shop_id = apply_cash.shop_id,shop_totalPrice = shop.shop_balance,superAdmin_id = \
				self.current_user.id,available_balance = shop.available_balance,shop_province=shop.shop_province,shop_name=shop.shop_name)
			self.session.add(balance_history)
			self.session.commit()
		return self.send_success(history = history)

#add by jyj 2015-6-17
class CheckCash(SuperBaseHandler):
	@tornado.web.authenticated
	def get(self):
		level = self.current_user.level
		if level == 1:
			return self.send_error(404)

		return self.render("superAdmin/balance-check.html",level=level,context=dict(page='check'))

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
				check_update_start = self.session.query(models.BalanceHistory).filter(models.BalanceHistory.balance_type.in_([0,3]),models.BalanceHistory.is_cancel==0).order_by(models.BalanceHistory.create_time).first()
				if not check_update_start:
					page_sum = 0
					output_data = []
					return self.send_success(output_data=output_data,page_sum = page_sum)
				check_update_start = check_update_start.create_time				
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
				   filter(models.BalanceHistory.balance_type.in_([0,3]),models.BalanceHistory.is_cancel==0).\
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
						   filter(models.BalanceHistory.balance_type.in_([0,3]),models.BalanceHistory.is_cancel==0,models.BalanceHistory.create_time >= start_time,\
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

		level = self.current_user.level
		shop_id = self.session.query(models.Shop.id).filter(models.Shop.shop_code == shop_code).first()
		shop_id = shop_id[0]

		cash_applying = self.session.query(models.ApplyCashHistory.value).filter(models.ApplyCashHistory.has_done == 0,models.ApplyCashHistory.shop_id == shop_id).first()
		if(cash_applying == None):
			cash_applying = format(0,'.2f')
		else:
			cash_applying = format(cash_applying[0],'.2f')

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
		return self.render("superAdmin/shop-balance-detail.html",level=level,history = history,context=dict())

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

		record_num = balance_history = self.session.query(models.BalanceHistory.id).\
				   filter(models.BalanceHistory.shop_id == shop_id,models.BalanceHistory.balance_type.in_([0,2,3])).order_by(desc(models.BalanceHistory.create_time)).count()
		page_sum = record_num/page_size
		if page == 0:  #如果前台传来的page=0，表示只获取page_sum
			return self.send_success(page_sum=page_sum)

		cash_applying = self.session.query(models.ApplyCashHistory.value).filter(models.ApplyCashHistory.has_done == 0).first()
		if(cash_applying == None):
			cash_applying = format(0,'.2f')
		else:
			cash_applying = format(cash_applying[0],'.2f')

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
			user_id = 0
			if temp.balance_type == 3:
				record = temp.balance_record[0:4] + ':'
				if temp.balance_record[5:7] == '支付':
					order_num = temp.balance_record[12:32]
				else:
					order_num = temp.balance_record[11:32]
				name = temp.name[0:6]
				user_id = temp.customer_id
				order_num_txt = "-订单编号"
			elif temp.balance_type == 2:
				record = "提现:"
				name = "店铺管理员"
			elif temp.balance_type == 0:
				record = "用户充值:"
				name = temp.name
				user_id = temp.customer_id

			balance_value = format(temp.balance_value,'.2f')

			history.append({'shop_name':shop_name,'shop_code':shop_code,'time':create_time,'balance':shop_totalBalance,\
					'balance_value':balance_value,'type':temp.balance_type,'record':record,'order_num':order_num,\
					'name':name,'order_num_txt':order_num_txt,'cash_applying':cash_applying,'user_id':user_id})
		return self.send_success(page_sum=page_sum,history = history)
##

# 分省代理管理员
class AdminManager(SuperBaseHandler):
	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('action')
	def get(self):
		action   = self.args.get('action',None)
		if_super = None
		level = self.current_user.level
		try:
			if_super = self.session.query(models.SuperAdmin).filter_by(id=self.current_user.id,level=0).first()
		except:
			if_super = None
		if action == 'add_admin':
			if not if_super:
				return self.send_fail(403)
			return self.render('superAdmin/add-admin.html',level=level, if_super=if_super)
		elif action == "check_admin":
			return self.render('superAdmin/check-admin.html',level=level,if_super=if_super)
		else:
			return self.send_error(404)

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('action','admin_id?:int','province?:str')
	def post(self):
		if "admin_id" in self.args:
			admin_id = int(self.args['admin_id'])
		action   = self.args.get('action',None)
		if action == 'search_user':
			info = self.session.query(models.Accountinfo).filter_by(id=admin_id).first()
			if not info:
				return self.send_fail('该用户还不是森果的用户，无法添加其为超级管理员')
			data = dict(imgurl=info.headimgurl_small,nickname=info.nickname,realname=info.realname,id=info.id,phone=info.phone)
			return self.send_success(data = data)
		elif action == 'add_admin':
			province = self.args.get('province',None)
			if not province:
				self.send_fail('请输入该用户所管辖的省份')
			super_admin = self.session.query(models.SuperAdmin).filter_by(id = admin_id).first()
			if super_admin:
				return self.send_fail('该用户已经是超级管理员，请勿重复添加')
			info = self.session.query(models.Accountinfo).filter_by(id=admin_id).first()
			if not info:
				return self.send_fail('该用户还不是森果的用户，无法添加其为超级管理员')
			super_admin = models.SuperAdmin()
			super_admin.id = info.id
			super_admin.account_info = info
			super_admin.level = 1
			super_admin.province = province
			self.session.add(super_admin)
			self.session.commit()
			return self.send_success()
		elif action == 'all':
			data = []
			admin_list = self.session.query(models.SuperAdmin).filter_by(level=1).all()
			print(admin_list)
			for item in admin_list:
				temp = {}
				province = self.code_to_text("province",item.province) if  item.province else ""
				temp['realname'] = item.accountinfo.realname
				temp['id']       = item.id
				temp['phone']    = item.accountinfo.phone
				temp['province'] = province
				temp['headimgurl_small'] = item.accountinfo.headimgurl_small
				data.append(temp)
			return self.send_success(data = data)
		elif action == 'filter':
			province = self.args['province']
			data = []
			admin_list = self.session.query(models.SuperAdmin).filter_by(level=1,province=province).all()
			for item in admin_list:
				temp = {}
				temp['realname'] = item.accountinfo.realname
				temp['id']       = item.id
				temp['phone']    = item.accountinfo.phone
				temp['province'] = item.province
				temp['headimgurl_small'] = item.accountinfo.headimgurl_small
				data.append(temp)
			return self.send_success(data = data)
		elif action == 'cancel':
			super_admin = self.session.query(models.SuperAdmin).filter_by(id=admin_id).first()
			if not super_admin:
				return self.send_fail('该管理员不存在')
			super_admin.level = -1
			self.session.commit()
			return self.send_success()
		else:
			return self.send_error(404)


# 将平台用户置为新的用户，以便进行测试
class MakeNewUser(SuperBaseHandler):
	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('action?:str')
	def get(self):
		action = self.args.get('action',None)
		user_list = []
		level = 0
		if_super = True
		super_user = self.session.query(models.SuperAdmin).all()
		if action == 'backup':
			for item in super_user:
				item.wx_unionid_back = item.accountinfo.wx_unionid
				item.wx_openid_back  = item.accountinfo.wx_openid
			self.session.commit()
			return self.send_success()
		for item in super_user:
			# print(item.id,item.accountinfo.nickname)
			if item.accountinfo.wx_unionid  is None:
				isnew = True
			else:
				isnew = False
			item_info = {'id':item.id,'nickname':item.accountinfo.nickname,'isnew':isnew}
			user_list.append(item_info)
		# print(user_list)
		return self.render('superAdmin/new_user.html',level  = 0,if_super = if_super,user_list=user_list)

	@tornado.web.authenticated
	@SuperBaseHandler.check_arguments('user_id','action')
	def post(self):
		user_id = self.args.get('user_id')
		action  = self.args.get('action',None)
		user = self.session.query(models.SuperAdmin).filter_by(id = user_id).first()
		if not user:
			return self.send_fail("该用户不存在")
		if action == 'modify':
			user.accountinfo.wx_openid = None
			user.accountinfo.wx_unionid = None
		elif action == 'recover':
			# print('recover')
			wx_unionid = user.wx_unionid_back
			wx_openid  = user.wx_openid_back
			#找到生成的新用户，将unionid和openid清零，以便还原之前的数据
			new_user = self.session.query(models.Accountinfo).filter_by(wx_unionid=wx_unionid).first()
			if new_user and new_user.id != user_id:
				new_user.wx_unionid = None
				new_user.wx_openid  = None
			#将旧用户信息还原
			user.accountinfo.wx_unionid = wx_unionid
			user.accountinfo.wx_openid  = wx_openid
		else:
			return self.send_fail(error_text = 'action error!!!')
		self.session.commit()
		return self.send_success()