$(document).ready(function(){
    //商品单位转换
    $('.chargeUnit').each(function(){
        var $this=$(this);
        var id=$this.data('id');
        unitText($this,id);
    });
    $('#backTop').on('click',function(){$(document).scrollTop(0)});
    $('.home_href').attr({'href':market_href+shopId});
    $('.cart_href').attr({'href':cart_href+shopId});
});
var market_href='/customer/market/';
var cart_href='/customer/cart/';
var home_href='/customer';
var success_href='/notice/success/';

var link=window.location.pathname;
var shop_id= $.getNum(link);
var shopId=shop_id;


function unitText(target,n){
    switch (n){
        case 1:target.text('个');break;
        case 2:target.text('斤');break;
        case 3:target.text('份');break;
    }
}

function tagText(target,n){
    switch (n){
        case 1:target.hide();break;
        case 2:target.text('SALE').addClass('bg-orange');break;
        case 3:target.text('HOT').addClass('bg-red');break;
        case 4:target.text('SALE').addClass('bg-pink');break;
        case 5:target.text('NEW').addClass('bg-green');break;
    }
}
