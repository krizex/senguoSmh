/**
 * Created by Administrator on 2015/4/20.
 */
$(document).ready(function(){

}).on("click",".tab-lst li",function(){
    var index = $(this).index();
    $(".tab-lst li").removeClass("active").eq(index).addClass("active");
    $(".acc-con-lst li").removeClass("active").eq(index).addClass("active");
});