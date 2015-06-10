$(document).ready(function(){
     FastClick.attach(document.body);
    $('.shop-list').find('li').on('click',function(){
        var id=$(this).data('id');
        shopChange(id);
    });
    $(document).on('click','.shop_change',function(){
        var $box_status=$('#shopList').css('display');
        var shop_box=new Modal('shopList');
        shop_box.modal('show');
   });
    //get order num
    window.dataObj.now_count=getCookie('orders_intime');
    window.dataObj.on_count=getCookie('orders_ontime');
    if(window.dataObj.now_count!=0) {$('.now_num').removeClass('hidden').text(window.dataObj.now_count);}
    if(window.dataObj.on_count!=0) {$('.on_num').removeClass('hidden').text(window.dataObj.on_count);}
});

function shopChange(id){
    var url='/staff';
    var args={shop_id:id};
    $.postJson(url,args,function(res){
        if(res.success){
            var shop_box=new Modal('shopList');
            shop_box.modal('hide');
            window.location.reload();
        }
        else return alert(res.error_text)
    },function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')}
)
}

function job(target,n){
    switch(n) {
        case 1 :target.text('捡货员');break;
        case 2 :target.text('送货员');break;
        case 3 :target.text('送货员');break;
        default :target.text('送货员');break;
    }
}

//public
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
        if (r != null) return unescape(r[2]); return default_value || null;
    }
})(Zepto);

//confirmbox
getItem('/static/items/confirmBox.html?v=20150609',function(data){window.dataObj.confirmBox=data});
var confirmBox=function(text,index,type){
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
         $(document).on('click','.modal',function(e){
             if($(e.target).closest('.modal-content').length == 0){
                $('body').removeClass('modal_sty').attr({'onmousewheel':''}).css({'overflow':'auto'}).find('.modal_bg').remove();
                $('#confirmBox').remove();
            }
        });
}
var confirmRemove=function(){
    $('#confirmBox').remove();
    $('.modal_bg').remove();
}

//word notice
var noticeTimer = null;
var tempObj = null;
var noticeBox=function(text,item){
    if(tempObj){
        tempObj.removeAttr('disabled').removeClass('bg-greyc');
    }
    clearTimeout(noticeTimer);
    if($("#noticeBox").size()==0){
        var $box=$('<div class="notice_bg hidden" id="noticeBox"><div class="notice_box text-center center-block"><p class="notice text-white font14 text-center"></p></div></div>');
        $('body').append($box);
    }
    $("#noticeBox").removeClass('hidden').find('.notice').text(text);
    if(item) {
        tempObj = item;
        item.attr({'disabled':'true'});
    }
    noticeRemove('noticeBox',item);
}
//modal notice word
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
    },2000);
}
//time count 2 secends
var noticeRemove=function (target,item) {
    noticeTimer = setTimeout(function() {
        $('#'+target).addClass('hidden');
        if(item){
            item.removeAttr('disabled').removeClass('bg-greyc');
        }
    },2000);
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
        $target.on('click',function(e){
            if($(e.target).closest('.dismiss').length != 0){
                $('body').css({'overflow':'auto'});
                $target.addClass('fade').removeClass('in').css({'display':'none'});
            }
        });
        $(document).on('click','.modal',function(e){
             if($(e.target).closest('.modal-content').length == 0){
                $('body').css({'overflow':'auto'});
                $target.addClass('fade').removeClass('in').css({'display':'none'});
            }
        });
    }
    else if(type=='hide')
    {
        $('body').removeClass('modal_sty').css({'overflow':'auto'}).find('.modal_bg').remove();
        $target.addClass('fade').removeClass('in').css({'display':'none'});
    }
}
