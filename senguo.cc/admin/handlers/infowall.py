__author__ = 'liaosimin'
from handlers.base import AdminBaseHandler
import tornado.web
import dal.models as models

class Home(AdminBaseHandler):
    def initialize(self, action):
        self._action = action

    def get(self):
        if self._action == "supply":
            infos = self.session.query(models.Info).filter_by(info_type = models.INFO_TYPE.SUPPLY).all()
        elif self._action == "demand":
            infos = self.session.query(models.Info).filter_by(info_type = models.INFO_TYPE.DEMAND).all()
        elif self._action == "other":
            infos = self.session.query(models.Info).filter_by(info_type = models.INFO_TYPE.OTHER).all()
        else:
            return self.send_error(404)
        return self.render("infowall/home.html", context=dict(infos=infos))

class InfoDetail(AdminBaseHandler):

    @AdminBaseHandler.check_arguments("info_id:int")
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
        return self.send_success()

class InfoCollect(AdminBaseHandler):

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
    @AdminBaseHandler.check_arguments("info_type:int", "text:str", "fruit_type:list", "img_url:list")
    def post(self):
        info = models.Info()
        info.type = self.args["info_type"]
        info.text = self.args["text"]
        if self.args["fruit_type"]:
            for fruit_id in self.args["fruit_type"]:
                try:
                    fruit_type = self.session.query(models.FruitType).filter_by(id = fruit_id).one()
                except:
                    return self.send_error(404)
                info.fruit_type.append(fruit_type)
        if self.args["img_url"]:
            for img_url in self.args["img_url"]:
                info.fruit_img.append(models.FruitImg(img_url=img_url))
        self.current_user.info.append(info)
        self.session.commit()
        return self.send_success()

