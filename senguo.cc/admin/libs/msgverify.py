import random, datetime
from tornado.httpclient import HTTPClient
from sqlalchemy.types import String, Integer, DateTime
from sqlalchemy import func, Column
from tornado.escape import url_escape

from dal.db_configs import DBSession
from settings import content, account, password
from xml.etree import ElementTree
from dal.models import _VerifyCode
import requests
import json

#############################################
#get access_token
#############################################
def get_access_token():
    AppSecret = '6ecd60383b7e26a09d51a12e75649b3e'
    AppID = 'wx0ed17cdc9020a96e'
    grant_type = 'client_credential'
    url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type={0}&appid={1}&secret={2}'.format(grant_type,AppID,AppSecret)
    r = requests.get(url,headers = {"connection":"close"})
    s = r.content
    s = str(s,'utf-8')
    t = json.loads(s)
    access_token = t.get('access_token')
    return access_token

###########################################
# subscribe
###########################################
def user_subscribe(openid):
    access_token = get_access_token()
    url = 'https://api.weixin.qq.com/cgi-bin/user/info?access_token={0}&openid={1}'.format(access_token,openid)
    r = requests.get(url,headers = {"connection":"close"})
    s = str(r.content,'utf-8')
    t = json.loads(s)
    subscribe = t.get('subscribe',None)
    return subscribe

##################################################################################
# 短信平台 自带验证过程，因此去掉本地的检测过程，避免因不必要的错误导致用户发不出去
# 3.12
# woody
##################################################################################
def gen_msg_token(phone):
    s = DBSession()
    code = "".join(random.sample("123456789",4))

    url = "http://106.ihuyi.cn/webservice/sms.php?method=Submit&account={account}&password={password}&mobile={phone}&content={content}".format(account=account,password=password,phone=phone,content=url_escape(content.format(code=code)))
    h = HTTPClient()
    res = h.fetch(url)
    h.close()
    root = ElementTree.fromstring(res.body.decode())
    if not root[0].text == '2':
        print("[验证短信]发送错误：",root[0].text,root[1].text)
        return root[1].text
    else:
        try:
            print("[验证短信]验证码",code,"已发送到手机：",phone)
            # print("[验证短信]wx_id：",wx_id)
            q = s.query(_VerifyCode).filter(_VerifyCode.phone == phone).one()
        except:
            q = None

        if q is not None:
            q.code = code
            q.create_time = datetime.datetime.now()
            q.count = 1
            # q.phone = phone
        else:
            v = _VerifyCode()
            v.phone = phone
            v.code = code
            v.count = 1          # when count = 1,code is usefull
            s.add(v)
        s.commit()
        s.close()
        return True


# def gen_msg_token(wx_id, phone):
#     s = DBSession()
#     code = "".join(random.sample("123456789", 4))
#     print("login")

#     def post():
#         print("post login")

#         url = "http://106.ihuyi.cn/webservice/sms.php?method=Submit&account={account}&password={password}&mobile={phone}&content={content}".\
#             format(account=account, password=password, phone=phone, content=url_escape(content.format(code=code)))
#         h = HTTPClient()
#         res = h.fetch(url)
#         h.close()
#         root = ElementTree.fromstring(res.body.decode())
#         print(root[1].text)
#         if not root[0].text == '2':  # 2 表示短信发送成功，其他都不成功
#             return False
#         return True


#     try:
#         q = s.query(_VerifyCode).filter(_VerifyCode.wx_id == wx_id).one()
#         print('try')
#     except:
#         # ** 需要处理post异常 **
#         if not post():
#             print("post out")
#             return False
#         v = _VerifyCode()
#         v.wx_id = wx_id
#         v.count = 1
#         v.code = code
#         s.add(v)
#         s.commit()
#         s.close()
#         print("except")
#         return True

#         print('yun xing le mei')

#     # 数据库有该用户验证码
#     delta_time = (datetime.datetime.now() - q.create_time)
#     delta_seconds = delta_time.days * 24*3600 + delta_time.seconds

#     #如果用户在30秒内连续申请产生验证码，不响应
#     if delta_seconds < 30:
#         return True
#     #用户在24小时后再次申请验证码，响应
#     elif delta_seconds > 24*3600:
#         if not post():
#             return False
#         q.wx_id = wx_id
#         q.code = code
#         q.create_time=datetime.datetime.now()
#         q.count = 1
#         s.commit()
#         s.close()
#         return True
#     else:
#         #用户在24小时内申请验证码，这时要检查是否24小时内申请次数没超过10次（24小时内只允许申请10次）
#         if q.count <= 10:
#             if not post():
#                 return False
#             q.wx_id = wx_id
#             q.code = code
#             q.count += 1
#             s.commit()
#             s.close()
#         #24小时内多于10次，不响应
#         else:
#             return False





def check_msg_token(phone, code):
    s = DBSession()
    try:
        q = s.query(_VerifyCode).filter_by(phone=phone).one()
    except:
        return False
    #print("[验证短信]验证码验证：",q.code,code,q.count,q.wx_id)

    # t = (datetime.datetime.now() - q.create_time)
    # if t.days == 0 and t.seconds >= 18000:
    if q.count  != 1:
        return False

    if q.code == code:
        q.count = 0     # make the code useless
        s.commit()
        s.close()
        return True
    return False


def test_abc():
    pass
