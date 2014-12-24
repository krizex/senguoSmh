$(document).ready(function(){
    //商品单位转换
    $('.chargeUnit').each(function(){
        var $this=$(this);
        var id=$this.data('id');
        unitText($this,id);
    });
    $('#backTop').on('click',function(){$(document).scrollTop(0)});
    var strCookie=document.cookie;
    var arrCookie=strCookie.split("; ");
    for(var i=0;i<arrCookie.length;i++){
        var arr=arrCookie[i].split("=");
        if("market_shop_id"==arr[0]){
            shop_id=arr[1];
            break;
        }
    }
    $('.home_href').attr({'href':market_href+Int(shop_id)});
});
var market_href='/customer/market/';
var home_href='/customer';
var success_href='/notice/success';
var shop_id;

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
