$(document).ready(function(){

    $('.img-count').each(function(){
        var len=$(this).parents('.infowall-list-item').find('.img-list').find('img').length;
        $(this).find('.number').text(len);
        if(len==0){$(this).hide();}
    });

    $('.collection-btn').on('click',function(){
        var id=parseInt($(this).parents('.infowall-list-item').data('id'));
        var target=$(this);
        collection(id,target);
    });

});
