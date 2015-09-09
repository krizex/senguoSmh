var ueditor = null,_type = 100,_search=false,key="";
$(document).ready(function(){
    getHotInfo("article");
    getHotInfo("customer");
    if($(".publish-box-bk").size()>0){//发布&编辑
        initEditor();
    }else{
        if($.getUrlParam("id")){
            _type = parseInt($.getUrlParam("id"));
            $(".nav-list a").removeClass("active");
            $(".nav-list").find("a[data-id='"+_type+"']").addClass("active");
        }
        articleList(0,true);
        scrollLoading();
    }
}).on("mouseover",".wrap-choose-type",function(){
    $(".classify_type").show();
}).on("mouseout",".wrap-choose-type",function(){
    $(".classify_type").hide();
}).on("mouseover",".wrap-choose-time",function(){
    $(this).children(".time-list").show();
}).on("mouseout",".wrap-choose-time",function(){
    $(this).children(".time-list").hide();
}).on("click",".classify_type li",function(){
    var id=$(this).attr("data-id");
    $("#choose_type").attr("data-id",id).html($(this).html());
    $(".classify_type").hide();
}).on("click",".atical-list li",function(e){
    var id=$(this).attr("data-id");
    if($(e.target).closest(".dianzan").size()==0){
        window.location.href="/bbs/detail/"+id;
    }
}).on("click","#go_publish",function(){
    if(if_login=='False'){
        $('.pop-login').removeClass("hide");
        return false;
    }
    var url = $(this).attr("url");
    window.location.href=url;
}).on("click",".cancel-pop,.close-win",function(){
    $(this).closest(".pop-win").addClass("hide");
}).on("click",".cancel-bn",function(){
    window.location.href="/bbs";
}).on("click",".now-bn",function(){//发布
    publishAtical($(this),1)
}).on("click",".publish-bn",function(){//定时发布
    $(".pop-now").removeClass("hide");
}).on("click",".draft-bn",function(){//存草稿
    publishAtical($(this),-1)
}).on("click","#commit_btn",function(){
    var year = $("#year").html();
    var month = $("#month").html();
    var day = $("#day").html();
    var hour = $("#hour").html();
    var minute = $("#minute").html();
    $(this).attr("data-time",year+"-"+month+"-"+day+" "+hour+":"+minute);
    publishAtical($(this),2)
}).on("click",".time-list li",function(){
    $(this).closest(".wrap-choose-time").find("span").html($(this).html());
    $(this).closest(".time-list").hide();
}).on("click",".checkbox",function(){
    $(this).toggleClass("checked");
}).on("keydown","#search_bbs",function(e){
    if(e.keyCode==13){
        key = $.trim($("#search_bbs").val());
        if(key==""){
            return Tip("请输入关键字");
        }else{
            page = 0;
            articleSearch(0,key,true);
        }
    }
}).on("click","#search_btn",function(){
    key = $.trim($("#search_bbs").val());
    if(key==""){
        return Tip("请输入关键字");
    }else{
        page = 0;
        articleSearch(0,key,true);
    }
}).on("click","#topic_list li",function(e){
    if($(e.target).hasClass("dianzan")){//点赞
        if(if_login=='False'){
            $('.pop-login').removeClass("hide");
            return false;
        }
        var $this=$(e.target);
        var id=$this.parents("li").attr("data-id");
        var url="/bbs/detail/"+id;
        var args={action:"article_great",data:""};
        $.postJson(url,args,function(res){
            if(res.success){
                var num = parseInt($this.html());
                if($this.hasClass('dianzan-active')){
                    $this.removeClass("dianzan-active");
                    num--;
                }else{
                    $this.addClass("dianzan-active");
                    num++;
                }
                $this.html(num);
            }else{
                Tip(res.error_text);
            }
        });
    }else{
        var id = $(this).attr("data-id");
        window.location.href="/bbs/detail/"+id;
    }
});
var finished=true;
var nomore =false;
var page=0;
var _type=100;
var item='<li data-id="{{id}}">'+
            '<h4 class="topic-title clip" title="{{title}}">{{title}}</h4>'+
            '<div class="wrap-topic-attr">'+
                ' <div class="fr">'+
                    '<a href="javascript:;" class="icon-topic dianzan {{great_if}}">{{great_num}}</a>'+
                    '<a href="javascript:;" class="icon-topic reply">{{comment_num}}</a>'+
                '</div>'+
                '<span class="topic-class">{{type}}</span>'+
                '<span>{{nickname}}</span>'+
                '<span>{{time}}</span>'+
            '</div>'+
        '</li>';
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
            if(_search){
                articleSearch(page,key,false);
            }else{
                articleList(page,false);
            }
        }
        else if(nomore==true){
            $('.more-btn').html("~ 没有更多了 ~").show();
        }
    });
}
function articleList(page,flag){
    _search=false;
    $.ajax({
        url:'/bbs?page='+page+"&type="+_type,
        type:"get",
        success:function(res){
            if(res.success){
                var datalist=res.datalist;
                nomore=res.nomore;
                if(nomore==true){
                    $('.more-btn').html("~ 没有更多了 ~");
                }
                if(flag==true){
                    $("#topic_list").empty();
                }
                for(var i in datalist){
                        var render = template.compile(item);
                        var id=datalist[i]['id'];
                        var title=datalist[i]['title'];
                        var time=datalist[i]['time'];
                        var type=datalist[i]['type'];
                        var nickname=datalist[i]['nickname'];
                        var great_num=datalist[i]['great_num'];
                        var comment_num=datalist[i]['comment_num'];
                        var great_if=datalist[i]['great_if'];
                        if(great_if==true){
                            great_if='dianzan-active';
                        }
                        var list_item =render({
                            id:id,
                            title:title,
                            time:time,
                            type:type,
                            nickname:nickname,
                            great_num:great_num,
                            comment_num:comment_num,
                            great_if:great_if
                        });
                        $("#topic_list").append(list_item);
                    }
                finished=true;
            }
            else {
                return Tip(res.error_text);
            }
        }
    })
};
function articleSearch(page,search,flag){
    _search=true;
    var url="/bbs/search";
    var args={page:page,data:search};
    $.postJson(url,args,function(res){
        if(res.success){
            var datalist=res.datalist;
            nomore=res.nomore;
            if(flag){
                 $("#topic_list").empty();
            }
            if(nomore==true){
                $('.more-btn').html("~ 没有更多了 ~");
                if(page==0&&datalist.length==0){
                    $('.more-btn').html("~ 没有搜索结果 ~");
                }
            }
            for(var i in datalist){
                var render = template.compile(item);
                var id=datalist[i]['id'];
                var title=datalist[i]['title'];
                var time=datalist[i]['time'];
                var type=datalist[i]['type'];
                var nickname=datalist[i]['nickname'];
                var great_num=datalist[i]['great_num'];
                var comment_num=datalist[i]['comment_num'];
                var great_if=datalist[i]['great_if'];
                if(great_if==true){
                    great_if='dianzan-active';
                }
                var list_item =render({
                    id:id,
                    title:title,
                    time:time,
                    type:type,
                    nickname:nickname,
                    great_num:great_num,
                    comment_num:comment_num,
                    great_if:great_if
                });
                $("#topic_list").append(list_item);
            }
            finished=true;
        }else{
            Tip(res.error_text);
        }
    });
};
function initEditor(){
    ueditor = UM.getEditor('ueditor',{toolbars: [
        ['fullscreen', 'source', 'undo', 'redo'],
        ['simpleupload', 'bold', 'italic', 'underline', 'fontborder', 'strikethrough', 'superscript', 'subscript', 'removeformat', 'formatmatch', 'autotypeset', 'blockquote', 'pasteplain', '|', 'forecolor', 'backcolor', 'insertorderedlist', 'insertunorderedlist', 'selectall', 'cleardoc']
    ]});
    QINIU_TOKEN=$("#token").val();
    QINIU_BUCKET_DOMAIN="7rf3aw.com2.z0.glb.qiniucdn.com/";

}
function publishAtical(target,type){
    if(target.attr("data-statu")=="1") {
        return false;
    }
    target.attr("data-statu", "1");
    var url = "";
    var classify =$("#choose_type").attr("data-id");
    if(!classify){
        target.attr("data-statu", "0");
        return Tip("请选择板块");
    }
    var title=$(".article_title").val();
    if(title == "" || title.length>21){
        target.attr("data-statu", "0");
        return Tip("标题不能为空且不能超过20个字");
    }
    var article= ueditor.getContent();
    if(!article){
        target.attr("data-statu", "0");
        return Tip("文章内容不能为空");
    }
    var public = 0;
    if($(".if_bbs").hasClass("checked")){
        public = 1;
    }
    var private = 0;
    if($(".if_my").hasClass("checked")){
        private = 1;
    }
    var publictime="";
    if(type==2){
        publictime = $("#commit_btn").attr("data-time");
    }
    var args = {
        action:"",
        data:{
            classify:classify,
            title:title,
            article:article,
            public:public,
            type:type,
            publictime:publictime,
            private:private
        }
    };
    $.postJson(url,args,function(res){
        target.attr("data-statu", "0");
        if(res.success){
            if(type==-1){
                Tip("已存到草稿箱");
                setTimeout(function(){
                    window.location.href="/bbs/profile?id=3";
                },2000);
            }else if(type==2){
                Tip("定时发布设置成功");
                setTimeout(function(){
                    window.location.href="/bbs/profile?id=0";
                },2000);
            }else{
                Tip("发布成功");
                setTimeout(function(){
                    window.location.href="/bbs";
                },2000);
            }
        }else{
            Tip(res.error_text);
        }
    });
}
