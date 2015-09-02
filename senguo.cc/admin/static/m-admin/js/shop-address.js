/**
 * Created by Administrator on 2015/7/6.
 */
var area=window.dataObj.area;
$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height-40+"px");
    var province = $.getUrlParam("province");
    var city = $.getUrlParam("city");
    var code = $.getUrlParam("code");
    var detail = $.getUrlParam("detail");
    $("#address").html(province+city).attr("data-code",code);
    $(".address-ipt").val(detail);
    //初始化省份
    for(var key in area){
        var $item=$('<li></li>');
        var city=area[key]['city'];
        var if_city;
        if(city) {
            if_city='1';//有子城市
        }
        else if_city='0';
        $item.attr({'data-code':key,'data-city':if_city}).html(area[key]['name']);
        $('#privince_list').append($item);
    }
}).on("click",".pop-bwin",function(e){
    if($(e.target).closest(".wrap-address-list").size()==0){
        $(".pop-bwin").addClass("hide");
    }
}).on("click","#privince_list li",function(){
    var if_city = parseInt($(this).attr("data-city"));
    var code = $(this).attr("data-code");
    var name = $(this).html();
    if(if_city==1){
        $("#address").attr("data-province",name);
        $('#city_list').empty();
        for(var key in area){
            var city=area[key]['city'];
            if(code==key){
                for(var k in city){
                    var $item=$('<li></li>');
                    $item.attr({'data-code':k}).html(city[k]['name']);
                    $('#city_list').append($item);
                }
            }
        }
        $("#privince_list").addClass("hide");
        $("#city_list").removeClass("hide");
    }else{
        $("#address").html(name).attr("data-code",code);
        $(".pop-bwin").addClass("hide");
    }
}).on("click","#city_list li",function(){
    var code = $(this).attr("data-code");
    var name = $(this).html();
    $("#address").html($("#address").attr("data-province")+name).attr("data-code",code);
    $(".pop-bwin").addClass("hide");
    $("#privince_list").removeClass("hide");
    $("#city_list").addClass("hide");
}).on("click","#finish_btn",function(){//保存地址
    saveAddress();
}).on("click","#address_select",function(){//保存地址
    $(".pop-bwin").removeClass("hide");
});

function saveAddress(){
    var url = "/admin/config/shop";
    var action='edit_address';
    var shop_city=$('#address').attr('data-code');
    if(!shop_city) {
        return Tip('请选择城市！');
    }
    var shop_address_detail=$('.address-ipt').val();
    if(shop_address_detail.length>50){
        return Tip('详细地址不能超过50个字符！');
    }
    var data={
        shop_city:shop_city,
        shop_address_detail:shop_address_detail
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            Tip("店铺地址编辑成功");
            setTimeout(function(){
                window.location.href="/madmin/shopinfo";
            },2000);
        }else{
            Tip(res.error_text);
        }
    });
}