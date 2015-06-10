$(document).ready(function(){
	$("#searchKey").on("keyup",function(e){
        if($(this).val().trim()==""){
        }else{
           search($(this).val().trim());
        }
    });
}).on('click','#searchSubmit',function(){
    var search=$("#searchKey").val();
    if(!search){
        return noticeBox('请输入商品名称关键字');
    }
    window.location.href="/"+$('#shop_code').val()+"?search="+search;
}).on('click','.searchlist li',function(){
    var $this=$(this);
    var search=$this.text();
    window.location.href="/"+$('#shop_code').val()+"?search="+search;
});

function search(search){
	var url='';
    var args={
        search:search
    };
    $.postJson(url,args,function(res){
            if(res.success)
            {
                var data=res.data;
                $('.searchlist').empty();
                if(data.length==0){
                    $('.searchlist').append('<li class="text-center">无搜索结果</li>');
                }
                for(var i in data){
                    var name=data[i][0];
                    var item='<li>{{name}}</li>';
                    var render=template.compile(item);
                    var html=render({name:name});
                    $('.searchlist').append(html);
                }
              
            }
            else {
                noticeBox(res.error_text);
            }
        },
        function(){noticeBox('网络好像不给力呢~ ( >O< ) ~');},
        function(){noticeBox('服务器貌似出错了~ ( >O< ) ~');});
    
}