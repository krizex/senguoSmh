$(document).ready(function(){
    var item_url='/static/items/admin/order-item.html?v=2015-03-007';
    //订单数据
    if(orders.length==0) $('.order-list-content').append('<h3 class="text-center">无订单信息！</h3>');
    else getOrder(item_url);
    //隐藏信息显示
    toggle('.order-content','.list-item-body');
    toggle('.list-title','.list-item-body');
    $('.sales-list-item').css({'border-color':'#29aae1'});
    //订单打印
    $(document).on('click','.print-order',function(){orderPrint($(this)); });
    //订单删除
    $(document).on('click','.delete-order',function(){
        if(confirm('确认删除该订单吗？')){orderDelete($(this));}
    });
    //订单状态修改
    $(document).on('click','.status-order',function(){
        var $this=$(this);
        orderEdit($this,'edit_status',1);
    });
    $(document).on('click','.status-send',function(){
        var $this=$(this);
        orderEdit($this,'edit_status',4);
    });
    $(document).on('click','.status-finish',function(){
        var $this=$(this);
        orderEdit($this,'edit_status',5);
    });
    //员工修改
    $(document).on('click','.send_person_list li',function(){
        var $this=$(this);
        var val=$this.data('id');
        orderEdit($this,'edit_SH2',val)
    });
    //订单总金额修改
    $(document).on('click','.price_edit',function(){
        var $this=$(this);
        var parent=$this.parents('.list-item');
	var id=parent.data('id');
	var index=parent.index();
        var $box=$('.order_set_box');
        $box.modal('show').attr({'data-id':id,'data-target':index}).find('.modal-sure-btn').addClass('price_check').removeClass('mark_check');
        $box.find('.title').text('编辑订单总价格');
        $('#order_ser_val').val('');
    });
    $(document).on('click','.price_check',function(){
        var $this=$(this);
        var val=$('#order_ser_val').val();
        orderEdit($this,'edit_totalPrice',val);
    });
    //订单备注
    $(document).on('click','.order_mark',function(){
        var $this=$(this);
        var parent=$this.parents('.list-item');
	var id=parent.data('id');
	var index=parent.index();
        var $box=$('.order_set_box');
        $box.modal('show').attr({'data-id':id,'data-target':index}).find('.modal-sure-btn').addClass('mark_check').removeClass('price_check');
        $box.find('.title').text('订单备注');
        $('#order_ser_val').val('');
    });
    $(document).on('click','.mark_check',function(){
        var $this=$(this);
        var val=$('#order_ser_val').val();
        orderEdit($this,'edit_remark',val);
    });
});
var orders=window.dataObj.order;
var $list_item;
var $goods_item;
var $staff_item;
var order_link='/admin/order';

function getOrder(url){
    $.getItem(url,function(data){
            $list_item=data;
            //商品列表item
    	    getGoodsItem('/static/items/admin/order-goods-item.html?v=2015-03-7');
    	    //员工列表item
    	    getStaffItem('/static/items/admin/order-staff-item.html?v=2015-03-7');
            orderItem(orders);
        }
    );
}

var getGoodsItem=function(url){
    $.ajaxSetup({'async':false});
    $.getItem(url,function(data){
            $goods_item=data;
        }
    );
}

var getStaffItem=function(url){
    $.ajaxSetup({'async':false});
    $.getItem(url,function(data){
            $staff_item=data;
        }
    );
}

