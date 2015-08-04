$(document).ready(function(){

}).on("click","#batch_group",function(){
    $("#batch_group").addClass("hide");
    $("#choose_group").removeClass("hide");
}).on("click",".cancel-bbtn",function(){
    $(this).closest(".pop-bwin").addClass("hide");
}).on("click",".select-all",function(){
    var status = parseInt($(this).attr("data-status"));
    if(status==0){
        $(".batch-lst").find(".checkbox").addClass("checked-box");
        $(this).attr("data-status","1");
    }else{
        $(".batch-lst").find(".checkbox").removeClass("checked-box");
        $(this).attr("data-status","0");
    }
}).on("click",".batch-lst li",function(){
    var $checkbox = $(this).find(".checkbox");
    if($checkbox.hasClass("checked-box")){
        $checkbox.removeClass("checked-box");
    }else{
        $checkbox.addClass("checked-box");
    }
}).on("click",".batch-group-list li",function(){
    $(".batch-group-list li").removeClass("active");
    $(this).addClass("active");
    $(".batch-group-list .checkbox").removeClass("checked-box");
    $(this).find(".checkbox").addClass("checked-box");
}).on("click",".new_group",function(){
    $(".pop-name").removeClass("hide");
    $("#group_name").focus();
}).on("click","#add_group",function(){
    var group_name = $("#group_name").val();
    var li = '<li><span class="c666 fr">共3件商品</span><span class="checkbox"></span><span class="gname clip">'+group_name+'</span></li>';
    $(".batch-group-list").append(li);
    $(".pop-name").addClass("hide");
}).on("click","#switch_group",function(){//切换商品分组
    $("#choose_group").addClass("hide");
    $("#batch_group").removeClass("hide");
}).on("click","#cancel_group",function(){
    $("#choose_group").addClass("hide");
    $("#batch_group").removeClass("hide");
});

function addGroup(){

}
