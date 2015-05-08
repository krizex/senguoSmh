$(document).ready(function(){
    $('.info-edit').on('click',function(){
        var $this=$(this);
        $this.parents('.set-list-item').find('.address-show').hide();
        $this.parents('.set-list-item').find('.address-edit').show();
    });
    $('.action-mode').each(function(){
        var $this=$(this);
        var status=$this.data('status');
        if(status==1)
            $this.find('.work-mode').show();
        else $this.find('.stop-mode').show();

    });
}).on('click','.cash_active',function(){
    var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    var status=Int($this.attr('data-status'));
    var url='';
    var action="cash_on";
    var args={
        action:action,
        data:''
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $this.attr("data-flag","on");
                if(status==1){
                    $this.attr({'data-status':0}).find('.stop-mode').show().siblings('.work-mode').hide();
                }
                else if(status == 0){
                    $this.attr({'data-status':1}).find('.stop-mode').hide().siblings('.work-mode').show();
                }
            }
            else{
                    alert(res.error_text);
            }
        },
        function(){alert('网络好像不给力呢~ ( >O< ) ~');}
        );
}).on('click','.balance_active',function(){
    var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    var status=Int($this.attr('data-status'));
    var url='';
    var action="balance_on";
    var args={
        action:action,
        data:''
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $this.attr("data-flag","on");
                if(status==1){
                    $this.attr({'data-status':0}).find('.stop-mode').show().siblings('.work-mode').hide();
                }
                else if(status == 0){
                    $this.attr({'data-status':1}).find('.stop-mode').hide().siblings('.work-mode').show();
                }
            }
            else{
                    alert(res.error_text);
            }
        },
        function(){alert('网络好像不给力呢~ ( >O< ) ~');}
        );
}).on('click','.online_active',function(){
    alert("当前此功能还未开放，请等待...");
    return false;
    var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    var status=Int($this.attr('data-status'));
    var url='';
    var action="online_on";
    var args={
        action:action,
        data:''
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $this.attr("data-flag","on");
                if(status==1){
                    $this.attr({'data-status':0}).find('.stop-mode').show().siblings('.work-mode').hide();
                }
                else if(status == 0){
                    $this.attr({'data-status':1}).find('.stop-mode').hide().siblings('.work-mode').show();
                }
            }
            else{
                alert(res.error_text);
            }
        },
        function(){alert('网络好像不给力呢~ ( >O< ) ~');}
    );
}).on('click','.message_active',function(){
    var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    var status=Int($this.attr('data-status'));
    var url='';
    var action="text_message_on";
    var args={
        action:action,
        data:''
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $this.attr("data-flag","on");
                if(status==1){
                    $this.attr({'data-status':0}).find('.stop-mode').show().siblings('.work-mode').hide();
                }
                else if(status == 0){
                    $this.attr({'data-status':1}).find('.stop-mode').hide().siblings('.work-mode').show();
                }
            }
            else{
                    alert(res.error_text);
            }
        },
        function(){alert('网络好像不给力呢~ ( >O< ) ~');}
        );
});
var link='/admin/config';