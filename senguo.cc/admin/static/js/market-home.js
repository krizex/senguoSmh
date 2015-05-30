$(document).ready(function(){
    var shop_logo=$('#shop_imgurl').attr('data-img');
    console.log();
    if(parseInt($("#shop_status").val())==3){
        noticeBox("店铺休息中，暂不接收新订单");
    }
    if(isWeiXin()){
        wexin('',shop_logo);
    }
     //公告滚动
     $('#position li').first().addClass('on');
    if($('#position li').length>0){
        var slider =
            Swipe(document.getElementById('slider'), {
                auto: 3000,
                continuous: true,
                callback: function(pos) {
                    var i = bullets.length;
                    while (i--) {
                        bullets[i].className = ' ';
                    }
                    bullets[pos].className = 'on';
                }
            });
        var bullets = document.getElementById('position').getElementsByTagName('li');
    }
    /*var notice_con=window.dataObj.notices;
    if(typeof(notice_con)!='undefined'){
        $.getItem('/static/items/customer/notice-item.html?v=2015-0310',function(data){
            $('.notice-board').show();
            window.dataObj.notice_item=data;
            var notice_item=window.dataObj.notice_item;
            for(var i=0;i<notice_con.length;i++){
                var summary=notice_con[i][0];
                var detail=notice_con[i][1];
                var item=$(notice_item);
                item.find('.title').text(summary);
                item.find('.notice-detail').val(detail);
                $('.swipe-wrap').append(item);
                $('#position').append('<li></li>');
            }
            $('#position li').first().addClass('on');
            if($('#position li').length>0){
                var slider =
                    Swipe(document.getElementById('slider'), {
                        auto: 3000,
                        continuous: true,
                        callback: function(pos) {
                            var i = bullets.length;
                            while (i--) {
                                bullets[i].className = ' ';
                            }
                            bullets[pos].className = 'on';

                        }
                    });
                var bullets = document.getElementById('position').getElementsByTagName('li');
            }
        });
    }*/
    var top=$('.top-title').offset().top;
    $('goods-list').last().addClass('m-b60');
    $('.bottom-nav').find('li').addClass('add_cart');
    //$(".wrap-goods-box").height($(window).height()-50-$(".wrap-notice-box").height());
    //分类导航置顶
    var s_top = 0;
   $(window).scroll(function(){
        //分类滚动监听
        if($(window).scrollTop()>top){
            //$(".notice-box").hide();
            $('.top-title').addClass('fix-top');
            //$(".wrap-goods-box").height($(window).height()-50);
        }else{
            //$(".notice-box").show();
            $('.top-title').removeClass('fix-top');
            //$(".wrap-goods-box").height($(window).height()-50-$(".wrap-notice-box").height());
        }
        //s_top = $(".wrap-goods-box").scrollTop();
    });

    //all numer of page
    var fruit_pages=Int($('#fruit_page').val());
    var dry_pages=Int($('#dry_page').val());
    var pages_count=Int($('#page_count').val());
    //if type of mgoods doesn't exit then hide the mgoods button
     var m_pages=window.dataObj.mgoods_page;
    for(var i=0;i<m_pages.length;i++){
        var page=m_pages[i][0];
        var menu_id=m_pages[i][1];
        if(!page) $('.menu_classify'+menu_id).hide();
    }
    //if fruit or dry_fruit doesn't exit
    if(!fruit_pages) {
        $('#dryFruitPosition').hide();
        if(!dry_pages) {
            $('.menu_title').first().hide();
        }
    }
    //分类显示
    var top_title=$('.top-title');
    //get infomations of goods and push into html
     goodsList(1,5);
     scrollLoading();
     //已在购物车里的商品
    var cart_fs=window.dataObj.cart_fs;
    var cart_ms=window.dataObj.cart_ms;
    for(var key in cart_fs) {
        window.dataObj.fruits[cart_fs[key][0]]=cart_fs[key][1];
        fruits_num();
    }
    for(var key in cart_ms) {
        window.dataObj.mgoods[cart_ms[key][0]]=cart_ms[key][1];
        mgoods_num();
    }
}).on('click','.notice-item',function(){
        //公告详情
        var $this=$(this);
        var detail=$this.find('.notice-detail').val();
        var detail_box=new Modal('detail_box');
        detail_box.modal('show');
        $('.detail-box').find('.detail').text(detail);
    }).on('click','.check-lg-img',function(){
        //查看大图
            var $this=$(this);
            var parent=$this.parents('.goods-list-item');
            var type=$this.parents('.goods-list-item').data('type');
            var id=$this.parents('.goods-list-item').data('id');
            var img_url=$this.find('.img').attr('src');
            //var img_type=$this.find('.img').attr('data-img');
            var fruit_name=parent.find('.fruit-name').text();
            var fruit_intro=parent.find('.fruit_intro').val();
            var large_box=$('#large_imgbox');
            var if_favour=$this.parents('.goods-list-item').attr('data-favour');
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
            if(if_favour=='true') {large_box.find('.click-great').addClass('clicked').removeClass('able_click')}
            else {large_box.find('.click-great').removeClass('clicked').addClass('able_click');}
    }).on('click','.clicked',function(){
        noticeBox('亲，你今天已经为该商品点过赞了，一天只能对一个商品赞一次哦');
        // var check_large=new Modal('large_imgbox');
        // check_large.modal('show');
    }).on('click','.add_cart a',function(e){
        //添加到购物车
        stopDefault(e);
        var link=$(this).attr('href');
        addCart(link);
    }).on('click','.focus-btn',function(){
        //关注店铺
        focus();
    }).on('click','.goods-class-choose li',function(){
        //分类选择
        var $this=$(this);
        var text=$this.text();
        $('#classify').text(text).siblings('.up').toggle().siblings('.down').toggle();
        $('.classify-title').addClass('hidden');
        $('.goods-list').empty();
        // var top=$('#'+g_class+'').offset().top;
        // $('.choose-classify .icon').toggle();
        // var w_height=$('#'+g_class+'').height();
        // document.body.scrollTop =top-3*w_height;
        //top_title.find('.classify').text(text);
    }).on('click','.choose-classify',function(){
        var $this=$(this);
        $this.find('.icon').toggle();
        $('.goods-class-choose').toggle();
    }).on('click','.goods-class-choose li',function(){
        $('.goods-class-choose').hide();
    }).on('click','#all_goods',function(){
        //get all goods
        $('.goods-list').empty();
        var pages_count=Int($('#page_count').val());
        window.dataObj.page_count=pages_count;
        window.dataObj.page=1;
        window.dataObj.action=5;
        goodsList(1,5);
     }).on('click','#fruit_goods',function(){
        //get all fruit
        var fruit_pages=Int($('#fruit_page').val());
        window.dataObj.page_count=fruit_pages;
        window.dataObj.page=1;
        window.dataObj.action=6;
        goodsList(1,6);
     }).on('click','#dryfruit_goods',function(){
        //get all dry_fruit
        //var dry_pages=Int($('#dry_page').val());
        var dry_pages=parseInt($('#dry_page').val());
        window.dataObj.page_count=dry_pages;
        window.dataObj.page=1;
        window.dataObj.action=7;
        goodsList(1,7);
     }).on('click','.menu_goods',function(){
        //get all mgoods
        var $this=$(this);
        var id=$this.data('id');
        var pages=window.dataObj.mgoods_page;
        for(var i=0;i<pages.length;i++){
            var page=pages[i][0];
            var menu_id=pages[i][1];
            if(menu_id==id){
                window.dataObj.page_count=page;
            }
        }
        $('.classify-title').addClass('hidden');
        $('.goods-list').empty();
        window.dataObj.page=1;
        window.dataObj.action=8;
        window.dataObj.menu_id=id;
        goodsList(1,8);
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
            var parent=$this.parents('.goods-list-item');
            //是否关注店铺
            /*var if_focus=$('#if_focus').val();
            if(if_focus=='False')  $('.focus-box').modal('show');
            else{
                goodsNum($this.siblings('.number-change').find('.number-plus'),2);
                $this.addClass('hidden').siblings('.number-change').removeClass('hidden');
            }*/
            var storage=parseFloat(parent.attr('data-storage'));
            $this.siblings('.number-change').find('.number-input').val(0);
            if(storage>0) {
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
            else {noticeBox('库存不足啦！┑(￣▽ ￣)┍ ',$this)}
        }).on('click','.number-minus',function(){
            //商品数量操作
            var $this=$(this);
            pulse($this);
            goodsNum($this,1);
        }).on('click','.number-plus',function(){
            var $this=$(this);
            var parent=$this.parents('.goods-list-item');
            var num=Int($this.siblings('.number-input').val().trim());
            var storage=parseFloat(parent.attr('data-storage'));
            var regNum=/^[0-9]*$/;
            if(!regNum.test(num)) {
                $this.siblings('.number-input').val(storage);
                return noticeBox('商品数量只能为整数！',$this);
            }
            if(num<999) {pulse($this);goodsNum($this,2);}
            else {
                return noticeBox('最多只能添加999哦！',$this);
            }
        }).on('change','.number-input',function(){
            var $this=$(this);
            var num=$this.val();
            var change=$this.parents('.number-change');
            var regNum=/^[0-9]*$/;
            var parent=$this.parents('.goods-list-item');
            var storage_origin=parseFloat(parent.data('num'));
            var storage=parseFloat(parent.data('storage'));
            var storage_now;
            var num_item=parent.find('.number-input');
            var index=$this.index();
            var result=storage-num;
            if(num_item.length>0){
                for(var i=0;i<num_item.length;i++){
                    if(i!=index){
                        if(num_item.eq(i).val()<storage){
                             storage_now=storage-num_item.eq(i).val();
                        }
                        else{
                            storage_now=storage;
                        }  
                    }
                }
            }
            else {
                storage_now=storage;
            };
            if(!regNum.test(num)) {
                $this.val(0);
                change.addClass('hidden').siblings('.to-add').removeClass('hidden').addClass('add_cart_num');
                window.dataObj.cart_count--;
                $('.cart_num').text(window.dataObj.cart_count);
                SetCookie('cart_count',window.dataObj.cart_count);
                return noticeBox('商品数量只能为整数！┑(￣▽ ￣)┍',$this);
                parent.attr({'data-storage':storage_now});
            }
            if(num==0){
                parent.attr({'data-storage':storage_now});
                change.addClass('hidden').siblings('.to-add').removeClass('hidden').addClass('add_cart_num');
                if(window.dataObj.cart_count==1) {
                    $('.cart_num').text(window.dataObj.cart_count);
                    SetCookie('cart_count',0);
                }
                else {
                    window.dataObj.cart_count--;
                    wobble($('.cart_num'));
                    $('.cart_num').text(window.dataObj.cart_count).removeClass('hidden');
                    SetCookie('cart_count',window.dataObj.cart_count);
                }
            }   
            else if(0<num<999){
                if(num>=storage) {
                    if(storage_now<=0){
                        $this.val(0);
                    }
                    else if(storage_now>0){
                        window.dataObj.cart_count++;
                        wobble($('.cart_num'));
                        $('.cart_num').text(window.dataObj.cart_count).removeClass('hidden');
                        SetCookie('cart_count',window.dataObj.cart_count);
                        $this.val(Int(storage_now));
                        if(num_item.length>0){
                            storage_origin=storage_origin-storage;
                            for(var i=0;i<num_item.length;i++){
                                storage_now=storage_origin-num_item.eq(i).val();
                                //console.log(storage_now);
                            }
                        }
                        else {
                            storage_now=0;
                        };
                        parent.attr({'data-storage':storage_now});
                        //console.log(233333);
                        if(storage_now<num) {return noticeBox('只有这么多了哦！┑(￣▽ ￣)┍',$this);}
                    }
                }
                else if(num<storage){
                    $this.val(num);
                    storage_now=storage_now-num;
                    parent.attr({'data-storage':storage_now});
                    //console.log(24444444);
                }
            }
        else if(num>=999) {
                if(result>0) {parent.attr({'data-storage':result});}
                else parent.attr({'data-storage':0});
                if(storage<999) {
                    $this.val(Int(storage_now));
                    //console.log(25555555);
                    return noticeBox('只有这么多了哦！┑(￣▽ ￣)┍',$this);
                }
                else {
                    $this.val(999);
                    storage_now=storage_now-999;
                    parent.attr({'data-storage':storage_now});
                    //console.log(266666);
                     return noticeBox('最多只能添加999哦！┑(￣▽ ￣)┍',$this);
                }
            }
        //}).on('click','.toggle',function(e){
            //计价方式折叠/显示
            //stopPropagation(e);
            //var target  = $(e.target);
            //var $this=$(this);
            //var $parent=$this.parents('.goods-list-item');
            //var $charge_list=$this.parents('.goods-list-item').find('.charge-list');
            //if(target.closest('.forbid_click').length == 0){
            //    $parent.find('.back-shape').toggleClass('hidden');
            //    $charge_list.toggle();
            //    $parent.find('.toggle_icon').toggleClass('arrow');
            //    $parent.toggleClass('pr35');
            //};
        });
window.dataObj.page=1;
window.dataObj.count=1;
window.dataObj.action=5;
window.dataObj.finished=true;
$('.loading').html("~努力加载中 ( > < )~").show();
var scrollLoading=function(){  
    $(window).scroll(function(){
        var maxnum = window.dataObj.page_count;            //设置加载最多次数  
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
        var range = 150;             //距下边界长度/单位px          //插入元素高度/单位px
        var totalheight = 0;
        var main = $(".container");                  //主体元素
        if(!maxnum) maxnum=Int($('#page_count').val());
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);
        if(window.dataObj.finished&&(main.height()-range) <= totalheight  && window.dataObj.page < maxnum) {
            window.dataObj.finished=false;
            window.dataObj.page++;
            goodsList(window.dataObj.page,window.dataObj.action);
        }
        else if(window.dataObj.page == maxnum){
              $('.loading').html("~没有更多商品了呢 ( > < )~").show();
        }
    });
}
var goodsList=function(page,action){
    var url='';
    var action = action;
    var args={
        action:action,
        page:page,
        menu_id:window.dataObj.menu_id
    };
    // alert('i am here');
    $.postJson(url,args,function(res){
        if(res.success)
        {
            if(action==5&&page== 1&&res.w_orders.length<10){
                    $('.loading').html("~没有更多商品了呢 ( > < )~").show();
            }
            if(action==6&&page== 1&&res.fruit_list.length<10){
                    $('.loading').html("~没有更多商品了呢 ( > < )~").show();
            }
            if(action==7&&page== 1&&res.dry_fruit_list.length<10){
                    $('.loading').html("~没有更多商品了呢 ( > < )~").show();
            }
            if(action==8&&page== 1&&res.mgood_list.length<10){
                    $('.loading').html("~没有更多商品了呢 ( > < )~").show();
            }
            //get item dom
            if(window.dataObj.goods_item==undefined){
                getItem('/static/items/customer/market-goods-item.html?v=2015-0320',function(data){
                    window.dataObj.goods_item=data;
                    getItem('/static/items/customer/charge-item.html?v=2015-0310',function(data){
                        window.dataObj.charge_item=data;
                        getItem('/static/items/customer/classify_item.html?v=2015-0310',function(data){
                            window.dataObj.classify_item=data;
                            initData(res);
                        });
                    });
                });
            }
            else {
                initData(res);
            }
        }
        else {
            noticeBox(res.error_text);
        }
        },
        function(){noticeBox('网络好像不给力呢~ ( >O< ) ~');},
        function(){noticeBox('服务器貌似出错了~ ( >O< ) ~');});
        var initData=function(res){
            var w_orders=res.w_orders;
            if(w_orders&&w_orders.length==0){
                 $('.loading').html("~没有更多商品了呢 ( > < )~").show();
                 return;          
            }
                    var fruit_list=res.fruit_list;
                    var dry_fruit_list=res.dry_fruit_list;
                    var mgood_list=res.mgood_list;
                    var mgoods_item=window.dataObj.mgoods_item;
                    var classify_item=window.dataObj.classify_item;
                    var goods_info;
                    if(w_orders){ goods_info=w_orders;}
                    else if(fruit_list){ goods_info=fruit_list;}
                    else if(dry_fruit_list){ goods_info=dry_fruit_list;}
                    else if(mgood_list){ goods_info=mgood_list;}
                    for(var goods in goods_info){
                        var goods_list=goods_info[goods];
                        var type=goods_list[0];
                        var good=goods_list[1];
                        var menu_id;
                        if(goods_list[2]) {menu_id=goods_list[2];}
                        if(type=='fruit'){
                            fruitItem($('.fruit_goods_list'),good,'fruit');//fruits information
                            if(action==5) {$('.fruit_cassify').removeClass('hidden');}
                        }
                        else if(type=='dry_fruit'){
                            fruitItem($('.dryfruit_goods_list'),good,'fruit');//fruits information
                            if(action==5) {$('.dryfruit_classify').removeClass('hidden')}
                        }
                        else if(type=='mgoods'){
                            fruitItem($('.menu_goods_list'+menu_id),good,'menu');
                            if(action==5) {$('.menu_classify'+menu_id).removeClass('hidden')}
                        }
                    }
                    var fruits=window.dataObj.fruits;
                    var mgoods=window.dataObj.mgoods;
                    var c_fs=[];
                    var c_ms=[];
                    for(var key in fruits){
                        c_fs.push([key,fruits[key]]);
                    };
                    for(var key in mgoods){
                        c_ms.push([key,mgoods[key]]);
                    };
                    cartNum(c_fs,'.fruit-list');
                    cartNum(c_ms,'.menu-list');
                    window.dataObj.count++;
                    window.dataObj.finished=true;
        }
};

