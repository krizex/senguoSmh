/**
 * Created by Administrator on 2015/6/12.
 */
var curStaff = null,width = 0,action="unhandled";
$(document).ready(function(){
    width = $(window).width();
    var minheight = $(window).height()-70;
    $(".order-type-list .item").on("click",function(){
        var index = $(this).index();
        $(".order-type-list .item").removeClass("active").eq(index).addClass("active");
        $(".order-type-list .tab-bg").css("left",33.3*index+"%");
    });
    $(".second-tab-list .item").on("click",function(){
        var index = $(this).index();
        //$(".second-tab-list .item").removeClass("active").eq(index).addClass("active");
        $(".second-tab-list .tab-line").css("left",$(this).position().left);
        swiper.swipeTo(index);
    });
    $(".order-grade .task-staff").on("click",function(e){
        e.stopPropagation();
        curStaff = $(this).closest(".order-grade");
        $(".pop-staff").removeClass("hide");
    });
    $(".staff-list>li").on("click",function(){
        var index = $(this).index();
        var src = $(this).find("img").attr("src");
        $("#sure-staff").attr("data-src",src);
        $("#sure-staff").attr("data-tel",$(this).attr("data-tel"));
        $(".staff-list>li").removeClass("active").eq(index).addClass("active");
    });
    $("#sure-staff").on("click",function(){
        var tel = $(this).attr("data-tel");
        curStaff.find("img").attr("src",$(this).attr("data-src"));
        curStaff.find(".order-line-grade").css("width","50%");
        curStaff.find(".order-wawa").css("left","50%");
        curStaff.find(".order-wawa").children("a").removeClass("task-staff");
        curStaff.find(".order-status-txt").css("left","50%");
        curStaff.find(".order-status-txt").empty().append('<span><span class="#c333">配送中</span><a class="" href="tel:'+tel+'">拨号</a></span>');
       $(".pop-staff").addClass("hide");
    });
    $(window).scroll(function(){
        console.log(333);

    });
    $(".swiper-wrapper").width(width*$(".swiper-slide").size());
    $(".swiper-slide").css({minHeight:minheight+"px"});
    var swiper = new Swiper('#swiper-container',{
        mode: 'horizontal',
        grabCursor: true,
        resistance:"100%",
        autoplayDisableOnInteraction:false,
        onSlideChangeEnd:function(swiper){
            var index = swiper.activeIndex;
            $(".second-tab-list .tab-line").css("left",$(".second-tab-list").children(".item").eq(index).position().left);
        }
    });
    $(".order-lists>li").on("click",function(){//进入订单详情
        var id = $(this).attr("data-id");
        window.location.href="/madmin/orderDetail?id="+id;
    });
});

