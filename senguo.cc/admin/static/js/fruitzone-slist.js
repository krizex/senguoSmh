$(document).ready(function(){
    $("#searchKey").on("keyup",function(e){
        if($(this).val().trim()==""){
        }else{
            qsearch();
        }
    });
    $("#back").on("click",function(){
        history.go(-1);
    })
}).on("click",".shopslist li",function(){
    var key = $("#searchKey").val();
    window.location.href="/list?q="+encodeURIComponent(encodeURIComponent(key));
}).on("click","#searchSubmit",function(){
    Search();
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
                $('.shopslist').empty();
                if(res.q==0){
                    if($(".shopslist").children("p").size()==0){
                        $('.shopslist').append('<p class="text-center no-title text-grey">无搜索结果！</p>');
                    }
                }else{
                    /*var sLis = "";
                    for(var i=0; i<shops.length; i++){
                        sLis = '<li><span class="counts"><span class="red-txt search-counts">'+res.q+'</span>个结果</span><span class="name search-counts">'+q+'</span></li>';
                    }*/
                    $(".shopslist").append('<li><span class="counts"><span class="red-txt search-counts">'+res.q+'</span>个 关于</span><span class="name search-counts">'+q+'</span>的结果</li>');
                }
            }
            else return noticeBox(res.error_text);
        }
    );
}
function Search(){
    if($(".shopslist").children("li").size()==0){
        noticeBox("当前关键字无搜索结果");
        return false;
    }else{
        var key = $("#searchKey").val();
        window.location.href="/list?q="+encodeURIComponent(encodeURIComponent(key));
    }
}

