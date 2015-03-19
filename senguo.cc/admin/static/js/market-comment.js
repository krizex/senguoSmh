$(document).ready(function(){
    var item_url='/static/items/customer/comment-list-item.html?v=2015-02-02';
    getComment(item_url);
    $(document).on('click','#getMore',function(){
        var url='/customer/comment?page='+page;
        getMore(url);
        page++;
    });
});
var comments=window.dataObj.comments;
var page=1;

function getComment(url){
    $.getItem(url,function(data){
            window.dataObj.list_item=data;
            var comment=comments;
            commentItem(comment);
       }
    );
}

function getMore(url){
    $.getItem(url,function(data){
        var comment_list=data['date_list'];
        if(comment_list.length>0)
        {
            commentItem(comment_list);
        }
        else {
            $('#getMore').hide();
            $('.no-more').show();
        }
    })
}

function commentItem(comment_list){
    for(var i=0;i<comment_list.length;i++){
        var $item=$(window.dataObj.list_item);
        var img=comment_list[i]['img'];
        var name=comment_list[i]['name'];
        var time=comment_list[i]['time'];
        var comment=comments[i]['comment'];
        var reply=comments[i]['reply'];
        if(comment==''||comment==null){comment='无'}
        $item.find('.user-img').attr({'src':img});
        $item.find('.user-name').text(name);
        $item.find('.comment-time').text(time);
        $item.find('.comment-text').text(comment);
        if(reply!='' && reply!=null){$item.find('.reply-text').text(reply);}
        else $item.find('.comment').hide();
        $('#commnent-list').append($item);
    }
}