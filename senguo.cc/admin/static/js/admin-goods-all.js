var goods_list=null,curItem=null,curPrice=null,curEditor="",goodsEdit = false,aLis=[],aPos=[],zIndex= 1,pn= 0,editor=null,_type,_sub_type,isSearch=false;
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
    var link_type=$.getUrlParam("type");
    var sub_type=parseInt($.getUrlParam("type_id"));
    if(link_type=="classify"){//分类跳转
        getGoodsItem(link_type,0,sub_type);
    }else if(link_type=="goodsearch"){//搜索跳转
        var value = decodeURIComponent($.getUrlParam("content"));
        isSearch = true;
        getGoodsItem("goods_search",0,"",value);
    }else{
        getGoodsItem("all",0);
    }
    getData('fruit','color');
    _type = 'fruit';
    _sub_type = 'color';
}).on("click",".all-select-box",function(){
    $(this).toggleClass("checked-box");
    if($(this).hasClass("checked-box")){
        $(".check-box").addClass("checked-box");
    }else{
        $(".check-box").removeClass("checked-box");
    }
}).on("click",".goods-all-list .check-box",function(){
    $(this).toggleClass("checked-box");
}).on("click",".switch-btn",function(){ //上架下架
    var $this = $(this);
    var id = $(this).attr("data-id");
    switchGoodsRack(id,$this);
}).on("click",".cancel-btn",function(){
    $(this).closest(".pop-win").hide();
}).on("click",".show-add-img",function(){   //上传图片
    var $item = $(this).closest(".item-img-lst").children(".img-bo").clone();
    $("#add-img-btn").closest("li").prevAll("li").remove();
    if($item.size()>0){
        $item.css({position:"relative",left:"0",top:"0"});
        $("#add-img-btn").closest("li").before($item);
        if($item.size()==5){
            $("#add-img-btn").closest("li").addClass("hidden");
        }
    }else{
        $("#add-img-btn").closest("li").removeClass("hidden");
    }
    $(".pop-img-win").show();
}).on("click",".sg-img-list img",function(){
    if($(this).hasClass("selected-img")){
        $(this).prev(".img-selected").toggle();
        $(this).toggleClass("selected-img");
    }else{
        if($("#item-img-lst").children(".img-bo").size()<=5){
            var src = $(this).attr("src");
            var index = $("#item-img-lst").children(".img-bo").size()-1;
            var item = '<li class="img-bo" data-index="'+index+'" data-rel="'+index+'"><img src="'+src+'" class="img"><a class="del-img" href="javascript:;">x</a></li>';
            $("#add-img-box").before(item);
            $(this).prev(".img-selected").show();
            $(this).addClass("selected-img");
        }else{
            Tip("只能添加5张照片哦！")
        }
    }
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
    var price_unit = $(this).html();
    var $this = $(this);
    if($(this).closest("ul").hasClass("price-unit-list")){
        $(this).closest("ul").prev("button").children("em").html(price_unit).attr("data-id",$(this).attr("data-id"));
        var $item = $(this).closest(".goods-all-item");
        curPrice = $(this).closest(".wrap-add-price");
        var cur_unit = $item.find(".current-unit").html();
        if(cur_unit!=price_unit){
            $("#now-unit").html(price_unit);
            $("#stock-unit").html(cur_unit);
            $(".pop-unit").show();
        }
    }else if($(this).closest("ul").hasClass("condition-list")){//条件查询
        isSearch = false;
        $(this).closest("ul").prev("button").children("em").html(price_unit).attr("data-id",$(this).attr("data-id"));
        getGoodsItem("all",pn,"");
    }else if($(this).closest("ul").hasClass("batch-group-list")){//批量分组
        batchGroup(price_unit,$(this).attr("data-id"),$this);
    }else if($(this).closest("ul").hasClass("group-goods-lst")){//切换单个商品分组
        var group_id = $(this).attr("data-id");
        var goods_id = $(this).closest(".goods-all-item").attr("data-id");
        singleGroup(goods_id,group_id,$this);
    }
}).on("click",".del-img",function(){//删除图片
    var $list = $(this).closest(".item-img-lst");
    $(this).closest("li").remove();
    if($list.hasClass("drag-img-list")){
        $list.children(".img-bo").css({position:"relative",left:0,top:0});
        initImgList($list.children(".img-bo"));
        $list.children(".add-img-box").css("marginLeft",$list.children(".img-bo").size()*75+"px");
    }else{
        $(".moxie-shim").css({left:$("#add-img-btn").closest("li").position().left,top:$("#add-img-btn").closest("li").position().top});
    }
    $list.children(".add-img-box").removeClass("hidden");
}).on("click",".item-set-more",function(){
    $(this).closest(".all-item-cont").next(".wrap-more-set").slideToggle(200);
    $(this).toggleClass("item-set-mactive");
}).on("click",".eidt-all-item",function(){//编辑商品
    if(goodsEdit){
        Tip("请先完成正在编辑的商品");
        return false;
    }
    var _this = $(this);
    var goods_item = _this.closest(".goods-all-item");
    var index = goods_item.index();
    var group = {id:goods_item.find(".current-group").attr("data-id"),text:goods_item.find(".current-group").html()};
    var switch_btn = {id:goods_item.find(".switch-btn").attr("data-id"),text:goods_item.find(".switch-btn").attr("class")};
    $.getItem("/static/items/admin/goods-item.html?1256",function(data){
        var goodsItem = data;
        var $item = $(goodsItem).clone();
        $item.find(".current-group").attr("data-id",group.id).html(group.text);
        $item.find(".switch-btn").attr("data-id",switch_btn.id).removeClass().addClass(switch_btn.text);
        initEditGoods($item,index);
        _this.closest(".goods-all-item").hide().after($item);
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
    var $item = _this.closest(".goods-all-item");
    if($item.attr("data-id")){
        dealGoods($item,"edit");
    }else{
        dealGoods($item,"add");
    }
}).on("click","#add-goods",function(){  //添加新商品类别
    if(goodsEdit){
        Tip("请先完成正在编辑的商品");
        return false;
    }
    $(".wrap-classify").prevAll().addClass("hidden");
    $(".wrap-classify").removeClass("hidden");
}).on("click",".fruit-item-list li",function(){//选择分类并添加商品
    var classify = $(this).html();
    var class_id = $(this).attr("data-id");
    $.getItem("/static/items/admin/goods-item.html?1356",function(data){
        var goodsItem = data;
        var $item = $(goodsItem).clone();
        $item.find(".goods-classify").html(classify).attr("data-id",class_id);
        $item.find(".group-goods-lst").html($("#group-goods-lst").children(".presentation").clone());
        $item.find(".group-goods-lst").find(".group-counts").hide();
        $item.find(".all-item-title").remove();
        if($(".goods-all-list").children().size()>0){
            $(".goods-all-list").children(".goods-all-item").first().before($item);
        }else{
            $(".goods-all-list").append($item);
        }
        curItem = $item;
        goodsEdit = true;
        $(".wrap-classify").addClass("hidden");
        $(".wrap-classify").prevAll().removeClass("hidden");
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
    if(editor){
        editor.html($(this).attr("data-text"));
        $(".pop-editor").show();
    }else{
        initEditor($(this).attr("data-text"));
    }
    curEditor = $(this);
}).on("click",".pop-editor",function(e){
    if($(e.target).closest(".wrap-kindeditor").size()==0){
        $(".pop-editor").hide();
    }
}).on("click",".pop-unit",function(e){
    if($(e.target).closest(".wrap-unit").size()==0){
        $(".pop-unit").hide();
    }
}).on("click",".add-price-type",function(){//新增售价方式
    var $item = $(".wrap-price-item").children(".wrap-add-price").clone();
    var index = $(this).closest(".edit-item-right").children(".wrap-add-price").size();
    $item.find(".price-index").html(index+1);
    $(this).closest("p").before($item);
}).on("click",".del-price-type",function(){//删除售价方式
    $(this).closest(".wrap-add-price").remove();
}).on('click','.furit-type li',function(){/*水果分类*/
    var $this=$(this);
    $this.addClass('active').siblings('li').removeClass('active');
    var type = $this.attr('data-type');
    _type=type;
    getData(type,_sub_type);
}).on('click','.pro-list li',function(){
    var $this=$(this);
    var pro = $this.attr('data-pro');
    var text =$this.text();
    _sub_type = pro;
    $('.select-now').text(text);
    getData(_type,pro);
}).on('click','.fruit-search',function(){
    var con=$('#search-classify').val();
    getData2(con);
}).on("click",".del-all-item",function(){//删除商品
    var $obj = $(this).closest(".goods-all-item");
    var id = $obj.attr("data-id");
    delGoods(id);
}).on("click",".ok-unit-box",function(){//确认单位换算
    var firstNum = $("#first_num").val();
    var secondNum = $("#second_num").val();
    if(isNaN(firstNum) || isNaN(secondNum)){
        Tip("请填入整数，不能含有小数点");
        return false;
    }else{
        curPrice.attr("data-first",firstNum).attr("data-second",secondNum);
        $(".pop-unit").hide();
    }
}).on("click","#batch-up",function(){//批量上架&下架
    batchGoods("up");
}).on("click","#batch-down",function(){
    batchGoods("down");
}).on("click",".ok-editor",function(){
    curEditor.attr("data-text",editor.html());
    $(".pop-editor").hide();
}).on("click",".pre-page",function(){//上页
    if(pn==0){
        return Tip("当前已经是第一页");
    }
    if(isSearch){
        getGoodsItem("goods_search",pn--,"",$("#goods-all-ipt").val());
    }else{
        getGoodsItem("all",pn--);
    }
}).on("click",".next-page",function(){//下一页
    var total = $(".page-total").html();
    if(pn==parseInt(total)-1){
        return Tip("当前已经是最后一页");
    }
    if(isSearch){
        getGoodsItem("goods_search",pn++,"",$("#goods-all-ipt").val());
    }else{
        getGoodsItem("all",pn++);
    }
}).on("click",".jump-to",function(){
    var num = $(".input-page").val();
    var total = $(".page-total").html();
    if(isNaN(num) || $.trim(num)=="" || parseInt(num)<1 || parseInt(num)>(parseInt(total)-1)){
        return Tip("页码格式不对或者数字超出页码范围");
    }
    if(isSearch){
        getGoodsItem("goods_search",num-1,"",$("#goods-all-ipt").val());
    }else{
        getGoodsItem("all",num-1);
    }
}).on("keyup",".input-page",function(e){
    if(e.keyCode==13){
        var num = $(".input-page").val();
        var total = $(".page-total").html();
        if(isNaN(num) || $.trim(num)=="" || parseInt(num)<1 || parseInt(num)>(parseInt(total)-1)){
            return Tip("页码格式不对或者数字超出页码范围");
        }
        if(isSearch){
            getGoodsItem("goods_search",num-1,"",$("#goods-all-ipt").val());
        }else{
            getGoodsItem("all",num-1);
        }
    }
}).on("click","#goods-all-search",function(){//商品搜索
    var value = $("#goods-all-ipt").val();
    if($.trim(value)==""){
        return Tip("搜索条件不能为空！");
    }
    isSearch = true;
    getGoodsItem("goods_search",0,"",value);
}).on("keyup","#goods-all-ipt",function(e){//商品搜索框
    var value = $(this).val();
    if(e.keyCode==13){
        if($.trim(value)!=""){
            isSearch = true;
            getGoodsItem("goods_search",0,"",value);
        }
    }
});
//添加&编辑商品
function dealGoods($item,type){
    var limit_num = $item.find(".limit_num").val();
    var priority = $item.find(".goods-priority").val();
    var name = $item.find(".goods-goods-name").val();
    if(isNaN(limit_num) || parseInt(limit_num)<0){
        return Tip("商品限购必须为数字");
    }
    if(isNaN(priority) || parseInt(priority)>9 || parseInt(priority)<0){
        return Tip("优先级必须为0-9的数字");
    }
    if(name.length>10 || $.trim(name)==""){
        return Tip("商品名字不能为空且不能超过10个字");
    }
    var imgUrls = $item.find(".drag-img-list").find("img");
    var imgList = {};
    if(imgUrls.size()==0){
        return Tip("必须上传至少一张商品图片");
    }else if(imgUrls.size()>5){
        return Tip("图片不能超过5张");
    }else{
        var arr1 = [];
        var arr2 = [];
        imgUrls.each(function(){
            var $this = $(this);
            arr1.push($this.closest("li").attr("data-index"));
            console.log($this.attr("url"));
            arr2.push($this.attr("url"));
        });
        imgList.index = arr1;
        imgList.src = arr2;
    }
    var price_type = $item.find(".edit-item-right").children(".wrap-add-price");
    var price_list = [];
    if(price_type.size()==0){
        return Tip("请至少添加一种售价方式");
    }else{
        price_type.each(function(){
            var unit_num = $(this).attr("data-first");
            var unit = $(this).find(".price-unit").attr("data-id");
            var unit_name = $(this).find(".price-unit").html();
            var num = $(this).find(".price-num").val();
            var select_num = $(this).attr("data-second");
            var price = $(this).find(".current-price").val();
            var markey_price = $(this).find(".market-price").val();
            var item = {
                unit_num:unit_num,//第一个数量
                unit:unit,//选择单位ID
                num:num,//数量
                select_num:select_num,//第二个数量
                price:price,//价格
                market_price:markey_price,//市场价
                unit_name:unit_name
            }
            price_list.push(item);
        });
    }
    var group_name = $item.find(".current-group").html();
    var group_id = $item.find(".current-group").attr("data-id");
    var info = $item.find(".goods-info").val();
    var storage = $item.find(".stock-num").val();
    var unit = $item.find(".current-unit").attr("data-id");
    var fruit_type_id = $item.find(".goods-classify").attr("data-id");
    var limit_num = $item.find(".limit_num").val();
    var priority = $item.find(".goods-priority").val();
    var detail_describe = "";
    if(editor){
        detail_describe = editor.html();
    }
    var url="";
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
        name: name//商品名称,
    };
    if(type == "edit"){
        data.goods_id=$item.attr("data-id");
    }
    var args = {data:data};
    if(type=="edit"){
        args["action"]="edit_goods";
    }else{
        args["action"]="add_goods";
    }
    $.postJson(url,args,function(res) {
        if (res.success) {
            if(type == "add"){
                Tip("新商品添加成功！");
                setTimeout(function(){
                    window.location.href="/admin/goods/all?&page=0";
                },2000);
            }else{
                Tip("商品编辑成功！");
                var data = res.data;
                finishEditGoods($item.prev(".goods-all-item"),data);
                $item.prev(".goods-all-item").show();
                var index = $item.prev(".goods-all-item").index();
                goods_list[index] = data;
                $item.remove();
                $("#add-img-btn").closest("li").prevAll("li").remove();//清除添加的图片
                curItem = null;
                curPrice = null;
                goodsEdit = false;
            }
        }else{
            Tip(res.error_text);
        }
    });
}
//初始化编辑商品
function initEditGoods($item,index){
    var goods = goods_list[index];
    $item.attr("data-id",goods.id);
    $item.find(".goods-add-time").html(goods.add_time);
    $item.find(".goods-goods-name").val(goods.name);
    var imgUrls = goods.imgurl;
    if(imgUrls.length==0){
    }else{
        if(imgUrls.length == 5){
            $item.find(".add-img-box").addClass("hidden");
        }
        for(var i=0; i<imgUrls.length; i++){
            var $li = $('<li class="img-bo" data-index="'+i+'" data-rel="'+i+'"><img src="'+imgUrls[i]+'?imageView2/5/w/100/h/100" url="'+imgUrls[i]+'" alt="商品图片" class="image"/><a class="del-img" href="javascript:;">x</a></li>');
            $item.find(".drag-img-list").children(".add-img-box").before($li);
        }
        setTimeout(function(){
            $item.find(".drag-img-list").children(".add-img-box").css("marginLeft",imgUrls.length*75+"px");
            initImgList($item.find(".drag-img-list").children(".img-bo"));
        },1000);
    }
    var price_list = goods.charge_types;
    if(price_list.length==0){
    }else{
        for(var j=0; j<price_list.length; j++){
            var price = price_list[j];
            var item = $(".wrap-price-item").children(".wrap-add-price").clone();
            item.attr("data-id",price.id);
            item.attr("data-first",price.unit_num);
            item.attr("data-second",price.select_num);
            item.find(".price-index").html(j+1);
            item.find(".price-unit").html(price.unit_name).attr("data-id",price.unit);
            item.find(".price-num").val(price.num);
            item.find(".current-price").val(price.price);
            item.find(".market-price").val(price.market_price);
            $item.find(".edit-item-right").children("p").before(item);
        }
    }
    $item.find(".stock-num").val(goods.storage);
    $item.find(".current-unit").html(goods.unit_name).attr("data-id",goods.unit);
    $item.find(".goods-classify").html(goods.fruit_type_name).attr("data-id",goods.fruit_type_id);
    $item.find(".goods-info").val(goods.intro);
    $item.find(".show-txtimg").attr("data-text",goods.detail_describe);
    $item.find(".limit_num").val(goods.limit_num);
    $item.find(".goods-priority").val(goods.priority);
    $item.find(".group-goods-lst").html($("#group-goods-lst").children(".presentation").clone());
    $item.find(".group-goods-lst").find(".group-counts").hide();
}
//编辑完成
function finishEditGoods($item,data){
    var goods = data;
    $item.find(".goods-goods-name").html(goods.name);
    if(goods.imgurl){
        $item.find(".cur-goods-img").attr("src",goods.imgurl[0]+"?imageView2/5/w/100/h/100");
    }
    $item.find(".current-group").html(goods.group_name).attr("data-id",goods.group_id);
    $item.find(".stock-num").html(goods.storage);
    if(goods.active==1){  //上架
        $item.find(".switch-btn").addClass("switch-btn-active");
    }else{
        $item.find(".switch-btn").removeClass("switch-btn-active");
    }
    $item.find(".current-group").html(goods.group_name).attr("data-id",goods.group_id);
    $item.find(".show-txtimg").attr("data-text",goods.detail_describe);
    $item.find(".goods-priority").html(goods.priority);
    $item.find(".limit-num").html(goods.limit_num);
    $item.find(".item-goods-txt").html(goods.intro);
    $item.find(".goods-price-list").empty();
    if(goods.charge_types.length>0){
        for(var j=0; j<goods.charge_types.length; j++){
            var good = goods.charge_types[j];
            var item = '<p class="mt10"><span class="mr10">售价'+(j+1)+' : <span class="red-txt">'+good.price+'元/'+good.num+good.unit_name+'</span></span><span class="mr10">市场价 : <span class="">'+good.market_price+'元</span></span></p>';
            $item.find(".goods-price-list").append(item);
        }
    }
}
//单个分组
function singleGroup(goods_id,group_id,$obj){
    var url="";
    var args={
        action:"change_group",
        data:{
            goods_id:goods_id,
            group_id:group_id
        }
    };
    $.postJson(url,args,function(res) {
        if (res.success) {
            Tip("分组设置成功！");
            $obj.closest("ul").prev("button").children("em").html($obj.html()).attr("data-id",$obj.attr("data-id"));
        }else{
            Tip(res.error_text);
        }
    });
}
//批量分组
function batchGroup(name,group_id,$obj){
    if(goodsEdit){
        return Tip("请先完成正在编辑的商品");
    }
    if($(".checked-box").size()==0){
        return Tip("您没有选中任何商品哦");
    }
    var aIds = [];
    var batchList = $(".goods-all-list").find(".checked-box");
    batchList.each(function(){
        var id = $(this).closest(".goods-all-item").attr("data-id");
        aIds.push(id);
    });
    var url="";
    var args={
        action:"batch_group",
        data:{
            goods_id:aIds,
            group_id:group_id
        }
    };
    $.postJson(url,args,function(res) {
        if (res.success) {
            Tip("批量分组成功！");
            $obj.closest("ul").prev("button").children("em").html($obj.html()).attr("data-id",$obj.attr("data-id"));
            batchList.each(function(){
                $(this).closest(".goods-all-item").find(".batch-group").html(name.split("(")[0]).attr("data-id",group_id);
            });
        }else{
            Tip(res.error_text);
        }
    });
}
//批量上架&下架商品
function batchGoods(type){
    if(goodsEdit){
        return Tip("请先完成正在编辑的商品");
    }
    if($(".checked-box").size()==0){
        return Tip("您没有选中任何商品哦");
    }
    var aIds = [];
    var batchList = $(".goods-all-list").find(".checked-box");
    batchList.each(function(){
        var id = $(this).closest(".goods-all-item").attr("data-id");
        aIds.push(id);
    });
    var url="";
    var args={
        data:{
            goods_id:aIds
        }
    };
    if(type=="up"){
        args.action='batch_on';
    }else{
        args.action='batch_off';
    }
    $.postJson(url,args,function(res) {
        if (res.success) {
            Tip("批量操作成功！");
            if(type=="up"){
                batchList.each(function(){
                    $(this).closest(".goods-all-item").find(".switch-btn").addClass("switch-btn-active");
                });
            }else{
                batchList.each(function(){
                    $(this).closest(".goods-all-item").find(".switch-btn").removeClass("switch-btn-active");
                });
            }
        }else{
            Tip(res.error_text);
        }
    });
}
//删除商品
function delGoods(id){
    var url="";
    var args={
        action:'delete_goods',
        data:{
            goods_id:id
        }
    };
    $.postJson(url,args,function(res) {
        if (res.success) {
            Tip("商品删除成功！");
            setTimeout(function(){
                window.location.reload(true);
            },2000);
        }
    });
}
//上下架商品
function switchGoodsRack(id,$obj){
    var url="";
    var args={
        action:'edit_active',
        data:{
            goods_id:id
        }
    };
    $.postJson(url,args,function(res) {
        if (res.success) {
            $obj.toggleClass("switch-btn-active");
            Tip("商品状态操作成功！");
        }else{
            Tip(res.error_text);
        }
    });
}
function initEditor(text){
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
            items:[
                 'preview', 'image'
            ],
            afterCreate: function(){this.sync();},
            afterBlur: function(){this.sync();},
            afterUpload : function(url) {
            },
            uploadError:function(file, errorCode, message){
            }
        });
        editor.html(text);
    }});
}

