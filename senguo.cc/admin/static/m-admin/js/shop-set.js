/**
 * Created by Administrator on 2015/7/6.
 */
$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height-40+"px");
}).on("click","#receipt_switch",function(){
    if($(".switch-btn").hasClass("switch-abtn")){
        receiptImgActive(1);
    }else{
        receiptImgActive(0);
    }
}).on("click",".cancel-bbtn",function(){
    $(this).closest(".pop-bwin").addClass("hide");
}).on("click",".ok-bbtn",function(){
    receiptEdit();
}).on("click","#receipt_msg",function(){
    $(".pop-bwin").removeClass("hide");
    $(".shop_text").focus();
}).on("click","#phone_verify",function(){
    if($(".switch-btn").hasClass("switch-abtn")){
        phoneVerify(1);
    }else{
        phoneVerify(0);
    }
}).on("click",".tpl-list li",function(e){
    if($(e.target).closest(".preview-btn").size()==0){
        if(confirm("切换后店铺界面将会被改变，确定切换？")){
            var index = $(this).index();
            switchTpl(index);
        }
    }
}).on("click",".preview-btn",function(){//预览
    $(".tpl-big-img").attr("src",$(this).closest("li").find("img").attr("src"));
    $(".pop-tpl").removeClass("hide");
}).on("click","#close-pop",function(){
    $(".pop-tpl").addClass("hide");
}).on("click","#qa",function(){
    $(this).addClass("hide");
    $(".pop-qa").removeClass("hide");
}).on("click","#close-pop",function(){
    $("#qa").removeClass("hide");
    $(".pop-qa").addClass("hide");
}).on("click",".switch-notice",function(){//切换公告状态
    var id = $(this).attr("data-id");
    if($(this).hasClass("switch-abtn")){
        switchNotice(1,id,$(this));
    }else{
        switchNotice(0,id,$(this));
    }
}).on("click",".del-notice",function(){//删除公告
    var id = $(this).attr("data-id");
    //delNotice(id);
}).on("click",".switch-pay",function(){//支付方式
    var action = $(this).attr("data-action");
    if($(this).hasClass("switch-abtn")){
        switchPay(1,action,$(this));
    }else{
        switchPay(0,action,$(this));
    }
}).on("click",".wrap-pay-more",function(){
    $(this).toggleClass("wrap-apay-more");
    $(this).next(".wrap-pay-text").toggleClass("hide");
});
/*支付方式*/
function switchPay(active,type,$obj){
    var url='/admin/config';
    var action="";
    if(type=="online"){
        action = "online_on";
    }else if(type=="balance"){
        action="balance_on";
    }else{
        action="cash_on";
    }
    var args={
        action:action,
        data:''
    };
    $.postJson(url,args,
        function(res){
            if (active == 1) {
                $obj.removeClass("switch-abtn");
                $obj.children("span").html("未启用");
                Tip("该支付方式已关闭");
            }
            else {
                $obj.addClass("switch-abtn");
                $obj.children("span").html("已启用");
                Tip("该支付方式已开启");
            }
        });
}
/*切换公告*/
function switchNotice(active,id,$obj){
    var url='/admin/config';
    var data={notice_id:id};
    var action="edit_notice_active";
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if (active == 1) {
                $obj.removeClass("switch-abtn");
                $obj.children("span").html("未启用");
                Tip("该公告已关闭");
            }
            else {
                $obj.addClass("switch-abtn");
                $obj.children("span").html("已启用");
                Tip("该公告已开启");
            }
        });
}
/*切换模版*/
function switchTpl(id){
    var url='/admin/config';
    var data={tpl_id:id};
    var action="tpl_choose";
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $(".tpl-list li").removeClass("active").eq(id).addClass("active");
                Tip("店铺模版切换成功");
            }else{
                return Tip(res.error_text);
            }
        });
}
/*首单验证*/
function phoneVerify(active){
    var url='/admin/config';
    var action="text_message_on";
    var args={
        action:action,
        data:''
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                if (active == 1) {
                    $(".switch-btn").removeClass("switch-abtn");
                    $(".switch-btn").children("span").html("未启用");
                    Tip("首单短信验证已关闭");
                }
                else {
                    $(".switch-btn").addClass("switch-abtn");
                    $(".switch-btn").children("span").html("已启用");
                    Tip("首单短信验证已开启");
                }
            }
            else{
                Tip(res.error_text);
            }
        }
    );
}
function receiptEdit() {
    var url = '/admin/config';
    var action = "edit_receipt";
    var receipt_msg = $('.shop_text').val();
    if (!receipt_msg) {
        receipt_msg = '';
    }
    if (receipt_msg.length > 20) {
        return Tip('小票附加消息请不要超过20个字！');
    }
    var data = {
        receipt_msg: receipt_msg
    };
    var args = {
        action: action,
        data: data
    };
    $.postJson(url, args,
        function (res) {
            if (res.success) {
                $("#receipt_msg").children(".fr").html(receipt_msg || '无');
                $(".pop-bwin").addClass("hide");
                Tip("附加消息编辑成功");
            }else{
                Tip(res.error_text);
            }
        })
}
/*小票图启用*/
function receiptImgActive(active){
    var url = '/admin/config';
    var action = "recipe_img_on";
    var args = {
        action: action,
        data: ''
    };
    $.postJson(url, args,
        function (res) {
            if (active == 1) {
                $(".switch-btn").removeClass("switch-abtn");
                $(".switch-btn").children("span").html("未启用");
                $(".wrap-receipt-img").addClass("hide");
            }
            else {
                $(".switch-btn").addClass("switch-abtn");
                $(".switch-btn").children("span").html("已启用");
                $(".wrap-receipt-img").removeClass("hide");
            }
        })
}
/*小票图片*/
function receiptImg(){
    var url = '/admin/config';
    var action = "edit_receipt_img";
    var data = {receipt_img:$("#receipt_img").attr("url")};
    var args = {
        action: action,
        data: data
    };
    $.postJson(url, args,
        function (res) {
            if(res.success){
                Tip("小票图片编辑成功");
            }else{
                Tip(res.error_text);
            }
        });
}
var isOri = "";
$(document).ready(function(){
    if($(".receipt-token").size()==0){
        return false;
    }
    var uploader = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'receipt_aimg',
        container: 'receipt_aimg_box',
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
                        $("#receipt_img").attr("src",imgsrc).addClass(isOri);
                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                $("#receipt_img").attr("url","http://7rf3aw.com2.z0.glb.qiniucdn.com/"+file.id);
                receiptImg();
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
                $("#receipt_img").attr("src",$("#receipt_img").attr("url")).removeClass(isOri);
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