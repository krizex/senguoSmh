$(document).ready(function(){
    var person_auth=$('#data').attr('data-per');
    var company_auth=$('#data').attr('data-com');
    var apply_status=Int($('#data').attr('data-status'));
    var shop_auth=$('#data').attr('data-auth');
    var times=$('#data').attr('data-times');
    if(person_auth == 'False' && company_auth =='False'){
        $('.wrap-per-cert').removeClass('hide');
    }
    if(times != 0){
        $(".wrap-per-cert").addClass('hide');
        $(".wrap-en-cert").addClass('hide');
        if(apply_status == 0){
            $(".scom").addClass('hide');
            $(".encom").addClass('hide');
            $('.change-notice').addClass('hide');
            $('.wrap-cert-tip').removeClass('hide');
        }
    }
    if(shop_auth==1){
        $(".wrap-per-cert").addClass('hide');
    }
}).on("click",".cert-type .type",function(){
    var index = $(this).index();
    var status=$(this).attr('data-status');
    if(status==1 ){
        return false;
    }
    $(".cert-type .type").removeClass("active").eq(index).addClass("active");
    $(".wrap-bm").addClass("hide").eq(index).removeClass("hide");
}).on('click','.change-auth',function(){
    var shop_auth=$('#data').attr('data-auth');
    if(confirm('您只有一次修改认证类型的机会，确认修改认证类型吗？')){
         if(shop_auth==1){
        $(".scom").removeClass('active');
        $(".encom").addClass('active');
        $(".wrap-en-cert").removeClass('hide');
        }
        else if(shop_auth==2){
            $(".scom").addClass('active');
            $(".encom").removeClass('active');
            $(".wrap-per-cert").removeClass('hide');
        }
    }
   
}).on("click","#per-commit",function(){     //个人认证提交
     var $this = $(this);
    if($this.attr("data-statu")=="1") {
        return false;
    }
    $this.addClass("bg85").attr("data-statu", "1");
    var name=$("#per-name").val();
    var cardId = $("#per-ID").val();
    var perImg = $("#person-img").attr("url");
    var perCode = Int($("#per-code").val());
    var tel = $("#perCode").html();
    var regChinese=/^[\u4e00-\u9faf]+$/;
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    var data={};
    if(!name||!regChinese.test(name)){
        $this.removeClass("bg85").removeAttr("data-statu");
        return alert('请填写真实姓名');
    }
    // if(isIdCardNo(cardId)==false){
    //     $this.removeClass("bg85").removeAttr("data-statu");
    //     return alert('请填写正确的身份证号');
    // }
    if(!cardId){
        $this.removeClass("bg85").removeAttr("data-statu");
         return alert('请填写您的身份证号');
    }
    if(!perImg){
          $this.removeClass("bg85").removeAttr("data-statu");
          return alert('请上传手持身份证照片');
    }
    if(!perCode){
        $this.removeClass("bg85").removeAttr("data-statu");
        return alert('请输入验证码');
    } 
    // if(!regNumber.test(perCode)||perCode.length>4||perCode.length<4){
    //     $this.removeClass("bg85").removeAttr("data-statu");
    //     return alert('验证码只能为4位数字！');
    // }
    data={
        name:name,card_id:cardId,phone:tel,handle_img:perImg,code:perCode
    }
    $.ajax({
        url:"/admin/shopauth",
        data:JSON.stringify({action:"customer_auth",data:data,_xsrf:window.dataObj._xsrf}),
        contentType:"application/json; charset=UTF-8",
        type:"post",
        success:function(res){
            if(res.success) {
                $('.success-type').text('个人认证');
                $('.check-time').text('48');
                $(".wrap-bm").addClass("hide").eq(2).removeClass("hide");
                $this.removeClass("bg85").removeAttr("data-statu");
                $(".wrap-per-cert").remove();
                $(".scom").remove();
                $(".wrap-en-cert").remove();
                $(".encom").remove();
                $('.fail-notice').remove();
                $('.change-notice').remove();
            }else{
                $this.removeClass("bg85").removeAttr("data-statu");
                alert(res.error_text);
            }
        }
    });
}).on("click","#en-commit",function(){ 
  var $this = $(this);
    if($this.attr("data-statu")=="1") {
        return false;
    }
    $this.addClass("bg85").attr("data-statu", "1");     //企业认证提交
    var name=$("#en-name").val();
    var enPerName = $("#en-per-name").val();
    var licenseImg = $("#license-img").attr("url");
    var fontImg = $("#font-img").attr("url");
    var reverImg = $("#rever-img").attr("url");
    var code = Int($("#en-code").val());
    var tel = $("#perCode").text();
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    var data={};
    if(!name){
        $this.removeClass("bg85").removeAttr("data-statu");
        return alert('请输入企业名称');
    }
    if(!enPerName){
        $this.removeClass("bg85").removeAttr("data-statu");
        return alert('请输入法人姓名');
    }
    if(!fontImg){
          $this.removeClass("bg85").removeAttr("data-statu");
          return alert('请上传法人身份证正面照片');
    }
    if(!reverImg){
        $this.removeClass("bg85").removeAttr("data-statu");
        return alert('请上传法人身份证反面照片');
    } 
    if(!licenseImg){
        $this.removeClass("bg85").removeAttr("data-statu");
        return alert('营业执照图片');
    } 
    // if(!regNumber.test(perCode)||perCode.length>4||perCode.length<4){
    //     $this.removeClass("bg85").removeAttr("data-statu");
    //     return alert('验证码只能为4位数字！');
    // }
    var data={
        name:name,
        company_name:enPerName,
        business_licence:licenseImg,
        front_img:fontImg,
        behind_img:reverImg,
        phone:tel,
        code:code,
    };
    $.ajax({
        url:"/admin/shopauth",
        data:JSON.stringify({action:"company_auth",data:data,_xsrf:window.dataObj._xsrf}),
        contentType:"application/json; charset=UTF-8",
        type:"post",
        success:function(res){
            if(res.success) {
                $('.success-type').text('企业认证');
                $('.check-time').text('24');
                $(".wrap-bm").addClass("hide").eq(2).removeClass("hide");
                $(".wrap-per-cert").remove();
                $(".scom").remove();
                $(".wrap-en-cert").remove();
                $(".encom").remove();
                $('.fail-notice').remove();
                $('.change-notice').remove();
            }else{
                $this.removeClass("bg85").removeAttr("data-statu");
                alert(res.error_text);
            }
        }
    });
}).on("click","#getPerCode",function(){   //获取验证码
    var $this = $(this);
    if($this.attr("data-statu")=="1") {
        return false;
    }
    $this.addClass("bg85").attr("data-statu", "1");
    var tel = $("#perCode").text();
    var data={
        phone:tel
    };
    var args={
        action:'get_code',
        data:data,
      _xsrf:window.dataObj._xsrf
    };
    $.ajax({
        url:"/admin/shopauth",
        type:"post",
        data:JSON.stringify(args),
        contentType:"application/json; charset=UTF-8",
        success:function(res){
            if(res.success) {
                getCertCode($this);
            }else{
                $this.removeClass("bg85").removeAttr("data-statu").html("获取验证码");
                alert(res.error_text);
            }
        }
    });
}).on("click","#getEnCode",function(){
    var $this = $(this);
    if($this.attr("data-statu")=="1") {
        return false;
    }
    $this.addClass("bg85").attr("data-statu", "1");
    var tel = $("#perCode").text();
    var data={
        phone:tel
    };
    var args={
        action:'get_code',data:data,_xsrf:window.dataObj._xsrf
    };
    $.ajax({
        url:"/admin/shopauth",
        data:JSON.stringify(args),
        contentType:"application/json; charset=UTF-8",
        type:"post",
        success:function(res){
            if(res.success) {
                getCertCode($this);
            }else{
                $this.removeClass("bg85").removeAttr("data-statu").html("获取验证码");
                alert(res.error_text);
            }
        }
    });
});

