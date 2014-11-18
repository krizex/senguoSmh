$(document).ready(function(){
    $('.rejectApply').on('click',function(){$(this).siblings('.reject-box').modal('show');})
    $('.rejectSend').on('click',function(){Reject($(this));});
    $('.passApply').on('click',function(){Pass($(this));});

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
                evt.parents('.shop-list-item').addClass('hidden');
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
    if(!declined_reason){return alert('请输入拒绝理由！')}
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
                evt.parents('.shop-list-item').addClass('hidden');
            }
        }

    )
}
