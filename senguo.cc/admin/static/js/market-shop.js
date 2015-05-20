var width = 0;
$(document).ready(function(){
    $(".com-goods-lst").width($(".ccom-item").width()-60);
    $(".com-txt").width($(".ccom-item").width()-60);
    width = parseInt($(".com-goods-lst").width()/4)-12;
    $(".com-goods-lst>li").each(function(){
       $(this).width(width).height(width);
    });
    var shop_logo=$('#shop_imgurl').attr('data-img');
    if(isWeiXin()){
        wexin('',shop_logo);
    }
    if($(".com-goods-lst").size()>0){
        baguetteBox.run('.com-goods-lst',{
            buttons: false
        });
    }
}).on('click','#focus-shop',function(){
    focus();
}).on('click','.foucus-notice',function(){
    noticeBox('请先关注店铺哦！');
}).on('click','.un_sign',function(){
    var $this=$(this);
    signin($this);
}).on('click','.signed',function(){
    noticeBox('亲，你今天已经签到了，一天只能签到一次哦！')
}).on("click","#show-more",function(){
    window.location.href=$(this).find("a").attr("href");
}).on("click","#go-shop-area",function(){
    window.location.href="/shoparea/"+$("#shop_code").text();
});
function focus(){
    var url='';
    var action = "favour";
    var args={action: action};
    $.postJson(url,args,function(res){
        if(res.success){
            $('.foucus-notice').remove();
            $('#focus-shop').addClass('hidden');
            $('#signin-shop').removeClass('hidden');
        }
        else return noticeBox(res.error_text);
    }, function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
             function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')})
}
function signin(target){
    var url='';
    var action = "signin";
    var args={action: action};
    $.postJson(url,args,function(res){
        if(res.success){
            $('#signin-shop').find('em').remove();
            $('#signin-shop').addClass('bg-grey3 text-white signed').removeClass('un_sign').find('.sign_text').text('已签到').removeClass('ml20');    
            if(res.notice){
                noticeBox(res.notice);
            } 
        }
        else return noticeBox(res.error_text,target);
    }, function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
    function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')});
}