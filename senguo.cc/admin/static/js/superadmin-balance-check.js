/*create by jyj 2015-6-17*/
var page = 1;
var page_sum = 1;
var check_date;  //将check_date定义成全局变量，以方便动态生成的button的click事件与后台对账数据交互的方便。
var check_stop_flag = 0;
$(document).ready(function(){
	showCheckHistory(1,'history');

}).on("click","#btn-cancel",function(){
	onBtnCancelClick();
}).on("click","#PrePage",function(){
	if(page == 1){
		alert("当前已经是第一页了～");
		return false;
	}
	else{
		page--;
		showCheckHistory(page,'history');
	}
}).on("click","#NextPage",function(){
	if(page >= page_sum){
		alert("当前已经是最后一页了～");
		return false;
	}else{
		page++;
		showCheckHistory(page,'history');
	}
});

function onBtnCancelClick(){
	$("#div-input").hide();
	$("#checkinput_bg").hide();
}

function showCheckHistory(page,action){

	var url = "";
	var args = {
		page:page,
		action:action
	};
	$.postJson(url,args,function(res){
		if(res.success){
			var page_sum_now = parseInt(res.page_sum);
			if(page_sum_now < res.page_sum){
				page_sum_now = page_sum_now + 1;
			}
			page_sum = page_sum_now;
			$(".PageNow").text('-'+page+'/'+page_sum+'-');

			var history = res.output_data;
			$(".tb-history").empty();
			for(var i = 0;i < history.length;i++){
				var his = history[i];

				// 加id是为了唯一标识，从而为该列的button添加click事件
				var btn_check_id = "btn-check-" + i + "-"+page;
				var tr_id = "tr-id-"+i + "-"+page;
				
				if(his["is_checked"] == 0){
					var item = '<tr id={{tr_id}}>'
					+  '<td width="51px" class="txt-al" id="td1">{{create_time}}</td>'
					+  '<td width="65px" class="txt-ar"><span>{{total}}元<br>&nbsp;&nbsp;{{total_count}}笔</span><br><span class="green-txt"><span id="total_true">-元</span><br><span id="total_count_true">-笔</span></span></td>'
					+  '<td width="80px" class="txt-ar"><span>{{wx}}元<br>&nbsp;&nbsp;{{wx_count}}笔</span><br><span class="green-txt"><span id="wx_true">-元</span><br><span id="wx_count_true">-笔</span></span></td>'
					+  '<td width="80px" class="txt-ar"><span>{{alipay}}元<br>&nbsp;&nbsp;{{alipay_count}}笔</span><br><span class="green-txt"><span id="alipay_true">-元</span><br><span id="alipay_count_true">-笔</span></span></td>'
					+  '<td width="80px" class="txt-ar"><span>{{widt}}元<br>&nbsp;&nbsp;{{widt_count}}笔</span><br><span class="green-txt"><span id="widt_true">-元</span><br><span id="widt_count_true">-笔</span></span></td>'
					+  '<td width="50px" class="txt-ar"><button id={{btn_check_id}} type="button" class="btn-check">对账</button></td>'
					    '</tr>'
				}
				else{
					var item = '<tr>'
					+  '<td width="51px" class="mlf10 txt-al">{{create_time}}</td>'
					+  '<td width="65px" class="txt-ar">{{total}}元<br>{{total_count}}笔<br><span class="green-txt">{{total}}元<br>{{total_count}}笔</span></td>'
					+  '<td width="80px" class="txt-ar">{{wx}}元<br>{{wx_count}}笔<br><span class="green-txt">{{total}}元<br>{{total_count}}笔</span></td>'
					+  '<td width="80px" class="txt-ar">{{alipay}}元<br>{{alipay_count}}笔<br><span class="green-txt">{{total}}元<br>{{total_count}}笔</span></td>'
					+  '<td width="80px" class="txt-ar">{{widt}}元<br>{{widt_count}}笔<br><span class="green-txt">{{total}}元<br>{{total_count}}笔</span></td>'
					+  '<td width="50px" class="txt-ar"><button id="btn-check1" type="button" class="btn-checked">已对账</button></td>'
					    '</tr>'
				}
				var render=template.compile(item);
				var create_time = his["create_time"];
				var total = his["total_record"];
				var total_count = his["total_count_record"];
				var wx = his["wx_record"];
				var wx_count = his["wx_count_record"];
				var alipay = his["alipay_record"];
				var alipay_count = his["alipay_count_record"];
				var widt = his["widt_record"];
				var widt_count = his["widt_count_record"];

				var list_item = render({
					btn_check_id:btn_check_id,
					tr_id:tr_id,
					create_time:create_time,
					total:total,
					total_count:total_count,
					wx:wx,
					wx_count:wx_count,
					alipay:alipay,
					alipay_count:alipay_count,
					widt:widt,
					widt_count:widt_count
				});

				$(".tb-history").append(list_item);
				var btn_now_id = "";
				var tr_now_id = "";
				$("#"+btn_check_id).click(function(i){  //因为是动态循环绑定click事件，所以用到这种方法。
					return function(){
						if($(this).text() == "已对账"){
							return false;
						}
						$("#checkinput_bg").show();
             					$("#div-input").show();

             					btn_now_id = $(this).attr("id");
             					tr_now_id = $(this).parent().parent().attr("id");
             					
             					//还是因为动态绑定，所以先获取button的父元素的父元素的Id（即button所在的tr的id）,
             					//然后用each方法遍历该tr的前四列，获取需要的值
						var index = 0;
						$('#'+tr_now_id).children().each(function(){
							index++;
							if(index==1){
								var txt = $(this).text();
								check_date = txt;
								$("#input-date").text(txt);
							}
							if(index==3){
								var txt = $(this).children().first().text();
								$("#input-total-record").text(txt);
							}
							if(index==4){
								var txt = $(this).children().first().text();
								$("#input-wx-record").text(txt);
							}
							if(index==5){
								var txt = $(this).children().first().text();
								$("#input-alipay-record").text(txt);
							}

							if(index >5){
								return false;
							}
						});

						$("#btn-ok").click(function(i){
							return function(){
								//获得输入值
								var wx = parseFloat($("#wx-income").val());
								wx = wx.toFixed(2);
								var wx_count = parseInt($("#wx-income-count").val());
								var alipay = parseFloat($("#alipay-income").val());
								alipay = alipay.toFixed(2);
								var alipay_count = parseInt($("#alipay-income-count").val());
								var widt = parseFloat($("#widt-cash").val());
								widt = widt.toFixed(2);
								var widt_count = parseInt($("#widt-cash-count").val());

								var total = parseFloat(wx) + parseFloat(alipay);
								// total = total.toFixed(2);
								var total_count = wx_count + alipay_count;

								if(wx == "NaN" || wx_count == "NaN" || alipay == "NaN"
								  || alipay_count == "NaN" || widt == "NaN" || widt_count == "NaN"){
									alert("数据输入不完整！");
									return false;
								}

								//向后台发post请求,核对输入的数据与后台查询的数据是否一致,
								//若都一致则data["is_checked"]返回1,否则返回0
								var url = "";
								var data={};
								data["check_date"] = check_date;
								data["wx"] = wx;
								data["wx_count"] = wx_count;
								data["alipay"] = alipay;
								data["alipay_count"] = alipay_count;
								data["widt"] = widt;
								data["widt_count"] = widt_count;
								data["is_checked"] = 0;  //0:fail  1:success

								var args={
									data:data,
									action:'check'
								};
								$.postJson(url,args,function(res){

									if(res.success){
										data = res.output_data;
										if(data["is_checked"] == 1){
											$('#'+tr_now_id).find("#total_true").text(total+'元');
											$('#'+tr_now_id).find("#total_count_true").text(total_count+'笔');
											$('#'+tr_now_id).find("#wx_true").text(wx+'元');
											$('#'+tr_now_id).find("#wx_count_true").text(wx_count+'笔');
											$('#'+tr_now_id).find("#alipay_true").text(alipay+'元');
											$('#'+tr_now_id).find("#alipay_count_true").text(alipay_count+'笔');
											$('#'+tr_now_id).find("#widt_true").text(widt+'元');
											$('#'+tr_now_id).find("#widt_count_true").text(widt_count+'笔');
											
											$("#div-input").hide();
											$("#checkinput_bg").hide();
											$('#'+btn_now_id).removeClass('btn-check').addClass('btn-checked').text('已对账');
										}
										else{
											alert("对账数据有误,请重新核查!");
											return false;
										}
									}
									else{
							                    		alert(res.error_text);
							                    	}
									},
									function(){alert('网络好像不给力呢~ ( >O< ) ~');}	
								);
							}
						}(i));
					};
				}(i));

			}

		}
		else{

			alert(res.error_text);
		}
	}
	// 此处有问题，为什么余额详情页面加载的时候会弹出这个错误提示？？！只好先注释掉
	// function(){alert('aaaa-网络好像不给力呢~ ( >O< ) ~');}	
	);

}
