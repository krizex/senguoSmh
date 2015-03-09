from handlers.base import AdminBaseHandler
import dal.models as models
import tornado.web
from settings import *
import time
import datetime
from sqlalchemy import func, desc, and_, or_, exists
import qiniu
from dal.dis_dict import dis_dict

# 登陆处理
class Access(AdminBaseHandler):
    def initialize(self, action):
        self._action = action
    def prepare(self):
        """prepare会在get、post等函数运行前运行，如果不想父类的prepare函数起作用的话就把他覆盖掉"""
        pass
    def get(self):
        next_url = self.get_argument('next', '')
        if self._action == "login":
            next_url = self.get_argument("next", "")
            return self.render("admin/login.html", 
                                 context=dict(next_url=next_url))
        elif self._action == "logout":
            self.clear_cookie("shop_id", domain=ROOT_HOST_NAME)
            self.clear_current_user()
            return self.redirect(self.reverse_url("fruitzoneHome"))
        elif self._action == "oauth":
            self.handle_oauth()
        else:
            return self.send_error(404)

    @AdminBaseHandler.check_arguments("phone", "password", "next?")
    def post(self):
        u = models.ShopAdmin.login_by_phone_password(self.session, self.args["phone"], self.args["password"])
        if not u:
            return self.send_fail(error_text = "用户名或密码错误")
        self.set_current_user(u, domain=ROOT_HOST_NAME)
        self.redirect(self.args.get("next", self.reverse_url("fruitzoneHome")))
        return self.send_success()

    @AdminBaseHandler.check_arguments("code", "state?", "mode")
    def handle_oauth(self):
        # todo: handle state
        code =self.args["code"]
        mode = self.args["mode"]
        print("mode: ", mode , ", code get:", code)
        if mode not in ["mp", "kf"]:
            return self.send_error(400)

        userinfo = self.get_wx_userinfo(code, mode)
        if not userinfo:
            return self.redirect(self.reverse_url("adminLogin"))
        u = models.ShopAdmin.register_with_wx(self.session, userinfo)
        self.set_current_user(u, domain=ROOT_HOST_NAME)
        
        next_url = self.get_argument("next", self.reverse_url("fruitzoneHome"))
        return self.redirect(next_url)

# 商家后台首页
class Home(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self):
        # if not self.current_user.shops:
        #     return self.write("你还没有店铺，请先申请")
        # if not self.current_shop: #设置默认店铺
        #     self.current_shop=self.current_user.shops[0]
        #     self.set_secure_cookie("shop_id", str(self.current_shop.id), domain=ROOT_HOST_NAME)
        order_sum = self.session.query(models.Order).filter_by(shop_id=self.current_shop.id).count()
        new_order_sum = order_sum - (self.current_shop.new_order_sum or 0)
        self.current_shop.new_order_sum = order_sum

        follower_sum = self.session.query(models.CustomerShopFollow).filter_by(shop_id=self.current_shop.id).count()
        new_follower_sum = follower_sum - (self.current_shop.new_follower_sum or 0)
        self.current_shop.new_follower_sum = follower_sum

        new_sys_notices = self.session.query(models.SysNotice).\
            filter((models.SysNotice.create_time >= datetime.datetime.now()-datetime.timedelta(10))).all()
        sys_notices = self.session.query(models.SysNotice).\
            filter((models.SysNotice.create_time < datetime.datetime.now()-datetime.timedelta(10))).all()
        self.session.commit()
        return self.render("admin/home.html", new_order_sum=new_order_sum, order_sum=order_sum,
                           new_follower_sum=new_follower_sum, follower_sum=follower_sum,
                           new_sys_notices=new_sys_notices, sys_notices=sys_notices, context=dict())
    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("shop_id:int")
    def post(self):  # 商家多个店铺之间的切换
        shop_id = self.args["shop_id"]
        try:shop = self.session.query(models.Shop).filter_by(id=shop_id).one()
        except:return self.send_error(404)
        if shop.admin != self.current_user:
            return self.send_error(403)#必须做权限检查：可能这个shop并不属于current_user
        self.set_secure_cookie("shop_id", str(shop_id), domain=ROOT_HOST_NAME)
        return self.send_success()

