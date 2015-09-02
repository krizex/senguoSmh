$(document).ready(function(){
	//fastclick initialise
    FastClick.attach(document.body);
    $(".goback").on("click",function(){
        history.back();
    });
    var height = $(window).height();
    $(".container").css("minHeight",height-40+"px");
}).on("click",".developing",function(){
    return Tip("该功能正在开发中，客官不要急～");
});