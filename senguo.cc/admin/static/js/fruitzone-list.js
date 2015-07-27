var ulat = 0,ulng =0,first=true;
$(document).ready(function(){
    var link_action=$.getUrlParam('action');
    if(link_action){
        if(link_action=='shop'){
            $(".filter_search").addClass("hidden");
            $(".area_box").css("padding-top","40px");
            var shops=$('.shoplist').attr('data-shop');
            var id=$.getUrlParam('id');
            return shopsList(0,id,'admin_shop');
        }
    }else{
        var q = decodeURIComponent(decodeURIComponent($.getUrlParam('q')));
        if(q && q!="null"){
            Search(q);
        }else{
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
        var key_word = parseInt($(this).attr("data-key"));
        $("#comm_name").text($(this).html()).attr("data-key",key_word);
        $(this).closest("ul").hide();
        if(ulat==0 && key_word==2){
            initLocation();
        }else{
            filter($('.city_name').attr('data-id'));
        }
    });
});

//获取用户当前地理位置
function initLocation(){
    first=false;
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(function(position){
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;//经度
            var gpsPoint = new BMap.Point(lng,lat);
            BMap.Convertor.translate(gpsPoint,0,function(point){
                ulng = point.lng;
                ulat = point.lat;
                var point = new BMap.Point(ulng,ulat);
                var geoc = new BMap.Geocoder();
                geoc.getLocation(point, function(rs){
                    var addComp = rs.addressComponents;
                    initProviceAndCityCode(addComp.province, addComp.city);
                    $(".city_name").text(addComp.city);
                    window.dataObj.type='city';
                    filter($("#city_id").val());
                });
            });
        },function(error){
            if(error.code == error.PERMISSION_DENIED){
                //console.log("您拒绝了地理位置信息服务");
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
function getDist(dis){
    var res = 0;
    if(dis<1000){
        res = dis.toFixed(0)+"m";
    }else{
        res = (dis/1000).toFixed(1)+"km";
    }
    return res;
}
function add_bg(){
    $('.area_box').addClass('area_sty');
    $('body').css({'overflow':'hidden'});
}
function remove_bg(){
    $('.area_box').removeClass('area_sty');
    $('body').css({'overflow':'auto'});
}
var shopItem=function (shops){
    for(var i=0; i<shops.length; i++){
        var $item = $('<li class="item bg-white">'+
            '<a href="" class="shop_link">'+
            '<div class="shop-status"></div>'+
            '<div class="clearfix pr">'+
            '<div class="logo_box pull-left">'+
            '<img src="" class="shop_logo lazy_img"/>'+
            '</div>'+
            '<div class="pull-left info">'+
            '<p class="shop_name font14"><span class="shop_auth"></span></p>'+
            '<p class="shop_attr">满意度 <span class="shop_satisfy"></span>&nbsp;&nbsp;&nbsp;评价 <span class="shop_comment_cont"></span>&nbsp;&nbsp;&nbsp;商品数 <span class="shop_goods_count"></span></p>'+
            '<p class="text-grey9 adre-box"><span class="distance"></span><i class="location"></i><span class="shop_code"></span></p>'+
            '</div>'+
            '</div>'+
            '</a>'+
            '</li>');
        var logo_url=shops[i].shop_trademark_url;
        var name=shops[i].shop_name;
        var shop_code=shops[i].shop_code;
        var address=shops[i].shop_address_detail;
        var intro=shops[i].shop_intro;
        var shop_auth=shops[i].shop_auth;
        var satisfy = shops[i].satisfy;
        var comment_count = shops[i].comment_count;
        var goods_count = shops[i].goods_count;
        var status = shops[i].status;
        var lat = shops[i].lon;//经度
        var lon = shops[i].lat;//纬度
        var distance = shops[i].distance;
        var hide='';
        var statu = '';
        var dishide = '';
        var link = '/'+shop_code;
        if(!lat || lat == 0 || !ulat || ulat == 0){
            dishide = "hidden";
        }else{
            distance = getDist(distance);
        }
        if(status == 2){
            statu = 'shop-waiting';
            link = 'javascript:;';
        }else if(status == 3){
            statu = 'shop-rest';
        }
        if(!logo_url) {
            logo_url='/static/design_img/Li_l.png';
        }
        if(shop_auth>0){
            shop_auth='已认证';
        }else {
            hide='hidden';
        }
        $item.find('.shop_link').attr("href",link);
        $item.find(".shop-status").addClass(statu);
        $item.find(".shop_logo").attr("src",logo_url+'?imageView2/1/w/100/h/100');
        $item.find(".shop_name").html(name);
        $item.find(".shop_auth").html(shop_auth);
        if(hide=='hidden'){
            $item.find(".shop_auth").addClass("hidden");
        }
        $item.find(".shop_satisfy").html(satisfy);
        $item.find(".shop_comment_cont").html(comment_count);
        $item.find(".shop_goods_count").html(goods_count);
        $item.find(".shop_code").html(address);
        $item.find(".distance").html(distance);
        if(dishide == "hidden"){
            $item.find(".distance").addClass("hidden");
        }
        $('.shoplist').append($item);
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
    if(ulat!=0){
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
        if(res.success){
            initData(res);
        }else{
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
        if(shops.length==0){
            window.dataObj.finished=false;
            $('.loading').hide();
            $('.no_more').show();
        }else{
            shopItem(shops);
            $('.loading').hide();
            $('.no_more').hide();
            window.dataObj.finished=true;
        }
    }
};
window.dataObj.finished=true;
var scrollLoading=function(){
    $(window).scroll(function(){
        var totalheight = $(window).height() + $(window).scrollTop() +150;
        if(window.dataObj.finished && $(".container").height() <= totalheight) {
            $('.loading').show();
            $('.no_more').hide();
            window.dataObj.finished=false;
            window.dataObj.page++;
            shopsList(window.dataObj.page,window.dataObj.data,window.dataObj.action);
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
                    $('.shoplist').append('<h4 class="text-center mt10 text-grey">没有搜索到店铺</h4>');
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
    if(ulat != 0){
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
                if(first){
                    setTimeout(function(){
                        initLocation();
                    },10);
                }
                $(".wrap-loading-box").addClass("hidden");
                remove_bg();
                var shops=res.shops;
                $('.list_item').addClass('hidden');
                $('.city_choose').removeClass('city_choosed');
                $('.shoplist').empty();
                if(shops.length==0){
                    window.dataObj.finished = false;
                }else{
                    window.dataObj.finished = true;
                    window.dataObj.action='filter';
                    window.dataObj.data=Int(data);
                    shopItem(shops);
                }
            }else{
                $(".wrap-loading-box").addClass("hidden");
                return noticeBox(res.error_text);
            }
        },function(){$(".wrap-loading-box").addClass("hidden");},
        function(){$(".wrap-loading-box").addClass("hidden");}
    );
}
