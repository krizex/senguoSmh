/**
 * Created by Administrator on 2015/6/15.
 */
$(document).ready(function(){

    $("#bbs-menu").on("click",function(){
        $(".wrap-menu-list").toggleClass("h0");
    });
    $(".menu-list li").on("click",function(){
        var id = parseInt($(this).attr("data-id"));
        $(".wrap-menu-list").addClass("h0");
        page=0;
        articleList(0,id);
    });
    articleList(0,100);
    scrollLoading();
}).on("click",".atical-list li",function(e){
    var id=$(this).attr("data-id");
    if($(e.target).closest(".dianzan").size()==0){
    	window.location.href="/bbs/detail/"+id;
    } 
}).on("click",".dianzan",function(){
	var $this=$(this);
	var id=$this.parents("li").attr("data-id");
	var url="/bbs/detail/"+id;
    var args={action:"article_great",data:""};
    $.postJson(url,args,function(res){
        if(res.success){
        	$this.text(parseInt($this.text()+1));
        }else{
            Tip(res.error_text);
        }
    });
});
var item='<li data-id="{{id}}">'+
            '<p class="title"><span class="atical-mark">{{type}}</span>{{title}}</p>'+
            '<div class="atical-attr">'+
                '<span class="fr">'+
                    '<a href="javascript:;" class="wrap-icon dianzan"><i class="icon-dz"></i>{{great_num}}</a>'+
                    '<a href="javascript:;" class="wrap-icon comment"><i class="icon-com"></i>{{comment_num}}</a>'+
                '</span>'+
                '<span class="time mr10">{{time}}</span>'+
                '<span class="author">{{nickname}}</span>'+
            '</div>'+
        '</li>';

var finished=true;
var nomore =false;
var page=0;
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
            articleList(page);
        }
        else if(nomore==true){
              $('.loading').html("~没有更多了~").show();
        }
    });
}
function articleList(page,type){
    $('.wrap-loading-box').removeClass('hide');
    $.ajax({
        url:'/bbs?page='+page+"&type="+type,
        type:"get",
        success:function(res){
            if(res.success){
                var datalist=res.datalist;
                nomore=res.nomore;
                $('.atical-list').empty();
                if(nomore==true){
                	$('.wrap-loading-box').addClass('hide');
                    $('.loading').html("~没有更多了~").show();
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
                        var list_item =render({
                            id:id,
                            title:title,
                            time:time,
                            type:type,
                            nickname:nickname,
                            great_num:great_num,
                            comment_num:comment_num
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