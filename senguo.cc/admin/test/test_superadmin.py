from base import TestConfigs, TestHTTPClient, _TestBase
from tornado.httpclient import HTTPError
import dal.models as models
import json
import pytest

class TestSuperAdminAccess(_TestBase):
    def test_get_login(self):
        res = self.client.get("/super/login")
        assert res.code == 200
    def test_post_login_with_invalid_account(self):
        # form a request
        res  = self.client.post("/super/login", params_dict=dict(
            username=TestConfigs.test_users[models.SuperAdmin].username,
            password=TestConfigs.test_users[models.SuperAdmin].password +"密码错啦"))
        msg = json.loads(res.body.decode())
        assert msg["success"] == False
    def test_post_login_with_valid_account(self):
        res  = self.client.post("/super/login", params_dict=dict(
            username=TestConfigs.test_users[models.SuperAdmin].username,
            password=TestConfigs.test_users[models.SuperAdmin].password))
        msg = json.loads(res.body.decode())
        # should be True
        assert msg["success"] == True


class TestSuperAdminHome(_TestBase):
    def test_get_without_authenticated(self):
        with pytest.raises(HTTPError) as e:
            res = self.client.get('/super/', follow_redirects=False)
    def test_get_with_authenticated(self):
        res = self.client.authenticated_get(models.SuperAdmin ,"/super/", follow_redirects=False)
        assert res.code == 200
        res = self.client.authenticated_get(models.SuperAdmin ,"/super/active", follow_redirects=False)
        assert res.code == 200
        res = self.client.authenticated_get(models.SuperAdmin ,"/super/frozen", follow_redirects=False)
        assert res.code == 200
        res = self.client.authenticated_get(models.SuperAdmin ,"/super/applying", follow_redirects=False)
        assert res.code == 200
