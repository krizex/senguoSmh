var curGoods = null,width = 0,page=0,finished=false,nomore=false,cur_group=null,link="/admin/goods/all";
$(document).ready(function(){
    var minheight = $(window).height()-80;
    $(".order-lists").css({minHeight:minheight+"px"});
    getGoodsItem("all",0);
    $(window).scroll(function(){
        var totalheight = $(window).height() + $(window).scrollTop() +150;
        if(finished && $(".container").height() <= totalheight) {
            $(".no-result").html("数据加载中...");
            finished=false;
            page++;
            pageGoods("all",0);
        }
    });
}).on("click",".goods_status",function(){
    $(".wrap_goods_menu").toggleClass("hide");
}).on("click",".goods_menu_list li",function(){
    var id = $(this).attr("data-id");
    $(".wrap_goods_menu").toggleClass("hide");
    $("#filter_status").attr("data-id",id).html($(this).html());
    getGoodsItem("all",0);
}).on("click",".goods-all-list li",function(){//大类切换
    var index = parseInt($(this).index());
    if(index==0){//所有商品
        $(".container").addClass("pt70");
        $(".second-tab").addClass("hide");
        $(".goods_tab").removeClass("hide");
        $("#qa").addClass("hide");
        $(".btns-list").addClass("hide");
        $("#add_goods").removeClass("hide");
    }else if(index==1){
        $(".container").removeClass("pt70");
        $(".second-tab").addClass("hide");
        $("#qa").removeClass("hide");
        $(".btns-list").addClass("hide");
        $("#group_manage").removeClass("hide");
    }else{
        $(".container").addClass("pt70");
        $(".second-tab").addClass("hide");
        $(".class_tab").removeClass("hide");
        $("#qa").addClass("hide");
        $(".btns-list").addClass("hide");
    }
    $(".boxs").addClass("hide").eq(index).removeClass("hide");
    var _type=parseInt($(this).attr('data-id'));
    $(".order-type-list .item").removeClass("active").eq(index).addClass("active");
    page=0;
    $(".order-type-list .tab-bg").css("left",33.3*index+"%");
}).on("click",".goods_list .gitem",function(){
    var index = $(this).index();
    if($(this).hasClass("active")){//切换排序方式
        $(this).children(".turn").toggleClass("rotate-img2");
    }else{
        $(".second-tab-list").find(".turn").removeClass("rotate-img2");
        $(".second-tab-list li").removeClass("active").eq(index).addClass("active");
        $(".second-tab-list .tab-line").css("left",25*index+"%");
        getGoodsItem("all",0);
    }
}).on("click",".class_status",function(){
    $(".wrap_class_menu").toggleClass("hide");
}).on("click",".class_menu_list li",function(){
    var id = $(this).attr("data-id");
    $(".wrap_class_menu").toggleClass("hide");
}).on("click",".class_list .gitem",function(){
    var index = $(this).index();
    page=0;
    if($(this).hasClass("active")){//切换排序方式
        $(this).children(".turn").toggleClass("rotate-img2");
    }else{
        $(".second-tab-list").find(".turn").removeClass("rotate-img2");
        $(".second-tab-list li").removeClass("active").eq(index).addClass("active");
        $(".second-tab-list .tab-line").css("left",25*index+"%");
    }
}).on("click","#qa",function(){
    $(this).addClass("hide");
    $(".pop-qa").removeClass("hide");
}).on("click","#close-pop",function(){
    $("#qa").removeClass("hide");
    $(".pop-qa").addClass("hide");
}).on("click",".share-group",function(){
    var url = $(this).attr("data-url");
    $(".shop_url").html(url);
    $("#big-code2").empty();
    new QRCode($("#big-code2")[0],{
        width : 300,
        height : 300
    }).makeCode(url);
    $(".pop-code2").removeClass("hide");
}).on("click",".b-close",function(){
    $(".pop-code2").addClass("hide");
}).on("click",".add-group",function(){
    $("#group_name").val("");
    $("#group_info").val("");
    $(".pop-name").removeClass("hide");
    $("#group_name").focus();
    $("#opreate_group").attr("data-action","add");
}).on("click","#opreate_group",function(){//分组
    var id = $(this).attr("data-id") || 0;
    var action = $(this).attr("data-action");
    operateGroup(action,id);
}).on("click",".edit-group",function(){
    cur_group = $(this).closest("li");
    $("#group_name").val(cur_group.find(".go-name").html());
    $("#group_info").val(cur_group.find(".go-info").html());
    $(".pop-name").removeClass("hide");
    $("#group_name").focus();
    $("#opreate_group").attr("data-id",$(this).attr("data-id")).attr("data-action","edit");
}).on("click",".cancel-bbtn",function(){
    $(this).closest(".pop-bwin").addClass("hide");
}).on("click",".del-group",function(){
    cur_group = $(this).closest("li");
    $("#del_group").attr("data-id",$(this).attr("data-id"));
    $(".pop-del").removeClass("hide");
}).on("click","#del-group",function(){
    var id = $(this).attr("data-id");
    operateGroup("del",id);
}).on("click",".manage-group",function(){
    $(".wrap-operates").removeClass("hide");
    $(".wrap-bm-btns .btns-list").addClass("hide");
    $("#finish_group").removeClass("hide");
}).on("click",".finish-group",function(){//完成
    $(".wrap-operates").addClass("hide");
    $(".wrap-bm-btns .btns-list").addClass("hide");
    $("#group_manage").removeClass("hide");
}).on("click",".slide-class",function(){
    $(this).toggleClass("arrow-up");
    $(this).closest(".class-row").next(".class-lst").toggleClass("hide");
}).on("click",".switch-btn",function(e){
    e.stopPropagation();
    switchGoods($(this).attr("data-id"),$(this));
}).on("click","#goods-all-list li",function(e){
    if($(e.target).closest(".switch-btn").size>0){
        return false;
    }else{
        //window.location.href="";//跳到编辑
    }
});
//上下架商品
function switchGoods(id,$obj){
    var url=link;
    var args={
        action:'edit_active',
        data:{
            goods_id:id
        }
    };
    $.postJson(url,args,function(res) {
        if (res.success) {
            $obj.toggleClass("switch-abtn");
            Tip("商品状态操作成功");
        }else{
            Tip(res.error_text);
        }
    });
}
//分组
function operateGroup(action,id){
    if($("#opreate_group").attr("data-flag")=="off"){
        return false;
    }
    if(action!="del"){
        var group_name = $.trim($("#group_name").val());
        var group_info = $.trim($("#group_info").val());
        if($('.group-list li').size()==7){
            Tip("最多只能添加五个自定义分组！");
            return false;
        }
        if(group_name=="" || group_name.length>10){
            Tip("分组名字不能为空且不能超过10个字");
            return false;
        }
        if(group_info=="" || group_info.length>50){
            Tip("分组介绍不能为空且不能超过50个字");
            return false;
        }
    }
    $("#opreate_group").attr("data-flag", "off");
    var url = '/admin/goods/group';
    var _action = "";
    var data={
        name:group_name,
        intro:group_info
    };
    if(action=='edit'){
        _action="edit_group";
        data.id=id;
    }else if(action=="add"){
        _action="add_group";
    }else if(action=="del"){
        _action = "delete_group";
        data={id:id}
    }
    var args = {
        action:_action,
        data:data
    };
    $.postJson(url, args,
        function (res) {
            $("#opreate_group").attr("data-flag", "on");
            if (res.success) {
                if(action=='edit'){
                    cur_group.find('.group-name').text(group_name);
                    cur_group.find('.group-intro').text(group_info);
                    $(".pop-name").addClass("hide");
                }else if(action=="add"){
                    var code = $(".group-list").attr("data-code");
                    var li = '<li><a href="javascript:;"><div class="goods-row"><dl class="godl"><dt><div class="wrap-gi"><span class="group-text">'+group_name[0]+'</span></div></dt>'+
                             '<dd><i class="more"></i><div class="c333"><div class="wrap-operates fr hide"><span class="del-group" data-id="'+res.id+'">删除</span>'+
                             '<span class="share-group" data-url="http://senguo.cc/'+code+'?group='+res.id+'">分享</span>' +
                            '<span class="edit-group" data-id="'+res.id+'">编辑</span></div><span><span class="go-name">'+group_name+'</span>(0)</span>'+
                            '</div><p class="c666 mt6 clip go-info">'+group_info+'</p></dd></dl></div></a></li>';
                    $(".group-list").append(li);
                    $(".pop-name").addClass("hide");
                }else if(action=="del"){
                    cur_group.remove();
                    $(".pop-del").addClass("hide");
                }
            }
            else {
                Tip(res.error_text);
            }
        },
        function () {
            $("#opreate_group").attr("data-flag", "on");
            Tip('网络好像不给力呢~ ( >O< ) ~');
        }
    );
}
//翻页加载
function pageGoods(action,type_id,value){
    var url;
    var filter_status = $("#filter_status").attr("data-id");
    var order_status1 = "group";
    var order_status2 = $(".goods_list").find(".active").attr("data-id");
    var filter_status2 = -2;
    var pn = page;
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
                var data = res.data;
                $("#goods-all-list").empty();
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
        //$item.find(".goods-goods-edit").attr("href","/madmin/editGoods?id="+goods.id);
        $("#goods-all-list").append($item);
    }
    /*$(".sw-link-copy").zclip({
        path: "/static/js/third/ZeroClipboard.swf",
        copy: function(){
            return $(this).prev("input").val();
        },
        afterCopy:function(){*//* 复制成功后的操作 *//*
            Tip("链接已经复制到剪切板");
        }
    });
    $(".er-code-img").each(function(){
        var _this = $(this);
        $(this).empty();
        new QRCode(this, {
            width : 80,//设置宽高
            height : 80
        }).makeCode(_this.closest(".sw-er-tip").find(".sw-link-txt").val());
    });*/
}
function orderEdit(target,action,content){
    var url='/admin/order';
    var action=action;
    var data;
    var args;
    var order_id=parseInt($('.pop-staff').attr('data-id'));
    data={order_id:order_id};
    if(action=='edit_SH2')
    {
        data.staff_id=parseInt(content);
    }
    args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            if(action=='edit_SH2'){

            }
        }
        else {
            return Tip(res.error_text);
        }
    })
}