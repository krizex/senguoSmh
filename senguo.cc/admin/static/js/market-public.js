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
    //$('.shop_href').attr({'href':shop_href+Int(shop_id)});
    $('.staff_href').attr({'href':staff_href+Int(shop_id)});
    //微信Api
});
var shop_href='/customer/shopProfile';
var market_href='/shop/none';
var home_href='/customer';
var success_href='/notice/success';
var staff_href='/staff/hire/';
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
        case 2:target.addClass('limit_tag');break;
        case 3:target.addClass('hot_tag');break;
        case 4:target.addClass('sale_tag');break;
        case 5:target.addClass('new_tag');break;
    }
}
(function(factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'hammerjs'], factory);
    } else if (typeof exports === 'object') {
        factory(require('jquery'), require('hammerjs'));
    } else {
        factory(jQuery, Hammer);
    }
}(function($, Hammer) {
    function hammerify(el, options) {
        var $el = $(el);
        if(!$el.data("hammer")) {
            $el.data("hammer", new Hammer($el[0], options));
        }
    }

    $.fn.hammer = function(options) {
        return this.each(function() {
            hammerify(this, options);
        });
    };

    // extend the emit method to also trigger jQuery events
    Hammer.Manager.prototype.emit = (function(originalEmit) {
        return function(type, data) {
            originalEmit.call(this, type, data);
            $(this.element).trigger({
                type: type,
                gesture: data
            });
        };
    })(Hammer.Manager.prototype.emit);
}));
