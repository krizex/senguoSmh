/**
 * Created by Administrator on 2015/5/5.
 */
$(document).ready(function(){
    history('all_history',1);
}).on("click",".tab-lst li",function(){
    var index = $(this).index();
    $(".tab-lst li").removeClass("active").eq(index).addClass("active");
}).on("click",".apply-lst li",function(){
    var index = $(this).index();
    $(".apply-lst li").removeClass("active").eq(index).addClass("active");
}).on("click",".refuse-btn",function(){
    var index = $(this).closest("li").index();
    $("#com-cont").val("");
    $(".wrap-com-pop").attr("data-index",index).removeClass("hide");
}).on("click","#submit-apply",function(){  //拒绝申请
    var reason = $("#com-cont").val();
    var index =  $(".wrap-com-pop").attr("data-index");
    $.ajax({
        url:"/super/balance",
        data:{action:"decline",decline_reason:reason},
        type:"post",
        success:function(res){
            if(res.success){
                $("#com-cont").val("");
                $(".wrap-com-pop").addClass("hide");
                $(".apply-cont-lst").children().eq(index).children(".apply-btn-group").addClass("hidden");
                $(".apply-cont-lst").children().eq(index).children(".reason-txt").html(reason).removeClass("hidden");
                alert("操作成功");
            }else{
                alert("服务器出错，请联系管理员！");
            }
        }
    });
}).on("click","#concel-apply",function(){
    $("#com-cont").val("");
    $(".wrap-com-pop").addClass("hide");
}).on("click",".ok-btn",function(){    //通过申请
    var $this = $(this);
    $.ajax({
        url:"/super/balance",
        data:{action:"commit"},
        type:"post",
        success:function(res){
            if(res.success){
                $this.closest("li").children(".apply-btn-group").addClass("hidden");
                $this.closest("li").children(".reason-txt").html("已通过").removeClass("hidden");
                alert("操作成功");
            }else{
                alert("服务器出错，请联系管理员！");
            }
        }
    });
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
    }
}).on('click','.next-page',function(){
    if(num==page_sum){
        return alert('没有下一页啦！');
    }
    else{
        num++;
        var action=$('.list-pagination').attr('data-action');
        history(action,num);
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
    }
}).on('click','#cash-apply',function(){
    $('#cash-apply').addClass('bg-grey').attr({'disabled':true});
    cash();
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
    $('.tb-account').empty();
    $.postJson(url,args,
        function(res){
            if(res.success){
               var history=res.history;
               page_sum=Math.ceil(res.page_sum);
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
                var item= '<tr>'
+                                       '<td class="pl20">店铺名：<a href="javascript:;">{{shop_name}}</a> {{title}}</td>'
+                                       '<td class="c999">{{time}}</td>'
+                                       '<td class="orange-txt txt-ar"><span class="f16">{{balance_value}}</span><span class="c999">元</span></td>'
+                                       '<td class="green-txt txt-ar pr20"><span class="f16">{{balance}}</span><span class="c999">元</span></td>'
                                '</tr>'
        var render=template.compile(item);
        var shop_name=history[i]['shop_name'];
        var time=history[i]['time'];
        var value=history[i]['balance_value'];
        var balance=history[i]['balance'];
        var type=history[i]['type'];
        var title;
        if(type==0){
            title='充值';
            value='+'+value
        }
        else if(type==2){
            title='提现';
            value='-'+value
        }
        else if(type==3){
            title='在线支付';
            value='+'+value
        }
        var list_item =render({
            shop_name:shop_name,
            time:time,
            balance_value:value,
            balance:balance,
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