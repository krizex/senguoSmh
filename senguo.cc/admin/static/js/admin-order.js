$(document).ready(function(){
    $('body').on('mouseenter','.edit_item_box',function(){
        var $this=$(this);
        if($this.hasClass('to-edit-item')){
            $this.find('.edit').show();
            $this.find('.delete').show();
            $this.removeClass('to-edit-item');
        }});
    $('body').on('mouseleave','.edit_item_box',function(){
        var $this=$(this);
        $this.find('.edit').hide();
        $this.find('.delete').hide();
        $this.addClass('to-edit-item');
    });
    $('.send-person-area li').first().addClass('active');
    //订单状态数据显示
    var order_item=$('.order-list-item');
    order_item.each(function(){
       var $this=$(this);
       var type=$this.data('type');
       var status_item=$this.find('.order-status');
       var ordered=$this.find('.status_order');
       var sended=$this.find('.status_send');
       var finished=$this.find('.status_finish');
       var tip=$this.find('.tips');
       var edit=$this.find('.edit-btn');
       var check=$this.find('.check-btn');
       var select=$this.find('.select-btn');
       var pay=$this.find('.pay-status');
       var paid=pay.data('pay');
       var $status=status_item.data('id');
       var $word=$this.find('.status_word');
       var $s_order=$this.find('.status-order');
       var $s_send=$this.find('.status-send');
       var $s_finish=$this.find('.status-finish');
       var $sh2_id=$this.find('#sh2_id').val();
       var $send_item=$this.find('.send_item');
       var $remark_box=$this.find('.saler-remark');
       var $remark=$this.find('.order_remark');
       var $able_edit=$this.find('.able_edit');
       var $unable_edit=$this.find('.unable_edit');
       for(var i=0;i<$send_item.length;i++){
          var id=$send_item.eq(i).attr('data-id');
          if(id==$sh2_id) $send_item.eq(i).addClass('bg-blue');
		
        }
        //订单状态
        if($status==1){
            ordered.removeClass('hidden');
            $word.text('未处理');
            $s_order.addClass('bg-blue');
	    $able_edit.show();
        }
       else if($status==4)
        {
            status_item.addClass('order-status-dealing');
            sended.removeClass('hidden');
	    $word.text('配送中');
            $s_send.addClass('bg-blue');
	    $able_edit.show();
        }
        else if($status==5)
        {
            finished.removeClass('hidden');
            status_item.addClass('order-status-dealing');
	    $word.text('已完成');
            $s_finish.addClass('bg-blue');
	    $able_edit.show();  
        }
	 else if($status==6)
        {
            finished.removeClass('hidden');
            status_item.addClass('order-status-dealing');
	    $word.text('已完成');
            $s_finish.addClass('bg-blue');
	    $unable_edit.show();  
        }
        //立即送消费显示
        if(type==1) tip.removeClass('hidden');
        //支付状态
        if(paid=='True'){
            pay.text('余额支付');
        }
	if($remark.text()!=='None'&&$remark.text()!=='') $remark_box.show();
    });
    //导航栏active样式
    var order_type_item=$('.order-type').find('li');
    var order_status_item=$('.order-status').find('li');
    addActive(order_type_item,orderType);
    addActive(order_status_item,orderStatus);
    //时间格式
    $('.timer').each(function(){
        var $this=$(this);
        var time=$this.text();
        $this.text(checkTime(time));
    });
    //时间选项
    for(var i=0;i<=23;i++)
    {
        if(i<=9) i='0'+i;
        $('.hour-list').append('<li>'+i+'</li>');
    }
    for(var i=0;i<=59;i++)
    {
        if(i<=9) i='0'+i;
        $('.minute-list').append('<li>'+i+'</li>');
    }
    for(var i=0;i<=60;i=Int(i)+5)//截止时间
    {
        if(i<9) i='0'+i;
        $('.stop-minute-list').append('<li>'+i+'</li>');
    }
    $('body').on('click','.choose-list li',function(){
        var $this=$(this);
        var time=$this.text();
        $this.parents('.input-group-btn').find('.time').text(time);
    });
    //按时达配送时段添加
    $('.add-new-time').on('click',function(){//添加显示
        var max=$('.time-list').find('.time-list-item').length;
        if(max<5) {
            $.getItem('/static/items/admin/add-period-item.html?v=2015-0211',function(data){
                var $item=$(data);
                for(var i=0;i<=23;i++)
                {
                    if(i<=9) i='0'+i;
                    $item.find('.hour-list').append('<li>'+i+'</li>');
                }
                for(var i=0;i<=59;i++)
                {
                    if(i<=9) i='0'+i;
                    $item.find('.minute-list').append('<li>'+i+'</li>');
                }
                $('.add-period').append($item).show();
            });


        }
        else return alert('至多能添加五个时段！');
    });
    $('body').on('click','.add-time-period',function(){//添加确认
        var $this=$(this);
        addEditPeriod($this,'add_period');
    });
    $('body').on('click','.concel-time-period',function(){//添加取消
        $('.add-period').hide().empty();
    });
    //按时达配送时段删除
    $('body').on('click','.delete-time-period',function(){
        if(confirm('确认删除该时段吗？')){
            var $this=$(this);
            deletePeriod($this);
        }
    });
    //按时达配送时段编辑
    $('body').on('click','.to-edit',function(){
        var $this=$(this);
        var parent=$this.parents('.omg_item');
        parent.removeClass('edit_item_box');
        parent.find('.show_item').hide();
        parent.find('.edit').hide();
        parent.find('.delete').hide();
        parent.find('.edit_item').removeClass('hidden');
    });
    $('body').on('click','.edit-time-period',function(){
        var $this=$(this);
        var parent=$this.parents('.edit_item_box');
        parent.find('.delete').show();
        addEditPeriod($this,'edit_period');
        parent.find('.delete').hide();
    });
    //按时达配送时间段启用/停用
    $('.period-action').each(function(){
        var $this=$(this);
        var active=$this.data('id');
        if(active==1) $this.find('.work-mode').show().siblings('.stop-mode').hide();
        else $this.find('.work-mode').hide().siblings('.stop-mode').show();
    });
    $('body').on('click','.period-action',function(){
        var $this=$(this);
        var active=$this.data('id');
        activePeriod($this,active);
    });
    //按时达起送金额
    $('.sendMoney').on('click',function(){
        var $this=$(this);
        var money=$('#sendMoney').val();
        sendMoney($this,money);
    });
    //按时达下单截止时间
    $('.stopRange').on('click',function(){
        var range=$('#stopRange').text();
        stopRange($('#stopRange'),range);
    });
    //按时达配送费
    $('.sendfreight').on('click',function(){
        var freight=$('#freight_intime').val().trim();
        FreightOnTime($('#freight_intime'),freight);
    });
    //立即送模式开启/关闭
    $('#stopNowOn').on('click',function(){
        var $this=$(this);
        if(confirm('立即送模式被关闭后用户下单时将不可选择该模式，确认要关闭立即送模式吗？'))
        {
            orderTypeActive($this,'edit_now_on');
        }
    });
    $('#startNowOn').on('click',function(){
        var $this=$(this);
        orderTypeActive($this,'edit_now_on');
    });
    //按时达模式开启/关闭
    $('#stopOnTime').on('click',function(){
        var $this=$(this);
        if(confirm('按时达模式被关闭后用户下单时将不可选择该模式，确认要关闭按时达模式吗？'))
        {
            orderTypeActive($this,'edit_ontime_on');
        }

    });
    $('#startOnTime').on('click',function(){
        var $this=$(this);
        orderTypeActive($this,'edit_ontime_on');

    });
    //立即送设置
    $('#sendNowConfig').on('click',function(){SendNowConfig()});
    //商品列表下标
    $('.goods-list li').each(function(){
        var $this=$(this);
        var index=$this.index();
        $this.find('.code').text(index+1);
    });
    //商品件数统计
    $('.custom-order').each(function(){
        var item=$(this).find('.item').find('.goods-number');
        var count=$(this).find('.goods-total-number');
        var num=0;
        var number;
        for(var j=0;j<item.length;j++)
        {

            number=Int(item.eq(j).text());
            num+=number;
            count.text(num);
        }
    });
    toggle('.order-content','.list-item-body');
    toggle('.list-title','.list-item-body');
    $('.avilible_item').on('mouseenter',function(){$(this).find('.edit-btn').show();});
    $('.avilible_item').on('mouseleave',function(){$(this).find('.edit-btn').hide();});
    //订单总金额修改
    $('.price_edit').on('click',function(){
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
    $('.order_mark').on('click',function(){
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
    //订单状态修改
    $('.status-order').on('click',function(){
        var $this=$(this);
        orderEdit($this,'edit_status',1);
        var item=$this.parents('edit_avilible');
        item.addClass('avilible_item');
    });
    $('.status-send').on('click',function(){
        var $this=$(this);
        orderEdit($this,'edit_status',4);
        var item=$this.parents('edit_avilible');
        item.addClass('avilible_item');
    });
    $('.status-finish').on('click',function(){
        var $this=$(this);
        orderEdit($this,'edit_status',5);
        var item=$this.parents('edit_avilible');
        item.addClass('avilible_item');
    });
    //员工修改
    $('.send_person_list li').on('click',function(){
        var $this=$(this);
        var val=$this.data('id');
        orderEdit($this,'edit_SH2',val)
    });
    //订单搜索
    $('.order-search').on('click',function(){orderSearch()});
    //订单打印
    $('.print-order').each(function(){
        var $this=$(this);
        var printed=$this.data('id');
        if(printed=='True') $this.addClass('text-grey9');
        //订单是否已被打印
        $this.on('click',function(){
            orderPrint($this);
        });
    });
    //订单删除
    $('.delete-order').on('click',function(){
        if(confirm('确认删除该订单吗？')){orderDelete($(this));}

    });
});
var link='/admin/order';
var orderType=$.getUrlParam('order_type');
var orderStatus=$.getUrlParam('order_status');

function addActive(target,id){
    for(var i=0;i<target.length;i++)
    {
        if(i+1==id)
            target.eq(i).addClass('active');
    }
}

function orderSearch(){
    var order_id=Int($('.search-con').val());
    var url='order?order_type=10&order_status='+order_id;
    $.getItem(url,function(){
        window.location.href=url;
    })

}

function orderPrint(target){
    var url='';
    var action='print';
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
                }
                else return alert(res.error_text);
            },
            function(){return alert('网络错误！')}
        )
    })
}
function orderDelete(target){
    var url='';
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


function addEditPeriod(target,action){
    var url=link;
    var action=action;
    var parent;
    var period_id;
    var startTime;
    var endTime;
    var periodName;
    if(action=='add_period'){
        parent=target.parents('.add-period')
    }
    else if(action=='edit_period'){
        parent=target.parents('.time-list-item');
        period_id=target.parents('.time-list-item').data('id');
        startTime=parent.find('.startTime');
        endTime=parent.find('.EndTime');
        periodName=parent.find('.periodName');
    }
    var start_hour=parent.find('.start-hour').text();
    var start_minute=parent.find('.start-minute').text();
    var end_hour=parent.find('.end-hour').text();
    var end_minute=parent.find('.end-minute').text();
    var name=parent.find('.period-name').val();
    if(start_hour+':'+start_minute>=end_hour+':'+end_minute) return alert('起始时间必须小于截止时间！');
    start_hour=Int(start_hour);
    start_minute=Int(start_minute);
    end_hour=Int(end_hour);
    end_minute=Int(end_minute);
    var data={
        start_hour:start_hour,
        start_minute:start_minute,
        end_hour:end_hour,
        end_minute:end_minute,
        name:name
    };
    if(!name){return alert('请输入时段名称！')}
    if(action=='edit_period') data.period_id=period_id;
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                if(action=='add_period'){
                    parent.empty().hide();
                    var item_url='/static/items/admin/send-period-item.html?v=2015-0119';
                    $.getItem(item_url,function(data){
                        var $item=$(data);
                        $item.attr({'data-id':res.period_id});
                        $item.find('.startTime').text(checkTime(start_hour)+':'+checkTime(start_minute)+':00');
                        $item.find('.start-hour').text(checkTime(start_hour));
                        $item.find('.start-minute').text(checkTime(start_minute));
                        $item.find('.EndTime').text(checkTime(end_hour)+':'+checkTime(end_minute)+':00');
                        $item.find('.end-hour').text(checkTime(end_hour));
                        $item.find('.end-minute').text(checkTime(end_minute));
                        $item.find('.periodName').text(name);
                        $item.find('.period-name').val(name);
                        for(var i=0;i<=23;i++)
                        {
                            $item.find('.hour-list').append('<li>'+checkTime(i)+'</li>');
                        }
                        for(var i=0;i<=59;i++)
                        {
                            $item.find('.minute-list').append('<li>'+checkTime(i)+'</li>');
                        }
                        $('.time-list').append($item);
                    });

                }
                else if(action=='edit_period'){
                    startTime.text(checkTime(start_hour)+':'+checkTime(start_minute)+':00');
                    endTime.text(checkTime(end_hour)+':'+checkTime(end_minute)+':00');
                    periodName.text(name);
                    parent.find('.show_item').show();
                    parent.find('.edit_item').addClass('hidden');
                    parent.addClass('edit_item_box');

                }
            }
            else return alert(res.error_text);
        },
    function(){return alert('网络错误！')}
    )
}

