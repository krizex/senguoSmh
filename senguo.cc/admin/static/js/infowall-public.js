$(document).ready(function(){
    $('.select-list li').each(function(){
        $(this).on('click',function(){
            $(this).addClass('active').siblings().removeClass('active');
        });
    });
});