__author__ = 'liaosimin'
#老系统向新系统迁移数据
from pymongo import Connection
con = Connection('121.199.61.126', 27017)
f = con['wf_root'].areas.find()
print(f)