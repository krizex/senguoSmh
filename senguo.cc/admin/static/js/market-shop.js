$(document).ready(function(){
    $(document).on('click','#focus-shop',function(){focus();});
    $(document).on('click','.foucus-notice',function(){$.noticeBox('请先关注店铺哦!');});
    $(document).on('click','.un_sign',function(){signin();});
    $(document).on('click','.signed',function(){$.noticeBox('亲，你今天已经签到了，一天只能签到一次哦')});
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
        else return $.noticeBox(res.error_text);
    }, function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},
             function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')})
}
function signin(){
    var url='';
    var action = "signin";
    var args={action: action};
    $.postJson(url,args,function(res){
        if(res.success){
            $('#signin-shop').addClass('bg-grey3 text-white signed').removeClass('un_sign').find('.sign_text').text('已签到');
            $('#signin-shop').find('em').remove();
        }
        else return $.noticeBox(res.error_text);
    }, function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},
    function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')});
}