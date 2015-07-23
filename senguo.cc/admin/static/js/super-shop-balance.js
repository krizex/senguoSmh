/*create by jyj 2015-6-16*/
var page_sum = 0;
var page_size = 20;
var page = 1;
$(document).ready(function(){
	getPageSum();
	showHistory(1);
}).on("click","#PrePage",function(){
	if(page == 1){
		alert("当前已经是第一页了～");
		return false;
	}
	else{
		page--;
		showHistory(page);
	}
}).on("click","#NextPage",function(){

	if(page >= page_sum){
		alert("当前已经是最后一页了～");
		return false;
	}else{
		page++;
		showHistory(page);
	}
});

function getPageSum(){
	var url = '';
	page = 0;
	var args={
		page:page
	}
	$.postJson(url,args,function(res){
		if(res.success){
			page_sum = res.page_sum;
			page = 1;
		}
		else{
			page = 1;
                    		alert(res.error_text);
                    	}
	},
	function(){alert('网络好像不给力呢~ ( >O< ) ~');}
	);
}

function showHistory(page){
	var url='';
	var args={page:page};
	$.postJson(url,args,function(res){
		if(res.success){
			var page_sum_now = parseInt(page_sum) ;
			if(page_sum_now < page_sum){
				page_sum_now = page_sum_now + 1;
			}
			$(".PageNow").text('-'+page+'/'+page_sum_now+'-');
			var history = res.history;
			$('.tb-account').empty();
			for(i = 0;i<history.length;i++){
				his = history[i];
				var type = his["type"];

				// 此处用于判断用户名是否需要加超链接
				if(type == 2){
					var item2 = '<td width="17%">{{record}}{{name}}</td>';
				}
				else{
					var item2 = '<td width="17%">{{record}}<a href="/super/user" title="点击查看该用户详情" target="_blank" class=" text-blue">{{name}}</a></td>';
				}
				var item= '<tr>'
					 +'<td class="pl10" width="20%">店铺：<a href="/{{shop_code}}" title="点击查看该店铺商品首页" target="_blank" class=" text-blue">{{shop_name}}</a></td>'
					 +item2
					 +'<td width="21%">{{order_num_txt}}<a href="/super/orderManage/" title="点击查看该订单详情" target="_blank" class="text-blue">{{order_num}}</a></td>'
					 +'<td class="text-gray" width="15%">{{time}}</td>'
					 +'<td class="txt-ar" width="12%"><span class="orange-txt">{{balance_value}}</span>元</td>'
					 +'<td class="txt-ar pr10" width="15%"><span class="green-txt">{{balance}}</span>元</td>'
					 '</tr>'
		        		var render=template.compile(item);
		        		var shop_code = his["shop_code"];
		        		var shop_name= his["shop_name"];
		        		if(shop_name.length >=8){
		        			shop_name = shop_name.slice(0,7) + '...';
		        		}
		        		var record = his["record"];
		        		var name = his["name"]
		        		if(name.length >=6){
		        			name =name.slice(0,5)+'...';
		        		}
		        		var order_num_txt = his["order_num_txt"];
		        		var order_num = his["order_num"];
		        		var time=his["time"];
		        		var balance_value = his["balance_value"];
		        		if(type == 2){
		        			balance_value = '-' + balance_value;
		        		}
		        		else{
		        			balance_value = '+' + balance_value;
		        		}
		        		var balance = his["balance"];

		        		var list_item =render({
		           	 		shop_code:shop_code,
		            			shop_name:shop_name,
		            			type:type,
		            			record:record,
		            			name:name,
		            			order_num_txt:order_num_txt,
		            			order_num:order_num,
		            			time:time,
		            			balance_value:balance_value,
		            			balance:balance
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