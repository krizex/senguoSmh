var if_fromdetail = parseInt(getCookie('fromdetail'));
if(if_fromdetail==1){
    $(".wrap-loading-box").removeClass("hidden");
    SetCookie("fromdetail","")
    window.location.reload();
}

$(document).ready(function(){
    window.dataObj.shop_href='/customer/shopProfile';
    window.dataObj.market_href='/shop/none';
    window.dataObj.home_href='/customer';
    window.dataObj.success_href='/notice/success';
    window.dataObj.staff_href='/staff/hire/';
    window.dataObj.current_link=window.location.href;
    var _hmt = _hmt || [];
    (function() {
        var hm = document.createElement("script");
        hm.src = "//hm.baidu.com/hm.js?935e8ca3a37798305258305ac7a9f24f";
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(hm, s);
    })();
    if($("#order-success").size()>0){
        if(location.href!=parent.location.href){
            parent.location.href = location.href;
        }
    }
    //fastclick initialise
    FastClick.attach(document.body);
    //商品单位转换
    $('.chargeUnit').each(function(){
        var $this=$(this);
        var id=$this.data('id');
        unitText($this,id);
    });
    //从cookie中提取数据
    window.dataObj.shop_id=getCookie('market_shop_id');
    //window.dataObj.shop_name=getCookie('shop_name');
    window.dataObj.cart_count=getCookie('cart_count');
    $('.staff_href').attr({'href':window.dataObj.staff_href+Int(window.dataObj.shop_id)});
    //显示商品数量
    if(window.dataObj.cart_count!=0){
        $('.cart_num').removeClass('hidden').text(window.dataObj.cart_count);
    }
    $('.lazy_img').lazyload({threshold:100,effect:"fadeIn"});
    $(document).on('click','#backTop',function(){
        $.scrollTo({endY:0,duration:500,callback:function() {}});
    });
    //置顶监听
    $(window).on('scroll',function(){
        var $this=$(this);
        var clientHeight= $(window).height();
        var scrollTop=$(window).scrollTop();
        if(scrollTop>=clientHeight/2){
                $('.little_pear').css("display","block");
            }
            else{
                $('.little_pear').css("display","none");
            }
    });
    //confess wall has some new
    var confess_new = parseInt(getCookie('confess_new'));
    var confess_shop_id = getCookie('confess_shop_id');
    if(confess_shop_id==window.dataObj.shop_id){
        if(confess_new !=0){
            $('.discover-new').removeClass('hidden');
        }
        else{
            $('.discover-new').addClass('hidden');
        }
    }
    var shop_auth=parseInt(getCookie('shop_auth'));
});

function wexin(link,imgurl){
    //微信Api
    var url='/wexin';
    var args={url: window.location.href};
    if(!link){
        link='';
    }
    if(!imgurl){
        imgurl='/static/images/TDSG.png';
    }
    $.postJson(url,args,function(res){
        if(res.success){
            var noncestr_val=res.noncestr;
            var timestamp_val=res.timestamp;
            var signature_val=res.signature;
            var logo_Item=$('#shop_imgurl');
            wx.config({
                debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                appId: 'wx0ed17cdc9020a96e', // 必填，公众号的唯一标识
                timestamp:timestamp_val, // 必填，生成签名的时间戳
                nonceStr:noncestr_val, // 必填，生成签名的随机串
                signature:signature_val,// 必填，签名，见附录1
                jsApiList: ['onMenuShareTimeline','onMenuShareAppMessage','hideMenuItems','hideOptionMenu','showOptionMenu']// 必填，需要使用的JS接口列表，所有JS接口列表见附录2
            });
            wx.ready(function(){
                if(logo_Item.length==0){
                    wx.hideMenuItems({
                        menuList: ['menuItem:share:appMessage','menuItem:share:timeline']
                    });
                }
                wx.onMenuShareTimeline({
                    title: '', // 分享标题
                    link:link, // 分享链接
                    imgUrl:imgurl, // 分享图标
                    success: function () {
                    // 用户确认分享后执行的回调函数
                    },
                    cancel: function () {
                    // 用户取消分享后执行的回调函数
                    }
                });
                wx.onMenuShareAppMessage({
                    title: '', // 分享标题
                    desc: "一家不错的店铺，快来关注吧~ ", // 分享描述
                    link:link,
                    imgUrl:imgurl, // 分享图标
                    type: '' // 分享类型,music、video或link，不填默认为link
                });
            });
        }
        else return alert(res.error_text);
    })
}
function isWeiXin(){
    var ua = window.navigator.userAgent.toLowerCase();
        if(ua.match(/MicroMessenger/i) == 'micromessenger'){
            return true;
        }
        else{
    }
}
function getCookie(key){
    var aCookie = document.cookie.split(";");
    for (var i=0; i < aCookie.length; i++){
        var aCrumb = aCookie[i].split("=");
        if (key === aCrumb[0].replace(/^\s*|\s*$/,"")){
            return unescape(aCrumb[1]);
        }
    }
    return '';
}
function SetCookie(name,value,days){
    var days=arguments[2]?arguments[2]:30; //此 cookie 将被保存 30 天
    var exp=new Date();    //new Date("December 31, 9998");
    exp.setTime(exp.getTime() + days*86400000);
    document.cookie=name+"="+escape(value)+";path=/;expires="+exp.toGMTString();
}
function unitText(target,n){
    switch (n){
        case 1:target.text('个');break;
        case 2:target.text('斤');break;
        case 3:target.text('份');break;
        case 4:target.text('kg');break;
        case 5:target.text('克');break;
        case 6:target.text('升');break;
        case 7:target.text('箱');break;
        case 8:target.text('盒');break;
        case 9:target.text('件');break;
        case 10:target.text('筐');break;
        case 11:target.text('包');break;
	case 12:target.text('今天价');break; 
	case 13:target.text('明天价');break;
    }
}
function tagText(target,n){
    switch (n){
        case 1:target.hide();break;
        case 2:target.addClass('limit_tag').addClass('bg_change');break;
        case 3:target.addClass('hot_tag').addClass('bg_change');break;
        case 4:target.addClass('sale_tag').addClass('bg_change');break;
        case 5:target.addClass('new_tag').addClass('bg_change');break;
    }
}
//public
(function ($) {
    $.postJson = function(url, args,successCall, failCall, errorCall,alwaysCall){
        args._xsrf = window.dataObj._xsrf;
        var req = $.ajax({
            type:"post",
            url:url,
            data:JSON.stringify(args),
            contentType:"application/json; charset=UTF-8",
            success:successCall,
            fail:failCall,
            error:errorCall
        });
        //req.always(alwaysCall);
};
})(Zepto);
function getItem(url,success){$.get(url,success);}
function Int(target){
    target=parseInt(target);
    return target;
}
function checkTime(i)
{
    if (i<10)
    {i="0" + i}
    return i
}

