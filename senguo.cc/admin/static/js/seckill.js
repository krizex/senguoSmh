$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height+"px");
    $(document).on("click",".goback",function(){
        history.back();
    });

});