/**
 * Created by Administrator on 2015/6/12.
 */
$(document).ready(function(){
    $("#search-ipt").on("keyup",function(e){
        if($(this).val().trim()==""){
        }else{
            _search=$(this).val().trim();
            articleList(0,$(this).val().trim());
        }
    });
    scrollLoading();
}).on('click','#search-article',function(){
    var search=$("#search-ipt").val().trim();
    if(!search){
        return noticeBox('请输入商品名称关键字');
    }
    _search=search;
    articleList(0,search);
}).on("click",".atical-list li",function(){
    var id=$(this).attr("data-id");
    window.location.href="/bbs/detail/"+id;
});
var item='<li data-id="{{id}}">'+
            '<p class="title"><span class="atical-mark">{{type}}</span>{{title}}</p>'+
            '<div class="atical-attr">'+
                '<span class="fr">'+
                    '<a href="javascript:;" class="wrap-icon dianzan mr10"><i class="icon-dz"></i>{{great_num}}</a>'+
                    '<a href="javascript:;" class="wrap-icon comment"><i class="icon-com"></i>{{comment_num}}</a>'+
                '</span>'+
                '<span class="time mr10">{{time}}</span>'+
                '<span class="author">{{nickname}}</span>'+
            '</div>'+
        '</li>';

var finished=true;
var nomore =false;
var page=0;
var _search;
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
            articleList(page,_search);
        }
        else if(nomore==true){
              $('.loading').html("~没有更多搜索结果了~").show();
        }
    });
}
function articleList(page,search){
    $('.wrap-loading-box').removeClass('hide');
    var url="";
    var args={page:page,data:search};
    $.postJson(url,args,function(res){
        if(res.success){
             var datalist=res.datalist;
                nomore=res.nomore;
                $('.atical-list').empty();
                if(nomore==true){
                    $('.wrap-loading-box').addClass('hide');
                    $('.loading').html("~没有更多搜索结果了~").show();
                    if(page==0&&datalist.length==0){
                        $('.loading').html("无搜索结果").show();
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
        }else{
            $('.wrap-loading-box').addClass('hide');
            Tip(res.error_text);
        }
    });
};