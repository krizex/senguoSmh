/**
 * Created by Administrator on 2015/4/20.
 */
$(document).ready(function(){
	history('all_history',0);
}).on("click",".tab-lst li",function(){
    var index = $(this).index();
    $(".tab-lst li").removeClass("active").eq(index).addClass("active");
    $(".acc-con-lst li").removeClass("active").eq(index).addClass("active");
}).on('click','.all-list',function(){
	history('all_history',0);
}).on('click','.cash-list',function(){
	history('cash_history',0);
}).on('click','.charge-list',function(){
	history('recharge',0);
}).on('click','.online-list',function(){
	history('online',0);
});

function history(action,page){
    var url='';
    var action=action;
    var args={
        action:action,
        page:page
    };
    $('.tb-account').empty();
    $.postJson(url,args,
        function(res){
            if(res.success){
               var history=res.history;
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