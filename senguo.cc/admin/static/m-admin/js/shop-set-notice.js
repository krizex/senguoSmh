/**
 * Created by Administrator on 2015/7/6.
 */
$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height-40+"px");
}).on("click",".backset",function(){
    if(confirm("当前公告未完成，确定返回吗？")){
        window.location.href="/madmin/shopattr?action=notice";
    }
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
}).on("click",".picture-list li",function(e){
    var imgurl=$(this).find("img").attr("src");
    var _url=$(this).find("img").attr("url");
    if($(e.target).closest(".del-pic-img").size()==0){
        $("#notice_img").attr({"url":_url,"src":_url+"?imageView2/1/w/180/h/80"});
        $(".img-cover").addClass("hide");
        $(".del-img").removeClass("hide");
        $(".moxie-shim").addClass("hide");
        $(".pop-picture-library").addClass("hide");
        $(".notive-temp-img").removeClass("hidden");
        $("#add-notice-img").addClass("hidden");
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
}).on("click",".pop-picture-library .cancel-btn",function(){
    $(this).closest(".pop-picture-library").addClass("hide");
}).on("click",".del-pic-img",function(){
    if(confirm("是否将该图片从图片库删除？")){
        var $this=$(this);
        var id=$this.parents(".picture-list-item").attr("data-id");
        var url = "/admin/picture";
        var args={
            action:"del",
            data:{
                id:id
            }
        }
         $.postJson(url,args,function(res) {
            if (res.success) {
               $this.parents(".picture-list-item").remove();
            }else{
                Tip(res.error_text);
            }
        },function(){
            return Tip('您的网络暂时不通畅，请稍候再试');
        });
    }
}).on("click",".link-type li",function(){
    var $this=$(this);
    $this.addClass("active").siblings("li").removeClass("active");
}).on("click","#add-notice-img",function(){
    getPicture(pictureType,0);
    $(".pop-picture-library").removeClass("hide");
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
                $(".pop-picture-library").addClass("hide");
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


var pictureType="notice",_page = 0,nomore=false,_finished=true,_total;
function getPicture(action,page){
     $.ajax({
        url:'/admin/picture?action='+action+'&page='+page,
        type:"get",
        success:function(res){
            if(res.success){
                var data = res.datalist;
                if(page==0){
                   _total = res.total_page; 
                   nomore=false;
                   _page = 0;
                }
                if(_total<=page){
                    nomore=true;
                }
                if(page==0){
                    $('.upload-pic-list').empty();
                }
                var item='<li class="img-bo picture-list-item" data-id="{{id}}">'+
                        '<a href="javascript:;" class="del-pic-img">x</a>'+
                        '<div class="img-selected">已选</div>'+
                        '<img src="{{imgurl}}?imageView2/1/w/80/h/80" url="{{imgurl}}" alt="商品图片"/>'+
                    '</li>';
                for(var key in data){
                    var render = template.compile(item);
                    var html = render({
                        imgurl:data[key]['imgurl'],
                        id:data[key]['id']
                    });
                    $('.upload-pic-list').append(html);
                }
                _finished = true;
            }
        }
    });
};


$('.picture-library').scroll(function(){
    var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
    var range = 150;             //距下边界长度/单位px          //插入元素高度/单位px
    var totalheight = 0;
    var main = $('.picture-library');              //主体元素
    totalheight = parseFloat($(window).height()) + parseFloat(srollPos);
    console.log(_finished);
    console.log((main.height()-range) <= totalheight);
    console.log(nomore);
    if(_finished&&(main.height()-range) <= totalheight  && nomore==false) {
        _finished=false;
        _page = _page+1;
        getPicture(pictureType,_page);
    }
});
var link = "/admin/config";
function noticeAdd(){
    var url=link;
    var action="add_notice";
    var summary= $.trim($('.new-notice-title').val());
    var detail=$.trim($('.new-notice-detail').val());
    var img_url=$("#notice_img").attr("url");
    var _link=$(".new-notice-link").val().trim();
    var link_type=parseInt($(".link-type .active").attr("data-id"));
    if(summary.length>15){return Tip('摘要请不要超过15个字！')}
    if(detail.length>200){return Tip('详情请不要超过200个字！')}
    if(!summary){return Tip('请输入摘要！')}
    if(!detail&&!_link){return Tip('请填入详情或链接！')}
    if(link.length>50){return Tip('链接请不要超过50个字！')}
    var data={
        summary:summary,
        detail:detail,
        img_url:img_url,
        link:_link,
        link_type:link_type
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
    var _link=$(".new-notice-link").val().trim();
    var link_type=parseInt($(".link-type .active").attr("data-id"));
    if(summary.length>15){return Tip('摘要请不要超过15个字！')}
    if(detail && detail.length>200){return Tip('详情请不要超过200个字！')}
    if(!summary){return Tip('摘要不能为空！')}
    if(!detail&&!_link){return Tip('请填入详情或链接！')}
    if(link.length>50){return Tip('链接请不要超过50个字！')}
    var data={
        notice_id:notice_id,
        summary:summary,
        detail:detail,
        img_url:img_url,
        link:_link,
        link_type:link_type
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
//android端上传图片
function uploadImgForAndroid(url){
    $("#notice_img").attr("src",url+"?imageView2/1/w/100/h/100").attr("url",url);
    $(".img-cover").addClass("hide");
    $(".del-img").removeClass("hide");
    $(".moxie-shim").addClass("hide");
    $(".pop-picture-library").addClass("hide");
}