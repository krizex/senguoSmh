var ulat = 0,ulng =0,refuse_flag = true,loc_flag=false;
$(document).ready(function(){
    var link_action=$.getUrlParam('action');
    if(link_action){
        if(link_action=='shop'){
            $(".filter_search").addClass("hidden");
            $(".area_box").css("padding-top","40px");
            var shops=$('.shoplist').attr('data-shop');
            var id=$.getUrlParam('id');
            shopsList(0,id,'admin_shop');
        }
    }else{
        var q = decodeURIComponent(decodeURIComponent($.getUrlParam('q')));
        if(q && q!="null"){
            Search(q);
        }else{
            initLocation();
            var city_id = $("#city_id").val();
            if(city_id){
                window.dataObj.action='filter';
                window.dataObj.type='city';
                filter(city_id);
            }else{
                filter();
            }
        }
    }
    scrollLoading();
    //search
    $(document).on('click','#searchSubmit',function(evt){Search(evt);});
    //shop info
    //province and city
    var area=window.dataObj.area;
    //province data
    for(var key in area){
        var $item=$('<li><span class="name pull-left ml10"></span><em class="arrow pull-right mr10"></em><span class="num pull-right mr10"></span></li>');
        var city=area[key]['city'];
        if(city) city='true';
        else city='false';
        $item.attr({'data-code':key,'data-city':city}).find('.name').text(area[key]['name']);
        $('.provincelist').append($item);
    }
    //province shop number
    $('.provincelist li').each(function(){
        var $this=$(this);
        var code=$this.attr('data-code');
        var shop_num=window.dataObj.province_count;
        for(var key in shop_num){
            var p_code=shop_num[key][0];
            if(p_code==code){
                $this.find('.num').text(shop_num[key][1]);
            }
        }
        var p_num=$this.find('.num').text();
        if(!p_num) $this.find('.num').text(0);
    });
    //choose province
    $(document).on('click','.provincelist li',function(){
        var $this=$(this);
        var province_code=$this.attr('data-code');
        var province_name=$this.find('.name').text();
        var if_city=$this.attr('data-city');
        var pro_num=$this.find('.num').text();
        $('.all_city').attr({'data-code':province_code,'data-name':province_name}).find('.num').text(pro_num);
        $('.city_list').removeClass('hidden');
        if(if_city=='true'){
             $('.citylist').empty();
            for(var key in area){
                var city=area[key]['city'];
                if(key==province_code&&city){
                    for(var code in city){
                        var $item=$('<li><span class="name"></span><span class="num"></span></li>');
                        $item.attr({'data-code':code}).find('.name').text(city[code]['name']);
                         $('.citylist').append($item);
                    }
                }
            }
        }
        else{
            $('.city_name').text(province_name).attr("data-id",province_code);
            filter(province_code,'province');
        }
    });
    //close choose list
    $(document).on('click',function(e){
        if($(e.target).closest('.dismiss').length == 0){
            $('.list_item').addClass('hidden');
            $('.city_choose').removeClass('city_choosed');
            remove_bg();
        }
    });
    //city filter
    $(document).on('click','.city_choose',function(){
        var $this=$(this);
         if($this.hasClass('city_choosed')){
            remove_bg();
            $('.list_item').addClass('hidden');
            $this.removeClass('city_choosed');
         }
         else{
             add_bg();
            $('.province_list').removeClass('hidden');
            $this.addClass('city_choosed');
         }
    });
    $(document).on('click','.city_list li',function(){
        var $this=$(this);
        var city_code=$this.attr('data-code');
        var city_name=$this.find('.name').text();
        window.dataObj.type='city';
        $('.city_name').text(city_name).attr("data-id",city_code);
        filter(city_code,'city');
    });
    //all city
     $(document).on('click','.all_city',function(){
        var $this=$(this);
        var province_code=$this.attr('data-code');
        var province_name=$this.attr('data-name');
        window.dataObj.type='province';
        $('.city_name').text(province_name).attr("data-id",province_code);
        filter(province_code,'province');
    });
    //whole country
     $(document).on('click','.whole_country',function(){
        window.dataObj.action='shop';
        remove_bg();
        $('.shoplist').empty();
         filter();
        $('.list_item').addClass('hidden');
        $('.city_choose').removeClass('city_choosed');
        $('.city_name').text('全国').attr("data-id",'');
    });
    //条件选择
    $(document).on("click",".school,.comme",function(){
        $(this).children(".c-list").toggle();
    });
    $(document).on("click",function(e){
        if($(e.target).closest(".school").length==0){
            $(".school").children(".c-list").hide();
        }
        if($(e.target).closest(".comme").length==0){
            $(".comme").children(".c-list").hide();
        }
    });
    //选择区域
    $(document).on("click",".s-list li",function(){
        var service_area = $(this).attr("data-key");
        $("#school_name").text($(this).html()).attr("data-key",service_area);
        $(this).closest("ul").hide();
        filter($('.city_name').attr('data-id'));
    });
    //选择规则
    $(document).on("click",".com-list li",function(){
        var key_word = $(this).attr("data-key");
        $("#comm_name").text($(this).html()).attr("data-key",key_word);
        $(this).closest("ul").hide();
        loc_flag = false;
        if(refuse_flag==false){
            initLocation();
        }else{
            if(parseInt(key_word)==2){
                loc_flag = true;
            }
            filter($('.city_name').attr('data-id'));
        }
    });
});

