/**
 * Created by Administrator on 2015/5/25.
 */
$(document).ready(function(){
    /*var qrcode = new QRCode(document.getElementById("er-list-code"), {
        width : 80,//设置宽高
        height : 80
    });
    qrcode.makeCode($(this).closest("p").next(".po-list").find(".sw-link-txt").val());*/
    $('.sw-tip').each(function(){
        var $this=$(this);
        var status=parseInt($this.attr('data-status'));
        if(status == 0){
            $this.addClass('closed').siblings('.sw-tip-txt').text('已关闭');
        }else if(status == 1){
            $this.addClass('shopping').siblings('.sw-tip-txt').text('营业中');
        }else if(status == 2){
            $this.addClass('waiting').siblings('.sw-tip-txt').text('筹备中');
        }else if(status == 3){
            $this.addClass('resting').siblings('.sw-tip-txt').text('休息中');
        }
    });
    $('.auth').each(function(){
        var $this=$(this);
        var auth=parseInt($this.attr('data-auth'));
        if(auth == 1 || auth == 4){
            $this.text('个人认证').removeClass('hidden');
        }else if(auth == 2 || auth == 3){
            $this.text('企业认证').removeClass('hidden');
        }else{
            $this.hide();
        }
    });
    $(".sw-link-copy").zclip({
        path: "/static/js/third/ZeroClipboard.swf",
        copy: function(){
            return $(this).prev("input").val();
        },
        afterCopy:function(){/* 复制成功后的操作 */
            Tip("链接已经复制到剪切板");
        }
    });
    $(".er-code-img").each(function(){
        var _this = $(this);
        new QRCode(this, {
            width : 80,//设置宽高
            height : 80
        }).makeCode(_this.closest(".sw-er-tip").find(".sw-link-txt").val());
    });
    $(document).on("click",function(e){
        if($(e.target).closest('.sw-er-tip').size()==0){
            $(".sw-er-tip").addClass("invisible");
        }
    });
}).on("click",".sw-er-tip",function(e){
    e.stopPropagation();
}).on("click","#spread-list",function(e){
    e.stopPropagation();
    $(".sw-er-tip").addClass("invisible");
    $(this).closest("p").next(".po-list").toggleClass("invisible");
}).on("click",".spread-shop",function(e){
    e.stopPropagation();
    var $this=$(this);
    var link=$this.attr('data-url');
    $(".sw-er-tip").addClass("invisible");
    $(this).next(".sw-er-tip").toggleClass("invisible");
}).on('click','.sw-list li',function(e){
    var shop_id=$(this).data('id');
    var shop_code = $(this).attr("data-code");
   
        if(shop_id){
            if(!$(e.target).hasClass('.forbid_click')){
                var url='/admin/home';
                var data={shop_id:shop_id};
                var args={action:'shop_change',data:data};
                $.postJson(url,args,function(res){
                    if(res.success){
                         if(shop_code!="not set" && typeof(shop_code) != undefined){
                                window.location.href='/admin/home';
                            }else{
                            window.location.href="/admin/config/shop";
                            }

                    }
                });
            }
        }
   
});
