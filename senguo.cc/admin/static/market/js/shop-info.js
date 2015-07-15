/**
 * Created by Administrator on 2015/7/6.
 */
var cur_item = null;
$(document).ready(function(){

}).on("click",".cancel-bbtn",function(){
    $(this).closest(".pop-bwin").addClass("hide");
}).on("click",".ok-bbtn",function(){
    var action = $(this).attr("data-action");
    infoEdit(action);
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
        }else if(action=="range"){
            $("#b_title").html("配送范围");
        }else if(action=="address"){
            $("#b_title").html("配送地址");
        }else if(action=="remark"){
            $("#b_title").html("备注");
        }
        if(action=="phone"){
            $(".shop_text").attr("type","tel");
        }
        $(".shop_text").val($(this).children(".fr").html()).removeClass("hide");
        $(".shop_area").addClass("hide");
    }
    $(".ok-bbtn").attr("data-action",action);
    $(".pop-name").removeClass("hide");
    if(action=="intro"){
        $(".shop_area").focus();
    }else{
        $(".shop_text").focus();
    }
}).on("click","#save_info",function(){//保存信息
    if($("#shop_shoper").html()!="未录入"){
        var id = $("#shoper").attr("data-id");
        window.location.href="/market/success?id="+id;
    }else{
        Tip("请先录入店长信息");
    }
}).on("click","#shoper",function(){//编辑店长信息
    var id = $("#shoper").attr("data-id");
    window.location.href="/market/shopinsert/"+id;
}).on("click","#staffer",function(){//编辑配送员信息
    var id = $("#shoper").attr("data-id");
    if($("#shop_shoper").html()!="未录入"){
        window.location.href="/market/shopinsert/"+id+"?staff=1";
    }else{
        return Tip("请先编辑店长信息");
    }
});
/*保存信息*/
function infoEdit(action_name){
    var url="";
    var action_name=action_name;
    var data={};
    var action,shop_name,shop_address,shop_phone,shop_area,shop_licence,shop_remark;
    if(action_name=='name'){
        action='name';
        shop_name= $.trim($('.shop_text').val());
        data={shop_name:shop_name};
    }else if(action_name=='phone'){
        action='phone';
        shop_phone=$('.shop_text').val();
        data={shop_phone:shop_phone};
    }else if(action_name=='area'){
        action='deliver_area';
        shop_area = $('.shop_text').val();
        data={deliver_area:shop_area};
    }else if(action_name=='address'){
        action = "shop_address";
        shop_address = $('.shop_text').val();
        data={shop_address:shop_address};
    }else if(action_name=='licence'){
        action = "shop_auth";
        shop_licence = $('#add-licence').attr("url");
        data={shop_auth:shop_licence};
    }else if(action_name=='remark'){
        action = "description";
        shop_remark = $('.shop_text').val();
        data={description:shop_remark};
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
            else if(action_name=='phone')
            {
                cur_item.children(".fr").html(shop_phone);
                $(".pop-name").addClass("hide");
                Tip("联系电话编辑成功");
            }
            else if(action_name=='area')
            {
                cur_item.children(".fr").html(shop_area);
                $(".pop-name").addClass("hide");
                Tip("配送范围编辑成功");
            }
            else if(action_name=='address'){
                cur_item.children(".fr").html(shop_address);
                $(".pop-name").addClass("hide");
                Tip("店铺地址编辑成功");
            }
            else if(action_name=='licence'){
                $("#shop_licence").children("span").html("已录入");
                Tip("营业执照录入成功");
            }
            else if(action_name=='remark'){
                cur_item.children(".fr").html(shop_remark);
                $(".pop-name").addClass("hide");
                Tip("备注成功");
            }
        }else{
            Tip(res.error_text);
        }
    });
}
$(document).ready(function(){
    var uploader = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'add-licence',
        container: 'add-licence-box',
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
                $(".loading").prev("span").hide();
                $(".loading").show();
                var file = files[0];
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                $("#add-licence").attr("url","http://shopimg.qiniudn.com/"+file.id);
                $(".loading").hide();
                $(".loading").prev("span").html("已录入").show();
                infoEdit("licence");
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
