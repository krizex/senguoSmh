$(document).ready(function(){
        //导航active
    var market_shop_id=getCookie('market_shop_id');
    if(!market_shop_id){
        $('.return-btn').hide();
    }
    window.dataObj.action=$.getUrlParam('action');
    $('.order-nav li').each(function(){
        var $this=$(this);
        var action=$this.data('action');
        if(action==window.dataObj.action){
            $this.addClass('active');
        }
    });
    //订单data
     goodsList(1,window.dataObj.action);
     scrollLoading();
   
    $(document).on('click','.order-concel',function () {
         //取消订单   
        var $this = $(this);
        var id=$this.parents('.order-list-item').data('id');
        var index=$this.parents('.order-list-item').index();
        confirmBox('确认取消该订单吗？//(ㄒoㄒ)//',index,id);
    });
     $(document).on('click','.confriming',function(){
        var $this=$(this);
        var $item=$this.parents('#confirmBox').find('.message');
        var result=$this.attr('data-status');
        var index=$item.attr('data-index');
        var type=$item.attr('data-type');
        if(result=='true'){
            orderConcel($('.order-list-item').eq(index),type);
            }
        confirmRemove();
    });
    //评价
    var index;
    var comment_order_id;
    $(document).on('click','.comment-btn',function () {
        var $this = $(this);
        index=$this.parents('.order-list-item').index();
        comment_order_id=$this.parents('.order-list-item').data('id');
        window.location.href="/customer/shopcomment?num="+comment_order_id;
    });
    /*$(document).on('click','.comment_submit', function () {
        var comment=$('.comment-input').val();
        $('.comment_submit').attr({'disabled':true}).addClass('bg-greyc');
        orderComment(index,comment_order_id,comment);
    });*/
    $(document).on("click",'.detail-link',function(){
        var id = $(this).closest("li").attr("data-id");
        var order_status = $(this).closest("li").attr("data-status");
        var online_type = $(this).closest("li").attr("data-type");
        SetCookie("order_id",id);
        if(parseInt(order_status) != -1){
            window.location.href = '/customer/orders/detail/'+id;
        }else{
            if(online_type == "wx"){
                window.location.href="/customer/onlinewxpay";
            }else if(online_type == "alipay"){
                window.location.href="/customer/online/alipay";
            }
        }
    })
    $(document).on("click",'.pay-link',function(){
        var id = $(this).closest("li").attr("data-id");
        var online_type = $(this).closest("li").attr("data-type");
        SetCookie("order_id",id);
        if(online_type == "wx"){
            window.location.href="/customer/onlinewxpay";
        }else if(online_type == "alipay"){
            window.location.href="/customer/online/alipay";
        }
    })
});
window.dataObj.page=1;
window.dataObj.count=1;
window.dataObj.action=5;
window.dataObj.finished=true;
$('.no_more').hide();
var scrollLoading=function(){
    var range = 60;             //距下边界长度/单位px          //插入元素高度/单位px  
    var totalheight = 0;   
    var main = $(".container");                  //主体元素   
    $(window).scroll(function(){
        var maxnum = window.dataObj.page_count;            //设置加载最多次数  
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)  
        if(!maxnum) maxnum=window.dataObj.total_page;
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);  
        if(window.dataObj.finished&&(main.height()-range) <= totalheight  && window.dataObj.page < maxnum) { 
            $('.no_more').hide();
            $('.loading').show();
            window.dataObj.finished=false;
            window.dataObj.page++; 
            goodsList(window.dataObj.page,window.dataObj.action);
        }       
        else if(window.dataObj.page ==maxnum){
            $('.loading').hide();
            $('.no_more').show();
        } 
    }); 
}   

var goodsList=function(page,action){
    var url='';
    var action=action;
    var args={
        action:action,
        page:page
    };
    $.postJson(url,args,function(res){
        if(res.success)
        {
            if(window.dataObj.list_item==undefined){
                getItem('/static/items/customer/orderlist_item.html?v=20150713',function(data){
                    window.dataObj.list_item=data;
                    initData(res);
                });    
            }
            else {
                initData(res);
            }    
        }
        else return noticeBox(res.error_text);
        },function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
    var initData=function (res){
        var orders=res.orders;
            window.dataObj.total_page=res.total_page;
            if(res.total_page>0){
                $('.list-header').show();
                 for(var i in orders){
                    var $item=$(window.dataObj.list_item);
                    var id=orders[i]['order_id'];
                    var shop_name=orders[i]['shop_name'];
                    var order_num=orders[i]['order_num'];
                    var order_status=orders[i]['order_status'];
                    var address_text=orders[i]['address_text'];
                    var send_time=orders[i]['send_time'];
                    var totalPrice=orders[i]['new_totalprice'];
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
                    if(type==3){
                        $item.find("._to_send").text("自提点");
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
                        if(type==3){
                            $item.find('.word').text('准备中');
                        }else{
                            $item.find('.word').text('已下单');
                        }
                        $item.find('.status-box').addClass('left0');
                        $item.find('.circle-icon').addClass('left0');
                        $item.find('.inner').addClass('width0');
                    }
                     else if(order_status==4) {
                        $item.find('.order_dealing').show();
                        if(type==3){
                            $item.find('.word').text('等待自取');
                        }else{
                            $item.find('.word').text('配送中');
                        }
                        $item.find('.status-box').addClass('left50');
                        $item.find('.circle-icon').addClass('left50');
                        $item.find('.inner').addClass('width50');
                        $item.find('.sender_img').attr({'src':sender_img}).show();
                        $item.find('.sender_phone').attr({'href':'tel:'+sender_phone}).show();
                    }
                    else if(order_status==5) {
                        if(type==3){
                            $item.find('.word').text('完成自取');
                        }else{
                            $item.find('.word').text('已送达');
                        }
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
            }
            else {
                $('.no_orders').show();
            }
            $('.loading').hide();
            window.dataObj.count++;
            window.dataObj.finished=true;
    }
};
function orderConcel(target,id){
    var url='';
    var action='cancel_order';
    var data={
        order_id:id
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            target.find('.status-bar-box').hide();
            target.find('.cancel').text('订单已取消').addClass('text-grey').removeClass('order-concel');
            target.find('.pay-link').hide();
        }
        else return noticeBox(res.error_text)
    }, function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
)
}