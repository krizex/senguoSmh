$(document).ready(function(){
    $('#focus-shop').hammer().on('tap',function(){focus();});
    $('.foucus-notice').hammer().on('tap',function(){alert('请先关注店铺哦!');});
});
function focus(){
    var url='';
    var args={};
    $.postJson(url,args,function(){
       $('.foucus-notice').remove();
    })
}