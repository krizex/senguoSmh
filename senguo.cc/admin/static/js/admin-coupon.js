var type = 0,goods_list = null;
$(document).ready(function () {
   $('.action-mode').each(function(){
        var $this=$(this);
        var status=$this.data('status');
        if(status==1)
            $this.find('.work-mode').show();
        else $this.find('.stop-mode').show();

    });
    goods_list=eval($("#goods").val());
    if($("#coupon_detail").size()>0){//详情
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
        $(".sw-link-copy").zclip({
            path: "/static/js/third/ZeroClipboard.swf",
            copy: function(){
                return $(this).prev('input').val();
            },
            afterCopy:function(){
                Tip("优惠券链接已经复制到剪切板");
            }
        });
  var id=parseInt($.getUrlParam("coupon_type"));
  if(id){
        type = id;
        if(id==0){
            $(".chinav li").removeClass("active").eq(id).addClass("active");
            $(".wrap-tb table").addClass("hidden").eq(id).removeClass("hidden");
        }else{
           $(".chinav li").removeClass("active").eq(id).addClass("active");
            $(".wrap-tb table").addClass("hidden").eq(id).removeClass("hidden");
        }
  }

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
}).on("click",".back-coupon",function(){
    window.location.href="/admin/marketing?action=coupon&coupon_type="+type;
    return false;
}).on("click",".detail-tr",function(e){//点击看详情
    if($(e.target).closest(".sw-er-tip").size()>0){
         return false;
    }
    var id = $(this).attr("data-id");
    window.location.href="/admin/marketing?action=details&coupon_type="+type+"&coupon_id="+id+"&page=1";
}).on('click', '.coupon-active', function(){
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
                        $("#coupon_hidden").removeClass("hidden");
                    }
                    else{
                         $("#coupon_hidden").addClass("hidden");
                    }
                    $this.attr("data-flag","on");
                    if(status==1){
                        $this.attr({'data-status':0}).find('.stop-mode').show().siblings('.work-mode').hide();
                    }
                    else if(status == 0){
                        $this.attr({'data-status':1}).find('.stop-mode').hide().siblings('.work-mode').show();
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
}).on("click",'.goback',function(e){
    e.stopPropagation();
    if (confirm("当前编辑的优惠券还没有保存，你确定退出编辑吗？")){
        window.location.href="/admin/marketing?action=coupon&coupon_type="+type;
    }
}).on("click",'.cm_edit_cancel',function(){
   window.location.href="/admin/marketing?action=coupon&coupon_type="+type;
}).on('click','.ok-coupon',function(){
    var type=$('.current-type').attr("data-id");
    if ($(this).attr("data-flag")=="off"){
        return;
    }
    $(this).attr("data-flag","off");
    addCoupon(type);
}).on('click','.ok-editcoupon',function(){
    var coupon_id=$(this).attr("data-id");
    var type=$(this).attr("data-type");
    var edit_status=$(this).attr("data-flag");
    if ($(this).attr("data-config")=="off"){
        return;
    }
    $(this).attr("data-config","off");
    editCoupon(type,coupon_id,edit_status);
}).on("click",".radio-list .radio",function(){
    if($(this).hasClass("forbidden-btn")){
         return false;
    }
    $(".radio-list .radio").removeClass("radio-active");
    $(this).addClass("radio-active");
}).on('click','#selected_status',function(){ //详情类型切换
    var coupon_id=$.getUrlParam("coupon_id");
    var page=1;
    insertcoupon(coupon_id,page);
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
    getGoods(index,$('.use_goods_lst'));
    $(".use_goods_group").html($(this).html()).attr("data-id",id);
    $(".use_goods").html("所有商品").attr("data-id","-1");
}).on("click",".use_goods_lst .item",function(){
    var id = parseInt($(this).attr("data-id"));
    $(".use_goods").html($(this).html()).attr("data-id",id);
}).on("click",".use_goods_group_lsts .item",function(){
    var id = parseInt($(this).attr("data-id"));
    var index = $(this).closest("li").index();
    getGoods(index,$('.use_goods_lsts'));
    $(".use_goods_groups").html($(this).html()).attr("data-id",id);
    $(".use_goodss").html("所有商品").attr("data-id","-1");
}).on("click",".use_goods_lsts .item",function(){
    var id = parseInt($(this).attr("data-id"));
    $(".use_goodss").html($(this).html()).attr("data-id",id);
}).on('click','.coupon-items .item',function(){ //dd
   
    var selected_status=$(this).attr("data-id");
    $(".use_goods_group").text($(this).text());
    var page_total=parseInt($(this).attr("data-num"));
    page_total=parseInt(page_total/12);
    if (page_total==0){
        page_total=1;
    }
    $(".page-total").text(page_total);
    var page=1;
    $(".page-now").text(1);
    insertcoupon(selected_status,page);
}).on('click','.cm_new_coupon',function(){
    window.location.href="/admin/marketing?action=newcouponpage&coupon_type="+type;
}).on('click','.pre-page',function(){
    var pagenow=parseInt($('.page-now').text());
    var selected_status=$(".use_goods_group").attr("data-id");
    if (pagenow==1){
        Tip("当前已经是第一页，不能再向前翻页");
    }
    else {
        $(".page-now").text(pagenow-1);
        insertcoupon(selected_status,pagenow-1);
    }
}).on('click','.next-page',function(){
     var pagenow=parseInt($('.page-now').text());
     var pagetotal=parseInt($('.page-total').text());
     var select_rule=$(".use_goods_group").attr("data-id");
     if (pagenow==pagetotal){
        Tip("当前已经是最后一页，不能再向后翻页");
     }
     else{
        $('.page-now').text(pagenow+1);
        insertcoupon(select_rule,pagenow+1);
     }
}).on("click",".jump-to",function(){
    var inputpage=parseInt($(".input-page").val())
    var pagetotal=parseInt($('.page-total').text());
    var select_rule=$(".use_goods_group").attr("data-id");
    if (inputpage<1 || inputpage>pagetotal ||isNaN(inputpage)){
        Tip("输入的页码值不符合要求");
    }
    else{
        $('.page-now').text(inputpage);
        insertcoupon(select_rule,inputpage);
    }
}).on("click",".back-coupon",function(){
    // window.location.href="/admin/marketing?action=coupon&coupon_type="+type;
});

function getGoods(index,$obj){
    $obj.empty();
    var goods = goods_list[index];
    var lis = '';
    for(var i=0; i<goods.length; i++){
        lis+='<li class="presentation" role="presentation"><a class="item" title="'+goods[i].goods_name+'" href="javascript:;" data-id="'+goods[i].goods_id+'">'+goods[i].goods_name+'</a></li>';
    }
    $obj.append(lis);
}
function insertcoupon(selected_status,page){
    var coupon_id=$.getUrlParam("coupon_id");
    var coupon_type=$.getUrlParam("coupon_type");
    var url='';
    var action="details";
    var data={
   action:action,coupon_type:coupon_type,coupon_id:coupon_id,page:page,select_rule:selected_status
    }
    var  args={
        action:action,data:data
    }
    $.postJson(url,args,function(res){
                if(res.success){
                        var coupons = res.output_data;
                        $('#list-coupons').empty();
                        if(coupons.length!=0){
                            for(var i=0; i<coupons.length; i++){
                                var coupon = coupons[i];
                                var trow='';
                                var temp=null;
                            if(coupon.coupon_status==0 && coupon.close==0 ){
                                        trow='<tr>'
                                                +'<td class="relative"><span>{{coupon_key}}</span><span class="copy-coupon-code">复制</span></td>'
                                                +'<td>{{coupon_money}}元</td>'
                                                +'<td>未领取</td>'
                                                +'<td>未领取</td>'
                                                +'<td>未领取</td>'
                                                +'<td>订单号:<a href="javascript:;">无</a></td>'
                                            +'</tr>';
                                        var render=template.compile(trow);
                                        temp=render({
                                            coupon_money:coupon.coupon_money,
                                            coupon_key:coupon.coupon_key
                                        });
                                }
                                else if (coupon.coupon_status==1) {
                                        trow='<tr class=" ">'
                                                +'<td class="relative"><span>{{coupon_key}}</span><span class="copy-coupon-code">复制</span></td>'
                                                +'<td>{{coupon_money}}元</td>'
                                                +'<td>{{nickname}}<br>ID:{{coupon_id}}</td>'
                                                +'<td>{{get_date}}</td>'
                                                +'<td>未使用</td>'
                                                +'<td>订单号:<a href="javascript:;">无</a></td>'
                                            +'</tr>';
                                        var render=template.compile(trow);
                                        temp=render({
                                            coupon_money:coupon.coupon_money,
                                            nickname:coupon.nickname,
                                            coupon_id:coupon.coupon_id,
                                            get_date:coupon.get_date,
                                            coupon_key:coupon.coupon_key
                                        });
                                }
                                else if (coupon.coupon_status==2){
                                       trow='<tr class=" ">'
                                                    +'<td class="relative"><span>{{coupon_key}}</span><span class="copy-coupon-code">复制</span></td>'
                                                    +'<td>{{coupon_money}}元</td>'
                                                    +'<td>{{nickname}}<br>ID:{{coupon_id}}</td>'
                                                    +'<td>{{get_date}}</td>'
                                                    +'<td>{{use_date}}</td>'
                                                    +'<td>订单号:<a href="javascript:;">{{order_id}}</a></td>'
                                                +'</tr>';
                                        var render=template.compile(trow);
                                        temp=render({
                                            coupon_money:coupon.coupon_money,
                                            nickname:coupon.nickname,
                                            coupon_id:coupon.coupon_id,
                                            get_date:coupon.get_date,
                                            order_id:coupon.order_id,
                                            use_date:coupon.use_date,
                                            coupon_key:coupon.coupon_key
                                        });
                                }
                                else if ((coupon.coupon_status==0&&coupon.close==1 )||(coupon.coupon_status==3&&coupon.close==0)){
                                            trow='<tr class=" dis-coupon">'
                                                    +'<td class="relative"><span>{{coupon_key}}</span><span class="copy-coupon-code">复制</span></td>'
                                                    +'<td>{{coupon_money}}元</td>'
                                                    +'<td>已失效</td>'
                                                    +'<td>已失效</td>'
                                                    +'<td>已失效</td>'
                                                    +'<td>已失效:<a href="javascript:;">无</a></td>'
                                                +'</tr>';
                                            var render=template.compile(trow);
                                            temp=render({
                                                coupon_money:coupon.coupon_money,
                                                coupon_key:coupon.coupon_key
                                            });
                                }
                                $("#list-coupons").append(temp);
                                if($("#coupon_detail").size()>0){//详情
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
                            }
                        }
                        else{
                            temp= '<tr><td colspan="6" class="txt-center c999">当前没有优惠券</td></tr>';
                            // $item.find("#text").html("没有相关查询的优惠券信心呢～（O.O）～");
                            $("#list-coupons").append(temp);
                        }
                        }
                        else Tip(error_text);
            }, function () {
            Tip('网络好像不给力呢~ ( >O< ) ~');
        });
}
function addCoupon(type){
    var currentdate=getNowFormatDate();
    var testMoney = /^(([0-9]|([1-9][0-9]{0,9}))((\.[0-9]{1,2})?))$/;
    if(type==0){
        var from_get_date = $(".from_get_date").val();
        var to_get_date = $(".to_get_date").val();
        if (from_get_date==''){
            return Tip("领取时间的开始时间不能为空");
        }
        /*if(todate(from_get_date)<todate(currentdate)){
             return Tip("领取时间的开始时间不能小于当前时间");
        }*/
        if(todate(to_get_date)<todate(currentdate)){
            return Tip("领取时间的结束时间不能小于当前时间");
        }
        if(to_get_date==''){
            return Tip("领取时间的结束时间不能为空");
        }
        if(todate(from_get_date)>todate(to_get_date)){
            return Tip("领取时间的开始时间不能大于结束时间");
        }
        var get_rule = 0;
        var get_limit = $(".get_limit").val();
        if (get_limit=='') {
            get_limit=1;
        }
        else{
            if(isNaN(get_limit) || get_limit.indexOf(".")!=-1||parseInt(get_limit)==0){
                return Tip("领取限制应该为正整数");
            }
        }
        var total_number = $(".total_number").val();
        if(isNaN(total_number) || total_number.indexOf(".")!=-1||total_number==''||parseInt(total_number)==0){
            return Tip("库存应该不为空且为正整数");
        }
        if (parseInt(get_limit)>parseInt(total_number)) {
            return Tip("领取限制数量不能大于库存量");
        }
        var use_rule = $(".use_rule").val();
        if(use_rule==''){
            use_rule=0;
        }
        else{
            if(!testMoney.test(use_rule) || parseFloat(use_rule)==0){
                return Tip("优惠条件满多少元应该为大于0的数字，最多2位小数");
            }
        }
        var coupon_money = $(".coupon_money").val();
        if(!testMoney.test(coupon_money) || parseFloat(coupon_money)==0){
            return Tip("优惠金额应该为大于0的数字，最多2位小数");
        }
        var use_goods_group = $(".use_goods_group").attr("data-id");
        var use_goods = $(".use_goods").attr("data-id");

        var valid_way = $(".radio-list1").find(".radio-active").attr('data-id');
        var from_valid_date = $(".from_valid_date").val();
        var to_valid_date = $(".to_valid_date").val();
        if(parseInt(valid_way)==0){
            if(from_valid_date==''){
                return Tip("优惠券的有效期开始时间不能为空");
            }
            if(to_valid_date==''){
                return Tip("优惠券的有效期结束时间不能为空");
            }
            if(todate(to_valid_date)<=todate(currentdate)){
                return Tip("优惠券的有效期结束时间不能小于当前时间");
            }
            if(todate(to_valid_date)<todate(from_get_date)){
                return Tip("优惠券的有效期结束时间不能小于领取时间的开始时间");
            }
        }else{
                var last_day = $(".last_day").val();
                if(isNaN(last_day)||last_day==''||parseInt(last_day)==0){
                     return Tip("有效天数不为空且为正整数");
             }
        }
    }else{
        var from_get_date = $(".from_get_dates").val();
        var to_get_date = $(".to_get_dates").val();
        if (from_get_date==''){
            return Tip("领取时间的开始时间不能为空");
        }
        if(todate(to_get_date)<todate(currentdate)){
             return Tip("领取时间的开结束时间不能小于当前时间");
        }
        if(to_get_date==''){
             return Tip("领取时间的结束时间不能为空");
        }
        if(todate(from_get_date)>todate(to_get_date)){
            return Tip("领取时间的开始时间不能大于结束时间");
        }
        var get_rule = $('.get_rules').val();
        if(!testMoney.test(get_rule) || parseFloat(get_rule)<0.01){
            return Tip("领取条件应该为大于0的数字，最多2位小数");
        }
        var get_limit = $(".get_limits").val();
        if (get_limit=='') {
            get_limit=-1;
        }
        else{
            if(isNaN(get_limit) || get_limit.indexOf(".")!=-1||parseInt(get_limit)==0){
                return Tip("领取限制应该为正整数");
            }
        }
        var total_number = $(".total_numbers").val();
        if(isNaN(total_number) || total_number.indexOf(".")!=-1||total_number==''||parseInt(total_number)==0){
            return Tip("库存应该不为空且为正整数");
        }
        if (parseInt(get_limit)>parseInt(total_number)) {
            return Tip("领取限制数量不能大于库存量");
        }
        var use_rule = $(".use_rules").val();
        if(use_rule==''){
            use_rule=0;
        }
        else{
            if(!testMoney.test(use_rule) || parseFloat(use_rule)==0){
            return Tip("优惠条件满多少元应该为大于0的数字，最多2位小数");
        }
        }
        var coupon_money = $(".coupon_moneys").val();
        if(!testMoney.test(coupon_money) || parseFloat(coupon_money)==0){
            return Tip("优惠金额应该为大于0的数字，最多2位小数");
        }
        var use_goods_group = $(".use_goods_groups").attr("data-id");
        var use_goods = $(".use_goodss").attr("data-id");

        var valid_way = $(".radio-list2").find(".radio-active").attr('data-id');
        var from_valid_date = $(".from_valid_dates").val();
        var to_valid_date = $(".to_valid_dates").val();
        if(parseInt(valid_way)==0){
            if(from_valid_date==''){
                return Tip("优惠券的有效期开始时间不能为空");
            }
            if(to_valid_date==''){
                return Tip("优惠券的有效期结束时间不能为空");
            }
            if(todate(to_valid_date)<=todate(currentdate)){
                return Tip("优惠券的有效期结束时间不能小于当前时间");
            }
            if(todate(to_valid_date)<todate(from_get_date)){
                return Tip("优惠券的有效期结束时间不能小于领取时间的开始时间");
            }
        }else{
            var last_day = $(".last_days").val();
            if(isNaN(last_day)||last_day==''||parseInt(last_day)==0){
                return Tip("有效天数不为空且为正整数");
            }
        }
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
                    window.location.href="/admin/marketing?action=coupon&coupon_type="+type;
                    $(".ok-coupon").attr("data-flag","on");
                },1500);
            }else{
                Tip(res.error_text);
            }
        },
        function(){
            Tip('网络好像不给力呢~ ( >O< ) ~');
        });
}
function editCoupon(type,coupon_id,edit_status){
    var currentdate=getNowFormatDate();
    var testMoney = /^(([0-9]|([1-9][0-9]{0,9}))((\.[0-9]{1,2})?))$/;
    if(type==0 && edit_status==0){
        var from_get_date = $(".from_get_date").val();
        var to_get_date = $(".to_get_date").val();
        if (from_get_date==''){
            return Tip("领取时间的开始时间不能为空");
        }
        if(todate(to_get_date)<todate(currentdate)){
            return Tip("领取时间的结束时间不能小于当前时间");
        }
        if(to_get_date==''){
            return Tip("领取时间的结束时间不能为空");
        }
        if(todate(from_get_date)>todate(to_get_date)){
            return Tip("领取时间的开始时间不能大于结束时间");
        }
        var get_rule = 0;
        var get_limit = $(".get_limit").val();
        if (get_limit=='') {
            get_limit=1;
        }
        else{
            if(isNaN(get_limit) || get_limit.indexOf(".")!=-1||parseInt(get_limit)==0){
                return Tip("领取限制应该为正整数");
            }
        }
        var total_number = $(".total_number").val();
        if(isNaN(total_number) || total_number.indexOf(".")!=-1||total_number==''||parseInt(total_number)==0){
            return Tip("库存应该不为空且为正整数");
        }
        if (parseInt(get_limit)>parseInt(total_number)){
            return Tip("领取限制数量不能大于库存量");
        }
        var old_totalnumber=$(".total_number").attr("total-id");
        if(parseInt(total_number)<parseInt(old_totalnumber)){
            $('.total_number').val(old_totalnumber);
            return Tip("库存应该不小于原来的库存！");
        }
        var use_rule = $(".use_rule").val();
        if(use_rule==''){
            use_rule=0;
        }
        else{
            if(!testMoney.test(use_rule) || parseFloat(use_rule)==0){
            return Tip("优惠条件满多少元应该为大于0的数字，最多2位小数");
        }
        }
        var coupon_money = $(".coupon_money").val();
        if(!testMoney.test(coupon_money) || parseFloat(coupon_money)==0){
            return Tip("优惠金额应该为大于0的数字，最多2位小数");
        }
        var use_goods_group = $(".use_goods_group").attr("data-id");
        var use_goods = $(".use_goods").attr("data-id");

        var valid_way = $(".radio-list1").find(".radio-active").attr('data-id');
        var from_valid_date = $(".from_valid_date").val();
        var to_valid_date = $(".to_valid_date").val();
        if(parseInt(valid_way)==0){
            if(from_valid_date==''){
                return Tip("优惠券的有效期开始时间不能为空");
            }
            if(to_valid_date==''){
                return Tip("优惠券的有效期结束时间不能为空");
            }
            if(todate(to_valid_date)<=todate(currentdate)){
                return Tip("优惠券的有效期结束时间不能小于当前时间");
            }
            if(todate(to_valid_date)<todate(from_get_date)){
                return Tip("优惠券的有效期结束时间不能小于领取时间的开始时间");
            }
        }else{
            var last_day = $(".last_day").val();
            if(isNaN(last_day)||last_day==''||parseInt(last_day)==0){
                return Tip("有效天数不为空且为正整数");
            }
        }
    }
    else if(type==0&&edit_status==1){
        var from_get_date = $(".from_get_date").val();
        var to_get_date=$(".to_get_date").val();
        if(todate(to_get_date)<todate(currentdate)){
            return Tip("领取时间的结束时间不能小于当前时间");
        }
        if(to_get_date==''){
            return Tip("领取时间的结束时间不能为空");
        }
        if(todate(from_get_date)>todate(to_get_date)){
            return Tip("领取时间的开始时间不能大于结束时间");
        }
        var total_number = $(".total_number").val();
        if(isNaN(total_number) || total_number.indexOf(".")!=-1||total_number==''||parseInt(total_number==0)){
            return Tip("库存应该不为空且为正整数");
        }
        var old_totalnumber=$(".total_number").attr("total-id");
        if(parseInt(total_number)<parseInt(old_totalnumber)){
            $('.total_number').val(old_totalnumber);
            return Tip("库存应该不小于原来的库存！");
        }
        var get_rule = 0;
        var coupon_money = $(".coupon_money").val();
        var use_rule = $(".use_rule").val();
        var get_limit = $(".get_limit").val();
        if (parseInt(get_limit)>parseInt(total_number)) {
            return Tip("领取限制数量不能大于库存量");
        }
        var use_goods_group = $(".use_goods_group").attr("data-id");
        var use_goods = $(".use_goods").attr("data-id");
        var valid_way = $(".radio-list1").find(".radio-active").attr('data-id');
        var from_valid_date = $(".from_valid_date").val();
        var to_valid_date = $(".to_valid_date").val();
        var last_day = $(".last_day").val();
        }
        else if (type==1&&edit_status==0){
        var from_get_date = $(".from_get_dates").val();
        var to_get_date = $(".to_get_dates").val();
        if (from_get_date==''){
            return Tip("领取时间的开始时间不能为空");
        }
        if(todate(to_get_date)<todate(currentdate)){
            return Tip("领取时间的开结束时间不能小于当前时间");
        }
        if(to_get_date==''){
            return Tip("领取时间的结束时间不能为空");
        }
        if(todate(from_get_date)>todate(to_get_date)){
            return Tip("领取时间的开始时间不能大于结束时间");
        }
        var get_rule = $('.get_rules').val();
        if(!testMoney.test(get_rule) || parseFloat(get_rule)<0.01){
            return Tip("领取条件应该为大于0的数字，最多2位小数");
        }
        var get_limit = $(".get_limits").val();
        if (get_limit=='') {
            get_limit=-1;
        }
        else{
            if(isNaN(get_limit) || get_limit.indexOf(".")!=-1||parseInt(get_limit==0)){
                return Tip("领取限制应该为正整数");
            }
        }
        var total_number = $(".total_numbers").val();
        if(isNaN(total_number) || total_number.indexOf(".")!=-1||total_number==''||parseInt(total_number)==0){
            return Tip("库存应该不为空且为正整数");
        }
        if (parseInt(get_limit)>parseInt(total_number) ){
            return Tip("领取限制数量不能大于库存量");
        }
        var old_totalnumber=$(".total_numbers").attr("total-id");
        if(parseInt(total_number)<parseInt(old_totalnumber)){
            $('.total_number').val(old_totalnumber);
            return Tip("库存应该不小于原来的库存！");
        }
        var use_rule = $(".use_rules").val();
        if(use_rule==''){
            use_rule=0;
        }
        else{
            if(!testMoney.test(use_rule) || parseFloat(use_rule)==0){
                return Tip("优惠条件满多少元应该为大于0的数字，最多2位小数");
            }
        }
        var coupon_money = $(".coupon_moneys").val();
        if(!testMoney.test(coupon_money) || parseFloat(coupon_money)==0){
            return Tip("优惠金额应该为大于0的数字，最多2位小数");
        }
        var use_goods_group = $(".use_goods_groups").attr("data-id");
        var use_goods = $(".use_goodss").attr("data-id");

        var valid_way = $(".radio-list2").find(".radio-active").attr('data-id');
        var from_valid_date = $(".from_valid_dates").val();
        var to_valid_date = $(".to_valid_dates").val();
        if(parseInt(valid_way)==0){
            if(from_valid_date==''){
                return Tip("优惠券的有效期开始时间不能为空");
            }
            if(to_valid_date==''){
                return Tip("优惠券的有效期结束时间不能为空");
            }
            if(todate(to_valid_date)<=todate(currentdate)){
                return Tip("优惠券的有效期结束时间不能小于当前时间");
            }
            if(todate(to_valid_date)<todate(from_get_date)){
                return Tip("优惠券的有效期结束时间不能小于领取时间的开始时间");
            }
        }else{
            var last_day = $(".last_days").val();
            if(isNaN(last_day)||last_day==''||parseInt(last_day==0)){
                return Tip("有效天数不为空且为正整数");
            }
        }
    }
    else if(type==1&&edit_status==1){
        var from_get_date = $(".from_get_dates").val();
        var to_get_date=$(".to_get_dates").val();
        if(todate(to_get_date)<todate(currentdate)){
            return Tip("领取时间的结束时间不能小于当前时间");
        }
        if(to_get_date==''){
            return Tip("领取时间的结束时间不能为空");
        }
        if(todate(from_get_date)>todate(to_get_date)){
            return Tip("领取时间的开始时间不能大于结束时间");
        }
        var total_number = $(".total_numbers").val();
        if(isNaN(total_number) || total_number.indexOf(".")!=-1||total_number==''||parseInt(total_number)==0){
            return Tip("库存应该不为空且为正整数");
        }
        var old_totalnumber=$(".total_numbers").attr("total-id");
        if(parseInt(total_number)<parseInt(old_totalnumber)){
            $('.total_numbers').text(old_totalnumber);
            return Tip("库存应该不小于原来的库存！");
        }
        var get_rule = $(".get_rules").val();
        var coupon_money = $(".coupon_moneys").val();
        var use_rule = $(".use_rules").val();
        var get_limit = $(".get_limits").val();
        if (parseInt(get_limit)>parseInt(total_number) ){
            return Tip("领取限制数量不能大于库存量");
        }
        var use_goods_group = $(".use_goods_groups").attr("data-id");
        var use_goods = $(".use_goodss").attr("data-id");
        var valid_way = $(".radio-list2").find(".radio-active").attr('data-id');
        var from_valid_date = $(".from_valid_dates").val();
        var to_valid_date = $(".to_valid_dates").val();
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
                Tip('编辑优惠券成功!');
                setTimeout(function(){
                    window.location.href="/admin/marketing?action=coupon&coupon_type="+res.coupon_type;
                    $(".ok-editcoupon").attr("data-config","on");
                },1500);
            }else{
                Tip(res.error_text);
            }
        },
        function(){
            Tip('网络好像不给力呢~ ( >O< ) ~');
        });
}

function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = year + seperator1 + month + seperator1 + strDate
            + " " + date.getHours() + seperator2 + date.getMinutes()
            + seperator2 + date.getSeconds();
    return currentdate;
}

function todate(str_time){
    //格式2014-03-11 12:00
    var dateArr = str_time.substring(0,10).split('-');
    var timeArr = str_time.substring(11,16).split(':');
    return new Date(parseInt(dateArr[0]),parseInt(dateArr[1]) - 1,parseInt(dateArr[2]),parseInt(timeArr[0]),parseInt(timeArr[1]));
}

function  jumppage(page){
    var coupon_id=$(this).getUrlParam("coupon_id");
    var coupon_type=$(this).getUrlParam("coupon-type");
    var select_rule=$(".use_goods_group").attr(data-id);
    var url='';
    var args={
   action:"details",coupon_type:coupon_type,coupon_id:coupon_id,page:page,select_rule:select_rule
    }
    $.postJson(url,args,function(res){
        if(res.success){

        }
        else{
            Tip(res.error_text);
        }
    },function(){ Tip('网络好像不给力呢~ ( >O< ) ~');});
}