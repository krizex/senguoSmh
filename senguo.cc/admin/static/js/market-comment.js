$(document).ready(function(){
    scrollLoading();
});

var finished=true;
var current_page=1;
var nomore =false;
function scrollLoading(){  
    $(window).scroll(function(){
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
        var range = 150;             //距下边界长度/单位px          //插入元素高度/单位px
        var totalheight = 0;
         var main = $(".container"); 
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);
        if(finished == true &&(main.height()-range) <= totalheight  &&nomore==false ) {
            finished=false;
            commentList(current_page);
        }
        else if(nomore==true){
              $('.loading').html("~没有更多了呢 ( > < )~").show();
        }
    });
}
function commentList(page){
    $('.loading').html("~努力加载中 ( > < )~").show();
    $.ajax({
        url:'/customer/comment?page='+page,
        type:"get",
        success:function(res){
            if(res.success){
                var comment_list=res.date_list;
                nomore=res.nomore;
                if(comment_list&&comment_list.length==0){
                     $('.loading').html("~没有更多了呢 ( > < )~").show();
                     return;          
                } 
                if(nomore==true){
                    $('.loading').html("~没有更多了呢 ( > < )~").show();
                }
                for(var i in comment_list){
                        var item='<li class="comment-item bg-white set-w100-fle">'
            +                            '<div class="img-box pull-left">'
            +                                    '<img src="{{img}}" class="user-img">'
            +                               '</div>'
            +                               '<div class="info sty1 pull-left pr10">'
            +                                   '<span class="user-name pull-left">{{name}}</span>'
            +                                   '<span class="comment-time pull-right">{{time}}</span>'
            +                               '</div>'
            +                               '<div class="comment-text sty1 pull-left pr10">{{comment}}</div>'
            +                              '{{ if reply}}<div class="comment text-green sty1 pull-left pr10">商家回复：<span class="reply-text">{{reply}}</span>{{/if}}'
            +                             '</div>'
            +                       '</li>';
                        var render = template.compile(item);
                        var img=comment_list[i]['img'];
                        var name=comment_list[i]['name'];
                        var time=comment_list[i]['time'];
                        var comment=comment_list[i]['comment'];
                        var reply=comment_list[i]['reply'];
                        var list_item =render({
                            img:img,
                            name:name,
                            time:time,
                            comment:comment,
                            reply:reply
                        });
                        $("#commnent-list").append(list_item);
                    }
                finished=true;
                current_page++;
            }
            else {
                noticeBox(res.error_text);
            }
        }
    })
};