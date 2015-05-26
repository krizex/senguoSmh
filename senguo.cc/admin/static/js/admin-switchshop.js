/**
 * Created by Administrator on 2015/5/25.
 */
$(document).ready(function(){
    /*var qrcode = new QRCode(document.getElementById("er-list-code"), {
        width : 80,//设置宽高
        height : 80
    });
    qrcode.makeCode($(this).closest("p").next(".po-list").find(".sw-link-txt").val());*/
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
    })
}).on("click","#spread-list",function(e){
    e.stopPropagation();
    $(this).closest("p").next(".po-list").toggleClass("hidden");
}).on("click",".spread-shop",function(){
    $(this).next(".sw-er-tip").toggleClass("hidden");
});