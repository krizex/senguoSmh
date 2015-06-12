$(document).ready(function(){
    //添加公告
    $('.add-new-notice').on('click',function(){
        noticeAdd();
    });
    //公告启用状态显示
    $('.notice_active').each(function(){
        var $this=$(this);
        var status=$this.data('status');
        switch (status){
            case status=1:$this.find('.work-mode').show().siblings('.stop-mode').hide();break;
            case status=2:$this.find('.work-mode').hide().siblings('.stop-mode').show();break;
        }
    });
    //公告启用/停用
    $('.notice_active').on('click',function(){
        noticeActive($(this));
    });
    //公告编辑
    $('.notice_edit').on('click',function(){
        noticeEdit($(this));
    });
});
function noticeAdd(){
    var url=link;
    var action="add_notice";
    var summary=$('.new-notice-title').val();
    var detail=$('.new-notice-detail').val();
    if(summary.length>15){return Tip('摘要请不要超过15个字！')}
    if(detail.length>200){return Tip('详情请不要超过200个字！')}
    if(!summary){return Tip('请输入摘要！')}
    if(!detail){return Tip('请输入详情！')}
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
		window.location.reload();
            }
            else return Tip(res.error_text);
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~')});
}
function noticeEdit(target){
    var url=link;
    var action="edit_notice";
    var parent=target.parents('.set-list-item');
    var notice_id=parent.data('id');
    var summary=parent.find('.notice_summary').val();
    var detail=parent.find('.notice_detail').val();
    if(summary.length>15){return Tip('摘要请不要超过15个字！')}
    if(detail.length>200){return Tip('详情请不要超过200个字！')}
    if(!summary){return Tip('摘要不能为空！')}
    if(!detail){return Tip('详情不能为空！')}
    var data={
        notice_id:notice_id,
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
                parent.find('.notice_summary').val(summary);
                parent.find('.notice_detail').val(detail);
                parent.find('.summary').text(summary);
                parent.find('.detail').text(detail);
                parent.find('.address-edit').hide();
                parent.find('.address-show').show();
            }
            else return Tip(res.error_text);
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~')});
}

function noticeActive(target){
    var url=link;
    var action="edit_notice_active";
    var notice_id=target.parents('.set-list-item').data('id');
    var status=target.attr('data-status');
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
                    target.attr({'data-status':2});
                }
                else {
                    target.find('.work-mode').show().siblings('.stop-mode').hide();
                    target.attr({'data-status':1});
                }
            }
            else return Tip(res.error_text);
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~')});
}
