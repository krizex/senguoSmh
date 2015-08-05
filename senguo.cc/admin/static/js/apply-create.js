var area = window.dataObj.area,type=0;
$(document).ready(function(){
    //初始化省份
    for(var key in area){
        var $item=$('<li></li>');
        var city=area[key]['city'];
        var if_city;
        if(city) {
            if_city='1';//有子城市
        }
        else if_city='0';
        $item.attr({'data-code':key,'data-city':if_city}).html(area[key]['name']);
        $('#privince_list').append($item);
    }
    initBmap();
}).on("click",".pop-bwin",function(e){
    if($(e.target).closest(".wrap-address-list").size()==0){
        $(".pop-bwin").addClass("hide");
    }
}).on("click","#privince_list li",function(){
    var if_city = parseInt($(this).attr("data-city"));
    var code = $(this).attr("data-code");
    var name = $(this).html();
    if(if_city==1){
        $(".choose-title").html("选择城市");
        $('#city_list').empty();
        for(var key in area){
            var city=area[key]['city'];
            if(code==key){
                for(var k in city){
                    var $item=$('<li></li>');
                    $item.attr({'data-code':k}).html(city[k]['name']);
                    $('#city_list').append($item);
                }
            }
        }
        $(".province").html(name).attr("data-code",code);
        $("#privince_list").addClass("hide");
        $("#city_list").removeClass("hide");
    }else{
        $(".address").attr("data-code",code);
        $(".province").html(name).attr("data-code",code);
        $(".city").html(name).attr("data-code",code);
        $(".pop-bwin").addClass("hide");
    }
}).on("click","#city_list li",function(){
    var code = $(this).attr("data-code");
    var name = $(this).html();
    $(".address").attr("data-code",code);
    $(".city").html(name).attr("data-code",code);
    $(".pop-bwin").addClass("hide");
    $("#privince_list").removeClass("hide");
    $("#city_list").addClass("hide");
}).on("click",".province",function(){
    if($(this).hasClass("forbidden")){
        return Tip("当前只支持湖北省范围");
    }
    $(".choose-title").html("选择省份");
    $(".pop-bwin").removeClass("hide");
}).on("click",".city",function(){
    if($(this).hasClass("forbidden")){
        return Tip("当前只支持武汉市范围");
    }
    $(".choose-title").html("选择省份");
    $(".pop-bwin").removeClass("hide");
}).on("click",".tab-list li",function(){
    var index = $(this).index();
    if(index==2){
        return Tip("该功能还在开发中");
    }
    $(".tab-list li").removeClass("active").eq(index).addClass("active");
    $(".tab-content .tab-item").addClass("hide").eq(index).removeClass("hide");
    type = index;
}).on("click",".plant-list li",function(){
    var index = $(this).index();
    $(".plant-list li").removeClass("active").eq(index).addClass("active");
}).on("click",".shop-list li",function(){
    var num=parseInt($(".shop-number").text());
    //console.log($(this).hasClass("active"));
    if($(this).not(".active")){
        $(".shop-number").text(num+1);
    }
    if($(this).hasClass("active")){
        $(".shop-number").text(num-1);
    }
    $(this).toggleClass("active");
}).on("click",".last-choose",function(){
    var $this=$(this);
    if($(".shop-list .active").length==0){
        $this.find(".checkbox-btn").removeClass("checked-btn");
        return Tip("请选择您要导入的店铺");
    }
    $(this).addClass("active").children("i").toggleClass("checked-btn");
    // if($this.attr("data-status")=="on"){
    //     $(this).attr({"data-status":""});
    //     $(".shop-list li").removeClass("active");
    //     $(".shop-number").text(0);
    // }else{
    //     $(this).attr({"data-status":"on"});
    //     $(".shop-list li").addClass("active");
    //     $(".shop-number").text($(".shop-list .active").length);
    // }
}).on("click",".search-btn",function(){
    var shop_name=$("#shop_name").val().trim();
    if(!shop_name){
        return Tip("请输入店铺名称");
    }
    var item='<li data-id={{id}}>'+
                '<i class="checkbox-btn"></i>'+
                '<img class="shop-img" src="{{logo}}" alt="店铺logo"/>'+
                '<div class="shop-item">'+
                    '<p class="c333">{{shop_name}}</p>'+
                    '<p class="c666">{{address}}</p>'+
                '</div>'+
            '</li>';
    var data={"shop_name":shop_name}
    $(".shop-list").empty();
    var url="";
    var args={action:"search",data:data};
    $.postJson(url,args,function(res){
        if(res.success) {
           var shops=res.data;
           if(shops.length==0){
             return Tip("无搜索结果");
           }
            for(var key in shops){
                var shop=shops[key];
                var render=template.compile(item);
                var content=render({
                    id:shop.id,
                    logo:shop.logo,
                    address:shop.address,
                    shop_name:shop.shop_name
                });
                $(".shop-list").append(content);
            }
        }else{
            Tip(res.error_text);
        }
    });
}).on("click","#commit_shop",function(){//提交
    if(type==0){//手动创建
        commitHand($(this));
    }else if(type==1){
        if($(".last-choose").hasClass("active")){
            importShop($(this));
        }else{
            return Tip("请确认认领以上店铺");
        }

    }else{

    }
});
function commitHand($btn){
    if($btn.attr("data-flag")=="off"){
        return Tip("请勿重复提交");
    }
    var shop_name = $.trim($(".shop_name").val());
    if(shop_name=="" || shop_name.length>15){
        return Tip("店铺名称不能为空且不能超过15个字符");
    }
    var shop_logo = $("#add_logo").attr("url");
    if(shop_logo==""){
        return Tip("请上传店铺Logo");
    }
    var phone = $.trim($(".shop_phone").val());
    if(phone==""){
        return Tip("请输入店铺联系电话");
    }
    var lng = $("#address").attr("data-lng");
    var lat = $("#address").attr("data-lat");
    if(!lng){
        return Tip("请点击获取店铺地图坐标按钮");
    }
    var shop_province = $("#province").attr("data-code");
    var shop_city = $("#city").attr("data-code");
    if(!shop_province || !shop_city){
        return Tip("请先选择省份和城市");
    }
    var shop_address = $.trim($("#address").val());
    if(shop_address==""){
        return Tip("请输入店铺的详细地址");
    }
    var args = {
        action:"diy",
        data:{
            shop_name:shop_name,
            shop_logo:shop_logo,
            shop_phone:phone,
            shop_province:shop_province,
            shop_city:shop_city,
            shop_address_detail:shop_address,
            lat:lat,
            lon:lng
        }
    };
    var url = "";
    $btn.attr("data-flag","off");
    $.postJson(url,args,function(res){
         if(res.success){
             Tip("店铺创建成功");
             setTimeout(function(){
                 window.location.href='/admin';
             },1500);
         }else{
            $btn.attr("data-flag","on");
            return Tip(res.error_text);
         }
    });
}

