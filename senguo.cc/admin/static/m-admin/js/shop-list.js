/**
 * Created by Administrator on 2015/7/6.
 */
$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height-40+"px");
    $('.auths').each(function(){
        var $this=$(this);
        var auth=parseInt($this.attr('data-auth'));
        if(auth == 1 || auth == 4){
            $this.text('个人认证').removeClass('hide');
        }else if(auth == 2 || auth == 3){
            $this.text('企业认证').removeClass('hide');
        }
    });
}).on("click","#qa",function(){
    $(this).addClass("hide");
    $(".pop-bwin").removeClass("hide");
}).on("click","#close-pop",function(){
    $("#qa").removeClass("hide");
    $(".pop-bwin").addClass("hide");
});