var fruitItem=function(box,fruits,type){
    var goods_item=window.dataObj.goods_item;
    var charge_item=window.dataObj.charge_item;
        var $item=$(goods_item);
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
        if(!code) code='TDSG';
        $item.attr({'data-id':id,'data-type':type,'data-storage':storage,'data-num':storage,'data-favour':favour_today}).addClass(code);
        $item.find('.fruit_intro').val(intro);
        $item.find('.fruit-name').text(name);
        if(saled>9999) $item.find('.number').text('9999+');
        else $item.find('.number').text(saled);
        $item.find('.great').text(favour).siblings('em').attr({'data-id':favour}); //if favour is not correct,should been replaced
        if(favour_today) $item.find('.heart').addClass('red-heart');
        else $item.find('.heart').addClass('gray-heart');
        //商品标签转换
        tagText($item.find('.tagItem'),tag);
        //售完状态
        if(storage<=0){
            $item.append('<div class="sold-out bg_change"><div class="out"></div></div>').find('.box').addClass('desaturate').find('.arrow').css({'border-color':'transparent #B6B6B6 transparent transparent'});
            $item.find('.sold-out').css({'background-color':'rgba(0,0,0,0.1)'});
            $item.find('.bg').css({'background':'#FCFCFC'});
            $item.find('.color').css({'color':'#757575'});
            //AndroidImg('bg_change');
        }
        //if there isn't only one type of charge_type
        //if(charge_types.length>1){
        //    $item.find('.show-box').addClass('toggle');
        //    $item.find('.charge-list').addClass('toggle');
        //    $item.find('.toggle_icon').addClass('arrow');
        //    $item.addClass('pr35');
        //    $item.find('.back-shape').addClass('shape');
        }
        //charge_type info
        for(var key in charge_types ){
            var $charge_item=$(charge_item);
            if(key==0){
                var id=charge_types[0]['id'];
                var price=charge_types[0]['price'];
                var num=charge_types[0]['num'];
                var unit=charge_types[0]['unit'];
                if(unit==1) unit='个';
                else  if(unit==2) unit='斤';
                else  if(unit==3) unit='份';
                $charge_item.attr({'data-id':id});
                $charge_item.find('.price').text(price);
                $charge_item.find('.num').text(num);
                $charge_item.find('.chargeUnit').text(unit);
                $item.find('.charge-first').append($charge_item);
            }
            else{
                var id=charge_types[key]['id'];
                var price=charge_types[key]['price'];
                var num=charge_types[key]['num'];
                var unit=charge_types[key]['unit'];
                if(unit==1) unit='个 ';
                else  if(unit==2) unit='斤';
                else  if(unit==3) unit='份';
                $charge_item.attr({'data-id':id}).addClass('more_charge');
                $charge_item.find('.price').text(price);
                $charge_item.find('.num').text(num);
                $charge_item.find('.chargeUnit').text(unit);
                var $li=$('<li class="border-color set-w100-fle"></li>');
                $li.append($charge_item);
                $item.find('.charge-list').append($li);
            }
            //goods img
            if(!img_url){
                $item.find('.img').attr({'data-original':'/static/design_img/'+code+'.png'});
            }else{
                $item.find('.img').attr({'data-original':img_url+'?imageView/1/w/170/h/170'});
            }
        }
        box.append($item);
        //$('.lazy_img').lazyload({container: $("#wrap-goods-box"),threshold:10});
        $('.lazy_img').lazyload({threshold:100,effect:"fadeIn"});
};
window.dataObj.fruits={};
window.dataObj.mgoods={};
function cartNum(cart_ms,list){
    var item_list=$(list);
    for(var key in cart_ms) {
        for(var i=0;i<item_list.length;i++){
            var item=item_list.eq(i).find('.charge-type');
            for(var j=0;j<item.length;j++){
                var charge = item.eq(j);
                var id = charge.data('id');
                var add = charge.siblings('.num_box').find('.to-add');
                var change = charge.siblings('.num_box').find('.number-change');
                var input = change.find('.number-input');
                if (id == cart_ms[key][0]) {
                    var $parent=charge.parents('.goods-list-item');
                    var storage=$parent.attr('data-storage');
                    add.removeClass('show');
                    change.removeClass('hidden');
                    input.val(cart_ms[key][1]);
                    $parent.attr({'data-storage':storage-cart_ms[key][1]});
                    //if(charge.hasClass('more_charge')) {
                    //    $parent.find('.charge-list').show();
                    //    $parent.find('.back-shape').toggleClass('hidden');
                    //    $parent.find('.toggle_icon').removeClass('arrow');
                    //    $parent.removeClass('pr35');
                    }
                }
            }
        }
    }
}

