/**
 * Created by Administrator on 2015/7/6.
 */
$(document).ready(function(){
    new QRCode($("#big-code2")[0],{
        width : 150,
        height : 150
    }).makeCode($("#link").val());
}).on("click","#save_manager",function(){

});