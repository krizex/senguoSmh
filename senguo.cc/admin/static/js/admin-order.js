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
        $('.add-period').show();
    });
    $('.concel-time-period').on('click',function(){
        $('.add-period').hide();
    });
    //按时达配送时段删除
    $('.delete-time-period').on('click',function(){
        var $this=$(this);
        deletePeriod($this);
    });
    //按时达配送时段编辑
    $('.edit-time-period').on('click',function(){
        var $this=$(this);
        addEditPeriod($this,'edit_period');
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
    if(action=='edit_period') data.period_id=period_id;
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