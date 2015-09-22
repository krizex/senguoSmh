var _type = 100,_search=false,key="";
$(document).ready(function(){
    var height = $(window).height();
    //$(".atical-list").css("minHeight",height-40);
    $(".menu-list li").on("click",function(){
        var id = parseInt($(this).attr("data-id"));
        var text = $(this).children("span").html();
        $("#title").html(text);
        $(".menu-list li").removeClass("active");
        $(this).addClass("active");
        $(".wrap-menu-list").addClass("h0");
        page=0;
        _type=id;
        articleList(0,true);
    });
    if($.getUrlParam("search")){
        var key = $.getUrlParam("search");
        _search = true;
        page = 0;
        articleSearch(0,key,true);
    }else{
        if($.getUrlParam("id")){
            _type = parseInt($.getUrlParam("id"));
            $(".menu-list li").removeClass("active");
            $(".menu-list").find("li[data-id='"+_type+"']").addClass("active");
            $("#title").html($(".menu-list").find("li[data-id='"+_type+"']").children("span").html());
        }
        articleList(0,true);
        scrollLoading();
    }
    /*var link_action=$.getUrlParam("action");
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
    articleList(0);
    scrollLoading();*/
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
}).on("click",".right-icons",function(){
    if(if_login=='False'){
        $('.pop-login').removeClass("hide");
        return false;
    }
    window.location.href=$(this).attr("url");
});
var finished=true;
var nomore =false;
var page=0;
var _type=100;
var item='<li data-id="{{id}}">'+
            '<p class="title"><span class="atical-mark">{{type}}</span>{{title}}</p>'+
            '<div class="atical-attr">'+
                '<span class="fr">'+
                    '<a href="javascript:;" class="wrap-icon dianzan mr10"><i class="icon-dz2 {{great_if}}"></i><span>{{great_num}}</span></a>'+
                    '<a href="javascript:;" class="wrap-icon comment"><i class="icon-com2"></i>{{comment_num}}</a>'+
                '</span>'+
                '<span class="time mr10">{{time}}</span>'+
                '<span class="author">{{nickname}}</span>'+
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
            if(_search){
                articleSearch(page,key,false);
            }else{
                articleList(page,false);
            }
        }
        else if(nomore==true){
            $('.loading').html("~ 没有更多了 ~").show();
        }
    });
}
function articleList(page,flag){
    $('.wrap-loading-box').removeClass('hide');
    $.ajax({
        url:'/bbs?page='+page+"&type="+_type,
        type:"get",
        success:function(res){
            if(res.success){
                var datalist=res.datalist;
                nomore=res.nomore;
                if(nomore==true){
                	$('.wrap-loading-box').addClass('hide');
                    $('.loading').html("~ 没有更多了 ~").show();
                }
                if(flag==true){
                    $(".atical-list").empty();
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
                            great_if='icon-dz-active';
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
                        $(".atical-list").append(list_item);
                    }
                finished=true;
                $('.wrap-loading-box').addClass('hide');
            }
            else {
            	$('.wrap-loading-box').addClass('hide');
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
                $(".atical-list").empty();
            }
            if(nomore==true){
                $('.loading').html("~ 没有更多了 ~").show();
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
                    great_if='icon-dz-active';
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
                $(".atical-list").append(list_item);
            }
            finished=true;
        }else{
            Tip(res.error_text);
        }
    });
};
