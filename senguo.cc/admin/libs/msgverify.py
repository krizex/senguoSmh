import random, datetime
from tornado.httpclient import HTTPClient
from sqlalchemy.types import String, Integer, DateTime
from sqlalchemy import func, Column
from tornado.escape import url_escape

from dal.db_configs import DBSession
from settings import content, account, password
from xml.etree import ElementTree
from dal.models import _VerifyCode


def gen_msg_token(wx_id, phone):
    s = DBSession()
    code = "".join(random.sample("123456789", 4))
    
    def post():

        url = "http://106.ihuyi.cn/webservice/sms.php?method=Submit&account={account}&password={password}&mobile={phone}&content={content}".\
            format(account=account, password=password, phone=phone, content=url_escape(content.format(code=code)))
        h = HTTPClient()
        res = h.fetch(url)
        h.close()
        root = ElementTree.fromstring(res.body.decode())
        print(root[1].text)
        if not root[0].text == '2':  # 2 表示短信发送成功，其他都不成功
            return False
        return True


    try:
        q = s.query(_VerifyCode).filter(_VerifyCode.wx_id == wx_id).one()
    except:
        # ** 需要处理post异常 **
        if not post():
            return False
        v = _VerifyCode()
        v.wx_id = wx_id
        v.count = 1
        v.code = code
        s.add(v)
        s.commit()
        s.close()
        return True
    
    # 数据库有该用户验证码
    delta_time = (datetime.datetime.now() - q.create_time)
    delta_seconds = delta_time.days * 24*3600 + delta_time.seconds

    #如果用户在30秒内连续申请产生验证码，不响应
    if delta_seconds < 30:
        return True
    #用户在24小时后再次申请验证码，响应
    elif delta_seconds > 24*3600:
        if not post():
            return False
        q.wx_id = wx_id
        q.code = code
        q.create_time=datetime.datetime.now()
        q.count = 1
        s.commit()
        s.close()
        return True
    else:
        #用户在24小室内申请验证码，这时要检查是否24小时内申请次数没超过10次（24小时内只允许申请10次）
        if q.count <= 10:
            if not post():
                return False
            q.wx_id = wx_id
            q.code = code
            q.count += 1
            s.commit()
            s.close()
            #24小时内多于10次，不响应
        else:
            return False

def check_msg_token(wx_id, code):
    s = DBSession()
    try:
        q = s.query(_VerifyCode).filter_by(wx_id=wx_id).one()
    except:
        return False

    t = (datetime.datetime.now() - q.create_time)
    if t.days == 0 and t.seconds >= 18000:
        return False
    if q.code == code:
        return True
    return False


def test_abc():
    pass
