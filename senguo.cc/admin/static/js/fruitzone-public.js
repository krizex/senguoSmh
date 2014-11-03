$(document).ready(function(){
    $('.select-list li').each(function(){
        $(this).click(function(){
            $(this).addClass('active').siblings().removeClass('active');
        });
    });
    $('.area-choose-list li').each(function(){
        $(this).click(function(){
            if($(this).hasClass('active'))
            {$(this).removeClass('active');}
            else $(this).addClass('active');
        });
    });

    $('#city-select ul').eq(0).show().siblings('ul').hide();
    $('#province-select li').click(function(){
        var i=$(this).index();
        $('#city-select ul').eq(i).show().siblings('ul').hide();
    });

    $('.order-by-item li').click(function(){$(this).parents('.order-by-list').hide();});
    $('.order-by a').click(function(){$(this).addClass('active').siblings().removeClass('active');});

    $('.editInfo').click(function(){$(this).parents('.info-con').siblings('.info-edit').toggle();});

    $('a.editInfo').each(function(){
        if($(this).text() =='None'||$(this).text() =='')
        {$(this).text('点击设置').css({'color':'#FF3C3C'});}
    });
    $('.info-edit').find('.concel-btn').each(function(){$(this).click(function(){$(this).parents('.info-edit').hide();})});

    $('.info-edit').find('.sure-btn').each(function(){infoEdit($(this))});
    $('#submitApply').click(function(evt){Apply(evt);});
    $('#getVrify').click(function(evt){Vrify(evt);});
    $('#tiePhone').click(function(evt){TiePhone(evt);});

    if($('#detailsReal').data('real')=='true')
         $('#detailsReal').text('是');
    else $('#detailsReal').text('否');

    if($('#adminSex').data('sex')=='male')
        $('#adminSex').text('男');
    else if($('#adminSex').data('sex')=='famale')
        $('#adminSex').text('女');

    $('#searchSubmit').click(function(evt){Search(evt);})

});

function orderBy(i){
    $('#orderBy'+i).slideToggle().siblings('.order-by-list').slideUp(100);
}

$.postJson = function(url, args, successCall, failCall, alwaysCall){
    var req = $.ajax({
        type:"post",
        url:url,
        data:JSON.stringify(args),
        contentType:"application/json; charset=UTF-8",
        success:successCall,
        fail:failCall,
        error:failCall
    });
    req.always(alwaysCall);
};

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
     evt.click(function(){
        var email=$('#mailEdit').val();
        var year=$('#yearEdit').val();
        var month=$('#monthEdit').val();
        var sex=$('#sexEdit option:selected').data('sex');
        var realname=$('#realnameEdit').val();
        var regEmail=/^([a-z0-9]*[-_]?[a-z0-9]+)*@([a-z0-9]*[-_]?[a-z0-9]+)+[\.][a-z]{2,3}([\.][a-z]{2})?$/;
        var regNumber=/^\d{n}$/;
        var regMonth=/^((0?[1-9])|((1|2)[0-9])|30|31)$/;
        var regSex=/^[男女]$/;
        var action=evt.data('action');
        var data=evt.parents('.info-edit').find('.edit-box').val();

        if(action=='edit_email' && !regEmail.test(email))
             {return alert("邮箱不存在!");}
        else if(action=='edit_sex' && !regSex.test($('#sexEdit').val()))
             {return alert('性别只能为男或女！');}
        else if(action=='edit_birthday' && !regMonth.test(month))
             {return alert("请输入正确的年月!");}
        else if(action=='edit_birthday')
            {
                data={
                    year:$('#yearEdit').val().trim(),
                    month:$('#monthEdit').val().trim()
                }
            }

        var url="/fruitzone/admin/profile";
        var args={action: action, data: data, _xsrf: window.dataObj._xsrf};
         $.postJson(url,args,
             function (res) {
                 console.log(res);
                 if (res.success) {
                     evt.parents('li').find('a.editInfo').text(data);
                     //evt.parents('li').find('#userBirthday').text(data.year+'年'+data.month+'月');
                     if(data==''){evt.parents('li').find('.editInfo').text('点击设置').css({'color':'#FF3C3C'});}
                     evt.parents('li').find('.info-edit').hide();
                     alert('修改成功！');
                 }},
             function(){
                 alert('网络错误！');}
         );
    });
}

function Vrify(evt){
    evt.preventDefault();
    var phone=$('#enterPhone').val();
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    if(phone.length > 0 && phone.length<11 && !regPhone.test(phone)){return alert("电话貌似有错o(╯□╰)o");}
    if(!phone){return alert('手机号不能为空');}

    var url="/fruitzone/phoneVerify/gencode";
    var args={"phone":phone,_xsrf: window.dataObj._xsrf};
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                time($('#getVrify'));
                alert('验证码已发送到您的手机,请注意查收！');

            }
            else alert('手机号有错误!');
        },
        function(){
            alert('网络错误！');}
    );
}

function TiePhone(evt){
    evt.preventDefault();
    var phone=$('#enterPhone').val();
    var code=$('#enterVrify').val();
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    if(!phone){return alert('请输入手机号');}
    if(!code){return alert('请输入验证码');}
    if(!regNumber.test(code)){return alert('验证码只能为数字！');}
    if(code>0&&phone.length<6){return alert('验证码为六位数字!');}

    var url="/fruitzone/phoneVerify/checkcode";
    var args={phone:phone,code:code,_xsrf: window.dataObj._xsrf};
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                alert('绑定成功！');
            }
            else alert('验证码错误!');
        },
        function(){
            alert('网络错误！');}
    );
}

function Apply(evt){
    evt.preventDefault();
    var i=0;
    if($('#serverArea li').eq(0).hasClass('active'))
        i+=1;
    if($('#serverArea li').eq(1).hasClass('active'))
        i+=2;
    if($('#serverArea li').eq(2).hasClass('active'))
        i+=4;
    if($('#serverArea li').eq(3).hasClass('active'))
        i+=8;
    var shop_name=$('#shopName').val().trim();
    var shop_province=$('#provinceAddress').data('code');
    var shop_city=$('#cityAddress').data('code');
    var shop_address_detail=$('#addressDetail').val().trim();
    var have_offline_entity=$('#realShop').find('.active').find('a').data('real');
    var shop_service_area=i;
    console.log(i);
    var shop_intro=$('#shopIntro').val().trim();
    if (!shop_name || ! shop_service_area || !shop_province ||!shop_city || !shop_address_detail || !shop_intro){return alert("请输入带*的必要信息");}
    var args={
        shop_name:shop_name,
        shop_province:shop_province,
        shop_city:shop_city,
        shop_address_detail:shop_address_detail,
        have_offline_entity:have_offline_entity,
        shop_service_area:shop_service_area,
        shop_intro:shop_intro,
        _xsrf: window.dataObj._xsrf
    };
    var url="/fruitzone/shop/apply";
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                console.log(args);
                window.location.href="/fruitzone/shop/applySuccess";
                alert("申请成功！");
            }
            else  alert("信息填写错误！");
        },
        function(){
            alert('网络错误！');}
    );
}

function Search(evt){
    evt.preventDefault();
    var q=$('#searchKey').val().trim();
    var action=$('#searchSubmit').data('action');
    var url="/fruitzone/";
    var args={
        q:q,
        action:action,
        _xsrf: window.dataObj._xsrf

    };
    $.postJson(url,args,
        function(res){
            if(res.success)
                console.log(q);
            else alert('无搜索结果！');
        },
    function(){
        alert('网络错误！');
         }
    );
}