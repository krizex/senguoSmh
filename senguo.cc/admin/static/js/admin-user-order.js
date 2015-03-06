$(document).ready(function(){
    var item_url='/static/items/admin/order-item.html?v=2015-02-03';
    //订单数据
    getOrder(item_url);
    //隐藏信息显示
    $('body').on('click','.order-content',function(){
        var $this=$(this);
        $this.toggleClass('up','down');
        $this.parents('.list-item').find('.list-item-body').slideToggle(100);
        $this.parents('.list-item').siblings('.list-item').find('.list-item-body').slideUp(100).siblings().find('.arrow-up').hide().siblings('.arrow-down').show();
        $('.sales-list-item').css({'border-color':'#29aae1'});
    });
   $('body').on('click','.list-title',function(){
        var $this=$(this);
        $this.toggleClass('up','down');
        $this.parents('.list-item').find('.list-item-body').slideToggle(100);
        $this.parents('.list-item').siblings('.list-item').find('.list-item-body').slideUp(100).siblings().find('.arrow-up').hide().siblings('.arrow-down').show();
        $('.sales-list-item').css({'border-color':'#29aae1'});
    });
    //商品列表item
    getGoodsItem('/static/items/admin/order-goods-item.html?v=2015-03-02');
    //员工列表item
    getStaffItem('/static/items/admin/order-staff-item.html?v=2015-03-02');
    //订单打印
    $('body').on('click','.print-order',function(){
        orderPrint($(this));
    });
});
var orders=window.dataObj.order;
var $list_item;
var $goods_item;
var $staff_item;
var shop_remark=$('.shop-receipt-remark').val();
var shop_img=$('.shop-receipt-img').val();

function getOrder(url){
    $.getItem(url,function(data){
            $list_item=data;
            orderItem(orders);
        }
    );
}

function getGoodsItem(url){
    $.ajaxSetup({'async':false});
    $.getItem(url,function(data){
            $goods_item=data;
        }
    );
}

function getStaffItem(url){
    $.ajaxSetup({'async':false});
    $.getItem(url,function(data){
            $staff_item=data;
        }
    );
}

