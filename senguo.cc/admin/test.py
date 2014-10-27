#!/usr/bin/env python3
# test the backend api provided for front.

import unittest
from tornado.httpclient import HTTPClient, HTTPError, HTTPRequest
import json
import dal.models as models

def parse_cookie_from_str(set_cookie_list_str):
    cookie_dict = {}
    for cookie_str in set_cookie_list_str:
        name = cookie_str.split(";")[0].split("=")[0]
        value = cookie_str.split(";")[0].split("=")[1]
        cookie_dict[name] = value
    return cookie_dict

def form_cookie_header(cookie_dict):
    cookie_str = ""
    for key in cookie_dict.keys():
        cookie_str += "{0}={1};".format(key, cookie_dict[key])
    if cookie_str:
        cookie_str = cookie_str[:-1]
    return cookie_str

class CheckNumbers(unittest.TestCase):
    def setUp(self):
        self.client = HTTPClient()
    def tearDown(self):
        self.client.close()
    def test_adminLogin_get(self):
        try:
            req = HTTPRequest("http://127.0.0.1:8887/super/login")
            res=self.client.fetch(req)
        except HTTPError as e:
            self.assertEqual(e.code, 200)
    def test_adminLogin_post_with_invalid_access(self):
        try:
            res = self.client.fetch("http://127.0.0.1:8887/super/login")
            cookie_list = res.headers.get_list("Set-Cookie")
            cookie_dict = parse_cookie_from_str(cookie_list)
            cookie_str = form_cookie_header(cookie_dict)
            # should be invalid access
            req = HTTPRequest("http://127.0.0.1:8887/super/login", method="POST",
                              body="username=testcase&password=test&_xsrf="+cookie_dict["_xsrf"], 
                              headers={"Cookie":cookie_str})
            res=self.client.fetch(req)
            msg = json.loads(res.body.decode())
            self.assertEqual(msg["success"], False)
        except HTTPError as e:
            self.assertEqual(e.code, 200)
    def test_adminLogin_post_with_valid_access(self):
        try:
            session = models.DBSession()
            # should be valid access
            su = models.SuperAdmin(username="testcase",password="test", email="test@testcase.com")
            session.add(su)
            session.commit()
            res = self.client.fetch("http://127.0.0.1:8887/super/login")
            cookie_list = res.headers.get_list("Set-Cookie")
            cookie_dict = parse_cookie_from_str(cookie_list)
            cookie_str = form_cookie_header(cookie_dict)
            # should be invalid access
            
            req = HTTPRequest("http://127.0.0.1:8887/super/login", method="POST",
                              body="username=testcase&password=test&_xsrf="+cookie_dict["_xsrf"], 
                              headers={"Cookie":cookie_str})
            res=self.client.fetch(req)
            msg = json.loads(res.body.decode())
            self.assertEqual(msg["success"], True)
            
            # clear
            session.delete(su)
            session.commit()
            session.close()
        except HTTPError as e:
            self.assertEqual(e.code, 200)
    def test_superHome_get_with_logged_out(self):
        try:
            req = HTTPRequest("http://127.0.0.1:8887/super/")
            res=self.client.fetch(req)
        except HTTPError as e:
            self.assertEqual(e.code, 200)
    def test_superHome_get_with_logged_in(self):
        try:
            session = models.DBSession()
            # create a user
            su = models.SuperAdmin(username="testcase",password="test", email="test@testcase.com")
            session.add(su)
            session.commit()
            # get _xsrf cookie
            res = self.client.fetch("http://127.0.0.1:8887/super/login")
            cookie_list = res.headers.get_list("Set-Cookie")
            cookie_dict = parse_cookie_from_str(cookie_list)
            cookie_str = form_cookie_header(cookie_dict)

            # login and get user cookie            
            req = HTTPRequest("http://127.0.0.1:8887/super/login", method="POST",
                              body="username=testcase&password=test&_xsrf="+cookie_dict["_xsrf"], 
                              headers={"Cookie":cookie_str})
            res=self.client.fetch(req)
            msg = json.loads(res.body.decode())
            self.assertEqual(msg["success"], True)
            cookie_list = res.headers.get_list("Set-Cookie")
            cookie_dict = parse_cookie_from_str(cookie_list)
            cookie_str = form_cookie_header(cookie_dict)
            
            # try get page
            req = HTTPRequest("http://127.0.0.1:8887/super/", method="GET", 
                              headers={"Cookie":cookie_str})
            res = self.client.fetch(req)

            self.assertEqual(res.code, 200)
            # clear
            session.delete(su)
            session.commit()
            session.close()
        except HTTPError as e:
            self.assertEqual(e.code, 200)
        

if __name__ == "__main__":
    unittest.main()

