var curStaff = null,width = 0;
$(document).ready(function(){
    width = $(window).width(); 
    //订单状态
    statusText(parseInt($('#status-txt').attr('data-id')));
}).on("click","#sure-staff",function(){
    var $this=$(this);
    orderEdit($this,'edit_SH2',$this.attr("data-id")); 
}).on("click",".staff-list>li",function(){
    var $this=$(this);
    var index = $this.index();
    var src = $this.find("img").attr("src");
    var staff_id=$this.attr("data-id");
    var tel=$this.attr("data-tel");
    $("#sure-staff").attr({"data-src":src,"data-id":staff_id,"data-tel":tel});
    $(".staff-list>li").removeClass("active").eq(index).addClass("active");
}).on("click",".order-grade .task-staff",function(){
    var status=parseInt($(this).attr('data-id'));
    if(status==1||status==4){
        curStaff = $(this).closest(".order-grade");
        $(".pop-staff").removeClass("hide"); 
    }     
}).on('click','.to-send',function(){
    var $this=$(this);
    $('.pop-confirm').removeClass('hide').find('.text').text('是否开始配送该订单？');
    $('.func-sure').attr('data-type','send');
}).on('click','.func-sure',function(){
    var $this=$(this);
    var type=$this.attr('data-type');
    if(type=='send'){
        orderEdit($this,'edit_status',4); 
    }
    else{
        orderEdit($this,'edit_status',5);
    }
}).on('click','.to-finish',function(){
    var $this=$(this);
    $('.pop-confirm').removeClass('hide').find('.text').text('是否完成该订单？');
    $('.func-sure').attr('data-type','finish');
}).on('click','.delete-order',function(){
    var $this=$(this);
    $(".sure-btn").attr("id","del-sure");
    $('.pop-del').removeClass('hide').find('#order-del').val('').attr({'placeholder':'为防止误删除操作，请输入订单删除原因'});
    $('.pop-del').find('.title').text('订单删除');
}).on('click','#del-sure',function(){
    var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    var url='/admin/order';
    var action='del_order';
    var order_id=parseInt($('.order-detail-box').attr('data-id'));
    var del_reason=$('#order-del').val();
    if(!del_reason){
        $this.attr("data-flag","on");
        return Tip('请输入订单删除的原因');
    }
    if(del_reason.length>300){
        $this.attr("data-flag","on");
        return Tip('删除原因最多可输入300字');
    }
    var data={
        order_id:order_id,
        del_reason:del_reason
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                $this.attr("data-flag","on");
                $('.pop-del').addClass('hide').find('#order-del').val('').attr({'placeholder':''});
                $('.wrap-bm-btn').hide();
                $("#status-txt").text('该订单已删除');
                $(".order-wawa").css("left","0");
                $(".order-line-grade").css("width","0");
                $(".order-status-txt").css("left","0");
                $(".tel-btn").hide();
            }
            else {
                $this.attr("data-flag","on");
                return Tip(res.error_text);
            }
        }
    )
}).on('click','.remark-order',function(){
    $(".sure-btn").attr("id","remark-sure");
    $('.pop-del').removeClass('hide').find('#order-del').val('').attr({'placeholder':'请输入您的订单备注'});
    $('.pop-del').find('.title').text('订单备注');
}).on('click','#remark-sure',function(){
    var remark=$('#order-del').val();
    var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    if(!remark){
        $this.attr("data-flag","on");
        return Tip('请输入订单备注');
    }
    if(remark.length>100){
        $this.attr("data-flag","on");
        return Tip('订单备注最多可输入100字');
    }
    orderEdit($this,'edit_remark',remark);
    $this.attr("data-flag","on");
});

function orderEdit(target,action,content){
    var url='/admin/order';
    var action=action;
    var parent;
    var regFloat=/^[0-9]+([.]{1}[0-9]{1,2})?$/;
    var data;
    var args;
    var order_id=parseInt($('.order-detail-box').attr('data-id'));
    data={order_id:order_id};
    if(action=='edit_remark')
    {
        if(content.length>100) return Tip('订单备注请不要超过100个字');
        data.remark=content;
    }
    else if(action=='edit_SH2')
    {
        data.staff_id=parseInt(content);
    }
    else if(action=='edit_status')
    {
        data.status=parseInt(content);
    }
    else if(action=='edit_totalPrice')
    {
        if(!regFloat.test(content)) return Tip('订单总价只能为数字');
        data.totalPrice=content;
        var index=parent.attr('data-target');
    }
    args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                if(action=='edit_remark'){
                   $('.remark').removeClass("hide").find(".con").text(content);
                   $(".pop-del").addClass("hide");
                }else if(action=='edit_SH2'){
                    var tel=target.attr("data-tel");
                    curStaff.find("img").attr("src",target.attr("data-src"));
                    curStaff.find(".order-line-grade").css("width","50%");
                    curStaff.find(".order-wawa").css("left","50%");
                    curStaff.find(".order-wawa").children("a").removeClass("task-staff");
                    curStaff.find(".order-status-txt").css("left","50%");
                    curStaff.find(".order-status-txt").empty().append('<a class="task-staff" href="javascript:; id="status-txt">配送中</a><a class="" href="tel:'+tel+'">拨号</a>');
                   $(".pop-staff").addClass("hide");
                }else if(content==4) {
                    $("#status-txt").text('配送中');
                    $(".order-wawa").css("left","50%");
                    $(".order-line-grade").css("width","50%");
                    $(".order-status-txt").css("left","50%");
                    $(".tel-btn").show();
                    $(".fun-btn").text('完成配送').addClass('to-finish');
                    $('.pop-confirm').addClass('hide');
                }else if(content==5) {
                    $("#status-txt").text('已送达');
                    $(".order-wawa").css("left","100%");
                    $(".order-line-grade").css("width","100%");
                    $(".order-status-txt").css("left","100%");
                    $(".tel-btn").show();
                    $(".wrap-bm-btn").hide();
                    $('.pop-confirm').addClass('hide');
                    }
        }
        else {
            return Tip(res.error_text);}
        }
    )
}

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
            
            $(".order-wawa").css("left","0");
            $(".order-line-grade").css("width","0");
            $(".order-status-txt").css("left","0");
            $(".tel-btn").show();
            $(".wrap-bm-btn").hide();
            if($(".del-reason .text").text()!='None'){
                if($(".del-reason .text").text()=='timeout'){
                    $("#status-txt").text('该订单15分钟未支付，已自动取消');
                }else{
                    $(".del-reason").removeClass("hide");
                    $("#status-txt").text('该订单已删除');
                }  
            }
            else{
                $("#status-txt").text('该订单已被用户取消');
            }
            break;
        case 1:
            $("#status-txt").text('分配员工');
            $(".order-wawa").css("left","0");
            $(".order-line-grade").css("width","0");
            $(".order-status-txt").css("left","0");
            $(".wrap-bm-btn").show();
            $(".tel-btn").show();
            $(".fun-btn").text('设为处理中').addClass('to-send');
            break;
        case 2:
        case 3:
        case 4:
            $("#status-txt").text('配送中');
            $(".order-wawa").css("left","50%");
            $(".order-line-grade").css("width","50%");
            $(".order-status-txt").css("left","50%");
            $(".wrap-bm-btn").show();
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
            $(".tel-btn").hide();
            $(".wrap-bm-btn").hide();
            break;
    }
}