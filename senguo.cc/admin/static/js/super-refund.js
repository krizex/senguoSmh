$(document).ready(function(){

}).on('click','.refund-ok-btn',function(){
	var data_id = $(this).attr('data-id');
	$.ajax({
		url : "",
		data:{apply_id:data_id,_xsrf:window.dataObj._xsrf},
		type:"post",
		success:function(res){
			if (res.success){
				console.log('确定成功!');
			}
			else{
				alert(res.error_text);
			}
		}

	})
})