$(document).ready(function(){
    $('.setAccount').each(function(){
        $(this).on('click',function(){
            $(this).parents('li').find('.set-box-item').modal('show');
        });
    });
    $('.accountSet').on('click',function(){Account($(this));});
});

function Account(evt){
    var action="set_read";
    var url=window.location.pathname;
    var order_id=evt.parents('li').data('id');
    var system_username=evt.parents('li').find('.loginName').val().trim();
    var system_password=evt.parents('li').find('.loginPass').val().trim();
    var system_code=evt.parents('li').find('.marketCode').val().trim();
    if(!system_username && !system_password &&!system_code){return alert('请填写全部信息');}
    var args={
        order_id:order_id,
        system_username:system_username,
        system_password:system_password,
        system_code:system_code,
        action:action,
        _xsrf:window.dataObj._xsrf
    };
    $.postJson(url,args,function(res){
        if(res.success)
            evt.parents('li').find('.set-btn').hide();
            alert('设置成功！');
             evt.parents('.modal').modal('hide');
    })
}