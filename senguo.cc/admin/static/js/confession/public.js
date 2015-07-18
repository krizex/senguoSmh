$(document).ready(function(){

}).on('click','.type-btn',function(){
	var $this=$(this);
	$this.addClass('active').siblings('.type-btn').removeClass('active');
}).on('click','.pub-btn',function(){
	var $this=$(this);
	$this.addClass('bg-greyc').attr({'disabled':true});
	var url='';
	var mode_type=parseInt($('.pub-box').attr('data-type'));
	var type= $('.type-btn.active').attr('data-id');
	var confession= $('#confession').val().trim();
	if (mode_type == 1){
		var name = $('#other-name').val().trim();
		var phone = $('#other-phone').val().trim();
		var address = $('#other-address').val().trim();
		if(!name){
			$this.removeClass('bg-greyc').removeAttr('disabled');
			return noticeBox('请填写TA的姓名哦～');
		}
		if(name.length>20){
			$this.removeClass('bg-greyc').removeAttr('disabled');
			return noticeBox('姓名请不要超过20字～');
		}
		if(!phone){
			$this.removeClass('bg-greyc').removeAttr('disabled');
			return noticeBox('请填写TA的手机号，方便我们礼品派送哦～ ')
		}
		if(phone.length>11||phone.length<11){
			$this.removeClass('bg-greyc').removeAttr('disabled');
			return noticeBox('手机号貌似不正确～ ');
		}
		if(!confession){
			$this.removeClass('bg-greyc').removeAttr('disabled');
			return noticeBox('请填上告白的内容吧～');
		}
		if(confession.length>500){
			$this.removeClass('bg-greyc').removeAttr('disabled');
			return noticeBox('真心的告白，不需要如此多的文字～');
		}
		if(!address){
			$this.removeClass('bg-greyc').removeAttr('disabled');
			return noticeBox('请填写TA的地址，方便我们礼品派送哦～ ');
		}
		if(address.length>50){
			$this.removeClass('bg-greyc').removeAttr('disabled');
			return noticeBox('地址请不要超过50字～ ');
		}
		var data={
			name:name,
			phone:phone,
			address:address,
			type:type,
			confession:confession
		};
	}
	else{
		var data={
			type:type,
			confession:confession
		};
	}
	var args={
		data:data
	};
	$.postJson(url,args,
		function(res){
			if(res.success)
			{
				$this.removeClass('bg-greyc').removeAttr('disabled');
				//noticeBox('发布成功');
				window.location.href="/lovewall/"+$('.pub-box').attr('data-code');
			}
			else {
				$this.removeClass('bg-greyc').removeAttr('disabled');
				return noticeBox(res.error_text);
			}
		},function(){
			$this.removeClass('bg-greyc').removeAttr('disabled');
			return noticeBox('网络好像不给力呢~ ( >O< ) ~');
		},
		function(){
			$this.removeClass('bg-greyc').removeAttr('disabled');
			return noticeBox('服务器貌似出错了~ ( >O< ) ~');
		}    
	);
});