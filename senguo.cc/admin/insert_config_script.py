# __author__ = 'liaosimin'
# #之前fruitzone的shop没有config，所以程序运行会出错，这段脚本就是为每一个shop增加一个config
# import dal.models as models
# s = models.DBSession()
# shops = s.query(models.Shop).all()
# for shop in shops:
#     shop.config = models.Config()
# s.commit()

import requests
import urllib
import urllib.request as urllib2
import http.cookiejar
import http.cookies
import re
import webbrowser
import json
from bs4 import BeautifulSoup


session = requests.session()

class login:
	def __init__(self):
		self.loginURL="https://login.taobao.com/member/login.jhtml?redirectURL=http%3A%2F%2Fwaimai.taobao.com%2FshopList.htm"
		self.ua="041UW5TcyMNYQwiAiwTR3tCf0J%2FQnhEcUpkMmQ%3D%7CUm5Ockt1TnJHeEd9SXRJdiA%3D%7CU2xMHDJ%2BH2QJZwBxX39Rb1N9XXM1VDJOPxFHEQ%3D%3D%7CVGhXd1llXGJZZVBvUGpfa1ZpXmNBe0dzS3RPcE11QX9CfEZyTGI0%7CVWldfS0QMAwxCysXIgIsESVQbVFsVWxJYFtlQHYYJxwsAlQC%7CVmNDbUMV%7CV2NDbUMV%7CWGRYeCgGZhtmH2VScVI2UT5fORtmD2gCawwuRSJHZAFsCWMOdVYyVTpbPR99HWAFYVMoRSlIM141SBZPCTlZJFkgCTYOMHtSbVVqJg8wCDd7BWwNaAFgQj9WMVsyVXccex43CDAPQzlZPkcBYBpnRSVYPRMzHTNlMw%3D%3D%7CWWdHFy4QLg4vEy0TMw82DjERJB4kBDsDOAUlGSAZJAQ7AjcNLREoFCp8Kg%3D%3D%7CWmJCEjxjOH4qUzpAOkQjWDRgXHJSAj4DPAMjHSIdS2tWdlh2VmpSbFAGUA%3D%3D%7CW2FBET8RMQ0tESkXInQi%7CXGZGFjhnPHouVz5EPkAnXDBkWHZWakp2TndIHkg%3D%7CXWdHFzlmPXsvVj9FP0EmXTFlWXdXakpzS3BMGkw%3D%7CXmREFDoUNAkpECgTK30r%7CX2VFFTsVNQkpHCcYLXst%7CQHpaCiR7IGYySyJYIlw7QCx4RGpKdlZjWGZfCV8%3D%7CQXlZCSd4I2UxSCFbIV84Qy97R2lJGS0WKgo0CzJkRHlZd1l5THdOcSdx%7CQntbCyV6IWczSiNZI106QS15RWtLf0dzU21SbEx5Q3dDFUM%3D%7CQ3lZCSd4I2UxSCFbIV84Qy97R2lJdFRoVG5Vaz1r%7CRH5eDiAOLhMzDzMJMwpcCg%3D%3D%7CRX9fDyEPLxMzDzMJPANVAw%3D%3D%7CRnxcDCJ9JmA0TSReJFo9Rip%2BQmxMcFBsUGpfZzFn%7CR39fDyEPL39LdEhoVmNYDi4TMx0zEy8RKh4qfCo%3D%7CSHJSAixzKG46QypQKlQzSCRwTGJCf19jXWdbZjBm%7CSXNTAy1tOXAXexZVM0o2Sx9%2BUHBMbFBuVGFUAlQ%3D%7CSnFRAS9vO3IVeRRXMUg0SR18UnJHeVlkRHhAfkN4Lng%3D%7CS3BQAC5uOnMUeBVWMEk1SBx9U3NLc1NuTnJJc05xJ3E%3D%7CTHdXBylpPXQTfxJRN04yTxt6VHRBdVVoSHRPe0B0InQ%3D%7CTXZWBihoPHUSfhNQNk8zThp7VXVPclJvT3NGek56LHo%3D%7CTndXBylpPWUZcxZ3ClIvRjtaMR8%2FAz4LMxMqHiUFOQw2Cj5oPg%3D%3D%7CT3dXBylpPWUZcxZ3ClIvRjtaMR8%2Fb1NuVGlJcEp%2FKQk0FDoUNAg9CDwIXgg%3D%7CcEpqOhRUAEkuQi9sCnMPciZHaUl0VGhdaVRhN2E%3D%7CcUtrOxVVAVklTypLNm4TegdmDSMDPx8jFiIeJHIk%7CckhoOBZWAlomTClINW0QeQRlDiAAPR0hFCAaL3kv%7Cc0lpORc5GSQEOA05DDVjNQ%3D%3D%7CdE1wTW1QcE9vU2pWdkhwSmpSZkZ8RGRYZF19QWFdZkZ4TGxSZ0d5Q2NdZkZ4QGBeZ0dzU3JOblBsTHJPb1BkRHtOblBwT3RUa1NzT3NTb1JyRmZTc1JuUHBRaUl1QGBcZkZ6QWFdZTM%3D"
		self.password2="08cb6b7cc13c47545b29344b73f88d7b6d73340d2a169c28ce1192c7b483a81923ddbc4e4d2a8a03c205cf99da22fb3c85135959a120aba20a092c43e505dee054895105d7409eaaac61e84dc900705d794596390fbe1049e7e3d285ff0be1cea2ee4d61dae1944fba9d58d1f28d83b1e27ffb1190cbc3ba7ec99dcaeb2fc1d2"
		self.username="18162664593"
		self.loginHeaders =  {
			'Host':'login.taobao.com',
			'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:35.0) Gecko/20100101 Firefox/35.0',
			'Referer' : 'https://login.taobao.com/member/login.jhtml',
			'Content-Type': 'application/x-www-form-urlencoded',
			'Connection' : 'Keep-Alive'
		}
		self.proxyURL = 'http://120.193.146.97:843'
		self.post=post={
			"ua":self.ua,
			"TPL_username":self.username,
			"TPL_password":"",
			"TPL_checkcode":"s7yf",
			"loginsite":"0",
			"newlogin":"0",
			"TPL_redirect_url":"http%3A%2F%2Fwaimai.taobao.com%2FshopList.htm",
			"from":"tbTop",
			"fc":"default",
			"style":"default",
			"css_style":"",
			"keyLogin":"false",
			"qrLogin":"true",
			"newMini":"false",
			"tid":"",
			"support":"000001",
			"CtrlVersion":"1%2C0%2C0%2C7",
			"loginType":"3",
			"minititle":"",
			"minipara":"",
			"umto":"Tabcda277d547fe16b7ab72a3d7ee214c",
			"pstrong":"",
			"llnick":"",
			"sign":"",
			"need_sign":"",
			"isIgnore":"",
			"full_redirect":"",
			"popid":"",
			"callback":"",
			"guf":"",
			"not_duplite_str":"",
			"need_user_id":"",
			"poy":"",
			"gvfdcname":"10",
			"gvfdcre":"",
			"from_encoding":"",
			"sub":"false",
			"TPL_password_2":self.password2,
			"loginASR":"1",
			"loginASRSuc":"1",
			"allp":"",
			"oslanguage":"zh-CN",
			"sr":"2560*1440",
			"osVer":"",
			"naviVer":"firefox%7C31"
		}
		self.postData = urllib.parse.urlencode(self.post)
		self.proxy = urllib2.ProxyHandler({'http':self.proxyURL})
		self.cookie = http.cookiejar.CookieJar()
		self.cookieHandler = urllib2.HTTPCookieProcessor(self.cookie)
		self.opener = urllib2.build_opener(self.cookieHandler,self.proxy,urllib2.HTTPHandler)

	def needIdenCode(self):
		#第一次登录获取验证码尝试，构建request
		# request = urllib2.Request(self.loginURL,self.postData,self.loginHeaders)
		# #得到第一次登录尝试的相应
		# response = self.opener.open(request)
		# #获取其中的内容
		# content = response.read().decode('gbk')
		# #获取状态吗
		# status = response.getcode()
		proxies = {
		    "http": self.proxyURL,
		}
		r=requests.post(self.loginURL,data=json.dumps(self.postData),headers=self.loginHeaders,proxies=proxies)
		content=r.content.decode("gbk")
		status=r.status_code
		#状态码为200，获取成功
		if status == 200:
			print("获取请求成功")
			#\u8bf7\u8f93\u5165\u9a8c\u8bc1\u7801这六个字是请输入验证码的utf-8编码
			pattern = re.compile(u'\u8bf7\u8f93\u5165\u9a8c\u8bc1\u7801',re.S)
			result = re.search(pattern,content)
			#如果找到该字符，代表需要输入验证码
			if result:
				print("此次安全验证异常，您需要输入验证码")
				return content
			#否则不需要
			else:
				print("此次安全验证通过，您这次不需要输入验证码")
				r=requests.get("http://waimai.taobao.com/shop_list.htm?t=1&posy=11434320&posx=3050047&addressId=14387897&page=2")
				soup = BeautifulSoup(r.text)
				address = soup.find("li")
				# address = soup.find(attrs={"class":"store-add"})
				# phone = soup.find(attrs={"class":"store-add"})
				print(address)

				return False
		else:
			print("获取请求失败")

	#得到验证码图片
	def getIdenCode(self,page):
		#得到验证码的图片
		pattern = re.compile('<img id="J_StandardCode_m.*?data-src="(.*?)"',re.S)
		#匹配的结果
		matchResult = re.search(pattern,page)
		#已经匹配得到内容，并且验证码图片链接不为空
		if matchResult and matchResult.group(1):
			print(matchResult.group(1))
			return matchResult.group(1)
		else:
			print("没有找到验证码内容")
			return False

	#程序运行主干
	def main(self):
		#是否需要验证码，是则得到页面内容，不是则返回False
		needResult = self.needIdenCode()
		if not needResult == False:
			print("您需要手动输入验证码")
			idenCode = self.getIdenCode(needResult)
			#得到了验证码的链接
			if not idenCode == False:
				print("验证码获取成功")
				print("请在浏览器中输入您看到的验证码")
				webbrowser.open_new_tab(idenCode)
				#验证码链接为空，无效验证码
			else:
				print("验证码获取失败，请重试")
		else:
			print("不需要输入验证码")

taobao = login()
taobao.main()