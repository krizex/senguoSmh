import sys, os
sys.path.append(os.path.abspath(os.path.join(
    os.path.dirname(__file__),"../..")))

import dal.models as models
import time

test_shop_admin = dict(
    email="liaosimin2012@gmail.com",
    realname="小廖可以找到女朋友的",
    headimgurl="http://wx.qlogo.cn/mmopen/FMajU52WvbEafZYABcyncw2XmosqWdtGSaBVjrpMmopHHEtO4j6hPFLKYVntAbKd4r01X8Rshy59afLMqg2oicwpmVTfib3G3c/0",
    nickname="昵称？",
    phone="180000000000",
    sex=1,
    birthday = int(time.time())
)


test_admin_shops = [
    dict(
        shop_name="小廖的shop 第一家", 
        shop_province=110000, shop_city=110000, 
        shop_address_detail="王府井",

    shop_service_area = models.SHOP_SERVICE_AREA.HIGH_SCHOOL | models.SHOP_SERVICE_AREA.TRADE_CIRCLE,
        live_month = 1,
        shop_status = models.SHOP_STATUS.ACCEPTED),
    dict(
        shop_name="小廖的shop 第二家", 
        shop_province=420000, shop_city=420100, 
        shop_address_detail="华中科技大学",
        shop_service_area = models.SHOP_SERVICE_AREA.HIGH_SCHOOL,
        live_month = 4,
        shop_status = models.SHOP_STATUS.ACCEPTED),
    dict(
        shop_name="小廖的shop 第三家", 
        shop_province=420000, shop_city=420100, 
        shop_address_detail="武汉大学",
        shop_service_area = models.SHOP_SERVICE_AREA.COMMUNITY,
        live_month = 7,
    ),
    dict(
        shop_name="小廖的shop 第四家", 
        shop_province=430000, shop_city=430600, 
        shop_address_detail="岳阳楼区",
        shop_service_area = models.SHOP_SERVICE_AREA.COMMUNITY | models.SHOP_SERVICE_AREA.OTHERS,
        live_month = 15,
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
    （1） 一个名为“小廖可以找到女朋友的”的店铺管理员
    （2） 和他拥有的“小廖的shop 第n家”的店铺

** 另外，请确保你已经初始化水果种类信息，否则请先使用install_db_fruits.py将水果种类信息传进去.

“lc==sb?”输入'yes'确定进行数据初始化，其他输入退出 :)
    """)
    if choice == "yes":
        session = models.DBSession()
        print("正在创建用户“小廖可以找到女朋友的”...")
        u = models.ShopAdmin(**test_shop_admin)
        session.add(u)
        session.commit()
        print("“小廖可以找到女朋友的”正在建立他的店铺...")

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
        print("小廖已经建立起了他的后宫院...")
        

if __name__ == "__main__":
    main()
