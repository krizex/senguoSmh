$(document).ready(function(){
    var item_url='/static/items/customer/comment-list-item.html';
    getComment(item_url);
    $('#getMore').on('click',function(){getComment(item_url);});
});
var comments=window.dataObj.comments;
function getComment(url){
    $.getItem(url,function(data){
        for(var i=0;i<comments.length;i++){
            var $item=$(data);
            var img=comments[i]['img'];
            var name=comments[i]['name'];
            var time=comments[i]['time'];
            var comment=comments[i]['comment'];
            if(comment==''||comment==null){comment='无'}
            $item.find('.user-img').attr({'src':img});
            $item.find('.user-name').text(name);
            $item.find('.comment-time').text(time);
            $item.find('.comment-text').text(comment);
            $('#commnent-list').append($item);
        }}
    );
}