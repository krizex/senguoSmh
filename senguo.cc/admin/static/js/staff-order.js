$(document).ready(function(){
    //订单完成
    $('.order_finish').on('click',function(){
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
    //订单详情
    $('.order-list-item .content').on('click',function(){
        var $this=$(this);
        $this.siblings('.toggle').toggle();
    });
    //订单备注
    var order_id;
    $('.staff_remark').on('click',function(){
        var $this=$(this);
        order_id=$this.data('id');
        $('.remark-box').modal('show');
    });
    $('.remark_submit').on('click',function(){
        remarkSub(order_id);
    });
    //送货时间
    $('.order-list-item').each(function(){
        var $this=$(this);
        var create_time=$this.find('.create_time').val();
        var create_year=$this.find('.create_year').val();
        var create_month=$this.find('.create_month').val();
        var create_day=Int($this.find('.create_day').val());
        var send_day=$this.find('.send_day').val();
        var status=$this.find('.status').data('id');
        if(send_day==1&&status==5){
            $this.find('.send_date').text(create_year+'-'+create_month+'-'+create_day);
            $this.find('.un-arrive').text('已送达');
            $this.find('.status_notice').text('已送达');
        }
        else if(send_day==2&&status==5){
            $this.find('.send_date').text(create_year+'-'+create_month+'-'+(create_day+1));
            $this.find('.un-arrive').text('已送达');
            $this.find('.status_notice').text('已送达');
        }
    });
});
function statusText(target,n){
    switch (n){
        case 1:target.text('配送中').addClass('text-green');break;
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
            target.parents('.order-list-item').remove();
        }
        else return alert(res.error_text)
    },function(){
        return alert('网络错误！')
    })
}

function remarkSub(id){
    var url='';
    var action='remark';
    var remark=$('.remark-input').val();
    var data=remark;
    var args={
        action:action,
        order_id:id,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            $('.remark-box').modal('hide');
        }
        else return alert(res.error_text)
    },function(){
        return alert('网络错误！')
    })
}