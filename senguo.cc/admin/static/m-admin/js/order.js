var curStaff = null,width = 0,_page=0,_finished=true,nomore=false,swiper = null;
$(document).ready(function () {
    if(parseInt(cookie.getCookie("mdetail"))==1){
        cookie.removeCookie("mdetail");
        $('.wrap-loading-box').removeClass('hide');
        $(".no-result").html("数据正在加载中...");
        history.replaceState({foo:1},"订单管理",window.location.href+"&refresh=true");
        window.location.reload();
        return false;
    }else{
        if(!$.getUrlParam("refresh")){
            cookie.removeCookie("mIndex");
            cookie.removeCookie("mTop");
        }
    }
    $("html,body").addClass("h100");
    width = $(window).width();
    var minheight = $(window).height()-70;
    $(".order-lists").css({minHeight:minheight+"px"});
    $(".order-type-list .item").on("click",function(){
        if($(this).hasClass("c999")){
            Tip("该方式处于关闭状态，请开启后再查看");
            return false;
        }
        var index = $(this).index();
        var _type=parseInt($(this).attr('data-id'));
        if(_type==3){
            $(".second-item").html("等待自取");
            $(".third-item").html("已完成");
            $(".second-tab").addClass("mt40");
            $(".wrap-self-choose").removeClass("hide");
            $(".order-lists").addClass("pt40");
        }else{
            $(".second-item").html("处理中");
            $(".third-item").html("已送达");
            $(".wrap-self-choose").addClass("hide");
            $(".second-tab").removeClass("mt40");
            $(".order-lists").removeClass("pt40");
        }
        history.replaceState({foo:1},"订单管理","/madmin/order?type="+index);
        $(".order-type-list .item").removeClass("active").eq(index).addClass("active");
        $(".order-lists").eq($(".second-tab-list .active").index()).empty();
        _page=0;
        getOrder(_page);
        $(".order-type-list .tab-bg").css("left",33.3*index+"%");
    });
    $(".second-tab-list .item").on("click",function(){
        var index = $(this).index();
        $(".second-tab-list .tab-line").css("left",$(this).position().left);
        swiper.swipeTo(index);
        $(this).addClass('active').siblings(".item").removeClass("active");
        cookie.setCookie("mIndex",index);
    });
    swiper = new Swiper('#swiper-container',{
        mode: 'horizontal',
        grabCursor: true,
        resistance:"100%",
        autoplayDisableOnInteraction:false,
        onSlideChangeEnd:function(swiper){
            var index = swiper.activeIndex;
            $(".order-lists").eq(index).empty();
            $(".second-tab-list").children(".item").eq(index).addClass("active").siblings(".item").removeClass("active");
            _page=0;
            getOrder(_page);
            $(".second-tab-list .tab-line").css("left",$(".second-tab-list").children(".item").eq(index).position().left);
        }
    });
    if($.getUrlParam("type")){
        var index = parseInt($.getUrlParam("type"));
        if(index==2){
            $(".second-item").html("等待自取");
            $(".third-item").html("已完成");
            $(".second-tab").addClass("mt40");
            $(".wrap-self-choose").removeClass("hide");
            $(".order-lists").addClass("pt40");
        }
        $(".order-type-list .item").removeClass("active").eq(index).addClass("active");
        $(".order-lists").eq($(".second-tab-list .active").index()).empty();
        _page=0;
        $(".order-type-list .tab-bg").css("left",33.3*index+"%");
        if(cookie.getCookie("mIndex")){
            var mIndex = parseInt(cookie.getCookie("mIndex"));
            $(".second-tab-list .tab-line").css("left", $(".second-tab-list .item").eq(mIndex).position().left);
            swiper.swipeTo(mIndex);
            $(".second-tab-list .item").removeClass("active").eq(mIndex).addClass("active");
        }
        getOrder(0);
    }
    if(nomore==false){
        scrollLoading();
    }
}).on("click",".order-lists>li",function(e){//进入订单详情
    var $this=$(this);
    var num = $this.attr("data-num");
    var scrollTop = $(".swiper-slide-active").scrollTop();
    cookie.setCookie("mTop",scrollTop);
    if($(e.target).closest(".forbid_click").size()==0){
       window.location.href="/madmin/orderDetail/"+num;
    }
}).on("click","#sure-staff",function(){
    var staff_id=$(".staff-list>.active").attr("data-id");
    orderEdit($(this),"edit_SH2",staff_id);
}).on("click",".order-grade .task-staff",function(e){
    var $this=$(this);
    var status=parseInt($this.parents('.m-order-item').attr('data-status'));
    if(status==1||status==4){
        e.stopPropagation();
        curStaff = $(this).closest(".order-grade");
        $(".pop-staff").removeClass("hide").attr("data-id",$this.parents('.m-order-item').attr('data-id'));
        $(".staff-list").empty().html($this.parents('.m-order-item').find('.order-staff-list').html());
    }
}).on("click",".staff-list>li",function(){
    var index = $(this).index();
    var src = $(this).find("img").attr("src");
    $("#sure-staff").attr({"data-src":src,"data-tel":$(this).attr("data-tel")});
    $(".staff-list>li").removeClass("active").eq(index).addClass("active");
}).on("click",".choose_self",function(){
    var index = $(this).attr("data-index");
    $(".self_list li").removeClass("active").eq(index).addClass("active");
    $(".pop-self").removeClass("hide");
}).on("click",".cancel-bbtn",function(){
    $(this).closest(".pop-bwin").addClass("hide");
}).on("click",".self_list li",function(){
    var index = $(this).index();
    $(".self_list li").removeClass("active").eq(index).addClass("active");
}).on("click","#sure_self",function(){
    var index = $(".self_list").children(".active").index();
    var id = $(".self_list").children(".active").attr("data-id");
    var name = $(".self_list").children(".active").html();
    $(".choose_self").html(name).attr("data-id",id).attr("data-index",index);
    getOrder(0,true);
    $(".pop-self").addClass("hide");
});
var order_item='<li data-num="{{order_num}}" data-status="{{order_status}}" class="m-order-item" data-id="{{id}}">'+
                    '<p class="order-time item">下单时间 : {{create_date}}</p>'+
                    '<ul class="order-content">'+
                        '<li>'+
                            '<p>'+
                                '<span class="fr money item"><span class="red-txt">{{totalPrice}}</span>元({{pay_type}})</span>'+
                                '<span>NO.{{order_num}}</span>'+
                            '</p>'+
                        '</li>'+
                        '<li>'+
                            '<p class="item time">{{send_time}}</p>'+
                        '</li>'+
                        '<li>'+
                            '<p class="item loc">{{send_address}}</p>'+
                        '</li>'+
                        '<li>'+
                            '{{ if message }}<p class="item say red-txt">{{message}}</p>{{ /if }}'+
                        '</li>'+
                        '<li class="{{show}}">'+
                            '<p class="red-txt">{{del_status}}</p>'+
                        '</li>'+
                        '<div class="order-grade">'+
                            '<div class="order-line {{hide}}">'+
                                '<div class="order-line-grade {{width}}"></div>'+
                                '<div class="order-wawa {{left}} forbid_click">'+
                                    '<a class="task-staff img-border" href="javascript:;">'+
                                        '<img src="{{staff_img}}" alt="配送员头像">'+
                                    '</a>'+
                                '</div>'+
                                '<div class="order-status-txt {{left}} forbid_click">'+
                                    '<a class="task-staff {{color}}" href="javascript:;">{{sender_name}}</a><a class="tel-block {{tel_show}}" href="tel:{{staff_phone}}">拨号</a>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                        '<ul class="order-staff-list hide">'+
                            '{{each SH2s as sh2}}'+
                            '<li class="" data-tel="{{sh2["phone"]}}" data-id="{{sh2["id"]}}">'+
                                '<span class="check fr">✓</span>'+
                                '<span class="img-border mr10"><img src="{{sh2["headimgurl"]}}" alt="员工头像"/></span>'+
                                '<span>{{sh2["nickname"]}}</span>'+
                            '</li>'+
                            '{{/each}}'+
                        '</ul>'+
                    '</ul>'+
                '</li>';
