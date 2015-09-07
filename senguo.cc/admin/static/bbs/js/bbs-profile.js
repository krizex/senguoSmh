/**
 * Created by Administrator on 2015/6/11.
 */
var _type = 0,finished=false,page=0;
$(document).ready(function(){
    articleList(0);
    scrollLoading();
}).on("click",".nav-profle li",function(){
    var index = $(this).index();
    _type = index;
    page=0;
    $(".nav-profle li").removeClass("active").eq(index).addClass("active");
});
function scrollLoading(){
    $(window).scroll(function(){
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
        var range = 150;             //距下边界长度/单位px          //插入元素高度/单位px
        var totalheight = 0;
        var main = $(".bbs-container");
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);
        if(finished == true &&(main.height()-range) <= totalheight  &&nomore==false ) {
            finished=false;
            page++;
            articleList(page);
        }
        else if(nomore==true){
            $('.more-btn').html("~ 没有更多了 ~").show();
        }
    });
}
var notice = '<div class="wrap-item-box pm20">'+
                    '<div class="inform-item">'+
                        '<span class="fr c999">{{time}}</span>'+
                        '<img src="{{imgurl}}" alt="用户头像" class="inform-img"/>'+
                        '<span class="c333">{{name}}</span>'+
                        '<span class="ml10 c999">{{com_type}}了您的</span>'+
                        '<a href="javascript:;" class="dgreen f14">{{title}}</a>'+
                    '</div>'+
                    '<p class="c333 inform-txt">{{detail}}</p>'+
                '</div>';
function articleList(page){
    var action = "publish";
    if(_type==0){
        action = "publish";
    }else if(_type==1){
        action = "notice";
    }else if(_type==2){
        action = "collect";
    }else if(_type==3){
        action = "draft";
    }
    $.ajax({
        url:'/bbs/profile?page='+page+"&action="+action,
        type:"get",
        success:function(res){
            if(res.success){
                var datalist=res.datalist;
                nomore=res.nomore;
                if(nomore==true){
                    $('.more-btn').html("~ 没有更多了 ~");
                }else{
                    insertProfile(datalist);
                }
                finished=true;
            }
            else {
                return Tip(res.error_text);
            }
        }
    })
};
var cur_time = "";
function insertProfile(data){
    if(_type==0 || _type==2){
        for(var key in data){
            var $item = $("#item1").children("li").clone();
            $item.attr("data-id",data[key].id);
            $item.find(".topic-title").html(data[key].title).attr("title",data[key].title);
            $item.find(".dianzan").html(data[key].commentnum);
            $item.find(".reply").html(data[key].greatnum);
            $item.find(".topic-class").html(data[key].type);
            $item.find(".topic-tm").html(data[key].time);
            $("#topic_list").append($item);
        }
    }else if(_type==3){
        for(var key in data){
            var $item = $("#item2").children("li").clone();
            $item.attr("data-id",data[key].id);
            $item.find(".topic-title").attr("title",data[key].title);
            $item.find(".topic-tt").html(data[key].title);
            $item.find(".topic-tm").html(data[key].time);
            $("#topic_list").append($item);
        }
    }else if(_type==1){//通知
        for(var key in data){
            var kdate = key;
            var items = data[key];
            var $li = $('<li><span class="li-roll"></span><span class="inform-time">'+kdate+'</span></li>');
            for(var o in items){
                var render = template.compile(notice);
                var id=items[o]['id'];
                var title=items[o]['title'];
                var time=items[o]['time'];
                var type=items[o]['type'];
                var nickname=items[o]['nickname'];
                var date=items[o]['date'];
                var imgurl = items[o]['imgurl'];
                var comment = items[o]['comment'];
                var detail = '';
                var com_type = '赞';
                if(type=="comment"){
                    detail = comment;
                    com_type = '评论';
                }
                var list_item = render({
                    id:id,
                    title:title,
                    time:time,
                    type:type,
                    nickname:nickname,
                    date:date,
                    imgurl:imgurl,
                    detail:detail,
                    com_type:com_type
                });
                if(cur_time != kdate){
                    $li.append(list_item);
                }else{
                    $("#inform_list").children().last().append(list_item);
                }
            }
            if(cur_time != kdate){
                $("#inform_list").append($li);
                cur_time==kdate;
            }
        }
        $("#inform_list").removeClass("hide");
    }
}