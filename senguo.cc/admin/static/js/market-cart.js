var activity_type = 0;
var _price_list=[];
var _total_price=0;
var _freigh_ontime=0;
var _freigh_now=0;
var _mincharge_intime=0;
var _mincharge_now=0;
var is_inarea = 1;
$(document).ready(function(){
    $(".fix-title").addClass("hidden");
    if(getCookie("mAddress")){
        removeCookie("mAddress");
        window.location.reload(true);
        return false;
    }
    var shop_code=$('#shop_imgurl').attr('data-code');
    SetCookie('market_shop_code',shop_code);
    //配送费
    _freigh_ontime=parseInt($('#shop_imgurl').attr("data-ontime-money"));
    _freigh_now=parseInt($('#shop_imgurl').attr("data-now-money"));
    //最低起送
    _mincharge_intime=parseInt($('#shop_imgurl').attr("data-ontime-min"));
    _mincharge_now=parseInt($('#shop_imgurl').attr("data-now-min"));
    //页面1
    if(!$.getUrlParam("type") || $.getUrlParam("type")=="1"){
        $(".bg1").removeClass("hidden");
        $(".bg2").addClass("hidden");
    }else{
        $(".bg1").addClass("hidden");
        $(".bg2").removeClass("hidden");
    }
    //送货方式
    initType();
    //价格
    getPrice();
    //商品数量操作
    $(document).on('click','.cart-list-item .number-minus',function(){
        var $this=$(this);
        pulse($this);
        goodsNum($this,1);
    });
    $(document).on('click','.cart-list-item .number-plus',function(){
        var $this=$(this);
        pulse($this);
        goodsNum($this,2);
    });
    //商品删除
    $(document).on('click','.cart-list-item .delete-item',function(){
        var $this=$(this);
        pulse($this);
        var parent=$this.parents('.cart-list-item');
        var index=parent.index();
        var type;
        if(parent.hasClass('fruit_item')){type=0}
        else if(parent.hasClass('menu_item')){type=1}
        activity_type = $(this).attr("activity_type");
        confirmBox('确认删除该商品吗？//(ㄒoㄒ)//',index,type);
    });
    $(document).on('click','.confriming',function(){
        var $this=$(this);
        var $item=$this.parents('#confirmBox').find('.message');
        var result=$this.attr('data-status');
        var index=$item.attr('data-index');
        var type=$item.attr('data-type');
        if(result=='true'){
            if(type==0) {
                $('.cart-list-item').eq(index).addClass('anim-lightSpeedOut');
                setTimeout(function(){itemDelete($('.cart-list-item').eq(index),0);},300);
            }
            else if(type==1) {
                $('.cart-list-item').eq(index).addClass('anim-lightSpeedOut');
                setTimeout(function(){itemDelete($('.cart-list-item').eq(index),1);},300);
            }
        }
        confirmRemove();
    });
    //手机绑定验证
    $(document).on('click','.un_tie',function(){
        noticeBox('您还未绑定手机号，点击下方手机绑定按钮进行绑定');
    });
    //手机验证
    $(document).on('click','#phoneNumber',function(){
        var tie_box=new Modal('tieBox');
         tie_box.modal('show');
    });
    $(document).on('click','#getVrify',function(evt){
        evt.preventDefault();
        var phone=$('#enterPhone').val();
        var regPhone=/^(1)\d{10}$/;
        if(phone.length > 11|| phone.length<11 || !regPhone.test(phone)){return warnNotice("手机号貌似有错o(╯□╰)o");}
        if(!phone){return warnNotice('手机号不能为空');}
        $('#getVrify').attr({'disabled':true});
        Vrify(phone);
    });
    $(document).on('click','#tiePhone',function(evt){TiePhone(evt);});
    //订单提交
    $(document).on('click','#submitOrder',function(){
        var $this=$(this);
        orderSubmit($this);
    });
    var shop_status=parseInt($('#shop_imgurl').attr('data-status'));
    if(shop_status != 1){
        $('.pay_type .item').removeClass('active').removeClass('item').addClass('not_available').removeClass('available');
        $('#submitOrder').attr('disabled',true).removeClass('bg-green').text('暂不可下单');
        $("#go_next").attr("data-flag","0").html("暂不可下单");
    }
     if(shop_status==2){
        $('#submitOrder').text('店铺正在筹备中');
     }else if(shop_status==3){
        $('#submitOrder').text('店铺正在休息');
     }else if(shop_status==0){
        $('#submitOrder').text('店铺已关闭');
     }
    $(".images").each(function(){
        $(this).css("height",($(".fruits-lst").width()/5-8)+"px");
    });
    var now_time = new Date().getTime();
    var range_time = parseInt($("#shop_imgurl").attr("data-stop-range"))*60000;//按时达截至时间
    var self_time = parseInt($("#shop_imgurl").attr("data-self-endtime"))*60000;//按时达截至时间
    $(".today_time").each(function(){
        var end_time = parseInt($(this).attr("end-time"));
        var start_time = parseInt($(this).attr("start-time"));
        if($(this).hasClass("ontime_time")){
            end_time = start_time-range_time;
        }else{
            end_time = end_time-self_time;
        }
        if(now_time>end_time){
            $(this).remove();
        }
    });
    if($("#deli_shop").children().size()==0){
        $("#deli_shop").addClass("hidden");
        $(".i-more-ontime").addClass("hidden");
        $(".shop-deli").addClass("hidden");
        $(".ontime_text").removeClass("hidden");
    }
    if($("#deli_self").children().size()==0){
        $("#deli_self").addClass("hidden");
        $(".i-more-self").addClass("hidden");
        $(".self_text").removeClass("hidden");
    }
    initPayType();//初始化支付方式
    isInArea();
}).on('click','.a-cz',function(){
    var status = $(this).attr('data-status');
    var statu = $(this).attr("data-auth");
    if(statu == "False"){
        noticeBox("当前店铺未认证，此功能暂不可用");
        return false;
    }
    if(status==0){
        noticeBox("当前店铺已关闭余额支付，此功能暂不可用");
        return false;
    }
    window.location.href=$(this).attr("url");
}).on("click",".online-lsts li",function(){   //选择在线支付方式
    $(".online-lsts").find(".checkbox-btn").removeClass("checkboxed");
    $("#online_pay").attr("data-type",$(this).attr("data-type"));
    pulse($(this));
    $(this).children("a").addClass("checkboxed");
}).on("click",".coupon_type li",function(){//优惠券
    var index = $(this).index();
    pulse($(this));
    if($(this).hasClass("active")){
        $(this).removeClass("active");
        $(this).children("a").removeClass("checkboxed");
        $("#sureCoupon").attr("data-coupon","0");
    }else{
        $(".coupon_type").find(".checkbox-btn").removeClass("checkboxed");
        $(".coupon_type li").removeClass("active").eq(index).addClass("active");
        $(this).children("a").addClass("checkboxed");
        var money = parseFloat($(this).children('.coupon-bg').attr("data-money"));
        $("#sureCoupon").attr("data-coupon",money);
    }
}).on("click",".coupon-cart-box",function(){
    var coupon_box=new Modal('couponBox');
    coupon_box.modal('show');
}).on("click","#sureCoupon",function(){
    var cmoney = parseFloat($(this).attr("data-coupon"));
    if(cmoney==0){
        $(".coupon-stats").html("未使用");
        $("#coupon_cmoney").html(0);
        $("#total_price").html(mathFloat($("#final_price").html()));
    }else{
        $(".coupon-stats").html("已使用");
        $("#coupon_cmoney").html(cmoney);
        var last_money = parseFloat($("#final_price").html());
        var smoney = 0;
        if(cmoney>=last_money){
            smoney = 0;
        }else{
            smoney = parseFloat(last_money - cmoney).toFixed(2);
        }
        $("#total_price").html(mathFloat(smoney));
    }
    var coupon_box=new Modal('couponBox');
    coupon_box.modal('hide');
}).on("click","#go_next",function(){
    if($(this).attr("data-flag")=="0"){
        return noticeBox("该店铺未正常营业，请过些时日再来吧！");
    }
    history.replaceState({cart:1},"提交订单","/customer/cart/"+$("#shop_imgurl").attr("data-code")+"?type=2")
    $(".bg1").addClass("hidden");
    $(".bg2").removeClass("hidden");
}).on("click",".return-btn,#go_fruits",function(){
    history.replaceState({cart:1},"提交订单","/customer/cart/"+$("#shop_imgurl").attr("data-code")+"?type=1")
    $(".bg2").addClass("hidden");
    $(".bg1").removeClass("hidden");
}).on("click",".pay_type_list li",function(){
    var index = $(this).index();
    var auth = $(this).attr("data-auth");
    var status = $(this).attr("data-status");
    if(auth=="False"){
        noticeBox("该店铺未认证，该功能不能使用");
        return false;
    }
    if(status=="0"){
        noticeBox("该支付方式已关闭，请选择别的支付方式");
        return false;
    }
    $(".pay_type_list li").removeClass("active").eq(index).addClass("active");
    $("#online_pay>div").addClass("hidden").eq(index).removeClass("hidden");
}).on("click",".address-box",function(){
    SetCookie("mAddress","1");
    window.location.href="/customer/address";
}).on("click",".bili_type li",function(){
    if($(".bili_type li").size()==1){
        return false;
    }
    var index = $(this).index();
    var status = $(this).attr("data-status");
    if(status=="False"){
        noticeBox("该配送已关闭，请选择别的配送方式");
        return false;
    }
    if(index==0){
        $(".red-tip-txt").addClass("hidden");
        $(".deli2").addClass("hidden");
        $(".deli1").removeClass("hidden");
    }else if(index==1){
        $(".red-tip-txt").removeClass("hidden");
        $(".deli1").addClass("hidden");
        $(".deli2").removeClass("hidden");
        $("#deli_self").attr("data-id",$("#deli_self option").first().attr("data-id")).attr("data-time",$("#deli_self option").first().attr("data-time"));
        $("#deli_self_address").attr("data-id",$("#deli_self_address option").first().attr("data-id"));
    }
    $(".bili_type li").removeClass("active").eq(index).addClass("active");
    calDeli();
}).on("change","#deli_shop",function(){
    var option_item = $("#deli_shop option").not(function(){ return !this.selected });
    var type = parseInt(option_item.attr("data-type"));
    var type_id = option_item.attr("data-id");
    var time = option_item.attr("data-time");
    if(type==0){
        $("#deli_shop").attr("data-type","0").attr("data-id",type_id).attr("data-time",time);
    }else{
        $("#deli_shop").attr("data-type","1").attr("data-id",type_id).attr("data-time",time);
    }
    calDeli();
}).on("change","#deli_self",function(){
    var option_item = $("#deli_self option").not(function(){ return !this.selected });
    $(this).attr("data-id",option_item.attr("data-id")).attr("data-id",option_item.attr("data-time"));
}).on("change","#deli_self_address",function(){
    var option_item = $("#deli_self_address option").not(function(){ return !this.selected });
    $(this).attr("data-id",option_item.attr("data-id"));
}).on("click","#sureArea",function(){
    is_inarea = 1;
    var area_box=new Modal('areaBox');
    area_box.modal('hide');
    orderSubmit($("#submitOrder"));
});
//初始化支付方式
function initPayType(){
    var auth = $("#shop_imgurl").attr("data-auth");
    if(auth=="False"){
        $(".pay_type_list li").removeClass("active").eq(2).addClass("active");
        $("#online_pay>div").addClass("hidden").eq(2).removeClass("hidden");
    }
    var $first_item =  $(".pay_type_list li").eq(0);
    var $second_item =  $(".pay_type_list li").eq(1);
    if(parseInt($first_item.attr("data-status"))==0 && parseInt($second_item.attr("data-status"))==1){
        $(".wrap-online-lst").addClass("hidden");
        $(".wrap-balance-box").removeClass("hidden");
        $(".pay_type_list li").removeClass("active").eq(1).addClass("active");
    }else if(parseInt($first_item.attr("data-status"))==0 && parseInt($second_item.attr("data-status"))==0){
        if(parseInt($(".pay_type_list li").eq(2).attr("data-status"))==1){
            $(".pay_type_list li").removeClass("active").eq(2).addClass("active");
            $("#online_pay>div").addClass("hidden").eq(2).removeClass("hidden");
        }else{
            $(".pay_type_list li").removeClass("active");
            $("#online_pay>div").addClass("hidden");
        }
    }
}
//初始化配送方式
function initType(){
    if($(".bili_type li").first().attr("data-status")=="True"){
        if($("#now_on_time").size()>0){//立即送
            $("#deli_shop").attr("data-type","0").attr("data-id","0").attr("data-time","0");
        }else{
            $("#deli_shop").attr("data-type","1").attr("data-id",$("#deli_shop option").first().attr("data-id")).attr("data-time",$("#deli_shop option").first().attr("data-time"));
        }
    }
}
//配送费选择
function calDeli(){
    var freight = 0;
    var min_charge = 0;
    var total_price = mathFloat($('#list_total_price').html());
    //判断配送费方式
    if($(".bili_type").children(".active").index()==0){
        if($("#deli_shop").attr("data-type")=="0"){
            freight = _freigh_now;
            min_charge = _mincharge_now;
        }else{
            freight = _freigh_ontime;
            min_charge = _mincharge_intime;
        }
    }else{
        freight = 0;
        min_charge = 0;
    }
    if(total_price>min_charge){
        $(".shop-deli").addClass("hidden");
    }else{
        $("#min_charge").html(min_charge);
        if(min_charge>0){
            $(".shop-deli").removeClass("hidden");
        }
    }
    $("#freight_money").html(freight);
    $('.final_price').html(mathFloat(total_price+freight));
}
//每种商品小计
var getPrice=function(){
    _price_list=[];
    var freight = 0;
    var min_charge = 0;
    //判断配送费方式
    if($(".bili_type").children(".active").index()==0){
        if($("#deli_shop").attr("data-type")=="0"){
            freight = _freigh_now;
            min_charge = _mincharge_now;
        }else{
            freight = _freigh_ontime;
            min_charge = _mincharge_intime;
        }
    }else{
        freight = 0;
        min_charge = 0;
    }
    var $list_total_price=$('#list_total_price');
    var $final_price=$('.final_price');
    $('.item_total_price').each(function(){
        var $this=$(this);
        var parent=$this.parents('.cart-list-item');
        if (parent.find('.status-seckill').size() != 0){
            var num = 1;
        }
        else{
            var num=parent.find('.item_number').val();
        }
        var price=parent.find('.item_price').text();
        var total=mathFloat(num*price);
        $this.text(total);
        _price_list.push(total);
    });
    //商品价格总计
    $("#freight_money").html(freight);
    _total_price=mathFloat(totalPrice(_price_list));
    $list_total_price.text(_total_price);
    $(".fruits_price").text(_total_price);
    if(_total_price>min_charge){
        $(".shop-deli").addClass("hidden");
    }else{
        $("#min_charge").html(min_charge);
        $(".shop-deli").removeClass("hidden");
    }
    $final_price.text(mathFloat(_total_price+freight));
}
function totalPrice(target){
    _total_price=0;
    for(var i=0;i<target.length;i++){
        _total_price+=parseFloat(target[i]);
    }
    return _total_price;
}

