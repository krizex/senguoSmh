/**
 * Created by Administrator on 2015/5/25.
 */
$(document).ready(function(){
    var qrcode = new QRCode(document.getElementById("er-list-code"), {
        width : 80,//设置宽高
        height : 80
    });
    qrcode.makeCode("http://senguo.cc");
});