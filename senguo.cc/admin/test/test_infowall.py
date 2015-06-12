__author__ = 'liaosimin'
from tornado.httpclient import HTTPClient
import json

class TestInfoCollect():
    def test_post(self):
        headers = {
            "Cookie": '_xsrf=2|b9d00ee5|4d709b8b3e3ba719d82cc761c4b5844f|1415150939; super_id="2|1:0|10:1415544378|8:super_id|4:Mg==|353536327ab7bda0fdd49ac36881a5b398f350dfae0b6832bbc65834a7c4c1c5"; admin_id="2|1:0|10:1415709892|8:admin_id|4:Mg==|25902c39a60f8cd87f436d87e3e916fa10d79696504b0752fa3d3bfa94feeeb3"',
            "Content-Type": "application/json; charset=utf-8"
        }

        body = json.dumps({"info_id": 1, "_xsrf":"2|ba4520e5|4ee5b58b3dae8919dbb9e961c720aa4f|1415150939"})
        h = HTTPClient()
        res = h.fetch("http://senguo.cc.monklof.com/infowall/infoCollect", method="POST", headers=headers, body=body)
        assert res.code == 200

# class TestInfoDetail():
#     def test_post(self):
#         headers = {
#             "Cookie": '_xsrf=2|b9d00ee5|4d709b8b3e3ba719d82cc761c4b5844f|1415150939; super_id="2|1:0|10:1415544378|8:super_id|4:Mg==|353536327ab7bda0fdd49ac36881a5b398f350dfae0b6832bbc65834a7c4c1c5"; admin_id="2|1:0|10:1415709892|8:admin_id|4:Mg==|25902c39a60f8cd87f436d87e3e916fa10d79696504b0752fa3d3bfa94feeeb3"',
#             "Content-Type": "application/json; charset=utf-8"
#         }
#
#         body = json.dumps({"info_id": 1, "text": "comment:liu chao shi sha b", "_xsrf":"2|ba4520e5|4ee5b58b3dae8919dbb9e961c720aa4f|1415150939"})
#         h = HTTPClient()
#         res = h.fetch("http://senguo.cc.monklof.com/infowall/infoDetail/comment", method="POST", headers=headers, body=body)
#         assert res.code == 200

# class TestInfoIssue():
#     def test_post(self):
#         headers = {
#             "Cookie": '_xsrf=2|b9d00ee5|4d709b8b3e3ba719d82cc761c4b5844f|1415150939; super_id="2|1:0|10:1415544378|8:super_id|4:Mg==|353536327ab7bda0fdd49ac36881a5b398f350dfae0b6832bbc65834a7c4c1c5"; admin_id="2|1:0|10:1415709892|8:admin_id|4:Mg==|25902c39a60f8cd87f436d87e3e916fa10d79696504b0752fa3d3bfa94feeeb3"',
#             "Content-Type": "application/json; charset=utf-8"
#         }
#
#         body = json.dumps({"info_type": 1, "text": "我是廖斯敏", "fruit_type": [1, 2, 3, 4],"img_url":["a", "b"], "_xsrf":"2|76fc44e5|825cd18bf117ed1917008d610b99ce4f|1415150939"})
#         h = HTTPClient()
#         res = h.fetch("http://senguo.cc.monklof.com/infowall/infoIssue", method="POST", headers=headers, body=body)
#         assert res.code==200