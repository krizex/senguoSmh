$(document).ready(function(){
    //fastclick initialise
    FastClick.attach(document.body);
    //商品单位转换
    var height = $(window).height();
    $(".container").css("minHeight",height-245+"px");
    if($(".home-top").size()>0){
        $("#title").html("卖家入驻申请");
        $("#beta").hide();
        if($("#tel").val()!=""){
            $("#tel").attr("disabled","disabled").addClass("bgd");
            $("#update_tel").removeClass("hide");
        }
    }
}).on("click","#get_code",function(){
   
    var geetest_challenge = $('.geetest_challenge').val();
    var geetest_validate = $('.geetest_validate').val();
    var geetest_seccode = $('.geetest_seccode').val();
    if(!geetest_seccode){
        geetest_seccode = '';
    }
    if(!geetest_validate){
        geetest_validate = '';
    }
    if(!geetest_challenge){
        geetest_challenge = '';
    }
    if (geetest_seccode==""||geetest_seccode==""||geetest_challenge==""){
        return Tip("请先完成图形验证")
    }
    getCode($(this));

}).on("click","#commit",function(){
    if($(this).attr("data-flag")=="off"){
        return Tip("请勿重复提交");
    }
    var tel = $.trim($("#tel").val());
    var name = $.trim($("#name").val());
    var code = $.trim($("#code").val());
    var wx_username = $.trim($("#wx-username").val());
    var geetest_challenge = $('.geetest_challenge').val();
    var geetest_validate = $('.geetest_validate').val();
    var geetest_seccode = $('.geetest_seccode').val();
    alert(geetest_challenge,geetest_validate,geetest_seccode);
    if(tel == "" || name == "" || code == ""){
        return Tip("姓名、手机号及验证码都不能为空");
    }
    if(!wx_username){
        return Tip("填写个人微信号，方便我们将您加入卖家交流群，获得更多行业信息与资源");
    }
    if(!geetest_seccode){
        geetest_seccode = '';
    }
    if(!geetest_validate){
        geetest_validate = '';
    }
    if(!geetest_challenge){
        geetest_challenge = '';
    }
    var args={
        _xsrf:window.dataObj._xsrf,
        phone:tel,
        realname:name,
        code:code,
        wx_username:wx_username,
        geetest_seccode:geetest_seccode,
        geetest_validate:geetest_validate,
        geetest_challenge:geetest_challenge,
    };
    $(this).attr("data-flag","off");
    $.ajax({
        url:"",
        type:"post",
        data:JSON.stringify(args),
        contentType:"application/json; charset=UTF-8",
        success:function(res){
            if(res.success) {
                Tip("申请成功");
                setTimeout(function(){
                    window.location.href='/admin';
                },1500);
            }else{
                $(this).attr("data-flag","on");
                Tip(res.error_text);
            }
        }
    });
});

function getCode($this){
    if($this.attr("data-statu")=="1") {
        return false;
    }
    $this.addClass("bg85").attr("data-statu", "1");
    var phone=$.trim($("#tel").val())
    var args={
        action:'gencode_shop_apply',
        phone:phone,
        _xsrf:window.dataObj._xsrf
    };
    $.ajax({
        url:"/customer/phoneVerify?action=customer",
        type:"post",
        data:JSON.stringify(args),
        contentType:"application/json; charset=UTF-8",
        success:function(res){
            if(res.success) {
                getCertCode($this);
            }else{
                $this.removeClass("bg85").removeAttr("data-statu").val("获取验证码");
                Tip(res.error_text);
            }
        }
    });
}
function getCertCode($obj){
    var i=60,timer=null;
    $obj.val("重新发送(60)");
    timer = setInterval(function (){
        i--;
        if(i==0){
            $obj.removeClass("bg85").removeAttr("data-statu").val("获取验证码");
            clearInterval(timer);
        }else{
            $obj.val("重新发送("+i+")");
        }
    },1000);
}