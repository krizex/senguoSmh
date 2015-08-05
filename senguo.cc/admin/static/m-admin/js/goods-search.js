$(document).ready(function(){
    $("#search-goods").on("click",function(){  //订单搜索
        var id = $("#search-ipt").val();
        if($.trim(id)==""){
            return Tip("请输入商品名称");
        }else{
            searchOrder(id);
        }
    });
    $("#search-ipt").on("keydown",function(){  //订单搜索
        var id = $("#search-ipt").val();
        if($.trim(id)==""){
            return Tip("请输入商品名称");
        }else{
            searchOrder(id);
        }
    });
});
function searchOrder(con){
    var url="/admin/goods/all";
    var data={'classify':con};
    var args={
        action:'goods_search',
        data:data
    };
    $.postJson(url,args,function(res){
            if(res.success){
                $("#goods_name").html(res.name);
                $("#goods_num").html(res.num);
                if(res.num>0){
                    $("#search_link").attr("href","/madmin/goods?search="+con);
                    $(".no-goods-box").addClass("hide");
                    $(".search-lst").removeClass("hide");
                }else{
                    $("#search_link").attr("href","javascript:;");
                    $(".search-lst").addClass("hide");
                    $(".no-goods-box").removeClass("hide");
                }
            }
            else return Tip(res.error_text);
        },
        function(){return Tip('网络错误');}
    );
}