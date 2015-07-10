/**
 * Created by Administrator on 2015/7/6.
 */
var cur_item = null;
$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height-40+"px");
    chooseStatus();
    chooseAuth();
    new QRCode($("#big-code2")[0],{
        width : 150,
        height : 150
    }).makeCode($("#shop_link").html());
}).on("click",".cancel-bbtn",function(){
    $(this).closest(".pop-bwin").addClass("hide");
}).on("click",".ok-bbtn",function(){
    var action = $(this).attr("data-action");
    infoEdit(action);
}).on("click",".un_edit",function(){
    Tip("该项当前不能被编辑");
}).on("click",".edit_item",function(){
    var action = $(this).attr("data-action");
    cur_item = $(this);
    if(action=="intro"){
        $("#b_title").html("店铺简介");
        $(".shop_area").val($(this).children(".fr").html()).removeClass("hide");
        $(".shop_text").addClass("hide");
    }else{
        if(action=="name"){
            $("#b_title").html("店铺名称");
        }else if(action=="phone"){
            $("#b_title").html("联系电话");
        }else if(action=="code"){
            if($(this).children(".fr").html()=="未设置"){
                $("#b_title").html("店铺号");
            }else{
                Tip("该项当前不能被编辑");
                return false;
            }
        }
        if(action=="code"){
            $(".shop_text").val("").attr("placeholder","店铺号设置后不能再被编辑").removeClass("hide");
        }else{
            if(action=="phone"){
                $(".shop_text").attr("type","tel");
            }
            $(".shop_text").val($(this).children(".fr").html()).removeClass("hide");
        }
        $(".shop_area").addClass("hide");
    }
    $(".ok-bbtn").attr("data-action",action);
    $(".pop-name").removeClass("hide");
    if(action=="intro"){
        $(".shop_area").focus();
    }else{
        $(".shop_text").focus();
    }
}).on("click",".un_edit",function(){
    Tip("该项当前不能被编辑");
}).on("click",".pc_edit",function(){
    Tip("请在电脑上进行此项编辑");
}).on("click","#shop_status",function(){
    $("#b_title").html("店铺状态");
    $(".ok-bbtn").attr("data-action","status");
    $(".pop-status").removeClass("hide");
}).on("click",".status-list li",function(){
    var index = $(this).index();
    $(".status-list li").removeClass("active").eq(index).addClass("active");
}).on("click",".b-close",function(){
    $(".pop-code2").addClass("hidden");
}).on("click","#shop_code2",function(){
    $(".pop-code2").removeClass("hidden");
});

function chooseStatus(){
    var $obj = $("#shop_status");
    var $status = $obj.children(".shop_status");
    var id = parseInt($obj.attr("data-id"),10);
    $(".status-list li").removeClass("active").eq(3-id).addClass("active");
    switch (id){
        case 0:
            $status.html("店铺关闭");
            break;
        case 1:
            $status.html("营业中");
            break;
        case 2:
            $status.html("筹备中");
            break;
        case 3:
            $status.html("休息中");
            break;
    }
}
function chooseAuth(){
    var $obj = $("#shop_auth");
    var $status = $obj.children(".shop_auth");
    var id = parseInt($obj.attr("data-id"),10);
    if(id == 1 || id == 4){
        $status.html('个人认证');
    }else if(id == 2 || id == 3){
        $status.html('企业认证');
    }else{
        $status.html('未认证');
    }
}
var isOri = "";
$(document).ready(function(){
    var uploader = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'shop_img',
        container: 'shop_img_box',
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
                        $("#shop_logo").attr("src",imgsrc).addClass(isOri);
                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                $("#shop_logo").attr("url","http://shopimg.qiniudn.com/"+file.id);
                infoEdit("edit_shop_logo");
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
                $("#shop_logo").attr("src",$("#shop_logo").attr("url")).removeClass(isOri);
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
function infoEdit(action_name){
    var url="/admin/config/shop";
    var action_name=action_name;
    var data={};
    var action,shop_name,shop_intro,shop_city,shop_address_detail,have_offline_entity,address,entity_text,shop_code,shop_phone;
    if(action_name=='name'){
        action='edit_shop_name';
        shop_name= $.trim($('.shop_text').val());
        if(shop_name.length>15){return Tip('店铺名称请不要超过15个字符！')}
        data={shop_name:shop_name};
    }else if(action_name=='code'){
        var reg=/^\w+$/;
        action='edit_shop_code';
        shop_code=$.trim($('.shop_text').val());
        if(!reg.test(shop_code)){return Tip('店铺号只能为字母、数字以及下划线组成！')}
        if(shop_code.length<6){return Tip('店铺号至少为6位数！')}
        data={shop_code:shop_code};
    }else if(action_name=='intro'){
        action='edit_shop_intro';
        shop_intro=$('.shop_area').val();
        if(shop_intro.length>300){return Tip('店铺简介请不要超过300个字符！')}
        data={shop_intro:shop_intro};
    }else if(action_name=='phone'){
        action='edit_phone';
        shop_phone=$('.shop_text').val();
        if(shop_phone.length=0){return Tip('"电话不能为空o(╯□╰)o"')}
        data={shop_phone:shop_phone};
    }else if(action_name=='area'){
        action='edit_deliver_area';
        //data=area_data;
    }else if(action_name=='entity'){
        action='edit_have_offline_entity';
        var entity=$('#offline_entity').attr('data-id');
        if(entity==1) have_offline_entity=1;
        else have_offline_entity=0;
        entity_text=$('#offline_entity').text();
        data={have_offline_entity:have_offline_entity};
    }else if(action_name=='status'){
        action='shop_status';
        var status_item = $(".status-list").children(".active");
        var shop_status=status_item.attr('data-id');
        var status_text=status_item.html();
        data={shop_status:shop_status};
    }else if(action_name=='edit_shop_logo'){
        action = "edit_shop_logo";
        data={img_url:$("#shop_logo").attr("url")};
    }
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            if(action_name=='name'){
                cur_item.children(".fr").html(shop_name);
                $(".pop-name").addClass("hide");
                Tip("店铺名称编辑成功");
            }
            else if(action_name=='code')
            {
                cur_item.children(".fr").html(shop_code);
                cur_item.removeClass("edit_item").addClass("un_edit");
                $("#shop_link").html("http://senguo.cc/"+shop_code);
                $(".pop-code2").addClass("hidden");
                Tip("店铺号编辑成功");
                $("#big-code2").empty();
                new QRCode($("#big-code2")[0],{
                    width : 150,
                    height : 150
                }).makeCode($("#shop_link").html());
            }
            else if(action_name=='intro')
            {
                cur_item.children(".fr").html(shop_intro);
                $(".pop-name").addClass("hide");
                Tip("店铺简介编辑成功");
            }
            else if(action_name=='phone')
            {
                cur_item.children(".fr").html(shop_phone);
                $(".pop-name").addClass("hide");
                Tip("联系电话编辑成功");
            }
            else if(action_name=='area')
            {

            }
            else if(action_name=='entity'){

            }
            else if(action_name=='status'){
                $(".shop_status").html(status_text);
                $(".pop-status").addClass("hide");
                Tip("店铺状态切换成功")
            }else if(action_name=='edit_shop_logo'){
                Tip("店铺logo编辑成功");
            }
        }else{
            Tip(res.error_text);
        }
    });
}