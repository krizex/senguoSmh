var page=0,finished=false;
$(document).ready(function(){
    var minheight = $(window).height()-80;
    $(".order-lists").css({minHeight:(minheight-80)+"px"});
    if($.getUrlParam("search")){
        $(".goods_list .gitem").removeClass("active");
        $(".goods_list .tab-line").addClass("hide");
        getGoodsItem("goods_search",0,$.getUrlParam("search"));
    }else{
        getGoodsItem();
    }
    $(window).scroll(function(){
        var totalheight = $(window).height() + $(window).scrollTop() +150;
        if(finished && $(".container").height() <= totalheight){
            $(".no-result").html("数据加载中...");
            finished=false;
            page++;
            pageGoods();
        }
    });
}).on("click",".goods_status",function(){
    $(".wrap_goods_menu").toggleClass("hide");
}).on("click",".goods_menu_list li",function(){
    var id = $(this).attr("data-id");
    $(".wrap_goods_menu").toggleClass("hide");
    $("#filter_status").attr("data-id",id).html($(this).html());
    page=0;
    getGoodsItem();
}).on("click",".user-all-list li",function(){//大类切换
    var index = parseInt($(this).index());
    $(".wrap_goods_menu").addClass("hide");
    $(".user-all-list .item").removeClass("active").eq(index).addClass("active");
    $(".user-all-list .tab-bg").css("left",33.3*index+"%");
    document.body.scrollTop=0;
    page=0;
    getGoodsItem();
});
//翻页加载
function pageGoods(){
    var action = $(".user-all-list").children(".active").attr("data-id");
    var order_by = $("#filter_status").attr("data-id");
    var url = "/admin/follower?action="+action+"&order_by="+order_by+"&if_reverse=1&page="+page;
    $.ajax({
        url:url,
        type:"get",
        success:function(res){
            if(res.success){
                var data = res.customer_list;
                if(data.length==0){
                    $(".no-result").html("没有更多用户了~~");
                    finished = false;
                }else{
                    insertGoods(data);
                    finished = true;
                    $(".no-result").html("");
                }
            }else{
                Tip(res.error_text);
            }
        }
    });
}
function getGoodsItem(){
    var action = $(".user-all-list").children(".active").attr("data-id");
    var order_by = $("#filter_status").attr("data-id");
    var url = "/admin/follower?action="+action+"&order_by="+order_by+"&if_reverse=1&page="+page;
    $.ajax({
        url:url,
        type:"get",
        success:function(res){
            if(res.success){
                var data = res.customer_list;
                $("#user-all-list").empty();
                if(data.length==0){
                    $("#user_num").html(0);
                    $(".no-result").html("没有搜索到用户~~");
                    finished = false;
                }else{
                    $("#user_num").html(res.count);
                    insertGoods(data);
                    finished = true;
                    $(".no-result").html("");
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
        var $item = $("#user_item").children().clone();
        $item.find(".user-link").attr("href","/madmin/userDetail/"+goods.id);
        $item.find(".user-name").html(goods.nickname);
        if(goods.headimgurl_small){
            $item.find(".cur-user-img").attr("src",goods.headimgurl_small);
        }
        if(goods.sex==1){
            $item.find(".sex-mark").addClass("man-mark");
        }else{
            $item.find(".sex-mark").addClass("woman-mark");
        }
        $item.find(".user-mark").html(goods.remark || "无备注");
        $item.find(".ubalance").html(goods.shop_balance);
        $item.find(".upoint").html(goods.shop_point);
        $item.find(".uid").html(goods.id);
        $("#user-all-list").append($item);
    }
}