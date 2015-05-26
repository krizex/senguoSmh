$(document).ready(function(){   
    //翻页
    var page=Int($.getUrlParam('page'));
    var action=$.getUrlParam('action');
    var total_page=Math.ceil($('.page-total').text());
    $('.page-now').text(page+1);
    $('.page-total').text(total_page);
    getPage(page,'/admin/confession?action='+action+'&&page=',total_page);
}).on('click','.del-com',function(){
    var $this=$(this);
    if(confirm('确认删除该条告白吗？')){
        $this.attr({'disabled':true}).addClass('bg-grey');
        var parent=$this.parents('li');
        var id=Int(parent.attr('data-id'));
        var url='';
        var action='del_confess';
        var data={
            id:id
        };
        var args={
            data:data,
            action:action
        };
        $.postJson(url,args,function(res){
                if(res.success)
                {
                    parent.remove();
                }
                else {
                    $this.removeAttr('disabled').removeClass('bg-grey');
                    alert(res.error_text);
                }
            },
            function(){
                alert('网络好像不给力呢~ ( >O< ) ~');
                $this.removeAttr('disabled').removeClass('bg-grey');
            });
        }
});
