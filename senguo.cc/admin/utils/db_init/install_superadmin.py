#! /usr/bin/env python3 
import sys, os


sys.path.append(os.path.abspath(os.path.join(
    os.path.dirname(__file__),"../..")))

import dal.models as models
import hashlib

if __name__ == "__main__":
    choice = input("""
    这将会创造一个(用户名, 密码)为(superlady, super)的超级管理员， 输入yes继续：""")
    if choice == "yes":
        u = models.SuperAdmin(username="superlady", password=hashlib.sha256(b'super').hexdigest(), email="superlady@senguo.cc")
        s = models.DBSession()
        s.add(u)
        s.commit()
        s.close()
        print("create success")
