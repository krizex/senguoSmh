(function ($) {
    $.getUrlParam = function (name, default_value) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]); return default_value || null;
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
    return Math.round(target*1000)/1000;
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