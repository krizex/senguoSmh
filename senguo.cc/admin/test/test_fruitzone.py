from base import Configs, TestHTTPClient, _TestBase
from tornado.httpclient import HTTPError
import dal.models as models
import json
import pytest

class TestFruitzoneHome(_TestBase):
    def test_get_home(self):
        res = self.client.get("/fruitzone/")
        assert res.code == 200

class TestAdminHome(_TestBase):

    def test_get_without_authenticated(self):
        try:
            res = self.client.get("/fruitzone/admin/home")
        except HTTPError as e:
            assert e.code == 302
    def test_get_with_authenticated(self):
        res = self.client.authenticated_get(models.ShopAdmin, "/fruitzone/admin/home")
        assert res.code == 200

class TestAdminProfile(_TestBase):
    def test_get_without_authenticated(self):
        try:
            res = self.client.get("/fruitzone/admin/profile")
        except HTTPError as e:
            assert e.code == 302
    def test_get_with_authenticated(self):
        res = self.client.authenticated_get(models.ShopAdmin, "/fruitzone/admin/profile")
        assert res.code == 200
    
    def test_post_without_authenticated(self):
        try:
            res = self.client.post("/fruitzone/admin/profile", {
                "action":"edit_realname", "data":"liaosimin"})
        except HTTPError as e:
            assert e.code == 403
    
    def test_post_with_authenticated(self):
        # test edit realname
        res = self.client.authenticated_post(
            models.ShopAdmin,
            "/fruitzone/admin/profile", {
                "action":"edit_realname", "data":"liaosimin"})
        res_data = json.loads(res.body.decode())
        assert res_data["success"] == True
        # test edit birthday
        res = self.client.authenticated_post(
            models.ShopAdmin,
            "/fruitzone/admin/profile", {
                "action":"edit_birthday", "data":{"year":2014, "month":10}})
        res_data = json.loads(res.body.decode())
        assert res_data["success"] == True
