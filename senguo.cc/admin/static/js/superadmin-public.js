$(document).ready(function(){

    $('.have-entity').each(function(){
        var entity=$(this).data('real');
        $(this).text(Have(entity));

    });
    $('.admin-sex').each(function(){
        var sex=$(this).data('sex');
        $(this).text(Sex(sex));

    });

    var pre=$('#PrePage');
    var next=$('#NextPage');
    var page=$.getUrlParam('page', 1);
    var url=window.location.pathname;
    if(page==1)
        {
            pre.addClass('hidden');
        }
    if($('.item-list').find('li').length<20)
        {
            next.addClass('hidden');
        }
    pre.on('click',function(){
       if(page>1) {
            page--;
            pre.attr({'href': url + '?page=' + page});
        }
    });
    next.on('click',function(){
        page++;
        next.attr({'href':url+'?page='+page});
    });
});


function Have(evt){
    if(evt=='True')
      return '有';
    else if(evt=='False')
      return '无';
}

function Sex(evt){
    if(evt=='0')
        return '其他';
    else if(evt=='1')
        return '男';
    else if(evt=='2')
        return '女';
}

