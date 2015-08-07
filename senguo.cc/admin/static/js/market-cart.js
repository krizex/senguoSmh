$(document).ready(function(){
    var shop_code=$('#shop_imgurl').attr('data-code');
    SetCookie('market_shop_code',shop_code);
    var $list_total_price=$('#list_total_price');
    var $receiveAdd=$('#receiveAdd');
    var $receiveEdit=$('#receiveEdit');
    var $addressBox=$('.address-box');
    var $receiveName=$('#receiveName');
    var $receiveAddress=$('#receiveAddress');
    var $receivePhone=$('#receivePhone');
    //运费默认值
    if(!_freigh_ontime) _freigh_ontime=0;
    if(!_freigh_now) window.dataObj.freigh_now=0;
    $('.address_list .item').eq(0).addClass('active');
    $('.self-address-list .item').eq(0).addClass('active');
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
    //收货地址添加
    var max=$('.address_list .item').length;
    if(max==0){
        $addressBox.removeClass('hidden');
        $('.to-add-address').addClass('hidden');
    }
    $('#receiveCancel').on('click',function(){
        $addressBox.addClass('hidden');
    });
    $('body').on('click','.to-add-address',function(){
        var $this=$(this);
        if(max<5) {
            $addressBox.toggleClass('hidden');
            $receiveAdd.show();
            $receiveEdit.addClass('hidden');
            $receiveName.val('');
            $receiveAddress.val('');
            $receivePhone.val('');
        }
        else return noticeBox('最多能添加五个收获地址！',$this);
    });
    $(document).on('click','#receiveAdd',function(){
        var $this=$(this);
        var name=$receiveName.val();
        var address=$receiveAddress.val();
        var phone=$receivePhone.val();
        if(max<5) addressAddEdit('add_address',name,address,phone,$this);
        else return noticeBox('最多能添加五个收获地址！',$this);
    });

    //收货地址编辑
    $('body').on('click','.to-edit-address',function(){
        $addressBox.removeClass('hidden');
        $receiveAdd.hide();
        $receiveEdit.removeClass('hidden');
        var parent=$(this).parents('.item');
        var name=parent.find('.name').text();
        var address=parent.find('.address_con').text();
        var phone=parent.find('.phone').text();
        var id=parent.data('id');
        $addressBox.attr({'data-id':id});
        $receiveName.val(name);
        $receiveAddress.val(address);
        $receivePhone.val(phone);
    });
    $(document).on('click','#receiveEdit',function(){
        var $this=$(this);
        var name=$receiveName.val();
        var address=$receiveAddress.val();
        var phone=$receivePhone.val();
        addressAddEdit('edit_address',name,address,phone,$this);
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
    //
    //period-time
    $('.check-time').each(function(){
        var $this=$(this);
        var time=$this.text();
        $this.text(checkTime(time));
    });
    
    //打赏小费
    $('.tip-list .item').on('click',function(){
        var $this=$(this);
        if($this.hasClass('active')) $this.removeClass('active');
        else $this.addClass('active').siblings('.item').removeClass('active');
    });
    //支付方式选择
    $('.pay_type .item').each(function(){
        var $this=$(this);
        var index = $this.index();
        var status = $this.attr('data-status');
        var statu = $this.attr("data-auth");
        var type = $this.find('.title').text();
        if(status==0){
            $this.removeClass('active').addClass('not_available');
            $('.pay_type .available').first().addClass('active').siblings('.item').removeClass('active');
            if(index==0){
                $(".wrap-online-lst").addClass("hidden");
            }
        }else{
            $this.addClass('available');
        }
        if(statu == "False"){
            $this.removeClass('active').addClass('not_available').removeClass('available');
            if(index==0){
                $(".wrap-online-lst").addClass("hidden");
            }
        }
    });
    $('.pay_type .available').first().addClass('active').siblings('.item').removeClass('active');
    var shop_status=parseInt($('.pay_type').attr('data-shop'));
    if(shop_status != 1){
        $('.pay_type .item').removeClass('active').removeClass('item').addClass('not_available').removeClass('available');
        $('#submitOrder').attr('disabled',true).removeClass('bg-green').text('暂不可下单');
        $(".wrap-online-lst").addClass("hidden");
        $('#sendPerTime').addClass("hidden");
        $('.send_period').addClass('hidden').removeClass('type-choose');
        $('.send_type button').attr('disabled',true).removeClass('item').removeClass('active').find('a').attr('id','');
        $('.send_now').addClass("hidden");
        $('.mincharge').addClass("hidden");
        $('.address_list').removeClass('type-choose').find('li').removeClass('active');
    }
     if(shop_status==2){
        $('#submitOrder').text('店铺正在筹备中');
     }else if(shop_status==3){
        $('#submitOrder').text('店铺正在休息');
     }else if(shop_status==0){
        $('#submitOrder').text('店铺已关闭');
     }

//按时达/立即送模式/自提选择
    var intime_on=$('.send-intime').attr('data-config');
    var now_on=$('.send-now').attr('data-config'); 
    var self_on=parseInt($('.send-self').attr('data-config')); 
    if(now_on!=undefined){
        freightNow();
        $(".send-now").addClass("active");
        $(".send_period").show();
        $(".mincharge-box").addClass("hidden");
        $(".send-intime").addClass("active").next(".item_period").show().siblings(".item_period").hide();
    }else{
        if(intime_on!=undefined){
            freightIntime();
            $(".send-intime").addClass("active").next(".item_period").show().siblings(".item_period").hide();
            $(".mincharge-box").addClass("hidden");
            minIntime();
        }else if(self_on!=undefined){
            $('#freight_money').text(0);
            $('.final_price').text(mathFloat(_total_price));
            $(".send-self").addClass("active").next(".item_period").show().siblings(".item_period").hide();
            $(".mincharge-box").addClass("hidden");
            $(".self-address").removeClass("hidden");
        }
    }
    //根据当前时间选择时间段
    todayChoose();
}).on("click",".send-now",function(){
    if($(".send-now").hasClass("available")){
        $(".send-now").addClass("active");
        $(".ontime-period-choose .available").removeClass("active");
        $(".mincharge-box").addClass("hidden");
        minNow();
        freightNow();
    }else{
        return noticeBox("抱歉，已超过了该送货时间段的下单时间，请选择下一个时间段！");
    }
    
}).on("click",".ontime-period-choose .available",function(){
    $(".send-now").removeClass("active");
    $(".mincharge-box").addClass("hidden");
    minIntime();
    freightIntime();
}).on('click','.type-choose .item',function(){
    var $this=$(this);
    pulse($this);
    $this.addClass('active').siblings().removeClass('active');
}).on("click",".send_type_item",function(){
    var $this=$(this);
    pulse($this);
    var _type=$this.attr("data-type");
    var _status=$this.attr('data-config');
    $this.siblings(".item_period").hide();
    $this.siblings(".send_type_item").removeClass("active");
    $this.addClass("active").next(".item_period").show();
    if(_type == "self"){
        todayChoose();
        $('#freight_money').text(0);
        $('.final_price').text(mathFloat(_total_price));
        $(".mincharge-box").addClass("hidden");
        if($(".send-now").hasClass("available")){
            $(".mincharge-send").text(_mincharge_now);
            $(".freigh_time").text(_freigh_now);
        }else{
            if($(".ontime-period-choose").length>0){
                $(".mincharge-send").text(_mincharge_intime);
                $(".freigh_time").text(_freigh_ontime);
            }
        }
    }else{
        if($(".ontime_send_day .type-tomorrow").hasClass("active")){
            $(".ontime-period-choose .available").first().addClass("active").siblings("li").removeClass("active");
            minIntime();
            freightIntime();
        }else{
             if($(".send-now").hasClass("available")){
                $(".send-now").show().addClass("active");
                minNow();
                freightNow();
                $(".ontime-period-choose .available").removeClass("active");
            }else{
                 if($(".ontime-period-choose").length>0){
                    minIntime();
                    freightIntime();
                 }
               
            }
        }
    }
}).on('click',".period-choose .item",function(){
    var $this=$(this);
    if($this.hasClass('available')){
        pulse($this);
        $this.addClass('active').siblings().removeClass('active');
    }
}).on('click',".type-today",function(){
    var _type=$(".send_type_item.active").attr("data-type"); 
    todayChoose();
    if(_type=="ontime"&&$(".send-now").attr("data-config")!=undefined){
        $(".send-now").show();
    }
}).on('click',".type-tomorrow",function(){
    var _item=$(this).parents(".item_period").find(".period-choose .item");
    _item.each(function(){
        var $this=$(this);
        $this.addClass('available').removeClass('not_available');
    });
    _item.first().addClass('active').siblings().removeClass('active');
    if($(".send-intime").hasClass("active")){
        if(_total_price<_mincharge_now){
            freightIntime();
            $('.mincharge_now').addClass("hidden");
            minIntime();
        }
        $(".mincharge-send").text(_mincharge_intime);
        $(".freigh_time").text(_freigh_ontime);
        $(".send-now").hide();
    }
    if($(this).parents(".send_period").length>0){
        $('#freight_money').text(_freigh_ontime);
        $('.final_price').text(mathFloat(_total_price+_freigh_ontime));
    }
}).on("click",".pay_type .item",function(){
    var index = $(this).index();
    var status = $(this).attr('data-status');
    var type=$(this).find('.title').text();
    var statu = $(this).attr("data-auth");
    if(statu == "False"){
        noticeBox("当前店铺未认证，此功能暂不可用");
        return false;
    }
    if(status==0){
        noticeBox("当前店铺已关闭"+type);
        return false;
    }
    if(index != 0){
        $(".wrap-online-lst").addClass("hidden");
    }else{
         $(".wrap-online-lst").toggleClass("hidden");
    }
    pulse($(this));
    $(".pay_type li").removeClass("active");
    $(this).addClass("active");
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
}).on("click",".online-lsts li",function(){   //选择在线支付方式
    $(".online-lsts").find(".checkbox-btn").removeClass("checkboxed");
    $("#online-pay").attr("data-type",$(this).attr("data-type"));
    pulse($(this));
    $(this).children("a").addClass("checkboxed");
}).on("click",".coupon_type li",function(){//优惠券
    var index = $(this).index();
    pulse($(this));
    if($(this).hasClass("active")){
        $(this).removeClass("active");
        $(this).children("a").removeClass("checkboxed");
        $("#coupon-money").closest('.coupon-text').addClass("hidden");
        $(".coupon_cmoney").addClass("hidden");
        $("#total_price").html($("#final_price").html());
    }else{
        $(".coupon_type").find(".checkbox-btn").removeClass("checkboxed");
        $(".coupon_type li").removeClass("active").eq(index).addClass("active");
        $(this).children("a").addClass("checkboxed");
        var money = parseFloat($(this).children('.coupon-bg').attr("data-money"));
        var last_money = parseFloat($("#final_price").html());
        $("#coupon_cmoney").html(money);
        $("#coupon-money").html(money);
        $("#coupon-money").closest('.coupon-text').removeClass("hidden");
        $(".coupon_cmoney").removeClass("hidden");
        var smoney = 0;
        if(money>=last_money){
            smoney = 0;
        }else{
            smoney = parseFloat(last_money - money).toFixed(2);
        }
        $("#total_price").html(smoney);
    }   
});

_price_list=[];
_total_price=0;
_freigh_ontime=parseInt($('.freigh_time').attr("data-ontime"));
_freigh_now=parseInt($('.freigh_time').attr("data-now"));
_mincharge_intime=parseInt($('.mincharge-send').attr("data-ontime"));
_mincharge_now=parseInt($('.mincharge-send').attr("data-now"));

function minNow(){
    $('#freight_money').text(_freigh_now);
    $('.final_price').text(mathFloat(_total_price+_freigh_now));
    $(".mincharge-send").text(_mincharge_now);
    $(".freigh_time").text(_freigh_now);
}

function freightNow(){
    if(_total_price<_mincharge_now){
        $('.mincharge_now').removeClass("hidden");
    } 
}

function minIntime(){
    $('#freight_money').text(_freigh_ontime);
    $('.final_price').text(mathFloat(_total_price+_freigh_ontime));
    $(".mincharge-send").text(_mincharge_intime);
    $(".freigh_time").text(_freigh_ontime);
}

function freightIntime(){
     if(_total_price<_mincharge_intime){
        $('.mincharge_intime').removeClass("hidden");
    }
}

function todayChoose(){
    var ontime_on=$('.ontime-period-choose').attr('data-config');
    var now_on=$('.send-now').attr('data-config');
    var _type=$(".send_type_item.active").attr("data-type");  
    var _time=new Date();
    var time_now=checkTime(_time.getHours())+':'+checkTime(_time.getMinutes())+':'+checkTime(_time.getSeconds());
    var $send_item=$(".send_type_item.active").next(".item_period").find(".send_day");
    var today=$send_item.find('.active').data('id');
    var stop_range = 0;
    if($send_item.length>0){
        stop_range=Int($send_item.siblings('.stop-range').val().trim());
    }
    
    if(_type=="ontime"){
        if(today==1){
            if(ontime_on!=undefined){
                $send_item.siblings(".period-choose").find(".item").each(function(){
                    var $this=$(this);
                    var intime_startHour=Int($this.find('.time_startHour').val());
                    var intime_startMin=Int($this.find('.time_startMin').val());
                    var time;
                    if(intime_startMin==0){
                        intime_startHour=intime_startHour-1;
                    }
                    if(stop_range<=intime_startMin){
                        time=checkTime(intime_startHour)+':'+checkTime(intime_startMin-stop_range)+':00';
                    }
                   else{
                        n = parseInt(stop_range/60)
                        time=checkTime(intime_startHour-n)+':'+checkTime(60-(stop_range-60*n-intime_startMin))+':00';
                    }
                    if (time < time_now) {$this.removeClass('available').addClass('not_available').removeClass('active');}
                    $this.on('click',function(){
                        if($this.hasClass('available')) {
                            var today_now = $('#sendDay').find('.active').data('id');
                            if (today_now == 1 && time >= time_now) {
                                $this.addClass('active');
                            }
                        }else{
                            noticeBox('抱歉，已超过了该送货时间段的下单时间，请选择下一个时间段！',$this);
                        }
                   });
                });
            }
            if(now_on!=undefined){
                var start_now_time=$(".now_startHour").val();
                var stop_now_time=$(".now_startMin").val();
                var stop_now=parseInt($(".now_stop").val());
                var _time_now;
                var _time_now_real=checkTime(_time.getHours())+':'+checkTime(_time.getMinutes())+':'+checkTime(_time.getSeconds());
                var time_n=parseInt(stop_now/60);
                var lef_minute=stop_now%60;
                if(_time.getMinutes()+lef_minute>=60){
                     _time_now=checkTime(_time.getHours()+time_n+1)+':'+checkTime(_time.getMinutes()+lef_minute-60)+':'+checkTime(_time.getSeconds());
                }else{
                    _time_now=checkTime(_time.getHours()+time_n)+':'+checkTime(_time.getMinutes()+lef_minute)+':'+checkTime(_time.getSeconds());

                }
                if(stop_now_time>_time_now&&_time_now_real>start_now_time){
                    $(".send-now").show().addClass("active").addClass("available");
                    $send_item.siblings(".period-choose").find(".available").removeClass("active");
                    minNow();
                    freightNow();
                }else{
                    var available=$send_item.siblings(".period-choose").find(".available").first();
                    available.addClass('active').siblings().removeClass('active');
                    $(".send-now").removeClass("active").addClass("not_available").removeClass("available");
                    $('.mincharge_now').addClass("hidden");
                    $('.mincharge_intime').addClass("hidden");
                    $(".mincharge-box").addClass("hidden");
                    minIntime();
                    freightIntime();
                } 
            }else{
                $(".send-now").addClass("not_available").removeClass("available");
                var available=$send_item.siblings(".period-choose").find(".available").first();
                available.addClass('active').siblings("li").removeClass('active');
            }
        }else{
            if(today!=undefined){
                $(".send-now").hide();
                $send_item.siblings(".period-choose").find(".item").first().addClass("active").siblings("li").removeClass("active");
                minIntime();
                freightIntime();
            }else{
                if(now_on!=undefined){
                    minNow();
                    freightNow();
                    var start_now_time=$(".now_startHour").val();
                    var stop_now_time=$(".now_startMin").val();
                    var stop_now=parseInt($(".now_stop").val());
                    var _time_now;
                    var _time_now_real=checkTime(_time.getHours())+':'+checkTime(_time.getMinutes())+':'+checkTime(_time.getSeconds());
                    var time_n=parseInt(stop_now/60);
                    var lef_minute=stop_now%60;
                    if(_time.getMinutes()+lef_minute>=60){
                         _time_now=checkTime(_time.getHours()+time_n+1)+':'+checkTime(_time.getMinutes()+lef_minute-60)+':'+checkTime(_time.getSeconds());
                    }else{
                        _time_now=checkTime(_time.getHours()+time_n)+':'+checkTime(_time.getMinutes()+lef_minute)+':'+checkTime(_time.getSeconds());

                    }
                    if(stop_now_time>_time_now&&_time_now_real>start_now_time){
                        $(".send-now").show().addClass("active").addClass("available");
                    }else{
                        $(".send-now").addClass("not_available").removeClass("available").removeClass("active");
                    }
                }else{
                    $(".send-now").addClass("not_available").removeClass("available").removeClass("active");     
                }
            }
        } 
    }else if(_type=="self"){
        if(today==1){
            $send_item.siblings(".period-choose").find(".item").each(function(){
                var $this=$(this);
                var intime_endHour=Int($this.find('.time_endHour').val());
                var intime_endMin=Int($this.find('.time_endMin').val());
                var time;
                var n = parseInt(stop_range/60)
                var lef_minute=stop_range%60;
                if(intime_endMin>lef_minute){
                    time=checkTime(intime_endHour-n)+':'+checkTime(intime_endMin-lef_minute)+':00';
                }else{
                    time=checkTime(intime_endHour-n-1)+':'+checkTime(60-lef_minute+intime_endMin)+':00';
                }
                if (time < time_now) {
                    $this.removeClass('available').addClass('not_available').removeClass('active');
                }
                $this.on('click',function(){
                    if($this.hasClass('available')) {
                        var today_now = $('#sendDay').find('.active').data('id');
                        if (today_now == 1 && time >= time_now) {
                            $this.addClass('active');
                        }
                    }else{
                        noticeBox('抱歉，已超过了该送货时间段的下单时间，请选择下一个时间段！',$this);
                    }
               });
            });
            $(".send-now").removeClass("active");
            var available=$send_item.siblings(".period-choose").find(".available").first();
            available.addClass('active').siblings("li").removeClass('active');
        }else{
            $send_item.siblings(".period-choose").find(".item").first().addClass("active").siblings("li").removeClass("active");
        }
    }
    
}

var getPrice=function(){
    _price_list=[];
    var freight=mathFloat($('#freight_money').text());
    var $list_total_price=$('#list_total_price');
    var $final_price=$('.final_price');
    //商品价格小计
    $('.item_total_price').each(function(){
        var $this=$(this);
        var parent=$this.parents('.cart-list-item');
        var num=parent.find('.item_number').val();
        var price=parent.find('.item_price').text();
        var total=mathFloat(num*price);
        $this.text(total);
        _price_list.push(total);
    });
    //商品价格总计
    _total_price=totalPrice(_price_list);
    $list_total_price.text(mathFloat(_total_price));
    $final_price.text(mathFloat(_total_price)+mathFloat(freight));
}

function totalPrice(target){
    _total_price=0;
    for(var i=0;i<target.length;i++)
    {
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
                if(action==2)
                {
                   
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
        menu_type: menu_type
    };
    $.postJson(url, args, function (res) {
            if (res.success) {
                target.remove();
                t_price-=parseFloat(price);
                $list_total_price.text(t_price);
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
//地址添加修改
function addressAddEdit(action,name,address,phone,target){
    var url='/customer/'+getCookie('market_shop_code');
    var action=action;
    var regPhone=/^(1)\d{10}$/;
    var address_id=$('.address-box').attr('data-id');
    if(name == null){return noticeBox('请输入收货人姓名！',target)}
    if(name.length > 10){return noticeBox('姓名请不要超过10个字！',target)}
    if(address == null){return noticeBox('请输入收货人地址！',target)}
    if(address.length > 50){return noticeBox('地址请不要超过50个字！',target)}
    if(!phone){return noticeBox('请输入收货人电话！',target)}
    //if(!regPhone.test(phone)){return noticeBox('请输入有效的手机号码！',target)}
    var data={
        phone:phone,
        receiver:name,
        address_text:address
    };
    if(action=='edit_address'){data.address_id=address_id}
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            if(action=='add_address'){
                $('.address_list .item').removeClass('active');
                var $item=$('<li data-id="'+res.address_id+'" class="list-group-item clearfix item height50 active"><a href="javascript:;" class="text-grey3 pull-left address"><p class="mt5"><span class="phone pr10">{{address.phone}}</span> <span class="name">{{address.receiver}}</span></p><p class="address_con pr10 m0 text-grey9">{{address.address_text}}</p></a><a class="text-green pull-right to-edit-address text-center">+编辑</a></li>');
                $item.find('.name').text(name);
                $item.find('.address_con').text(address);
                $item.find('.phone').text(phone);
                $('.address_list').append($item);
                $('.to-add-address').removeClass('hidden');
                $('.address-box').addClass('hidden');
            }
            if(action=='edit_address'){
                var item=$('.address_list').children('.item');
                var item_id;
                var j=0;
                for(j;j<item.length;j++)
                {
                    item_id=item.eq(j).data('id');
                    if(item_id == address_id)
                        {
                            item.eq(j).find('.name').text(name);
                            item.eq(j).find('.address_con').text(address);
                            item.eq(j).find('.phone').text(phone);
                        }

                }
                $('.address-box').addClass('hidden');
            }

        }
        else return noticeBox(res.error_text);
    },
    function(){noticeBox('网络好像不给力呢~ ( >O< ) ~')},
    function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')});
}
//订单提交
function orderSubmit(target){
    if($('#submitOrder').attr("disabled")=="true"){
        return false;
    }
    var url='';
    var fruits={};
    var mgoods={};
    var online_type = "";
    var period_id = "";
    var self_address_id = "";
    var type;
    if($(".send-now").hasClass("active")){
        type=1;
    }else if($(".ontime-period-choose.available.active")){
        type=2;
        var today=$('.ontime_send_day').find('.active').attr('data-id');
        period_id=$('.ontime-period-choose').find('.active').attr('data-id');
    }
    if($(".send-self").hasClass("active")){
        type=3;
        var today=$('.self_send_day').find('.active').data('id');
        period_id=$('.self-period-choose').find('.active').attr('data-id');
        self_address_id=$('.self-address-list').find('.active').attr('data-id');
    }
    var address_id=$('#addressType').find('.active').attr('data-id');
    var pay_type=$('#payType').find('.active').attr('data-id');
    var message=$('#messageCon').val();
    var fruit_item=$('.fruit_item');
    var mincharge_intime=Number($('.mincharge_intime .mincharge').text());
    var mincharge_now=Number($('.mincharge_now .mincharge').text());
    var tip=$('.tip-list').find('.active').data('id');
    var coupon_key=$(".coupon_type").find(".active").attr("data-id");
    if (coupon_key==undefined){
        coupon_key=null;
    }
    if(pay_type == 3){
        online_type = $("#online-pay").attr("data-type");
    }
    _total_price=Number($('#list_total_price').text());
    if(!pay_type){return noticeBox('请选择支付方式',target);}
    if(!today){today=1;}
    if(!address_id){return noticeBox('请填写您的收货地址！',target);}
    if(!tip) tip=0;
    for(var i=0;i<fruit_item.length;i++)
    {
        var id=fruit_item.eq(i).find('.charge-type').data('id');
        var num=fruit_item.eq(i).find('.number-input').val();
        fruits[id]=parseInt(num);
    }
    var menu_item=$('.menu_item');
    for(var i=0;i<menu_item.length;i++)
    {
        var id=menu_item.eq(i).find('.charge-type').data('id');
        var num=menu_item.eq(i).find('.number-input').val();
        mgoods[id]=parseInt(num);
    }
    if(!message) message='';
    if(type==2) {
        if(_total_price<mincharge_intime) return noticeBox('您的订单未达到按时达最低起送金额！',target);
        if(!period_id) return noticeBox('请选择送货时段！',target);
    }
    if(type==1){
        period_id=0;
        if(_total_price<mincharge_now) return noticeBox('您的订单未达到立即送最低起送金额！',target);
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
        tip:tip,
        online_type:online_type
    };
    $.postJson(url,args,function(res) {
        if (res.success) {
            if(res.notice){
                noticeBox(res.notice);
            }
            SetCookie('cart_count',0);
           // window.location.href= '/notice/success'
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
                $('#getVrify').removeAttr('disabled');

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
                $('.un_tie').attr({'id':'submitOrder'}).removeClass('bg-grey99 un_tie').addClass('bg-green');
            }
            else noticeBox(res.error_text);
        },
        function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~');},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~');}
    );
}
