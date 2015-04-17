$(document).ready(function(){

}).on('click','#getVrify',function(){
	var $this=$(this);
	Vrify($this);
}).on('click','#checkCode',function(){
	checkCode();
});

var wait=60;
function time(evt) {
    if (wait == 0) {
        evt.val("获取验证码").css({'background':'#00d681'});
        wait = 60;
        $('.get-code').attr({'id':'getVrify'});
    }
    else {
        evt.val("重新发送(" + wait + ")").css({'background':'#ccc'});
        wait--;
        $('.get-code').attr({'id':''});
        setTimeout(function() {
                time(evt)
            },
            1000)
    }
}

function Vrify(target){
    var phone=$('#enterPhone').val();
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    if(!phone){
    	return noticeBox('手机号不能为空',target);
    }
    if(phone.length > 11){
    	return noticeBox("电话貌似有错o(╯□╰)o",target);
    }
    if(phone.length<11){
    	return noticeBox("电话貌似有错o(╯□╰)o",target);
    }
    if( !regPhone.test(phone)){
    	return noticeBox("电话貌似有错o(╯□╰)o",target);
    }
    
    var action='gencode';
    var url="/customer/phoneVerify?action=customer";
    var args={
        action:action,
        phone:phone
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                time($('#getVrify'));
                target.parents('.step-box').hide().next('.step-box').show();
	  $('.progress1').removeClass('active').siblings('.progress2').addClass('active');
            }
            else return noticeBox(res.error_text);
        },
         function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}

function checkCode(){
    var phone=$('#enterPhone').val();
    var code=$('#enterVrify').val();
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    if(phone.length > 0 && phone.length<11 && !regPhone.test(phone)){return warnNotice("电话貌似有错o(╯□╰)o");}
    if(!phone){return warnNotice('请输入手机号');}
    if(!code){return warnNotice('请输入验证码');}
    if(!regNumber.test(code)){return warnNotice('验证码只能为数字！');}
    if(code>0&&phone.length<6){return warnNotice('验证码为六位数字!');}
    var url="/customer/phoneVerify?action=customer";
    var action='checkcode';
    var args={action:action,phone:phone,code:code};
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
              
            }
            else noticeBox(res.error_text);
        },
        function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}