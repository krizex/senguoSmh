var NoticeEdit,imgIndex;
pictureType = "notice";
$(document).ready(function(){
    //添加公告
    $('.add-new-notice').on('click',function(){
        if(NoticeEdit){
            return Tip("请先完成正在编辑的公告");
        }
        noticeAdd();
    });
    //公告启用状态显示
    $('.notice_active').each(function(){
        var $this=$(this);
        var status=$this.data('status');
        switch (status){
            case status=1:$this.find('.work-mode').show().siblings('.stop-mode').hide();break;
            case status=2:$this.find('.work-mode').hide().siblings('.stop-mode').show();break;
        }
    });
    //公告启用/停用
    $('.notice_active').on('click',function(){
        noticeActive($(this));
    });
    //公告编辑
    $('.notice_edit').on('click',function(){
        noticeEdit($(this));
    });
    var zb_t;
    window.onbeforeunload = function(){
        if(NoticeEdit==true){
            setTimeout(function(){zb_t = setTimeout(onunloadcancel, 0)}, 0);
            return "当前有公告正在编辑还未保存，确定离开此页？";
        }
    }
    window.onunloadcancel = function(){
        clearTimeout(zb_t);
    }
}).on("click","#upload-add",function(){
    $(".pop-picture-library").show().attr({"action":"add"});
    getPicture("notice",0);
}).on("click",".link-type li",function(){
    var $this=$(this);
    $this.addClass("active").siblings("li").removeClass("active");
}).on("click",".notice-type-choose li",function(){
    var $this=$(this);
    var index=$this.index();
    $this.addClass("active").siblings("li").removeClass("active");
    $(".set-list").eq(index).show().siblings(".set-list").hide();
    if(index==0){
        $(".add-btn-sty").show();
    }else{
        $(".add-btn-sty").hide();
    }
}).on("click",".href_type",function(){
    $(this).addClass("active").siblings().removeClass("active");
}).on("click",".add-new-address1",function(){
    if(NoticeEdit){
        return Tip("请先完成正在编辑的公告");
    }
    $("#noticeBox").modal("show");
    zb_timer = setTimeout(function(){
        var uploader1 = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'upload-picture',
        container: 'wrap-legal-img',
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
        uptoken: $('#data').val(),
        unique_names: false,
        save_key: false,
        auto_start: true,
        init: {
            'FilesAdded': function (up, files) {
                var file = files[0];
                !function(){
                    previewImage(file,function(imgsrc){
                        $("#add-img").attr("src",imgsrc);
                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                $("#add-img").attr("url","http://7rf3aw.com2.z0.glb.qiniucdn.com/"+file.id).removeClass("hide");
                $(".pop-picture-library").hide();
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
            },
            'Key': function (up, file) {
                var key = file.id;
                return key;
            }
        }
    });
},500);
}).on("click",".add-new-address1",function(){
    if(NoticeEdit){
        return Tip("请先完成正在编辑的公告");
    }
    $("#noticeBox").modal("show");
}).on('click','.notice-edit',function(){
    if(NoticeEdit){
        Tip("请先完成正在编辑的公告");
        return false;
    }
    NoticeEdit=true;
    var $this=$(this);
    var parent=$this.parents('.set-list-item');
    parent.find('.address-show').hide();
    parent.find('.address-edit').show();
    parent.find('.edit-img').attr("id","upload-per");
    parent.siblings('.set-list-item').find('.edit-img').attr("id","");
    parent.siblings('.set-list-item').find(".address-show").show().siblings(".address-edit").hide();
      //公告背景添加
}).on("click","#upload-per",function(){
    imgIndex=$(this).parents(".set-list-item").index();
    $(".pop-picture-library").show().attr({"action":"edit"});
    getPicture("notice",0);
    var parent=$(this).parents(".set-list-item");
    var uploader = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'upload-picture',
        container: 'upload-area',
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
        uptoken: $('#data').val(),
        unique_names: false,
        save_key: false,
        auto_start: true,
        init: {
            'FilesAdded': function (up, files) {
                var file = files[0];
                !function(){
                    previewImage(file,function(imgsrc){
                        parent.find(".preview-img").attr("src",imgsrc);
                        parent.find('.notice_img').attr("src",imgsrc);
                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                parent.find(".preview-img").attr("url","http://7rf3aw.com2.z0.glb.qiniucdn.com/"+file.id);
                $(".pop-picture-library").hide();
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
                parent.find(".preview-img").attr("src","").attr("url","").closest(".wrap-img").addClass("hide");
            },
            'Key': function (up, file) {
                var key = file.id;
                return key;
            }
        }
    });
}).on("click",".picture-list li",function(e){
    if($(e.target).closest(".del-pic-img").size()==0){
        var action=$(".pop-picture-library").attr("action");
        var img_url=$(this).find("img").attr("url");
        if(action=="edit"){
            $(".set-list-item").eq(imgIndex-1).find("img").attr({"src":img_url+"?imageView2/1/w/180/h/100"});
            $(".set-list-item").eq(imgIndex-1).find(".preview-img").attr({"url":img_url});
        }else{
            $("#add-img").attr({"url":img_url,"src":img_url}).removeClass("hide");
        }
        
        $(".pop-picture-library").hide(); 
    }
}).on("click",".show-upload-list",function(){
    $(this).addClass("active").siblings("li").removeClass("active");
    $(".upload-pic-list").removeClass("hide");
    $(".picture-pagination").removeClass("hide");
    $(".default-pic-list").addClass("hide");
}).on("click",".show-default-list",function(){
    $(this).addClass("active").siblings("li").removeClass("active");
    $(".upload-pic-list").addClass("hide");
    $(".picture-pagination").addClass("hide");
    $(".default-pic-list").removeClass("hide");
});
function noticeAdd(){
    var url=link;
    var action="add_notice";
    var summary=$('.new-notice-title').val().trim();
    var detail=$('.new-notice-detail').val().trim();
    var img_url=$("#add-img").attr("url");
    var link=$(".new-notice-link").val().trim();
    var link_type=$(".link-type .active").attr("data-id");
    if(summary.length>15){return Tip('摘要请不要超过15个字！')}
    if(detail.length>200){return Tip('详情请不要超过200个字！')}
    if(!summary){return Tip('请输入摘要！')}
    if(!detail&&!link){return Tip('请填入详情或链接！')}
    if(link.length>50){return Tip('链接请不要超过50个字！')}
    if($('.add-new-notice').attr("data-flag")=="off") return false;
    $('.add-new-notice').attr("data-flag","off");
    var data={
        summary:summary,
        detail:detail,
        img_url:img_url,
        link:link,
        link_type:link_type
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $('#noticeBox').modal('hide');
		          window.location.reload();
            }else{
                $('.add-new-notice').attr("data-flag","on");
                return Tip(res.error_text);
            } 
        });
}
function noticeEdit(target){
    var url=link;
    var action="edit_notice";
    var parent=target.parents('.set-list-item');
    var notice_id=parent.data('id');
    var summary=parent.find('.notice_summary').val().trim();
    var detail
    var link=parent.find('.notice_link').val().trim();
    var link_type;
    var img_url=parent.find(".preview-img").attr("url");
     if(parent.find('.notice_detail').length!=0){
        detail=parent.find('.notice_detail').val().trim();
    }else{
        detail="";
    }
    if(parent.find(".href_type.active").length!=0){
        link_type=parseInt(parent.find(".href_type.active").attr("data-id"));
    }else{
        link_type=1;
    }
    if(summary.length>15){return Tip('摘要请不要超过15个字！')}
    if(detail.length>200){return Tip('详情请不要超过200个字！')}
    if(!summary){return Tip('摘要不能为空！')}
    if(!detail&&!link){return Tip('请填入详情或链接！')}
    if(link.length>50){return Tip('链接请不要超过50个字！')}
    if(target.attr("data-flag")=="off") return false;
    target.attr("data-flag","off");
    var data={
        notice_id:notice_id,
        summary:summary,
        detail:detail,
        img_url:img_url,
        link:link,
        link_type:link_type
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                parent.find('.notice_summary').val(summary);
                parent.find('.notice_detail').val(detail);
                parent.find('.notice_link').val(link);
                if(link_type==0){
                    detail=detail+" √";
                }else{
                    link=link+" √";
                }
                parent.find('.summary').text(summary);
                parent.find('.detail').text("").text(detail);
                parent.find('.link').text("").text(link);
                parent.find('.address-edit').hide();
                parent.find('.address-show').show();
                NoticeEdit=false;
                target.attr("data-flag","on");
            }else{
                target.attr("data-flag","on");
                return Tip(res.error_text);
            }
        });
}

function noticeActive(target){
    var url=link;
    var action="edit_notice_active";
    var notice_id=target.parents('.set-list-item').data('id');
    var status=target.attr('data-status');
    var data={
        notice_id:notice_id
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                if(status==1){
                    target.find('.work-mode').hide().siblings('.stop-mode').show();
                    target.attr({'data-status':2});
                }
                else {
                    target.find('.work-mode').show().siblings('.stop-mode').hide();
                    target.attr({'data-status':1});
                }
            }
            else return Tip(res.error_text);
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~')});
}

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
