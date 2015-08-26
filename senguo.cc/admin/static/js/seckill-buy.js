var timer = null;
$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height+"px");
    $(document).on("click",".goback",function(){
        history.back();
    });
    if($("#seckill").size()>0){//秒杀
        if($(".seckill-time-list").children("li").size()==0){
            $(".no-result").html("该活动结束了~~").removeClass("hide");
            setTimeout(function(){
                window.location.href="/"+$("#shop_code").val();
            },1200);
            return false;
        }
        $(".stime-list").each(function(){
            $(this).closest("li").width($(this).width()+60);
        });
        getList($(".cur-time").closest('li').attr("data-id"));
        var start_time = parseInt($(".cur-time").closest('li').attr("data-start"));
        var continue_time = parseInt($(".cur-time").closest('li').attr("data-continue"));
        countTime((continue_time+start_time)*1000,start_time,1,$(".show-time-box"));
    }
    if($("#discount").size()>0){//折扣
        $(".no-seckill-time").each(function(){
            var time = parseInt($(this).attr("data-time"));
            countTime(time*1000,0,2,$(this));
        });
        seckill_goods_ids=[];
    }
    if(parseInt(cookie.getCookie("cart_count"))>0){
        $(".cart-num").html(cookie.getCookie("cart_count")).removeClass("hide");
        setTimeout(function(){
            $(".cart-num").removeClass("origin-cart");
        },20);
    }
}).on("click",".add-btn",function(){
    var $parent = $(this).closest(".wrap-operate");
    var num = parseInt($parent.attr("data-num"));
    var storage = parseInt($parent.attr("charge-storage"));
    //判断库存
    if(storage==0){
        $(this).closest("li").find(".cover-img").removeClass("hide");
        $(this).closest("li").find(".wrap-discount-item").addClass("no-goods");
        return Tip("当前商品已经售罄，下次记得早点哦~~");
    }
    if(num==storage){
        return Tip("库存只有这么多了~~");
    }
    var charge_id = $parent.attr("data-id");
    if(num==0){
        $parent.children(".num-txt").removeClass("hide").html(1);
        $parent.children(".minus-btn").removeClass("hide");
        var cart_num = parseInt($(".cart-num").html());
        $(".cart-num").html(cart_num+1).removeClass("hide");
        setTimeout(function(){
            $(".cart-num").removeClass("origin-cart");
        },20);
    }
    num++;
    $parent.children(".num-txt").html(num);
    $parent.attr("data-num",num);
    window.dataObj.fruits[charge_id]=num;
}).on("click",".minus-btn",function(){
    var $parent = $(this).closest(".wrap-operate");
    var num = parseInt($parent.attr("data-num"));
    if(num==1){
        num=0;
        $parent.children(".num-txt").addClass("hide");
        $(this).addClass("hide");
        var cart_num = parseInt($(".cart-num").html());
        $(".cart-num").html(cart_num-1).removeClass("hide");
        if((cart_num-1)==0){
            $(".cart-num").addClass("hide").addClass("origin-cart");
        }
    }else{
        num--;
        $parent.children(".num-txt").html(num);
    }
    var charge_id = $parent.attr("data-id");
    $parent.attr("data-num",num);
    window.dataObj.fruits[charge_id]=num;
}).on("click",".stime-list li",function(){//选择时间段
    var id = $(this).attr("data-id");
    var start_time = parseInt($(this).attr("data-start"));
    var continue_time = parseInt($(this).attr("data-continue"));
    $(".stime-list li").removeClass("active");
    $(this).addClass("active");
    clearTimeout(timer);
    $(".day").html("");
    $(".hour").html("");
    $(".minute").html("");
    $(".second").html("");
    countTime((continue_time+start_time)*1000,start_time,1,$(".show-time-box"));//倒计时
    getList(id);
}).on("click",".seckill-btn",function(){//抢
    var id = $(this).closest("li").attr("charge_type_id");
    var s_goods_id = $(this).closest("li").attr("seckill-id");
    var storage = parseInt($(this).closest("li").find(".store-num").html());
    if(storage==0){
        $(this).closest("li").find(".cover-img").removeClass("hide");
        $(this).closest("li").find(".goods-price-row").addClass("no-goods");
        $(this).closest("li").find(".seckill-btns").addClass("hide");
        $(this).closest("li").find(".seckill-btn-more").removeClass("hide");
        return Tip("当前商品已经秒杀完了，下次记得早点哦~~");
    }
    window.dataObj.fruits[id]=1;
    $(this).closest("li").find(".seckill-btns").addClass("hide");
    $(this).closest("li").find(".seckill-btn-more").removeClass("hide");
    var num = parseInt($(".cart-num").html());
    $(".cart-num").html(num+1).removeClass("hide");
    Tip("请在秒杀结束前支付,否则将按原价付款哦!");
    setTimeout(function(){
        $(".cart-num").removeClass("origin-cart");
    },20);
    seckill_goods_ids.push(s_goods_id);
}).on("click",".seckill-btn-more,.seckill-btn-first",function(){//抢先看&更多惊喜
    var shop_code = $("#shop_code").val();
    addCart("/"+shop_code);
}).on("click",".go-cart",function(){
    var url = $(this).attr("url");
    addCart(url);
}).on("click",".back-prev",function(){
    var url = $(this).attr("url");
    addCart(url);
});
//加入购物车
function addCart(link){
    var url='/'+$("#shop_code").val();
    var action = 4;
    fruits_num();
    var fruits=window.dataObj.fruits;
    var args={
        action:action,
        fruits:fruits,
        seckill_goods_ids:seckill_goods_ids
    };
    $.postJson(url,args,function(res){
            if(res.success){
                cookie.setCookie("cart_count",$(".cart-num").html());
                window.location.href=link;
            }
            else return Tip(res.error_text);
        }
    );
}
function fruits_num(){
    for(var key in window.dataObj.fruits){
        if(window.dataObj.fruits[key]==0){delete window.dataObj.fruits[key];}
    }
}
//获取数据
function getList(activity_id){
    var args = {
        action:"seckill",
        activity_id:activity_id
    };
    var url = "";
    $.postJson(url,args,function(res){
        if(res.success){
            $("#seckill_list").empty();
            var data = res.output_data;
            insertGoods(data);
        }
    });
}
function insertGoods(data){
    if(data.length==0){
        $(".no-result").html("该活动没有商品了~~").removeClass("hide");
        return false;
    }else{
        $(".no-result").addClass("hide");
        for(var key in data){
            var $item = $("#seckill-item").children("li").clone();
            $item.attr("seckill-id",data[key].goods_seckill_id).attr("fruit-id",data[key].fruit_id).attr("charge_type_id",data[key].charge_type_id).attr("is_bought",data[key].is_bought);
            if(data[key].img_url){
                $item.find(".image").attr("src",data[key].img_url+"?imageView2/1/w/100/h/100");
            }else{
                $item.find(".image").attr("src",'/static/images/TDSG.png');
            }
            $item.find(".store-num").html(data[key].activity_piece);
            $item.find(".nm-name").html(data[key].goods_name);
            $item.find(".price-bo").html(data[key].charge_type_text);
            $item.find(".price-dif").html(data[key].price_dif);
            if(data[key].activity_piece==0){
                $item.find(".cover-img").removeClass("hide");
                $item.find(".goods-price-row").addClass("no-goods");
                $item.find(".seckill-btns").addClass("hide");
                $item.find(".seckill-btn-more").removeClass("hide");
            }
            if($(".seckill-ing").hasClass("hide")){//未开始
                $item.find(".seckill-btns").addClass("hide");
                $item.find(".seckill-btn-first").removeClass("hide");
            }
            if(data[key].is_bought==1){
                $item.find(".seckill-btns").addClass("hide");
                $item.find(".seckill-btn-more").removeClass("hide");
            }
            $("#seckill_list").append($item);
        }
    }
}
//type为活动类型
function countTime(time,start_time,type,$obj){
    var time_end = time;
    var time_now = new Date().getTime();
    if(type==1){
        if(start_time*1000<=time_now){//正在进行
            $(".no-seckill-time").addClass("hide");
            $(".seckill-ing").removeClass("hide");
            if($(".no-seckill-time").hasClass("hide")){
                $(".seckill-btns").addClass("hide");
                $(".seckill-btn").removeClass("hide");
            }
        }else{
            $(".seckill-ing").addClass("hide");
            $(".no-seckill-time").removeClass("hide");
            time_end = start_time*1000;
        }
    }
    var time_distance = time_end - time_now;  // 结束时间减去当前时间
    var int_day, int_hour, int_minute, int_second;
    if(time_distance >= 0){
        // 天时分秒换算
        int_day = Math.floor(time_distance/86400000);
        time_distance -= int_day * 86400000;
        int_hour = Math.floor(time_distance/3600000);
        time_distance -= int_hour * 3600000;
        int_minute = Math.floor(time_distance/60000);
        time_distance -= int_minute * 60000;
        int_second = Math.floor(time_distance/1000);
        // 时分秒为单数时、前面加零站位
        if(int_hour < 10)
            int_hour = "0" + int_hour;
        if(int_minute < 10)
            int_minute = "0" + int_minute;
        if(int_second < 10)
            int_second = "0" + int_second;
        // 显示时间
        if(int_day>0){
            $obj.find(".day").html(int_day+"天");
        }
        $obj.find(".hour").html(int_hour+"时");
        $obj.find(".minute").html(int_minute+"分");
        $obj.find(".second").html(int_second+"秒");
        timer = setTimeout(function(){
            countTime(time,start_time,type,$obj);
        },1000);
    }else{
        //Tip("这场秒杀结束啦~~");
        setTimeout(function(){
            window.location.reload(true);
        },1000);
    }
}