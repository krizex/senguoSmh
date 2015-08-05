/**
 * Created by Administrator on 2015/7/2.
 */
$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height-40);
    //店铺状态
    var status = parseInt($("#shop_status").attr("data-status"),10);
    if(status==0){
        $("#shop_status").addClass("closed");
    }else if(status==1){
        $("#shop_status").addClass("shopping");
    }else if(status==2){
        $("#shop_status").addClass("waiting");
    }else if(status==3){
        $("#shop_status").addClass("resting");
    }
}).on("click","#shop_info",function(){
    window.location.href="/madmin/shopinfo";
}).on("click",".tab-bm-list li",function(){
    var index = $(this).index();
    $(".tab-bm-list li").removeClass("active").eq(index).addClass("active");
    $(".head_tab").addClass("hide").eq(index).removeClass("hide");
    $(".main_tab").addClass("hide").eq(index).removeClass("hide");
});