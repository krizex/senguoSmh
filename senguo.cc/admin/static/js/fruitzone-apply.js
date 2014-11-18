$(document).ready(function(){

    $('.area-choose-list li').each(function(){
        $(this).on('click',function(){
            if($(this).hasClass('active'))
                {$(this).removeClass('active');}
            else $(this).addClass('active');
        });
    });

    $('#submitApply').on('click',function(evt){Apply(evt);});
    $('#submitReapply').on('click',function(evt){reApply(evt);});

    var proc=$('.reProvince').data('code');
    var citc=$('.reCity').data('code');
    $('.reProvince').text(provinceArea(proc));
    if(citc!=proc)
        {$('.reCity').text(cityArea(proc,citc));}

});

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
    var shop_province=$('#provinceAddress').attr('data-code');
    var shop_city=$('#cityAddress').attr('data-code');
    var shop_address_detail=$('#addressDetail').val().trim();
    var have_offline_entity=$('#realShop').find('.active').find('a').data('real');
    var shop_service_area=i;
    var shop_intro=$('#shopIntro').val().trim();
    if(shop_name.length>20){return alert('店铺名称请不要超过20个字符！')}
    if(shop_address_detail.length>50){return alert('详细地址请不要超过500个字符！')}
    if(shop_intro.length>300){return alert('店铺简介请不要超过300个字符！')}
    if (!shop_name || ! shop_service_area ||!shop_city||!shop_province || !shop_address_detail || !shop_intro){return alert("请输入带*的必要信息");}
    var args={
        shop_name:shop_name,
        shop_province:shop_province,
        shop_city:shop_city,
        shop_address_detail:shop_address_detail,
        have_offline_entity:have_offline_entity,
        shop_service_area:shop_service_area,
        shop_intro:shop_intro,
    };
    var url="/fruitzone/shop/apply";
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                alert("申请成功！");
                window.location.href="/fruitzone/shop/applySuccess";

            }
            else  alert(res.error_text);
        },
        function(){
            alert('网络错误！');}
    );
}

function reApply(evt){
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
    var shop_province=$('#provinceAddress').attr('data-code');
    var shop_city=$('#cityAddress').attr('data-code');
    var shop_address_detail=$('#addressDetail').val().trim();
    var have_offline_entity=$('#realShop').find('.active').find('a').data('real');
    var shop_service_area=i;
    var shop_intro=$('#shopIntro').val().trim();
    var shop_id=$('#headerId').data('id');
    if(shop_name.length>20){return alert('店铺名称请不要超过20个字符！')}
    if(shop_address_detail.length>50){return alert('详细地址请不要超过500个字符！')}
    if(shop_intro.length>300){return alert('店铺简介请不要超过300个字符！')}
    if (!shop_name || ! shop_service_area ||!shop_city||!shop_province || !shop_address_detail || !shop_intro){return alert("请输入带*的必要信息");}
    var args={
        shop_name:shop_name,
        shop_province:shop_province,
        shop_city:shop_city,
        shop_address_detail:shop_address_detail,
        have_offline_entity:have_offline_entity,
        shop_service_area:shop_service_area,
        shop_intro:shop_intro,
        shop_id:shop_id
    };
    var url="/fruitzone/shop/reApply";
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                console.log(args);
                window.location.href="/fruitzone/shop/applySuccess";
                alert("重新申请成功！");
            }
            else  alert(res.error_text);
        },
        function(){
            alert('网络错误！');}
    );
}
