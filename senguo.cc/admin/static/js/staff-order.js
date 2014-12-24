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
    $('.staff_remark').on('click',function(){
        $('.remark-box').modal('show');
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
