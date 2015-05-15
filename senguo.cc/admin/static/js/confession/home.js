$(document).ready(function(){
	getData(0);
	scrollLoading();
});
var page=1;
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

function getData(page){
	var url='';
	var action='get';
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
			                if(datalist&&datalist.length==0){
			                    $('.loading').html("~没有更多了呢 ( > < )~").show();
			                    return false;
			                }
			                if(nomore==true){
			                    $('.loading').html("~没有更多了呢 ( > < )~").show();
			                }
			                for(var i in datalist){
			                    var item ='<li>'+
						'<div class="box-left fl txt-ac">'+
							'<img src="{{imgurl}}" class="img"/>'+
							'<p>{{user}}</p>'+
							'<p>{{time}}</p>'+
						'</div>'+
						'<div class="box-right fl">'+
							'<p class="group mb10"><span class="fl">TO:{{name}}</span><span class="fr">{{floor}}楼</span></p>'+
							'<div class="bg-white mb10 confession">{{confession}}</div>'+
							'<div class="group">'+
								'<a href="javascript:;" class="fr ml10 text-grey3">点赞({{great}})</a>'+
								'<a href="javascript:;" class="fr ml10 text-grey3">评论({{comment}})</a>'+
								'<a href="javascript:;" class="fr ml10 text-grey3">猜</a>'+
							'</div>'+
						'</div>'+
					'</li>';
			                    var render = template.compile(item);
			                    var imgurl=datalist[i]['imgurl'] || '/static/images/TDSG.png';
			                    var user=datalist[i]['user'];
			                    var time=datalist[i]['time'];
			                    var comment=datalist[i]['comment'];
			                    var name=datalist[i]['name'];
			                    var confession = datalist[i]['confession'];
			                    var type = datalist[i]['type'];
			                    var floor =datalist[i]['floor'];
			                    var great=datalist[i]['great'];
			                    var comment=datalist[i]['comment'];
			                    var list_item =render({
			                        imgurl:imgurl,
			                        user:user,
			                        name:name,
			                        time:time,
			                        comment:comment,
			                        confession:confession,
			                        floor:floor,
			                        great:great
			                    });
			                    $(".cofession-list").append(list_item);
			                }
			                finished=true;
			}
			else {
				
			}
		},function(){
			return noticeBox('网络好像不给力呢~ ( >O< ) ~');
		},
		function(){
			return noticeBox('服务器貌似出错了~ ( >O< ) ~');
		}    
	);
}