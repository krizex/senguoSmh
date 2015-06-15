/**
 * Created by Administrator on 2015/6/12.
 */
var curStaff = null,startX = 0,startY = 0,width = 0;
$(document).ready(function(){
    width = $(window).width();
    var minheight = $(window).height()-70;
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
        swiper.swipeTo(index);
    });
    $(".order-grade .task-staff").on("click",function(){
        curStaff = $(this).closest(".order-grade");
        $(".pop-staff").removeClass("hide");
    });
    $(".staff-list>li").on("click",function(){
        var index = $(this).index();
        var src = $(this).find("img").attr("src");
        $("#sure-staff").attr("data-src",src);
        $("#sure-staff").attr("data-tel",$(this).attr("data-tel"));
        $(".staff-list>li").removeClass("active").eq(index).addClass("active");
    });
    $("#sure-staff").on("click",function(){
        var tel = $(this).attr("data-tel");
        curStaff.find("img").attr("src",$(this).attr("data-src"));
        curStaff.find(".order-line-grade").css("width","50%");
        curStaff.find(".order-wawa").css("left","50%");
        curStaff.find(".order-wawa").children("a").removeClass("task-staff");
        curStaff.find(".order-status-txt").css("left","50%");
        curStaff.find(".order-status-txt").empty().append('<span class="#c333">配送中</span><a class="" href="tel:'+tel+'">拨号</a>');
       $(".pop-staff").addClass("hide");
    });
    $(window).scroll(function(){
        console.log(333);
    });
    $(".swiper-wrapper").width(width*$(".swiper-slide").size());
    $(".swiper-slide").css({minHeight:minheight+"px"});
    var swiper = new Swiper('#swiper-container',{
        mode: 'horizontal',
        grabCursor: true,
        resistance:"100%",
        autoplayDisableOnInteraction:false,
        onSlideChangeEnd:function(swiper){
            var index = swiper.activeIndex;
            $(".second-tab-list .tab-line").css("left",$(".second-tab-list").children(".item").eq(index).position().left);
        }
    });
});
/*function initEvent(obj){
    initEvent($("#order-lists")[0]);
    obj.addEventListener('touchstart', function (ev) {
        //ev.preventDefault();
        startX = ev.touches[0].pageX;
        startY = ev.touches[0].pageY;
    }, false);
    obj.addEventListener('touchmove', function (ev) {
        //ev.preventDefault();
        var moveX,moveY;
        moveX = ev.touches[0].pageX;
        moveY = ev.touches[0].pageY;
        if(startX>50 && startX<width-50){
            return false;
         }
        var direction = touch.getSlideDirection(startX, startY, moveX, moveY);
        switch (direction) {
            case 3:   //左
                console.log("后一页");
                break;
            case 4:   //右
                console.log("前一页");
                break;
        }
    }, false);
    obj.addEventListener('touchend', function (ev) {
        //ev.preventDefault();
    }, false);
}*/