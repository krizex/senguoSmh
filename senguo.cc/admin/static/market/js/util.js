//表示全局唯一标识符 (GUID)。
function Guid(g){
    var arr = new Array(); //存放32位数值的数组
    if (typeof(g) == "string"){ //如果构造函数的参数为字符串
        InitByString(arr, g);
    }
    else{
        InitByOther(arr);
    }
    //返回一个值，该值指示 Guid 的两个实例是否表示同一个值。
    this.Equals = function(o){
        if (o && o.IsGuid){
            return this.ToString() == o.ToString();
        }
        else{
            return false;
        }
    }
    //Guid对象的标记
    this.IsGuid = function(){}
    //返回 Guid 类的此实例值的 String 表示形式。
    this.ToString = function(format){
        if(typeof(format) == "string"){
            if (format == "N" || format == "D" || format == "B" || format == "P"){
                return ToStringWithFormat(arr, format);
            }
            else{
                return ToStringWithFormat(arr, "D");
            }
        }
        else{
            return ToStringWithFormat(arr, "D");
        }
    }
    //由字符串加载
    function InitByString(arr, g){
        g = g.replace(/\{|\(|\)|\}|-/g, "");
        g = g.toLowerCase();
        if (g.length != 32 || g.search(/[^0-9,a-f]/i) != -1){
            InitByOther(arr);
        }
        else{
            for (var i = 0; i < g.length; i++){
                arr.push(g[i]);
            }
        }
    }
    //由其他类型加载
    function InitByOther(arr){
        var i = 32;
        while(i--){
            arr.push("0");
        }
    }
    function ToStringWithFormat(arr, format){
        switch(format){
            case "N":
                return arr.toString().replace(/,/g, "");
            case "D":
                var str = arr.slice(0, 8) + "-" + arr.slice(8, 12) + "-" + arr.slice(12, 16) + "-" + arr.slice(16, 20) + "-" + arr.slice(20,32);
                str = str.replace(/,/g, "");
                return str;
            case "B":
                var str = ToStringWithFormat(arr, "D");
                str = "{" + str + "}";
                return str;
            case "P":
                var str = ToStringWithFormat(arr, "D");
                str = "(" + str + ")";
                return str;
            default:
                return new Guid();
        }
    }
}
//Guid 类的默认实例，其值保证均为零。
Guid.Empty = new Guid();
//初始化 Guid 类的一个新实例。
Guid.NewGuid = function(){
    var g = "";
    var i = 32;
    while(i--){
        g += Math.floor(Math.random()*16.0).toString(16);
    }
    return new Guid(g);
}
/*global tip*/
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
//判断微信浏览器
function isWeiXin(){
    var ua = window.navigator.userAgent.toLowerCase();
    if(ua.match(/MicroMessenger/i) == 'micromessenger'){
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

(function ($) {
    $.getUrlParam = function (name, default_value) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return decodeURI(r[2]); return '';
    }
})($);