$(document).ready(function(){
    var width = $("#swiper-container").width();
    var height = $(window).height();
    $(".wrap-notice-box").css("minHeight",height);
    $(".swiper-wrapper").width(width*$(".swiper-slide").size());
    new Swiper('#swiper-container',{
        mode: 'horizontal',
        loop:true,
        grabCursor: true,
        pagination: '.pagination',
        autoplay:"3000",
        autoplayDisableOnInteraction:false
    });
    var width = $("#swiper-container").width();
    var height = $(window).height();
    $(".groupt-list").height(height-86);
    $(".container").css("minHeight",height+"px");
    $('.groupt-list li').first().addClass('active');

    var link_search=$.getUrlParam("search");
    var link_action=$.getUrlParam("action");
    if(link_search != null){
        window.dataObj.page=1;
        window.dataObj.action=9;
        _search = link_search;
        goodsList(1,9);
        $('.wrap-notice-box').addClass('hidden');
        $('.wrap-home').removeClass('hidden');
        $('#classify').text('搜索结果');
        $('.wrap-goods-box').css('margin-top','40px');
        $('.classify-title').hide();
    }else if(link_action != null&&link_action=="all"){
         $('.wrap-notice-box').addClass('hidden');
         $('.wrap-home').removeClass('hidden');
         $('.classify-list li').each(function(){
            var $this=$(this);
            var id = Number($this.attr('data-id'));
            _group_id = id;
            goodsList(1,6,_group_id);
            scrollLoading(_group_id);
         }); 
    }else{
        if($('.classify-list li').length==0){
            $(".wrap-loading-box").addClass("hidden");
        }
        _group_id = -1;
        goodsList(1,6,_group_id,'recommend');  
    }
    //已在购物车里的商品
    var cart_fs=window.dataObj.cart_fs;
    // var cart_ms=window.dataObj.cart_ms;
    for(var key in cart_fs) {
        window.dataObj.fruits[cart_fs[key][0]]=cart_fs[key][1];
        fruits_num();
    }
    $('.bottom-nav').find('li').addClass('add_cart');
    var s_top = 0;
    $(window).scroll(function(){
        if(link_search == null){
         //分类滚动监听
            var box=$('.goods-list');
            for(var i=0;i<box.length;i++){
                var id=$('.goods-list').eq(i).attr('data-id');
                var dist=box[i].offsetTop-40;
                var classify=$('.classify-'+id).text();
                if($(window).scrollTop()>=dist){$('#classify').text(classify);}
            }
         }
    });
}).on('click','.more-goods',function(){
    var shop_code=$('#shop_code').val();
    window.location.href="/"+shop_code+"?action=all"; 
}).on("click","#menu",function(){
    var link_search=$.getUrlParam("search");
    if(link_search != null){
        var shop_code=$('#shop_code').val();
        var link="/"+shop_code;
        window.location.href=link;
        addCart(link);
    }
    else{
        if($("#menu").hasClass("menu-active")){
            $(this).removeClass("menu-active");
            $("#groupt-list").animate({"margin-left":"-75px","opacity":"0"},100);
            $('.list-box').animate({"left":"0"},100);
           
        }else{
            $(this).addClass("menu-active");
            $("#groupt-list").animate({"margin-left":"0","opacity":"1"},100);
            $('.list-box').animate({"left":"75px"},100);
        }
    }
    
}).on("click",".groupt-list li",function(){
    var $this=$(this);
    $("#menu").removeClass("menu-active");
    var index =$this.index();
    $(".groupt-list li").removeClass("active").eq(index).addClass("active");
    var text=$this.text();
    $('#classify').text(text);
    var group_id=Number($this.attr('data-id'));
    var top=$('.goods-list-'+group_id).offset().top-40;
    $.scrollTo({endY:top,duration:500,callback:function(){}});
    $('.list-box').animate({"left":"0"},100);
    $("#groupt-list").animate({"margin-left":"-75px","opacity":0},100);
}).on('click','.to-add',function(){
    //首次添加商品
    var $this=$(this);
    var parent=$this.parents('.goods-list-item');
    var storage=parseFloat(parent.attr('data-storage'));
    var relate=parseFloat($this.parents('.charge-item').attr('data-relate'));
    var unit_num=parseFloat($this.parents('.num_box').siblings('.charge-type').find('.num').text());
    var change_num=relate*unit_num*1;
    var buy_today=$this.parents('.charge-item').attr('data-buy');
    var allow_num=parseInt($this.parents('.charge-item').attr('data-allow'));
    if(change_num==NaN){
        change_num=0;
    }
    if(buy_today=='True'&&allow_num<=0){
        return noticeBox('您该商品的限购数量已达上限啦！┑(￣▽ ￣)┍ ');
    }
    if(storage>0) {
        if(storage-change_num<0){
            return noticeBox('库存不足啦！┑(￣▽ ￣)┍ ',$this);
        }else if(storage-change_num==0){
            $this.siblings('.number-change').find('.number-input').val(0);
        }else{
            $this.siblings('.number-change').find('.number-input').val(0); 
        }
        pulse($this.siblings('.number-change').find('.number-plus'));
        goodsNum($this.siblings('.number-change').find('.number-plus'),2);
        $this.addClass('hidden').siblings('.number-change').removeClass('hidden');
        //果篮显示商品种类数
        if(window.dataObj.cart_count==0) {$('.cart_num').removeClass('hidden');}
        if($this.hasClass('add_cart_num')){
            window.dataObj.cart_count++;
            wobble($('.cart_num'));
            $('.cart_num').text(window.dataObj.cart_count).removeClass('hidden');
            SetCookie('cart_count',window.dataObj.cart_count);
            $this.removeClass('add_cart_num');
        }
       
    }
    else{return noticeBox('库存不足啦！┑(￣▽ ￣)┍ ',$this)} 
    parent.attr({'data-storage':storage-change_num});
}).on('click','.number-minus',function(){
    //商品数量操作
    var $this=$(this);
    pulse($this);
    goodsNum($this,1);
}).on('click','.number-plus',function(){
    var $this=$(this);
    if($this.parents('.charge-item').find('.to-add').hasClass('hidden')){
       var parent=$this.parents('.goods-list-item');
        var num=Int($this.siblings('.number-input').val().trim());
        var storage=parseFloat(parent.attr('data-storage'));
        var regNum=/^[0-9]*$/;
        var buy_today=$this.parents('.charge-item').attr('data-buy');
        var allow_num=parseInt($this.parents('.charge-item').attr('data-allow'));
        if(buy_today=='True'&&num>=allow_num){
            return noticeBox('您该商品的限购数量已达上限啦！┑(￣▽ ￣)┍ ');
        }
        if(!regNum.test(num)) {
            $this.siblings('.number-input').val(storage);
            return noticeBox('商品数量只能为整数！',$this);
        }
        if(num<999) {pulse($this);goodsNum($this,2);}
        else {
            return noticeBox('最多只能添加999哦！',$this);
        } 
    }
    
}).on('click','.add_cart a',function(e){
    //添加到购物车
    stopDefault(e);
    var link=$(this).attr('href');
    addCart(link);
}).on('click','._add_cart',function(e){
    //添加到购物车
    stopDefault(e);
    var link=$(this).attr('href');
    addCart(link);
});
var _search;
var _action=6;
var _finished=true;
var _search;
$('.loading').html("~努力加载中 ( > < )~").show();
var scrollLoading=function(_group_id){
    $(window).scroll(function(){
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
        var range = 150;             //距下边界长度/单位px          //插入元素高度/单位px
        var totalheight = 0;
        var main = $(".container");              //主体元素
        var nomore=$('.goods-list-'+_group_id).attr("data-nomore");
        var page=parseInt($('.goods-list-'+_group_id).attr("data-page"));
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);
        if(_finished&&(main.height()-range) <= totalheight  && nomore=='false') {
            _finished=false;
            page = page+1;
            $('.goods-list-'+_group_id).attr("data-page",page);
            goodsList(page,_action,_group_id);
        }
        else if(nomore==true){
            if(_action==9){
                $('.loading').html("~没有更多结果了 ( > < )~").show();
            }else{
                $('.loading').html("~没有更多商品了呢 ( > < )~").show();
            }
        }
    });
}
var goodsList=function(page,action,_group_id,type){
    $(".wrap-loading-box").removeClass("hidden");
    var url='';
    var action = action;
    var args={
        action:action,
        page:page
    };
    if(action==6){
        args.group_id = _group_id;
    }
    if(action==9){
        args.search = _search;
    }
    // alert('i am here');
    $.postJson(url,args,function(res){
            if(res.success)
            {
                nomore = res.nomore
                initData(res.data);
                if(nomore == true){
                    if(action==9){
                        $('.loading').html("~没有更多结果了 ( > < )~").show();
                    }else{
                        $('.loading').html("~没有更多商品了呢 ( > < )~").show();
                    }
                }
            }
            else {
                noticeBox(res.error_text);
                $(".wrap-loading-box").addClass("hidden");
            }
        });
        var initData=function(data){
            var data=data;
            for(var key in data){
                if(type=='recommend'){
                    fruitItem($('.recommend-list'),data[key],type);
                }else{
                    $('.goods-list-'+data[key]['group_id']).attr("data-nomore",nomore);
                    fruitItem($('.goods-list-'+data[key]['group_id']),data[key]); 
                }   
            }
            var fruits=window.dataObj.fruits;
            var c_fs=[];
            for(var key in fruits){
                c_fs.push([key,fruits[key]]);
            };
            cartNum(c_fs,'.fruit-list');
            _finished=true;
            $(".wrap-loading-box").remove();
        }
};
var goods_item1='<li class="{{code}}">'+
                    '<a href="{{link}}">'+
                    '<img src="/static/images/holder_fruit.jpg" alt="水果图片" class="img lazy_img" data-original="{{ori_img}}"/>'+
                    '<div class="item-info bg-color">'+
                        '<div class="skew item-info-name {{if charge_types["market_price"]>0 }}mt10{{else}}mt20{{/if}}">{{name}}</div>'+
                        '<div class="skew item-info-price mt10" data-id="{{charge_types["id"]}}">'+
                            '￥ <span class="price font16">{{charge_types["price"]}}</span>元/<span class="num">{{charge_types["num"]}}</span><span class="chargeUnit">{{charge_types["unit"]}}</span></span>'+
                            '{{if charge_types["market_price"]>0 }}<p class="market">￥ <span class="market-price">{{charge_types["market_price"]}}元/<span class="num">{{charge_types["num"]}}</span><span class="chargeUnit">{{charge_types["unit"]}}</span></span></p>{{/if}}'+
                        '</div>'+
                        '<a href="{{link}}" class="skew now-buy">立即购买</a>'+
                    '</div>'+
                    '{{if storage<=0 }}'+
                    '<div class="sold-out bg_change" style="background-color:rgba(0,0,0,0.1)"><div class="out"></div></div>'+
                    '{{/if}}'+
                    '</a>'+
                '</li>';
