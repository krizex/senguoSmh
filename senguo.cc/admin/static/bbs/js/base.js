/**
 * Created by Administrator on 2015/6/15.
 */
$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height-40);
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
   
}).on("click",".cancel-btn",function(){
    $(".pop-win").addClass("hide");
});