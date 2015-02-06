$(document).ready(function(){
    //运费默认值
    if(!freigh_ontime) freigh_ontime=0;
    if(!freigh_now) freigh_now=0;
    $('.address_list li').eq(0).addClass('active');
    mincharge_now=Int($('.mincharge_now').find('.mincharge').text());
    mincharge_intime=Int($('.mincharge_intime').find('.mincharge').text());
    //商品价格小计
    item_total_price.each(function(){
        var $this=$(this);
        var parent=$this.parents('.cart-list-item');
        var num=parent.find('.item_number').val();
        var price=parent.find('.item_price').text();
        var total=mathFloat(num*price);
        $this.text(total);
        price_list.push(total);
    });
    //商品价格总计
    total_price=totalPrice(price_list);
    list_total_price.text(mathFloat(total_price));
    //按时达最低起送金额提示
    if(total_price<mincharge_intime) $('.mincharge_intime').show();
    //商品数量操作
    cart_item.find('.number-minus').hammer().on('tap',function(){
        var $this=$(this);
        goodsNum($this,1);
    });
    cart_item.find('.number-plus').hammer().on('tap',function(){
        var $this=$(this);
        goodsNum($this,2);
    });
    //商品删除
    cart_item.find('.delete-item').hammer().on('tap',function(){
        if(confirm('确认删除该商品吗？//(ㄒoㄒ)//')){
            var $this=$(this);
            var parent=$this.parents('.cart-list-item');
            if(parent.hasClass('fruit_item')){itemDelete($this,0);}
            else if(parent.hasClass('menu_item')){itemDelete($this,1);}
        }
    });
    cart_item.hammer().on('hold',function(){
        if(confirm('确认删除该商品吗？//(ㄒoㄒ)//')){
            var $this=$(this);
            if($this.hasClass('fruit_item')){itemDelete($this,0);}
            else if($this.hasClass('menu_item')){itemDelete($this,1);}
        }
    });
    //类型切换增加active
    $('.type-choose li').each(function(){
        var $this=$(this);
        $this.hammer().on('tap',function(){$this.addClass('active').siblings().removeClass('active');})
    });
    //收货地址添加
    var max=$('.address_list li').length;
    if(max==0){
        addressBox.removeClass('hidden');
        $('.to-add-address').addClass('hidden');
    }
    $('#receiveCancel').hammer().on('tap',function(){
        addressBox.addClass('hidden');
    });
    $('.to-add-address').hammer().on('tap',function(){
        if(max<5) {
            addressBox.toggleClass('hidden');
            receiveAdd.show();
            receiveEdit.addClass('hidden');
            receiveName.val('');
            receiveAddress.val('');
            receivePhone.val('');
        }
        else return alert('至多能添加五个收获地址！');
    });
    receiveAdd.hammer().on('tap',function(){
        var name=receiveName.val();
        var address=receiveAddress.val();
        var phone=receivePhone.val();
        if(max<5) addressAddEdit('add_address',name,address,phone);
        else return alert('至多能添加五个收获地址！');
    });

    //收货地址编辑
    $('.to-edit-address').hammer().on('tap',function(){
        addressBox.removeClass('hidden');
        receiveAdd.hide();
        receiveEdit.removeClass('hidden');
        var parent=$(this).parents('li');
        var name=parent.find('.name').text();
        var address=parent.find('.address').text();
        var phone=parent.find('.phone').text();
        var id=parent.data('id');
        addressBox.attr({'data-id':id});
        receiveName.val(name);
        receiveAddress.val(address);
        receivePhone.val(phone);
    });
    receiveEdit.hammer().on('tap',function(){
        var name=receiveName.val();
        var address=receiveAddress.val();
        var phone=receivePhone.val();
        addressAddEdit('edit_address',name,address,phone);
    });
    //订单提交
    $('#submitOrder').hammer().on('tap',function(){orderSubmit();});
    //
    var time=new Date();
    var time_now=checkTime(time.getHours())+':'+checkTime(time.getMinutes())+':'+checkTime(time.getSeconds());
    //按时达根据当前时间选择时间段
    var stop_range=Int($('.stop-range').val());
    var today=$('#sendDay').find('.active').data('id');
    if(today==1) {
        $('.send_period li').each(function(){
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
                else if(confirm('抱歉，已超过了该送货时间段的下单时间!请选择下一个时间段！')){}
           });
        });}
        $('.send_period li').on('click',function(){
            var $this=$(this);
            if($this.hasClass('available')) {$this.addClass('active').siblings().removeClass('active')}
        });
    //按时达选择今天
    $('#send_today').on('click',function(){
        $('.send_period li').each(function(){
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
        $('.send_period li').each(function(){
            var $this=$(this);
            $this.addClass('available').removeClass('not_available');
        });
        $('.send_period li').first().addClass('active').siblings().removeClass('active');
    });
    //按时达/立即送模式选择
    var intime_on=$('.send-intime').data('config');
    var now_on=$('.send-now').data('config');
    if(intime_on=='False'){ //立即送被关闭情况
        $('.send-intime').removeClass('active').find('p').addClass('text-grey3');
        $('.send-now').addClass('active');
        $('.send_day').remove();
        $('.send_period').remove();
        $('.send_now').show();
        $('.intime-intro').hide();
        $('.now-intro').show();
        $('#freight_money').text(freigh_now);
        $('#final_price').text(mathFloat(total_price+freigh_now));
        $('.send-intime').on('click',function(){
            $(this).removeClass('active');
            if(now_on=='True'){
                $('.send-now').addClass('active');
                $('.send_now').show();
                $('.intime-intro').hide();
                $('.now-intro').show();
            }
            else alert('按时达模式已关闭，请选择立即送模式！');
        })
    }
    else{
        $('.intime-intro').show();
        $('.now-intro').hide();
        $('#freight_money').text(freigh_ontime);
        $('#final_price').text(mathFloat(total_price+freigh_ontime));
        //按时达模式选择
        $('#sendInTime').on('click',function(){
            var $this=$(this);
            $this.parents('li').addClass('active').siblings('li').removeClass('active');
            $('.send_period').show();
            $('.send_day').show();
            $('.send_now').hide();
            $('.mincharge_now').hide();
            $('.intime-intro').show();
            $('.now-intro').hide();
            total_price=mathFloat(list_total_price.text());
            $('#freight_money').text(freigh_ontime);
            $('#final_price').text(mathFloat(total_price+freigh_ontime));
            if(total_price<mincharge_intime){
                $('.mincharge_intime').show();
            }
        });
    }
    if(now_on=='False'){//立即送被关闭情况
        $('.send-now').removeClass('active').find('p').addClass('text-grey3');
        $('.send-intime').addClass('active');
        $('.send_day').show();
        $('.send_period').show();
        $('.send_now').remove();
        $('.intime-intro').show();
        $('.now-intro').hide();
        $('#freight_money').text(freigh_ontime);
        $('#final_price').text(mathFloat(total_price+freigh_ontime));
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
            alert('立即送模式已关闭，请选择按时达模式！');
        })
    }
    else{
        $('.send_now').show();
        $('.intime-intro').hide();
        $('.now-intro').show();
        $('#freight_money').text(freigh_now);
        $('#final_price').text(mathFloat(total_price+freigh_now));
        //立即送模式选择/立即送最低起送金额提示
        $('#sendNow').on('click',function(){
            var $this=$(this);
            var end_time=$('.now_endtime').text();
            if(time_now<=end_time)
            {
                $this.parents('li').addClass('active').siblings('li').removeClass('active');
                $('.send_period').hide();
                $('.send_day').hide();
                $('.send_now').show();
                $('.intime-intro').hide();
                $('.now-intro').show();
                total_price=mathFloat(list_total_price.text());
                $('#freight_money').text(freigh_now);
                $('#final_price').text(mathFloat(total_price+freigh_now));
                if(total_price<mincharge_now){
                    $('.mincharge_now').show();
                    $('.mincharge_intime').hide();
                }
            }
            else {
                $this.parents('li').removeClass('active').siblings('li').addClass('active');
                return alert('不小心超过了"立即送"的送货时间呢，请选择"按时达"时间段！')
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
        $('#freight_money').text(freigh_ontime);
        $('#final_price').text(mathFloat(total_price+freigh_ontime));
    }
    //打赏小费
    $('.tip-list li').on('click',function(){
        var $this=$(this);
        if($this.hasClass('active')) $this.removeClass('active');
        else $this.addClass('active').siblings('li').removeClass('active');
    })
});
var price_list=[];
var total_price=0;
var item_total_price=$('.item_total_price');
var list_total_price=$('#list_total_price');
var receiveAdd=$('#receiveAdd');
var receiveEdit=$('#receiveEdit');
var addressBox=$('.address-box');
var receiveName=$('#receiveName');
var receiveAddress=$('#receiveAddress');
var receivePhone=$('#receivePhone');
var addressList=$('.address_list');
var cart_item=$('.cart-list-item');
var cart_list=$('.cart-list');
var mincharge_now;
var mincharge_intime;
var freigh_ontime=Int($('.freigh_ontime').text());
var freigh_now=Int($('.freigh_now').text());

function totalPrice(target){
    for(var i=0;i<target.length;i++)
    {
        total_price+=parseFloat(target[i]);
    }
    return total_price;
}

function goodsNum(target,action){
    var url=market_href;
    var action=action;
    var menu_type;
    var parent=target.parents('.cart-list-item');
    var charge_type_id=parent.find('.charge-type').data('id');
    var price=parent.find('.item_price').text();
    var item_price=target.parents('.cart-list').find('.item_total_price');
    var item=target.siblings('.number-input');
    var num=item.val();
    var total;
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
                    parent.find('.item_total_price').text(total);
                    var t_price=mathFloat(list_total_price.text());
                    var freight=mathFloat($('#freight_money').text());
                    t_price+=mathFloat(price);
                    list_total_price.text(mathFloat(t_price));
                    $('#final_price').text(mathFloat(t_price+freight));
                    var type=$('#sendType').find('.active').data('id');
                    mincharge(type,t_price);

                }
                else if(action==1)
                {
                    var val=parseInt(item.val());
                    if(val>0)
                    {
                        num--;
                        item.val(num);
                        total=mathFloat(num*price);
                        parent.find('.item_total_price').text(total);
                        var t_price=mathFloat(list_total_price.text());
                        var freight=mathFloat($('#freight_money').text());
                        t_price-=mathFloat(price);
                        list_total_price.text(mathFloat(t_price));
                        $('#final_price').text(mathFloat(t_price+freight));
                        var type=$('#sendType').find('.active').data('id');
                        mincharge(type,t_price);
                        if(val==1){
                            var cart_n=Int($('.cart_num').text());
                            $('.cart_num').text(cart_n-1);
                            parent.remove();
                        }
                        if(cart_list.find('.cart-list-item').length==0) window.location.reload();
                    }

                }


            }
            else alert(res.error_text);
        },
        function(){alert('网络错误')})
}
function mincharge(n,price){
    if(n==2){
        if(price<mincharge_intime){
            $('.mincharge_intime').show();
            $('.mincharge_now').hide();
        }
        else $('.mincharge_intime').hide();
    }
    if(n==1){
        if(price<mincharge_now){
            $('.mincharge_now').show();
            $('.mincharge_intime').hide();
        }
        else $('.mincharge_now').hide();
    }
}

