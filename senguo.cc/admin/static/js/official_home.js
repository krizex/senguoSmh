var length = 3,timer=null;
$(document).ready(function(){
    $(".swiper-wrapper li").each(function(i){
        var $this = $(this);
        $this.css({position:"absolute",top:"0",left:i*1000+"px"});
    });
    timer=setInterval(function(){
        slide_images("next");
    },4000);
}).on("click","#prev",function(){
    if($(".swiper-wrapper li").eq(1).is(":animated")){
       return ;
    } else {
        slide_images("prev");
    }
}).on("click","#next",function(){
    if($(".swiper-wrapper li").eq(1).is(":animated")) {

    } else {
        slide_images("next");
    }
}).on("mouseover",".swiper-wrapper",function(){
    clearInterval(timer);
}).on("mouseout",".swiper-wrapper",function(){
    timer=setInterval(function(){
        slide_images("next");
    },4000);
});
function slide_images(type){
    $(".swiper-wrapper li").each(function(){
        var $this = $(this);
        var index = parseInt($this.attr("data-index"));
        if(type=="prev"){
            if(index==0){
                $this.css("left",3000+"px").attr("data-index",length-1);
                $this.animate({left:"2000px"},"slow");
            }else{
                $this.attr("data-index",index-1).animate({left:(index-1)*1000+"px"},"slow");
            }
        }else{
            if(index==2){
                $this.css("left",-1000+"px").attr("data-index",0);
                $this.animate({left:0},"slow");
            }else{
                $this.attr("data-index",index+1).animate({left:(index+1)*1000+"px"},"slow");
            }
        }
    });
}
