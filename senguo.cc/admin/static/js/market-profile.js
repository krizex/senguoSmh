$(document).ready(function(){
    $(document).on('click','.info-con',function(){$(this).siblings('.info-edit').toggle();});

    $('a.editInfo').each(function(){
        if($(this).text() =='None'||$(this).text() =='')
        {$(this).text('点击设置').css({'color':'#FF3C3C'});}
    });

    $('a.tiephone').each(function(){
        if($(this).text() =='None'||$(this).text() =='')
        {$(this).text('点击绑定手机号').css({'color':'#FF3C3C'});}
    });
    //信息编辑
    $(document).on('click','.info-edit .concel-btn',function(){$(this).parents('.info-edit').hide();});
    $('.info-edit').find('.sure-btn').each(function(){infoEdit($(this))});
    //手机验证
    $(document).on('click','#phoneNumber',function(){
        var tie_box=new Modal('tieBox');
         tie_box.modal('show');
    });
    $(document).on('click','#getVrify',function(evt){Vrify(evt);});
    $(document).on('click','#tiePhone',function(evt){TiePhone(evt);});
    //性别编辑
    $(document).on('click','#userSex',function(){
            var sex_box=new Modal('sexBox');
            sex_box.modal('show');
    });
    $(document).on('click','.sex-list li',function(){
       var $this=$(this);
       var sex=$this.data('id');
       var text=$this.text();
       sexEdit(sex,text);
    });
    //性别显示
    $('.user_sex').each(function(){
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
        $('.get-code').attr({'id':'getVrify'});
    }
    else {
        evt.val("重新发送(" + wait + ")").css({'background':'#ccc'});
        wait--;
        $('.get-code').attr({'id':''});
        setTimeout(function() {
                time(evt)
            },
            1000)
    }
}


function infoEdit(target){
    target.on('click',function(){
        var email, year,month,realname;
        var regEmail=/^([a-zA-Z0-9]*[-_]?[a-zA-Z0-9]+)*@([a-zA-Z0-9]*[-_]?[a-zA-Z0-9]+)+[\.][a-z]{2,3}([\.][a-z]{2})?$/;
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
            if(realname.length>10) return $.noticeBox('姓名请不要超过10个字');
            data=realname;
        }
        else if(action_text=='email')
        {
            action='edit_email';
            email=$('#mailEdit').val().trim();
            if(!regEmail.test(email)) return $.noticeBox('邮箱貌似不存在');
            data=email;
        }
        else if(action_text=='birthday')
        {
            action='edit_birthday';
            year=$('#yearEdit').val().trim();
            month=$('#monthEdit').val().trim();
            if(!regYear.test(year)) return $.noticeBox('请输入正确的年份！');
            if(!regMonth.test(month)) return $.noticeBox('月份只能为1～12！');
            data={year:year,month:month}
        }
        var url="";
        var args={action: action, data: data};
        $.postJson(url,args,
            function (res) {
                if (res.success) {
                    target.parents('.info-edit').toggle();
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
                else $.noticeBox('请填写正确的信息！');
            },
             function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},
             function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')}
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
                var sex_box=new Modal('sexBox');
                sex_box.modal('hide');
                $('.user_sex').text(text);
            }
            else $.noticeBox(res.error_text);
        },
         function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}

function Vrify(evt){
    evt.preventDefault();
    var phone=$('#enterPhone').val();
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    if(phone.length > 0 && phone.length<11 && !regPhone.test(phone)){return $.warnNotice("电话貌似有错o(╯□╰)o");}
    if(!phone){return $.warnNotice('手机号不能为空');}
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
                $.noticeBox('验证码已发送到您的手机,请注意查收！');

            }
            else return $.noticeBox(res.error_text);
        },
         function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')}
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
    if(phone.length > 0 && phone.length<11 && !regPhone.test(phone)){return $.warnNotice("电话貌似有错o(╯□╰)o");}
    if(!phone){return $.warnNotice('请输入手机号');}
    if(!code){return $.warnNotice('请输入验证码');}
    if(!password){return $.warnNotice('请设置您的手机登录密码！');}
    if(!regNumber.test(code)){return $.warnNotice('验证码只能为数字！');}
    if(code>0&&phone.length<6){return $.warnNotice('验证码为六位数字!');}
    if(password.length<6){return $.warnNotice('密码至少为6位！')}
    if(passwconf!=password){return $.warnNotice('两次密码输入不一致!')}
    password = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
    var url="/customer/phoneVerify?action=customer";
    var action='checkcode';
    var args={action:action,phone:phone,code:code,password:password};
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                $('.tiephone').text(phone).css({'color':'#a8a8a8'});
                var tie_box=new Modal('tieBox');
                tie_box.modal('hide');
            }
            else $.noticeBox(res.error_text);
        },
        function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}
