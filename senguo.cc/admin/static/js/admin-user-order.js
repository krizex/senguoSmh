$(document).ready(function(){
    //订单数据
    getOrder();
    orderItem(0);
    //隐藏信息显示
    toggle('.order-content','.list-item-body');
    toggle('.list-title','.list-item-body');
    $('.sales-list-item').css({'border-color':'#29aae1'});
    var status=parseInt($('.order-status').find('.active').attr('data-id'));
    if(status == 1){
        $('.func-btn').show().attr('id','batch-send').text('批量开始配送');
    }
    else if(status == 2){
        $('.func-btn').show().attr('id','batch-finish').text('批量完成订单');
    }
    initBmap();
}).on('click','.print-order',function(){
    orderPrint($(this),'print'); //有线打印

}).on('click','.delete-order',function(){
    var $this=$(this);
    var parent=$this.parents('.list-item');
    var id=parent.data('id');
    var index=parent.index();
    var $box=$('.order_set_box');
    $box.modal('show').attr({'data-id':id,'data-target':index}).find('.modal-sure-btn').addClass('delete_check').removeClass('price_check mark_check');
    $box.find('.title').text('订单删除');
    $('#order_ser_val').val('').attr({'placeholder':'为防止误删除操作，请输入订单删除原因'});
}).on('click','.delete_check',function(){
    var $this=$(this);
    orderDelete();
}).on('click','.to-unstart',function(){
        var $this=$(this);
        orderEdit($this,'edit_status',1);
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
}).on('click','.send_person_list li',function(){
    var $this=$(this);
    var val=$this.data('id');
    if(confirm('是否选择该员工进行配送？')){
        orderEdit($this,'edit_SH2',val);
    }//员工修改
}).on('click','.order_mark',function(){
    var $this=$(this);
    var parent=$this.parents('.list-item');
    var id=parent.data('id');
    var index=parent.index();
    var $box=$('.order_set_box');
    $box.modal('show').attr({'data-id':id,'data-target':index}).find('.modal-sure-btn').addClass('mark_check').removeClass('price_check delete_check');
    $box.find('.title').text('订单备注');
    $('#order_ser_val').val('').attr({'placeholder':'请输入订单备注'});
}).on('click','.mark_check',function(){
    var $this=$(this);
    var val=$('#order_ser_val').val();
    orderEdit($this,'edit_remark',val);
}).on('click','.price_edit',function(){
    var $this=$(this);
    var parent=$this.parents('.list-item');
    var id=parent.data('id');
    var index=parent.index();
    var $box=$('.order_set_box');
    $box.modal('show').attr({'data-id':id,'data-target':index}).find('.modal-sure-btn').addClass('price_check').removeClass('mark_check delete_check');
    $box.find('.title').text('修改订单总价');
    $('#order_ser_val').val('').attr({'placeholder':'请输入要修改成的价格（总价）'});
}).on('click','.price_check',function(){
    var $this=$(this);
    var val=$('#order_ser_val').val();
    orderEdit($this,'edit_totalPrice',val);
}).on('click','#all-check',function(){
    var $this=$(this);
    $this.toggleClass('checked');
    $('.order-check').toggleClass('checked').toggleClass('order-checked');
}).on('click','.order-check',function(){
    var $this=$(this);
    $this.toggleClass('checked').toggleClass('order-checked');
}).on('click','#batch-send',function(){
    var $this=$(this);
    if(confirm('提示：批量配送订单将全部分配给默认配送员，您可以在批量配送后再到“配送中”的订单中单独指定配送员。\n是否批量开始配送该订单？')){
        orderEdit($this,'batch_edit_status',4);
    }
}).on('click','#batch-finish',function(){
//    var $this=$(this);
//    if(confirm('是否批量完成订单？')){
//    orderEdit($this,'batch_edit_status',5); 
//    }
}).on('click','#batch-print',function(){
    var type=parseInt($("#receipt-type").val());
    orderPrint($(this),'batch_print'); //有线打印
}).on('click','.subnav li',function(){
    var $this=$(this);
    $this.addClass('active').siblings('li').removeClass('active');
    var status=parseInt($this.attr('data-id'));
     if(status == 1){
        $('.func-btn').show().attr('id','batch-send').text('批量开始配送');
    }
    else if(status == 2){
  //      $('.func-btn').show().attr('id','batch-finish').text('批量完成订单');
	$('.func-btn').hide();
    }
    else{
        $('.func-btn').hide();
    }
    _page=0;
    orderItem(0);
    $('#all-check').removeClass('checked');
}).on('click','.pre-page',function(){
     var $this=$(this);
     if(_page>0){
        _page--;
        orderItem(_page);
        $('.page-now').text(_page+1);
        $('.next-page').show();
     }
    if(_page===0) {
        $('.pre-page').hide();
    }
}).on('click','.next-page',function(){
    var $this=$(this);
    if(_page<_page_total){
        _page++;
        orderItem(_page);
        $('.page-now').text(_page+1);
        $('.pre-page').show();
    }    
    if(_page_total-1== _page){
        $('.next-page').hide();
    }
}).on('click','.jump-to',function(){
    var $this=$(this);
    var num=Int($('.input-page').val());
    if(!num){
        return Tip('请输入页码');
    }
    if(0<num&&num<=_page_total)
    {
        orderItem(num-1);
        _page=num-1;
        $('.page-now').text(_page+1);
    }else if(num>_page_total){
        return Tip('没有该页的数据');
    }
}).on('click','.condition-list li',function(){
    $(this).closest("ul").prev("button").children("em").html($(this).text()).attr("data-id",$(this).find('a').attr("data-id"));
    orderItem(_page);
}).on("click","#add_self",function(){//添加自提点
    if(edit_flag) return Tip("请先保存正在编辑的自提点");
    var index = $(".self-address-list").children("li").size();
    if(index==10) return Tip("最多只能新建10个自提点");
    edit_flag = true;
    var $item = $('<li class="group"><div class="wrap-operate pull-right">'+
        '<a href="javascript:;" class="pull-right set-default">设为默认</a>'+
        '<a href="javascript:;" class="delete pull-right set-inl-blo"></a>'+
        '<a href="javascript:;" class="edit pull-right set-inl-blo to-edit"></a></div>'+
        '<a href="javascript:;" class="switch-abtn switch-abtn-active">'+
        '<span class="a_on">已</span><span class="a_off">未</span>启用</a> <a href="javascript:;" class="cur_loc"></a> <span class="text-grey3  address-text">'+
        '<span>自提点<span class="self-index">'+num_arr[index]+'</span> : <span class="self-addr">点击右方修改设置</span></span>' +
        '<span class="default-address dgreen hidden">（默认自提点）</span></span></li>');
    $(".self-address-list").append($item);
    $("#addressDetail").removeAttr("disabled").val("").focus();
    $("#save-lbs").attr("data-type","add");
    cur_address = $item;
}).on("click",".switch-abtn",function(){
    operateSelf("set",$(this).closest("li"));
}).on("click",".wrap-operate .set-default",function(){
    operateSelf("default",$(this).closest("li"));
}).on("click",".reProvince",function(){
    return Tip("自提点只能在店铺所在的省");
}).on("click",".reCity",function(){
    return Tip("自提点只能在店铺所在的城市");
}).on("mouseover",".self-address-list li",function(){
    $(".self-address-list").find(".wrap-operate").addClass("hide");
    $(this).find(".wrap-operate").removeClass("hide");
}).on("mouseout",".self-address-list",function(){
    $(".self-address-list").find(".wrap-operate").addClass("hide");
});

