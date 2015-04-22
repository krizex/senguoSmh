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
    $(document).on('click','.add-new-time',function(){//添加显示
        var max=$('.time-list').find('.time-list-item').length;
        if(max<20) {
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
        else return alert('至多能添加20个时段！');
    });
    $(document).on('click','.add-time-period',function(){//添加确认
        var $this=$(this);
        addEditPeriod($this,'add_period');
    });
    $(document).on('click','.concel-time-period',function(){//添加取消
        $('.add-period').hide().empty();
    });
    //按时达配送时段删除
    $(document).on('click','.delete-time-period',function(){
        if(confirm('确认删除该时段吗？')){
            var $this=$(this);
            deletePeriod($this);
        }
    });
    //按时达配送时段编辑
    $(document).on('click','.to-edit',function(){
        var $this=$(this);
        var parent=$this.parents('.omg_item');
        parent.removeClass('edit_item_box');
        parent.find('.show_item').hide();
        parent.find('.edit').hide();
        parent.find('.delete').hide();
        parent.find('.edit_item').removeClass('hidden');
    });
    $(document).on('click','.edit-time-period',function(){
        var $this=$(this);
        var parent=$this.parents('.edit_item_box');
        parent.find('.delete').show();
        addEditPeriod($this,'edit_period');
        parent.find('.delete').hide();
    });
    //按时达配送时间段启用/停用
    $('.period-action').each(function(){
        var $this=$(this);
        var active=$this.attr('data-id');
        if(active==1) $this.find('.work-mode').show().siblings('.stop-mode').hide();
        else $this.find('.work-mode').hide().siblings('.stop-mode').show();
    });
    $(document).on('click','.period-action',function(){
        var $this=$(this);
        var active=$this.attr('data-id');
        activePeriod($this,active);
    });
    //按时达起送金额
    $('.sendMoney').on('click',function(){
        var $this=$(this);
        var money=$('#sendMoney').val();
        sendMoney($this,money);
    });
    //按时达下单截止时间
    $(document).on('click','.stopRange',function(){
        var range=$('#stopRange').text();
        stopRange($('#stopRange'),range);
    });
    //按时达配送费
    $(document).on('click','.sendfreight',function(){
        var freight=$('#freight_intime').val().trim();
        FreightOnTime($('#freight_intime'),freight);
    });
    //立即送模式开启/关闭
    $(document).on('click','#stopNowOn',function(){
        var $this=$(this);
        if(confirm('立即送模式被关闭后用户下单时将不可选择该模式，确认要关闭立即送模式吗？'))
        {
            orderTypeActive($this,'edit_now_on');
        }
    });
    $(document).on('click','#startNowOn',function(){
        var $this=$(this);
        orderTypeActive($this,'edit_now_on');
    });
    //按时达模式开启/关闭
    $(document).on('click','#stopOnTime',function(){
        var $this=$(this);
        if(confirm('按时达模式被关闭后用户下单时将不可选择该模式，确认要关闭按时达模式吗？'))
        {
            orderTypeActive($this,'edit_ontime_on');
        }

    });
    $(document).on('click','#startOnTime',function(){
        var $this=$(this);
        orderTypeActive($this,'edit_ontime_on');

    });
    //立即送设置
    $(document).on('click','#sendNowConfig',function(){SendNowConfig()});
    //商品列表下标
    $('.goods-list li').each(function(){
        var $this=$(this);
        var index=$this.index();
        $this.find('.code').text(index+1);
    });
    //订单搜索
    $(document).on('click','.order-search',function(){orderSearch()});
    $(document).on('keydown','.search-con',function(){
    	var $this=$(this);
    	if(window.event.keyCode == 13)
	{
	     orderSearch();
	}
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
    var order_num=Int($('.search-con').val());
    var url='/admin/searchorder?action=order&&id='+order_num;
    window.open(url);
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
    function(){return alert('网络好像不给力呢~ ( >O< ) ~！')}
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
        function(){return alert('网络好像不给力呢~ ( >O< ) ~！')}
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
                if(active==1) 
                    {
                        target.attr({'data-id':2}).find('.work-mode').hide().siblings('.stop-mode').show();
                    }
                else 
                    {
                        target.attr({'data-id':1}).find('.work-mode').show().siblings('.stop-mode').hide();
                    }
            }
            else return alert(res.error_text);
        },
        function(){return alert('网络好像不给力呢~ ( >O< ) ~！')}
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
        function(){return alert('网络好像不给力呢~ ( >O< ) ~！')}
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
        function(){return alert('网络好像不给力呢~ ( >O< ) ~！')}
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
        function(){return alert('网络好像不给力呢~ ( >O< ) ~！')}
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
        function(){return alert('网络好像不给力呢~ ( >O< ) ~！')}
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
    var intime_period=Int($('#sendNowPeriod').val());
    var regNum=/^[0-9]*$/;
    if(min_charge_now==null||min_charge_now=='') {
        min_charge_now=0;
    }
    if(freight_now==null||freight_now=='') {
        freight_now=0;
    }
    if(min_charge_now>200){
        return alert('最低起送价请不要超过200元!');
    }
    if(intime_period==null) {
        intime_period=30;
    }
    if(!regNum.test(intime_period)){
        return alert('立即送时间段只能填写数字 ！')
    }
    if(intime_period<0||intime_period>120){
        return alert('立即送时间段只能设置为0~120 ！')
    }
    var args={
        action:action,
        data:{
            start_hour:start_hour,
            start_minute:start_minute,
            end_hour:end_hour,
            end_minute:end_minute,
            min_charge_now:min_charge_now,
            freight_now:freight_now,
            intime_period:intime_period
        }
    };
    $.postJson(url,args,function(res){
            if(res.success){
                $('.sendNowBox').modal('hide');
            }
            else return alert(res.error_text);
        },
        function(){return alert('网络好像不给力呢~ ( >O< ) ~！')}
    )
}
