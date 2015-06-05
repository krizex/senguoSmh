/**
 * Created by Administrator on 2015/6/2.
 */
$(document).ready(function(){

}).on("click",".all-select-box",function(){
    $(this).toggleClass("checked-box");
    if($(this).hasClass("checked-box")){
        $(".check-box").addClass("checked-box");
    }else{
        $(".check-box").removeClass("checked-box");
    }
}).on("click",".goods-all-list .check-box",function(){
    $(this).toggleClass("checked-box");
}).on("click",".cancel-del-goods",function(){//撤销删除

}).on("click","#batch-cancel",function(){//批量取消删除

});
