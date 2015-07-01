var finished=true;
var current_page=1;
var nomore =false;
var width = 0;
var curItem = null;
$(document).ready(function(){
    $(".phone-box").css("background","#fff").css("minHeight",$(window).height()+"px");
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
    $(document).on("click",".reply-btn",function(){//回复
        curItem = $(this).closest("dl");
        $("#reply-text").val("");
        $(".pop-reply").removeClass("hide");
    });
    $(document).on("click",".commit-reply",function(){
        console.log(curItem);
        var text = $("#reply-text").val();
        var id = curItem.attr("data-id");
        commitReply(id,text);
    })
});

//提交评论
function commitReply(id,text){
    var url = "/admin/comment";
    var args ={
        action:"reply",
        order_id:parseInt(id),
        reply:text
    };
    $.postJson(url,args,function(res){
        if(res.success){
            var dt = curItem.children("dt");
            if(dt.find(".reply-txt").size()>0){
                dt.find(".reply-txt").html("商家回复："+text);
            }else{
                dt.append('<p class="reply-txt">商家回复：'+text+'</p>');
            }
            $(".pop-reply").addClass("hide");
            Tip("回复成功");
        }else{
            Tip(res.error_text);
        }
    });
}
function initBar(point,$obj){
    $obj.css("width",point+"%");
    /*if(point<33){
     $obj.css("width",point+"%");
     }else if(point>=33 && point<66){
     $obj.css("width",point+"%");
     }else{
     $obj.css("width",point+"%");
     }*/
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
        url:'/madmin/comment?page='+page,
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
                    var item = '<li>'+
                        '<p class="order-time item">{{time}}<span class="fr mr10">第{{index}}条</span></p>'+
                        '<dl class="ccom-item group"  data-id="{{id}}">'+
                        '<dd class="fl">'+
                        '<div class="wrap-o-img">'+
                        '<img src="{{img}}" width="50" height="50" alt="头像"/>'+
                        '</div>'+
                        '</dd>'+
                        '<dt class="fl" class="right-com">'+
                        '<p><span class="nor-txt">{{name}}</span><span class="time-txt fr mr10">订单号 : <a href="javascript:;">{{order_num}}</a></span></p>'+
                        '<p class="com-txt"><span class="c999">质量 : </span>{{commodity_quality}} <span class="c999 ml5">速度 : </span>{{send_speed}} <span class="c999 ml5">服务 : </span>{{shop_service}}</p>'+
                        '<p class="com-txt"><a href="javascript:;" class="fr mr10 ml5 reply-btn">回复</a>{{comment}}</p>'+
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
                    var id=comment_list[i]['id'];
                    var img=comment_list[i]['img'] || '/static/images/TDSG.png';
                    var name=comment_list[i]['name'];
                    var time=comment_list[i]['time'];
                    var comment=comment_list[i]['comment'];
                    var reply=comment_list[i]['reply'];
                    var imgurls = comment_list[i]['imgurls'];
                    var commodity_quality=comment_list[i]['commodity_quality'];
                    var send_speed=comment_list[i]['send_speed'];
                    var shop_service=comment_list[i]['shop_service'];
                    var order_num=comment_list[i]['order_num'];
                    var index=comment_list[i]['index'];
                    var list_item =render({
                        id:id,
                        img:img,
                        name:name,
                        time:time,
                        comment:comment,
                        reply:reply,
                        imgurls:imgurls,
                        commodity_quality:commodity_quality,
                        send_speed:send_speed,
                        shop_service:shop_service,
                        order_num:order_num,
                        index:index
                    });
                    $(".point-com-lst").append(list_item);
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