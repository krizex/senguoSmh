#!/usr/bin/env python3
import os ,sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__),"../..")))

import dal.models as models
import datetime,time
from handlers.base import Pysettimer,SuperBaseHandler

# 订单自动好评
def order_comment(args):
    session = models.DBSession()
    today  = datetime.datetime.today()
    last_day = today - datetime.timedelta(days = 7)
    print("[Timer]Auto Comment")
    try:
        orders = session.query(models.Order).filter_by(status=5).all()
    except:
        orders = None
        print("[Timer]Auto Comment Error")
    if orders:
        for order in orders:
            if order.arrival_day:
                arrival_date = datetime.datetime.strptime(order.arrival_day, '%Y-%m-%d')
                if arrival_date < last_day:
                    order.status = 7
                    order.commodity_quality = 100
                    order.send_speed = 100
                    order.shop_service = 100
                    print("[Timer]Auto Comment Success, order_id:",order.id)
        session.commit()
        print("[Timer]Auto Comment Done")

# 在线支付订单自动取消
def order_cancel():
    import time
    from threading import Timer
    from handlers import customer
    session = models.DBSession()
    print("[Timer]Auto Cancel add timer")
    try:
        orders = session.query(models.Order).filter_by(status=-1).all()
    except:
        orders = None
        print("[Timer]Auto Cancel Error")
    if orders:
        for order in orders:
            Timer(60*15,customer.Cart.order_cancel_auto,(session,order.id,)).start()
            print("[Timer]Auto Cancel add timer Success, order_id:",order.id)
            time.sleep(0.5)
        session.commit()
    print("[Timer]Auto Cancel add timer Done")

# Access Token 更新
def delete(args):
    session = models.DBSession()
    session.query(models.AccessToken).delete()
    print("[Timer]AccessToken Updated:",session.query(models.AccessToken).count())
    session.commit()

global count
count = 1

def print_time(args):
    global count
    print(count,'-',time.strftime('%H:%M'))
    count += 1

def main():

    # 在线支付订单自动取消任务开始
    order_cancel()

    countTime = Pysettimer(print_time,(),60,True)
    countTime.start()

    # 已完成订单自动评价任务定时，频率1小时
    mytime = Pysettimer(order_comment,(),60*60,True)
    mytime.start()

    # 店铺自动关闭任务定时，频率1小时
    shopTime = Pysettimer(SuperBaseHandler.shop_close,(),60*60,True)
    shopTime.start()

    # Access Token 自动更新任务定时，频率10分钟
    deleteToken = Pysettimer(delete,(),60*10,True)
    deleteToken.start()

if __name__ == '__main__':
    main()
