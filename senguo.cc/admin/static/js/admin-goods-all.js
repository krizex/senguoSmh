var goodsItem = "",curItem=null,goodsEdit = false,aLis=[],aPos=[],zIndex= 1,pn= 0,editor=null;
$(document).ready(function(){
    $(".sw-link-copy").zclip({
        path: "/static/js/third/ZeroClipboard.swf",
        copy: function(){
            return $(this).prev("input").val();
        },
        afterCopy:function(){/* 复制成功后的操作 */
            Tip("链接已经复制到剪切板");
        }
    });
    $(".er-code-img").each(function(){
        var _this = $(this);
        new QRCode(this, {
            width : 80,//设置宽高
            height : 80
        }).makeCode(_this.closest(".sw-er-tip").find(".sw-link-txt").val());
    });
    $(document).on("click",function(e){
        if($(e.target).closest(".sw-er-tip").size()==0){
            $(".sw-er-tip").addClass("invisible");
        }
    });
    getGoodsItem();
}).on("click",".check-box",function(){
    $(this).toggleClass("checked-box");
}).on("click",".switch-btn",function(){
    $(this).toggleClass("switch-btn-active");
}).on("click",".cancel-btn",function(){
    $(this).closest(".pop-win").hide();
}).on("click",".show-add-img",function(){   //上传图片
    var $item = $(this).closest(".item-img-lst").children(".img-bo").clone();;
    if($item.size()>0){
        $item.css({position:"relative",left:"0",top:"0"});
        $("#add-img-btn").closest("li").before($item);
        if($item.size()==5){
            $("#add-img-btn").closest("li").removeClass("hidden");
        }
    }else{
        $("#add-img-btn").closest("li").prevAll("li").remove();
    }
    $(".pop-img-win").show();
}).on("click",".sg-img-list img",function(){
    $(this).prev(".img-selected").toggle();
    $(this).toggleClass("selected-img");
}).on("click",".sg-img-list .img-selected",function(){
    $(this).toggle();
    $(this).next("img").toggleClass("selected-img");
}).on("click",".wrap-big-img",function(){
    $(".wrap-big-img").hide();
}).on("click",".show-bigimg",function(){
    var src = $(this).attr("data-src")||"";
    $(".wrap-big-img").children("img").attr("src",src);
    $(".wrap-big-img").show();
}).on("click",".spread-all-item",function(e){
    e.stopPropagation();
    $(this).closest(".all-bm-group").next(".sw-er-tip").toggleClass("invisible");
}).on("click",".dropdown-menu .item",function(){
    $(this).closest("ul").prev("button").children("em").html($(this).html());
}).on("click",".del-img",function(){//删除图片
    var index = $(this).closest(".img-bo").attr("data-rel");
    if(!$(this).closest(".item-img-lst").hasClass("drag-img-list")){
        $(".moxie-shim").css({left:$("#add-img-btn").closest("li").position().left,top:$("#add-img-btn").closest("li").position().top});
    }else{
        aLis.splice(index,1);
        aPos.splice(index,1);
        $(this).closest(".item-img-lst").children(".add-img-box").css("marginLeft",aLis.length*75+"px");
    }
    $(this).closest(".item-img-lst").children(".add-img-box").removeClass("hidden");
    $(this).closest("li").remove();
}).on("click",".item-set-more",function(){
    $(this).closest(".all-item-cont").next(".wrap-more-set").slideToggle(200);
    $(this).toggleClass("item-set-mactive");
}).on("click",".eidt-all-item",function(){
    if(goodsEdit){
        Tip("请先完成正在编辑的商品");
        return false;
    }
    curItem = $(this).closest(".goods-all-item");
    var _this = $(this);
    $.getItem("/static/items/admin/goods-item.html?33",function(data){
        goodsItem = data;
        _this.closest(".goods-all-item").hide().after(goodsItem);
        curItem = _this.closest(".goods-all-item").next(".goods-all-item");
        goodsEdit = true;
    });
}).on("click",".cancel-edit-goods",function(){
    var _this = $(this);
    _this.closest(".goods-all-item").prev(".goods-all-item").show();
    _this.closest(".goods-all-item").remove();
    goodsEdit = false;
}).on("click",".ok-edit-goods",function(){  //保存编辑后的商品
    var _this = $(this);
    _this.closest(".goods-all-item").prev(".goods-all-item").show();
    _this.closest(".goods-all-item").remove();
    $("#add-img-btn").closest("li").prevAll("li").remove();
    curItem = null;
    goodsEdit = false;
}).on("click","#add-goods",function(){  //添加新商品
   // $(".wrap-all-goods,.subnav-box,.right-title").addClass("hidden");
    $(".wrap-classify").prevAll().addClass("hidden");
    $(".wrap-classify").removeClass("hidden");
}).on("click",".fruit-item-list li",function(){//选择分类
    $(".wrap-classify").addClass("hidden");
    $(".wrap-classify").prevAll().removeClass("hidden");
    var classify = $(this).html();
    $.getItem("/static/items/admin/goods-item.html?123",function(data){
        goodsItem = data;
        var $item = $(goodsItem);
        var item = $item.find(".goods-classify").html(classify);
        $(".goods-all-list").append($item);
        goodsEdit = true;
    });
}).on("click","#upload-img",function(){ //保存上传后的图片
    var $list = $("#item-img-lst").children(".img-bo");
    var $item = curItem;
    if($list.size()>5){Tip("只能上传5张图片哦！"); return false;}
    $item.find(".drag-img-list").children(".add-img-box").prevAll("li").remove();
    $item.find(".drag-img-list").children(".add-img-box").before($list);
    if($list.length==5){
        $item.find(".drag-img-list").children(".add-img-box").addClass("hidden");
    }else{
        $item.find(".drag-img-list").children(".add-img-box").css("marginLeft",$list.length*75+"px");
    }
    initImgList($item.find(".drag-img-list").children(".img-bo"));
    $(".pop-img-win").hide();
}).on("click",".show-txtimg",function(){
    initEditor();
}).on("click",".pop-editor",function(e){
    if($(e.target).closest(".wrap-kindeditor").size()==0){
        $(".pop-editor").hide();
    }
});