function orderItem(item){
    for(var i=0;i<item.length;i++){
        var $item=$($list_item);
        var SH2=item[i]['SH2'];
        var SH2s=item[i]['SH2s'];
        var active=item[i]['active'];
        var address_text=item[i]['address_text'];
        var create_date=item[i]['create_date'];
        var freight=item[i]['freight'];
        var fruits=item[i]['fruits'];
        var id=item[i]['id'];
        var isprint=item[i]['isprint'];
        var message=item[i]['message'];
        var money_paid=item[i]['money_paid'];
        var num=item[i]['num'];
        var pay_type=item[i]['pay_type'];      
        var mgoods=item[i]['mgoods']; 
        var phone=item[i]['phone'];
        var receiver=item[i]['receiver'];  
        var remark=item[i]['remark'];
        var sent_time=item[i]['sent_time'];
        var staff_remark=item[i]['staff_remark'];
        var status=item[i]['status'];
        var tip=item[i]['tip'];
        var today=item[i]['today'];
        var totalPrice=item[i]['totalPrice'];
        var type=item[i]['type'];
              
        if(!message) $item.find('.order-message').hide();
        if(!staff_remark) $item.find('.staff-replay').hide();
        if(!remark) $item.find('.saler-remark').hide();
        if(isprint==1) $item.find('.print-order').addClass('text-grey9');

        $item.attr({'data-id':id,'data-type':type});
        $item.find('.send-time').text(sent_time);
        $item.find('.order-code').text(num);
        $item.find('.order-price').text(totalPrice);
        $item.find('.goods-total-charge').text(totalPrice);
        $item.find('.total_price_input').text(totalPrice);
        $item.find('.address_show').text(address_text);
        $item.find('.name').text(receiver);
        $item.find('.phone').text(phone);
        $item.find('.message-content').text(message);
        $item.find('.staff-remark').text(staff_remark);
        $item.find('.order_remark').text(remark);
        $item.find('.order-status').attr({'data-id':status});
        $item.find('.order-time').text(create_date);
        $item.find('.saler-remark').val(remark);
    
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
        if(status==0) {
        	$item.find('.order-status').empty().text('该订单已取消或删除');
        	$item.find('.unable_edit').show();
        }
        else if(status==1) {
        	$item.find('.status_order').removeClass('hidden');
        	$item.find('.able_edit').show();
        	$item.find('.status_word').text('未处理');
        	$item.find('.status-order').addClass('bg-blue');
        }
        else if(status==4) {
        	$item.find('.status_send').removeClass('hidden');
        	$item.find('.able_edit').show();
        	$item.find('.status_word').text('配送中');
        	$item.find('.status-send').addClass('bg-blue');
        }
        else if(status==5) {
        	$item.find('.status_finish').removeClass('hidden');
        	$item.find('.able_edit').show();
        	$item.find('.status_word').text('已完成');
        	$item.find('.status-finish').addClass('bg-blue');
        }
        else if(status==6) {
        	$item.find('.status_finish').removeClass('hidden');
        	$item.find('.unable_edit').show();
        	$item.find('.status_word').text('已评价');
        }
        //商品数据
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
            var num=$item.find('.goods-list li').length;
            $mgoods.find('.code').text(num+1);
            $mgoods.find('.goods-name').text(mgoods[key]['mgoods_name']);
            $mgoods.find('.goods-price').text(mgoods[key]['charge']);
            $mgoods.find('.goods-number').text(mgoods[key]['num']);
            $item.find('.goods-list').append($mgoods);
            goods_num=goods_num+mgoods[key]['num'];
        }
        //送货员选择
        var $current_sender=$item.find('.current_sender');
        var $send_change=$item.find('.send_change');
        var $sender=$send_change.find('.send_person');
        var CurrentStaff=function(target,val){
	      target.attr({'data-id':val['id']});
	      target.find('.sender-code').text(val['id']);
	      target.find('.sender-name').text(val['realname']);
	      target.find('.sender-phone').text(val['phone']);
	};
	if(SH2s.length>0){
		if(!SH2){
		    CurrentStaff($sender,SH2s[0]);
		    CurrentStaff($current_sender,SH2s[0]);
		     for(var key in SH2s){
		    	var $staff=$($staff_item);
		    	CurrentStaff($staff,SH2s[key]);
		    	$item.find('.send_person_list').append($staff);
		    }	    
		}
		else{
		    CurrentStaff($sender,SH2);
		    CurrentStaff($current_sender,SH2);
		    for(var key in SH2s){
		    	var $staff=$($staff_item);
		    	if(SH2s[key]['id']==SH2['id']) $staff.addClass('bg-blue');
		    	CurrentStaff($staff,SH2s[key]);
		    	$item.find('.send_person_list').append($staff);
		    }
		}
        }
        //商品总件数
        $item.find('.goods-total-number').text(goods_num);
        $('.order-list-content').append($item);
       
    }
}

