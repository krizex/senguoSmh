/**
 * Created by Administrator on 2015/5/5.
 */
var apply_list = "";
var payPage = 0;
$(document).ready(function(){
    history('all_history',1);
    if($("#apply-cont-lst").size()>0){
        apply_list = '{{each history as his}}'+
            '<li data-apply-id="{{his.id}}">'+
                '<ul class="shop-attr-lst group">'+
                    '<li>店铺名：<a href="/{{his.shop_code}}" target="_blank">{{his.shop_name}}</a></li>'+
                    '<li>认证类型：{{ if his.shop_auth==1 || his.shop_auth==4 }}个人认证{{ /if }}{{ if his.shop_auth==2 || his.shop_auth==3}}企业认证{{ /if }}</li>'+
                    '<li>账户余额：{{his.shop_balance}}元</li>'+
                    '<li>提现申请时间：{{his.create_time}}</li>'+
                    '<li>提现金额：<span class="red-txt">{{his.value}}</span>元</li>'+
                    '<li>支付宝帐号：<span class="red-txt">{{his.alipay_account}}</span></li>'+
                    '<li>申请人：<a href="javascript:;">{{his.applicant_name}}</a></li>'+
                    '<li>支付宝真实姓名：{{his.account_name}}</li>'+
                '</ul>'+
                '<div class="apply-btn-group">'+
                    '<a href="javascript:;" class="ok-btn">通过并已确认支付</a>'+
                    '<a href="javascript:;" class="refuse-btn">拒绝</a>'+
                '</div>'+
                '<p class="reason-txt hidden">拒绝理由：申请金额过大</p>'+
            '</li>'+
         '{{/each}}';
    }
}).on("click",".tab-lst li",function(){
    var index = $(this).index();
    $(".tab-lst li").removeClass("active").eq(index).addClass("active");
}).on("click",".apply-lst li",function(){
    if($(this).hasClass("active")) return false;
    var index = $(this).index();
    var action = $(this).attr("data-action");
    $(".apply-lst li").removeClass("active").eq(index).addClass("active");
    $.ajax({
        url:"/super/cash?action="+action,
        type:"get",
        success:function(res){
            if(res.success){
                if( res.history.length==0){
                    $("#apply-cont-lst").html("");
                    return false;
                }else{
                    var render = template.compile(apply_list);
                    var html = render(res);
                    $("#apply-cont-lst").html("").html(html);
                }
            }
        }
    })
}).on("click",".refuse-btn",function(){
    var index = $(this).closest("li").index();
    $("#com-cont").val("");
    $(".wrap-com-pop").attr("data-index",index).removeClass("hide");
}).on("click","#submit-apply",function(){  //拒绝申请
    var reason = $("#com-cont").val();
    var index =  $(".wrap-com-pop").attr("data-index");
    var apply_id = parseInt($(".apply-cont-lst").children().eq(index).attr("data-apply-id"));
    $.ajax({
        url:"/super/cash",
        data:{action:"decline",decline_reason:reason,apply_id:apply_id,_xsrf:window.dataObj._xsrf},
        type:"post",
        success:function(res){
            if(res.success){
                $("#com-cont").val("");
                $(".wrap-com-pop").addClass("hide");
                $(".apply-cont-lst").children().eq(index).children(".apply-btn-group").addClass("hidden");
                $(".apply-cont-lst").children().eq(index).children(".reason-txt").html("拒绝理由："+reason).removeClass("hidden");
                alert("操作成功");
            }else{
                alert(res.error_text);
            }
        }
    });
}).on("click","#concel-apply",function(){
    $("#com-cont").val("");
    $(".wrap-com-pop").addClass("hide");
}).on("click",".ok-btn",function(){    //通过申请
    var $this = $(this);
    var apply_id = parseInt($this.closest("li").attr("data-apply-id"));
    if(confirm('是否通过并确认支付')){
            $.ajax({
            url:"/super/cash",
            data:{action:"commit",apply_id:apply_id,_xsrf:window.dataObj._xsrf},
            type:"post",
            success:function(res){
                if(res.success){
                    $this.closest("li").children(".apply-btn-group").addClass("hidden");
                    $this.closest("li").children(".reason-txt").html("已通过").removeClass("hidden");
                    alert("操作成功");
                }else{
                    alert(res.error_text);
                }
            }
        });
    }

}).on('click','.all-list',function(){
    num=1;
    history('all_history',1);
}).on('click','.cash-list',function(){
    num=1;
    history('cash_history',1);
}).on('click','.charge-list',function(){
    num=1;
    history('recharge',1);
}).on('click','.online-list',function(){
    num=1;
    history('online',1);
}).on('click','.pre-page',function(){
    if(num==1){
        return alert('没有上一页啦！');
    }
    else{
        num--;
        var action=$('.list-pagination').attr('data-action');
        history(action,num);
        $('.page-now').text(num);
    }
}).on('click','.next-page',function(){
    if(num==page_sum){
        return alert('没有下一页啦！');
    }
    else{
        num++;
        var action=$('.list-pagination').attr('data-action');
        history(action,num);
        $('.page-now').text(num);
    }
}).on('click','.jump-to',function(){
    var page=$('.input-page').val().trim();
    var action=$('.list-pagination').attr('data-action');
    num=page;
    if(page<1||page>page_sum){
        return alert('没有该页的数据！');
    }
    else{
        history(action,page);
        $('.page-now').text(num);
    }
}).on('click','#cash-apply',function(){
    $('#cash-apply').addClass('bg-grey').attr({'disabled':true});
    cash();
}).on("click","#payPrePage",function(){
    if(payPage==0){
        alert("当前已经是第一页");
        return false;
    }
    payPage--;
    var action = $(".apply-lst").children(".active").attr("data-action");
    $.ajax({
        url:"/super/cash",
        data:{action:action,page:payPage,_xsrf:window.dataObj._xsrf},
        type:"post",
        success:function(res){
            if(res.success){
                if( res.history.length==0){
                    alert("当前已经是第一页");
                    return false;
                }else{
                    var render = template.compile(apply_list);
                    var html = render(res);
                    $("#apply-cont-lst").html("").html(html);
                }
            }
        }
    })
}).on("click","#payNextPage",function(){
    var action = $(".apply-lst").children(".active").attr("data-action");
    payPage++;
    $.ajax({
        url:"/super/cash",
        data:{action:action,page:payPage,_xsrf:window.dataObj._xsrf},
        type:"post",
        success:function(res){
            if(res.success){
                if( res.history.length==0){
                    alert("已经是最后一页");
                    return false;
                }else{
                    var render = template.compile(apply_list);
                    var html = render(res);
                    $("#apply-cont-lst").html("").html(html);
                }
            }
        }
    })
});

