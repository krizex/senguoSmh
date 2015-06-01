$(document).ready(function(){
    var page=Int($.getUrlParam('page'));
    var user_type= $.getUrlParam('action');
    var total_page=Math.ceil($('.page-total').text());
    toggle('.show-info','.hide-info');
    //用户性别
    $('.user-sex').each(function(){
        var $this=$(this);
        var sex=$this.data('id');
        if(sex==2) $this.addClass('women');
        else $this.addClass('men');
    });
    //翻页
    $('.page-now').text(page+1);
    $('.page-total').text(total_page);
    var user_number=$('.users-list-item').length;
    getPage(page,'/admin/follower?action=all&&order_by=time&&page=',total_page);
    $('.search-btn').on('click',function(){
        var search=$('.search-con').val().trim();
        window.location.href='follower?action=search&&order_by=time&&page=0&&wd='+search;
    });
    $('.search-con').on('keydown',function(){
        var $this=$(this);
    	if(window.event.keyCode == 13)
        {
            var con=$('.search-con').val().trim();
            window.location.href='follower?action=search&&order_by=time&&page=0&&wd='+con;
        }
    });
    //导航active样式
    if(user_type=='all') $('.all_user').addClass('active');
    else if(user_type=='old') $('.old_user').addClass('active');
    else if(user_type=='charge') $('.charge_user').addClass('active');
}).on('click','.history-order',function(){
    // var $this=$(this);
    // window.open($this.attr('href'));
}).on('click','.remark-btn',function(){
    var $this=$(this);
    var id=$this.parents('li').attr('data-id');
    var index=$this.parents('li').index();
    $('.remark-box').modal('show').attr({'data-id':id,'data-index':index});
}).on('click','.remark-sure',function(){
    var $this=$(this);
     if($this.attr("data-flag")=="off") {
        return false;}
     $this.attr("data-flag","off");
    var id=$('.remark-box').attr('data-id');
    var index=$('.remark-box').attr('data-index');
    var remark=$('.remark-content').val().trim();
    if(!remark){
        $this.attr("data-flag","on");
        return Tip('请输入备注');
    }
    var url='';
    var action="remark";
    var data={
        id:id,
        remark:remark
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $this.attr("data-flag","on");
               $('.users-list-item').eq(index).find('.remark').removeClass('hidden').text('备注：'+remark);
               $('.remark-box').modal('hide');
            }
            else{
                $this.attr("data-flag","on");
                Tip(res.error_text);
            }
        },
        function(){
            $this.attr("data-flag","on");
            Tip('网络好像不给力呢~ ( >O< ) ~');}
        );
});
