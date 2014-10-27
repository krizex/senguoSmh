后台分工说明
====

## 代码结构和原理

* 运行和依赖
* MVC和代码结构说明
* 总体流程


## Web处理部分

* Web入口: initialize, prepare, 
* 访问控制 tornado.web.authenticated
* 参数检查 base.check_arguments, self.args获取参数
* 返回结果 render(), redirect(), [send_error(), send_fail(), send_success()]

* webbase.py, handlers/base.py 结构 

* 转义 xhtml_escape(), url_escape(), json_escape(), 注意xsrf, _xsrf token问题

* 高级 url name,reverse_url()

## 数据处理部分

* models.py结构以及数据库接口设计规则

## 规范

1. 前后端统一用json传数据
2. 页面数据初始化统一用后端渲染，不做成js app模式






