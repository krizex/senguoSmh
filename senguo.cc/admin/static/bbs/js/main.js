/**
 * Created by Administrator on 2015/6/15.
 */
$(document).ready(function(){

    $("#bbs-menu").on("click",function(){
        $(".wrap-menu-list").toggleClass("h0");
    });
    $(".menu-list li").on("click",function(){
        var id = $(this).attr("data-id");
        $(".wrap-menu-list").addClass("h0");
    });
});