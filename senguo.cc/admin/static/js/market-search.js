$(document).ready(function(){
	$("#searchKey").on("keyup",function(e){
        if($(this).val().trim()==""){
        }else{
           search($(this).val().trim());
        }
    });
    $("#back").on("click",function(){
        history.go(-1);
    })
});

function search(search){
	var url='';
    var args={
        search:search
    };
    $.postJson(url,args,function(res){
            if(res.success)
            {
                nomore = res.nomore
                if(nomore == true){
                    $('.loading').html("~没有更多结果了 ( > < )~").show();
                }
              
            }
            else {
                noticeBox(res.error_text);
            }
        },
        function(){noticeBox('网络好像不给力呢~ ( >O< ) ~');},
        function(){noticeBox('服务器貌似出错了~ ( >O< ) ~');});
    
}