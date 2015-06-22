/**
 * Created by Administrator on 2015/6/12.
 */
var curStaff = null,width = 0;
$(document).ready(function(){
    width = $(window).width();
    $(".order-grade .task-staff").on("click",function(){
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
        curStaff.find(".order-status-txt").empty().append('<span class="#c333">配送中</span><a class="" href="tel:'+tel+'">拨号</a>');
       $(".pop-staff").addClass("hide");
    });
    $(window).scroll(function(){
        console.log(333);
    });

    //订单状态
    statusText(parseInt($('#status-txt').attr('data-id')));
}).on('click','.to-send',function(){
    var $this=$(this);
    if(confirm('是否开始配送该订单？')){
        orderEdit($this,'edit_status',4);
    }
}).on('click','.to-finish',function(){
    var $this=$(this);
    if(confirm('是否完成该订单？')){
       orderEdit($this,'edit_status',5); 
    }
}).on('click','.delete-order',function(){
    var $this=$(this);
    var parent=$this.parents('.list-item');
    var id=parent.data('id');
    var index=parent.index();
    var $box=$('.order_set_box');
    $box.modal('show').attr({'data-id':id,'data-target':index}).find('.modal-sure-btn').addClass('delete_check').removeClass('price_check mark_check');
    $box.find('.title').text('订单删除');
    $('#order_ser_val').val('').attr({'placeholder':'为防止误删除操作，请输入订单删除原因'});
});

function statusText(n){
    switch (n){
        case -1:
            $("#status-txt").text('未支付');
            $(".order-wawa").css("left","0");
            $(".order-line-grade").css("width","0");
            $(".order-status-txt").css("left","0");
            $(".tel-btn").hide();
            $(".fun-btn").text('开始配送');
            break;
        case 0:
            $("#status-txt").text('已取消');
            $(".order-wawa").css("left","0");
            $(".order-line-grade").css("width","0");
            $(".order-status-txt").css("left","0");
            $(".tel-btn").show();
            $(".wrap-bm-btn").hide();
            break;
        case 1:
            $("#status-txt").text('已下单');
            $(".order-wawa").css("left","0");
            $(".order-line-grade").css("width","0");
            $(".order-status-txt").css("left","0");
            $(".tel-btn").show();
            $(".fun-btn").text('开始配送').addClass('to-send');
            break;
        case 2:
        case 3:
        case 4:
            $("#status-txt").text('配送中');
            $(".order-wawa").css("left","50%");
            $(".order-line-grade").css("width","50%");
            $(".order-status-txt").css("left","50%");
            $(".tel-btn").show();
            $(".fun-btn").text('完成配送').addClass('to-finish');
            break;
        case 5:
            $("#status-txt").text('已送达');
            $(".order-wawa").css("left","100%");
            $(".order-line-grade").css("width","100%");
            $(".order-status-txt").css("left","100%");
            $(".tel-btn").show();
            $(".wrap-bm-btn").hide();
            break;
        case 6:
        case 7:
            $("#status-txt").text('已评价');
            $(".order-wawa").css("left","100%");
            $(".order-line-grade").css("width","100%");
            $(".order-status-txt").css("left","100%");
            $(".tel-btn").show();
            $(".wrap-bm-btn").hide();
            break;
    }
}