function initEditor(){
    $.ajax({url: '/admin/editorTest?action=editor', async: false, success: function(data){
        var token1 = data.token;
        var token = data.res;
        $(".pop-editor").show();
        editor = KindEditor.create('#kindEditor', {
            uploadJson : 'http://upload.qiniu.com/',
            filePostName : 'file',
            allowFileManager : true,
            fileManagerJson : '/admin/editorFileManage',
            extraFileUploadParams : {'token':token1},
            token : token,
            resizeType : 0,
            uploadJson:"picture",
            items:[
                'source', '|', 'undo', 'redo', '|', 'preview', 'print', 'template', 'cut', 'copy', 'paste',
                'plainpaste', 'wordpaste', '|', 'justifyleft', 'justifycenter', 'justifyright',
                'justifyfull', 'insertorderedlist', 'insertunorderedlist', 'indent', 'outdent', 'subscript',
                'superscript', 'clearhtml', 'quickformat', 'selectall', '|', 'fullscreen', '/',
                'formatblock', 'fontname', 'fontsize', '|', 'forecolor', 'hilitecolor', 'bold',
                'italic', 'underline', 'strikethrough', 'lineheight', 'removeformat', '|', 'image',
                'table', 'hr'
            ],
            afterCreate: function(){this.sync();},
            afterBlur: function(){this.sync();},
            afterUpload : function(url) {
                console.log(url)
            },
            uploadError:function(file, errorCode, message){
                console.log(message)
            }
        });

    }});
}

