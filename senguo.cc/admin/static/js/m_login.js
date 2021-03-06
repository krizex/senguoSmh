$(document).ready(function(){
    if(window.location.href.indexOf("?next")!=-1){
	    SetCookie("next_url",$("#phoneLogin").attr('data-next'),1);
    }else{
    }
}).on('click','#phoneLogin',function(){
	var $this=$(this);
	$this.attr({'disabled':true});
	login($this);
}).on('keydown','#password',function(){
    if(window.event.keyCode == 13){
        var $this=$("#phoneLogin");
        $this.attr({'disabled':true});
        login($this);
    }
});

function login(target){
	var url='/customer/login';
	var phone=$('#phone').val().trim();
	var password=$('#password').val().trim();
	var regPhone=/^(1)\d{10}$/;
	var next=target.attr('data-next');
    	if(!regPhone.test(phone)){
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
                if(res.come_from==0) window.location.href='/madmin';
                else if (res.come_from==1) window.location.href='/customer/profile';
                else window.location.href='/list';
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