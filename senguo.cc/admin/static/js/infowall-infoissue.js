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
               var fruit=$('<li data-code="+code+"></li>').text(name);
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
});