function scrollLoading(){
    $('.swiper-slide').scroll(function(){
        var $this=$(this);
        var srollPos = $this.scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
        var range = 150;             //距下边界长度/单位px          //插入元素高度/单位px
        var totalheight = 0;
        var main =$this.find(".order-lists");
        totalheight = parseFloat($this.height()) + parseFloat(srollPos);
        if(_finished == true &&(main.height()-range) <= totalheight&&nomore==false ) {
            _finished=false;
            _page++;
            getOrder(_page);
        }
        else if(nomore==true){
            $(".no-result").html("没有更多订单了");
        }
    });
}

var getOrder=function(page,flag){
    $('.wrap-loading-box').removeClass('hide');
    if(!page){
        var page = 0;
    }
    $(".no-result").html("数据正在加载中...");
    var order_type=$('.order-type-list .active').attr('data-id');
    var order_status=$('.second-tab-list .active').attr('data-id');
    var index=$('.second-tab-list .active').index();
    var url='/admin/order?order_type='+order_type+'&order_status='+order_status+'&page='+page;
    if(order_type==3){
        url = url+'&self_id='+$(".choose_self").attr("data-id");//自提
    }
    $.ajax({
        url:url,
        type:"get",
        success:function(res){
            if(res.success){
                var data=res.data;
                nomore=res.nomore;
                if(flag){
                    $('.order-lists').eq(index).empty();
                }
                if(data.length==0){
                    $('.wrap-loading-box').addClass('hide');
                    $(".no-result").html("没有更多订单了");
                    return false;
                }
                if(nomore==true){
                    $('.wrap-loading-box').addClass('hide');
                    $(".no-result").html("没有更多订单了");
                }
                for(var i in data){
                    var id=data[i]['id'];
                    var order_status=parseInt(data[i]['status']);
                    var order_num=data[i]['num'];
                    var create_date=data[i]['create_date'];
                    var totalPrice=data[i]['new_totalprice'];
                    var pay_type=data[i]['pay_type'];
                    var send_time=data[i]['send_time'];
                    var send_address=data[i]['address_text'];
                    var message=data[i]['message'];
                    var del_reason=data[i]['del_reason'];
                    var SH2s=data[i]['SH2s'];
                    var width;
                    var left;
                    var sender_name;
                    var del_status;
                    var show='hide';
                    var hide='show';
                    var tel_show='hide';
                    var color="c999";
                    var online_type=data[i]['online_type'];

                    if(data[i]['SH2']){
                        var staff_img=data[i]['SH2']['headimgurl'] || '/static/images/TDSG.png';
                        var staff_phone=data[i]['SH2']['phone'];
                        var sender=data[i]['SH2']['nickname'];
                    }else{
                        var staff_img='/static/m-admin/img/sender_holder.png';
                        var staff_phone='';
                        var sender='';
                    }
                    if(pay_type==1){
                        pay_type = "货到付款";
                    }else if(pay_type==2){
                        pay_type = "余额支付";
                    }else{
                        pay_type = "在线支付";
                        if(online_type=="wx"){
                            pay_type = "在线支付-微信";
                        }else if(online_type=="alipay"){
                            pay_type = "在线支付-支付宝";
                        }
                    }
                    switch (order_status){
                        case -1:
                            $("#status-txt").text('未支付');
                            width='order-w0';
                            left='order-l0';
                            show='hide';
                            hide='show';
                            break;
                        case 0:
                            width='order-w0';
                            left='order-l0';
                            hide='hide';
                            show='';
                            if(del_reason){
                                if(del_reason=='timeout'){
                                    del_status='该订单15分钟未支付，已自动取消';
                                }else{
                                    del_status='该订单已删除（原因：'+del_reason+')';
                                }
                            }
                            else{
                                del_status='该订单已被用户取消';
                            }

                            break;
                        case 1:
                            width='order-w0';
                            left='order-l0';
                            sender_name='分配员工';
                            color='';
                            break;
                        case 2:
                        case 3:
                        case 4:
                            width='order-w50';
                            left='order-l50';
                            sender_name=sender+'配送中';
                            tel_show='';
                            break;
                        case 5:
                            width='order-w100';
                            left='order-l100';
                            sender_name=sender+'已送达';
                            tel_show='';
                            break;
                        case 6:
                        case 7:
                            width='order-w100';
                            left='order-l100';
                            sender_name='已评价';
                            break;
                    }
                    var render=template.compile(order_item);
                    var html=render({
                        id:id,
                        order_status:order_status,
                        order_num:order_num,
                        create_date:create_date,
                        totalPrice:totalPrice,
                        pay_type:pay_type,
                        send_time:send_time,
                        send_address:send_address,
                        message:message,
                        staff_img:staff_img,
                        staff_phone:staff_phone,
                        SH2s:SH2s,
                        left:left,
                        width:width,
                        sender_name:sender_name,
                        hide:hide,
                        del_status:del_status,
                        show:show,
                        tel_show:tel_show,
                        color:color
                    });
                    $('.order-lists').eq(index).append(html);
                }
                _finished=true;
                $('.wrap-loading-box').addClass('hide');
                if(cookie.getCookie("mTop")){
                    var mTop = parseInt(cookie.getCookie("mTop"));
                    $(".swiper-slide-active")[0].scrollTop=mTop;
                    cookie.removeCookie("mTop");
                }
            }
            else {
                $('.wrap-loading-box').addClass('hide');
                return Tip(res.error_text);
            }
        }
    });
};

function orderEdit(target,action,content){
    var url='/admin/order';
    var action=action;
    var data;
    var args;
    var order_id=parseInt($('.pop-staff').attr('data-id'));
    data={order_id:order_id};
    if(action=='edit_SH2')
    {
        if(!content){
            return Tip("请选择员工");
        }
        data.staff_id=parseInt(content);
    }
    args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            if(action=='edit_SH2'){
                var tel = target.attr("data-tel");
                curStaff.find("img").attr("src",target.attr("data-src"));
                curStaff.find(".order-line-grade").css("width","50%");
                curStaff.find(".order-wawa").css("left","50%");
                curStaff.find(".order-wawa").children("a").removeClass("task-staff");
                curStaff.find(".order-status-txt").css("left","50%");
                curStaff.find(".order-status-txt").empty().append('<span class="c999">配送中</span><a href="tel:'+tel+'">拨号</a>');
                $(".pop-staff").addClass("hide");
            }
        }
        else {
            return Tip(res.error_text);
        }
    })
}