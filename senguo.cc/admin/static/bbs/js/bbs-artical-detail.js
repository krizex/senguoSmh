var tid = 0;
$(document).ready(function(){
    tid = $(".wrap-left").attr("data-id");
    $(".com-atical").on("click",function(){//评论按钮
        var id = $(this).attr("data-id");
        var _type= $('.reply-btn').attr("id");
         if(if_login=='False'){
           $('.pop-login').removeClass("hide");
           return false; 
        }
        $(".wrap-post-attr").removeClass("bm10");
        if(_type=='reply'){
            $(".reply-ipt").val("").attr("placeholder","");
        }
        $(".wrap-reply-box").removeClass("hide");
        $('.reply-btn').attr("id","comment").attr("data-id",id);
        $(".reply-ipt").focus();
    });
    getHotInfo("article");
    commentList(0);
    scrollLoading();
    new QRCode($("#code2")[0], {
        width : 110,//设置宽高
        height : 110
    }).makeCode(window.location.href);
}).on("click",".del-comment",function(){  
    if(if_login=='False'){
       $('.pop-login').removeClass("hide");
       return false; 
    }
    var $this=$(this);
    var id = $this.attr("data-id");
    $(".pop-del").removeClass("hide");
    $(".del-sure").attr("data-id",id);
    comment_item=$this.parents("li");
    $(".com-atical .num").text(parseInt($(".com-atical .num").text())-1);
}).on("click",".del-sure",function(){
    if(if_login=='False'){
       $('.pop-login').removeClass("hide");
       return false; 
    }
    var $this=$(this);
    var id = $this.attr("data-id");
    var url="";
    var args={action:"del_comment",data:{"id":id}};
    $.postJson(url,args,function(res){
        if(res.success){
            comment_item.remove();
            $(".pop-del").addClass("hide");
        }else{
            Tip(res.error_text);
        }
    });
}).on("click","#store-atical",function(){//收藏
    if(if_login=='False'){
       $('.pop-login').removeClass("hide");
       return false; 
    }
    var $this = $(this);
    var url="";
    var args={action:"collect",data:""};
    $.postJson(url,args,function(res){
        if(res.success){
            var num = parseInt($this.html());
            if($this.hasClass('store-active')){
                $this.removeClass("store-active");
                num--;
            }else{
                $this.addClass("store-active");
                num++;
            }
            $this.html(num);
        }else{
            Tip(res.error_text);
        }
    });
}).on("click",".comment-great",function(){//评论点赞
    if(if_login=='False'){
       $('.pop-login').removeClass("hide");
       return false; 
    }
    var id = $(this).attr("data-id");
    var $this = $(this);
    var url="";
    var data={comment_id:id}
    var args={action:"comment_great",data:data};
    $.postJson(url,args,function(res){
        if(res.success){
            var num = parseInt($this.find(".great_num").html());
            if($this.hasClass('dianzan-active')){
                $this.removeClass("dianzan-active");
                num--;
            }else{
                $this.addClass("dianzan-active");
                num++;
            }
            $this.find(".great_num").html(num);
        }else{
            Tip(res.error_text);
        }
    });
}).on("click",".comment-reply",function(){//评论回复
    if(if_login=='False'){
       $('.pop-login').removeClass("hide");
       return false; 
    }
    var $this = $(this);
    var $div = $('<div class="wrap-comment-box mt6"><div class="wrap-tarea">'+
                '<textarea class="com-area com_area" placeholder="@'+$this.attr("data-name")+'"></textarea></div><div class="comm-btns">'+
                '<a href="javascript:;" class="comment-cancel">取消</a>'+
                '<a href="javascript:;" class="comment-back" id="comment_back" data-id="'+$this.attr("data-id")+'">回复</a>'+
            '</div></div>');
    $this.closest("li").append($div);
}).on("click","#comment_back",function(){//回复评论
    var id = $(this).attr("data-id");
    admireAtical(id,"reply",$(this));
}).on("click",".comment-cancel",function(){//回复评论
    $(this).closest(".wrap-comment-box").remove();
}).on("click",".add-great",function(){//文章点赞
    if(if_login=='False'){
       $('.pop-login').removeClass("hide");
       return false; 
    }
    var url="";
    var args={action:"article_great",data:""};
    var $this = $(this);
    $.postJson(url,args,function(res){
        if(res.success){
            var num = parseInt($this.html());
            if($this.hasClass('great-active')){
                $this.removeClass("great-active");
                num--;
            }else{
                $this.addClass("great-active");
                num++;
            }
            $this.html(num);
        }else{
            Tip(res.error_text);
        }
    });
}).on("click","#comment",function(){//发表评论
    if(if_login=='False'){
       $('.pop-login').removeClass("hide");
       return false; 
    }
    admireAtical(tid,"comment",$(this));
}).on("click","#del-atical",function(){//删除
    if(confirm("确认删除？")){
        var id = $(this).attr("data-id");
        delAtical(id);
    }
});
var comment_item;
var finished=true;
var nomore =false;
var page=0;
var item='<li>'+
            '<dl class="dl">'+
                '<dd>'+
                '<img src="{{imgurl}}" alt="{{nickname}}"/>'+
                '</dd>'+
                '<dt>'+
                    '<p class="f14 c666 clip">{{nickname}}<span class="ml10 c999">{{time}}</span></p>'+
                    '<p class="c333 mt12">'+
                    '{{ if type==1 }}@{{nick_name}}{{/if}} {{comment}}'+
                    '</p>'+
                '</dt>'+
            '</dl>'+
            '<div class="wrap-topic-attr">'+
                '<div class="fr">'+
                    '<a href="javascript:;" class="icon-topic dianzan comment-great {{if great_if=="true"}}dianzan-active{{/if}}" data-id="{{id}}">(<span class="great_num">{{great_num}}</span>)</a>'+
                    '<a href="javascript:;" class="icon-topic reply comment-reply" data-id="{{id}}" data-name="{{nickname}}">(<span class="reply_num">{{reply_num}}</span>)</a>'+
                '</div>'+
            '</div>'+
        '</li>';
