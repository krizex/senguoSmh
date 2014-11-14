$(document).ready(function(){
    $('.collection-btn').on('click',function(){
        var id=parseInt($(this).parents('.info-detail').data('id'));
        var target=$(this);
        collection(id,target);
    });

    $('#commentPublic').on('click',function(){
        commit();
    });
});

function commit(){
    var info_id=$('.info-detail').data('id');
    var text=$('#commntEdit').val();
    var url="/infowall/infoDetail/comment";
    var args={
        info_id:info_id,
        text:text
    };
    $.postJson(url,args,function(res){
        if(res.success)
            {

            }

    });
}