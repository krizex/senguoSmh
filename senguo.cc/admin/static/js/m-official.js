$(document).ready(function(){
    $('body').on('click','.arrow-box',function(){
        var $this=$(this);
        var box=$this.parents('.box');
        var h=document.documentElement.clientHeight;
        $('body,html').animate({scrollTop:'+='+h+'px'},100);
    });
    $('body').on('scroll',function(){
        var h=document.documentElement.clientHeight;
        $('body,html').animate({scrollTop:'+='+h+'px'},100);
    });
});