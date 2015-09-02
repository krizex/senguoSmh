# -*- coding: utf-8 -*-
from django.http import HttpResponse, Http404, HttpResponseRedirect
import time
import random
import string
import hashlib
import os
import requests
import settings
import json

# 生成微信签名
class logPrint:
    def __init__(self):
        self.url = '1'


    def showlog(self, data):
        self.data = data
        dirname = os.path.dirname(__file__)
        with open(dirname+'/log.txt', 'a') as newf:
            newf.write(self.data + "\n")

# 生成微信签名
class Sign:
    def __init__(self, url):
        self.ret = {
            'nonceStr': self.__create_nonce_str(),
            'timestamp': self.__create_timestamp(),
            'url': url
        }

    # 随机字符串
    def __create_nonce_str(self):
        return ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(15))

    # 时间戳
    def __create_timestamp(self):
        return int(time.time())

    # 排序拼接 以及最终返回的签名
    def sign(self, ticket):
        self.ret['jsapi_ticket'] = ticket
        string = '&'.join(['%s=%s' % (key.lower(), self.ret[key]) for key in sorted(self.ret)])
        self.ret['signature'] = hashlib.sha1(string).hexdigest()
        # log = logPrint()
        # log.showlog(json.dumps(self.ret))
        return self.ret

    # 获取微信JSSDK Ticket
    def getJsApiTicket(self, access_token):
        # print access_token
        dirname = os.path.dirname(__file__)
        # 判断文件是否存在
        if os.path.exists(dirname+'/jsapi_ticket.json'):
            f = file(dirname+'/jsapi_ticket.json', 'r')
            jsapi_ticketJson = json.load(f)
            jsapi_ticket = jsapi_ticketJson['jsapi_ticket']
            # expire_time = int(jsapi_ticketJson['expire_time'])
            if jsapi_ticketJson['expire_time']:
                expire_time = int(jsapi_ticketJson['expire_time'])
            else:
                expire_time = 0
        else:
            expire_time = 0
            data = {"jsapi_ticket":"","expire_time":0}
            with open(dirname+'/jsapi_ticket.json', 'w') as newf:
                newf.write(json.dumps(data))
        nowTime = int(time.time())
        if expire_time < nowTime:
            url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?type=jsapi&access_token=' + access_token
            # print '************************'
            # print url
            r = requests.get(url)
            if r.status_code == 200:
                # 获取返回的 json数据
                returnData = r.json()
                ticket = returnData['ticket']
                if ticket:
                    DataExpireTime = nowTime + int(returnData['expires_in'])
                    # 重新将 access_token.json 文件重置
                    data = {"jsapi_ticket":ticket,"expire_time":DataExpireTime}
                    with open(dirname+'/jsapi_ticket.json', 'w') as newf:
                        newf.write(json.dumps(data))
                    newf.close()
                    return ticket
        else:
            return jsapi_ticket

    # 获取微信 access_token
    def getSign(self, current_url):
        dirname = os.path.dirname(__file__)
        # 判断文件是否存在
        if os.path.exists(dirname+'/access_token.json'):
            f = file(dirname+'/access_token.json', 'r')
            access_tokenJson = json.load(f)
            access_token = access_tokenJson['access_token']
            if access_tokenJson['expire_time']:
                expire_time = int(access_tokenJson['expire_time'])
            else:
                expire_time = 0
        else:
            expire_time = 0
            data = {"access_token":"","expire_time":0}
            with open(dirname+'/access_token.json', 'w') as newf:
                newf.write(json.dumps(data))
        # 获取当前时间戳
        nowTime = int(time.time())
        # 判断是否过期
        if expire_time < nowTime:
            if settings.APPID and settings.APPSECRET:
                url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + settings.APPID + '&secret=' + settings.APPSECRET
            else:
                return HttpResponse('请求失败,请重新下单')
            r = requests.get(url)
            if r.status_code == 200:
                # 获取返回的 json数据
                returnData = r.json()
                DataAccessToken = returnData['access_token']
                if DataAccessToken:
                    DataExpireTime = nowTime + int(returnData['expires_in'])
                    # 重新将 access_token.json 文件重置
                    data = {"access_token":DataAccessToken,"expire_time":DataExpireTime}
                    with open(dirname+'/access_token.json', 'w') as newf:
                        newf.write(json.dumps(data))
                    newf.close()
                    wxsign = Sign(current_url)
                    ticket = wxsign.getJsApiTicket(DataAccessToken)
                    if ticket:
                        sign = wxsign.sign(ticket)
                        return sign
        else:
            wxsign = Sign(current_url)
            ticket = wxsign.getJsApiTicket(access_token)
            if ticket:
                sign = wxsign.sign(ticket)
                return sign


# if __name__ == '__main__':
#     sign = Sign('jsapi_ticket', 'http://example.com')
#     print sign.sign()