# 订单统计
class OrderStatic(AdminBaseHandler):

    def get(self):
        return self.render("admin/order-count.html",context=dict(subpage='orderstatic'))

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action:str")
    def post(self):
        action = self.args["action"]
        if action == "sum":
            return self.sum()
        elif action == "order_time":
            return self.order_time()
        elif action == "recive_time":
            return self.recive_time()
        elif action == "order_table":
            return self.order_table()

    @AdminBaseHandler.check_arguments("page:int", "type:int")
    def sum(self):
        page = self.args["page"]
        type = self.args["type"]
        if page == 0:
            now = datetime.datetime.now()
            start_date = datetime.datetime(now.year, now.month, 1)
            end_date = now
        else:
            date = self.monthdelta(datetime.datetime.now(), page)
            start_date = datetime.datetime(date.year, date.month, 1)
            end_date = datetime.datetime(date.year, date.month, date.day)

        orders = self.session.query(models.Order.id, models.Order.create_date,
                                    models.Order.totalPrice, models.Order.type,
                                    models.Order.pay_type). \
            filter(models.Order.shop_id == self.current_shop.id,
                   models.Order.create_date >= start_date,
                   models.Order.create_date <= end_date).all()

        data = {}
        for x in range(1, end_date.day+1):  # 初始化数据
            data[x] = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        if type == 1:
            for order in orders:
                data[order[1].day][1] += 1
                if order[3] == 2:
                    data[order[1].day][2] += 1
                else:
                    data[order[1].day][3] += 1
                if order[4] == 1:
                    data[order[1].day][4] += 1
                else:
                    data[order[1].day][5] += 1
        elif type == 2:
            for order in orders:
                data[order[1].day][1] += order[2]
                if order[3] == 2:
                    data[order[1].day][2] += order[2]
                else:
                    data[order[1].day][3] += order[2]
                if order[4] == 1:
                    data[order[1].day][4] += order[2]
                else:
                    data[order[1].day][5] += order[2]
        else:
            return self.send_error(404)
        return self.send_success(data=data)

    @AdminBaseHandler.check_arguments("type:int")
    def order_time(self):
        type = self.args["type"]
        q = self.session.query(func.hour(models.Order.create_date), func.count()).\
                filter_by(shop_id=self.current_shop.id)
        if type == 1:  # 累计数据
            pass
        elif type == 2:  # 昨天数据
            now = datetime.datetime.now() - datetime.timedelta(1)
            start_date = datetime.datetime(now.year, now.month, now.day, 0)
            end_date = datetime.datetime(now.year, now.month, now.day, 23)
            q = q.filter(models.Order.create_date >= start_date,
                       models.Order.create_date <= end_date)
        else:
            return self.send_error(404)
        ss = q.group_by(func.hour(models.Order.create_date)).all()
        data = {}
        for key in range(0, 24):
            data[key] = 0
        for s in ss:
            data[s[0]] = s[1]
        return self.send_success(data=data)


    @AdminBaseHandler.check_arguments("type:int")
    def recive_time(self):
        type = self.args["type"]
        q = self.session.query(models.Order.type, models.Order.start_time, models.Order.end_time).\
            filter_by(shop_id=self.current_shop.id)
        if type == 1:
            orders = q.all()
        elif type == 2:
            now = datetime.datetime.now() - datetime.timedelta(1)
            start_date = datetime.datetime(now.year, now.month, now.day, 0)
            end_date = datetime.datetime(now.year, now.month, now.day, 23)
            orders = q.filter(models.Order.create_date >= start_date,
                              models.Order.create_date <= end_date).all()
        else:
            return self.send_error(404)
        stop_range = self.current_shop.config.stop_range
        data = {}
        for key in range(0, 24):
            data[key] = 0
        for order in orders:
            if order[0] == 1:  # 立即送收货时间估计
                data[order[1].hour + (order[1].minute+stop_range)//60] += 1
            else:  # 按时达收货时间估计
                data[(order[1].hour+order[2].hour)//2] += 1
        return self.send_success(data=data)

    @AdminBaseHandler.check_arguments("page:int")
    def order_table(self):
        page = self.args["page"]
        page_size = 15

        start_date = datetime.datetime.now() - datetime.timedelta((page+1)*page_size)
        end_date = datetime.datetime.now() - datetime.timedelta(page*page_size)

        # 日订单数，日总订单金额
        s = self.session.query(models.Order.create_date, func.count(), func.sum(models.Order.totalPrice)).\
            filter_by(shop_id=self.current_shop.id).\
            filter(models.Order.create_date >= start_date,
                   models.Order.create_date <= end_date).\
            group_by(func.year(models.Order.create_date),
                     func.month(models.Order.create_date),
                     func.day(models.Order.create_date)).\
            order_by(desc(models.Order.create_date)).all()

        # 总订单数
        total = self.session.query(func.sum(models.Order.totalPrice), func.count()).\
            filter_by(shop_id=self.current_shop.id).\
            filter(models.Order.create_date <= end_date).all()
        total = list(total[0])

        # 日老用户订单数
        ids = self.old_follower_ids(self.current_shop.id)
        s_old = self.session.query(models.Order.create_date, func.count()).\
            filter(models.Order.create_date >= start_date,
                   models.Order.create_date <= end_date,
                   models.Order.customer_id.in_(ids)).\
            group_by(func.year(models.Order.create_date),
                     func.month(models.Order.create_date),
                     func.day(models.Order.create_date)).\
            order_by(desc(models.Order.create_date)).all()

        # 总老用户订单数
        old_total = self.session.query(models.Order).\
            filter_by(shop_id=self.current_shop.id).\
            filter(models.Order.create_date <= end_date,
                   models.Order.customer_id.in_(ids)).count()


        data = []
        i = 0
        j = 0
        # data的封装格式为：[日期，日订单数，累计订单数，日订单总金额，累计订单总金额，日老用户订单数，累计老用户订单数]
        for x in range(0, 15):
            date = (datetime.datetime.now() - datetime.timedelta(x+page*page_size))
            if i < len(s) and (datetime.datetime.now()-s[i][0]).days == x+(page*page_size):
                if j < len(s_old) and (datetime.datetime.now()-s_old[j][0]).days == x+(page*page_size):
                    data.append((date.strftime('%Y-%m-%d'), s[i][1], total[1], s[i][2], total[0], s_old[j][1], old_total))
                    total[1] -= s[i][1]
                    total[0] -= s[i][2]
                    old_total -= s_old[j][1]
                    i += 1
                    j += 1
                else:
                    data.append((date.strftime('%Y-%m-%d'), s[i][1], total[1], s[i][2], total[0], 0, old_total))
                    total[1] -= s[i][1]
                    total[0] -= s[i][2]
                    i += 1
            else:
                data.append((date.strftime('%Y-%m-%d'), 0, total[1], 0, total[0], 0, old_total))
            if total[1] <= 0:
                break
        first_order = self.session.query(models.Order).\
            filter_by(shop_id=self.current_shop.id).\
            order_by(models.Order.create_date).first()
        if first_order:  # 新开的店铺一个order都没有，所以要判断一下
            page_sum = (datetime.datetime.now() - first_order.create_date).days//15 + 1
        else:
            page_sum = 0
        return self.send_success(page_sum=page_sum, data=data)

    # 老用户的id
    def old_follower_ids(self, shop_id):
        q = self.session.query(models.Order.customer_id).\
            filter_by(shop_id=shop_id).\
            group_by(models.Order.customer_id).\
            having(func.count(models.Order.customer_id) > 1).all()
        ids = [x[0] for x in q]
        return ids


# 用户统计
class FollowerStatic(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self):
        return self.render("admin/user-count.html",context=dict(subpage='userstatic'))

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action:str", "page?:int")
    def post(self):
        action = self.args["action"]

        if action == "curve":
            page = self.args["page"]
            if page == 0:
                now = datetime.datetime.now()
                start_date = datetime.datetime(now.year, now.month, 1)
                end_date = now
            else:
                date = self.monthdelta(datetime.datetime.now(), page)
                start_date = datetime.datetime(date.year, date.month, 1)
                end_date = datetime.datetime(date.year, date.month, date.day)
            followers = self.session.query(models.CustomerShopFollow).\
                filter(models.CustomerShopFollow.shop_id == self.current_shop.id,
                       models.CustomerShopFollow.create_time >= start_date,
                       models.CustomerShopFollow.create_time <= end_date).all()
            data = {}
            for x in range(1, end_date.day+1):  # 初始化数据
                data[x] = 0
            for follower in followers:
                data[follower.create_time.day] += 1
            return self.send_success(data=data)

        elif action == "table":
            page = self.args["page"]
            page_size = 15

            start_date = datetime.datetime.now() - datetime.timedelta((page+1)*page_size)
            end_date = datetime.datetime.now() - datetime.timedelta(page*page_size)

            s = self.session.query(models.CustomerShopFollow.create_time, func.count()).\
                filter_by(shop_id=self.current_shop.id).\
                filter(models.CustomerShopFollow.create_time >= start_date,
                       models.CustomerShopFollow.create_time <= end_date).\
                group_by(func.year(models.CustomerShopFollow.create_time),
                         func.month(models.CustomerShopFollow.create_time),
                         func.day(models.CustomerShopFollow.create_time)).\
                order_by(desc(models.CustomerShopFollow.create_time)).all()

            total = self.session.query(models.CustomerShopFollow).\
                filter_by(shop_id=self.current_shop.id).\
                filter(models.CustomerShopFollow.create_time <= end_date).count()
            data = []
            i = 0
            for x in range(0, 15):
                date = (datetime.datetime.now() - datetime.timedelta(x+page*page_size))
                if i < len(s) and (datetime.datetime.now()-s[i][0]).days == x+(page*page_size):
                    data.append((date.strftime('%Y-%m-%d'), s[i][1], total))
                    total -= s[i][1]
                    i += 1
                else:
                    data.append((date.strftime('%Y-%m-%d'), 0, total))
                if total <= 0:
                    break
            first_follower = self.session.query(models.CustomerShopFollow).\
                filter_by(shop_id=self.current_shop.id).\
                order_by(models.CustomerShopFollow.create_time).first()
            if first_follower:
                page_sum = (datetime.datetime.now() - first_follower.create_time).days//15 + 1
            else:
                page_sum = 0
            return self.send_success(page_sum=page_sum, data=data)

        elif action == "sex":
            male_sum = self.session.query(models.Accountinfo).\
                join(models.CustomerShopFollow,
                     models.Accountinfo.id == models.CustomerShopFollow.customer_id).\
                filter(models.CustomerShopFollow.shop_id == self.current_shop.id,
                       models.Accountinfo.sex == 1).count()
            female_sum = self.session.query(models.Accountinfo).\
                join(models.CustomerShopFollow,
                     models.Accountinfo.id == models.CustomerShopFollow.customer_id).\
                filter(models.CustomerShopFollow.shop_id == self.current_shop.id, models.Accountinfo.sex == 2).count()
            total = self.session.query(models.Accountinfo).\
                join(models.CustomerShopFollow,
                     models.Accountinfo.id == models.CustomerShopFollow.customer_id).\
                filter(models.CustomerShopFollow.shop_id == self.current_shop.id).count()
            return self.send_success(male_sum=male_sum, female_sum=female_sum, total=total)

class Comment(AdminBaseHandler):
    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action:str", "page:int")
    def get(self):
        action = self.args["action"]
        page = self.args["page"]
        page_size = 20

        if action == "all":
            comments = self.get_comments(self.current_shop.id, page, page_size)
        elif action == "favor":
            s = self.session.query(models.ShopFavorComment.order_id).\
                filter(models.ShopFavorComment.shop_id == self.current_shop.id).all()
            order_ids = [x[0] for x in s]
            comments = self.session.query(models.Accountinfo.headimgurl, models.Accountinfo.nickname,
                                          models.Order.comment, models.Order.comment_create_date, models.Order.id,
                                          models.Order.comment_reply).\
                filter(models.Order.id.in_(order_ids), models.Order.status == 6,
                       models.Order.customer_id == models.Accountinfo.id).\
                order_by(desc(models.Order.comment_create_date)).offset(page*page_size).limit(page_size).all()
        else:
            return self.send_error(404)
        return self.render("admin/comment.html", action = action, comments=comments, context=dict(subpage='comment'))

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "reply?:str", "order_id:int")
    def post(self):
        action = self.args["action"]
        reply = self.args["reply"]
        order_id = self.args["order_id"]
        if action == "reply":
            try:
                order = self.session.query(models.Order).filter_by(id=order_id).one()
            except:
                return self.send_error(404)
            if order.shop_id != self.current_shop.id:
                return self.send_error(403)
            order.comment_reply = reply
            self.session.commit()
        elif action == "favor":
            try:
                self.session.add(models.ShopFavorComment(shop_id=self.current_shop.id, order_id=order_id))
                self.session.commit()
            except:
                return self.send_fail("已收藏成功")
        else:
            return self.send_error(404)

        return self.send_success()

# 订单管理
class Order(AdminBaseHandler):
    # todo: 当订单越来越多时，current_shop.orders 会不会越来越占内存？

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("order_type:int", "order_status:int")
    #order_type(1:立即送 2：按时达);order_status(1:未处理，2：未完成，3：已送达，4：售后，5：所有订单)
    def get(self):
        order_type = self.args["order_type"]
        order_status = self.args["order_status"]
        orders = []
        if order_type == 10:  # 搜索订单：为了格式统一，order_status为order.num
            orders = self.session.query(models.Order).\
                filter_by(num=order_status, shop_id=self.current_shop.id).all()
            order_type = 1
        elif order_status == 1:
            orders = [x for x in self.current_shop.orders if x.type == order_type and x.status == 1]
        elif order_status == 5:#all
            orders = [x for x in self.current_shop.orders if x.type == order_type ]
        elif order_status == 2:#unfinish
            orders = [x for x in self.current_shop.orders if x.type == order_type and x.status in [2, 3, 4]]
        elif order_status == 3:
            orders = [x for x in self.current_shop.orders if x.type == order_type and x.status in (5, 6)]
        elif order_status == 4:
            pass
        else:
            return self.send.send_error(404)

        data = []
        delta = datetime.timedelta(1)
        for order in orders:
            order.__protected_props__ = ['customer_id', 'shop_id', 'JH_id', 'SH1_id', 'SH2_id',
                                         'comment_create_date', 'start_time', 'end_time',        'create_date','today','type']
            d = order.safe_props(False)
            d['fruits'] = eval(d['fruits'])
            d['mgoods'] = eval(d['mgoods'])
            d['create_date'] = order.create_date.strftime('%Y-%m-%d %R')
            if order.start_time.minute <10:
                w_start_time_minute ='0' + str(order.start_time.minute)
            else:
                w_start_time_minute = str(order.start_time.minute)
            if order.end_time.minute < 10:
                w_end_time_minute = '0' + str(order.end_time.minute)
            else:
                w_end_time_minute = str(order.end_time.minute)

            if order.type == 2 and order.today==2:
                w_date = order.create_date + delta
            else:
                w_date = order.create_date
            d["sent_time"] = "%s %d:%s ~ %d:%s" % ((w_date).strftime('%Y-%m-%d'),
                                                order.start_time.hour, w_start_time_minute,
                                                  order.end_time.hour, w_end_time_minute)
            staffs = self.session.query(models.ShopStaff).join(models.HireLink).filter(and_(
                models.HireLink.work == 3, models.HireLink.shop_id == self.current_shop.id)).all()
            SH2s = []
            for staff in staffs:
                staff_data = {"id": staff.id, "realname": staff.accountinfo.realname, "phone": staff.accountinfo.phone}
                SH2s.append(staff_data)
                if staff.id == order.SH2_id:  # todo JH、SH1
                    d["SH2"] = staff_data
            d["SH2s"] = SH2s
            data.append(d)
        return self.render("admin/orders.html", data = data, order_type=order_type,
                           count=self._count(), context=dict(subpage='order'))



    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data")
    def post(self):
        action = self.args["action"]
        data = self.args["data"]
        if action == "add_period":
            start_time = datetime.time(data["start_hour"],data["start_minute"])
            end_time = datetime.time(data["end_hour"],data["end_minute"])
            period = models.Period(config_id=self.current_shop.id,
                                   name=data["name"],
                                   start_time=start_time,
                                   end_time=end_time)
            self.session.add(period)
            self.session.commit()
            return self.send_success(period_id=period.id)
        elif action in ("edit_period", "edit_period_active"):
            period = next((x for x in self.current_shop.config.periods if x.id == data["period_id"]), None)
            if not period:
                return self.send_fail("没找到该时间段", 403)
            if action == "edit_period":
                start_time = datetime.time(data["start_hour"], data["start_minute"])
                end_time = datetime.time(data["end_hour"], data["end_minute"])
                if start_time >= end_time:
                    return self.send_fail("时间段开始时间必须比结束时间小")
                period.name = data["name"]
                period.start_time = start_time
                period.end_time = end_time
            elif action == "edit_period_active":
                period.active = 1 if period.active == 2 else 2
            self.session.commit()
        elif action == "del_period":
            try: q = self.session.query(models.Period).filter_by(id=int(data["period_id"]))
            except:return self.send_error(404)
            q.delete()
            self.session.commit()
        elif action == "edit_ontime_on":
            self.current_shop.config.ontime_on = not self.current_shop.config.ontime_on
            self.session.commit()
        elif action == "edit_min_charge_on_time":  # 按时达起送金额
            self.current_shop.config.min_charge_on_time = data["min_charge_on_time"]
            self.session.commit()
        elif action == "edit_stop_range":  # 下单截止时间（分钟）
            self.current_shop.config.stop_range = data["stop_range"] or 0
            self.session.commit()
        elif action == "edit_freight_on_time":
            self.current_shop.config.freight_on_time = data["freight_on_time"] or 0
            self.session.commit()
        elif action == "edit_now_on":
            self.current_shop.config.now_on = not self.current_shop.config.now_on
            self.session.commit()
        elif action == "edit_now_config":
            start_time = datetime.time(data["start_hour"], data["start_minute"])
            end_time = datetime.time(data["end_hour"], data["end_minute"])
            self.current_shop.config.update(session=self.session,min_charge_now=data["min_charge_now"],
                                            start_time_now=start_time, end_time_now=end_time,
                                            freight_now=data["freight_now"] or 0)
        elif action in ("edit_remark", "edit_SH2", "edit_status", "edit_totalPrice", 'del_order', 'print'):
            order = next((x for x in self.current_shop.orders if x.id==int(data["order_id"])), None)
            if not order:
                return self.send_fail("没找到该订单")
            if action == "edit_remark":
                order.update(session=self.session, remark=data["remark"])
            elif action == "edit_SH2":
                SH2 = next((x for x in self.current_shop.staffs if x.id == int(data["staff_id"])), None)
                if not SH2:
                    return self.send_fail("没找到该送货员")
                order.update(session=self.session, status=4, SH2_id=int(data["staff_id"]))
            elif action == "edit_status":
                order.update(session=self.session, status=data["status"])
            elif action == "edit_totalPrice":
                order.update(session=self.session, totalPrice=data["totalPrice"])
            elif action == "del_order":
                order.update(session=self.session, status=0)
            elif action == "print":
                order.update(session=self.session, isprint=1)
        # elif action == "search":
        #     order = self.session.query(models.Order).filter(and_(
        #         models.Order.id == int(data["order_id"]), models.Order.shop_id == self.current_shop.id)).first()
        #     if order:
        #         order.__protected_props__ = [customer_id, shop_id, today, JH_id, SH1_id, comment, comment_create_date,
        #                                      start_time, end_time, create_date, active, fruits, mgoods]
        #         out_data = order.safe_props()
        #         out_data["sent_time"] = "%d:%d ~ %d:%d" % (order.start_time.hour, order.start_time.minute,
        #                                               order.end_time.hour, order.end_time.minute)
        #         out_data["goods"] = []
        #         fruits = eval(order.fruits)
        #         for key in fruits:
        #             out_data["goods"].append("%s:%s*%d" % (fruits[key]["fruit_name"],fruits[key]["charge"],
        #                                                  fruits[key]["num"]))
        #         mgoods = eval(order.mgoods)
        #         for key in mgoods:
        #             out_data["goods"].append("%s:%s*%d" % (mgoods[key]["mgoods_name"],mgoods[key]["charge"],
        #                                                  mgoods[key]["num"]))
        #         out_data = {"sent_time": "%d:%d ~ %d:%d" % (order.start_time.hour, order.start_time.minute,
        #                                                  order.end_time.hour, order.end_time.minute),
        #                     "id": order.id,
        #                     "total_price": order.totalPrice,
        #                     "phone": order.phone,
        #                     "receiver": order.receiver}
        #
        #     else:order = {}
        #     Staffs = self.session.query(models.ShopStaff).join(models.HireLink).filter(and_(
        #         models.HireLink.work == 3, models.HireLink.shop_id == self.current_shop.id)).all()
        #     SH2s=[]
        #     for staff in Staffs:
        #         SH2s.append(staff.safe_props())
        #     return self.send_success(order=order, SH2s=SH2s)

        else:
            return self.send_error(404)
        return self.send_success()

    def _count(self):
        count = {10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0,
                 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0}
        for order in self.current_shop.orders:
            count[order.type*10+5] += 1
            if order.status == 0:
                count[order.type*10] += 1
            elif order.status == 1:
                count[order.type*10+1] += 1
            elif order.status in (2, 3, 4):
                count[order.type*10+2] += 1
            elif order.status in (5, 6):
                count[order.type*10+3] += 1
            elif order.status == 10:
                count[order.type*10+4] += 1
        return count

# 商品管理
class Shelf(AdminBaseHandler):

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "id:int")
    def get(self):
        action = self.args["action"]

        fruit_type_d = {}
        if self.args["id"] < 1000:
            fruit_types = self.session.query(models.FruitType).filter("id < 1000").all()
        else:
            fruit_types = self.session.query(models.FruitType).filter("id > 1000").all()
        for fruit_type in fruit_types:
            fruit_type_d[fruit_type.id] = {"code": fruit_type.code, "name": fruit_type.name, "sum": 0}

        if action in ("all", "fruit"):
            fruits=[]
            if action == "all":
                for fruit in self.current_shop.fruits:  # 水果/干果 过滤
                    if (self.args["id"] < 1000 and fruit.fruit_type_id > 1000) or\
                        (self.args["id"] > 1000 and fruit.fruit_type_id < 1000) or fruit.fruit_type_id == 1000:
                        continue
                    fruits.append(fruit)
                    if fruit.active == 1:
                        fruit_type_d[fruit.fruit_type_id]["sum"] += 1
            elif action == "fruit":
                for fruit in self.current_shop.fruits:
                    if fruit.fruit_type_id == self.args["id"]:
                        fruits.append(fruit)
                    if (self.args["id"] < 1000 and fruit.fruit_type_id > 1000) or\
                        (self.args["id"] > 1000 and fruit.fruit_type_id < 1000) or fruit.fruit_type_id == 1000:
                        continue
                    if fruit.active == 1:
                        fruit_type_d[fruit.fruit_type_id]["sum"] += 1
            return self.render("admin/goods-fruit.html", fruits=fruits, fruit_type_d=fruit_type_d,
                               menus=self.current_shop.menus,
                               context=dict(subpage="goods", goodsSubpage="fruit"))
        elif action == "menu":#todo 合法性检查
            try:mgoodses = self.session.query(models.MGoods).filter_by(menu_id=self.args["id"]).all()
            except:return self.send_error(404)
            return self.render("admin/goods-menu.html", mgoodses=mgoodses, menus=self.current_shop.menus,
                               context=dict(subpage="goods", goodsSubpage="menu"))

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data", "id?:int", "charge_type_id?:int")
    def post(self):
        action = self.args["action"]
        data = self.args["data"]
        if action in ["add_fruit", "add_mgoods"]:
            if not (data["charge_types"] and data["charge_types"]):  # 如果没有计价方式、打开market时会有异常
                return self.send_fail("请至少添加一种计价方式")
            if len(data["intro"]) > 100:
                return self.send_fail("商品简介不能超过100字噢亲，再精简谢吧！")
            args={}
            args["name"] = data["name"]
            args["saled"] = data["saled"]
            args["storage"] = data["storage"]
            args["unit"] = data["unit"]
            args["tag"] = data["tag"]
            if data["img_url"]:  # 前端可能上传图片不成功，发来一个空的，所以要判断
                args["img_url"] = SHOP_IMG_HOST + data["img_url"]
            args["intro"] = data["intro"]
            args["priority"] = data["priority"]
            if action == "add_fruit":
                args["fruit_type_id"] = data["fruit_type_id"]
                args["shop_id"] = self.current_shop.id
                fruit = models.Fruit(**args)
                for charge_type in data["charge_types"]:
                    fruit.charge_types.append(models.ChargeType(price=charge_type["price"],
                                                                unit=charge_type["unit"],
                                                                num=charge_type["num"],
                                                                unit_num=charge_type["unit_num"]))
                self.session.add(fruit)
            elif action == "add_mgoods":
                args["menu_id"] = data["menu_id"]
                mgoods = models.MGoods(**args)
                for charge_type in data["charge_types"]:
                    mgoods.mcharge_types.append(models.MChargeType(price=charge_type["price"],
                                                                unit=charge_type["unit"],
                                                                num=charge_type["num"],
                                                                unit_num=charge_type["unit_num"]))
                    self.session.add(mgoods)
            self.session.commit()
            return self.send_success()
        elif action == "add_menu":
            self.session.add(models.Menu(shop_id=self.current_shop.id,name=data["name"]))
            self.session.commit()
        elif action == "edit_menu_name":
            self.session.query(models.Menu).filter_by(id=self.args["id"]).update({models.Menu.name: self.args["data"]})
            self.session.commit()
        elif action == "edit_fruit_img":
            return self.send_qiniu_token("fruit", self.args["id"])
        elif action == "edit_mgoods_img":
            return self.send_qiniu_token("mgoods", self.args["id"])

        elif action in ["add_charge_type", "edit_active", "edit_fruit", "default_fruit_img"]:  # fruit_id
            try:fruit = self.session.query(models.Fruit).filter_by(id=self.args["id"]).one()
            except:return self.send_error(404)
            if fruit.shop != self.current_shop:
                return self.send_error(403)

            if action == "add_charge_type":
                charge_type = models.ChargeType(fruit_id=fruit.id,
                                                price=data["price"],
                                                unit=data["unit"],
                                                num=data["num"],
                                                unit_num=data["unit_num"])
                self.session.add(charge_type)
                self.session.commit()
                return self.send_success()
            elif action == "edit_active":
                if fruit.active == 1:
                    fruit.update(session=self.session, active = 2)
                elif fruit.active == 2:
                    fruit.update(session=self.session, active = 1)
            elif action == "edit_fruit":
                if len(data["intro"]) > 100:
                    return self.send_fail("商品简介不能超过100字噢亲，再精简谢吧！")
                fruit.update(session=self.session,
                                                name = data["name"],
                                                saled = data["saled"],
                                                storage = data["storage"],
                                                unit=data["unit"],
                                                tag = data["tag"],
                                                #img_url = data["img_url"],
                                                intro=data["intro"],
                                                priority=data["priority"])

            elif action == "default_fruit_img":  # 恢复默认图
                fruit.img_url = ''
                self.session.commit()

        elif action in ["del_charge_type", "edit_charge_type"]:  # charge_type_id
            charge_type_id = self.args["charge_type_id"]
            try: q = self.session.query(models.ChargeType).filter_by(id=charge_type_id)
            except:return self.send_error(404)
            if action == "del_charge_type":
                q.delete()
            else:
                q.one().update(session=self.session,price=data["price"],
                         unit=data["unit"],
                         num=data["num"],
                         unit_num=data["unit_num"])
            self.session.commit()
        elif action in ["add_mcharge_type", "edit_m_active", "edit_mgoods", "default_mgoods_img"]:  # mgoods_id
            try:mgoods = self.session.query(models.MGoods).filter_by(id=self.args["id"]).one()
            except:return self.send_error(404)
            if mgoods.menu.shop != self.current_shop:
                return self.send_error(403)

            if action == "add_mcharge_type":
                mcharge_type = models.MChargeType(mgoods_id=mgoods.id,
                                                price=data["price"],
                                                unit=data["unit"],
                                                num=data["num"],
                                                unit_num=data["unit_num"])
                self.session.add(mcharge_type)
                self.session.commit()
                return self.send_success()
            elif action == "edit_m_active":
                if mgoods.active == 1:
                    mgoods.update(session=self.session, active = 2)
                elif mgoods.active == 2:
                    mgoods.update(session=self.session, active = 1)
            elif action == "edit_mgoods":
                if len(data["intro"]) > 100:
                    return self.send_fail("商品简介不能超过100字噢亲，再精简谢吧！")
                mgoods.update(session=self.session,
                                                name = data["name"],
                                                saled = data["saled"],
                                                storage = data["storage"],
                                                unit=data["unit"],
                                                tag = data["tag"],
                                                #img_url = data["img_url"],
                                                intro = data["intro"],
                                                priority=data["priority"])
            elif action == "default_mgoods_img":  # 恢复默认图
                mgoods.img_url = ''
                self.session.commit()

        elif action in ["del_mcharge_type", "edit_mcharge_type"]:  # mcharge_type_id
            mcharge_type_id = self.args["charge_type_id"]
            try: q = self.session.query(models.MChargeType).filter_by(id=mcharge_type_id)
            except:return self.send_error(404)
            if action == "del_mcharge_type":
                q.delete()
            else:
                q.one().update(session=self.session,price=data["price"],
                         unit=data["unit"],
                         num=data["num"],
                         unit_num=data["unit_num"])
            self.session.commit()
        elif action == "add_img":
            return self.send_qiniu_token("add", 0)

        else:
            return self.send_error(404)

        return self.send_success()

