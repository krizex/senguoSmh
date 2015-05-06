/**
 * Created by Administrator on 2015/4/20.
 */
$(document).ready(function(){
	history('all_history',1);
}).on("click",".tab-lst li",function(){
    var index = $(this).index();
    $(".tab-lst li").removeClass("active").eq(index).addClass("active");
    $(".acc-con-lst li").removeClass("active").eq(index).addClass("active");
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
}).on("click","#getPerCode",function(){   //获取验证码
    var $this = $(this);
    if($this.attr("data-statu")=="1") {
        return false;
    }
    $this.addClass("bg85").attr("data-statu", "1");
    var phone = $("#perCode").text();
    var args={
        action:'get_code',
        phone:phone,
      _xsrf:window.dataObj._xsrf
    };
    $.ajax({
        url:"",
        type:"post",
        data:JSON.stringify(args),
        contentType:"application/json; charset=UTF-8",
        success:function(res){
            if(res.success) {
                getCertCode($this);
            }else{
                $this.removeClass("bg85").removeAttr("data-statu").html("获取验证码");
                alert(res.error_text);
            }
        }
    });
});

function getCertCode($obj){
    var i=60,timer=null;
    $obj.html("重新发送(60)");
    timer = setInterval(function (){
        i--;
        if(i==0){
            $obj.removeClass("bg85").removeAttr("data-statu").html("获取验证码");
            clearInterval(timer);
        }else{
            $obj.html("重新发送("+i+")");
        }
    },1000);
}

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
               	$('.pre-page').addClass('hidden');
               }
               else{
               	$('.pre-page').removeClass('hidden');
               }
               if(page_sum>1){
               	$('.list-pagination').removeClass('hidden');
               	$('.page-total').text(page_sum);
               }
               else{
               	$('.list-pagination').addClass('hidden');
               }
               if(page==page_sum){
               	$('.next-page').addClass('hidden');
               	$('.pre-page').removeClass('hidden');
               }
               else{
               	$('.next-page').removeClass('hidden');
               }
               if(page_sum==0){
               	$('.no-list').removeClass('hidden');
               }
               else{
		$('.no-list').addClass('hidden');
               }
               for(var i in history){
               	var item=' <tr>'
+               			'<td class="pl20 w50">{{title}}：<a href="{{user}}">{{name}}</a>{{record}}</td>'
+                   			'<td class="c999">{{time}}</td>'
+                 			'<td class="orange-txt txt-ar"><span class="f16">{{value}}</span><span class="c999">元</span></td>'
+                   			'<td class="green-txt txt-ar pr20"><span class="f16">{{total}}</span><span class="c999">元</span></td>'
+              		' </tr>';
		var render=template.compile(item);
		var record=history[i]['record'];
		var name=history[i]['name'];
		var time=history[i]['time'];
		var value=history[i]['value'];
		var type=history[i]['type'];
		var total=history[i]['total'];
		var user='/admin/follower?action=search&&order_by=time&&page=0&&wd='+name;
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
			title:title,
			user:user,
			record:record,
			name:name,
			time:time,
			value:value,
			total:total
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
}

function cash(){
    var url='';
    var action='cash';
    var apply_value=parseFloat($('.money').val().trim());
    var alipay_account=$('.alipay-account').val().trim();
    var account_name=$('.account-name').val().trim();
    var code=$('#per-code').val().trim();
     var phone = $("#perCode").text();
    var regFloat=/^[0-9]+([.]{1}[0-9]{1,2})?$/;
    if(!apply_value){
    	$('#cash-apply').removeClass('bg-grey').removeAttr('disabled');
    	return alert('请填写提现金额');
    }
    if(!alipay_account){
    	$('#cash-apply').removeClass('bg-grey').removeAttr('disabled');
    	return alert('请填写提现支付宝账号');
    }
    if(!account_name){
    	$('#cash-apply').removeClass('bg-grey').removeAttr('disabled');
    	return alert('请填写支付宝认证姓名');
    }
     if(!regFloat.test(apply_value)){
    	$('#cash-apply').removeClass('bg-grey').removeAttr('disabled');
    	return alert('请填写数字，至多为小数点后两位');
    }
    if(!code){
    	$('#cash-apply').removeClass('bg-grey').removeAttr('disabled');
    	return alert('请填写短信验证码');
    }
    var args={
        action:action,
        apply_value:apply_value,
        alipay_account:alipay_account,
        account_name:account_name,
        code:code,
        phone:phone
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
            		$('.bs-apply-com').modal('hide');
            		$('.get-money').text('提现申请已提交成功，我们将在1-3个工作日内完成审核').removeAttr('data-target','data-toggle');
            		$('.fail-notice').remove();
               }
            else{
            	      $('#cash-apply').removeClass('bg-grey').removeAttr('disabled');
                    alert(res.error_text);
            }
        },
        function(){
        	$('#cash-apply').removeClass('bg-grey').removeAttr('disabled');
        	alert('网络好像不给力呢~ ( >O< ) ~');
        }
        );
}