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
}).on('click','#setPwd',function(){
    var pwdBox=new Modal('pwdBox');
    pwdBox.modal('show');
    $('#pwdBox').find('input').val('');
    $('.set-pwd-box').show();
    $('.change-pwd-box').hide();
    $('#pwdSure').attr({'data-action':'add_password'});   
}).on('click','#changePwd',function(){
    var pwdBox=new Modal('pwdBox');
    pwdBox.modal('show');
    $('#pwdBox').find('input').val('');
    $('.set-pwd-box').hide();
    $('.change-pwd-box').show();
    $('#pwdSure').attr({'data-action':'modify_password'});   
}).on('click','#pwdSure',function(){
    var $this=$(this);
    var action=$this.attr('data-action');
    $('#pwdSure').attr({'disabled':true}).addClass('bg-greyc');
    setPwd(action,$this);
}).on('click','#phoneNumber',function(){
        var tie_box=new Modal('tieBox');
         tie_box.modal('show');
}).on('click','#getVrify',function(evt){
        $('#getVrify').addClass('bg-greyc').attr({'disabled':true}); 
        var $this=$(this);
        Vrify($this);
}).on('click','#tiePhone',function(evt){
        $('#tiePhone').addClass('bg-greyc').attr({'disabled':true}); 
        var $this=$(this);
        TiePhone($this);
}).on("click","#userRealname",function(){
    $("#name-ipt").val("");
    var name_box=new Modal('nameBox');
    name_box.modal('show');
}).on("click","#nameSure",function(){
    nameEdit($("#realnameEdit").val());
}).on("click","#userBirthday",function(){
    //birthEdit();
    $(".birth-ipt").val('');
    var birth_box = new Modal('birthBox');
    birth_box.modal('show');
}).on("click","#birthSure",function(){
    birthEdit();
});

var wait=60;
function time(target) {
    if (wait == 0) {
        target.text("获取验证码").removeClass('bg-greyc').removeAttr('disabled');
        wait = 60;
    }
    else {
        target.text("重新发送(" + wait + ")").addClass('bg-greyc').attr({'disabled':true});
        wait--;
        setTimeout(function() {
                time(target)
            },
            1000)
    }
}

function infoEdit(target){
    target.on('click',function(){
        var email,year,month,realname;
        var regEmail=/^([a-zA-Z0-9]*[-_]?[a-zA-Z0-9]+)*@([a-zA-Z0-9]*[-_]?[a-zA-Z0-9]+)+[\.][a-z]{2,3}([\.][a-z]{2})?$/;
        var regNumber=/^[0-9]*[1-9][0-9]*$/;
        var action_text=target.data('action');
        var data;
        var action;
        if(action_text=='email')
        {
            action='edit_email';
            email=$('#mailEdit').val().trim();
            if(!regEmail.test(email)) return noticeBox('邮箱貌似不存在');
            data=email;
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
                else noticeBox('请填写正确的信息！');
            },
             function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
             function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
        );
    });
}
function birthEdit(){
    var regYear=/^(?!0000)[0-9]{4}$/;
    var regMonth=/^(0?[1-9]|[1][012])$/;
    var regDay=/^(0?[1-9]|[123][0-9])$/;
    var action='edit_birthday';
    var year=$('#year-ipt').val().trim();
    var month=$('#month-ipt').val().trim();
    var day=$('#day-ipt').val().trim();
    if(!regYear.test(year)) return warnNotice('请输入正确的年份！');
    if(!regMonth.test(month)) return warnNotice('月份只能为1～12！');
    if(!regDay.test(day) || parseInt(day)>31) return warnNotice('日期只能为1～31！');
    var data={year:year,month:month,day:day};
    var url="";
    var args={action: action, data: data};
    $.postJson(url,args,
        function (res) {
            if (res.success) {
                $('#birthDay').text(res.birthday);
                var birth_box = new Modal('birthBox');
                birth_box.modal('hide');
            }
            else noticeBox(res.error_txt);
        },
        function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
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
            else noticeBox(res.error_text);
        },
         function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}
function nameEdit(name){
    if(name.length>10){
        warnNotice("姓名请不要超过10个字");
        return false;
    }
    var action = "edit_realname";
    var url="";
    var args={action: action, data: name};
    $.postJson(url,args,
        function (res) {
            if (res.success) {
                var name_box=new Modal('nameBox');
                name_box.modal('hide');
                $('#userName').text(name);
            }
            else noticeBox(res.error_txt);
        },
        function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}

function Vrify(phone,target){
    var action='gencode';
    var url="/customer/phoneVerify?action=customer";
    var phone=$('#enterPhone').val();
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    if(phone.length > 11 ||phone.length<11 || !regPhone.test(phone)){
        $('#getVrify').removeClass('bg-greyc').removeAttr('disabled');
        return warnNotice("手机号貌似有错o(╯□╰)o",target);
    }
    if(!phone){
        $('#getVrify').removeClass('bg-greyc').removeAttr('disabled');
        return warnNotice('手机号不能为空',target);
    }
    var args={
        action:action,
        phone:phone
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                noticeBox('验证码已发送到您的手机,请注意查收！',target);
                time($('#getVrify'));
                //$('#getVrify').removeClass('bg-greyc').removeAttr('disabled');

            }
            else{
                noticeBox(res.error_text);
                $('#getVrify').removeClass('bg-greyc').removeAttr('disabled');
            } 
        },
         function(){
            noticeBox('网络好像不给力呢~ ( >O< ) ~',target);
            $('#getVrify').removeClass('bg-greyc').removeAttr('disabled');
        },
        function(){
            noticeBox('服务器貌似出错了~ ( >O< ) ~',target);
            $('#getVrify').removeClass('bg-greyc').removeAttr('disabled');
        }
    );
}

