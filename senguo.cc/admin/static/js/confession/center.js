$(document).ready(function(){
    var nomore=$('#nomore').val();
    if(nomore=='True'){
                  $('.loading').html("~没有更多了呢 ( > < )~").show();
        }
    scrollLoading();
    SetCookie('confess_new',0);
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
    var action=$.getUrlParam('action');
    $.ajax({
        url:'/confession/list?action='+action+'&page='+page,
        type:"get",
        success:function(res){
            if(res.success){
                var datalist=res.datalist;
                nomore=res.nomore;
                if(datalist&&datalist.length==0){
                     $('.loading').html("~没有更多了呢 ( > < )~").show();
                     return;          
                } 
                if(nomore==true){
                    $('.loading').html("~没有更多了呢 ( > < )~").show();
                }
                for(var i in datalist){
                        var item ='<li class="fl">'+
                                            '<p class="mb10 group">'+
                                                '<span class="fl text-grey6">From:{{from}}&nbsp;&nbsp;To:{{name}}</span>'+
                                                '<span class="fr text-grey6">{{time}}</span>'+
                                            '</p>'+
                                            '<p>{{confession}}</p>'+
                                        '</li>';
                        var render = template.compile(item);
                        var time=datalist[i]['time'];
                        var from=datalist[i]['fromwho'];
                        var name=datalist[i]['name'];
                        var confession = datalist[i]['confession'];
                        var type = datalist[i]['type'];
                        if(type==1){
                            from='匿名用户'
                        }
                        var list_item =render({
                            from:from,
                            name:name,
                            time:time,
                            confession:confession,
                        });
                $(".list-box").append(list_item);
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