function getGoodsItem(action,page,type_id,value){
    $(".wrap-loading-box").removeClass("hidden");
    var url;
    var filter_status = $(".filter_status").attr("data-id");
    var order_status1 = $(".order_status1").attr("data-id");
    var order_status2 = $(".order_status2").attr("data-id");
    var filter_status2 = $(".filter_status2").attr("data-id");
    if(action=="classify"){
        url = "/admin/goods/all?filter_status="+filter_status+"&order_status1="+order_status1+"&order_status2="+order_status2+"&filter_status2="+filter_status2+"&type=classify&sub_type="+type_id+"&page="+pn;
    }else if(action=="goods_search"){
        url="/admin/goods/all?type=goods_search&content="+value+"&page="+pn;
    }else{
        url = "/admin/goods/all?filter_status="+filter_status+"&order_status1="+order_status1+"&order_status2="+order_status2+"&filter_status2="+filter_status2+"&page="+pn;
    }
    $.ajax({
        url:url,
        type:"get",
        success:function(res){
            if(res.success){
                goods_list = res.data;
                var data = res.data;
                $(".goods-all-list").empty();
                if(data.length==0){
                    $(".goods-all-list").append("<p>没有查询到任何商品！</p>");
                }else{
                    $(".page-total").html(res.count);
                    $(".page-now").html(pn+1);
                    insertGoods(data);
                }
                $(".wrap-loading-box").addClass("hidden");
            }else{
                $(".wrap-loading-box").addClass("hidden");
                Tip(res.error_text);
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
            $item.find(".cur-goods-img").attr("src",goods.imgurl[0]+"?imageView2/5/w/100/h/100");
        }
        $item.find(".current-group").html(goods.group_name).attr("data-id",goods.group_id);
        $item.find(".stock-num").html(goods.storage);
        $item.find(".stay-num").html(goods.current_saled);
        if(goods.active==1){  //上架
            $item.find(".switch-btn").addClass("switch-btn-active");
        }
        $item.find(".switch-btn").attr("data-id",goods.id);
        $item.find(".show-txtimg").attr("data-text",goods.detail_describe);
        $item.find(".goods-classify").html(goods.fruit_type_name).attr("data-id",goods.fruit_type_id);
        $item.find(".goods-priority").html(goods.priority);
        $item.find(".limit-num").html(goods.limit_num);
        $item.find(".item-goods-txt").html(goods.intro);
        $item.find(".dianzan").html(goods.favour);
        if(goods.charge_types.length>0){
            for(var j=0; j<goods.charge_types.length; j++){
                var good = goods.charge_types[j];
                var item = '<p class="mt10"><span class="mr10">售价'+(j+1)+' : <span class="red-txt">'+good.price+'元/'+good.num+good.unit_name+'</span></span><span class="mr10">市场价 : <span class="">'+good.market_price+'元</span></span></p>';
                $item.find(".goods-price-list").append(item);
            }
        }
        /*$item.find(".goods-comment-num").html("2222");*/
        $item.find(".goods-vol").html(goods.saled);
        $item.find(".sw-link-txt").val("http://senguo.cc/customer/goods/"+goods.id);
        $item.find(".group-goods-lst").html($("#group-goods-lst").children(".presentation").clone());
        $item.find(".group-goods-lst").find(".group-counts").hide();
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
        $(obj).attr("data-index",i).attr("data-rel",i);
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
/*水果分类*/
function getData(type,sub_type){
    $.ajax({
        url:'/admin/goods/classify?type='+type+'&sub_type='+sub_type,
        type:"get",
        success:function(res){
            if(res.success){
                var data = res.data;
                $('.fruit-list').empty();
                var item='<li>'+
                    '<p class="title {{property}}">{{name}}</p>'+
                    '<ul class="fruit-item-list group">'+
                    '{{each types as type}}'+
                    '<li data-id="{{type.id}}">{{type.name}}</li>'+
                    '{{/each}}'+
                    '</ul>'+
                    '</li>';
                for(var d in data){
                    if(data[d]['data'].length!=0){
                        var render = template.compile(item);
                        var html = render({
                            property:data[d]['property'],
                            name:data[d]['name'],
                            types:data[d]['data']
                        });
                        $('.fruit-list').append(html);
                    }

                }
            }
        }
    });
}

function getData2(con){
    if(!con){
        return Tip('请输入分类名称');
    }
    var url="";
    var data={'classify':con};
    var args={
        action:'classify_search',
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                var data = res.data;
                $('.fruit-list').empty();
                var item='<ul class="fruit-item-list group">'+
                    '<li data-id="{{id}}">{{name}}</li>'+
                    '</ul>';
                for(var d in data){
                    if(data[d].length!=0){
                        var render = template.compile(item);
                        var html = render({
                            id:data[d]['id'],
                            name:data[d]['name'],
                            num:data[d]['num']
                        });
                        $('.fruit-list').append(html);
                    }

                }

            }
            else return Tip(res.error_text);
        },
        function(){return Tip('网络错误！')}
    );
}