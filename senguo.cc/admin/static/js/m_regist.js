$(document).ready(function(){

}).on('click','#getVrify',function(){
	var $this=$(this);
	Vrify($this);
}).on('click','#checkCode',function(){
    var $this=$(this);
    checkCode($this);
}).on('click','#accept_rule',function(){
    var $this=$(this);
    if($this.hasClass('checked')){
        $this.removeClass('checked');
        $('#getVrify').removeClass('bg-green').attr({'disabled':true}).addClass("bg-grey");
    }
    else{
        $this.addClass('checked');
        $('#getVrify').addClass('bg-green').removeAttr('disabled').removeClass("bg-grey");
    }
}).on('click','#subRegist',function(){
    var $this=$(this);
    regist($this);
}).on('click','.backBtn',function(){
    var $this=$(this);
    var i=$this.attr('data-back');
    $('.step'+i).show().siblings('.step-box').hide();
    $('.progress'+i).addClass('active').siblings('.progress').removeClass('active');
    $("#getVrify").attr("data-flag","on");
    $("#checkCode").attr("data-flag","on");
    $("#subRegist").attr("data-flag","on");
}).on('click','.send',function(){
    noticeBox('验证码已发送到您手机，稍等一下哟！')
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
    var regPhone=/^(1)\d{10}$/;
    if(!phone){
    	return noticeBox('手机号不能为空',target);
    }
    if(phone.length > 11){
    	return noticeBox("手机号貌似有错o(╯□╰)o",target);
    }
    if(phone.length < 11){
    	return noticeBox("手机号貌似有错o(╯□╰)o",target);
    }
    if( !regPhone.test(phone)){
    	return noticeBox("手机号貌似有错o(╯□╰)o",target);
    }
    if(target.attr("data-flag")=="off") return false;
    target.attr("data-flag","off").removeClass('bg-green');
    var action='get_code';
    var url="";
    var args={
        action:action,
        phone:phone
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $('.step1').hide().siblings('.step2').show();
	            $('.progress2').addClass('active').siblings('.progress').removeClass('active');
                target.addClass('bg-green');
            }else{
                target.attr("data-flag","on").addClass('bg-green');
                return noticeBox(res.error_text,target);
            }
        }
    );
}

function checkCode(target){
    var phone=$('#enterPhone').val().trim();
    var code=$('#enterVrify').val().trim();
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    if(!code){
        return noticeBox('请输入验证码！',target);
    }
    if(!regNumber.test(code)){
        return noticeBox('验证码只能为数字！',target);
    }
    if(code.length!=4){
        return noticeBox('验证码为4位数字！',target);
    }
    if(!phone){
        return noticeBox('手机号不能为空！',target);
    }
    if(target.attr("data-flag")=="off") return false;
    target.attr("data-flag","off").removeClass('bg-green');
    var url="";
    var action='check_code';
    var args={action:action,phone:phone,code:code};
    $.postJson(url,args,
        function(res){
            if(res.success){
                $('.step2').hide().siblings('.step3').show();
                $('.progress3').addClass('active').siblings('.progress').removeClass('active');
                target.addClass('bg-green');
            }else {
                target.attr("data-flag","on").addClass('bg-green');
                return noticeBox(res.error_text,target);
            }
        }
    );
}

function regist(target){
    var phone=$('#enterPhone').val().trim();
    var password=$('#password').val().trim();
    var re_password=$('#repassword').val().trim();
    var regPass=/^[0-9a-zA-Z]*$/g;
    if(!password) {
        return noticeBox('密码不能为空！',target);
    }
    if(re_password!=password) {
        return noticeBox('两次输入的密码不一致！',target);}

    if(password.length<6 || !regPass.test(password)) {
        return noticeBox('请输入六位以上字母和数字的组合！',target);
    }
    if(target.attr("data-flag")=="off") return false;
    target.attr("data-flag","off").removeClass('bg-green');
    password=CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
    var url="";
    var action='regist';
    var args={action:action,phone:phone,password:password};
    $.postJson(url,args,
        function(res){
            if(res.success){
                var next = getCookie("next_url");
                target.addClass('bg-green');
                //console.log(next);
                if(next==''){
                    window.location.href='/list';
                }else{
                    window.location.href=next;
                }
            }else {
                target.attr("data-flag","on").addClass('bg-green');
                return noticeBox(res.error_text);
            }
        }
    );
}