function deletePeriod(target){
    var url=link;
    var action='del_period';
    var parent=target.parents('.time-list-item');
    var period_id=parent.data('id');
    var data={
        period_id:period_id
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

function activePeriod(target,active){
    var url=link;
    var action='edit_period_active';
    var parent=target.parents('.time-list-item');
    var period_id=parent.data('id');
    var data={
        period_id:period_id
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                if(active==1) target.find('.work-mode').hide().siblings('.stop-mode').show();
                else target.find('.work-mode').show().siblings('.stop-mode').hide();
            }
            else return alert(res.error_text);
        },
        function(){return alert('网络错误！')}
    )
}

function orderTypeActive(target,action){
    var url='';
    var action=action;
    var args={
        action:action,
        data:{}
    };
    $.postJson(url,args,function(res){
            if(res.success){
              window.location.reload();
            }
            else return alert(res.error_text);
        },
        function(){return alert('网络错误！')}
    )
}

function sendMoney(target,money){
    var url='';
    var action='edit_min_charge_on_time';
    var args={
        action:action,
        data:{min_charge_on_time:money}
    };
    $.postJson(url,args,function(res){
            if(res.success){
                var parent=target.parents('.omg_item');
                target.val(money);
                parent.find('.show_item').show();
                parent.find('.edit_item').addClass('hidden');
                parent.find('.show_value').text(money);
                parent.addClass('edit_item_box');
            }
            else return alert(res.error_text);
        },
        function(){return alert('网络错误！')}
    )
}

