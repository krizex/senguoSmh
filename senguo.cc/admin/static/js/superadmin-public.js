$(document).ready(function(){

    $('.have-entity').each(function(){
        var entity=$(this).data('real');
        $(this).text(Have(entity));

    });

});

function Have(evt){
    if(evt=='True')
      return '有';
    else if(evt=='False')
      return '无';
}


$.postJson = function(url, args,successCall, failCall, alwaysCall){
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

