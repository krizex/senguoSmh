$(document).ready(function(){
    $('.select-list li').each(function(){
        $(this).on('click',function(){
            $(this).addClass('active').siblings().removeClass('active');
        });
    });

    $('#feedbackEdit').click(function(evt){FeedBack(evt);});

    if($('#detailsReal').data('real')=='true')
         $('#detailsReal').text('有');
    else $('#detailsReal').text('无');

    if($('.showSex').data('sex')=='1')
        $('.showSex').text('男');
    else if($('.showSex').data('sex')=='2')
        $('.showSex').text('女');
    else $('.showSex').text('其他');

    var fruit=window.dataObj.fruit_types;
    for(var code in fruit)
    {
        var fruitlist=$('<li data-code="'+fruit[code]['id']+'"></li>').text(fruit[code]['name']);
        $('.fruit-list').append(fruitlist);
    }
    $('.pause-now').on('click',function(){
        alert('系统封测期，暂停申请一周!');
    })

});

function orderBy(i){
    $('#orderBy'+i).slideToggle(50).siblings('.order-by-list').slideUp(50);
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
$.getItem('/static/items/confirmBox.html?v=201503-29',function(data){window.dataObj.confirmBox=data});
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
$.getItem('/static/items/noticeBox.html?v=2015-03-25',function(data){
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
