$(document).ready(function(){
    //订单状态
    $('.order-status').each(function(){
        var $word=$(this).find('.word');
        var text=Int($word.text());
        statusText($word,text);
    });
    //送货时间
    var date=new Date();
    var year=date.getFullYear();
    var month=date.getMonth()+1;
    var day=date.getDate();
    $('.order-list-item').each(function(){
        var $this=$(this);
        var create_time=$this.find('.create_time').val();
        var create_year=$this.find('.create_year').val();
        var create_month=$this.find('.create_month').val();
        var create_day=Int($this.find('.create_day').val());
        var send_day=$this.find('.send_day').val();
        var status=$this.find('.order_status').val();
        if(send_day==1){ 
            if(create_year==year&&create_month==month&&create_day==day) $this.find('.send_date').text('今天');
            else $this.find('.send_date').hide();
            if(status==5){
                $this.find('.send_date').text(create_year+'-'+create_month+'-'+create_day);
                $this.find('.un-arrive').text('已送达');
                $this.find('.status_notice').text('已送达').addClass('text-green');
            }
            else if(status==6){
                $this.find('.send_date').text(create_year+'-'+create_month+'-'+create_day);
                $this.find('.un-arrive').text('已送达');
                $this.find('.status_notice').text('已评价').addClass('text-green');
            }
        }
        else if(send_day==2){
            if(create_year==year&&create_month==month&&create_day+1==day) $this.find('.send_date').text('今天');
            else if(create_year==year&&create_month==month&&create_day==day) $this.find('.send_date').text('明天');//下单模式选择了“明天”，但是日期到了“明天”的情况
            else $this.find('.send_date').hide();
            if(status==5){
                $this.find('.send_date').text(create_year+'-'+create_month+'-'+(create_day+1));
                $this.find('.un-arrive').text('已送达');
                $this.find('.status_notice').text('已送达').addClass('text-green');
            }
            else if(status==6){
                $this.find('.send_date').text(create_year+'-'+create_month+'-'+(create_day+1));
                $this.find('.un-arrive').text('已送达');
                $this.find('.status_notice').text('已评价').addClass('text-green');
            }
        }
    });
    //取消订单
    $('.order-concel').each(function() {
        var $this = $(this);
        var id=$this.parents('.order-list-item').data('id');
        $this.on('click', function () {
            orderConcel($this,id);
        });
    });
    //评价
    var index;
    var comment_order_id;
    $('.comment-btn').each(function(){
        var $this = $(this);
        $this.on('click', function () {
            var commentBox=new Modal('commentBox');
           commentBox.modal('show');
            index=$this.parents('.order-list-item').index();
            comment_order_id=$this.parents('.order-list-item').data('id');
        });

    });
    $(document).on('click','.comment_submit', function () {
        var comment=$('.comment-input').val();
        orderComment(index,comment_order_id,comment);
    });
    //导航active
    var link_action= $.getUrlParam('action');
    $('.order-nav li').each(function(){
        var $this=$(this);
        var action=$this.data('action');
        if(action==link_action){
            $this.addClass('active');
        }
    });
    removeDom();
});
var order_href='/customer/orders';
function statusText(target,n){
    switch (n){
        case 0:target.text('已取消').addClass('text-grey');break;
        case 1:target.text('已下单').addClass('text-green');break;
        case 4:target.text('配送中').addClass('text-green');break;
        case 5:target.text('已送达').addClass('text-grey');break;
        case 6:target.text('已评价').addClass('text-grey');break;
    }
}

function orderConcel(target,id){
    var url=order_href;
    var action='cancel_order';
    var data={
        order_id:id
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            target.parents('.order-list-item').find('.status-bar-box').hide();
            target.parents('.order-list-item').find('.send-time').hide();
            target.parents('.order-list-item').find('.cancel').text('订单已取消').addClass('text-grey').removeClass('order-concel');
        }
        else return alert(res.error_text)
    },function(){return alert('网络错误！')})
}

function orderComment(id,order_id,comment){
    var url=order_href;
    var action='comment';
    if(!comment){return alert('请输入您的评论！')}
    var data={
        order_id:order_id,
        comment:comment
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
           var parent=$('.order-list-item').eq(id);
           parent.find('.btn-box').remove();
           parent.find('.notice').text('已送达');
           parent.find('.content').append('<p>评价：'+comment+'</p>');
           var commentBox=new Modal('commentBox');
           commentBox.modal('hide');
        }
        else return alert(res.error_text)
    },function(){return alert('网络错误！')})
}

function removeDom(){
    $('.create_time').remove();
    $('.create_year').remove();
    $('.create_month').remove();
    $('.create_day').remove();
    $('.send_day').remove();
    $('.order_status').remove();
}