function TiePhone(target){
    var phone=$('#enterPhone').val().trim();
    var code=$('#enterVrify').val().trim();
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    if(phone.length > 11 || phone.length<11 || !regPhone.test(phone)){
        $('#tiePhone').removeClass('bg-greyc').removeAttr('disabled');
        return warnNotice("手机号貌似有错o(╯□╰)o",target);
    }
    if(!phone){
        $('#tiePhone').removeClass('bg-greyc').removeAttr('disabled');
        return warnNotice('请输入手机号',target);
    }
    if(!code){
        $('#tiePhone').removeClass('bg-greyc').removeAttr('disabled');
        return warnNotice('请输入验证码',target);
    } 
    if(!regNumber.test(code)){
        $('#tiePhone').removeClass('bg-greyc').removeAttr('disabled');
        return warnNotice('验证码只能为数字',target);
    }
    if(code.length>4||code.length<4){
        $('#tiePhone').removeClass('bg-greyc').removeAttr('disabled');
        return warnNotice('验证码为4位数字',target);
    }
    var url="/customer/phoneVerify?action=customer";
    var action='checkcode';
    var args={action:action,phone:phone,code:code};
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                $('.tiephone').text(phone).css({'color':'#a8a8a8'});
                var tie_box=new Modal('tieBox');
                tie_box.modal('hide');
                $('#tiePhone').removeClass('bg-greyc').removeAttr('disabled');
            }
            else {
                noticeBox(res.error_text,target);
                $('#tiePhone').removeClass('bg-greyc').removeAttr('disabled');
            }
        },
        function(){
            return noticeBox('网络好像不给力呢~ ( >O< ) ~',target)
        },
        function(){
            return noticeBox('服务器貌似出错了~ ( >O< ) ~'.target)
        }
    );
}

function setPwd(action, $obj){
     var regPass=/^[0-9a-zA-Z]*$/g;
     var data;
     var url='';
     var args;
    if(action=='add_password'){
        var password=$('#loginPassword').val();
        var passwconf=$('#passwordConfirm').val();
        if(!password){return warnNotice('请设置您的手机登录密码',$obj);return false;}
        if(password.length<6 || !regPass.test(password)) {warnNotice('请输入六位以上字母和数字的组合',$obj);return false;}
        if(passwconf!=password){warnNotice('两次密码输入不一致',$obj);return false;}
        password = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
        data=password;
            args={
            action:action,
            data:data
        };
    }  
    else if(action=='modify_password'){
        var old_password=$('#originPassword').val();
        var newPassword=$('#newPassword').val();
        var passwconf=$('#newConfirm').val();
        if(!old_password){warnNotice('请输入原始密码',$obj);return false;}
        if(!newPassword){warnNotice('请输入新密码',$obj);return false;}
        if(newPassword.length<6 || !regPass.test(newPassword)) {
            warnNotice('请输入六位以上字母和数字的组合',$obj);
            return false;
        }
        if(passwconf!=newPassword){warnNotice('两次密码输入不一致',$obj);return false;}
        old_password = CryptoJS.SHA256(old_password).toString(CryptoJS.enc.Hex);
        newPassword = CryptoJS.SHA256(newPassword).toString(CryptoJS.enc.Hex);
        data=newPassword;
        args={
            action:action,
            data:data,
            old_password:old_password
        };
    }    
     
        $.postJson(url,args,
            function(res){
                if(res.success)
                {
                    var pwdBox=new Modal('pwdBox');
                    pwdBox.modal('hide');
                    $('#pwdSure').removeAttr('disabled');
                    if(action=='add_password'){
                        $('#setPwd').attr({'id':'changePwd'}).find('.setPwd').text('修改密码');
                        noticeBox('密码设置成功');
                    }
                    else if(action=='modify_password'){
                        noticeBox('密码修改成功');
                    }
                }
                else {
                    noticeBox(res.error_text);
                    $('#pwdSure').removeAttr('disabled');
                }
            },
            function(){
                noticeBox('网络好像不给力呢~ ( >O< ) ~');
                $('#pwdSure').removeAttr('disabled');
            },
            function(){
                noticeBox('服务器貌似出错了~ ( >O< ) ~');
                $('#pwdSure').removeAttr('disabled');
            }
        );
}