var goods_item2='<li class="{{code}} goods-list-item" data-id="{{goos_id}}" data-num="{{storage}}" data-storage="{{storage}}" data-limit="{{limit_num}}" data-favour="{{favour_today}}" data-detail="{{detail_no}}">'+
                '<a href="{{link}}" class="_add_cart"><img src="/static/images/holder_fruit.jpg" alt="水果图片" class="img lazy_img" data-original="{{ori_img}}"/></a>'+
                '<div class="fruit-right charge-item"  data-id="{{charge_types["id"]}}" data-relate="{{charge_types["relate"]}}" data-buy="{{charge_types["limit_today"]}}" data-allow={{charge_types["allow_num"]}}>'+
                    '<p class="name">{{name}}</p>'+
                    '<div class="price charge-type">'+
                        '￥ <span class="price font16">{{charge_types["price"]}}</span>元/<span class="num">{{charge_types["num"]}}</span>{{charge_types["unit"]}}</span>'+
                        '{{if charge_types["market_price"]>0 }}<p class="market text-grey9">￥ <span class="market-price">{{charge_types["market_price"]}}元/{{charge_types["num"]}}{{charge_types["unit"]}}</span></p>{{/if}}'+
                    '</div>'+
                    '<div class="wrap-furit-opera bg-color num_box">'+
                        '<span class="to-add add add_cart_num">+</span>'+
                        '<p class="furit-opera number-change hidden">'+
                            '<span class="minus number-minus">-</span>'+
                            '<input type="text" value="" class="number-input text" readonly/>'+
                            '<span class="add number-plus">+</span>'+
                        '</p>'+
                    '</div>'+
                '</div>'+
            '</li>';

