$(document).ready(function(){
    $('.bottom-nav').find('li').addClass('add_cart');
    var width = $("#swiper-container").width();
    var height = $(window).height();
    $(".notice-item").width("100%");
    if($(".swiper-slide").size()>1){
        $(".swiper-wrapper").width(width*$(".swiper-slide").size());
        new Swiper('#swiper-container',{
            mode: 'horizontal',
            loop:true,
            grabCursor: true,
            pagination: '.pagination',
            autoplay:"3000",
            autoplayDisableOnInteraction:false
        });
    }
    //分类显示
    var top_title=$('.top-title');
    //get infomations of goods and push into html
    var link_group=$.getUrlParam("group");
    var link_search=$.getUrlParam("search");
    if(link_group!= null){
        window.dataObj.page=1;
        _action=6;
        _group_id = Number(link_group);
        goodsList(1,6,_group_id);
    }
    else if(link_search != null){
        window.dataObj.page=1;
        _action=9;
        _search = link_search;
        goodsList(1,9);
        $('#classify').text('搜索结果');
        $('.wrap-goods-box').css('margin-top','40px');
        $('.classify-title').hide();
    }else{
        if($('.more-group li').length==0){
            $(".wrap-loading-box").addClass("hidden");
        }
        $('.more-group li').each(function(){
            var $this=$(this);
            var id = Number($this.attr('data-id'));
            _group_id = parseInt(id);
            if(_finished==true&&_group_id!=-2){
                goodsList(1,6,_group_id); 
                scrollLoading(_group_id);
            }
         });
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
}).on("click",".more-group-btn",function(){
    $(".more-group").toggleClass("hidden");
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
}).on('click','.check-lg-img',function(){
    //查看大图
    var $this=$(this);
    var parent=$this.parents('.goods_item_item');
    var type=$this.parents('.goods_item_item').data('type');
    var id=$this.parents('.goods_item_item').data('id');
    var img_url=$this.find('.img').attr('src');
    //var img_type=$this.find('.img').attr('data-img');
    var fruit_name=parent.find('.fruit-name').text();
    var fruit_intro=parent.find('.fruit_intro').val();
    var large_box=$('#large_imgbox');
    var if_favour=$this.parents('.goods_item_item').attr('data-favour');
    if(img_url!='') {
        if(img_url.indexOf('/design_img')) img_url=img_url.replace('.png','_l.png');
        img_url=img_url.replace('w/170/h/170','w/560/h/560');
    }
    var check_large=new Modal('large_imgbox');
    check_large.modal('show');
    large_box.attr({'data-id':id,'data-type':type});
    large_box.find('#largeImg').attr({'src':img_url});
    large_box.find('.modal-title').text(fruit_name);
    large_box.find('.intro').text(fruit_intro);
    if(if_favour=='True') {large_box.find('.click-great').addClass('clicked').removeClass('able_click')}
    else {large_box.find('.click-great').removeClass('clicked').addClass('able_click');}
}).on('click','.clicked',function(){
    noticeBox('亲，你今天已经为该商品点过赞了，一天只能对一个商品赞一次哦');
}).on('click','.add_cart a',function(e){
    //添加到购物车
    stopDefault(e);
    var link=$(this).attr('href');
    addCart(link);
}).on('click','.focus-btn',function(){
    //关注店铺
    focus();
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
}).on('click','.choose-classify',function(){
    var $this=$(this);
    $this.find('.icon').toggle();
    $('.goods-class-choose').toggle();
}).on('click','body',function(e){
    if($(e.target).closest('.to-hide').length == 0){
        $('.classify-list').hide();
    }
}).on('click','#all_goods',function(){
    //get all goods
    $('.bingo-list').empty();
    window.dataObj.page=1;
    _action=5;
    goodsList(1,5);
}).on('click','.able_click',function(e){
    //点赞
    var $this=$(this);
    $this.unbind('click');
    var large_box=$('.large-img-box');
    var type=large_box.attr('data-type');
    var id=large_box.attr('data-id');
    great(type,id);
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
    $this.addClass("active").siblings("li").removeClass("active");
    var group_id=Number($this.attr("data-id"));
    if(index!=2){
        if(group_id==-2){
        $(".bingo-list").removeClass("hidden");
        }else{
            $(".bingo-list").addClass("hidden");
            $(".goods-list-"+group_id).removeClass("hidden");
        }
        $("#cur_group").text($this.text());
        _group_id=group_id;
    }
}).on('click','.more-group li',function(){
    var $this=$(this);
    var text=$this.text();
    var group_id=Number($this.attr('data-id'));
    if(group_id==-2){
        $(".bingo-list").removeClass("hidden");
    }else{
        $(".bingo-list").addClass("hidden");
        $('.goods-list-'+group_id).removeClass("hidden");
        _group_id=group_id;
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
var _group_id;
$('.loading').html("~努力加载中 ( > < )~").show();
var scrollLoading=function(_group_id){
    $(window).scroll(function(){
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
        var range = 150;             //距下边界长度/单位px          //插入元素高度/单位px
        var totalheight = 0;
        var main = $('.goods-list-'+_group_id);              //主体元素
        var nomore=main.attr("data-nomore");
        var page=parseInt($('.goods-list-'+_group_id).attr("data-page"));
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);
        if(_finished&&(main.height()-range) <= totalheight  && nomore=="false") {
            _finished=false;
            page = page+1;
            $('.goods-list-'+_group_id).attr("data-page",page);
            goodsList(page,_action,_group_id);
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
    $.postJson(url,args,function(res){
            if(res.success)
            {
                var nomore = res.nomore
                initData(res.data);
                $('.goods-list-'+_group_id).attr({"data-nomore":nomore})
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
                fruitItem($('.goods-list-'+_group_id),data[key]);//fruits information
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

var fruitItem=function(box,fruits,type){
    var $item = $("#goods_item").children("li").clone();
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
        ori_img=img_url+'?imageView2/1/w/800/h/400';
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
    $item.attr({"data-id":id,"data-num":storage,"data-storage":storage,"data-limit":limit_num,"data-favour":favour_today,"data-relate":relate,"data-unitnum":unitnum,"data-buy":limit_today,"data-charge":charge_id,"data-price":charge_price}).addClass(code);
    $item.find(".g-name").html(name);
    $item.find(".g-detail").html(intro);
    $item.find(".goods_img").attr("src",ori_img);
    if(charge_type){
         if(charge_type.market_price){
            $item.find(".src-price-num").html(charge_type.market_price+"元/"+charge_type.num+charge_type.unit);
        }else{
            $item.find(".src-price-num").html(charge_type.price+"元/"+charge_type.num+charge_type.unit);
        }
        $item.find(".cur-price-num").html(charge_type.price+"元/"+charge_type.num+charge_type.unit);
        $item.find(".price-all-num").html(charge_type.price);
    }
    $item.find(".status-tip").addClass(tag);
    if(storage<=0){
        $item.find(".sold-out").removeClass("hidden");
        $item.find(".goods-img-box").addClass("desaturate");
        $item.find(".goods-attr-box").addClass("desaturate")
    }
    box.append($item);
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
                storage = change_num
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