# 用户管理
class Follower(AdminBaseHandler):
    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action:str", "order_by:str", "page:int", "wd?:str")
    def get(self):
        action = self.args["action"]
        order_by = self.args["order_by"]
        page = self.args["page"]
        page_size = 20

        count = 1

        if action in ("all", "old"):
            if action == "all":  # 所有用户
                q = self.session.query(models.Customer).join(models.CustomerShopFollow).\
                    filter(models.CustomerShopFollow.shop_id == self.current_shop.id)
                if order_by == "time":
                    q = q.order_by(desc(models.CustomerShopFollow.create_time))
            else:  # 老用户
                q = self.session.query(models.Customer).\
                    join(models.Order).filter(models.Order.shop_id == self.current_shop.id).distinct()
            if order_by == "credits":
                q = q.order_by(desc(models.Customer.credits))
            elif order_by == "balance":
                q = q.order_by(desc(models.Customer.balance))
            count = q.count()
            customers = q.offset(page*page_size).limit(page_size).all()
        elif action == "search":  # 用户搜索，支持根据手机号/真名/昵称搜索
            wd = self.args["wd"]
            if wd.isdigit():  # 判断是否为纯数字，纯数字就按照手机号搜索
                customers = self.session.query(models.Customer).join(models.CustomerShopFollow).\
                    filter(models.CustomerShopFollow.shop_id == self.current_shop.id).\
                    join(models.Accountinfo).filter(models.Accountinfo.phone == int(wd)).all()
            else:  # 按照名字搜索
                customers = self.session.query(models.Customer).join(models.CustomerShopFollow).\
                    filter(models.CustomerShopFollow.shop_id == self.current_shop.id).\
                    join(models.Accountinfo).filter(or_(models.Accountinfo.nickname.like("%%%s%%" % wd),
                                                        models.Accountinfo.realname.like("%%%s%%" % wd))).all()
        else:
            return self.send_error(404)
        for x in range(0, len(customers)):  #
            shop_names = self.session.query(models.Shop.shop_name).join(models.CustomerShopFollow).\
                filter(models.CustomerShopFollow.customer_id == customers[x].id).all()
            customers[x].shop_names = [y[0] for y in shop_names]

        return self.render("admin/user-manage.html", customers=customers, count=count, page_sum=count//page_size + 1,
                           context=dict(subpage='user'))

