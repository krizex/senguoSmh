
var switch_status = 1;
var $new_seckill_item;

$(document).ready(function(){
	$new_seckill_item = $('.new-seckill-item').clone();
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
	var url = '/admin/marketing?action=seckill_detail&page=0';
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
	createSeckill();
}).on('click','.new-cancel-btn',function(){
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
}).on('click','.choose-goods-group a',function(){
	var $this = $(this);
	var cur_goods_group = $this.text();
	$(".cur-goods-group").text(cur_goods_group);
	$(".choose-goods-btn").attr("data-flag",'1');
	$(".choose-goods").removeClass("hidden");
}).on('click','.choose-goods a',function(){
	var $this = $(this);
	var cur_goods = $this.text();
	$(".cur-goods").text(cur_goods);
	$(".choose-charge-type").removeClass("hidden");
	addChargeTypeList();
	$(".remain-store").text('150kg');
}).on('click','.choose-goods-btn',function(){
	var $this = $(this);
	if ($this.attr('data-flag') == '0'){
		Tip("请先选择商品分组");
	}
}).on('click','.choose-charge-type button',function(){
	var $this = $(this);
	var cur_charge_type = $this.text();
	$('.seckill-charge-price').removeClass('hidden')
	$('.cur-charge-type').text(cur_charge_type);
	$('.seckill-price-input').removeClass('hidden');
	$(".activity-store").removeClass('hidden');
});

function show_seckill_list(status,page){

}

function createSeckill(){
	window.location.href="/admin/marketing?action=seckill&page=0";
}

function cancelSeckill(){
	if (confirm("当前编辑的秒杀商品还没有保存，您确定退出编辑吗？")){
        		window.location.href="/admin/marketing?action=seckill&page=0";
        	}
}

function addChargeTypeList(){

}