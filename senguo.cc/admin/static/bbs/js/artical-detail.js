/**
 * Created by Administrator on 2015/6/12.
 */
$(document).ready(function(){

    
    $("#com-atical").on("click",function(){//评论按钮
        var id = $(this).attr("data-id");
        $(".wrap-reply-box").removeClass("hide");
        $('.reply-btn').attr("id","comment").attr("data-id",id);
        $(".reply-ipt").focus();
    });
}).on("click","#store-atical",function(){//收藏
    var id = $(this).attr("data-id");
    var $this=$(this);
    var id=$this.attr("data-id");
    var url="";
    var args={action:"collect",data:""};
    $.postJson(url,args,function(res){
        if(res.success){
            $this.children("i").toggleClass("i-store-active");
        }else{
            Tip(res.error_text);
        }
    });
}).on("click",".comment-great",function(){//评论点赞
    var id = $(this).attr("data-id");
    var $this=$(this);
    var id=$this.attr("data-id");
    var url="";
    var data={comment_id:id}
    var args={action:"comment_great",data:data};
    $.postJson(url,args,function(res){
        if(res.success){
            var num_1=1;
            if($this.children("i").hasClass('post-dz-active')){
                num_1=-1
            }
            $this.find('.num').text(parseInt($this.find('.num').text())+num_1);
            $this.children("i").toggleClass('post-dz-active')
        }else{
            Tip(res.error_text);
        }
    });
}).on("click",".comment-list .nickname",function(){//评论回复
    var id = $(this).attr("data-id");
    $(".reply-ipt").attr("placeholder","@"+$(this).html());
    $('.reply-btn').attr("id","reply").attr("data-id",id);
    $(".wrap-reply-box").removeClass("hide");
}).on("click","#admire-atical",function(){
    var $this=$(this);
    var id=$this.attr("data-id");
    var url="";
    var args={action:"article_great",data:""};
    $.postJson(url,args,function(res){
        if(res.success){
            var num_1=1;
            if($this.children("i").hasClass('i-admire-active')){
                num_1=-1
            }
            $('.article-great .num').text(parseInt($('.article-great .num').text())+num_1);
            $('.article-great i').toggleClass("icon-dz-active");
            $this.children("i").toggleClass("i-admire-active");
        }else{
            Tip(res.error_text);
        }
    });
}).on("click","#reply",function(){//发表回复
    var id = $(this).attr("data-id");
    admireAtical(id,"reply");
}).on("click","#comment",function(){//发表评论
    var id = $(this).attr("data-id");
    admireAtical(id,"comment");
}).on("click","#del-atical",function(){//删除
    if(confirm("确认删除？")){
        var id = $(this).attr("data-id");
        delAtical(id);
    }
});
var item=' <li data-id="{{id}}">'+
                '<dl class="group comment-item">'+
                    '<dd>'+
                        '<span class="img-border"><img src="{{imgurl}}" alt="用户头像"/></span>'+
                    '</dd>'+
                    '<dt>'+
                        '<p class="com-first">'+
                            '<a href="javascript:;" class="wrap-icon dianzan fr comment-great" data-id="{{id}}">'+
                            '<i class="post-dz"></i><span class="num">{{great_num}}</span>'+
                            '</a>'+
                            '<a href="javascript:;" class="nickname"  data-id="{{id}}">{{nickname}}</a>'+
                        '</p>'+
                        '<p class="com-detail">{{ if type==1 }}@{{nick_name}}{{/if}} {{comment}}</p>'+
                        '<p class="f12 c999 mt2">{{time}}</p>'+
                    '</dt>'+
                '</dl>'+
            '</li>';
            
function delAtical(id){
    var url = "";
    var args = {
        action:"delete",
        data:{id:id}
    };
    $.postJson(url,args,function(res){
        if(res.success){
            Tip("删除成功");
            setTimeout(function(){
                window.location.href="/bbs"
            },2000);
        }else{
            Tip(res.error_text);
        }
    });
}
function admireAtical(id,action){
    var url = "";
    var comment=$('.reply-ipt').val().trim();
    var data={comment:comment}
    if(action=="reply"){
        data.comment_id=id;
    }
    var args = {action:action,data:data};
    $.postJson(url,args,function(res){
        if(action=="reply"){
            $(".wrap-reply-box").addClass("hide");
            $(".reply-ipt").val("");
        }
        if(res.success){
            $('.comment .num').text(parseInt($('.comment .num').text()));
            var data=res.data;
            var render = template.compile(item);
            var id=data['id'];
            var title=data['title'];
            var time=data['time'];
            var type=data['type'];
            var nickname=data['nickname'];
            var great_num=data['great_num'];
            var nick_name=data['nick_name'];
            var comment=data['comment'];
            var imgurl=data['imgurl'];
            var list_item =render({
                id:id,
                title:title,
                time:time,
                type:type,
                nickname:nickname,
                great_num:great_num,
                nick_name:nick_name,
                comment:comment,
                imgurl:imgurl
            });
            $(".comment-list").prepend(list_item);
        }else{
            Tip(res.error_text);
        }
    });
}