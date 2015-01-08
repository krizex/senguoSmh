$(document).ready(function(){
    $('.add-new-notice').on('click',function(){
        noticeAdd();
    });
    $('.notice_active').each(function(){
        var $this=$(this);
        var status=$this.data('status');
        switch (status){
            case status=1:$this.find('.work-mode').show().siblings('.stop-mode').hide();break;
            case status=2:$this.find('.work-mode').hide().siblings('.stop-mode').show();break;
        }
    });
    $('.notice_active').on('click',function(){
        noticeActive($(this));
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

function noticeActive(target){
    var url=link;
    var action="edit_notice_active";
    var notice_id=target.parents('.set-list-item').data('id');
    var status=target.data('status');
    var data={
        notice_id:notice_id
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                if(status==1){
                    target.find('.work-mode').hide().siblings('.stop-mode').show();
                }
                else target.find('.work-mode').show().siblings('.stop-mode').hide();
            }
        })
}