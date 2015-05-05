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
               if(page_sum!=1){
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
               for(var i in history){
               	var item=' <tr>'
+               			'<td class="pl20">{{title}}：<a href="{{user}}">{{name}}</a>{{record}}</td>'
+                   			'<td class="c999">{{time}}</td>'
+                 			'<td class="orange-txt txt-ar"><span class="f16">{{value}}</span><span class="c999">元</span></td>'
+                   			'<td class="green-txt txt-ar pr20"><span class="f16">+2200.00</span><span class="c999">元</span></td>'
+              		' </tr>';
		var render=template.compile(item);
		var record=history[i]['record'];
		var name=history[i]['name'];
		var time=history[i]['time'];
		var value=history[i]['value'];
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
			title:title,
			record:record,
			name:name,
			time:time,
			value:value
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
    var apply_value=;
    var args={
        action:action,
        apply_value:apply_value,
        alipay_account:alipay_account
    };
    $.postJson(url,args,
        function(res){
            if(res.success){

               }
            }
            else{
                    alert(res.error_text);
            }
        },
        function(){alert('网络好像不给力呢~ ( >O< ) ~');}
        );
}