/**
 * Created by Administrator on 2015/7/6.
 */
$(document).ready(function(){
    if($.getUrlParam("staff")){
        $("#shop_txt").html("配送员信息");
    }
    new QRCode($("#big-code2")[0],{
        width : 150,
        height : 150
    }).makeCode($("#link").val());
}).on("click","#save_manager",function(){

});
function saveAdmin(){
    var name = $(".admin-name").val();
    var tel = $(".admin-tel").val();
    if(name=="" || tel==""){
        return Tip("姓名和电话都不能为空");
    }
    var args = {
        action:"",
        data:{
            admin_name:name,
            admin_phone:tel
        }
    }
    $.postJson(url,args,function(res){
        if(res.success){
            window.location.href="/market/shopinfo";
        }else{
            Tip(res.error_text);
        }
    });
}