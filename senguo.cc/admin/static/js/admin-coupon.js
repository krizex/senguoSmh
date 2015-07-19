var type = 0,goods_list = null;
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
    goods_list=eval($("#goods").val());
    /*$(".cmcopy").zclip({
        path: "/static/js/third/ZeroClipboard.swf",
        copy: function(){
            return $(this).siblings("#cmtargetcopy").html();
        },
        afterCopy:function(){
            Tip("优惠券码已经复制到剪切板");
        }
    });*/
    /*$(".sw-link-copy").zclip({
        path: "/static/js/third/ZeroClipboard.swf",
        copy: function(){
            return $(this).prev("sw-link-txt").val();
        },
        afterCopy:function(){
            Tip("链接已经复制到剪切板");
        }
    });*/
    $(".er-code-img").each(function(){
        var _this = $(this);
        $(this).empty();
        new QRCode(this, {
            width : 80,//设置宽高
            height : 80
        }).makeCode(_this.closest(".sw-er-tip").find(".sw-link-txt").val());
    });
    $(document).on("click",function(e){
        if($(e.target).closest(".sw-er-tip").size()==0){
            $(".sw-er-tip").addClass("invisible");
        }
    });
}).on("click",".show-detail",function(){
    $(".pop-detail").removeClass("hidden");
}).on("click",".close-tip",function(){
    $(".pop-detail").addClass("hidden");
}).on("click",".spread-btn",function(e){
    e.stopPropagation();
    $(".sw-er-tip").addClass("invisible");
    $(this).closest(".operate").children(".sw-er-tip").removeClass("invisible");
}).on("click",".coupon-edit",function(){//编辑
    var id = $(this).attr("data-id");
    var type = $(this).attr("data-type");
    window.location.href="/admin/marketing?action=coupon&coupon_type="+type+"&coupon_id="+id;
}).on("click",".detail-tr",function(){//点击看详情
    var id = $(this).attr("data-id");
    window.location.href="/admin/marketing?action=details&coupon_type="+type+"&coupon_id="+id;
}).on('click', '.coupon-active', function(){
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
                    $this.attr({'data-status': 0}).addClass('bg-green').removeClass('bg-pink').text('启用');
                    $(".coupon-show-txt").children("span").html('启用');
                }
                else if (status == 0) {
                    $this.attr({'data-status': 1}).removeClass('bg-green').addClass('bg-pink').text('停用');
                    $(".coupon-show-txt").children("span").html('停用');
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
}).on('click','.chinav li',function(){
    var index = $(this).index();
    type = index;
    $(".chinav li").removeClass("active").eq(index).addClass("active");
    $(".wrap-tb table").addClass("hidden").eq(index).removeClass("hidden");
}).on("click",'.goback',function(){
    window.history.back();
}).on('click','.ok-coupon',function(){
    addCoupon(type);
}).on("click",".radio-list .radio",function(){
    $(".radio-list .radio").removeClass("radio-active");
    $(this).addClass("radio-active");
}).on('click','#selected_status',function(){ //详情类型切换
    var coupon_id=$.getUrlParam("coupon_id");
    insertcoupon(coupon_id);
}).on("click",'.coupon-types .item',function(){//优惠券类型
    var id = parseInt($(this).attr("data-id"));
    $(".current-type").html($(this).html()).attr("data-id",id);
    if(id==0){
        $(".coupon1").removeClass("hidden");
        $(".coupon2").addClass("hidden");
    }else{
        $(".coupon1").addClass("hidden");
        $(".coupon2").removeClass("hidden");
    }
}).on("click",".use_goods_group_lst .item",function(){
    var id = parseInt($(this).attr("data-id"));
    var index = $(this).closest("li").index();
    console.log(index);
    getGoods(index,$('.use_goods_lst'));
    $(".use_goods_group").html($(this).html()).attr("data-id",id);
}).on("click",".use_goods_lst .item",function(){
    var id = parseInt($(this).attr("data-id"));
    $(".use_goods").html($(this).html()).attr("data-id",id);
}).on("click",".use_goods_group_lsts .item",function(){
    var id = parseInt($(this).attr("data-id"));
    var index = $(this).closest("li").index();
    getGoods(index,$('.use_goods_lsts'));
    $(".use_goods_groups").html($(this).html()).attr("data-id",id);
}).on("click",".use_goods_lsts .item",function(){
    var id = parseInt($(this).attr("data-id"));
    $(".use_goodss").html($(this).html()).attr("data-id",id);
}).on('click','.couponall',function(){ //所有
    var selected_status=0;
    $("#dropdownMenu3 em").text($(".couponall").text());
    insertcoupon(selected_status);
}).on('click','.couponget',function(){//获取
    var selected_status=1;
    $("#dropdownMenu3 em").text($(".couponget").text());
    insertcoupon(selected_status);
}).on('click','.couponuse',function(){//已使用
    var selected_status=2;
    $("#dropdownMenu3 em").text($(".couponuse").text());
    insertcoupon(selected_status);
}).on('click','.couponuse',function(){//失效
    var selected_status=3;
    $("#dropdownMenu4 em").text($(".couponuse").text());
    insertcoupon(selected_status);
});
function getGoods(index,$obj){
    $obj.empty();
    console.log(goods_list);
    var goods = goods_list[index];
    var lis = '';
    for(var i=0; i<goods.length; i++){
        lis+='<li class="presentation" role="presentation"><a class="item" title="'+goods[i].goods_name+'" href="javascript:;" data-id="'+goods[i].goods_id+'">'+goods[i].goods_name+'</a></li>';
    }
    $obj.append(lis);
}
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
function addCoupon(type){
    if(type==0){
        var from_get_date = $(".from_get_date").val();
        var to_get_date = $(".to_get_date").val();
        if(from_get_date>to_get_date){
            return Tip("领取时间的开始时间不能大于结束时间");
        }
        var get_rule = 0;
        var coupon_money = $(".coupon_money").val();
        if(isNaN(coupon_money)){
            return Tip("优惠金额应该为数字类型");
        }
        var use_rule = $(".use_rule").val();
        var total_number = $(".total_number").val();
        if(isNaN(total_number) || total_number.indexOf(".")!=-1){
            return Tip("库存应该为数字类型");
        }
        var get_limit = $(".get_limit").val();
        if(isNaN(total_number) || total_number.indexOf(".")!=-1){
            return Tip("领取限制应该为数字类型");
        }
        var use_goods_group = $(".use_goods_group").attr("data-id");
        var use_goods = $(".use_goods").attr("data-id");
        var valid_way = $(".radio-list1").find(".radio-active").attr('data-id');
        var from_valid_date = $(".from_valid_date").val();
        var to_valid_date = $(".to_valid_date").val();
        if(parseInt(valid_way)==0){
            if(from_valid_date>to_valid_date){
                return Tip("优惠券的有效期起始时间不能大于结束时间");
            }
        }
        var last_day = $(".last_day").val();
    }else{
        var from_get_date = $(".from_get_dates").val();
        var to_get_date = $(".to_get_dates").val();
        if(from_get_date>to_get_date){
            return Tip("领取时间的开始时间不能大于结束时间");
        }
        var get_rule = $(".get_rule").val();
        if(isNaN(get_rule)){
            return Tip("领取条件必须为数字");
        }
        var coupon_money = $(".coupon_moneys").val();
        if(isNaN(coupon_money)){
            return Tip("优惠金额应该为数字类型");
        }
        var use_rule = $(".use_rules").val();
        var total_number = $(".total_numbers").val();
        if(isNaN(total_number) || total_number.indexOf(".")!=-1){
            return Tip("库存应该为数字类型");
        }
        var get_limit = $(".get_limits").val();
        if(isNaN(total_number) || total_number.indexOf(".")!=-1){
            return Tip("领取限制应该为数字类型");
        }
        var use_goods_group = $(".use_goods_groups").attr("data-id");
        var use_goods = $(".use_goodss").attr("data-id");
        var valid_way = $(".radio-list2").find(".radio-active").attr('data-id');
        var from_valid_date = $(".from_valid_dates").val();
        var to_valid_date = $(".to_valid_dates").val();
        if(parseInt(valid_way)==0){
            if(from_valid_date>to_valid_date){
                return Tip("优惠券的有效期起始时间不能大于结束时间");
            }
        }
        var last_day = $(".last_days").val();
    }
    var data={
        "coupon_type":type,
        "from_get_date":from_get_date,
        "to_get_date":to_get_date,
        "get_rule":get_rule,
        "coupon_money":coupon_money,
        "use_rule":use_rule,
        "total_number":total_number,//库存
        "get_limit":get_limit,
        "use_goods_group":use_goods_group,
        "use_goods":use_goods,//
        "valid_way":valid_way,//有效期方式
        "from_valid_date":from_valid_date,//
        "to_valid_date":to_valid_date,//
        "start_day":0,
        "last_day":last_day
    };
    var args={action:"newcoupon",data:data};
    var url='';
    $.postJson(url,args,
        function(res){
            if(res.success){
                Tip('新建优惠券成功!');
                setTimeout(function(){
                    window.location.href="/admin/marketing?action=coupon&coupon_type=0";
                },2000);
            }else{
                Tip(res.error_text);
            }
        },
        function(){
            Tip('网络好像不给力呢~ ( >O< ) ~');
        });
}