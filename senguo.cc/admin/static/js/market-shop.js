$(document).ready(function(){
    $('#focus-shop').on('click',function(){focus();});
    $('.foucus-notice').on('click',function(){alert('请先关注店铺哦!');});
});
function focus(){
    var url='';
    var args={};
    $.postJson(url,args,function(){
       $('.foucus-notice').remove();
    })
}