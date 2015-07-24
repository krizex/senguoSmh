/**
 * Created by Administrator on 2015/7/6.
 */
$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height-40+"px");
    $(".shop_status").each(function(){
        var $this = $(this);
        var status = parseInt($this.attr("data-status"),10);
        if(status==0){
            $this.addClass("closed");
            $this.next(".sw-tip-txt").html("已关闭");
        }else if(status==1){
            $this.addClass("shopping");
            $this.next(".sw-tip-txt").html("营业中");
        }else if(status==2){
            $this.addClass("waiting");
            $this.next(".sw-tip-txt").html("筹备中");
        }else if(status==3){
            $this.addClass("resting");
            $this.next(".sw-tip-txt").html("休息中");
        }
    });
    $('.auths').each(function(){
        var $this=$(this);
        var auth=parseInt($this.attr('data-auth'));
        if(auth == 1 || auth == 4){
            $this.text('个人认证').removeClass('hide');
        }else if(auth == 2 || auth == 3){
            $this.text('企业认证').removeClass('hide');
        }
    });
    new QRCode($("#big-code2")[0],{
        width : 300,
        height : 300
    }).makeCode($("#shop_list_link").html());
}).on("click","#qa",function(){
    $(this).addClass("hide");
    $(".pop-qa").removeClass("hide");
}).on("click","#close-pop",function(){
    $("#qa").removeClass("hide");
    $(".pop-qa").addClass("hide");
}).on("click",".spread-list",function(){
    $(".pop-spread").removeClass("hidden");
}).on("click",".b-close",function(){
    $(".pop-spread").addClass("hidden");
}).on("click",".shop-list li",function(){
    var shop_id=$(this).data('id');
    var shop_code = $(this).attr("data-code");
    if(shop_id){
        var url='/admin/home';
        var data={shop_id:shop_id};
        var args={action:'shop_change',data:data};
        $.postJson(url,args,function(res){
            if(res.success){
                window.location.href="/madmin/shop";
            }
        });
    }
});