$(document).ready(function(){
    $('.select-list li').each(function(){
        $(this).on('click',function(){
            $(this).addClass('active').siblings().removeClass('active');
        });
    });

    $('#feedbackEdit').click(function(evt){FeedBack(evt);});

    if($('#detailsReal').data('real')=='true')
         $('#detailsReal').text('有');
    else $('#detailsReal').text('无');

    if($('.showSex').data('sex')=='1')
        $('.showSex').text('男');
    else if($('.showSex').data('sex')=='2')
        $('.showSex').text('女');
    else $('.showSex').text('其他');

    var fruit=window.dataObj.fruit_types;
    for(var code in fruit)
    {
        var fruitlist=$('<li data-code="'+fruit[code]['id']+'"></li>').text(fruit[code]['name']);
        $('.fruit-list').append(fruitlist);
    }
    $('.pause-now').on('click',function(){
        alert('系统封测期，暂停申请一周!');
    })

});

function orderBy(i){
    $('#orderBy'+i).slideToggle(50).siblings('.order-by-list').slideUp(50);
}

