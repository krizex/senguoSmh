$(document).ready(function(){
//rule box
$(document).on('click','.rules',function(){
	var check_large=new Modal('pointsBox');
	check_large.modal('show');
});
//current_point
var point=Int($('.current_point').data('point'));
$('.current_point').text(point);
//rule list
getList(1);
scrollLoading();
});
var page=1;
var finished=true;
var nomore=false;
var scrollLoading=function(){
    var range = 60;             //距下边界长度/单位px          //插入元素高度/单位px  
    var totalheight = 0;   
    var main = $(".container");                  //主体元素   
    $(window).scroll(function(){
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)  
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);  
        if(finished&&(main.height()-range) <= totalheight  && nomore==false) { 
            finished=false;
            page++; 
            getList(page);
        }       
        else if(nomore==true){
        	$('.loading').html("~没有更多了呢 ( > < )~").show();
        } 
    }); 
}   

var getList=function(page,action){
    var url='';
    var action = action;
    var args={
        action:action,
        page:page
    };
    $.postJson(url,args,function(res){
        if(res.success)
        {
             	initData(res);
        }
        else {
          return noticeBox(res.error_text);
        }
        },function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
      );
   var initData=function(res){
          var data=res.data;
          nomore =res.nomore;
           for(var key in data){
           	var item='<li>'+
                                ' <span class="type pull-left font14">{{type}}</span>'+
                                '<span class="time pull-left">{{time}}</span>'+
                                ' <span class="point pull-right font14 text-red2">+<span class="num">{{num}}</span></span>'+
                            '</li>';
             var render = template.compile(item);
           	var type,num,time;
           	type=data[key][0];
           	num=data[key][1];
           	time=data[key][2];
           	if(type==1) {type='消费';}
           	else if(type==2) {type='关注店铺';}
           	else if(type==3) {type='店铺签到';}
           	else if(type==4) {type='连续签到';}
           	else if(type==5) {type='使用余额支付';}
           	else if(type==6) {type='点赞';}
           	else if(type==7) {type='评价';}
           	else if(type==8) {type='首次下单';}
           	else if(type==9) {type='绑定手机号';}
           	var list_item =render({
                  type:type,
                  time:time,
                  num:num
            });
           	$('.points-list').append(list_item);
           }
            finished=true;
   }
};
