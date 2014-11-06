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
    $('#feedbackEdit').click(function(evt){FeedBack(evt);});

    $('#province-select').find('li').click(function(){
        if($('#city-select').find('li').length==0)
        {
            Filter($(this));
        }
        else $('.city-select').find('li').each(function(){$(this).click(function(){Filter($(this));});});
    });
    $('.order-by-area').find('li').each(function(){$(this).click(function(){Filter($(this));});});
    $('.order-by-time').find('li').each(function(){$(this).click(function(){Filter($(this));});});
    $('#orderByFruit').click(function(){Filter($(this));});

    if($('#detailsReal').data('real')=='true')
         $('#detailsReal').text('有');
    else $('#detailsReal').text('无');

    if($('.showSex').data('sex')=='1')
        $('.showSex').text('男');
    else if($('.showSex').data('sex')=='2')
        $('.showSex').text('女');
    else $('.showSex').text('其他');


    var fruit=window.dataObj.fruit_types;
    for(var code in fruit)
    {
        var fruitlist=$('<li data-code="'+fruit[code]['id']+'"></li>').text(fruit[code]['name']);
        $('.fruit-list').append(fruitlist);
    }

    $('.modal .fruit-list li').each(function(){$(this).click(function(){$(this).toggleClass('active');});});

    var s1=$('.sell-fruit-list').find('li');
    var s2=$('#sellFruit').find('li');
    var b1=$('.buy-fruit-list').find('li');
    var b2=$('#buyFruit').find('li');
    Remember(s1,s2);
    Remember(b1,b2);

    $('.order-by-fruit').find('li').each(function(){$(this).click(function(){$(this).toggleClass('active');});});
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

function Remember(sell1,sell2){
    for(var i= 0;i<sell1.length;i++)
    {
        var t=sell1.eq(i).data('code');
        for(var j=0;j<sell2.length;j++)
        {
            var g=sell2.eq(j).data('code');
            if(g==t)
            {
                sell2.eq(j).addClass('active');
            }
        }

    }
}

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
                     evt.parents('li').find('#userBirthday').text(data.year+'-'+data.month);
                     if(data==''){evt.parents('li').find('.editInfo').text('点击设置').css({'color':'#FF3C3C'});}
                     if(data=='0'){$('#userSex').text('其他');}
                     else if(data=='1'){$('#userSex').text('男');}
                     else if(data=='2'){$('#userSex').text('女');}
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
    console.log(shop_city);
    var shop_intro=$('#shopIntro').val().trim();
    if (!shop_name || ! shop_service_area || ! shop_city ||!shop_province || !shop_address_detail || !shop_intro){return alert("请输入带*的必要信息");}
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
            else  alert(res.error_text);
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
                if (res.success) {
                    evt.parents('.editBox').find('.shopShow').text(data);
                    var fruit=window.dataObj.fruit_types;
                    evt.parents('.modal').prev('.edit-fruit-list').find('li').remove();
                    for(var i=0;i<data.length;i++)
                    {
                        var h=data[i]-1;
                        var fruitlist=$('<li class="fruitsty" data-code="'+fruit[h]['id']+'"></li>').text(fruit[h]['name']);
                        evt.parents('.fruitBox').prev('.edit-fruit-list').prepend(fruitlist);
                        console.log(h);

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
            if(res.success)
                {
                    $('#homeShopList').empty();
                    var shops=res.shops;
                    for(var shop in shops)
                    {
                        var list=$('<li><a href="/fruitzone/shop/'+shops[shop]["id"]+'"><div class="shop-logo pull-left"><img src="/static/images/anoa-1-md.gif"/></div><div class="shop-info pull-right"><p><span class="shop-name w1 pull-left">'+shops[shop]["shop_name"]+'</span><span class="w2 area pull-left">wait</span></p><p>运营时间：'+shops[shop]['live_month']+'月</p><p><span class="shop-owner w1 pull-left">负责人：'+shops[shop]["shop_name"]+'</span><span class="w2 wechat-code pull-left">'+shops[shop]["shop_name"]+'</span></p></div></a></li>');
                        $('#homeShopList').append(list);
                        console.log(shops);
                    }
                }
            if(res.success&&res.shops=='')
                {
                    $('#homeShopList').empty();
                    alert('无搜索结果！');
                }
        },
        function(){
            alert('网络错误！');
             }
    );
}


function Filter(evt){
        var action='filter';
        var city=evt.data('code');
        var service_area=evt.data('code');
        var live_month=evt.data('code');
        var onsalefruit_ids=[];
        var fruit=$('.order-by-fruit').find('.active');
        for(var i=0;i<fruit.length;i++)
            {
             var code=fruit.eq(i).data('code');
             onsalefruit_ids.push(code);
            }
        console.log(onsalefruit_ids);
        var url="/fruitzone/";
        var order=evt.parents('.order-by-list').find('.order-by-item').data('action');
        if(order=='cityFilter')
            {var args = {city: city,action: action,_xsrf: window.dataObj._xsrf}}
        else if(order=='areaFilter')
            {var args = {service_area: service_area,action: action,_xsrf: window.dataObj._xsrf}}
        else if(order=='liveFilter')
            {var args = {live_month: live_month,action: action,_xsrf: window.dataObj._xsrf}}
        else if(order=='fruitFilter')
            {var args = {onsalefruit_ids: onsalefruit_ids,action: action,_xsrf: window.dataObj._xsrf};}
        console.log(args);
        $.postJson(url,args,
            function(res){
                if(res.success) {
                   evt.parents('.order-by-list').hide();
                    $('#homeShopList').empty();
                    var shops = res.shops;
                    console.log(res.shops);
                    for (var shop in shops)
                    {
                        var list = $('<li><a href="/fruitzone/shop/' + shops[shop]["id"] + '"><div class="shop-logo pull-left"><img src="/static/images/anoa-1-md.gif"/></div><div class="shop-info pull-right"><p><span class="shop-name w1 pull-left">' + shops[shop]["shop_name"] + '</span><span class="w2 area pull-left">wait</span></p><p>运营时间：' + shops[shop]['live_month'] + '月</p><p><span class="shop-owner w1 pull-left">负责人：' + shops[shop]["shop_name"] + '</span><span class="w2 wechat-code pull-left">' + shops[shop]["shop_name"] + '</span></p></div></a></li>');
                        $('#homeShopList').append(list);
                        console.log('22222');

                    }
                }
            },
            function(){
                alert('网络错误！');
            }
        );

}

function FeedBack(){
    var feedback=$('#feedbackInfo').val().trim();
    var action="feedback";
    var args={
        action:action,
        feedback_text:feedback,
        _xsrf: window.dataObj._xsrf
    };
    var url="/fruitzone/admin/home";
    $.postJson(url,args,
        function(res){
            if(res.success)
                alert('感谢您的宝贵意见！');
        },
        function(){
            alert('网络错误！');
        }
    );
}