function getGoodsItem(){
    $.ajax({
        url:"/admin/goods/all?type=all&page="+pn,
        type:"get",
        success:function(res){
            if(res.success){
                var data = res.data;
                $(".goods-all-list").empty();
                if(data.length==0){
                    $(".goods-all-list").append("<p>没有查询到任何商品！</p>");
                }else{
                    $(".page-total").html(res.count);
                    $(".page-now").html(pn+1);
                    insertGoods(data);
                }
            }
        }
    })
}
function insertGoods(data){
    for(var i=0; i<data.length; i++){
        var goods = data[i];
        var $item = $(".clone-goods").children().clone();
        $item.attr("data-id",goods.id);
        $item.find(".goods-add-time").html(goods.add_time);
        $item.find(".goods-goods-name").html(goods.name);
        if(goods.imgurl){
            $item.find(".cur-goods-img").attr("src",goods.imgurl);
        }
        $item.find(".current-group").html("商品分组").attr("data-id",goods.group_id);
        $item.find(".stock-num").html(goods.storage);
        $item.find(".stay-num").html(goods.current_saled);
        if(goods.active==1){  //上架
            $item.find(".switch-btn").addClass("switch-btn-active");
        }
        $item.find(".show-txtimg").attr("data-text",goods.detail_describe);
        $item.find(".goods-classify").html("苹果");
        $item.find(".goods-priority").html(goods.priority);
        $item.find(".limit-num").html(goods.limit_num);
        $item.find(".item-goods-txt").html(goods.info);
        $item.find(".dianzan").html("5");
        /*$item.find(".goods-comment-num").html("2222");*/
        $item.find(".goods-vol").html(goods.saled);
        $item.find(".sw-link-txt").html("http://senguo.cc/list");
        $(".goods-all-list").append($item);
    }
}