var fruitItem=function(box,fruits,type){
    var id=fruits['id'];
    var storage=fruits['storage'];
    var code=fruits['code'];
    var tag=fruits['tag'];
    var img_url=fruits['img_url'];
    var intro=fruits['intro'];
    var name=fruits['name'];
    var saled=fruits['saled'];
    var favour=fruits['favour'];
    var charge_types=fruits['charge_types'];
    var favour_today=fruits['favour_today'];
    var limit_num=fruits['limit_num'];
    var detail_no=fruits['detail_no'];
    var heart='';
    var sold_out='';
    var ori_img='';
    var shop_code=$('#shop_code').val();
    if(!code) {code='TDSG';}
    if(saled>9999){saled='9999+'}
    if(favour_today=='true'){
        heart='red-heart';
    }else{
        heart='gray-heart';
    }
    if(!img_url){
        ori_img='/static/design_img/'+code+'.png';
    }else{
        if(type=='recommend'){
            ori_img=img_url+'?imageView2/2/w/800';
        }
        else{
            ori_img=img_url+'?imageView2/2/w/800';
        }
    }
    if(tag==2){
        tag='limit_tag';
    }else if(tag==3){
        tag='hot_tag';
    }else if(tag==4){
        tag='sale_tag';
    }else if(tag==5){
        tag='new_tag';
    }
    if(type=='recommend'){
        var render=template.compile(goods_item1);
    }else{
        var render=template.compile(goods_item2);
    }
    if(charge_types.length>0){
        charge_types=charge_types[0];
    }
    var html=render({
        code:code,
        goos_id:id,
        storage:storage,
        favour_today:favour_today,
        limit_num:limit_num,
        detail_no:detail_no,
        intro:intro,
        name:name,
        saled:saled,
        favour:favour,
        heart:heart,
        tag:tag,
        charge_types:charge_types,
        sold_out:sold_out,
        ori_img:ori_img,
        link:'/'+shop_code+'/goods/'+id
    });
    box.append(html);
    $('.lazy_img').lazyload({threshold:100,effect:"fadeIn"});
};
function goodsNum(target,action){
    var item=target.siblings('.number-input');
    var change=target.parents('.number-change');
    var num=parseInt(item.val());
    var parent=target.parents('.goods-list-item');
    var storage=parseFloat(parent.attr('data-num'));
    var type_list=target.parents('.goods-list');
    var id=target.parents('.charge-item').attr('data-id');
    var relate=parseFloat(target.parents('.charge-item').attr('data-relate'));
    var unit_num=parseFloat(target.parents('.num_box').siblings('.charge-type').find('.num').text());
    var change_num=relate*unit_num*1;
    var limit_num=parseInt(parent.attr('data-limit'));
    if(action==1&&num<=0) {num=0;target.addClass('disable');}
    if(action==2)
    {
        if(storage<=0){
            return noticeBox('库存不足啦！┑(￣▽ ￣)┍ ',target);
        }
        else{
            if(storage-change_num<0){
                return  noticeBox('库存不足啦！┑(￣▽ ￣)┍ ',target);
            }
            if(limit_num>0&&num>=limit_num){
                return  noticeBox('商品限购数量'+limit_num);
            }
            num++;
            item.val(num);
            storage=storage-change_num;
            parent.attr({'data-storage':storage});
        }
    }
    else if(action==1)
    {
        var val=parseInt(item.val());
        if(val>0)
        {
            num--;
            item.val(num);
            storage=storage+change_num;
            parent.attr({'data-storage':storage});
            if(val==1){
                target.removeClass('anim-pulse');
                change.addClass('hidden').siblings('.to-add').removeClass('hidden').addClass('add_cart_num');
                if(window.dataObj.cart_count==1) {
                    window.dataObj.cart_count=0;
                    $('.cart_num').text(window.dataObj.cart_count).addClass('hidden');
                    SetCookie('cart_count',0);
                }
                else {
                    window.dataObj.cart_count--;
                    wobble($('.cart_num'));
                    $('.cart_num').text(window.dataObj.cart_count).removeClass('hidden');
                    SetCookie('cart_count',window.dataObj.cart_count);
                }
            }
        }
    }
    if(type_list.hasClass('fruit-list')) {window.dataObj.fruits[id]=num; fruits_num();}
}

