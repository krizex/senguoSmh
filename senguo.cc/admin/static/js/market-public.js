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
    wexin();
    wx.config({
        debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
        appId: 'wx0ed17cdc9020a96e', // 必填，公众号的唯一标识
        timestamp:timestamp_val, // 必填，生成签名的时间戳
        nonceStr:noncestr_val, // 必填，生成签名的随机串
        signature:signature_val,// 必填，签名，见附录1
        jsApiList: ['onMenuShareTimeline','onMenuShareAppMessage'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
    });
    wx.ready(function(){
        wx.onMenuShareTimeline({
            title: '哈哈哈哈哈'+'一家不错的水果O2O店铺，快来关注吧~ ', // 分享标题
            link: '', // 分享链接
            imgUrl: '', // 分享图标
            success: function () {
                // 用户确认分享后执行的回调函数
            },
            cancel: function () {
                // 用户取消分享后执行的回调函数
            }
        });
        wx.onMenuShareAppMessage({
            title: '哈哈哈哈哈', // 分享标题
            desc: "一家不错的水果O2O店铺，快来关注吧~ ", // 分享描述
            link:"",
            imgUrl: "", // 分享图标
            type: '' // 分享类型,music、video或link，不填默认为link
        });
    });
});
var shop_href='/customer/shopProfile';
var market_href='/shop/none';
var home_href='/customer';
var success_href='/notice/success';
var staff_href='/staff/hire/';
var shop_id;
var noncestr_val;
var timestamp_val;
var signature_val;

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

function wexin(){
    var url='/wexin';
    var link= window.location.href;
    var args={url: link};
    $.ajaxSetup({'async':false});
    $.postJson(url,args,function(res){
        if(res.success){
            noncestr_val=res.noncestr;
            timestamp_val=res.timestamp;
            signature_val=res.signature;
        }
        else return alert(res.error_text);
    })
}