$(document).ready(function(){
    $('.collection-btn').on('click',function(){
        var id=parseInt($(this).parents('.info-detail').data('id'));
        var target=$(this);
        collection(id,target);
    });

    $('#commentPublic').on('click',function(){
        commit();
    });
});

function commit(){
    var info_id=$('.info-detail').data('id');
    var text=$('#commntEdit').val().trim();
    var url="/infowall/infoDetail/comment";
    var args={
        info_id:info_id,
        text:text
    };
    if(!text){return alert('请输入您的评论！');}
    if(text.length>100){return alert('评论请不要超过100个字！')}
    $.postJson(url,args,function(res){
        if(res.success)
            {
                var c=document.getElementById('commentNumber');
                var t= parseInt(c.innerHTML);
                c.innerHTML=t+1;
                var comments=res.comment;
                for(var comment_item in comments)
                {
                    var headImg=comments[comment_item]['admin']['accountinfo']['headimgurl'];
                    var nickname=comments[comment_item]['admin']['accountinfo']['nickname'];
                    var comment=comments[comment_item]['text'];
                    var $list=$('<li class="row"><span class="col-xs-2 col-sm-1"><img src="" class="head-img"/></span><span class="col-xs-10 col-sm-11"><span class="nickname pull-left"><span class="name"></span>:</span><div class="comment pull-left"></div></span></li>');
                    $list.find('.head-img').attr({'src':headImg});
                    $list.find('.name').text(nickname);
                    $list.find('.comment').text(comment);
                    $('.comment-list ul').append($list);
                }
                $('#commentPublic').parents('.comment-box').modal('hide');
            }
        else return alert('网络错误！');
    },function(){ return alert('网络错误！');});
}