/**
 * Created by Administrator on 2015/7/6.
 */
$(document).ready(function(){

}).on("click",".shop-list li",function(){
    var shop_id=$(this).data('id');
    var shop_code = $(this).attr("data-code");
    if(shop_id){
        var url='/admin/home';
        var data={shop_id:shop_id};
        var args={action:'shop_change',data:data};
        $.postJson(url,args,function(res){
            if(res.success){
                window.location.href="/madmin/shop";
            }
        });
    }
});