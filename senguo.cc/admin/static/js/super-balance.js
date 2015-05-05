/**
 * Created by Administrator on 2015/5/5.
 */
$(document).ready(function(){

}).on("click",".tab-lst li",function(){
    var index = $(this).index();
    $(".tab-lst li").removeClass("active").eq(index).addClass("active");
}).on("click",".apply-lst li",function(){
    var index = $(this).index();
    $(".apply-lst li").removeClass("active").eq(index).addClass("active");
}).on("click",".refuse-btn",function(){
    var index = $(this).closest("li").index();
    $("#com-cont").val("");
    $(".wrap-com-pop").attr("data-index",index).removeClass("hide");
}).on("click","#submit-apply",function(){  //拒绝申请
    var reason = $("#com-cont").val();
    var index =  $(".wrap-com-pop").attr("data-index");
    $.ajax({
        url:"/super/balance",
        data:{action:"decline",decline_reason:reason},
        type:"post",
        success:function(res){
            if(res.success){
                $("#com-cont").val("");
                $(".wrap-com-pop").addClass("hide");
                $(".apply-cont-lst").children().eq(index).children(".apply-btn-group").addClass("hidden");
                $(".apply-cont-lst").children().eq(index).children(".reason-txt").html(reason).removeClass("hidden");
                alert("操作成功");
            }else{
                alert("服务器出错，请联系管理员！");
            }
        }
    });
}).on("click","#concel-apply",function(){
    $("#com-cont").val("");
    $(".wrap-com-pop").addClass("hide");
}).on("click",".ok-btn",function(){    //通过申请
    var $this = $(this);
    $.ajax({
        url:"/super/balance",
        data:{action:"commit"},
        type:"post",
        success:function(res){
            if(res.success){
                $this.closest("li").children(".apply-btn-group").addClass("hidden");
                $this.closest("li").children(".reason-txt").html("已通过").removeClass("hidden");
                alert("操作成功");
            }else{
                alert("服务器出错，请联系管理员！");
            }
        }
    });
});