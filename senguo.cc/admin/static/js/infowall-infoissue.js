$(document).ready(function(){
    var fruit=window.dataObj.fruit_types;
    for(var code in fruit)
    {
        var fruitlist=$('<li data-code="'+fruit[code]['id']+'"></li>').text(fruit[code]['name']);
        $('.fruit-list').append(fruitlist);
    }
    $('.fruit-list').find('li').each(function(){
        $(this).on('click',function(){$(this).toggleClass('active')});
    });
    $('#fruitChoose').on('click',function(){
        var fruittype=$('.fruit-list').find('.active');
       for(var i=0;i<fruittype.length;i++)
           {
               var code=fruittype.eq(i).data('code');
               var name=fruittype.eq(i).text();
               var fruit=$('<li data-code="'+code+'"></li>').text(name);
               $('#fruitChooseList').prepend(fruit);
           }
    });


    var fruitChosen=$('#fruitChooseList').find('li');
    for(var i=0;i<fruitChosen.length;i++)
    {
        var code=fruitChosen.eq(i).data('code');
        var fruit=$('.fruit-list').find('li');
        for(var j= 0;j<fruit.length;j++)
            {
                fruit.eq(i).addClass('active');
            }
    }

    $('.typeItem').on('click',function(){$('#addressEdit').show();$('.fruit-choose').show();});
    $('.otherType').on('click',function(){$('#addressEdit').hide();$('.fruit-choose').hide();});
    $('#infoPublic').on('click',function(){infoPublic()});

});

function infoPublic() {
    var info_type = $('.type-choose').find('.active').data('type');
    var text = $('#infoEdit').val().trim();
    var address = $('#addressEdit').val().trim();
    var fruit_type=[];
    var fruit_list=$('#fruitChooseList').find('li');
    for (var i=0;i<fruit_list.length;i++)
     {fruit_type.push(fruit_list.eq(i).data('code'))}
    var img_url=[];
    if(!text){return alert('请填写发布信息！')}
    var url = "/infowall/infoIssue";
    var args = {
        info_type: info_type,
        text: text,
        address:address,
        fruit_type: fruit_type,
        img_url: img_url,
        _xsrf: window.dataObj._xsrf
    };
    $.postJson(url,args,function(res){
        if(res.success)
            {
                alert('发布成功！');
                window.location.href="/infowall/supply";
            }
        else alert('网络错误');
    })

}