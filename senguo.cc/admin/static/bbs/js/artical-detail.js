$(document).ready(function(){
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
    commentList(0);
    scrollLoading();
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
    var $this=$(this);
    var id=$this.attr("data-id");
    var url="";
    var args={action:"collect",data:""};
    $.postJson(url,args,function(res){
        if(res.success){
            //$this.children("i").toggleClass("i-store-active");
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
}).on("click",".comment-reply",function(){//评论回复
    if(if_login=='False'){
       $('.pop-login').removeClass("hide");
       return false; 
    }
    var _type=$('.reply-btn').attr("id");
    var id = $(this).parents("li").find(".nickname").attr("data-id");
    $(".reply-ipt").attr("placeholder","@"+$(this).parents("li").find(".nickname").html());
    $('.reply-btn').attr("id","reply").attr("data-id",id);
    $(".wrap-reply-box").removeClass("hide");
    $(".wrap-post-attr").removeClass("bm10");
    if(_type=='comment'){
        $(".reply-ipt").val("");
    }   
}).on("click",".add-great",function(){
    if(if_login=='False'){
       $('.pop-login').removeClass("hide");
       return false; 
    }
    var id=$('#admire-atical').attr("data-id");
    var url="";
    var args={action:"article_great",data:""};
    $.postJson(url,args,function(res){
        if(res.success){
            var num_1=1;
            if($('#admire-atical').children("i").hasClass('i-admire-active')){
                num_1=-1
            }
            $('.article-great .num').text(parseInt($('.article-great .num').text())+num_1);
            $('.article-great i').toggleClass("icon-dz-active");
            $('#admire-atical').children("i").toggleClass("i-admire-active");
        }else{
            Tip(res.error_text);
        }
    });
}).on("click","#comment_back",function(){//发表回复
    if(if_login=='False'){
       $('.pop-login').removeClass("hide");
       return false; 
    }
    var id = $(this).attr("data-id");
    admireAtical(id,"reply",$(this));
}).on("click","#comment",function(){//发表评论
    if(if_login=='False'){
       $('.pop-login').removeClass("hide");
       return false; 
    }
    var id = $(this).attr("data-id");
    admireAtical(id,"comment",$(this));
}).on("click","#del-atical",function(){//删除
    if(if_login=='False'){
       $('.pop-login').removeClass("hide");
       return false; 
    }
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
                    '<a href="javascript:;" class="icon-topic dianzan comment-great" data-id="{{id}}">赞</a>'+
                    '<a href="javascript:;" class="icon-topic reply comment-reply" data-id="{{id}}">回复</a>'+
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
    var id = $(".wrap-left").attr("data-id");
    $.ajax({
        url:'/bbs/detail/'+id+'?page='+page+"&action=comment",
        type:"get",
        success:function(res){
            if(res.success){
                var data=res.data;
                nomore=res.nomore;
                if(page==0&&nomore==true&&data.length==0){
                    //$('.sofa').removeClass("hide");
                }
                for(var i in data){
                   commentItem(data[i]);
                }
                finished=true;
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
    var data={comment:comment}
    if(action=="reply"){
        data.comment_id=id;
    }
    if(!comment){
        target.attr("data-statu", "0");
        return Tip("请输入评论内容!");
    }
    var args = {action:action,data:data};
    $.postJson(url,args,function(res){
        target.attr("data-statu", "0");
        if(res.success){
            if(action=="reply"){//回复评论
                $(".com_area").val("");
                target.closest('.wrap-comment-box').addClass("hide");
            }else{//文章评论
                $(".detail-area").val("");
                var data=res.data;
                commentItem(data,"new");
                //$(".com-atical .num").text(parseInt($(".com-atical .num").text())+1);
                //$('html,body').scrollTop($(".comment-list").offset().top);
            }
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
        comment_author:comment_author
    });
    if(_type=="new"){
        $("#comment_list").prepend(list_item);
    }else{
       $("#comment_list").append(list_item);
    }
}