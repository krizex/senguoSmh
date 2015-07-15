$(document).ready(function(){
    //添加公告
    $('.add-new-notice').on('click',function(){
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
}).on('click','.info-edit',function(){
    var $this=$(this);
    var parent=$this.parents('.set-list-item');
    parent.find('.edit-img').attr("id","upload-per");
    parent.siblings('.set-list-item').find('.edit-img').attr("id","");
    parent.siblings('.set-list-item').find(".address-show").show().siblings(".address-edit").hide();
      //公告背景添加
    var uploader = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'upload-per',
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
                        parent.find(".preview-img").attr("src",imgsrc);
                        parent.find('.notice_img').attr("src",imgsrc);
                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                parent.find(".preview-img").attr("url","http://shopimg.qiniudn.com/"+file.id);
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
});
function noticeAdd(){
    var url=link;
    var action="add_notice";
    var summary=$('.new-notice-title').val();
    var detail=$('.new-notice-detail').val();
    var img_url=$("#add-img").attr("url");
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
                $('#noticeBox').modal('hide');
		window.location.reload();
            }
            else return Tip(res.error_text);
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~')});
}
function noticeEdit(target){
    var url=link;
    var action="edit_notice";
    var parent=target.parents('.set-list-item');
    var notice_id=parent.data('id');
    var summary=parent.find('.notice_summary').val();
    var detail=parent.find('.notice_detail').val();
    var img_url=parent.find(".preview-img").attr("url");
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
                parent.find('.notice_summary').val(summary);
                parent.find('.notice_detail').val(detail);
                parent.find('.summary').text(summary);
                parent.find('.detail').text(detail);
                parent.find('.address-edit').hide();
                parent.find('.address-show').show();
            }
            else return Tip(res.error_text);
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~')});
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