function mathFloat(target){
    return Math.round(target*100)/100;
}

function isEmptyObj(obj){
    for(var n in obj){return false}
    return true;
}

function is_weixin(){
    var ua = navigator.userAgent.toLowerCase();
    if(ua.match(/MicroMessenger/i)=="micromessenger") {
        return true;
    } else {
        return false;
    }
}
(function ($) {
    $.getUrlParam = function (name, default_value) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return decodeURI(r[2]); return default_value || null;
    }
})(Zepto);

//prevent 冒泡
function stopPropagation(e) {
    e = e || window.event;
    if(e.stopPropagation) { //W3C阻止冒泡方法
        e.stopPropagation();
    } else {
        e.cancelBubble = true; //IE阻止冒泡方法
    }
}
//confirmbox
getItem('/static/items/confirmBox.html?v=20150613',function(data){window.dataObj.confirmBox=data});
var confirmBox=function(text,index,type,id){
    var $box=$(window.dataObj.confirmBox);
    $box.find('.message').text(text);
    $box.find(".confriming").attr("id",id);
    if(typeof(index)!='undefined') $box.find('.message').attr({'data-index':index});
    if(typeof(type)!='undefined') $box.find('.message').attr({'data-type':type});
    var window_height=$(window).height();
    var height=$('.container').height();
    $('body').append($box);
    $("#container,#nav").css({'-webkit-filter':'blur(3px)'})
    $(document).on('click','.dismiss',function(){
        $("#container,#nav").removeAttr("style");
        $('#confirmBox').remove();
    });
    $(document).on('click','.modal',function(e){
        if($(e.target).closest('.modal-content').length == 0){
            $("#container,#nav").removeAttr("style");
            $('#confirmBox').remove();
        }
    });
}
var confirmRemove=function(){
    $("#container,#nav").removeAttr("style");
    $('#confirmBox').remove();
}
//toast word notice
var noticeTimer = null;
var tempObj = null;
var noticeBox=function(text,item){
    if(tempObj){
        tempObj.removeAttr('disabled').removeClass('bg-greyc');
    }
    clearTimeout(noticeTimer);
    if($("#noticeBox").size()==0){
        var $box=$('<div class="notice_bg" id="noticeBox"><div class="notice_box text-center center-block"><p class="notice text-white font14 text-center"></p></div></div>');
        $('body').append($box);
    }
    $("#noticeBox").removeClass('anim-fadeOut').addClass('anim-bounceIn').find('.notice').text(text);
    if(item) {
        tempObj = item;
        item.attr({'disabled':'true'});
    }
    noticeRemove('noticeBox',item);
}
//insidemodal word notice
var warnNotice=function(text,item){
    clearTimeout(noticeTimer);
    $(".warn").remove();
    var $word=$('<p class="warn text-pink text-center" id="warn"></p>');
    $word.text(text);
    $('.modal-warn').append($word);
    noticeTimer = setTimeout(function() {
        $('.warn').addClass('hidden');
        if(item){
            item.removeAttr('disabled').removeClass('bg-greyc');
        }
    },1500);
}
//1.5秒后移除notice
var noticeRemove=function (target,item) {
    noticeTimer = setTimeout(function() {
        $('#'+target).removeClass('anim-bounceIn').addClass('anim-fadeOut');
        if(item){
            item.removeAttr('disabled').removeClass('bg-greyc');
        }
    },1500);
}

