var num_list={};
$(document).ready(function(){
    var _shop_code = $("#shop_code").val();
    var end_time = parseInt($("#shop_code").attr("end_time"));
    var has_discount_activity = parseInt($("#shop_code").attr("has_discount_activity"));
    var is_activity = parseInt($("#shop_code").attr("is_activity"));
    if(is_activity>0 && has_discount_activity>0){
        countTime($("#time_box"));
    }
    var _url='/'+_shop_code;
    var mWidth = $(window).width();
    var width = $("#swiper-container").width();
    if(mWidth>800){
        $("#shop-area").css("left",(mWidth-width)/2+"px");
        $("#cart-bg").css("left",((mWidth-width)/2+width-54)+"px");
        $("#back-bg").css("left",(mWidth-width)/2+"px");
    }
    $("#back-bg").on("click",function(){
        var url = $(this).attr("data-href");
        window.location.href=url;
    });
    $(".swiper-container").css({"max-height":mWidth});
    $(".swiper-wrapper").css({"max-height":mWidth});
    $("body").css("backgroundColor","#fff");
    $(".phone-box").css("paddingBottom","20px").css("backgroundColor","#fff");
    $(".swiper-wrapper").width(width*$(".swiper-slide").size());
    var swiper = new Swiper('#swiper-container',{
        mode: 'horizontal',
        loop:true,
        grabCursor: true,
        pagination: '.pagination',
        autoplay:"4000",
        autoplayDisableOnInteraction:false
    });
    if($(".swiper-slide").size()==3){
        swiper.stopAutoplay();
    }
    
    //初始化购物车数量
    if(getCookie("cart_count")!=''){
        $("#cart-now-num").html(getCookie("cart_count")).removeClass("move-cart");
    }

    $(".goods-choose-lst li").on("click",function(){
        var index = $(this).index();
        $(".goods-choose-lst li").removeClass("active").eq(index).addClass("active");
        $(".goods-info-lst li").removeClass("active").eq(index).addClass("active");
    });

    $(".now-buy").on("click",function(){
        var $this=$(this);
        var id=parseInt($this.siblings(".want-num").attr('data-id'));
        var relate=parseFloat($this.parents("li").find(".want-num").attr('data-relate'));
        var unit_num=parseFloat($this.parents("li").find('.number').text());
        var storage=parseFloat($this.attr("data-storage"));
        var change_num=relate*unit_num;
        var buy_today=$this.parents('li').attr('data-buy');
        var allow_num=parseInt($this.parents('li').attr('data-allow'));
        var buy_limit=parseInt($(".wrap-goods-detail").attr("data-buylimit"));
        var user_limit=parseInt($(".wrap-goods-detail").attr("data-userlimit"));
        if(buy_limit!=user_limit&&buy_limit!=0){
            if(buy_limit==1){
                return noticeBox("该商品仅限新用户购买");
            }else if(buy_limit==2){
                return noticeBox("该商品仅限老用户购买");
            }else if(buy_limit==3){
                return noticeBox("该商品仅限充值用户购买");
            }
        }
        if(buy_today=='True'&&allow_num<=0){
            return noticeBox('您该商品的限购数量已达上限啦！┑(￣▽ ￣)┍ ');
        }
        if(storage<change_num){
            return noticeBox("库存不足啦~~");
        }
        $this.attr("data-storage",storage-change_num);
        var _this = $(this);
        if(_this.hasClass("r70")) return false;
        $(this).addClass("r70");
        $(this).prev(".want-num").show().addClass("w90");
        var cart_now=parseInt($("#cart-now-num").html());
        if(cart_now==0){
            $("#cart-now-num").html(1);
            $("#cart-now-num").removeClass("move-cart");
            SetCookie("cart_count",1);
        }else{
            $("#cart-now-num").html(cart_now+1);
            $("#cart-now-num").removeClass("move-cart");
            SetCookie("cart_count",cart_now+1);
        }
        num_list[id]=1;
        fruits_num();
    });
    $(".add-num").on("click",function(){
        var $this=$(this);
        var id=parseInt($this.parents(".want-num").attr('data-id'));
        var num = parseInt($this.prev(".input").text());
        var relate=parseFloat($this.parents(".want-num").attr('data-relate'));
        var unit_num=parseFloat($this.parents("li").find('.number').text());
        var storage=parseFloat($this.parents("li").find('.now-buy').attr("data-storage"));
        var limit_num=parseInt($this.parents(".wrap-goods-detail").attr('data-limit'));
        var change_num=relate*unit_num*1;
        var buy_today=$this.parents('li').attr('data-buy');
        var allow_num=parseInt($this.parents('li').attr('data-allow'));
        var buy_limit=parseInt($(".wrap-goods-detail").attr("data-buylimit"));
        var user_limit=parseInt($(".wrap-goods-detail").attr("data-userlimit"));
        if(buy_limit!=user_limit&&buy_limit!=0){
            if(buy_limit==1){
                return noticeBox("该商品仅限新用户购买");
            }else if(buy_limit==2){
                return noticeBox("该商品仅限老用户购买");
            }else if(buy_limit==3){
                return noticeBox("该商品仅限充值用户购买");
            }
        }
        if(buy_today=='True'&&num>=allow_num){
            return noticeBox('您该商品的限购数量已达上限啦！┑(￣▽ ￣)┍ ');
        }
        if(storage<=change_num){
            return noticeBox("库存不足啦~~");
        }
        if(limit_num>0&&num>=limit_num){
            return noticeBox('当前商品最多只能买 '+limit_num+' 件哦！');
        }
        $this.parents("li").find('.now-buy').attr({"data-storage":storage-change_num})
        if(isNaN(num)){
            noticeBox("别调戏我哦，请输入数字类型");
        }else{           
            num++;
            $(this).prev(".input").text(num);
            num_list[id]=num;
            fruits_num();
        }
       
    });
    $(".minus-num").on("click",function(){
        var $this=$(this);
        var id=parseInt($this.parents(".want-num").attr('data-id'));
        var num = parseInt($(this).next(".input").text());
        var relate=parseFloat($this.parents(".want-num").attr('data-relate'));
        var unit_num=parseFloat($this.parents("li").find('.number').text());
        var storage=parseFloat($this.parents("li").find('.now-buy').attr("data-storage"));
        var change_num=relate*unit_num*1;
        // if(storage<change_num){
        //     return noticeBox("库存不足啦~~");
        // }
        $this.parents("li").find('.now-buy').attr({"data-storage":storage+change_num});
        if(isNaN(num)){
            noticeBox("别调戏我哦，请输入数字类型");
        }else{
            if(num==1){
                var _this = $(this);
                _this.closest(".want-num").removeClass("w90");
                _this.closest(".want-num").next(".now-buy").removeClass("r70");
                num=0;
                setTimeout(function(){
                    _this.closest(".want-num").hide();
                },200);
                // $("#cart-now-num").addClass("move-cart");
                var cart_now=parseInt($("#cart-now-num").html());
                $("#cart-now-num").html(cart_now-1);
                SetCookie("cart_count",cart_now-1);
                num_list[id]=num;
                fruits_num();
                return false;
            }
            num--;
            $(this).next(".input").text(num);
        }
        num_list[id]=num;
        fruits_num();
    });

    var cart_fs=window.dataObj.cart_fs;
    cartNum(cart_fs);
    for(var key in cart_fs) {
        num_list[cart_fs[key][0]]=cart_fs[key][1];
    }
    var __n=0;
    window.onbeforeunload = function(){
        if(__n==0){
            setTimeout(function(){addCart(_url);SetCookie("fromdetail",1);__n=1}, 2);
        }
        
    }
}).on("click","#dianzan",function(){
    var $this = $(this);
    if($this.attr("data-flag")=="True"){
        return noticeBox("您今天已经点过赞了，明天再来吧");
    }else{
        var id = $this.attr("data-id");
        great(id,$this);
    }
}).on('click','.add-cart',function(){
    var link=$(this).attr('data-href');
    SetCookie("fromdetail","")
    addCart(link);
}).on("click",".seckill-buy",function(){
    if($(this).hasClass("seckill-buy-yes")){
        return false;
    }
    var buy_limit=parseInt($(".wrap-goods-detail").attr("data-buylimit"));
    var user_limit=parseInt($(".wrap-goods-detail").attr("data-userlimit"));
    if(buy_limit!=user_limit&&buy_limit!=0){
        if(buy_limit==1){
            return noticeBox("该商品仅限新用户购买");
        }else if(buy_limit==2){
            return noticeBox("该商品仅限老用户购买");
        }else if(buy_limit==3){
            return noticeBox("该商品仅限充值用户购买");
        }
    }
    var id = $(this).closest("li").attr("data-id");
    var s_goods_id =  $(this).closest("li").attr("seckill_goods_id");
    num_list[id]=1;
    $(this).addClass("seckill-buy-yes");
    var cart_now=parseInt($("#cart-now-num").html());
    $("#cart-now-num").html(cart_now+1);
    seckill_goods_ids.push(s_goods_id);
    noticeBox("已添加到购物篮，请在秒杀结束前支付，否则会恢复原价哦！");
});
//点赞
function great(id,$this){
    var shop_code = $("#shop_code").val();
    var url='/'+shop_code;
    var action=3;
    var args={
        action:action,
        charge_type_id:id
    };
    $.postJson(url,args,function(res){
            if(res.success){
                $this.attr("data-flag","True").find(".zan").addClass("zaned");
                $this.attr("data-flag","True").find(".num").html(parseInt($this.find(".num").html())+1);
            }
            if(res.notice)
            {
                noticeBox(res.notice);
            }
            else noticeBox(res.error_text);
        }
    );
}

