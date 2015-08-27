var length = 3,timer=null;
$(document).ready(function(){
    $(".slide-list li").each(function(i){
        var $this = $(this);
        $this.css({position:"absolute",top:"0",left:i*200+"px"});
    });
    timer=setInterval(function(){
        slide_images();
    },4000);
});
function slide_images(){
    $(".slide-list li").each(function(){
        var $this = $(this);
        var index = parseInt($this.attr("data-index"));
        if(index==0){
            $this.css("left",600+"px").attr("data-index",length-1);
            $this.animate({left:"400px"},"slow");
        }else{
            $this.attr("data-index",index-1).animate({left:(index-1)*200+"px"},"slow");
        }
    });
}