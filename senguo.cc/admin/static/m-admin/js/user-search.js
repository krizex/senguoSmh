var page=0,finished=false;
$(document).ready(function(){
    $(".container").css("minHeight",$(window).height()-40);
    $("#search-goods").on("click",function(){  //订单搜索
        var id = $("#search-ipt").val();
        if($.trim(id)==""){
            return Tip("请输入用户手机号、昵称或者姓名");
        }else{
            getGoodsItem(id);;
        }
    });
    $("#search-ipt").on("keydown keyup",function(){  //订单搜索
        var id = $("#search-ipt").val();
        if($.trim(id)==""){

        }else{
            getGoodsItem(id);
        }
    });
});
function getGoodsItem(key){
    var url = "/admin/follower?action=search&order_by=time&if_reverse=1&page=0&wd="+key;
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
                $(".no-result").html("没有搜索到用户~~");
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