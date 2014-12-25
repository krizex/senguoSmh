$(document).ready(function(){
    //订单完成
    $('.order_finish').on('click',function(){
        var $this=$(this);
        var id=$this.data('id');
        finishOrder($this,id);

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
});
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