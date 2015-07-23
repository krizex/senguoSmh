/**
 * Created by Administrator on 2015/7/23.
 */
var type = 0,page=0;
$(document).ready(function(){
    $(".wrap-goods-groups").prev(".subnav-box").hide();
    $(".right-title").hide();
}).on("click",".import-type li",function(){
    var index = $(this).index();
    type = index;
    $(".import-type li").removeClass("active").eq(index).addClass("active");
    $(".wrap-tabcont .tab-item").addClass("hidden").eq(index).removeClass("hidden");
}).on("click","#commit",function(){
    if(parseInt($("#choose_txt").html())==0){
        Tip("您还未选中任何商品");
        return false;
    }
    if(type==0){

    }else{

    }
}).on("click",".shop-list li",function(){
    $(this).toggleClass("active");
    var size = $(".shop-list").children(".active").size();
    $("#choose_txt").html(size);
}).on("click",".prev-page",function(){

}).on("click",".next-page",function(){

}).on("click",".all-choose",function(){
    var checki = $(this).children("i");
    checki.toggleClass("checked-btn");
    var size =  $(".shop-list li").size();
    if(checki.hasClass("checked-btn")){
        $(".shop-list li").addClass("active");
        $("#choose_txt").html(size);
    }else{
        $(".shop-list li").removeClass("active");
        $("#choose_txt").html(0);
    }
});