$(document).ready(function(){
    var uploader = Qiniu.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'add-img-btn',
        container: 'add-img-box',
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
                var length = $("#item-img-lst").children(".img-bo").size();
                var $item = $('<li class="img-bo" data-index="'+length+'" data-rel="'+length+'"><div class="img-cover wrap-img-cover hidden"><span class="loader loader-quart"></span></div><img id="'+file.id+'" src="" alt="晒单图片" class="image"/><a class="del-img hidden" href="javascript:;">x</a></li>');
                $("#add-img-btn").closest("li").before($item);
                if ($("#item-img-lst").children("li").size() == 6) {
                    $("#add-img-btn").closest("li").addClass("hidden");
                    $(".moxie-shim").addClass("hidden");
                }
                $(".moxie-shim").css({left:$("#add-img-btn").closest("li").position().left,top:$("#add-img-btn").closest("li").position().top});//调整按钮的位置
                !function(){
                    previewImage(file,function(imgsrc){
                        $("#"+file.id).attr("src",imgsrc);
                    })
                }();
            },
            'UploadProgress': function (up, file) {
            },
            'FileUploaded': function (up, file, info) {
                $("#" + file.id).prev(".img-cover").remove();
                $("#" + file.id).next("a").removeClass("hidden");
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
                if($("#"+err.file.id).closest("li").index()<5){
                    $("#add-img-btn").closest("li").removeClass("hidden");
                    $(".moxie-shim").removeClass("hidden");
                }
                $(".moxie-shim").css({left:$("#add-img-btn").closest("li").position().left,top:$("#add-img-btn").closest("li").position().top});//调整按钮的位置
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
//初始化图片列表
function initImgList($list){
    aLis = [],aPos = [];
    for(var i=0; i<$list.size(); i++){
        var obj = $list[i];
        obj.zIndex = 1;
        obj.index = i;
        var pos = getPos($(obj));
        $(obj).css({left:pos.left+"px",top:pos.top+"px",zIndex:"1"});
        aPos.push(pos);
        aLis.push(obj);
        drag(obj);
    }
    $list.each(function(){
        $(this).css("position","absolute");
    });
}
//drag
function drag(obj){
    obj.onmousedown=function(ev){
        var $this = $(obj);
        var oEvent = ev || event;
        var disX = oEvent.clientX-$this.position().left;
        var disY = oEvent.clientY-$this.position().top;
        var oNear = null;
        $this.css("zIndex",++zIndex);
        document.onmousemove=function(ev){
            var oEvent = ev || event;
            var left = oEvent.clientX-disX;
            var top = oEvent.clientY-disY;
            var cWidth = $(window).width();
            var cHeight = $(window).height();
            if(left<0){left=0;}
            if(left>cWidth-$this.width()){left=cWidth-$this.width();}
            if(top<0){top=0;}
            if(top>cHeight-$this.height()){top=cHeight-$this.height();}
            $this.css({left:left,top:top});
            oNear = getNearst($this);
            $this.closest("ul").children("li").removeClass("hig");
            oNear && oNear.addClass("hig");
            return false;
        };
        document.onmouseup=function(){
            document.onmousemove = null;
            document.onmouseup = null;
            if(oNear){
                var tIndex = oNear[0].index;
                oNear[0].index = $this[0].index;
                $this[0].index = tIndex;
                oNear.css("zIndex",++zIndex);
                var iIndex = $this.attr("data-index");
                $this.attr("data-index",oNear.attr("data-index"));
                oNear.attr("data-index",iIndex);
                move($this, aPos[$this[0].index]);
                move(oNear, aPos[oNear[0].index]);
                oNear.removeClass("hig");
            }else{
                move($this, aPos[$this[0].index]);
            }
            $this[0].releaseCapture && $this[0].releaseCapture();
            return false;
        };
        $this[0].setCapture && $this[0].setCapture();
        return false;
    }
}
//获取元素位置
function getPos($obj){
    return $obj.position();
}
//获取两个元素的距离
function getDis($a,$b){
    var a = (getPos($a).left+$a.width()/2)-(getPos($b).left+$b.width()/2);
    var b = (getPos($a).top+$a.height()/2)-(getPos($b).top+$b.height()/2);
    return Math.sqrt(a*a+b*b);
}
//判断两个元素是否碰撞
function isButt($a,$b){
    var l1 = getPos($a).left;
    var t1 = getPos($a).top;
    var r1 = l1 + $a.width();
    var b1 = t1 + $a.height();
    var l2 = getPos($b).left;
    var t2 = getPos($b).top;
    var r2 = l2 + $b.width();
    var b2 = t2 + $b.height();
    if(r1 < l2 || b1 < t2 || r2 < l1 || b2 < t1){
        return false;
    }else{
        return true;
    }
}
//得到距离最近的元素
function getNearst($obj){
    var aDistance = [];
    var i = 0;
    for (i = 0; i < aLis.length; i++){
        aDistance[i] = $(aLis[i]).attr("data-rel") == $obj.index() ? Number.MAX_VALUE : getDis($obj, $(aLis[i]));
    }
    var minNum = Number.MAX_VALUE;
    var minIndex = -1;
    for (i = 0; i < aDistance.length; i++){
        aDistance[i] < minNum && (minNum = aDistance[i], minIndex = i);
    }
    return isButt($obj, $(aLis[minIndex])) ? $(aLis[minIndex]) : null;
}
//元素移动
function move($obj, iTarget){
    clearInterval($obj[0].timer);
    $obj[0].timer = setInterval(function(){
        var iCurL = getPos($obj).left;
        var iCurT = getPos($obj).top;
        var iSpeedL = (iTarget.left - iCurL) / 5;
        var iSpeedT = (iTarget.top - iCurT) / 5;
        iSpeedL = iSpeedL > 0 ? Math.ceil(iSpeedL) : Math.floor(iSpeedL);
        iSpeedT = iSpeedT > 0 ? Math.ceil(iSpeedT) : Math.floor(iSpeedT);
        if (iCurL == iTarget.left && iCurT == iTarget.top){
            clearInterval($obj[0].timer);
        }else{
            $obj.css("left",iCurL + iSpeedL + "px");
            $obj.css("top",iCurT + iSpeedT + "px");
        }
    }, 30);
}