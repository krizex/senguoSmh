/**
 * Created by Administrator on 2015/5/27.
 */
 var num_list={};
$(document).ready(function(){
    var mWidth = $(window).width();
    var width = $("#swiper-container").width();
    if(mWidth>800){
        $("#shop-area").css("left",(mWidth-width)/2+12+"px");
        $("#cart-bg").css("left",((mWidth-width)/2+width-45)+"px");
        $("#back-bg").css("left",(mWidth-width)/2+12+"px");
    }
    $("body").css("backgroundColor","#fff");
    $(".phone-box").css("paddingBottom","20px").css("backgroundColor","#fff");
    $(".swiper-wrapper").width(width*$(".swiper-slide").size());
    new Swiper('#swiper-container',{
        mode: 'horizontal',
        loop:true,
        grabCursor: true,
        pagination: '.pagination',
        autoplay:"3000",
        autoplayDisableOnInteraction:false
    });
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
        var num = parseInt($this.prev("input").val());
        var relate=parseFloat($this.parents(".want-num").attr('data-relate'));
        var unit_num=parseFloat($this.parents("li").find('.number').text());
        var storage=parseFloat($this.parents("li").find('.now-buy').attr("data-storage"));
        var limit_num=parseInt($this.parents(".wrap-goods-detail").attr('data-limit'));
        var change_num=relate*unit_num*num;
        var buy_today=$this.parents('li').attr('data-buy');
        var allow_num=parseInt($this.parents('li').attr('data-allow'));
        if(buy_today=='True'&&num>=allow_num){
            return noticeBox('您该商品的限购数量已达上限啦！┑(￣▽ ￣)┍ ');
        }
        if(storage<change_num){
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
            $(this).prev("input").val(num);
            num_list[id]=num;
            fruits_num();
        }
       
    });
    $(".minus-num").on("click",function(){
        var $this=$(this);
        var id=parseInt($this.parents(".want-num").attr('data-id'));
        var num = parseInt($(this).next("input").val());
        var relate=parseFloat($this.parents(".want-num").attr('data-relate'));
        var unit_num=parseFloat($this.parents("li").find('.number').text());
        var storage=parseFloat($this.parents("li").find('.now-buy').attr("data-storage"));
        var change_num=relate*unit_num*num;
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
            $(this).next("input").val(num);
        }
        num_list[id]=num;
        fruits_num();
    });

    var cart_fs=window.dataObj.cart_fs;
    cartNum(cart_fs);
    for(var key in cart_fs) {
        num_list[cart_fs[key][0]]=cart_fs[key][1];
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
    var link=$(this).attr('href');
    addCart(link);
}).on("click",".back",function(){
    window.history.go(-1);
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
                $this.attr("data-flag","True").addClass("zaned").html(parseInt($this.html())+1);
            }
            else noticeBox(res.error_text);
        },
        function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
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
        fruits:fruits
    };
    if(!isEmptyObj(fruits)){fruits={}}
    $.postJson(url,args,function(res){
            if(res.success)
            {
                window.location.href=link;
            }
            else return noticeBox(res.error_text);
        },
         function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
         function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
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
                    charge.find('input').val(cart_ms[key][1]);
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
