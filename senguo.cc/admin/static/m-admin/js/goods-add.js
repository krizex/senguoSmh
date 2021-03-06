var width = 0,price_type = 0,cur_price=null,editor=null,goods_id=-1,del_list=[],type="add";
$(document).ready(function(){
    width = $("#img_list").children("li").first().width();
    getData('fruit','color');
    if($("#finish_btn").attr("data-id")){//编辑
        $("#img_list").children("li").height(width);
        goods_id = $("#finish_btn").attr("data-id");
        type="edit";
        var tag_index = $(".wrap-tag").attr("data-id");
        $(".wrap-tag").children(".mark-choose").eq(tag_index-1).addClass("active");
        var buylimit_index = $(".wrap-buylimit").attr("data-id");
        $(".wrap-buylimit").children(".mark-choose").eq(buylimit_index).addClass("active");
        new QRCode($("#big-code2")[0],{
            width : 300,
            height : 300,
            colorDark : "#433943"
        }).makeCode( $("#shop_url").html());
    }
    cur_code =$(".choose_classify").attr("data-code");
    if($(".choose_classify").text()!=""){
       $(".pic-classify").text($(".choose_classify").text()); 
    }
    
}).on("click",".gogoods",function(){
    if(confirm("当前编辑未完成，确定返回吗？")){
        window.location.href="/madmin/goods";
    }
}).on("click",".goods_status",function(){
    $(".wrap-goods-menu").toggleClass("hide");
}).on("click",".slide_more",function(){
    if($("#goods_set").hasClass("hide")){
        $(this).children("span").html("收起高级设置");
        $("#goods_set").removeClass("hide");
        document.body.scrollTop=$(window).scrollTop()+120;
    }else{
        $(this).children("span").html("展开高级设置");
        $("#goods_set").addClass("hide");
    }
}).on("click",".wrap-mark-set span",function(){
    var id = $(this).attr("data-id");
    $(this).addClass("active").siblings().removeClass("active");
}).on("click",".icon-del",function(){//删除商品图片
    $(this).closest("li").remove();
    $("#img-lst").removeClass("hide");
    $(".moxie-shim").css({width:width+"px",height:width+"px",top:"10px"});//调整按钮的位置
    $(".moxie-shim").removeClass("hide");
}).on("click","#add_price",function(){//添加售价方式
    var $item = $(".price-list").children(".price-item").first().clone();
    $item.attr("data-id","");
    $item.find(".first-num").html("1");
    $item.find(".now-unit").html("kg");
    $item.find(".second-num").html("1");
    $item.find(".stock-unit").html("kg");
    $item.find(".price-unit").html("kg").attr("data-id","4");
    $item.find(".price-text").html("kg");
    $item.find(".current-price").val("");
    $item.find(".price-num").val("");
    $item.find(".market-price").val("");
    $item.find(".price-index").html($(".price-list").children(".price-item").size()+1);
    $(".price-list").append($item);
}).on("click",".cancel-bbtn",function(){
    $(this).closest(".pop-bwin").addClass("hide");
    $("html,body").removeClass("flow-hidden");
    document.body.scrollTop = 0;
}).on("click",".current-unit",function(){//库存单位
    if(confirm("修改库存单位后现有的售价方式会被修改成库存单位，确认修改？")){
        price_type = 0;
        $(".unit-title").html("库存单位");
        $(".unit_list li").removeClass("active").eq(parseInt($(this).attr("data-id"))-1).addClass("active");
        $(".pop-unit").removeClass("hide");
        $("html,body").addClass("flow-hidden");
    }
}).on("click",".price-unit",function(){//售出单位
    price_type = 1;
    cur_price = $(this).closest(".price-item");
    $(".unit-title").html("售出单位");
    $(".unit_list li").removeClass("active").eq(parseInt($(this).attr("data-id"))-1).addClass("active");
    $(".pop-unit").removeClass("hide");
    $("html,body").addClass("flow-hidden");
}).on("click",".unit_list li",function(){
    $(".unit_list li").removeClass("active");
    $(this).addClass("active");
}).on("click","#sure_unit",function(){
    var id = $(".unit_list").find(".active").attr("data-id");
    var name = $(".unit_list").find(".active").html();
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
            $(".price-text").html(name);
            cur_price.find(".first-num").html("1");
            cur_price.find(".now-unit").html(name);
            $(".pop-unit").addClass("hide");
        }
    }
    $("html,body").removeClass("flow-hidden");
}).on("click","#sure_conver",function(){//确认转换
    var firstNum = $("#first_num").val().trim();
    var secondNum = $("#second_num").val().trim();
    if(parseInt(firstNum)!=firstNum || parseInt(secondNum)!=secondNum || firstNum<=0 || secondNum<=0){
        Tip("单位换算两边的数字必须为正整数");
        return false;
    }else{
        var unit = $(this).attr("data-unit");
        var id = $(this).attr("data-id");
        cur_price.find(".price-unit").html(unit).attr("data-id",id);
        $(".price-text").html(unit);
        cur_price.find(".now-unit").html(unit);
        cur_price.attr("data-first",firstNum).attr("data-second",secondNum);
        cur_price.find(".first-num").html(firstNum);
        cur_price.find(".second-num").html(secondNum);
        $(".pop-conver").addClass("hide");
    }
}).on("click",".choose_classify",function(){
    $("#finish_btn").addClass("hide");
    $(".wrap-add-class").addClass("hide");
    $(".wrap-classify").removeClass("hide");
    $('.upload-pic-list').empty();
}).on("click",".class-lst li",function(){
    $(".choose_classify").html($(this).find(".class_name").html()).attr({"data-id":$(this).attr("data-id"),"data-code":$(this).attr("data-code")});
    cur_code = $(this).attr("data-code");
    $(".pic-classify").text($(this).find(".class_name").html());
    if($("#img_list").children("li").size()==6 && $("#img-lst").hasClass("hide")){
    }else{
        if($("#img_list").children("li").size()>4){
            $("#img-lst").addClass("hide");
        }
        var code = $(this).attr("data-code");
        var w = width+10;
        var $item = $('<li style="width:'+w+'px;height:'+w+'px;"><img src="/static/design_img/'+code+'.png" url="/static/design_img/'+code+'.png" alt="商品图片" class="image"/><a href="javascript:;" class="icon-del"></a></li>');
        if($("#img_list").children("li").size()>1){
            $("#img_list").children("li").first().before($item);
        }else{
            $("#img-lst").before($item);
        }
    }
    $(".wrap-classify").addClass("hide");
    $("#finish_btn").removeClass("hide");
    $(".wrap-add-class").removeClass("hide");
}).on("click","#convert-btn",function(){//分类搜索
    var con = $.trim($(".coupon-ipt").val());
    getData2(con);
}).on("click",".class_status",function(){
    $(".wrap_class_menu").toggleClass("hide");
}).on("click",".class_menu_list li",function(){
    var sub_type = $(this).attr("data-id");
    var type = $(".class_list").find(".active").attr("data-id");
    $("#class_type").attr("data-id",sub_type).html($(this).html());
    $(".wrap_class_menu").toggleClass("hide");
    if($(".class_list").children(".active").size()==0){
        $(".class_list").children(".gitem").eq(0).addClass("active");
    }
    $(".class_list").children(".tab-line").removeClass("hide");
    getData(type,sub_type);
}).on("click",".class_list .gitem",function(){
    var index = $(this).index();
    var type = $(this).attr("data-id");
    var sub_type = $("#class_type").attr("data-id");
    $(".class_list li").removeClass("active").eq(index).addClass("active");
    $(".class_list .tab-line").removeClass("hide").css("left",25*index+"%");
    getData(type,sub_type);
}).on("click",".slide-class",function(){
    $(this).toggleClass("arrow-up");
    $(this).closest(".class-row").next(".class-lst").toggleClass("hide");
}).on("click","#add_detail",function(){//添加图文详情
    var isEditor = $(this).attr("data-flag");
    var sHtml = $(this).attr("data-text") || "";
    if(isEditor=="true"){
        if(editor){
            $("#ueditor").css("width","100%");
            editor.body.innerHTML=sHtml;
            $(".pop-editor").removeClass("hide");
        }else{
            initEditor($(this));
        }
    }
}).on("click","#ok-editor",function(){
    $("#add_detail").attr("data-text",editor.body.innerHTML);
    $(".pop-editor").addClass("hide");
}).on("click",".choose-group",function(){
    $(".pop-group").removeClass("hide");
    $("html,body").removeClass("flow-hidden");
}).on("click",".group_list li",function(){
    $(".group_list li").removeClass("active");
    $(this).addClass("active");
    $("#sure_group").attr("data-id",$(this).attr("data-id")).attr("data-name",$(this).html());
    $(".pop-group").removeClass("hide");
    $("html,body").removeClass("flow-hidden");
}).on("click","#sure_group",function(){
    $(".choose-group").html($(this).attr("data-name")).attr("data-id",$(this).attr("data-id"));
    $(".pop-group").addClass("hide");
    $("html,body").addClass("flow-hidden");
}).on("click","#finish_btn",function(){//添加商品
    finishGoods();
}).on("click",".del-price",function(){
    if(confirm("确定删除该售价方式？")){
        var id=$(this).closest('.price-item').attr('data-id');
        if(id){
            del_list.push(parseInt(id));
        }
        $(this).closest(".price-item").remove();
    }
}).on("click","#share_goods",function(){
    $(".pop-code2").removeClass("hide");
}).on("click","#down_goods",function(){
    switchGoods($("#finish_btn").attr("data-id"),$(this));
}).on("click","#del_goods",function(){
    $(".pop-del").removeClass("hide");
}).on("click","#del_sure",function(){
    delGoods($("#finish_btn").attr("data-id"));
}).on("click",".b-close",function(){
    $(this).closest(".pop-bwin").addClass("hide");
}).on("click","#add-img",function(){
    getPicture(pictureType,0,cur_code);
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
                var w = width+10;
                var $item = $('<li style="width:'+w+'px;height:'+w+'px;"><div style="width:'+width+'px;height:'+width+'px;" class="img-cover2 wrap-img-cover"><span class="loader loader-quart"></span></div><img id="'+file.id+'" src="" alt="商品图片" class="image '+isOri+'"/><a href="javascript:;" class="icon-del hide"></a></li>');
                $("#add-img").closest("li").before($item);
                if ($("#img_list").children("li").size() == 6) {
                    $("#img-lst").addClass("hide");
                    $(".moxie-shim").addClass("hide");
                }
                !function(){
                    previewImage(file,function(imgsrc){
                        $("#"+file.id).attr("src",imgsrc);
                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                $("#" + file.id).prev(".img-cover2").addClass("hide");
                $("#" + file.id).next("a").removeClass("hide");
                $("#"+file.id).attr("url","http://7rf3aw.com2.z0.glb.qiniucdn.com/"+file.id);
                $(".pop-picture-library").addClass("hide");
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
                    $("#img-lst").removeClass("hide");
                    $(".moxie-shim").removeClass("hide");
                }
            },
            'Key': function (up, file) {
                var key = file.id;
                return key;
            }
        }
    });
    setTimeout(function(){
        $(".moxie-shim").children("input").attr("capture","camera").attr("accept","image/*").removeAttr("multiple");
    },800);
}).on("click",".upload-pic-list li",function(e){
    var imgurl=$(this).find("img").attr("src");
    var _url=$(this).find("img").attr("url");
    var w = width+10;
    if($(e.target).closest(".del-pic-img").size()==0){
        var $item = $('<li style="width:'+w+'px;height:'+w+'px;"><img class="image" style="width:'+width+'px;height:'+width+'px;" id="" src="" alt="商品图片"/><a href="javascript:;" class="icon-del"></a></li>');
        if ($("#img_list").children("li").size() == 6) {
            $("#img-lst").addClass("hide");
            $(".moxie-shim").addClass("hide");
        }else{
            if ($("#img_list").children("li").size() == 5){
                $("#img-lst").addClass("hide");
                $(".moxie-shim").addClass("hide");
            }
            $item.find("img").attr({"src":imgurl,"url":_url});
            $("#add-img").closest("li").before($item);
        }
        $(".pop-picture-library").addClass("hide");
    }
}).on("click",".pop-picture-library .cancel-btn",function(){
    $(this).closest(".pop-picture-library").addClass("hide");
    $(".default-pic-list").addClass("hide");
    $(".upload-pic-list").removeClass("hide");
    $(".show-upload-list").addClass("active").siblings("li").removeClass("active");
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
    $("#demo-img").find("img").attr({"src":"/static/design_img/"+cur_code+".png","url":"/static/design_img/"+cur_code+".png"})
}).on("click","#demo-img",function(){
    var imgurl=$(this).find("img").attr("src");
    var _url=$(this).find("img").attr("url");
    var w = width+10;
    var $item = $('<li style="width:'+w+'px;height:'+w+'px;"><img class="image" style="width:'+width+'px;height:'+width+'px;" id="" src="" alt="商品图片"/><a href="javascript:;" class="icon-del"></a></li>');
    if ($("#img_list").children("li").size() == 6) {
        $("#img-lst").addClass("hide");
        $(".moxie-shim").addClass("hide");
    }else{
        if ($("#img_list").children("li").size() == 5){
            $("#img-lst").addClass("hide");
            $(".moxie-shim").addClass("hide");
        }
        $item.find("img").attr({"src":imgurl,"url":_url});
        $("#add-img").closest("li").before($item);
    }
    $(".pop-picture-library").addClass("hide");
});


