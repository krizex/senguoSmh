$(document).ready(function(){
    toggle('.staff-info','.staff-info-edit');
    //员工上下班
   $('.staff-work-mode').each(function(){
        var $this=$(this);
        var staff_active=Int($this.attr('data-id'));
        if(staff_active==1){
            $this.find('.work-mode').removeClass('hidden');
        }
        else 
            {
                $this.find('.stop-mode').removeClass('hidden');
            }
   });
   $('.default-staff').each(function(){
        var $this=$(this);
        var active=Int($this.attr('data-id'));
        if(active==1){
            $this.addClass('work-mode').removeClass('stop-mode');
        }
        else 
            {
                $this.addClass('stop-mode').removeClass('work-mode');
            }
   });
}).on('click','.check-order',function(e){
    /*var $this=$(this);
    e.stopPropagation();
    return false;*/
    //window.open($this.attr('href'));
}).on('click','#hire_config_on',function(){
     //启用招募令
        var $this=$(this);
        hireConfig('','edit_hire_on','');
        $this.hide().siblings('#hire_config_off').show();
        $this.parents('.mode-set').siblings('.mode-content').removeClass('lock-mode').addClass('unlock-mode').find('.lock').text('开启');
}).on('click','#hire_config_off',function(){
         //停用招募令
        var $this=$(this);
        hireConfig('','edit_hire_on','');
        $this.hide().siblings('#hire_config_on').show();
        $this.parents('.mode-set').siblings('.mode-content').removeClass('unlock-mode').addClass('lock-mode').find('.lock').text('关闭');
}).on('click','.staff-work-mode',function(){
        var $this=$(this);
        var staff_active=Int($this.attr('data-id'));
        var default_staff=Int($this.siblings('.default-staff').attr('data-id'));
        if(staff_active == 1){
            if($this.parents('.staff-list-item').index()==0){
                alert('管理员不可设置为下班状态');
                return false;
            }
            if(default_staff==1){
                alert('请先取消该员工的默认员工状态，再让设置该员工为下班');
                return false;
            }
        }
        staffActive($this,staff_active); 
}).on('click','.concel-btn',function(){
        //取消编辑
        var $this=$(this);
        var $parent=$this.parents('.staff-list-item');
        $parent.find('.staff-info-edit').hide();
}).on('click','.staffEdit',function(){
        //员工备注添加
        var $this=$(this);
        staffEdit($this);
}).on('click','.hire-form-submit',function(){
        //编辑招募令内容
        var text=$('.recruit-content').val();
        hireConfig('','edit_hire_text',text);
}).on('click','.accept-hire',function(){
         //通过申请
        var $this=$(this);
        var id=$this.parents('.hire-form').data('id');
        hireConfig($this,'hire_agree',id);
}).on('click','.reject-hire',function(){
        //拒绝申请
        var $this=$(this);
        var id=$this.parents('.hire-form').data('id');
        hireConfig($this,'hire_refuse',id);
}).on('click','.default-staff',function(){
        var $this=$(this); 
        var default_staff = Int($this.attr('data-id'));
        var staff_active=Int($this.siblings('.staff-work-mode').attr('data-id'));
        if(default_staff==0&&staff_active == 2){
            alert('请先设置该员工为上班，才能设置该员工为默认员工');
            return false;
        }
        defaultStaff($this,default_staff);
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
                if(target){
                    target.parents('.staff-list-item').find('.hire-status').removeClass('bg-pink').addClass('bg-green').text('通过');
                    target.parents('.staff-list-item').find('.action-btn').hide();
                }
            }
            else if(action=='hire_refuse')
            {
                if(target){
                    target.parents('.staff-list-item').find('.hire-status').removeClass('bg-pink').addClass('bg-grey').text('未通过');
                    target.parents('.staff-list-item').find('.action-btn').hide();
                }
            }
            else if(action == 'edit_hire_text'){
                if(target){
                target.parents('.staff-list-item').find('.staff-info-edit').hide();
                }
            }
            
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
            parent.parents('.staff-list-item').find('.remark_con').remove();
            parent.parents('.staff-list-item').find('.info').append('<p class="remark_con">备注：'+remark+'</p>');
        }
        else return alert(res.error_text)
    },function(){return alert('网络好像不给力呢~ ( >O< ) ~！')}
    );

}

function staffActive(target,active){
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
                if(active==1){
                    target.attr({'data-id':2});
                }
                else{
                    target.attr({'data-id':1});
                }
                target.find('.work-mode').toggleClass('hidden');
                target.find('.stop-mode').toggleClass('hidden');
            }
            else return alert(res.error_text)
        },function(){return alert('网络好像不给力呢~ ( >O< ) ~！')}
    );

}

function defaultStaff(target,active){
    var url='';
    var action='default_staff';
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
                if(active==1){
                    target.attr({'data-id':0});
                }
                else{
                    target.attr({'data-id':1});
                }
                target.toggleClass('stop-mode').toggleClass('work-mode'); 
                target.parents('.staff-list-item').siblings('.staff-list-item').find('.default-staff').addClass('stop-mode').removeClass('work-mode'); 
            }
            else return alert(res.error_text)
        },function(){return alert('网络好像不给力呢~ ( >O< ) ~！')}
    );

}