var num=1;
var page_sum;
function history(action,page){
    var url='';
    var action=action;
    var args={
        action:action,
        page:page
    };
    $('.list-pagination').attr({'data-action':action});
    $('.tb-account').find('.con').remove();
    $.postJson(url,args,
        function(res){
            if(res.success){
               var history=res.history;
               page_sum=Math.ceil(res.page_sum);
                if(action == 'cash_history'){
                    $('.wrap-acc-num').addClass('hidden');
                    $('.cash-count').removeClass('hidden');
                    $('.cash').text(res.total);
               }
               else if(action == 'recharge'){
                    $('.wrap-acc-num').addClass('hidden');
                    $('.charge-count').removeClass('hidden');
                    $('.charge-total').text(res.total);
                    $('.charge-use').text(res.pay);
                    $('.charge-left').text(res.left);
               }
               else if(action == 'online'){
                    $('.wrap-acc-num').addClass('hidden');
                    $('.online-count').removeClass('hidden');
                    $('.online-total').text(res.total);
                    $('.online-times').text(res.times);
                    $('.online-person').text(res.persons);
               }
               else if(action=='all_history'){
                $('.wrap-acc-num').addClass('hidden');
               }
               if(num == 1){
                $('.pre-page').addClass('hide');
               }
               else{
                $('.pre-page').removeClass('hide');
               }
               if(page_sum>1){
                $('.list-pagination').removeClass('hide');
                $('.page-total').text(page_sum);
               }
               else{
                $('.list-pagination').addClass('hide');
               }
               if(page==page_sum){
                $('.next-page').addClass('hide');
                $('.pre-page').removeClass('hide');
               }
               else{
                $('.next-page').removeClass('hide');
               }
               if(page_sum==0){
                $('.no-list').removeClass('hide');
               }
               else{
        $('.no-list').addClass('hide');
               }
               for(var i in history){
                var item= '<tr class="con">'
+                                       '<td class="pl20">店铺名：<a href="/{{shop_code}}" target="_blank">{{shop_name}}</a> {{title}} {{record}}</td>'
+                                       '<td class="c999">{{time}}</td>'
+                                       '<td class="orange-txt txt-ar"><span class="f16">{{balance_value}}</span><span class="c999">元</span></td>'
+                                       '<td class="green-txt txt-ar pr20"><span class="f16">{{balance}}</span><span class="c999">元</span></td>'
+                                       '<td class="txt-ar pr20">{{admin_id}}</td>'
                                '</tr>'
        var render=template.compile(item);
        var shop_name=history[i]['shop_name'];
        var time=history[i]['time'];
        var value=history[i]['balance_value'];
        var balance=history[i]['balance'];
        var type=history[i]['type'];
        var shop_code=history[i]['shop_code'];
        var title;
        var admin_id=history[i]['admin_id'];
        var record=history[i]['record'];
        if(type==0){
            title='充值';
            value='+'+value;
        }
        else if(type==2){
            title='提现';
            value='-'+value;
        }
        else if(type==3){
            title='在线支付';
            value='+'+value;
        }
        var list_item =render({
            shop_code:shop_code,
            shop_name:shop_name,
            time:time,
            balance_value:value,
            balance:balance,
            admin_id:admin_id,
            record:record
        });
        $('.tb-account').append(list_item);

               }
            }
            else{
                    alert(res.error_text);
            }
        },
        function(){alert('网络好像不给力呢~ ( >O< ) ~');}
        );
};
