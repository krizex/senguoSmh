$(document).ready(function(){
    $('.select-list li').each(function(){
        $(this).click(function(){
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

});

function orderBy(i){
    $('#orderBy'+i).slideToggle(50).siblings('.order-by-list').slideUp(50);
}

$.postJson = function(url, args, successCall, failCall, alwaysCall){
    var req = $.ajax({
        type:"post",
        url:url,
        data:JSON.stringify(args),
        contentType:"application/json; charset=UTF-8",
        success:successCall,
        fail:failCall,
        error:failCall
    });
    req.always(alwaysCall);
};


function FeedBack(){
    var feedback=$('#feedbackInfo').val().trim();
    var action="feedback";
    var args={
        action:action,
        feedback_text:feedback,
        _xsrf: window.dataObj._xsrf
    };
    var url="/fruitzone/admin/home";
    $.postJson(url,args,
        function(res){
            if(res.success)
                alert('感谢您的宝贵意见！');
        },
        function(){
            alert('网络错误！');
        }
    );
}