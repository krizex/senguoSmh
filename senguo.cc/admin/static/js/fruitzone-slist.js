$(document).ready(function(){

}).on("click","#search-btn",function(){
    $("#search-box").toggle();
});

//获取用户当前地理位置
function initLocation(){
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(function(position){
            ulat = position.coords.latitude;
            ulng = position.coords.longitude;

        },function(error){
            if(error.code == error.PERMISSION_DENIED){
                refuse_flag = false;
                console.log("您拒绝了地理位置信息服务");
            }
        });
    }
}
//根据省市名称获取code
function initProviceAndCityCode(p, c){
    var pCode = 0,cCode = 0;
    $.each(window.dataObj.area,function(name,value){
        if(value.name==p){
            pCode = name;
            if(value['city']){
                $.each(value.city,function(i,n){
                    if(n.name==c){
                        cCode = i;
                        return false;
                    }
                })
            }
            return false;
        }
    })
    return {pCode:pCode,cCode:cCode};
}
/*根据经纬度获取距离*/
function getDist(lat,lng){
    if(lat == 0) return false;
    var res = '';
    var pointA = new BMap.Point(ulat,ulng);  // 用户坐标
    var pointB = new BMap.Point(lat,lng);  // 店铺坐标
    var distance = map.getDistance(pointA,pointB);
    if(distance<1000){
        res = distance.toFixed(0)+"m";
    }else{
        res = (distance/1000).toFixed(1)+"km";
    }
    return res;
}

function filter(data,type,page){
   var action="filter";
   window.dataObj.page=1;
    var url="";
     if(!page){page=1}
    var args={
        action:action,
        page:page,
        service_area:$("#school_name").attr("data-key"),
        key_word:$("#comm_name").attr("data-key")
    };
    if(type=='city') {
        args.city=Int(data);
        window.dataObj.type=='city'
    }
    else if(type=='province') {
        args.province=Int(data);
        window.dataObj.type=='province'
    }
    if(!data){return noticeBox('选择城市！')}
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                remove_bg();
                $('.shoplist').empty();
                 var shops=res.shops;
                 nomore = res.nomore;
                 $('.list_item').addClass('hidden');
                 $('.city_choose').removeClass('city_choosed');
                 if(shops.length==0){
                    $('.shoplist').empty();
                    window.dataObj.maxnum=1;
                    $('.shoplist').append('<h4 class="text-center mt10 text-grey">无搜索结果！</h4>');
                 }
                else {
                      window.dataObj.action='filter';
                      window.dataObj.data=Int(data);
                     shopItem(shops,data); 
                }
            }
        else return noticeBox(res.error_text);
        },function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}

