$(document).ready(function(){
    $('.unshelve').on('click',function(){
        $(this).hide().siblings('.shelve').show();
    });
    $('.shelve').on('click',function(){
        $(this).hide().siblings('.unshelve').show();
    })

});