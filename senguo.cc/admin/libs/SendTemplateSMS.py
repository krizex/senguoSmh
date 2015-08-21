#coding=gbk

#coding=utf-8

#-*- coding: UTF-8 -*-  

from libs.CCPRestSDK import REST
# import ConfigParser

#Ö÷ÕÊºÅ
accountSid= 'aaf98f894f16fdb7014f253f2f7412bd'

#Ö÷ÕÊºÅToken
accountToken= '62672712e80b41ef9228d0f2d04d6d9f'

#Ó¦ÓÃId
appId='8a48b5514f3a7d0b014f3efccea50934';

#ÇëÇóµØÖ·£¬¸ñÊ½ÈçÏÂ£¬²»ÐèÒªÐ´http://
serverIP='app.cloopen.com';
# serverIP = 'i.senguo.cc'

#ÇëÇó¶Ë¿Ú 
serverPort='8883';

#REST°æ±¾ºÅ
softVersion='2013-12-26';

	# ·¢ËÍÄ£°å¶ÌÐÅ
	# @param to ÊÖ»úºÅÂë
	# @param datas ÄÚÈÝÊý¾Ý ¸ñÊ½ÎªÊý×é ÀýÈç£º{'12','34'}£¬Èç²»ÐèÌæ»»ÇëÌî ''
	# @param $tempId Ä£°åId


def sendTemplateSMS(to,datas,tempId):

		print ('login sendTemplateSMS')
		flag = False
		msg = ''
		
		#³õÊ¼»¯REST SDK
		rest = REST(serverIP,serverPort,softVersion)
		rest.setAccount(accountSid,accountToken)
		rest.setAppId(appId)
		print(rest)
		
		result = rest.sendTemplateSMS(to,datas,tempId)
		print(result)
		for k in result: 
				if k=='templateSMS' :
								for k1 in result.get(k): 
										print ('%s:%s' % (k1, result.get(k).get(k1)))
				elif k == 'statusCode':
					if result.get(k) == '000000':
						flag = True
						print('send success')
					else:
						flag = False
				elif k == 'statusMsg':
					msg = result.get(k)
				else:
						print ('%s:%s' % (k, result.get(k)))
		return flag,msg
	 
# flag = sendTemplateSMS('13163263783',{'1234','5678'},32417)
# print(flag)
