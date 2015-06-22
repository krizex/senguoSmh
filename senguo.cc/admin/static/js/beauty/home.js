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
            goodsList(1,6);
         }); 
    }else{
        if($('.classify-list li').length==0){
            $(".wrap-loading-box").addClass("hidden");
        }
        _group_id = -1;
        goodsList(1,6,'recommend');  
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
        window.location.href="/"+shop_code;
    }
    else{
        if($("#groupt-list").hasClass("h0")){
            $(this).addClass("menu-active");
            $("#groupt-list").removeClass("h0");
            $(".groupt-list li").addClass("anim-bounceDown");
            $(".groupt-list li").one("webkitAnimationEnd",function(){
                $(this).removeClass("anim-bounceDown");
            });
        }else{
            $(this).removeClass("menu-active");
            $("#groupt-list").addClass("h0");
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
    $(window).scrollTop(top);
     if($("#groupt-list").hasClass("h0")){
            $(this).addClass("menu-active");
            $("#groupt-list").removeClass("h0");
            $(".groupt-list li").addClass("anim-bounceDown");
            $(".groupt-list li").one("webkitAnimationEnd",function(){
                $(this).removeClass("anim-bounceDown");
            });
        }else{
            $(this).removeClass("menu-active");
            $("#groupt-list").addClass("h0");
        }
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
});
var _group_id;
var _search;
var goodsList=function(page,action,type){
    finished=false;
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
        },
        function(){noticeBox('网络好像不给力呢~ ( >O< ) ~');},
        function(){noticeBox('服务器貌似出错了~ ( >O< ) ~');});
        var initData=function(data){
            var data=data;
            for(var key in data){
                if(type=='recommend'){
                    fruitItem($('.recommend-list'),data[key],type);
                }else{
                  fruitItem($('.goods-list-'+data[key]['group_id']),data[key]); 
                }

                
            }
            var fruits=window.dataObj.fruits;
            var c_fs=[];
            for(var key in fruits){
                c_fs.push([key,fruits[key]]);
            };
            cartNum(c_fs,'.fruit-list');
            window.dataObj.count++;
            $(".wrap-loading-box").remove();
        }
};
var goods_item1='<li class="{{code}}">'+
                    '<img src="/static/images/fruit3.jpg" alt="水果图片" class="img lazy_img" data-original="{{ori_img}}"/>'+
                    '<div class="item-info bg-color">'+
                        '<div class="skew item-info-name {{if charge_types["market_price"]>0 }}mt10{{else}}mt20{{/if}}">{{name}}</div>'+
                        '<div class="skew item-info-price mt10" data-id="{{charge_types["id"]}}">'+
                            '￥&nbsp;<span class="price font16">{{charge_types["price"]}}</span>元/<span class="num">{{charge_types["num"]}}</span><span class="chargeUnit">{{charge_types["unit"]}}</span></span>'+
                            '{{if charge_types["market_price"]>0 }}<p class="market">￥<span class="market-price">{{charge_types["market_price"]}}元</span/<span class="num">{{charge_types["num"]}}</span><span class="chargeUnit">{{charge_types["unit"]}}</span></span></p>{{/if}}'+
                        '</div>'+
                        '<a href="{{link}}" class="skew now-buy">立即购买</a>'+
                    '</div>'+
                    '{{if storage<=0 }}'+
                    '<div class="sold-out bg_change" style="background-color:rgba(0,0,0,0.1)"><div class="out"></div></div>'+
                    '{{/if}}'+
                '</li>';
var goods_item2='<li class="{{code}} goods-list-item" data-id="{{goos_id}}" data-num="{{storage}}" data-storage="{{storage}}" data-limit="{{limit_num}}" data-favour="{{favour_today}}" data-detail="{{detail_no}}">'+
                '<a href="{{link}}" class="add_cart"><img src="/static/images/fruit3.jpg" alt="水果图片" class="img lazy_img" data-original="{{ori_img}}"/></a>'+
                '<div class="fruit-right charge-item"  data-id="{{charge_types["id"]}}" data-relate="{{charge_types["relate"]}}" data-buy="{{charge_types["limit_today"]}}" data-allow={{charge_types["allow_num"]}}>'+
                    '<p class="name">{{name}}</p>'+
                    '<div class="price charge-type">'+
                        '￥&nbsp;<span class="price font16">{{charge_types["price"]}}</span>元/<span class="num">{{charge_types["num"]}}</span>{{charge_types["unit"]}}</span>'+
                        '{{if charge_types["market_price"]>0 }}<p class="market text-grey9">￥<span class="market-price">{{charge_types["market_price"]}}元</span/{{charge_types["num"]}}{{charge_types["unit"]}}</span></p>{{/if}}'+
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
        ori_img=img_url+'?imageView/1/w/800/h/700';
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
        },
        function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
        function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}

function stopDefault(e) {
    if ( e && e.preventDefault )
        e.preventDefault();
    else
        window.event.returnValue = false;
    return false;
}