function stopRange(target,range){
    var url='';
    var action='edit_stop_range';
    if(!range){range=0;}
    var args={
        action:action,
        data:{stop_range:range}
    };
    $.postJson(url,args,function(res){
            if(res.success){
                var parent=target.parents('.omg_item');
                target.text(range);
                parent.find('.show_item').show();
                parent.find('.edit_item').addClass('hidden');
                parent.find('.show_value').text(range);
                parent.addClass('edit_item_box');
            }
            else return alert(res.error_text);
        },
        function(){return alert('网络错误！')}
    )
}

function FreightOnTime(target,freight){
    var url='';
    var action='edit_freight_on_time';
    if(!freight){freight=0;}
    var args={
        action:action,
        data:{freight_on_time:freight}
    };
    $.postJson(url,args,function(res){
            if(res.success){
                var parent=target.parents('.omg_item');
                target.text(freight);
                parent.find('.show_item').show();
                parent.find('.edit_item').addClass('hidden');
                parent.find('.show_value').text(freight);
                parent.addClass('edit_item_box');
            }
            else return alert(res.error_text);
        },
        function(){return alert('网络错误！')}
    )
}

function SendNowConfig(){
    var url='';
    var action='edit_now_config';
    var min_charge_now=Int($('#sendNowMoney').val());
    var freight_now=Int($('#freight_now').val());
    var start_hour=Int($('#NowStartHour').text());
    var start_minute=Int($('#NowStartMinute').text());
    var end_hour=Int($('#NowEndHour').text());
    var end_minute=Int($('#NowEndMinute').text());
    if(min_charge_now==null||min_charge_now=='') min_charge_now=0;
    if(freight_now==null||freight_now=='') freight_now=0;
    if(min_charge_now>200){return alert('最低起送价请不要超过200元!')}
    var args={
        action:action,
        data:{
            start_hour:start_hour,
            start_minute:start_minute,
            end_hour:end_hour,
            end_minute:end_minute,
            min_charge_now:min_charge_now,
            freight_now:freight_now
        }
    };
    $.postJson(url,args,function(res){
            if(res.success){
                $('.sendNowBox').modal('hide');
            }
            else return alert(res.error_text);
        },
        function(){return alert('网络错误！')}
    )
}

function orderEdit(target,action,content){
    var url='';
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
                }
                else if(action=='edit_SH2')
                {
                   var code=target.find('.sender-code').text();
		   var name=target.find('.sender-name').text();
		   var phone=target.find('.sender-phone').text();
                   var $sender=parent.find('.order_sender');
                   $sender.find('.sender-code').text(code);
		   $sender.find('.sender-name').text(name);
                   $sender.find('.sender-phone').text(phone);
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
