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
        map.centerAndZoom(oPoint, 17);
        marker = new BMap.Marker(oPoint);
        map.addOverlay(marker);
        var infoWindow = new BMap.InfoWindow("地址："+address, opts);  // 创建信息窗口对象
        map.openInfoWindow(infoWindow,oPoint);
        marker.addEventListener("click", function(){
            map.openInfoWindow(infoWindow,oPoint); //开启信息窗口
        });
        var areatype = parseInt($("#bmap").attr("data-type"));
        if(areatype == 1){
            var spoint =  JSON.parse($("#bmap").attr("data-roundness"));
            var radius = parseInt($("#bmap").attr("data-radius"));
            var circle = new BMap.Circle(spoint,radius, {strokeColor:"blue", strokeWeight:1, strokeOpacity:0.5});
            map.addOverlay(circle);
        }else if(areatype == 2){
            var polygon = new BMap.Polygon(JSON.parse($("#bmap").attr("data-arealist")), {strokeColor:"blue", strokeWeight:2, strokeOpacity:0.5});
            map.addOverlay(polygon);
        }
    }else{
        var myGeo = new BMap.Geocoder();
        myGeo.getPoint(address, function (point) {
            if (point) {
                oPoint = point;
                map.centerAndZoom(point, 17);
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
}

var int=self.setInterval("clock()",100);
function clock() {
    $(".BMap_pop").children("div").eq(0).children("div").css({"background":"#333","border-top-left-radius":"10px"});
    $(".BMap_pop").children("div").eq(2).children("div").css({"background":"#333","border-top-right-radius":"10px"});
    $(".BMap_pop").children("div").eq(4).children("div").css({"background":"#333","border-bottom-left-radius":"10px"});
    $(".BMap_pop").children("div").eq(6).children("div").css({"background":"#333","border-bottom-right-radius":"10px"});
    $(".BMap_pop").children("div").eq(7).children("img").attr("src","/static/images/i.png");
}
