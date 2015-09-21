import dal.models as models
import requests
import json
import multiprocessing
from multiprocessing import Process
from dal.dis_dict import dis_dict
# from bs4 import BeautifulSoup
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
#         session.add(models.SelfAddress(config_id=shop.config.id, if_default=2,address=shop.shop_address_detail,lat=shop.lat,lon=shop.lon))
#         session.add(models.Period(config_id=shop.config.id, name="中午", start_time="12:00", end_time="13:00", config_type=1))
#         session.add(models.Period(config_id=shop.config.id, name="下午", start_time="17:00", end_time="18:00", config_type=1))
#         session.add(models.Period(config_id=shop.config.id, name="晚上", start_time="21:00", end_time="22:00", config_type=1))
#         session.commit()
#         i = i+1
#         print("Processing [",i,"/",total,"] => Insert Self Period Success, shop_id:",shop.id)

# # 插入余额记录店铺省份
# def balancehistory_province():
# 	print("Start Inserting Province into Database balancehistory...")
# 	balance_history = session.query(models.BalanceHistory).filter(models.BalanceHistory != None).all()
# 	total = len(balance_history)
# 	i = 0
# 	for item in balance_history:
# 		if not item.shop_name:
# 			shop_id = item.shop_id
# 			shop = session.query(models.Shop).filter_by(id=shop_id).first()
# 			if shop:
# #				item.shop_province = shop.shop_province
# 				item.shop_name     = shop.shop_name
# 		session.commit()
# 		i = i+1
# 		print("Processing [",i,"/",total,"] => Insert Province Success, shop_province:",item.shop_province)

# # 插入提现申请店铺省份
# def applycash_province():
# 	print("Start Inserting Province into Database applycash...")
# 	apply_history = session.query(models.ApplyCashHistory).all()
# 	total = len(apply_history)
# 	i = 0
# 	for item in apply_history:
# 		shop_id = item.shop_id
# 		shop = session.query(models.Shop).filter_by(id=shop_id).first()
# 		if shop:
# 			item.shop_province = shop.shop_province
#	 	session.commit()
# 		i = i+1
# 		print("Processing [",i,"/",total,"] => Insert Province Success, shop_province:",item.shop_province)

# # 添加店铺默认自提地址
# def setShopSelfAddress():
# 	print("Start Inserting Self Address to Database...")
# 	shops = session.query(models.Shop).all()
# 	total = len(shops)
# 	i = 0
# 	for shop in shops:
# 		try:
# 			self_shop_address = session.query(models.SelfAddress).filter_by(config_id=shop.config.id,lat=shop.lat,lon=shop.lon).first()
# 		except:
# 			self_shop_address = None
# 		if self_shop_address:
# 			if self_shop_address.active == 0:
# 				self_shop_address.active = 1
# 			self_shop_address.if_default=2
# 		else:
# 			session.add(models.SelfAddress(config_id=shop.config.id, if_default=2,address=shop.shop_address_detail,lat=shop.lat,lon=shop.lon))
# 		session.commit()
# 		i = i+1
# 		print("Processing [",i,"/",total,"] => Insert Self Address Success, shop_id:",shop.id)

# # 插入店铺数据
# def getsomeshop():
# 	f=open("goods_info_yy.txt","r")
# 	datalist = json.loads(f.read())
# 	for key in datalist:
# 		data=datalist[key]
# 		name =data.get("name","").split(" ")[0][:10]
# 		#1872 1874
# 		new_good = models.Fruit(shop_id = 1872 , fruit_type_id = 999,name = name,
# 		storage = 100,unit = 3,img_url = data.get("imgs",""),detail_describe=data.get("detail",""),intro=data.get("name",""))
# 		new_good.charge_types.append(models.ChargeType(price = 0,unit = 3,num = 1,market_price = None))
# 		new_good2 = models.Fruit(shop_id = 1874 , fruit_type_id = 999,name = name,
# 		storage = 100,unit = 3,img_url = data.get("imgs",""),detail_describe=data.get("detail",""),intro=data.get("name",""))
# 		new_good2.charge_types.append(models.ChargeType(price = 0,unit = 3,num = 1,market_price = None))
# 		session.add(new_good)
# 		session.add(new_good2)
# 	session.commit()
# 	return self.send_success()

