import urllib
import urllib2
import cookielib
import re
import webbrowser
from bs4 import BeautifulSoup
import requests

class Taobao:
    def __init__(self):
        self.loginURL = "https://login.taobao.com/member/login.jhtml"
        self.proxyURL = 'http://117.168.49.72'
        proxyURL_list=["119.131.157.176","117.147.233.140","117.84.182.12","112.112.136.233","175.184.155.204","182.40.51.145","175.184.161.61","115.228.54.176","117.173.203.63","117.168.49.72","115.228.63.65","223.151.80.139","175.184.163.101","175.175.93.113","223.67.169.185"]
        self.loginHeaders =  {
            'Host':'login.taobao.com',
            'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:35.0) Gecko/20100101 Firefox/35.0',
            'Referer' : 'https://login.taobao.com/member/login.jhtml',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Connection' : 'Keep-Alive'
        }
        self.username = 'cqcre'
        self.ua = '191UW5TcyMNYQwiAiwTR3tCf0J/QnhEcUpkMmQ=|Um5Ockt0TXdPc011TXVKdyE=|U2xMHDJ+H2QJZwBxX39Rb1d5WXcrSixAJ1kjDVsN|VGhXd1llXGNaYFhkWmJaYl1gV2pIdUtyTXRKfkN4Qn1FeEF6R31TBQ==|VWldfS0TMw8xDjYWKhAwHiUdOA9wCDEVaxgkATdcNU8iDFoM|VmNDbUMV|V2NDbUMV|WGRYeCgGZhtmH2VScVI2UT5fORtmD2gCawwuRSJHZAFsCWMOdVYyVTpbPR99HWAFYVMpUDUFORshHiQdJR0jAT0JPQc/BDoFPgooFDZtVBR5Fn9VOwt2EWhCOVQ4WSJPJFkHXhgoSDVIMRgnHyFqQ3xEezceIRkmahRqFDZLIkUvRiEDaA9qQ3xEezcZORc5bzk=|WWdHFy0TMw8vEy0UIQE0ADgYJBohGjoAOw4uEiwXLAw2DThuOA==|WmBAED5+KnIbdRh1GXgFQSZbGFdrUm1UblZqVGxQa1ZiTGxQcEp1I3U=|W2NDEz19KXENZwJjHkY7Ui9OJQsre09zSWlXY1oMLBExHzERLxsuE0UT|XGZGFjh4LHQdcx5zH34DRyBdHlFtVGtSaFBsUmpWbVBkSmpXd05zTnMlcw==|XWdHFzl5LXUJYwZnGkI/VitKIQ8vEzMKNws3YTc=|XmdaZ0d6WmVFeUB8XGJaYEB4TGxWbk5yTndXa0tyT29Ta0t1QGBeZDI='
        self.password2 = '7511aa6854629e45de220d29174f1066537a73420ef6dbb5b46f202396703a2d56b0312df8769d886e6ca63d587fdbb99ee73927e8c07d9c88cd02182e1a21edc13fb8e140a4a2a4b53bf38484bd0e08199e03eb9bf7b365a5c673c03407d812b91394f0d3c7564042e3f2b11d156aeea37ad6460118914125ab8f8ac466f'
        
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
        self.opener = urllib2.build_opener(self.cookieHandler,self.proxy,urllib2.HTTPHandler)
        self.J_HToken = ''
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
            'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:35.0) Gecko/20100101 Firefox/35.0',
            'Host':'login.taobao.com',
            'Connection' : 'Keep-Alive'
        }
        request = urllib2.Request(stURL,headers = headers)
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
            # r=requests.get("http://waimai.taobao.com/shop_list.htm?spm=a221y.7437588.0.0.GsL9MZ&page=1&cateId=109&city=420100")
            goodsURL = 'http://waimai.taobao.com/shop_list.htm?spm=a221y.7437588.0.0.m0K9Ee&page=1&posy=11434388&posx=3055056&orderby=recommend&cateId=109&addressId=14387897'
            headers = {
                'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:35.0) Gecko/20100101 Firefox/35.0',
                'Host':'waimai.taobao.com',
                'Connection' : 'Keep-Alive'
            }
            goodsrequest = urllib2.Request(goodsURL,headers = headers)
            response = self.newOpener.open(goodsrequest)
            resrult =  response.read().decode('gbk')
            status = response.getcode()
            print(status)
            soup = BeautifulSoup(resrult,"lxml",from_encoding="utf-8")
            shop_items = soup.findAll("div",{"class":"shop_item_detail"})
            for x in shop_items:
                shop_link = x.findAll("a")[0]["href"]
                shopURL = 'http:'+shop_link
                headers = {
                    'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:35.0) Gecko/20100101 Firefox/35.0',
                    'Host':'waimai.taobao.com',
                    'Connection' : 'Keep-Alive'
                }
                shop_request = urllib2.Request(shopURL,headers = headers)
                shop_response = self.newOpener.open(shop_request)
                shop_resrult =  shop_response.read().decode('gbk')
                shop_soup = BeautifulSoup(shop_resrult,"lxml",from_encoding="utf-8")
                shop_main = shop_soup.findAll("div",{"id":"content"})

                for shop in shop_main:
                    shop_info = shop.findAll("div",{"class":"some-info"})[0]
                    shop_name = shop_info.findAll("b")[0].string
                    shop_address = shop_info.findAll("div",{"class":"store-add"})[0].string
                    shop_phone = shop_info.find("div",{"class":"store-tel"}).find("span").string

                    delivery_info = shop.findAll("div",{"class":"delivery-info-wrap"})[0]
                    delivery_freight = delivery_info.findAll("span")[0].string
                    delivery_mincharge = delivery_info.findAll("span")[1].string
                    delivery_time = delivery_info.findAll("span")[2].string
                    delivery_area = delivery_info.findAll("span")[3].string

                    page_box=shop.findAll("div",{"class":"dpl-paginator"})[0]
                    print("page_box",page_box)
                    page_len=len(page_box.findAll("a"))
                    page_total=int(page_box.findAll("a")[page_len-2].string)

                    print(shop_name)
                    print(shop_address)
                    print(shop_phone)
                    print(delivery_freight)
                    print(delivery_mincharge)
                    print(delivery_time)
                    print(delivery_area)
                    print(page_total)

                    for i in range(page_total):  
                        goods_link='http:'+shop_link+"&page="+str(i)
                        goods_response = requests.get(goods_link)
                        goods_resrult = goods_response.content

                        goods_soup = BeautifulSoup(goods_resrult,"lxml",from_encoding="utf-8")
                        page_new_box=goods_soup.findAll("div",{"class":"dpl-paginator"})[0]
                        page_new =int(page_new_box.findAll("a")[page_len-2].string)

                        if page_new > page_total:
                            page_total = page_new
                        print("total_page",page_total,"now page at",i,"shop_name",shop_name,"page_new",page_new)
                        goods_item = goods_soup.find("ul",{"class":"menu-list"}).findAll("li")

                        for goods in goods_item:
                            goods_name = goods.find("a",{"class":"dish-name"}).string
                            goods_price = goods.find("span",{"class":"price-format"}).find("strong").string
                            goods_sales = goods.find("span",{"class":"sales-num"}).find("b").string
                            recommend = goods.find("div",{"class":"goods-mark"})
                            if recommend:
                                recommend="recommend"
                            good_img_url = goods.find("img")["src"]

                            print(goods_name)
                            print(goods_price)
                            print(goods_sales)

        else:
            print u"login fail"



taobao = Taobao()
taobao.main()