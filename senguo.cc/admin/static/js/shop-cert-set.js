$(document).ready(function(){

}).on("click",".cert-type .type",function(){
    var index = $(this).index();
    $(".cert-type .type").removeClass("active").eq(index).addClass("active");
    $(".wrap-bm").addClass("hide").eq(index).removeClass("hide");
}).on("click","#per-commit",function(){     //个人认证提交
    var name=$("#per-name").val();
    var cardId = $("#per-ID").val();
    var perImg = $("#per-img").attr("url");
    var perCode = $("#per-code").val();
    var tel = $("#perCode").html();
    $.ajax({
        url:"/admin/shopauth",
        data:{action:"customer_auth",name:name,card_id:cardId,phone:tel,handle_img:perImg,code:perCode},
        type:"post",
        success:function(data){
            if(data.status==0) {
                $(".wrap-bm").addClass("hide").eq(2).removeClass("hide");
            }else{
                alert(data.msg);
            }
        }
    });
}).on("click","#en-commit",function(){      //企业认证提交
    var name=$("#en-name").val();
    var enPerName = $("#en-per-name").val();
    var licenseImg = $("#license-img").attr("url");
    var fontImg = $("font-img").attr("url");
    var reverImg = $("rever-img").attr("url");
    var code = $("#getEnCode").val();
    var tel = $("#perCode").html();
    $.ajax({
        url:"/admin/shopauth",
        data:{
            action:"company_auth",
            name:name,
            company_name:enPerName,
            business_license:licenseImg,
            font_img:fontImg,
            behind_img:reverImg,
            phone:tel,
            code:code
        },
        type:"post",
        success:function(data){
            if(data.status==0) {
                $(".wrap-bm").addClass("hide").eq(2).removeClass("hide");
            }else{
                alert(data.msg);
            }
        }
    });
}).on("click","#getPerCode",function(){   //获取验证码
    if($(this).attr("data-statu")=="1") return false;
    $(this).addClass("bg85").attr("data-statu", "1");
    var tel = $("#perCode").html();
    var $this = $(this);
    $.ajax({
        url:"/admin/shopauth",
        data:{phone:tel},
        type:"post",
        success:function(data){
            if(data.status==0) {
                getCertCode($this);
            }else{
                $this.removeClass("bg85").removeAttr("data-statu").html("获取验证码");
                alert("服务器出故障了，请联系管理员！");
            }
        }
    });
}).on("click","#getEnCode",function(){
    if($(this).attr("data-statu")=="1") return false;
    $(this).addClass("bg85").attr("data-statu", "1");
    var tel = $("#perCode").html();
    var $this = $(this);
    $.ajax({
         url:"/admin/shopauth",
         data:{phone:tel},
         type:"post",
         success:function(data){
             if(data.status==0) {
                 getCertCode($this);
             }else{
                 $this.removeClass("bg85").removeAttr("data-statu").html("获取验证码");
                 alert("服务器出故障了，请联系管理员！");
             }
         }
     });
});
function getCertCode($obj){
    var i=60,timer=null;
    $obj.html("重新发送(60)");
    timer = setInterval(function (){
        i--;
        if(i==0){
            $obj.removeClass("bg85").removeAttr("data-statu").html("获取验证码");
            clearInterval(timer);
        }else{
            $obj.html("重新发送("+i+")");
        }
    },1000);
}
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
$(function() {
    //上传手持身份证
    var uploader = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'upload-per',
        container: 'wrap-per-img',
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
                !function(){
                    previewImage(file,function(imgsrc){
                        $("#person-img").attr("src",imgsrc);
                        $("#person-img").closest(".wrap-img").removeClass("hide");
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
    //上传营业执照
    var uploader1 = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'upload-license',
        container: 'wrap-lis-img',
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
                !function(){
                    previewImage(file,function(imgsrc){
                        $("#license-img").attr("src",imgsrc);
                        $("#license-img").closest(".wrap-img").removeClass("hide");
                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                $("#license-img").attr("url","http://shopimg.qiniudn.com/"+$.parseJSON(info).key);
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
                $("#license-img").attr("src","").attr("url","").closest(".wrap-img").addClass("hide");
            },
            'Key': function (up, file) {
                var key = "Web_" + new Date().getTime() + "_" + file.id;
                return key;
            }
        }
    });
    //上传法人身份证正面
    var uploader2 = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'upload-font',
        container: 'wrap-legal-img',
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
                !function(){
                    previewImage(file,function(imgsrc){
                        $("#font-img").attr("src",imgsrc);
                        $("#font-img").closest(".wrap-img").removeClass("hide");
                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                $("#font-img").attr("url","http://shopimg.qiniudn.com/"+$.parseJSON(info).key);
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
                $("#font-img").attr("src","").attr("url","").closest(".wrap-img").addClass("hide");
            },
            'Key': function (up, file) {
                var key = "Web_" + new Date().getTime() + "_" + file.id;
                return key;
            }
        }
    });
    //上传法人身份证正面
    var uploader3 = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'upload-rever',
        container: 'wrap-legal-img',
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
                !function(){
                    previewImage(file,function(imgsrc){
                        $("#rever-img").attr("src",imgsrc);
                        $("#rever-img").closest(".wrap-img").removeClass("hide");
                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                $("#rever-img").attr("url","http://shopimg.qiniudn.com/"+$.parseJSON(info).key);
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
                $("#rever-img").attr("src","").attr("url","").closest(".wrap-img").addClass("hide");
            },
            'Key': function (up, file) {
                var key = "Web_" + new Date().getTime() + "_" + file.id;
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
            preloader.downsize( 260, 150 ,true);//先压缩一下要预览的图片,宽，高
            var imgsrc = preloader.type=='image/jpeg' ? preloader.getAsDataURL('image/jpeg',70) : preloader.getAsDataURL(); //得到图片src,实质为一个base64编码的数据
            callback && callback(imgsrc); //callback传入的参数为预览图片的url
            preloader.destroy();
            preloader = null;
        };
        preloader.load( file.getSource() );
    }
}
