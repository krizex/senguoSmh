var seckill_active = 0;
var create_seckill_lock = "off";
var cur_action='';
var switch_status = 1;
var $new_seckill_item;
var group_fruit;
var fruit_id_charge_type;
var cur_fruit_id;
var cur_storage_piece;

var sec_page_sum = parseInt($('.sec-pager').attr('page-sum'));
var cur_sec_page = 0;
var detail_page_sum = parseInt($('.detail-pager').attr('page-sum'));
var cur_detail_page = 0;

var sec_global_status = '1';
var spread_btn_status = 0;

var data_array = new Array();

$(document).ready(function(){
	cur_action = $('.action-div').attr('data-value');
	if (cur_action == 'seckill'){
		sec_global_status = $.getUrlParam('status');
		if (!sec_global_status){
			sec_global_status = '1';
		}
		seckill_active = $('.open-switch').attr('data-status');
		if (seckill_active == 0){
			$(".seckill-manage").hide();
			$('.open-switch').addClass('stop-mode').removeClass('work-mode').find('.tit').text('未启用');
		}
		else if (seckill_active == 1){
			$(".seckill-manage").show();
			$('.open-switch').removeClass('stop-mode').addClass('work-mode').find('.tit').text('已启用');
		}

		var status = $.getUrlParam("status");
		switch(status){
		case '1':
			$('.nostart').addClass('active');
			$('.nostart').siblings('.active').removeClass("active");
			break;
		case '2':
			$('.killing').addClass('active');
			$('.killing').siblings('.active').removeClass("active");
			break;
		case '0':
			$('.finished').addClass('active');
			$('.finished').siblings('.active').removeClass("active");
			break;
		case '-1':
			$('.stoped').addClass('active');
			$('.stoped').siblings('.active').removeClass("active");
			break;
		}

		$('.sec-page-total').text(sec_page_sum);

		$(document).on("click",function(e){
			if($(e.target).closest(".sw-er-tip").size()==0){
			               $(".sw-er-tip").addClass("invisible");
			}
		});  

		$(".sw-link-copy").zclip({
		               path: "/static/js/third/ZeroClipboard.swf",
		               copy: function(){
		                             return $(this).prev('input').val();
		               },
		              afterCopy:function(){
		                             Tip("秒杀活动链接已经复制到剪切板");
		              }
		});

		$(".er-code-img").each(function(){
			var _this = $(this);
			$(this).empty();
			new QRCode(this, {
			            width : 80,
			            height : 80
			}).makeCode(_this.closest(".sw-er-tip").find(".sw-link-txt").val());
		});
	}
	else if (cur_action == 'seckill_new'){
		$new_seckill_item = $('.new-seckill-item').clone();
		group_fruit = eval($('.choose-goods').attr('data-value'))[0];
		fruit_id_charge_type = eval($('.choose-charge-type').attr('data-value'))[0];
	}
	else if (cur_action == 'seckill_edit'){
		sec_global_status = $.getUrlParam('status');
		$new_seckill_item = $('.new-seckill-item-clone').clone();
		$new_seckill_item.removeClass('hidden');
		group_fruit = eval($('.choose-goods').attr('data-value'))[0];
		fruit_id_charge_type = eval($('.choose-charge-type').attr('data-value'))[0];
	}
	
}).on('click', '.open-switch', function () {
    	var $this = $(this);
    	switch_status = parseInt($this.attr("data-status"));
    	if (switch_status == 1){
    		if (confirm("停用以后，当前未开始和进行中的所有秒杀活动都将停用并且不能重新开启。您确认停用吗？")){
			changeSeckillActive('seckill_off');
	    		$this.attr("data-status","0");
	    		$(".seckill-manage").hide();
	    		$this.attr({'data-status': 0}).addClass('stop-mode').removeClass('work-mode').find('.tit').text('未启用');
		}
    		
    	}
    	else if (switch_status ==0) {
    		if (confirm("开启商品秒杀即可使用商品秒杀功能，开展商品秒杀活动。您确定开启吗？")){
	    		changeSeckillActive('seckill_on');
	    		getActivityItem('get_sec_item',sec_global_status,0);
	    		$this.attr("data-status","1");
	    		$(".seckill-manage").show();
	    		$this.attr({'data-status': 1}).removeClass('stop-mode').addClass('work-mode').find('.tit').text('已启用');
    		}
    	}
}).on('click','.seckill-list tr',function(){
	var $this = $(this);
	if ($this.find('td').attr("data-id") != '0'){
		var activity_id = $this.attr('data-id');
		var url = '/admin/marketing/seckill?action=seckill_detail&activity_id='+activity_id+'&status='+ sec_global_status +'&page=0';
		window.location.href = url;
	}
	
}).on('mouseover','.seckill-list tr',function(){
	var $this = $(this);
	if ($this.find('td').attr("data-id") != '0'){
		$this.attr("title","点击查看秒杀详情");
	}
}).on('click','.status-choose li',function(){
	var $this = $(this);
	$this.siblings('.active').removeClass("active");
	$this.addClass("active");
	var status = $this.attr("data-type");
	show_seckill_list(status,0);
}).on('click','.new-ok-btn',function(){
	if(create_seckill_lock == "off"){
		createSeckill('seckill_new');	
	}
	else{
		return false;
	}
}).on('click','.new-cancel-btn',function(){
	cancelSeckill();
}).on('click','.edit-ok-btn',function(){
	if(create_seckill_lock == "off"){
		var status = $.getUrlParam('status');
		if (status == '2'){
			var activity_data = $('.new-seckill-list').attr('activity-data');
			activity_data = eval("("+activity_data+")");
			var hour = parseInt(activity_data['hour']);
			var minute = parseInt(activity_data['minute']);
			var second = parseInt(activity_data['second']);
			var former_time = hour*3600 + minute*60 + second;
			var hh = parseInt($('.choose-hour').text());
			var mm = parseInt($('.choose-minute').text());
			var ss = parseInt($('.choose-second').text());
			var now_time = hh*3600 + mm * 60 + ss;
			
			if (now_time < former_time){
				Tip('修改后的持续时间必须不短于修改前的持续时间,请重新设置持续时间！');
				return false;
			}

		}
		createSeckill('seckill_edit');	
	}
	else{
		return false;
	}
}).on('click','.edit-cancel-btn',function(){
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
	$new_more_item.addClass("new-seckill-item");
	$new_more_item.attr("seckill-goods-id","-1");

	$this.hide();
	$(".new-seckill-list").append($new_more_item);
	$(".delete-link").removeClass('hidden').show();
}).on('click','.delete-link',function(){
	var $this = $(this);
	if (confirm("删除之后剩余正在编辑的商品将会重新编号，您确定删除吗？")){
		var seckill_goods_id = $this.closest('.new-seckill-item').attr('seckill-goods-id');
		onDeleteClick(seckill_goods_id);
		if ($(".new-seckill-item").index($this.closest('tr')) == $(".new-seckill-item").length - 1){
			$this.closest('.new-seckill-item').prev(".new-seckill-item").find('.add-link').removeClass('hidden').show();
		}
		$this.closest('.new-seckill-item').remove();
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

	$this.closest(".new-seckill-item").find('.choose-price').empty();
	$this.closest(".new-seckill-item").find('.cur-charge-type').empty();
	$this.closest(".new-seckill-item").find('.remain-store').empty();
	$this.closest(".new-seckill-item").find('.remain-store').attr('data-id','');
	$this.closest(".new-seckill-item").find('.activity-store-charge-type').empty();
	$this.closest(".new-seckill-item").find('.activity-store-input').val('');
	$this.closest(".new-seckill-item").find('.activity-store-input').attr('data-id','');
	$this.closest(".new-seckill-item").find('.seckill-price-input').val('');
	$this.closest(".new-seckill-item").find('.seckill-price-input').attr('data-id','');
	$this.closest(".new-seckill-item").find('.seckill-charge-price').addClass('hidden');
	$this.closest(".new-seckill-item").find('.activity-store').addClass('hidden');

	var cur_goods_group = $this.text();
	$this.closest(".new-seckill-item").find(".cur-goods-group").text(cur_goods_group);
	$this.closest(".new-seckill-item").find(".cur-goods-group").attr("data-id",$this.attr('data-id'));
	$this.closest(".new-seckill-item").find(".choose-goods").removeClass("hidden");
	$this.closest(".new-seckill-item").find(".cur-goods").text('选择商品');
	$this.closest(".new-seckill-item").find(".cur-goods").attr("data-id","");
	$('.choose-goods-btn').attr('data-flag','1');
	var group_id = $this.attr('data-id');
	var choose_goods_list = group_fruit[group_id];
	$this.closest(".new-seckill-item").find('.choose-goods').empty();

	if (choose_goods_list.length == 0){
		alert('当前分组没有已上架的商品，请选择其他分组！或者到商品管理中上架一些该分组的商品');
		return false;
	}

	for (var i = 0;i < choose_goods_list.length;i++){
		var goods_item = choose_goods_list[i];
		var goods_id = goods_item[0];
		var goods_name = goods_item[1];
		var list_item = '<a class="item" href="javascript:;" data-id="'+goods_id +'">' + goods_name + '</a>';
		$this.closest(".new-seckill-item").find('.choose-goods').append(list_item);
	}
}).on('click','.choose-goods a',function(){
	var $this = $(this);

	$this.closest(".new-seckill-item").find('.choose-price').empty();
	$this.closest(".new-seckill-item").find('.cur-charge-type').empty();
	$this.closest(".new-seckill-item").find('.remain-store').empty();
	$this.closest(".new-seckill-item").find('.remain-store').attr('data-id','');
	$this.closest(".new-seckill-item").find('.activity-store-charge-type').empty();
	$this.closest(".new-seckill-item").find('.activity-store-input').val('');
	$this.closest(".new-seckill-item").find('.activity-store-input').attr('data-id','');
	$this.closest(".new-seckill-item").find('.seckill-price-input').val('');
	$this.closest(".new-seckill-item").find('.seckill-price-input').attr('data-id','');
	$this.closest(".new-seckill-item").find('.seckill-charge-price').addClass('hidden');
	$this.closest(".new-seckill-item").find('.activity-store').addClass('hidden');
	
	var cur_goods = $this.text();
	var choose_goods_id = $this.attr('data-id');
	var cur_goods_id = $this.closest(".new-seckill-item").find(".cur-goods").attr("data-id");
	var flag = 0;
	var compare_goods = '';

	$('.cur-goods').each(function(){

		if($(this).attr('data-id') != cur_goods_id){
			var compare_id = $(this).attr('data-id');

			if (compare_id == choose_goods_id){
				flag = 1;
				compare_goods = '商品' + $(this).closest(".new-seckill-item").find(".goods-num").text();
			}
		}
	});
	if (flag == 1){
		Tip(cur_goods + '已经在' + compare_goods + '中被选择了，请选择其他商品！');
		return false;
	}

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
		if (charge_type_list.length == 1){
			var list_item = '<button class="btn btn-default active" data-id="'+storage_piece+ '"' + ' charge_type_id="' +charge_type_id +  '">'+charge_type_text+'</button>';
		}
		else{
			var list_item = '<button class="btn btn-default" data-id="'+storage_piece+ '"' + ' charge_type_id="' +charge_type_id +  '">'+charge_type_text+'</button>';
		}
		$this.closest(".new-seckill-item").find(".choose-charge-type").append(list_item);

		if (charge_type_list.length == 1){
			if (storage_piece == 0){
				Tip('当前计价方式对应的剩余库存为0份，请选择其他商品！');
				return;
			}
			former_price = charge_type_item[0] ;
			$this.closest(".new-seckill-item").find('.former-price').attr('data-id',former_price);

			$this.closest(".new-seckill-item").find('.choose-charge-type').attr('data-flag','1');

			var cur_charge_type = '元/' +  charge_type_item[1] + charge_type_item[2];
			var cur_charge_type_text = '元/份 （每份含：' + cur_charge_type.substr(2,cur_charge_type.length-1) + '）';
			$this.closest(".new-seckill-item").find('.seckill-charge-price').removeClass('hidden')
			$this.closest(".new-seckill-item").find('.cur-charge-type').text(cur_charge_type_text);
			$this.closest(".new-seckill-item").find('.seckill-price-input').removeClass('hidden');
			$this.closest(".new-seckill-item").find(".activity-store").removeClass('hidden');

			var remain_store_text = storage_piece + '份（每份含：'+ cur_charge_type.substr(2,cur_charge_type.length-1) +'）';
			$this.closest(".new-seckill-item").find(".remain-store").text(remain_store_text);
			$this.closest(".new-seckill-item").find(".remain-store").attr('data-id',storage_piece);

			$this.closest(".new-seckill-item").find(".activity-store-charge-type").attr("charge_type_id",charge_type_id);
			$this.closest(".new-seckill-item").find(".activity-store-charge-type").text('份（每份含：'+ cur_charge_type.substr(2,cur_charge_type.length-1) +'）');
			$this.closest(".new-seckill-item").find(".activity-store-input").attr("data-id",storage_piece);
		}
	}

}).on('click','.choose-goods-btn',function(){
	var $this = $(this);
	if ($this.attr('data-flag').length == 0){
		Tip("请先选择商品分组");
	}
}).on('click','.choose-charge-type button',function(){
	var status = $.getUrlParam('status');
	if(status == '2'){
		return false;

	}
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
	cur_charge_type_text = '元/份 （每份含：' + cur_charge_type.substr(2,cur_charge_type.length-1) + '）';
	$this.closest(".new-seckill-item").find('.seckill-charge-price').removeClass('hidden')
	$this.closest(".new-seckill-item").find('.cur-charge-type').text(cur_charge_type_text);
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
	if (input_text.length != 0 && !isNaN(input_text) && parseFloat(input_text) < 0.01){
		$this.val('');
		Tip('秒杀价必须是大于或等于0.01元的正数，请重新输入！');
	}
	
}).on('click','.sec-pre-page',function(){
	var $this = $(this);
	if (cur_sec_page+1 == sec_page_sum){
		$('.sec-next-page').removeClass("hidden");
	}
	cur_sec_page--;
	$('.sec-page-now').text(cur_sec_page+1);
	if (cur_sec_page == 0){
		$this.addClass("hidden");
	}
	var status = sec_global_status;
	getActivityItem('get_sec_item',status,cur_sec_page);

}).on('click','.sec-next-page',function(){
	var $this = $(this);
	if (cur_sec_page == 0){
		$('.sec-pre-page').removeClass('hidden');
	}
	cur_sec_page++;

	$('.sec-page-now').text(cur_sec_page+1);
	if (cur_sec_page+1 == sec_page_sum){
		$this.addClass("hidden");
	}

	var status = sec_global_status;

	getActivityItem('get_sec_item',status,cur_sec_page);

}).on('click','.sec-jump-to',function(){
	if ($('.sec-input-page').val().length == 0){
		return false;
	}
	var page_jump = parseInt($('.sec-input-page').val());
	if (page_jump < 1 || page_jump > sec_page_sum || isNaN(page_jump)){
		$('.sec-input-page').val('');
		Tip('输入的页码不正确，请重新输入');
		return false;
	}
	cur_sec_page = page_jump-1;
	$('.sec-page-now').text(page_jump);
	if (page_jump == 1){
		$('.sec-pre-page').addClass("hidden");
		$('.sec-next-page').removeClass('hidden');
	}
	else if (page_jump == sec_page_sum){
		$('.sec-pre-page').removeClass('hidden');
		$('.sec-next-page').addClass("hidden");
	}
	else{
		$('.sec-pre-page').removeClass('hidden').show();
		$('.sec-next-page').removeClass('hidden');
	}
	var status = sec_global_status;
	getActivityItem('get_sec_item',status,cur_sec_page);
	$('.sec-input-page').val('');
}).on('click','.detail-pre-page',function(){
	var $this = $(this);
	if (cur_detail_page+1 == detail_page_sum){
		$('.detail-next-page').show();
	}
	cur_detail_page--;
	$('.detail-page-now').text(cur_detail_page+1);
	if (cur_detail_page == 0){
		$this.hide();
	}
	var activity_id = $.getUrlParam('activity_id');
	getDetailItem('get_detail_item',activity_id,cur_detail_page);

}).on('click','.detail-next-page',function(){
	var $this = $(this);
	if (cur_detail_page == 0){
		$('.detail-pre-page').removeClass('hidden').show();
	}
	cur_detail_page++;

	$('.detail-page-now').text(cur_detail_page+1);
	if (cur_detail_page+1 == detail_page_sum){
		$this.hide();
	}

	var activity_id = $.getUrlParam('activity_id');
	getDetailItem('get_detail_item',activity_id,cur_detail_page);

}).on('click','.detail-jump-to',function(){
	if ($('.detail-input-page').val().length == 0){
		return false;
	}
	var page_jump = parseInt($('.detail-input-page').val());
	if (page_jump < 1 || page_jump > detail_page_sum || isNaN(page_jump)){
		$('.detail-input-page').val('');
		Tip('输入的页码不正确，请重新输入');
		return false;
	}
	cur_detail_page = page_jump-1;
	$('.detail-page-now').text(page_jump);
	if (page_jump == 1){
		$('.detail-pre-page').hide();
		$('.detail-next-page').show();
	}
	else if (page_jump == detail_page_sum){
		$('.detail-pre-page').removeClass('hidden').show();
		$('.detail-next-page').hide();
	}
	else{
		$('.detail-pre-page').removeClass('hidden').show();
		$('.detail-next-page').show();
	}
	var activity_id = $.getUrlParam('activity_id');
	getDetailItem('get_detail_item',activity_id,cur_detail_page);
	$('.detail-input-page').val('');
}).on('click','.edit-activity',function(e){
	e.stopPropagation();
	var $this = $(this);
	var activity_id = $this.closest('tr').attr('data-id');
	var status = sec_global_status;
	var url = '/admin/marketing/seckill?action=seckill_edit&activity_id=' + activity_id + '&status=' + status;
	window.location.href = url;
}).on('click','.stop-activity',function(e){
	e.stopPropagation();
	var $this = $(this);
	var activity_id = $this.closest('tr').attr('data-id');
	if (confirm("该秒杀活动停用以后将不能重新开启，您确认停用吗？")){
        		onStopActivityClick(activity_id,sec_global_status);
		$this.closest('tr').remove();
        	}
	
}).on("click",".spread-activity",function(e){
	e.stopPropagation();
	$(".sw-er-tip").addClass("invisible");
    	$(this).closest(".operate").children(".sw-er-tip").removeClass("invisible");
	
}).on("click",".sw-link-copy",function(e){
	e.stopPropagation();
});

