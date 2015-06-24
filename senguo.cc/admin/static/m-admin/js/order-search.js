/**
 * Created by Administrator on 2015/6/12.
 */
var curStaff = null;
$(document).ready(function(){
    $(".pop-win").on("click",function(e){
        if($(e.target).closest(".pop-content").length==0){
            $(".pop-win").addClass("hide");
        }
    });
    $(document).on("click",".staff-list>li",function(){
        var index = $(this).index();
        var src = $(this).find("img").attr("src");
        $("#sure-staff").attr("data-src",src).attr("data-id",$(this).attr("data-id")).attr("data-tel",$(this).attr("data-tel"));
        $(".staff-list>li").removeClass("active").eq(index).addClass("active");
    });
    $("#sure-staff").on("click",function(){
        var order_id = curStaff.closest("li").attr("data-id");
        var staff_id = $(this).attr("data-id");
        switchStaff(order_id,staff_id,$(this));
    });
    $("#search-order").on("click",function(){  //订单搜索
        var id = $("#search-ipt").val();
        if($.trim(id)=="" || isNaN($.trim(id))){
            return Tip("请输入只含数字的订单编号");
        }else{
            searchOrder(id);
        }
    });
}).on("click","#order-item>li",function(e){//进入订单详情
    var $this=$(this);
    var num = $this.attr("data-num");
    if($(e.target).closest(".task-staff").size()==0){
       window.location.href="/madmin/orderDetail/"+num; 
    }
}).on("click",".order-grade .task-staff",function(e){
     var $this=$(this);
     var status=parseInt($this.parents('.order-item').attr('data-status'));
     if(status==1||status==4){
        e.stopPropagation();
        curStaff = $(this).closest(".order-grade");
        $(".pop-staff").removeClass("hide").attr("data-id",$this.parents('.order-item').attr('data-id'));
        $(".staff-list").empty().html($this.parents('.order-item').find('.order-staff-list').html());
     } 
}).on("click",".staff-list>li",function(){
    var index = $(this).index();
    var src = $(this).find("img").attr("src");
    $("#sure-staff").attr({"data-src":src,"data-tel":$(this).attr("data-tel")});
    $(".staff-list>li").removeClass("active").eq(index).addClass("active");
});

var order_item='<li data-num="{{order_num}}" data-status="{{order_status}}" class="order-item" data-id="{{id}}">'+
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
                                '<div class="order-wawa {{left}}">'+
                                    '<a class="task-staff img-border" href="javascript:;">'+
                                        '<img src="{{staff_img}}" alt="配送员头像">'+
                                    '</a>'+
                                '</div>'+
                                '<div class="order-status-txt {{left}}">'+
                                    '<a class="task-staff c999" href="javascript:;">{{sender_name}}</a><a class="{{tel_show}}" href="tel:{{staff_phone}}">拨号</a>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                        '<ul class="order-staff-list hide">'+
                            '{{each SH2s as sh2}}'+
                            '<li class="" data-tel="{{sh2["phone"]}}" data-id="{{sh2["id"]}}">'+
                                '<span class="img-border mr10"><img src="{{sh2["headimgurl"]}}" alt="员工头像"/></span>'+
                                '<span>{{sh2["nickname"]}}</span>'+
                            '</li>'+
                            '{{/each}}'+
                        '</ul>'+
                    '</ul>'+
                '</li>';

function searchOrder(id){
    $('#order-item').empty();
    var url = '/admin/searchorder?action=order&id='+id+"&page=0";
    $.ajax({
        url:url,
        type:"get",
        success:function(res){
            if(res.success){
                var data = res.data[0];
                if(data.length==0){
                    $(".no-result").html("没有查到任何数据").removeClass("hide");
                }else{
                    console.log(data);
                    var id=data['id'];
                    var order_status=parseInt(data['status']);
                    var order_num=data['num'];
                    var create_date=data['create_date'];
                    var totalPrice=data['totalPrice'];
                    var pay_type=data['pay_type'];
                    var send_time=data['send_time'];
                    var send_address=data['address_text'];
                    var message=data['message'];
                    var del_reason=data['del_reason'];
                    var SH2s=data['SH2s'];
                    var width;
                    var left;
                    var sender_name;
                    var del_status;
                    var show='hide';
                    var hide='show';
                    var tel_show='hide';

                    if(data['SH2']){
                        var staff_img=data['SH2']['headimgurl'];
                        var staff_phone=data['SH2']['phone'];
                        var sender=data['SH2']['nickname'];
                    }else{
                        var staff_img='/static/images/TDSG.png';
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
                            show='show';
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
                            break;
                        case 2:
                        case 3:
                        case 4:
                            width='order-w50';
                            left='order-l50';
                            sender_name=sender+'配送中';
                            tel_show='show';
                            break;
                        case 5:
                            width='order-w100';
                            left='order-l100';
                            sender_name=sender+'已送达';
                            tel_show='show';
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
                       tel_show:tel_show
                    });
                    $('#order-item').append(html);
                }
            }else{
                Tip(res.error_text);
            }
        }
    });
}
//切换送货员
function switchStaff(order_id,staff_id,$obj){
    var url = "/admin/order";
    var args = {
        action:"edit_SH2",
        data:{
            order_id:order_id,
            staff_id:staff_id
        }
    };
    $.postJson(url,args,function(res){
        if(res.success){
            var tel = $obj.attr("data-tel");
            var src = $obj.attr("data-src")
            curStaff.find("img").attr("src",src);
            curStaff.find(".order-line-grade").css("width","50%");
            curStaff.find(".order-wawa").css("left","50%");
            curStaff.find(".order-wawa").children("a").removeClass("task-staff");
            curStaff.find(".order-status-txt").css("left","50%");
            curStaff.find(".order-status-txt").empty().append('<span class="#c333">配送中</span><a class="" href="tel:'+tel+'">拨号</a>');
            $(".pop-staff").addClass("hide");
        }else{
            Tip(res.error_text);
        }
    });
}
