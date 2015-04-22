/**
 * Created by Administrator on 2015/4/20.
 */
$(document).ready(function(){

}).on("click",".rec-bm-lst .check-ipt",function(){
    $(".rec-bm-lst .check-ipt").removeClass("checked");
    $(this).addClass("checked");
}).on("click","#commit-rec",function(){
    console.log(333);
});