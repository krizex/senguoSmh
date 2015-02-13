新系统senguo2.0：
环境安装
=======
环境依赖包(必须，否则程序无法正常运行)： Python3.3/tornado，Mysql，mysql-connector-python，sqlalchemy
    安装命令：
        Mysql 5.5.37: apt-get install mysql-server
        Mysql connector/python 2.0.1: pip3 install mysql-connector-python
        tornado-4.0.2:（要先去管网下载安装包，再解压安装）
            wget https://pypi.python.org/packages/source/t/tornado/tornado-4.0.2.tar.gz;tar -xzvf tornado-4.0.2.tar.gz;cd tornado-4.0.2;sudo python3 setup.py install
        sqlalchemy 0.9: pip3 install sqlalchemy

其他依赖包（非必须）：pytest，alembic，Nginx（不装nginx程序也能运行，不过强烈建议安装）
    安装命令：
        py.test: pip3 install pytest
        自动数据库迁移：alembic 0.6.7: pip3 install alembic

配置:
    mysql字符集，conf.d/my.cnf
    mysql数据库：
        1.新建数据库senguocc
        2.修改默认的用户名密码（也可以新建一个和默认的用户名相同的用户）。默认的用户名密码在admin/settings.py

注意/建议
========
    1. tornado在服务器端不要运行在debug模式，速度会下降1-2倍，也不安全
    2. mysql的管理推荐用workbench，会省很多时间。
    3. 推荐看sqlalchemy的优秀教程（要翻墙）：http://www.pythoncentral.io/series/python-sqlalchemy-database-tutorial/

可能出现的问题
=======
    1. mysql字符集的问题
         python3 默认采用utf-8编码，但是mysql默认采用latin1编码，所以你需要配置mysql的配置文件，将默认字符集设为utf8

    2. sqlalchemy connection time out
        sqlalchemy连接数量是有上限的：http://docs.sqlalchemy.org/en/latest/core/engines.html#sqlalchemy.create_engine.params.max_overflow
        最大数量为：pool_size + max_overflow，默认5+10为15，所以如果你的会话数超过这个数的话，就需要排队，
        等待前边的会话释放connection，如果一直都未被释放的话，就会发生超时了。所以，使用sqlalchemy，
        你一定得记得用完session后，close一下。

    3. sqlalchemy DetachedInstanceError
        在默认情况下，当你提交(commit)查询或者更新后，sqlalchemy会把你这个instance状态置为过期，下次你需要访问属性的时候，
        就会从数据库刷新属性。所以如果当你提交请求并且close掉这个session之后，再次访问属性就会导致这个异常。
        在sessionmaker的时候将expire_on_commit设置为False就ok了。

    4. sqlalchemy ProgrammingError 1071: Specified key was too long; max key length is 767 bytes
        这是一个mysql最大能存储字节数（具体不清楚，想深入研究再去看）的问题，看这里：http://bugs.mysql.com/bug.php?id=6604