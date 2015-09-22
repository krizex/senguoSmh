var ueditor = null,type= 1;
$(document).ready(function(){
    cookie.setCookie("next_url",window.location.href);
    $(".pop-win").on("click",function(e){/*关闭模态框*/
        if($(e.target).closest(".pop-content").length==0){
            $(".pop-win").addClass("hide");
        }
    });
    $(".close").on("click",function(){/*关闭模态框*/
        $(".pop-win").addClass("hide");
    });
    $(".goback").on("click",function(){
        history.back();
    });
    $(".board-list li").on("click",function(){
        var index = $(this).index();
        $(".board-list li").removeClass("active").eq(index).addClass("active");
        $("#publish").attr("data-id",$(this).attr("data-id"));
    });
    if($(".wrap-publish").attr("data-edit")=="True"){
        type = $(".publish-checks").children(".active").attr("data-id");
    }
    initEditor();
    initDate();
    $("#time_default").on("mousedown",function(){
        var $this = $(this).closest("li");
        type = parseInt($this.attr("data-id"));
        $(".publish-checks li").removeClass("active");
        $this.addClass("active");
    });
}).on("click",".select-box",function(){
    $(".pop-reply").removeClass("hide");
}).on("click",".type-sure",function(){
    var type=$(".board-list .active .tit").text();
    var type_id=$(".board-list .active").attr("data-id");
    $(".type").text(type).attr("data-id",type_id);
    $(".pop-reply").addClass("hide");
}).on("click",".publish-tie",function(){
    publishAtical($(this));
}).on("click",".publish-checks li",function(){
    type = parseInt($(this).attr("data-id"));
    $(".publish-checks li").removeClass("active");
    $(this).addClass("active");
}).on("click",".author-checks li",function(){
    $(this).toggleClass("active");
}).on("click",".dwo",function(e){
    if($(e.target).hasClass("dwbg")){
        return false;
    }
}).on("click",".cancel-btn",function(){
    $(this).closest(".pop-win").addClass("hide");
});
function publishAtical(target){
    if(target.attr("data-statu")=="1") {
        return false;
    }
    target.attr("data-statu", "1");
    var url = "";
    var classify =$(".type").attr("data-id");
    if(!classify){
        target.attr("data-statu", "0");
        return Tip("请选择板块");
    }
    var title=$(".title-ipt").val();
    if(title == "" || title.length>40){
        target.attr("data-statu", "0");
        return Tip("标题不能为空且不能超过20个字");
    }
    var article= ueditor.getContent();
    if(!article){
        target.attr("data-statu", "0");
        return Tip("文章内容不能为空");
    }
    var public = 0;
    if($(".if-bbs").hasClass("active")){
        public = 1;
    }
    var private = 0;
    if($(".if-my").hasClass("active")){
        private = 1;
    }
    var publictime="";
    if(type==2){
        publictime = $("#time_default").val();
    }
    var args = {
        action:"",
        data:{
            classify:classify,
            title:title,
            article:article,
            public:public,
            type:type,
            publictime:publictime,
            private:private
        }
    };

    $.postJson(url,args,function(res){
        target.attr("data-statu", "0");
        if(res.success){
            if(type==-1){
                Tip("已存到草稿箱");
                setTimeout(function(){
                    window.location.href="/bbs/profile?id=3";
                },1200);
            }else if(type==2){
                Tip("定时发布设置成功");
                setTimeout(function(){
                    window.location.href="/bbs/profile?id=0";
                },1200);
            }else{
                Tip("发布成功");
                setTimeout(function(){
                    window.location.href="/bbs";
                },1200);
            }
        }else{
            Tip(res.error_text);
        }
    });
}
function initDate(){
$(function () {
    var year = new Date().getFullYear();
    var month = new Date().getMonth();
    var day = new Date().getDate();
    var hour = new Date().getHours();
    var minute = new Date().getMinutes();
    if($(".wrap-publish").attr("data-edit")=="True" && $(".wrap-publish").attr("data-status")=="2"){
    }else{
        var month2 = month+1;
        if(month2<10){
            month2 = "0"+month2;
        }
        if(day<10){
            day = "0"+day;
        }
        if(hour<10){
            hour = "0"+hour;
        }
        if(minute<10){
            minute = "0"+minute;
        }
        var time = year+"-"+month2+"-"+day+" "+hour+":"+minute;
        $("#time_default").val(time);
    }
    var opt = {
    }
    opt.datetime = { preset : 'datetime', minDate: new Date(year,month,day,hour,minute), maxDate: new Date(2018,12,31,23,59), stepMinute: 5 };
    $('#time_default').scroller('destroy').scroller($.extend(opt['datetime'], { theme: 'android-ics light', mode: 'scroller', display: 'bottom', lang: 'zh' }));
});
}
function initEditor(){
    ueditor = UM.getEditor('ueditor');
    QINIU_TOKEN=$("#token").val();
    QINIU_BUCKET_DOMAIN="7rf3aw.com2.z0.glb.qiniucdn.com/"
}