class Staff(AdminBaseHandler):
    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action")
    def get(self):
        action = self.args["action"]
        staffs = self.current_shop.staffs
        if action == "hire":
            hire_forms = self.session.query(models.HireForm).filter_by(shop_id=self.current_shop.id).all()
            return self.render("admin/staff.html", hire_forms=hire_forms,
                               context=dict(subpage='staff',staffSub='hire'))
        query = self.session.query(models.ShopStaff, models.HireLink).join(models.HireLink).filter(
                models.HireLink.shop_id == self.current_shop.id)
        subpage = 'staff'
        staffSub = ''
        if action == "JH":
            staff_tuple = query.filter(models.HireLink.work == 1).all()
            staffSub = 'jh'
        elif action == "SH1":
            staff_tuple = query.filter(models.HireLink.work == 2).all()
            staffSub = 'sh1'
        elif action == "SH2":
            staff_tuple = query.filter(models.HireLink.work == 3).all()
            staffSub = 'sh2'
        else:
            return self.send_error(404)

        staffs = []
        for item in staff_tuple:
            item[0].hirelink = item[1]
            staffs.append(item[0])

        return self.render("admin/staff.html", staffs=staffs, context=dict(subpage=subpage, staffSub=staffSub))

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data")
    def post(self): #hire_form_id/staff_id
        action = self.args["action"]
        data = self.args["data"]

        if action in ["hire_agree", "hire_refuse"]: #id = hire_form_id
            try:hire_form = self.session.query(models.HireForm).filter_by(
                staff_id=data["id"], shop_id=self.current_shop.id).one()
            except: return self.send_error(404)

            if action == "hire_agree":
                
                ###############################################################################
                # if the staff exited,send_fail
                ###############################################################################
                staff_id = data["id"]
                try:staff  = self.session.query(models.ShopStaff).filter_by(id=staff_id).one()
                except: return self.send_error(404)
                phone = staff.accountinfo.phone
                print(phone)
                try:
                    print(self.current_shop.id)
                    hire_forms =self.session.query(models.HireForm).filter_by(status = 2,shop_id=self.current_shop.id).all()
                    print(len(hire_forms))
                    temp_phone =[]
                    for temp in hire_forms:
                        temp_phone.append(temp.staff.accountinfo.phone)
                    print(temp_phone)
                    if phone in temp_phone:
                        return self.send_fail("该电话号码已存在，请换一个")
                except:return self.send_error(404)

                hire_form.status = 2

                try:
                    self.session.add(models.HireLink(staff_id=hire_form.staff_id, shop_id=hire_form.shop_id))
                    self.session.commit()
                except:
                    return self.send_fail("申请表已经通过")
            elif action == "hire_refuse":
                if hire_form.status == 2:
                    return self.send_fail("申请已经通过，不能再拒绝")
                hire_form.status = 3
                self.session.commit()
        elif action == "edit_hire_on":
            self.current_shop.config.hire_on = not self.current_shop.config.hire_on
            self.session.commit()
        elif action == "edit_hire_text":
            self.current_shop.config.hire_text = data["hire_text"]
            self.session.commit()
        elif action == "edit_active":
            try:hire_link = self.session.query(models.HireLink).filter_by(
                staff_id=data["staff_id"],shop_id=self.current_shop.id).one()
            except:return self.send_error(404)
            active = 1 if hire_link.active==2 else 2
            hire_link.update(session=self.session, active=active)
        elif action == "edit_staff":
            try:hire_link = self.session.query(models.HireLink).filter_by(
                staff_id=data["staff_id"],shop_id=self.current_shop.id).one()
            except:return self.send_error(404)
            hire_link.update(session=self.session, remark=data["remark"])
        else:
            return self.send_fail()
        return self.send_success()


