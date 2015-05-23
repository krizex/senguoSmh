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
    if($.getUrlParam('action')=='admin' && $.getUrlParam('status')=='fail'){
        var notice=$('.add-admin').attr('data-notice');
        if(notice!=''){
            return alert(notice);
        }
    }
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
    /*alert("当前此功能还未开放，请等待...");
    return false;*/
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
}).on('click','.add-admin',function(){
    $('.set-box').modal('show');
}).on('click','.delete-admin',function(){
     var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    if(confirm('是否确定删除该管理员?')){
        var id =$this.parents('li').attr('data-id');
        var url='';
        var data={id:id};
        var action="delete_admin";
        var args={
            action:action,
            data:data
        };
        $.postJson(url,args,
            function(res){
                if(res.success){
                    $this.attr("data-flag","on");
                    $this.parents('li').remove();
                }
                else{
                        $this.attr("data-flag","on");
                        return alert(res.error_text);
                }
            },
            function(){$this.attr("data-flag","on");alert('网络好像不给力呢~ ( >O< ) ~');}
            );
    }
    else{
        $this.attr("data-flag","on");
    }
}).on('click','.user-search',function(){
    var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    var id =$('.search-user').val().trim();
     if(!id){
        $this.attr("data-flag","on");
        return alert('请输入用户id');
    }
    if(!regNumber.test(id)){
        $this.attr("data-flag","on");
        return alert('请输入正确的用户id');
    }
    var url='';
    var data={id:id};
    var action="search_user";
    var args={
        action:action,
        data:data
    };
    $('.user-list').empty();
    $.postJson(url,args,
        function(res){
            if(res.success){
                $this.attr("data-flag","on");
                var item='<li data-id="{{id}}" class="font14">'+
                                    '<span class="pull-left"><img src="{{imgurl}}" class="img"/></span>'+
                                    '<div class="pull-left">'+
                                        '<span class="name pull-left">{{nickname}}</span>'+
                                    '</div>'+
                                    '<a class="add_admin pull-left" href="javascript:;">+添加</a>'+
                                '</li>'
                var imgurl=res.data[0]['imgurl'];
                var nickname=res.data[0]['nickname'];
                var render=template.compile(item);
                var content =render({
                    id:id,
                    imgurl:imgurl,
                    nickname:nickname
                });
                $('.user-list').append(content);
            }
            else{
                    $this.attr("data-flag","on");
                    return alert(res.error_text);
            }
        },
        function(){$this.attr("data-flag","on");alert('网络好像不给力呢~ ( >O< ) ~');}
        );
}).on('click','.add_admin',function(){
    var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    var id =$this.parents('li').attr('data-id');
    var url='';
    var data={id:id};
    var action="add_admin";
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $this.attr("data-flag","on");
                if(confirm('是否添加该用户为店铺管理员？点击确定后请使用超级管理员微信进行二维码扫描')){
                    window.location.href="/admin/wxauth";
                }
            }else{
                    $this.attr("data-flag","on");
                    return alert(res.error_text);
            }
        },
        function(){$this.attr("data-flag","on");alert('网络好像不给力呢~ ( >O< ) ~');}
        );
});
var link='/admin/config';