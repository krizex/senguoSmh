# -*- coding: UTF-8 -*- 
import urllib
import urllib2
import cookielib
import re
import webbrowser
from bs4 import BeautifulSoup
import requests
import openpyxl
from openpyxl import Workbook
import datetime
import json

proxyURL_list=["http://119.131.157.176","http://117.147.233.140","http://117.84.182.12","http://112.112.136.233","http://175.184.155.204","http://182.40.51.145","http://175.184.161.61","http://115.228.54.176","http://117.173.203.63","http://117.168.49.72","http://115.228.63.65","http://223.151.80.139","http://175.184.163.101","http://175.175.93.113","http://223.67.169.185"]

wb = Workbook()
ws = wb.active
ws.append(["店铺名","店铺地址","店铺电话","店铺公告","配送费","起送金额","配送时间","配送范围","店铺链接"])

class Taobao:
    def __init__(self):
        self.loginURL = "https://login.taobao.com/member/login.jhtml"
        self.proxyURL = proxyURL_list[5]
        self.loginHeaders =  {
            'Host':'login.taobao.com',
            'User-Agent' : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.89 Safari/537.36',
            'Referer' : 'https://login.taobao.com/member/login.jhtml',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Connection' : 'Keep-Alive'
        }
        # self.username = 'cqcre'
        # self.ua = '191UW5TcyMNYQwiAiwTR3tCf0J/QnhEcUpkMmQ=|Um5Ockt0TXdPc011TXVKdyE=|U2xMHDJ+H2QJZwBxX39Rb1d5WXcrSixAJ1kjDVsN|VGhXd1llXGNaYFhkWmJaYl1gV2pIdUtyTXRKfkN4Qn1FeEF6R31TBQ==|VWldfS0TMw8xDjYWKhAwHiUdOA9wCDEVaxgkATdcNU8iDFoM|VmNDbUMV|V2NDbUMV|WGRYeCgGZhtmH2VScVI2UT5fORtmD2gCawwuRSJHZAFsCWMOdVYyVTpbPR99HWAFYVMpUDUFORshHiQdJR0jAT0JPQc/BDoFPgooFDZtVBR5Fn9VOwt2EWhCOVQ4WSJPJFkHXhgoSDVIMRgnHyFqQ3xEezceIRkmahRqFDZLIkUvRiEDaA9qQ3xEezcZORc5bzk=|WWdHFy0TMw8vEy0UIQE0ADgYJBohGjoAOw4uEiwXLAw2DThuOA==|WmBAED5+KnIbdRh1GXgFQSZbGFdrUm1UblZqVGxQa1ZiTGxQcEp1I3U=|W2NDEz19KXENZwJjHkY7Ui9OJQsre09zSWlXY1oMLBExHzERLxsuE0UT|XGZGFjh4LHQdcx5zH34DRyBdHlFtVGtSaFBsUmpWbVBkSmpXd05zTnMlcw==|XWdHFzl5LXUJYwZnGkI/VitKIQ8vEzMKNws3YTc=|XmdaZ0d6WmVFeUB8XGJaYEB4TGxWbk5yTndXa0tyT29Ta0t1QGBeZDI='
        # self.password2 = '7511aa6854629e45de220d29174f1066537a73420ef6dbb5b46f202396703a2d56b0312df8769d886e6ca63d587fdbb99ee73927e8c07d9c88cd02182e1a21edc13fb8e140a4a2a4b53bf38484bd0e08199e03eb9bf7b365a5c673c03407d812b91394f0d3c7564042e3f2b11d156aeea37ad6460118914125ab8f8ac466f'
        self.username="18162664593"

        self.ua="168UW5TcyMNYQwiAiwTR3tCf0J%2FQnhEcUpkMmQ%3D%7CUm5Ockt1TnFIfUN3TnBOciQ%3D%7CU2xMHDJ%2BH2QJZwBxX39Rb1N9XXM1VDJOPxFHEQ%3D%3D%7CVGhXd1llXGJZZl9qVGBZZl5lUm9NdE91S3VIcUtzTXZIc053TGI0%7CVWldfS0RMQ04DCwSMhxzR3RaDFo%3D%7CVmNDbUMV%7CV2NDbUMV%7CWGRYeCgGZhtmH2VScVI2UT5fORtmD2gCawwuRSJHZAFsCWMOdVYyVTpbPR99HWAFYU9vQW85bw%3D%3D%7CWWdHFykVKQk8BycYJBgjAzYMNhYpESoXNwsyCzYWKRAlHz8DOgY4bjg%3D%7CWmNDEz0TMw03CysSLBU1DTAJPGo8%7CW2FBET8RMQ0tFi4VIXch%7CXGZGFjgWNgsrHiMbIHYg%7CXWdHFzkXNwsrHiIbJHIk%7CXmdHFzkXNw82DCwVKhY2AzcMOW85%7CX2VFFTsVNQgoFCgSLxpMGg%3D%3D%7CQHpaCiQKKhY2CjQJNApcCg%3D%3D%7CQXlZCScJKXlGekZmWWNeCCgVNRs1FSkXKhYpfyk%3D%7CQnhYCCYIKBU1CTcDOQNVAw%3D%3D%7CQ3lZCScJKRU1CjcONgpcCg%3D%3D%7CRHxcDCIMLHxFf19mX2YwEC0NIw0tEi8WLhZAFg%3D%3D%7CRXxcDCJiNm4TegdmDUEmXTgWNgo0ADkZJx8nBzgEOQQ5bzk%3D%7CRn5eDiB%2FJGI2TyZcJlg%2FRCh8QG5OHiIcJxs7BToGUHBNbUNtTXJOdk53IXc%3D%7CR31dDSN8J2E1TCVfJVs8Ryt%2FQ21NcVFuUmpSZjBm%7CSHBQAC4AIHBMc0t%2BXmBabzkZJAQqBCQbJBwnE0UT%7CSXNTAy1yKW87QitRK1UySSVxTWNDfl5hXmZcZzFn%7CSnBQAC5uOnMUeBVWMEk1SBx9U3NPb1BvVGxTBVM%3D%7CS3NTAy1tOWEddxJzDlYrQj9eNRs7a1dpVWhIcUtxJwc6GjQaOgU8AzsAVgA%3D%7CTHZWBihoPHUSfhNQNk8zThp7VXVIaFduUWpSBFI%3D%7CTXdXBylpPWUZcxZ3ClIvRjtaMR8%2FAyMcJRogH0kf%7CTnRUBCpqPmYacBV0CVEsRThZMhw8ASEeJxkgGkwa%7CT3VVBSsFJRg4Bz4AOAdRBw%3D%3D%7CcEl0SWlUdEtrV25Sckx0Tm5WYkJ4QGBcYFl5RWVff0F1VWtefkB6WmREekJiXGVFcVFvUHBOclJpSWhRcUhoV21NclJtVXVKc1NyTm5Rbk5xTW1Sb09zRxE%3D"

        self.password2="127d393a8ccfe6adc1470f30dd4a8c395aed8ad6830f448ec75154f81dcb553c5e94129cc1fa47122bdcf9af8c9225822e68028ec00346eac4c182a56cb1ada66f928247d1b75b9eeea06cf69b56226a0d2f7ec844199968685b318cb506500464ed01399123a3a9b8df74e6c8bdd3d0e71f737c6bf1d3eaa50b86521e0785bf"

        
        self.post = post = {
            'ua':self.ua,
            'TPL_checkcode':'',
            'CtrlVersion': '1,0,0,7',
            'TPL_password':'',
            'TPL_redirect_url':'http://waimai.taobao.com/shop_list.htm?spm=a221y.7437588.0.0.GsL9MZ&page=1&cateId=109&city=420100',
            'TPL_username':self.username,
            'loginsite':'0',
            'newlogin':'0',
            'from':'tb',
            'fc':'default',
            'style':'default',
            'css_style':'',
            'tid':'XOR_1_000000000000000000000000000000_625C4720470A0A050976770A',
            'support':'000001',
            'loginType':'4',
            'minititle':'',
            'minipara':'',
            'umto':'NaN',
            'pstrong':'3',
            'llnick':'',
            'sign':'',
            'need_sign':'',
            'isIgnore':'',
            'full_redirect':'',
            'popid':'',
            'callback':'',
            'guf':'',
            'not_duplite_str':'',
            'need_user_id':'',
            'poy':'',
            'gvfdcname':'10',
            'gvfdcre':'',
            'from_encoding ':'',
            'sub':'',
            'TPL_password_2':self.password2,
            'loginASR':'1',
            'loginASRSuc':'1',
            'allp':'',
            'oslanguage':'zh-CN',
            'sr':'1366*768',
            'osVer':'windows|6.1',
            'naviVer':'firefox|35'
        }
        self.postData = urllib.urlencode(self.post)
        self.proxy = urllib2.ProxyHandler({'http':self.proxyURL})
        self.cookie = cookielib.LWPCookieJar()
        self.cookieHandler = urllib2.HTTPCookieProcessor(self.cookie)
        self.opener = urllib2.build_opener(self.proxy,self.cookieHandler,urllib2.HTTPHandler)
        self.J_HToken = ''
        urllib2.install_opener(self.opener)
        self.newCookie = cookielib.CookieJar()
        self.newCookieHandler = urllib2.HTTPCookieProcessor(self.newCookie)
        self.newOpener = urllib2.build_opener(self.newCookieHandler)

    def needCheckCode(self):
        request = urllib2.Request(self.loginURL,self.postData,self.loginHeaders)
        response = self.opener.open(request)
        content = response.read().decode('gbk')
        status = response.getcode()
        if status == 200:
            print u"get access"
            pattern = re.compile(u'\u8bf7\u8f93\u5165\u9a8c\u8bc1\u7801',re.S)
            result = re.search(pattern,content)
            if result:
                print u"you need to input checkcode"
                return content
            else:
                tokenPattern = re.compile('id="J_HToken" value="(.*?)"')
                tokenMatch = re.search(tokenPattern,content)
                if tokenMatch:
                    self.J_HToken = tokenMatch.group(1)
                    print u"dont need checkcode"
                    return False
        else:
            print u"get fail"
            return None

    def getCheckCode(self,page):
        pattern = re.compile('<img id="J_StandardCode_m.*?data-src="(.*?)"',re.S)
        matchResult = re.search(pattern,page)
        if matchResult and matchResult.group(1):
            return matchResult.group(1)
        else:
            print u"didnt finf checkcode"
            return False


    def loginWithCheckCode(self):
        checkcode = raw_input('please input checkcode:')
        self.post['TPL_checkcode'] = checkcode
        self.postData = urllib.urlencode(self.post)
        try:
            request = urllib2.Request(self.loginURL,self.postData,self.loginHeaders)
            response = self.opener.open(request)
            content = response.read().decode('gbk')
            pattern = re.compile(u'\u9a8c\u8bc1\u7801\u9519\u8bef',re.S)
            result = re.search(pattern,content)
            # soup = BeautifulSoup(content,'lxml')
            # print(soup.find(attrs={"class":"error"}))
            if result:
                print u"wrong checkcode"
                return False
            else:
                tokenPattern = re.compile('id="J_HToken" value="(.*?)"')
                tokenMatch = re.search(tokenPattern,content)
                if tokenMatch:
                    print u"right checkcode"
                    self.J_HToken = tokenMatch.group(1)
                    return tokenMatch.group(1)
                else:
                    print u"J_Token fail"
                    return False
        except urllib2.HTTPError, e:
            print u"server connenting fail",e.reason
            return False


    def getSTbyToken(self,token):
        tokenURL = 'https://passport.alipay.com/mini_apply_st.js?site=0&token=%s&callback=stCallback6' % token
        request = urllib2.Request(tokenURL)
        response = urllib2.urlopen(request)
        pattern = re.compile('{"st":"(.*?)"}',re.S)
        result = re.search(pattern,response.read())
        if result:
            print u"get st success"
            st = result.group(1)
            return st
        else:
            print u"didnt match st"
            return False

    def loginByST(self,st,username):
        stURL = 'https://login.taobao.com/member/vst.htm?st=%s&TPL_username=%s' % (st,username)
        headers = {
            'User-Agent' : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.89 Safari/537.36',
            'Host':'login.taobao.com',
            'Connection' : 'Keep-Alive'
        }
        request = urllib2.Request(stURL,headers=headers)
        response = self.newOpener.open(request)
        content =  response.read().decode('gbk')
        pattern = re.compile('top.location = "(.*?)"',re.S)
        match = re.search(pattern,content)
        if match:
            print u"login success"
            location = match.group(1)
            return True
        else:
            print "login fail"
            return False

    def getListPage(self,addressId):
        URL = 'http://waimai.taobao.com/shop_list.htm?spm=a221y.7437588.0.0.m0K9Ee&page=1&posy=11434388&posx=3055056&orderby=recommend&cateId=109&addressId='+addressId
        headers = {
            'User-Agent' : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.89 Safari/537.36',
            'Host':'waimai.taobao.com',
            'Connection' : 'Keep-Alive'
        }
        shoplist_request = urllib2.Request(URL,headers=headers)
        shoplist_response = self.newOpener.open(shoplist_request)
        shoplist_result =  shoplist_response.read().decode('gbk')
        soup = BeautifulSoup(shoplist_result,"lxml",from_encoding="utf-8")
        page_item = soup.find("input",{"id":"J_page_count"})
        if page_item:
            page_count = int(soup.find("input",{"id":"J_page_count"})["value"])
        else:
            page_count = 1
        return page_count

    def handleData(self,addressId):
        page_count = self.getListPage(addressId)
        print(page_count,"iam list page")
        shop_info_list = []
        for i in range(page_count):
            i=i+1
            shoplistURL = 'http://waimai.taobao.com/shop_list.htm?spm=a221y.7437588.0.0.m0K9Ee&page='+str(i)+'&posy=11434388&posx=3055056&orderby=recommend&cateId=109&addressId='+addressId
            # print(shoplistURL)
            headers = {
                'User-Agent' : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.89 Safari/537.36',
                'Host':'waimai.taobao.com',
                'Connection' : 'Keep-Alive'
            }
            shoplist_request = urllib2.Request(shoplistURL,headers=headers)
            shoplist_response = self.newOpener.open(shoplist_request)
            shoplist_result =  shoplist_response.read().decode('gbk')
            status = shoplist_response.getcode()

            
            too_much = re.compile(u'\u9A8C\u8BC1\u7801',re.S)
            too_much_result = re.search(too_much,shoplist_result)
            if too_much_result:
                print(shoplist_result)
                print("send get too much  watch out")

            limit_infot = re.compile(u'\u8BBF\u95EE\u53D7\u9650\u4E86',re.S)
            limit_result = re.search(limit_infot,shoplist_result)
            if limit_result:
                print(shoplist_result)
                print("access been limited")

            soup = BeautifulSoup(shoplist_result,"lxml",from_encoding="utf-8")
            shop_items = soup.select(".shop_list_item")
            # print(shop_items)
            shopUrlList = []
            for x in shop_items:
                shop_link = x.findAll("a",limit=1)[0]["href"]
                shop_logo = x.find("img")
                if shop_logo:
                    shop_logo = shop_logo["src"]
                shopURL = 'http:'+shop_link
                shopUrlList.append(shopURL)
                # print(shopURL)

                shop_request = urllib2.Request(shopURL,headers=headers)
                shop_response = self.newOpener.open(shop_request)
                shop_resrult =  shop_response.read().decode('gbk')

                shop_soup = BeautifulSoup(shop_resrult,"lxml",from_encoding="utf-8")
                shop = shop_soup.find("div",{"id":"content"})
                shop_info = shop.find("div",{"class":"some-info"})
                shop_name = shop_info.findAll("b",limit=1)[0].string
                shop_address = shop_info.select(".store-add")[0].string.strip()
                shop_phone = shop_info.select(".store-tel")[0].find("span").string.strip()
                shop_notice = shop.select(".store-notice-main")[0].string.strip()

                delivery_info = shop.select(".delivery-info-wrap")[0]
                delivery_dom = delivery_info.findAll("span")
                delivery_freight = delivery_dom[0].string.strip()
                delivery_mincharge = delivery_dom[1].string.strip()
                delivery_time = delivery_dom[2].text.replace('<br>','\n').strip()
                delivery_area = delivery_dom[3].string.strip()

                ws.append([shop_name,shop_address,shop_phone,shop_notice,delivery_freight,delivery_mincharge,delivery_time,delivery_area,shop_link])
                shop_info_list.append({"店铺名":shop_name,"店铺地址":shop_address,"店铺电话":shop_phone,"店铺公告":shop_notice,"配送费":delivery_freight,"起送金额":delivery_mincharge,"配送时间":delivery_time," 配送范围":delivery_area,"店铺链接":shopURL,"shop_logo":shop_logo})

               
                b = shop.findAll("div",{"class":"dpl-paginator"})
                if  b != []:
                    page_box = b[0]
                    page_len = len(page_box.findAll("a"))
                    page_total = int(page_box.findAll("a")[page_len-2].string)
                else:
                    page_total = 1

                print(shop_name,page_total)

                for i in range(page_total): 
                    i=i+1
                    goods_link='http:'+shop_link+"&page="+str(i)
                    goods_response = requests.get(goods_link)
                    goods_resrult = goods_response.content

                    goods_soup = BeautifulSoup(goods_resrult,"lxml",from_encoding="utf-8")
                    r = goods_soup.findAll("div",{"class":"dpl-paginator"})
                    page_new=0
                    if r !=[]:
                        page_new_box = r[0]
                        page_new_len = len(page_new_box.findAll("a"))
                        page_new_text = page_new_box.findAll("a")[page_new_len-1].string
                        if page_new_text:
                            page_new = int(page_new_text)
                        else:
                            page_new = page_total
                        if page_new > page_total:
                            page_total = page_new
                    print("total_page",page_total,"now page at",i,"shop_name",shop_name,"page_new",page_new)

                    menu_item = goods_soup.find("ul",{"class":"menu-list"})
                    # print(menu_item)
                    goods_list = []
                    if menu_item:
                        goods_item = menu_item.findAll("li")
                        print(len(goods_item),"goods_item length")
                        for goods in goods_item:
                            # print(goods,'iam goods')
                            shop_id = goods.find("div",{"class":"shopping_data"})["shop_id"]
                            print(shop_id,"shop_id")
                            goods_name = goods.find("a",{"class":"dish-name"}).string
                            goods_price = goods.find("span",{"class":"price-format"}).find("strong").string
                            goods_sales = goods.find("span",{"class":"sales-num"}).find("b").string
                            recommend = goods.find("div",{"class":"goods-mark"})
                            if recommend:
                                recommend="recommend"
                            good_img_url = goods.find("img")["src"]

                            goods_list.append({"商品名":goods_name,"价格":goods_price,"销量":goods_sales,"商品图片":good_img_url,"店铺id":shop_id})

                    shop_info_list.append({"商品信息":goods_list})
        

        print(shop_info_list)
        wb.save("sample.xlsx")

    def setAddress(self):
        wh_area=["上海街道","大智街道","一元街道","车站街道","四唯街道","永清街道","西马街道","球场街道","劳动街道","二七街道","新村街道","丹水池街道","台北街道","花桥街道","谌家矶街道","后湖街道","积玉桥街道","杨园街道","徐家棚街道","南湖街道","粮道街道","中华路街道","黄鹤楼街道","紫阳街道","白沙洲街道","首义路街道","中南路街道","水果湖街道","珞珈山街道","石洞街道",
"民族街道","花楼街道","水塔街道","民权街道","满春街道","民意街道","新华街道","万松街道","唐家墩街道","北湖街道","前进街道","常青街道","汉兴街道",
"易家墩街道","韩家墩街道","宗关街道","汉水桥街道","宝丰街道","荣华街道","崇仁街道","汉中街道","汉正街道","六角亭街道","长丰街道",
"翠微街道","建桥街道","月湖街道","晴川街道","鹦鹉街道","洲头街道","五里墩街道","琴断口街道","江汉二桥街道","永丰街道","江堤街道",
"红卫路街道",'钢花村街道','冶金街道',"新沟桥街道","红钢城街道","工人村街道","青山镇街道","厂前街道","武东街道","白玉山街道","钢都花园街道","北湖街道","武钢厂区",
"珞南街道","关山街道","狮子山街道","张家湾街道","梨园街道","卓刀泉街道","洪山街道","和平街道","青菱街道","天兴乡",
"吴家山街道","柏泉街道街道","将军路街道","慈惠街道","走马岭街道","径河街道","长青街道","辛安渡街道街道","东山街道街道","常青花园新区街道","新沟镇街道","金银湖街道",
"纱帽街道","东荆街道","湘口街道","邓南街道","蔡甸街道","奓山街道","永安街道","侏儒街道","大集街道","张湾街道","玉贤镇","索河镇","消泗乡","桐湖农场",'洪北农业示范区',
"纸坊街道","金口街道","乌龙泉街道","郑店街道","五里界街道","庙山街道","金水街道",'藏龙岛街道',"法泗镇","安山街道","湖泗镇","山坡乡","舒安乡","梁子湖风景区",
"前川街道","祁家湾街道","横店街道","罗汉寺街道",'滠口街道','六指街道',"天河街道","武湖街道","姚家集镇","蔡家榨镇","王家河镇","李家集镇","长轩岭镇","三里镇","蔡店乡","木兰乡","木兰山风景管理处","大潭原种场","武汉盘龙城经济开发区","邾城街道","阳逻街道","仓埠街道","汪集街道","李集街道","三店街道","潘塘街道","旧街街道","双柳街道","涨渡湖街道","辛冲镇","徐古镇","凤凰镇","道观河风景旅游区","武汉阳逻经济开发区"]

        for i in range(len(wh_area)):
            area = wh_area[i]
            print(area)
            # headers = {
            #     'User-Agent' : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.89 Safari/537.36',
            #     'Host':'waimai.taobao.com',
            #     'Connection' : 'Keep-Alive',
            #     'Referer':'http://waimai.taobao.com/my_address.htm?spm=a221y.7437588.0.0.8PbTh3&city=420100'
            # }
            # maplink="http://waimai.taobao.com/asynJsonQuery.do?action=userAddressOperateAction&event_submit_do_getPosxyByAddress=true&cityname=武汉&address="+area
            # map_request = urllib2.Request(maplink,headers=headers)
            # map_response = self.newOpener.open(map_request)
            # map_result =  map_response.read().decode('gbk')
            # _tb_token_=TFy2vVmVDZzHCl9&city=420100&location=shopList&posx=%0D%0A30.55036&posy=114.30998%0D%0A&id=14387778&errorMsg=&targetUrl=&keyword=%CE%E4%BA%BA%CA%D0%C1%B8%B5%C0%BD%D6
            url = "http://api.map.baidu.com/geocoder/v2/?address= 湖北省武汉市"+area+"&output=json&ak=2595684c343d6499bf469da8a9c18231"
            r = requests.get(url)
            result = json.loads(r.text)
            if result["status"] == 0:
                lat = result["result"]["location"]["lat"]
                lon = result["result"]["location"]["lng"]
            # print(lat,lon)

            headers =  {
                'Host':'waimai.taobao.com',
                'User-Agent' : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.89 Safari/537.36',
                'Referer' : 'http://waimai.taobao.com/my_address.htm',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Connection' : 'Keep-Alive'
            }
            change_link = "http://waimai.taobao.com/my_address.htm"
            change_data={
                "_tb_token_":"TFy2vVmVDZzHCl9",
                "city":420100,
                "location":"shopList",
                "posx":lat,
                "posy":lon,
                "id":14388453,
                "errorMsg":"",
                "targetUrl":"",
                "keyword":"%CE%E4%BA%BA%CA%D0%C1%B8%B5%C0%BD%D6"
            }
            data=urllib.urlencode(change_data)
            change_request = urllib2.Request(change_link,data,headers)
            change_response = self.newOpener.open(change_request)
            change_content = change_response.read().decode('gbk')
            print(change_content)
            self.handleData('14388453')


    def main(self):
        needResult = self.needCheckCode()
        if not needResult ==None:
            if not needResult == False:
                print u"you need to input checkcode"
                checkCode = self.getCheckCode(needResult)
                if not checkCode == False:
                    print u"get checkcode success"
                    print u"please input checkcode in brower"
                    webbrowser.open_new_tab(checkCode)
                    self.loginWithCheckCode()
                else:
                    print u"get checkcode fail,please try again"
            else:
                print u"dont need input checkcode"
        else:
            print u"cant sure if need checkcode"


        if not self.J_HToken:
            print "get token failed,please try again"
            return
        st = self.getSTbyToken(self.J_HToken)
        result = self.loginByST(st,self.username)

        if result:
            self.setAddress()
            # self.handleData('14387897')
        else:
            print u"login fail"



taobao = Taobao()
taobao.main()