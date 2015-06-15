/**
 * Created by Administrator on 2015/6/15.
 */
$(document).ready(function(){
    $(".pop-win").on("click",function(e){/*关闭模态框*/
        if($(e.target).closest(".pop-content").length==0){
            $(".pop-win").addClass("hide");
        }
    });
    $(".back").on("click",function(){
        history.go(-1);
    });
});