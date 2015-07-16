$(document).ready(function () {
    $('.mode').each(function () {
        var $this = $(this);
        var status = $this.data('status');
        if (status == 1) {
            $this.addClass('work-mode').find('.tit').text('已启用');
        }
        else {
            $this.addClass('stop-mode').find('.tit').text('未启用');
        }

    });
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
    $(".cmcopy").zclip({
        path: "/static/js/third/ZeroClipboard.swf",
        copy: function(){
            return $(this).siblings("#cmtargetcopy").html();
        },
        afterCopy:function(){
            Tip("优惠券码已经复制到剪切板");
        }
    });
    $(".sw-link-copy").zclip({
        path: "/static/js/third/ZeroClipboard.swf",
        copy: function(){
            return $(this).prev("sw-link-txt").val();
        },
        afterCopy:function(){
            Tip("链接已经复制到剪切板");
        }
    });
    $(".er-code-img").each(function(){
        var _this = $(this);
        $(this).empty();
        new QRCode(this, {
            width : 80,//设置宽高
            height : 80
        }).makeCode(_this.closest(".sw-er-tip").find(".sw-link-txt").val());
    });
}).on("click",".spread-all-item",function(e){
    e.stopPropagation();
    $(".sw-er-tip").addClass("invisible");
    $(this).closest(".all-bm-group").next(".sw-er-tip").toggleClass("invisible");
}).on('click', '.confess-active', function () {
    var $this = $(this);
    if ($this.attr("data-flag") == "off") return false;
    $this.attr("data-flag", "off");
    var status = Int($this.attr('data-status'));
    var url = '';
    var action = "confess_active";
    var args = {
        action: action
    };
    $.postJson(url, args,
        function (res) {
            if (res.success) {
                $this.attr("data-flag", "on");
                if (status == 1) {
                    $this.attr({'data-statusaction-btn': 0}).addClass('bg-green').removeClass('bg-pink').text('启用');
                }
                else if (status == 0) {
                    $this.attr({'data-status': 1}).removeClass('bg-green').addClass('bg-pink').text('停用');
                }
            }
            else {
                Tip(res.error_text);
            }
        },
        function () {
            Tip('网络好像不给力呢~ ( >O< ) ~');
        }
    );
}).on('click', '.confess-type', function () {
    var $this = $(this);
    if ($this.attr("data-flag") == "off") return false;
    $this.attr("data-flag", "off");
    var status = Int($this.attr('data-status'));
    var url = '';
    var action = "confess_type";
    var args = {
        action: action
    };
    $.postJson(url, args,
        function (res) {
            if (res.success) {
                $this.attr("data-flag", "on");
                if (status == 1) {
                    $this.attr({'data-status': 0}).addClass('stop-mode').removeClass('work-mode').find('.tit').text('未启用');
                }
                else if (status == 0) {
                    $this.attr({'data-status': 1}).removeClass('stop-mode').addClass('work-mode').find('.tit').text('已启用');
                }
            }
            else {
                Tip(res.error_text);
            }
        },
        function () {
            Tip('网络好像不给力呢~ ( >O< ) ~');
        }
    );
}).on('click', '.confess-only', function () {
    var $this = $(this);
    if ($this.attr("data-flag") == "off") return false;
    $this.attr("data-flag", "off");
    var status = Int($this.attr('data-status'));
    var url = '';
    var action = "confess_only";
    var args = {
        action: action
    };
    $.postJson(url, args,
        function (res) {
            if (res.success) {
                $this.attr("data-flag", "on");
                if (status == 1) {
                    $this.attr({'data-status': 0}).addClass('stop-mode').removeClass('work-mode').find('.tit').text('未启用');
                }
                else if (status == 0) {
                    $this.attr({'data-status': 1}).removeClass('stop-mode').addClass('work-mode').find('.tit').text('已启用');
                }
            }
            else {
                Tip(res.error_text);
            }
        },
        function () {
            Tip('网络好像不给力呢~ ( >O< ) ~');
        }
    );
}).on('click', '.notice-sure', function () {
    var $this = $(this);
    var url = '';
    var action = "confess_notice";
    var data = $('.wall-notice').val().trim();
    if (!data) {
        return Tip('请填写公告内容')
    }
    if (data.length > 140) {
        return Tip('公告内容不要超过140字')
    }
    var args = {
        action: action,
        data: data
    };
    $.postJson(url, args,
        function (res) {
            if (res.success) {
                $('.wall-content').text(data).show().siblings('.wall-notice').hide();
                $this.hide().siblings('.notice-edit').show();
            }
            else {
                Tip(res.error_text);
            }
        },
        function () {
            Tip('网络好像不给力呢~ ( >O< ) ~');
        }
    );
}).on('click', '.notice-edit', function () {
    var $this = $(this);
    $this.hide().siblings('.notice-sure').show();
    $('.wall-content').hide().siblings('.wall-notice').show();
}).on('click','.configbtn',function(){
    getinput("newcoupon",0);
}).on('click','.editconfigbtn',function(){
    var coupon_id=$.getUrlParam("coupon_id");
    getinput("editcoupon",coupon_id);
}).on('click','#selected_status',function(){
    var coupon_id=$.getUrlParam("coupon_id");
    insertcoupon(coupon_id);
}).on('click','.cmbtn',function(){
    window.location.href="/admin/marketing?action=newpage";
}).on('click','.back-main',function(){
    window.location.href="/admin/marketing?action=coupon";
}).on('click','.couponall',function(){
    var selected_status=0;
    $("#dropdownMenu3 em").text($(".couponall").text());
    insertcoupon(selected_status);
}).on('click','.couponget',function(){
    var selected_status=1;
    $("#dropdownMenu3 em").text($(".couponget").text());
    insertcoupon(selected_status);
}).on('click','.couponuse',function(){
    var selected_status=2;
    $("#dropdownMenu3 em").text($(".couponuse").text());
    insertcoupon(selected_status);
}).on('click','.details tr',function(){
    // Tip('网络好像不给力呢~ ( >O< ) ~');
});