class SearchOrder(AdminBaseHandler):  # 用户历史订单
    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "id:int")
    def get(self):
        action = self.args["action"]
        subpage=''
        if action == 'customer_order':
            orders = self.session.query(models.Order).filter_by(
                customer_id=self.args['id'], shop_id=self.current_shop.id).all()
            subpage='user'
        elif action == 'SH2_order':
            orders = self.session.query(models.Order).filter_by(
                SH2_id=self.args['id'], shop_id=self.current_shop.id).all()
            subpage='staff'
        elif action == 'order':
            orders = self.session.query(models.Order).filter_by(
                num=self.args['id'], shop_id=self.current_shop.id).all()
            subpage='order'
        else:
            return self.send_error(404)

        data = []
        delta = datetime.timedelta(1)
        for order in orders:
            order.__protected_props__ = ['customer_id', 'shop_id', 'JH_id', 'SH1_id', 'SH2_id',
                                         'comment_create_date', 'start_time', 'end_time', 'create_date']
            d = order.safe_props(False)
            d['fruits'] = eval(d['fruits'])
            d['mgoods'] = eval(d['mgoods'])
            d['create_date'] = order.create_date.strftime('%Y-%m-%d %R')
            ################################################################################################
            # modified : woody 
            #date:2015.3.7
            #TODO:  standardize the format of time
            ################################################################################################
            if order.start_time.minute <10:
                w_start_time_minute ='0' + str(order.start_time.minute)
            else:
                w_start_time_minute = str(order.start_time.minute)
            if order.end_time.minute < 10:
                w_end_time_minute = '0' + str(order.end_time.minute)
            else:
                w_end_time_minute = str(order.end_time.minute)

            if order.type == 2 and order.today==2:
                w_date = order.create_date + delta
            else:
                w_date = order.create_date
            d["sent_time"] = "%s %d:%s ~ %d:%s" % ((w_date).strftime('%Y-%m-%d'),
                                                order.start_time.hour, w_start_time_minute,
                                                  order.end_time.hour, w_end_time_minute)

            staffs = self.session.query(models.ShopStaff).join(models.HireLink).filter(and_(
                models.HireLink.work == 3, models.HireLink.shop_id == self.current_shop.id)).all()
            SH2s = []
            for staff in staffs:
                staff_data = {"id": staff.id, "realname": staff.accountinfo.realname, "phone": staff.accountinfo.phone}
                SH2s.append(staff_data)
                if staff.id == order.SH2_id:  # todo JH、SH1
                    d["SH2"] = staff_data
            d["SH2s"] = SH2s
            data.append(d)

        return self.render("admin/order-list.html", data=data, context=dict(subpage=subpage))

