$(document).ready(function(){

}).on("click","#batch_group",function(){
    $("#batch_group").addClass("hide");
    $("#choose_group").removeClass("hide");
}).on("click",".cancel-bbtn",function(){
    $(this).closest(".pop-bwin").addClass("hide");
}).on("click",".select-all",function(){
    var status = parseInt($(this).attr("data-status"));
    if(status==0){
        $(".batch-lst").find(".checkbox").addClass("checked-box");
        $(this).attr("data-status","1");
    }else{
        $(".batch-lst").find(".checkbox").removeClass("checked-box");
        $(this).attr("data-status","0");
    }
}).on("click",".batch-lst li",function(){
    var $checkbox = $(this).find(".checkbox");
    if($checkbox.hasClass("checked-box")){
        $checkbox.removeClass("checked-box");
    }else{
        $checkbox.addClass("checked-box");
    }
}).on("click",".batch-group-list li",function(){
    $(".batch-group-list li").removeClass("active");
    $(this).addClass("active");
    $(".batch-group-list .checkbox").removeClass("checked-box");
    $(this).find(".checkbox").addClass("checked-box");
}).on("click",".new_group",function(){
    $("#group_name").val("");
    $("#group_info").val("");
    $(".pop-name").removeClass("hide");
    $("#group_name").focus();
}).on("click","#add_group",function(){
    addGroup();
}).on("click","#switch_group",function(){//切换商品分组
    var group_id = $(".batch-group-list").children(".active").attr("data-id");
    batchGroup(group_id);
/*    $("#choose_group").addClass("hide");
    $("#batch_group").removeClass("hide");*/
}).on("click","#cancel_group",function(){
    $("#choose_group").addClass("hide");
    $("#batch_group").removeClass("hide");
});
//转移商品分组
function batchGroup(group_id){
    if($(".checked-box").size()==0){
        return Tip("您没有选中任何商品");
    }
    var aIds = [];
    var batchList = $(".batch-lst").find(".checked-box");
    batchList.each(function(){
        var id = $(this).attr("data-id");
        aIds.push(id);
    });
    var url="";
    var args={
        action:"batch_group",
        data:{
            goods_id:aIds,
            group_id:group_id
        }
    };
    $.postJson(url,args,function(res){
        if (res.success) {
            Tip("批量分组成功");
            setTimeout(function(){
                window.location.href="/madmin/goods?type=2";
            },1200);
        }else{
            Tip(res.error_text);
        }
    });
}
//添加分组
function addGroup(){
    if($("#add_group").attr("data-flag")=="off"){
        return false;
    }
    var group_name = $.trim($("#group_name").val());
    var group_info = $.trim($("#group_info").val());
    if($('.batch-group-list li').size()==7){
        Tip("最多只能添加五个自定义分组！");
        return false;
    }
    if(group_name=="" || group_name.length>10){
        Tip("分组名字不能为空且不能超过10个字");
        return false;
    }
    if(group_info=="" || group_info.length>50){
        Tip("分组介绍不能为空且不能超过50个字");
        return false;
    }
    $("#add_group").attr("data-flag", "off");
    var url = '/admin/goods/group';
    var data={
        name:group_name,
        intro:group_info
    };
    var args = {
        action:"add_group",
        data:data
    };
    $.postJson(url, args,
        function (res) {
            $("#add_group").attr("data-flag", "on");
            if (res.success) {
                var li = '<li data-id="'+res.id+'"><span class="c666 fr">共0件商品</span><span class="checkbox"></span><span class="gname clip">'+group_name+'</span></li>';
                $(".batch-group-list").append(li);
                $(".pop-name").addClass("hide");
            }
            else {
                Tip(res.error_text);
            }
        },
        function () {
            $("#add_group").attr("data-flag", "on");
            Tip('网络好像不给力呢~ ( >O< ) ~');
        }
    );
}
