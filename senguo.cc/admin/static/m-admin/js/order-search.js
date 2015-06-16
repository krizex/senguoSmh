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
        var list = eval($(this).closest(".order-grade").attr("data-SH2s"));
        var lis = "";
        for(var i=0; i<list.length; i++){
            var item = list[i];
            lis += '<li class="" data-tel="'+item.phone+'"><span class="img-border mr10"><img src="'+item.headimgurl+'" alt="员工头像"/></span><span class="">'+item.nickname+'</span></li>';
        }
        $("#staff-list").empty().append(lis);
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
    var url = '/admin/searchorder?action=order&id='+id+"&page=0";
    $.ajax({
        url:url,
        type:"get",
        success:function(res){
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
        }
    });

}
function initData(order){
    $("#order-lists").empty();
    var $item = $("#order-item").children().clone();
    var pay_type = "货到付款";
    $item.attr("data-id",order.id);
    $item.find(".down-time").html(order.create_date);
    $item.find(".order-money").html(order.totalPrice);
    $item.find(".order-num").html(order.num);
    $item.find(".time").html(order.send_time);
    $item.find(".loc").html(order.address_text);
    $item.find(".say").html(order.message);
    $item.find(".order-grade").attr("data-SH2s",order.SH2s);
    if(order.pay_type == 1){
        pay_type = "货到付款";
    }else if(order.pay_type == 2){
        pay_type = "余额支付";
    }else{
        pay_type = "在线支付";
    }
    var status_list = $item.find(".order-status-txt").children();
    status_list.addClass("hide");
    //判断订单状态
    if(order.status==1) {//未处理
        status_list.eq(0).removeClass("hide");
    }else if(order.status==4){//处理中
        $item.find(".order-line-grade").css("width","50%");
        $item.find(".order-wawa").css("left","50%");
        $item.find(".order-wawa").children("a").removeClass("task-staff");
        $item.find(".order-status-txt").css("left","50%");
        status_list.eq(1).removeClass("hide");
    }else if(order.status==5||order.status==6||order.status==7){//已完成
        $item.find(".order-line-grade").css("width","100%");
        $item.find(".order-wawa").css("left","100%");
        $item.find(".order-wawa").children("a").removeClass("task-staff");
        $item.find(".order-status-txt").css("left","100%");
        status_list.eq(2).children(".staff-tel").attr("href",order.SH2.phone);
        status_list.eq(2).removeClass("hide");
    }else if(order.status==0){//已删除
        $item.find(".order-grade").empty().append("<p class='no-result mt30 red-txt'>已删除</p>");
    }
    $item.find(".staff-img").attr("src",order.SH2.headimgurl);
    $item.find(".order-status-txt").attr("data-nickname",order.SH2.nickname).attr("data-id",order.SH2.id);
    $item.find(".pay-type").html(pay_type);
    $("#order-lists").append($item);
}
