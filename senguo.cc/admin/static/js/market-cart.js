$(document).ready(function(){
    $('.address_list li').eq(0).addClass('active');
    //商品价格小计
    item_total_price.each(function(){
        var $this=$(this);
        var parent=$this.parents('.cart-list-item');
        var num=parent.find('.item_number').val();
        var price=parent.find('.item_price').text();
        var total=num*price;
        $this.text(total);
        price_list.push(total);
    });
    //商品价格总计
    list_total_price.text(totalPrice(price_list));
    //商品数量操作
    cart_item.find('.number-minus').on('click',function(){
        var $this=$(this);
        goodsNum($this,1);
    });
    cart_item.find('.number-plus').on('click',function(){
        var $this=$(this);
        goodsNum($this,2);
    });
    //商品删除
    cart_item.find('.delete-item').on('click',function() {
        var $this=$(this);
        var parent=$this.parents('.cart-list-item');
        if(parent.hasClass('fruit_item')){itemDelete($this,0);}
        else if(parent.hasClass('menu_item')){itemDelete($this,1);}
    });
    //类型切换增加active
    $('.type-choose li').each(function(){
        var $this=$(this);
        $this.on('click',function(){$this.addClass('active').siblings().removeClass('active');})
    });
    //收货地址添加
    var max=$('.address_list li').length;
    if(max==0){
        addressBox.removeClass('hidden');
        $('.to-add-address').addClass('hidden');
    }
    $('#receiveCancel').on('click',function(){
        addressBox.addClass('hidden');
    });
    $('.to-add-address').on('click',function(){
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
    receiveAdd.on('click',function(){
        var name=receiveName.val();
        var address=receiveAddress.val();
        var phone=receivePhone.val();
        if(max<5) addressAddEdit('add_address',name,address,phone);
        else return alert('至多能添加五个收获地址！');
    });

    //收货地址编辑
    $('.to-edit-address').on('click',function(){
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
    receiveEdit.on('click',function(){
        var name=receiveName.val();
        var address=receiveAddress.val();
        var phone=receivePhone.val();
        addressAddEdit('edit_address',name,address,phone);
    });
    //订单提交
    $('#submitOrder').on('click',function(){orderSubmit();});

    $('#sendNow').on('click',function(){$('.send_period').hide();$('.send_day').hide();});
    $('#sendInTime').on('click',function(){$('.send_period').show();$('.send_day').show();});

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

function totalPrice(target){
    for(var i=0;i<target.length;i++)
    {
        total_price+=parseInt(target[i]);
    }
    return total_price;
}

function goodsNum(target,action){
    var url=market_href+shop_id;
    var action=action;
    var charge_type_id=target.parents('.number-change').siblings('.charge-type').data('id');
    var menu_type;
    var parent=target.parents('.cart-list-item');
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
                    total=num*price;
                    parent.find('.item_total_price').text(total);
                    var t_price=parseInt(list_total_price.text());
                    t_price+=parseInt(price);
                    list_total_price.text(t_price);

                }
                else if(action==1)
                {
                    var val=parseInt(item.val());
                    if(val>0)
                    {
                        num--;
                        item.val(num);
                        total=num*price;
                        parent.find('.item_total_price').text(total);
                        var t_price=parseInt(list_total_price.text());
                        t_price-=parseInt(price);
                        list_total_price.text(t_price);
                    }
                }

            }
            else alert(res.error_text);
        },
        function(){alert('网络错误')})
}

function itemDelete(target,menu_type) {
    var url = market_href + shop_id;
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
                t_price-=parseInt(price);
                list_total_price.text(t_price);
                parent.remove();
                console.log(cart_list.find(cart_item).length);
                if(cart_list.find(cart_item).length==1) window.location.reload();
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
    var message=$('#messageCon').text();
    var fruit_item=$('.fruit_item');
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
    if(type==2&&!period_id) {return alert('请选择送货时段！')}
    if(type==1){period_id=0}
    var args={
        fruits:fruits,
        mgoods:mgoods,
        type:type,
        today:today,
        period_id:period_id,
        address_id:address_id,
        pay_type:pay_type,
        message:message
    };
    $.postJson(url,args,function(res) {
        if (res.success) {
            window.location.href=success_href+shop_id;
        }
        else return alert(res.error_text);
    },
    function(){alert('网络错误')});
}