function orderPrint(target){
    var url=order_link;
    var action='print';
    var parent=target.parents('.order-list-item');
    var order_id=parent.data('id');
    var order_num=parent.find('.order-code').text();
    var shop_name=$('#shop_name').text();
    var order_time=parent.find('.order-time').text();
    var delivery_time=parent.find('.send-time').text();
    var receiver=parent.find('.name').first().text();
    var address=parent.find('.address').first().text();
    var phone=parent.find('.phone').first().text();
    //var remark=parent.find('.message-content').first().text();
    var paid=parent.find('.pay-status').text();
    var totalPrice=parent.find('.goods-total-charge').text();
    var goods=parent.find('.goods-list')[0].innerHTML;
    var print_remark=$('.shop-receipt-remark').val();
    var print_img=$('.shop-receipt-img').val();
    var remark=parent.find('.saler-remark').val(); 
    $.getItem('/static/items/admin/order-print-page.html?v=2015-03-07',function(data){
        var $item=$(data);
        $item.find('.notes-head').text(shop_name);
        $item.find('.orderId').text(order_num);
        $item.find('.orderTime').text(order_time);
        $item.find('.deliveryTime').text(delivery_time);
        $item.find('.address').text(address);
        $item.find('.receiver').text(receiver);
        $item.find('.phone').text(phone);
        $item.find('.remark').text(remark);
        $item.find('.totalPrice').text(totalPrice);
        $item.find('.goods-list')[0].innerHTML=goods;
        if(remark!='') {
            $item.find('.remark-box').show();
            $item.find('.remark').text(remark);
        }
        $item.find('.print-remark').text(print_remark);
        if(!print_img) $item.find('.shop-img').remove();
        else $item.find('.shop-img img').attr({'src':print_img});
        console.log('小票图片'+$item.find('.shop-img img').attr('src'));
        if (paid == true) {
            $item.find('.moneyPaid').text('余额支付');
        } else {
            $item.find('.moneyPaid').text('现金支付');
        }
        //var OpenWindow = window.open("","","width=500,height=600");
        //OpenWindow.document.body.style.margin = "0";
        //OpenWindow.document.body.style.marginTop = "15px";
        //var box = OpenWindow.document.createElement('div');
        //OpenWindow.document.body.appendChild(box);
        //OpenWindow.document.close();
        var data={
            order_id:order_id
        };
        var args={
            action:action,
            data:data
        };
        $.postJson(url,args,function(res){
                if(res.success){
                    target.addClass('text-grey9');
                    var inner=window.document.body.innerHTML;
                    window.document.body.innerHTML=$item[0].innerHTML;
                    window.print();
                    window.document.body.innerHTML=inner;
                }
                else return alert(res.error_text);
            },
            function(){return alert('网络错误！')}
        )
    })
}

function orderDelete(target){
    var url=order_link;
    var action='del_order';
    var parent=target.parents('.order-list-item');
    var order_id=parent.data('id');
    var data={
        order_id:order_id
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                parent.remove();
            }
            else return alert(res.error_text);
        },
        function(){return alert('网络错误！')}
    )
}

function orderEdit(target,action,content){
    var url=order_link;
    var action=action;
    var parent;
    var regFloat=/^[0-9]+([.]{1}[0-9]{1,2})?$/;
    if(action=='edit_status'||action=='edit_SH2'){
       parent=target.parents('.order-list-item');	
    }
    else parent=target.parents('.order_set_box');
    var order_id=parent.attr('data-id');
    var data={order_id:order_id};
    var args;
    if(action=='edit_remark')
    {
	if(content.length>100) return alert('订单备注请不要超过100个字!');        
	data.remark=content;
	var index=parent.attr('data-target');
    }
    else if(action=='edit_SH2')
    {
        data.staff_id=Int(content);
    }
    else if(action=='edit_status')
    {
        data.status=Int(content);
    }
    else if(action=='edit_totalPrice')
    {
	if(!regFloat.test(content)) return alert('订单总价只能为数字!');
        data.totalPrice=content;
        var index=parent.attr('data-target');
    }
    args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                if(action=='edit_remark')
                {
                    parent.modal('hide');
		            var $remark_box=$('.order-list-item').eq(index).find('.saler-remark');
             	    $remark_box.show().find('.order_remark').text(content);
                    $('.order-list-item').eq(index).find('.saler-remark').val(content);
                }
                else if(action=='edit_SH2')
                {
                   var code=target.find('.sender-code').text();
		   var name=target.find('.sender-name').text();
		   var phone=target.find('.sender-phone').text();
                   var $sender=parent.find('.order-sender');
                   $sender.find('.sender-code').text(code);
		   $sender.find('.sender-name').text(name);
                   $sender.find('.sender-phone').text(phone);
                   parent.find('.status_send').removeClass('hidden');
  	           parent.find('.status_order').addClass('hidden');
                   parent.find('.status_finish').addClass('hidden');
                   parent.find('.status_word').text('配送中');
                   parent.find('.status-send').addClass('bg-blue').siblings().removeClass('bg-blue');
                }
                else if(action=='edit_status')
                {
		   target.addClass('bg-blue').siblings().removeClass('bg-blue');
		    var status=target.text();
		    parent.find('.status_word').text(status);
                    if(content==1) {
			parent.find('.status_order').removeClass('hidden');
  	                parent.find('.status_send').addClass('hidden');
			parent.find('.status_finish').addClass('hidden');
		      }
		    else if(content==4) {
			parent.find('.status_send').removeClass('hidden');
  	                parent.find('.status_order').addClass('hidden');
			parent.find('.status_finish').addClass('hidden');
		      }
	            else if(content==5) {
			parent.find('.status_finish').removeClass('hidden');
  	                parent.find('.status_order').addClass('hidden');
			parent.find('.status_send').addClass('hidden');
		      }
                }
                else if(action=='edit_totalPrice')
                {
		   parent.modal('hide');
                   $('.order-list-item').eq(index).find('.order-price').text(content);
                }
            }
            else return alert(res.error_text);
        },
        function(){return alert('网络错误！')}
    )
}




