import handlers.admin
import handlers.staff
import handlers.customer
import handlers.superadmin
import handlers.fruitzone
import handlers.infowall
import handlers.official
import handlers.onlinePay
import handlers.activity
import handlers.madmin
import handlers.market
import handlers.apply
import handlers.bbs
from dal import models
#todo:handlers太大会不会影响性能？

# sub_handlers = ["^e.senguo.cc",

#     [(r"/m", handlers.superadmin.Official),
#     ]

# ]

handlers = [

	#告白墙
	(r"/lovewall/public/(\w+)", handlers.activity.ConfessionPublic, {}, "ConfessionPublic"),
	(r"/lovewall/center/(\w+)", handlers.activity.ConfessionCenter, {}, "ConfessionCenter"),
	(r"/lovewall/list/(\w+)", handlers.activity.ConfessionList, {}, "ConfessionList"),
	(r"/lovewall/comment/(\w+)", handlers.activity.ConfessionComment, {}, "ConfessionComment"),
	(r"/lovewall/(\w+)", handlers.activity.ConfessionHome, {}, "ConfessionHome"),

	#bbs
	(r"/bbs", handlers.bbs.Main, {}, "BbsMain"),
	(r"/bbs/detail/(\w+)", handlers.bbs.Detail, {}, "BbsDetail"),
	(r"/bbs/detailEdit/(\w+)", handlers.bbs.DetailEdit, {}, "BbsDetailEdit"),
	(r"/bbs/publish", handlers.bbs.Publish, {}, "BbsPublish"),
	(r"/bbs/search", handlers.bbs.Search, {}, "BbsSearch"),
	(r"/bbs/profile", handlers.bbs.Profile, {}, "BbsProfile"),

	#市场推广
	(r"/market/home", handlers.market.Home, {}, "MarketHome"),
	(r"/market/shopinfo", handlers.market.Info, {}, "MarketInfo"),
	(r"/market/shopinsert/(\w+)", handlers.market.ShopAdminInfo, {}, "MarketInsert"),
	(r"/market/success", handlers.market.Success, {}, "MarketSuccess"),
	#(r'/market/staffinsert',handlers.market.StaffInsert,{},"staffinsert"),

	#优惠券
	(r"/coupon", handlers.activity.Coupon, {}, "Coupon"),
	(r"/coupon/detail", handlers.activity.CouponDetail, {}, "CouponDetail"),

	(r"/staff/login", handlers.staff.Access, {"action":"login"}, "staffLogin"),
	(r"/staff/oauth", handlers.staff.Access, {"action":"oauth"}, "staffOauth"),
	(r"/staff/logout", handlers.staff.Access, {"action":"logout"}, "staffLogout"),
	(r"/staff/register", handlers.staff.Access, {"action":"register"}, "staffRegister"),
	(r"/staff", handlers.staff.Home, {}, "staffHome"),
	(r"/staff/order", handlers.staff.Order, {}, "staffOrder"),
	(r"/staff/hire/(\d+)", handlers.staff.Hire, {}, "staffHire"),

	(r"/customer/login", handlers.customer.Access, {"action":"login"}, "customerLogin"),
	(r"/customer/oauth", handlers.customer.Access, {"action":"oauth"}, "customerOauth"),
	(r"/customer/qq",handlers.customer.Access,{'action':'qq'},"customerQq"),
	(r"/customer/qqoauth",handlers.customer.Access,{"action":"qqoauth"},"customerQOauth"),
	(r"/customer/logout", handlers.customer.Access, {"action":"logout"}, "customerLogout"),
	(r"/customer/weixin", handlers.customer.Third, {"action":"weixin"}, "customerWeixin"),
	(r"/customer/register", handlers.customer.RegistByPhone, {}, "customerRegister"),
	(r"/customer/password", handlers.customer.Password, {}, "customerPassword"),

	(r"/customer/profile", handlers.customer.CustomerProfile, {}, "customerProfile"),
	(r"/customer/wxauth", handlers.customer.WxBind, {"action":"wx_auth"}, "customerwxAuth"),
	(r"/customer/wxBind", handlers.customer.WxBind, {"action":"wx_bind"}, "customerwxBind"),
	(r"/customer/test",handlers.customer.InsertData,{},"InsertData"),
	(r"/customer/discover/(\w+)",handlers.customer.Discover,{},"customerDiscover"),
	(r"/customer/storagechange",handlers.customer.StorageChange),
	(r"/customer/qrwxpay",handlers.customer.QrWxpay,{},"customerQrWxpay"),

	#商品详情
	#(r"/customer/goods/(\w+)",handlers.customer.customerGoods,{},"customerGoods"),
	(r"/customer/overtime",handlers.customer.Overtime,{},"customerOverTime"),

	# (r"/fruitzone/alipaynotify",handlers.customer.AlipayNotify,{},"alipayNotify"),
	#微官网-----待删除
	#(r"/", handlers.superadmin.Official),

	#official
	(r"/",handlers.official.Home,{},"OfficialHome"),


	(r"/shoplist",handlers.official.ShopList,{},"OfficialShopList"),
	(r"/about",handlers.official.About,{},"OfficialAbout"),
	(r"/product",handlers.official.Product,{},"OfficialProduct"),
	#to remove
	(r"/m", handlers.superadmin.Official,{},"test"),

	#支付宝在线支付
	(r"/customer/online/aliPaycallback",handlers.onlinePay.OnlineAliPay,{'action':'AliPayCallback'},
		"onlineAlipayFishedCallback"),
	(r"/customer/online/alinotify",handlers.onlinePay.OnlineAliPay,{'action':'AliNotify'},
		"onlineAliNotify"),
	(r"/customer/online/alipay",handlers.onlinePay.OnlineAliPay,{'action':'AliPay'},
		"onlineAliPay"),
	(r"/customer/online/orderdetail",handlers.onlinePay.OrderDetail,{},'onlineOrderDetail'),
	(r"/customer/online/justorder",handlers.onlinePay.JustOrder,{},"justOrder"),
	(r"/customer/cart/(\w+)", handlers.customer.Cart, {}, "customerCart"),
	(r"/customer/cartback",handlers.customer.CartCallback,{},"customerCartCallback"),
	(r"/customer/orders", handlers.customer.Order, {}, "customerOrder"),
	(r"/customer/orders/detail/(\d+)", handlers.customer.OrderDetail, {}, "customerOrderDetail"),
	(r"/customer/members", handlers.customer.Members, {}, "customerMembers"),
	# (r"/customer/shopProfile", handlers.customer.ShopProfile, {}, "customerShopProfile"),
	(r"/shopProfile/(\w+)", handlers.customer.ShopProfile, {}, "customerShopProfile"),
	(r"/customer/comment", handlers.customer.Comment, {}, "customerComment"),
	(r"/customer/shopcomment", handlers.customer.ShopComment, {}, "customerShopComment"),
	(r"/customer/ordercomment", handlers.customer.OrderComment, {}, "customerOrderComment"),
	(r"/customer/points", handlers.customer.Points, {}, "customerPoints"),
	(r"/customer/balance", handlers.customer.Balance, {}, "customerBalance"),
	(r"/customer/recharge", handlers.customer.Recharge, {}, "customerRecharge"),
	(r"/customer/recharge/AliPay", handlers.customer.RechargeAliPay, {}, "customerRechargeAliPay"),
	(r"/customer/search", handlers.customer.GoodsSearch, {}, "customerGoodsSearch"),
	(r"/notice/success", handlers.customer.Notice, {}, "noticeSuccess"),
	(r"/wexin", handlers.customer.Wexin, {}, "Wexin"),
	(r"/customer/phoneVerify", handlers.fruitzone.PhoneVerify, {
		"action":"customer"}, "customerPhoneVerify"),
	(r"/customer/onlinewxpay",handlers.onlinePay.OnlineWxPay,{},"onlineWxPay"),
	(r"/customer/wxpayCallBack",handlers.onlinePay.wxpayCallBack,{},"wxpayCallBack"),
	(r"/customer/wxChargeCallBack",handlers.customer.wxChargeCallBack,{},"wxChargeCallBack"),
	(r"/customer/(\w+)", handlers.customer.Home, {}, "customerHome"),
	#店铺地图
	(r"/shoparea/(\w+)",handlers.customer.ShopArea,{},"shoparea"),


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
	#(r"/super/shopclose",handlers.superadmin.ShopClose,{},"shopclose"),
	#test url

	# add and change by jyj 2015-7-6
	(r"/super/comment_apply",handlers.superadmin.Comment,{},"supercommentApply"),
	(r"/super/comment_info",handlers.superadmin.CommentInfo,{},"supercommentInfo"),
	##

	## 店铺申请接入管理
	# 所有店铺
	(r"/super/shopManage", handlers.superadmin.ShopManage, {}, "superShopManage"),
	(r"/super/shopauth",handlers.superadmin.ShopAuthenticate,{},"superShopAuth"),
	(r"/super/balance",handlers.superadmin.Balance,{},"superBalance"),
	(r"/super/cash",handlers.superadmin.ApplyCash,{},"superApplyCash"),

	#add by jyj 2015-6-16
	(r"/super/check_cash",handlers.superadmin.CheckCash,{},"superCheckCash"),
	(r"/super/balance/(\w+)",handlers.superadmin.ShopBalanceDetail,{},"ShopBalanceDetail"),
	##

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

	#add by jyj 2015-6-15
	(r"/super/orderstatic", handlers.superadmin.OrderStatic, {}, "superOrderStatic"),
	##
	# (r"/super/Commentdelete",handlers.superadmin.CommentApplyDelete,{},"superCommentDelete"),


	# (r"/super/notice/", handlers.superadmin.Notice),

	(r"/admin/login", handlers.admin.Access,{"action":"login"}, "adminLogin"),
	(r"/admin/oauth", handlers.admin.Access, {"action":"oauth"}, "adminOauth"),
	(r"/admin/logout", handlers.admin.Access, {"action":"logout"}, "adminLogout"),
	(r"/admin/register", handlers.admin.Access, {"action":"register"}, "adminRegister"),
	(r"/admin/home", handlers.admin.Home, {},  "adminHome"),# 匹配参数为admin_id

	# add by jyj 2015-7-8
	(r"/admin/sstatic", handlers.admin.SellStatic, {}, "adminSellStatic"),
	##

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
	(r"/admin/marketing",handlers.admin.Marketing,{},"adminMarketing"),
	(r"/admin/confession",handlers.admin.Confession,{},"adminConfession"),
	(r"/admin",handlers.admin.SwitchShop,{},"switchshop"),
	(r"/admin/wxauth", handlers.admin.AdminAuth, {"action":"wxauth"}, "adminwxAuth"),
	(r"/admin/wxcheck", handlers.admin.AdminAuth, {"action":"wxcheck"}, "adminwxCheck"),

	(r"/admin/goods/all", handlers.admin.Goods, {"action":"all"}, "adminGoods"),
	(r"/admin/goods/classify", handlers.admin.Goods, {"action":"classify"}, "adminGoodsClassify"),
	(r"/admin/goods/group", handlers.admin.Goods, {"action":"group"}, "adminGoodsGroup"),
	(r"/admin/goods/delete", handlers.admin.Goods, {"action":"delete"}, "adminGoodsDelete"),

	(r"/admin/editorTest", handlers.admin.editorTest, {}, "admineditorTest"),
	(r"/admin/editorFileManage", handlers.admin.editorFileManage, {}, "admineditorFileManage"),
	(r"/admin/editorCallback", handlers.admin.editorCallback, {}, "admineditorCallback"),
	(r"/admin/MessageManage", handlers.admin.MessageManage, {}, "adminMessageManage"),
	(r"/admin/WirelessPrint", handlers.admin.WirelessPrint, {}, "WirelessPrint"),
	(r"/admin/import", handlers.admin.GoodsImport, {}, "GoodsImport"),

	# (r"/admin/customer", handlers.admin.Customer, {}, "adminCustomer"),
	# (r"/admin/staff", handlers.admin.Staff, {}, "adminStaff"),
	# (r"/admin/finance", handlers.admin.Finance, {}, "adminFinance"),
	# (r"/admin/settings/profile", handlers.admin.Settings,
	#  {"action":"profile"}, "adminSettingsProfile")
	##移动端后台
	(r"/madmin", handlers.madmin.Home, {}, "MadminHome"),
	(r"/madmin/shop", handlers.madmin.Shop, {}, "MadminShop"),
	(r"/madmin/order", handlers.madmin.Order, {}, "MadminOrder"),
	(r"/madmin/orderDetail/(\w+)", handlers.madmin.OrderDetail, {}, "MadminOrderDetail"),
	(r"/madmin/orderSearch", handlers.madmin.OrderSearch, {}, "MadminSearch"),
	(r"/madmin/comment", handlers.madmin.Comment, {}, "MadminComment"),
	(r"/madmin/shopset", handlers.madmin.Set, {}, "MadminSet"),
	(r"/madmin/shopinfo", handlers.madmin.Info, {}, "MadminInfo"),
	(r"/madmin/shopaddress", handlers.madmin.Address, {}, "MadminAddress"),
	(r"/madmin/shopattr", handlers.madmin.SetAttr, {}, "MadminSetAttr"),


	# 水果圈子

	# 主页
	(r"/fruitzone\/{0,1}", handlers.fruitzone.Home, {}, "fruitzoneHome2"),  # 匹配'\' 0~1次
	# (r"/fruitzone", handlers.fruitzone.Home, {}, "fruitzoneHome"),  # 匹配'\' 0~1次
	(r"/intro", handlers.fruitzone.Home, {}, "fruitzoneHome"),
	(r"/list", handlers.fruitzone.ShopList, {}, "fruitzoneShopList"),
	(r"/fruitzone/admin/home", handlers.fruitzone.AdminHome, {}, "fruitzoneAdminHome"),
	(r"/fruitzone/admin/profile", handlers.fruitzone.AdminProfile, {}, "fruitzoneAdminProfile"),
	(r"/fruitzone/paytest",handlers.customer.payTest,{},"fruitzonePayTest"),
	(r"/fruitzone/searchlist",handlers.fruitzone.SearchList,{},"searchlist"),
	#to remove
	#woody
	(r"/apply/toweixin", handlers.fruitzone.ToWeixin, {}, "fruitzoneToWexin"),
	# (r"/fruitzone/apply", handlers.fruitzone.ShopApply, {"action": "apply"}, "fruitzoneShopApply"),
	# (r"/fruitzone/apply/addImg", handlers.fruitzone.ShopApplyImg, {}, "fruitzoneShopApplyAddImg"),#增加的功能：申请店铺时支持图片上传
	# (r"/fruitzone/reApply", handlers.fruitzone.ShopApply, {"action": "reApply"}, "fruitzoneShopReApply"),
	# (r"/fruitzone/applySuccess", handlers.fruitzone.ApplySuccess, {}, "fruitzoneShopApplySuccess"),
	(r"/apply", handlers.apply.Home, {}, "ApplyHome"),
	(r"/apply/login", handlers.apply.Login, {}, "ApplyLogin"),
	(r"/wxmessage",handlers.apply.WxMessage,{},'wxmessage'),
	(r"/admin/create", handlers.apply.CreateShop, {}, "CreateShop"),
	
	(r"/fruitzone/shop/apply/addImg", handlers.fruitzone.ShopApplyImg, {}, "fruitzoneShopApplyAddImg"),#增加的功能：申请店铺时支持图片上传
	(r"/apply/reApply", handlers.fruitzone.ShopApply, {"action": "reApply"}, "fruitzoneShopReApply"),
	(r"/apply/success", handlers.fruitzone.ApplySuccess, {}, "fruitzoneShopApplySuccess"),



	(r"/fruitzone/community", handlers.fruitzone.Community, {}, "fruitzoneCommunity"),

	#to remove
	#woody
	#(r"/fruitzone/shop/(\d+)", handlers.fruitzone.Shop, {}, "fruitzoneShop"),
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

	#to remove
	#(r"/shop/(\w+)", handlers.customer.Market, {}, "Market"),
	#remove shop
	(r"/(\w+)", handlers.customer.Market, {}, "Market"),
	#商品详情
	(r"/(\w+)/goods/(\w+)",handlers.customer.customerGoods,{},"customerGoods"),


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
	(r"/admin/shelf/fruitImgCallback", handlers.fruitzone.QiniuCallback, {"action": "edit_fruit_img"}, "adminShelfFruitImgCallback"),
]
