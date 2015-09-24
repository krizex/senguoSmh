/**
 * Created by Administrator on 2015/7/2.
 */
var if_login=$('.pop-login').attr('data-id');
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
    $("body").on("click",function(e){
        if($(e.target).closest(".wrap-menu-list").size()==0 && $(e.target).closest(".bbs-menu").size()==0){
            $(".wrap-menu-list").addClass("h0");
        }
    });
}).on("click","#shop_info",function(e){
    if($(e.target).closest(".shop-link").size()==0){
        window.location.href="/madmin/shopinfo";
    }  
}).on("click",".order-links",function(){
    if($(this).hasClass("forbid-in")){
        Tip("该方式处于关闭状态，请开启后再查看");
        return false;
    }else{
        window.location.href=$(this).attr("url");
    }
});