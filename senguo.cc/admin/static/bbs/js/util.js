//表示全局唯一标识符 (GUID)。
/*global tip*/
var zb_timer = null;
function Tip(text){
    clearTimeout(zb_timer);
    if($("#zb-tip").size()>0){
        $("#zb-tip").html(text).removeClass("hide");
    }else{
        var tip = '<div class="zb-tip" id="zb-tip">'+text+'</div>';
        $("body").append(tip);
    }
    zb_timer = setTimeout(function(){
        $("#zb-tip").addClass("hide");
    },2000);
}
/*获取滑动方向，touch*/
var touch = {
    getSlideAngle:function(dx, dy){
        return Math.atan2(dy, dx) * 180 / Math.PI;
    },
    getSlideDirection:function(startX, startY, endX, endY){
        var _ = this;
        var dy = startY - endY;
        var dx = endX - startX;
        var result = 0;
        //如果滑动距离太短
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
            return result;
        }
        var angle = _.getSlideAngle(dx, dy);
        if (angle >= -45 && angle < 45) {
            result = 4;
        } else if (angle >= 45 && angle < 135) {
            result = 1;
        } else if (angle >= -135 && angle < -45) {
            result = 2;
        }
        else if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) {
            result = 3;
        }
        return result;
    }
}
var cookie={
    //name是cookie中的名，value是对应的值，iTime是多久过期（单位为天）,path:设置cookie作用域
    setCookie:function(name,value,iTime){
        if(arguments.length==2){
            var iTime = 300;
        }
        var oDate = new Date();
        oDate.setTime(oDate.getTime()+iTime*24*3600*1000);
        document.cookie = name+"="+value+";path=/;expires="+oDate.toGMTString();
    },
    getCookie:function(name){
        var arr = document.cookie.split("; ");
        for(var i=0; i<arr.length; i++){
            if(arr[i].split("=")[0] == name){
                return arr[i].split("=")[1];
            }
        }
        //未找到对应的cookie则返回空字符串
        return '';
    },
    removeCookie:function(name){
        if(name.indexOf(",")==-1){
            this.setCookie(name,1,-1);
        }else{
            var arr = name.split(",");
            for(var i=0; i<arr.length; i++){
                this.setCookie(arr[i],1,-1);
            }
        }
    }
}
//判断是否是ios
function isIos(){
    var ua = navigator.userAgent.toLowerCase();
    if(ua.match(/iPad/i)=="ipad" || ua.match(/iPhone/i)=="iphone"){
        return true;
    }else{
        return false;
    }
}
/*post*/
$.postJson = function(url, args,successCall){
    args._xsrf = window.dataObj._xsrf;
    $.ajax({
        type:"post",
        url:url,
        data:JSON.stringify(args),
        contentType:"application/json; charset=UTF-8",
        success:successCall,
        fail:function(){
            Tip("服务器出错了，请联系管理员");
        },
        error:function(){
            Tip("服务器出错了，请联系管理员");
        }
    });
};

// var _hmt = _hmt || [];
// (function() {
//     var hm = document.createElement("script");
//     hm.src = "//hm.baidu.com/hm.js?935e8ca3a37798305258305ac7a9f24f";
//     var s = document.getElementsByTagName("script")[0]; 
//     s.parentNode.insertBefore(hm, s);
// })();

(function ($) {
    $.getUrlParam = function (name, default_value) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return decodeURI(r[2]); return default_value || null;
    }
})($);