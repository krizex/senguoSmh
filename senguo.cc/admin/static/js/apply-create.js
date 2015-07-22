var area = window.dataObj.area;
$(document).ready(function(){
    var height = $(window).height();
    $(".container").css("minHeight",height+"px");
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
    initBmap();
}).on("click",".pop-bwin",function(e){
    if($(e.target).closest(".wrap-address-list").size()==0){
        $(".pop-bwin").addClass("hide");
    }
}).on("click","#privince_list li",function(){
    var if_city = parseInt($(this).attr("data-city"));
    var code = $(this).attr("data-code");
    var name = $(this).html();
    if(if_city==1){
        $(".choose-title").html("选择城市");
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
        $(".address").attr("data-code",code);
        $(".province").html(name);
        $(".pop-bwin").addClass("hide");
    }
}).on("click","#city_list li",function(){
    var code = $(this).attr("data-code");
    var name = $(this).html();
    $(".address").attr("data-code",code);
    $(".city").html(name);
    $(".pop-bwin").addClass("hide");
    $("#privince_list").removeClass("hide");
    $("#city_list").addClass("hide");
}).on("click",".province",function(){
    $(".choose-title").html("选择省份");
    $(".pop-bwin").removeClass("hide");
});
function initBmap(){
    var map = new BMap.Map("bmap",{enableMapClick:false});
    var point = new BMap.Point(114.430551,30.518114);
    map.centerAndZoom(point,15);
    var marker = null;
    $("#get_point").on("click",function(){
        var myGeo = new BMap.Geocoder();
        var address = $("#province").html()+$("#city").html()+$.trim($("#address").val());
        myGeo.getPoint(address, function (point) {
            if (point){
                map.centerAndZoom(point, 17);
                marker = new BMap.Marker(point);
                map.addOverlay(marker);
            }
        });
    });
}