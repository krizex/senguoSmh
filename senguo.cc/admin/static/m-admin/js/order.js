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

var goooooooo=function(page,action){
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

function orderItem(page){
    $(".wrap-loading-box").removeClass("hidden");
    var action=$.getUrlParam('action');
    var url;
    var filter_status = $(".filter").attr("data-id");
    var pay_type = $(".pay_type").attr("data-id");
    var user_type = $(".user_type").attr("data-id");
    url=link+'/admin/order?order_type=1'+'&page='+page; 
    } 
    $('.order-list-content').empty();
    $.ajax({
        url:url,
        type:"get",
        success:function(res){
            if(res.success){
                var data=res.data;
                $('.page-total').text(parseInt(res.page_sum));
                var _page_total=parseInt(res.page_sum);
                if(res.count){
                     var _count=res.count;
                    var type=parseInt($.getUrlParam("order_type"));
                    $('.order-status li').each(function(){
                        var $this=$(this);
                        var index=$this.index()+1;
                        var i=parseInt(type.toString()+index.toString());
                        $this.find('.num').text(_count[i]);
                    });
                    $('#atonce').text(_count[11]);
                    $('#ontime').text(_count[21]);
                }
                 if(_page_total <=1){
                    $('.list-pagination').hide();
                }
                else {
                    $('.list-pagination').show();
                    if(_page===0) {
                        $('.pre-page').hide();
                    }
                    else{
                        $('.pre-page').show();
                    }
                    if(_page_total-1== _page){
                        $('.next-page').hide();
                    }
                    else{
                        $('.next-page').show();
                        
                    }
                    $('.page-now').text(_page+1);
                }
                if(data.length==0){
                    $('.order-list-content').append('<h4 class="text-center mt40">当前分类暂无订单信息</h3>');
                    $(".wrap-loading-box").addClass("hidden");
                    return false;
                }
                for(var i=0;i<data.length;i++){
                    var $item=$($list_item);
                    var SH2=data[i]['SH2'];
                    var SH2s=data[i]['SH2s'];
                    var active=data[i]['active'];
                    var address_text=data[i]['address_text'];
                    var create_date=data[i]['create_date'];
                    var freight=data[i]['freight'];
                    var fruits=data[i]['fruits'];
                    var id=data[i]['id'];
                    var isprint=data[i]['isprint'];
                    var message=data[i]['message'];
                    var money_paid=data[i]['money_paid'];
                    var num=data[i]['num'];
                    var pay_type=data[i]['pay_type'];      
                    var mgoods=data[i]['mgoods']; 
                    var phone=data[i]['phone'];
                    var receiver=data[i]['receiver'];  
                    var remark=data[i]['remark'];
                    var send_time=data[i]['send_time'];
                    var staff_remark=data[i]['staff_remark'];
                    var status=data[i]['status'];
                    var tip=data[i]['tip'];
                    var today=data[i]['today'];
                    var totalPrice=data[i]['totalPrice'];
                    var type=data[i]['type'];
                    var shop_new=data[i]['shop_new'];
                    var del_reason=data[i]['del_reason'];
                    var nickname=data[i]['nickname'];
                    var customer_id=data[i]['customer_id'];
                          
                    if(!message) {
                        $item.find('.order-message').hide();
                    }
                    if(!staff_remark) {
                        $item.find('.staff-replay').hide();
                    }
                    if(!remark||remark==null) {
                        $item.find('.saler-remark').hide();
                    }
                    if(isprint==1||isprint==true) {
                        $item.find('.print-order').addClass('text-grey9');
                    }
                    if(shop_new!=1) {
                        $item.find('.new').show();
                    }
                    $item.find('.name').text(nickname).attr('href','/admin/follower?action=filter&&order_by=time&&page=0&&wd='+customer_id);
                    $item.find('.receiver').text(receiver);
                    $item.attr({'data-id':id,'data-type':type});
                    $item.find('.send-time').text(send_time);
                    $item.find('.order-code').text(num);
                    $item.find('.order-price').text(totalPrice);
                    $item.find('.goods-total-charge').text(totalPrice);
                    $item.find('.total_price_input').text(totalPrice);
                    $item.find('.address_show').text(address_text);
                    $item.find('.phone').text(phone);
                    $item.find('.message-content').text(message);
                    $item.find('.staff-remark').text(staff_remark);
                    $item.find('.order_remark').text(remark);
                    $item.find('.order-status').attr({'data-id':status});
                    $item.find('.order-time').text(create_date);
                    $item.find('.saler-remark').val(remark);
                    //立即送小费显示/隐藏
                    if(type==1){
                        $item.find('.tip').text(tip);
                    }
                    else {
                        $item.find('.tips').hide();
                    }
                    //根据支付方式显示/隐藏
                    if(pay_type==2){ 
                        $item.find('.pay-status').text('余额支付'); 
                        $item.find('.price_edit').hide();
                    } 
                    else if(pay_type == 3){
                        $item.find('.pay-status').text('在线支付'); 
                        $item.find('.price_edit').hide();
                        if(status!=-1){$item.find('.delete-order').hide();}
                    }
                    else { 
                        $item.find('.pay-status').text('货到付款'); 
                    }
                    //根据订单状态显示/隐藏
                    if(status==0) {
                        if(del_reason==null){
                            $item.find('.order-status').empty().text('该订单已被用户取消').css({'line-height':'50px','color':'#44b549'});
                        }
                        else if(del_reason=='timeout'){
                            $item.find('.order-status').empty().text('该订单15分钟未支付，已自动取消').css({'line-height':'50px','color':'#44b549'});
                        }
                        else{
                            $item.find('.order-status').empty().text('该订单已删除（原因：'+del_reason+'）').css({'line-height':'50px','color':'#44b549'});
                        }
                        $item.find('.unable_edit_order').show();
                        $item.find('.address-adapt').hide();
                    }
                    else if(status==-1) {
                        $item.find('.status_unpaid').removeClass('hidden');
                        $item.find('.able_edit_order').show();
                        $item.find('.address-adapt').hide();
                    }
                    else if(status==1) {
                        $item.find('.status_order').removeClass('hidden');
                        $item.find('.able_edit_order').show();
                        $item.find('.able_edit_sender').show();
                        $item.find('.status-send').show();
                    }
                    else if(status==4) {
                        $item.find('.status_send').removeClass('hidden');
                        $item.find('.able_edit_order').show();
                        $item.find('.able_edit_sender').show();
                        $item.find('.status-finish').show();
                    }
                    else if(status==5) {
                        $item.find('.status_finish').removeClass('hidden');
                        $item.find('.unable_edit_order').show();
                        $item.find('.unable_edit_sender').show();
                    }
                    else if(status==6) {
                        $item.find('.status_comment').removeClass('hidden');
                        $item.find('.status-comment').show();
                        $item.find('.unable_edit_order').show();
                        $item.find('.unable_edit_sender').show();
                    }
                    else if(status==7) {
                        $item.find('.status_comment').removeClass('hidden');
                        $item.find('.status-autocomment').show();
                        $item.find('.unable_edit_order').show();
                        $item.find('.unable_edit_sender').show();
                    }
                    //商品数据
                    var goods_num=0;
                    var g_num=0;
                    var m_num=0;
                    for(var key in fruits){
                        g_num++;
                        var $goods=$($goods_item);
                        $goods.find('.code').text(g_num);
                        $goods.find('.goods-name').text(fruits[key]['fruit_name']);
                        $goods.find('.goods-price').text(fruits[key]['charge']);
                        $goods.find('.goods-number').text(fruits[key]['num']);
                        $item.find('.goods-list').append($goods);
                        goods_num=goods_num+fruits[key]['num'];
                    }
                    for(var key in mgoods){
                        m_num++;
                        var $mgoods=$($goods_item);
                        var num=$item.find('.goods-list li').length;
                        $mgoods.find('.code').text(num+1);
                        $mgoods.find('.goods-name').text(mgoods[key]['mgoods_name']);
                        $mgoods.find('.goods-price').text(mgoods[key]['charge']);
                        $mgoods.find('.goods-number').text(mgoods[key]['num']);
                        $item.find('.goods-list').append($mgoods);
                        goods_num=goods_num+mgoods[key]['num'];
                    }
                    //送货员选择
                    var $current_sender=$item.find('.current_sender');
                    var $send_change=$item.find('.send_change');
                    var $sender=$send_change.find('.send_person');
                    var CurrentStaff=function(target,val){
                      target.attr({'data-id':val['id']});
                      target.find('.sender-code').text(val['id']);
                      target.find('.sender-name').text(val['nickname']);
                      target.find('.sender-phone').text(val['phone']);
                };
                if(SH2s.length>0){
                    if(!SH2){
                        CurrentStaff($sender,SH2s[0]);
                        CurrentStaff($current_sender,SH2s[0]);
                         for(var key in SH2s){
                            var $staff=$($staff_item);
                            CurrentStaff($staff,SH2s[key]);
                            $item.find('.send_person_list').append($staff);
                        }       
                    }else{
                        CurrentStaff($sender,SH2);
                        CurrentStaff($current_sender,SH2);
                        for(var key in SH2s){
                            var $staff=$($staff_item);
                            if(SH2s[key]['id']==SH2['id']) $staff.addClass('bg-blue');
                            CurrentStaff($staff,SH2s[key]);
                            $item.find('.send_person_list').append($staff);
                        }
                        }
                    }
                    //商品总件数
                    $item.find('.goods-total-number').text(goods_num);
                    $('.order-list-content').append($item);
                }
             $(".wrap-loading-box").addClass("hidden");
            }
            else {
                $(".wrap-loading-box").addClass("hidden");
                return Tip(res.error_text);
            }
        }
    })
    
}