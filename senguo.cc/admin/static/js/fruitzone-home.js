$(document).ready(function(){
    $('.filter-box a').on('click',function(){$(this).addClass('active').siblings().removeClass('active');});
    $('#searchSubmit').on('click',function(evt){Search(evt);});
    $('#province-select').find('li').on('click',function(){
        if($('#city-select ul').find('li').length==0)
        {
            Filter($(this));
        }
        else $('.city-select').find('li').each(function(){$(this).on('click',function(){Filter($(this));});});
    });

    /* 这种实现点击事件处理的方法效率低，建议采用事件代理，可以参考这篇文章：http://chajn.org/project/javascript-events-responding-user/
     */

    $('.order-by-fruit').find('li').each(function(){$(this).on('click',function(){$(this).toggleClass('active');});});
    $('.order-by-area').find('li').each(function(){$(this).on('click',function(){Filter($(this));});});
    $('.order-by-time').find('li').each(function(){$(this).on('click',function(){Filter($(this));});});
    $('#orderByFruit').on('click',function(){Filter($(this));});

    var skip_num=0;
    if(skip_num==0){$('#PrePage').parents('li').hide();}
    $('#PrePage').on('click',function(){
        $('#NextPage').parents('li').show();
        skip_num-=list_item_num;
        if(skip_num<=0)
        {
            skip_num=0;
            $('#PrePage').parents('li').hide();
        }
        $(this).attr({"data-code":skip_num});
        Filter($(this));

    });
    $('#NextPage').on('click',function(){
            skip_num+=list_item_num;
            $(this).attr({"data-code":skip_num});
            Filter($(this));
            $('#PrePage').parents('li').show();
            if(list_num.length<list_item_num){$('#NextPage').parents('li').hide();}
            else $('#NextPage').parents('li').show();
    });
    $('.willOpen').on('click',function(){alert('即将开放，敬请期待！')});

});

function Search(evt){
    evt.preventDefault();
    var q=$('#searchKey').val().trim();
    var action="search";
    var url="/fruitzone/";
    var args={
        q:q,
        action:action

    };

    if(!q){return alert('请输入店铺名！')}

    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                $('#homeShopList').empty();
                var shops=res.shops;
                list_num=res.shops;
                console.log(list_num.length);
                if(list_num.length<list_item_num)
                {
                    $('#NextPage').parents('li').hide();
                    $('#PrePage').parents('li').hide();
                }
                for(var shop in shops)
                {
                    var timenow=new Date().getTime()/1000;
                    var shopid=shops[shop]["id"];
                    var shoplogo=shops[shop]['shop_trademark_url'];
                    var shopname =shops[shop]["shop_name"];
                    var livetime=shops[shop]['shop_start_timestamp'];
                    var province=shops[shop]['shop_province'];
                    var city=shops[shop]['shop_city'];
                    var livemonth=parseInt((timenow-livetime)/(30*24*60*60));
                    var nickname=shops[shop]["admin"]["accountinfo"]["nickname"];
                    var wxusername=shops[shop]["admin"]["accountinfo"]["wx_username"];
                    var protext=provinceArea(province);
                    var cittext;
                    if(city!=province){cittext=cityArea(province,city);}
                    else{cittext=''}
                    if(!wxusername){wxusername='无'}
                    var $list=$('<li><a href="/fruitzone/shop/'+shopid+'"><div class="shop-logo pull-left"><img src=""/></div><div class="shop-info pull-left"><p class="list-info1"><span class="shop-name w1 pull-left"></span><span class="w2 area pull-left"><em data="'+province+'" id="filterProvince"></em><em data="'+city+'" id="filterCity"></em></span></p><p class="list-info2">运营时间：<span class="live-time"></span>月</p><p class="list-info3"><span class="shop-owner w1 pull-left">负责人：<span class="owner-name"></span></span><span class="w2 wechat-code pull-left"></span></p></div></a></li>');
                    if(!shoplogo){$list.find(".shop-logo").find('img').attr({'src':'/static/images/anoa-7-md.gif'});}
                    else $list.find(".shop-logo").find('img').attr({'src':shoplogo+'?imageView2/1/w/130/h/130'});
                    $list.find(".shop-name").text(shopname);
                    $list.find("#filterProvince").text(protext);
                    $list.find("#filterCity").text(cittext);
                    $list.find(".live-time").text(livemonth);
                    $list.find(".owner-name").text(nickname);
                    $list.find(".wechat-code").text(wxusername);
                    $('#homeShopList').append($list);

                }
            }
            if(res.success&&res.shops=='')
            {
                $('#homeShopList').empty();
                $('#homeShopList').append('<h5 class="text-center">无搜索结果！</h5>');
            }
        },
        function(){
            alert('网络错误！');
        }
    );
}

