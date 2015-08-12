$(document).ready(function () {
    $('.action-btn').each(function () {
        var $this = $(this);
        var status = $this.data('status');
        if (status == 1) {
            $this.addClass('bg-pink').text('停用');
        }
        else {
            $this.addClass('bg-green').text('启用');
        }
    });
}).on('click', '.discount-active', function(){
    var status = parseInt($(this).attr('data-status'));
    var tip_info='';
    if (status==0){
        tip_info="开启优惠券即可使用优惠券功能，你确定要开启优惠券吗？";
    }
    else{
        tip_info="优惠券一旦关闭将不能重新开启,你确定要关闭所有优惠券吗？";
    }
    if(confirm(tip_info)){
            var $this = $(this);
        $this.attr("data-flag", "on");
        if($this.attr("data-flag")=="off"){
                return false;
        }
        var url = '';
        var action = "close_all";
        var args = {
            action: action
        };
        $.postJson(url, args,
            function (res) {
                if (res.success) {
                    if(res.coupon_active_cm==1){
                        $("#discount_hidden").removeClass("hidden");
                    }
                    else{
                         $("#discount_hidden").addClass("hidden");
                    }
                    $this.attr("data-flag", "off");
                    if (status == 1) {
                        $this.attr({'data-status': 0}).addClass('bg-green').removeClass('bg-pink').text('启用');
                        $(".discount-show-txt").children("span").html('停用');
                    }
                    else if (status == 0) {
                        $this.attr({'data-status': 1}).removeClass('bg-green').addClass('bg-pink').text('停用');
                        $(".discount-show-txt").children("span").html('启用');
                    }
                }
                else {
                    $this.attr("data-flag", "off");
                    Tip(res.error_text);
                }
            },
            function () {
                $this.attr("data-flag", "off");
                Tip('网络好像不给力呢~ ( >O< ) ~');
            }
        );


    }
}).on('click', '.close_one', function(e){
        e.stopPropagation();
    if(confirm('你确定要关闭该优惠券吗？')){
    var $this = $(this);
    var coupon_id = $(this).attr("data-id");
    var url = '';
    var action = "close_one";
    var args = {
        action: action,coupon_id:coupon_id
    };
    $.postJson(url, args,
        function (res) {
            if (res.success) {
                $this.closest('tr').addClass('dis-coupon');
                Tip("成功关闭优惠券!");
            }
            else {
                Tip(res.error_text);
            }
        },
        function () {
            Tip('网络好像不给力呢~ ( >O< ) ~');
        }
    );
    }
}).on('click','.chinav li',function(){
    var index = $(this).index();
    type = index;
    $(".chinav li").removeClass("active").eq(index).addClass("active");
    $(".wrap-tb table").addClass("hidden").eq(index).removeClass("hidden");
});