var pictureType="goods",_page = 0,nomore=false,_finished=true,cur_code="",_total;
function getPicture(action,page,code){
     $.ajax({
        url:'/admin/picture?action='+action+'&page='+page+'&code='+code,
        type:"get",
        success:function(res){
            if(res.success){
                var data = res.datalist;
                if(page==0){
                   _total = res.total_page; 
                   $('.upload-pic-list').empty();
                   nomore=false;
                   _page = 0;
                }
                if(_total<=page){
                    nomore=true;
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
    if(_finished&&(main.height()-range) <= totalheight  && nomore==false) {
        _finished=false;
        _page = _page+1;
        getPicture(pictureType,_page,cur_code);
    }
});



//删除商品
function delGoods(id){
    var url="/admin/goods/all";
    var args={
        action:'delete_goods',
        data:{
            goods_id:id
        }
    };
    $.postJson(url,args,function(res) {
        if (res.success) {
            Tip("商品删除成功");
            setTimeout(function(){
                window.location.href="/madmin/goods";
             },1200);
        }else{
            Tip(res.error_text);
        }
    });
}
//上下架商品
function switchGoods(id,$obj){
    var url="/admin/goods/all";
    var args={
        action:'edit_active',
        data:{
            goods_id:id
        }
    };
    $.postJson(url,args,function(res) {
        if (res.success) {
            if($obj.html()=="下架"){
                $obj.html("上架");
                Tip("商品已下架");
            }else{
                $obj.html("下架");
                Tip("商品已上架");
            }
        }else{
            Tip(res.error_text);
        }
    });
}
//添加&编辑商品
function finishGoods(){
    if($('#finish_btn').attr("data-flag")=="off"){
        return false;
    }
    //数字正则、金额正则
    var testNum = /^[0-9]\d*(\.\d+)?$/;
    var testMoney = /^(([0-9]|([1-9][0-9]{0,9}))((\.[0-9]{1,2})?))$/;
    var name = $.trim($(".goods-goods-name").val());
    var group_name = $(".choose-group").html();
    var group_id = $(".choose-group").attr("data-id");
    var storage = $.trim($(".stock-num").val());
    var unit = $(".current-unit").attr("data-id");
    var tag =$(".wrap-tag").find(".active").attr("data-id");
    var buylimit =$(".wrap-buylimit").find(".active").attr("data-id");
    var code=$(".choose_classify").attr("data-code");
    if(name.length>25 || name==""){
        return Tip("商品名称不能为空且不能超过25个字");
    }
    if(!testNum.test(storage)){
        return Tip("请填写正确的库存，只能为数字")
    }
    //商品类目
    if($(".choose_classify").attr("data-id")){
        var fruit_type_id = $(".choose_classify").attr("data-id");
    }else{
        return Tip("请选择商品类目");
    }
    //商品图片
    var imgUrls = $("#img_list").find(".image");
    var imgList = {};
    if(imgUrls.size()==0){
        return Tip("请至少添加一张商品图片");
    }else if(imgUrls.size()>5){
        return Tip("商品图片最多只能添加5张");
    }else{
        var arr1 = [];
        var arr2 = [];
        imgUrls.each(function(){
            var $this = $(this);
            arr1.push($this.closest("li").index());
            arr2.push($this.attr("url"));
        });
        imgList.index = arr1;
        imgList.src = arr2;
    }
    //售价方式
    var price_type = $(".price-list").children(".price-item");
    var price_list = [];
    var price_null = false;
    var market_price_null = false;
    if(price_type.size()==0){
        return Tip("请至少添加一种售价方式");
    }else{
        price_type.each(function(){
            var id = $(this).attr("data-id");
            var unit_num = $(this).find(".first-num").html();
            var unit = $(this).find(".price-unit").attr("data-id");
            var unit_name = $(this).find(".price-unit").html();
            var num = $.trim($(this).find(".price-num").val());
            var select_num = $(this).find(".second-num").html();
            var price = $.trim($(this).find(".current-price").val());
            var market_price = $.trim($(this).find(".market-price").val());
            if(!testMoney.test(num) || !testMoney.test(price)){
                price_null = true;
            }
            if(!testMoney.test(market_price) && market_price!=""){
                market_price_null = true;
            }
            var item = {
                unit_num:unit_num,//第一个数量
                unit:unit,//选择单位ID
                num:num,//数量
                select_num:select_num,//第二个数量
                price:price,//价格
                market_price:market_price,//市场价
                unit_name:unit_name
            }
            if(type=="edit" && id){
                item.id=id;
            }
            price_list.push(item);
        });
    }
    if(price_null){
        return Tip("请填写正确的数量和售价，最多保留2位小数");
    }
    if(market_price_null){
        return Tip("请填写正确的市场价，若不需要设置市场价，请留空");
    }
    //商品简介
    var info = $(".goods-info").val();
    if(info.length>100){
        return Tip("商品简介不能超过100个字，更多内容请在商品图文详情中添加");
    }
    //商品详情
    var detail_describe = "";
    if(editor){
        if(editor.body.innerHTML.length>8000){
            return Tip("商品图文详情过长，请精简一下");
        }else{
            detail_describe = editor.body.innerHTML;
        }
    }else{
        detail_describe = $("#add_detail").attr("data-text") || "";
    }
    //商品限购、排序优先级
    var limit_num = $.trim($(".limit_num").val());
    var priority = $.trim($(".goods-priority").val());
    if(parseInt(limit_num)!=limit_num || parseInt(limit_num)<0){
        return Tip("商品限购必须为正整数");
    }
    if(parseInt(priority)!=priority || parseInt(priority)>9 || parseInt(priority)<0){
        return Tip("优先级必须为0-9之间的整数");
    }
    //传入数据
    var url="/admin/goods/all";
    var data={
        group_id: group_id,//分组id
        group_name:group_name,
        fruit_type_id:fruit_type_id,//类型id
        charge_types:price_list,
        limit_num: limit_num,//限购数 没有传0,
        detail_describe: detail_describe,//没有传"",
        unit: unit,//库存单位id,
        img_url:imgList,
        priority: priority,//排序优先级 没有传0,
        storage: storage,//库存,
        intro: info,//商品简介,
        name: name,//商品名称,
        tag:tag,
        buylimit:buylimit,
        code:code
    };
    if(type == "edit"){
        data.goods_id=goods_id;
        data.del_charge_types=del_list;
    }
    var args = {data:data};
    if(type=="edit"){
        args["action"]="edit_goods";
    }else{
        args["action"]="add_goods";
    }
    $('#finish_btn').attr("data-flag","off")
    $.postJson(url,args,function(res) {
        $('#finish_btn').attr("data-flag","on");
        if (res.success) {
            if(type == "add"){
                Tip("商品添加成功");
            }else{
                Tip("商品编辑成功");
            }
            setTimeout(function(){
                window.location.href="/madmin/goods";
            },1200);
        }else{
            Tip(res.error_text);
        }
    });
}
//初始化编辑器
function initEditor($obj){
    editor = UM.getEditor('ueditor',{toolbars: [
        ['simpleupload', 'bold', 'italic', 'underline', 'fontborder', 'strikethrough', 'superscript',
            'subscript', 'removeformat', 'formatmatch', 'autotypeset', 'blockquote', 'pasteplain',
            '|', 'forecolor', 'backcolor', 'insertorderedlist', 'insertunorderedlist']
    ]});
    $(".pop-editor").removeClass("hide");
    QINIU_TOKEN=$("#token").val();
    QINIU_BUCKET_DOMAIN="7rf3aw.com2.z0.glb.qiniucdn.com/";
    if($obj.attr("data-text")){
        editor.body.innerHTML=$obj.attr("data-text");
    }else{
        $(".edui-body-container").focus();
    }
}
//切换库存单位
function switchUnit($list,id,name){
    for(var i=0; i<$list.size(); i++){
        var $this = $list.eq(i);
        $this.attr("data-first","1").attr("data-second","1");
        $this.find(".price-unit").attr("data-id",id).html(name);
        $(".price-text").html(name);
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
    $(".price-text").html(price_unit);
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
//android端上传图片
function uploadImgForAndroid(url){
    var w = width+10;
    var $item = $('<li style="width:'+w+'px;height:'+w+'px;"><img src="'+url+'?imageView2/1/w/100/h/100" url="'+url+'" alt="商品图片" class="image"/><a href="javascript:;" class="icon-del"></a></li>');
    $("#add-img").closest("li").before($item);
    if ($("#img_list").children("li").size() == 6) {
        $("#img-lst").addClass("hide");
        $(".moxie-shim").addClass("hide");
    }
}
$(document).ready(function(){
   
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
            preloader.downsize( 100,100 ,true);//先压缩一下要预览的图片,宽，高
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
    var w = width+10;
    var $item = $('<li style="width:'+w+'px;height:'+w+'px;"><img src="'+url+'?imageView2/1/w/100/h/100" url="'+url+'" alt="商品图片" class="image"/><a href="javascript:;" class="icon-del"></a></li>');
    $("#add-img").closest("li").before($item);
    if ($("#img_list").children("li").size() == 6) {
        $("#img-lst").addClass("hide");
        $(".moxie-shim").addClass("hide");
    }
}

/*水果分类*/
function getData(type,sub_type){
    $.ajax({
        url:'/admin/goods/classify?type='+type+'&sub_type='+sub_type,
        type:"get",
        success:function(res){
            if(res.success){
                var data = res.data;
                $('.classify-list').empty();
                var item='<li><div class="class-row"><span class="class-left {{property}}">{{name}}</span><span class="class-right slide-class"></span></div>'+
                    '<ul class="class-lst group {{property}} hide">'+
                    '{{each types as type}}'+
                    '<li data-id="{{type.id}}" data-code="{{type.code}}"><span class="{{if type.num>0}}selected{{/if}}"><span class="class_name">{{type.name}}</span>({{type.num}})</span></li>'+
                    '{{/each}}'+
                    '</ul></li>';
                for(var d in data){
                    if(data[d]['data'].length!=0){
                        var render = template.compile(item);
                        var html = render({
                            property:data[d]['property'],
                            name:data[d]['name'],
                            types:data[d]['data']
                        });
                        $('.classify-list').append(html);
                    }
                }
                var $first_li = $(".classify-list").children("li").first();
                $first_li.children(".class-lst").removeClass("hide");
                $first_li.find(".slide-class").addClass("arrow-up");
            }
        }
    });
}
//搜索分类
function getData2(con){
    if(con==""){
        return Tip('请输入分类名称');
    }
    var url="/admin/goods/classify";
    var data={'classify':con};
    var args={
        action:'classify_search',
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                var data = res.data;
                $('.classify-list').empty();
                var item='<ul class="class-lst group">'+
                    '<li data-id="{{id}}" data-code="{{code}}"><span><span class="class_name">{{name}}</span>({{num}})</span></li>'+
                    '</ul>';
                for(var d in data){
                    if(data[d].length!=0){
                        var render = template.compile(item);
                        var html = render({
                            id:data[d]['id'],
                            name:data[d]['name'],
                            num:data[d]['num'],
                            code:data[d]['code']
                        });
                        $('.classify-list').append(html);
                    }
                }
                $(".class_list").children(".gitem").removeClass("active");
                $(".class_list").children(".tab-line").addClass("hide");
            }
            else return Tip(res.error_text);
        },
        function(){return Tip('您的网络暂时不通畅，请稍候再试');}
    );
}
(function ($) {
    $.getUrlParam = function (name, default_value) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return decodeURI(r[2]); return '';
    };
    $.postJson = function(url, args,successCall){
        args._xsrf = window.dataObj._xsrf;
        $.ajax({
            type:"post",
            url:url,
            data:JSON.stringify(args),
            contentType:"application/json; charset=UTF-8",
            success:successCall,
            fail:function(){
                Tip("服务器出错了，请联系管理员");
            },
            error:function(){
                Tip("服务器出错了，请联系管理员");
            }
        });
    };
})(jQuery);

//android端上传图片
function uploadImgForAndroid(url){
    var w = width+10;
    var $item = $('<li style="width:'+w+'px;height:'+w+'px;"><img src="'+url+'?imageView2/1/w/100/h/100" url="'+url+'" alt="商品图片" class="image"/><a href=" " class="icon-del"></a></li>');
    $("#add-img").closest("li").before($item);
    if ($("#img_list").children("li").size() == 6) {
        $("#img-lst").addClass("hide");
        $(".moxie-shim").addClass("hide");
    }
    $(".pop-picture-library").addClass("hide");
}
