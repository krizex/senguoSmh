$(document).ready(function(){
    $('.editInfo').on('click',function(){$(this).parents('.info-con').siblings('.info-edit').toggle();});

    // 不要采用通过js设置文本显示的方法，用两个html元素来分别显示提示信息和真实信息。这样对于html代码不够直观。
    $('a.editInfo').each(function(){
        if($(this).text() =='None'||$(this).text() =='')
        {$(this).text('点击设置').css({'color':'#FF3C3C'});}
    });

    $('a.tiephone').each(function(){
        if($(this).text() =='None'||$(this).text() =='')
        {$(this).text('点击绑定手机号').css({'color':'#FF3C3C'});}
    });

    $('.info-edit').find('.concel-btn').each(function(){
        $(this).on('click',function(){$(this).parents('.info-edit').hide();})
    });

    $('.info-edit').find('.sure-btn').each(function(){infoEdit($(this))});
    $('#getVrify').on('click',function(evt){Vrify(evt);});
    $('#tiePhone').on('click',function(evt){TiePhone(evt);});
});

var wait=60;
function time(evt) {
    if (wait == 0) {
        evt.val("获取验证码").css({'background':'#00d681'});
        wait = 60;
    }
    else {
        evt.val("重新发送(" + wait + ")").css({'background':'#ccc'});
        wait--;
        setTimeout(function() {
                time(evt)
            },
            1000)
    }
}


function infoEdit(evt){
    evt.on('click',function(){
        var email=$('#mailEdit').val().trim();
        var year=$('#yearEdit').val().trim();
        var month=$('#monthEdit').val().trim();
        var sex=$('#sexEdit option:selected').data('sex');
        var realname=$('#realnameEdit').val();
        var regEmail=/^([a-zA-Z0-9]*[-_]?[a-zA-Z0-9]+)*@([a-zA-Z0-9]*[-_]?[a-zA-Z0-9]+)+[\.][a-z]{2,3}([\.][a-z]{2})?$/;
        var regNumber=/^[0-9]*[1-9][0-9]*$/;
        var regYear=/^(?!0000)[0-9]{4}$/;
        var regMonth=/^(0?[1-9]|[1][012])$/;
        var action=evt.data('action');
        var data=evt.parents('.info-edit').find('.edit-box').val();
        // action 不要放在html里面
        if(action=='edit_email' && !regEmail.test(email))
        {return alert("邮箱不存在!");}
        else if(action=='edit_sex')
        {data=sex;}
        else if(action=='edit_birthday')
        {
            if(!regMonth.test(month)||!regYear.test(year)||!month || !year)
                return alert("请输入正确的年月!");
            else
            {
                data={
                    year:$('#yearEdit').val().trim(),
                    month:$('#monthEdit').val().trim()
                }
            }
        }
        var url="/fruitzone/admin/profile";
        var args={action: action, data: data};
        $.postJson(url,args,
            function (res) {
                if (res.success) {
                    evt.parents('li').find('a.editInfo').text(data).css({'color':'#a8a8a8'});
                    evt.parents('li').find('#userBirthday').text(data.year+'-'+data.month).css({'color':'#a8a8a8'});
                    if(data==''){evt.parents('li').find('.editInfo').text('点击设置').css({'color':'#FF3C3C'});}
                    if(data=='0'){$('#userSex').text('其他');}
                    else if(data=='1'){$('#userSex').text('男');}
                    else if(data=='2'){$('#userSex').text('女');}
                    evt.parents('li').find('.info-edit').hide();
                    $('#serSex').attr({'data-sex':data});
                }
                else alert(res.error_text);
            },
            function(){
                alert('网络错误！');}
        );
    });
}

function Vrify(){
    event.preventDefault();
    var phone=$('#enterPhone').val();
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    if(phone.length > 0 && phone.length<11 && !regPhone.test(phone)){return alert("电话貌似有错o(╯□╰)o");}
    if(!phone){return alert('手机号不能为空');}
    var action='gencode';
    var url="/fruitzone/phoneVerify?action=admin";
    var args={action:action,phone:phone};
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                time($('#getVrify'));
                alert('验证码已发送到您的手机,请注意查收！');

            }
            else alert(res.error_text);
        },
        function(){
            alert('网络错误！');}
    );
}

function TiePhone(){
    event.preventDefault();
    var phone=$('#enterPhone').val();
    var code=$('#enterVrify').val();
    var password=$('#loginPassword').val();
    var passwconf=$('#passwordConfirm').val();
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    if(!phone){return alert('请输入手机号');}
    if(!code){return alert('请输入验证码');}
    if(!password){return alert('请设置您的手机登录密码！');}
    if(!regNumber.test(code)){return alert('验证码只能为数字！');}
    if(code>0&&phone.length<6){return alert('验证码为六位数字！');}
    if(password.length<6){return alert('密码至少为6位！')}
    if(passwconf!=password){return alert('两次密码输入不一致！')}
    password = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
    var action='checkcode';
    var url="/fruitzone/phoneVerify?action=admin";
    var args={action:action,phone:phone,code:code,password:password};
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                $('#phoneNumber').text(phone).css({'color':'#a8a8a8'});
                $('#tieBox').modal("hide");
            }
            else alert(res.error_text);
        },
        function(){
            alert('网络错误！');}
    );
}