//modal box
function Modal(target){
    this.target=target;
}
Modal.prototype.modal=function(type){
    var $target=$('#'+this.target+'');
    if(type=='show')
    {
        var window_height=$(window).height();
        var height=$('.container').height();
        $target.removeClass('fade').addClass('in').css({'display':'block'});
        $target.find('.warn').remove();
        $("body").css({'overflow':'hidden'});
        $("#container,#nav").css({'-webkit-filter':'blur(3px)'})
        $target.on('click',function(e){
            if($(e.target).closest('.dismiss').length != 0){
                $('body').css({'overflow':'auto'});
                $("#container,#nav").removeAttr("style");
                $target.addClass('fade').removeClass('in').css({'display':'none'});
            }
        });
        $(document).on('click','.modal',function(e){
            if($(e.target).closest('.modal-content').length == 0){
                $('body').css({'overflow':'auto'});
                $("#container,#nav").removeAttr("style");
                $target.addClass('fade').removeClass('in').css({'display':'none'});
            }
        });
    }
    else if(type=='hide')
    {
        $('body').removeClass('modal_sty').css({'overflow':'auto'}).find('.modal_bg').remove();
        $("#container,#nav").removeAttr("style");
        $target.addClass('fade').removeClass('in').css({'display':'none'});
    }
}
//modal notice
function modalNotice(notice){
    var item =  '<div class="modal in" id="notice-box" style="display:block">'+
                    '<div class="modal-dialog anim-bounceIn">'+
                        '<div class="modal-content bg-white">'+
                            '<div class="modal-top"><img src="/static/images/info_top.png"/></div>'+
                            '<div class="modal-header set-width-float">'+
                                '<button type="button" class="close dismiss-notice">✕</button>'+
                                '<h2 class="modal-title  text-center line48">温馨提示</h2>'+
                            '</div>'+
                            '<div class="modal-body set-width-float text-center">'+
                                '<p class="detail font14 text-center">{{notice}}</p>'+
                            '</div>'+
                            '<div class="modal-bottom"><img src="/static/images/info_bot.png"/></div>'+
                        '</div>'+
                    '</div>'+
                '</div>';
    var render = template.compile(item);
    var content = render({notice:notice});
    $('body').append(content);
    $("#container,#nav").css({'-webkit-filter':'blur(3px)'});
    $(document).on('click','.dismiss-notice',function(){
        $("#container,#nav").removeAttr("style");
        $('#notice-box').remove();
    });
}

//点选动画
function pulse(target){
    target.removeClass('anim-pulse').addClass('anim-pulse').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',function(){
        target.removeClass('anim-pulse');
    });
}
//购物篮数字动画
function wobble(target){
    target.removeClass('anim-wobble').addClass('anim-wobble').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',function(){
        target.removeClass('anim-wobble');
    });
}
//Zepto ScollTo 屏幕滚动动画
;(function($) {
    var DEFAULTS = {
        endY: $.os.android ? 1 : 0,
        duration: 200,
        updateRate: 15
    };
    var interpolate = function (source, target, shift) {
        return (source + (target - source) * shift);
    };
    var easing = function (pos) {
        return (-Math.cos(pos * Math.PI) / 2) + .5;
    };
    var scroll = function(settings) {
        var options = $.extend({}, DEFAULTS, settings);
        if (options.duration === 0) {
            window.scrollTo(0, options.endY);
            if (typeof options.callback === 'function') options.callback();
            return;
        }
        var startY = window.pageYOffset,
        startT = Date.now(),
        finishT = startT + options.duration;
        var animate = function() {
            var now = Date.now(),
            shift = (now > finishT) ? 1 : (now - startT) / options.duration;
            window.scrollTo(0, interpolate(startY, options.endY, easing(shift)));
            if (now < finishT) {
                setTimeout(animate, options.updateRate);
            }
            else {
                if (typeof options.callback === 'function') options.callback();
            }
        };
        animate();
    };
    var scrollNode = function(settings) {
        var options = $.extend({}, DEFAULTS, settings);
        if (options.duration === 0) {
            this.scrollTop = options.endY;
            if (typeof options.callback === 'function') options.callback();
            return;
        }
        var startY = this.scrollTop,
        startT = Date.now(),
        finishT = startT + options.duration,
        _this = this;
        var animate = function() {
            var now = Date.now(),
            shift = (now > finishT) ? 1 : (now - startT) / options.duration;
            _this.scrollTop = interpolate(startY, options.endY, easing(shift));
            if (now < finishT) {
                setTimeout(animate, options.updateRate);
            }
            else {
                if (typeof options.callback === 'function') options.callback();
            }
        };
        animate();
    };
    $.scrollTo = scroll;
    $.fn.scrollTo = function() {
        if (this.length) {
            var args = arguments;
            this.forEach(function(elem, index) {
                scrollNode.apply(elem, args);
            });
        }
    };
}(Zepto));
