/**
 * Created by Administrator on 2015/7/6.
 */
var admin_id = 0,cur_admin = null;
$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height-40+"px");
    if($("#notice").size()>0){
        if($("#notice").val()!=""){
            Tip($("#notice").val());
        }
    }
}).on("click","#qa",function(){
    $(this).addClass("hide");
    $(".pop-qa").removeClass("hide");
}).on("click","#close-pop",function(){
    $("#qa").removeClass("hide");
    $(".pop-qa").addClass("hide");
}).on("click",".cancel-bbtn",function(){
    $(this).closest(".pop-bwin").addClass("hide");
}).on("click","#del_admin",function(){
    delAdmin();
}).on("click",".del-admin",function(){
    admin_id = $(this).attr("data-id");
    cur_admin = $(this).closest(".data-list");
    $(".pop-name").removeClass("hide");
}).on("click",".switch-btn",function(){
    admin_id = $(this).attr("data-id");
    var action = $(this).attr("data-action");
    if($(this).hasClass("switch-abtn")){
        editAdmin(1,action,$(this));
    }else{
        editAdmin(0,action,$(this));
    }
}).on("click","#finish_btn",function(){
    var id = $(".search-admin").val();
    if(isNaN(id)){
        return Tip("请输入正确的用户ID");
    }
    selectAdmin(id);
}).on("click",".add-admin-btn",function(){
    var id = $(this).attr("data-id");
    addAdmin(id);
});
function selectAdmin(id){
    var url='/admin/config';
    var data={id:id};
    var action="search_user";
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                var data = res.data[0];
                var imgurl=data['imgurl'];
                var nickname=data['nickname'];
                $("#admin_img").attr("src",imgurl);
                $("#admin_name").html(nickname);
                $(".add-admin-btn").attr("data-id",id);
                $(".data-list").removeClass("hide");
            }else{
                Tip(res.error_text);
            }
        });
}
/*添加管理员*/
function addAdmin(id){
    var url='/admin/config';
    var data={id:id};
    var action="add_admin";
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                if(isWeiXin()){
                    window.location.href="/admin/wxauth";
                }else{
                    if(confirm('是否添加该用户为店铺管理员？点击确定后请使用超级管理员微信进行二维码扫描')){
                        window.location.href="/admin/wxauth";
                    }
                }
            }else{
                return Tip(res.error_text);
            }
        });
}
/*删除管理员*/
function delAdmin(){
    var url='/admin/config';
    var action="delete_admin";
    var data = {
        id:admin_id
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                cur_admin.remove();
                $(".pop-name").addClass("hide");
                Tip("管理员删除成功");
                cur_admin=null;
            }else{
                Tip(res.error_text);
            }
        }
    );
}
function editAdmin(active,flag,$obj){
    var url = '/admin/config';
    var action = "";
    var data ="";
    if(flag=="super"){
        action = "super_temp_active";
    }else{
        action = "admin_temp_active";
        data={id:admin_id};
    }
    var args = {
        action: action,
        data: data
    };
    $.postJson(url, args,
        function (res) {
            if (res.success) {
                if (active == 1) {
                    $obj.removeClass("switch-abtn");
                    $obj.children("span").html("订单提醒未启用");
                    Tip("订单提醒已关闭");
                }
                else {
                    $obj.addClass("switch-abtn");
                    $obj.children("span").html("订单提醒已启用");
                    Tip("订单提醒已开启");
                }
            }else{
                Tip(res.error_text);
            }
        })
}