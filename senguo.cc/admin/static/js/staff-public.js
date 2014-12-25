$(document).ready(function(){
    $('.shop-list').find('li').on('click',function(){
        var id=$(this).data('id');
        shopChange(id);
    });
});

function shopChange(id){
    var url='/staff';
    var args={shop_id:id};
    $.postJson(url,args,function(res){
        if(res.success){
            $('shop-list-box').modal('hide');
            //window.location.reload();
        }
        else return alert(res.error_text)
    },function(){
        return alert('网络错误！')
    })
}

function job(target,n){
    console.log(2222);
    switch(n) {
        case 1 :target.text('捡货员');break;
        case 2 :target.text('送货员');break;
        case 3 :target.text('送货员');break;
        default :target.text('送货员');break;
    }
}