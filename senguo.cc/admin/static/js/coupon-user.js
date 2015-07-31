/**
 * Created by Administrator on 2015/7/20.
 */
$(document).ready(function(){
    var height = $(window).height();
    $(".wrap-user-coupon").css("minHeight",height+"px");
}).on("click",".go-link",function(){
    var url = $(this).attr("data-url");
    window.location.href=url;
});