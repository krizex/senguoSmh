$(document).ready(function(){
	$(".container").css('minHeight',$(window).height()+"px");
	var action=$.getUrlParam('action');
	var _nomore=$('#data').attr('data-more');
	if(typeof(action) == undefined || action=='' ||action==null ){
		getData(0);
		scrollLoading();
	}
	else{

		if(_nomore =='False'){
			scrollLoading2();
		}
	}
	if(_nomore=='True'){
		$('.loading').html("~没有更多了呢 ( > < )~").show();
	}
	else{
		$('.loading').html("~努力加载中 ( > < )~").show();
	}
            SetCookie('confess_new',0);
}).on('click','.great',function(){
    var $this=$(this);
    var url='';
    var action='great';
    var id=$this.parents('li').attr('data-id');
    var num=parseInt($this.find('.num').text());
    var data={
        id:id
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                num++;
                $this.find('.num').text(num);
            }
            else {
                return noticeBox(res.error_text);
            }
        },function(){
            return noticeBox('网络好像不给力呢~ ( >O< ) ~');
        },
        function(){
            return noticeBox('服务器貌似出错了~ ( >O< ) ~');
        }    
    );
}).on('click','.filter li',function(){
    var $this =$(this);
    var type = $this.attr('data-type');
    data_action = type;
    $this.addClass('active').siblings('li').removeClass('active');
    $(".cofession-list").empty();
    page = 1;
    stop = true;
    getData(0);
    scrollLoading();
});

var page = 1;
var nomore = false;
var finished = true;
var data_action = 'new';
var stop = false;
function scrollLoading(){
    $(window).scroll(function(){
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
        var range = 150;             //距下边界长度/单位px          //插入元素高度/单位px
        var totalheight = 0;
        var main = $(".container");
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);
        if(finished == true &&(main.height()-range) <= totalheight  &&nomore==false ) {
            finished=false;
            getData(page);
            page++;
        }
        else if(nomore==true){
            $('.loading').html("~没有更多了呢 ( > < )~").show();
        }
    });
}

function scrollLoading2(){
    $(window).scroll(function(){
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
        var range = 150;             //距下边界长度/单位px          //插入元素高度/单位px
        var totalheight = 0;
        var main = $(".container");
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);
        if(finished == true &&(main.height()-range) <= totalheight  &&nomore==false&&stop==false ) {
            finished=false;
            getData2(page);
            page++;
        }
        else if(nomore==true){
            $('.loading').html("~没有更多了呢 ( > < )~").show();
        }
    });
}

function getData(page){
	var url='/lovewall/'+$('#data').attr('data-code');
	var action=data_action;
	var page=page;
	var args={
		action:action,
		page:page,
	};
	$.postJson(url,args,
		function(res){
			if(res.success)
			{
				  var datalist=res.datalist;
			                nomore=res.nomore;
			                data(datalist);
			                finished=true;
			}
			else {
				return noticeBox(res.error_text);
			}
		},function(){
			return noticeBox('网络好像不给力呢~ ( >O< ) ~');
		},
		function(){
			return noticeBox('服务器貌似出错了~ ( >O< ) ~');
		}    
	);
}

function getData2(page){
    var action=$.getUrlParam('action');
    $('.loading').html("~努力加载中 ( > < )~").show();
    $.ajax({
        url:'/lovewall/'+$('#data').attr('data-code')+'?action='+action+'&page='+page,
        type:"get",
        success:function(res){
            if(res.success){
	  var datalist=res.datalist;
                nomore=res.nomore;
                data(datalist);
                finished=true;
	}
	else {
		return noticeBox(res.error_text);
	}
    }})
};

function data(datalist){
            var shop_code=$('#data').attr('data-code');
            if(datalist&&datalist.length==0){
                $('.loading').html("~没有更多了呢 ( > < )~").show();
                return false;
            }
            if(nomore==true){
                $('.loading').html("~没有更多了呢 ( > < )~").show();
            }
            for(var i in datalist){
                var item ='<li class="{{sty}} font14" data-id="{{id}}">'+
                		'<div class="top group">'+
                			'<span>{{user}}  {{if name }}TO  {{name}} {{/if}}</span>'+
                		'</div>'+
                		'<div class="confession">'+
                                            '<p><a href="/lovewall/comment/'+shop_code+'?num={{id}}">{{confession}}</a></p>'+
                                            '<p class="group mt10"><a href="javascript:;" class="fr great ml10">点赞(<span class="num">{{great}}</span>)</a>'+
                                             '<a href="/lovewall/comment/'+shop_code+'?num={{id}}" class="comment fr text-grey3">评论(<span class="num">{{comment}}</span>)</a></p>'+
                                        '</div>'+        
                                        '<p class="group mt5 mr5"><span class="fr">{{time}}&nbsp;&nbsp;{{floor}}楼</span></p>'+                                           
	'</li>';
                var render = template.compile(item);
                var id=datalist[i]['id'];
                var imgurl=datalist[i]['imgurl'] || '/static/images/TDSG.png';
                var user=datalist[i]['user'];
                var time=datalist[i]['time'];
                var sex=Int(datalist[i]['sex']);
                var comment=datalist[i]['comment'];
                var name=datalist[i]['name'];
                var confession = datalist[i]['confession'];
                var type = Int(datalist[i]['type']);
                var floor =datalist[i]['floor'];
                var great=datalist[i]['great'];
                var comment=datalist[i]['comment'];
                var sty;
                if(sex==1){
                	sty='sty1';
                }
                else if(sex ==2 ){
                	sty='sty2';
                }
                else{
                	sty='sty0';
                }
                if(type==0){
                	user='匿名用户';
                           sty='sty0';	
                }
                var list_item =render({
                    id:id,
                    imgurl:imgurl,
                    user:user,
                    name:name,
                    time:time,
                    comment:comment,
                    confession:confession,
                    floor:floor,
                    great:great,
                    sty:sty
                });
                $(".cofession-list").append(list_item);
            }
}