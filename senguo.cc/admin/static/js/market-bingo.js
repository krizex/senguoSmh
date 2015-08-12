var gArr = [],sid=0;
$(document).ready(function(){
    $('.bottom-nav').find('li').addClass('add_cart');
    var width = $("#swiper-container").width();
    var height = $(window).height();
    //$("html,body").css("overflow","hidden").css("height",height+"px");
    //$(".container").css("height",height+"px").addClass("over");
    $(".notice-item").width("100%");
    $(".swiper-wrapper").width(width*$(".swiper-slide").size());
    new Swiper('#swiper-container',{
        mode: 'horizontal',
        loop:true,
        grabCursor: true,
        pagination: '.pagination',
        autoplay:"3000",
        autoplayDisableOnInteraction:false
    });
    //分类显示
    var top_title=$('.top-title');
    //get infomations of goods and push into html
    var link_group=$.getUrlParam("group");
    if(link_group!= null){
        window.dataObj.page=1;
        _action=6;
        var _group_id = Number(link_group);
        sid = _group_id;
        goodsList(1,6,_group_id);
        scrollLoading();
    }else{
        if($('.more-group li').length==0){
            $(".wrap-loading-box").addClass("hidden");
            $('.tab-group li').each(function(){
                if($(this).attr('data-id')!=-2){
                    gArr.push($(this).attr('data-id'));
                }
            });
        }else{
             $('.more-group li').each(function(){
                 if($(this).attr('data-id')!=-2){
                     gArr.push($(this).attr('data-id'));
                 }
             });
        }
        allList(1,6,gArr[0]);
        sid = gArr[0];
        scrollLoading();
        $('.tab-group li').first().addClass("active");
    }
    var shop_logo=$('#shop_imgurl').attr('data-img');
    if(parseInt($("#shop_status").val())==3){
        modalNotice("店铺休息中，暂不接收新订单");
    }
    if(isWeiXin()){
        wexin('',shop_logo);
    }
    //已在购物车里的商品
    var cart_fs=window.dataObj.cart_fs;
    // var cart_ms=window.dataObj.cart_ms;
    for(var key in cart_fs) {
        window.dataObj.fruits[cart_fs[key][0]]=cart_fs[key][1];
        fruits_num();
    }
    $(document).on("click",function(e){
        if($(e.target).closest(".more-group-btn").size()==0){
            $(".more-group").addClass("hidden");
        }
    });
    /*$(document).on('click','#backTop',function(){
        $(".container").scrollTop(0);
    });
    //置顶监听
    $(".container").on('scroll',function(){
        var $this=$(this);
        var clientHeight= $(window).height();
        var scrollTop=$(".container").scrollTop();
        if(scrollTop>=clientHeight/2){
            $('.little_pear').css("display","block");
        }
        else{
            $('.little_pear').css("display","none");
        }
    });*/
}).on('click','.notice-item',function(){
        //公告详情
        var $this=$(this);
        var detail=$this.find('.notice-detail').val();
        var detail_box=new Modal('detail_box');
        detail_box.modal('show');
        $('.detail-box').find('.detail').text(detail);
}).on('click','.goods_item_item',function(e){
    var $this=$(this);
    var storage=Number($this.attr('data-num'));
    var detail_no=$this.attr('data-detail');
    var id=$this.attr('data-id');
    var shop_code=$('#shop_code').val();
    if($(e.target).closest(".forbid_click").size()==0){
        if (storage > 0 && detail_no=='False') {
            addCart("/"+shop_code+"/goods/"+id);
        }else if(storage<=0){
            return noticeBox("当前商品已经卖完啦");
        }
    }
}).on('click','.add_cart a',function(e){
    //添加到购物车
    stopDefault(e);
    var link=$(this).attr('href');
    addCart(link);
}).on('click','.classify-icon',function(){
    var link_search=$.getUrlParam("search");
     if(link_search != null){
        var shop_code=$('#shop_code').val();
        var link="/"+shop_code
        window.location.href=link;
        addCart(link);
    }else{
        $('.classify-list').toggle();
    }
}).on('click','.to-add',function(){
    //首次添加商品
    var $this=$(this);
    var parent=$this.parents('.goods_item_item');
    var storage=parseFloat(parent.attr('data-storage'));
    var relate=parseFloat(parent.attr('data-relate'));
    var unit_num=parseFloat(parent.attr('data-unitnum'));
    var change_num=relate*unit_num*1;
    var buy_today=parent.attr('data-buy');
    if(change_num==NaN){
        change_num=0;
    }
    if(buy_today=='True'){
        return noticeBox('您该商品的限购数量已达上限啦！┑(￣▽ ￣)┍ ');
    }
    if(storage>0) {
        if(storage-change_num<0){
            return noticeBox('库存不足啦！┑(￣▽ ￣)┍ ',$this);
        }else if(storage-change_num==0){
            parent.find('.number-input').text(0);
        }else{
            parent.find('.number-input').text(0); 
        }
        pulse(parent.find('.number-plus'));
        goodsNum(parent.find('.number-plus'),2);
        $this.addClass('hidden').siblings('.roll-btn').removeClass('hidden');
        parent.find(".wrap-src-price").addClass("hidden");
        parent.find(".wrap-bug-text").removeClass("hidden");
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
    else {return noticeBox('库存不足啦！┑(￣▽ ￣)┍ ',$this)} 
    parent.attr({'data-storage':storage-change_num});
}).on('click','.number-minus',function(){
    //商品数量操作
    var $this=$(this);
    pulse($this);
    goodsNum($this,1);
}).on('click','.number-plus',function(){
    var $this=$(this);
    var parent=$this.parents('.goods_item_item');
    if(parent.find('.to-add').hasClass('hidden')){
        var num=Int(parent.find('.number-input').text());
        var storage=parseFloat(parent.attr('data-storage'));
        var regNum=/^[0-9]*$/;
        var buy_today=$this.parents('.charge-item').attr('data-buy');
        if(buy_today=='True'){
            return noticeBox('您该商品的限购数量已达上限啦！┑(￣▽ ￣)┍ ');
        }
        if(!regNum.test(num)) {
            parent.find('.number-input').text(storage);
            return noticeBox('商品数量只能为整数！',$this);
        }
        if(num<999) {pulse($this);goodsNum($this,2);}
        else {
            return noticeBox('最多只能添加999哦！',$this);
        } 
    }
}).on("click",".tab-group>li",function(){
    var $this=$(this);
    var index=$this.index();
    if(index==2&&$this.hasClass("active")&&$(".i-cert").length>0){
        $(".more-group").removeClass("hidden");
    }
    var group_id=Number($this.attr("data-id"));
    if(!$this.hasClass("active")){
        if(group_id==-2){
            $(".bingo-list").removeClass("hidden");
        }else{
            $(".bingo-list").addClass("hidden");
            $(".goods-list-"+group_id).removeClass("hidden");
        }
    }
    $this.addClass("active").siblings("li").removeClass("active");
}).on('click','.more-group li',function(){
    var $this=$(this);
    var text=$this.text();
    var group_id=Number($this.attr('data-id'));
    if(group_id==-2){
        $(".bingo-list").removeClass("hidden");
    }else{
        $(".bingo-list").addClass("hidden");
        $('.goods-list-'+group_id).removeClass("hidden");
    }
    $("#cur_group").html($(this).html()).attr("data-id",$(this).attr("data-id"));
    $(".more-group").addClass("hidden");
    // $.scrollTo({endY:top,duration:500,callback:function(){}});
}).on('click','._add_cart',function(e){
    //添加到购物车
    stopDefault(e);
    var link=$(this).attr('href');
    addCart(link);
}).on("click",".goods-img-box",function(){
    var $this=$(this);
    var storage=Number($this.parents(".goods_item_item").attr('data-num'));
    var id=$this.parents(".goods_item_item").attr('data-id');
    var shop_code=$('#shop_code').val();
    if (storage > 0) {
        addCart("/"+shop_code+"/goods/"+id);
    }else if(storage<=0){
        return noticeBox("当前商品已经卖完啦");
    }
});
var _action=6;
var _finished=true;
var _search;
var __item=' <li class="goods_item_item {{code}}" data-id="{{id}}" data-num="{{storage}}" data-storage="{{storage}}" data-limit="{{limit_num}}" data-favour="{{favour_today}}" data-relate="{{relate}}" data-unitnum="{{unitnum}}" data-buy="{{limit_today}}" data-charge="{{charge_id}}" data-price="{{charge_price}}">'+
        '<div class="goods-img-box {{desaturate}}">'+
            '<img class="goods_img lazy_img" src="{{img_url}}" alt="{{name}}" data-original="{{img_url}}"/>'+
            '<div class="goods-img-hover"></div>'+
            '<div class="status-tip {{tag}}"></div>'+
        '</div>'+
        '<div class="goods-attr-box {{desaturate}}">'+
            '<div class="attr-left">'+
                '<p class="g-name clip">{{name}}</p>'+
                '<p class="g-detail clip">{{intro}}</p>'+
            '</div>'+
            '<div class="wrap-operate">'+
                '<span href="javascript:;" class="roll-btn minus-gds number-minus hidden">&nbsp;</span>'+
                '<span href="javascript:;" class="roll-btn add-gds number-plus hidden">&nbsp;</span>'+
                '<span href="javascript:;" class="roll-btn buy-gds to-add add_cart_num">买</span>'+
            '</div>'+
            '<div class="attr-right">'+
                '<div class="wrap-src-price">'+
                    '<p class="src-price"><span class="f12 rmb">￥</span><span class="src-price-num">{{src_price}}</span></p>'+
                    '<p class="cur-price color"><span class="f12 rmb">￥</span><span class="cur-price-num">{{cur_price}}</span></p>'+
                '</div>'+
                '<div class="wrap-bug-text hidden">'+
                    '<span class="bug-num"><span class="font16">x </span><span class="buy-num number-input">1</span></span>'+
                    '<span class="price-all">小计 ￥<span class="price-all-num">{{price_all}}</span>元</span>'+
                '</div>'+
            '</div>'+
        '</div>'+
        '<div class="sold-out {{sold_out}}" style="background-color:rgba(0,0,0,0.1)"><div class="out"></div></div>'+
    '</li>';
$('.loading').html("~努力加载中 ( > < )~").show();
var scrollLoading=function(){
    $(window).scroll(function(){
        //var srollPos = $(".container").scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
        var srollPos = $(window).scrollTop();
        var range = 150;             //距下边界长度/单位px          //插入元素高度/单位px
        //var main = $('.goods-list-'+_group_id);              //主体元素
        var main = $('.goods-list-'+sid);
        var nomore=main.attr("data-nomore");
        var page=parseInt($('.goods-list-'+sid).attr("data-page"));
        var totalheight = parseFloat($(window).height()) + parseFloat(srollPos);
        if(_finished&&(main.height()-range) <= totalheight  && nomore=="false") {
            _finished=false;
            page = page+1;
            $('.goods-list-'+sid).attr("data-page",page);
            goodsList(page,_action,sid);
        }else if(_finished&&(main.height()-range) <= totalheight  && nomore=="true"){
            if(main.index()<gArr.length){
                sid = gArr[parseInt(main.index())+1];
            }
        }
        else if(nomore=="true"){
            if(_action==9){
                $('.loading').html("~没有更多结果了 ( > < )~").show();
            }else{
                $('.loading').html("~没有更多商品了呢 ( > < )~").show();
            }
        }
    });
}
var aindex = 0;
var allList=function(page,action,_group_id){
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
    $.postJson(url,args,function(res){
        $(".wrap-loading-box").remove();
        if(res.success)
        {
            aindex++;
            var nomore = res.nomore
            $('.goods-list-'+_group_id).attr({"data-nomore":nomore})
            initData(res.data,_group_id);
            if(aindex<gArr.length){
                allList(1,6,gArr[aindex]);
            }else{
                $('.loading').html("~没有更多商品了呢 ( > < )~").show();
            }
        }
        else {
            noticeBox(res.error_text);
        }
    });
    var initData=function(data,id){
        var data=data;
        for(var key in data){
            fruitItem($('.goods-list-'+id),data[key]);//fruits information
        }
        var fruits=window.dataObj.fruits;
        var c_fs=[];
        for(var key in fruits){
            c_fs.push([key,fruits[key]]);
        };
        cartNum(c_fs,'.fruit-list');
        $(".wrap-loading-box").remove();
    }
};
var goodsList=function(page,action,_group_id){
    $(".wrap-loading-box").removeClass("hidden");
    var url='';
    var action = action;
    if(!page){
        page = 1;
    }
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
    _finished = false;
    $.postJson(url,args,function(res){
        $(".wrap-loading-box").addClass("hidden");
            if(res.success)
            {
                var nomore = res.nomore
                $('.goods-list-'+_group_id).attr({"data-nomore":nomore})
                if(nomore == true){
                    if(action==9){
                        $('.loading').html("~没有更多结果了 ( > < )~").show();
                    }else{
                        $('.loading').html("~没有更多商品了呢 ( > < )~").show();
                    }
                }
                initData(res.data,_group_id);
            }
            else {
                noticeBox(res.error_text);
            }
        });
        var initData=function(data,id){
            var data=data;
            for(var key in data){
                fruitItem($('.goods-list-'+id),data[key]);//fruits information
            }
            var fruits=window.dataObj.fruits;
            var c_fs=[];
            for(var key in fruits){
                c_fs.push([key,fruits[key]]);
            };
            cartNum(c_fs,'.fruit-list');
            _finished=true;
        }
};

var fruitItem=function(box,fruits,type){
    var render = template.compile(__item);
    var id=fruits['id'];
    var storage=fruits['storage'];
    var code=fruits['code'];
    var tag=fruits['tag'];
    var img_url=fruits['img_url'];
    var intro=fruits['intro'];
    var name=fruits['name'];
    var saled=fruits['saled'];
    var favour=fruits['favour'];
    var charge_type=fruits['charge_types'][0];
    var favour_today=fruits['favour_today'];
    var limit_num=fruits['limit_num'];
    var detail_no=fruits['detail_no'];
    var heart='';
    var sold_out='';
    var ori_img='';
    var desaturate="";
    var src_price=0;
    var cur_price=0;
    var price_all=0;
    if(!code) {code='TDSG';}
    if(saled>9999){saled='9999+'}
    if(favour_today=='true'){
        heart='red-heart';
    }else{
        heart='gray-heart';
    }
    if(!img_url){
        ori_img='/static/design_img/'+code+'_l.png';
    }else{
        ori_img=img_url+'?imageView2/1/w/800';
    }
    if(tag==2){//限时
        tag='tag2';
    }else if(tag==3){//热销
        tag='tag3';
    }else if(tag==4){//特价
        tag='tag4';
    }else if(tag==5){//新品
        tag='tag5';
    }else{
        tag = "";
    }
    if(!intro){
        intro=" ";
    }
    if(charge_type){
        var relate=charge_type.relate;
        var unitnum=charge_type.num;
        var limit_today=charge_type.limit_today;
        var charge_id=charge_type.id;
        var charge_price=charge_type.price;
    }else{
        var relate=0;
        var unitnum=0;
        var limit_today=false;
        var charge_id = 0;
        var charge_price=0;
    }
    if(charge_type){
         if(charge_type.market_price){
            src_price=charge_type.market_price+"元/"+charge_type.num+charge_type.unit;
        }else{
            src_price=charge_type.price+"元/"+charge_type.num+charge_type.unit;
        }
        cur_price=charge_type.price+"元/"+charge_type.num+charge_type.unit;
        price_all=charge_type.price
    }
    if(storage<=0){
        sold_out="";
        desaturate="desaturate";
    }else{
        sold_out="hidden";
        desaturate="";
    }
    var html=render({
        id:id,
        storage:storage,
        code:code,
        tag:tag,
        img_url:ori_img,
        intro:intro,
        name:name,
        saled:saled,
        favour:favour,
        favour_today:favour_today,
        limit_num:limit_num,
        ori_img:ori_img,
        src_price:src_price,
        cur_price:cur_price,
        price_all:price_all,
        sold_out:sold_out,
        desaturate:desaturate,
        unitnum:unitnum,
        relate:relate,
        limit_today:limit_today,
        charge_id:charge_id,
        charge_price:charge_price
    });
    box.append(html);
    //$('.lazy_img').lazyload({threshold:200,effect:"fadeIn"});
};
window.dataObj.fruits={};
window.dataObj.mgoods={};
function cartNum(cart_ms,list){
    var item_list=$(list).children(".goods_item_item");
    for(var key in cart_ms) {
        for(var i=0;i<item_list.length;i++){
            var $item=item_list.eq(i);
            var id = Number($item.attr('data-charge'));
            var price = Number($item.attr('data-price'));
            if (id == cart_ms[key][0]) {
                var storage=$item.attr('data-num');
                $item.find('.to-add').addClass('hidden').siblings(".roll-btn").removeClass("hidden");
                $item.find('.number-input').text(cart_ms[key][1]);
                $item.find(".wrap-src-price").addClass("hidden");
                $item.find(".wrap-bug-text").removeClass("hidden");
                $item.find(".price-all-num").text(cart_ms[key][1]*price);
                var relate=parseFloat($item.attr('data-relate'));
                var unit_num=parseFloat($item.attr('data-unitnum'));
                var change_num=relate*unit_num*cart_ms[key][1];
                $item.attr({'data-storage':storage-change_num});
            }
        }
    }
}

function goodsNum(target,action){
    var parent=target.parents('.goods_item_item');
    var storage=parseFloat(parent.attr('data-storage'));
    var item=parent.find('.number-input');
    var type_list=target.parents('.bingo-list');
    var id=parseInt(parent.attr('data-charge'));
    var relate=parseFloat(parent.attr('data-relate'));
    var unit_num=parseFloat(parent.attr('data-unitnum'));
    var change_num=relate*unit_num*1;
    var limit_num=parseInt(parent.attr('data-limit'));
    var num=parseInt(item.text());
    var price = Number(parent.attr('data-price'));
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
            item.text(num);
            storage=storage-change_num;
            parent.attr({'data-storage':storage});
            parent.find(".price-all-num").text(num*price);
        }
    }
    else if(action==1)
    {
        var val=parseInt(item.text());
        if(val>0)
        {
            num--;
            item.text(num);
            if(num<0){
                storage = change_num;
            }else{
                storage=storage+change_num;  
            }
            parent.attr({'data-storage':storage});
            if(val==1){
                target.removeClass('anim-pulse');
                parent.find(".roll-btn").addClass('hidden');
                parent.find(".wrap-src-price").removeClass("hidden").siblings(".wrap-bug-text").addClass("hidden");
                parent.find('.to-add').removeClass('hidden').addClass('add_cart_num');
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
            parent.find(".price-all-num").text(num*price);
        }
    }
    if(type_list.hasClass('fruit-list')) {window.dataObj.fruits[id]=num; fruits_num();}
}

