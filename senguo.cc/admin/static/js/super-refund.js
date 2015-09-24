$(document).ready(function(){

}).on('click','.refund-ok-btn',function(){
	if(confirm('该操作不可逆，请再次确认是否通过退款申请')){
		var data_id = $(this).attr('data-id');
		$.ajax({
			url : "",
			data:{apply_id:data_id,_xsrf:window.dataObj._xsrf,action:"confirm"},
			type:"post",
			success:function(res){
				if (res.success){
					alert('处理成功!');
					$(this).parents(".item").remove();
				}
				else{
					alert(res.error_text);
				}
			}
		})
	}
	
}).on("click",".refund-ignore-btn",function(){
	if(confirm('确认忽略该请求？')){
		var data_id = $(this).attr('data-id');
		$.ajax({
			url : "",
			data:{apply_id:data_id,_xsrf:window.dataObj._xsrf,action:"ignore"},
			type:"post",
			success:function(res){
				if (res.success){
					$(this).parents(".item").remove();
				}
				else{
					alert(res.error_text);
				}
			}
		});
	}
});
