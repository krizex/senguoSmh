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
    if($("#coupon_detail").size()>0){//详情
        console.log(3333);
        $(".copy-coupon-code").zclip({
                path: "/static/js/third/ZeroClipboard.swf",
                copy: function(){
                    return $(this).prev('span').html();
                },
                afterCopy:function(){
                    Tip("优惠券码已经复制到剪切板");
                }
            });
        }
    
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
    $(".forbidden-btn").unbind("click").off("click");
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
    window.location.href="/admin/marketing?action=editcouponpage&coupon_type="+type+"&coupon_id="+id;
}).on("click",".detail-tr",function(){//点击看详情
    var id = $(this).attr("data-id");
    window.location.href="/admin/marketing?action=details&coupon_type="+type+"&coupon_id="+id;
}).on('click', '.coupon-active', function(){
    var $this = $(this);
        $this.attr("data-flag", "on");
        if($this.attr("data-flag")=="off"){
                return false;
        }
        var status = Int($this.attr('data-status'));
        var url = '';
        var action = "close_all";
        var args = {
            action: action
        };
        $.postJson(url, args,
            function (res) {
                if (res.success) {
                    $this.attr("data-flag", "off");
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
                    $this.attr("data-flag", "off");
                    Tip(res.error_text);
                }
            },
            function () {
                $this.attr("data-flag", "off");
                Tip('网络好像不给力呢~ ( >O< ) ~');
            }
        );
}).on('click', '.close_one', function(e){
        e.stopPropagation();
    if(confirm('你确定要关闭该优惠券吗？')){
    var $this = $(this);
    var coupon_id = $(this).attr("data-id");
    var url = '';
    console.log(coupon_id);
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
}).on("click",'.goback',function(){
    window.history.back();
}).on('click','.ok-coupon',function(){
    addCoupon(type);
}).on('click','.ok-editcoupon',function(){
    var coupon_id=$(this).attr("data-id");
    var type=$(this).attr("data-type");
    var edit_status=$(this).attr("data-flag");
    editCoupon(type,coupon_id,edit_status);
}).on("click",".radio-list .radio",function(){
    if($(this).hasClass("forbidden-btn")){
         return false;
    }
    $(".radio-list .radio").removeClass("radio-active");
    $(this).addClass("radio-active");
}).on('click','#selected_status',function(){ //详情类型切换
    var coupon_id=$.getUrlParam("coupon_id");
    insertcoupon(coupon_id);
}).on("click",'.coupon-types .item',function(){//优惠券类型
    var id = parseInt($(this).attr("data-id"));
    type = id;
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
}).on('click','.coupon-items.item',function(){ //dd
    var selected_status=$(this.a).attr("data-id");
    console.log(selected_status);
    $("#dropdownMenu3 em").text($(".coupon-items.item").text());
    insertcoupon(selected_status);
}).on('click','.couponget',function(){//获取
    var selected_status=1;
    $("#dropdownMenu3 em").text($(".couponget").text());
    insertcoupon(selected_status);
}).on('click','.couponuse',function(){//已使用
    var selected_status=2;
    $("#dropdownMenu3 em").text($(".couponuse").text());
    insertcoupon(selected_status);
}).on('click','.couponvalid',function(){//失效
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
                         $('#list-coupons').children("tr").remove();
                        if(coupons.length!=0){
                            for(var i=0; i<coupons.length; i++){
                                var coupon = coupons[i];
                                var $tr='';
                                if(coupon.customer_id=="未领取" ){
                                        $tr='<tr class="dis-coupon">'+
            +'<td class="relative"><span>{{data["coupon_key"]}}</span><a href="javascript:;" class="copy-coupon-code">复制</a></td>'+
            +'<td>{{data["coupon_money"]}}</td>'+
            +'<td>dsfdsds<br>ID:{{data["nickname"]}}</td>'+
            +'<td>{{data["get_date"]}}</td>'+
            +'<td>{{data["use_date"]}}</td>'+
            +'<td>订单号:<a href="javascript:;">{{data["order_id"]}}</a></td>'+
        +'</tr>';
    }
                                else{
                                        $tr='<tr>'+
            +'<td class="relative"><span>{{data["coupon_key"]}}</span><a href="javascript:;" class="copy-coupon-code">复制</a></td>'+
            +'<td>{{data["coupon_money"]}}</td>'+
            +'<td>dsfdsds<br>ID:{{data["nickname"]}}</td>'+
            +'<td>{{data["get_date"]}}</td>'+
            +'<td>{{data["use_date"]}}</td>'+
            +'<td>订单号:<a href="javascript:;">{{data["order_id"]}}</a></td>'+
        +'</tr>';
                                     }
                                $("#list-coupons").append($tr);
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
        var total_number = 0;
        var get_limit = $(".get_limits").val();
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
    var action="newcoupon";
    var args={action:action,data:data};
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
function editCoupon(type,coupon_id,edit_status){
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
        var total_number = 0;
        var get_limit = $(".get_limits").val();
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
        "edit_status":edit_status,
        "coupon_id":coupon_id,
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
    var action=null;
    if (edit_status==null) {
        action="newcoupon";
    }
    else action="editcoupon";
    var args={action:action,data:data};
    var url='';
    $.postJson(url,args,
        function(res){
            if(res.success){
                if (edit_status==null) {
                     Tip('新建优惠券成功!');
                 }
                 else
                     Tip('编辑优惠券成功!');
               
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