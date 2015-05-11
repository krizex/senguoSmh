import handlers.admin
import handlers.staff
import handlers.customer
import handlers.superadmin
import handlers.fruitzone
import handlers.infowall
import handlers.official
from dal import models
#todo:handlers太大会不会影响性能？

# sub_handlers = ["^e.senguo.cc",

#     [(r"/m", handlers.superadmin.Official),
#     ]

# ]


handlers = [

	(r"/staff/login", handlers.staff.Access, {"action":"login"}, "staffLogin"),
	(r"/staff/oauth", handlers.staff.Access, {"action":"oauth"}, "staffOauth"),
	(r"/staff/logout", handlers.staff.Access, {"action":"logout"}, "staffLogout"),
	(r"/staff/register", handlers.staff.Access, {"action":"register"}, "staffRegister"),
	(r"/staff", handlers.staff.Home, {}, "staffHome"),
	(r"/staff/order", handlers.staff.Order, {}, "staffOrder"),
	(r"/staff/hire/(\d+)", handlers.staff.Hire, {}, "staffHire"),

	(r"/customer/login", handlers.customer.Access, {"action":"login"}, "customerLogin"),
	(r"/customer/oauth", handlers.customer.Access, {"action":"oauth"}, "customerOauth"),
	(r"/customer/logout", handlers.customer.Access, {"action":"logout"}, "customerLogout"),
	(r"/customer/weixin", handlers.customer.Third, {"action":"weixin"}, "customerWeixin"),
	(r"/customer/register", handlers.customer.RegistByPhone, {}, "customerRegister"),
	(r"/customer/password", handlers.customer.Password, {}, "customerPassword"),
	
	(r"/customer/profile", handlers.customer.CustomerProfile, {}, "customerProfile"),
	(r"/customer/test",handlers.customer.InsertData,{},"InsertData"),
	# (r"/fruitzone/alipaynotify",handlers.customer.AlipayNotify,{},"alipayNotify"),
	#微官网-----待删除
	(r"/", handlers.superadmin.Official),

	#official
	(r"/official",handlers.official.Home,{},"OfficialHome"),

	(r"/official/shoplist",handlers.official.ShopList,{},"OfficialShopList"),
	(r"/official/about",handlers.official.About,{},"OfficialAbout"),


	#to remove
	(r"/m", handlers.superadmin.Official,{},"test"),

	(r"/customer/cart/(\w+)", handlers.customer.Cart, {}, "customerCart"),
	(r"/customer/orders", handlers.customer.Order, {}, "customerOrder"),
	(r"/customer/orders/detail/(\d+)", handlers.customer.OrderDetail, {}, "customerOrderDetail"),
	(r"/customer/members", handlers.customer.Members, {}, "customerMembers"),
	# (r"/customer/shopProfile", handlers.customer.ShopProfile, {}, "customerShopProfile"),
	(r"/shopProfile/(\w+)", handlers.customer.ShopProfile, {}, "customerShopProfile"),
	(r"/customer/comment", handlers.customer.Comment, {}, "customerComment"),
	(r"/customer/points", handlers.customer.Points, {}, "customerPoints"),
	(r"/customer/balance", handlers.customer.Balance, {}, "customerBalance"),
	(r"/customer/recharge", handlers.customer.Recharge, {}, "customerRecharge"),
	(r"/notice/success", handlers.customer.Notice, {}, "noticeSuccess"),
	(r"/wexin", handlers.customer.Wexin, {}, "Wexin"),
	(r"/customer/phoneVerify", handlers.fruitzone.PhoneVerify, {
		"action":"customer"}, "customerPhoneVerify"),
	(r"/customer/(\w+)", handlers.customer.Home, {}, "customerHome"),

	(r"/super/oauth", handlers.superadmin.Access,{
		"action":"oauth"}, "superOauth"),
	(r"/super/logout", handlers.superadmin.Access,{
		"action":"logout"}, "superLogout" ),

	################ 超级管理员后台
	(r"/super", handlers.superadmin.ShopAdminManage, {
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
	(r"/super/shopclose",handlers.superadmin.ShopClose,{},"shopclose"),
	#test url
	(r"/super/comment",handlers.superadmin.Comment,{},"supercomment"),


	## 店铺申请接入管理
	# 所有店铺
	(r"/super/shopManage", handlers.superadmin.ShopManage, {}, "superShopManage"),
	(r"/super/shopauth",handlers.superadmin.ShopAuthenticate,{},"superShopAuth"),
	(r"/super/balance",handlers.superadmin.Balance,{},"superBalance"),
	(r"/super/cash",handlers.superadmin.ApplyCash,{},"superApplyCash"),
	## 商城购买订单
	(r"/super/orderManage/", handlers.superadmin.OrderManage, {
		"action":"new"}, "superOrderManage"),
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
	(r"/super/user", handlers.superadmin.User, {}, "superUser"),

	# 统计
	(r"/super/incstatic", handlers.superadmin.IncStatic, {}, "superIncStatic"),
	(r"/super/dstatic", handlers.superadmin.DistributStatic, {}, "superDStatic"),
	(r"/super/shopstatic", handlers.superadmin.ShopStatic, {}, "superShopStatic"),
	# (r"/super/Commentdelete",handlers.superadmin.CommentApplyDelete,{},"superCommentDelete"),


	# (r"/super/notice/", handlers.superadmin.Notice),
	
	(r"/admin/login", handlers.admin.Access,{"action":"login"}, "adminLogin"),
	(r"/admin/oauth", handlers.admin.Access, {"action":"oauth"}, "adminOauth"),
	(r"/admin/logout", handlers.admin.Access, {"action":"logout"}, "adminLogout"),
	(r"/admin/register", handlers.admin.Access, {"action":"register"}, "adminRegister"),
	(r"/admin", handlers.admin.Home, {},  "adminHome"),# 匹配参数为admin_id
	(r"/admin/ostatic", handlers.admin.OrderStatic, {}, "adminOrderStatic"),
	(r"/admin/fstatic", handlers.admin.FollowerStatic, {}, "adminFollowerStatic"),
	(r"/admin/order", handlers.admin.Order, {}, "adminOrder"),
	(r"/admin/comment", handlers.admin.Comment, {}, "adminComment"),
	(r"/admin/shelf", handlers.admin.Shelf, {}, "adminShelf"),# 货架管理/商品管理
	(r"/admin/follower", handlers.admin.Follower, {}, "adminStaffFollower"),
	(r"/admin/staff", handlers.admin.Staff, {}, "adminStaffJH"),
	(r"/admin/config", handlers.admin.Config, {}, "adminConfig"),
	(r"/admin/config/shop", handlers.admin.ShopConfig, {}, "adminShopConfig"),
	(r"/admin/searchorder", handlers.admin.SearchOrder, {}, "adminSearchOrder"),
	(r"/admin/shopauth",handlers.admin.ShopAuthenticate,{},'adminShopAuth'),
	(r"/admin/shopbalance",handlers.admin.ShopBalance,{},"adminShopBalance"),
	(r"/admin/realtime",handlers.admin.Realtime,{},""),

	# (r"/admin/customer", handlers.admin.Customer, {}, "adminCustomer"),
	# (r"/admin/staff", handlers.admin.Staff, {}, "adminStaff"),
	# (r"/admin/finance", handlers.admin.Finance, {}, "adminFinance"),
	# (r"/admin/settings/profile", handlers.admin.Settings,
	#  {"action":"profile"}, "adminSettingsProfile")
	
	# (r"/staff/...")

	# 水果圈子

	

	# 主页
	(r"/fruitzone\/{0,1}", handlers.fruitzone.Home, {}, "fruitzoneHome2"),  # 匹配'\' 0~1次
	(r"/fruitzone", handlers.fruitzone.Home, {}, "fruitzoneHome"),  # 匹配'\' 0~1次
	(r"/intro", handlers.fruitzone.Home, {}, "fruitzoneHome"),
	(r"/list", handlers.fruitzone.ShopList, {}, "fruitzoneShopList"),
	(r"/fruitzone/admin/home", handlers.fruitzone.AdminHome, {}, "fruitzoneAdminHome"),
	(r"/fruitzone/admin/profile", handlers.fruitzone.AdminProfile, {}, "fruitzoneAdminProfile"),
	(r"/fruitzone/paytest",handlers.customer.payTest,{},"fruitzonePayTest"),
	#to remove  
	#woody
	(r"/apply/toweixin", handlers.fruitzone.ToWeixin, {}, "fruitzoneToWexin"),
	# (r"/fruitzone/apply", handlers.fruitzone.ShopApply, {"action": "apply"}, "fruitzoneShopApply"),
	# (r"/fruitzone/apply/addImg", handlers.fruitzone.ShopApplyImg, {}, "fruitzoneShopApplyAddImg"),#增加的功能：申请店铺时支持图片上传
	# (r"/fruitzone/reApply", handlers.fruitzone.ShopApply, {"action": "reApply"}, "fruitzoneShopReApply"),
	# (r"/fruitzone/applySuccess", handlers.fruitzone.ApplySuccess, {}, "fruitzoneShopApplySuccess"),
	(r"/apply", handlers.fruitzone.ShopApply, {"action": "apply"}, "fruitzoneShopApply"),
	(r"/fruitzone/shop/apply/addImg", handlers.fruitzone.ShopApplyImg, {}, "fruitzoneShopApplyAddImg"),#增加的功能：申请店铺时支持图片上传
	(r"/apply/reApply", handlers.fruitzone.ShopApply, {"action": "reApply"}, "fruitzoneShopReApply"),
	(r"/apply/success", handlers.fruitzone.ApplySuccess, {}, "fruitzoneShopApplySuccess"),



	(r"/fruitzone/community", handlers.fruitzone.Community, {}, "fruitzoneCommunity"),

	#to remove
	#woody
	(r"/fruitzone/shop/(\d+)", handlers.fruitzone.Shop, {}, "fruitzoneShop"),
	(r"/fruitzone/(\d+)", handlers.fruitzone.Shop, {}, "fruitzoneShop"),

	(r"/fruitzone/admin/shops", handlers.fruitzone.AdminShops, {}, "fuirzoneAdminShops"),
	(r"/fruitzone/admin/shopsCollect", handlers.fruitzone.AdminShopsCollect, {}, "fuirzoneAdminShopsCollect"),
	(r"/fruitzone/admin/InfoCollect", handlers.infowall.InfoCollect, {}, "fuirzoneAdminInfoCollect"),

	(r"/fruitzone/admin/shop/(\d+)", handlers.fruitzone.AdminShop, {}, "fruitzoneAdminShop"),

	(r"/fruitzone/phoneVerify", handlers.fruitzone.PhoneVerify, {
		"action":"admin"}, "fruitzonePhoneVerify"),
	

	#信息墙
	(r"/infowall/supply", handlers.infowall.Home, {"action": "supply"}, "infowallHomeSupply"),
	(r"/infowall/demand", handlers.infowall.Home, {"action": "demand"}, "infowallHomeDemand"),
	(r"/infowall/other", handlers.infowall.Home, {"action": "other"}, "infowallHomeOther"),
	(r"/infowall/infoDetail/(\d+)", handlers.infowall.InfoDetail, {}, "infowallInfoDetail"),
	(r"/infowall/infoDetail/comment", handlers.infowall.InfoDetail, {}, "infowallInfoDetailComment"),
	(r"/infowall/infoCollect", handlers.infowall.InfoCollect, {}, "infowallInfoCollect"),
	(r"/infowall/infoIssue", handlers.infowall.InfoIssue, {}, "infowallInfoIssue"),

	#ti remove
	(r"/shop/(\w+)", handlers.customer.Market, {}, "Market"),
	#remove shop
	(r"/(\w+)", handlers.customer.Market, {}, "Market"),



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
	(r"/fruitzone/systemPurchase/alipayFinishedCallback",handlers.fruitzone.SystemPurchase,{
		"action":"alipayCallBack"},"fruitzoneSystemPurchaseAlipayFishedCallback"),
	(r"/fruitzone/systemPurchase/dealSuccess", handlers.fruitzone.SystemPurchase, {
		"action":"dealSuccess"}, "fruitzoneSystemPurchaseDealSuccess"),
	(r"/fruitzone/systemPurchase/dealNotify", handlers.fruitzone.SystemPurchase, {
		"action":"dealNotify"}, "fruitzoneSystemPurchaseDealNotify"),
	(r"/fruitzone/systemPurchase/alipaytest",handlers.fruitzone.SystemPurchase,{"action":"alipaytest"},
		"fruitzoneSystemPurchaseAlipayTest"),
	(r"/fruitzone/aliyNotify",handlers.fruitzone.SystemPurchase,{"action":"aliyNotify"},"fruitzoneSystemPurchaseAliNotify"),

	(r"/fruitzone/imgcallback", handlers.fruitzone.QiniuCallback, {"action":"shop" }, "imgCallback"),
	(r"/fruitzone/shopImgCallback", handlers.fruitzone.QiniuCallback, {"action": "edit_shop_img"}, "fruitzoneshopImgCallback"),
	(r"/fruitzone/InfoImgCallback", handlers.fruitzone.QiniuCallback, {"action": "edit_info_img"}, "fruitzoneInfoImgCallback"),
	(r"/admin/shelf/fruitImgCallback", handlers.fruitzone.QiniuCallback,
	 {"action": "edit_fruit_img"}, "adminShelfFruitImgCallback"),
]