var cur_address = null,edit_flag=false,is_drag = false;
var num_arr = ["一","二","三","四","五","六","七","八","九","十"];
var orders=window.dataObj.order;
var $list_item;
var $goods_item;
var $staff_item;
var order_link='/admin/order';
var _page=0;
var _page_total;
function getOrder(){
    $.getItem('/static/items/admin/order-item.html?v=20150713',function(data){
            $list_item=data;
            //商品列表item
    	    getGoodsItem('/static/items/admin/order-goods-item.html?v=20150613');
    	    //员工列表item
    	    getStaffItem('/static/items/admin/order-staff-item.html?v=20150613');
        }
    );
}
var getGoodsItem=function(url){
    $.ajaxSetup({'async':false});
    $.getItem(url,function(data){
            $goods_item=data;
        }
    );
}
var getStaffItem=function(url){
    $.ajaxSetup({'async':false});
    $.getItem(url,function(data){
            $staff_item=data;
        }
    );
}
function orderItem(page){
    var order_type = parseInt($.getUrlParam('order_type'));
    $(".wrap-loading-box").removeClass("hidden");
    var action=$.getUrlParam('action');
    var url;
    var filter_status = $(".filter").attr("data-id");
    var pay_type = $(".pay_type").attr("data-id");
    var user_type = $(".user_type").attr("data-id");
    if(action=='order'){
        url=window.location.href+'&filter='+filter_status+'&pay_type='+pay_type+'&user_type='+user_type+'&page='+page;
    }else if(action=='customer_order'){
        url=window.location.href+'&filter='+filter_status+'&pay_type='+pay_type+'&user_type='+user_type+'&page='+page;
    }else if(action=='SH2_order'){
        url=window.location.href+'&filter='+filter_status+'&pay_type='+pay_type+'&user_type='+user_type+'&page='+page;
    }else{
        var link=window.location.href;
        var status=$('.order-status').find('.active').first().attr('data-id');
        if(parseInt($.getUrlParam("order_type"))==3){
            var self_id = $("#self_point").attr("data-id");
            url=link+'&order_status='+status+'&filter='+filter_status+'&pay_type='+pay_type+'&user_type='+user_type+'&page='+page+'&self_id='+self_id;
        }else{
            url=link+'&order_status='+status+'&filter='+filter_status+'&pay_type='+pay_type+'&user_type='+user_type+'&page='+page;
        }
    }
    $.ajax({
        url:url,
        type:"get",
        success:function(res){
            if(res.success){
                $('.order-list-content').empty();
                var data=res.data;
                $('.page-total').text(parseInt(res.page_sum));
                _page_total=parseInt(res.page_sum);
                if(res.count){
                    var _count=res.count;
                    var type=parseInt($.getUrlParam("order_type"));
                    $('.order-status li').each(function(){
                        var $this=$(this);
                        var index=$this.index()+1;
                        var i=parseInt(type.toString()+index.toString());
                        $this.find('.num').text(_count[i]);
                    });
                    $('#atonce').text(_count[11]);
                    $('#ontime').text(_count[21]);
                    $("#selfPoint").text(_count[31]);
                }
                 if(_page_total <=1){
                    $('.list-pagination').hide();
                }
                else {
                    $('.list-pagination').show();
                    if(_page===0) {
                        $('.pre-page').hide();
                    }
                    else{
                        $('.pre-page').show();
                    }
                    if(_page_total-1== _page){
                        $('.next-page').hide();
                    }
                    else{
                        $('.next-page').show();
                        
                    }
                    $('.page-now').text(_page+1);
                }
                if(data.length==0){
                    $('.order-list-content').append('<h4 class="text-center mt40">当前分类暂无订单信息</h3>');
                    $(".wrap-loading-box").addClass("hidden");
                    return false;
                }
                for(var i=0;i<data.length;i++){
                    var $item=$($list_item);
                    var SH2=data[i]['SH2'];
                    var SH2s=data[i]['SH2s'];
                    var active=data[i]['active'];
                    var address_text=data[i]['address_text'];
                    var create_date=data[i]['create_date'];
                    var freight=data[i]['freight'];
                    var fruits=data[i]['fruits'];
                    var id=data[i]['id'];
                    var isprint=data[i]['isprint'];
                    var message=data[i]['message'];
                    var money_paid=data[i]['money_paid'];
                    var num=data[i]['num'];
                    var pay_type=data[i]['pay_type'];      
                    var mgoods=data[i]['mgoods']; 
                    var phone=data[i]['phone'];
                    var receiver=data[i]['receiver'];  
                    var remark=data[i]['remark'];
                    var send_time=data[i]['send_time'];
                    var staff_remark=data[i]['staff_remark'];
                    var status=data[i]['status'];
                    var tip=data[i]['tip'];
                    var today=data[i]['today'];
                    var totalPrice=data[i]['totalPrice'];
                    var type=data[i]['type'];
                    var shop_new=data[i]['shop_new'];
                    var del_reason=data[i]['del_reason'];
                    var nickname=data[i]['nickname'];
                    var customer_id=data[i]['customer_id'];
                    var _type=data[i]['type'];
                    if(_type==3){
                        $item.find(".if_self").text("自提");
                    }
                    if(!message) {
                        $item.find('.order-message').hide();
                    }
                    if(!staff_remark) {
                        $item.find('.staff-replay').hide();
                    }
                    if(!remark||remark==null) {
                        $item.find('.saler-remark').hide();
                    }
                    if(isprint==1||isprint==true) {
                        $item.find('.print-order').addClass('text-grey9');
                    }
                    if(shop_new!=1) {
                        $item.find('.new').show();
                    }
                    $item.find('.name').text(nickname).attr('href','/admin/follower?action=filter&&order_by=time&&page=0&&wd='+customer_id);
                    $item.find('.receiver').text(receiver);
                    $item.attr({'data-id':id,'data-type':type});
                    $item.find('.send-time').text(send_time);
                    $item.find('.order-code').text(num);
                    $item.find('.order-price').text(totalPrice);
                    $item.find('.goods-total-charge').text(totalPrice);
                    $item.find('.total_price_input').text(totalPrice);
                    $item.find('.address_show').text(address_text);
                    $item.find('.phone').text(phone);
                    $item.find('.message-content').text(message);
                    $item.find('.staff-remark').text(staff_remark);
                    $item.find('.order_remark').text(remark);
                    $item.find('.order-status').attr({'data-id':status});
                    $item.find('.order-time').text(create_date);
                    $item.find('.saler-remark').val(remark);
                    //立即送小费显示/隐藏
                    if(type==1){
                        $item.find('.tip').text(tip);
                    }
                    else {
                        $item.find('.tips').hide();
                    }
                    //根据支付方式显示/隐藏
                    if(pay_type==2){ 
                        $item.find('.pay-status').text('余额支付'); 
                        $item.find('.price_edit').hide();
                    } 
                    else if(pay_type == 3){
                        $item.find('.pay-status').text('在线支付'); 
                        $item.find('.price_edit').hide();
                        if(status!=-1){$item.find('.delete-order').hide();}
                    }
                    else { 
                        $item.find('.pay-status').text('货到付款'); 
                    }
                    //根据订单状态显示/隐藏
                    if(status==0) {
                        if(del_reason==null){
                            $item.find('.order-status').empty().text('该订单已被用户取消').css({'line-height':'50px','color':'#44b549'});
                        }
                        else if(del_reason=='timeout'){
                            $item.find('.order-status').empty().text('该订单15分钟未支付，已自动取消').css({'line-height':'50px','color':'#44b549'});
                        }
                        else{
                            $item.find('.order-status').empty().text('该订单已删除（原因：'+del_reason+'）').css({'line-height':'50px','color':'#44b549'});
                        }
                        $item.find('.unable_edit_order').show();
                        $item.find('.address-adapt').hide();
                    }
                    else if(status==-1) {
                        $item.find('.status_unpaid').removeClass('hidden');
                        $item.find('.able_edit_order').show();
                        $item.find('.address-adapt').hide();
                    }
                    else if(status==1) {
                        $item.find('.status_order').removeClass('hidden');
                        $item.find('.able_edit_order').show();
                        $item.find('.able_edit_sender').show();
                        $item.find('.status-send').show();
                    }
                    else if(status==4) {
                        $item.find('.status_send').removeClass('hidden');
                        $item.find('.able_edit_order').show();
                        $item.find('.able_edit_sender').show();
                        $item.find('.status-finish').show();
                    }
                    else if(status==5) {
                        $item.find('.status_finish').removeClass('hidden');
                        $item.find('.unable_edit_order').show();
                        $item.find('.unable_edit_sender').show();
                    }
                    else if(status==6) {
                        $item.find('.status_comment').removeClass('hidden');
                        $item.find('.status-comment').show();
                        $item.find('.unable_edit_order').show();
                        $item.find('.unable_edit_sender').show();
                    }
                    else if(status==7) {
                        $item.find('.status_comment').removeClass('hidden');
                        $item.find('.status-autocomment').show();
                        $item.find('.unable_edit_order').show();
                        $item.find('.unable_edit_sender').show();
                    }
                    //商品数据
                    var goods_num=0;
                    var g_num=0;
                    var m_num=0;
                    for(var key in fruits){
                        g_num++;
                        var $goods=$($goods_item);
                        $goods.find('.code').text(g_num);
                        $goods.find('.goods-name').text(fruits[key]['fruit_name']);
                        $goods.find('.goods-price').text(fruits[key]['charge']);
                        $goods.find('.goods-number').text(fruits[key]['num']);
                        $item.find('.goods-list').append($goods);
                        goods_num=goods_num+fruits[key]['num'];
                    }
                    for(var key in mgoods){
                        m_num++;
                        var $mgoods=$($goods_item);
                        var num=$item.find('.goods-list li').length;
                        $mgoods.find('.code').text(num+1);
                        $mgoods.find('.goods-name').text(mgoods[key]['mgoods_name']);
                        $mgoods.find('.goods-price').text(mgoods[key]['charge']);
                        $mgoods.find('.goods-number').text(mgoods[key]['num']);
                        $item.find('.goods-list').append($mgoods);
                        goods_num=goods_num+mgoods[key]['num'];
                    }
                    //送货员选择
                    var $current_sender=$item.find('.current_sender');
                    var $send_change=$item.find('.send_change');
                    var $sender=$send_change.find('.send_person');
                    var CurrentStaff=function(target,val){
                      target.attr({'data-id':val['id']});
                      target.find('.sender-code').text(val['id']);
                      target.find('.sender-name').text(val['nickname']);
                      target.find('.sender-phone').text(val['phone']);
                };
                if(SH2s.length>0){
                    if(!SH2){
                        CurrentStaff($sender,SH2s[0]);
                        CurrentStaff($current_sender,SH2s[0]);
                         for(var key in SH2s){
                            var $staff=$($staff_item);
                            CurrentStaff($staff,SH2s[key]);
                            $item.find('.send_person_list').append($staff);
                        }       
                    }else{
                        CurrentStaff($sender,SH2);
                        CurrentStaff($current_sender,SH2);
                        for(var key in SH2s){
                            var $staff=$($staff_item);
                            if(SH2s[key]['id']==SH2['id']) $staff.addClass('bg-blue');
                            CurrentStaff($staff,SH2s[key]);
                            $item.find('.send_person_list').append($staff);
                        }
                        }
                    }
                    //商品总件数
                    $item.find('.goods-total-number').text(goods_num);
                    $('.order-list-content').append($item);
                }
             $(".wrap-loading-box").addClass("hidden");
            }
            else {
                $(".wrap-loading-box").addClass("hidden");
                return Tip(res.error_text);
            }
        }
    })
    
}