var list_num=[];
var list_item_num=$('#homeShopList').find('li').length;
function Filter(evt){
    var action='filter';
    var city=evt.data('code');
    var service_area=evt.data('code');
    var live_month=evt.data('code');
    var skip=evt.attr('data-code');
    var onsalefruit_ids=[];
    var fruit=$('.order-by-fruit').find('.active');
    for(var i=0;i<fruit.length;i++)
    {
        var code=fruit.eq(i).data('code');
        onsalefruit_ids.push(code);
    }
    var url="";
    var order=evt.parents('.order-by-list').find('.order-by-item').data('action');
    if(order=='cityFilter')
        {var args = {city: city,action: action}}
    else if(order=='areaFilter')
        {var args = {service_area: service_area,action: action}}
    else if(order=='liveFilter')
        {var args = {live_month: live_month,action: action}}
    else if(order=='fruitFilter')
        {var args = {onsalefruit_ids: onsalefruit_ids,action: action};}
    else if(order=='skipFilter')
        {var args = {skip:skip,action: action};$.ajaxSetup({async: false})}
    $.postJson(url,args,
        function(res){
            if(res.success) {
                list_num=res.shops;
                console.log(list_num.length);
                if(list_num.length<list_item_num)
                    {
                        $('#NextPage').parents('li').hide();
                        $('#PrePage').parents('li').hide();
                    }
                else  $('#NextPage').parents('li').show();
                console.log(list_num);
                evt.parents('.order-by-list').hide();
                $('.home-pagination').show();
                $('#homeShopList').empty();
                var shops = res.shops;
                for (var shop in shops)
                {
                    var timenow=new Date().getTime()/1000;
                    var shopid=shops[shop]["id"];
                    var shoplogo=shops[shop]['shop_trademark_url'];
                    var shopname =shops[shop]["shop_name"];
                    var livetime=shops[shop]['shop_start_timestamp'];
                    var province=shops[shop]['shop_province'];
                    var city=shops[shop]['shop_city'];
                    var livemonth=parseInt((timenow-livetime)/(30*24*60*60));
                    var nickname=shops[shop]["admin"]["accountinfo"]["nickname"];
                    var wxusername=shops[shop]["admin"]["accountinfo"]["wx_username"];
                    var protext=provinceArea(province);
                    var cittext;
                    if(city!=province){cittext=cityArea(province,city);}
                    else{cittext=''}
                    if(!wxusername){wxusername='无'}
                    var $list=$('<li><a href="/fruitzone/shop/'+shopid+'"><div class="shop-logo pull-left"><img src=""/></div><div class="shop-info pull-left"><p class="list-info1"><span class="shop-name w1 pull-left"></span><span class="w2 area pull-left"><em data="'+province+'" id="filterProvince"></em><em data="'+city+'" id="filterCity"></em></span></p><p class="list-info2">运营时间：<span class="live-time"></span>月</p><p class="list-info3"><span class="shop-owner w1 pull-left">负责人：<span class="owner-name"></span></span><span class="w2 wechat-code pull-left"></span></p></div></a></li>');
                    if(!shoplogo){$list.find(".shop-logo").find('img').attr({'src':'/static/images/anoa-7-md.gif'});}
                    else $list.find(".shop-logo").find('img').attr({'src':shoplogo+'?imageView2/1/w/130/h/130'});
                    $list.find(".shop-name").text(shopname);
                    $list.find("#filterProvince").text(protext);
                    $list.find("#filterCity").text(cittext);
                    $list.find(".live-time").text(livemonth);
                    $list.find(".owner-name").text(nickname);
                    $list.find(".wechat-code").text(wxusername);
                    $('#homeShopList').append($list);
                }
                if(res.success&&res.shops=='')
                {
                    $('#homeShopList').empty();
                    $('#homeShopList').append('<h5 class="text-center">无结果！</h5>');
                }
            }
            else return alert(res.error_text);
        },
        function(){
            alert('网络错误！');
        }
    );

}