function show_seckill_list(status,page){
	var activity_status = 1;
	switch(status){
		case 'nostart':
			activity_status = '1';
			break;
		case 'killing':
			activity_status = '2';
			break;
		case 'finished':
			activity_status = '0';
			break;
		case 'stoped':
			activity_status = '-1';
			break;
	}

	sec_global_status = activity_status;
	var cutover = 'true';
	getActivityItem('get_sec_item',sec_global_status,0,cutover);

}

function createSeckill(action){
	create_seckill_lock = "on";
	var stop_flag = false;
	if ($('.start-time').val().length == 0){
		Tip('开始时间未填写！');
		create_seckill_lock = "off";
		return false;
	}
    if(!$(".cur-goods-group").attr("data-id") && !$(".cur-goods-group").hasClass("clone-flag")){
        Tip('请选择商品分组！');
        create_seckill_lock = "off";
        return false;
    }
    if(!$(".cur-goods").attr("data-id") && !$(".cur-goods").hasClass("clone-flag")){
        Tip('请选择商品名称！');
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

		var choose_start_time = $('.start-time').val();
		var choose_continue_time = parseInt($('.choose-hour').text())*60*60 + parseInt($('.choose-minute').text())*60 + parseInt($('.choose-second').text());
		var choose_fruit_id = $this.find('.cur-goods').attr('data-id');
		var url = '';
		var data = {
			choose_start_time:choose_start_time,
			choose_continue_time:choose_continue_time,
			choose_fruit_id:choose_fruit_id,
			goods_name:goods_name
		};
		var activity_id = 0;
		if ($.getUrlParam("activity_id")){
			activity_id = $.getUrlParam("activity_id")
		}
		var args = {
			data:data,
			action:'check_fruit',
			activity_id:activity_id
		};

		$.ajaxSetup({
		  	async : false
		});
		$.postJson(url,args,function(res){
			if(res.success){
				var flag = res.flag;
				if (flag == 0){
					stop_flag = true;
					Tip(goods_name + '已经参与所选时间段内的其他秒杀活动，请选择其他商品！');
					
				}
			}
			else{
				Tip(res.error_text);
				stop_flag = true;
			}
		},function(){Tip('网络好像不给力呢~ ( >O< ) ~');stop_flag = true;});

		var activity_status = $.getUrlParam('status');
		if (action == 'seckill_edit' && activity_status == '2'){
			var former_activity_piece = parseInt($this.find('.activity-store').attr('activity-piece-value'));
			var now_activity_piece = parseInt($this.find('.activity-store-input').val());
			if (now_activity_piece < former_activity_piece){
				stop_flag = true;
				Tip(goods_name + '修改后的活动库存必须不少于修改前的活动库存，请重新填写！');
			}
		}
	});

	if (stop_flag){
		create_seckill_lock = "off";
		return false;
	}
	
	$('.activity-store-input').each(function(){
		var $this = $(this);
		var goods_num = '商品' + $this.closest(".new-seckill-item").find('.goods-num').text();
		var input_text = $this.val();
		var reg = /^[1-9]\d*$/;
		if (input_text.length != 0 && !reg.test(input_text)){
			$this.val('');
			stop_flag = true;
			Tip( + '活动库存必须是正整数，请重新输入！');
		}

		var storage = parseInt($this.attr("data-id"));
		if (input_text.length != 0 && reg.test(input_text)  && parseInt(input_text) > storage){
			$this.val('');
			stop_flag = true;
			Tip(goods_num + '活动库存必须小于或等于剩余库存，请重新输入！');
		}

	});

	if (stop_flag){
		create_seckill_lock = "off";
		return false;
	}

	if (action == 'seckill_edit'){
		var activity_id = $(".new-seckill-list").attr("activity-id");
	}
	var start_time = $(".start-time").val();
	var continue_time_hour = $(".choose-hour").text();
	var continue_time_minute = $(".choose-minute").text();
	var continue_time_second = $(".choose-second").text();

	var activity_data = {
		start_time:start_time,
		continue_time_hour:continue_time_hour,
		continue_time_minute:continue_time_minute,
		continue_time_second:continue_time_second
	}
	if (action == 'seckill_edit'){
		activity_data = {
			activity_id:activity_id,
			start_time:start_time,
			continue_time_hour:continue_time_hour,
			continue_time_minute:continue_time_minute,
			continue_time_second:continue_time_second
		}
	}
	data_array[0] = activity_data;

	var i = 1;
	$('.new-seckill-item').each(function(){
		var $this = $(this);
		
		if (action == 'seckill_edit'){
			var seckill_goods_id = parseInt($this.attr("seckill-goods-id"));
		}
		
		var fruit_id = $this.find(".cur-goods").attr("data-id");
		var charge_type_id = $this.find(".activity-store-charge-type").attr("charge_type_id");
		var former_price = $this.find('.former-price').attr('data-id');
		var seckill_price = $this.find('.seckill-price-input').val();
		var storage_piece = $this.find('.remain-store').attr('data-id');
		var activity_piece = $this.find('.activity-store-input').val();

		var url = "";

		var data = {};
		if (action == 'seckill_edit'){
			data = {
				seckill_goods_id : seckill_goods_id,
				fruit_id : fruit_id,
				charge_type_id : charge_type_id,
				former_price : former_price,
				seckill_price : seckill_price,
				storage_piece : storage_piece,
				activity_piece : activity_piece
			};
			
		}
		else{
			data = {
				fruit_id : fruit_id,
				charge_type_id : charge_type_id,
				former_price : former_price,
				seckill_price : seckill_price,
				storage_piece : storage_piece,
				activity_piece : activity_piece
			};
			
		}
		data_array[i] = data;
		i ++;	
	});
	
	var args = {};
	var url = "";

	args={
		data : data_array,
		action : action
	};

	$.postJson(url,args,function(res){
		if(res.success){

		}
		else{
			Tip(res.error_text);
			stop_flag = true;
		}
	},function(){Tip('网络好像不给力呢~ ( >O< ) ~');stop_flag = true;});


	if (stop_flag){
		create_seckill_lock = "off";
		return false;
	}
	create_seckill_lock = "off";

	var action = $.getUrlParam('action');
	if (action == 'seckill_new'){
		Tip('恭喜您，新建秒杀活动成功！')
	}
	else if (action == 'seckill_edit'){
		Tip('恭喜您，编辑秒杀活动成功！')
	}
	
	setTimeout(function(){
		window.location.href="/admin/marketing/seckill?action=seckill&page=0&status=" + sec_global_status;
	}, 300);
	
}

