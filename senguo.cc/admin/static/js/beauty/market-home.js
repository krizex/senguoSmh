/**
 * Created by Administrator on 2015/6/17.
 */
$(document).ready(function(){
    var width = $("#swiper-container").width();
    var height = $(window).height();
    $(".groupt-list").height(height-86);
    $(".container").css("minHeight",height+"px");

    $(document).on("click","#menu",function(){
        if($("#groupt-list").hasClass("h0")){
            $(this).addClass("menu-active");
            $("#groupt-list").removeClass("h0");
            $(".groupt-list li").addClass("anim-bounceDown");
            $(".groupt-list li").one("webkitAnimationEnd",function(){
                $(this).removeClass("anim-bounceDown");
            });
        }else{
            $(this).removeClass("menu-active");
            $("#groupt-list").addClass("h0");
        }
    });
    $(document).on("click",".groupt-list li",function(){
        $("#menu").removeClass("menu-active");
        var index = $(this).index();
        $(".groupt-list li").removeClass("active").eq(index).addClass("active");
        $("#groupt-list").toggleClass("h0");
    });
    $(document).on("click",".furit-opera .add",function(){
        var $p = $(this).closest(".furit-opera");
        $p.children("span").removeClass("center");
        $p.children().removeClass("hidden");
    });
    $(document).on("click",".furit-opera .minus",function(){
        var $p = $(this).closest(".furit-opera");
        $p.children("span").addClass("center");
        $p.children("input").addClass("hidden");
        $(this).addClass("hidden");
    });
});