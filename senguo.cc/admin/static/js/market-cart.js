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
    if(!window.dataObj.freigh_ontime) window.dataObj.freigh_ontime=0;
    if(!window.dataObj.freigh_now) window.dataObj.freigh_now=0;
    $('.address_list .item').eq(0).addClass('active');
    window.dataObj.mincharge_now=Int($('.mincharge_now').find('.mincharge').text());
    window.dataObj.mincharge_intime=Int($('.mincharge_intime').find('.mincharge').text());
    //price
    getPrice();
    //按时达最低起送金额提示
    if(window.dataObj.total_price<window.dataObj.mincharge_intime) $('.mincharge_intime').show();
    //商品数量操作
    $(document).on('click','.cart-list-item .number-minus',function(){
        var $this=$(this);
        goodsNum($this,1);
    });
    $(document).on('click','.cart-list-item .number-plus',function(){
        var $this=$(this);
        goodsNum($this,2);
    });
    //商品删除
    $(document).on('click','.cart-list-item .delete-item',function(){
        var $this=$(this);
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
            if(type==0) {itemDelete($('.cart-list-item').eq(index),0);}
            else if(type==1) {itemDelete($('.cart-list-item').eq(index),1);}
            }
        confirmRemove();
    });
    //类型切换增加active
    $(document).on('click','.type-choose .item',function(){
        var $this=$(this);
        $this.addClass('active').siblings().removeClass('active');
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
        else return noticeBox('至多能添加五个收获地址！',$this);
    });
    $(document).on('click','#receiveAdd',function(){
        var $this=$(this);
        var name=$receiveName.val();
        var address=$receiveAddress.val();
        var phone=$receivePhone.val();
        if(max<5) addressAddEdit('add_address',name,address,phone,$this);
        else return noticeBox('至多能添加五个收获地址！',$this);
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
    //tie phone
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
        var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
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
    var time=new Date();
    var time_now=checkTime(time.getHours())+':'+checkTime(time.getMinutes())+':'+checkTime(time.getSeconds());
    //period-time
    $('.check-time').each(function(){
        var $this=$(this);
        var time=$this.text();
        $this.text(checkTime(time));
    });
    //按时达根据当前时间选择时间段
    var stop_range=Int($('.stop-range').val());
    var today=$('#sendDay').find('.active').data('id');
    if(today==1) {
        $('.send_period .item').each(function(){
            var $this=$(this);
            var intime_startHour=Int($this.find('.intime_startHour').val());
            var intime_startMin=Int($this.find('.intime_startMin').val());
            var time;
            if(stop_range<=intime_startMin){
                time=checkTime(intime_startHour)+':'+checkTime(intime_startMin-stop_range)+':00';
            }
            else{
                time=checkTime(intime_startHour-1)+':'+checkTime(60-(stop_range-intime_startMin))+':00';
            }
            if (time < time_now) {
                $this.removeClass('available').addClass('not_available').removeClass('active');
            }
            $('.send_period .available').first().addClass('active');
            $this.on('click',function(){
                if($this.hasClass('available')) {
                    var today_now = $('#sendDay').find('.active').data('id');
                    if (today_now == 1 && time >= time_now) {
                        $this.addClass('active');
                    }
                }
                else if(noticeBox('抱歉，已超过了该送货时间段的下单时间，请选择下一个时间段！',$this)){}
           });
        });}
        $('.send_period .item').on('click',function(){
            var $this=$(this);
            if($this.hasClass('available')) {$this.addClass('active').siblings().removeClass('active')}
        });
    //按时达选择今天
    $('#send_today').on('click',function(){
        $('.send_period .item').each(function(){
            var $this=$(this);
            var intime_startHour=Int($this.find('.intime_startHour').val());
            var intime_startMin=Int($this.find('.intime_startMin').val());
            var time;
            if(stop_range<=intime_startMin){
                time=checkTime(intime_startHour)+':'+checkTime(intime_startMin-stop_range)+':00';
            }
            else{
                time=checkTime(intime_startHour-1)+':'+checkTime(60-(stop_range-intime_startMin))+':00';
            }
            if (time < time_now) {$this.removeClass('available').addClass('not_available').removeClass('active');}
            $('.send_period .available').first().addClass('active').siblings().removeClass('active');
        });
    });
    //按时达选择明天
    $('#send_tomorrow').on('click',function(){
        $('.send_period .item').each(function(){
            var $this=$(this);
            $this.addClass('available').removeClass('not_available');
        });
        $('.send_period .item').first().addClass('active').siblings().removeClass('active');
    });
    //按时达/立即送模式选择
    var intime_on=$('.send-intime').data('config');
    var now_on=$('.send-now').data('config'); 
    if(intime_on=='False'||typeof(intime_on)=='undefined'){ //立即送被关闭情况
        $('.send-intime').removeClass('active').find('p').addClass('text-grey3');
        $('.send-now').addClass('active');
        $('.send_day').remove();
        $('.send_period').remove();
        $('.send_now').show();
        $('.intime-intro').hide();
        $('.now-intro').show();
        $('#freight_money').text(window.dataObj.freigh_now);
        $('#final_price').text(mathFloat(window.dataObj.total_price+window.dataObj.freigh_now));
        $('.send-intime').on('click',function(){
            $(this).removeClass('active');
            if(now_on=='True'){
                $('.send-now').addClass('active');
                $('.send_now').show();
                $('.intime-intro').hide();
                $('.now-intro').show();
            }
            else noticeBox('按时达模式已关闭，请选择立即送模式！',$this);
        })
    }
    else{
        $('.intime-intro').show();
        $('.now-intro').hide();
        $('#freight_money').text(window.dataObj.freigh_ontime);
        $('#final_price').text(mathFloat(window.dataObj.total_price+window.dataObj.freigh_ontime));
        //按时达模式选择
        $('#sendInTime').on('click',function(){
            var $this=$(this);
            $this.parents('.item').addClass('active').siblings('.item').removeClass('active');
            $('.send_period').show();
            $('.send_day').show();
            $('.send_now').hide();
            $('.mincharge_now').hide();
            $('.intime-intro').show();
            $('.now-intro').hide();
            window.dataObj.total_price=mathFloat($list_total_price.text());
            $('#freight_money').text(window.dataObj.freigh_ontime);
            $('#final_price').text(mathFloat(window.dataObj.total_price+window.dataObj.freigh_ontime));
            if(window.dataObj.total_price<window.dataObj.mincharge_intime){
                $('.mincharge_intime').show();
            }
        });
    }
    if(now_on=='False'||typeof(now_on)=='undefined'){//立即送被关闭情况
        $('.send-now').removeClass('active').find('p').addClass('text-grey3');
        $('.send-intime').addClass('active');
        $('.send_day').show();
        $('.send_period').show();
        $('.send_now').remove();
        $('.intime-intro').show();
        $('.now-intro').hide();
        $('#freight_money').text(window.dataObj.freigh_ontime);
        $('#final_price').text(mathFloat(window.dataObj.total_price+window.dataObj.freigh_ontime));
        $('.send-now').on('click',function(){
            $(this).removeClass('active');
            if(intime_on=='True'){
                $('.send-intime').addClass('active');
                $('.send_day').show();
                $('.send_period').show();
                $('.intime-intro').show();
                $('.now-intro').hide();
            }
            else $('.send-intime').removeClass('active');
            noticeBox('立即送模式已关闭，请选择按时达模式！',$this);
        })
    }
    else{
        $('.send_now').show();
        $('.intime-intro').hide();
        $('.now-intro').show();
        $('#freight_money').text(window.dataObj.freigh_now);
        $('#final_price').text(mathFloat(window.dataObj.total_price+window.dataObj.freigh_now));
        //立即送模式选择/立即送最低起送金额提示
        $('#sendNow').on('click',function(){  
            var $this=$(this);
            var end_time=$('.now_endtime').text();
            var period=Int($this.attr('data-period'));
            var n=period/60;
            var stop_time;
            if(n<1){
                if(time.getMinutes()+period<60){
                    stop_time=checkTime(time.getHours())+':'+checkTime(time.getMinutes()+period)+':'+checkTime(time.getSeconds());
                }
                else{
                    stop_time=checkTime(time.getHours()+1)+':'+checkTime(time.getMinutes()+(period-60))+':'+checkTime(time.getSeconds());
                }
            }
            else if(1<=n<=2){
                period=period-60
                 if(time.getMinutes()+period<60){
                    stop_time=checkTime(time.getHours()+1)+':'+checkTime(time.getMinutes()+period)+':'+checkTime(time.getSeconds());
                }
                else{
                    stop_time=checkTime(time.getHours()+2)+':'+checkTime(time.getMinutes()+(period-60))+':'+checkTime(time.getSeconds());
                }
            }
            if(stop_time<=end_time)
            {
                $this.parents('.item').addClass('active').siblings('.item').removeClass('active');
                $('.send_period').hide();
                $('.send_day').hide();
                $('.send_now').show();
                $('.intime-intro').hide();
                $('.now-intro').show();
                window.dataObj.total_price=mathFloat($list_total_price.text());
                $('#freight_money').text(window.dataObj.freigh_now);
                $('#final_price').text(mathFloat(window.dataObj.total_price+window.dataObj.freigh_now));
                if(window.dataObj.total_price<window.dataObj.mincharge_now){
                    $('.mincharge_now').show();
                    $('.mincharge_intime').hide();
                }
            }
            else {
                $this.parents('.item').removeClass('active').siblings('.item').addClass('active');
                return noticeBox('不小心超过了“立即送”的送货时间呢，请选择“按时达”时间段！',$this)
            }
        });
    }
    if(intime_on=='False'&&now_on=='False'){
        $('.send-now').removeClass('active');
        $('.send-intime').removeClass('active');
        $('#freight_money').text(0);
        $('#final_price').text(0);
        $('.send_now').hide();
        $('.intime-intro').hide();
        $('.now-intro').hide();
    }
    if(intime_on=='True'&&now_on=='True'){
        $('.send_now').hide();
        $('.intime-intro').show();
        $('.now-intro').hide();
        $('#freight_money').text(window.dataObj.freigh_ontime);
        $('#final_price').text(mathFloat(window.dataObj.total_price+window.dataObj.freigh_ontime));
    }
    if(typeof(intime_on)=='undefined'&&now_on=='True'){
        if(window.dataObj.total_price<window.dataObj.mincharge_now){
            $('.mincharge_now').show();
            $('.mincharge_intime').hide();
        }
    }
    //打赏小费
    $('.tip-list .item').on('click',function(){
        var $this=$(this);
        if($this.hasClass('active')) $this.removeClass('active');
        else $this.addClass('active').siblings('.item').removeClass('active');
    });
    //pay type active
    $('.pay_type li').each(function(){
        var $this=$(this);
        var index = $this.index();
        var status = $this.attr('data-status');
        var statu = $this.attr("data-auth");
        var type= $this.find('.title').text();
        if(statu == "False"){
            $this.removeClass('active').addClass('not_available');
        }
        if(status==0){
            $this.removeClass('active').addClass('not_available').next('li').addClass('active');
        }
    });
}).on("click",".pay_type li",function(){
    var index = $(this).index();
    var status = $(this).attr('data-status');
    var type=$(this).find('.title').text();
    if(index != 2){
        $(".wrap-online-lst").addClass("hidden");
    }
    if(index == 1){
        var statu = $(this).attr("data-auth");
        if(statu == "False"){
            noticeBox("当前店铺未认证，此功能暂不可用");
            return false;
        }
    }
    if(index == 2){
        /*noticeBox("目前还不支持在线支付哦，我们会尽快开放此功能");
        return false;*/
        //window.location.href=""
        $(".wrap-online-lst").toggleClass("hidden");
    }
    if(status==0){
         noticeBox("当前店铺已关闭"+type);
         return false;
    }
    $(".pay_type li").removeClass("active").eq(index).addClass("active");
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
}).on("click",".online-lst li",function(){   //选择在线支付方式
    /*$(".online-lst").find(".checkbox-btn").removeClass("checkboxed");
    $("#online-pay").attr("data-tpye",$(this).attr("data-type"));
    $(this).children("a").addClass("checkboxed");*/
});

