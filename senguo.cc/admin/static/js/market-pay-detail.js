var width = 0;
$(document).ready(function(){
    if($(".com-goods-lst").size()>0){
        width = parseInt($(".com-goods-lst").width()/4)-12;
        $(".com-goods-lst>li").each(function(){
            $(this).width(width).height(width);
        });
    }
    //订单状态
    statusText(parseInt($('#status-txt').attr('data-id')));
    //根据订单状态的一些提示
    if(status==1) $('.hint').show();
    else $('.phone-notice').show();
    //送货时间
    var date=new Date();
    var year=date.getFullYear();
    var month=date.getMonth()+1;
    var day=date.getDate();
    var create_time=$('.create_time').val();
    var create_year=$('.create_year').val();
    var create_month=$('.create_month').val();
    var create_day=Int($('.create_day').val());
    var send_day=$('.send_day').val();
    if(send_day==1){
        if(create_year==year&&create_month==month&&create_day==day) $('.send_date').text('今天');
        else $('.send_date').hide();
        if(status==5||status==6){
            $('.send_date').text('');
        }
    }
    else if(send_day==2){
        if(create_year==year&&create_month==month&&create_day+1==day) $('.send_date').text('今天');
        else if(create_year==year&&create_month==month&&create_day==day) $('.send_date').text('明天');//下单模式选择了“明天”，但是日期到了“明天”的情况
        else $('.send_date').hide();
        if(status==5||status==6){
            $('.send_date').text('');
        }
    }
    removeDom();
}).on("click","#cancel-order",function(){
    confirmBox('确认取消该订单吗？//(ㄒoㄒ)//',"sure-order");
}).on("click","#sure-order",function(){
    var order_id = $("#cancel-order").attr("data-id");
    cancelOrder(order_id);
    confirmRemove();
}).on("click","#go-alipay",function(){
    if(isWeiXin()){
        window.location.href="/customer/online/orderdetail?alipayUrl="+encodeURIComponent($(this).attr("data-url"));
    }else{
        window.location.href=$(this).attr("data-url");
    }
});
function isWeiXin(){
    var ua = window.navigator.userAgent.toLowerCase();
    if(ua.match(/MicroMessenger/i) == 'micromessenger'){
        return true;
    }
    else{
        return false;
    }
}
function removeDom(){
    $('.create_time').remove();
    $('.create_year').remove();
    $('.create_month').remove();
    $('.create_day').remove();
    $('.send_day').remove();
}
function statusText(n){
    switch (n){
        case 0:
            $("#status-txt").text('已取消');
            $(".order-wawa").css("left","0%");
            $(".order-line-grade").css("width","0%");
            $(".order-status-txt").css("left","0%");
            $(".tel-btn").show();
            break;
        case 1:
            $("#status-txt").text('已下单');
            $(".order-wawa").css("left","0%");
            $(".order-line-grade").css("width","0%");
            $(".order-status-txt").css("left","0%");
            $(".tel-btn").show();
            break;
        case 4:
            $("#status-txt").text('配送中');
            $(".order-wawa").css("left","50%");
            $(".order-line-grade").css("width","50%");
            $(".order-status-txt").css("left","50%");
            $(".tel-btn").show();
            break;
        case 5:
            $("#status-txt").text('已送达');
            $(".order-wawa").css("left","100%");
            $(".order-line-grade").css("width","100%");
            $(".order-status-txt").css("left","100%");
            $(".tel-btn").show();
            break;
        case 6:
            $("#status-txt").text('已评价');
            $(".order-wawa").css("left","100%");
            $(".order-line-grade").css("width","100%");
            $(".order-status-txt").css("left","100%");
            $(".tel-btn").show();
            break;
        case -1:
            $("#status-txt").text('未付款');
            $(".order-wawa").css("left","0");
            $(".order-line-grade").css("width","0");
            $(".order-status-txt").css("left","0");
            $(".tel-btn").hide();
            break;
    }
}
function cancelOrder(id){
    var order_id = id;
    var url='';
    var action='cancel_order';
    var data={
        order_id:order_id
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                noticeBox("订单取消成功！");
                setTimeout(function(){
                    window.location.href="/customer/orders?action=all";
                },2000);
            }
            else return noticeBox(res.error_text)
        }, function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    )
}