function insertcoupon(selected_status){
    var coupon_id=$.getUrlParam("coupon_id");
    var url='';
    var action="details"
    var data={
        select_rule:selected_status,coupon_id:coupon_id
    }
    var  args={
        action:action,data:data
    }
    $.postJson(url,args,function(res){
                if(res.success){
                        var coupons = res.output_data;
                         $('#list-coupons').empty();
                        if(coupons.length!=0){
                            console.log(coupons.length);
                            for(var i=0; i<coupons.length; i++){
                                    var coupon = coupons[i];
                                    var $item = $("#temp-coupons").children("li").clone();
                                    $item.find("#cmtargetcopy").html(coupon.coupon_key);
                                    $item.find(".money").html(coupon.coupon_money);
                                    if(coupon.customer_id=='未领取'){
                                        $item.find("#noget").html(coupon.customer_id);
                                    }
                                    else{
                                        if(coupon.headimgurl){
                                            $item.find("#headimg").attr("src",coupon.headimgurl+"?imageView2/1/w/100/h/100");
                                        }
                                        else{
                                            $item.find("#headimg").attr("src","/static/images/TDSG.png");
                                        }
                                        $item.find("#nickname").html(coupon.nickname);
                                        $item.find("#customerid").html(coupon.customer_id);
                                    }
                                    $item.find("#getdate").html(coupon.get_date);
                                    $item.find("#usedate").html(coupon.use_date);
                                    $item.find("#orderid").html(coupon.order_id);
                                    $("#list-coupons").append($item);
                                     }
                        
                                }
                                else{
                                    var $item=$("#noresult").clone();
                                    $item.find("#text").html("没有相关查询的优惠券信心呢～（O.O）～");
                                    $("#list-coupons").append($item);
                                }
                         }
                         else  Tip(error_text);
           }, function () {
            Tip('网络好像不给力呢~ ( >O< ) ~');
        });
}
function getinput( action,coupon_id){

    var in1=$('#in1').val();
    var in2=$('#in2').val();
    var in3=$('#in3').val();
    var in4=$('#in4').val();
    var in9=$('#in9').val();
    var valid_way;
    var start_time;
    var uneffictive_time;
    var day_start;
    var last_day;
    var temp=document.getElementsByName("valid_way"); 
    if(in4==''){
        in4=1;
    }
    if (in2==''){
        in2=0;
    }
    if(temp[0].checked)
    {
        valid_way=0;
        start_time=$('#in7').val();
        uneffective_time=$('#in8').val();
    }
    else {
        valid_way=1;
        start_time='1111-11-11';
        uneffective_time='1111-11-11';
        day_start=$('#in5').val();
        last_day=$('#in6').val();
    }
    if (in1=='') {
        Tip("请输入优惠金额！");
    }
    else if (in3=='')
    {
        Tip("请输入库存量！");
    }
    else if(start_time==''&valid_way==0){
            Tip("请输入有效日期！");
        }
    else if(uneffective_time==''&valid_way==0){
            Tip("请输入失效日期！");
        }
    else if(uneffective_time<=start_time &valid_way==0){
            Tip("失效时间必须大于生效时间!!!");
        }
    else {
    var data={
    "coupon_money":in1,"use_rule":in2,"total_num":in3,"get_limitnum":in4,"used_for":in9,"valid_way":valid_way,"start_time":start_time,"uneffective_time":uneffective_time,"day_start":day_start,"last_day":last_day
    ,"coupon_id":coupon_id};
    console.log(data);
    var args={action:action,data:data};
    var url='';
    $.postJson(url,args,
        function (res) {
            if (res.success) {
                Tip('新建/编辑优惠券成功!');
            }
            else {
                Tip('新建/编辑优惠券成功!');
            }
        },
        function () {
            Tip('网络好像不给力呢~ ( >O< ) ~');
        })
    }
    // Tip("成功新建优惠券！");
}