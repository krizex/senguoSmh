$(document).ready(function(){
    if(navigator.userAgent.indexOf("iPhone")>-1){
        $("#go-back").css("display","none");
    }
    $(".wrap-area-box").height($(window).height());
    initBmap();
}).on("click","#go-back",function(){
    history.go(-1);
});
//初始化百度地图
function initBmap() {
    var address = $.trim($("#bmap").attr("data-address"));
    var lon = parseFloat($("#bmap").attr("data-lon"));//经度
    var lat = parseFloat($("#bmap").attr("data-lat"));
    var name = $("#bmap").attr("data-name");
    var map = new BMap.Map("bmap");          // 创建地图实例
    var marker = null,oPoint = null;
    var opts = {
        width : 180,     // 信息窗口宽度
        height: 60,     // 信息窗口高度
        title : name , // 信息窗口标题
        opacity:0.6,
        enableMessage:false//设置允许信息窗发送短息
    };
    if (lon != 0) {
        oPoint = new BMap.Point(lon, lat);  // 创建点坐标
        map.enableScrollWheelZoom();
        map.centerAndZoom(oPoint, 15);
        marker = new BMap.Marker(oPoint);
        map.addOverlay(marker);
        var infoWindow = new BMap.InfoWindow("地址："+address, opts);  // 创建信息窗口对象
        map.openInfoWindow(infoWindow,oPoint);
        marker.addEventListener("click", function(){
            map.openInfoWindow(infoWindow,point); //开启信息窗口
        });
    }else{
        var myGeo = new BMap.Geocoder();
        myGeo.getPoint(address, function (point) {
            if (point) {
                oPoint = point;
                map.centerAndZoom(point, 19);
                marker = new BMap.Marker(point);
                map.addOverlay(marker);
                var infoWindow = new BMap.InfoWindow("地址："+address, opts);  // 创建信息窗口对象
                map.openInfoWindow(infoWindow,oPoint);
                marker.addEventListener("click", function(){
                    map.openInfoWindow(infoWindow,point); //开启信息窗口
                });
            }
        });
    }
    $(".BMap_pop").children("div").eq(0).children("div").css({"background":"#333","border-top-left-radius":"10px"});
    $(".BMap_pop").children("div").eq(1).children("div").css({"background":"#333","border-top-left-radius":"10px"});
}



