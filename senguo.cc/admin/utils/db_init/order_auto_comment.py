#!/usr/bin/env python3
import os ,sys
sys.path.append(os.path.abspath(os.path.join(
	os.path.dirname(__file__),"../..")))

import dal.models as models
import datetime,time
from handlers.base import Pysettimer,SuperBaseHandler

def order_comment(args):
	session = models.DBSession()
	today  = datetime.datetime.today()
	last_day = today - datetime.timedelta(days = 7)
	print("[定时任务]自动好评")
	try:
		orders = session.query(models.Order).all()
		print("orders??????????????????????")
	except:
		print("orders = None!!!!!!!!!!!!!!!!!!!")
		orders = None
	if orders is None:
		print("[定时任务]自动好评：没有需要处理的订单")
	else:
		print("else???????????????????????")
		for order in orders:
			arrival_date = datetime.datetime.strptime(order.arrival_day, '%Y-%m-%d')
			if  order.status == 5 and arrival_date < last_day:
				order.status = 7
				order.commodity_quality = 100
				order.send_speed = 100
				order.shop_service = 100
				print("[定时任务]自动好评成功：",order.id)
			#else:
			#	print("无需处理")
		# print(time.time())
		session.commit()

def delete(args):
	session = models.DBSession()
	session.query(models.AccessToken).delete()
	print("[定时任务]AccessToken更新：",session.query(models.AccessToken).count())
	session.commit()


def main():
	mytime = Pysettimer(order_comment,(),60,True)
	mytime.start()

	#shopTime = Pysettimer(SuperBaseHandler.shop_close,(),60,True)
	#shopTime.start()

	#deletToken = Pysettimer(delete,(),60,True)
	#deletToken.start()


if __name__ == '__main__':
	main()
	

