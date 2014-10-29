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
        res = h.fetch(url)
        h.close()

    try:
        q = s.query(_VerifyCode).filter(_VerifyCode.wx_id == wx_id).one()

    except:
        post()
        v = _VerifyCode()
        v.wx_id = wx_id
        v.count = 1
        v.code = code
        s.add(v)
        s.commit()
        s.close()
        return

    if (datetime.datetime.now() - q.create_time).seconds < 30:
        return
    else:
        if (datetime.datetime.now() - q.create_time).hour >= 24:
            post()
            q.wx_id = wx_id
            q.code = code
            q.count = 1
            s.commit()
            s.close()

        else:
            if q.count <= 10:
                post()
                q.wx_id = wx_id
                q.code = code
                q.count += 1
                s.commit()
                s.close()

            else:
                return

def check_msg_token(wx_id, code):
    s = DBSession()
    try:
        q = s.query(_VerifyCode).filter(_VerifyCode.wx_id == wx_id).one()
    except:
        return False

    if q.code == code:
        return True


def test_abc():
    pass