function isIdCardNo(num)
{ 
    num = num.toUpperCase(); 
    if (!(/(^\d{15}$)|(^\d{17}([0-9]|X)$)/.test(num))) 
    {
      return false;
    }
}

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
        uptoken: $('#data').val(),
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
                $("#person-img").attr("url","http://shopimg.qiniudn.com/"+file.id);
            },
            'Error': function (up, err, errTip) {
                if (err.code == -600) {
                    alert("图片大小不能超过4M哦");
                } else if (err.code == -601) {
                    alert("图片格式不对哦");
                } else if (err.code == -200) {
                    alert("当前页面过期，请刷新页面再上传");
                } else {
                    alert(err.code + ": " + err.message);
                }
                up.removeFile(err.file.id);
                $("#person-img").attr("src","").attr("url","").closest(".wrap-img").addClass("hide");
            },
            'Key': function (up, file) {
                var key = file.id;
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
        uptoken: $('#data').val(),
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
                $("#license-img").attr("url","http://shopimg.qiniudn.com/"+file.id);
            },
            'Error': function (up, err, errTip) {
                if (err.code == -600) {
                    alert("图片大小不能超过4M哦");
                } else if (err.code == -601) {
                    alert("图片格式不对哦");
                } else if (err.code == -200) {
                    alert("当前页面过期，请刷新页面再上传");
                } else {
                    alert(err.code + ": " + err.message);
                }
                up.removeFile(err.file.id);
                $("#license-img").attr("src","").attr("url","").closest(".wrap-img").addClass("hide");
            },
            'Key': function (up, file) {
                var key = file.id;
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
        uptoken: $('#data').val(),
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
                $("#font-img").attr("url","http://shopimg.qiniudn.com/"+file.id);
            },
            'Error': function (up, err, errTip) {
                if (err.code == -600) {
                    alert("图片大小不能超过4M哦");
                } else if (err.code == -601) {
                    alert("图片格式不对哦");
                } else if (err.code == -200) {
                    alert("当前页面过期，请刷新页面再上传");
                } else {
                    alert(err.code + ": " + err.message);
                }
                up.removeFile(err.file.id);
                $("#font-img").attr("src","").attr("url","").closest(".wrap-img").addClass("hide");
            },
            'Key': function (up, file) {
                var key = file.id;
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
        uptoken: $('#data').val(),
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
                $("#rever-img").attr("url","http://shopimg.qiniudn.com/"+file.id);
            },
            'Error': function (up, err, errTip) {
                if (err.code == -600) {
                    alert("图片大小不能超过4M哦");
                } else if (err.code == -601) {
                    alert("图片格式不对哦");
                } else if (err.code == -200) {
                    alert("当前页面过期，请刷新页面再上传");
                } else {
                    alert(err.code + ": " + err.message);
                }
                up.removeFile(err.file.id);
                $("#rever-img").attr("src","").attr("url","").closest(".wrap-img").addClass("hide");
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
            preloader.downsize( 260, 150 ,true);//先压缩一下要预览的图片,宽，高
            var imgsrc = preloader.type=='image/jpeg' ? preloader.getAsDataURL('image/jpeg',70) : preloader.getAsDataURL(); //得到图片src,实质为一个base64编码的数据
            callback && callback(imgsrc); //callback传入的参数为预览图片的url
            preloader.destroy();
            preloader = null;
        };
        preloader.load( file.getSource() );
    }
}
