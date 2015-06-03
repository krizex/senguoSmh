var goodsItem = "",goodsEdit = false;
$(document).ready(function(){
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
        if($(e.target).closest(".sw-er-tip").size()==0){
            $(".sw-er-tip").addClass("invisible");
        }
    })
}).on("click",".check-box",function(){
    $(this).toggleClass("checked-box");
}).on("click",".switch-btn",function(){
    $(this).toggleClass("switch-btn-active");
}).on("click",".cancel-btn",function(){
    $(this).closest(".pop-window").hide();
}).on("click",".show-add-img",function(){   //上传图片
    var index = $(this).closest(".goods-all-item").index();
    var oIndex = $(".pop-up-img").attr("data-index");
    if(index == oIndex){
        $(".pop-up-img").show();
    }else{
        $("#add-img-btn").closest("li").prevAll("li").remove();
        $(".pop-up-img").attr("data-index",index).show();
    }
}).on("click",".sg-img-list img",function(){
    $(this).prev(".img-selected").toggle();
    $(this).toggleClass("selected-img");
}).on("click",".sg-img-list .img-selected",function(){
    $(this).toggle();
    $(this).next("img").toggleClass("selected-img");
}).on("click",".wrap-big-img",function(){
    $(".wrap-big-img").hide();
}).on("click",".show-bigimg",function(){
    var src = $(this).attr("data-src")||"";
    $(".wrap-big-img").children("img").attr("src",src);
    $(".wrap-big-img").show();
}).on("click",".spread-all-item",function(e){
    e.stopPropagation();
    $(this).closest(".all-bm-group").next(".sw-er-tip").toggleClass("invisible");
}).on("click",".dropdown-menu .item",function(){
    $(this).closest("ul").prev("button").children("em").html($(this).html());
}).on("click",".del-img",function(){
    $(this).closest("li").remove();
}).on("click",".item-set-more",function(){
    $(this).closest(".all-item-cont").next(".wrap-more-set").slideToggle(300);
    $(this).toggleClass("item-set-mactive");
}).on("click",".eidt-all-item",function(){
    if(goodsEdit){
        Tip("请先完成正在编辑的商品");
        return false;
    }
    var _this = $(this);
    $.getItem("/static/items/admin/goods-item.html",function(data){
        goodsItem = data;
        _this.closest(".goods-all-item").hide().after(goodsItem);
        goodsEdit = true;
    });
}).on("click",".cancel-edit-goods",function(){
    var _this = $(this);
    _this.closest(".goods-all-item").prev(".goods-all-item").show();
    _this.closest(".goods-all-item").remove();
    goodsEdit = false;
}).on("click",".ok-edit-goods",function(){  //保存编辑后的商品
    var _this = $(this);
    _this.closest(".goods-all-item").prev(".goods-all-item").show();
    _this.closest(".goods-all-item").remove();
    goodsEdit = false;
}).on("click","#add-goods",function(){  //添加新商品
   // $(".wrap-all-goods,.subnav-box,.right-title").addClass("hidden");
    $(".wrap-classify").prevAll().addClass("hidden");
    $(".wrap-classify").removeClass("hidden");
}).on("click",".fruit-item-list li",function(){//选择分类
    $(".wrap-classify").addClass("hidden");
    $(".wrap-classify").prevAll().removeClass("hidden");
    $.getItem("/static/items/admin/goods-item.html",function(data){
        goodsItem = data;
        $(".goods-all-list").append(goodsItem);
        goodsEdit = true;
    });
});

$(document).ready(function(){
    var uploader = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'add-img-btn',
        container: 'item-img-lst',
        max_file_size: '4mb',
        filters : {
            max_file_size : '4mb',//限制图片大小
            mime_types: [
                {title : "image type", extensions : "jpg,jpeg,png"}
            ]
        },
        flash_swf_url: 'static/js/plupload/Moxie.swf',
        dragdrop: false,
        chunk_size: '4mb',
        domain: "http://shopimg.qiniudn.com/",
        uptoken: $("#token").val(),
        unique_names: false,
        save_key: false,
        auto_start: true,
        init: {
            'FilesAdded': function (up, files) {
                var file = files[0];
                var $item = $('<li class="img-bo"><div class="img-cover wrap-img-cover hidden"><span class="loader loader-quart"></span></div><img id="'+file.id+'" src="" alt="晒单图片" class="image"/><a class="del-img hide" href="javascript:;">x</a></li>');
                $("#add-img-btn").closest("li").before($item);
                if ($("#item-img-lst").children("li").size() == 6) {
                    $("#add-img-btn").closest("li").addClass("hide");
                    $(".moxie-shim").addClass("hide");
                }
                $(".moxie-shim").css({left:$("#add-img-btn").closest("li").position().left,top:$("#add-img-btn").closest("li").position().top});//调整按钮的位置
                !function(){
                    previewImage(file,width,function(imgsrc){
                        $("#"+file.id).attr("src",imgsrc);
                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                $("#" + file.id).prev(".img-cover").addClass("hide");
                $("#" + file.id).next("a").removeClass("hide");
                $("#"+file.id).attr("src","http://shopimg.qiniudn.com/"+file.id+"?imageView2/5/w/100/h/100");
            },
            'Error': function (up, err, errTip) {
                if (err.code == -600) {
                    Tip("图片大小不能超过4M哦");
                } else if (err.code == -601) {
                    Tip("图片格式不对哦，只能上传png、jpg格式图片");
                } else if (err.code == -200) {
                    Tip("当前页面过期，请刷新页面");
                } else {
                    Tip(err.code + ": " + err.message);
                }
                up.removeFile(err.file.id);
                $("#"+err.file.id).closest("li").remove();
                if($("#"+err.file.id).closest("li").index()==4){
                    $("#add-img-btn").closest("li").removeClass("hide");
                    $(".moxie-shim").removeClass("hide");
                }
                $(".moxie-shim").css({left:$("#add-img-btn").closest("li").position().left,top:$("#add-img-btn").closest("li").position().top});//调整按钮的位置
            },
            'Key': function (up, file) {
                var key = file.id;
                return key;
            }
        }
    });
    setTimeout(function(){
        $(".moxie-shim").children("input").attr("capture","camera").attr("accept","image/*").removeAttr("multiple");
    },500);
})
//获取cookie
function getCookie(key){
    var aCookie = document.cookie.split(";");
    for (var i=0; i < aCookie.length; i++){
        var aCrumb = aCookie[i].split("=");
        if (key === aCrumb[0].replace(/^\s*|\s*$/,"")){
            return unescape(aCrumb[1]);
        }
    }
}