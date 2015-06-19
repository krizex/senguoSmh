/**
 * Created by Administrator on 2015/6/17.
 */
$(document).ready(function(){
    var width = $("#swiper-container").width();
    var height = $(window).height();
    $(".wrap-notice-box").css("minHeight",height);
    $(".swiper-wrapper").width(width*$(".swiper-slide").size());
    new Swiper('#swiper-container',{
        mode: 'horizontal',
        loop:true,
        grabCursor: true,
        pagination: '.pagination',
        autoplay:"3000",
        autoplayDisableOnInteraction:false
    });
});