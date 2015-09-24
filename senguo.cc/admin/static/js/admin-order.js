$(document).ready(function(){
        //翻页
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
    for(var i=0;i<=120;i=Int(i)+5)//截止时间
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
            $.getItem('/static/items/admin/add-period-item.html?v=20150613',function(data){
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
                $('.add-period').empty().append($item).show();
            });
        }
        else return Tip('最多能添加20个时段！');
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
        var range = "";
        if(self_type==3){
            range=$('#endSelf').val().trim();
        }else{
            range=$('#stopRange').val().trim();
        }
        var regNumber=/^([1-9]\d*|[0]{1,1})$/;
        if(!regNumber.test(range)){
            return Tip('截止时间只能输入整数');
        }
        range=parseInt(range);
        if(range<0||range>360){
             return Tip('截止时间范围为0~360分钟');
        }
        if(self_type==3){
            stopRange($('#endSelf'),range);
        }else{
            stopRange($('#stopRange'),range);
        }
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
    //自提模式开启/关闭
    $(document).on('click','#stopSelf',function(){
        var $this=$(this);
        if(confirm('自提模式被关闭后用户下单时将不可选择该模式，确认要关闭自提模式吗？'))
        {
            orderTypeActive($this,'edit_self_on');
        }
    });
    $(document).on('click','#startSelf',function(){
        var $this=$(this);
        orderTypeActive($this,'edit_self_on');
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
    //实时请求未处理订单
    setInterval(function(){
        $.ajax({
            url:"/admin/order?order_type=1&order_status=1&page=0&action=realtime",
            type:"get",
            success:function(res){
                if(res.success){
                    var index = $(".order-type").children(".active").index();
                    $("#atonce").text(res.atonce);
                    $("#ontime").text(res.ontime);
                    $("#selfPoint").text(res.selfPoint);
                }
            }
        })
    },30000);

}).on("click","#new-order-box",function(){
   window.location.reload(true);
}).on("click",".send-day .btn",function(){
    var $this=$(this);
    $this.addClass("active").siblings(".btn").removeClass("active");
    var day=parseInt($this.attr("data-id"));
    var url="";
    var action="";
    if(self_type==3){
        action="edit_day_self";
    }else{
        action="edit_send_day";
    }
    var data={day:day};
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){

        }
        else return Tip(res.error_text);
    });
}).on("click",".order-export",function(){
    $(".order-export-box").modal("show");
}).on("click",".order-export-sure",function(){
    var $this=$(this);
    if($this.attr("data-flag")=="1"){
        return false
    }
    $this.attr({"data-flag":"1"});
    var status=$(".export-status").attr("data-id");
    var type=$(".export-type").attr("data-id");
    var pay=$(".export-pay").attr("data-id");
    var date1=$(".export-date1").val().trim();
    var date2=$(".export-date2").val().trim();
    var money1=$(".export-money1").val().trim();
    var money2=$(".export-money2").val().trim();
    var testNum = /^[0-9]\d*(\.\d+)?$/;
    if(!type){
        type = 9
    }
    if(!date1){
        return Tip("请选择起始时间");
    }
    if(!date2){
        return Tip("请选择截止时间");
    }
    if(date1>date2){
        return Tip("截止时间不能大于起始时间");
    }
    if(money1&&!testNum.test(money1)){
        return Tip("起始金额只能为数字");
    }
    if(money2&&!testNum.test(money2)){
        return Tip("截止金额只能为数字");
    }
    var data={
        order_type:type,
        order_status:status,
        order_pay:pay,
        date1:date1,
        date2:date2,
        money1:money1,
        money2:money2
    };
    var args={
        data:data
    };
    var url="/admin/orderExport?order_type="+type+"&order_status="+status+"&order_pay="+pay+"&date1="+date1+"&date2="+date2+"&money1="+money1+"&money2="+money2;
    window.open(url)
    $this.attr({"data-flag":""});
}).on('click','.condition-list2 li',function(){
    $(this).closest("ul").prev("button").children("em").html($(this).text()).attr("data-id",$(this).find('a').attr("data-id"));
}).on("click",".export-notice",function(){
    var $this=$(this);
     if($this.attr("data-flag")=="1"){
        $(".export-box").addClass("hide");
        $this.attr({"data-flag":""}).text("展开高级选项");
    }else{
        $(".export-box").removeClass("hide");
        $this.attr({"data-flag":"1"}).text("隐藏高级选项");
    } 
}).on("click","#self-money-sure",function(){
    var $this=$(this);
    if($this.attr("data-flag")=="1"){
        return false;
    }
    var url='';
    var action='edit_min_charge_self';
    var money=parseInt($("#self-money").val().trim());
    var testNum = /^[0-9]\d*(\.\d+)?$/;
    if(!testNum.test(money)){
        return Tip("金额只能为正整数");
    }
    var args={
        action:action,
        data:{min_charge_self:money}
    };
    $this.attr({"data-flag":"1"});
    $.postJson(url,args,function(res){
            if(res.success){
                $this.attr({"data-flag":""});
                $(".self-money-show").text(parseInt(money));
                var parent=$this.parents('.omg_item');
                parent.find('.show_item').show();
                parent.find('.edit_item').addClass('hidden');
                parent.find('.show_value').text(freight);
                parent.addClass('edit_item_box');
            }
            else {
                $this.attr({"data-flag":""});
                return Tip(res.error_text);
            }
        },
        function(){return Tip('网络好像不给力呢~ ( >O< ) ~！')}
    )
}).on("click","#self-freight-sure",function(){
    var $this=$(this);
    if($this.attr("data-flag")=="1"){
        return false;
    }
    var url='';
    var action='edit_freight_self';
    var money=parseInt($("#self-freight").val().trim());
    var testNum = /^[0-9]\d*(\.\d+)?$/;
    if(!testNum.test(money)){
        return Tip("金额只能为正整数");
    }
    var args={
        action:action,
        data:{freight_self:money}
    };
    $this.attr({"data-flag":"1"});
    $.postJson(url,args,function(res){
            if(res.success){
                $this.attr({"data-flag":""});
                $(".self-freight-show").text(parseInt(money));
                var parent=$this.parents('.omg_item');
                parent.find('.show_item').show();
                parent.find('.edit_item').addClass('hidden');
                parent.find('.show_value').text(freight);
                parent.addClass('edit_item_box');
            }
            else {
                $this.attr({"data-flag":""});
                return Tip(res.error_text);
            }
        },
        function(){return Tip('网络好像不给力呢~ ( >O< ) ~！')}
    )
});

