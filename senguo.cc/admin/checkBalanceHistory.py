# created by jyj 2015-7-31
import dal.models as models
import time, datetime
from sqlalchemy import exists, func, extract, DATE, desc,or_
from dal.dis_dict import dis_dict
from libs.msgverify import check_msg_token,get_access_token,user_subscribe,shop_auth_msg,shop_auth_fail_msg
#add by jyj 2015-6-15
from sqlalchemy import func, desc, and_, or_, exists,not_
import operator
##
session = models.DBSession()

#用此处测试整个系统的余额和在线支付记录错误、重复、遗漏、数值计算错误的问题

def Check():
	# *将balancehistory表中的所有店铺id查出来存放在列表shop_list_query1中
	# *将系统中的所有status > -1的订单的数量不为0店铺的id查询出来存在一个列表shop_list_query2中
	# *然后从列表shop_list_query2中除去shop_list_query1中的id 
	shop_list_query1 = session.query(models.BalanceHistory.shop_id).distinct(models.BalanceHistory.shop_id).all()
	
	shop_id_list1 = []
	for item in shop_list_query1:
		shop_id_list1.append(item[0])

	# *设定一个change_shop_id列表,把balancehistory表中修改过的店铺的id都存进去.
	change_shop_id = []

	# shop_list_query2可以先不考虑
	# shop_list_query2 = session.query(models.Order.shop_id).filter(models.Order.status > -1,models.Order.pay_type.in_([2,3])).distinct(models.Order.shop_id).all()	
	# shop_id_list2 = []
	# for item in shop_list_query2:
	# 	if item[0] not in shop_id_list1:
	# 		shop_id_list2.append(item[0])

	# *遍历shop_id_list1每一个shop的id
	# if 1 == 2:
	for shop_id in shop_id_list1:
		print("@@",shop_id)
		if shop_id <= 0:
			continue
		# *筛选出shop_id错误的记录并修正.
		balance_list = session.query(models.BalanceHistory.id,models.BalanceHistory.balance_type,models.BalanceHistory.balance_record).filter_by(shop_id = shop_id).order_by(models.BalanceHistory.create_time).all()
		session.query(models.BalanceHistory).filter(models.BalanceHistory.shop_id <= 0).delete()
		session.query(models.BalanceHistory).filter(models.BalanceHistory.id == 19087).delete()
		session.query(models.BalanceHistory).filter(models.BalanceHistory.id == 19088).delete()
		session.commit()

		num_modify_list = ['197000176','615000311','271000022','197000177','624001065','848000584','624001076','848000585']
		balance_id_list = [698,699,700,701,719,728,729,731]
		for i in range(len(balance_id_list)):
			id = balance_id_list[i]
			history_record = session.query(models.BalanceHistory).filter_by(id = id).with_lockmode("update").first()
			history_record.balance_record = "在线支付(微信)：订单" + num_modify_list[i]
			session.commit()

		# # if 1 == 2:
		# for i in range(len(balance_list)):
		# 	item = balance_list[i]
		# 	id = item[0]
		# 	balance_type = item[1]
		# 	balance_record = item[2]
		# 	if balance_type in [1,3]:
		# 		for n in range(len(balance_record)):
		# 			if balance_record[n].isdigit():
		# 				break
		# 		order_num = balance_record[n : len(balance_record)]
		# 		order_num_shop_id = int(order_num[0 : -6])
		# 		if order_num_shop_id != shop_id:
		# 			print("no in !",shop_id,order_num)
		# 	elif balance_type in [4,5,6,7]:
		# 		for n in range(len(balance_record)):
		# 			if balance_record[n].isdigit():
		# 				break
		# 		order_num = balance_record[n : len(balance_record)-2]
		# 		order_num_shop_id = int(order_num[0 : -6])
		# 		if order_num_shop_id != shop_id:
		# 			print("no in !",shop_id,order_num)

		# *查询balancehistory表中的所有余额支付（balance_type = 1）的记录的订单号并存到列表balance_type_1中
		balance_type_1 = []
		query_list = session.query(models.BalanceHistory.balance_record).filter(models.BalanceHistory.balance_type == 1,models.BalanceHistory.shop_id == shop_id).all()
		if len(query_list) != 0:
			for item in query_list:
				for i in range(len(item[0])):
					if item[0][i].isdigit():
						break
				balance_type_1.append(item[0][i : len(item[0])])

		# *查询order表中的所有余额支付（pay_type = 2）的记录的订单号并存到列表pay_type_2中
		pay_type_2 = []
		query_list = session.query(models.Order.num).filter(models.Order.status >= 0,models.Order.pay_type == 2,models.Order.shop_id == shop_id).all()
		if len(query_list) != 0:
			for item in query_list:
				pay_type_2.append(item[0])

			# *判断pay_type_2的长度是否大于balance_type_1，若大于，则说明order表中肯定有余额支付的订单记录没有插入到balancehistory表中，这时就要把相关记录插入到balancehistory表中
			if len(pay_type_2) > len(balance_type_1):
				# print("!!@@@11111111111111",shop_id)
				# print("@@@@",len(pay_type_2))
				# print(len(balance_type_1))
				insert_order_num = [i for i in pay_type_2 if i not in balance_type_1]
				insert_list = session.query(models.Order.customer_id,models.Order.shop_id,models.Accountinfo.nickname,models.Order.totalPrice,models.Order.num,func.date_format(models.Order.create_date,'%Y-%m-%d %H:%i:%s')).\
					       join(models.Accountinfo,models.Accountinfo.id == models.Order.customer_id).filter(models.Order.num.in_(insert_order_num)).all()
				for i in range(len(insert_list)):
					shop_follow = session.query(models.CustomerShopFollow).filter_by(customer_id = insert_list[i][0],shop_id = shop_id).with_lockmode("update").first()
					if not shop_follow:
						return self.send_fail('shop_follow not found')
					shop_follow.shop_balance -= insert_list[i][3]   #用户对应 店铺余额减少 
					shop_follow.shop_balance = round(shop_follow.shop_balance,2)
					session.commit()

					insert_list[i] = list(insert_list[i])
					create_time = datetime.datetime.strptime(insert_list[i][5],'%Y-%m-%d %H:%M:%S')
					insert_list[i][4] = '余额支付：订单' + insert_list[i][4]
					balance_history = models.BalanceHistory(customer_id = insert_list[i][0],shop_id = insert_list[i][1] ,name = insert_list[i][2],balance_value = insert_list[i][3] ,\
										   balance_record = insert_list[i][4],create_time = create_time,balance_type = 1,is_cancel = 99999)
					session.add(balance_history)
					session.commit()
					change_shop_id.append(shop_id)
			elif len(pay_type_2)< len(balance_type_1):
				# print("@@@@@@@@1",len(pay_type_2),len(balance_type_1))
				pass
			else:
				pass

		balance_type_3 = []
		query_list = session.query(models.BalanceHistory.balance_record).filter(models.BalanceHistory.balance_type == 3,models.BalanceHistory.shop_id == shop_id).all()
		if len(query_list) != 0:
			for item in query_list:
				for i in range(len(item[0])):
					if item[0][i].isdigit():
						break
				balance_type_3.append(item[0][i : len(item[0])])

		pay_type_3 = []
		query_list = session.query(models.Order.num).filter(models.Order.status > 0,models.Order.pay_type == 3,models.Order.shop_id == shop_id).all()
		if len(query_list) != 0:
			for item in query_list:
				pay_type_3.append(item[0])

			# *判断pay_type_3的长度是否大于balance_type_3，若大于，则说明order表中肯定有在线支付的订单记录没有插入到balancehistory表中，这时就要把相关记录插入到balancehistory表中
			if len(pay_type_3) > len(balance_type_3):
				insert_order_num = [i for i in pay_type_3 if i not in balance_type_3]
				insert_list = session.query(models.Order.customer_id,models.Order.shop_id,models.Accountinfo.nickname,models.Order.totalPrice,models.Order.num,func.date_format(models.Order.create_date,'%Y-%m-%d %H:%i:%s'),models.Order.online_type).\
					       join(models.Accountinfo,models.Accountinfo.id == models.Order.customer_id).filter(models.Order.num.in_(insert_order_num)).all()
				for i in range(len(insert_list)):
					shop = session.query(models.Shop).filter_by(id = shop_id).first()
					if not shop:
						return self.send_fail('shop not found')
					shop.shop_balance += insert_list[i][3]
					shop.shop_balance = round(shop.shop_balance,2)
					session.commit()

					insert_list[i] = list(insert_list[i])
					create_time = datetime.datetime.strptime(insert_list[i][5],'%Y-%m-%d %H:%M:%S')
					if insert_list[i][6] == 'wx':
						insert_list[i][4] = '在线支付(微信)：订单' + insert_list[i][4]
					elif insert_list[i][6] == 'alipay':
						insert_list[i][4] = '在线支付(支付宝)：订单' + insert_list[i][4]
					balance_history = models.BalanceHistory(customer_id = insert_list[i][0],shop_id = insert_list[i][1] ,name = insert_list[i][2],balance_value = insert_list[i][3] ,\
										   balance_record = insert_list[i][4],create_time = create_time,balance_type = 3,is_cancel = 99999)
					session.add(balance_history)
					session.commit()
					change_shop_id.append(shop_id)
			elif len(pay_type_3) < len(balance_type_3):
				# print("@@@@@@@@2",len(pay_type_3),len(balance_type_3))
				pass
			else:
				pass

		balance_type_4_5 = []
		query_list = session.query(models.BalanceHistory.balance_record).filter(models.BalanceHistory.balance_type.in_([4,5]),models.BalanceHistory.shop_id == shop_id).all()
		if len(query_list) != 0:
			for item in query_list:
				for i in range(len(item[0])):
					if item[0][i].isdigit():
						break
				balance_type_4_5.append(item[0][i : len(item[0])-2])

		pay_type_2_delete = []
		query_list = session.query(models.Order.num).filter(models.Order.status == 0,models.Order.pay_type == 2,models.Order.shop_id == shop_id).all()
		if len(query_list) != 0:
			for item in query_list:
				pay_type_2_delete.append(item[0])

			# *判断pay_type_2_delete的长度是否大于balance_type_4_5，若大于，则说明order表中肯定有余额支付的订单记录没有插入到balancehistory表中，这时就要把相关记录插入到balancehistory表中
			if len(pay_type_2_delete) > len(balance_type_4_5):
				# print("!!@@@11111111111111",shop_id)
				# print("@@@@",len(pay_type_2_delete))
				# print(len(balance_type_4_5))
				insert_order_num = [i for i in pay_type_2_delete if i not in balance_type_4_5]
				insert_list = session.query(models.Order.customer_id,models.Order.shop_id,models.Accountinfo.nickname,models.Order.totalPrice,models.Order.num,func.date_format(models.Order.create_date,'%Y-%m-%d %H:%i:%s'),models.Order.del_reason).\
					       join(models.Accountinfo,models.Accountinfo.id == models.Order.customer_id).filter(models.Order.num.in_(insert_order_num)).all()
				for i in range(len(insert_list)):
					shop_follow = session.query(models.CustomerShopFollow).filter_by(customer_id = insert_list[i][0],shop_id = shop_id).with_lockmode("update").first()
					if not shop_follow:
						return self.send_fail('shop_follow not found')
					shop_follow.shop_balance += insert_list[i][3]   #用户对应 店铺余额增加 ，单位：元
					shop_follow.shop_balance = round(shop_follow.shop_balance,2)
					session.commit()

					insert_list[i] = list(insert_list[i])
					create_time = datetime.datetime.strptime(insert_list[i][5],'%Y-%m-%d %H:%M:%S')
					delete_time = create_time + datetime.timedelta(minutes = 15)
					if insert_list[i][6] == None:
						insert_list[i][4] = '余额退款：订单' + insert_list[i][4] + '取消'
						balance_type = 5
					elif insert_list[i][6] != None and insert_list[i][6] != 'timeout':
						insert_list[i][4] = '余额退款：订单' + insert_list[i][4] + '删除'
						balance_type = 4
					balance_history = models.BalanceHistory(customer_id = insert_list[i][0],shop_id = insert_list[i][1] ,name = insert_list[i][2],balance_value = insert_list[i][3] ,\
										   balance_record = insert_list[i][4],create_time = delete_time,balance_type = balance_type,is_cancel = 99999)
					session.add(balance_history)
					session.commit()
					change_shop_id.append(shop_id)
			elif len(pay_type_2_delete)< len(balance_type_4_5):
				# print("@@@@@@@@3",len(pay_type_2_delete),len(balance_type_4_5))
				pass
			else:
				pass

		balance_type_6_7 = []
		query_list = session.query(models.BalanceHistory.balance_record).filter(models.BalanceHistory.balance_type.in_([6,7]),models.BalanceHistory.shop_id == shop_id).all()
		if len(query_list) != 0:
			for item in query_list:
				for i in range(len(item[0])):
					if item[0][i].isdigit():
						break
				balance_type_6_7.append(item[0][i : len(item[0])-2])

		pay_type_2_3_done = []
		query_list = session.query(models.Order.num).filter(models.Order.status >= 5,models.Order.pay_type.in_([2,3]),models.Order.shop_id == shop_id).all()
		if len(query_list) != 0:
			for item in query_list:
				pay_type_2_3_done.append(item[0])

			# *判断pay_type_2_3_done的长度是否大于balance_type_6_7，若大于，则说明order表中肯定有余额支付完成或在线支付完成的订单记录没有插入到balancehistory表中，这时就要把相关记录插入到balancehistory表中
			if len(pay_type_2_3_done) > len(balance_type_6_7):
				# print("!!@@@11111111111111",shop_id)
				# print("@@@@",len(pay_type_2_3_done))
				# print(len(balance_type_6_7))
				insert_order_num = [i for i in pay_type_2_3_done if i not in balance_type_6_7]
				insert_list = session.query(models.Order.customer_id,models.Order.shop_id,models.Accountinfo.nickname,models.Order.totalPrice,models.Order.num,func.date_format(models.Order.create_date,'%Y-%m-%d %H:%i:%s'),\
					       models.Order.arrival_day,models.Order.arrival_time,models.Order.pay_type,models.Order.today,models.Order.end_time).\
					       join(models.Accountinfo,models.Accountinfo.id == models.Order.customer_id).filter(models.Order.num.in_(insert_order_num)).all()
				
				for i in range(len(insert_list)):
					shop_follow = session.query(models.CustomerShopFollow).filter_by(customer_id = insert_list[i][0],shop_id = shop_id).with_lockmode("update").first()
					if not shop_follow:
						return self.send_fail('shop_follow not found')

					if shop_follow.shop_new == 0:
						shop_follow.shop_new = 1

					order_count = 0
					try:
						order_count = session.query(models.Order).filter_by(customer_id = insert_list[i][0],shop_id = shop_id).count()
					except:
						self.send_fail("[_AccountBaseHandler]order_done: find order by customer_id and shop_id error")
					#首单 积分 加5 
					if order_count==1:
						if shop_follow.shop_point == None:
							shop_follow.shop_point =0
						shop_follow.shop_point += 5
						try:
							point_history = models.PointHistory(customer_id = insert_list[i][0],shop_id = shop_id)
						except NoResultFound:
							self.send_fail("[_AccountBaseHandler]order_done: point_history error, First_order")
						if point_history:
							point_history.point_type = models.POINT_TYPE.FIRST_ORDER
							point_history.each_point = 5
							session.add(point_history)

					insert_list[i] = list(insert_list[i])
					if insert_list[i][8] == 2:
						if shop_follow.shop_point == None:
							shop_follow.shop_point =0
							shop_follow.shop_point += 2
						try:
							point_history = models.PointHistory(customer_id = insert_list[i][0],shop_id = shop_id)
						except:
							self.send_fail("[_AccountBaseHandler]order_done: point_history error, PREPARE_PAY")
						if point_history:
							point_history.point_type = models.POINT_TYPE.PREPARE_PAY
							point_history.each_point = 2
							session.add(point_history)

						# 订单完成后，将相应店铺可提现 余额相应增加
						cur_shop = session.query(models.Shop).filter_by(id = shop_id).with_lockmode("update").first()
						cur_shop.available_balance += insert_list[i][3]
						cur_shop.available_balance = round(cur_shop.available_balance,2)
						session.commit()
						
						if insert_list[i][6] == None or insert_list[i][7] == None:
							end_date = insert_list[i][5]
							end_date = datetime.datetime.strptime(end_date,'%Y-%m-%d %H:%M:%S')
							if insert_list[i][9] == 2:
								end_date = end_date + datetime.timedelta(days = 1)
							insert_list[i][10] = str(insert_list[i][10])
							hh = int(insert_list[i][10][0:2])
							mm = int(insert_list[i][10][3:5])
							ss = int(insert_list[i][10][6:8])
							create_time = datetime.datetime(end_date.year,end_date.month,end_date.day,hh,mm,ss)
						else:
							create_time = insert_list[i][6] + " " + insert_list[i][7] + ":00"
							create_time = datetime.datetime.strptime(create_time,'%Y-%m-%d %H:%M:%S')
						insert_list[i][4] = "可提现额度入账：订单" + insert_list[i][4] + "完成"

						balance_history = models.BalanceHistory(customer_id = insert_list[i][0],shop_id = insert_list[i][1] ,name = insert_list[i][2],balance_value = insert_list[i][3] ,\
											   balance_record = insert_list[i][4],create_time = create_time,balance_type = 6,is_cancel = 99999)
						session.add(balance_history)
						session.commit()
						change_shop_id.append(shop_id)

					if insert_list[i][8] == 3:
						# 订单完成后，将相应店铺可提现 余额相应增加
						cur_shop = session.query(models.Shop).filter_by(id = shop_id).with_lockmode("update").first()
						cur_shop.available_balance += insert_list[i][3]
						cur_shop.available_balance = round(cur_shop.available_balance,2)
						session.commit()

						if insert_list[i][6] == None or insert_list[i][7] == None:
							end_date = insert_list[i][5]
							end_date = datetime.datetime.strptime(end_date,'%Y-%m-%d %H:%M:%S')
							if insert_list[i][9] == 2:
								end_date = end_date + datetime.timedelta(days = 1)
							insert_list[i][10] = str(insert_list[i][10])
							hh = int(insert_list[i][10][0:2])
							mm = int(insert_list[i][10][3:5])
							ss = int(insert_list[i][10][6:8])
							create_time = datetime.datetime(end_date.year,end_date.month,end_date.day,hh,mm,ss)
						else:
							create_time = insert_list[i][6] + " " + insert_list[i][7] + ":00"
							create_time = datetime.datetime.strptime(create_time,'%Y-%m-%d %H:%M:%S')
						insert_list[i][4] = "可提现额度入账：订单" + insert_list[i][4] + "完成"

						balance_history = models.BalanceHistory(customer_id = insert_list[i][0],shop_id = insert_list[i][1] ,name = insert_list[i][2],balance_value = insert_list[i][3] ,\
											   balance_record = insert_list[i][4],create_time = create_time,balance_type = 7,is_cancel = 99999)
						session.add(balance_history)
						session.commit()
						change_shop_id.append(shop_id)
			elif len(pay_type_2_3_done)< len(balance_type_6_7):
				# print("@@@@@@@@4",len(pay_type_2_3_done),len(balance_type_6_7))
				pass
			else:
				pass

		print("##",shop_id,"---","1")

		balance_list = session.query(models.BalanceHistory.id,func.date_format(models.BalanceHistory.create_time,"%Y-%m-%d %H:%i:%S"),models.BalanceHistory.shop_id,models.BalanceHistory.balance_type,\
			       models.BalanceHistory.balance_record,models.BalanceHistory.balance_value,models.BalanceHistory.customer_id,models.BalanceHistory.customer_totalPrice,\
			       models.BalanceHistory.shop_totalPrice,models.BalanceHistory.available_balance,models.BalanceHistory.is_cancel).filter_by(shop_id = shop_id).order_by(models.BalanceHistory.create_time).all()
		
		cancel_list = []
		query_list = session.query(models.BalanceHistory.balance_record).filter(models.BalanceHistory.shop_id == shop_id,models.BalanceHistory.balance_type.in_([4,5])).all()
		for item in query_list:
			for i in range(len(item[0])):
				if item[0][i].isdigit():
					break
			cancel_list.append(item[0][i : len(item[0])-2])

		shop_follow = session.query(models.CustomerShopFollow).filter(models.CustomerShopFollow.shop_id == shop_id,models.CustomerShopFollow.shop_balance != 0).with_lockmode("update").all()
		if len(shop_follow) != 0:
			for item in shop_follow:
				item.shop_balance = 0
		session.commit()

		cur_shop = session.query(models.Shop).filter_by(id = shop_id).with_lockmode("update").first()
		cur_shop.shop_balance = 0
		cur_shop.available_balance = 0
		session.commit()

		for i in range(0,len(balance_list)):
			item = balance_list[i]

			id = item[0]
			create_time = item[1]
			shop_id = item[2]
			balance_type = item[3]
			balance_record =  item[4]
			balance_value =  item[5]
			customer_id =  item[6]
			customer_totalPrice =  item[7]
			shop_totalPrice =  item[8]
			available_balance =  item[9]
			is_cancel =  item[10]

			history_record = session.query(models.BalanceHistory).filter_by(id = id).with_lockmode("update").first()
			if history_record.is_cancel != 1:
				history_record.is_cancel = 0
			if balance_type == 1:
				for n in range(len(balance_record)):
					if balance_record[n].isdigit():
						break
				order_num = balance_record[n : len(balance_record)]
				if order_num in cancel_list:
					history_record.is_cancel = 1

			shop_follow = session.query(models.CustomerShopFollow).filter_by(customer_id = customer_id,shop_id = shop_id).with_lockmode("update").first()
			if not shop_follow:
				return self.send_fail('shop_follow not found')
			cur_shop = session.query(models.Shop).filter_by(id = shop_id).with_lockmode("update").first()

			if balance_type == 0:
				shop_follow.shop_balance += balance_value
				shop_follow.shop_balance = round(shop_follow.shop_balance,2)
				cur_shop.shop_balance += balance_value
				cur_shop.shop_balance = round(cur_shop.shop_balance,2)
				history_record.customer_totalPrice = shop_follow.shop_balance
				history_record.shop_totalPrice = cur_shop.shop_balance
				history_record.available_balance = cur_shop.available_balance
			elif balance_type == 1:
				shop_follow.shop_balance -= balance_value
				shop_follow.shop_balance = round(shop_follow.shop_balance,2)
				history_record.customer_totalPrice = shop_follow.shop_balance
				history_record.shop_totalPrice = cur_shop.shop_balance
				history_record.available_balance = cur_shop.available_balance
			elif balance_type == 2:
				cur_shop.shop_balance -= balance_value
				cur_shop.shop_balance = round(cur_shop.shop_balance,2)
				cur_shop.available_balance -= balance_value
				cur_shop.available_balance = round(cur_shop.available_balance,2)
				history_record.customer_totalPrice = shop_follow.shop_balance
				history_record.shop_totalPrice = cur_shop.shop_balance
				history_record.available_balance = cur_shop.available_balance
			elif balance_type == 3:
				cur_shop.shop_balance += balance_value
				cur_shop.shop_balance = round(cur_shop.shop_balance,2)
				history_record.customer_totalPrice = shop_follow.shop_balance
				history_record.shop_totalPrice = cur_shop.shop_balance
				history_record.available_balance = cur_shop.available_balance
			elif balance_type in [4,5]:
				shop_follow.shop_balance += balance_value
				shop_follow.shop_balance = round(shop_follow.shop_balance,2)
				history_record.customer_totalPrice = shop_follow.shop_balance
				history_record.shop_totalPrice = cur_shop.shop_balance
				history_record.available_balance = cur_shop.available_balance
			elif balance_type in [6,7]:
				cur_shop.available_balance += balance_value
				cur_shop.available_balance = round(cur_shop.available_balance,2)
				history_record.customer_totalPrice = shop_follow.shop_balance
				history_record.shop_totalPrice = cur_shop.shop_balance
				history_record.available_balance = cur_shop.available_balance
			else:
				return self.send_error(404)

			session.commit()
		print("##",shop_id,"---","2")

if __name__ == "__main__":
	Check()