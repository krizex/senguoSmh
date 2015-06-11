$(document).ready(function(){
    $(document).on('click','#searchSubmit',function(){Search();});
    $("#searchKey").on("keyup",function(e){
        if($(this).val().trim()==""){
        }else{
            qsearch();
        }
    });
    $("#back").on("click",function(){
        history.go(-1);
    })
}).on("click",".shoplist li",function(){
    var key = $("#searchKey").val();
    window.location.href="/list?q="+encodeURIComponent(encodeURIComponent(key));
});
function qsearch(){
    var q=$('#searchKey').val().trim();
    var action="qsearch";
    var url="/list";
    var args={
        q:q,
        action:action
    }
    $.postJson(url,args,
        function(res){
            if(res.success){
                var shops = res.shops;
                $('.shoplist').empty();
                if(shops.length==0){
                    if($(".shoplist").children("p").size()==0){
                        $('.shoplist').append('<p class="text-center no-title text-grey">无搜索结果！</p>');
                    }
                }else{
                    var sLis = "";
                    for(var i=0; i<shops.length; i++){
                        sLis = '<li><span class="counts"><span class="red-txt search-counts">'+shops[i].count+'</span>个结果</span><span class="name search-counts">'+shops[i].name+'</span></li>';
                    }
                    $(".shoplist").append(sLis);
                }
            }
            else return noticeBox(res.error_text);
        }
    );
}
function Search(){
    if($(".shoplist").children("li").size()==0){
        noticeBox("当前关键字无搜索结果");
        return false;
    }else{
        window.location.href="/list?q="+encodeURIComponent(encodeURIComponent(q));
    }
}

