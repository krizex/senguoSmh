$(document).ready(function(){
    $('#submit-btn').click(function(){submit();});
    $('#homeList').load("home-list.item.html");
})

function submit(){
    var username=$('#username-input').val().trim();
    var password=$('#pw-input').val().trim();
    var regUsername=/^[a-zA-Z_\d]{2,21}$/;
    if (!username || !password){alert("用户名或密码不能为空");return false;}
    if(username.length > 20){alert("用户名不能超过20个字符");return false;}
    if(!regUsername.test(username)){alert("用户名不要包括奇怪的字符");return false;}
    password = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
    password = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
    var args={
        "username":username,
        "password":password
    };
    $.ajax({
        url:"/super/login",
        type:"POST",
        dataType:"json",
        data: $.param(args),
        success:function(r){
            if(r.success==1){
                window.location.href="/super/";
            }
            else{
                alert("用户名或密码错误！");
                return false;
            }
        }

    });
}