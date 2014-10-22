import tornado.web
from tornado.escape import xhtml_escape

class BaseHandler(tornado.web.RequestHandler):
    """
    通用的请求处理基类，主要定义了一些API通信规范和常用的工具
    响应处理：
       一个请求在逻辑上分为三个结果：请求错误、请求失败和请求成功。请求错误会通常
       是由于请求不合法（如参数错误、请求不存在、token无效等），直接返回http状
       态码；请求失败通常是由于一些事物逻辑上的错误，比如库存不够、余额不足等；请
       求成功不解释

       错误请求: send_error(status_code, **kargs)[tornado自带，直接响应响应的HTTP错误头，如果你需要自定义错误Page的话，重写write_error(status_code, **kargs)]
       请求失败：send_fail(fail_code, fail_text)[返回JSON数据格式: {"success":False, "code":fail_code, "text":fail_text}]
       请求成功: send_success(**kwargs)[返回JSON数据格式:{"success":True, **kwargs}]

    请求处理工具：
       check_arguments:获取请求里的参数数据，并存在self.args里
    """

    def format_text(self, raw_text):
        """
        @ raw_text: 未经任何处理的文本
        @ return: 经过xhtml_escape，和支持空白换行等多种操作后的html代码
        """
        rules = {" ": "&nbsp;",
                 "\n": "<br />"}
        x_text = xhtml_escape(raw_text)
        out_text = ""
        for c in x_text:
            if c in rules:
                out_text += rules[c]
            else:
                out_text += c
        return out_text


    def check_arguments(*request_arguments):
        """
        @Decorator( request_arguments:string(...) )
        这个装饰器可以配合 Handler 进行参数的检查
        每一个参数是一个字符串，形如 name[:type][?]
        type是类型，可以为 int，str等，? 代表参数是否可选
        参数会从请求的url中解析，或从post的body中以json的方式寻找
        """
        def func_wrapper(method):
            def wrapper(self,*args,**kwargs):
                if self.request.method == "POST":
                    obj = self.__json_parse(self.request.body) or {}
                    for name in request_arguments:
                        if name.count(':'):
                            Type = name.split(":")[1]
                            name = name.split(":")[0]
                        else:
                            Type = "all"
                        if name.count('?') == 0 and Type.count("?") == 0:
                            if name not in obj:
                                try:
                                    obj[name] = self.get_argument(name)
                                except:
                                    return self.send_error(400)
                        name = name.replace("?",'',1)
                        if name in obj:
                            try:
                                obj[name] = self.__parse_type(obj[name],Type)
                            except:
                                return self.send_error(400)
                else:
                    obj = {}
                    for name in request_arguments:
                        if name.count(':'):
                            Type = name.split(":")[1]
                            name = name.split(":")[0]
                        else:
                            Type = "all"
                        if name.count('?') > 0 or Type.count("?") > 0:
                            name = name.replace('?','',1)
                            try:obj[name] = self.get_argument(name)
                            except:pass
                        else:
                            try:obj[name] = self.get_argument(name)
                            except: return self.send_error(400)
                        if name in obj:
                            try:
                                obj[name] = self.__parse_type(obj[name],Type)
                            except:
                                return self.send_error(400)
                self.args = obj
                return method(self,*args,**kwargs)
            return wrapper
        return func_wrapper

    def send_success(self,**kwargs):
        obj = {"success":True}
        for k in kwargs:
            obj[k] = kwargs[k]
        self.write(obj)
    def send_fail(self,error_code=None, error_text = None):
        if type(error_code) == int:
            res = {"success":False, "errorCode":error_code,"errorText":error_text}
        else:
            res = {"success":False, "errorText": error_text}
        self.set_header("Content-Type", 'utf-8')
        self.write(res)

    def __json_parse(self,string):
        try:
            obj = dict()
            if self.request.headers["Content-Type"] ==\
               "application/x-www-form-urlencoded":
                for name in self.request.body_arguments:
                    obj[name] = self.request.body_arguments[name][0].decode()
                print(obj)
                return obj
            else:
                data = tornado.escape.json_decode(string)
                print(data)
                return data
        except:
            return None
    def __parse_type(self,value,Type):
        print("check for type: {0}, origin type: {1}, value: {2}".format(Type, type(value), value))
        if not Type or Type == "all":
            return value
        if (Type == "str" or Type == "string") and type(value) != str:
            return str(value)
        if Type == "int" and type(value) != int:
            return int(value)
        if Type == "float" and type(value) != float:
            return float(value)
        if Type == "number" and type(value) != int and type(value) != float:
            try: return int(value)
            except: pass
            try: return float(value)
            except: pass
            raise Exception()
        if (Type == "list" or Type == "array") and type(value) != list:
            return list(value)
        if (Type == "dict") and type(value) != dict:
            return dict(value)
        if Type == "bool" and type(value) != bool:
            if type(value) == str:
                value = value.lower()
                if value == "true":
                    return True
                else:
                    return False
            elif type(value) == int:
                return int(value)
            return False
        return value