window.dataObj.price_list=[];
window.dataObj.total_price=0;
window.dataObj.freigh_ontime=Int($('.freigh_ontime').text());
window.dataObj.freigh_now=Int($('.freigh_now').text());

var getPrice=function(){
    window.dataObj.price_list=[];
    var freight=mathFloat($('#freight_money').text());
    var $list_total_price=$('#list_total_price');
    var $final_price=$('#final_price');
    //商品价格小计
    $('.item_total_price').each(function(){
        var $this=$(this);
        var parent=$this.parents('.cart-list-item');
        var num=parent.find('.item_number').val();
        var price=parent.find('.item_price').text();
        var total=mathFloat(num*price);
        $this.text(total);
        window.dataObj.price_list.push(total);
    });
    //商品价格总计
    window.dataObj.total_price=totalPrice(window.dataObj.price_list);
    $list_total_price.text(mathFloat(window.dataObj.total_price));
    $final_price.text(mathFloat(window.dataObj.total_price)+mathFloat(freight));
}

function totalPrice(target){
    window.dataObj.total_price=0;
    for(var i=0;i<target.length;i++)
    {
        window.dataObj.total_price+=parseFloat(target[i]);
    }
    return window.dataObj.total_price;
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
    var num=item.val();
    var total;
    var $list_total_price=$('#list_total_price');
    if(parent.hasClass('fruit_item')){menu_type=0}
    else if(parent.hasClass('menu_item')){menu_type=1}
    if(action==1&&num<=0) {num=0;target.addClass('disable');}
    var args={
        action:action,
        charge_type_id:charge_type_id,
        menu_type:menu_type
    };
    $.postJson(url,args,function(res){
            if(res.success)
            {
                if(action==2)
                {
                    num++;
                    item.val(num);
                    total=mathFloat(num*price);
                    getPrice();
                    parent.find('.item_total_price').text(total);
                    var t_price=mathFloat($list_total_price.text());
                    var type=$('#sendType').find('.active').data('id');
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
                        var type=$('#sendType').find('.active').data('id');
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

function mincharge(n,price){
    if(n==2){
        if(price<window.dataObj.mincharge_intime){
            $('.mincharge_intime').show();
            $('.mincharge_now').hide();
        }
        else $('.mincharge_intime').hide();
    }
    if(n==1){
        if(price<window.dataObj.mincharge_now){
            $('.mincharge_now').show();
            $('.mincharge_intime').hide();
        }
        else $('.mincharge_now').hide();
    }
}

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
                    $('.cart_num').text(cart_n-1);
                    SetCookie('cart_count',cart_n-1);
                }
                if($('.cart-list').find('.cart-list-item').length==0) window.location.reload();
            }
            else return noticeBox(res.error_text);
        },
        function () {
            return noticeBox('网络好像不给力呢~ ( >O< ) ~');
        },
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')});
}

function addressAddEdit(action,name,address,phone,target){
    var url='/customer/'+getCookie('market_shop_code');
    var action=action;
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    var address_id=$('.address-box').attr('data-id');
    if(name == null){return noticeBox('请输入收货人姓名！',target)}
    if(name.length > 10){return noticeBox('姓名请不要超过10个字！',target)}
    if(address == null){return noticeBox('请输入收货人地址！',target)}
    if(address.length > 50){return noticeBox('地址请不要超过50个字！',target)}
    if(!phone){return noticeBox('请输入收货人电话！',target)}
    if(!regPhone.test(phone)){return noticeBox('请输入有效的手机号码！',target)}
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

function orderSubmit(target){
    var url='';
    var fruits={};
    var mgoods={};
    var online_type = "";
    var type=$('#sendType').find('.active').data('id');
    var today=$('#sendDay').find('.active').data('id');
    var period_id=$('#sendPeriod').find('.active').data('id');
    var address_id=$('#addressType').find('.active').data('id');
    var pay_type=$('#payType').find('.active').data('id');
    var message=$('#messageCon').val();
    var fruit_item=$('.fruit_item');
    var mincharge_intime=Number($('.mincharge_intime .mincharge').text());
    var mincharge_now=Number($('.mincharge_now .mincharge').text());
    var tip=$('.tip-list').find('.active').data('id');
    if(pay_type == 3){
        online_type = $("#online-pay").attr("data-type");
    }
    window.dataObj.total_price=Number($('#list_total_price').text());
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
        if(window.dataObj.total_price<mincharge_intime) return noticeBox('您的订单未达到按时达最低起送金额！',target);
        if(!period_id) return noticeBox('请选择送货时段！',target);
    }
    if(type==1){
        period_id=0;
        if(window.dataObj.total_price<mincharge_now) return noticeBox('您的订单未达到立即送最低起送金额！',target);
    }
    if(!type){return noticeBox('请选择送货时段！',target)}
    $('#submitOrder').addClass('bg-grey text-grey3').text('提交成功').attr({'disabled':'true'});
    var args={
        fruits:fruits,
        mgoods:mgoods,
        type:type,
        today:today,
        period_id:period_id,
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
            window.location.href=window.dataObj.success_href;
        }
        else {
            noticeBox(res.error_text,target);
            $('#submitOrder').removeClass('bg-grey text-grey3').text('提交订单').removeAttr('disabled');  
        }
    },
    function(){noticeBox('网络好像不给力呢~ ( >O< ) ~')},
    function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')});
}

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
            1000)
    }
}
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
                noticeBox('验证码已发送到您的手机,请注意查收！');
                $('#getVrify').removeAttr('disabled');

            }
            else return noticeBox(res.error_text);
        },
         function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}

function TiePhone(evt){
    evt.preventDefault();
    var phone=$('#enterPhone').val();
    var code=$('#enterVrify').val();
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
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
        function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}