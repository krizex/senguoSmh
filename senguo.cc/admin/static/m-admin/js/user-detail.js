var page=0,finished=false,link="/admin/goods/all",_type = 1;
$(document).ready(function(){
    var minheight = $(window).height()-80;
    $(".wrap-user-detail").css({minHeight:(minheight-80)+"px"});
    var id = $(".wrap-user-detail").attr("data-id");
    getGoodsItem(id);
    /*$(window).scroll(function(){
        return false;
        var totalheight = $(window).height() + $(window).scrollTop() +150;
        if(finished && $(".container").height() <= totalheight) {
            $(".no-result").html("数据加载中...");
            finished=false;
            page++;
            if($.getUrlParam("search")){
                pageGoods("goods_search",0,$.getUrlParam("search"));
            }else if($.getUrlParam("classify")) {
                pageGoods("classify",$.getUrlParam("classify"));
            }else{
                pageGoods("all",0);
            }
        }
    });*/
}).on("click",".user-umark",function(){
    if($(".mark-text").html()=="无备注"){
        $("#user_remark").val("");
    }else{
        $("#user_remark").val($(".mark-text").html());
    }
    $(".pop-name").removeClass("hide");
    $("#user_remark").focus();
}).on("click","#edit_remark",function(){
    var mark = $("#user_remark").val();
    userMark(mark,$(this));
});
function userMark(mark,$obj){
    if(!mark){
        return Tip("备注不能为空");
    }
    if($obj.attr("data-flag")=="off"){
        return false;
    }
    var url='/admin/follower';
    var action="remark";
    var data={
        id:$(".wrap-user-detail").attr("data-id"),
        remark:mark
    };
    var args={
        action:action,
        data:data
    };
    $obj.attr("data-flag","off");
    $.postJson(url,args,
        function(res){
            $obj.attr("data-flag","on");
            if(res.success){
                $(".mark-text").html(mark);
                $(".pop-name").addClass("hide");
            }
            else{
                Tip(res.error_text);
            }
        }
    );
}
//翻页加载
function pageGoods(action,type_id,value){
    var url;
    var filter_status = $("#filter_status").attr("data-id");
    var order_status1 = "group";
    var order_status2 = $(".goods_list").find(".active").attr("data-id");
    var filter_status2 = -2;
    var pn = page;
    if(filter_status=="delete"){
        url="/admin/goods/delete?page="+pn;
    }else{
        if(action=="classify"){
            url = "/admin/goods/all?filter_status="+filter_status+"&order_status1="+order_status1+"&order_status2="+order_status2+"&filter_status2="+filter_status2+"&type=classify&sub_type="+type_id+"&page="+pn;
        }else if(action=="goods_search"){
            url="/admin/goods/all?type=goods_search&content="+value+"&page="+pn;
        }else{
            url = "/admin/goods/all?filter_status="+filter_status+"&order_status1="+order_status1+"&order_status2="+order_status2+"&filter_status2="+filter_status2+"&page="+pn;
        }
    }
    $.ajax({
        url:url,
        type:"get",
        success:function(res){
            if(res.success){
                var data = res.data;
                if(data.length==0){
                    $(".no-result").html("没有更多商品了");
                    finished = false;
                }else{
                    insertGoods(data);
                    finished = true;
                }
            }else{
                Tip(res.error_text);
            }
        }
    });
}
function getGoodsItem(id){
    var url;
    url = "/admin/searchorder?action=customer_order&id="+id+"&filter=undefined&pay_type=undefined&user_type=undefined&page="+page;
    $.ajax({
        url:url,
        type:"get",
        success:function(res){
            if(res.success){
                var data = res.data;
                $("#uorder-list").empty();
                if(data.length==0){
                    $("#uorder-list").append('<div class="no-result">该用户没有订单</div>');
                    finished = false;
                }else{
                    insertGoods(data);
                    finished = true;
                }
            }else{
                Tip(res.error_text);
            }
        }
    });
}
function insertGoods(data){
    for(var i=0; i<data.length; i++){
        var goods = data[i];
        var $item = $("#uorder_item").children().clone();
        $item.attr("data-id",goods.id);
        $item.find(".order_code").html(goods.num);
        $item.find(".order_money").html(goods.totalPrice);
        $item.find(".order_address").html(goods.address_text);
        $item.find(".order_time").html(goods.send_time);
        var pay_type = "";
        if(goods.pay_type==1){
            pay_type="货到付款";
        }else if(goods.pay_type==2){
            pay_type="余额支付";
        }else{
            pay_type="在线支付";
        }
        $item.find(".order_type").html(pay_type);
        var status = "";
        if(goods.status==1){
            status = "未处理";
        }else if(goods.status==4){
            status = "处理中";
        }else if(goods.status==5){
            status = "已收货";
        }else if(goods.status==6 || goods.status==7){
            status = "已评价";
        }else{
            status = "已删除";
        }
        $item.find(".uorder_status").html(status);
        $("#uorder-list").append($item);
    }
}