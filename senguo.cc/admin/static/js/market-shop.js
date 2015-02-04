$(document).ready(function(){
    $('#focus-shop').hammer().on('tap',function(){focus();});
    $('#signin-shop').hammer().on('tap',function(){signin();});
    $('.foucus-notice').hammer().on('tap',function(){alert('请先关注店铺哦!');});
});
function focus(){
    var url='';
    action = "favour";
    var args={action: action};
    $.postJson(url,args,function(){
       $('.foucus-notice').remove();
    })
}
function signin(){
    var url='';
    action = "signin";
    var args={action: action};
    $.postJson(url,args,function(res){
        if(!res.success){
            return alert(res.error_text);
        }
    })
}