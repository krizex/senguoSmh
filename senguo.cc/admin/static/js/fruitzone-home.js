
$(document).ready(function(){
    //search
    $(document).on('click','#searchSubmit',function(evt){Search(evt);});
    $('.willOpen').on('click',function(){$.noticeBox('即将开放，敬请期待！')});
    //shop info
    $.shopsList(1);
    $.scrollLoading();
    //province and city
    var area=window.dataObj.area;
    for(var key in area){
        var $item=$('<li><span class="name"></span><span class="num"></span></li>');
        var city=area[key]['city'];
        if(city) city='true';
        else city='false';
        $item.attr({'data-code':key,'data-city':city}).find('.name').text(area[key]['name']);
        $('.provincelist').append($item);
    }
    $(document).on('click','.provincelist li',function(){
        var $this=$(this);
        var province_code=$this.attr('data-code');
        var if_city=$this.attr('data-city');
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
        else{filter(province_code);}
    });
    //close choose list
    $(document).on('click',function(e){
        if($(e.target).closest('.dismiss').length == 0){
            $('.area_list').addClass('hidden');
        }
    });
    //city filter
    $(document).on('click','.city_choose',function(){
        $('.area_list').removeClass('hidden');
    });
    $(document).on('click','.city_list li',function(){
        var $this=$(this);
        var city_code=$this.attr('data-code');
        filter(city_code);
    });
});
$.shopItem=function (shops){
   $.getItem('/static/items/fruitzone/shop_item.html?v=2015-0320',function(data){
    window.dataObj.shop_item=data;
    for(var key in shops){
                var $item=$(window.dataObj.shop_item);
                var logo_url=shops[key]['shop_trademark_url'];
                var name=shops[key]['shop_name'];
                var code=shops[key]['shop_code'];
                var province=shops[key]['shop_province'];
                var city=shops[key]['shop_city'];
                var address=shops[key]['shop_address_detail'];
                var intro=shops[key]['shop_intro'];
                var area=window.dataObj.area;
                if(province==city) city='';
                for(var key in area){
                    if(key==province){
                        province=area[key]['name']
                        if(city){
                            var cities=area[key]['city'];
                            for(var code in cities){
                                if(code==city){city==cities[code]['name']}
                            }
                        }
                    }
                 }
                if(!logo_url) logo_url='/static/design_img/Li_l.png';
                $item.find('.shop_link').attr({'href':'/'+code});
                $item.find('.shop_logo').attr({'src':logo_url});
                $item.find('.shop_name').text(name);
                $item.find('.shop_code').text(code);
                $item.find('.address').text(province+city+address);
                $item.find('.intro').text(intro);
                $('.shoplist').append($item);
            }
});      
}

$.shopsList=function(page,action){
    var url='';
    var action ='shop';
    var args={
        action:action,
        page:page
    };
    $.postJson(url,args,function(res){
        if(res.success)
        {
            var shops=res.shops;
            $.shopItem(shops);
            $('.loading').hide();
            window.dataObj.finished=true;
        }
        else return $.noticeBox(res.error_text);
        },function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')}
        );
};

window.dataObj.page=1;
window.dataObj.finished=true;
$.scrollLoading=function(){
    var range = 10;             //距下边界长度/单位px          //插入元素高度/单位px  
    var totalheight = 0;   
    var main = $(".container");                  //主体元素   
    $(window).scroll(function(){
        var maxnum = Int($('#page_count').val());            //设置加载最多次数  
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)  
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);  
        if(window.dataObj.finished&&(main.height()-range) <= totalheight  && window.dataObj.page < maxnum) { 
            $('.no_more').hide();
            $('.loading').show();
            window.dataObj.finished=false;
            window.dataObj.page++; 
            $.shopsList(window.dataObj.page);
        }       
        else if(window.dataObj.page ==maxnum){
              $('.no_more').show();
        } 
    }); 
}   

function Search(evt){
    evt.preventDefault();
    var q=$('#searchKey').val().trim();
    var action="search";
    var url="";
    var args={
        q:q,
        action:action
    };
    if(!q){return $.noticeBox('请输入店铺名！')}
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                $('.shoplist').empty();
                 var shops=res.shops;
                if(res.shops==''){
                    $('.shoplist').empty();
                    $('.shoplist').append('<h5 class="text-center mt10 text-grey">无搜索结果！</h5>');
                 }
                else $.shopItem(shops);
            }
            else return $.noticeBox(res.error_text);
        },function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')}    
    );
}

function filter(data){
   var action="filter";
    var url="";
    var args={
        city:Int(data),
        action:action
    };
    if(!data){return $.noticeBox('选择城市！')}
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                $('.shoplist').empty();
                 var shops=res.shops;
                 $('.area_list').addClass('hidden');
                 if(res.shops==''){
                    $('.shoplist').empty();
                    $('.shoplist').append('<h5 class="text-center mt10 text-grey">无搜索结果！</h5>');
                 }
                else {
                    $.shopItem(shops);
                }
            }
        else return $.noticeBox(res.error_text);
        },function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}

