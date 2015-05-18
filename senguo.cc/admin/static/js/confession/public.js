$(document).ready(function(){

}).on('click','.type-btn',function(){
	var $this=$(this);
	$this.addClass('active').siblings('.type-btn').removeClass('active');
}).on('click','.pub-btn',function(){
	var $this=$(this);
	$this.addClass('bg-greyc').attr({'disabled':true});
	var url='';
	var name=$('#other-name').val().trim();
	var phone=$('#other-phone').val().trim();
	var type=$('.type-btn.active').attr('data-id');
	var confession=$('#confession').val().trim();
	if(!name){
		$this.removeClass('bg-greyc').removeAttr('disabled');
		return noticeBox('请填写TA的姓名哦～')
	}
	if(!phone){
		$this.removeClass('bg-greyc').removeAttr('disabled');
		return noticeBox('请填写TA的手机号，方便我们礼品派送哦～ ')
	}
	if(!confession){
		$this.removeClass('bg-greyc').removeAttr('disabled');
		return noticeBox('请填上告白的内容吧～')
	}
	var data={
		name:name,
		phone:phone,
		type:type,
		confession:confession
	};
	var args={
		data:data
	};
	$.postJson(url,args,
		function(res){
			if(res.success)
			{
				$this.removeClass('bg-greyc').removeAttr('disabled');
				//noticeBox('发布成功');
				window.location.href="/lovewall/"+getCookie('market_shop_code');
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