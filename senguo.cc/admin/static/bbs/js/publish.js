var ueditor = null;
$(document).ready(function(){
    $(".board-list li").on("click",function(){
        var index = $(this).index();
        $(".board-list li").removeClass("active").eq(index).addClass("active");
        $("#publish").attr("data-id",$(this).attr("data-id"));
    });
    initEditor();
}).on("click",".select-box",function(){
    $(".pop-reply").removeClass("hide");
}).on("click",".type-sure",function(){
    var type=$(".board-list .active .tit").text();
    var type_id=$(".board-list .active").attr("data-id");
    $(".type").text(type).attr("data-id",type_id);
    $(".pop-reply").addClass("hide");
}).on("click",".publish-tie",function(){
    publishAtical($(this));
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
    var args = {
        action:"",
        data:{
            classify:classify,
            title:title,
            article:article
        }
    };

    $.postJson(url,args,function(res){
        if(res.success){
            Tip("发布成功");
            setTimeout(function(){
                window.location.href="/bbs/detail/"+res.id;
            },2000);
        }else{
            target.attr("data-statu", "0");
            Tip(res.error_text);
        }
    });
}

function initEditor(){
    ueditor = UM.getEditor('ueditor');
    QINIU_TOKEN=$("#token").val();
    QINIU_BUCKET_DOMAIN="shopimg.qiniudn.com/"
}