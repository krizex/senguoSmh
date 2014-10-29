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
    $('#submitApply').click(function(evt){Apply(evt);});
    $('.use-stage').click(function(){$('.use-box').show();});
    $('.dont-use-stage').click(function(){$('.use-box').hide();});
    $('#search-btn').click(function(){$('#search-box').toggle();});
    $('#city-select ul').eq(0).show().siblings('ul').hide();
    $('#province-select li').click(function(){
        var i=$(this).index();
        $('#city-select ul').eq(i).show().siblings('ul').hide();
    });
    $('.order-by-item li').click(function(){$(this).parents('.order-by-list').hide();});
    $('.select-list').find('li').first().addClass('active');

});

function orderBy(i){
    $('#orderBy'+i).slideToggle().siblings('.order-by-list').slideUp(100);
}

function Apply(evt){
    evt.preventDefault();
    var tip=$('#notice');
    var regUsername=/^[a-zA-Z_\d]{6,21}$/;
    var regEmail=/^([a-z0-9]*[-_]?[a-z0-9]+)*@([a-z0-9]*[-_]?[a-z0-9]+)+[\.][a-z]{2,3}([\.][a-z]{2})?$/;
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    var shop_name=$('#shopName').val().trim();
    var shop_service_areas=$('#serverArea').find('.active').find('a').text().trim();
    var shop_province=$('#provinceAddress').text().trim();
    var shop_city=$('#cityAddress').text().trim();
    var shop_address_detail=$('#addressDetail').val().trim();
    var have_offline_entity=$('#realShop').find('.active').find('a').text().trim();
    var admin_realname=$('#username').val().trim();
    var admin_email=$('#email').val().trim();
    var admin_wx_username=$('#wexincode').val().trim();
    var admin_use_system=$('#useStage').val().trim();
    var admin_charge_type=$('#useLimt').find('.active').find('a').text().trim();
    var admin_phone=$('#phone').val().trim();
    if (!shop_name || ! shop_service_areas || !shop_province || !shop_city || !shop_address_detail){tip.text("请输入必要信息");}
    if(!regEmail.test(admin_email)){return tip.text("邮箱不存在").show();}
    if(admin_phone.length > 0 && !regPhone.test(admin_phone)){return tip.text("电话貌似有错o(╯□╰)o").show();}

    var args={
        "shop_name":shop_name,
        "shop_service_areas":shop_service_areas,
        "shop_province":shop_province,
        "shop_city":shop_city,
        "have_offline_entity":have_offline_entity,
        "shop_address_detail":shop_address_detail,
        "admin_realname":admin_realname,
        "admin_email":admin_email,
        "admin_wx_username":admin_wx_username,
        "admin_use_system":admin_use_system,
        "admin_charge_type":admin_charge_type,
        "admin_phone":admin_phone
    };
    $.ajax({
        url:"/fruitzone/apply",
        type:"POST",
        dataType:"json",
        data: $.param(args),
        success:function(r){
            if(r.success==1){
                window.location.href="/fruitzone/applySuccess";
            }
            else{
                alert("信息填写错误！");
            }
        },
        error:function(){
            alert("网络错误！")
        }

    });
}