function addCart(link){
    var shop_code = $("#shop_code").val();
    var url='/'+shop_code;
    var action = 4;
    fruits_num();
    var fruits=num_list;
    var args={
        action:action,
        fruits:fruits,
        seckill_goods_ids:seckill_goods_ids
    };
    if(!isEmptyObj(fruits)){fruits={}}
    $.postJson(url,args,function(res){
            if(res.success){
                if(link){
                    SetCookie('cart_count', $("#cart-now-num").html());
                    window.location.href=link;
                }
            }
            else return noticeBox(res.error_text);
        }
    );
}

function cartNum(cart_ms){
    for(var key in cart_ms) {
        var item=$('.want-num');
        for(var j=0;j<item.length;j++){
            var charge = item.eq(j);
            var id = charge.data('id');
            if (id == cart_ms[key][0]) {
                    $(".now-buy").eq(j).addClass("r70");
                    $(".now-buy").eq(j).prev(".want-num").show().addClass("w90");
                    charge.find('.input').text(cart_ms[key][1]);
               // charge.siblings('.now-buy').hide();
            }
        }
    }
}

function fruits_num(){
    for(var key in num_list){
    if(num_list[key]==0){delete num_list[key];}
    }
}
function countTime($obj){
    var time_end = parseInt($obj.attr("end_time"))*1000;
    var time_now = new Date().getTime();
    var time_distance = time_end - time_now;  // 结束时间减去当前时间
    var int_day, int_hour, int_minute, int_second;
    if(time_distance >= 0){
        // 天时分秒换算
        int_day = Math.floor(time_distance/86400000)
        time_distance -= int_day * 86400000;
        int_hour = Math.floor(time_distance/3600000)
        time_distance -= int_hour * 3600000;
        int_minute = Math.floor(time_distance/60000)
        time_distance -= int_minute * 60000;
        int_second = Math.floor(time_distance/1000)
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
        setTimeout(function(){
            countTime($obj);
        },1000);
    }else{
        //noticeBox("结束了");
    }
}
