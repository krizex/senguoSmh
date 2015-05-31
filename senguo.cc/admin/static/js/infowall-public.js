$(document).ready(function(){
    $('.select-list li').each(function(){
        $(this).on('click',function(){
            $(this).addClass('active').siblings().removeClass('active');
        });
    });
    $('.shareTo').on('click',function(){alert('点击右上方按钮分享到朋友圈！')});
    $('.collection-notice').on('click',function(){alert('您已收藏过该信息！')});
});


function collection(id,target){
    var url="/infowall/infoCollect";
    var args={
        info_id:id
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
        },function(){ return alert('网络错误！');}
);
}
