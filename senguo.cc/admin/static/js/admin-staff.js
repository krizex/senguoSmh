$(document).ready(function(){
    //编辑招募令内容
    $('.hire-form-submit').on('click',function(){
        var text=$('.recruit-content').val();
        hireConfig('','edit_hire_text',text);
    });
    //通过申请
    $('.accept-hire').on('click',function(){
        var $this=$(this);
        var id=$this.parents('.hire-form-item').data('id');
        hireConfig($this,'hire_agree',id);
    });
    //拒绝申请
    $('.reject-hire').on('click',function(){
        var $this=$(this);
        var id=$this.parents('.hire-form-item').data('id');
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

    $('.staffEdit').on('click',function(){
        var $this=$(this);
        staffEdit($this);
    });

    toggle('.staff-info','.staff-info-edit');
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
                target.parents('.manage-btn').find('.btn').hide();
                target.parents('.manage-btn').find('.status').removeClass('text-pink').addClass('text-green').text('通过');
            }
            else if(action=='hire_refuse')
            {
                target.parents('.manage-btn').find('.btn').hide();
                target.parents('.manage-btn').find('.status').removeClass('text-pink').addClass('text-grey').text('未通过');
            }
        }
        else return alert(res.error_text)
    },function(){return alert('网络错误！')}
    )
}

function staffEdit(target){
    var url='';
    var action='edit_staff';
    var parent=target.parents('.staff-info-detail');
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
    console.log(args);
    $.postJson(url,args,function(res){
        if(res.success){
            parent.hide();
        }
        else return alert(res.error_text)
    },function(){return alert('网络错误！')}
    );

}
