$(document).ready(function(){
    $('.shop-list').find('li').on('click',function(){
        var id=$(this).data('id');
        shopChange(id);
    });
    $(document).on('click','.shop_change',function(){
        var $box_status=$('#shopList').css('display');
        var shop_box=new Modal('shopList');
        shop_box.modal('show');
   });
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