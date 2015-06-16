/**
 * Created by Administrator on 2015/6/12.
 */
var curStaff = null;
$(document).ready(function(){
    $(".pop-win").on("click",function(e){
        if($(e.target).closest(".pop-content").length==0){
            $(".pop-win").addClass("hide");
        }
    })

    $(".order-grade .task-staff").on("click",function(e){
        e.stopPropagation();
        curStaff = $(this).closest(".order-grade");
        $(".pop-staff").removeClass("hide");
    });
    $(".staff-list>li").on("click",function(){
        var index = $(this).index();
        var src = $(this).find("img").attr("src");
        $("#sure-staff").attr("data-src",src);
        $("#sure-staff").attr("data-tel",$(this).attr("data-tel"));
        $(".staff-list>li").removeClass("active").eq(index).addClass("active");
    });
    $("#sure-staff").on("click",function(){
        var tel = $(this).attr("data-tel");
        curStaff.find("img").attr("src",$(this).attr("data-src"));
        curStaff.find(".order-line-grade").css("width","50%");
        curStaff.find(".order-wawa").css("left","50%");
        curStaff.find(".order-wawa").children("a").removeClass("task-staff");
        curStaff.find(".order-status-txt").css("left","50%");
        curStaff.find(".order-status-txt").empty().append('<span class="#c333">配送中</span><a class="" href="tel:'+tel+'">拨号</a>');
        $(".pop-staff").addClass("hide");
    });
    $("#search-order").on("click",function(){  //订单搜索
        var id = $("#search-ipt").val();
        if($.trim(id)=="" || isNaN($.trim(id))){
            return Tip("请输入只含数字的订单编号");
        }else{
            searchOrder(id);
        }
    });
    $(".order-lists>li").on("click",function(){//进入订单详情
        var id = $(this).attr("data-id");
        window.location.href="/madmin/orderDetail?id="+id;
    });
});
function searchOrder(id){
    var url = "";
    var args={
        id:id,
        action:"order"
    };
    $.postJson(url,args,function(res){
        if(res.success){
            var order = res.data;
            if(order.length==0){
                $(".no-result").html("没有查到任何数据").removeClass("hide");
            }else{
                initData(order);
            }
        }else{
            Tip(res.error_text);
        }
    });
}
function initData(order){
    $("#order-lists").empty();
    var $item = $("#order-item").children().clone();
    $item.attr("data-id",order.id);
    $item.find(".down-time").html();
    $item.find(".order-money").html();
    $item.find(".order-num").html();
    $item.find(".time").html();
    $item.find(".loc").html();
    $item.find(".say").html();
    $item.find(".staff-img").attr("src","");
    $("#order-lists").append($item);
}