function fruits_num(){
    for(var key in window.dataObj.fruits){
        if(window.dataObj.fruits[key]==0){delete window.dataObj.fruits[key];}
    }
}

window.dataObj.fruits={};
function cartNum(cart_ms,list){
    var item_list=$(list);
    for(var key in cart_ms) {
        for(var i=0;i<item_list.length;i++){
            var item=item_list.eq(i).find('.charge-type');
            for(var j=0;j<item.length;j++){
                var charge = item.eq(j);
                var id = charge.parents('.charge-item').attr('data-id');
                var add = charge.siblings('.num_box').find('.to-add');
                var change = charge.siblings('.num_box').find('.number-change');
                var input = change.find('.number-input');
                if (id == cart_ms[key][0]) {
                    var $parent=charge.parents('.goods-list-item');
                    var storage=$parent.attr('data-num');
                    add.addClass('hidden');
                    change.removeClass('hidden');
                    input.val(cart_ms[key][1]);
                    var relate=parseFloat(charge.parents('.charge-item').attr('data-relate'));
                    var unit_num=parseFloat(charge.find('.num').text());
                    var change_num=relate*unit_num*cart_ms[key][1];
                    $parent.attr({'data-storage':storage-change_num});
                }
            }
        }
    }
}

function addCart(link){
    var url='';
    var action = 4;
    fruits_num();
    var fruits=window.dataObj.fruits;
    var args={
        action:action,
        fruits:fruits
    };
    if(!isEmptyObj(fruits)){fruits={}}
    $.postJson(url,args,function(res){
            if(res.success)
            {
                window.location.href=link;
            }
            else return noticeBox(res.error_text);
        }
    );
}