function orderEdit(target,action,content){
    var url=order_link;
    var action=action;
    var parent;
    var regFloat=/^[0-9]+([.]{1}[0-9]{1,2})?$/;
    var data;
    var args;
    if(action=='edit_status'||action=='edit_SH2'){
        parent=target.parents('.order-list-item');  
    }
    else {
        parent=target.parents('.order_set_box');
    }
    if (parent){
        var order_id=parent.attr('data-id');
        data={order_id:order_id};
    }
    if(action=='edit_remark')
    {
    if(content.length>100) return Tip('订单备注请不要超过100个字');
    data.remark=content;
    var index=parent.attr('data-target');
    }
    else if(action=='edit_SH2')
    {
        data.staff_id=Int(content);
    }
    else if(action=='edit_status')
    {
        data.status=Int(content);
    }
    else if(action=='edit_totalPrice')
    {
        if(!regFloat.test(content)) return Tip('订单总价只能为数字');
        data.totalPrice=content;
        var index=parent.attr('data-target');
    }
    else if(action=='batch_edit_status'){
        var list=[];
        $('.order-checked').each(function(){
            var $this=$(this);
            var id =$this.parents('.order-list-item').attr('data-id');
            list.push(id);
        });
        if(list.length==0){
            return Tip('您还未选择任何订单');
        }
        data.status=Int(content);
        data.order_list_id=list;
    }
    args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                if(action=='edit_remark'){
                    parent.modal('hide');
                    var $remark_box=$('.order-list-item').eq(index).find('.saler-remark');
                    $remark_box.show().find('.order_remark').text(content);
                    $('.order-list-item').eq(index).find('.saler-remark').val(content);
                }else if(action=='edit_SH2'){
                   var code=target.find('.sender-code').text();
                   var name=target.find('.sender-name').text();
                   var phone=target.find('.sender-phone').text();
                   var $sender=parent.find('.order-sender');
                   var order_status=Int($('.order-status').find('.active').first().attr('data-id'));
                   if(order_status==1){
                        parent.find('.to-send').attr({'disabled':true}).text('配送中');
                   }
                   $sender.find('.sender-code').text(code);
                   $sender.find('.sender-name').text(name);
                   $sender.find('.sender-phone').text(phone);
                   parent.find('.status_send').removeClass('hidden');
                   parent.find('.status_order').addClass('hidden');
                   parent.find('.status_finish').addClass('hidden');
                   parent.find('.status_word').text('配送中');
                   parent.find('.status-send').addClass('bg-blue').siblings().removeClass('bg-blue');
                }else if(action=='edit_status'){
                  target.addClass('bg-blue').siblings().removeClass('bg-blue');
                  var status=target.text();
                  parent.find('.status_word').text(status);
                  if(content==1) {
                        parent.find('.status_order').removeClass('hidden');
                        parent.find('.status_send').addClass('hidden');
                        parent.find('.status_finish').addClass('hidden');
                }
        else if(content==4) {
            parent.find('.status_send').removeClass('hidden');
                               parent.find('.status_order').addClass('hidden');
            parent.find('.status_finish').addClass('hidden');
                                        target.attr({'disabled':true}).text('配送中');
                                        parent.find('.check').removeClass('order-check');
        }
                               else if(content==5) {
                        parent.find('.status_finish').removeClass('hidden');
                             parent.find('.status_order').addClass('hidden');
                        parent.find('.status_send').addClass('hidden');
                                        target.attr({'disabled':true}).text('已完成');
                                        parent.find('.check').removeClass('order-check');
                      }
                }else if(action=='batch_edit_status'){
                        if(content==4) {
                            $('.order-checked').each(function(){
                                var $this=$(this);
                                var $item =$this.parents('.order-list-item');
                                $item.find('.status_send').removeClass('hidden');
                                $item.find('.status_order').addClass('hidden');
                                $item.find('.status_finish').addClass('hidden');
                                $item.find('.to-send').attr({'disabled':true}).text('配送中');
                            });
                        }
                        else if(content==5) {
                             $('.order-checked').each(function(){
                                var $this=$(this);
                                var $item =$this.parents('.order-list-item');
                                $item.find('.status_finish').removeClass('hidden');
                                $item.find('.status_order').addClass('hidden');
                                $item.find('.status_send').addClass('hidden');
                                $item.find('.to-finish').attr({'disabled':true}).text('已完成');
                             });
                        }
                }else if(action=='edit_totalPrice'){
          parent.modal('hide');
                   $('.order-list-item').eq(index).find('.order-price').text(content);
                }
            }
            else {
                return Tip(res.error_text);}
        },
        function(){return Tip('网络错误')}
    )
}