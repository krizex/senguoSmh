#! /usr/bin/env python3
import sys, os
sys.path.append(os.path.abspath(os.path.join(
    os.path.dirname(__file__),"../..")))

import dal.models as models
import time

shop_admin_wxinfo = dict(
    unionid = "oxkR_jtCKSJLFO4dFYhhHXGNw4ns",
    openid = "o78-ms4b-xnS7mXqqBu5mWFXo_dU",
    country = "CN",
    province = "Hubei",
    city = "Wuhan",
    headimgurl="http://wx.qlogo.cn/mmopen/FMajU52WvbEafZYABcyncw2XmosqWdtGSaBVjrpMmopHHEtO4j6hPFLKYVntAbKd4r01X8Rshy59afLMqg2oicwpmVTfib3G3c/0",
    nickname="路飞",
    sex=1)


test_admin_shops = [
    dict(
        shop_name="草帽海贼团 娜米店", 
        shop_province=110000, shop_city=110000, 
        shop_address_detail="王府井",
        shop_service_area = models.SHOP_SERVICE_AREA.HIGH_SCHOOL | models.SHOP_SERVICE_AREA.TRADE_CIRCLE,
        shop_start_timestamp = int(time.time()) - 1*30*24*3600,
        shop_status = models.SHOP_STATUS.ACCEPTED),
    dict(
        shop_name="草帽海贼团 索隆店", 
        shop_province=420000, shop_city=420100, 
        shop_address_detail="华中科技大学",
        shop_service_area = models.SHOP_SERVICE_AREA.HIGH_SCHOOL,
        shop_start_timestamp = int(time.time()) - 5*30*24*3600,
        shop_status = models.SHOP_STATUS.ACCEPTED),
    dict(
        shop_name="草帽海贼团 路飞店", 
        shop_province=420000, shop_city=420100, 
        shop_address_detail="武汉大学",
        shop_service_area = models.SHOP_SERVICE_AREA.COMMUNITY,
        shop_start_timestamp = int(time.time()) - 15*30*24*3600,
    ),
    dict(
        shop_name="草帽海贼团 撒谎布店", 
        shop_province=430000, shop_city=430600, 
        shop_address_detail="岳阳楼区",
        shop_service_area = models.SHOP_SERVICE_AREA.COMMUNITY | models.SHOP_SERVICE_AREA.OTHERS,
        shop_start_timestamp = int(time.time()) - 7*30*24*3600,
        shop_status = models.SHOP_STATUS.ACCEPTED),
]

shops_onsalefruits = [
    ['橘子', '西瓜', '芒果', '荔枝', '火龙果', '青苹果', '苹果', '青梨'],
    ['橘子', '西瓜', '橘子', '香蕉', '柠檬'],
    ['橘子', '柠檬', '榴莲'],
    ['榴莲', '山竹', '菠萝']
]

shops_demandfruits = [
    ['橘子', '西瓜'],
    ['橘子', '西瓜'],
    ['橘子', '柠檬', '榴莲'],
    ['榴莲', '山竹', '菠萝']
]

def main():
    choice = input("""
这是一个初始化测试数据的程序，将会给你的数据库创建如下数据：
（1） 一个名为“路飞”的店铺管理员
（2） 和他拥有的“草帽海贼团”的店铺
yes继续:""")
    if choice == "yes":
        session = models.DBSession()
        print("正在创建路飞...")
        u = models.ShopAdmin.register_with_wx(session,shop_admin_wxinfo)
        session.add(u)
        session.commit()
        print("“正在舰船...")

        for index, shop_paras in enumerate(test_admin_shops):
            shop = models.Shop(**shop_paras)
            # onsale
            for f_index, f_name in enumerate(shops_onsalefruits[index]):
                fruit_type = session.query(models.FruitType).\
                             filter_by(name=f_name).one()
                shop.onsale_fruits.append(fruit_type)
            # demand
            
            for f_index, f_name in enumerate(shops_demandfruits[index]):
                fruit_type = session.query(models.FruitType).\
                             filter_by(name=f_name).one()
                shop.demand_fruits.append(fruit_type)

            u.shops.append(shop)
        session.commit()
        session.close()
        print("done.")

if __name__ == "__main__":
    main()
