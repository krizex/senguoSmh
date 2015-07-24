from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker,scoped_session
from sqlalchemy import create_engine
# import dal.models as models

MYSQL_DRIVER = "mysqlconnector"
MYSQL_USERNAME = "monk"
MYSQL_PASSWORD = "test123"
DB_NAME = "senguocc"
#from settings import MYSQL_DRIVER, MYSQL_USERNAME, MYSQL_PASSWORD, DB_NAME

if __name__ == '__main__':

	engine = create_engine("mysql+{driver}://{username}:{password}@127.0.0.1/{database}".format(
	    driver=MYSQL_DRIVER,username=MYSQL_USERNAME,password=MYSQL_PASSWORD, database=DB_NAME))
	MapBase = declarative_base(bind=engine)
	DBSession = sessionmaker(bind=engine, expire_on_commit=False)
	session = scoped_session(DBSession)

	access = session.query().all()
	print(access)
