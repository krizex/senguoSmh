$(document).ready(function(){

}).on('click','#phoneLogin',function(){
	var url='';
	var phone=$('#phone').val().trim();
	var password=$('#password').val().trim();
	password=CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
	var args={
		phone: phone,
		password:password

	};
	$.postJson(url,args,function(res){
		if(res.success){
			console.log(23333);
		}
		else return noticeBox(res.error_text);
	}, 
	function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
	function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
	);
});