$(document).ready(function(){
    $('.shop-list').find('li').on('click',function(){
        var id=$(this).data('id');
        shopChange(id);
    })

});

function shopChange(id){
    var url='/staff';
    var args={shop_id:id};
    $.postJson(url,args,function(res){
        if(res.success){
            $('shop-list-box').modal('hide');
            window.location.reload();
        }
        else return alert(res.error_text)
    },function(){
        return alert('网络错误！')
    })
}