$(document).ready(function(){
    $('.info-edit').on('click',function(){
        //console.log(2333);
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
            Tip(notice);
            setTimeout(function() {
                window.location.href="/admin/config?action=admin";
            },2000);
        }
    }
    $('.func-mode').each(function(){
        var $this=$(this);
        var status=parseInt($this.attr('data-status'));
        if(status ==1){
            $this.addClass('work-mode').find('.text').text('订单提醒已启用');
        }else{
            $this.addClass('stop-mode').find('.text').text('订单提醒未启用');
        }
    });
    if($('.tpl-list')){
        var tpl_id=parseInt($('.tpl-list').attr('data-id'));
        $('.choose-btn').eq(tpl_id).addClass('active');
    }
    if($(".type-choose")){
        var type=parseInt($('.type-choose').attr('data-id'));
        $(".type-choose li").eq(type).addClass('active');
        if($(".wireless-type")){
            var text;
            if(type==0){
                text="易联云";
                $(".secket-key").show();
            }else if(type==1){
                text="飞印";
                $(".secket-key").hide();
            }
            $(".wireless-type").text(text);
        }
    }
}).on("click",".type-choose li",function(){
    $(this).addClass("active").siblings("li").removeClass("active");
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
                Tip(res.error_text);
            }
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~');}
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
                Tip(res.error_text);
            }
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~');}
        );
}).on('click','.online_active',function(){
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
                Tip(res.error_text);
            }
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~');}
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
                Tip(res.error_text);
            }
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~');}
        );
}).on('click','.add-admin',function(){
    $('.set-box').modal('show');
}).on('click','.delete-admin',function(){
    var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    if(confirm('是否确定删除该管理员？')){
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
                    return Tip(res.error_text);
                }
            },
            function(){$this.attr("data-flag","on");return Tip('网络好像不给力呢~ ( >O< ) ~');}
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
        return Tip('请输入用户id');
    }
    if(!regNumber.test(id)){
        $this.attr("data-flag","on");
        return Tip('请输入正确的用户id');
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
                                '</li>';
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
                    return Tip(res.error_text);
            }
        },
        function(){$this.attr("data-flag","on");Tip('网络好像不给力呢~ ( >O< ) ~');}
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
                window.location.href="/admin/wxauth";
            }else{
                $this.attr("data-flag","on");
                return Tip(res.error_text);
            }
        },
        function(){$this.attr("data-flag","on");Tip('网络好像不给力呢~ ( >O< ) ~');}
        );
}).on('click','.set-super-receive',function(){
    var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    var status = parseInt($this.attr('data-status'));
    var url='';
    var action="super_temp_active";
    var args={
        action:action,
        data:''
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $this.attr("data-flag","on");
                if(status==1){
                    $this.addClass('stop-mode').removeClass('work-mode').attr('data-status',0).find('.text').text('订单提醒未启用');
                }else{
                    $this.addClass('work-mode').removeClass('stop-mode').attr('data-status',1).find('.text').text('订单提醒已启用');
                }
            }else{
                $this.attr("data-flag","on");
                return Tip(res.error_text);
            }
        },
        function(){$this.attr("data-flag","on");Tip('网络好像不给力呢~ ( >O< ) ~');}
        );
}).on('click','.set-receive',function(){
    var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    var status =parseInt($this.attr('data-status'));
    var id =$this.parents('li').attr('data-id');
    var url='';
    var data={id:id};
    var action="admin_temp_active";
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $this.attr("data-flag","on");
                if(status==1){
                    $this.addClass('stop-mode').attr('data-status',0).find('.text').text('订单提醒未启用');
                }else{
                    $this.addClass('work-mode').removeClass('stop-mode').attr('data-status',1).find('.text').text('订单提醒已启用');
                    $this.parents('li').siblings('li').find('.set-receive').addClass('stop-mode').removeClass('work-mode').attr('data-status',0).find('.text').text('订单提醒未启用');
                }
            }
            else{
                $this.attr("data-flag","on");
                return Tip(res.error_text);
            }
        },
        function(){$this.attr("data-flag","on");Tip('网络好像不给力呢~ ( >O< ) ~');}
        );

}).on('click','.choose-btn',function(){
    var $this=$(this);
    if(confirm("确认切换商城模板吗？")){
        if($this.attr("data-flag")=="off") return false;
        $this.attr("data-flag","off");
        var id =$this.attr('data-id');
        var url='';
        var data={tpl_id:id};
        var action="tpl_choose";
        var args={
            action:action,
            data:data
        };
        $.postJson(url,args,
            function(res){
                if(res.success){
                    $this.attr("data-flag","on");
                    $this.addClass('active').parents('li').siblings('li').find('.choose-btn').removeClass('active');
                }
                else{
                    $this.attr("data-flag","on");
                    return Tip(res.error_text);
                }
            },
            function(){$this.attr("data-flag","on");Tip('网络好像不给力呢~ ( >O< ) ~');}
            ); 
    }
   
}).on('click','.pre-view',function(){
    var $this=$(this);
    $('.preview_box').modal('show');
    var src=$this.parents('li').find('.view-img').attr('src');
    $('#preview-img').attr('src',src);
}).on('click','.wx-edit',function(){
    $(".wx-edit-box").modal("show");
}).on("click",".wx-sure",function(){
     var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    var name=$("#AppName").val().trim();
    var id=$("#AppID").val().trim();
    var secret=$("#AppSecret").val().trim();
    var url='';
    var action="add_mp";
    var args={
        action:action,mp_name:name,mp_appid:id,mp_appsecret:secret
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $this.attr("data-flag","on");
                $(".name").text(name);
                $(".id").text(id);
                $(".secret").text(secret);
                $(".wx-edit-box").modal("hide");
            }
            else{
                $this.attr("data-flag","on");
                return Tip(res.error_text);
            }
        });
}).on('click','.comment_active',function(){
    var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    var status=Int($this.attr('data-status'));
    var url='/admin/config';
    var action="comment_active";
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
                Tip(res.error_text);
                $this.attr("data-flag","on");
            }
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~');}
        );
}).on('click','.mp_active',function(){
    var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    var status=Int($this.attr('data-status'));
    var url='/admin/config';
    var action="mp_active";
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
                Tip(res.error_text);
                $this.attr("data-flag","on");
            }
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~');}
        );
});
var link='/admin/config';