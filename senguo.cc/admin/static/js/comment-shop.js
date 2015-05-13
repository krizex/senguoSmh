/**
 * Created by Administrator on 2015/4/28.
 */
var finished=true;
var current_page=1;
var nomore =false;
var width = 0;
$(document).ready(function(){
    width = parseInt($(".com-goods-lst").width()/4)-10;
    $(".com-goods-lst").find("img").each(function(){
        $(this).css({width:width+"px",height:width+"px"});
    });
    baguetteBox.run('.com-goods-lst',{
        buttons: false
    });
    var quality = parseInt($("#quality").html());
    var speed = parseInt($("#speed").html());
    var service = parseInt($("#service").html());
    initBar(quality,$("#quality_bar"));
    initBar(speed,$("#speed_bar"));
    initBar(service,$("#service_bar"));
    scrollLoading();
});
function initBar(point,$obj){
    if(point<33){
        $obj.addClass("bar1").css("width",point+"%");
    }else if(point>=33 && point<66){
        $obj.addClass("bar2").css("width",point+"%");
    }else{
        $obj.addClass("bar3").css("width",point+"%");
    }
}
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
                    return false;
                }
                if(nomore==true){
                    $('.loading').html("~没有更多了呢 ( > < )~").show();
                }
                for(var i in comment_list){
                    var item1='<li class="comment-item bg-white set-w100-fle">'
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
                    var item = '<li>'+
                                    '<dl class="ccom-item group">'+
                                    '<dd class="fl">'+
                                        '<div class="wrap-o-img">'+
                                            '<img src="{{img}}" width="50" height="50" alt="头像"/>'+
                                        '</div>'+
                                    '</dd>'+
                                    '<dt class="fl" class="right-com">'+
                                    '<p><span class="nor-txt">{{name}}</span><span class="time-txt ml20">{{time}}</span></p>'+
                                    '<p class="com-txt">{{comment}}</p>'+
                            '{{ if imgurls }}<ul class="group com-goods-lst">'+
                                '{{ each imgurls as img index }}'+
                                    '<li><a href="{{img}}" title=""><img style="width:'+width+'px;height:'+width+'px;" src="{{img}}?imageView2/5/w/200/h/200" alt="晒单图片"/></a></li>'+
                                '{{/each}}'+
                                '</ul>{{ /if }}'+
                            '{{ if reply }}'+
                                '<p class="reply-txt">商家回复：{{ reply }}</p>'+
                            '{{ /if }}'+
                            '</dt></dl></li>';
                    var render = template.compile(item);
                    var img=comment_list[i]['img'] || '/static/images/TDSG.png';
                    var name=comment_list[i]['name'];
                    var time=comment_list[i]['time'];
                    var comment=comment_list[i]['comment'];
                    var reply=comment_list[i]['reply'];
                    var imgurls = comment_list[i]['imgurls'];
                    var list_item =render({
                        img:img,
                        name:name,
                        time:time,
                        comment:comment,
                        reply:reply,
                        imgurls:imgurls
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