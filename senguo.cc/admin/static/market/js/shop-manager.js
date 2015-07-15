/**
 * Created by Administrator on 2015/7/6.
 */
var cur_id = null,action = "admin";
$(document).ready(function(){
    if(window.location.href.indexOf("staffinsert")!=-1){
        $("#shop_txt").html("配送员信息");
        action = "staff";
    }
    cur_id = $("#shop_id").val();
    new QRCode($("#big-code2")[0],{
        width : 150,
        height : 150
    }).makeCode($("#link").val());
}).on("click","#save_manager",function(){
    saveAdmin();
});
function saveAdmin(){
    var url = '';
    var name = $(".admin-name").val();
    var tel = $(".admin-tel").val();
    if(name=="" || tel==""){
        return Tip("姓名和电话都不能为空");
    }
    var args = {};
    if(action="admin"){
        url='/market/shopinsert'
        args = {
            action:"save",
            id:cur_id,
            admin_name:name,
            admin_phone:tel
        }
    }else{
        url='/market/staffinsert';
        args = {
            shop_id:cur_id,
            staff_name:name,
            staff_phone:tel
        }
    }
    $.postJson(url,args,function(res){
        if(res.success){
            Tip("信息录入成功");
            setTimeout(function(){
                window.location.href="/market/shopinfo?id="+cur_id;
            },2000);
        }else{
            Tip(res.error_text);
        }
    });
}
