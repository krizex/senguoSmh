$(document).ready(function(){
    //fastclick initialise
    FastClick.attach(document.body);
    //商品单位转换
    var height = $(window).height();
    $(".container").css("minHeight",height-243+"px");
    if($(".home-top").size()>0){
        $("#title").html("卖家入驻申请");
        $("#beta").hide();
        if($("#tel").val()!=""){
            $("#tel").attr("disabled","disabled").addClass("bgd");
            $("#update_tel").removeClass("hide");
        }
    }
}).on("click","#get_code",function(){
    getCode($(this));
}).on("click","#commit",function(){
    if($(this).attr("data-flag")=="off"){
        return Tip("请勿重复提交");
    }
    var tel = $.trim($("#tel").val());
    var name = $.trim($("#name").val());
    var code = $.trim($("#code").val());
    if(tel == "" || name == "" || code == ""){
        return Tip("姓名、手机号及验证码都不能为空");
    }
    var args={
        _xsrf:window.dataObj._xsrf,
        phone:tel,
        realname:name,
        code:code
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