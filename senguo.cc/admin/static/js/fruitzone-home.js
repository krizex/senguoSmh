$(document).ready(function(){
    $('.filter-box a').on('click',function(){$(this).addClass('active').siblings().removeClass('active');});
    $('#searchSubmit').on('click',function(evt){Search(evt);});
    $('#province-select').find('li').on('click',function(){
        if($('#city-select').find('li').length==0)
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
    var i=1;
    if(i=1){$('#PrePage').parents('li').hide();}
    if($('#homeShopList').find('li').length<20){$('#NextPage').parents('li').hide();}
    $('#PrePage').on('click',function(){
        if(i>1)
        {
            i=i-20;
            $(this).attr({'data-code':i});
            Filter($(this));
        }

    });
    $('#NextPage').on('click',function(){
            i=i+20;
            $(this).attr({'data-code':i});
            Filter($(this));
    });
});

function Search(evt){
    evt.preventDefault();
    var q=$('#searchKey').val().trim();
    var action="search";
    var url="/fruitzone/";
    var args={
        q:q,
        action:action,
        _xsrf: window.dataObj._xsrf

    };
    
    // 需要判断q是否为空 & action不要放在html element data属性里面（它应当是js里面的内容）

    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                $('#homeShopList').empty();
                var shops=res.shops;
                for(var shop in shops)
                {
                    var timenow=new Date().getTime()/1000;
                    var shopid=shops[shop]["id"];
                    var shopname =shops[shop]["shop_name"];
                    var livetime=shops[shop]['shop_start_timestamp'];
                    var province=shops[shop]['shop_province'];
                    var city=shops[shop]['shop_city'];
                    var livemonth=parseInt((timenow-livetime)/(30*24*60*60));
                    var nickname=shops[shop]["admin"]["accountinfo"]["nickname"];
                    var wxusername=shops[shop]["admin"]["accountinfo"]["wx_username"];
                    var list=$('<li><a href="/fruitzone/shop/'+shopid+'"><div class="shop-logo pull-left"><img src="/static/images/anoa-1-md.gif"/></div><div class="shop-info pull-left"><p><span class="shop-name w1 pull-left">'+shopname+'</span><span class="w2 area pull-left"><em data="'+province+'" id="filterProvince"> </em><em data="'+city+'" id="filterCity"></em></span></p><p>运营时间：'+livemonth+'月</p><p><span class="shop-owner w1 pull-left">负责人：'+nickname+'</span><span class="w2 wechat-code pull-left">'+wxusername+'</span></p></div></a></li>');
                    $('#homeShopList').append(list);
                    $('#filterProvince').text(provinceArea(province));
                    if(city!=province){$('#filterCity').text(cityArea(province,city));}
                    // 这段替换代码逻辑有问题，应该是替换list中的"#filterProvince"

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
    var url="/fruitzone/";
    var order=evt.parents('.order-by-list').find('.order-by-item').data('action');
    if(order=='cityFilter')
        {var args = {city: city,action: action,_xsrf: window.dataObj._xsrf}}
    else if(order=='areaFilter')
        {var args = {service_area: service_area,action: action,_xsrf: window.dataObj._xsrf}}
    else if(order=='liveFilter')
        {var args = {live_month: live_month,action: action,_xsrf: window.dataObj._xsrf}}
    else if(order=='fruitFilter')
        {var args = {onsalefruit_ids: onsalefruit_ids,action: action,_xsrf: window.dataObj._xsrf};}
    else if(order=='skipFilter')
        {var args = {skip:skip,action: action,_xsrf: window.dataObj._xsrf};}
    // 以上args中的action和_xsrf字段可以脱离出来
    // 事实上postJson你可以重写，把_xsrf参数自动添加进去
    $.postJson(url,args,
        function(res){
            if(res.success) {
                evt.parents('.order-by-list').hide();
                $('.home-pagination').show();
                $('#homeShopList').empty();
                var shops = res.shops;
                for (var shop in shops)
                {
                    var timenow=new Date().getTime()/1000;
                    var shopid=shops[shop]["id"];
                    var shopname =shops[shop]["shop_name"];
                    var livetime=shops[shop]['shop_start_timestamp'];
                    var province=shops[shop]['shop_province'];
                    var city=shops[shop]['shop_city'];
                    var livemonth=parseInt((timenow-livetime)/(30*24*60*60));
                    var nickname=shops[shop]["admin"]["accountinfo"]["nickname"];
                    var wxusername=shops[shop]["admin"]["accountinfo"]["wx_username"];
                    console.log(wxusername);
                    var list=$('<li><a href="/fruitzone/shop/'+shopid+'"><div class="shop-logo pull-left"><img src="/static/images/anoa-1-md.gif"/></div><div class="shop-info pull-left"><p><span class="shop-name w1 pull-left">'+shopname+'</span><span class="w2 area pull-left"><em data="'+province+'" id="filterProvince"> </em><em data="'+city+'" id="filterCity"></em></span></p><p>运营时间：'+livemonth+'月</p><p><span class="shop-owner w1 pull-left">负责人：'+nickname+'</span><span class="w2 wechat-code pull-left">'+wxusername+'</span></p></div></a></li>');
                    $('#homeShopList').append(list);
                    $('#filterProvince').text(provinceArea(province));
                    if(city!=province){$('#filterCity').text(cityArea(province,city));}
                    //同样处理省份的转换有问题
                }
                if(res.success&&res.shops=='')
                {
                    $('#homeShopList').empty();
                    $('#homeShopList').append('<h5 class="text-center">无搜索结果！</h5>');
                }// 考虑无过滤结果的情况
            }
        },
        function(){
            alert('网络错误！');
        }
    );

}