function fruits_num(){
    for(var key in window.dataObj.fruits){
        if(window.dataObj.fruits[key]==0){delete window.dataObj.fruits[key];}
    }
}

function mgoods_num(){
    for(var key in window.dataObj.mgoods){
        if(window.dataObj.mgoods[key]==0){delete window.dataObj.mgoods[key];}
    }
}

function stopDefault(e) {
    if ( e && e.preventDefault )
        e.preventDefault();
    else
        window.event.returnValue = false;
    return false;
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

function great(type,id){
    var url='';
    var menu_type;
    var action=3;
    if(type=='fruit') menu_type=0;
    else if(type=='menu') menu_type=1;
    var args={
        action:action,
        charge_type_id:id,
        menu_type:menu_type
    };
    $.postJson(url,args,function(res){
            if(res.success)
            {
                $('.goods_item_item').each(function(){
                    var $this=$(this);
                    var type=$this.data('type');
                    var goods_id=$this.data('id');
                    if(type==type&&goods_id==id){
                        var num=$this.find('.great').text();
                        $this.attr({'data-favour':'True'});
                        $this.find('.great').text(Int(num)+1).siblings('em').addClass('red-heart');
                    }
                });
                var check_large=new Modal('large_imgbox');
                check_large.modal('hide');
                if(res.notice)
                {
                    noticeBox(res.notice);
                }
            }
            else noticeBox(res.error_text);
        }
    );
}

function focus(){
    var url='/customer/shopProfile';
    var action = "favour";
    var args={action: action};
    $.postJson(url,args,function(res){
            if(res.success){
                var focus_box=new Modal('focus_box');
                focus_box.modal('hide');
                $('#if_focus').val('true');
            }
            else return noticeBox(res.error_text);
        }
    );
}