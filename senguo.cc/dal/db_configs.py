from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

from settings import MYSQL_DRIVER, MYSQL_USERNAME, MYSQL_PASSWORD, DB_NAME

engine = create_engine("mysql+{driver}://{username}:{password}@127.0.0.1/{database}".format(
    driver=MYSQL_DRIVER,username=MYSQL_USERNAME,password=MYSQL_PASSWORD, database=DB_NAME))
MapBase = declarative_base(bind=engine)
DBSession = sessionmaker(bind=engine)
