/**
 * Created by Administrator on 2015/7/6.
 */
$(document).ready(function(){

}).on("click",".shop-list li",function(){
    var shop_id=$(this).data('id');
    var shop_code = $(this).attr("data-code");
    window.location.href="/market/shopinfo";
}).on("click",".tab-list li",function(){
    var index = $(this).index();
    $(".tab-list li").removeClass("active").eq(index).addClass("active");
}).on("click","#cur_address",function(){//刷新列表

});
