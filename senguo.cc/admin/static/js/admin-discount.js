var goods_number=1;
var goods_list=null;
var index1=0;
var new_discount_item;
var current_tab=0;// 标记当前选中的tab标签
$(document).ready(function () {
    $('.switch-btn-c').each(function () {
        var $this = $(this);
        var status = $this.data('status');
        if (status == 1) {
            $this.addClass('bg-green').text('启用');
        }
        else {
            $this.addClass('bg-pink').text('停用');
        }
    });
    goods_list=eval($("#goods").val());
    charge_list=eval($("#charge").val());
    new_discount_item=$('.to_clone').clone().removeClass("to_clone");
}).on('click', '.close_all', function(){
    var status = parseInt($(this).attr('data-status'));
    var tip_info='';
    if (status==1){
        tip_info="开启限时折扣即可使用限时折扣功能，你确定要开启限时折扣吗？";
    }
    else{
        tip_info="限时折扣一旦关闭将不能重新开启,你确定要关闭所有限时折扣吗？";
    }
    if(confirm(tip_info)){
            var $this = $(this);
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
                    if(res.discount_active_cm==1){
                        $("#discount_hidden").removeClass("hidden");
                    }
                    else{
                         $("#discount_hidden").addClass("hidden");
                    }
                    $this.attr("data-flag", "on");
                    if (res.discount_active_cm==0) {
                        $this.attr({'data-status': 0}).addClass('stop-mode').removeClass("work-mode");
                        $('.tit').text('已停用')
                        $(".discount-show-txt").children("span").html('停用');
                    }
                    else{
                        $this.attr({'data-status': 1}).addClass('work-mode').removeClass("stop-mode");
                        $(".discount-show-txt").children("span").html('启用');
                        $('.tit').text('已启用')
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
}).on('click', '.vv', function(e){
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
}).on('click','.open-week',function(){
    if($(this).hasClass('forbidden-btn')){
        return false;
    }
    $('.open-single').removeClass("radio-active");
    $('.single-day').addClass("hidden");
    $(this).addClass("radio-active");
    $('.week-time').removeClass('hidden');
    $('.week').removeClass('hidden');
    $('.discount-tip').removeClass('hidden');
}).on('click','.open-single',function(){
    if($(this).hasClass('forbidden-btn')){
        return false;
    }
    $(this).addClass("radio-active");
    $('.single-day').removeClass("hidden");
    $('.open-week').removeClass("radio-active");
    $('.week-time').addClass('hidden');
    $('.week').addClass('hidden');
    $('.discount-tip').addClass("hidden");
}).on("click",".use_goods_group_lst .item",function(){
    var id = parseInt($(this).attr("data-id"));
    var index = $(this).closest("li").index();
    index1=index;
    getGoods(index,$(this).closest('td').find(".use_goods_lst"));
    $(this).closest('div').find(".use_goods_group").html($(this).html()).attr("data-id",id);
    $(this).closest('div').find(".use_goods").html("所有商品").attr("data-id","-1");
}).on("click",".use_goods_lst .item",function(){
    var id = parseInt($(this).attr("data-id"));
    $(this).closest('div').find(".use_goods").html($(this).html()).attr("data-id",id);
     if (id!=-1){
        $(this).closest('table').find(".charge-type").removeClass("hidden");
    }
    else $(this).closest('table').find(".charge-type").addClass("hidden");
    var index2 = $(this).closest("li").index();
    getCharge(index1,index2,$(this).closest('table').find(".charge_list"));
}).on('click','.charge_list button',function(){
    if($(this).hasClass("back_green")){
        $(this).removeClass("back_green");
    }
    else $(this).addClass("back_green");
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
}).on('click','.discount-new',function(){
    goods_number+=1
    var new_discount_item_tmp=new_discount_item.clone();
    new_discount_item_tmp.find('.should_remove').addClass('hidden');
    new_discount_item_tmp.find('.goods_number').text(goods_number).attr("goods-id",goods_number);
    new_discount_item_tmp.find('.discount_delete').removeClass("hidden");
    $('.discount_item').append(new_discount_item_tmp);
    $(this).addClass("hidden");
    if(goods_number==2){
        $(this).closest('td').find('.discount_delete').removeClass('hidden');
    }
}).on('click','.discount_delete',function(){
    if(goods_number==1){
        return Tip("删除失败，折扣商品数量不能为空！");
    }
    if(confirm("你确定要删该条限时折扣记录吗？")){
    var now_number=parseInt($(this).closest("tbody").find(".goods_number").attr("goods-id"))+1;
    var $this=$(this).closest('tbody').next();
    var $prev=$(this).closest('tbody').prev();
    $(this).closest('tbody').remove();
    for (;now_number<=goods_number;now_number++){
        $this.find(".goods_number").attr('goods-id',now_number-1);
        $this.find(".goods_number").text(now_number-1);
        $this=$this.next();
    }
    }
    if (now_number-1==goods_number){
        $prev.find('.discount-new').removeClass('hidden');
    }
    goods_number-=1;
}).on('click','.pre-page',function(){
    var pagenow=parseInt($('.page-now').text());
    var selected_status=$(".use_goods_group").attr("data-id");
    if (pagenow==1){
        Tip("当前已经是第一页，不能再向前翻页");
    }
    else {
        $(".page-now").text(pagenow-1);
        // insertcoupon(selected_status,pagenow-1);
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
        // insertcoupon(select_rule,pagenow+1);
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
        // insertcoupon(select_rule,inputpage);
    }
}).on('click','.ok-discount',function(){
    if($(this).attr('data-flag')=='off'){
        return;
    }
    adddiscount();
}).on('click','.cancel-new-discount',function(){
    if(confirm("你正在新建限时折扣，确定退出当前页面并放弃新建吗？")){
        window.location.href="/admin/discount?action=discount";
    }
}).on('click','.change-week a',function(){
    if($(this).hasClass("forbidden-btn")){
        return false;
    }
   if($(this).hasClass("back_green")){
    $(this).removeClass("back_green");
   }
   else{
    $(this).addClass("back_green").removeClass("back_gray1");
   }
}).on('click','.f-discount-hour-items li .item',function(){
    $('.f-hour').text($(this).text()).attr("data-id",$(this).text());
}).on('click','.f-discount-minute-items li .item',function(){
    $('.f-minute').text($(this).text()).attr("data-id",$(this).text());
}).on('click','.f-discount-second-items li .item',function(){
    $('.f-second').text($(this).text()).attr("data-id",$(this).text());
}).on('click','.t-discount-hour-items li .item',function(){
    $('.t-hour').text($(this).text()).attr("data-id",$(this).text());
}).on('click','.t-discount-minute-items li .item',function(){
    $('.t-minute').text($(this).text()).attr("data-id",$(this).text());
}).on('click','.t-discount-second-items li .item',function(){
    $('.t-second').text($(this).text()).attr("data-id",$(this).text());
}).on("click",".detail-tr",function(e){//点击看详情
    if($(e.target).closest(".sw-er-tip").size()>0){
         return false;
    }
    var id = $(this).attr("data-id");
    var status=parseInt($('.furit-type-discount').find('.active').attr('data-id'));
    current_tab=status;
    window.location.href="/admin/discount?action=details&discount_id="+id+"&page=1"+"&status="+status;
}).on('click','.go-back',function(){
    window.history.back();
}).on('click','.ok-edit',function(){
    if($(this).attr('data-flag')=='off'){
        return false;
    }
    editdiscount(); 
}).on('click','.cancel-edit',function(){
    if(confirm("你还没有保存所做修改，确定放弃修改并返回到限时折扣主页面吗？")){
        // 放弃修改
        window.location.href="/admin/discount?action=discount";
    }
}).on('click','.discount_close',function(){
    if (parseInt($(this).attr("data-id"))==3){
        return false;
    }
    if(confirm("一旦停用将不能重新开启，你确定要停用该条限时折扣吗？")){
        // 停用该条记录
        var $this=$(this).closest('tbody');
        $this.find('.use_goods_group').closest("button").addClass("disabled");
        $this.find('.use_goods').closest("button").addClass("disabled");
        $this.find('.discount_rate').attr("disabled","disabled").addClass("disabled");
        $this.find('.charge_list button').addClass("disabled");
        $(this).attr("data-id",3).addClass("text_gray").text("已停用");
    }
});

function getinfo(){
    var currentdate=getNowFormatDate();
    var discount_way=parseInt($('.radio-active').attr('data-id'));
    var start_date='';
    var end_date='';
    var f_time=0;
    var t_time=0;
    var weeks=[];
    if (discount_way==0){
        start_date = $(".start_date").val();
        end_date = $(".end_date").val();
        if (start_date==''){
            return Tip("开始时间不能为空");
        }
        /*if(todate(from_get_date)<todate(currentdate)){
             return Tip("领取时间的开始时间不能小于当前时间");
        }*/
        if(todate(end_date)<todate(currentdate)){
            return Tip("结束时间不能小于当前时间");
        }
        if(end_date==''){
            return Tip("结束时间不能为空");
        }
        if(todate(start_date)>todate(end_date)){
            return Tip("开始时间不能大于结束时间");
        }
    }
    else{
        var f_hour = parseInt($(".f-hour").text());
        var f_minute = parseInt($(".f-minute").text());
        var f_second = parseInt($(".f-second").text());
        var t_hour = parseInt($(".t-hour").text());
        var t_minute = parseInt($(".t-minute").text());
        var t_second = parseInt($(".t-second").text());
        if (f_hour>t_hour){
            return Tip("开始时间不能大于结束时间");
        }
        if (f_minute>t_minute){
            return Tip("开始时间不能大于结束时间");
        }
        if (f_second>t_second){
            return Tip("开始时间不能大于结束时间");
        }
        f_time=f_hour*3600+f_minute*60+f_second;
        t_time=t_hour*3600+t_minute*60+t_second;
        var selected=$('.change-week a.back_green');
        for (var i = 0; i <selected.length; i++){
            weeks[i]=parseInt($(selected[i]).attr("week-id"));
        }
        if(weeks.length==0){
            return Tip("开始周期至少选择一天");
        }
    }
    var discount_items=$('.discount_item .new_tbody');
    var discount_goods=[]
    var discount_close=[]
    for (var i = 1; i <=goods_number ; i++) {
         var use_goods_group=parseInt($(discount_items[i-1]).find('.use_goods_group').attr("data-id"));
         var use_goods=parseInt($(discount_items[i-1]).find('.use_goods').attr("data-id"));
        
         discount_close[i-1]=parseInt($(discount_items[i-1]).find('.discount_close').attr('data-id'));
         var charges=[];
         if(use_goods!=-1){
            var selected=$(discount_items[i-1]).find('.charge_list button.back_green');
            for (var j = 0; j <selected.length; j++){
                charges[j]=parseInt($(selected[j]).attr("charge_id"));
             }
         }
         if (charges.length==0 && use_goods!=-1){
            return Tip("商品"+i+"的原价至少选择一种");
         }
         var discount_rate=$(discount_items[i-1]).find('.discount_rate').val();
         if(isNaN(discount_rate) ||discount_rate==''||parseInt(discount_rate)==0){
            return Tip("商品"+i+"的折扣应该不为空且为数字");
            }
        if(parseInt(discount_rate)<=0||parseInt(discount_rate)>=10){
            return Tip("商品"+i+"的折扣应该介于０－１０之间");
            }
        discount_good={"use_goods_group":use_goods_group,"use_goods":use_goods,"charges":charges,"discount_rate":discount_rate};
        discount_goods[i-1]=discount_good;
        }
    discount_id=parseInt($("#goods").attr("discount_id"));
    data={
        "discount_way":discount_way,
        "start_date":start_date,
        "end_date":end_date,
        "f_time":f_time,
        "t_time":t_time,
        "weeks":weeks,
        "discount_goods":discount_goods,
        "discount_id":discount_id,
        "discount_close":discount_close
    }
    return data
}
function adddiscount(){
    var data=getinfo();
    if(data==undefined){
        return false;
    }
   if(confirm("你确定添加该批限时折扣吗？")){
    var action="newdiscount";
    var args={action:action,data:data};
    var url='';
    $(this).attr('data-flag',"off");//给点击时间上锁，防止多次点击
    $.postJson(url,args,
        function(res){
            if(res.success){
                Tip('新建限时折扣成功!');
                setTimeout(function(){
                    window.location.href="/admin/discount?action=discount";
                },1500);
            }else{
                Tip(res.error_text);
            }
        },
        function(){
            Tip('网络好像不给力呢~ ( >O< ) ~');
        });
    }
}

function editdiscount(){
    var data=getinfo();
    if(data==undefined){
        return false;
    }
   if(confirm("你确定添加该批限时折扣吗？")){
    var action="editdiscount";
    var args={action:action,data:data};
    var url='';
    $(this).attr('data-flag',"off");//给点击时间上锁，防止多次点击
    $.postJson(url,args,
        function(res){
            if(res.success){
                Tip('编辑限时折扣成功!');
                setTimeout(function(){
                    window.location.href="/admin/discount?action=discount";
                },1500);
            }else{
                Tip(res.error_text);
            }
        },
        function(){
            Tip('网络好像不给力呢~ ( >O< ) ~');
        });
   }
}

function todate(str_time){
    //格式2014-03-11 12:00
    var dateArr = str_time.substring(0,10).split('-');
    var timeArr = str_time.substring(11,16).split(':');
    return new Date(parseInt(dateArr[0]),parseInt(dateArr[1]) - 1,parseInt(dateArr[2]),parseInt(timeArr[0]),parseInt(timeArr[1]));
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
function getGoods(index,$obj){
    $obj.empty();
    var goods = goods_list[index];
    var lis = '';
    for(var i=0; i<goods.length; i++){
        lis+='<li class="presentation" role="presentation"><a class="item" title="'+goods[i].goods_name+'" href="javascript:;" data-id="'+goods[i].goods_id+'">'+goods[i].goods_name+'</a></li>';
    }
    $obj.append(lis);
}
function getCharge(index1,index2,$obj){
    $obj.empty();
    var charges=charge_list[index1][index2];
    var lis='';
    for(var i=0; i<charges.length; i++){
        lis+=' <button class=" charge-btn mt6 mr10" charge_id='+charges[i].charge_id+'>'+charges[i].charge+'</button>';
    }
    $obj.append(lis);
}