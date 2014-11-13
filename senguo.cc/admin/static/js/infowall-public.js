$(document).ready(function(){
    $('.select-list li').each(function(){
        $(this).on('click',function(){
            $(this).addClass('active').siblings().removeClass('active');
        });
    });
});


function collection(id,target){
    var url="/infowall/infoCollect";
    var args={
        info_id:id,
        _xsrf: window.dataObj._xsrf
    };
    $.postJson(url,args,function(res){
           if(res.success)
           {
               alert('收藏成功！');
               var number=target.find('.number').text();
               if(number=='') number=0;
               target.find('.number').text(parseInt(number)+1);
           }
            else alert('网络错误');
        }
);
}