class Config(AdminBaseHandler):
    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action")
    def get(self):
        try:config = self.session.query(models.Config).filter_by(id=self.current_shop.id).one()
        except:return self.send_error(404)
        action = self.args["action"]
        if action == "delivery":
            return self.render("admin/shop-address-set.html", addresses=config.addresses,context=dict(subpage='shop_set',shopSubPage='delivery_set'))
        elif action == "notice":
            return self.render("admin/shop-notice-set.html", notices=config.notices,context=dict(subpage='shop_set',shopSubPage='notice_set'))
        elif action == "recharge":
            pass
        elif action == "receipt":
            return self.render("admin/shop-receipt-set.html", receipt_msg=config.receipt_msg,context=dict(subpage='shop_set',shopSubPage='receipt_set'))
        else:
            return self.send_error(404)


    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data")
    def post(self):
        action = self.args["action"]
        data = self.args["data"]

        if action in ["add_addr1", "add_notice", "edit_receipt", "edit_hire"]:
            if action == "add_addr1":
                addr1 = models.Address1(name=data)
                self.current_shop.config.addresses.append(addr1)
                self.session.commit()
                return self.send_success(address1_id=addr1.id)#commit后id会自动生成
            elif action == "add_notice":
                notice = models.Notice(summary=data["summary"],
                                       detail=data["detail"])
                self.current_shop.config.notices.append(notice)
                self.session.commit()
            elif action == "edit_receipt": #小票设置
                self.current_shop.config.update(session=self.session,
                                                receipt_msg=data["receipt_msg"])
        elif action in ["add_addr2", "edit_addr1_active"]:
            addr1 = next((x for x in self.current_shop.config.addresses if x.id==data["addr1_id"]), None)
            if action == "add_addr2":
                addr2 = models.Address2(name=data["name"])
                addr1.address2.append(addr2)
                self.session.commit()
            elif action == "edit_addr1_active":
                addr1.update(session=self.session, active=not addr1.active)
        elif action =="edit_addr2_active":#id: addr2_id
            try:addr2 = self.session.query(models.Address2).filter_by(id=data["addr2_id"]).one()
            except:return self.send_error(404)
            addr2.update(session=self.session, active=not addr2.active)
        elif action in ("edit_notice_active", "edit_notice"):  # notice_id
            notice = next((x for x in self.current_shop.config.notices if x.id == data["notice_id"]), None)
            if not notice:
                return self.send_error(404)
            if action == "edit_notice_active":
                notice.active = 1 if notice.active == 2 else 2
            elif action == "edit_notice":
                notice.summary = data["summary"]
                notice.detail = data["detail"]
            self.session.commit()
        elif action == "edit_recipe_img":
            return self.send_qiniu_token("receipt", self.current_shop.id)
        else:
            return self.send_error(404)
        return self.send_success()

