var curGoods = null,width = 0,page=0,finished=false,nomore=false,cur_group=null,link="/admin/goods/all",_type = 1;
$(document).ready(function(){
    var minheight = $(window).height()-80;
    $(".order-lists").css({minHeight:minheight+"px"});
    $(".wrap-goods-group").css({minHeight:(minheight+30)+"px"});
    if($.getUrlParam("search")){
        getGoodsItem("goods_search",0,$.getUrlParam("search"));
    }else{
        getGoodsItem("all",0);
    }
    getData('fruit','color');
    if($.getUrlParam("type")){
        _type = parseInt($.getUrlParam("type"));
        $(".container").removeClass("pt70");
        $(".second-tab").addClass("hide");
        $("#qa").removeClass("hide");
        $(".btns-list").addClass("hide");
        $("#group_manage").removeClass("hide");
        $(".boxs").addClass("hide").eq(1).removeClass("hide");
        $(".order-type-list .item").removeClass("active").eq(1).addClass("active");
        page=0;
        $(".order-type-list .tab-bg").css("left","33.3%");
    }
    $(window).scroll(function(){
        if(_type!=1) return false;
        var totalheight = $(window).height() + $(window).scrollTop() +150;
        if(finished && $(".container").height() <= totalheight) {
            $(".no-result").html("数据加载中...");
            finished=false;
            page++;
            if($.getUrlParam("search")){
                pageGoods("goods_search",0,$.getUrlParam("search"));
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
    $("#filter_status").attr("data-id",id).html($(this).html());
    page=0;
    getGoodsItem("all",0);
}).on("click",".goods-all-list li",function(){//大类切换
    var index = parseInt($(this).index());
    _type=parseInt($(this).attr('data-id'));
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
}).on("click",".goods_list .gitem",function(){
    var index = $(this).index();
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
        //$(".goods_list").find(".turn").removeClass("rotate-img2");
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
    getData(type,sub_type);
}).on("click",".class_list .gitem",function(){
    var index = $(this).index();
    var type = $(this).attr("data-id");
    var sub_type = $("#class_type").attr("data-id");
    $(".class_list li").removeClass("active").eq(index).addClass("active");
    $(".class_list .tab-line").css("left",25*index+"%");
    getData(type,sub_type);
}).on("click","#qa",function(){
    $(this).addClass("hide");
    $(".pop-qa").removeClass("hide");
}).on("click","#close-pop",function(){
    $("#qa").removeClass("hide");
    $(".pop-qa").addClass("hide");
}).on("click",".share-group",function(e){
    e.stopPropagation();
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
    $("#g_title").html("添加分组");
    $(".pop-name").removeClass("hide");
    $("#group_name").focus();
    $("#opreate_group").attr("data-action","add");
}).on("click","#opreate_group",function(){//分组
    var id = $(this).attr("data-id") || 0;
    var action = $(this).attr("data-action");
    operateGroup(action,id);
}).on("click",".edit-group",function(e){
    e.stopPropagation();
    cur_group = $(this).closest("li");
    $("#group_name").val(cur_group.find(".go-name").html());
    $("#group_info").val(cur_group.find(".go-info").html());
    $("#g_title").html("编辑分组");
    $(".pop-name").removeClass("hide");
    $("#group_name").focus();
    $("#opreate_group").attr("data-id",$(this).attr("data-id")).attr("data-action","edit");
}).on("click",".cancel-bbtn",function(){
    $(this).closest(".pop-bwin").addClass("hide");
}).on("click",".del-group",function(e){
    e.stopPropagation();
    cur_group = $(this).closest("li");
    $("#del_group").attr("data-id",$(this).attr("data-id"));
    $(".pop-del").removeClass("hide");
}).on("click","#del_group",function(){
    var id = $(this).attr("data-id");
    operateGroup("del",id);
}).on("click",".group-list li",function(e){
    var url = $(this).attr("data-url");
    if($(e.target).closest(".wrap-operates").size()==0){
        window.location.href=url;
    }
}).on("click",".manage-group",function(){
    $(".wrap-operates").removeClass("hide");
    $(".wrap-bm-btns .btns-list").addClass("hide");
    $("#finish_group").removeClass("hide");
}).on("click",".finish-group",function(){
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
        var id = $(this).attr("data-id");
        window.location.href="/madmin/goodsEdit/"+id;//跳到编辑
    }
}).on("click","#convert-btn",function(){//分类搜索
    var con = $.trim($("#class_con").val());
    getData2(con);
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
                    cur_group.find('.go-name').text(group_name);
                    cur_group.find('.go-info').text(group_info);
                    $(".pop-name").addClass("hide");
                }else if(action=="add"){
                    var code = $(".group-list").attr("data-code");
                    var li = '<li data-url="/madmin/goodsBatch?gid='+res.id+'"><a href="javascript:;"><div class="goods-row"><dl class="godl"><dt><div class="wrap-gi"><span class="group-text">'+group_name[0]+'</span></div></dt>'+
                             '<dd><i class="more"></i><div class="c333"><div class="wrap-operates fr hide"><span class="del-group" data-id="'+res.id+'">删除</span>'+
                             '<span class="share-group" data-url="http://senguo.cc/'+code+'?group='+res.id+'">分享</span>' +
                            '<span class="edit-group" data-id="'+res.id+'">编辑</span></div><span><span class="go-name">'+group_name+'</span>(0)</span>'+
                            '</div><p class="c666 mt6 clip go-info">'+group_info+'</p></dd></dl></div></a></li>';
                    $(".group-list").append(li);
                    $(".pop-name").addClass("hide");
                    Tip("新分组添加成功");
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
        $("#goods-all-list").append($item);
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
                    '<li data-id="{{type.id}}" data-code="{{code}}"><span class="{{if type.num>0}}selected{{/if}}"><span class="class_name">{{type.name}}</span>({{type.num}})</span></li>'+
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
            }
            else return Tip(res.error_text);
        },
        function(){return Tip('网络错误');}
    );
}