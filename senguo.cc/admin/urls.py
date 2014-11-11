import handlers.front
import handlers.admin
import handlers.superadmin
import handlers.fruitzone

handlers = [
    (r"/", handlers.front.Home,{}, "frontHome"),
    (r"/super/oauth", handlers.superadmin.Access,{
        "action":"oauth"}, "superOauth"),
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
        "action": "common"}, "superShopAdminManageCommon"),
    # 商家个人信息详情
    (r"/super/shopAdminProfile/(\d+)", handlers.superadmin.ShopAdminProfile, {}, "superShopAdminProfile"),
    # 店铺信息详情
    (r"/super/shopProfile/(\d+)", handlers.superadmin.ShopProfile, {}, "superShopProfile"),

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
    
    ## 商城购买订单
    (r"/super/orderManage/", handlers.superadmin.OrderManage, {
        "action":"all"}, "superOrderManage"),
    (r"/super/orderManage/all", handlers.superadmin.OrderManage, {
        "action":"all"}, "superOrderManageAll"),
    (r"/super/orderManage/processed", handlers.superadmin.OrderManage, {
        "action":"processed"}, "superOrderManageProcessed"),
    (r"/super/orderManage/new", handlers.superadmin.OrderManage, {
        "action":"new"}, "superOrderManageNew"),
    (r"/super/orderManage/aborted", handlers.superadmin.OrderManage, {
        "action":"aborted"}, "superOrderManageAborted"),
    
    ## 用户反馈
    (r"/super/feedback/", handlers.superadmin.Feedback, {"action":"all"}, "superFeedback"),
    (r"/super/feedback/unprocessed", handlers.superadmin.Feedback, {"action":"unprocessed"}, "superFeedbackUnprocessed"),
    (r"/super/feedback/processed", handlers.superadmin.Feedback, {"action":"processed"}, "superFeedbackProcessed"),

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
    (r"/fruitzone/shop/apply", handlers.fruitzone.ShopApply, {"action": "apply"}, "fruitzoneShopApply"),
    (r"/fruitzone/shop/reApply", handlers.fruitzone.ShopApply, {"action": "reApply"}, "fruitzoneShopReApply"),
    (r"/fruitzone/shop/applySuccess", handlers.fruitzone.ApplySuccess, {}, "fruitzoneShopApplySuccess"),

    (r"/fruitzone/shop/(\d+)", handlers.fruitzone.Shop, {}, "fruitzoneShop"),

    (r"/fruitzone/admin/shops", handlers.fruitzone.AdminShops, {}, "fuirzoneAdminShops"),
    (r"/fruitzone/admin/shopsCollect", handlers.fruitzone.AdminShopsCollect, {}, "fuirzoneAdminShopsCollect"),
    (r"/fruitzone/admin/shop/(\d+)", handlers.fruitzone.AdminShop, {}, "fruitzoneAdminShop"),

    (r"/fruitzone/phoneVerify/gencode", handlers.fruitzone.PhoneVerify, {
        "action":"gencode"}, "fruitzoneVerifyGencode"),
    (r"/fruitzone/phoneVerify/checkcode", handlers.fruitzone.PhoneVerify,{
        "action":"checkcode"}, "fruitzoneCheckcode"),
    

    (r"/fruitzone/systemPurchase/", handlers.fruitzone.SystemPurchase, {
        "action":"home"}, "fruitzoneSystemPurchase"),
    (r"/fruitzone/systemPurchase/systemAccount", handlers.fruitzone.SystemPurchase, {
        "action":"systemAccount"}, "fruitzoneSystemPurchaseSystemAccount"),
    (r"/fruitzone/systemPurchase/history", handlers.fruitzone.SystemPurchase, {
        "action":"history"}, "fruitzoneSystemPurchaseHistory"),

    (r"/fruitzone/systemPurchase/chargeTypes", handlers.fruitzone.SystemPurchase, {
        "action":"chargeTypes"}, "fruitzoneSystemPurchaseChargeTypes"),
    (r"/fruitzone/systemPurchase/chargeDetail", handlers.fruitzone.SystemPurchase, {
        "action":"chargeDetail"}, "fruitzoneSystemPurchaseChargeDetail"),
    (r"/fruitzone/systemPurchase/dealFinishedCallback", handlers.fruitzone.SystemPurchase, {
        "action":"dealFinishedCallback"}, "fruitzoneSystemPurchaseDealFinishedCallback"),
    (r"/fruitzone/systemPurchase/dealSuccess", handlers.fruitzone.SystemPurchase, {
        "action":"dealSuccess"}, "fruitzoneSystemPurchaseDealSuccess"),
    (r"/fruitzone/systemPurchase/dealNotify", handlers.fruitzone.SystemPurchase, {
        "action":"dealNotify"}, "fruitzoneSystemPurchaseDealNotify"),
    
]

