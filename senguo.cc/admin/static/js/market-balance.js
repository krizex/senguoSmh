$(document).ready(function(){
	litsitem(1);
	scrollLoading();
    localStorage.setItem("shopName",$("#shopName").html());
});

var page=1;
var finished=true;
var nomore=false;
$('.loading').html("~努力加载中 ( > < )~").show();
function scrollLoading(){  
    $(window).scroll(function(){ 
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
        var range = 150;             //距下边界长度/单位px          //插入元素高度/单位px
        var totalheight = 0;
        var main = $(".container");                  //主体元素
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);
        if(finished&&(main.height()-range) <= totalheight  && nomore == false) {
            finished=false;
            page++;
            litsitem(page);
        }
        else if(nomore == true){
              $('.loading').html("~没有更多了呢 ( > < )~").show();
        }
    });
}
function litsitem(page){
    var url='';
    var args={
        page:page
    };
    $('.loading').html("~努力加载中 ( > < )~").show();
    $.postJson(url,args,function(res){
        if(res.success)
        {
            nomore=res.nomore;
            var data=res.data;
            if(data.length==0){
            		$('.no-recored').show();
            		$('.loading').remove();
            }
            if(nomore == true){
            		$('.loading').html("~没有更多了呢 ( > < )~").show();
            }
            for (var i in data){
            		var item='<li class="group">'
+			'<div class="item-left fl">'
+				'<h4> {{title}}</h4>'
+				'<p> {{time}}</p>'
+			'</div>'
+			'<div class="item-right fl clip">'
+				'{{value}}'
+			'</div>'
+		' </li>';
	var render=template.compile(item);
	var title=data[i]['record'];
	var type=data[i]['type'];
	var time=data[i]['time'];
	var value=data[i]['value'];
	if(type!=1){
		value='+'+value
	}
	else {
		value='-'+value
	}
	var list_item =render({
		title:title,
		time:time,
		value:value
	});
	$('.bal-bm-lst').append(list_item);
            }
            finished=true;
           
        }
        else {
        	return noticeBox(res.error_text);
        }},
        function(){
        	return noticeBox('网络好像不给力呢~ ( >O< ) ~')
        },
        function(){
        	return noticeBox('服务器貌似出错了~ ( >O< ) ~')
        }
     );

};