# 测试数据库连接
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker,scoped_session
# from sqlalchemy import create_engine
# # import dal.models as models

# MYSQL_DRIVER = "mysqlconnector"
# MYSQL_USERNAME = "monk"
# MYSQL_PASSWORD = "test123"
# DB_NAME = "senguocc"
# #from settings import MYSQL_DRIVER, MYSQL_USERNAME, MYSQL_PASSWORD, DB_NAME

# if __name__ == '__main__':

# 	engine = create_engine("mysql+{driver}://{username}:{password}@127.0.0.1/{database}".format(
# 	    driver=MYSQL_DRIVER,username=MYSQL_USERNAME,password=MYSQL_PASSWORD, database=DB_NAME))
# 	MapBase = declarative_base(bind=engine)
# 	DBSession = sessionmaker(bind=engine, expire_on_commit=False)
# 	session = scoped_session(DBSession)

# 	access = session.query().all()
# 	print(access)

# 测试判断点在多边形中
def isInsidePolygon(pt, poly):
    c = False
    i = -1
    l = len(poly)
    j = l - 1
    print(pt)
    while i < l-1:
        i += 1
        print(i,poly[i], j,poly[j])
        if ((poly[i]["lat"] <= pt["lat"] and pt["lat"] < poly[j]["lat"]) or (poly[j]["lat"] <= pt["lat"] and pt["lat"] < poly[i]["lat"])):
            if (pt["lng"] < (poly[j]["lng"] - poly[i]["lng"]) * (pt["lat"] - poly[i]["lat"]) / (poly[j]["lat"] - poly[i]["lat"]) + poly[i]["lng"]):
                c = not c
        j = i
    return c
 
if __name__ == '__main__':
    abc = [{'lat':30.51742, 'lng':114.4183},{'lat':30.51542, 'lng':114.4203},{'lat':30.51742, 'lng':114.4223},{'lat':30.51942, 'lng':114.4203}]
    print(isInsidePolygon({'lat':37.89027, 'lng':112.5508}, abc))