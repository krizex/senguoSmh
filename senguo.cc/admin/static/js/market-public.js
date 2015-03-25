$(document).ready(function(){
    window.dataObj.shop_href='/customer/shopProfile';
    window.dataObj.market_href='/shop/none';
    window.dataObj.home_href='/customer';
    window.dataObj.success_href='/notice/success';
    window.dataObj.staff_href='/staff/hire/';
    window.dataObj.current_link=window.location.href;
    //fastclick initialise
     $(function() {
        FastClick.attach(document.body);
    });   
    //客户端为Android系统替换图片路径
    //AndroidImg('bg_change');
    //AndroidImg('src_change');   
    //图片延迟加载
 //     $('.lazy_img').each(function(){
	// var $this=$(this);
	// var src=$this.data('src');
	// $this.attr({'src':src});
 //    });
    //商品单位转换
    $('.chargeUnit').each(function(){
        var $this=$(this);
        var id=$this.data('id');
        unitText($this,id);
    });
    $(document).on('click','#backTop',function(){
        document.body.scrollTop =0;
        $('.little_pear').css({'right':'-40px'});
    });
    //从cookie中提取数据
    window.dataObj.shop_id=getCookie('market_shop_id');
    window.dataObj.shop_name=getCookie('shop_name');
    window.dataObj.cart_count=getCookie('cart_count');
    $('.staff_href').attr({'href':window.dataObj.staff_href+Int(window.dataObj.shop_id)});
    //显示商品数量
    if(window.dataObj.cart_count!=0){
        $('.cart_num').show().text(window.dataObj.cart_count);
    }
    //设置title
    //document.title=$.base64Decode(shop_name)+'一家不错的水果O2O店铺，快来关注吧~';
    //置顶监听
    $(window).on('scroll',function(){
        var $this=$(this);
        var clientHeight=$this.height();
        var scrollTop=document.body.scrollTop||document.documentElement.scrollTop;
        if(!$this.is(":animated")){
            if(scrollTop>=clientHeight/2){
                $('.little_pear').animate({'right':'0px'},50);
            }
            else $('.little_pear').animate({'right':'-40px'},5);
        } 
    });
    $(".lazy_img").lazyload({threshold:100});
    //wexin api
    wexin();
 
});

function wexin(){
    //微信Api
    var url='/wexin';
    var link=window.location.href;
    var args={url: link};
    //$.ajaxSettings.async=false;
    $.postJson(url,args,function(res){
        if(res.success){
            var noncestr_val=res.noncestr;
            var timestamp_val=res.timestamp;
            var signature_val=res.signature;
            var shop_code=getCookie('market_shop_code');
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
             title: '', // 分享标题
             link:'/'+shop_code, // 分享链接
             imgUrl: '', // 分享图标
             success: function () {
             // 用户确认分享后执行的回调函数
             },
             cancel: function () {
             // 用户取消分享后执行的回调函数
             }
         });
         wx.onMenuShareAppMessage({
             title: '', // 分享标题
             desc: "一家不错的水果O2O店铺，快来关注吧~ ", // 分享描述
             link:'/'+shop_code,
             imgUrl: "", // 分享图标
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


/*function AndroidImg(target){
    //判断客户端是否是iOS或者Android
    var u = navigator.userAgent, app = navigator.appVersion;
    var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1; //android终端或者uc浏览器
    //var isAndroid = u.indexOf('Android') > -1;
    var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
     if(isAndroid){
     	$(document).find('.'+target).each(function(){
     	var $this=$(this);
               var dpi=window.devicePixelRatio;
	if(target=='bg_change')
	{
	     var src=$this.css('background');
                   var src_android
                    if(dpi>1)  src_android=src.replace('.svg','@2x.png?v=2015-03-13');
                    else    src_android=src.replace('.svg','.png?v=2015-03-13');
     	     $this.css({'background':src_android});
               }
     	else {
     	   var src=$this.attr('src');
     	   var src_android
                if(dpi>1)  src_android=src.replace('.svg','@2x.png?v=2015-03-13');
                else    src_android=src.replace('.svg','.png?v=2015-03-13');
     	   $this.attr({'src':src_android});
     	}   	
      });
     }
}*/

function getCookie(key){
    var aCookie = document.cookie.split(";");
    for (var i=0; i < aCookie.length; i++){
        var aCrumb = aCookie[i].split("=");
        if (key === aCrumb[0].replace(/^\s*|\s*$/,"")){
            return unescape(aCrumb[1]);
        }
    }
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
    //AndroidImg('bg_change');
}
//public
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

$.getItem=function(url,success){$.get(url,success);};

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
        if (r != null) return unescape(r[2]); return default_value || null;
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
$.getItem('/static/items/confirmBox.html?v=201503-22',function(data){window.dataObj.confirmBox=data});
$.confirmBox=function(text,index,type){
        var $box=$(window.dataObj.confirmBox);
        $box.find('.message').text(text);
        if(typeof(index)!='undefined') $box.find('.message').attr({'data-index':index});
        if(typeof(type)!='undefined') $box.find('.message').attr({'data-type':type});
        var window_height=$(window).height();
        var height=$('.container').height();
        var $mask;
        if(height<window_height) $mask=$('<div class="modal_bg"></div>').css({'height':'100%'});
        else $mask=$('<div class="modal_bg"></div>').css({'height':height+'px'});
        $('body').append($box,$mask);
        $(document).on('click','.dismiss',function(){
            $('#confirmBox').remove();
            $('.modal_bg').remove();
        });
}
$.confirmRemove=function(){
    $('#confirmBox').remove();
    $('.modal_bg').remove();
}
//word notice
$.getItem('/static/items/noticeBox.html?v=2015-03-21',function(data){window.dataObj.noticeBox=data});
$.noticeBox=function(text){
        var $box=$(window.dataObj.noticeBox);
        $box.find('.notice').text(text);
        $('body').append($box);
        $.noticeRemove('noticeBox');
}
//modal notice word
$.warnNotice=function(text){
    $('.modal-body').find('.warn').remove();
    var $word=$('<p class="warn text-pink text-center" id="warn"></p>');
    $word.text(text);
    $('.modal-body').append($word);
    $.noticeRemove('warn');
}
//time count 2 secends
var n_time=2;
$.noticeRemove=function (target) {
    if (n_time == 0) {
        n_time = 2;
        $('#'+target).remove();
    }
    else {
        n_time--;
        setTimeout(function() {
                $.noticeRemove(target)
            },
            1000)
    }
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
        var $mask;
        if(height<window_height) $mask=$('<div class="modal_bg"></div>').css({'height':'100%'});
        else $mask=$('<div class="modal_bg"></div>').css({'height':height+'px'});
        $('body').append($mask).addClass('modal_sty').attr({'onmousewheel':'return false'});
        $target.removeClass('fade').addClass('in').css({'display':'block'});
        $target.find('.warn').remove();
        $target.on('click',function(e){
            if($(e.target).closest('.dismiss').length != 0){
                $('body').removeClass('modal_sty').attr({'onmousewheel':''}).find($mask).remove();
                $target.addClass('fade').removeClass('in').css({'display':'none'});
            }
        });
    }
    else if(type=='hide')
    {
        $('body').removeClass('modal_sty').attr({'onmousewheel':''}).find('.modal_bg').remove();
        $target.addClass('fade').removeClass('in').css({'display':'none'});
    }
}