function goodsNum(target,action){
    var url='/cart';
    var action=action;
    var menu_type;
    var parent=target.parents('.cart-list-item');
    var charge_type_id=parent.find('.charge-type').data('id');
    var price=parent.find('.item_price').text();
    var item_price=target.parents('.cart-list').find('.item_total_price');
    var item=target.siblings('.number-input');
    var num=parseInt(item.val());
    var limit_num=parseInt(parent.attr('data-limit'));
    var total;
    var $list_total_price=$('#list_total_price');
    if(action==1&&num<=0) {num=0;target.addClass('disable');}
    var args={
        action:action,
        charge_type_id:charge_type_id
    };
    if(action==2){
        if(limit_num>0&&num==limit_num){
            return  noticeBox('商品限购数量'+limit_num);
        }
    }
    $.postJson(url,args,function(res){
            if(res.success)
            {
                var type;
                if($(".send-now").hasClass("active")){
                    type=1;
                }else{
                    type=$('#sendType').find('.active').data('id');
                }
                if(action==2){
                    num++;
                    item.val(num);
                    total=mathFloat(num*price);
                    getPrice();
                    parent.find('.item_total_price').text(total);
                    var t_price=mathFloat($list_total_price.text());
                    mincharge(type,t_price);
                }
                else if(action==1)
                {
                    var val=parseInt(item.val());
                    if(val>=0)
                    {
                        if(val==1){
                            var cart_n=Int($('.cart_num').text());
                            if(cart_n>1){
                                wobble($('.cart_num'));
                                $('.cart_num').text(cart_n-1);
                                SetCookie('cart_count',cart_n-1);
                                parent.remove();
                            }
                            else{
                                $('.cart_num').text(0).addClass('hidden');
                                SetCookie('cart_count',0);
                                parent.remove();
                            }
                        }
                        num--;
                        item.val(num);
                        total=mathFloat(num*price);
                        parent.find('.item_total_price').text(total);
                        getPrice();
                        var t_price=mathFloat($list_total_price.text());
                        mincharge(type,t_price);
                    }
                }
                if($('.cart-list-item').length==0) window.location.reload();
            }
            else return noticeBox(res.error_text);
        },
        function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')})
}
//判断起送价
function mincharge(n,price){
    if(n==2){
        if(price<_mincharge_intime){
            $('.mincharge_intime').removeClass("hidden");
            $('.mincharge_now').addClass("hidden");
        }
        else $('.mincharge_intime').addClass("hidden");
    }
    if(n==1){
        if(price<_mincharge_now){
            $('.mincharge_now').removeClass("hidden");
            $('.mincharge_intime').addClass("hidden");
        }
        else $('.mincharge_now').addClass("hidden");
    }
}
//删除商品
function itemDelete(target,menu_type) {
    var $list_total_price=$('#list_total_price');
    var url = '/cart';
    var action = 0;
    var charge_type_id =target.find('.charge-type').data('id');
    var price=target.find('.item_total_price').text();
    var t_price=parseFloat($list_total_price.text());
    var args = {
        action: action,
        charge_type_id: charge_type_id,
        menu_type: menu_type,
        activity_type:activity_type
    };
    $.postJson(url, args, function (res) {
            if (res.success) {
                target.remove();
                t_price-=parseFloat(price);
                $list_total_price.text(t_price);
                $(".fruits_price").text(t_price);
                var type=$('#sendType').find('.active').data('id');
                getPrice();
                mincharge(type,t_price);  
                var cart_n=Int($('.cart_num').text());
                if(cart_n>0){
                    wobble($('.cart_num'));
                    $('.cart_num').text(cart_n-1);
                    SetCookie('cart_count',cart_n-1);
                }
                if($('.cart-list').find('.cart-list-item').length==0) window.location.reload();
            }
            else return noticeBox(res.error_text);
        },
        function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')});
}
//订单提交
function orderSubmit(target){
    if(is_inarea==0){
        var area_box=new Modal('areaBox');
        area_box.modal('show');
        return false;
    }
    if($('#submitOrder').attr("disabled")=="true"){
        return false;
    }
    var url='';
    var fruits={};
    var mgoods={};
    var discount_ids=[];
    var online_type = "";
    var period_id = "";
    var self_address_id = "";
    var type = 0;
    var today = 0;
    if($(".bili_type").children(".active").index()==0){
        type = parseInt($("#deli_shop").attr("data-type"))+1;
    }else{
        type = 3;
    }
    if(type==2){
        today=$("#deli_shop").attr("data-time");
        period_id=$("#deli_shop").attr('data-id');
    }
    if(type==3){
        today=$("#deli_self").attr("data-time");
        period_id=$('#deli_self').attr('data-id');
        self_address_id=$('#deli_self_address').attr('data-id');
    }
    var address_id=$('.address-box').attr('data-id');
    var pay_type=$('.pay_type_list').find('.active').attr('data-id');
    var message=$('#messageCon').val();
    var coupon_key=$(".coupon_type").find(".active").attr("data-id");
    if (coupon_key==undefined){
        coupon_key=null;
    }
    if(pay_type == 3){
        online_type = $("#online_pay").attr("data-type");
    }
    if(!pay_type){return noticeBox('请选择支付方式',target);}
    if(!today){today=1;}
    discount_ids=[];
    var fruit_item=$('.fruit_item');
    for(var i=0;i<fruit_item.length;i++){
        var id=fruit_item.eq(i).find('.charge-type').data('id');
        if (fruit_item.eq(i).find('.status-seckill').size() != 0){
            var num = 1;
        }
        else{
            var num=fruit_item.eq(i).find('.number-input').val();
        }
        fruits[id]=parseInt(num);
        if(fruit_item.eq(i).find(".status-discount").size()>0){//有折扣
            discount_ids.push(id);
        }
    }
    if(!message) message='';
    if(type==2) {
        if(_total_price<_mincharge_intime) return noticeBox('您的订单未达到按时达最低起送金额！',target);
        if(!period_id) return noticeBox('请选择送货时段！',target);
    }
    if(type==1){
        period_id=0;
        if(_total_price<_mincharge_now) return noticeBox('您的订单未达到立即送最低起送金额！',target);
    }
    if(type==3){
        if(!period_id) return noticeBox('请选择自提时间段！',target);
        if(!self_address_id) return noticeBox('请选择自提地址！',target);
    }
    if(!type){return noticeBox('请选择送货时段！',target);}
    $('#submitOrder').addClass('bg-grey text-grey3').text('提交中...').attr({'disabled':'true'});
    var args={
        fruits:fruits,
        coupon_key:coupon_key,
        mgoods:mgoods,
        type:type,
        today:today,
        period_id:period_id,
        self_address_id:self_address_id,
        address_id:address_id,
        pay_type:pay_type,
        message:message,
        online_type:online_type,
        discount_ids:discount_ids
    };
    $.postJson(url,args,function(res) {
        if (res.success) {
            var overdue = res.overdue;
            if (overdue == 1){
                //重定向刷新购物车页面,并给出'当前购物车有参加活动的商品已经过期！'的提示
                noticeBox("您的购物车有商品已过期~~");
                setTimeout(function(){
                    window.location.reload(true);
                },1200);
                return false;
            }
            if(res.notice){
                noticeBox(res.notice);
            }
            SetCookie('cart_count',0);
            var url='/customer/cartback';
            var args={order_id:res.order_id};
            $.postJson(url,args,function(data) {
                if (data.success) {
                    if(pay_type==3){
                        window.location.href=res.success_url;
                        //window.location.href="/customer/orders/detail/"+res.order_id;
                    }else{
                        window.location.href=window.dataObj.success_href; 
                    }
                }
                else{
                    $('#submitOrder').removeClass('bg-grey text-grey3').text('提交订单').removeAttr('disabled'); 
                    return noticeBox(res.error_text);
                }
            });
        }else {
            noticeBox(res.error_text,target);
            $('#submitOrder').removeClass('bg-grey text-grey3').text('提交订单').removeAttr('disabled');  
        }
    },
    function(){noticeBox('网络好像不给力呢~ ( >O< ) ~')},
    function(){noticeBox('服务器貌似出错了~ ( >O< ) ~')});
}
//获取用户是否在店铺配送区域
function isInArea(){
    var url = "/customer/"+$("#shop_imgurl").attr("data-code");
    var args = {
        action:"in_area",
        data:{
            address_id:$(".address-box").attr("data-id")
        }
    };
    $.postJson(url,args,function(res){
        if(res.success){
            is_inarea = res.in_area;
        }
    });
}
//获取手机验证码倒计时
var wait=60;
function time(evt) {
    if (wait == 0) {
        evt.val("获取验证码").css({'background':'#00d681'});
        wait = 60;
        $('.get-code').attr({'id':'getVrify'});
    }
    else {
        evt.val("重新发送(" + wait + ")").css({'background':'#ccc'});
        wait--;
        $('.get-code').attr({'id':''});
        setTimeout(function() {
                time(evt)
            },
            1000);
    }
}
//获取手机验证码
function Vrify(phone){
    var action='gencode';
    var url="/customer/phoneVerify?action=customer";
    var args={
        action:action,
        phone:phone
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                time($('#getVrify'));
                noticeBox('验证码已发送到您的手机，请注意查收！');
                $('#submitOrder').removeAttr('disabled').removeClass("un_tie").removeClass("bg-greyc");
            }
            else return noticeBox(res.error_text);
        },
        function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~');},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~');}
    );
}
//手机绑定
function TiePhone(evt){
    evt.preventDefault();
    var phone=$('#enterPhone').val();
    var code=$('#enterVrify').val();
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    var regPhone=/^(1)\d{10}$/;
    if(phone.length > 11 || phone.length<11 || !regPhone.test(phone)){return warnNotice("手机号貌似有错o(╯□╰)o");}
    if(!phone){return warnNotice('请输入手机号');}
    if(!code){return warnNotice('请输入验证码');}
    if(!regNumber.test(code)){return warnNotice('验证码只能为数字');}
    if(code.length>4||code.length<4){return warnNotice('验证码为4位数字');}
    var url="/customer/phoneVerify?action=customer";
    var action='checkcode';
    var args={action:action,phone:phone,code:code};
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                var tie_box=new Modal('tieBox');
                tie_box.modal('hide');
                $('.first_notice').remove();
                $("#submitOrder").removeAttr("disabled")
            }
            else noticeBox(res.error_text);
        },
        function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~');},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~');}
    );
}
