#! /usr/bin/env python3 
import sys, os


sys.path.append(os.path.abspath(os.path.join(
    os.path.dirname(__file__),"../..")))

import dal.models as models
import hashlib

super_users = [
dict(
     unionid = "oxkR_jnsymdE6pS1NWzZ4JZEdOSU",
     openid = "o5SQ5t-HoYrwjXUAN0kAi1vTGqWU",
     country = "中国",
     province = "湖北",
     city = "武汉",
     headimgurl="http://wx.qlogo.cn/mmopen/WwMqe94QsZqvxIQMtrJVSZiaMPy3mibbZc8ic5UBffWzl1tItJVhJ2SJQ2yKA6WQibsIicNAn7Zw0OHib4y4yEsuzwsT6PwRnPPkdp/0",
     nickname="乔迁",
     sex=1),
dict(
     unionid = "oxkR_jsW-FuDG4T6kEjbZqoOeBnQ",
     openid = "o5SQ5t_xLVtTysosFBbEgaFjlRSI",
     country = "中国",
     province = "湖北",
     city = "武汉",
     headimgurl="http://wx.qlogo.cn/mmopen/ajNVdqHZLLBjOHyOeloTE0xiaBoDYqEgGFstIpn78cbKkJEQCRNmJbwrPecdpto6ialBLNTxy7LmvcCUwco2BqcA/0",
     nickname="Woody",
     sex=1),
dict(
     unionid = "oxkR_jm8co_E3_TlR5THez96UuN8",
     openid = "o5SQ5t3VW_4zFSYhrKghCiOfEojc",
     country = "中国",
     province = "湖北",
     city = "武汉",
     headimgurl="http://wx.qlogo.cn/mmopen/ajNVdqHZLLDkH4L0vPFzpLFpFAJnBakcJrfriaic8D1RtJUG1aHMuWLTv5QlldheEF4WwtV6TbFo53whBbBvzjPA/0",
     nickname="风轻扬",
     sex=1),
dict(
     unionid = "oxkR_jl1wZKFLAa5TFI-t0pWxmh8",
     openid = "o5SQ5t7LKwgictyW60gRSq4fYYJw",
     country = "中国",
     province = "湖北",
     city = "武汉",
     headimgurl="http://wx.qlogo.cn/mmopen/AibiaqE7dwD8UxdGEZGKqUhK3Y0QsFgeD9rVZMEbUhLnYGXCX9ZOu6vAO4OEVz3KhibibO9qGFRUawQdG1gB5NKpFWJyMX2GkGc7/0",
     nickname="黄铁森@森果senguo.cc",
     sex=1),
dict(
     unionid = "oxkR_jsr9QiWscrxTSRhYSDTssLU",
     openid = "o5SQ5tyC5Ab_g6PP2uaJV1xe2AZQ",
     country = "中国",
     province = "湖北",
     city = "武汉",
     headimgurl="http://wx.qlogo.cn/mmopen/XiaNUE39hM3WeU66LCia2QVBmiaLucl4hYKTaSbq5wepalu7gdgpEIG3cThwcia3B8tb0UZXoicLiaWVjZ3PgSibRoccRYsicvx0pUwB/0",
     nickname="喵七七",
     sex=2),
      ]

if __name__ == "__main__":
    choice = input("""创建超级管理员， 输入yes继续：""")
    if choice == "yes":
        s = models.DBSession()
        for u in super_users:
            models.SuperAdmin.register_with_wx(s, u)
        s.close()
        print("create success")
