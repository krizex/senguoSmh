/**
 * Created by Administrator on 2015/6/12.
 */
$(document).ready(function(){

    $("#store-atical").on("click",function(){//收藏
        var id = $(this).attr("data-id");
        storeAtical(id)
    });
    $("#com-atical").on("click",function(){//评论按钮
        var id = $(this).attr("data-id");
        $(".wrap-reply-box").removeClass("hide");
    });
    $("#reply").on("click",function(){//发表评论
        var id = $(this).attr("data-id");
        admireAtical(id);
    });
    $("#admire-atical").on("click",function(){//点赞
        var id = $(this).attr("data-id");
        zanAtical(id,$(this));
    });
}).on("click",".comment-great",function(){//评论点赞
    var id = $(this).attr("data-id");
    zanComment(id,$(this));
}).on("click",".comment-list .nickname",function(){//评论回复
    var id = $(this).attr("data-id");
    $(".reply-ipt").attr("placeholder","@"+$(this).html());
    $(".wrap-reply-box").removeClass("hide");
});
function replyComment(id){
    var url = "";
    var args = "";
    $.postJson(url,args,function(res){
        if(res.success){

        }else{
            Tip(res.error_text);
        }
    });
}
function zanComment(id,$obj){
    var url = "";
    var args = "";
    $.postJson(url,args,function(res){
        if(res.success){
            $obj.children("i").toggleClass("post-dz-active");
        }else{
            Tip(res.error_text);
        }
    });
}
function storeAtical(id){
    var url = "";
    var args = "";
    $.postJson(url,args,function(res){
        if(res.success){
            $obj.children("i").toggleClass("i-store-active");
        }else{
            Tip(res.error_text);
        }
    });
}
function zanAtical(id,$obj){
    var url = "";
    var args = "";
    $.postJson(url,args,function(res){
        if(res.success){
            $obj.children("i").toggleClass("i-admire-active");
        }else{
            Tip(res.error_text);
        }
    });
}
function admireAtical(id){
    var url = "";
    var args = "";
    $.postJson(url,args,function(res){
        if(res.success){

        }else{
            Tip(res.error_text);
        }
    });
}