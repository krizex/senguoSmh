$(document).ready(function(){
    $('.rejectApply').on('click',function(){$('#rejectBox').modal('show');})
    $('.rejectSend').on('click',function(){Reject($(this));});
    $('.passApply').on('click',function(){Pass($(this));});
    $('.shop-list-item').each(function(){
        var status=$(this).data('status');
        if(status=='2'||status=='3')
            $(this).find('.btn-box').addClass('hidden');
    });


});


function Pass(evt){
    var action="updateShopStatus";
    var shop_id=evt.parents('li').data('shopid');
    var url='/super/shopManage/';
    var new_status=2;
    var args={
        action:action,
        shop_id:shop_id,
        new_status:new_status,
        _xsrf:window.dataObj._xsrf
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                alert('通过申请！');
                evt.parents('.shop-list-item').find('.btn-box').addClass('hidden');
            }
        }

    )
}


function Reject(evt){
    var action="updateShopStatus";
    var shop_id=evt.parents('li').data('shopid');
    var declined_reason=evt.siblings('.decline-reason').val().trim();
    var url='/super/shopManage/';
    var new_status=3;
    var args={
        action:action,
        shop_id:shop_id,
        new_status:new_status,
        declined_reason:declined_reason,
        _xsrf:window.dataObj._xsrf
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                alert('拒绝成功！');
                evt.parents('.modal').modal('hide');
                evt.parents('.shop-list-item').find('.btn-box').addClass('hidden');
            }
        }

    )
}