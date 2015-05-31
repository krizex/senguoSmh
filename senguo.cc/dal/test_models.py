import sys
sys.path.append("/home/monk/www/senguo.cc/senguo.cc/admin/")
import models

test_shops = [
    dict(
        shop_name="小廖的shop 第一家", 
        shop_province=110000, shop_city=110000, 
        shop_address_detail="王府井",

    shop_service_area = models.SHOP_SERVICE_AREA.HIGH_SCHOOL | models.SHOP_SERVICE_AREA.TRADE_CIRCLE,
        live_month = 1),
    dict(
        shop_name="小廖的shop 第二家", 
        shop_province=420000, shop_city=420100, 
        shop_address_detail="华中科技大学",
        shop_service_area = models.SHOP_SERVICE_AREA.HIGH_SCHOOL,
        live_month = 4),
    dict(
        shop_name="小廖的shop 第三家", 
        shop_province=420000, shop_city=420100, 
        shop_address_detail="武汉大学",
        shop_service_area = models.SHOP_SERVICE_AREA.COMMUNITY,
        live_month = 7),
    dict(
        shop_name="小廖的shop 第四家", 
        shop_province=430000, shop_city=430600, 
        shop_address_detail="岳阳楼区",
        shop_service_area = models.SHOP_SERVICE_AREA.COMMUNITY | models.SHOP_SERVICE_AREA.OTHERS,
        live_month = 15),
]

u = models.ShopAdmin.get_by_id(1)

def main():
    for s in test_shops:
        u.add_shop(**s)

if __name__ == "__main__":
    main()
