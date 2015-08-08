import dal.models as models
import requests
import json
import multiprocessing
from multiprocessing import Process
from dal.dis_dict import dis_dict
session = models.DBSession()

# def code_to_text(column_name, code):
#   text = ""
#   #将城市编码转换为文字显示（可以由城市编码算出城市所在省份的编码）
#   if column_name == "shop_city":
#       text += dis_dict[int(code/10000)*10000]["name"]
#       if "city" in dis_dict[int(code/10000)*10000].keys():
#           text += " " + dis_dict[int(code/10000)*10000]["city"][code]["name"]
#       return text

#   elif column_name == "city":
#       if "city" in dis_dict[int(code/10000)*10000].keys():
#           text = dis_dict[int(code/10000)*10000]["city"][code]["name"]
#       return text

#   elif column_name == "province":
#       text = dis_dict[int(code)]["name"]
#       return text

# # 插入店铺经纬度
# def getLat():
#   print("Start Inserting Shop Position to Database...")
#   shops = session.query(models.Shop).all()
#   total = len(shops)
#   i = 0
#   for shop in shops:
#       if shop.lat == None and shop.lon == None or shop.lat == 0 and shop.lon == 0:
#           city = code_to_text("city",shop.shop_city)
#           province = code_to_text("province",shop.shop_province)
#           addres_detail = shop.shop_address_detail
#           url = "http://api.map.baidu.com/geocoder/v2/?address="+province+city+addres_detail+"&output=json&ak=2595684c343d6499bf469da8a9c18231"
#           r = requests.get(url)
#           result = json.loads(r.text)
#           if result["status"] == 0:
#               shop.lat = result["result"]["location"]["lat"]
#               shop.lon = result["result"]["location"]["lng"]
#               session.commit()
#           i = i+1
#           print("Processing [",i,"/",total,"] => Insert Shop Position Success, shop_id:",shop.id)

# def spiderShops():
#   shops = session.query(models.Spider_Shop).all()
#   for shop in shops:
#       address = shop.shop_address
#       if address.startswith("武汉市"):
#           shop.shop_address="湖北省"+address
#       elif address.startswith("湖北省武汉市"):
#           shop.shop_address=address
#       else:
#           shop.shop_address="湖北省武汉市"+address
#       session.commit()

# # 插入店铺自提时间段和地址
# def addSome():
#     print("Start Inserting Self Period to Database...")
#     shops = session.query(models.Shop).all()
#     total = len(shops)
#     i = 0
#     for shop in shops:
#         session.add(models.SelfAddress(config_id=shop.config.id, if_default=1,address=shop.shop_address_detail,lat=shop.lat,lon=shop.lon))
#         session.add(models.Period(config_id=shop.config.id, name="中午", start_time="12:00", end_time="13:00", config_type=1))
#         session.add(models.Period(config_id=shop.config.id, name="下午", start_time="17:00", end_time="18:00", config_type=1))
#         session.add(models.Period(config_id=shop.config.id, name="晚上", start_time="21:00", end_time="22:00", config_type=1))
#         session.commit()
#         i = i+1
#         print("Processing [",i,"/",total,"] => Insert Self Period Success, shop_id:",shop.id)

# 插入余额记录店铺省份
def balancehistory_province():
	print("Start Inserting Province into Database balancehistory...")
	balance_history = session.query(models.BalanceHistory).all()
	total = len(balance_history)
	i = 0
	for item in balance_history:
		shop_id = item.shop_id
		shop = session.query(models.Shop).filter_by(id=shop_id).first()
		if shop:
			item.shop_province = shop.shop_province
			item.shop_name     = shop.shop_name
		i = i+1
		print("Processing [",i,"/",total,"] => Insert Province Success, shop_province:",item.shop_province)
	session.commit()

# 插入提现申请店铺省份
def applycash_province():
	print("Start Inserting Province into Database applycash...")
	apply_history = session.query(models.ApplyCashHistory).all()
	total = len(apply_history)
	i = 0
	for item in apply_history:
		shop_id = item.shop_id
		shop = session.query(models.Shop).filter_by(id=shop_id).first()
		if shop:
			item.shop_province = shop.shop_province
		i = i+1
		print("Processing [",i,"/",total,"] => Insert Province Success, shop_province:",item.shop_province)
	session.commit()

# 添加店铺默认自提地址
def setShopSelfAddress():
	print("Start Inserting Self Address to Database...")
	shops = session.query(models.Shop).all()
	total = len(shops)
	i = 0
	for shop in shops:
		try:
			self_shop_address = session.query(models.SelfAddress).filter_by(config_id=shop.config.id,lat=shop.lat,lon=shop.lon).first()
		except:
			self_shop_address = None
		if self_shop_address:
			if self_shop_address.active == 0:
				self_shop_address.active = 1
			self_shop_address.if_default=2
		else:
			session.add(models.SelfAddress(config_id=shop.config.id, if_default=2,address=shop.shop_address_detail,lat=shop.lat,lon=shop.lon))
		session.commit()
		i = i+1
		print("Processing [",i,"/",total,"] => Insert Self Address Success, shop_id:",shop.id)

g = multiprocessing.Process(name='setShopSelfAddress',target=balancehistory_province)
g.start()
g.join()
