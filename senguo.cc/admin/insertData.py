import dal.models as models
import requests
import json
import multiprocessing
from multiprocessing import Process
from dal.dis_dict import dis_dict
session = models.DBSession()

# def code_to_text(column_name, code):
# 	text = ""
# 	#将城市编码转换为文字显示（可以由城市编码算出城市所在省份的编码）
# 	if column_name == "shop_city":
# 		text += dis_dict[int(code/10000)*10000]["name"]
# 		if "city" in dis_dict[int(code/10000)*10000].keys():
# 			text += " " + dis_dict[int(code/10000)*10000]["city"][code]["name"]
# 		return text

# 	elif column_name == "city":
# 		if "city" in dis_dict[int(code/10000)*10000].keys():
# 			text = dis_dict[int(code/10000)*10000]["city"][code]["name"]
# 		return text

# 	elif column_name == "province":
# 		text = dis_dict[int(code)]["name"]
# 		return text

# def getLat():
# 	shops = session.query(models.Shop).all()
# 	i = 0
# 	for shop in shops:
# 		if shop.lat == None and shop.lon== None or shop.lat == 0 and shop.lon== 0:
# 			city = code_to_text("city",shop.shop_city)
# 			province = code_to_text("province",shop.shop_province)
# 			addres_detail = shop.shop_address_detail
# 			url = "http://api.map.baidu.com/geocoder/v2/?address="+province+city+addres_detail+"&output=json&ak=2595684c343d6499bf469da8a9c18231"
# 			r = requests.get(url)
# 			result = json.loads(r.text)
# 			if result["status"] == 0:
# 				shop.lat = result["result"]["location"]["lat"]
# 				shop.lon = result["result"]["location"]["lng"]
# 				session.commit()
# 			i = i+1
# 			print(i)

# def spiderShops():
# 	shops = session.query(models.Spider_Shop).all()
# 	for shop in shops:
# 		address = shop.shop_address
# 		if address.startswith("武汉市"):
# 			shop.shop_address="湖北省"+address
# 		elif address.startswith("湖北省武汉市"):
# 			shop.shop_address=address
# 		else:
# 			shop.shop_address="湖北省武汉市"+address
# 		session.commit()

def addSome():
	shops = session.query(models.Shop).all()
	for shop in shops:
		session.add(models.SelfAddress(config_id=shop.config.id, if_default=1,address=shop.shop_address_detail,lat=shop.lat,lon=shop.lon))
		session.add(models.Period(config_id=shop.config.id, name="白天", start_time="09:00", end_time="21:00",config_type=1))
		session.commit()

g = multiprocessing.Process(name='addSome',target=addSome)
g.start()
g.join()