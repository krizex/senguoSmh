import sys
sys.path.append("/home/monk/www/senguo.cc/senguo.cc/admin/")

import models


s = models.DBSession()

u = models.ShopAdmin.get_by_id(3)
u.add_a_shop(shop_name="小廖的shop", shop_province="abc", shop_city="efg", shop_address_detail="sjdlfjl")

s.add(u)
s.commit()
s.close()
