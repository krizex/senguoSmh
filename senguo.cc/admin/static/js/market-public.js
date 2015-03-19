$(document).ready(function(){
    //fastclick initialise
     $(function() {
        FastClick.attach(document.body);
    });   
    //客户端为Android系统替换图片路径
    //AndroidImg('bg_change');
    //AndroidImg('src_change');   
    //图片延迟加载
     $('.lazy_img').each(function(){
	var $this=$(this);
	var src=$this.data('src');
	$this.attr({'src':src});
    });
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
    shop_id=getCookie('market_shop_id');
    shop_name=getCookie('shop_name');
    cart_count=getCookie('cart_count');
    $('.staff_href').attr({'href':staff_href+Int(shop_id)});
    //显示商品数量
    if(cart_count!=0){
        $('.cart_num').show().text(cart_count);
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
});
var shop_href='/customer/shopProfile';
var market_href='/shop/none';
var home_href='/customer';
var success_href='/notice/success';
var staff_href='/staff/hire/';
var shop_id=window.dataObj.shop_id;
var shop_name=window.dataObj.shop_name;
var cart_count=window.dataObj.cart_count;
var noncestr_val;
var timestamp_val;
var signature_val;
var current_link=window.location.href;

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
$.postJson = function(url, args,successCall, failCall, alwaysCall){
    args._xsrf = window.dataObj._xsrf;
    var req = $.ajax({
        type:"post",
        url:url,
        data:JSON.stringify(args),
        contentType:"application/json; charset=UTF-8",
        success:successCall,
        fail:failCall,
        error:failCall
    });
    //req.always(alwaysCall);
};

$.getItem=function(url,success){
    $.get(url,success);
};


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

function Modal(target){
    this.target=target;
}
Modal.prototype.modal=function(type){
    var $target=$('#'+this.target+'');
    if(type=='show')
    {
        var height=$('.container').height();
        var $mask=$('<div class="modal_bg"></div>').css({'height':height+'px'});
        $('body').append($mask).addClass('modal_sty').attr({'onmousewheel':'return false'});
        $target.removeClass('fade').addClass('in').css({'display':'block'});
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
