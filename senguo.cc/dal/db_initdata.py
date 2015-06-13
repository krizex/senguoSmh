# 数据库的水果类型初始化，若要增加水果类型，则直接按照已有的格式在后面添加，进程重新启动时会自动插到数据库里
# 现在只支持新增，若要删除，则自己手动删除数据库的记录，同时修改此文件
# key value 
#颜色color number  <red,1> ; <yellow,2>; <green,3> <purple,4><white,5><blue,6>
#字数 length number 
#园艺分类  garden  number <仁果类，1> <核果类，2> <浆果类,3> <柑橘类，4> <热带及亚热带类，5>
#  <什果类，6> <坚果类，7>
# 属性 nature number  <cold ,1> <hot,2> <middle,3>
fruit_types = [{'id': 1, 'name': '梨子', 'code': 'Li','color':2,'length':2,'garden':1,'nature':1},
               {'id': 2, 'name': '西瓜', 'code': 'Xg','color':3,'length':2,'garden':1,'nature':1},
               {'id': 3, 'name': '芒果', 'code': 'Mg','color':2,'length':2,'garden':2,'nature':1},
               {'id': 4, 'name': '荔枝', 'code': 'Lz','color':1,'length':2,'garden':1,'nature':2},
               {'id': 5, 'name': '火龙果', 'code': 'Hlg','color':1,'length':3,'garden':5,'nature':1},
               {'id': 6, 'name': '青苹果', 'code': 'Qpg','color':3,'length':3,'garden':1,'nature':3},
               {'id': 7, 'name': '苹果', 'code': 'Pg','color':1,'length':2,'garden':1,'nature':3},
               {'id': 8, 'name': '青梨', 'code': 'Qli','color':3,'length':2,'garden':1,'nature':1},
               {'id': 9, 'name': '葡萄', 'code': 'Pt','color':4,'length':2,'garden':3,'nature':3},
               {'id': 10, 'name': '青提', 'code': 'Tz','color':3,'length':2,'garden':3,'nature':3},
               {'id': 11, 'name': '小金橘', 'code': 'Xjj','color':2,'length':3,'garden':4,'nature':2},
               {'id': 12, 'name': '冬枣', 'code': 'Dz','color':3,'length':2,'garden':6,'nature':2},
               {'id': 13, 'name': '橘子', 'code': 'Jz','color':2,'length':2,'garden':4,'nature':2},
               {'id': 14, 'name': '小番茄', 'code': 'Xfq','color':1,'length':3,'garden':4,'nature':3},
               {'id': 15, 'name': '柠檬', 'code': 'Nm','color':2,'length':2,'garden':4,'nature':1},
               {'id': 16, 'name': '榴莲', 'code': 'Ll','color':2,'length':2,'garden':1,'nature':2},
               {'id': 17, 'name': '哈密瓜', 'code': 'Hmg','color':2,'length':3,'garden':1,'nature':1},
               {'id': 18, 'name': '猕猴桃', 'code': 'Mht','color':3,'length':3,'garden':3,'nature':1},
               {'id': 19, 'name': '橙子', 'code': 'Cz','color':2,'length':2,'garden':4,'nature':1},
               {'id': 20, 'name': '柚子', 'code': 'Yz','color':2,'length':2,'garden':4,'nature':1},
               {'id': 21, 'name': '香瓜', 'code': 'Xiangg','color':5,'length':2,'garden':1,'nature':2},
               {'id': 22, 'name': '木瓜', 'code': 'Mug','color':2,'length':2,'garden':1,'nature':2},
               {'id': 23, 'name': '香蕉', 'code': 'Xj','color':2,'length':2,'garden':5,'nature':1},
               {'id': 24, 'name': '石榴', 'code': 'Sl','color':1,'length':2,'garden':3,'nature':2},
               {'id': 25, 'name': '水蜜桃', 'code': 'Smt','color':1,'length':3,'garden':2,'nature':2},
               {'id': 26, 'name': '椰子', 'code': 'Yez','color':5,'length':2,'garden':5,'nature':3},
               {'id': 27, 'name': '白地瓜', 'code': 'Bdg','color':5,'length':3,'garden':6,'nature':2},
               {'id': 28, 'name': '菠萝蜜', 'code': 'Blm','color':2,'length':3,'garden':5,'nature':3},
               {'id': 29, 'name': '山楂', 'code': 'Sz','color':1,'length':2,'garden':1,'nature':2},
               {'id': 30, 'name': '桂圆', 'code': 'Gy','color':2,'length':2,'garden':1,'nature':2},
               {'id': 31, 'name': '枇杷', 'code': 'Pp','color':2,'length':2,'garden':1,'nature':1},
               {'id': 32, 'name': '红枣', 'code': 'Hz','color':1,'length':2,'garden':6,'nature':2},
               {'id': 33, 'name': '菠萝', 'code': 'Bl','color':2,'length':2,'garden':5,'nature':3},
               {'id': 34, 'name': '柿子', 'code': 'Shiz','color':2,'length':2,'garden':6,'nature':1},
               {'id': 35, 'name': '山竹', 'code': 'Shanzhu','color':4,'length':2,'garden':1,'nature':1},
               {'id': 36, 'name': '皇帝柑', 'code': 'Hdg','color':2,'length':3,'garden':4,'nature':1},
               {'id': 37, 'name': '草莓', 'code': 'Cm','color':1,'length':2,'garden':3,'nature':1},
               {'id': 38, 'name': '雪莲果', 'code': 'Xlg','color':5,'length':3,'garden':6,'nature':1},
               {'id': 39, 'name': '甘蔗', 'code': 'Gz','color':4,'length':2,'garden':6,'nature':1},
               {'id': 40, 'name': '黑布林', 'code': 'Hbl','color':4,'length':3,'garden':2,'nature':1},
               {'id': 41, 'name': '杨桃', 'code': 'Yangt','color':3,'length':2,'garden':2,'nature':1},
               {'id': 42, 'name': '释迦', 'code': 'shijia','color':3,'length':2,'garden':1,'nature':1},
               {'id': 43, 'name': '无花果', 'code': 'wuhuaguo','color':4,'length':3,'garden':6,'nature':3},
               {'id': 44, 'name': '樱桃', 'code': 'yingtao','color':1,'length':2,'garden':2,'nature':2},
               {'id': 45, 'name': '百香果', 'code': 'baixiangguo','color':4,'length':3,'garden':3,'nature':3},
               {'id': 46, 'name': '橄榄', 'code': 'ganlan','color':3,'length':2,'garden':2,'nature':3},
               {'id': 47, 'name': '红毛丹', 'code': 'hongmaodan','color':1,'length':3,'garden':1,'nature':2},
               {'id': 48, 'name': '莲雾', 'code': 'lianwu','color':1,'length':2,'garden':5,'nature':3},
               {'id': 49, 'name': '牛油果', 'code': 'niuyouguo','color':3,'length':3,'garden':5,'nature':2},
               {'id': 50, 'name': '西柚', 'code': 'xiyou','color':2,'length':2,'garden':4,'nature':1},
               {'id': 51, 'name': '油桃', 'code': 'youtao','color':1,'length':2,'garden':2,'nature':1},
               {'id': 52, 'name': '蛇果', 'code': 'sheguo','color':1,'length':2,'garden':1,'nature':1},
               {'id': 53, 'name': '红提', 'code': 'hongti','color':1,'length':2,'garden':3,'nature':3},
               {'id': 54, 'name': '加力果', 'code': 'jialiguo','color':1,'length':3,'garden':1,'nature':3},
               {'id': 55, 'name': '凤梨', 'code': 'fengli','color':2,'length':2,'garden':5,'nature':3},
               {'id': 56, 'name': '皇帝蕉', 'code': 'huangdijiao','color':2,'length':3,'garden':5,'nature':1},
               {'id': 57, 'name': '车厘子', 'code': 'chelizhi','color':1,'length':3,'garden':2,'nature':2},
               {'id': 58, 'name': '蓝莓', 'code': 'lanmei','color':6,'length':2,'garden':3,'nature':1},
               {'id': 59, 'name': '西梅', 'code': 'ximei','color':4,'length':2,'garden':2,'nature':1},
               {'id': 60, 'name': '龙眼', 'code': 'longyan','color':2,'length':2,'garden':1,'nature':1},
               {'id': 61, 'name': '黄西瓜','code': 'huangxigua','color':3,'length':3,'garden':1,'nature':1},
               {'id': 62, 'name': '人参果', 'code':'renshenguo','color':4,'length':3,'garden':3,'nature':2},
               {'id': 63, 'name': '黄瓜',  'code':'huanggua','color':3,'length':2,'garden':6,'nature':1},
               {'id': 64, 'name': '番石榴', 'code':'fanshiliu','color':3,'length':3,'garden':5,'nature':3},
               {'id': 65, 'name': '桑椹', 'code':'sangshen','color':4,'length':2,'garden':3,'nature':1},
               {'id': 66, 'name': '丑八怪', 'code':'ugly','color':2,'length':3,'garden':4,'nature':1},
               {'id': 67, 'name': '杨梅', 'code':'yangmei','color':4,'length':2,'garden':2,'nature':2},
               {'id': 68, 'name': '李子', 'code':'lizi','color':1,'length':2,'garden':2,'nature':1},
               {'id': 69, 'name': '杏子', 'code':'xingzi','color':2,'length':2,'garden':2,'nature':3},


               
               # 干果类型
                  # 所有干果的颜色默认为2 yellow 
                  # 干果长度按照名词长度定 
                  # 干果的园艺分类方式都为 <坚果类，7>
                  # 干果的属性都为热性 nature = 2 
               {'id': 1001, 'name': '腰果', 'code': 'yaoguo','color':2,'length':2,'garden':7,'nature':2},
               {'id': 1002, 'name': '杏仁', 'code': 'xingren','color':2,'length':2,'garden':7,'nature':2},
               {'id': 1003, 'name': '板栗', 'code': 'banli','color':2,'length':2,'garden':7,'nature':2},
               {'id': 1004, 'name': '瓜子', 'code': 'guazi','color':2,'length':2,'garden':7,'nature':2},
               {'id': 1005, 'name': '花生', 'code': 'huasheng','color':2,'length':2,'garden':7,'nature':2},
               {'id': 1006, 'name': '开心果', 'code': 'kaixinguo','color':2,'length':3,'garden':7,'nature':2},
               {'id': 1007, 'name': '松子', 'code': 'sognzi','color':2,'length':2,'garden':7,'nature':2},
               {'id': 1008, 'name': '核桃', 'code': 'hetao','color':2,'length':2,'garden':7,'nature':2},
               {'id': 1009, 'name': '葡萄干', 'code': 'putaogan','color':2,'length':3,'garden':7,'nature':2},
               {'id': 1010, 'name': '红枣', 'code': 'hongzao','color':2,'length':2,'garden':7,'nature':2},
               {'id': 1011, 'name': '巴旦木', 'code': 'badanmu','color':2,'length':3,'garden':7,'nature':2},
               {'id': 1012, 'name': '蚕豆', 'code': 'candou','color':2,'length':2,'garden':7,'nature':2},
               {'id': 1013, 'name': '豌豆', 'code': 'wandou','color':2,'length':2,'garden':7,'nature':2},
               {'id': 1014, 'name': '夏威夷果', 'code': 'xiaweiyiguo','color':2,'length':4,'garden':7,'nature':2},
               {'id': 1015, 'name': '柿饼', 'code': 'shibing','color':2,'length':2,'garden':7,'nature':2},
               {'id': 1016, 'name': '碧根果','code':'bigenguo','color':2,'length':3,'garden':7,'nature':2},
               {'id': 1017, 'name': '香蕉片','code':'xiangjiaopian','color':2,'length':3,'garden':7,'nature':2},
               {'id': 1018, 'name': '甜角','code':'tianjiao','color':2,'length':2,'garden':7,'nature':2},
               {'id': 1019, 'name': '干桂圆','code':'ganguiyuan','color':2,'length':3,'garden':7,'nature':2},
               {'id': 1020, 'name': '榛子','code':'zhenzi','color':2,'length':2,'garden':7,'nature':2},
               {'id': 1021, 'name': '枸杞','code':'gouqi','color':2,'length':2,'garden':7,'nature':2},
               {'id': 1022, 'name': '杏干','code':'xinggan','color':2,'length':2,'garden':7,'nature':2},
               {'id': 1023, 'name': '无花果干','code':'wuhuaguogan','color':2,'length':4,'garden':7,'nature':2},

               
      #其他 color = 0  length = 2  默认        
               {'id': 999, 'name': '其他', 'code':'shuiguoqita','color':0,'length':0,'garden':0,'nature':0},
               {'id': 1999, 'name': '其他', 'code':'ganguoqita','color':0,'length':0,'garden':0,'nature':0},
               {'id': 2000, 'name': '其他','code':'TDSG','color':0,'length':2,'garden':0,'nature':0},

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
