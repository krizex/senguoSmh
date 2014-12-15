$(document).ready(function(){
    $('#currentShopChange li').on('click',function(){
        var shop_id=$(this).data('id');
        shopChnage(shop_id);
    });

});

var shop_id=$('#currentShop').data('id');
var shop_name=$('#currentShop').text();

function worMode(target){
    target.hide().siblings().show();
}

function shopChnage(shop_id){
    var url='/admin';
    var args={shop_id:shop_id};
    $.postJson(url,args,function(res){
        if(res.success){
            window.location.reload();
        }
    },
    function(){

    })
}