var link='/admin/order';
var self_type = parseInt($.getUrlParam("order_type"));//自提判断
function addActive(target,id){
    for(var i=0;i<target.length;i++)
    {
        if(i+1==id)
            target.eq(i).addClass('active');
    }
}
function orderSearch(){
    var order_num=$('.search-con').val();
    if($.trim(order_num)==""){
        return Tip("请输入订单编号，收货人姓名或收货人电话");
    }
    var url='/admin/searchorder?action=order&&wd='+order_num;
    window.open(url);
}

function addEditPeriod(target,action){
    var url=link;
    var action = action;
    var parent;
    var period_id;
    var startTime;
    var endTime;
    var periodName;
    if(action=='add_period'){
        parent=target.parents('.add-period')
        if(self_type==3){
            action="add_self_period";
        }
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
    if(start_hour+':'+start_minute>=end_hour+':'+end_minute) return Tip('起始时间必须小于截止时间！');
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
    if(!name){return Tip('请输入时段名称！');}
    if(action=='edit_period') data.period_id=period_id;
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                if(action=='add_period' || action=='add_self_period'){
                    parent.empty().hide();
                    var item_url='/static/items/admin/send-period-item.html?v=20150613';
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
            else return Tip(res.error_text);
        },
    function(){return Tip('网络好像不给力呢~ ( >O< ) ~！')}
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
            else return Tip(res.error_text);
        },
        function(){return Tip('网络好像不给力呢~ ( >O< ) ~！')}
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
            else return Tip(res.error_text);
        },
        function(){return Tip('网络好像不给力呢~ ( >O< ) ~！')}
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
            else return Tip(res.error_text);
        },
        function(){return Tip('网络好像不给力呢~ ( >O< ) ~！')}
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
            else return Tip(res.error_text);
        },
        function(){return Tip('网络好像不给力呢~ ( >O< ) ~！')}
    )
}

function stopRange(target,range){
    var url='';
    var action="";
    if(self_type==3){
        action="edit_end_self";
    }else{
        action="edit_stop_range";
    }
    if(!range){range=0;}
    var args={
        action:action,
        data:{
            stop_range:range,
            end_self:range
        }
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
            else return Tip(res.error_text);
        },
        function(){return Tip('网络好像不给力呢~ ( >O< ) ~！')}
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
            else return Tip(res.error_text);
        },
        function(){return Tip('网络好像不给力呢~ ( >O< ) ~！')}
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
        return Tip('最低起送价请不要超过200元！');
    }
    if(intime_period==null) {
        intime_period=30;
    }
    if(!regNum.test(intime_period)){
        return Tip('立即送时间段只能填写数字！')
    }
    if(intime_period<0||intime_period>120){
        return Tip('立即送时间段只能设置为0~120！')
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
            else return Tip(res.error_text);
        },
        function(){return Tip('网络好像不给力呢~ ( >O< ) ~！')}
    )
}
