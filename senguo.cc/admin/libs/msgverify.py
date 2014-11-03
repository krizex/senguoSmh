import random, datetime
from tornado.httpclient import HTTPClient
from sqlalchemy.types import String, Integer, DateTime
from sqlalchemy import func, Column
from tornado.escape import url_escape

from dal.db_configs import MapBase, DBSession

class _VerifyCode(MapBase):
    __tablename__ = "__verify_code__"

    id = Column(Integer, primary_key=True, autoincrement=True)
    wx_id = Column(String(100), unique=True)
    code = Column(String(10))
    create_time = Column(DateTime, default=func.now())
    count = Column(Integer)

MapBase.metadata.create_all()

def gen_msg_token(wx_id, phone):
    s = DBSession()
    code = "".join(random.sample("1234567890",6 ))
    
    def post():

        content = url_escape("您的验证码是：【{code}】。请不要把验证码泄露给其他人。".format(code=code))
        url = "http://106.ihuyi.cn/webservice/sms.php?method=Submit&account=cf_liaosimin&password=13005670060&mobile={phone}&content={content}".\
            format(phone=phone, content=content)
        h = HTTPClient()
        res = h.fetch(url)#这个还要检查一下短信验证服务商返回的信息
        h.close()

    try:
        q = s.query(_VerifyCode).filter(_VerifyCode.wx_id == wx_id).one()
    except:
        # ** 需要处理post异常 **
        post()
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
        post()
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
            post()
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
        q = s.query(_VerifyCode).filter(_VerifyCode.wx_id == wx_id).one()
    except:
        return False

    t=(datetime.datetime.now() - q.create_time)
    if t.days==0 and t.seconds>= 1800:
        return False

    if q.code == code:
        return True


def test_abc():
    pass
