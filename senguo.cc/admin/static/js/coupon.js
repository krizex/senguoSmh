$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height-40);
    //兑换
    $(document).on("click","#convert-btn",function(){
        var key = $(".coupon-ipt").val();
        if(key!=""){
            searchKey(key);
        }
    });
    $(document).on("click",".back",function(){
        history.back();
    });
    //领取优惠券
    $(document).on("click",".get-coupon",function(){
        if($(this).hasClass("coupon-used")) return Tip("该优惠券还没有到领取时间");
        if($(this).attr("data-flag")=="on"){
            var coupon_id = $(this).attr("data-id");
            $(this).attr("data-flag","off");
            getCoupon(coupon_id,$(this));
        }
    });
});
//领取优惠券
function getCoupon(coupon_id,$obj){
    $.ajax({
        url:"/coupon/grub?action=get_coupon&coupon_id="+coupon_id,
        type:"get",
        success:function(res){
            $obj.attr("data-flag","on");
            if(res.success){
                coupon_money=res.coupon_money;
                var tip="太棒了！你获得了价值"+coupon_money+"元的优惠券一张哦！";
                Tip(tip);
                setTimeout(function(){
                    window.location.href="/coupon/detail?action=detail&coupon_key="+res.coupon_key;
                },2000);
            }else{
                Tip(res.error_text);
            }
        }
    });
}
//兑换优惠券
function searchKey(key){
    $.ajax({
        url:"/coupon/detail?action=exchange&coupon_key="+key,
        type:"get",
        success:function(res){
            if(res.success){
                var coupon = res.output_data;
                var $item = $("#coupon-item").children().clone();
                $item.find(".coupon-link").attr("href","/coupon/detail?action=detail&coupon_key="+coupon.coupon_key);
                //$item.find(".shop-name").html(coupon.shop_name);
                //$item.find(".shop-url").html("http://senguo.cc/"+coupon.shop_code).attr("href","http://senguo.cc/"+coupon.shop_code);
                $item.find(".coupon-money").html(coupon.coupon_money);
                $item.find(".used-rule").html(coupon.use_rule);
                $item.find(".start-time").html(coupon.effective_time);
                $item.find(".end-time").html(coupon.uneffective_time);
                $item.find(".used-group").html(coupon.use_goods_group);
                $item.find(".used-goods").html(coupon.use_goods);
                var str = "未消费";
                if(coupon.coupon_status == 2){
                    str="已消费";
                }else if(coupon.coupon_status == 3){
                    str="已过期";
                }
                $item.find(".is_used").html(str);
                if($("#coupon-list").children().size()==0){
                    $("#coupon-list").append($item);                    
                }else{
                    $("#coupon-list").children().first().before($item);
                }     
                Tip("兑换成功");
            }else{
                Tip(res.error_text);
            }
        }
    });
}