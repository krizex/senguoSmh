/**
 * Created by Administrator on 2015/7/6.
 */
$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height-40+"px");
}).on("click",".del-img",function(){
    $("#notice-temp-img").addClass("hidden");
    $("#add-notice-img").removeClass("hidden");
    $(".moxie-shim").removeClass("hide");
}).on("click","#finish_btn",function(){
    var action = $(this).attr("data-action");
    if(action=="add"){
        noticeAdd();
    }else{
        var id = $(this).attr("data-id");
        noticeEdit(id);
    }
});
var link = "/admin/config";
function noticeAdd(){
    var url=link;
    var action="add_notice";
    var summary= $.trim($('.new-notice-title').val());
    var detail=$.trim($('.new-notice-detail').val());
    var img_url=$("#notice_img").attr("url");
    if(summary.length>15){return Tip('摘要请不要超过15个字！')}
    if(detail.length>200){return Tip('详情请不要超过200个字！')}
    if(!summary){return Tip('请输入摘要！')}
    if(!detail){return Tip('请输入详情！')}
    var data={
        summary:summary,
        detail:detail,
        img_url:img_url
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                Tip("公告添加成功");
                setTimeout(function(){
                    window.location.href="/madmin/shopattr?action=notice"
                },2000);
            }
            else return Tip(res.error_text);
        });
}
function noticeEdit(id){
    var url=link;
    var action="edit_notice";
    var notice_id=id;
    var summary=$('.new-notice-title').val();
    var detail=$('.new-notice-detail').val();
    var img_url=$("#notice_img").attr("url");
    if(summary.length>15){return Tip('摘要请不要超过15个字！')}
    if(detail.length>200){return Tip('详情请不要超过200个字！')}
    if(!summary){return Tip('摘要不能为空！')}
    if(!detail){return Tip('详情不能为空！')}
    var data={
        notice_id:notice_id,
        summary:summary,
        detail:detail,
        img_url:img_url
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                Tip("公告编辑成功");
                setTimeout(function(){
                    window.location.href="/madmin/shopattr?action=notice"
                },2000);
            }
            else return Tip(res.error_text);
        });
}
var isOri = "";
$(document).ready(function(){
    var uploader = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'add-notice-img',
        container: 'wrap-shop-address',
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
        domain: "http://7rf3aw.com2.z0.glb.qiniucdn.com/",
        uptoken: $("#token").val(),
        unique_names: false,
        save_key: false,
        auto_start: true,
        init: {
            'FilesAdded': function (up, files) {
                var file = files[0];
                $(".img-cover").removeClass("hide");
                $(".del-img").addClass("hide");
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
                    previewImage(file,function(imgsrc){
                        $("#notice_img").attr("src",imgsrc).addClass(isOri);
                        $("#add-notice-img").addClass("hidden");
                        $("#notice-temp-img").removeClass("hidden");
                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                $("#notice_img").attr("url","http://7rf3aw.com2.z0.glb.qiniucdn.com/"+file.id);
                $(".img-cover").addClass("hide");
                $(".del-img").removeClass("hide");
                $(".moxie-shim").addClass("hide");
            },
            'Error': function (up, err, errTip) {
                if (err.code == -600) {
                    Tip("上传图片大小请不要超过4M");
                } else if (err.code == -601) {
                    Tip("上传图片格式只能为png、jpg图片");
                } else if (err.code == -200) {
                    Tip("当前页面过期，请刷新页面后再上传");
                } else {
                    Tip(err.code + ": " + err.message);
                }
                up.removeFile(err.file.id);
                $("#notice_img").attr("src",$("#notice_img").attr("url")).removeClass(isOri);
                $("#add-notice-img").removeClass("hidden");
                $("#notice-temp-img").addClass("hidden");
                $(".img-cover").removeClass("hide");
                $(".del-img").addClass("hide");
                $(".moxie-shim").removeClass("hide");
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
});
/*转化图片为base64*/
function previewImage(file,callback){//file为plupload事件监听函数参数中的file对象,callback为预览图片准备完成的回调函数
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
            preloader.downsize(100,100,true);//先压缩一下要预览的图片,宽，高
            var imgsrc = preloader.type=='image/jpeg' ? preloader.getAsDataURL('image/jpeg',70) : preloader.getAsDataURL(); //得到图片src,实质为一个base64编码的数据
            callback && callback(imgsrc); //callback传入的参数为预览图片的url
            preloader.destroy();
            preloader = null;
        };
        preloader.load( file.getSource() );
    }
}