var goodsList=function(page,action){
    $(".no-result").html("数据正在加载中...");
    var url='';
    var action=action;
    var args={
        action:action,
        page:page
    };
    $.postJson(url,args,function(res){
            if(res.success){
                var data = res.orders;
                if(data.length==0){
                    $(".no-result").html("没有更多订单了");
                }else{
                    initData(data);
                }
            }
            else return Tip(res.error_text);
        },
        function(){
            return Tip('网络好像不给力呢~ ( >O< ) ~')
        },
        function(){return Tip('服务器貌似出错了~ ( >O< ) ~');
        }
    );
    var initData=function (orders){
        for(var i in data){
            var $item = $("#order-item").children().clone();
            var id=orders[i]['order_id'];
            var shop_name=orders[i]['shop_name'];
            var order_num=orders[i]['order_num'];
            var order_status=orders[i]['order_status'];
            var address_text=orders[i]['address_text'];
            var send_time=orders[i]['send_time'];
            var totalPrice=orders[i]['order_totalPrice'];
            var sender_img=orders[i]['sender_img'];
            var sender_phone=orders[i]['sender_phone'];
            var comment=orders[i]['comment'];
            var message=orders[i]['message'];
            var today=orders[i]['today'];
            var type=orders[i]['type'];
            var create_date=orders[i]['create_date'];
            var create_year=orders[i]['create_year'];
            var create_month=orders[i]['create_month'];
            var create_day=orders[i]['create_day'];
            var pay_type = orders[i]['pay_type'];
            var online_type = orders[i]['online_type'];
            var date=new Date();
            var year=date.getFullYear();
            var month=date.getMonth()+1;
            var day=date.getDate();
            var pay_txt = "";
            if(pay_type==1){
                pay_txt = "货到付款";
            }else if(pay_type==2){
                pay_txt = "余额支付";
            }else{
                pay_txt = "在线支付";
            }
            $item.attr({'data-id':id,'data-status':order_status,'data-type':online_type});
            /*$item.find('.detail-link').attr({'href':'/customer/orders/detail/'+id});*/
            $item.find('.order_num').text(order_num);
            $item.find('.shop_name').text(shop_name);
            $item.find('.order_num').text(order_num);
            $item.find('.address').text(address_text);
            $item.find('.price').text(totalPrice);
            $item.find('.send_time').text(send_time).show();
            $item.find('#order_pay_type').children("span").html(pay_txt);
            if(message) {$item.find('.remark_box').show().find('.remark').text(message);}
            if(comment) {$item.find('.comment_box').show().find('.comment').text(comment);}
            if(type==1) {
                if(create_year==year&&create_month==month&&create_day==day) {
                    $item.find('.send_date').text('今天');
                }
                else {$item.find('.send_date').text('').hide();}
            }
            else if(type==2&&today==1){
                if(create_year==year&&create_month==month&&create_day==day) {
                    $item.find('.send_date').text('今天');
                }
                else {
                    $item.find('.send_date').text('').hide();
                }
            }
            else if(type==2&&today==2){
                if(create_year==year&&create_month==month&&create_day+1==day) {
                    $item.find('.send_date').text('今天');
                }
                else if(create_year==year&&create_month==month&&create_day==day) {
                    $item.find('.send_date').text('明天');//下单模式选择了“明天”，但是日期到了“明天”的情况
                }
                else {
                    $item.find('.send_date').text('').hide();
                }
            }

            if(order_status==-1){
                $item.find('.order-concel').show();
                $item.find('.status-bar-box').show();
                /*if(online_type=="wx"){
                 $item.find('.pay-box').children('a').attr("href","/customer/onlinewxpay");
                 $item.find('.detail-link').attr({'href':'/customer/onlinewxpay'});
                 }else if(online_type=="alipay"){
                 $item.find('.pay-box').children('a').attr("href","/customer/online/alipay");
                 $item.find('.detail-link').attr({'href':'/customer/online/alipay'});
                 }*/
                $item.find('.pay-box').show();
                $item.find('.word').text('未支付');
            }
            if(order_status==0){
                $item.find('.order_conceled').show();
                $item.find('.status-bar-box').hide();
                $item.find('.word').text('已取消');
            }
            else if(order_status==1) {
                $item.find('.cancel').show();
                $item.find('.word').text('已下单');
                $item.find('.status-box').addClass('left0');
                $item.find('.circle-icon').addClass('left0');
                $item.find('.inner').addClass('width0');
            }
            else if(order_status==4) {
                $item.find('.order_dealing').show();
                $item.find('.word').text('配送中');
                $item.find('.status-box').addClass('left50');
                $item.find('.circle-icon').addClass('left50');
                $item.find('.inner').addClass('width50');
                $item.find('.sender_img').attr({'src':sender_img}).show();
                $item.find('.sender_phone').attr({'href':'tel:'+sender_phone}).show();
            }
            else if(order_status==5) {
                $item.find('.word').text('已送达');
                $item.find('.status-box').addClass('left100');
                $item.find('.circle-icon').addClass('left100');
                $item.find('.inner').addClass('width100');
                $item.find('.btn-box').show();
                $item.find('.send_date').hide();
                $item.find('.un-arrive').text('已送达');
                $item.find('.status_notice').text('已送达').addClass('text-green');
            }
            else if(order_status==6 || order_status==7) {
                $item.find('.word').text('已评价');
                $item.find('.status-bar-box').hide();
                $item.find('.send_date').hide();
                $item.find('.un-arrive').text('已送达');
                $item.find('.status_notice').text('已评价').addClass('text-green');
            }
            $('.order-list').append($item);
        }
        $('.loading').hide();
        window.dataObj.count++;
        window.dataObj.finished=true;
    }
};