function itemDelete(target,menu_type) {
    var url = market_href;
    var action = 0;
    var parent=target.parents('.cart-list-item');
    var charge_type_id =parent .find('.charge-type').data('id');
    var price=parent.find('.item_total_price').text();
    var t_price=parseInt(list_total_price.text());
    var args = {
        action: action,
        charge_type_id: charge_type_id,
        menu_type: menu_type
    };
    $.postJson(url, args, function (res) {
            if (res.success) {
                parent.remove();
                t_price-=parseInt(price);
                list_total_price.text(t_price);
                var type=$('#sendType').find('.active').data('id');
                var freight=Int($('#freight_money').text());
                mincharge(type,t_price);
                $('#final_price').text(t_price+freight);
                var cart_n=Int($('.cart_num').text());
                $('.cart_num').text(cart_n-1);
                if(cart_list.find('.cart-list-item').length==0) window.location.reload();
            }
            else return alert(res.error_text);
        },
        function () {
            alert('网络错误')
        });
}

function addressAddEdit(action,name,address,phone){
    var url=home_href;
    var action=action;
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    var address_id=addressBox.attr('data-id');
    if(name == null){return alert('请输入收货人姓名！')}
    if(name.length > 10){return alert('姓名请不要超过10个字！')}
    if(address == null){return alert('请输入收货人地址！')}
    if(address.length > 20){return alert('地址请不要超过20个字！')}
    if(!phone){return alert('请输入收货人电话！')}
    if(!regPhone.test(phone)){return alert('请输入有效的手机号码！')}
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
                $('.address_list li').removeClass('active');
                var $item=$('<li data-id="'+res.address_id+'" class="active list-group-item item"><a href="javascript:;" class="text-grey3"><span class="name pr10"></span><span class="address pr10"></span><span class="phone"></span></a><a class="text-green pull-right to-edit-address">+编辑收货地址</a></li>');
                $item.find('.name').text(name);
                $item.find('.address').text(address);
                $item.find('.phone').text(phone);
                $('.address_list').append($item);
                $('.to-add-address').removeClass('hidden');
                addressBox.addClass('hidden');
            }
            if(action=='edit_address'){
                var item=addressList.children('.item');
                var item_id;
                var j=0;
                for(j;j<item.length;j++)
                {
                    item_id=item.eq(j).data('id');
                    if(item_id == address_id)
                        {
                            item.eq(j).find('.name').text(name);
                            item.eq(j).find('.address').text(address);
                            item.eq(j).find('.phone').text(phone);
                        }

                }
                addressBox.addClass('hidden');
            }

        }
        else return alert(res.error_text);
    },
    function(){alert('网络错误')});
}

function orderSubmit(){
    var url='';
    var fruits={};
    var mgoods={};
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
    total_price=Number($('#list_total_price').text());
    if(!address_id){return alert('请填写您的收货地址！');}
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
        if(total_price<mincharge_intime) return alert('您的订单未达到按时达最低起送金额！');
        if(!period_id) return alert('请选择送货时段！');
    }
    if(type==1){
        period_id=0;
        if(total_price<mincharge_now) return alert('您的订单未达到立即送最低起送金额！');
    }
    if(!type){return alert('请选择送货时段！')}
    var args={
        fruits:fruits,
        mgoods:mgoods,
        type:type,
        today:today,
        period_id:period_id,
        address_id:address_id,
        pay_type:pay_type,
        message:message,
        tip:tip
    };
    $.postJson(url,args,function(res) {
        if (res.success) {
            window.location.href=success_href;
        }
        else return alert(res.error_text);
    },
    function(){alert('网络错误')});
}

