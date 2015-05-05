/**
 * Created by Administrator on 2015/5/5.
 */
$(document).ready(function(){

}).on("click",".tab-lst li",function(){
    var index = $(this).index();
    $(".tab-lst li").removeClass("active").eq(index).addClass("active");
}).on("click",".apply-lst li",function(){
    if($(this).hasClass("active")) return false;
    var index = $(this).index();
    var action = $(this).attr("data-action");
    $(".apply-lst li").removeClass("active").eq(index).addClass("active");
    $.ajax({
        url:"/super/cash?action="+action,
        type:"get",
        success:function(res){
            if(res.success){
                console.log(res);
                var data = res.data;
                /*<li data-apply-id="1">
                    <ul class="shop-attr-lst group">
                        <li>店铺名:<a href="javascript:;">马灰灰的水果店</a></li>
                        <li>认证类型：个人认证</li>
                        <li>账户余额：4333.00元</li>
                        <li>提现申请时间：2012年5月5日 12:22:22</li>
                        <li>提现金额：<span class="red-txt">400.00</span>元</li>
                        <li>支付宝帐号：<span class="red-txt">123456@qq.com</span></li>
                        <li>申请人：<a href="javascript:;">马灰</a></li>
                    </ul>
                    <div class="apply-btn-group">
                        <a href="javascript:;" class="ok-btn">通过并已确认支付</a>
                        <a href="javascript:;" class="refuse-btn">拒绝</a>
                    </div>
                    <p class="reason-txt hidden">拒绝理由：申请金额过大</p>
                </li>*/
            }
        }
    })
}).on("click",".refuse-btn",function(){
    var index = $(this).closest("li").index();
    $("#com-cont").val("");
    $(".wrap-com-pop").attr("data-index",index).removeClass("hide");
}).on("click","#submit-apply",function(){  //拒绝申请
    var reason = $("#com-cont").val();
    var index =  $(".wrap-com-pop").attr("data-index");
    var apply_id = parseInt($(".apply-cont-lst").children().eq(index).attr("data-apply-id"));
    $.ajax({
        url:"/super/cash",
        data:{action:"decline",decline_reason:reason,apply_id:apply_id,_xsrf:window.dataObj._xsrf},
        type:"post",
        success:function(res){
            if(res.success){
                $("#com-cont").val("");
                $(".wrap-com-pop").addClass("hide");
                $(".apply-cont-lst").children().eq(index).children(".apply-btn-group").addClass("hidden");
                $(".apply-cont-lst").children().eq(index).children(".reason-txt").html("拒绝理由："+reason).removeClass("hidden");
                alert("操作成功");
            }else{
                alert(res.error_text);
            }
        }
    });
}).on("click","#concel-apply",function(){
    $("#com-cont").val("");
    $(".wrap-com-pop").addClass("hide");
}).on("click",".ok-btn",function(){    //通过申请
    var $this = $(this);
    var apply_id = parseInt($this.closest("li").attr("data-apply-id"));
    $.ajax({
        url:"/super/cash",
        data:{action:"commit",apply_id:apply_id,_xsrf:window.dataObj._xsrf},
        type:"post",
        success:function(res){
            if(res.success){
                $this.closest("li").children(".apply-btn-group").addClass("hidden");
                $this.closest("li").children(".reason-txt").html("已通过").removeClass("hidden");
                alert("操作成功");
            }else{
                alert(res.error_text);
            }
        }
    });
});