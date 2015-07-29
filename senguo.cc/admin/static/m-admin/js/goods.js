var curGoods = null,width = 0,_page=0,_finished=true,nomore=false;
$(document).ready(function(){
    var minheight = $(window).height()-80;
    $(".order-lists").css({minHeight:minheight+"px"});

}).on("click",".goods_status",function(){
    $(".wrap_goods_menu").toggleClass("hide");
}).on("click",".goods_menu_list li",function(){
    var id = $(this).attr("data-id");
    $(".wrap_goods_menu").toggleClass("hide");
}).on("click",".goods-all-list li",function(){//大类切换
    var index = parseInt($(this).index());
    if(index==0){//所有商品
        $(".container").addClass("pt70");
        $(".second-tab").addClass("hide");
        $(".goods_tab").removeClass("hide");
        $("#qa").addClass("hide");
        $(".btns-list").addClass("hide");
        $("#add_goods").removeClass("hide");
    }else if(index==1){
        $(".container").removeClass("pt70");
        $(".second-tab").addClass("hide");
        $("#qa").removeClass("hide");
        $(".btns-list").addClass("hide");
        $("#group_manage").removeClass("hide");
    }else{
        $(".container").addClass("pt70");
        $(".second-tab").addClass("hide");
        $(".class_tab").removeClass("hide");
        $("#qa").addClass("hide");
        $(".btns-list").addClass("hide");
    }
    $(".boxs").addClass("hide").eq(index).removeClass("hide");
    var _type=parseInt($(this).attr('data-id'));
    $(".order-type-list .item").removeClass("active").eq(index).addClass("active");
    _page=0;
    $(".order-type-list .tab-bg").css("left",33.3*index+"%");
}).on("click",".goods_list .gitem",function(){
    var index = $(this).index();
    if($(this).hasClass("active")){//切换排序方式
        $(this).children(".turn").toggleClass("rotate-img2");
    }else{
        $(".second-tab-list").find(".turn").removeClass("rotate-img2");
        $(".second-tab-list li").removeClass("active").eq(index).addClass("active");
        $(".second-tab-list .tab-line").css("left",25*index+"%");
    }
}).on("click",".class_status",function(){
    $(".wrap_class_menu").toggleClass("hide");
}).on("click",".class_menu_list li",function(){
    var id = $(this).attr("data-id");
    $(".wrap_class_menu").toggleClass("hide");
}).on("click",".class_list .gitem",function(){
    var index = $(this).index();
    if($(this).hasClass("active")){//切换排序方式
        $(this).children(".turn").toggleClass("rotate-img2");
    }else{
        $(".second-tab-list").find(".turn").removeClass("rotate-img2");
        $(".second-tab-list li").removeClass("active").eq(index).addClass("active");
        $(".second-tab-list .tab-line").css("left",25*index+"%");
    }
}).on("click","#qa",function(){
    $(this).addClass("hide");
    $(".pop-qa").removeClass("hide");
}).on("click","#close-pop",function(){
    $("#qa").removeClass("hide");
    $(".pop-qa").addClass("hide");
}).on("click",".share-group",function(){
    var url = $(this).attr("data-url");
    $("#big-code2").empty();
    new QRCode($("#big-code2")[0],{
        width : 300,
        height : 300
    }).makeCode(url);
    $(".pop-code2").removeClass("hide");
}).on("click",".b-close",function(){
    $(".pop-code2").addClass("hide");
}).on("click",".edit-group",function(){
    curGoods = $(this).closest("li");
    $("#group_name").val(curGoods.find(".go-name").html());
    $("#group_info").val(curGoods.find(".go-info").html());
    $(".pop-name").removeClass("hide");
    $("#group_name").focus();
}).on("click",".cancel-bbtn",function(){
    $(this).closest(".pop-bwin").addClass("hide");
}).on("click",".del-group",function(){
    $(".pop-del").removeClass("hide");
}).on("click",".manage-group",function(){
    $(".wrap-operates").removeClass("hide");
    $(".wrap-bm-btns .btns-list").addClass("hide");
    $("#finish_group").removeClass("hide");
}).on("click",".finish-group",function(){
    $(".wrap-operates").addClass("hide");
    $(".wrap-bm-btns .btns-list").addClass("hide");
    $("#group_manage").removeClass("hide");
}).on("click",".slide-class",function(){
    $(this).toggleClass("arrow-up");
    $(this).closest(".class-row").next(".class-lst").toggleClass("hide");
});

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

var getOrder=function(page){
    $('.wrap-loading-box').removeClass('hide');
    if(!page){
        var page = 0;
    }
    $(".no-result").html("数据正在加载中...");
    var order_type=$('.order-type-list .active').attr('data-id');
    var order_status=$('.second-tab-list .active').attr('data-id');
    var index=$('.second-tab-list .active').index();
    var url='/admin/order?order_type='+order_type+'&order_status='+order_status+'&page='+page;
    $.ajax({
        url:url,
        type:"get",
        success:function(res){
            if(res.success){
                var data=res.data;
                nomore=res.nomore;
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
                    var totalPrice=data[i]['totalPrice'];
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

                    if(data[i]['SH2']){
                        var staff_img=data[i]['SH2']['headimgurl'];
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
        data.staff_id=parseInt(content);
    }
    args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            if(action=='edit_SH2'){

            }
        }
        else {
            return Tip(res.error_text);
        }
    })
}