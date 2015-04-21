$(document).ready(function(){   
    //翻页
    $('.page-now').text(page+1);
    $('.page-total').text(total_page);
    var user_number=$('.comment-list-item').length;
    getpPage(page,'/admin/comment?action='+action+'page=',user_number);

}).on("click","#contact-user",function(){
    $(".bs-del-com").modal("toggle");
}).on('click','.del-com',function(){
    var $this=$(this);
    var parent=$this.parents('li');
    var order_id=Int(parent.attr('data-id'));
    $(".bs-apply-com").attr({'data-id':order_id});
}).on("click","#apply-senguo",function(){
    $(".bs-del-com").modal("hide");
    $(".bs-apply-com").modal('show');
}).on("click","#commit-senguo",function(){
    applyDel();
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
var page=Int($.getUrlParam('page'));
var action=Int($.getUrlParam('action'));
var total_page=Math.ceil($('.page-total').text());
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
            else alert(res.error_text);
        },
        function(){alert('网络好像不给力呢~ ( >O< ) ~')})
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
            else alert(res.error_text);
        },
        function(){alert('网络好像不给力呢~ ( >O< ) ~')})
}

function applyDel(target,id){
    var url='';
    var action='apply_delete_comment';
    var id=Int($(".bs-apply-com").attr('data-id'));
    var delete_reason=$('#commit-cont').val();
    if(!delete_reason){
        alert('请输入您的理由!')
    }
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
                alert('申请成功!')
            }
            else alert(res.error_text);
        },
        function(){alert('网络好像不给力呢~ ( >O< ) ~')})
}