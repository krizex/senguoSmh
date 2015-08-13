
var create_seckill_lock = "off";
var cur_action='';
var switch_status = 1;
var $new_seckill_item;
var group_fruit;
var fruit_id_charge_type;
var cur_fruit_id;
var cur_storage_piece;
$(document).ready(function(){
	cur_action = $('.action-div').attr('data-value');
	if (cur_action == 'seckill_new'){
		$new_seckill_item = $('.new-seckill-item').clone();
		group_fruit = eval($('.choose-goods').attr('data-value'))[0];
		fruit_id_charge_type = eval($('.choose-charge-type').attr('data-value'))[0];
	}
	
}).on('click', '.open-switch', function () {
    	var $this = $(this);
    	switch_status = parseInt($this.attr("data-status"));
    	if (switch_status == 1){
    		$this.attr("data-status","0");
    		$(".seckill-manage").hide();
    		$this.attr({'data-status': 0}).addClass('stop-mode').removeClass('work-mode').find('.tit').text('未启用');
    	}
    	else if (switch_status ==0) {
    		$this.attr("data-status","1");
    		$(".seckill-manage").show();
    		$this.attr({'data-status': 1}).removeClass('stop-mode').addClass('work-mode').find('.tit').text('已启用');
    	}
}).on('click','.seckill-list tr',function(){
	var $this = $(this);
	var url = '/admin/marketing/seckill?action=seckill_detail&page=0';
	window.location.href = url;
}).on('mouseover','.seckill-list tr',function(){
	var $this = $(this);
	$this.attr("title","点击查看秒杀详情");
}).on('click','.status-choose li',function(){
	var $this = $(this);
	$this.siblings('.active').removeClass("active");
	$this.addClass("active");
	var status = $this.attr("data-type");
	show_seckill_list(status,0);
}).on('click','.new-ok-btn',function(){
	if(create_seckill_lock == "off"){
		createSeckill();	
	}
	else{
		return false;
	}
}).on('click','.new-cancel-btn',function(){
	cancelSeckill();
}).on('click','.go-back-page',function(){
	cancelSeckill();
}).on('click','.choose-price button',function(){
	var $this = $(this);
	$this.siblings('.active').removeClass("active");
	$this.addClass('active');
}).on('click','.add-link',function(){
	var $this  = $(this);
	var $new_more_item = $new_seckill_item.clone();
	var goods_num_pre = parseInt($this.closest('tr').find(".goods-num").text());
	var goods_num_new = goods_num_pre + 1;
	$new_more_item.find(".goods-num").text(goods_num_new);
	$this.hide();
	$(".new-seckill-list").append($new_more_item);
	$(".delete-link").removeClass('hidden').show();
}).on('click','.delete-link',function(){
	var $this = $(this);
	if (confirm("删除之后剩余正在编辑的商品将会重新编号，您确定删除吗？")){
		if ($(".new-seckill-item").index($this.closest('tr')) == $(".new-seckill-item").length - 1){
			$this.closest('tr').prev(".new-seckill-item").find('.add-link').removeClass('hidden').show();
		}
		$this.closest('tr').remove();
		for (var i = 0;i < $(".new-seckill-item").length;i++){
			$(".new-seckill-item:eq(" + i+ ")").find('.goods-num').text(i+1);
		}
        	}
	if($(".new-seckill-item").length == 1){
		$(".delete-link").hide();
		$(".add-link").removeClass("hidden").show();
	}
}).on('click','.choose-continue-time a',function(){
	var $this = $(this);
	$this.closest('div').find('em').text($this.text());
	$this.closest('div').find('em').attr("data-id",$this.text());
}).on('click','.choose-goods-group a',function(){
	var $this = $(this);
	var cur_goods_group = $this.text();
	$this.closest(".new-seckill-item").find(".cur-goods-group").text(cur_goods_group);
	$this.closest(".new-seckill-item").find(".cur-goods-group").attr("data-id",$this.attr('data-id'));
	$this.closest(".new-seckill-item").find(".choose-goods").removeClass("hidden");
	$('.choose-goods-btn').attr('data-flag','1');
	var group_id = $this.attr('data-id');
	var choose_goods_list = group_fruit[group_id];
	$this.closest(".new-seckill-item").find('.choose-goods').empty();
	for (var i = 0;i < choose_goods_list.length;i++){
		var goods_item = choose_goods_list[i];
		var goods_id = goods_item[0];
		var goods_name = goods_item[1];
		var list_item = '<a class="item" href="javascript:;" data-id="'+goods_id +'">' + goods_name + '</a>';
		$this.closest(".new-seckill-item").find('.choose-goods').append(list_item);
	}
}).on('click','.choose-goods a',function(){
	var $this = $(this);
	var cur_goods = $this.text();
	$this.closest(".new-seckill-item").find(".cur-goods").text(cur_goods);
	$this.closest(".new-seckill-item").find(".choose-charge-type").removeClass("hidden");
	$this.closest(".new-seckill-item").find(".cur-goods").attr("data-id",$this.attr('data-id'));
	cur_fruit_id = $this.attr('data-id');
	var charge_type_list = fruit_id_charge_type[cur_fruit_id];
	$this.closest(".new-seckill-item").find(".choose-charge-type").empty();
	for (var i = 0;i < charge_type_list.length;i++){
		var charge_type_item = charge_type_list[i];
		var charge_type_text = charge_type_item[0] + '元/' +  charge_type_item[1] + charge_type_item[2];
		var storage_piece = charge_type_item[5];
		var charge_type_id = charge_type_item[4];
		var list_item = '<button class="btn btn-default" data-id="'+storage_piece+ '"' + ' charge_type_id="' +charge_type_id +  '">'+charge_type_text+'</button>';
		$this.closest(".new-seckill-item").find(".choose-charge-type").append(list_item);
	}
}).on('click','.choose-goods-btn',function(){
	var $this = $(this);
	if ($this.attr('data-flag').length == 0){
		Tip("请先选择商品分组");
	}
}).on('click','.choose-charge-type button',function(){
	var $this = $(this);
	var cur_charge_type = $this.text();
	var former_price = 0;
	var i = 0;
	for (i = 0;i < cur_charge_type.length;i++){
		if (cur_charge_type[i] == '/'){
			break;
		}
	}
	cur_storage_piece = $this.attr('data-id');
	if (parseFloat(cur_storage_piece) == 0){
		Tip('当前计价方式对应的剩余库存为0份，请选择其他计价方式！');
		return;
	}

	for (n = 0;n < cur_charge_type.length;n++){
		if (cur_charge_type[n] == '元'){
			break;
		}
	}
	former_price = cur_charge_type.substr(0,n);
	$this.closest(".new-seckill-item").find('.former-price').attr('data-id',former_price);

	$this.closest('.choose-charge-type').attr('data-flag','1');

	cur_charge_type = '元' + cur_charge_type.substr(i,cur_charge_type.length-1);
	$this.closest(".new-seckill-item").find('.seckill-charge-price').removeClass('hidden')
	$this.closest(".new-seckill-item").find('.cur-charge-type').text(cur_charge_type);
	$this.closest(".new-seckill-item").find('.seckill-price-input').removeClass('hidden');
	$this.closest(".new-seckill-item").find(".activity-store").removeClass('hidden');

	var remain_store_text = cur_storage_piece + '份（每份含：'+ cur_charge_type.substr(2,cur_charge_type.length-1) +'）';
	$this.closest(".new-seckill-item").find(".remain-store").text(remain_store_text);
	$this.closest(".new-seckill-item").find(".remain-store").attr('data-id',cur_storage_piece);

	var charge_type_id = $this.attr("charge_type_id");
	$this.closest(".new-seckill-item").find(".activity-store-charge-type").attr("charge_type_id",charge_type_id);
	$this.closest(".new-seckill-item").find(".activity-store-charge-type").text('份（每份含：'+ cur_charge_type.substr(2,cur_charge_type.length-1) +'）');
	$this.closest(".new-seckill-item").find(".activity-store-input").attr("data-id",cur_storage_piece);


}).on('blur','.seckill-price-input',function(){
	var $this = $(this);
	var input_text = $this.val();
	if (input_text.length != 0 && isNaN(input_text)){
		$this.val('');
		Tip('秒杀价必须是正数，请重新输入！');
	}
	if (input_text.length != 0 && !isNaN(input_text) && parseFloat(input_text) <= 0){
		$this.val('');
		Tip('秒杀价必须是正数，请重新输入！');
	}
	
}).on('blur','.activity-store-input',function(){
	var $this = $(this);
	var input_text = $this.val();
	var reg = /^[1-9]\d*$/;
	if (input_text.length != 0 && !reg.test(input_text)){
		$this.val('');
		Tip('活动库存必须是正整数，请重新输入！');
	}

	var storage = parseInt($this.attr("data-id"));
	if (input_text.length != 0 && reg.test(input_text)  && parseInt(input_text) > storage){
		$this.val('');
		Tip('活动库存必须小于或等于剩余库存，请重新输入！');
	}

});

