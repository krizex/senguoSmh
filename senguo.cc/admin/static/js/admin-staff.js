$(document).ready(function(){
    //编辑招募令内容
    $('.hire-form-submit').on('click',function(){
        var text=$('.recruit-content').val();
        hireConfig('','edit_hire_text',text);
    });
    //通过申请
    $('.accept-hire').on('click',function(){
        var $this=$(this);
        var id=$this.parents('.hire-form').data('id');
        hireConfig($this,'hire_agree',id);
    });
    //拒绝申请
    $('.reject-hire').on('click',function(){
        var $this=$(this);
        var id=$this.parents('.hire-form').data('id');
        hireConfig($this,'hire_refuse',id);
    });
    //启用招募令
    $('#hire_config_on').on('click',function(){
        var $this=$(this);
        hireConfig('','edit_hire_on','');
        $this.hide().siblings('#hire_config_off').show();
        $this.parents('.mode-set').siblings('.mode-content').removeClass('lock-mode').addClass('unlock-mode').find('.lock').text('开启');
    });
    //停用招募令
    $('#hire_config_off').on('click',function(){
        var $this=$(this);
        hireConfig('','edit_hire_on','');
        $this.hide().siblings('#hire_config_on').show();
        $this.parents('.mode-set').siblings('.mode-content').removeClass('unlock-mode').addClass('lock-mode').find('.lock').text('关闭');
    });
    //员工备注添加
    $('.staffEdit').on('click',function(){
        var $this=$(this);
        staffEdit($this);
    });

    toggle('.staff-info','.staff-info-edit');
    //员工上下班
    var $mode=$('.staff-work-mode');
    var staff_active=$mode.data('id');
    if(staff_active==1){
        $mode.find('.work-mode').removeClass('hidden');
    }
    else $mode.find('.stop-mode').removeClass('hidden');
    $mode.on('click',function(){
        var $this=$(this);
        staffActive($this);
    });
    //取消编辑
    $('.concel-btn').on('click',function(){
        var $this=$(this);
        var $parent=$this.parents('.staff-list-item');
        $parent.find('.staff-info-edit').hide();
    });
});

function hireConfig(target,action,val){
    var url='';
    var action=action;
    var data={};
    if(action=='edit_hire_text')
    {
        data.hire_text=val;
    }
    else if(action=='hire_agree')
    {
        data.id=val;
    }
    else if(action=='hire_refuse')
    {
        data.id=val;
    }
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            $('.modal').modal('hide');
            if(action=='hire_agree')
            {
                target.parents('.staff-list-item').find('.hire-status').removeClass('bg-pink').addClass('bg-green').text('通过');
                target.parents('.staff-list-item').find('.action-btn').hide();
            }
            else if(action=='hire_refuse')
            {
                target.parents('.staff-list-item').find('.hire-status').removeClass('bg-pink').addClass('bg-grey').text('未通过');
                target.parents('.staff-list-item').find('.action-btn').hide();
            }
            target.parents('.staff-list-item').find('.staff-info-edit').hide();
        }
        else return alert(res.error_text)
    },function(){return alert('网络好像不给力呢~ ( >O< ) ~！')}
    )
}

function staffEdit(target){
    var url='';
    var action='edit_staff';
    var parent=target.parents('.staff-info-edit');
    var id=target.data('id');
    var remark=parent.find('.staff-remark').val();
    if(!remark) remark='';
    var data={
        staff_id:id,
        remark:remark
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            parent.hide();
            parent.parents('.staff-list-item').find('.info').append('<p>备注:'+remark+'</p>');
        }
        else return alert(res.error_text)
    },function(){return alert('网络好像不给力呢~ ( >O< ) ~！')}
    );

}

function staffActive(target){
    var url='';
    var action='edit_active';
    var parent=target.parents('.staff-list-item');
    var id=parent.data('id');
    var data={
        staff_id:id
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                target.find('.work-mode').toggleClass('hidden');
                target.find('.stop-mode').toggleClass('hidden');
            }
            else return alert(res.error_text)
        },function(){return alert('网络好像不给力呢~ ( >O< ) ~！')}
    );

}
