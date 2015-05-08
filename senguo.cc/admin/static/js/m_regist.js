$(document).ready(function(){

}).on('click','#getVrify',function(){
            $('#getVrify').removeClass('bg-green').attr({'disabled':true});
	var $this=$(this);
	Vrify($this);
}).on('click','#checkCode',function(){
           $('#checkCode').removeClass('bg-green').attr({'disabled':true});
            var $this=$(this);
            checkCode($this);
}).on('click','#accept_rule',function(){
                var $this=$(this);
                if($this.hasClass('checked')){
                    $this.removeClass('checked');
                    $('#getVrify').removeClass('bg-green').attr({'disabled':true});
                }
                else{
                    $this.addClass('checked');
                    $('#getVrify').addClass('bg-green').removeAttr('disabled');
                }
}).on('click','#subRegist',function(){
           $('#subRegist').removeClass('bg-green').attr({'disabled':true});
            var $this=$(this);
            regist($this);
}).on('click','.backBtn',function(){
            var $this=$(this);
            var i=$this.attr('data-back');
            $('.step'+i).show().siblings('.step-box').hide();
            $('.progress'+i).addClass('active').siblings('.progress').removeClass('active');
}).on('click','.send',function(){
        noticeBox('验证码已发送到您手机,稍等一下哟！')
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
            $('#getVrify').addClass('bg-green').removeAttr('disabled');
    	return noticeBox('手机号不能为空',target);
    }
    if(phone.length > 11){
            $('#getVrify').addClass('bg-green').removeAttr('disabled');
    	return noticeBox("手机号貌似有错o(╯□╰)o",target);
    }
    if(phone.length<11){
              $('#getVrify').addClass('bg-green').removeAttr('disabled');
    	return noticeBox("手机号貌似有错o(╯□╰)o",target);
    }
    if( !regPhone.test(phone)){
             $('#getVrify').addClass('bg-green').removeAttr('disabled');
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
                $('.step1').hide().siblings('.step2').show();
	   $('.progress2').addClass('active').siblings('.progress').removeClass('active');
                $('#getVrify').addClass('bg-green').removeAttr('disabled');
            }
            else { 
                noticeBox(res.error_text,target);
                $('#getVrify').addClass('bg-green').removeAttr('disabled');
            }
        },
         function(){
            noticeBox('网络好像不给力呢~ ( >O< ) ~');
            $('#getVrify').addClass('bg-green').removeAttr('disabled');
        },
        function(){
            noticeBox('服务器貌似出错了~ ( >O< ) ~');
            $('#getVrify').addClass('bg-green').removeAttr('disabled');
        }
    );
}

function checkCode(target){
    var phone=$('#enterPhone').val().trim();
    var code=$('#enterVrify').val().trim();
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    if(!code){
        $('#checkCode').addClass('bg-green').removeAttr('disabled');
        return noticeBox('请输入验证码！',target);
    }
    if(!regNumber.test(code)){
        $('#checkCode').addClass('bg-green').removeAttr('disabled');
        return noticeBox('验证码只能为数字！',target);
    }
    if(code.length!=4){
        $('#checkCode').addClass('bg-green').removeAttr('disabled');
        return noticeBox('验证码为4位数字！',target);
    }
    if(!phone){
        $('#checkCode').addClass('bg-green').removeAttr('disabled');
        return noticeBox('手机号不能为空！',target);
    }
    var url="";
    var action='check_code';
    var args={action:action,phone:phone,code:code};
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                $('.step2').hide().siblings('.step3').show();
                $('.progress3').addClass('active').siblings('.progress').removeClass('active');
                $('#checkCode').addClass('bg-green').removeAttr('disabled');
            }
            else {
                noticeBox(res.error_text,target);
                $('#checkCode').addClass('bg-green').removeAttr('disabled');
            }
        },
        function(){
            noticeBox('网络好像不给力呢~ ( >O< ) ~',target);
            $('#checkCode').addClass('bg-green').removeAttr('disabled');
        },
        function(){
            noticeBox('服务器貌似出错了~ ( >O< ) ~',target);
            $('#checkCode').addClass('bg-green').removeAttr('disabled');
        }
    );
}

function regist(target){
    var phone=$('#enterPhone').val().trim();
    var password=$('#password').val().trim();
    var re_password=$('#repassword').val().trim();
    var regPass=/^[0-9a-zA-Z]*$/g;
    if(!password) {
        $('#subRegist').addClass('bg-green').removeAttr('disabled');
        return noticeBox('密码不能为空！',target);
    }
    if(re_password!=password) {
         $('#subRegist').addClass('bg-green').removeAttr('disabled');
        return noticeBox('两次输入的密码不一致！',target);}

    if(password.length<6 || !regPass.test(password)) {
         $('#subRegist').addClass('bg-green').removeAttr('disabled');
        return noticeBox('请输入六位以上字母和数字的组合！',target);
    }
    password=CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
    var url="";
    var action='regist';
    var args={action:action,phone:phone,password:password};
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                $('#subRegist').addClass('bg-green').removeAttr('disabled');
                var next = getCookie("next_url");
                console.log(next);
                if(next==''){
                    window.location.href='/list';
                }else{
                    window.location.href=next;
                }
            }
            else {
                noticeBox(res.error_text);
                 $('#subRegist').addClass('bg-green').removeAttr('disabled');
            }
        },
        function(){
            noticeBox('网络好像不给力呢~ ( >O< ) ~',target);
             $('#subRegist').addClass('bg-green').removeAttr('disabled');
        },
        function(){
            noticeBox('服务器貌似出错了~ ( >O< ) ~',target);
             $('#subRegist').addClass('bg-green').removeAttr('disabled');
        }
    );
}