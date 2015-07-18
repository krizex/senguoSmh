var swiper = null;
$(document).ready(function(){
    swiper = new Swiper('#swiper-container',{
        mode: 'horizontal',
        loop:true,
        grabCursor: true,
        pagination: '.pagination',
        autoplay:"3000",
        speed:'600',
        autoplayDisableOnInteraction:false,
        paginaClickable:true
    });
}).on("mouseover",".swiper-container",function(){
    swiper.stopAutoplay();
}).on("mouseout",".swiper-container",function(){
    swiper.startAutoplay();
});
