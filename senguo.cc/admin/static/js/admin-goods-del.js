/**
 * Created by Administrator on 2015/6/2.
 */
$(document).ready(function(){

}).on("click",".check-box",function(){
    $(this).toggleClass("checked-box");
}).on("click",".dropdown-menu .item",function(){
    $(this).closest("ul").prev("button").children("em").html($(this).html());
});