function show_seckill_list(status,page){

}

function createSeckill(){
	create_seckill_lock = "on";
	var stop_flag = false;
	if ($('.start-time').val().length == 0){
		Tip('开始时间未填写！');
		create_seckill_lock = "off";
		return false;
	}
	if($('.choose-hour').attr('data-id').length == 0 || $('.choose-minute').attr('data-id').length == 0 || $('.choose-second').attr('data-id').length == 0){
		Tip('持续时间未设置！');
		create_seckill_lock = "off";
		return false;
	}
	if(parseInt($('.choose-hour').text()) == 0 && parseInt($('.choose-minute').text()) == 0 && parseInt($('.choose-second').text()) == 0){
		Tip('持续时间不能为0！');
		create_seckill_lock = "off";
		return false;
	}
	$('.new-seckill-item').each(function(){
		var $this = $(this);
		var goods_name = '商品'+$this.find('.goods-num').text();
		if ($this.find('.cur-goods-group').attr('data-id').length == 0 || $this.find('.cur-goods').attr('data-id').length == 0 || $this.find('.choose-charge-type').attr('data-flag').length == 0 || 
		     $this.find('.seckill-price-input').val().length == 0 || $this.find('.activity-store-input').val().length == 0){
			stop_flag = true;
			Tip(goods_name+'的秒杀信息填写不完整！');
		}
	});
	if (stop_flag){
		create_seckill_lock = "off";
		return false;
	}
	var start_time = $(".start-time").val();
	var continue_time_hour = $(".choose-hour").text();
	var continue_time_minute = $(".choose-minute").text();
	var continue_time_second = $(".choose-second").text();

	$('.new-seckill-item').each(function(){
		var $this = $(this);
		
		var fruit_id = $this.find(".cur-goods").attr("data-id");
		var charge_type_id = $this.find(".activity-store-charge-type").attr("charge_type_id");
		var former_price = $this.find('.former-price').attr('data-id');
		var seckill_price = $this.find('.seckill-price-input').val();
		var storage_piece = $this.find('.remain-store').attr('data-id');
		var activity_piece = $this.find('.activity-store-input').val();

		var url = "";
		var data = {
			start_time: start_time,
			continue_time_hour : continue_time_hour,
			continue_time_minute : continue_time_minute,
			continue_time_second : continue_time_second,
			fruit_id : fruit_id,
			charge_type_id : charge_type_id,
			former_price : former_price,
			seckill_price : seckill_price,
			storage_piece : storage_piece,
			activity_piece : activity_piece
		};
		var args={
			data : data,
			action : 'seckill_new'
		};
		$.postJson(url,args,function(res){
			if(res.success){
				// console.log('@@success!');
			}
			else{
				Tip(res.error_text);
				stop_flag = true;
			}
		},function(){Tip('网络好像不给力呢~ ( >O< ) ~');stop_flag = true;});
	});
	if (stop_flag){
		create_seckill_lock = "off";
		return false;
	}
	create_seckill_lock = "off";

	Tip('恭喜您，创建秒杀活动成功！')

	setTimeout(function(){
		window.location.href="/admin/marketing/seckill?action=seckill&page=0";
	}, 300);
	
}

function cancelSeckill(){
	if (confirm("当前编辑的秒杀商品还没有保存，您确定退出编辑吗？")){
        		window.location.href="/admin/marketing/seckill?action=seckill&page=0";
        	}
}

