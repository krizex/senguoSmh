$(document).ready(function(){

}).on('click','#phoneLogin',function(){
	login();
});

function login(){
	var url='';
	var phone=$('#phone').val().trim();
	var password=$('#password').val().trim();
	var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    	if(!regPhone.test(phone)){return noticeBox("电话貌似有错o(╯□╰)o");}
    	if(phone.length<11){return noticeBox("电话貌似有错o(╯□╰)o");}
    	if(phone.length > 11){return noticeBox("电话貌似有错o(╯□╰)o");}
    	if(!phone){return noticeBox("请输入您的手机号o(╯□╰)o");}
    	if(!password){return noticeBox("请输入您的密码o(╯□╰)o");}
    	password=CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
	var args={
		phone: phone,
		password:password

	};
	$.postJson(url,args,function(res){
		if(res.success){
			
		}
		else return noticeBox(res.error_text);
	}, 
	function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
	function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
	);
}