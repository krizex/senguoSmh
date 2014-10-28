import handlers.front
import handlers.admin
import handlers.superadmin
import handlers.fruitzone

handlers = [
    (r"/", handlers.front.Home,{}, "frontHome"),
    (r"/super/login", handlers.superadmin.Access,{
        "action":"login"}, "superLogin"),
    (r"/super/logout", handlers.superadmin.Access,{
        "action":"logout"}, "superLogout" ),
    (r"/super/", handlers.superadmin.Home, {
        "action":"applying"},"superHome"),
    (r"/super/applying",handlers.superadmin.Home, {
        "action":"applying"},"superHomeApplying"),
    (r"/super/active", handlers.superadmin.Home, {
        "action":"active"},"superHomeActive"),
    (r"/super/frozen", handlers.superadmin.Home, {
        "action":"frozen"},"superHomeFrozen"),
    
    # (r"/super/notice/", handlers.superadmin.Notice),
    
    (r"/admin/login", handlers.admin.Access,{
        "action":"login"}, "adminLogin"),
    (r"/admin/oauth", handlers.admin.Access, {
        "action":"oauth"}, "adminOauth"),
    (r"/admin/logout", handlers.admin.Access, {
        "action":"logout"}, "adminLogout"),
    (r"/admin/register", handlers.admin.Access, {
        "action":"register"}, "adminRegister"),
    (r"/admin/", handlers.admin.Home, {},  "adminHome"),# 匹配参数为admin_id
    (r"/admin/shelf", handlers.admin.Shelf, {}, "adminShelf"),# 货架管理/商品管理
    # (r"/admin/order", handlers.admin.Order, {}, "adminOrder"), 
    # (r"/admin/customer", handlers.admin.Customer, {}, "adminCustomer"),
    # (r"/admin/staff", handlers.admin.Staff, {}, "adminStaff"),
    # (r"/admin/finance", handlers.admin.Finance, {}, "adminFinance"),
    # (r"/admin/settings/profile", handlers.admin.Settings, 
    #  {"action":"profile"}, "adminSettingsProfile")
    # (r"/staff/", handlers.staff.Home, {}, "staffHome"),
    # (r"/staff/...")

    (r"/fruitzone/shops/", handlers.fruitzone.ShopList, {}, "fruitzoneShops"),
    (r"/fruitzone/shop/(\d+)", handlers.fruitzone.Shop, {}, "fruitzoneShop"),
    (r"/fruitzone/apply", handlers.fruitzone.Apply, {}, "fruitzoneApply"),
    (r"/fruitzone/phoneVerify/gencode", handlers.fruitzone.PhoneVerify, {
        "action":"gencode"}, "fruitzoneVerifyGencode"),
    (r"/fruitzone/phoneVerify/checkcode", handlers.fruitzone.PhoneVerify,{
        "action":"checkcode"}, "fruitzoneCheckcode")
    
]

