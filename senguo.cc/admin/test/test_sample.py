import sys
sys.path.append("../")

import dal.models as models
from tornado.httpclient import HTTPClient, HTTPRequest, HTTPError
import json
import pytest
from tornado.escape import url_escape, url_unescape



def test_xsrf_token():
    client = HTTPClient()
    body="username="+url_escape("__testcasesuperadmin0.0__") + \
                       "&password=" + url_escape("__testcasepassword身体的痛不要紧，要紧的是老夫那不能行侠仗义的心__")+\
                       "&_xsrf=abcdefg"
    print(body)
    print(url_unescape(body))
    res = client.fetch("http://127.0.0.1:8887/super/login", method="POST", 
                       body = body,
                       headers={"Cookie":"_xsrf=abcdefg", "Content-Type":"application/x-www-form-urlencoded; charset=utf-8"})
    print(res)
