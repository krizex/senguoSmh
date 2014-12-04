$(document).ready(function(){
    $('#shopPage').on('click',function() {
        var url = $(this).attr('data-url');
        window.location.href = url + "?action=delivery";
    });//店铺设置页面跳转
});
function worMode(target){
    target.hide().siblings().show();
}