function orderItem(item){
    for(var i=0;i<item.length;i++){
        var $item=$($list_item);
        var id=item[i]['id'];
        var num=item[i]['num'];
        var create_date=item[i]['create_date'];
        var fruits=item[i]['fruits'];
        var mgoods=item[i]['mgoods'];
        var money_paid=item[i]['money_paid'];
        var pay_type=item[i]['pay_type'];
        var address_text=item[i]['address_text'];
        var phone=item[i]['phone'];
        var receiver=item[i]['receiver'];
        var message=item[i]['message'];
        var remark=item[i]['remark'];
        var staff_remark=item[i]['staff_remark'];
        var status=item[i]['status'];
        var tip=item[i]['tip'];
        var today=item[i]['today'];
        var totalPrice=item[i]['totalPrice'];
        var type=item[i]['type'];
        var SH2s=item[i]['SH2s'];
	var SH2=item[i]['SH2'];
        var sent_time=item[i]['sent_time'];
        if(!message) $item.find('.order-message').hide();
        if(!staff_remark) $item.find('.staff-replay').hide();
        if(!remark) $item.find('.saler-remark').hide();

        $item.attr({'data-id':id,'data-type':type});
        $item.find('.send-time').text(sent_time);
        $item.find('.order-code').text(num);
        $item.find('.order-price').text(totalPrice);
        $item.find('.goods-total-charge').text(totalPrice);
        $item.find('.total_price_input').text(totalPrice);
        $item.find('.address_show').text(address_text);
        $item.find('.address_edit').val(address_text);
        $item.find('.name').text(receiver);
        $item.find('.name_edit').val(receiver);
        $item.find('.phone').text(phone);
        $item.find('.phone_edit').val(phone);
        $item.find('.message-content').text(message);
        $item.find('.staff-remark').text(staff_remark);
        $item.find('.notice_input').val(remark);
        $item.find('.order-status').attr({'data-id':status});
        $item.find('.order-time').text(create_date);
        $item.find('.receipt-remark').val(shop_remark);
        $item.find('.receipt-img').val(shop_img);
	var $sender=$item.find('.order_sender');
        //立即送消费显示
        if(type==1){
            $item.find('.tip').text(tip);
        }
        else $item.find('.tips').hide();
        //支付状态
        if(money_paid==true){
            $item.find('.pay-status').text('余额支付');
        }
        else $item.find('.pay-status').text('现金支付');
        //订单状态
        if(status==0) {$item.find('.order-status').empty().text('该订单已取消');}
        else if(status==1) {$item.find('.status_order').removeClass('hidden');}
        else if(status==4) {$item.find('.status_send').removeClass('hidden');}
        else if(status==5) {$item.find('.status_finish').removeClass('hidden');}
        else if(status==6) {$item.find('.status_finish').removeClass('hidden');}
        var goods_num=0;
        var g_num=0;
        var m_num=0;
        for(var key in fruits){
            g_num++;
            var $goods=$($goods_item);
            $goods.find('.code').text(g_num);
            $goods.find('.goods-name').text(fruits[key]['fruit_name']);
            $goods.find('.goods-price').text(fruits[key]['charge']);
            $goods.find('.goods-number').text(fruits[key]['num']);
            $item.find('.goods-list').append($goods);
            goods_num=goods_num+fruits[key]['num'];
        }
        for(var key in mgoods){
            m_num++;
            var $mgoods=$($goods_item);
            $mgoods.find('.code').text(m_num);
            $mgoods.find('.goods-name').text(mgoods[key]['mgoods_name']);
            $mgoods.find('.goods-price').text(mgoods[key]['charge']);
            $mgoods.find('.goods-number').text(mgoods[key]['num']);
            $item.find('.goods-list').append($goods);
            goods_num=goods_num+mgoods[key]['num'];
        }
	if(!SH2){
	    $sender.attr({'data-id':SH2s[0]['id']});
            $sender.find('.sender-code').text(SH2s[0]['id']);
            $sender.find('.sender-name').text(SH2s[0]['realname']);
            $sender.find('.sender-phone').text(SH2s[0]['phone']);
        }
        else {
	    $sender.attr({'data-id':SH2['id']});
            $sender.find('.sender-code').text(SH2['id']);
            $sender.find('.sender-name').text(SH2['realname']);
            $sender.find('.sender-phone').text(SH2['phone']);
        }
        /*for(var key in SH2s){
            var $staff=$($staff_item);
	    $staff.attr({'data-id':SH2s[key]['id']});
            $staff.find('.sender-code').text(SH2s[key]['id']);
            $staff.find('.sender-name').text(SH2s[key]['realname']);
            $staff.find('.sender-phone').text(SH2s[key]['phone']);
            $item.find('.send-person').append($staff);
        }*/
        $item.find('.goods-total-number').text(goods_num);
        $('.order-list-content').append($item);
    }
}

function orderPrint(target){
    var parent=target.parents('.order-list-item');
    var order_id=parent.data('id');
    var shop_name=$('#shop_name').text();
    var order_time=parent.find('.order-time').text();
    var delivery_time=parent.find('.send-time').text();
    var receiver=parent.find('.name').first().text();
    var address=parent.find('.address').first().text();
    var phone=parent.find('.phone').first().text();
    var remark=parent.find('.message-content').first().text();
    var paid=parent.find('.pay-status').text();
    var totalPrice=parent.find('.goods-total-charge').text();
    var goods=parent.find('.goods-list')[0].innerHTML;
    var print_remark=parent.find('.receipt-remark').val();
    var print_img=parent.find('.receipt-img').val();
    $.getItem('/static/items/admin/order-print-page.html?v=2015-01-12',function(data){
        var $item=$(data);
        $item.find('.notes-head').text(shop_name);
        $item.find('.orderId').text(order_id);
        $item.find('.orderTime').text(order_time);
        $item.find('.deliveryTime').text(delivery_time);
        $item.find('.address').text(address);
        $item.find('.receiver').text(receiver);
        $item.find('.phone').text(phone);
        $item.find('.remark').text(remark);
        $item.find('.totalPrice').text(totalPrice);
        $item.find('.goods-list')[0].innerHTML=goods;
        $item.find('.print-remark').text(print_remark);
        if(!print_img) $item.find('.shop-img').remove();
        else $item.find('.shop-img img').attr({'src':print_img});
        if (paid == true) {
            $item.find('.moneyPaid').text('余额支付');
        } else {
            $item.find('.moneyPaid').text('现金支付');
        }
        var OpenWindow = window.open("","","width=500,height=600");
        OpenWindow.document.body.style.margin = "0";
        OpenWindow.document.body.style.marginTop = "15px";
        var box = OpenWindow.document.createElement('div');
        box.innerHTML=$item[0].innerHTML;
        OpenWindow.document.body.appendChild(box);
        OpenWindow.document.close();
        OpenWindow.print();
    })
}