function scrollLoading(){  
    $(window).scroll(function(){
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
        var range = 150;             //距下边界长度/单位px          //插入元素高度/单位px
        var totalheight = 0;
         var main = $(".container"); 
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);
        if(finished == true &&(main.height()-range) <= totalheight  &&nomore==false ) {
            finished=false;
            page++;
            commentList(page);
        }
        else if(nomore==true){

        }
    });
}
function commentList(page){
    $.ajax({
        url:'/bbs/detail/'+tid+'?page='+page+"&action=comment",
        type:"get",
        success:function(res){
            if(res.success){
                var data=res.data;
                nomore=res.nomore;
                if(page==0&&nomore==true&&data.length==0){
                    finished=false;
                }else{
                    finished=true;
                }
                for(var i in data){
                   commentItem(data[i]);
                }
            }
            else {
                return Tip(res.error_text);
            }
        }
    })
};
//删除文章
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
//评论
function admireAtical(id,action,target){
    if(target.attr("data-statu")=="1") {
        return false;
    }
    target.attr("data-statu", "1");
    var url = "";
    var comment=$.trim($('.detail-area').val());
    var data={};
    if(action=="reply"){
        data.comment_id=id;
        comment=$.trim($('.com_area').val());
    }
    if(!comment || comment.length>250){
        target.attr("data-statu", "0");
        return Tip("评论内容不能为空且不大于250个字符");
    }
    data.comment=comment;
    var args = {action:action,data:data};
    $.postJson(url,args,function(res){
        target.attr("data-statu", "0");
        if(res.success){
            if(action=="reply"){//回复评论
                var num = parseInt(target.closest('.wrap-comment-box').prev(".wrap-topic-attr").find(".reply_num").html())+1;
                target.closest('.wrap-comment-box').prev(".wrap-topic-attr").find(".reply_num").html(num);
                var num = parseInt($("#com_num").html())+1;
                $("#com_num").html(num);
                target.closest('.wrap-comment-box').remove();
            }else{//文章评论
                $(".detail-area").val("");
                var num = parseInt($("#com_num").html())+1;
                $("#com_num").html(num);
            }
            var data=res.data;
            commentItem(data,"new");
        }else{
            Tip(res.error_text);
        }
    });
}

function commentItem(data,_type){
    var render = template.compile(item);
    var id=data['id'];
    var title=data['title'];
    var time=data['time'];
    var type=data['type'];
    var nickname=data['nickname'];
    var great_num=data['great_num'];
    var reply_num=data['reply_num'] || 0;
    var nick_name=data['nick_name'];
    var comment=data['comment'];
    var imgurl=data['imgurl'] || '/static/images/person.png';
    var great_if=data['great_if'].toString();
    var author_if=$('#author_if').val().toString();
    var comment_author=data['comment_author'].toString();
    var list_item =render({
        id:id,
        title:title,
        time:time,
        type:type,
        nickname:nickname,
        great_num:great_num,
        nick_name:nick_name,
        comment:comment,
        imgurl:imgurl,
        great_if:great_if,
        author_if:author_if,
        comment_author:comment_author,
        reply_num:reply_num
    });
    if(_type=="new"){
        $("#comment_list").prepend(list_item);
    }else{
       $("#comment_list").append(list_item);
    }
}