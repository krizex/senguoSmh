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
        $(".province").html(name);
        $("#privince_list").addClass("hide");
        $("#city_list").removeClass("hide");
    }else{
        $(".address").attr("data-code",code);
        $(".province").html(name);
        $(".city").html(name);
        $(".pop-bwin").addClass("hide");
    }
}).on("click","#city_list li",function(){
    var code = $(this).attr("data-code");
    var name = $(this).html();
    $(".address").attr("data-code",code);
    $(".city").html(name);
    $(".pop-bwin").addClass("hide");
    $("#privince_list").removeClass("hide");
    $("#city_list").addClass("hide");
}).on("click",".province",function(){
    if($(this).hasClass("forbidden")){
        return Tip("当前只有湖北省范围");
    }
    $(".choose-title").html("选择省份");
    $(".pop-bwin").removeClass("hide");
}).on("click",".city",function(){
    if($(this).hasClass("forbidden")){
        return Tip("当前只有武汉市范围");
    }
    $(".choose-title").html("选择省份");
    $(".pop-bwin").removeClass("hide");
}).on("click",".tab-list li",function(){
    var index = $(this).index();
    $(".tab-list li").removeClass("active").eq(index).addClass("active");
    $(".tab-content .tab-item").addClass("hide").eq(index).removeClass("hide");
    type = index;
}).on("click",".plant-list li",function(){
    var index = $(this).index();
    $(".plant-list li").removeClass("active").eq(index).addClass("active");
}).on("click",".last-choose",function(){
    $(this).children("i").toggleClass("checked-btn");
});

function initBmap(){
    var map = new BMap.Map("bmap");
    var point = new BMap.Point(114.430551,30.518114);
    map.centerAndZoom(point,15);
    var marker = null;
    $("#get_point").on("click",function(){
        var myGeo = new BMap.Geocoder();
        var address = $("#province").html()+$("#city").html()+$.trim($("#address").val());
        myGeo.getPoint(address, function (point) {
            if (point){
                map.centerAndZoom(point, 17);
                marker = new BMap.Marker(point);
                map.addOverlay(marker);
            }
        });
    });
    map.addEventListener("click",function(e){
        map.removeOverlay(marker);
        var point = e.point;
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
                        $("#add_logo").attr("src",imgsrc).addClass(isOri);
                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                $("#add_logo").attr("url","http://shopimg.qiniudn.com/"+file.id);
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