var page=0,finished=false,link="/admin/goods/all",_type = 1;
$(document).ready(function(){
    var minheight = $(window).height()-80;
    $(".order-lists").css({minHeight:(minheight-80)+"px"});
    if($.getUrlParam("search")){
        $(".goods_list .gitem").removeClass("active");
        $(".goods_list .tab-line").addClass("hide");
        getGoodsItem("goods_search",0,$.getUrlParam("search"));
    }else{
        //getGoodsItem("all",0);
    }
    $(window).scroll(function(){
        return false;
        var totalheight = $(window).height() + $(window).scrollTop() +150;
        if(finished && $(".container").height() <= totalheight) {
            $(".no-result").html("数据加载中...");
            finished=false;
            page++;
            if($.getUrlParam("search")){
                pageGoods("goods_search",0,$.getUrlParam("search"));
            }else if($.getUrlParam("classify")) {
                pageGoods("classify",$.getUrlParam("classify"));
            }else{
                pageGoods("all",0);
            }
        }
    });
}).on("click",".goods_status",function(){
    $(".wrap_goods_menu").toggleClass("hide");
}).on("click",".goods_menu_list li",function(){
    var id = $(this).attr("data-id");
    $(".wrap_goods_menu").toggleClass("hide");
    if($(".goods_list").find(".active").size()==0){
        $(".goods_list .gitem").eq(0).addClass("active");
    }
    $(".goods_list .tab-line").removeClass("hide");
    $("#filter_status").attr("data-id",id).html($(this).html());
    page=0;
    getGoodsItem("all",0);
}).on("click",".goods-all-list li",function(){//大类切换
    var index = parseInt($(this).index());
    _type=parseInt($(this).attr('data-id'));
    $(".wrap-menu-list").addClass("hide");
    if(index==0){//所有商品
        $(".container").addClass("pt70");
        $(".second-tab").addClass("hide");
        $(".goods_tab").removeClass("hide");
        $("#qa").addClass("hide");
        $(".btns-list").addClass("hide");
        $("#add_goods").removeClass("hide");
        $(".wrap-bm-btns").removeClass("hide");
    }else if(index==1){
        $(".container").removeClass("pt70");
        $(".second-tab").addClass("hide");
        $("#qa").removeClass("hide");
        $(".btns-list").addClass("hide");
        $("#group_manage").removeClass("hide");
        $(".wrap-bm-btns").removeClass("hide");
    }else{
        $(".container").addClass("pt70");
        $(".second-tab").addClass("hide");
        $(".class_tab").removeClass("hide");
        $("#qa").addClass("hide");
        $(".wrap-bm-btns").addClass("hide");
    }
    $(".boxs").addClass("hide").eq(index).removeClass("hide");
    $(".order-type-list .item").removeClass("active").eq(index).addClass("active");
    page=0;
    $(".order-type-list .tab-bg").css("left",33.3*index+"%");
    document.body.scrollTop=0;
}).on("click",".goods_list .gitem",function(){
    var index = $(this).index();
    $(".wrap-menu-list").addClass("hide");
    page=0;
    if($(this).hasClass("active")){//切换排序方式
        $(this).children(".turn").toggleClass("rotate-img2");
        if($(this).children(".turn").hasClass("rotate-img2")){
            $(this).attr("data-id",$(this).attr("data-id")+"_desc");
        }else{
            $(this).attr("data-id",$(this).attr("data-sid"));
        }
        getGoodsItem("all",0);
    }else{
        $(".goods_list li").removeClass("active").eq(index).addClass("active");
        $(".goods_list .tab-line").css("left",25*index+"%");
        getGoodsItem("all",0);
    }
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
}).on("click",".cancel-bbtn",function(){
    $(this).closest(".pop-bwin").addClass("hide");
}).on("click",".slide-class",function(){
    $(this).toggleClass("arrow-up");
    $(this).closest(".class-row").next(".class-lst").toggleClass("hide");
}).on("click","#goods-all-list li",function(e){
    if($(e.target).closest(".switch-btn").size()>0){
        return false;
    }else{
        if($(this).attr("data-flag")=="delete"){
            return false;
        }else{
            var id = $(this).attr("data-id");
            window.location.href="/madmin/goodsEdit/"+id;//跳到编辑
        }
    }
});
//翻页加载
function pageGoods(action,type_id,value){
    var url;
    var filter_status = $("#filter_status").attr("data-id");
    var order_status1 = "group";
    var order_status2 = $(".goods_list").find(".active").attr("data-id");
    var filter_status2 = -2;
    var pn = page;
    if(filter_status=="delete"){
        url="/admin/goods/delete?page="+pn;
    }else{
        if(action=="classify"){
            url = "/admin/goods/all?filter_status="+filter_status+"&order_status1="+order_status1+"&order_status2="+order_status2+"&filter_status2="+filter_status2+"&type=classify&sub_type="+type_id+"&page="+pn;
        }else if(action=="goods_search"){
            url="/admin/goods/all?type=goods_search&content="+value+"&page="+pn;
        }else{
            url = "/admin/goods/all?filter_status="+filter_status+"&order_status1="+order_status1+"&order_status2="+order_status2+"&filter_status2="+filter_status2+"&page="+pn;
        }
    }
    $.ajax({
        url:url,
        type:"get",
        success:function(res){
            if(res.success){
                var data = res.data;
                if(data.length==0){
                    $(".no-result").html("没有更多商品了");
                    finished = false;
                }else{
                    insertGoods(data);
                    finished = true;
                }
            }else{
                Tip(res.error_text);
            }
        }
    });
}
function getGoodsItem(action,type_id,value){
    var url;
    var filter_status = $("#filter_status").attr("data-id");
    var order_status1 = "group";
    var order_status2 = $(".goods_list").find(".active").attr("data-id");
    var filter_status2 = -2;
    var pn = page;
    if(filter_status=="delete"){
        url="/admin/goods/delete?page="+pn;
    }else{
        if(action=="classify"){
            url = "/admin/goods/all?filter_status="+filter_status+"&order_status1="+order_status1+"&order_status2="+order_status2+"&filter_status2="+filter_status2+"&type=classify&sub_type="+type_id+"&page="+pn;
        }else if(action=="goods_search"){
            url="/admin/goods/all?type=goods_search&content="+value+"&page="+pn;
        }else{
            url = "/admin/goods/all?filter_status="+filter_status+"&order_status1="+order_status1+"&order_status2="+order_status2+"&filter_status2="+filter_status2+"&page="+pn;
        }
    }
    $.ajax({
        url:url,
        type:"get",
        success:function(res){
            if(res.success){
                var data = res.data;
                $("#goods-all-list").empty();
                if(data.length==0){
                    $(".no-result").html("没有搜索到商品~~");
                    finished = false;
                }else{
                    insertGoods(data);
                    finished = true;
                    $(".no-result").html("");
                }
            }else{
                Tip(res.error_text);
            }
        }
    });
}
function insertGoods(data){
    for(var i=0; i<data.length; i++){
        var goods = data[i];
        var $item = $(".clone-goods").children().clone();
        $item.attr("data-id",goods.id).attr("data-code",goods.code);
        $item.find(".goods-add-time").html(goods.add_time);
        $item.find(".goods-goods-name").html(goods.name);
        if(goods.imgurl){
            $item.find(".cur-goods-img").attr("src",goods.imgurl[0]+"?imageView2/1/w/100/h/100");
        }
        $item.find(".current-group").html(goods.group_name).attr("data-id",goods.group_id);
        $item.find(".stock-num").html(goods.storage);
        $item.find(".stay-num").html(goods.current_saled);
        $item.find(".stock-name").html(goods.unit_name);
        if(goods.active==1){  //上架
            $item.find(".switch-btn").addClass("switch-abtn");
        }
        $item.find(".switch-btn").attr("data-id",goods.id);
        if(goods.charge_types.length>0){
            for(var j=0; j<goods.charge_types.length; j++){
                var good = goods.charge_types[j];
                var item = '<span class="mr10"><span class="yellow">￥</span>'+good.price+'元/'+good.num+good.unit_name+'</span>';
                $item.find(".goods-price-list").append(item);
            }
        }
        $item.find(".goods-vol").html(goods.saled);
        if($("#filter_status").attr("data-id")=="delete" || goods.active==0){
            $item.attr("data-flag","delete");
            $item.find(".switch-btn").addClass("hide");
            $item.find(".cancel-goods").removeClass("hide");
            $item.find(".more").hide();
        }
        $("#goods-all-list").append($item);
    }
}