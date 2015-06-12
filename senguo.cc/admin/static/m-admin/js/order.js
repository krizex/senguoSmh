/**
 * Created by Administrator on 2015/6/12.
 */
var curStaff = null;
$(document).ready(function(){
    $(".pop-win").on("click",function(e){
        if($(e.target).closest(".pop-content").length==0){
            $(".pop-win").addClass("hide");
        }
    })
    $(".order-type-list .item").on("click",function(){
        var index = $(this).index();
        $(".order-type-list .item").removeClass("active").eq(index).addClass("active");
        $(".order-type-list .tab-bg").css("left",33.3*index+"%");
    });
    $(".second-tab-list .item").on("click",function(){
        var index = $(this).index();
        //$(".second-tab-list .item").removeClass("active").eq(index).addClass("active");
        $(".second-tab-list .tab-line").css("left",$(this).position().left);
    });
    $(".order-grade .task-staff").on("click",function(){
        curStaff = $(this).closest(".order-grade");
        $(".pop-staff").removeClass("hide");
    });
    $(".staff-list>li").on("click",function(){
        var index = $(this).index();
        var src = $(this).find("img").attr("src");
        $("#sure-staff").attr("data-src",src);
        $(".staff-list>li").removeClass("active").eq(index).addClass("active");

    });
    $("#sure-staff").on("click",function(){
        curStaff.find("img").attr("src",$(this).attr("data-src"));
       $(".pop-staff").addClass("hide");
    });
});