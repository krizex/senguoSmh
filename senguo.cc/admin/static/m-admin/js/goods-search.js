$(document).ready(function(){
    $(".container").height($(window).height()-40);
    $("#search-goods").on("click",function(){  //订单搜索
        var id = $("#search-ipt").val();
        if($.trim(id)==""){
            return Tip("请输入商品名称");
        }else{
            searchOrder(id);
        }
    });
    $("#search-ipt").on("keydown keyup",function(){  //订单搜索
        var id = $("#search-ipt").val();
        if($.trim(id)==""){

        }else{
            searchOrder(id);
        }
    });
});
function searchOrder(con){
    var url="";
    var args={
        name:con
    };
    $.postJson(url,args,function(res){
            if(res.success){
                $("#goods_name").html(con);
                $("#goods_num").html(res.count);
                if(res.count>0){
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