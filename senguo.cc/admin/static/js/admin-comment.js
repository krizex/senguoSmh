$(document).ready(function(){
    $('.reply').each(function(){
        var $this=$(this);
        var parent=$this.parents('li');
        order_id=Int(parent.find('.order_id').text());
        $this.on('click',function(){
            item_index=parent.index();
            $('.reply-box').modal('show').data({'id':item_index});
        });

    });
    //回复
    $('.reply-sure').on('click',function(){
        var index=$('.reply-box').data('id');
        replay(order_id,index);
    });
    //翻页
    $('.page-now').text(page+1);
    $('.page-total').text(totalt_page);
    var user_number=$('.comment-list-item').length;
    getpPage(page,'/admin/comment?page=',user_number);

});
var order_id;
var page=Int($.getUrlParam('page'));
var totalt_page=Math.ceil($('.page-total').text());
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
                $('.comment-list-item').eq(index).find('.reply_word').text(reply);
            }
            else alert(res.error_text);
        },
        function(){alert('网络错误')})
}