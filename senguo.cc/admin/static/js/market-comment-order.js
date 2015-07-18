var width = 0;
$(document).ready(function(){
    width = parseInt($("#img-lst").width()/4)-15;
    $("#img-lst").children("li").each(function(){
        $(this).width(width).height(width);
    });
}).on("click","#commit-order-point",function(){  //完成评价
    var user_txt = $("#user-txt").val();
    if($.trim(user_txt).length==0){
        noticeBox("评论不能为空哦！")
        return false;
    }
    if(user_txt.length>100){
        noticeBox("评论要在100个字以内哦！")
        return false;
    }
    if($(this).hasClass("grey-bg")){
        noticeBox("别点我啦，马上就好！")
        return false;
    }
    $(this).addClass("grey-bg");
    var imglist = $("#img-lst").find(".image");
    var imgUrl = [];
    var order_id = $(this).attr("data-id");
    var flag = true;
    imglist.each(function(i){
        var url = $(this).attr("url");
        if(url){
            imgUrl.push(url);
            flag = false;
        }
    });
    if(flag){
        imgUrl = "";
    }
    var data = {
        "comment":user_txt,
        "order_id":order_id,
        "imgUrl":imgUrl.toString()
    };
    $.ajax({
        url:"/customer/orders",
        contentType:"application/json; charset=UTF-8",
        data:JSON.stringify({"data":data,"action":"comment",_xsrf:window.dataObj._xsrf}),
        type:"post",
        success:function(res){
            if(res.success){
                if(res.notice!=''){
                    noticeBox(res.notice);
                }
                setTimeout(function(){
                    window.location.href="/customer/comment?page=0";
                },2000);
            }else{
                noticeBox(res.error_txt);
                $(this).removeClass("grey-bg");
            }
        }
    })

}).on("click",".icon-del",function(){
    $(this).closest("li").remove();
    if($("#add-img").closest("li").hasClass("hide")){
        $("#add-img").closest("li").removeClass("hide");
        $(".moxie-shim").removeClass("hide");
    }
    $(".moxie-shim").css({width:width+"px",height:width+"px",left:$("#add-img").closest("li").position().left,top:$("#add-img").closest("li").position().top});//调整按钮的位置
});
$(document).ready(function(){

    var uploader = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'add-img',
        container: 'img-lst',
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
                var isOri = "";
                EXIF.getData(file.getNative(), function() {
                    var orientation = file.getNative().exifdata.Orientation;
                    if(orientation && orientation>1){//ios 横拍为3，竖排为6
                        if(orientation==3){
                            isOri = "rotate-img2";
                        }else if(orientation == 6){
                            isOri = "rotate-img";
                        }
                    }
                });
                var $item = $('<li style="width:'+width+'px;height:'+width+'px;"><div class="wrap-img"><div class="img-cover wrap-img-cover"><span class="loader loader-quart"></span></div><img id="'+file.id+'" src="" alt="晒单图片" class="image '+isOri+'"/><a href="javascript:;" class="icon-del hide"></a></div></li>');
                $("#add-img").closest("li").before($item);
                if ($("#img-lst").children("li").size() == 5) {
                    $("#add-img").closest("li").addClass("hide");
                    $(".moxie-shim").addClass("hide");
                }
                $(".moxie-shim").css({left:$("#add-img").closest("li").position().left,top:$("#add-img").closest("li").position().top});//调整按钮的位置
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
                $("#"+file.id).attr("url","http://shopimg.qiniudn.com/"+file.id);
            },
            'Error': function (up, err, errTip) {
                if (err.code == -600) {
                    noticeBox("图片大小不能超过4M哦");
                } else if (err.code == -601) {
                    noticeBox("图片格式不对哦，只能上传png、jpg格式图片");
                } else if (err.code == -200) {
                    noticeBox("当前页面过期，请刷新页面");
                } else {
                    noticeBox(err.code + ": " + err.message);
                }
                up.removeFile(err.file.id);
                $("#"+err.file.id).closest("li").remove();
                if($("#"+err.file.id).closest("li").index()==3){
                    $("#add-img").closest("li").removeClass("hide");
                    $(".moxie-shim").removeClass("hide");
                }
                $(".moxie-shim").css({left:$("#add-img").closest("li").position().left,top:$("#add-img").closest("li").position().top});//调整按钮的位置
            },
            'Key': function (up, file) {
                var key = file.id;
                return key;
            }
        }
    });
    /*var imgLink = Qiniu.imageMogr2({
        auto-orient:true
    });*/
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
/*转化图片为base64*/
function previewImage(file,width,callback){//file为plupload事件监听函数参数中的file对象,callback为预览图片准备完成的回调函数
    if(!file || !/image\//.test(file.type)) return; //确保文件是图片
    if(file.type=='image/gif'){//gif使用FileReader进行预览,因为mOxie.Image只支持jpg和png
        var fr = new mOxie.FileReader();
        fr.onload = function(){
            callback(fr.result);
            fr.destroy();
            fr = null;
        }
        fr.readAsDataURL(file.getSource());
    }else{
        var preloader = new mOxie.Image();
        preloader.onload = function() {
            preloader.downsize( width,width ,true);//先压缩一下要预览的图片,宽，高
            var imgsrc = preloader.type=='image/jpeg' ? preloader.getAsDataURL('image/jpeg',70) : preloader.getAsDataURL(); //得到图片src,实质为一个base64编码的数据
            callback && callback(imgsrc); //callback传入的参数为预览图片的url
            preloader.destroy();
            preloader = null;
        };
        preloader.load( file.getSource() );
    }
}
