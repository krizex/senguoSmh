__author__ = 'liaosimin'
from sqlalchemy import create_engine, func, ForeignKey, Column
from sqlalchemy.types import String, Integer, Text, Boolean, Float
from sqlalchemy.orm import relationship, backref
from sqlalchemy.orm.exc import NoResultFound

from dal.db_configs import MapBase, DBSession
from dal.dis_dict import dis_dict
import json
import time
from dal.db_configs import MapBase

class Goods(MapBase):
    __tablename__ = "goods"

    id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)

    price = Column(Integer)
    sales_volume = Column(Integer)
    intro = Column(String(100))
    imgurl = Column(String(2048))
