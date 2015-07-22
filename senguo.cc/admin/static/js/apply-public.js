$(document).ready(function(){
    //fastclick initialise
    FastClick.attach(document.body);
    //商品单位转换
    var height = $(window).height()-70;
    $(".container").css("minHeight",height-60+"px");
    $(".wrap-create").css("minHeight",height-60+"px");
    if($(".home-top").size()>0){
        $("#title").html("店铺申请");
        $("#beta").hide();
    }
});
