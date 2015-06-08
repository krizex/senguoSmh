/**
 * Created by Administrator on 2015/6/2.
 */
var editor = null,goods_list=null,pn=0;
$(document).ready(function(){
    getGoodsItem();
}).on("click",".all-select-box",function(){
    $(this).toggleClass("checked-box");
    if($(this).hasClass("checked-box")){
        $(".check-box").addClass("checked-box");
    }else{
        $(".check-box").removeClass("checked-box");
    }
}).on("click",".goods-all-list .check-box",function(){
    $(this).toggleClass("checked-box");
}).on("click",".cancel-del-goods",function(){//撤销删除
    var id = $(this).closest(".goods-all-item").attr("data-id");
    cancelDel(id);
}).on("click","#batch-cancel",function(){//批量取消删除
    cancelBatchDel();
}).on("click",".pre-page",function(){//上页
    if(pn==0){
        return Tip("当前已经是第一页");
    }
    pn--;
    getGoodsItem();
}).on("click",".next-page",function(){//下一页
    var total = $(".page-total").html();
    if(pn==parseInt(total)){
        return Tip("当前已经是最后一页");
    }
    pn++;
    getGoodsItem();
}).on("click",".jump-to",function(){
    var num = $(".input-page").val();
    var total = $(".page-total").html();
    if(isNaN(num) || $.trim(num)=="" || parseInt(num)<1 || parseInt(num)>(parseInt(total)-1)){
        return Tip("页码格式不对或者数字超出页码范围");
    }
    pn = num-1;
    getGoodsItem();
}).on("keyup",".input-page",function(e){
    if(e.keyCode==13){
        var num = $(".input-page").val();
        var total = $(".page-total").html();
        if(isNaN(num) || $.trim(num)=="" || parseInt(num)<1 || parseInt(num)>(parseInt(total)-1)){
            return Tip("页码格式不对或者数字超出页码范围");
        }
        pn = num-1;
        getGoodsItem();
    }
}).on("click","#goods-all-search",function(){//商品搜索
    var value = $("#goods-all-ipt").val();
    if($.trim(value)==""){
        return Tip("搜索条件不能为空！");
    }
    getGoodsItem(value);
}).on("keyup","#goods-all-ipt",function(e){//商品搜索框
    var value = $(this).val();
    if(e.keyCode==13){
        if($.trim(value)!=""){
            getGoodsItem(value);
        }else{
            return Tip("搜索条件不能为空！");
        }
    }
}).on("click",".show-txtimg",function(){ //查看图文详情
    if(editor){
        editor.html($(this).attr("data-text"));
        $(".pop-editor").show();
    }else{
        initEditor($(this).attr("data-text"));
    }
}).on("click",".pop-editor",function(e){
    if($(e.target).closest(".wrap-kindeditor").size()==0){
        $(".pop-editor").hide();
    }
}).on("click",".cancel-btn",function(){
    $(this).closest(".pop-win").hide();
});
//取消删除
function cancelDel(id){
    var url="";
    var args={
        action:'reset_delete',
        data:{
            id:id
        }
    };
    $.postJson(url,args,function(res) {
        if (res.success) {
            Tip("撤销删除成功");
            setTimeout(function(){
                window.location.reload(true);
            },2000);
        }
    });
}
//取消批量删除
function cancelBatchDel(){
    if($(".checked-box").size()==0){
        return Tip("您没有选中任何商品");
    }
    var ids = [];
    var batchList = $(".goods-all-list").find(".checked-box");
    batchList.each(function(){
        var id = $(this).closest(".goods-all-item").attr("data-id");
        ids.push(id);
    });
    var url="";
    var args={
        action:'batch_reset_delete',
        data:{
            goods_id:ids
        }
    };
    $.postJson(url,args,function(res) {
        if (res.success) {
            Tip("批量撤销删除成功");
            setTimeout(function(){
                window.location.reload(true);
            },2000);
        }
    });
}
function getGoodsItem(value){
    $(".wrap-loading-box").removeClass("hidden");
    var url;
    if(value){
        url = "/admin/goods/delete?type=goods_search&content="+value+"&page="+pn;
    }else{
        url = "/admin/goods/delete?&page="+pn;
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
                Tip(res.error_txt);
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
        $item.find(".current-group").html(goods.group_name);
        $item.find(".stock-num").html(goods.storage);
        $item.find(".stay-num").html(goods.current_saled);
        $item.find(".show-txtimg").attr("data-text",goods.detail_describe);
        $item.find(".goods-classify").html(goods.fruit_type_name);
        $item.find(".item-goods-txt").html(goods.info);
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
        $(".goods-all-list").append($item);
    }
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