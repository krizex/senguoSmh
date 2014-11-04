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
    $('.shop-edit-btn').each(function(){shopEdit($(this));});
    $('#searchSubmit').click(function(evt){Search(evt);});
    $('.order-by-item').find('li').each(function(){Filter($(this));});


    if($('#detailsReal').data('real')=='true')
         $('#detailsReal').text('有');
    else $('#detailsReal').text('无');

    if($('.showSex').data('sex')=='1')
        $('.showSex').text('男');
    else if($('.showSex').data('sex')=='0')
        $('.showSex').text('女');

    var fruit=window.dataObj.fruit_types;
    for(var code in fruit)
    {
        var fruitlist=$('<li data-code="'+fruit[code]['id']+'"></li>').text(fruit[code]['name']);
        $('.fruit-list').append(fruitlist);
        console.log('222');
    }

    $('.modal .fruit-list li').each(function(){$(this).click(function(){
        $(this).toggleClass('active');
    });})

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
         alert('22222');
        var email=$('#mailEdit').val();
        var year=$('#yearEdit').val();
        var month=$('#monthEdit').val();
        var sex=$('#sexEdit option:selected').data('sex');
        var realname=$('#realnameEdit').val();
        var regEmail=/^([a-z0-9]*[-_]?[a-z0-9]+)*@([a-z0-9]*[-_]?[a-z0-9]+)+[\.][a-z]{2,3}([\.][a-z]{2})?$/;
        var regNumber=/^[0-9]*[1-9][0-9]*$/
        var regMonth=/^((0?[1-9])|((1|2)[0-9])|30|31)$/;
        var action=evt.data('action');
        var data=evt.parents('.info-edit').find('.edit-box').val();

        if(action=='edit_email' && !regEmail.test(email))
             {return alert("邮箱不存在!");}
        else if(action=='edit_sex')
             {
                 data=sex;
             }
        else if(action=='edit_birthday' && !regMonth.test(month)&&!regNumber.test(year))
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
                     evt.parents('li').find('#userBirthday').text(data.year+''+data.month);
                     if(data==''){evt.parents('li').find('.editInfo').text('点击设置').css({'color':'#FF3C3C'});}
                     evt.parents('li').find('.info-edit').hide();
                     $('#serSex').attr({'data-sex':data});
                     console.log(data);
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


function shopEdit(evt){
    evt.click(function(){
        var link=$('#shopLink').val();
        var time=$('#shopTime').val();
        var users=$('#shopUser').val();
        var sell=$('#shopSell').val();
        var buy=$('#shopBuy').val();
        var intro=$('#shopIntro').val();
        var regNumber=/^[0-9]*[1-9][0-9]*$/;
        var id=$('#headerId').data('shop');

        var action=evt.data('action');
        var data=evt.parents('.modal').find('.shop-edit-info').find('.editBox').val();

        if(action=='edit_live_month')
        {
            data={
                year:$('#startYear').val().trim(),
                month:$('#startMonth').val().trim()
            }
        }
        else if(action=='edit_total_users' && !regNumber.test(users))
            {return alert('用户数只能为数字！');}
        else if(action=='edit_daily_sales' && !regNumber.test(sell))
            {return alert("日销量只能为数字!");}
        else if(action=='edit_single_stock_size' && !regNumber.test(buy))
            {return alert("采购量只能为数字!");}
        else if(action=='edit_onsale_fruits')
            {
                var data=[];
                var f=$('#sellFruit').find('.active');
                for(var i=0;i<f.length;i++)
                {
                    var b=$('#sellFruit').find('.active').eq(i).data('code');
                    data.push(b);

                }
            }
        else if(action=='edit_demand_fruits')
            {
                var data=[];
                var f=$('#buyFruit').find('.active');
                for(var i=0;i<f.length;i++)
                {
                    var b=$('#buyFruit').find('.active').eq(i).data('code');
                    data.push(b);
                }
            }
        console.log(data);
        var url="/fruitzone/admin/shop/"+id;
        var args={action: action, data: data,_xsrf: window.dataObj._xsrf};
        $.postJson(url,args,
            function (res) {
                console.log(res);
                if (res.success) {
                    evt.parents('.editBox').find('.shopShow').text(data);
                    evt.attr({'data-dismiss':'modal'});
                    var fruit=window.dataObj.fruit_types;
                    for(var i=0;i<data.length;i++)
                    {
                        var h=data[i]-1;
                        var fruitlist=$('<li data-code="'+fruit[h]['id']+'"></li>').text(fruit[h]['name']);
                        evt.parents('.modal').prev('.edit-fruit-list').prepend(fruitlist);
                    }
                    alert('修改成功！');
                }},
            function(){
                alert('网络错误！');}
        );
    });
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
    console.log(q);
    $.postJson(url,args,
        function(res){
            if(res.success&&res.shops==[])
                 alert('无搜索结果！');
        },
    function(){
        alert('网络错误！');
         }
    );
}


function Filter(evt){
    evt.click(function(){
        console.log(evt);
        var action='filter';
        var city=$('#cityFilter').find('.active').data('code');
        var service_area=$('#areaFilter').find('.active').data('code');
        var live_month=$('#liveFilter').find('.active').data('code');
        var onsalefruit_ids=$('#fruitFilter').find('.active').data('code');
        var url="/fruitzone/";
        console.log(evt);
        if(evt.parents('.order-by-item').is('#cityFilter'))
            {var args = {city: city,action: action,_xsrf: window.dataObj._xsrf}}
        else if(evt.parents('.order-by-item').is('#areaFilter'))
            {var args = {service_area: service_area,action: action,_xsrf: window.dataObj._xsrf}}
        else if(evt.parents('.order-by-item').is('#liveFilter'))
            {var args = {live_month: live_month,action: action,_xsrf: window.dataObj._xsrf}}
        else if(evt.parents('.order-by-item').is('#fruitFilter'))
            {var args = {onsalefruit_ids: onsalefruit_ids,action: action,_xsrf: window.dataObj._xsrf}}

        $.postJson(url,args,
            function(res){
                if(res.success)
                    evt.parents('.order-by-list').hide();
                     console.log('无搜索结果！');
            },
            function(){
                alert('网络错误！');
            }
        );
    });

}