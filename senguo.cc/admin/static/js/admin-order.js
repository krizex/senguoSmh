$(document).ready(function(){
    //导航栏active样式
    var order_type_item=$('.order-type').find('li');
    var order_status_item=$('.order-status').find('li');
    addActive(order_type_item,orderType);
    addActive(order_status_item,orderStatus);
    //时间选项
    for(var i=0;i<=23;i++)
    {
        $('.hour-list').append('<li>'+i+'</li>');
    }
    for(var i=0;i<=59;i++)
    {
        $('.minute-list').append('<li>'+i+'</li>');
    }
    $('.choose-list li').on('click',function(){
        var $this=$(this);
        var time=$this.text();
        $this.parents('.input-group-btn').find('.time').text(time);
    });
    //按时达配送时段添加
    $('.add-time-period').on('click',function(){
        var $this=$(this);
       addEditPeriod($this,'add_period');
    });
    $('.add-new-time').on('click',function(){
        var max=$('.time-list').find('.time-list-item').length;
        if(max<5) $('.add-period').show();
        else return alert('至多能添加五个时段！');
    });
    $('.concel-time-period').on('click',function(){
        $('.add-period').hide();
    });
    //按时达配送时段删除
    $('body').on('click','.delete-time-period',function(){
        var $this=$(this);
        deletePeriod($this);
    });
    //按时达配送时段编辑
    $('body').on('click','.to-edit-period',function(){
        var $this=$(this);
        var parent=$this.parents('.time-period');
        parent.find('.show_item').hide();
        parent.find('.edit_item').removeClass('hidden');
    });
    $('body').on('click','.edit-time-period',function(){
        var $this=$(this);
        addEditPeriod($this,'edit_period');
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

    //配送模式开启/关闭
    $('#stopNowOn').on('click',function(){
        var $this=$(this);
        orderTypeActive($this,'edit_now_on');
    });
    $('#stopInTime').on('click',function(){
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
        var goods_item=$(this).find('.item');
        var count=$(this).find('.goods-total-number');
        for(var j=0;j<goods_item.length;j++)
        {
            console.log(j);
            var num=0;
            var number=Int(goods_item.eq(j).find('.goods-number').text());
            num+=number;
            count.text(num);
        }
    });
    $('.arrow-down').click(function(){
        $(this).parents('.list-item').find('.list-item-body').slideDown(100);
        $(this).hide().siblings('.arrow-up').show();
        $(this).parents('.list-item').siblings('.list-item').find('.list-item-body').slideUp(100).siblings().find('.arrow-up').hide().siblings('.arrow-down').show();
        $('.sales-list-item').css({'border-color':'#29aae1'});
    });
    $('.arrow-up').click(function(){
        $(this).parents('.list-item').find('.list-item-body').slideUp(100);
        $(this).hide().siblings('.arrow-down').show();
        $('.sales-list-item').css({'border-color':'#ddd'});
    });
    $('.order-list-item').hover(
        function(){$(this).find('.edit-btn').show();},
        function(){$(this).find('.edit-btn').hide();}
    );
    //订单总金额修改
    $('.price_edit').on('click',function(){
        var $this=$(this);
        var parent=$this.parents('.custom-order');
        $this.hide().siblings('.price_check').show();
        parent.find('.price-input').show().siblings('.price-show').hide();
    });
    $('.price_check').on('click',function(){
        var $this=$(this);
        var parent=$this.parents('.custom-order');
        var val=parent.find('.price-input').val();
        orderEdit($this,'edit_totalPrice',val)
    });

    //订单备注
    $('.notice_input').on('focus',function(){
        var $this=$(this);
        $this.siblings('.notice_check').show();
    });
    $('.notice_check').on('click',function(){
        var $this=$(this);
        var parent=$this.parents('.custom-order');
        var val=parent.find('.notice_input').val();
        orderEdit($this,'edit_remark',val)
    });
    //订单状态修改
    $('.status_edit').on('click',function(){
        var $this=$(this);
        var parent=$this.parents('.order-status');
        $this.hide().siblings('.status_check').show();
        parent.addClass('order-status-dealing');
        parent.find('.status-item').removeClass('hidden');
        parent.find('.status-info').css({'left':'+=20px'});
    });
    $('.status_check').on('click',function(){window.location.reload();});
    $('.status-order').on('click',function(){
        orderEdit($(this),'edit_status',1)
    });
    $('.status-send').on('click',function(){
        orderEdit($(this),'edit_status',4)
    });
    $('.status-finish').on('click',function(){
        orderEdit($(this),'edit_status',5)
    });
    //员工修改
    $('.staff-edit').on('click',function(){
        var $this=$(this);
        var val=$this.parents('.send-person-area-select').find('.send-person-area').find('.active');
        orderEdit($this,'edit_JH',val)
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

function addEditPeriod(target,action){
    var url=link;
    var action=action;
    var parent;
    var period_id;
    if(action=='add_period'){
        parent=target.parents('.add-period')
    }
    else if(action=='edit_period'){
        parent=target.parents('.time-period');
        period_id=target.parents('.time-period').data('id');
        var startTime=parent.find('.startTime');
        var endTime=parent.find('.endTime');
        var periodName=parent.find('.periodName');
    }
    var start_hour=parseInt(parent.find('.start-hour').text());
    var start_minute=parseInt(parent.find('.start-minute').text());
    var end_hour=parseInt(parent.find('.end-hour').text());
    var end_minute=parseInt(parent.find('.end-minute').text());
    var name=parent.find('.period-name').val();
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
                    parent.remove();
                    var $item=$(' <li class="time-list-item set-width-float time-period" data-id=""><div class="staff-work-mode action-mode pull-left"><a class="work-mode" href="javascript:;">已启用</a><a class="stop-mode" href="javascript:;" style="display:none">未启用</a></div><span class="time1 text-black show_item pull-left startTime"></span><div class="edit_item hidden"><div class="input-group-btn pull-left"><button type="button" class="btn dropdown-toggle" data-toggle="dropdown"><span class="time start-hour"></span><span class="caret"></span></button><ul class="dropdown-menu choose-list hour-list" role="menu"></ul></div><span class="pull-left tit">：</span><div class="input-group-btn pull-left"><button type="button" class="btn dropdown-toggle" data-toggle="dropdown"><span class="time start-minute"></span><span class="caret"></span></button><ul class="dropdown-menu choose-list minute-list" role="menu"></ul></div></div><span class="pull-left to">至</span><span class="time2 text-black show_item pull-left EndTime"></span><div class="edit_item hidden"><div class="input-group-btn pull-left"><button type="button" class="btn dropdown-toggle" data-toggle="dropdown"><span class="time end-hour"></span><span class="caret"></span></button><ul class="dropdown-menu choose-list hour-list" role="menu"></ul></div><span class="pull-left tit">：</span><div class="input-group-btn"><button type="button" class="btn dropdown-toggle" data-toggle="dropdown"><span class="time end-minute"></span><span class="caret"></span></button><ul class="dropdown-menu choose-list minute-list" role="menu"></ul></div></div><span class="time show_item periodName"></span><input type="text" class="period-name  pull-left text-center edit_item hidden" value=""/><a href="javascript:;" class="delete pull-right set-inl-blo delete-time-period"></a><a href="javascript:;" class="edit pull-right set-inl-blo to-edit-period show_item"></a><a href="javascript:;" class="sure-btn pull-right edit_item hidden edit-time-period">&nbsp;</a></li>');
                    $item.attr({'data-id':res.period_id});
                    $item.find('.startTime').text(start_hour+':'+start_minute+':00');
                    $item.find('.start-hour').text(start_hour);
                    $item.find('.start-minute').text(start_minute);
                    $item.find('.EndTime').text(end_hour+':'+end_minute+':00');
                    $item.find('.end-hour').text(end_hour);
                    $item.find('.end-minute').text(end_minute);
                    $item.find('.periodName').text(name);
                    $item.find('.period-name').val(name);
                    for(var i=0;i<=23;i++)
                    {
                        $item.find('.hour-list').append('<li>'+i+'</li>');
                    }
                    for(var i=0;i<=59;i++)
                    {
                        $item.find('.minute-list').append('<li>'+i+'</li>');
                    }
                    $('.time-list').append($item);
                }
                else {
                    console.log(name);
                    startTime.text(start_hour+':'+start_minute+':00');
                    endTime.text(end_hour+':'+end_minute+':00');
                    periodName.text(name);
                    parent.find('.show_item').show();
                    parent.find('.edit_item').addClass('hidden');
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
    var parent=target.parents('.time-period');
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
                target.val(money);
            }
            else return alert(res.error_text);
        },
        function(){return alert('网络错误！')}
    )
}

function stopRange(target,range){
    var url='';
    var action='edit_stop_range';
    var args={
        action:action,
        data:{stop_range:range}
    };
    $.postJson(url,args,function(res){
            if(res.success){
                target.text(range);
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
    var start_hour=Int($('#NowStartHour').text());
    var start_minute=Int($('#NowStartMinute').text());
    var end_hour=Int($('#NowEndHour').text());
    var end_minute=Int($('#NowEndMinute').text());
    if(min_charge_now>200){return alert('最低起送价请不要超过200元!')}
    var args={
        action:action,
        data:{
            start_hour:start_hour,
            start_minute:start_minute,
            end_hour:end_hour,
            end_minute:end_minute,
            min_charge_now:min_charge_now
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
    var parent=target.parents('.order-list-item');
    var order_id=parent.data('id');
    var data={order_id:order_id};
    var args;
    if(action=='edit_remark')
    {
        data.remark=content;
    }
    else if(action=='edit_SH1')
    {
        data.staff_id=Int(content);
    }
    else if(action=='edit_status')
    {
        data.status=Int(content);
    }
    else if(action=='edit_totalPrice')
    {
        data.totalPrice=Int(content);
    }
    args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                if(action=='edit_remark')
                {
                    target.hide();
                }
                else if(action=='edit_SH1')
                {

                }
                else if(action=='edit_status')
                {
                    window.location.reload();
                }
                else if(action=='edit_totalPrice')
                {
                    target.hide().siblings('.price_edit').show();
                    parent.find('.price-show').show().text(content).siblings('.price-input').hide();
                    parent.find('.order-price').text(content);
                }
            }
            else return alert(res.error_text);
        },
        function(){return alert('网络错误！')}
    )
}