$(document).ready(function(){
    $(document).on('click','#focus-shop',function(){focus();});
    $(document).on('click','#signin-shop',function(){signin();});
    $(document).on('click','.foucus-notice',function(){alert('请先关注店铺哦!');});
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
        else return alert(res.error_text);
    })
}
function signin(){
    var url='';
    var action = "signin";
    var args={action: action};
    $.postJson(url,args,function(res){
        if(res.success){
            $('#signin-shop').addClass('bg-grey3 text-white').find('.sign_text').text('已签到');
            $('#signin-shop').find('em').remove();
        }
        else return alert(res.error_text);
    })
}