//获取用户当前地理位置
function initLocation(){
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(function(position){
            refuse_flag = true;
            ulat = position.coords.latitude;
            ulng = position.coords.longitude;//经度
            var point = new BMap.Point(ulng,ulat);
            var geoc = new BMap.Geocoder();
            geoc.getLocation(point, function(rs){
                var addComp = rs.addressComponents;
                initProviceAndCityCode(addComp.province, addComp.city);
                $(".city_name").text(addComp.city);
                window.dataObj.type='city';
                filter($("#city_id").val());
            });
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
    $.each(window.dataObj.area,function(name,value){
        if(value.name==p){
            window.dataObj.type = 'province';
            $("#city_id").val(name);
            $(".city_name").attr("data-id",name);
            if(value['city']){
                $.each(value.city,function(i,n){
                    if(n.name==c){
                        $("#city_id").val(i);
                        $(".city_name").attr("data-id",i);
                        window.dataObj.type = 'city';
                        return false;
                    }
                })
            }
            return false;
        }
    })
}
/*根据经纬度获取距离*/
function getDist(lat,lng){
    if(!lat || lat == 0) return false;
    var res = '';
    var map = new BMap.Map("map");
    var pointA = new BMap.Point(ulng,ulat);  // 用户坐标
    var pointB = new BMap.Point(lat,lng);  // 店铺坐标
    var distance = map.getDistance(pointA,pointB);
    if(distance<1000){
        res = distance.toFixed(0)+"m";
    }else{
        res = (distance/1000).toFixed(1)+"km";
    }
    return res;
}
function add_bg(){
    $('.area_box').addClass('area_sty');
    $('body').css({'overflow':'hidden'}).attr({'onmousewheel':'return false'});
}
function remove_bg(){
    $('.area_box').removeClass('area_sty');
    $('body').css({'overflow':'auto'}).attr({'onmousewheel':''});
}

var shopItem=function (shops){
    var $item = '<li class="item bg-white">'+
                            '<a href="{{link}}" class="shop_link">'+
                            '<div class="shop-status {{statu}}"></div>'+
                            '<div class="clearfix pr">'+
                                '<div class="logo_box pull-left">'+
                                    '<img src="{{logo_url}}" class="shop_logo lazy_img"/>'+
                                '</div>'+
                                '<div class="pull-left info">'+
                                    '<p class="shop_name font14">{{shop_name}}<span class="shop_auth  {{hide}}">{{shop_auth}}</span></p>'+
                                    '<p class="shop_attr">满意度 {{satisfy}}&nbsp;&nbsp;&nbsp;评价 {{comment_count}}&nbsp;&nbsp;&nbsp;商品数 {{goods_count}}</p>'+
                                    '<p class="text-grey9 adre-box"><span class="distance {{dishide}}">{{distance}}</span><i class="location"></i><span class="shop_code">{{address}}</span></p>'+
                                '</div>'+
                            '</div>'+
                            //'<p class="sty1 shop-intro">店铺简介：<span class="intro">{{intro}}</span></p>'+
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
                if(!lat || lat == 0 || !ulat || ulat == 0){
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
                    logo_url:logo_url+'?imageView2/1/w/100/h/100',
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
window.dataObj.action='shop';
window.dataObj.type='city';
var nomore = false;
var shopsList=function(page,data,action){
    var url='';
    var action =action;
    var args={
        action:action,
        page:page,
        service_area:$("#school_name").attr("data-key"),
        key_word:$("#comm_name").attr("data-key")
    };
    if(action=='filter') {
        if(window.dataObj.type=='city') {args.city=data}
        else if(window.dataObj.type=='province') {args.province=data}
    }
    if(loc_flag){
        args.lat = ulat;
        args.lon = ulng;
    }
    else if(action=='search') {
        args.q=data
    }
    else if(action=='admin_shop'){
        args.id=data;
    }
    $.postJson(url,args,function(res){
            if(res.success)
            {
                initData(res);
                nomore = res.nomore;
            }
        else {
            return noticeBox(res.error_text);
        }
        },function(){
            return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){
            return noticeBox('服务器貌似出错了~ ( >O< ) ~');
        }
        );
    var initData=function(res){
        var shops=res.shops;
            window.dataObj.maxnum=res.page_total;
            shopItem(shops);
            $('.loading').hide();
            $('.no_more').hide();
            if(nomore){
                window.dataObj.finished=false;
            }else{
                window.dataObj.finished=true;
            }

    }
};
window.dataObj.finished=true;
var scrollLoading=function(){
    var range = 60;             //距下边界长度/单位px          //插入元素高度/单位px
    var totalheight = 0;
    var main = $(".container");                  //主体元素
    $(window).scroll(function(){
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);
        if(window.dataObj.finished&&(main.height()-range) <= totalheight  && nomore==false) {
            $('.loading').show();
            $('.no_more').hide();
            window.dataObj.finished=false;
            window.dataObj.page++;
            shopsList(window.dataObj.page,window.dataObj.data,window.dataObj.action);
        }
        else if(window.dataObj.finished==false && nomore==true){
              $('.loading').hide();
              $('.no_more').show();
        }
    });
}

function Search(q){
    window.dataObj.page=1;
    var q=q;
    window.dataObj.action = "search";
    var action="search";
    var url="";
    var page = window.dataObj.page;
    var args={
        q:q,
        action:action,
        page:page
    }
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                $('.shoplist').empty();
                 var shops=res.shops;
                 nomore = res.nomore;
                if(shops.length==0){
                    window.dataObj.maxnum=1;
                    $('.shoplist').append('<h4 class="text-center mt10 text-grey">无搜索结果！</h4>');
                 }
                else {
                    window.dataObj.action='search';
                    window.dataObj.data=q;
                    shopItem(shops);
                }
            }
            else return noticeBox(res.error_text);
        },function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}
function filter(data){
   $(".wrap-loading-box").removeClass("hidden");
   var type = window.dataObj.type;
    window.dataObj.action="filter";
   var action="filter";
   window.dataObj.page=1;
    var page = window.dataObj.page;
    var url="";
    var args={
        action:action,
        page:page,
        service_area:$("#school_name").attr("data-key"),
        key_word:$("#comm_name").attr("data-key")
    };
    if(loc_flag){
        args.lat = ulat;
        args.lon = ulng;
    }
    if(data){
        if(type=='city') {
            args.city=Int(data);
            window.dataObj.type=='city';
        }
        else if(type=='province') {
            args.province=Int(data);
            window.dataObj.type=='province';
        }
    }
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                remove_bg();
                 var shops=res.shops;
                 nomore = res.nomore;
                 $('.list_item').addClass('hidden');
                 $('.city_choose').removeClass('city_choosed');
                 if(shops.length==0){
                    window.dataObj.finished = false;
                    window.dataObj.maxnum=1;
                    $('.shoplist').append('<h4 class="text-center mt10 text-grey">无任何结果！</h4>');
                 }
                else {
                    if(nomore){
                        window.dataObj.finished = false;
                    }else{
                        window.dataObj.finished = true;
                    }
                      window.dataObj.action='filter';
                      window.dataObj.data=Int(data);
                      $('.shoplist').empty();
                     shopItem(shops);
                }
                $(".wrap-loading-box").addClass("hidden");
            }else{
                $(".wrap-loading-box").addClass("hidden");
                return noticeBox(res.error_text);
            }
        },function(){$(".wrap-loading-box").addClass("hidden"); return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){$(".wrap-loading-box").addClass("hidden"); return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}
