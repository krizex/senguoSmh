# /usr/bin/env python3

import sys, os

top_dir = os.path.abspath(os.path.join(
    os.path.dirname(__file__),os.path.pardir))
sys.path.append(top_dir)

if __name__ == "__main__":
    choice = int(input("""请选择是否为调试模式：
    1. 是，进入调试模式（修改hosts文件和nginx配置文件）
    2. 否，还原hosts文件
    0. 退出
    """))
    if choice != 1 and choice != 2:
        exit()
    elif choice == 1:
        os.system("cp /etc/hosts /etc/debug.hosts.old")
        os.system("cp {0}/conf.d/hosts/senguo.cc_hosts /etc/hosts".format(top_dir))
        os.system("cp {0}/conf.d/nginx/nginx.conf /etc/nginx/".format(top_dir))
        os.system("cp {0}/conf.d/nginx/senguo.cc.conf /etc/nginx/conf.d/".format(top_dir))
    else:
        pass
