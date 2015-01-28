$(document).ready(function(){
    $('.info-con').hammer().on('tap',function(){$(this).siblings('.info-edit').slideToggle();});

    $('a.editInfo').each(function(){
        if($(this).text() =='None'||$(this).text() =='')
        {$(this).text('点击设置').css({'color':'#FF3C3C'});}
    });

    $('a.tiephone').each(function(){
        if($(this).text() =='None'||$(this).text() =='')
        {$(this).text('点击绑定手机号').css({'color':'#FF3C3C'});}
    });
    //信息编辑
    $('.info-edit').find('.concel-btn').each(function(){
        $(this).hammer().on('tap',function(){$(this).parents('.info-edit').hide();})
    });
    $('.info-edit').find('.sure-btn').each(function(){infoEdit($(this))});
    //手机验证
    $('#getVrify').hammer().on('tap',function(evt){Vrify(evt);});
    $('#tiePhone').hammer().on('tap',function(evt){TiePhone(evt);});
    //性别编辑
    $('body').find('.sex-list li').hammer().on('tap',function(){
       var $this=$(this);
       var sex=$this.data('id');
       var text=$this.text();
       sexEdit(sex,text);
    });
    //性别显示
    $('#userSex').each(function(){
        var $this=$(this);
        var n=$this.data('id');
        switch(n){
            case 0:$this.text('其他');break;
            case 1:$this.text('男');break;
            case 2:$this.text('女');break;
        }
    });
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


function infoEdit(target){
    target.hammer().on('tap',function(){
        var email, year,month,realname;
        var regEmail=/^([a-z0-9]*[-_]?[a-z0-9]+)*@([a-z0-9]*[-_]?[a-z0-9]+)+[\.][a-z]{2,3}([\.][a-z]{2})?$/;
        var regNumber=/^[0-9]*[1-9][0-9]*$/;
        var regYear=/^(?!0000)[0-9]{4}$/;
        var regMonth=/^(0?[1-9]|[1][012])$/;
        var action_text=target.data('action');
        var data;
        var action;
        if(action_text=='realname')
        {
            action='edit_realname';
            realname=$('#realnameEdit').val();
            if(realname.length>10) return alert('姓名请不要超过10个字');
            data=realname;
        }
        else if(action_text=='email')
        {
            action='edit_email';
            email=$('#mailEdit').val().trim();
            if(!regEmail.test(email)) return alert('邮箱貌似不存在');
            data=email;
        }
        else if(action_text=='birthday')
        {
            action='edit_birthday';
            year=$('#yearEdit').val().trim();
            month=$('#monthEdit').val().trim();
            if(!regYear.test(year)) return alert('请输入正确的年份！');
            if(!regMonth.test(month)) return alert('月份只能为1～12！');
            data={year:year,month:month}
        }
        var url="";
        var args={action: action, data: data};
        $.postJson(url,args,
            function (res) {
                if (res.success) {
                    target.parents('.info-edit').slideToggle();
                    if(action_text=='realname')
                    {
                        $('#userRealname').text(realname);
                    }
                    else if(action_text=='email')
                    {
                        $('#userMail').text(email);
                    }
                    else if(action_text=='birthday')
                    {
                        if(month<10&&month.length<2) month='0'+month;
                        $('#userBirthday').text(year+'-'+month);
                    }
                }
                else alert('请填写正确的信息！');
            },
            function(){
                alert('网络错误！');}
        );
    });
}

function sexEdit(sex,text){
    var url="";
    var action='edit_sex';
    var args={action: action, data:sex};
    $.postJson(url,args,
        function (res) {
            if (res.success) {
                $('.sex-popbox').modal('hide');
                $('#userSex').text(text);
            }
            else alert(res.error_text);
        },
        function(){
            alert('网络错误！');}
    );
}

function Vrify(evt){
    evt.preventDefault();
    var phone=$('#enterPhone').val();
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    if(phone.length > 0 && phone.length<11 && !regPhone.test(phone)){return alert("电话貌似有错o(╯□╰)o");}
    if(!phone){return alert('手机号不能为空');}
    var action='gencode';
    var url="/customer/phoneVerify?action=customer";
    var args={
        action:action,
        phone:phone
    };
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

function TiePhone(evt){
    evt.preventDefault();
    var phone=$('#enterPhone').val();
    var code=$('#enterVrify').val();
    var password=$('#loginPassword').val();
    var passwconf=$('#passwordConfirm').val();
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    if(phone.length > 0 && phone.length<11 && !regPhone.test(phone)){return alert("电话貌似有错o(╯□╰)o");}
    if(!phone){return alert('请输入手机号');}
    if(!code){return alert('请输入验证码');}
    if(!password){return alert('请设置您的手机登录密码！');}
    if(!regNumber.test(code)){return alert('验证码只能为数字！');}
    if(code>0&&phone.length<6){return alert('验证码为六位数字!');}
    if(password.length<6){return alert('密码至少为6位！')}
    if(passwconf!=password){return alert('两次密码输入不一致!')}
    password = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
    var url="/customer/phoneVerify?action=customer";
    var action='checkcode';
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
