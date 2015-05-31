$(document).ready(function(){

}).on('click','#getVrify',function(){
	var $this=$(this);
              $('#getVrify').attr({'disabled':true}).addClass('bg-grey');
	Vrify($this);
}).on('click','#checkCode',function(){
            var $this=$(this);
            $('#checkCode').attr({'disabled':true}).addClass('bg-grey');
            checkCode($this);
}).on('click','#passwordRest',function(){
             var $this=$(this);
             $('#passwordRest').attr({'disabled':true}).addClass('bg-grey');
            pwdRest($this);
}).on('click','.backBtn',function(){
            var $this=$(this);
            var i=$this.attr('data-back');
            $('.step'+i).show().siblings('.step-box').hide();
            $('.progress'+i).addClass('active').siblings('.progress').removeClass('active');
}).on('click','.send',function(){
        noticeBox('验证码已发送到您手机，稍等一下哟！')
});

function Vrify(target){
    var phone=$('#enterPhone').val();
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    if(!phone){
             $('#getVrify').removeAttr('disabled').removeClass('bg-grey');
    	return noticeBox('手机号不能为空',target);
    }
    if(phone.length > 11){
             $('#getVrify').removeAttr('disabled').removeClass('bg-grey');
    	return noticeBox("手机号貌似有错o(╯□╰)o",target);
    }
    if(phone.length<11){
             $('#getVrify').removeAttr('disabled').removeClass('bg-grey');
    	return noticeBox("手机号貌似有错o(╯□╰)o",target);
    }
    if( !regPhone.test(phone)){
             $('#getVrify').removeAttr('disabled').removeClass('bg-grey');
    	return noticeBox("手机号貌似有错o(╯□╰)o",target);
    }
    
    var action='get_code';
    var url="";
    var args={
        action:action,
        phone:phone
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                target.parents('.step-box').hide().next('.step-box').show();
	  $('.progress2').addClass('active').siblings('.progress').removeClass('active');
                $('#getVrify').removeAttr('disabled').removeClass('bg-grey');
            }
            else {
                noticeBox(res.error_text);
                $('#getVrify').removeAttr('disabled').removeClass('bg-grey');
            }
        },
         function(){
            noticeBox('网络好像不给力呢~ ( >O< ) ~');
            $('#getVrify').removeAttr('disabled').removeClass('bg-grey');
        },
        function(){
            noticeBox('服务器貌似出错了~ ( >O< ) ~');
            $('#getVrify').removeAttr('disabled').removeClass('bg-grey');
        }
    );
}

function checkCode(target){
    var phone=$('#enterPhone').val().trim();
    var code=$('#enterVrify').val().trim();
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    if(!code){return noticeBox('请输入验证码',target);}
    if(!regNumber.test(code)){
        $('#checkCode').removeAttr('disabled').removeClass('bg-grey');
        return noticeBox('验证码只能为数字！',target);
    }
    if(code.length!=4){
        $('#checkCode').removeAttr('disabled').removeClass('bg-grey');
        return noticeBox('验证码为4位数字！',target);
    }
    if(!phone){
        $('#checkCode').removeAttr('disabled').removeClass('bg-grey');
        return noticeBox('手机号不能为空！',target);
    }
    var url="";
    var action='check_code';
    var args={action:action,phone:phone,code:code};
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                target.parents('.step-box').hide().next('.step-box').show();
                $('.progress3').addClass('active').siblings('.progress').removeClass('active');
                $('#checkCode').removeAttr('disabled').removeClass('bg-grey');
            }
            else {
                noticeBox(res.error_text);
                $('#checkCode').removeAttr('disabled').removeClass('bg-grey');
            }
        },
        function(){
            noticeBox('网络好像不给力呢~ ( >O< ) ~');
            $('#checkCode').removeAttr('disabled').removeClass('bg-grey');
        },
        function(){
            noticeBox('服务器貌似出错了~ ( >O< ) ~');
            $('#checkCode').removeAttr('disabled').removeClass('bg-grey');
        }
    );
    
}

function pwdRest(target){
    var phone=$('#enterPhone').val().trim();
    var password=$('#password').val().trim();
    var re_password=$('#repassword').val().trim();
    var regPass=/^[0-9a-zA-Z]*$/g;
    if(!password) {
        $('#passwordRest').removeAttr('disabled').removeClass('bg-grey');
        return noticeBox('密码不能为空！',target);
    }
    if(re_password!=password) {
        $('#passwordRest').removeAttr('disabled').removeClass('bg-grey');
        return noticeBox('两次输入的密码不一致！',target);
    }
    if(password.length<6 || !regPass.test(password)) {
        $('#passwordRest').removeAttr('disabled').removeClass('bg-grey');
        return noticeBox('请输入六位以上字母和数字的组合！',target);
    }
    password=CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
    var url="";
    var action='reset';
    var args={action:action,phone:phone,password:password};
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                noticeBox('密码重置成功',target);
                window.location.href=window.history.go(-1);
                $('#passwordRest').removeAttr('disabled').removeClass('bg-grey');
            }
            else {
                noticeBox(res.error_text);
                $('#passwordRest').removeAttr('disabled').removeClass('bg-grey');
            }
        },
        function(){
            noticeBox('网络好像不给力呢~ ( >O< ) ~');
            $('#passwordRest').removeAttr('disabled').removeClass('bg-grey');
        },
        function(){
            noticeBox('服务器貌似出错了~ ( >O< ) ~');
            $('#passwordRest').removeAttr('disabled').removeClass('bg-grey');
    }
    );
    
}