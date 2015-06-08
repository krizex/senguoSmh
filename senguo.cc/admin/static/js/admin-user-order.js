$(document).ready(function(){
    var item_url='/static/items/admin/order-item.html?v=20150530';
    //订单数据
    if(orders.length==0) $('.order-list-content').append('<h4 class="text-center mt40">当前分类暂无订单信息</h3>');
    else getOrder(item_url);
    //隐藏信息显示
    toggle('.order-content','.list-item-body');
    toggle('.list-title','.list-item-body');
    $('.sales-list-item').css({'border-color':'#29aae1'});
    var status=parseInt($.getUrlParam('order_status'));
    if(status == 1){
        $('.func-btn').show().attr('id','batch-send').text('批量开始配送');
    }
    else if(status == 2){
        $('.func-btn').show().attr('id','batch-finish').text('批量完成订单');
    }
}).on('click','.print-order',function(){
    orderPrint($(this),'print'); //订单打印
}).on('click','.delete-order',function(){
    var $this=$(this);
    var parent=$this.parents('.list-item');
    var id=parent.data('id');
    var index=parent.index();
    var $box=$('.order_set_box');
    $box.modal('show').attr({'data-id':id,'data-target':index}).find('.modal-sure-btn').addClass('delete_check').removeClass('price_check mark_check');
    $box.find('.title').text('订单删除');
    $('#order_ser_val').val('').attr({'placeholder':'为防止误删除操作，请输入订单删除原因'});
}).on('click','.delete_check',function(){
    var $this=$(this);
    orderDelete();
}).on('click','.to-unstart',function(){
        var $this=$(this);
        orderEdit($this,'edit_status',1);
}).on('click','.to-send',function(){
    var $this=$(this);
    if(confirm('是否开始配送该订单？')){
        orderEdit($this,'edit_status',4);
    }
}).on('click','.to-finish',function(){
    var $this=$(this);
    if(confirm('是否完成该订单？')){
       orderEdit($this,'edit_status',5); 
    }
}).on('click','.send_person_list li',function(){
    var $this=$(this);
    var val=$this.data('id');
    if(confirm('是否选择该员工进行配送？')){
        orderEdit($this,'edit_SH2',val);
    }//员工修改
}).on('click','.order_mark',function(){
    var $this=$(this);
    var parent=$this.parents('.list-item');
    var id=parent.data('id');
    var index=parent.index();
    var $box=$('.order_set_box');
    $box.modal('show').attr({'data-id':id,'data-target':index}).find('.modal-sure-btn').addClass('mark_check').removeClass('price_check delete_check');
    $box.find('.title').text('订单备注');
    $('#order_ser_val').val('').attr({'placeholder':'请输入订单备注'});
}).on('click','.mark_check',function(){
    var $this=$(this);
    var val=$('#order_ser_val').val();
    orderEdit($this,'edit_remark',val);
}).on('click','.price_edit',function(){
    var $this=$(this);
    var parent=$this.parents('.list-item');
    var id=parent.data('id');
    var index=parent.index();
    var $box=$('.order_set_box');
    $box.modal('show').attr({'data-id':id,'data-target':index}).find('.modal-sure-btn').addClass('price_check').removeClass('mark_check delete_check');
    $box.find('.title').text('修改订单总价');
    $('#order_ser_val').val('').attr({'placeholder':'请输入要修改成的价格（总价）'});
}).on('click','.price_check',function(){
    var $this=$(this);
    var val=$('#order_ser_val').val();
    orderEdit($this,'edit_totalPrice',val);
}).on('click','#all-check',function(){
    var $this=$(this);
    $this.toggleClass('checked');
    $('.order-check').toggleClass('checked').toggleClass('order-checked');
}).on('click','.order-check',function(){
    var $this=$(this);
    $this.toggleClass('checked').toggleClass('order-checked');
}).on('click','#batch-send',function(){
    var $this=$(this);
    if(confirm('提示：批量配送订单将全部分配给默认配送员，您可以在批量配送后再到“配送中”的订单中单独指定配送员。\n是否批量开始配送该订单？')){
        orderEdit($this,'batch_edit_status',4);
    }
}).on('click','#batch-finish',function(){
    var $this=$(this);
    if(confirm('是否批量完成订单？')){
    orderEdit($this,'batch_edit_status',5); 
    }
}).on('click','#batch-print',function(){
    orderPrint($(this),'batch_print'); //订单打印
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
    	    getGoodsItem('/static/items/admin/order-goods-item.html?v=20150530');
    	    //员工列表item
    	    getStaffItem('/static/items/admin/order-staff-item.html?v=20150530');
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
        var send_time=item[i]['send_time'];
        var staff_remark=item[i]['staff_remark'];
        var status=item[i]['status'];
        var tip=item[i]['tip'];
        var today=item[i]['today'];
        var totalPrice=item[i]['totalPrice'];
        var type=item[i]['type'];
        var shop_new=item[i]['shop_new'];
        var del_reason=item[i]['del_reason'];
        var nickname=item[i]['nickname'];
        var customer_id=item[i]['customer_id'];
              
        if(!message) {
            $item.find('.order-message').hide();
        }
        if(!staff_remark) {
            $item.find('.staff-replay').hide();
        }
        if(!remark||remark==null) {
            $item.find('.saler-remark').hide();
        }
        if(isprint==1) {
            $item.find('.print-order').addClass('text-grey9');
        }
        if(shop_new!=1) {
            $item.find('.new').show();
        }
        $item.find('.name').text(nickname).attr('href','/admin/follower?action=filter&&order_by=time&&page=0&&wd='+customer_id);
        $item.find('.receiver').text(receiver);
        $item.attr({'data-id':id,'data-type':type});
        $item.find('.send-time').text(send_time);
        $item.find('.order-code').text(num);
        $item.find('.order-price').text(totalPrice);
        $item.find('.goods-total-charge').text(totalPrice);
        $item.find('.total_price_input').text(totalPrice);
        $item.find('.address_show').text(address_text);
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
        else {
            $item.find('.tips').hide();
        }
        //支付状态
        if(pay_type==2){ 
            $item.find('.pay-status').text('余额支付'); 
            $item.find('.price_edit').hide();
        } 
        else if(pay_type == 3){
            $item.find('.pay-status').text('在线支付'); 
            $item.find('.price_edit').hide();

        }
        else { 
            $item.find('.pay-status').text('货到付款'); 
        } 
        //订单状态
        if(status==0) {
            if(del_reason=null){
                $item.find('.order-status').empty().text('该订单已被用户取消').css({'line-height':'50px','color':'#44b549'});
            }
            else if(del_reason='timeout'){
                $item.find('.order-status').empty().text('该订单15分钟未支付，已自动取消').css({'line-height':'50px','color':'#44b549'});
            }
            else{
                $item.find('.order-status').empty().text('该订单已删除（原因：'+del_reason+'）').css({'line-height':'50px','color':'#44b549'});
            }
            $item.find('.unable_edit').show();
        }
        else if(status==-1) {
            $item.find('.status_unpaid').removeClass('hidden');
            $item.find('.able_edit').show();
        }
        else if(status==1) {
        	$item.find('.status_order').removeClass('hidden');
        	$item.find('.able_edit').show();
        	$item.find('.status-send').show();
        }
        else if(status==4) {
        	$item.find('.status_send').removeClass('hidden');
        	$item.find('.able_edit').show();
        	$item.find('.status-finish').show();
        }
        else if(status==5) {
        	$item.find('.status_finish').removeClass('hidden');
        	$item.find('.able_edit').show();
            $item.find('.current_sender').show();
            $item.find('.send_change').hide();
        }
        else if(status==6) {
        	$item.find('.status_comment').removeClass('hidden');
        	$item.find('.unable_edit').show();
        }
        else if(status==7) {
            $item.find('.status_comment').removeClass('hidden');
            $item.find('.auto_comment').show();
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
	      target.find('.sender-name').text(val['nickname']);
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

function orderPrint(target,action){
    var url=order_link;
    var action=action;
    var data={};
    var html=document.createElement("div"); 
    if(action =='print'){
        getData(target);
        var parent=target.parents('.order-list-item');
        var order_id=parent.attr('data-id');
        data.order_id=order_id;
    }
    else if(action =='batch_print'){
        var list=[];
        $('.order-checked').each(function(){
            var $this=$(this);
            var target=$this.parents('.order-list-item').find('.print-order');
            var order_id=$this.parents('.order-list-item').attr('data-id');
            getData(target);
            list.push(order_id);
        });
        if(list.length==0){
            return Tip('您还未选择任何订单！');
        }
        data.order_list_id=list;
    }
        //var OpenWindow = window.open("","","width=500,height=600");
        //OpenWindow.document.body.style.margin = "0";
        //OpenWindow.document.body.style.marginTop = "15px";
        //var box = OpenWindow.document.createElement('div');
        //OpenWindow.document.body.appendChild(box);
        //OpenWindow.document.close();
        var args={
            action:action,
            data:data
        };
        $.postJson(url,args,function(res){
                if(res.success){
                    target.addClass('text-grey9');
                    var inner=window.document.body.innerHTML;
                    window.document.body.innerHTML=html.innerHTML;
                    window.print();
                    window.document.body.innerHTML=inner;
                }
                else return Tip(res.error_text);
            },
            function(){return Tip('网络错误！')}
        );
        function getData(target){
            var parent=target.parents('.order-list-item');
            var order_id=parent.data('id');
            var order_num=parent.find('.order-code').text();
            var shop_name=$('#shop_name').text();
            var order_time=parent.find('.order-time').text();
            var delivery_time=parent.find('.send-time').text();
            var receiver=parent.find('.receiver').text();
            var address=parent.find('.address').first().text();
            var phone=parent.find('.phone').first().text();
            //var remark=parent.find('.message-content').first().text();
            var paid=parent.find('.pay-status').text();
            var totalPrice=parent.find('.goods-total-charge').text();
            var goods=parent.find('.goods-list')[0].innerHTML;
            var print_remark=$('.shop-receipt-info').val();
            var print_img=$('.shop-receipt-info').attr('data-img');
            var print_img_active=$('.shop-receipt-info').attr('data-active');
            var saler_remark=parent.find('.order_remark').text(); 
            var user_remark=parent.find('.message-content').text();

            $.getItem('/static/items/admin/order-print-page.html?v=20150530',function(data){
                var $item=$(data);
                $item.find('.notes-head').text(shop_name);
                $item.find('.orderId').text(order_num);
                $item.find('.orderTime').text(order_time);
                $item.find('.deliveryTime').text(delivery_time);
                $item.find('.address').text(address);
                $item.find('.receiver').text(receiver);
                $item.find('.phone').text(phone);
                $item.find('.totalPrice').text(totalPrice);
                $item.find('.goods-list')[0].innerHTML=goods;
                if(saler_remark) {$item.find('.saler-remark').show().find('.remark').text(saler_remark);}
                if(saler_remark=='null'){$item.find('.saler-remark').hide()}
                if(user_remark!='') {$item.find('.user-remark').show().find('.remark').text(user_remark);}
                if(user_remark=='null'){$item.find('.user-remark').hide()}
                if(print_remark) {$item.find('.extra-info-box').show().find('.print-remark').text(print_remark); }
                if(print_img_active == 1){
                     if(!print_img) {
                        $item.find('.shop-img').remove();
                    }
                    else {
                        $item.find('.shop-img img').attr({'src':print_img});
                    }
                }
               $item.find('.moneyPaid').text(paid);
               html.innerHTML+=$item[0].innerHTML;
        });
    }
}

function orderDelete(target){
    var url=order_link;
    var action='del_order';
    var $box=$('.order_set_box');
    var order_id=$box.attr('data-id');
    var index=$box.attr('data-target');
    var del_reason=$('#order_ser_val').val();
    if(!del_reason){
        return Tip('请输入订单删除的原因！');
    }
    if(del_reason.length>300){
        return Tip('删除原因最多可输入300字！');
    }
    var data={
        order_id:order_id,
        del_reason:del_reason
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                $('.order_set_box').modal('hide');
                $('.order-list-item').eq(index).remove();
            }
            else return Tip(res.error_text);
        },
        function(){return Tip('网络错误！')}
    )
}

function orderEdit(target,action,content){
    var url=order_link;
    var action=action;
    var parent;
    var regFloat=/^[0-9]+([.]{1}[0-9]{1,2})?$/;
    var data;
    var args;
    if(action=='edit_status'||action=='edit_SH2'){
        parent=target.parents('.order-list-item');	
    }
    else {
        parent=target.parents('.order_set_box');
    }
    if (parent){
        var order_id=parent.attr('data-id');
        data={order_id:order_id};
    }
    if(action=='edit_remark')
    {
	if(content.length>100) return Tip('订单备注请不要超过100个字！');
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
        if(!regFloat.test(content)) return Tip('订单总价只能为数字！');
        data.totalPrice=content;
        var index=parent.attr('data-target');
    }
    else if(action=='batch_edit_status'){
        var list=[];
        $('.order-checked').each(function(){
            var $this=$(this);
            var id =$this.parents('.order-list-item').attr('data-id');
            list.push(id);
        });
        if(list.length==0){
            return Tip('您还未选择任何订单！');
        }
        data.status=Int(content);
        data.order_list_id=list;
    }
    args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                if(action=='edit_remark'){
                    parent.modal('hide');
	       var $remark_box=$('.order-list-item').eq(index).find('.saler-remark');
             	       $remark_box.show().find('.order_remark').text(content);
                    $('.order-list-item').eq(index).find('.saler-remark').val(content);
                }else if(action=='edit_SH2'){
                   var code=target.find('.sender-code').text();
	      var name=target.find('.sender-name').text();
	      var phone=target.find('.sender-phone').text();
                   var $sender=parent.find('.order-sender');
                   var order_status=Int($.getUrlParam('order_status'));
                   if(order_status==1){
                        parent.find('.to-send').attr({'disabled':true}).text('配送中');
                   }
                   $sender.find('.sender-code').text(code);
	      $sender.find('.sender-name').text(name);
                   $sender.find('.sender-phone').text(phone);
                   parent.find('.status_send').removeClass('hidden');
  	      parent.find('.status_order').addClass('hidden');
                   parent.find('.status_finish').addClass('hidden');
                   parent.find('.status_word').text('配送中');
                   parent.find('.status-send').addClass('bg-blue').siblings().removeClass('bg-blue');
                }else if(action=='edit_status'){
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
                                        target.attr({'disabled':true}).text('配送中');
                                        parent.find('.check').removeClass('order-check');
		}
            	               else if(content==5) {
            			parent.find('.status_finish').removeClass('hidden');
              	             parent.find('.status_order').addClass('hidden');
            			parent.find('.status_send').addClass('hidden');
                                        target.attr({'disabled':true}).text('已完成');
                                        parent.find('.check').removeClass('order-check');
            		  }
                }else if(action=='batch_edit_status'){
                        if(content==4) {
                            $('.order-checked').each(function(){
                                var $this=$(this);
                                var $item =$this.parents('.order-list-item');
                                $item.find('.status_send').removeClass('hidden');
                                $item.find('.status_order').addClass('hidden');
                                $item.find('.status_finish').addClass('hidden');
                                $item.find('.to-send').attr({'disabled':true}).text('配送中');
                            });
                        }
                        else if(content==5) {
                             $('.order-checked').each(function(){
                                var $this=$(this);
                                var $item =$this.parents('.order-list-item');
                                $item.find('.status_finish').removeClass('hidden');
                                $item.find('.status_order').addClass('hidden');
                                $item.find('.status_send').addClass('hidden');
                                $item.find('.to-finish').attr({'disabled':true}).text('已完成');
                             });
                        }
                }else if(action=='edit_totalPrice'){
	      parent.modal('hide');
                   $('.order-list-item').eq(index).find('.order-price').text(content);
                }
            }
            else {
                return Tip(res.error_text);}
        },
        function(){return Tip('网络错误！')}
    )
}