# # 新版森果社区初始化
# def getArticle():
#   print("Start Initializing Article Table for New Senguo BBS...")
# 	artilces = session.query(models.Article).all()
# 	total = len(artilces)
# 	i = 0
# 	for article in artilces:
# 		article.public_time=article.create_time
# 		record = session.query(models.ArticleGreat).filter_by(article_id=article.id,collect=1).distinct(models.Article.id).count()
# 		article.collect_num  = record
# 		session.commit()
# 		i = i+1
# 		print("Processing [",i,"/",total,"] => Initializing Article, article_id:",article.id)

# # 图片库初始化
# def getPicture():
# 	print("Start Initializing PictureLibrary Table...")
# 	shops = session.query(models.Shop).all()
# 	total = len(artilces)
# 	i = 0
# 	for shop in shops:
# 		goods = session.query(models.Fruit).filter_by(shop_id=shop.id).all()
# 		if len(goods) >0 :
# 			for good in goods:
# 				try:
# 					code = good.fruit_type.code
# 				except:
# 					code = "TDSG"
# 				imgs = []
# 				if good.img_url:
# 					imgs = good.img_url.split(";")
# 				if len(imgs)>0:
# 					for img in imgs:
# 						session.add(models.PictureLibrary(_type="goods",shop_id=shop.id,img_url=img,code=code))
# 						session.flush()
# 				# if good.detail_describe:
# 				# 	res_detail = BeautifulSoup(good.detail_describe,"lxml")
# 				# 	res_img = res_detail.findAll("img")
# 				# 	for img in res_img:
# 				# 		session.add(models.PictureLibrary(_type="detail",shop_id=shop.id,img_url=img["src"]))
# 				# 		session.flush()

# 		notices = session.query(models.Notice).filter_by(config_id=shop.id).all()
# 		if len(notices) >0:
# 			for notice in notices:
# 				if notice.img_url:
# 					session.add(models.PictureLibrary(_type="notice",shop_id=shop.id,img_url=notice.img_url))
# 					session.flush()

# 		if shop.shop_trademark_url:
# 			session.add(models.PictureLibrary(_type="logo",shop_id=shop.id,img_url=shop.shop_trademark_url))
# 			session.flush()
# 		i = i+1
# 		print("Processing [",i,"/",total,"] => Initializing PictureLibrary, shop_id:",shop.id)
# 	session.commit()

# 将管理员添加为店铺默认员工
# def add_staff():
# 	shop_list = session.query(models.Shop).all()
# 	for shop in shop_list:
# 		temp_staff = session.query(models.ShopStaff).get(shop.admin_id)
# 		if temp_staff is None:
# 			print(shop.id,'this is empty')
# 			session.add(models.ShopStaff(id=shop.admin_id,shop_id=shop.id))
# 			session.flush()
# 			if not session.query(models.HireLink).filter_by(staff_id=shop.admin_id,shop_id=shop.id):
# 				session.add(models.HireLink(staff_id=shop.admin_id,shop_id=shop.id,default_staff=1))
# 				session.flush()
# 	session.commit()

def address_add_location():
	customer = session.query(models.Customer.id).all()
	for item in customer:
		_id=item[0]
		print(_id)
		address = session.query(models.Address).filter_by(customer_id =_id,if_default=1).first()
		if not address:
			addr = session.query(models.Address).filter_by(customer_id =_id).first()
			if addr:
				addr.if_default = 1
				session.flush()

	# addrss_list = session.query(models.Address).all()
	# for _address in addrss_list:
	# 	address = _address.address_text
	# 	lat = 0
	# 	lon = 0
	# 	url = "http://api.map.baidu.com/geocoder/v2/?address="+address+"&output=json&ak=2595684c343d6499bf469da8a9c18231"
	# 	r = requests.get(url)
	# 	result = json.loads(r.text)
	# 	print(url)
	# 	print(result)
	# 	if result["status"] == 0:
	# 		lat = result["result"]["location"]["lat"]
	# 		lon = result["result"]["location"]["lng"]
	# 	else:
	# 		lat = 0
	# 		lon = 0
	# 	_address.lat = lat
	# 	_address.lon = lon
	# 	print(_address.lat)
	# 	print(_address.lon)
	session.commit()

g = multiprocessing.Process(name='address_add_location',target=address_add_location)

g.start()
g.join()