function importShop($btn){
    if($btn.attr("data-flag")=="off"){
        return Tip("请勿重复提交");
    }
    var list_id=[];
    $(".shop-list .active").each(function(){
        var id=parseInt($(this).attr("data-id"));
        list_id.push(id);
    });
    if(list_id.length==0){
        return Tip("请选择要导入的店铺");
    }
    var member_code=$(".sgipt").val().trim();
    if(!member_code){
        return Tip("请输入森果市场人员推广代码");
    }
    var data={"code":member_code,"shop_list":list_id};
    var url="";
    var args={action:"import",data:data};
    $btn.attr("data-flag","off");
    $.postJson(url,args,function(res){
        if(res.success) {
            window.location.href="/admin";
        }else{
            $btn.attr("data-flag","on");
            return Tip(res.error_text);
        }
    });
}

function initBmap(){
    var map = new BMap.Map("bmap",{enableMapClick:false});
    var point = new BMap.Point(114.430551,30.518114);
    map.centerAndZoom(point,16);
    map.enableScrollWheelZoom(true);
    var marker = null;
    $("#get_point").on("click",function(){
        if($("#province").html()=="" || $("#city").html()==""){
            return Tip("请先选择省份和城市");
        }
        if($.trim($("#address").val())==""){
            return Tip("请先输入详细地址");
        }
        var myGeo = new BMap.Geocoder();
        var address = $("#province").html()+$("#city").html()+$.trim($("#address").val());
        myGeo.getPoint(address, function (point) {
            if (point){
                map.centerAndZoom(point, 16);
                marker = new BMap.Marker(point);
                map.addOverlay(marker);
                $("#address").attr("data-lng",point.lng).attr("data-lat",point.lat);
            }else{
                return Tip("您输入的详细地址不正确，请重新输入");
            }
        });
    });
    map.addEventListener("click",function(e){
        map.removeOverlay(marker);
        var point = e.point;
        $("#address").attr("data-lng",point.lng).attr("data-lat",point.lat);
        marker = new BMap.Marker(point);
        map.addOverlay(marker);
    });
}


var isOri = "";
$(document).ready(function(){
    var uploader = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'add_logo',
        container: 'logo_area',
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
                        $("#add_logo").attr("src",imgsrc).addClass(isOri);
                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                $("#add_logo").attr("url","http://7rf3aw.com2.z0.glb.qiniucdn.com/"+file.id);
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
                $("#add_logo").attr("src","/static/images/comment_addimg.png").removeClass(isOri);
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
function previewImage(file,callback) {//file为plupload事件监听函数参数中的file对象,callback为预览图片准备完成的回调函数
    if (!file || !/image\//.test(file.type)) return; //确保文件是图片
    if (file.type == 'image/gif') {//gif使用FileReader进行预览,因为mOxie.Image只支持jpg和png
        var fr = new mOxie.FileReader();
        fr.onload = function () {
            callback(fr.result);
            fr.destroy();
            fr = null;
        }
        fr.readAsDataURL(file.getSource());
    } else {
        var preloader = new mOxie.Image();
        preloader.onload = function () {
            preloader.downsize(100, 100, true);//先压缩一下要预览的图片,宽，高
            var imgsrc = preloader.type == 'image/jpeg' ? preloader.getAsDataURL('image/jpeg', 70) : preloader.getAsDataURL(); //得到图片src,实质为一个base64编码的数据
            callback && callback(imgsrc); //callback传入的参数为预览图片的url
            preloader.destroy();
            preloader = null;
        };
        preloader.load(file.getSource());
    }
}