/**
 * Created by Administrator on 2015/4/20.
 */
var m_type = 0;
$(document).ready(function(){

}).on("click",".rec-bm-lst .check-ipt",function(){
    /*$(".rec-bm-lst .check-ipt").removeClass("checked");
    $(this).addClass("checked");*/
    var index = $(this).attr("data-index");
    m_type = index;
    if(index==2){
        noticeBox("银行卡支付尚未开通，请选择其他支付方式");
        return false;
    }else{
        $(".rec-bm-lst .check-ipt").removeClass("checked");
        $(this).addClass("checked");
    }
}).on("click","#commit-rec",function(){
    //if($(this).attr("data-statu")==0) return false;
    var money = $.trim($("#money").val());
    if(money==''){
        noticeBox("充值金额不能为空");
        return false;
    }
    if(m_type==0){
        if(isWeiXin()){
            if(isMon(money)){
                SetCookie("money",money,30);
                window.location.href="/fruitzone/paytest?totalPrice="+money;
            }else{
                noticeBox("您输入的金额格式不对，请重新输入");
                return false;
            }
        }else{
            noticeBox("当前是微信支付，请在微信客户端中打开此页面支付");
        }
    }else if(m_type==1){
        if(isMon(money)){
            $.ajax({
                url:"/fruitzone/systemPurchase/alipaytest",
                data:{price:money,_xsrf:window.dataObj._xsrf},
                type:"post",
                success:function(res){
                    SetCookie("money",money,30);
                    window.location.href=res.url;
                }
            })
        }else{
            noticeBox("您输入的金额格式不对，请重新输入");
            return false;
        }
    }
}).on("click","#money",function(){
    $("#commit-rec").attr("data-statu","1").removeClass("grey-bg");
    /*if($.trim($(this).val())!=''){
        $("#commit-rec").attr("data-statu","1").removeClass("grey-bg");
    }else{
        $("#commit-rec").attr("data-statu","0").addClass("grey-bg");
    }*/
});
function isMon(money){
    var flag = false;
    if(money){
       if(isNaN(money)){
           flag = false;
       }else{
           if(money.indexOf(".")!=-1){
               var flo = money.split(".")[1];
               if(flo.length>2){
                   flag = false;
               }else{
                   flag = true;
               }
           }else{
               flag = true;
           }
       }
    }else{
        flag = false;
    }
    return flag;
}
function isWeiXin(){
    var ua = window.navigator.userAgent.toLowerCase();
    if(ua.match(/MicroMessenger/i) == 'micromessenger'){
        return true;
    }
    else{
        return false;
    }
}