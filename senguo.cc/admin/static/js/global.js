var zb_timer = null;
function Tip(text){
    clearTimeout(zb_timer);
    if($("#zb-tip").size()>0){
        $("#zb-tip").html(text).removeClass("hidden");
    }else{
        var tip = '<div class="zb-tip" id="zb-tip">'+text+'</div>';
        $("body").append(tip);
    }
    zb_timer = setTimeout(function(){
        $("#zb-tip").addClass("hidden");
    },3000);
}
(function ($) {
    $.getUrlParam = function (name, default_value) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return decodeURI(r[2]); return default_value || null;
    }
})(jQuery);

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
    req.always(alwaysCall);
};

$.getItem=function(url,success){
    $.get(url,success);
};

(function ($) {
    $.getNum=function(text) {
        var value = text.replace(/[^0-9]/ig, "");
        return value;
    }
})(jQuery);


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
function percentNum(num,num2){
    return Math.round(num/num2*10000)/100.00+"%";
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

//confirmbox
$.getItem('/static/items/confirmBox.html?v=20150613',function(data){window.dataObj.confirmBox=data});
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
         $(document).on('click','.modal',function(e){
             if($(e.target).closest('.modal-content').length == 0){
                $('body').removeClass('modal_sty').attr({'onmousewheel':''}).css({'overflow':'auto'}).find('.modal_bg').remove();
                $('#confirmBox').remove();
            }
        });
}
$.confirmRemove=function(){
    $('#confirmBox').remove();
    $('.modal_bg').remove();
}
//word notice
$.getItem('/static/items/noticeBox.html?v=20150613',function(data){
    window.dataObj.noticeBox=data;
     var $box=$(window.dataObj.noticeBox);   
    $('body').append($box);
});
$.noticeBox=function(text,item){
        $('#noticeBox').removeClass('hidden').find('.notice').text(text);
        if(item) {item.attr({'disabled':'true'});}
        $.noticeRemove('noticeBox',item);
        $.noticeRemove=function () {
        if (window.dataObj.n_time == 0) {
            window.dataObj.n_time = 2;
            $('#noticeBox').addClass('hidden');
            if(item) {item.removeAttr('disabled');}
        }
        else {
            window.dataObj.n_time--;
            setTimeout(function() {$.noticeRemove()},1000);
        }
    }
}
//modal notice word
$.warnNotice=function(text){
    $('.modal-body').find('.warn').remove();
    var $word=$('<p class="warn text-pink text-center" id="warn"></p>');
    $word.text(text);
    $('.modal-body').append($word);
    $('.sure_btn').attr({'disabled':'true'});
    $.noticeRemove('warn');
}
//time count 2 secends
window.dataObj.n_time=2;
$.noticeRemove=function (target) {
    if (window.dataObj.n_time == 0) {
        window.dataObj.n_time = 2;
        $('#'+target).addClass('hidden');
        $('.sure_btn').removeAttr('disabled');
    }
    else {
        window.dataObj.n_time--;
        setTimeout(function() {$.noticeRemove(target)},1000);
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
        $('body').append($mask).addClass('modal_sty').attr({'onmousewheel':'return false'}).css({'overflow':'hidden'});
        $target.removeClass('fade').addClass('in').css({'display':'block'});
        $target.find('.warn').remove();
        $target.on('click',function(e){
            if($(e.target).closest('.dismiss').length != 0){
                $('body').removeClass('modal_sty').attr({'onmousewheel':''}).css({'overflow':'auto'}).find('.modal_bg').remove();
                $target.addClass('fade').removeClass('in').css({'display':'none'});
            }
        });
        $(document).on('click','.modal',function(e){
             if($(e.target).closest('.modal-content').length == 0){
                $('body').removeClass('modal_sty').attr({'onmousewheel':''}).css({'overflow':'auto'}).find('.modal_bg').remove();
                $target.addClass('fade').removeClass('in').css({'display':'none'});
            }
        });
    }
    else if(type=='hide')
    {
        $('body').removeClass('modal_sty').attr({'onmousewheel':''}).css({'overflow':'auto'}).find('.modal_bg').remove();
        $target.addClass('fade').removeClass('in').css({'display':'none'});
    }
}

function bubbleSort(arr){
    for(var i=0;i<arr.length;i++){
        for(var j=i;j<arr.length;j++){
            if(arr[i]<arr[j]){
                var temp=arr[i];
                arr[i]=arr[j];
                arr[j]=temp;
            }
        }
    }
    return arr[0];
}