/**
 * Created by Administrator on 2015/7/6.
 */
$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height-40+"px");
}).on("click","#qa",function(){
    $(this).addClass("hide");
    $(".pop-bwin").removeClass("hide");
}).on("click","#close-pop",function(){
    $("#qa").removeClass("hide");
    $(".pop-bwin").addClass("hide");
});