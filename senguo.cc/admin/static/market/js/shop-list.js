/**
 * Created by Administrator on 2015/7/6.
 */
var isLoad = true, pn = 0, cur_action="", ulng= 0, ulat=0, action="to_do";
$(document).ready(function(){
    initLocation();
}).on("click",".shop-list li",function(){
    var id=$(this).data('id');
    window.location.href="/market/shopinfo?id="+id;
}).on("click",".tab-list li",function(){
    var index = $(this).index();
    $(".tab-list li").removeClass("active").eq(index).addClass("active");
    document.body.scrollTop=0;
    pn=0;
    if(index==0){
        cur_action=0;
        action = "to_do"
        loadData();
    }else{
        cur_action=1;
        action="has_done";
        loadData();
    }
}).on("click","#cur_address",function(){//刷新列表
    if($(this).attr("data-flag")=="1"){
    }else{
        document.body.scrollTop=0;
        $(".loading").show().attr("data-flag","1");
        pn=0;
        initLocation();
    }
});
/*根据经纬度获取地址*/
function getAddress(lng,lat){
    var point = new BMap.Point(lng,lat);
    var geoc = new BMap.Geocoder();
    geoc.getLocation(point, function(rs){
        var addComp = rs.addressComponents;
        var address = addComp.city + " " + addComp.district + " " + addComp.street + " " + addComp.streetNumber;
        $("#address").html(address);
    });
}
//获取用户当前地理位置
function initLocation(){
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(function(position){
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;//经度
            var gpsPoint = new BMap.Point(lng,lat);
            BMap.Convertor.translate(gpsPoint,0,function(point){
                ulng = point.lng;
                ulat = point.lat;
                loadData(action);
                getAddress(ulng,ulat);
            });
        },function(error){
            return Tip("请用手机浏览器，并开启定位功能");
        });
    }
}
/*根据经纬度获取距离*/
function getDist(distance){
    var dis = 0;
    if(distance<1000){
        dis = distance.toFixed(0)+"m";
    }else{
        dis = (distance/1000).toFixed(1)+"km";
    }
    return dis;
}
//加载
function loadData(){
    var url = "";
    var args={
        page:pn,
        lon:ulng,
        lat:ulat,
        action:action
    };
    $.postJson(url,args,function(res){
        if(res.success){
            $(".loading").hide().attr("data-flag","0");
            var goods_list = res.shops;
            $("#shop_list").empty();
            var lis = "";
            for(var i=0; i<goods_list.length;i++){
                var shop = goods_list[i];
                if(cur_action==0){
                    lis += '<li data-id="'+shop.id+'"><dl class="shop-dl"><dd><img src="'+shop.shop_logo+'" alt="'+shop.shop_name+'"/></dd>'+
                        '<dt><p class="name"><span class="c999 f12 fr">'+getDist(shop.distance)+'</span>'+shop.shop_name+'</p><p class="addre mt15">'+shop.shop_address+'</p></dt></dl></li>';
                }else{
                    lis += '<li data-id="'+shop.id+'"><dl class="shop-dl"><dd><img src="'+shop.shop_logo+'" alt="'+shop.shop_name+'"/></dd>'+
                        '<dt><p class="name"><span class="c999 f12 fr">'+getDist(shop.distance)+'</span>'+shop.shop_name+'</p><p class="addre mt15">'+shop.shop_address+'</p></dt></dl>'+
                        '<div class="admin-text"><span class="fr c333">完成时间:'+shop.done_time+'</span><span class="c333">负责人:'+shop.curator+'</span></div></li>';
                }
            }
            $("#shop_list").append($(lis));
            pn++;
            $(window).scroll(function(){
                var winHeight = $(window).height()+$(window).scrollTop()+150;
                if(winHeight>=$("body").height() && isLoad){
                    $(".no-result").html("数据加载中...").show();
                    var args={
                        page:pn,
                        lon:ulng,
                        lat:ulat,
                        action:action
                    };
                    isLoad=false;
                    $.postJson(url,args,function(res) {
                        if (res.success) {
                            var goods_list = res.shops;
                            pn++;
                            isLoad=true;
                            if(goods_list.length==0){
                                $(".no-result").html("没有更多数据了");
                                isLoad=false;
                            }else{
                                var lis = "";
                                for(var i=0; i<goods_list.length;i++){
                                    var shop = goods_list[i];
                                    if(cur_action==0){
                                        lis += '<li data-id="'+shop.id+'"><dl class="shop-dl"><dd><img src="'+shop.shop_logo+'" alt="'+shop.shop_name+'"/></dd>'+
                                            '<dt><p class="name"><span class="c999 f12 fr">'+getDist(shop.distance)+'</span>'+shop.shop_name+'</p><p class="addre mt15">'+shop.shop_address+'</p></dt></dl></li>';
                                    }else{
                                        lis += '<li data-id="'+shop.id+'"><dl class="shop-dl"><dd><img src="'+shop.shop_logo+'" alt="'+shop.shop_name+'"/></dd>'+
                                            '<dt><p class="name"><span class="c999 f12 fr">'+getDist(shop.distance)+'</span>'+shop.shop_name+'</p><p class="addre mt15">'+shop.shop_address+'</p></dt></dl>'+
                                            '<div class="admin-text"><span class="fr c333">完成时间:'+shop.done_time+'</span><span class="c333">负责人:'+shop.curator+'</span></div></li>';
                                    }
                                }
                                $("#shop_list").append($(lis));
                                $(".no-result").hide();
                            }
                        }else{
                            Tip(res.error_text);
                        }
                    });
                }
            });
        }else{
            $(".loading").hide().attr("data-flag","0");
            Tip(res.error_text);
        }
    });
};