function cancelSeckill(){
	if (confirm("当前编辑的秒杀商品还没有保存，您确定退出编辑吗？")){
        		window.location.href="/admin/marketing/seckill?action=seckill&page=0&status="+sec_global_status ;
        	}
}

function changeSeckillActive(action){
	var url = '';
	var args = {
		action : action
	};
	$.postJson(url,args,function(res){
		if (res.success){

		}
		else{
				Tip(res.error_text);
			}
		},function(){Tip('网络好像不给力呢~ ( >O< ) ~');});
}

function getActivityItem(action,status,page,cutover){
	var url = "";
	var args = {
		action:action,
		status:status,
		page:page
	};
	$.postJson(url,args,function(res){
		if(res.success){
			var output_data = res.output_data;
			$('.seckill-list').empty();
			if(output_data.length == 0){
				var tr_item = '<tr>'+
                                                                                 '<td colspan="5" class="txt-center c999 font14" data-id="0">没有当前状态的秒杀活动</td>'+
                                                          	         '</tr>';
                                                          $('.seckill-list').append(tr_item);
                                                          if(cutover == 'true'){
		        			cur_sec_page = 0;
					$('.sec-page-now').text(cur_sec_page+1);
					$(".sec-pre-page").addClass('hidden');
					var page_sum = res.page_sum;
					sec_page_sum = res.page_sum;
					$(".sec-next-page").removeClass('hidden');
					$('.sec-page-total').text(sec_page_sum);
					if (sec_page_sum == 0){
						sec_page_sum = 1;
						$(".sec-next-page").addClass('hidden');
						$('.sec-page-total').text(1);
					}
		        		}
                                                          return false;
			}
			for (var i = 0;i < output_data.length;i++){
				var data = output_data[i];

				var tr_item = "";
				switch(status){
					case '1':
						tr_item = '<tr data-id="{{activity_id}}">'
	                                                                        +'<td colspan="1">{{start_time}}</td>'
	                                                                        +'<td colspan="1">{{continue_time}}</td>'
	                                                                        +'<td colspan="1">{{goods_list}}</td>'
	                                                                        +'<td colspan="1">{{picked}} / {{ordered}}</td>'
	                                                                        +'<td colspan="1" class="operate">'
	                                                                                       +'<a href="javascript:;" class="edit-activity" title="点击编辑此秒杀活动">编辑</a>'
	                                                                                       +'<a href="javascript:;" class="ml10  spread-activity" title="点击推广此秒杀活动">推广</a>'
	                                                                                       +'<a href="javascript:;" class="ml10 stop-activity" title="点击停用此秒杀活动">停用</a>'
	                                                                                       +'<div class="sw-er-tip spread-position invisible" title="">'+
                                                                                              		'<div class="top-arr">'+
                                                                                                     		'<span class="line1"></span>'+
                                                                                                     		'<span class="line2"></span>'+
                                                                                              		'</div>'+
                                                                                              		'<p class="er-text">活动链接</p>'+
                                                                                              		'<div class="wrap-ipt">'+
		                                                                                                     '<input type="text" class="sw-link-txt" value="http://i.senguo.cc/seckill/{{shop_code}}?activity_id={{activity_id}}" disabled="">'+
		                                                                                                     '<input type="button" class="sw-link-copy" value="复制链接">'+
                                                                                              		'</div>'+
                                                                                              		'<div class="wrap-er group">'+
		                                                                                                     '<img class="er-logo" src="/static/images/favicon.ico" alt="">'+
		                                                                                                     '<div class="er-text lh80 fl">链接二维码</div>'+
		                                                                                                     '<div class="er-img fl er-code-img" title="http://i.senguo.cc/seckill/{{shop_code}}?activity_id={{activity_id}}"></div>'+
                                                                                              		'</div>'+
                                                                                       	'</div>'
	                                                                        +'</td>'
	                                                          	+'</tr>';
						break;
					case '2':
						tr_item = '<tr data-id="{{activity_id}}">'
	                                                                        +'<td colspan="1">{{start_time}}</td>'
	                                                                        +'<td colspan="1">{{continue_time}}</td>'
	                                                                        +'<td colspan="1">{{goods_list}}</td>'
	                                                                        +'<td colspan="1">{{picked}} / {{ordered}}</td>'
	                                                                        +'<td colspan="1" class="operate">'
	                                                                                       +'<a href="javascript:;" class="edit-activity" title="点击编辑此秒杀活动">编辑</a>'
	                                                                                       +'<a href="javascript:;" class="ml10  spread-activity" title="点击推广此秒杀活动">推广</a>'
	                                                                                       +'<a href="javascript:;" class="ml10 stop-activity" title="点击停用此秒杀活动">停用</a>'
	                                                                                       +'<div class="sw-er-tip spread-position invisible" title="">'+
                                                                                              		'<div class="top-arr">'+
                                                                                                     		'<span class="line1"></span>'+
                                                                                                     		'<span class="line2"></span>'+
                                                                                              		'</div>'+
                                                                                              		'<p class="er-text">活动链接</p>'+
                                                                                              		'<div class="wrap-ipt">'+
		                                                                                                     '<input type="text" class="sw-link-txt" value="http://i.senguo.cc/seckill/{{shop_code}}?activity_id={{activity_id}}" disabled="">'+
		                                                                                                     '<input type="button" class="sw-link-copy" value="复制链接">'+
                                                                                              		'</div>'+
                                                                                              		'<div class="wrap-er group">'+
		                                                                                                     '<img class="er-logo" src="/static/images/favicon.ico" alt="">'+
		                                                                                                     '<div class="er-text lh80 fl">链接二维码</div>'+
		                                                                                                     '<div class="er-img fl er-code-img" title="http://i.senguo.cc/seckill/{{shop_code}}?activity_id={{activity_id}}"></div>'+
                                                                                              		'</div>'+
                                                                                       	'</div>'
	                                                                        +'</td>'
	                                                          	+'</tr>';
						break;
					case '0':
						tr_item = '<tr data-id="{{activity_id}}" class="dis-seckill">'
	                                                                        +'<td colspan="1">{{start_time}}</td>'
	                                                                        +'<td colspan="1">{{continue_time}}</td>'
	                                                                        +'<td colspan="1">{{goods_list}}</td>'
	                                                                        +'<td colspan="1">{{picked}} / {{ordered}}</td>'
	                                                                        +'<td colspan="1">'
	                                                                                       +'<span>已结束</span>'
	                                                                        +'</td>'
	                                                          	+'</tr>';
						break;
					case '-1':
						tr_item = '<tr data-id="{{activity_id}}" class="dis-seckill">'
	                                                                        +'<td colspan="1">{{start_time}}</td>'
	                                                                        +'<td colspan="1">{{continue_time}}</td>'
	                                                                        +'<td colspan="1">{{goods_list}}</td>'
	                                                                        +'<td colspan="1">{{picked}} / {{ordered}}</td>'
	                                                                        +'<td colspan="1">'
	                                                                                       +'<span>已停用</span>'
	                                                                        +'</td>'
	                                                          	+'</tr>';
						break;
				}
				
                                                          var render=template.compile(tr_item);

                                                          var activity_id = data['activity_id'];
                                                          var start_time = data['start_time'];
                                                          var continue_time = data['continue_time'];
                                                          var goods_list = data['goods_list'];
                                                          var picked = data['picked'];
                                                          var ordered = data['ordered'];
                                                          var shop_code = data['shop_code'];

                                                          var list_item =render({
		           	 		activity_id:activity_id,
		           	 		start_time:start_time,
		           	 		continue_time:continue_time,
		           	 		goods_list:goods_list,
		           	 		picked:picked,
		           	 		ordered:ordered,
		           	 		shop_code:shop_code
		        		});

		        		$('.seckill-list').append(list_item);

		        		$(document).on("click",function(e){
					if($(e.target).closest(".sw-er-tip").size()==0){
					               $(".sw-er-tip").addClass("invisible");
					}
				});  

				$(".sw-link-copy").zclip({
				               path: "/static/js/third/ZeroClipboard.swf",
				               copy: function(){
				                             return $(this).prev('input').val();
				               },
				              afterCopy:function(){
				                             Tip("秒杀活动链接已经复制到剪切板");
				              }
				});

				$(".er-code-img").each(function(){
					var _this = $(this);
					$(this).empty();
					new QRCode(this, {
					            width : 80,
					            height : 80
					}).makeCode(_this.closest(".sw-er-tip").find(".sw-link-txt").val());
				});

		        		if(cutover == 'true'){
		        			cur_sec_page = 0;
					$('.sec-page-now').text(cur_sec_page+1);
					$(".sec-pre-page").addClass('hidden');
					var page_sum = res.page_sum;
					sec_page_sum = res.page_sum;
					$(".sec-next-page").removeClass('hidden');
					if (sec_page_sum == 1){
						$(".sec-next-page").addClass('hidden');
					}
					$('.sec-page-total').text(page_sum);
		        		}
			}	
		}
		else{
			Tip(res.error_text);
		}
	},function(){Tip('网络好像不给力呢~ ( >O< ) ~');stop_flag = true;});
}

