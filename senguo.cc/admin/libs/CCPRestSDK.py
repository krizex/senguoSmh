    #-*- coding: UTF-8 -*-
    #  Copyright (c) 2014 The CCP project authors. All Rights Reserved.
    #
    #  Use of this source code is governed by a Beijing Speedtong Information Technology Co.,Ltd license
    #  that can be found in the LICENSE file in the root of the web site.
    #
    #   http://www.yuntongxun.com
    #
    #  An additional intellectual property rights grant can be found
    #  in the file PATENTS.  All contributing project authors may
    #  be found in the AUTHORS file in the root of the source tree.

# import md5
from hashlib import md5
import base64
import datetime
# import urllib2
import urllib.request as urllib2
import json
from libs.xmltojson import xmltojson
from xml.dom import minidom 
import requests

class REST:
    
    AccountSid=''
    AccountToken=''
    AppId=''
    SubAccountSid=''
    SubAccountToken=''
    VoIPAccount=''
    VoIPPassword=''
    ServerIP=''
    ServerPort=''
    SoftVersion=''
    Iflog=False #是否打印日志
    Batch=''  #时间戳
    BodyType = 'json'#包体格式，可填值：json 、xml
    
     # 初始化
     # @param serverIP       必选参数    服务器地址
     # @param serverPort     必选参数    服务器端口
     # @param softVersion    必选参数    REST版本号
    def __init__(self,ServerIP,ServerPort,SoftVersion):

        self.ServerIP = ServerIP;
        self.ServerPort = ServerPort;
        self.SoftVersion = SoftVersion;
    
    
    # 设置主帐号
    # @param AccountSid  必选参数    主帐号
    # @param AccountToken  必选参数    主帐号Token
    
    def setAccount(self,AccountSid,AccountToken):
      self.AccountSid = AccountSid;
      self.AccountToken = AccountToken;   
    

    # 设置子帐号
    # 
    # @param SubAccountSid  必选参数    子帐号
    # @param SubAccountToken  必选参数    子帐号Token
    # @param VoIPAccount  必选参数    VoIP帐号
    # @param VoIPPassword  必选参数    VoIP密码
 
    def setSubAccount(self,SubAccountSid,SubAccountToken,VoIPAccount,VoIPPassword):
      self.SubAccountSid = SubAccountSid;
      self.SubAccountToken = SubAccountToken;
      self.VoIPAccount = VoIPAccount;
      self.VoIPPassword = VoIPPassword;     

    # 设置应用ID
    # 
    # @param AppId  必选参数    应用ID

    def setAppId(self,AppId):
       self.AppId = AppId; 
    
    def log(self,url,body,data):
        print('这是请求的URL：')
        print (url);
        print('这是请求包体:')
        print (body);
        print('这是响应包体:')
        print (data);
        print('********************************')
    

    # 创建子账号
    # @param friendlyName   必选参数      子帐号名称
    def CreateSubAccount(self, friendlyName):
        
        self.accAuth()
        nowdate = datetime.datetime.now()
        self.Batch = nowdate.strftime("%Y%m%d%H%M%S")
        #生成sig
        signature = self.AccountSid + self.AccountToken + self.Batch;
        sig = md5.new(signature).hexdigest().upper()
        #拼接URL
        url = "https://"+self.ServerIP + ":" + self.ServerPort + "/" + self.SoftVersion + "/Accounts/" + self.AccountSid + "/SubAccounts?sig=" + sig
        #生成auth
        src = self.AccountSid + ":" + self.Batch;
        auth = base64.encodestring(src).strip()
        req = urllib2.Request(url)
        self.setHttpHeader(req)
        req.add_header("Authorization", auth)
        #xml格式
        body ='''<?xml version="1.0" encoding="utf-8"?><SubAccount><appId>%s</appId>\
            <friendlyName>%s</friendlyName>\
            </SubAccount>\
            '''%(self.AppId, friendlyName)
        
        if self.BodyType == 'json': 
            #json格式
            body = '''{"friendlyName": "%s", "appId": "%s"}'''%(friendlyName,self.AppId)
        data=''
        # print(body,'bodybodybodybody')
        req.add_data(body)
        try:
            res = urllib2.urlopen(req);
            data = res.read()
            res.close()
        
            if self.BodyType=='json':
                #json格式
                locations = json.loads(data)
            else:
                #xml格式
                xtj=xmltojson()
                locations=xtj.main(data)
            if self.Iflog:
                self.log(url,body,data)
            return locations
        except Exception as error:
            if self.Iflog:
                self.log(url,body,data)
            return {'172001':'您的网络暂时不通畅，请稍候再试'}
    
    #  获取子帐号
    # @param startNo  可选参数    开始的序号，默认从0开始
    # @param offset 可选参数     一次查询的最大条数，最小是1条，最大是100条
    def getSubAccounts(self, startNo,offset):

        self.accAuth()
        nowdate = datetime.datetime.now()
        self.Batch = nowdate.strftime("%Y%m%d%H%M%S")
        #生成sig
        signature = self.AccountSid + self.AccountToken + self.Batch;
        sig = md5.new(signature).hexdigest().upper()
        #拼接URL
        url = "https://"+self.ServerIP + ":" + self.ServerPort + "/" + self.SoftVersion + "/Accounts/" + self.AccountSid + "/GetSubAccounts?sig=" + sig
        #生成auth
        src = self.AccountSid + ":" + self.Batch;
        auth = base64.encodestring(src).strip()

        # req = urllib2.Request(url)
        # self.setHttpHeader(req)
        # req.add_header("Authorization", auth)
        headers = {'Authorization':auth}
        #xml格式
        body ='''<?xml version="1.0" encoding="utf-8"?><SubAccount><appId>%s</appId>\
            <startNo>%s</startNo><offset>%s</offset>\
            </SubAccount>\
            '''%(self.AppId, startNo, offset)
        
        if self.BodyType == 'json':   
            #json格式 
            body = '''{"appId": "%s", "startNo": "%s", "offset": "%s"}'''%(self.AppId,startNo,offset)
        data=''
        # print(body)
        # req.add_data(body)
        try:
            # res = urllib2.urlopen(req);
            # data = res.read()
            # res.close()
            res = requests.post(url,data=body,headers=headers)
            s = res.text
            # print(s)
        
            if self.BodyType=='json':
                #json格式
                locations = json.loads(data)
            else:
                #xml格式
                xtj=xmltojson()
                locations=xtj.main(data)
            if self.Iflog:
                self.log(url,body,data)
            return locations
        except Exception as error:
            if self.Iflog:
                self.log(url,body,data)
            return {'172001':'您的网络暂时不通畅，请稍候再试'}

    # 子帐号信息查询
    # @param friendlyName 必选参数   子帐号名称

    def querySubAccount(self, friendlyName):

        self.accAuth()
        nowdate = datetime.datetime.now()
        self.Batch = nowdate.strftime("%Y%m%d%H%M%S")
        #生成sig
        signature = self.AccountSid + self.AccountToken + self.Batch;
        sig = md5.new(signature).hexdigest().upper()
        #拼接URL
        url = "https://"+self.ServerIP + ":" + self.ServerPort + "/" + self.SoftVersion + "/Accounts/" + self.AccountSid + "/QuerySubAccountByName?sig=" + sig
        #生成auth
        src = self.AccountSid + ":" + self.Batch;
        auth = base64.encodestring(src).strip()
        req = urllib2.Request(url)
        self.setHttpHeader(req)
        
        req.add_header("Authorization", auth)
        
        #创建包体
        body ='''<?xml version="1.0" encoding="utf-8"?><SubAccount><appId>%s</appId>\
            <friendlyName>%s</friendlyName>\
            </SubAccount>\
            '''%(self.AppId, friendlyName)
        if self.BodyType == 'json':   
            
            body = '''{"friendlyName": "%s", "appId": "%s"}'''%(friendlyName,self.AppId)
        data=''
        req.add_data(body)
        try:
            res = urllib2.urlopen(req);
            data = res.read()
            res.close()
        
            if self.BodyType=='json':
                #json格式
                locations = json.loads(data)
            else:
                #xml格式
                xtj=xmltojson()
                locations=xtj.main(data)
            if self.Iflog:
                self.log(url,body,data)
            return locations
        except Exception as error:
            if self.Iflog:
                self.log(url,body,data)
            return {'172001':'您的网络暂时不通畅，请稍候再试'}
        
    # 发送模板短信
    # @param to  必选参数     短信接收彿手机号码集合,用英文逗号分开
    # @param datas 可选参数    内容数据
    # @param tempId 必选参数    模板Id
    def sendTemplateSMS(self, to,datas,tempId):
        # print ('login in sendTemplateSMS')

        self.accAuth()
        nowdate = datetime.datetime.now()
        self.Batch = nowdate.strftime("%Y%m%d%H%M%S")
        #生成sig
        signature = self.AccountSid + self.AccountToken + self.Batch;
        signature = signature.encode('utf-8')
        # print(signature)
        m = md5()
        m.update(signature)
        sig = m.hexdigest().upper()
        #拼接URL
        url = "https://"+self.ServerIP + ":" + self.ServerPort + "/" + self.SoftVersion + "/Accounts/" + self.AccountSid + "/SMS/TemplateSMS?sig=" + sig
        # print (url)
        #生成auth
        src = self.AccountSid + ":" + self.Batch;
        src = src.encode('utf-8')
        auth = base64.encodestring(src).strip()
        req = urllib2.Request(url)
        self.setHttpHeader(req)
        req.add_header("Authorization", auth)
        headers = {"Authorization":auth,"Accept":'application/json',"Content-Type":"application/json;charset=utf-8","Content-Length":256}
        #创建包体
        b=''
        for a in datas:
            b+='<data>%s</data>'%(a)
        
        body ='<?xml version="1.0" encoding="utf-8"?><SubAccount><datas>'+b+'</datas><to>%s</to><templateId>%s</templateId><appId>%s</appId>\
            </SubAccount>\
            '%(to, tempId,self.AppId)
        if self.BodyType == 'json':   
            # if this model is Json ..then do next code
            b='['
            for a in datas:
                b+='"%s",'%(a) 
            b+=']'
            body ={"to": to, "datas": b, "templateId": tempId, "appId": self.AppId}
        req.data = body
        # print(type(body),'heeeeeeeeeeeee')
        data=''
        try:
            # print('login')
            # res = urllib2.urlopen(req);
            # print(res)
            # data = res.read()
            # print(data)
            # res.close()
            # print('url=',url,'\n',body,headers)
            res = requests.post(url,data =json.dumps(body),headers=headers)
            data = res.text
            # print(res.text)
            # print('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',res.status_code)
        
            if self.BodyType=='json':
                #json格式
                locations = json.loads(data)
            else:
                #xml格式
                xtj=xmltojson()
                locations=xtj.main(data)
            if self.Iflog:
                self.log(url,body,data)
            return locations
        except Exception as  error:
            if self.Iflog:
                self.log(url,body,data)
            return {'172001':'您的网络暂时不通畅，请稍候再试'}

    # 双向回呼
    # @param fromPhone  必选参数   主叫电话号码
    # @param to 必选参数    被叫电话号码
    # @param customerSerNum 可选参数    被叫侧显示的客服号码  
    # @param fromSerNum 可选参数    主叫侧显示的号码
    # @param promptTone 可选参数    第三方自定义回拨提示音  
    # @param userData 可选参数    第三方私有数据  
    # @param maxCallTime 可选参数    最大通话时长
    # @param hangupCdrUrl 可选参数    实时话单通知地址  

    def callBack(self,fromPhone,to,customerSerNum,fromSerNum,promptTone,userData,maxCallTime,hangupCdrUrl):

        self.subAuth()
        nowdate = datetime.datetime.now()
        self.Batch = nowdate.strftime("%Y%m%d%H%M%S")
        #生成sig
        signature = self.SubAccountSid + self.SubAccountToken + self.Batch;
        sig = md5.new(signature).hexdigest().upper()
        #拼接URL
        url = "https://"+self.ServerIP + ":" + self.ServerPort + "/" + self.SoftVersion + "/SubAccounts/" + self.SubAccountSid + "/Calls/Callback?sig=" + sig
        #生成auth
        src = self.SubAccountSid + ":" + self.Batch;
        auth = base64.encodestring(src).strip()
        req = urllib2.Request(url)
        self.setHttpHeader(req)
        
        req.add_header("Authorization", auth)
        
        #创建包体
        body ='''<?xml version="1.0" encoding="utf-8"?><CallBack>\
            <from>%s</from><to>%s</to><customerSerNum>%s</customerSerNum><fromSerNum>%s</fromSerNum><promptTone>%s</promptTone><userData>%s</userData><maxCallTime>%s</maxCallTime><hangupCdrUrl>%s</hangupCdrUrl>\
            </CallBack>\
            '''%(fromPhone,to,customerSerNum,fromSerNum,promptTone,userData,maxCallTime,hangupCdrUrl)
        if self.BodyType == 'json':   
            body = '''{"from": "%s", "to": "%s","customerSerNum": "%s","fromSerNum": "%s","promptTone": "%s","userData": "%s","maxCallTime": "%s","hangupCdrUrl": "%s"}'''%(fromPhone,to,customerSerNum,fromSerNum,promptTone,userData,maxCallTime,hangupCdrUrl)
        req.add_data(body)
        data=''
        try:
            res = urllib2.urlopen(req);
            data = res.read()
            res.close()
            if self.BodyType=='json':
                #json格式
                locations = json.loads(data)
            else:
                #xml格式
                xtj=xmltojson()
                locations=xtj.main(data)
            if self.Iflog:
                self.log(url,body,data)
            return locations
        except Exception as error:
            if self.Iflog:
                self.log(url,body,data)
            return {'172001':'您的网络暂时不通畅，请稍候再试'}       
    # 营销外呼
    # @param to 必选参数    被叫号码
    # @param mediaName 可选参数    语音文件名称，格式 wav。与mediaTxt不能同时为空。当不为空时mediaTxt属性失效。
    # @param mediaTxt 可选参数    文本内容
    # @param displayNum 可选参数    显示的主叫号码
    # @param playTimes 可选参数    循环播放次数，1－3次，默认播放1次。
    # @param respUrl 可选参数    营销外呼状态通知回调地址，云通讯平台将向该Url地址发送呼叫结果通知。

    def landingCall(self,to,mediaName,mediaTxt,displayNum,playTimes,respUrl):

        self.accAuth()
        nowdate = datetime.datetime.now()
        self.Batch = nowdate.strftime("%Y%m%d%H%M%S")
        #生成sig
        signature = self.AccountSid + self.AccountToken + self.Batch;
        sig = md5.new(signature).hexdigest().upper()
        #拼接URL
        url = "https://"+self.ServerIP + ":" + self.ServerPort + "/" + self.SoftVersion + "/Accounts/" + self.AccountSid + "/Calls/LandingCalls?sig=" + sig
        #生成auth
        src = self.AccountSid + ":" + self.Batch;
        auth = base64.encodestring(src).strip()
        req = urllib2.Request(url)
        self.setHttpHeader(req)
        req.add_header("Authorization", auth)
        
        #创建包体
        body ='''<?xml version="1.0" encoding="utf-8"?><LandingCall>\
            <to>%s</to><mediaName>%s</mediaName><mediaTxt>%s</mediaTxt><appId>%s</appId><displayNum>%s</displayNum>\
            <playTimes>%s</playTimes><respUrl>%s</respUrl></LandingCall>\
            '''%(to, mediaName,mediaTxt,self.AppId,displayNum,playTimes,respUrl)
        if self.BodyType == 'json':   
            body = '''{"to": "%s", "mediaName": "%s","mediaTxt": "%s","appId": "%s","displayNum": "%s","playTimes": "%s","respUrl": "%s"}'''%(to, mediaName,mediaTxt,self.AppId,displayNum,playTimes,respUrl)
        req.add_data(body)
        data=''
        try:
            res = urllib2.urlopen(req);
            data = res.read()
            res.close()
        
            if self.BodyType=='json':
                #json格式
                locations = json.loads(data)
            else:
                #xml格式
                xtj=xmltojson()
                locations=xtj.main(data)
            if self.Iflog:
                self.log(url,body,data)
            return locations
        except Exception as error:
            if self.Iflog:
                self.log(url,body,data)
            return {'172001':'您的网络暂时不通畅，请稍候再试'}
    
    # 语音验证码
    # @param verifyCode  必选参数   验证码内容，为数字和英文字母，不区分大小写，长度4-8位
    # @param playTimes  可选参数   播放次数，1－3次
    # @param to 必选参数    接收号码
    # @param displayNum 可选参数    显示的主叫号码
    # @param respUrl 可选参数    语音验证码状态通知回调地址，云通讯平台将向该Url地址发送呼叫结果通知

    def voiceVerify(self,verifyCode,playTimes,to,displayNum,respUrl):

        self.accAuth()
        nowdate = datetime.datetime.now()
        self.Batch = nowdate.strftime("%Y%m%d%H%M%S")
        #生成sig
        signature = self.AccountSid + self.AccountToken + self.Batch;
        sig = md5.new(signature).hexdigest().upper()
        #拼接URL
        url = "https://"+self.ServerIP + ":" + self.ServerPort + "/" + self.SoftVersion + "/Accounts/" + self.AccountSid + "/Calls/VoiceVerify?sig=" + sig
        #生成auth
        src = self.AccountSid + ":" + self.Batch;
        auth = base64.encodestring(src).strip()
        req = urllib2.Request(url)
        self.setHttpHeader(req)
        
        req.add_header("Authorization", auth)
        
        #创建包体
        body ='''<?xml version="1.0" encoding="utf-8"?><VoiceVerify>\
            <appId>%s</appId><verifyCode>%s</verifyCode><playTimes>%s</playTimes><to>%s</to><respUrl>%s</respUrl>\
            <displayNum>%s</displayNum></VoiceVerify>\
            '''%(self.AppId,verifyCode,playTimes,to,respUrl,displayNum)
        if self.BodyType == 'json':   
            # if this model is Json ..then do next code 
            body = '''{"appId": "%s", "verifyCode": "%s","playTimes": "%s","to": "%s","respUrl": "%s","displayNum": "%s"}'''%(self.AppId,verifyCode,playTimes,to,respUrl,displayNum)
        req.add_data(body)
        data=''
        try:
            res = urllib2.urlopen(req);
            data = res.read()
            res.close()
        
            if self.BodyType=='json':
                #json格式
                locations = json.loads(data)
            else:
                #xml格式
                xtj=xmltojson()
                locations=xtj.main(data)
            if self.Iflog:
                self.log(url,body,data)
            return locations
        except Exception as  error:
            if self.Iflog:
                self.log(url,body,data)
            return {'172001':'您的网络暂时不通畅，请稍候再试'}
    
    # IVR外呼
    # @param number  必选参数     待呼叫号码，为Dial节点的属性
    # @param userdata 可选参数    用户数据，在<startservice>通知中返回，只允许填写数字字符，为Dial节点的属性
    # @param record   可选参数    是否录音，可填项为true和false，默认值为false不录音，为Dial节点的属性

    def ivrDial(self,number,userdata,record):

        self.accAuth()
        nowdate = datetime.datetime.now()
        self.Batch = nowdate.strftime("%Y%m%d%H%M%S")
        #生成sig
        signature = self.AccountSid + self.AccountToken + self.Batch;
        sig = md5.new(signature).hexdigest().upper()
        #拼接URL
        url = "https://"+self.ServerIP + ":" + self.ServerPort + "/" + self.SoftVersion + "/Accounts/" + self.AccountSid + "/ivr/dial?sig=" + sig
        #生成auth
        src = self.AccountSid + ":" + self.Batch;
        auth = base64.encodestring(src).strip()
        req = urllib2.Request(url)
        req.add_header("Accept", "application/xml")
        req.add_header("Content-Type", "application/xml;charset=utf-8")
        req.add_header("Authorization", auth)
        
        #创建包体
        body ='''<?xml version="1.0" encoding="utf-8"?>
                <Request>
                    <Appid>%s</Appid>
                    <Dial number="%s"  userdata="%s" record="%s"></Dial>
                </Request>
            '''%(self.AppId,number,userdata,record)
        req.add_data(body)
        data=''
        try:
            res = urllib2.urlopen(req);
            data = res.read()
            res.close()
            xtj=xmltojson()
            locations=xtj.main(data)
            if self.Iflog:
                self.log(url,body,data)
            return locations
        except Exception as  error:
            if self.Iflog:
                self.log(url,body,data)
            return {'172001':'您的网络暂时不通畅，请稍候再试'}
        
    
    # 话单下载
    # @param date   必选参数    day 代表前一天的数据（从00:00 – 23:59）;week代表前一周的数据(周一 到周日)；month表示上一个月的数据（上个月表示当前月减1，如果今天是4月10号，则查询结果是3月份的数据）
    # @param keywords  可选参数     客户的查询条件，由客户自行定义并提供给云通讯平台。默认不填忽略此参数
    def billRecords(self,date,keywords):

        self.accAuth()
        nowdate = datetime.datetime.now()
        self.Batch = nowdate.strftime("%Y%m%d%H%M%S")
        #生成sig
        signature = self.AccountSid + self.AccountToken + self.Batch;
        sig = md5.new(signature).hexdigest().upper()
        #拼接URL
        url = "https://"+self.ServerIP + ":" + self.ServerPort + "/" + self.SoftVersion + "/Accounts/" + self.AccountSid + "/BillRecords?sig=" + sig
        #生成auth
        src = self.AccountSid + ":" + self.Batch;
        auth = base64.encodestring(src).strip()
        req = urllib2.Request(url)
        self.setHttpHeader(req)
        req.add_header("Authorization", auth)
        
        #创建包体
        body ='''<?xml version="1.0" encoding="utf-8"?><BillRecords>\
            <appId>%s</appId><date>%s</date><keywords>%s</keywords>\
            </BillRecords>\
            '''%(self.AppId,date,keywords)
        if self.BodyType == 'json':   
            # if this model is Json ..then do next code 
            body = '''{"appId": "%s", "date": "%s","keywords": "%s"}'''%(self.AppId,date,keywords)
        req.add_data(body)
        data=''
        try:
            res = urllib2.urlopen(req);
            data = res.read()
            
            res.close()
        
            if self.BodyType=='json':
                #json格式
                locations = json.loads(data)
            else:
                #xml格式
                xtj=xmltojson()
                locations=xtj.main(data)
            if self.Iflog:
                self.log(url,body,data)
            return locations
        except Exception as error:
            if self.Iflog:
                self.log(url,body,data)
            return {'172001':'您的网络暂时不通畅，请稍候再试'}
    
    # 主帐号信息查询

    def queryAccountInfo(self):

        self.accAuth()
        nowdate = datetime.datetime.now()
        self.Batch = nowdate.strftime("%Y%m%d%H%M%S")
        #生成sig
        signature = self.AccountSid + self.AccountToken + self.Batch;
        sig = md5.new(signature).hexdigest().upper()
        #拼接URL
        url = "https://"+self.ServerIP + ":" + self.ServerPort + "/" + self.SoftVersion + "/Accounts/" + self.AccountSid + "/AccountInfo?sig=" + sig
        #生成auth
        src = self.AccountSid + ":" + self.Batch;
        auth = base64.encodestring(src).strip()
        req = urllib2.Request(url)
        self.setHttpHeader(req)
        body=''
        req.add_header("Authorization", auth)
        data=''
        try:
            res = urllib2.urlopen(req);
            data = res.read()
            res.close()
        
            if self.BodyType=='json':
                #json格式
                locations = json.loads(data)
            else:
                #xml格式
                xtj=xmltojson()
                locations=xtj.main(data)
            if self.Iflog:
                self.log(url,body,data)
            return locations
        except Exception as error:
            if self.Iflog:
                self.log(url,body,data)
            return {'172001':'您的网络暂时不通畅，请稍候再试'}
    
    #子帐号鉴权
    def subAuth(self):
        if(self.ServerIP==""):
            print('172004');
            print('IP为空');
        
        if(self.ServerPort<=0):
            print('172005');
            print('端口错误（小于等于0）');
        
        if(self.SoftVersion==""):
            print('172013');
            print('版本号为空');
        
        if(self.SubAccountSid==""):
            print('172008');
            print('子帐号为空');
        
        if(self.SubAccountToken==""):
            print('172009');
            print('子帐号令牌为空');
        
        if(self.AppId==""):
            print('172012');
            print('应用ID为空');
    
    #主帐号鉴权
    def accAuth(self):
        if(self.ServerIP==""):
            print('172004');
            print('IP为空');
        
        if(int(self.ServerPort)<=0):
            print('172005');
            print('端口错误（小于等于0）');
        
        if(self.SoftVersion==""):
            print('172013');
            print('版本号为空');
        
        if(self.AccountSid==""):
            print('172006');
            print('主帐号为空');
        
        if(self.AccountToken==""):
            print('172007');
            print('主帐号令牌为空');
        
        if(self.AppId==""):
            print('172012');
            print('应用ID为空');



    #设置包头
    def setHttpHeader(self,req):
        if self.BodyType == 'json':
            req.add_header("Accept", "application/json")
            req.add_header("Content-Type", "application/json;charset=utf-8")
            
        else:
            req.add_header("Accept", "application/xml")
            req.add_header("Content-Type", "application/xml;charset=utf-8")
    