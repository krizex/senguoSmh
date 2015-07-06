# __author__ = 'liaosimin'
# #之前fruitzone的shop没有config，所以程序运行会出错，这段脚本就是为每一个shop增加一个config
# import dal.models as models
# s = models.DBSession()
# shops = s.query(models.Shop).all()
# for shop in shops:
#     shop.config = models.Config()
# s.commit()

import requests
session = requests.session()
login_data = {""}