function orderPrint(target,action){
    var url=order_link;
    var action=action;
    var data={};
    var html=document.createElement("div"); 
    var type=parseInt($("#receipt-type").val());
    var console_type=parseInt($("#console-type").val());
    console.log(console_type);
    if(action =='print'){
        var parent=target.parents('.order-list-item');
        var order_id=parent.attr('data-id');
        data.order_id=order_id;
        if(type==0){
            getData(target);
        }else{
            var _action;
            if(console_type==0){
                _action="ylyprint";
            }else if(console_type==1){
                _action="fyprint";
            }
            var _url="/admin/WirelessPrint";
            var _args={
                action:_action,
                data:{id:order_id}
            };
            $.postJson(_url,_args,function(res){
                if(res.success){

                }
            });
        }
    }else if(action =='batch_print'){
        var list=[];
        $('.order-checked').each(function(){
            var $this=$(this);
            var _target=$this.parents('.order-list-item').find('.print-order');
            var order_id=$this.parents('.order-list-item').attr('data-id');
            list.push(order_id);
            if(type==0){
                getData(_target);
            }
        });
        if(list.length==0){
            return Tip('您还未选择任何订单');
        }
        var _action;
        if(console_type==0){
             _action="ylyprint";
        }else if(console_type==1){
            _action="fyprint";
        }
        var _url="/admin/WirelessPrint";
        var _args={
            action:_action,
            data:{order_list_id:list}
        };
        $.postJson(_url,_args,function(res){
            if(res.success){
                
            }
        });
        data.order_list_id=list;
    }
        var args={
            action:action,
            data:data
        };
        $.postJson(url,args,function(res){
                if(res.success){
                    target.addClass('text-grey9');
                    if(type==0){
                        var inner=window.document.body.innerHTML;
                        window.document.body.innerHTML=html.innerHTML;
                        var img = $("#img");
                        var src=img.attr('src');
                        if(src!='None'&& src!=undefined){
                          img.on("load",function(){
                             window.print();
                             window.document.body.innerHTML=inner;
                            });  
                        }
                        else{
                           window.print();
                           window.document.body.innerHTML=inner; 
                        }
                    }   
                }
                else return Tip(res.error_text);
            },
            function(){return Tip('网络错误')}
        );
        function getData(target){
            var parent=target.parents('.order-list-item');
            var order_id=parent.data('id');
            var order_num=parent.find('.order-code').text();
            var shop_name=$('#shop_name').text();
            var order_time=parent.find('.order-time').text();
            var delivery_time=parent.find('.send-time').text();
            var receiver=parent.find('.receiver').text();
            var address=parent.find('.address').first().text();
            var phone=parent.find('.phone').first().text();
            //var remark=parent.find('.message-content').first().text();
            var paid=parent.find('.pay-status').text();
            var totalPrice=parent.find('.goods-total-charge').text();
            var goods=parent.find('.goods-list')[0].innerHTML;
            var print_remark=$('.shop-receipt-info').val();
            var print_img=$('.shop-receipt-info').attr('data-img');
            var print_img_active=$('.shop-receipt-info').attr('data-active');
            var saler_remark=parent.find('.order_remark').text(); 
            var user_remark=parent.find('.message-content').text();

            $.getItem('/static/items/admin/order-print-page.html?v=20150706',function(data){
                var $item=$(data);
                $item.find('.notes-head').text(shop_name);
                $item.find('.orderId').text(order_num);
                $item.find('.orderTime').text(order_time);
                $item.find('.deliveryTime').text(delivery_time);
                $item.find('.address').text(address);
                $item.find('.receiver').text(receiver);
                $item.find('.phone').text(phone);
                $item.find('.totalPrice').text(totalPrice);
                $item.find('.goods-list')[0].innerHTML=goods;
                if(saler_remark) {$item.find('.saler-remark').show().find('.remark').text(saler_remark);}
                if(saler_remark=='null'){$item.find('.saler-remark').hide()}
                if(user_remark!='') {$item.find('.user-remark').show().find('.remark').text(user_remark);}
                if(user_remark=='null'){$item.find('.user-remark').hide()}
                if(print_remark) {$item.find('.extra-info-box').show().find('.print-remark').text(print_remark); }
                if(print_img_active == 1){
                     if(!print_img||print_img=='None') {
                        $item.find('.shop-img').remove();
                    }
                    else {
                        $item.find('#img').attr('src',print_img);
                    }
                }
                else{
                    $item.find('.shop-img').remove(); 
                }
               $item.find('.moneyPaid').text(paid);
               html.innerHTML+=$item[0].innerHTML;
        });
    }
}

