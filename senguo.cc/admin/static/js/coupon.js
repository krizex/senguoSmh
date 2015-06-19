/**
 * Created by Administrator on 2015/6/16.
 */
$(document).ready(function(){
    var height = $(window).height();
    $(".container").height(height);
    //兑换
    $(document).on("click","#convert-btn",function(){
        var key = $("#convert-btn").val();
        if($.trim(key)!=""){
            searchKey(key);
        }
    });

});
function searchKey(id,key){
    $.ajax({
        url:"/coupon/detail?action=detail&coupon_key="+key,
        type:"get",
        success:function(res){
        }
    });
}