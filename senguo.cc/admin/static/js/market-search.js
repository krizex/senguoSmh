$(document).ready(function(){
	$("#searchKey").on("keyup",function(e){
        if($(this).val().trim()==""){
        }else{
           
        }
    });
    $("#back").on("click",function(){
        history.go(-1);
    })
});

function search(){
	var url='';
    var action = action;
    var args={
        action:action,
        page:page
    };
    if(action==6){
        args.group_id = _group_id;
    }
    if(action==9){
        args.search = _search;
    }
    // alert('i am here');
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
    var initData=function(data){
        var data=data;
        for(var key in data){
            if(action==5){
                $('.classify-'+data[key]['group_id']).removeClass('hidden');
            }
            fruitItem($('.goods-list-'+data[key]['group_id']),data[key]);//fruits information
        }
        var fruits=window.dataObj.fruits;
        var c_fs=[];
        for(var key in fruits){
            c_fs.push([key,fruits[key]]);
        };
        cartNum(c_fs,'.fruit-list');
        window.dataObj.count++;
        window.dataObj.finished=true;
    }
};
}