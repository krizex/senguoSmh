$(document).ready(function(){
    var item_url='/static/items/customer/comment-list-item.html';
    getComment(item_url);
    $('#getMore').hammer().on('tap',function(){
        var url='/customer/comment?page='+page;
        getMore(url);
        page++;
    });
});
var comments=window.dataObj.comments;
var list_item;
var page=1;

function getComment(url){
    $.getItem(url,function(data){
            list_item=data;
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
        var $item=$(list_item);
        var img=comment_list[i]['img'];
        var name=comment_list[i]['name'];
        var time=comment_list[i]['time'];
        var comment=comments[i]['comment'];
        if(comment==''||comment==null){comment='无'}
        $item.find('.user-img').attr({'src':img});
        $item.find('.user-name').text(name);
        $item.find('.comment-time').text(time);
        $item.find('.comment-text').text(comment);
        $('#commnent-list').append($item);
    }
}