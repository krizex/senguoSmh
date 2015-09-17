$(document).ready(function(){
    //if is weixin brower then load wexin api 
     var shop_code=getCookie('market_shop_code');
     var shop_logo=$('#shop_imgurl').attr('data-img');
    if(isWeiXin()){
        wexin('/'+shop_code,shop_logo);
    }
    //user sex
    var sex_id=$('.user-sex').data('id');
    sex($('.user-sex'),sex_id);
    //current_point
   var point=Int($('.current_point').data('point'));
   $('.current_point').text(point);
}).on("click","#coupon_btn",function(){
    window.location.href="/coupon/list?action=get_all";
}).on("click","#address_btn",function(){
    window.location.href="/customer/address";
}).on('click','.user-balance',function(){
    var status = $(this).attr('data-status');
    var statu = $(this).attr("data-auth");
    if(statu == "False"){
        noticeBox("当前店铺未认证，此功能暂不可用");
        return false;
    }
    if(status==0){
         noticeBox("当前店铺已关闭余额支付，此功能暂不可用");
         return false;
    }
});
function sex(target,id){
    switch(id) {
        case 1:target.addClass('male').text('♂');break;
        case 2:target.addClass('female').text('♀');break;
        case 0:target.addClass('other').text('!');break;
        default :break;
    }
}