class ShopConfig(AdminBaseHandler):
    @tornado.web.authenticated
    def get(self):
        address = self.code_to_text("shop_city", self.current_shop.shop_city) +\
                  " " + self.current_shop.shop_address_detail
        service_area = self.code_to_text("service_area", self.current_shop.shop_service_area)
        return self.render("admin/shop-info-set.html", address=address, service_area=service_area, context=dict(subpage='shop_set',shopSubPage='info_set'))

    @tornado.web.authenticated
    @AdminBaseHandler.check_arguments("action", "data")
    def post(self):
        action = self.args["action"]
        data = self.args["data"]
        shop = self.current_shop
        if action == "edit_shop_name":
            shop.shop_name = data["shop_name"]
        elif action == "edit_shop_img":
            return self.send_qiniu_token("shop", shop.id)
        elif action == "edit_shop_code":
            if len(data["shop_code"]) < 4:
                return self.send_fail("店铺号至少要4位")
            if self.session.query(models.Shop).filter_by(shop_code=data["shop_code"]).first():
                return self.send_fail("店铺号已被注册")
            reserve_code = ('senguo', 'senguocc', 'shuiguobang', 'shuiguo', '0000', '1111', '2222', '3333',
                            '4444', '5555', '6666', '7777', '8888', '9999')
            if data["shop_code"] in reserve_code:
                return self.send_fail("该店铺号为系统保留号，不允许注册")
            shop.shop_code = data["shop_code"]
        elif action == "edit_shop_intro":
            shop.shop_intro = data["shop_intro"]
# woody 2015.3.5
        elif action == "edit_phone":
            shop.shop_phone = data["shop_phone"]
        elif action == "edit_address":
            shop_city = int(data["shop_city"])
            shop_address_detail = data["shop_address_detail"]
            if shop_city//10000*10000 not in dis_dict:
                return self.send_fail("没有该省份")
            shop.shop_province = shop_city//10000*10000
            shop.shop_city = shop_city
            shop.shop_address_detail = shop_address_detail
        elif action == "edit_deliver_area":
            shop.deliver_area = data["deliver_area"]
        elif action == "edit_have_offline_entity":
            shop.have_offline_entity = data["have_offline_entity"]
        self.session.commit()
        return self.send_success()
