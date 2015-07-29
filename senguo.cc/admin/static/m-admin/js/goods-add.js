var width = 0,price_type = 0,cur_price=null;
$(document).ready(function(){
    width = $("#add_img").width();
}).on("click",".goods_status",function(){
    $(".wrap-goods-menu").toggleClass("hide");
}).on("click",".slide_more",function(){
    if($("#goods_set").hasClass("hide")){
        $(this).children("span").html("收起高级设置");
        $("#goods_set").removeClass("hide");
    }else{
        $(this).children("span").html("展开高级设置");
        $("#goods_set").addClass("hide");
    }
}).on("click",".wrap-mark-set span",function(){
    var id = $(this).attr("data-id");
    $(".wrap-mark-set span").removeClass("active");
    $(this).addClass("active");
}).on("click",".icon-del",function(){//删除商品图片

}).on("click","#add_price",function(){//添加售价方式
    var $item = $(".price-list").children(".price-item").first().clone();
    $item.find(".first-num").html("1");
    $item.find(".now-unit").html("kg");
    $item.find(".second-num").html("1");
    $item.find(".stock-unit").html("kg");
    $item.find(".price-unit").html("kg");
    $item.find(".current-price").val("");
    $item.find(".price-num").val("");
    $item.find(".market-price").val("");
    $item.find(".price-index").html($(".price-list").children(".price-item").size()+1);
    $(".price-list").append($item);
}).on("click",".cancel-bbtn",function(){
    $(this).closest(".pop-bwin").addClass("hide");
}).on("click",".current-unit",function(){//库存单位
    if(confirm("修改库存单位后现有的售价方式会被修改成库存单位，确认修改？")){
        price_type = 0;
        $(".unit-title").html("库存单位");
        $(".unit_list li").removeClass("active");
        $(".pop-unit").removeClass("hide");
    }
}).on("click",".price-unit",function(){//售出单位
    price_type = 1;
    cur_price = $(this).closest(".price-item");
    $(".unit-title").html("售出单位");
    $(".unit_list li").removeClass("active");
    $(".pop-unit").removeClass("hide");
}).on("click",".unit_list li",function(){
    var id = $(this).attr("data-id");
    var name = $(this).html();
    $(".unit_list li").removeClass("active");
    $(this).addClass("active");
    $("#sure_unit").attr("data-id",id).attr("data-name",name);
}).on("click","#sure_unit",function(){
    var id = $(this).attr("data-id");
    var name = $(this).attr("data-name");
    if(price_type==0){
        var $list = $(".price-list").children(".price-item");
        switchUnit($list,id,name);
        $(".current-unit").attr("data-id",id).html(name);
        $(".pop-unit").addClass("hide");
    }else{
        var stock_unit =  $(".current-unit").html();
        if(name != stock_unit){
            var arr = ["斤","kg","克"];
            if($.inArray(stock_unit,arr) !=-1 && $.inArray(name,arr) !=-1){
                simpleUnitSwitch(name,stock_unit,id);
                $(".pop-unit").addClass("hide");
            }else{
                $("#sure_conver").attr("data-unit",name).attr("stock-unit",stock_unit).attr("data-id",id);
                $("#now-unit").html(name);
                $("#stock-unit").html(stock_unit);
                $(".pop-unit").addClass("hide");
                $("#first_num").val("");
                $("#second_num").val("");
                $(".pop-conver").removeClass("hide");
            }
        }else{
            cur_price.find(".price-unit").html(name).attr("data-id",id);
            cur_price.find(".first-num").html("1");
            cur_price.find(".now-unit").html(name);
            $(".pop-unit").addClass("hide");
        }
    }
}).on("click","#sure_conver",function(){//确认转换
    var firstNum = $("#first_num").val().trim();
    var secondNum = $("#second_num").val().trim();
    if(parseInt(firstNum)!=firstNum || parseInt(secondNum)!=secondNum || firstNum<=0 || secondNum<=0){
        Tip("单位换算两边的数字必须为正整数");
        return false;
    }else{
        var unit = $(this).attr("data-unit");
        var id = $(this).attr("data-unitid");
        cur_price.find(".price-unit").html(unit).attr("data-id",id);
        cur_price.find(".now-unit").html(unit);
        cur_price.attr("data-first",firstNum).attr("data-second",secondNum);
        cur_price.find(".first-num").html(firstNum);
        cur_price.find(".second-num").html(secondNum);
        $(".pop-conver").addClass("hide");
    }
}).on("click",".choose_classify",function(){
    $(".wrap-add-class").addClass("hide");
    $(".wrap-classify").removeClass("hide");
}).on("click",".class-lst .citem",function(){
    $(".choose_classify").html($(this).children("span").html()).attr("data-id",$(this).attr("data-id"));
    $(".wrap-classify").addClass("hide");
    $(".wrap-add-class").removeClass("hide");
});
//切换库存单位
function switchUnit($list,id,name){
    for(var i=0; i<$list.size(); i++){
        var $this = $list.eq(i);
        $this.attr("data-first","1").attr("data-second","1");
        $this.find(".price-unit").attr("data-id",id).html(name);
        $this.find(".first-num").html("1");
        $this.find(".second-num").html("1");
        $this.find(".now-unit").html(name);
        $this.find(".stock-unit").html(name);
    }
}
//切换单位
function simpleUnitSwitch(price_unit,cur_unit,id){
    var first = 1,second = 1;
    cur_price.find(".price-unit").html(price_unit).attr("data-id",id);
    cur_price.find(".now-unit").html(price_unit);
    if(price_unit == "kg" && cur_unit == "克"){
        first = 1;
        second = 1000;
    }else if(price_unit == "kg" && cur_unit == "斤"){
        first = 1;
        second = 2;
    }else if(price_unit == "斤" && cur_unit == "kg"){
        first = 2;
        second = 1;
    }else if(price_unit == "斤" && cur_unit == "克"){
        first = 1;
        second = 500;
    }else if(price_unit == "克" && cur_unit == "kg"){
        first = 1000;
        second = 1;
    }else if(price_unit == "克" && cur_unit == "斤"){
        first = 500;
        second = 1;
    }
    cur_price.find(".first-num").html(first);
    cur_price.find(".second-num").html(second);
}
$(document).ready(function(){
    var uploader = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'add-img',
        container: 'img-lst',
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
                var isOri = "";
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
                var $item = $('<li><div style="width:'+width+'px;height:'+width+'px;" class="img-cover2 hide wrap-img-cover"><span class="loader loader-quart"></span></div><img id="'+file.id+'" src="" alt="商品图片" class="image '+isOri+'"/><a href="javascript:;" class="icon-del hide"></a></li>');
                $("#add-img").closest("li").before($item);
                if ($("#img_list").children("li").size() == 6) {
                    $("#add-img").closest("li").addClass("hide");
                    $(".moxie-shim").addClass("hide");
                }
                $(".moxie-shim").css({left:$("#add-img").closest("li").position().left,top:$("#add-img").closest("li").position().top});//调整按钮的位置
                !function(){
                    previewImage(file,width,function(imgsrc){
                        $("#"+file.id).attr("src",imgsrc);
                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                $("#" + file.id).prev(".img-cover2").addClass("hide");
                $("#" + file.id).next("a").removeClass("hide");
                $("#"+file.id).attr("url","http://shopimg.qiniudn.com/"+file.id);
            },
            'Error': function (up, err, errTip) {
                if (err.code == -600) {
                    Tip("图片大小不能超过4M哦");
                } else if (err.code == -601) {
                    Tip("图片格式不对哦，只能上传png、jpg格式图片");
                } else if (err.code == -200) {
                    Tip("当前页面过期，请刷新页面");
                } else {
                    Tip(err.code + ": " + err.message);
                }
                up.removeFile(err.file.id);
                $("#"+err.file.id).closest("li").remove();
                if($("#"+err.file.id).closest("li").index()==4){
                    $("#add-img").closest("li").removeClass("hide");
                    $(".moxie-shim").removeClass("hide");
                }
                $(".moxie-shim").css({left:$("#add-img").closest("li").position().left,top:$("#add-img").closest("li").position().top});//调整按钮的位置
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
})
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
/*转化图片为base64*/
function previewImage(file,width,callback){//file为plupload事件监听函数参数中的file对象,callback为预览图片准备完成的回调函数
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
            preloader.downsize( width,width ,true);//先压缩一下要预览的图片,宽，高
            var imgsrc = preloader.type=='image/jpeg' ? preloader.getAsDataURL('image/jpeg',70) : preloader.getAsDataURL(); //得到图片src,实质为一个base64编码的数据
            callback && callback(imgsrc); //callback传入的参数为预览图片的url
            preloader.destroy();
            preloader = null;
        };
        preloader.load( file.getSource() );
    }
}
