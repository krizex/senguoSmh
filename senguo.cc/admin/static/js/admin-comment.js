$(document).ready(function(){
    $('.reply').each(function(){
        var $this=$(this);
        order_id=Int($this.parents('li').find('.order_id').text());
        $this.on('click',function(){
            $('.reply-box').modal('show');
        });
    });
    //回复
    $('.reply-sure').on('click',function(){
        replay(order_id);
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

function replay(id){
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
            }
            else alert(res.error_text);
        },
        function(){alert('网络错误')})
}