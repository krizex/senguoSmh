$(document).ready(function(){
    $(".header").css("position","relative");
    $(".container").css("paddingTop","0");
    var height = $(window).height();
    $(".wrap-post").css("minHeight",height-60);
    $(".com-atical").on("click",function(){//评论按钮
        var id = $(this).attr("data-id");
        var _type= $('.reply-btn').attr("id");
         if(if_login=='False'){
           $('.pop-login').removeClass("hide");
           return false; 
        }
        if(_type=='reply'){
            $(".reply-ipt").val("").attr("placeholder","请输入评论");
        }
        $('.reply-btn').attr("id","comment").attr("data-id",id);
        $(".reply-ipt").focus();
    });
    calTextHeight();
    commentList(0);
    scrollLoading();
    getHotInfo("article");
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
            $this.toggleClass("add-store-active");
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
}).on("click",".comment-list .com-detail",function(){//评论回复
    if(if_login=='False'){
       $('.pop-login').removeClass("hide");
       return false; 
    }
    var _type=$('.reply-btn').attr("id");
    var id = $(this).parents("li").find(".nickname").attr("data-id");
    $(".reply-ipt").attr("placeholder","@"+$(this).parents("li").find(".nickname").html());
    $('.reply-btn').attr("id","reply").attr("data-id",id);
    /*$(".wrap-reply-box").removeClass("hide");
    $(".wrap-post-attr").removeClass("bm10");*/
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
            if($('#admire-atical').hasClass('add-great-active')){
                num_1=-1;
            }
            $('.article-great .num').text(parseInt($('.article-great .num').text())+num_1);
            $('.article-great i').toggleClass("icon-dz-active");
            $('#admire-atical').toggleClass("add-great-active");
        }else{
            Tip(res.error_text);
        }
    });
}).on("click","#reply",function(){//发表回复
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
}).on("click",".publish-article",function(){
    if(if_login=='False'){
        $('.pop-login').removeClass("hide");
        return false;
    }
    window.location.href=$(this).attr("url");
});
function calTextHeight(){
    setInterval(function(){
        var text = $(".reply-ipt").val();
        var width = $(".reply-ipt").width();
        $(".reply-ipt-temp").width(width);
        $(".reply-ipt-temp").html(text);
        var height = $(".reply-ipt-temp").height();
        $(".reply-ipt").height(height);
    },50);
}
var comment_item;
var finished=true;
var nomore =false;
var page=0;
var item=' <li class="forbid_click" data-id="{{id}}">'+
                '<dl class="group comment-item">'+
                    '<dd>'+
                        '<span class="img-border"><img src="{{imgurl}}" alt="用户头像"/></span>'+
                    '</dd>'+
                    '<dt>'+
                        '<p class="com-first">'+
                            '<a href="javascript:;" class="wrap-icon dianzan fr comment-great" data-id="{{id}}">'+
                            '<i class="post-dz {{ if great_if=="true" }}post-dz-active{{ /if }}"></i><span class="num">{{great_num}}</span>'+
                            '</a>'+
                            '<a href="javascript:;" class="nickname"  data-id="{{id}}">{{nickname}}</a>'+
                        '</p>'+
                        '<p class="com-detail">{{ if type==1 }}@{{nick_name}}{{/if}} {{comment}}</p>'+
                        '<p class="f12 c999 mt2">{{time}}'+
                            '{{ if author_if == "True" || comment_author == "true" }}<a href="javascript:;" class="del-comment fr c999"  data-id="{{id}}">删除</a>{{/if }}'+
                        '</p>'+
                    '</dt>'+
                '</dl>'+
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
              $('.loading').html("~没有更多了~").show();
        }
    });
}
function commentList(page){
    $.ajax({
        url:'/bbs/detail/'+$(".wrap-post").attr("data-id")+'?page='+page+"&action=comment",
        type:"get",
        success:function(res){
            if(res.success){
                var data=res.data;
                nomore=res.nomore;
                if(page==0&&nomore==true&&data.length==0){
                    $('.sofa').removeClass("hide");
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
function admireAtical(id,action,target){
    if(target.attr("data-statu")=="1") {
        return false;
    }
    target.attr("data-statu", "1");
    var url = "";
    var comment=$('.reply-ipt').val().trim();
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
        if(action=="reply"){
            $(".reply-ipt").val("");
        }
        if(res.success){
            $('.sofa').addClass("hide");
            $('.comment .num').text(parseInt($('.comment .num').text()));
            var data=res.data;
            commentItem(data,"new");
            $(".reply-ipt").val("").attr("placeholder","请输入评论");
            $(".wrap-post-attr").addClass("bm10");
            $(".com-atical .num").text(parseInt($(".com-atical .num").text())+1);
            $('html,body').scrollTop($(".comment-list").offset().top-80);
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
    var imgurl=data['imgurl'];
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
        $(".comment-list").prepend(list_item);
    }else{
       $(".comment-list").append(list_item); 
    }
}
var hotaticle_item = '<li data-id="{{id}}">'+
    '<a href="/bbs/detail/{{id}}">'+
    ' <p class="clip c333">{{title}}</p>'+
    '<div class="wrap-topic-attr">'+
    '<span>{{nickname}}</span>'+
    '<span class="wrap-icon people-see fr"><i class="icon-see"></i><span class="num">{{scan_num}}</span></span>'+
    '</div>'+
    '</a>'+
    '</li>';
function getHotInfo(action){
    $.ajax({
        url:'/bbs/hot?action='+action,
        type:"get",
        success:function(res){
            if(res.success){
                var datalist=res.datalist;
                for(var i in datalist){
                    var render = template.compile(hotaticle_item);
                    var id=datalist[i]['id'];
                    var title=datalist[i]['title'];
                    var scan_num=datalist[i]['scan_num'];
                    var nickname=datalist[i]['nickname'];
                    var list_item =render({
                        id:id,
                        title:title,
                        scan_num:scan_num,
                        nickname:nickname
                    });
                    $(".hot-artilce-list").append(list_item);
                }
            }
            else {
                return Tip(res.error_text);
            }
        }
    })
};
