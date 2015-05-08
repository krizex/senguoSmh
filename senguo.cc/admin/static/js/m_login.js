$(document).ready(function(){
    if(window.location.href.indexOf("login")!=-1){
    }else{
        SetCookie("next_url",$("#phoneLogin").attr('data-next'),1);
    }

}).on('click','#phoneLogin',function(){
	var $this=$(this);
	$this.attr({'disabled':true});
	login($this);
});

function login(target){
	var url='/customer/login';
	var phone=$('#phone').val().trim();
	var password=$('#password').val().trim();
	var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
	var next=target.attr('data-next');
    	if(!regPhone.test(phone)){
    		target.removeAttr('disabled');
    		return noticeBox("手机号貌似有错o(╯□╰)o");
    	}
    	if(phone.length<11){
    		target.removeAttr('disabled');
    		return noticeBox("手机号貌似有错o(╯□╰)o");
    	}
    	if(phone.length > 11){
    		target.removeAttr('disabled');
    		return noticeBox("手机号貌似有错o(╯□╰)o");
    	}
    	if(!phone){
    		target.removeAttr('disabled');
    		return noticeBox("请输入您的手机号o(╯□╰)o");
    	}
    	if(!password){
    		target.removeAttr('disabled');
    		return noticeBox("请输入您的密码o(╯□╰)o");
    	}
    	password=CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
	var args={
		phone: phone,
		password:password,
		next:next

	};
	$.postJson(url,args,function(res){
		if(res.success){

			if(next==''||!next){
				window.location.href='/list';
			}
			else{
				window.location.href=next;	
			}
			target.removeAttr('disabled');
		}
		else {
			target.removeAttr('disabled');
			return noticeBox(res.error_text);
		}
	}, 
	function(){
		target.removeAttr('disabled');
		return noticeBox('网络好像不给力呢~ ( >O< ) ~');
	},
	function(){
		target.removeAttr('disabled');
		return noticeBox('服务器貌似出错了~ ( >O< ) ~');
	}
	);
	
}