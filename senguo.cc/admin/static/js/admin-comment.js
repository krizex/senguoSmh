$(document).ready(function(){
    $(document).on('click','.reply',function(){
        var $this=$(this);
        var parent=$this.parents('li');
        order_id=Int(parent.find('.order_id').text());
        item_index=parent.index();
        $('.reply-box').modal('show').attr({'data-id':item_index});
    });
    //回复
    $(document).on('click','.reply-sure',function(){
        var index=$('.reply-box').attr('data-id');
        replay(order_id,index);
    });
    //收藏
    $(document).on('click','.collect',function(){
        var $this=$(this);
        var parent=$this.parents('li');
        order_id=Int(parent.find('.order_id').text());
        collect($this,order_id);
    });
    //翻页
    $('.page-now').text(page+1);
    $('.page-total').text(total_page);
    var user_number=$('.comment-list-item').length;
    getpPage(page,'/admin/comment?action='+action+'page=',user_number);

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
        function(){alert('网络错误')})
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
        function(){alert('网络错误')})
}
