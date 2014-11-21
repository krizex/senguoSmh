__author__ = 'liaosimin'
from handlers.base import AdminBaseHandler
import tornado.web
import dal.models as models
from sqlalchemy import desc
import qiniu
import time
from settings import *

class Home(AdminBaseHandler):
    def initialize(self, action):
        self._action = action

    def get(self):
        if self._action == "supply":
            q = self.session.query(models.Info).filter_by(type = models.INFO_TYPE.SUPPLY)
        elif self._action == "demand":
            q = self.session.query(models.Info).filter_by(type = models.INFO_TYPE.DEMAND)
        elif self._action == "other":
            q = self.session.query(models.Info).filter_by(type = models.INFO_TYPE.OTHER)
        else:
            return self.send_error(404)
        infos = q.order_by(desc(models.Info.create_date)).all()
        return self.render("infowall/home.html", context=dict(infos=infos,action=self._action))

class InfoDetail(AdminBaseHandler):

    def get(self, info_id):
        try:
            info = self.session.query(models.Info).filter_by(id=info_id).one()
        except:
            info = None
        if not info:
            return self.send_error(404)
        return self.render("infowall/info-detail.html", context=dict(info=info))

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("info_id:int", "text:str")
    def post(self):
        comment = models.Comment(text=self.args["text"], admin_id=self.current_user.id, info_id=self.args["info_id"])
        self.session.add(comment)
        self.session.commit()
        com = []
        comment.__relationship_props__=["admin"]
        com.append(comment.safe_props())
        return self.send_success(comment=com)

class InfoCollect(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self):
        return self.render("fruitzone/info-collect.html")


    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("info_id:int")
    def post(self):
        try:
            info = self.session.query(models.Info).filter_by(id=self.args["info_id"]).one()
        except:
            info = None
        if not info:
            return self.send_error(404)
        self.current_user.info_collect.append(info)
        self.session.commit()
        return self.send_success()

class InfoIssue(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self):
        fruit_types = []
        for f_t in self.session.query(models.FruitType).all():
            fruit_types.append(f_t.all_props())
        return self.render("infowall/infoissue.html", context=dict(fruit_types=fruit_types))

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("info_type?:int", "text?:str", "address?:str", "fruit_type?:list", "img_key?:list", "action")
    def post(self):
        if self.args["action"] == "issue_info":
            info = models.Info()
            info.type = self.args["info_type"]
            info.text = self.args["text"]
            info.address = self.args["address"]

            if self.args["fruit_type"]:
                for fruit_id in self.args["fruit_type"]:
                    try:
                        fruit_type = self.session.query(models.FruitType).filter_by(id = fruit_id).one()
                    except:
                        return self.send_error(404)
                    info.fruit_type.append(fruit_type)
            if self.args["img_key"]:
                for key in self.args["img_key"]:
                    info.fruit_img.append(models.FruitImg(img_url=INFO_IMG_HOST+key))
            self.current_user.info.append(info)
            self.session.commit()
            return self.send_success()
        elif self.args["action"] == "issue_img":
            q = qiniu.Auth(ACCESS_KEY, SECRET_KEY)
            token = q.upload_token(BUCKET_INFO_IMG, expires=120)
            return self.send_success(token=token, key=str(time.time()))