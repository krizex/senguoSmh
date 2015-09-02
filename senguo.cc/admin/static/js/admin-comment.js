$(document).ready(function(){   
    //翻页
    var page=Int($.getUrlParam('page'));
    var action=$.getUrlParam('action');
    var total_page=Math.ceil($('.page-total').text());
    $('.page-now').text(page+1);
    $('.page-total').text(total_page);
    getPage(page,'/admin/comment?action='+action+'&&page=',total_page);
    //del status
    $('.del-com').each(function(){
        var $this=$(this);
        var status =$this.attr('data-status');
        if(status==0){
            $this.attr({'disabled':true}).text('申请中');
        }
        else if( status==2){
            $this.attr({'disabled':true}).text('申请拒绝');
        }
    });
    //init baguetteBox
    baguetteBox.run('.wrap-imgs',{
        buttons: false
    });
}).on("click","#contact-user",function(){
    $(".bs-del-com").modal("toggle");
}).on('click','.del-com',function(){
    var $this=$(this);
    var parent=$this.parents('li');
    var order_id=Int(parent.attr('data-id'));
    var index=parent.index();
    $(".bs-apply-com").attr({'data-id':order_id,'data-index':index});
}).on("click","#apply-senguo",function(){
    $(".bs-del-com").modal("hide");
    $(".bs-apply-com").modal('show');
}).on("click","#commit-senguo",function(){
    var $this=$(this);
     var delete_reason=$('#commit-cont').val();
    if(!delete_reason){
        return Tip('请输入您的理由！')
    }
    if(delete_reason.length>300){
         return Tip('最多可输入300字！')
    }
    applyDel(delete_reason);
}).on('click','.reply',function(){
       //回复
        var $this=$(this);
        var parent=$this.parents('li');
        order_id=Int(parent.attr('data-id'));
        item_index=parent.index();
        $('.reply-box').modal('show').attr({'data-id':item_index});
}).on('click','.reply-sure',function(){
        var index=$('.reply-box').attr('data-id');
        replay(order_id,index);
}).on('click','.collect',function(){
        //收藏
        var $this=$(this);
        var parent=$this.parents('li');
        order_id=Int(parent.attr('data-id'));
        collect($this,order_id);
});
   
    
var order_id;
var item_index;

function replay(id,index){
    var url='';
    var action='reply';
    var reply=$('.reply-content').val().trim();
    var args={
        order_id:id,
        action:action,
        reply:reply
    };
    $.postJson(url,args,function(res){
            if(res.success)
            {
                $('.reply-box').modal('hide');
                $('.comment-list-item').eq(index).find('.saler_reply').removeClass('hidden').find('.reply_word').text(reply);
            }
            else Tip(res.error_text);
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~')})
}

function collect(target,id){
    var url='';
    var action='favor';
    var args={
        order_id:id,
        action:action
    };
    $.postJson(url,args,function(res){
            if(res.success)
            {
                target.remove();
            }
            else Tip(res.error_text);
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~')})
}

function applyDel(delete_reason){
    $('#commit-senguo').attr({'disabled':true}).addClass('bg-greyc');
    var url='';
    var action='apply_delete_comment';
    var id=Int($(".bs-apply-com").attr('data-id'));
    var index=Int($(".bs-apply-com").attr('data-index'));
    var data={
        delete_reason:delete_reason
    };
    var args={
        order_id:id,
        data:data,
        action:action
    };
    $.postJson(url,args,function(res){
            if(res.success)
            {
                $(".bs-apply-com").modal('hide');
                $('.del-com').eq(index).attr({'disabled':true}).text('申请中');
                $('.del-box').eq(index).removeClass('hidden').find('.del-reason').text(delete_reason);   
                $('#commit-senguo').removeAttr('disabled').removeClass('bg-grey');
            }else {
                $('#commit-senguo').removeAttr('disabled').removeClass('bg-grey');
                Tip(res.error_text);
            }
        },
        function(){
            Tip('网络好像不给力呢~ ( >O< ) ~');
            $('#commit-senguo').removeAttr('disabled').removeClass('bg-grey');
        });
}