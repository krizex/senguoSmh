/**
 * Created by Administrator on 2015/7/6.
 */
var isLoad = true, pn = 1, cur_action="";
$(document).ready(function(){
    loadData("to_do");
}).on("click",".shop-list li",function(){
    var shop_id=$(this).data('id');
    var shop_code = $(this).attr("data-code");
    window.location.href="/market/shopinfo";
}).on("click",".tab-list li",function(){
    var index = $(this).index();
    $(".tab-list li").removeClass("active").eq(index).addClass("active");
    $(window).scrollTop(0);
    if(index==0){
        cur_action=0;
        loadData("to_do");
    }else{
        cur_action=1;
        loadData("has_done");
    }
}).on("click","#cur_address",function(){//刷新列表

});
/*根据经纬度获取地址*/
function getAddress(lng,lat){
    var point = new BMap.Point(lng,lat);
    var geoc = new BMap.Geocoder();
    geoc.getLocation(pt, function(rs){
        var addComp = rs.addressComponents;
        var address = addComp.city + " " + addComp.district + " " + addComp.street + " " + addComp.streetNumber;
        $("#address").html(address);
    });
}
//获取用户当前地理位置
function initLocation(){
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(function(position){
            var ulat = position.coords.latitude;
            var ulng = position.coords.longitude;//经度
            getAddress(ulng,ulat);
        },function(error){
            return Tip("请用手机浏览器，并开启定位功能");
        });
    }
}
//加载
function loadData(action){
    var url = "";
    var args={
        action:action
    };
    $.postJson(url,args,function(res){
        if(res.success){
            var goods_list = res.shops;
            $("#shop_list").empty();
            var lis = "";
            for(var i=0; i<goods_list.length;i++){
                var shop = goods_list[i];
                if(cur_action==0){
                    lis += '<li data-id="'+shop.id+'" data-code="'+shop.shop_code+'"><dl class="shop-dl"><dd><img src="/static/images/TDSG.png?imageView2/5/w/100/h/100" alt="'+shop.shop_name+'"/></dd>'+
                        '<dt><p class="name"><span class="c999 f12 fr">1.2km</span>'+shop.shop_name+'</p><p class="addre mt15">'+shop.shop_address+'</p></dt></dl></li>';
                }else{
                    lis += '<li data-id="'+shop.id+'" data-code="'+shop.shop_code+'"><dl class="shop-dl"><dd><img src="/static/images/TDSG.png?imageView2/5/w/100/h/100" alt="'+shop.shop_name+'"/></dd>'+
                        '<dt><p class="name"><span class="c999 f12 fr">1.2km</span>'+shop.shop_name+'</p><p class="addre mt15">'+shop.shop_address+'</p></dt></dl>'+
                        '<div class="admin-text"><span class="fr c333">完成时间:'+shop.done_time+'</span><span class="c333">负责人:'+shop.curator+'</span></div></li>';
                }
            }
            $("#shop_list").append($(lis));
            pn++;
            $(window).scroll(function(){
                var winHeight = $(window).height()+$(window).scrollTop()+150;
                if(winHeight>=$("body").height() && isLoad){
                    $(".no-result").html("数据加载中...").show();
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
                                        lis += '<li data-id="'+shop.id+'" data-code="'+shop.shop_code+'"><dl class="shop-dl"><dd><img src="/static/images/TDSG.png?imageView2/5/w/100/h/100" alt="'+shop.shop_name+'"/></dd>'+
                                            '<dt><p class="name"><span class="c999 f12 fr">1.2km</span>'+shop.shop_name+'</p><p class="addre mt15">'+shop.shop_address+'</p></dt></dl></li>';
                                    }else{
                                        lis += '<li data-id="'+shop.id+'" data-code="'+shop.shop_code+'"><dl class="shop-dl"><dd><img src="/static/images/TDSG.png?imageView2/5/w/100/h/100" alt="'+shop.shop_name+'"/></dd>'+
                                            '<dt><p class="name"><span class="c999 f12 fr">1.2km</span>'+shop.shop_name+'</p><p class="addre mt15">'+shop.shop_address+'</p></dt></dl>'+
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
            Tip(res.error_text);
        }
    });
};
