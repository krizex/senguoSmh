/**
 * Created by Administrator on 2015/5/27.
 */
$(document).ready(function(){
    var width = $("#swiper-container").width();
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