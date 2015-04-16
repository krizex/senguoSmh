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
window.dataObj.page=1;
window.dataObj.count=1;
window.dataObj.finished=true;
var scrollLoading=function(){
    var range = 60;             //距下边界长度/单位px          //插入元素高度/单位px  
    var totalheight = 0;   
    var main = $(".container");                  //主体元素   
    $(window).scroll(function(){
        var maxnum = window.dataObj.page_count;            //设置加载最多次数  
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)  
        if(!maxnum) maxnum=Int($('#page_count').val());
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);  
        $('.no_more').hide();
        if(window.dataObj.finished&&(main.height()-range) <= totalheight  && window.dataObj.page < maxnum) { 
            $('.no_more').hide();
            $('.loading').show();
            window.dataObj.finished=false;
            window.dataObj.page++; 
            getList(window.dataObj.page);
        }       
        else if(window.dataObj.page ==maxnum){
        	$('.loading').hide();
              $('.no_more').show();
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
        	if(window.dataObj.points_item==undefined){
        		getItem('/static/items/customer/points_item.html?v=2015-0329',function(data){window.dataObj.points_item=data;});
        		initData(res);
        	}
             else{
             		initData(res);
             }
       
        }
        else return noticeBox(res.error_text);
        },function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
        );
   var initData=function(res){
          var data=res.data;
           for(var key in data){
           	var $item=$(window.dataObj.points_item);
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
           	$item.find('.type').text(type);
           	$item.find('.num').text(num);
           	$item.find('.time').text(time);
           	$('.points-list').append($item);
           }
            window.dataObj.count++;
            window.dataObj.finished=true;
   }
};
