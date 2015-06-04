var ulat = 0,ulng = 0,refuse_flag = true,loc_flag=false;
$(document).ready(function(){
    $(document).on('click','#searchSubmit',function(evt){Search(evt);});
    scrollLoading();
    $("#searchKey").on("keyup",function(e){
        if($(this).val().trim()==""){
        }else{
            qsearch();
        }
    });
    $("#back").on("click",function(){
        history.go(-1);
    })
});
var shopItem=function (shops){
    var shop_item=window.dataObj.shop_item;
    var $item = '<li class="item bg-white">'+
        '<a href="{{link}}" class="shop_link">'+
        '<div class="shop-status {{statu}}"></div>'+
        '<div class="clearfix pr">'+
        '<div class="logo_box pull-left">'+
        '<img src="{{logo_url}}" class="shop_logo lazy_img"/>'+
        '</div>'+
        '<div class="pull-left info">'+
        '<p class="shop_name font14">{{shop_name}}<span class="shop_auth  {{hide}}">{{shop_auth}}</span></p>'+
        '<p class="shop_attr">满意度 {{satisfy}} | 评价 {{comment_count}} | 商品数 {{goods_count}}</p>'+
        '<p class="text-grey9 adre-box"><span class="distance {{dishide}}">{{distance}}</span><i class="location"></i><span class="shop_code">{{address}}</span></p>'+
        '</div>'+
        '</div>'+
        '<p class="sty1 shop-intro">店铺简介：<span class="intro">{{intro}}</span></p>'+
        '</a>'+
        '</li>';
    for(var key in shops){
        var logo_url=shops[key]['shop_trademark_url'];
        var name=shops[key]['shop_name'];
        var shop_code=shops[key]['shop_code'];
        var province=shops[key]['shop_province'];
        var city=shops[key]['shop_city'];
        var address=shops[key]['shop_address_detail'];
        var intro=shops[key]['shop_intro'];
        var shop_auth=shops[key]['shop_auth'];
        var satisfy = shops[key]['satisfy'];
        var comment_count = shops[key]['comment_count'];
        var goods_count = shops[key]['goods_count'];
        var status = shops[key]['status'];
        var lat = shops[key]['lon'];//经度
        var lon = shops[key]['lat'];//纬度
        var area=window.dataObj.area;
        var hide='';
        var statu = '';
        var dishide = '';
        var distance = '';
        var link = '/'+shop_code;
        if(lat == 0 || ulat == 0){
            dishide = "hidden";
        }else{
            distance = getDist(lat,lon);
        }
        if(province==city) {
            city='';
        }
        if(status == 2){
            statu = 'shop-waiting';
            link = 'javascript:;';
        }else if(status == 3){
            statu = 'shop-rest';
        }
        for(var key in area){
            if(key==province){
                province=area[key]['name'];
                if(city!=''){
                    var cities=area[key]['city'];
                    for(var code in cities){
                        if(code==city){
                            city=cities[code]['name'];
                        }
                    }
                }
            }
        }
        if(!logo_url) {
            logo_url='/static/design_img/Li_l.png';
        }
        if(shop_auth>0){
            shop_auth='已认证';
        }
        else {
            hide='hidden';
        }
        var render=template.compile($item);
        var content=render({
            link:link,
            logo_url:logo_url+'?imageView/1/w/100/h/100',
            shop_name:name,
            shop_code:shop_code,
            shop_auth:shop_auth,
            address:city+address,
            satisfy:satisfy,
            comment_count:comment_count,
            goods_count:goods_count,
            intro:intro,
            hide:hide,
            statu:statu,
            dishide:dishide,
            distance:distance
        });
        $('.shoplist').append(content);
    }
}
window.dataObj.page=1;
window.dataObj.finished=true;
window.dataObj.action='shop';
window.dataObj.type='city';
var nomore = false;
var scrollLoading=function(){
    var range = 60;             //距下边界长度/单位px          //插入元素高度/单位px
    var totalheight = 0;
    var main = $(".container");                  //主体元素
    $(window).scroll(function(){
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);
        if(window.dataObj.finished&&(main.height()-range) <= totalheight  && nomore==false) {
            $('.no_more').hide();
            $('.loading').show();
            window.dataObj.finished=false;
            window.dataObj.page++;
            shopsList(window.dataObj.page,window.dataObj.data,window.dataObj.action);
        }
        else if(nomore==true){
            $('.loading').hide();
            $('.no_more').show();
        }
    });
}
function qsearch(){
    var q=$('#searchKey').val().trim();
    var action="qsearch";
    var url="/list";
    var args={
        q:q,
        action:action
    }
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                $('.shoplist').empty();
                var shops=res.shops;
                if(res.shops==''){
                    $('.shoplist').empty();
                }
                else {
                    window.dataObj.action='search';
                    window.dataObj.data=q;
                    shopItem(shops,q);
                }
            }
            else return noticeBox(res.error_text);
        }
    );
}
function Search(evt,page){
    evt.preventDefault();
    window.dataObj.page=1;
    var q=$('#searchKey').val().trim();
    var action="search";
    var url="/list";
    if(!page){page=1}
    var args={
        q:q,
        action:action,
        page:page
    }
    if(!q){return noticeBox('请输入关键字！')}
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                $('.shoplist').empty();
                var shops=res.shops;
                nomore = res.nomore;
                if(res.shops==''){
                    $('.shoplist').empty();
                    window.dataObj.maxnum=1;
                    $('.shoplist').append('<h4 class="text-center mt10 text-grey">无搜索结果！</h4>');
                }
                else {
                    window.dataObj.action='search';
                    window.dataObj.data=q;
                    shopItem(shops,q);
                }
            }
            else return noticeBox(res.error_text);
        },function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}

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
    if(!lat || lat == 0) return false;
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

