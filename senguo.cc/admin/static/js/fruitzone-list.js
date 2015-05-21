var pCode = 0,cCode = 0;
$(document).ready(function(){
    var city_id = $("#city_id").val();
    //search
    $(document).on('click','#searchSubmit',function(evt){Search(evt);});
    $('.willOpen').on('click',function(){noticeBox('即将开放，敬请期待！')});
    //shop info
    if(city_id){
        window.dataObj.action='filter';
        window.dataObj.type='city';
        shopsList(1,city_id,'filter');
    }else{
        shopsList(1,'',window.dataObj.action);
    }
    scrollLoading();
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
            $('.city_name').text(province_name);
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
        $('.city_name').text(city_name);
        filter(city_code,'city');
    });
    //all city
     $(document).on('click','.all_city',function(){
        var $this=$(this);
        var province_code=$this.attr('data-code');
        var province_name=$this.attr('data-name');
        window.dataObj.type='province';
        $('.city_name').text(province_name);
        filter(province_code,'province');
    });
    //whole country
     $(document).on('click','.whole_country',function(){
        window.dataObj.action='shop';
        remove_bg();
        $('.shoplist').empty();
        shopsList(1,'',window.dataObj.action);
        $('.list_item').addClass('hidden');
        $('.city_choose').removeClass('city_choosed');
        $('.city_name').text('城市');
    });
});

//获取用户当前地理位置
function initLocation(){
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(function(position){
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;

        },function(error){
            if(error.code == error.PERMISSION_DENIED){
                console.log("您拒绝了地理位置信息服务");
            }
        });
    }
}
//根据省市名称获取code
function initProviceAndCityCode(p, c){
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
                                    '<p class="text-grey9"><i class="location"></i><span class="shop_code">{{address}}</span></p>'+
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
                var area=window.dataObj.area;
                var hide='';
                var statu = '';
                if(province==city) {
                    city='';
                }
                if(status == 2){
                    statu = 'shop-waiting';
                }else if(status == 3){
                    statu = 'shop-rest';
                }
                for(var key in area){
                    if(key==province){
                        province=area[key]['name']
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
                    link:'/'+shop_code,
                    logo_url:logo_url+'?imageView/1/w/100/h/100',
                    shop_name:name,
                    shop_code:shop_code,
                    shop_auth:shop_auth,
                    address:province+city+address,
                    satisfy:satisfy,
                    comment_count:comment_count,
                    goods_count:goods_count,
                    intro:intro,
                    hide:hide,
                    statu:statu
                });
                $('.shoplist').append(content);
            }
}
window.dataObj.page=1;
window.dataObj.finished=true;
window.dataObj.action='shop';
window.dataObj.type='city';
var nomore = false;
var shopsList=function(page,data,action){
    var url='';
    var action =action;
    var args={
        action:action,
        page:page
    };
    if(action=='filter') {
        if(window.dataObj.type=='city') {args.city=data}
        else if(window.dataObj.type=='province') {args.province=data}
    }
    else if(action=='search') {
        args.q=data
    }
    $.postJson(url,args,function(res){
        if(res.success)
        {
                initData(res);
                nomore =res.nomore;
        }
        else return noticeBox(res.error_text);
        },function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~');}
        );
    var initData=function(res){
        var shops=res.shops;
            window.dataObj.maxnum=res.page_total;
            shopItem(shops);
            $('.loading').hide();
            window.dataObj.finished=true;
    }
};

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

function Search(evt,page){
    evt.preventDefault();
    window.dataObj.page=1;
    var q=$('#searchKey').val().trim();
    var action="search";
    var url="";
    if(!page){page=1}
    var args={
        q:q,
        action:action,
        page:page
    }
    if(!q){return noticeBox('请输入店铺名！')}
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

function filter(data,type,page){
   var action="filter";
   window.dataObj.page=1;
    var url="";
     if(!page){page=1}
    var args={
        action:action,
        page:page
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