function goodsNum(target,action){
    var item=target.siblings('.number-input');
    var change=target.parents('.number-change');
    var num=item.val();
    var parent=target.parents('.goods-list-item');
    var storage=parseFloat(parent.data('storage'));
    var type_list=target.parents('.goods-list');
    var id=target.parents('.num_box').attr('data-id');
    if(action==1&&num<=0) {num=0;target.addClass('disable');}
    if(action==2)
    {
        if(storage<=0){
            noticeBox('库存不足啦！┑(￣▽ ￣)┍ ',target);
        }
        else if(storage>0){
            num++;
            item.val(num);
            storage--;
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
            storage++;
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
    if(type_list.hasClass('menu-list')) { window.dataObj.mgoods[id]=num;mgoods_num();}
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
    mgoods_num();
    var fruits=window.dataObj.fruits;
    var mgoods=window.dataObj.mgoods;
    var args={
        action:action,
        fruits:fruits,
        mgoods:mgoods
    };
    if(!isEmptyObj(fruits)){fruits={}}
    if(!isEmptyObj(mgoods)){mgoods={}}
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
                $('.goods-list-item').each(function(){
                    var $this=$(this);
                    var type=$this.data('type');
                    var goods_id=$this.data('id');
                    if(type==type&&goods_id==id){
                        var num=$this.find('.great').text();
                        $this.attr({'data-favour':'true'});
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
        },
         function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
         function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
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
    },
     function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')},
     function(){return noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}
function Swipe(b,g){var c=function(){};var r=function(A){setTimeout(A||c,0)};var z={addEventListener:!!window.addEventListener,touch:("ontouchstart" in window)||window.DocumentTouch&&document instanceof DocumentTouch,transitions:(function(A){var C=["transformProperty","WebkitTransform","MozTransform","OTransform","msTransform"];for(var B in C){if(A.style[C[B]]!==undefined){return true}}return false})(document.createElement("swipe"))};if(!b){return}var i=b.children[0];var v,h,o;g=g||{};var f=parseInt(g.startSlide,10)||0;var s=g.speed||300;g.continuous=g.continuous?g.continuous:true;function m(){v=i.children;h=new Array(v.length);o=b.getBoundingClientRect().width||b.offsetWidth;i.style.width=(v.length*o)+"px";var B=v.length;while(B--){var A=v[B];A.style.width=o+"px";A.setAttribute("data-index",B);if(z.transitions){A.style.left=(B*-o)+"px";p(B,f>B?-o:(f<B?o:0),0)}}if(!z.transitions){i.style.left=(f*-o)+"px"}b.style.visibility="visible"}function l(){if(f){a(f-1)}else{if(g.continuous){a(v.length-1)}}}function n(){if(f<v.length-1){a(f+1)}else{if(g.continuous){a(0)}}}function a(D,A){if(f==D){return}if(z.transitions){var B=Math.abs(f-D)-1;var C=Math.abs(f-D)/(f-D);while(B--){p((D>f?D:f)-B-1,o*C,0)}p(f,o*C,A||s);p(D,0,A||s)}else{e(f*-o,D*-o,A||s)}f=D;r(g.callback&&g.callback(f,v[f]))}function p(A,C,B){k(A,C,B);h[A]=C}function k(B,E,D){var A=v[B];var C=A&&A.style;if(!C){return}C.webkitTransitionDuration=C.MozTransitionDuration=C.msTransitionDuration=C.OTransitionDuration=C.transitionDuration=D+"ms";C.webkitTransform="translate("+E+"px,0)translateZ(0)";C.msTransform=C.MozTransform=C.OTransform="translateX("+E+"px)"}function e(E,D,A){if(!A){i.style.left=D+"px";return}var C=+new Date;var B=setInterval(function(){var F=+new Date-C;if(F>A){i.style.left=D+"px";if(y){u()}g.transitionEnd&&g.transitionEnd.call(event,f,v[f]);clearInterval(B);return}i.style.left=(((D-E)*(Math.floor((F/A)*100)/100))+E)+"px"},4)}var y=g.auto||0;var t;function u(){t=setTimeout(n,y)}function q(){y=g.auto>0?g.auto:0;clearTimeout(t)}var d={};var w={};var x;var j={handleEvent:function(A){switch(A.type){case"touchstart":this.start(A);break;case"touchmove":this.move(A);break;case"touchend":r(this.end(A));break;case"webkitTransitionEnd":case"msTransitionEnd":case"oTransitionEnd":case"otransitionend":case"transitionend":r(this.transitionEnd(A));break;case"resize":r(m.call());break}if(g.stopPropagation){A.stopPropagation()}},start:function(A){var B=A.touches[0];d={x:B.pageX,y:B.pageY,time:+new Date};x=undefined;w={};i.addEventListener("touchmove",this,false);i.addEventListener("touchend",this,false)},move:function(A){if(A.touches.length>1||A.scale&&A.scale!==1){return}if(g.disableScroll){A.preventDefault()}var B=A.touches[0];w={x:B.pageX-d.x,y:B.pageY-d.y};if(typeof x=="undefined"){x=!!(x||Math.abs(w.x)<Math.abs(w.y))}if(!x){A.preventDefault();q();w.x=w.x/((!f&&w.x>0||f==v.length-1&&w.x<0)?(Math.abs(w.x)/o+1):1);k(f-1,w.x+h[f-1],0);k(f,w.x+h[f],0);k(f+1,w.x+h[f+1],0)}},end:function(C){var E=+new Date-d.time;var A=Number(E)<250&&Math.abs(w.x)>20||Math.abs(w.x)>o/2;var B=!f&&w.x>0||f==v.length-1&&w.x<0;var D=w.x<0;if(!x){if(A&&!B){if(D){p(f-1,-o,0);p(f,h[f]-o,s);p(f+1,h[f+1]-o,s);f+=1}else{p(f+1,o,0);p(f,h[f]+o,s);p(f-1,h[f-1]+o,s);f+=-1}g.callback&&g.callback(f,v[f])}else{p(f-1,-o,s);p(f,0,s);p(f+1,o,s)}}i.removeEventListener("touchmove",j,false);i.removeEventListener("touchend",j,false)},transitionEnd:function(A){if(parseInt(A.target.getAttribute("data-index"),10)==f){if(y){u()}g.transitionEnd&&g.transitionEnd.call(A,f,v[f])}}};m();if(y){u()}if(z.addEventListener){if(z.touch){i.addEventListener("touchstart",j,false)}if(z.transitions){i.addEventListener("webkitTransitionEnd",j,false);i.addEventListener("msTransitionEnd",j,false);i.addEventListener("oTransitionEnd",j,false);i.addEventListener("otransitionend",j,false);i.addEventListener("transitionend",j,false)}window.addEventListener("resize",j,false)}else{window.onresize=function(){m()}}return{setup:function(){m()},slide:function(B,A){a(B,A)},prev:function(){q();l()},next:function(){q();n()},getPos:function(){return f},kill:function(){q();i.style.width="auto";i.style.left=0;var B=v.length;while(B--){var A=v[B];A.style.width="100%";A.style.left=0;if(z.transitions){k(B,0,0)}}if(z.addEventListener){i.removeEventListener("touchstart",j,false);i.removeEventListener("webkitTransitionEnd",j,false);i.removeEventListener("msTransitionEnd",j,false);i.removeEventListener("oTransitionEnd",j,false);i.removeEventListener("otransitionend",j,false);i.removeEventListener("transitionend",j,false);window.removeEventListener("resize",j,false)}else{window.onresize=null}}}}if(window.jQuery||window.Zepto){(function(a){a.fn.Swipe=function(b){return this.each(function(){a(this).data("Swipe",new Swipe(a(this)[0],b))})}})(window.jQuery||window.Zepto)};