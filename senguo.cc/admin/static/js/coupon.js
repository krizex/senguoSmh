$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height);
    //兑换
    $(document).on("click","#convert-btn",function(){
        var key = $(".coupon-ipt").val();
        if(key!=""){
            searchKey(key);
        }
    });
    $(document).on("click",".back",function(){
        history.go(-1);
    });
    //领取优惠券
    $(document).on("click","#get-coupon",function(){
        var coupon_key = $(this).attr("data-key");
        getCoupon(coupon_key);
    });
});
//领取优惠券
function getCoupon(coupon_key){
    $.ajax({
        url:"/coupon/detail?action=get_coupon&coupon_key="+coupon_key,
        type:"get",
        success:function(res){
            if(res.success){
                Tip("兑换成功");
                setTimeout(function(){
                    window.location.href="/coupon?action=coupon";
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
                $item.find(".shop-name").html(coupon.shop_name);
                $item.find(".shop-url").html("http://senguo.cc/"+coupon.shop_code).attr("href","http://senguo.cc/"+coupon.shop_code);
                $item.find(".coupon-money").html(coupon.coupon_money);
                $item.find(".used-rule").html(coupon.use_rule);
                $item.find(".use-time").html(coupon.effective_time);
                var str = "未消费";
                if(coupon.coupon_status == 1){
                    str="已消费";
                }else if(coupon.coupon_status == 2){
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