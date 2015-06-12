$(document).ready(function(){
    //time($('.time'));
    $('.notice-bg').height($(window).height());
});
var wait=3;
function time(target) {
    if (wait == 0) {
        var link=$('.link').attr('href');
        window.location.href=link;
    }
    else {
        target.text(wait);
        wait--;
        setTimeout(function() {
                time(target)
            },
            800)
    }
}