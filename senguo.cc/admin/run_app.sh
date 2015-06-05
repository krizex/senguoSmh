nohup ./app.py -port=8887 2>&1 & nohup ./app.py -port=8888 2>&1 & nohup ./app.py -port=9090 2>&1 & nohup ./app.py -port=8886 2>&1 &
nohup ./utils/db_init/order_auto_comment.py  2>&1 &