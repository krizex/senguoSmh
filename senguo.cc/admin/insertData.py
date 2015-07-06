import dal.models as models
import requests
import json
import multiprocessing
from multiprocessing import Process
from dal.dis_dict import dis_dict
session = models.DBSession()

def code_to_text(column_name, code):
	text = ""
	#将城市编码转换为文字显示（可以由城市编码算出城市所在省份的编码）
	if column_name == "shop_city":
		text += dis_dict[int(code/10000)*10000]["name"]
		if "city" in dis_dict[int(code/10000)*10000].keys():
			text += " " + dis_dict[int(code/10000)*10000]["city"][code]["name"]
		return text

	elif column_name == "city":
		if "city" in dis_dict[int(code/10000)*10000].keys():
			text = dis_dict[int(code/10000)*10000]["city"][code]["name"]
		return text

	elif column_name == "province":
		text = dis_dict[int(code)]["name"]
		return text

def getLat():
	shops = session.query(models.Shop).all()
	i = 0
	for shop in shops:
		if shop.lat == None and shop.lon== None or shop.lat == 0 and shop.lon== 0:
			city = code_to_text("city",shop.shop_city)
			province = code_to_text("province",shop.shop_province)
			addres_detail = shop.shop_address_detail
			url = "http://api.map.baidu.com/geocoder/v2/?address="+province+city+addres_detail+"&output=json&ak=2595684c343d6499bf469da8a9c18231"
			r = requests.get(url)
			result = json.loads(r.text)
			if result["status"] == 0:
				shop.lat = result["result"]["location"]["lat"]
				shop.lon = result["result"]["location"]["lng"]
				session.commit()
			i = i+1
			print(i)

g = multiprocessing.Process(name='getLat',target=getLat)
g.start()
g.join()