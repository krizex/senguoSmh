# 数据库的水果类型初始化，若要增加水果类型，则直接按照已有的格式在后面添加，进程重新启动时会自动插到数据库里
# 现在只支持新增，若要删除，则自己手动删除数据库的记录，同时修改此文件
fruit_types = [{'id': 1, 'name': '梨子', 'code': 'Li'},
               {'id': 2, 'name': '西瓜', 'code': 'Xg'},
               {'id': 3, 'name': '芒果', 'code': 'Mg'},
               {'id': 4, 'name': '荔枝', 'code': 'Lz'},
               {'id': 5, 'name': '火龙果', 'code': 'Hlg'},
               {'id': 6, 'name': '青苹果', 'code': 'Qpg'},
               {'id': 7, 'name': '苹果', 'code': 'Pg'},
               {'id': 8, 'name': '青梨', 'code': 'Qli'},
               {'id': 9, 'name': '葡萄', 'code': 'Pt'},
               {'id': 10, 'name': '青提', 'code': 'Tz'},
               {'id': 11, 'name': '小金橘', 'code': 'Xjj'},
               {'id': 12, 'name': '冬枣', 'code': 'Dz'},
               {'id': 13, 'name': '橘子', 'code': 'Jz'},
               {'id': 14, 'name': '小番茄', 'code': 'Xfq'},
               {'id': 15, 'name': '柠檬', 'code': 'Nm'},
               {'id': 16, 'name': '榴莲', 'code': 'Ll'},
               {'id': 17, 'name': '哈密瓜', 'code': 'Hmg'},
               {'id': 18, 'name': '猕猴桃', 'code': 'Mht'},
               {'id': 19, 'name': '橙子', 'code': 'Cz'},
               {'id': 20, 'name': '柚子', 'code': 'Yz'},
               {'id': 21, 'name': '香瓜', 'code': 'Xiangg'},
               {'id': 22, 'name': '木瓜', 'code': 'Mug'},
               {'id': 23, 'name': '香蕉', 'code': 'Xj'},
               {'id': 24, 'name': '石榴', 'code': 'Sl'},
               {'id': 25, 'name': '水蜜桃', 'code': 'Smt'},
               {'id': 26, 'name': '椰子', 'code': 'Yez'},
               {'id': 27, 'name': '白地瓜', 'code': 'Bdg'},
               {'id': 28, 'name': '菠萝蜜', 'code': 'Blm'},
               {'id': 29, 'name': '山楂', 'code': 'Sz'},
               {'id': 30, 'name': '桂圆', 'code': 'Gy'},
               {'id': 31, 'name': '枇杷', 'code': 'Pp'},
               {'id': 32, 'name': '红枣', 'code': 'Hz'},
               {'id': 33, 'name': '菠萝', 'code': 'Bl'},
               {'id': 34, 'name': '柿子', 'code': 'Shiz'},
               {'id': 35, 'name': '山竹', 'code': 'Shanzhu'},
               {'id': 36, 'name': '皇帝柑', 'code': 'Hdg'},
               {'id': 37, 'name': '草莓', 'code': 'Cm'},
               {'id': 38, 'name': '雪莲果', 'code': 'Xlg'},
               {'id': 39, 'name': '甘蔗', 'code': 'Gz'},
               {'id': 40, 'name': '黑布林', 'code': 'Hbl'},
               {'id': 41, 'name': '杨桃', 'code': 'Yangt'},
               {'id': 42, 'name': '释迦', 'code': 'shijia'},
               {'id': 43, 'name': '无花果', 'code': 'wuhuaguo'},
               {'id': 44, 'name': '樱桃', 'code': 'yingtao'},
               {'id': 45, 'name': '百香果', 'code': 'baixiangguo'},
               {'id': 46, 'name': '橄榄', 'code': 'ganlan'},
               {'id': 47, 'name': '红毛丹', 'code': 'hongmaodan'},
               {'id': 48, 'name': '莲雾', 'code': 'lianwu'},
               {'id': 49, 'name': '牛油果', 'code': 'niuyouguo'},
               {'id': 50, 'name': '西柚', 'code': 'xiyou'},
               {'id': 51, 'name': '油桃', 'code': 'youtao'},
               {'id': 52, 'name': '蛇果', 'code': 'sheguo'},
               {'id': 53, 'name': '红提', 'code': 'hongti'},
               {'id': 54, 'name': '加力果', 'code': 'jialiguo'},
               {'id': 55, 'name': '凤梨', 'code': 'fengli'},
               {'id': 56, 'name': '皇帝蕉', 'code': 'huangdijiao'},
               {'id': 57, 'name': '车厘子', 'code': 'chelizhi'},
               {'id': 58, 'name': '蓝莓', 'code': 'lanmei'},
               {'id': 59, 'name': '西梅', 'code': 'ximei'},
               {'id': 60, 'name': '龙眼', 'code': 'longyan'},
               {'id': 61, 'name': '黄西瓜','code': 'huangxigua'},
               {'id': 62, 'name': '人参果', 'code':'renshenguo'},
               {'id': 63, 'name': '黄瓜',  'code':'huanggua'},
               {'id': 64, 'name': '番石榴', 'code':'fanshiliu'},
               {'id': 65, 'name': '桑椹', 'code':'sangshen'},
               {'id': 66, 'name': '丑八怪', 'code':'ugly'},
               {'id': 67, 'name': '杨梅', 'code':'yangmei'},
               {'id': 68, 'name': '李子', 'code':'lizi'},
               {'id': 69, 'name': '杏子', 'code':'xingzi'},


               # 干果类型
               {'id': 1001, 'name': '腰果', 'code': 'yaoguo'},
               {'id': 1002, 'name': '杏仁', 'code': 'xingren'},
               {'id': 1003, 'name': '板栗', 'code': 'banli'},
               {'id': 1004, 'name': '瓜子', 'code': 'guazi'},
               {'id': 1005, 'name': '花生', 'code': 'huasheng'},
               {'id': 1006, 'name': '开心果', 'code': 'kaixinguo'},
               {'id': 1007, 'name': '松子', 'code': 'sognzi'},
               {'id': 1008, 'name': '核桃', 'code': 'hetao'},
               {'id': 1009, 'name': '葡萄干', 'code': 'putaogan'},
               {'id': 1010, 'name': '红枣', 'code': 'hongzao'},
               {'id': 1011, 'name': '巴旦木', 'code': 'badanmu'},
               {'id': 1012, 'name': '蚕豆', 'code': 'candou'},
               {'id': 1013, 'name': '豌豆', 'code': 'wandou'},
               {'id': 1014, 'name': '夏威夷果', 'code': 'xiaweiyiguo'},
               {'id': 1015, 'name': '柿饼', 'code': 'shibing'},
               {'id': 1016, 'name': '碧根果','code':'bigenguo'},
               {'id': 1017, 'name': '香蕉片','code':'xiangjiaopian'},
               {'id': 1018, 'name': '甜角','code':'tianjiao'},
               {'id': 1019, 'name': '干桂圆','code':'ganguiyuan'},
               {'id': 1020, 'name': '榛子','code':'zhenzi'},
]

charge_types = [
    {"id": 1,
     "good_name":"森果商城系统1.0（三个月套餐）",
     "month":3,
     "price":558,#588
     "description":"588元/三个月"},
    {"id":2,
     "good_name":"森果商城系统1.0（六个月套餐）",
     "month":6,
     "price":988,
     "description":"988元/六个月"},
    {"id":3,
     "good_name":"森果商城系统1.0（十二个月套餐）",
     "month":12,
     "price":1788,
     "description":"1788元/十二个月"}
]