function stopDefault(e) {
    if ( e && e.preventDefault )
        e.preventDefault();
    else
        window.event.returnValue = false;
    return false;
}

var startX = 0,startY = 0,t = 0,wHeight,disHeight;
$(document).ready(function(){ 
        wHeight = $(window).height();
        var height = $(".container").height();
        disHeight = height-wHeight;
    });
document.addEventListener('touchstart', function (ev) {
    startX = ev.touches[0].pageX;
    startY = ev.touches[0].pageY;  
    t = $(window).scrollTop();

}, false);
document.addEventListener('touchmove', function (ev) {
    var moveX,moveY;
    moveX = ev.touches[0].pageX;
    moveY = ev.touches[0].pageY;
}, false);
document.addEventListener('touchend', function (ev) {
    var endX, endY;
    endX = ev.changedTouches[0].pageX;
    endY = ev.changedTouches[0].pageY;
    var direction = GetSlideDirection(startX, startY, endX, endY);
    var disY = Math.abs(endY - startY);
    var top = $(window).scrollTop();
    switch (direction) {
        case 1:   //上
            if(t>=disHeight && disY>50 && window.location.href.indexOf("all")==-1){ 
                var shop_code=$('#shop_code').val();
                window.location.href="/"+shop_code+"?action=all"; 
            }
            break;
        case 2:   //下

            break;
        default:            
    }   
}, false);
//返回角度
function GetSlideAngle(dx, dy) {
    return Math.atan2(dy, dx) * 180 / Math.PI;
}    
//根据起点和终点返回方向 1：向上，2：向下，3：向左，4：向右,0：未滑动
function GetSlideDirection(startX, startY, endX, endY) {
    var dy = startY - endY;
    var dx = endX - startX;
    var result = 0;
    //如果滑动距离太短
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
        return result;
    }
    var angle = GetSlideAngle(dx, dy);
    if (angle >= -45 && angle < 45) {
        result = 4;
    } else if (angle >= 45 && angle < 135) {
        result = 1;
    } else if (angle >= -135 && angle < -45) {
        result = 2;
    }
    else if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) {
        result = 3;
    }    
    return result;
}