function orderDelete(target){
    var url=order_link;
    var action='del_order';
    var $box=$('.order_set_box');
    var order_id=$box.attr('data-id');
    var index=$box.attr('data-target');
    var del_reason=$('#order_ser_val').val();
    if(!del_reason){
        return Tip('请输入订单删除的原因');
    }
    if(del_reason.length>300){
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
                $('.order_set_box').modal('hide');
                $('.order-list-item').eq(index).find('.order-status').empty().text('该订单已删除（原因：'+del_reason+'）').css({'line-height':'50px','color':'#44b549'});
                $('.order-list-item').eq(index).find('.unable_edit_order').show();
                $('.order-list-item').eq(index).find('.address-adapt').hide();
                $('.order-list-item').eq(index).find('.able_edit_order').hide();
            }
            else return Tip(res.error_text);
        },
        function(){return Tip('网络错误')}
    )
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

function operateSelf(type,$obj){
    var lat = $obj.attr("data-lat");
    var lon = $obj.attr("data-lng");
    var address = $.trim($("#addressDetail").val());
    var action = "",url=order_link;
    var args={};
    if(type=="add"){
        action="add_self_address";
        args = {
            action:action,
            data:{
                lat:lat,
                lon:lon,
                self_address:address
            }
        };
    }else if(type=="edit"){
        var id = $obj.attr("data-id");
        action="edit_self_address";
        args = {
            action:action,
            data:{
                address_id:id,
                lat:lat,
                lon:lon,
                address:address
            }
        };
    }else if(type=="set"){
        var id = $obj.attr("data-id");
        if(id || id=="0"){
            action="set_self_address";
            args = {
                action:action,
                data:{
                    address_id:id
                }
            };
        }
    }else if(type=="default"){
        var id = $obj.attr("data-id");
        if(id || id=="0"){
            action="set_self_default";
            args = {
                action:action,
                data:{
                    address_id:id
                }
            };
        }
    }else{
        $("#save-lbs").removeClass("forhidden");
        return false;
    }
    $.postJson(url,args,function(res){
            $("#save-lbs").removeClass("forhidden");
            if(res.success){
                if(type=="add"){
                    var id = res.address_id;
                    $obj.attr("data-id",id);
                    $obj.find(".self-addr").html(address);
                    $("#addressDetail").attr("disabled","true");
                    edit_flag = false;
                    Tip("自提点添加成功");
                }else if(type=="edit"){
                    $obj.find(".self-addr").html(address);
                    $("#addressDetail").attr("disabled","true");
                    edit_flag = false;
                    Tip("自提点编辑成功");
                }else if(type=="set"){
                    var $this = $obj.find(".switch-abtn");
                    if($this.hasClass("switch-abtn-active")){
                        $this.removeClass("switch-abtn-active");
                    }else{
                        $this.addClass("switch-abtn-active");
                    }
                }else if(type=="default"){
                    $(".self-address-list").find(".default-address").addClass("hidden");
                    $obj.find(".default-address").removeClass("hidden");
                }
            }
            else return Tip(res.error_text);
        },
        function(){return Tip('网络错误')}
    );
}
//初始化百度地图
function initBmap(){
    var map = new BMap.Map("bmap",{enableMapClick:false});          // 创建地图实例
    var scaleControl = new BMap.ScaleControl({anchor: BMAP_ANCHOR_BOTTOM_RIGHT,offset: new BMap.Size(15, 10)});  // 创建比例尺
    map.addControl(scaleControl);  // 显示比例尺
    var lat = parseFloat($("#lat").val());
    var lon = parseFloat($("#lon").val());
    var marker = null;
    map.enableScrollWheelZoom();
    var myGeo = new BMap.Geocoder();
    var spoint = new BMap.Point(lat, lon);  // 创建点坐标
    map.centerAndZoom(spoint, 15);
    var marker1 = new BMap.Marker(spoint);
    var slabel = new BMap.Label("店铺位置",{offset:new BMap.Size(-20,-20)});
    slabel.setStyle({
        border:"none",
        color:"#ff6666",
        fontWeight:"bold"
    });
    marker1.setLabel(slabel);
    map.addOverlay(marker1);
    initMarker();//初始化自提点
    map.centerAndZoom(new BMap.Point(lat-0.016,lon+0.01), 15);
    $("#addressDetail").on("keydown",function(ev){
        if(ev.keyCode==13){
            if(edit_flag == false) return false;
            var text = $.trim($("#addressDetail").val());
            if(text=="" || text.length>30){
                Tip("详细地址不能为空且不能超过30个字符");
                return false;
            }
            var address = $("#provinceAddress").text()+$("#cityAddress").text()+$("#addressDetail").val();
            getPointByName(map, myGeo, address,false);
        }
    });
    $("#search-lbs").on("click",function(){
        if(edit_flag == false) return Tip("请先点击编辑按钮");
        var text = $.trim($("#addressDetail").val());
        if(text=="" || text.length>30){
            Tip("详细地址不能为空且不能超过30个字符");
            return false;
        }
        var address = $("#provinceAddress").text()+$("#cityAddress").text()+$("#addressDetail").val();
        getPointByName(map, myGeo, address,false);
    });
    $("#save-lbs").on("click",function(){//保存自提点
        if(edit_flag == false) return Tip("请先点击编辑或添加按钮");
        if($(this).hasClass("forhidden")){
            return false;
        }
        var text = $.trim($("#addressDetail").val());
        if(text=="" || text.length>30){
            Tip("详细地址不能为空且不能超过30个字符");
            return false;
        }
        var address = $("#provinceAddress").text()+$("#cityAddress").text()+$("#addressDetail").val();
        getPointByName(map, myGeo, address,true);
    });
    $(document).on("click",".cur_loc",function(){
        var $item = $(this).closest("li");
        var lng = parseFloat($item.attr("data-lng"));
        var lat = parseFloat($item.attr("data-lat"));
        var key = "自提点"+$item.find(".self-index").html();
        map.centerAndZoom(new BMap.Point(lng, lat), 15);
        var mark = getMarker(key);
        if(mark){
            mark.setAnimation(BMAP_ANIMATION_BOUNCE);
            setTimeout(function(){
                mark.setAnimation();
            },2000);
        }else{
            return Tip("该自提点未找到");
        }
    });
    $(document).on("click",".wrap-operate .edit",function(){
        if(edit_flag) return Tip("请先保存正在编辑的自提点");
        edit_flag = true;
        var $item = $(this).closest("li");
        cur_address = $item;
        $("#addressDetail").removeAttr("disabled");
        var text = $item.find(".self-addr").html();
        if(text=="点击右方修改设置"){
            $("#addressDetail").val("").focus();
        }else{
            $("#addressDetail").val(text).focus();
        }
        $("#save-lbs").attr("data-type","edit");
        $(".self-address-list").find(".address-text").removeClass("green-txt")
        cur_address.find(".address-text").addClass("green-txt");
        var lng = parseFloat($item.attr("data-lng"));
        var lat = parseFloat($item.attr("data-lat"));
        var key = "自提点"+$item.find(".self-index").html();
        map.centerAndZoom(new BMap.Point(lng, lat), 15);
        marker = getMarker(key);
        if(marker){
            marker.setAnimation(BMAP_ANIMATION_BOUNCE);
            setTimeout(function(){
                marker.setAnimation();
            },3000);
            marker.enableDragging();
            marker.addEventListener("dragend",attribute);
            function attribute(){
                is_drag = true;
                var p = marker.getPosition();  //获取marker的位置
                myGeo.getLocation(p, function(rs){
                    var addComp = rs.addressComponents;
                    $("#addressDetail").val(addComp.district+addComp.street+addComp.streetNumber);
                    cur_address.attr("data-lng",p.lng).attr("data-lat",p.lat);
                });
            }
        }else{
            return Tip("该自提点未找到");
        }
    });
    $(document).on("click",".wrap-operate .delete",function(){
        var $this = $(this);
        if(confirm("确认删除该自提点吗？")){
            var id = $this.closest("li").attr("data-id");
            var args = {
                action:"set_self_address",
                data:{
                    address_id:id
                }
            };
            $.postJson(order_link,args,function(res){
                    if(res.success){
                        var key = "自提点"+$this.closest("li").find(".self-index").html();
                        deleteMarker(key);
                        $this.closest("li").remove();
                        Tip("自提点删除成功");
                    }
                    else return Tip(res.error_text);
                },
                function(){return Tip('网络错误')}
            );
        }
    });
    function getPointByName(map, myGeo, address,flag){
        myGeo.getPoint(address, function(point){
            if (point) {
                if(!is_drag){
                    cur_address.attr("data-lng",point.lng).attr("data-lat",point.lat);
                }
                if(!flag){
                    map.centerAndZoom(point, 15);
                }
                initPoint(map,point,myGeo,flag);
            }else{
                Tip("根据您填写的地址未能找到正确位置，请重新填写哦！");
            }
        });
    }
    function getMarker(key){
        var allOverlay = map.getOverlays();
        for (var i = 0; i < allOverlay.length; i++){
            if(allOverlay[i].getLabel().content == key){
                return allOverlay[i];
            }
        }
        return null;
    }
    function deleteMarker(key){
        var allOverlay = map.getOverlays();
        for (var i = 0; i < allOverlay.length; i++){
            if(allOverlay[i].getLabel().content == key){
                map.removeOverlay(allOverlay[i]);
                return true;
            }
        }
        return false;
    }
    function initPoint(map,point,myGeo,flag){
        var index = cur_address.index();
        var key = "自提点"+cur_address.find(".self-index").html();
        if(!flag){
            deleteMarker(key);
            marker = new BMap.Marker(point);
            marker.enableDragging();
            map.addOverlay(marker);
            map.centerAndZoom(point, 15);
        }else{
            $("#save-lbs").addClass("forhidden");
            operateSelf($("#save-lbs").attr("data-type"),cur_address);
            marker.disableDragging();
        }
        marker.addEventListener("dragend",attribute);
        var label = new BMap.Label("自提点"+cur_address.find(".self-index").html(),{offset:new BMap.Size(-20,-20)});
        label.setStyle({
            border:"none",
            color:"#333333",
            fontWeight:"bold"
        });
        marker.setLabel(label);
        function attribute(){
            is_drag = true;
            var p = marker.getPosition();  //获取marker的位置
            myGeo.getLocation(p, function(rs){
                var addComp = rs.addressComponents;
                $("#addressDetail").val(addComp.district+addComp.street+addComp.streetNumber);
                cur_address.attr("data-lng",point.lng).attr("data-lat",point.lat);
            });
        }
    }
    function initMarker(){
        var $list = $(".self-address-list").children("li");
        if($list.size()==0) return false;
        for(var i=0; i<$list.size(); i++){
            var $item = $list.eq(i);
            var lng = parseFloat($item.attr("data-lng"));
            var lat = parseFloat($item.attr("data-lat"));
            var mar = new BMap.Marker(new BMap.Point(lng,lat));
            map.addOverlay(mar);
            var label = new BMap.Label("自提点"+$item.find(".self-index").html(),{offset:new BMap.Size(-20,-20)});
            label.setStyle({
                border:"none",
                color:"#333333",
                fontWeight:"bold"
            });
            mar.setLabel(label);
        }
    }
}