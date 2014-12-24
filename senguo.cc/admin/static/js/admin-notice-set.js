$(document).ready(function(){
    $('.add-new-notice').on('click',function(){
        noticeAdd();
    });
});
function noticeAdd(){
    var url=link;
    var action="add_notice";
    var summary=$('.new-notice-title').val();
    var detail=$('.new-notice-detail').val();
    if(!summary){return alert('请输入摘要！')}
    if(!detail){return alert('请输入详情！')}
    var data={
        summary:summary,
        detail:detail
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $('#noticeBox').modal('hide');
            }
        })
}