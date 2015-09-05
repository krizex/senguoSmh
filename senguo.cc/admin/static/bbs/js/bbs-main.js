$(document).ready(function(){
    $(".menu-list li").on("click",function(){
        var id = parseInt($(this).attr("data-id"));
        $('#bbs-menu').text($(this).text());
        $(".wrap-menu-list").addClass("h0");
        page=0;
        _type=id;
        $('.atical-list').empty();
        articleList(0);
    });
    var link_action=$.getUrlParam("action");
    if(link_action=="official"){
        page=0;
        _type=0;
        $('#bbs-menu').text('官方公告');
    }else if(link_action=="update"){
        page=0;
        _type=1;
        $('#bbs-menu').text('产品更新');
    }else if(link_action=="dry"){
        page=0;
        _type=2;
        $('#bbs-menu').text('运营干货');
    }else{
        _type=100;
    }
    if($(".publish-box-bk").size()>0){//发布
        initEditor();
    }
    articleList(0);
    scrollLoading();
}).on("click",".atical-list li",function(e){
    var id=$(this).attr("data-id");
    if($(e.target).closest(".dianzan").size()==0){
    	window.location.href="/bbs/detail/"+id;
    } 
}).on("click",".atical-attr .dianzan",function(){
    if(if_login=='False'){
        $('.pop-login').removeClass("hide");
        return false; 
    }
	var $this=$(this);
	var id=$this.parents("li").attr("data-id");
	var url="/bbs/detail/"+id;
    var args={action:"article_great",data:""};
    $.postJson(url,args,function(res){
        if(res.success){
            var num_1=1;
            if($this.children("i").hasClass('icon-dz-active')){
                num_1=-1;
            }
            var num = parseInt($this.text())+num_1;
        	$this.children("span").html(num);
            $this.children("i").toggleClass('icon-dz-active');
        }else{
            Tip(res.error_text);
        }
    });
}).on("click","#go_publish",function(){
    
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
            articleList(page);
        }
        else if(nomore==true){
            $('.more-btn').html("~ 没有更多了 ~").show();
        }
    });
}
function articleList(page){
    $.ajax({
        url:'/bbs?page='+page+"&type="+_type,
        type:"get",
        success:function(res){
            if(res.success){
                var datalist=res.datalist;
                nomore=res.nomore;
                if(nomore==true){
                    $('.more-btn').html("~ 没有更多了 ~").show();
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
function initEditor(){
    var editor = UM.getEditor('ueditor',{toolbars: [
        ['fullscreen', 'source', 'undo', 'redo'],
        ['simpleupload', 'bold', 'italic', 'underline', 'fontborder', 'strikethrough', 'superscript', 'subscript', 'removeformat', 'formatmatch', 'autotypeset', 'blockquote', 'pasteplain', '|', 'forecolor', 'backcolor', 'insertorderedlist', 'insertunorderedlist', 'selectall', 'cleardoc']
    ]});
    QINIU_TOKEN=$("#token").val();
    QINIU_BUCKET_DOMAIN="7rf3aw.com2.z0.glb.qiniucdn.com/";
    /*if($obj.attr("data-text")){
        editor.body.innerHTML=$obj.attr("data-text");
    }*/
}