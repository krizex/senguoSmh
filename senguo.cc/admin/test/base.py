import sys, os
sys.path.append(os.path.abspath(os.path.join(
    os.path.dirname(__file__),os.path.pardir)))

import dal.models as models
from tornado.httpclient import HTTPClient, HTTPRequest, HTTPError
from sqlalchemy.orm.exc import NoResultFound

import json
import app
import tornado.web

class Configs:
    test_users = {
        models.ShopAdmin:dict(
            email="monklof@gmail.com")
    }

    @classmethod
    def create_testusers(cls):
        s = models.DBSession()
        for m in cls.test_users.keys():
            try:
                print("check user: {0} exist...".format(cls.test_users[m]))
                u = s.query(m).filter_by(**cls.test_users[m]).one()
                print("user: {0} exists.".format(cls.test_users[m]))
            except NoResultFound as e:
                print("user: {0} doesn't exists, now creating".format(cls.test_users[m]))
                # 未找到，插入
                u = m(**cls.test_users[m])
                s.add(u)
                s.commit()
                print("user: {0} create success!".format(cls.test_users[m]))
            except Exception as e:
                raise e
        s.close()
    @classmethod
    def create_testuser_cookies(cls):
        s = models.DBSession()
        for m in cls.test_users.keys():
            u = s.query(m).filter_by(**cls.test_users[m]).one()
            v = tornado.web.create_signed_value(
                app.application.settings["cookie_secret"],
                TestHTTPClient._auth_cookie[m][0],
                str(u.id)
            )
            print("secret cookie for user: {0}\n{1}={2}".format(
                cls.test_users[m],
                TestHTTPClient._auth_cookie[m][0],v))
            

class TestHTTPClient(HTTPClient):
    """
    a test http client that:
      1. support tornado's xsrf protection
      2. support relative url like "/super/login" other than 
         "http://127.0.0.1:8887/super/login"
      3. support authenticated http request
    NOTE: 
      1. fetch doesn't support a HTTPRequest object as the parameter
      2. post 
    """
    default_port = 8887
    default_host = "127.0.0.1"
    default__xsrf = "_xsrf_token"
    _xsrf_switch = "on"

    # 这些用户必须是已经存在数据库中的
    _test_users = Configs.test_users
    _auth_cookie = {
#        models.SuperAdmin:("super_id", "2|1:0|10:1414372786|8:super_id|4:MjM=|67ae83c03ec1666117031e85e2bb6f591bbf1bde12aecd60e35ab71413668107"),
        models.ShopAdmin:("admin_id", "2|1:0|10:1414641859|8:admin_id|4:MQ==|f42e360cea9dae3b1d7f70254a935f9b0bc0dc2bf388cf04781f76223c206fbc")
    }

    def get(self, url, *, params={}, cookies={}, **kwargs):
        assert type(url) == str
        assert type(params) == dict
        assert type(cookies) == dict
        
        url = self._escape_url(url, params)
        headers = {
            "Cookie": self._escape_cookie(cookies)
        }
        return self.fetch(url, headers=headers, **kwargs)
    
    def authenticated_get(self, account_model, url, *, params={}, cookies={}, **kwargs):
        assert account_model in self._auth_cookie
        assert type(url) == str
        assert type(params) == dict
        assert type(cookies) == dict        
        url = self._escape_url(url, params)
        auth_c = self._auth_cookie[account_model]
        cookies[auth_c[0]] = auth_c[1]
        headers = {
            "Cookie": self._escape_cookie(cookies)
        }
        return self.fetch(url, headers=headers, **kwargs)

    def post(self, url, params_dict={},  *, cookies={},  **kwargs):
        assert type(url) == str
        assert type(params_dict) == dict
        assert type(cookies) == dict
        url = self._escape_url(url)
        if self._xsrf_switch == "on":
            cookies["_xsrf"] = self.default__xsrf
            params_dict["_xsrf"] = self.default__xsrf
        headers = {
            "Cookie": self._escape_cookie(cookies),
            "Content-Type": "application/json; charset=utf-8"
        }

        body = json.dumps(params_dict)
        return self.fetch(url, method="POST", headers=headers, body=body, **kwargs)

    def authenticated_post(self, account_model, url,params_dict={}, *, cookies={}, **kwargs):
        assert account_model in self._auth_cookie
        assert type(url) == str
        assert type(params_dict) == dict
        assert type(cookies) == dict
        url = self._escape_url(url)
        auth_c = self._auth_cookie[account_model]
        cookies[auth_c[0]] = auth_c[1]

        if self._xsrf_switch == "on":
            cookies["_xsrf"] = self.default__xsrf
            params_dict["_xsrf"] = self.default__xsrf
        headers = {
            "Cookie": self._escape_cookie(cookies),
            "Content-Type": "application/json; charset=utf-8"
        }

        body = json.dumps(params_dict)

        return self.fetch(url,method="POST", headers=headers, body=body, **kwargs)

    def _escape_url(self, url_short, params={}):
        para_str = ""
        for key in params.keys():
            para_str += "{0}={1}&".format(key, url_escape(params[key]))
        if para_str: para_str = "?" + para_str[:-1]
        return "http://{0}:{1}{2}{3}".format(
            self.default_host, self.default_port ,url_short, para_str)
    def _escape_cookie(self, cookies):
        cstr = ""
        for key in cookies.keys():
            cstr += "{0}={1};".format(key, cookies[key])
        if cstr: cstr = cstr[:-1]
        return cstr

class _TestBase:
    @property
    def session(self):
        if not hasattr(self, "_session"):
            self._session = models.DBSession()
        return self._session
    @property
    def client(self):
        if not hasattr(self, "_client"):
            self._client = TestHTTPClient()
        return self._client
    def taildown_class(self):
        if hasattr(self, "_session"):
            self._session.close()
        if hasattr(self, "_client"):
            self._client.close()
