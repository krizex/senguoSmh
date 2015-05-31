$(document).ready(function(){
    //订单完成
    $(document).on('click','.order_finish',function(){
        var $this=$(this);
        var id=$this.data('id');
        finishOrder($this,id);
    });
    //订单状态
    $('.status').each(function(){
        var $this=$(this);
        var text=Int($this.data('id'));
        statusText($this,text);
    });
    //if the order has been paid
    $('.money_paid').each(function(){
        var $this=$(this);
        var paid=$this.attr('data-pay');
        if(paid=='True') $this.find('.paid').show();
        else if(paid=='False') $this.find('.unpay').show();
    });
    //订单详情
    //hidden info toggle
        var u = navigator.userAgent, app = navigator.appVersion;
        var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
         if(isiOS){
            $(document).on('tap','.toggle',function(e){
                    var $this=$(this);
                    if($(e.target).closest('.forbid_click').length == 0){
                        $this.parents('.order-list-item').find('.goods_info').toggle();
                    }
                });
        }
        else{
                 $(document).on('click','.toggle',function(e){
                    var $this=$(this);
                    if($(e.target).closest('.forbid_click').length == 0){
                        $this.parents('.order-list-item').find('.goods_info').toggle();
                    }
                });
        }

    //if staff remark exist
    $('.remark').each(function(){
        var $this=$(this);
        var con=$this.text();
        if(con!=''&&con!='None') $this.parents('.s_remark_box').show();
    });
    //订单备注
    var order_id;
    $(document).on('click','.staff_remark',function(){
        var $this=$(this);
        order_id=$this.data('id');
        var index=$this.parents('.order-list-item').index();
        console.log(index);
        $('.remark-input').empty();
        var remark_box=new Modal('remark_box');
        remark_box.modal('show');
        $('#remark_box').attr({'data-id':index});
    });
    $(document).on('click','.remark_submit',function(){
        var index=$('.remark-box').attr('data-id');
        remarkSub(order_id,index);
    });
    //送货时间
    $('.order-list-item').each(function(){
        var $this=$(this);
        var create_time=$this.find('.create_time').val();
        var create_year=$this.find('.create_year').val();
        var create_month=checkTime($this.find('.create_month').val());
        var create_day=checkTime($this.find('.create_day').val());
        var type=$this.find('.send_type').val();
        var day=$this.find('.send_day').val();
        var start_hour=checkTime($this.find('.start_hour').val());
        var start_minute=checkTime($this.find('.start_minute').val());
        var end_hour=checkTime($this.find('.end_hour').val());
        var end_minute=checkTime($this.find('.end_minute').val());
        var status=$this.data('status');
        // $this.find('.send_time').text(start_hour+':'+start_minute+'-'+end_hour+':'+end_minute);
        if(status==5) $this.addClass('text-grey bg-grey').find('.toggle').addClass('text-grey').find('.finish_btn').removeClass('order_finish').addClass('arrive').text('已完成');
        // if(type==1){
        //     $this.find('.send_date').text(create_year+'-'+create_month+'-'+create_day);
        // }
        // else if(type==2&&day==1){
        //     $this.find('.send_date').text(create_year+'-'+create_month+'-'+create_day);
        // }
        // else if(type==2&&day==2){
        //     $this.find('.send_date').text(create_year+'-'+create_month+'-'+(create_day+1));
        // }  
    });
});
function statusText(target,n){
    switch (n){
        case 1:target.text('未处理').addClass('text-green');break;
        case 4:target.text('配送中').addClass('text-green');break;
        case 5:target.text('已送达').addClass('text-grey');break;
    }
}

function finishOrder(target,id){
    var url='';
    var action='finish';
    var args={
        action:action,
        order_id:id
    };
    $.postJson(url,args,function(res){
        if(res.success){
            target.addClass('arrive').removeClass('order_finish').removeClass('bg-green').text('已完成');
            target.parents('.order-list-item').addClass('text-grey bg-grey');
            var order_type=$.getUrlParam('order_type');
            if(order_type=='now'){
                window.dataObj.now_count--;
                $('.now_num').removeClass('hidden').text(window.dataObj.now_count);
                SetCookie('orders_intime',window.dataObj.now_count);
            }
            else if(order_type=='on_time'){
                window.dataObj.on_count--;
                $('.on_num').removeClass('hidden').text(window.dataObj.on_count);
                SetCookie('orders_ontime',window.dataObj.on_count);
            }
            //target.parents('.order-list-item').remove();
        }
        else return noticeBox(res.error_text);
    }, function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
);
}

function remarkSub(id,index){
    var url='';
    var action='remark';
    var remark=$('.remark-input').val();
    var data=remark;
    if(remark=='') {
        return warnNotice('请输入备注内容!');}
    if(remark.length>100){
        return warnNotice('备注不得超过100字!');
    }
    var args={
        action:action,
        order_id:id,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            $('.order-list-item').eq(index).find('.s_remark_box').show().find('.remark').text(remark);
            var remark_box=new Modal('remark_box');
            remark_box.modal('hide');
        }
        else return noticeBox(res.error_text);
    }, function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}