/**
 * Created by Administrator on 2015/4/23.
 */
var imgNameArr = [];
$(document).ready(function(){

}).on("click","#commit-order-point",function(){
    var user_txt = $("#user-txt").val();

}).on("click",".icon-del",function(){
    var index = $(this).attr("data-index");
    imgNameArr.splice(index,1);
    $(this).closest("li").remove();
    if($("#add-product-image").closest("li").hasClass("hide")){
        $("#add-product-image").closest("li").removeClass("hide");
        $(".moxie-shim").removeClass("hide");
    }
    $(".moxie-shim").css({width:$("#add-img").width(),height:$("#add-img").height(),left:$("#add-img").closest("li").position().left,top:$("#add-img").closest("li").position().top});//调整按钮的位置
});
$(document).ready(function(){
    var width = $("#add-img").width();
    var uploader = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'add-img',
        container: 'img-lst',
        max_file_size: '4mb',
        filters : {
            max_file_size : '4mb',//限制图片大小
            mime_types: [
                {title : "image type", extensions : "jpg,jpeg,gif,png"}
            ]
        },
        flash_swf_url: 'static/js/plupload/Moxie.swf',
        dragdrop: false,
        chunk_size: '4mb',
        domain: "http://shopimg.qiniudn.com/",
        uptoken: getCookie("token"),
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
                !function(){
                    previewImage(file,width,function(imgsrc){

                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                $("#person-img").attr("url","http://shopimg.qiniudn.com/"+$.parseJSON(info).key);
            },
            'Error': function (up, err, errTip) {
                if (err.code == -600) {
                    alert("图片大小不能超过4M哦");
                } else if (err.code == -601) {
                    alert("图片格式不对哦");
                } else if (err.code == -200) {
                    alert("上传出错");
                } else {
                    alert(err.code + ": " + err.message);
                }
                up.removeFile(err.file.id);
                $("#person-img").attr("src","").attr("url","").closest(".wrap-img").addClass("hide");
            },
            'Key': function (up, file) {
                var key = "Web_" + new Date().getTime() + "_" + file.id;
                return key;
            }
        }
    });
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
