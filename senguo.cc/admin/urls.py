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

    ################ 超级管理员后台
    (r"/super/", handlers.superadmin.ShopAdminManage, {
        "action":"all"},"superHome"),

    ## 水果商家信息展示
    # 所有商家
    (r"/super/shopAdminManage/", handlers.superadmin.ShopAdminManage, {
        "action":"all"}, "superShopAdminManage"),

    (r"/super/shopAdminManage/all", handlers.superadmin.ShopAdminManage, {
        "action":"all"}, "superShopAdminManageAll"),
    # 正在使用商家
    (r"/super/shopAdminManage/using", handlers.superadmin.ShopAdminManage, {
        "action":"using"}, "superShopAdminManageUsing"),
    # 到期未续商家
    (r"/super/shopAdminManage/expire", handlers.superadmin.ShopAdminManage, {
        "action":"expire"}, "superShopAdminManageExpire"),
    # 未付费商家/普通商家
    (r"/super/shopAdminManage/common", handlers.superadmin.ShopAdminManage, {
        "action":"common"}, "superShopAdminManageCommon"),

    ## 店铺申请接入管理
    # 所有店铺
    (r"/super/shopManage/", handlers.superadmin.ShopManage, {
        "action":"all"}, "superShopManage"),
    (r"/super/shopManage/all", handlers.superadmin.ShopManage, {
        "action":"all"}, "superShopManageAll"),

    # 正在申请接入店铺
    (r"/super/shopManage/applying", handlers.superadmin.ShopManage, {
        "action":"applying"}, "superShopManageApplying"),
    # 已经通过申请店铺
    (r"/super/shopManage/accepted", handlers.superadmin.ShopManage, {
        "action":"accepted"}, "superShopManageAccepted"),
    # 已被拒绝店铺
    (r"/super/shopManage/declined", handlers.superadmin.ShopManage, {
        "action":"declined"}, "superShopManageDeclined"),

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

    # 水果圈子

    # 主页
    (r"/fruitzone/", handlers.fruitzone.Home, {}, "fruitzoneHome"),
    (r"/fruitzone/admin/home", handlers.fruitzone.AdminHome, {}, "fruitzoneAdminHome"),
    (r"/fruitzone/admin/profile", handlers.fruitzone.AdminProfile, {}, "fruitzoneAdminProfile"),
    (r"/fruitzone/shop/apply", handlers.fruitzone.ShopApply, {}, "fruitzoneShopApply"),
    (r"/fruitzone/shop/applySuccess", handlers.fruitzone.ApplySuccess, {}, "fruitzoneShopApplySuccess"),

    (r"/fruitzone/shop/(\d+)", handlers.fruitzone.Shop, {}, "fruitzoneShop"),

    (r"/fruitzone/admin/shops", handlers.fruitzone.AdminShops, {}, "fuirzoneAdminShops"),
    (r"/fruitzone/admin/shop/(\d+)", handlers.fruitzone.AdminShop, {}, "fruitzoneAdminShop"),

    (r"/fruitzone/phoneVerify/gencode", handlers.fruitzone.PhoneVerify, {
        "action":"gencode"}, "fruitzoneVerifyGencode"),
    (r"/fruitzone/phoneVerify/checkcode", handlers.fruitzone.PhoneVerify,{
        "action":"checkcode"}, "fruitzoneCheckcode")
    
]

