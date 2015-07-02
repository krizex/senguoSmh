var timer = null,index =0;
$(document).ready(function(){
    initSlide();
});

function initSlide(){
    timer = setInterval(function(){
        index++;
        $("#slide-list").children("li").addClass("anima");
        $("#slide-list").children("li").css("left",-192*index);
        if(index%4==0){
            index = 0;
            $("#slide-list").children("li").removeClass("anima");
            if($("#slide-list").children("li").first().hasClass("s1")){
                var s1s = $("#slide-list").children(".s1").clone();
                $("#slide-list").children(".s1").remove();
                $("#slide-list").append(s1s);
            }else{
                var s2s = $("#slide-list").children(".s2").clone();
                $("#slide-list").children(".s2").remove();
                $("#slide-list").append(s2s);
            }
            $("#slide-list").children("li").css("left",0+"px");
        }
    },2500);
}
