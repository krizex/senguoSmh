#!coding:utf8
from hashlib import md5

try:
	import urllib2
except:
	import urllib.request as urllib2


class geetest(object):
	"""docstring for gt"""

	def __init__(self, id, key):
		self.PRIVATE_KEY = key
		self.CAPTCHA_ID = id
		self.PY_VERSION = "2.15.4.1.1"
		# self.PY_VERSION = "3.4.0"

	def geetest_register(self):
		apireg = "http://api.geetest.com/register.php?"
		regurl = apireg + "gt=%s"%self.CAPTCHA_ID
		try:
			result = urllib2.urlopen(regurl, timeout=2).read()
		except:
			print('get result error')
			result = ""
		return result

	def geetest_validate(self, challenge, validate, seccode):
		apiserver = "http://api.geetest.com/validate.php"
		if validate == self.md5value(self.PRIVATE_KEY + 'geetest' + challenge):
			query = 'seccode=' + seccode + "&sdk=python_" + self.PY_VERSION
			# print (query,'query')
			backinfo = self.postvalues(apiserver, query)
			if isinstance(backinfo,bytes):
				backinfo = backinfo.decode('utf-8')

			# print(backinfo,'return backinfo')
			md5value = self.md5value(seccode)
			
			if isinstance(md5value,bytes):
				md5value = md5value.decode('utf-8')
			# print(self.md5value(seccode))
			if backinfo == md5value:
				# print(1111111111111111)
				return 1
			else:
				# print(0000000000000000000000)
				return 0
		else:
			# print('hehehe')
			return 0

	def postvalues(self, apiserver, data):
		if isinstance(data,str):
			data = data.encode('utf-8')
		# print('login postvalues')
		req = urllib2.Request(apiserver)
		opener = urllib2.build_opener(urllib2.HTTPCookieProcessor())
		response = opener.open(req, data)
		backinfo = response.read()
		# print(backinfo)
		return backinfo

	def md5value(self, values):
		m = md5()
		if isinstance(values,str):
			values  = values.encode('utf-8')
		m.update(values)
		return m.hexdigest()
