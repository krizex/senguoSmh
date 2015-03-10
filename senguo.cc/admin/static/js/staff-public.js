$(document).ready(function(){
    $('.shop-list').find('li').on('click',function(){
        var id=$(this).data('id');
        shopChange(id);
    });
    $(document).on('click','.shop_change',function(){
     var $box_status=$('#shopList').css('display');
     if($box_status=='none'){
         $('#shopList').modal('show');
     }
   });
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

function job(target,n){
    switch(n) {
        case 1 :target.text('捡货员');break;
        case 2 :target.text('送货员');break;
        case 3 :target.text('送货员');break;
        default :target.text('送货员');break;
    }
}
