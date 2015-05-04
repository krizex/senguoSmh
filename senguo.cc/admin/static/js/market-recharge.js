/**
 * Created by Administrator on 2015/4/20.
 */
$(document).ready(function(){

}).on("click",".rec-bm-lst .check-ipt",function(){
    /*$(".rec-bm-lst .check-ipt").removeClass("checked");
    $(this).addClass("checked");*/
}).on("click",".rec-bm-lst .check-ipt",function(){
    /*$(".rec-bm-lst .check-ipt").removeClass("checked");
    $(this).addClass("checked");*/
    var index = $(this).attr("data-index");
    if(index>0){
        noticeBox("当前只支持微信支付，其他支付方式正在开发中...");
    }
}).on("click","#commit-rec",function(){
    if($(this).attr("data-statu")==0) return false;
    var money = $.trim($("#money").val());
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
}).on("keydown keyup","#money",function(){
    if($.trim($(this).val())!=''){
        $("#commit-rec").attr("data-statu","1").removeClass("grey-bg");
    }else{
        $("#commit-rec").attr("data-statu","0").addClass("grey-bg");
    }
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