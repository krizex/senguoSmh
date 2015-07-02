$(document).ready(function(){
	//fastclick initialise
    FastClick.attach(document.body);
    $(".pop-win").on("click",function(e){/*关闭模态框*/
        if($(e.target).closest(".pop-content").length==0){
            $(".pop-win").addClass("hide");
        }
    });
     $(".close").on("click",function(){/*关闭模态框*/
         $(".pop-win").addClass("hide");
    });
    $(".goback").on("click",function(){
        history.go(-1);
    });
    
    if($("#order-success").size()>0){
        if(location.href!=parent.location.href){
            parent.location.href = location.href;
        }
    }
}).on("click",".developing",function(){
    return Tip("该功能正在开发中，客官不要急～");
}).on("click",".shop-balance",function(){
    return Tip("账户余额查询及提现操作只能在电脑上进行操作！");
});