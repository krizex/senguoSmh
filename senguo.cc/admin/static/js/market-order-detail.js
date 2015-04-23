$(document).ready(function(){
    //订单状态
    $('.status').each(function(){
        var $this=$(this);
        var status=Int($this.attr('data-id'));
        statusText($this,status);
    });
    //根据订单状态的一些提示
    if(status==1) $('.hint').show();
    else $('.phone-notice').show();
    //送货时间
    var date=new Date();
    var year=date.getFullYear();
    var month=date.getMonth()+1;
    var day=date.getDate();
    var create_time=$('.create_time').val();
    var create_year=$('.create_year').val();
    var create_month=$('.create_month').val();
    var create_day=Int($('.create_day').val());
    var send_day=$('.send_day').val();
    if(send_day==1){
        if(create_year==year&&create_month==month&&create_day==day) $('.send_date').text('今天');
        else $('.send_date').hide();
        if(status==5||status==6){
            $('.send_date').text('');
        }
    }
    else if(send_day==2){
        if(create_year==year&&create_month==month&&create_day+1==day) $('.send_date').text('今天');
        else if(create_year==year&&create_month==month&&create_day==day) $('.send_date').text('明天');//下单模式选择了“明天”，但是日期到了“明天”的情况
        else $('.send_date').hide();
        if(status==5||status==6){
            $('.send_date').text('');
        }
    }
    removeDom();
}).on("click","#change-comment",function(){
    var pointBox=new Modal('pointsBox');
    pointBox.modal('show');
}).on("click","#del-ok",function(){
    var comment=$('#new-comment').val();
    if(!comment){
        return noticeBox('请输入评论内容');
    }
    if(comment.length>300){
        return noticeBox('至多可以评论300字!');
    }
    $('#del-ok').attr({'disabled':true});
    changeComment(comment);
});
function removeDom(){
    $('.create_time').remove();
    $('.create_year').remove();
    $('.create_month').remove();
    $('.create_day').remove();
    $('.send_day').remove();
}
function statusText(target,n){
    switch (n){
        case 0:target.text('已取消');break; 
        case 1:target.text('已下单');break;
        case 4:target.text('配送中');break;
        case 5:target.text('已送达');break;
        case 6:target.text('已评价');break;
    }
}


function changeComment(comment){
    var url='';
    var action='change_comment';
    var id=$('.order-id').data('id');
    var data={
        order_id:id,
        comment:comment
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
           var pointBox=new Modal('pointsBox');
            pointBox.modal('hide');
            $('.comment_con').text(comment);
            $('#del-ok').removeAttr('disabled');
        }
        else return noticeBox(res.error_text)
    }, function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
)
}


function delComment(target,id){
    var url='';
    var action='delete_comment';
    var id=$('.order-id').data('id');
    var data={
        order_id:id
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
           var pointBox=new Modal('pointsBox');
            pointBox.modal('hide');
            $('.commentBox').remove();
        }
        else return noticeBox(res.error_text)
    }, function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
)
}