function getDetailItem(action,activity_id,page){
	var url = "";
	var args = {
		action:action,
		activity_id:activity_id,
		page:page
	};
	$.postJson(url,args,function(res){
		if(res.success){
			var output_data = res.output_data;
			$('.detail-list').empty();
			for (var i = 0;i < output_data.length;i++){
		        		var data = output_data[i];
				var tr_item = '<tr>'
                                                          	+'<td colspan="1">{{fruit_name}}</td>'
                                                          	+'<td colspan="1">{{seckill_price}} / {{former_price}} {{charge_type}}</td>'
                                                          	+'<td colspan="1">{{discount}}</td>'
                                                          	+'<td colspan="1">{{picked}} / {{ordered}} / {{storage_piece}} {{storage_type}}</td>'
                                            	 	+'</tr>';
                                                          var render=template.compile(tr_item);

                                                          var fruit_name = data['fruit_name'];
                                                          var seckill_price = data['seckill_price'];
                                                          var former_price = data['former_price'];
                                                          var charge_type = data['charge_type']
                                                          var discount = data['discount'];
                                                          var picked = data['picked'];
                                                          var ordered = data['ordered'];
                                                          var storage_piece = data['storage_piece'];
                                                          var storage_type = data['storage_type'];

                                                          var list_item =render({
		           	 		fruit_name:fruit_name,
		           	 		seckill_price:seckill_price,
		           	 		former_price:former_price,
		           	 		charge_type:charge_type,
		           	 		discount:discount,
		           	 		picked:picked,
		           	 		ordered:ordered,
		           	 		storage_piece:storage_piece,
		           	 		storage_type:storage_type
		        		});

		        		$('.detail-list').append(list_item);
			}
		}
		else{
			Tip(res.error_text);
		}
	},function(){Tip('网络好像不给力呢~ ( >O< ) ~');stop_flag = true;});
}

function onDeleteClick(seckill_goods_id){
	var url = "";
	var args = {
		data : seckill_goods_id,
		action : 'edit_delete'
	};
	$.postJson(url,args,function(res){
		if(res.success){

		}
		else{
			Tip(res.error_text);
		}
	},function(){Tip('网络好像不给力呢~ ( >O< ) ~')});
}

function onStopActivityClick(activity_id,status){
	var url = "";
	var args = {
		activity_id:activity_id,
		status:status,
		action:'stop_activity'
	};
	$.postJson(url,args,function(res){
		if(res.success){
			
		}
		else{
			Tip(res.error_text);
		}
	},function(){Tip('网络好像不给力呢~ ( >O< ) ~')});

	var cutover = 'true';
	getActivityItem('get_sec_item',sec_global_status,0,cutover);
}
