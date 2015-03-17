$(document).ready(function(){
    //get infomations of goods and push into html
     goodsList();
    //添加到购物车
    $('.bottom-nav').find('li').addClass('add_cart');
    $(document).find('.add_cart a').on('click',function(){
        var link=$(this).attr('href');
        addCart(link);
    });
    //分类显示
    var top_title=$('.top-title');
    $(document).find('.choose-classify').on('click',function(){
        var $this=$(this);
        $this.find('.icon').toggle();
        $('.goods-class-choose').slideToggle(100);
    });
    $(document).find('.goods-class-choose li').on('click',function(){
        $('.goods-class-choose').slideUp(100);
    });
    //分类导航置顶
    /*$(window).scroll(function(){
        var wind_dist=$(window).scrollTop();
        //分类滚动监听
        var box=$('.classify-title');
        for(var i=0;i<box.length;i++){
            var dist=box[i].offsetTop;
            var classify=box[i].innerHTML;
            if(wind_dist>=dist){top_title.find('.classify').text(classify);}
        }
    });*/
    //分类选择
    $(document).find('.goods-class-choose li').hammer().on('tap',function(){
        var $this=$(this);
        var g_class=$this.data('class');
        var top=$('#'+g_class+'').offset().top;
        $('html, body').animate({scrollTop:top}, 50);
        //top_title.find('.classify').text(text);
    });
    //公告滚动
    var notice_con=window.dataObj.notices;
    if(typeof(notice_con)!='undefined'){
        $.ajaxSetup({'async':false});
        $.getItem('/static/items/customer/notice-item.html?v=2015-0309',function(data){
            window.dataObj.notice_item=data;
            for(var i=0;i<notice_con.length;i++){
                var summary=notice_con[i][0];
                var detail=notice_con[i][1];
                var item=$(window.dataObj.notice_item);
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
    }
    //公告详情
    $(document).on('click','.notice-item',function(){
        var $this=$(this);
        var detail=$this.find('.notice-detail').val();
        $('.detail-box').modal('show');
        $('.detail-box').find('.detail').text(detail);
    });
    $('goods-list').last().addClass('m-b60');
    //查看大图
    $(document).on('click','.check-lg-img',function(){
            var $this=$(this);
            var parent=$this.parents('.goods-list-item');
            var type=$this.parents('.goods-list-item').data('type');
            var id=$this.parents('.goods-list-item').data('id');
            var img_url=$this.find('.img').attr('src');
            //var img_type=$this.find('.img').attr('data-img');
            var fruit_name=parent.find('.fruit-name').text();
            var fruit_intro=parent.find('.fruit_intro').val();
            var large_box=$('.large-img-box');
            var if_clicked=$this.parents('.goods-list-item').find('.great-number em').attr('data-id');
            if(if_clicked=='2') {$('.click-great').addClass('clicked')}
            else $('.click-great').removeClass('clicked');
            if(img_url!='') {
                if(img_url.indexOf('/design_img')) img_url=img_url.replace('.png','_l.png');
                img_url=img_url.replace('w/160/h/160','w/560/h/560');
            }
            large_box.modal('show').attr({'data-id':id,'data-type':type});
            large_box.find('#largeImg').attr({'src':img_url});
            large_box.find('.modal-title').text(fruit_name);
            large_box.find('.intro').text(fruit_intro);
    });
    //关注店铺
    $(document).find('.focus-btn').hammer().on('tap',function(){
            focus();
    });
});
var goodsList=function(){
    var url='';
    var action = 5;
    var args={
        action:action,
    };
    $.postJson(url,args,function(res){
        if(res.success)
        {
           window.dataObj.cart_fs=res.cart_fs;
           window.dataObj.cart_ms=res.cart_ms;
            var frtuis=res.fruits;
            var dry_fruits=res.dry_fruits;
            var mgoods=res.mgoods;
            $.getItem('/static/items/customer/market-goods-item.html?v=2015-0309',function(data){
                window.dataObj.goods_item=data;
            });    
             $.getItem('/static/items/customer/charge-item.html?v=2015-0309',function(data){
                window.dataObj.charge_item=data;
            }); 
            $.getItem('/static/items/customer/mgoods_item.html?v=2015-0309',function(data){
                window.dataObj.mgoods_item=data;
            });
            $.getItem('/static/items/customer/classify_item.html?v=2015-0309',function(data){
                window.dataObj.classify_item=data;
            });         
            if(!frtuis) $('.fruit_cassify').hide();
            else {
                fruitItem($('.fruit_goods_list'),frtuis);//fruits information
                $('.fruit_cassify').show();
            }
            if(!frtuis) $('.dryfruit_classify').hide();
            else{
                fruitItem($('.dryfruit_goods_list'),dry_fruits);//dry_fruits information
                $('.dryfruit_classify').show();
            } 
            if(mgoods){
                for(var key in mgoods){
                var $mgoods=$(window.dataObj.mgoods_item);
                var $classify=$(window.dataObj.classify_item);
                var title=$('.menu_'+key).text();
                $classify.text(title).attr({'id':'menu'+key});
                fruitItem($mgoods,mgoods[key]);
                $('.goods-box').append($classify);
                $('.goods-box').append($mgoods);
                }//mgoods information
            }
            //已在购物车里的商品
            var cart_fs=window.dataObj.cart_fs;
            var cart_ms=window.dataObj.cart_ms;
            cartNum(cart_fs,'.fruit-list');
            cartNum(cart_ms,'.menu-list');
            //点赞
            $('.click-great').hammer().on('tap',function(){
                var $this=$(this);
                var large_box=$('.large-img-box');
                var type=large_box.attr('data-type');
                var id=large_box.attr('data-id'); 
                great(type,id);
            });
            //首次添加商品
            $('.to-add').hammer().on('tap',function(){
                var $this=$(this);
                //是否关注店铺
                var if_focus=$('#if_focus').val();
                if(if_focus=='False')  $('.focus-box').modal('show');
                else{
                      goodsNum($this.siblings('.number-change').find('.number-plus'),2);
                     $this.addClass('hidden').siblings('.number-change').removeClass('hidden');
                }     
                //果篮显示商品种类数
                if(cart_count==0) {$('.cart_num').show();}
                if($this.hasClass('add_cart_num')){
                    cart_count++;
                    $('.cart_num').text(cart_count);
                    SetCookie('cart_count',cart_count);
                    $this.removeClass('add_cart_num');
                }
            });
            //商品数量操作
            $(document).find('.goods-list').find('.number-minus').hammer().on('tap',function(){
                var $this=$(this);
                goodsNum($this,1);
            });
            $(document).find('.goods-list').find('.number-plus').hammer().on('tap',function(){
                var $this=$(this);
                goodsNum($this,2);
            });
             //商品输入框为0时
            $(document).find('.number-input').on('blur',function(){
                var $this=$(this);
                var num=$this.val();
                var change=$this.parents('.number-change');
                if(num==0){
                    change.addClass('hidden').siblings('.to-add').removeClass('hidden').addClass('add_cart_num');
                    if(cart_count==1) {
                        $('.cart_num').remove();
                        SetCookie('cart_count',0);
                    }
                    else {
                        cart_count--;
                        $('.cart_num').text(cart_count);
                        SetCookie('cart_count',cart_count);
                    }
                }
            });
            //计价方式折叠/显示
            $('.toggle').mouseup(function(e){
                    var $this=$(this);
                    var $parent=$this.parents('.goods-list-item');
                    var $charge_list=$this.parents('.goods-list-item').find('.charge-list');
                    var forbid_click=$this.parents('.goods-list-item').find('.forbid_click');
                    if(!forbid_click.is(e.target) &&forbid_click.has(e.target).length === 0){
                        $charge_list.slideToggle(5);
                        $parent.find('.toggle_icon').toggleClass('arrow');
                        $parent.toggleClass('pr35');
                        $parent.find('.back-shape').toggle();
                        
                    }
            });
        }
        else alert(res.error_text);
        },
        function(){alert('网络错误')})
};

var fruitItem=function(box,fruits){
    for(var key in fruits){
            var $item=$(window.dataObj.goods_item);
            var id=fruits[key]['id'];
            var storage=fruits[key]['storage'];
            var code=fruits[key]['code'];
            var tag=fruits[key]['tag'];
            var img_url=fruits[key]['img_url'];
            var intro=fruits[key]['intro'];
            var name=fruits[key]['name'];
            var saled=fruits[key]['saled'];
            var favour=fruits[key]['favour'];
            var charge_types=fruits[key]['charge_types'];
            if(!code) code='TDSG';
            $item.attr({'data-id':id,'data-type':'fruit','data-num':storage}).addClass(code);
            $item.find('.fruit_intro').val(intro);
            $item.find('.fruit-name').text(name);
            if(saled>9999) $item.find('.number').text('9999+');
            else $item.find('.number').text(saled);
            $item.find('.great').text(favour);       
            if(!favour) $item.find('.heart').addClass('gray-heart');
            else $item.find('.heart').addClass('red-heart');
            //商品标签转换
            tagText($item.find('.tagItem'),tag);
            //售完状态
            if(storage<=0){
                $item.append('<div class="sold-out bg_change"><div class="out"></div></div>').find('.box').addClass('desaturate').find('.arrow').css({'border-color':'transparent #B6B6B6 transparent transparent'});
                $item.find('.sold-out').css({'background-color':'rgba(0,0,0,0.1)'});
                $item.find('.bg').css({'background':'#FCFCFC'});
                $item.find('.color').css({'color':'#757575'});
                AndroidImg('bg_change');
            }
            //if there isn't only one type of charge_type
            if(charge_types.length>1){
                $item.find('.show-box').addClass('toggle');
                $item.find('.charge-list').addClass('toggle');
                $item.find('.toggle_icon').addClass('arrow');
                $item.addClass('pr35');
                $item.find('.back-shape').addClass('shape');
            }
            //charge_type info
            for(var key in charge_types ){
                var $charge_item=$(window.dataObj.charge_item);
                if(key==0){
                    var id=charge_types[0]['id'];
                    var price=charge_types[0]['price'];
                    var num=charge_types[0]['num'];
                    var unit=charge_types[0]['unit'];
                    if(unit==1) unit='个 ';
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
                    var $li=$('<li class="border-color set-w100-fle"></li');
                    $li.append($charge_item);
                    $item.find('.charge-list').append($li);
                }
                //goods img
                if(!img_url) $item.find('.img').attr({'src':'/static/design_img/'+code+'.png?v=20150316'});
                else $item.find('.img').attr({'src':img_url+'?imageView/1/w/160/h/160'});
            } 
            box.append($item);
        }   
}

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
                    add.removeClass('show');
                    change.removeClass('hidden');
                    input.val(cart_ms[key][1]);
                    if(charge.hasClass('more_charge')) {
                        var parent=charge.parents('.goods-list-item');
                        parent.find('.charge-list').show();
                        parent.removeClass('pr35');
                        parent.find('.back-shape').hide();
                        parent.find('.toggle_icon').removeClass('arrow');
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
    var storage=parseFloat(parent.data('num'));
    var s_num=storage-num;
    if(action==1&&num<=0) {num=0;target.addClass('disable');}
    if(action==2)
    {
        if(s_num==0&&confirm('库存不足啦！┑(￣▽ ￣)┍ ')){

        }
        else if(s_num>0){
            num++;
            item.val(num);
        }
    }
    else if(action==1)
    {
        var val=parseInt(item.val());
        if(val>0)
        {
            num--;
            item.val(num);
            if(val==1){
                change.addClass('hidden').siblings('.to-add').removeClass('hidden').addClass('add_cart_num');
                if(cart_count==1) {
                    $('.cart_num').remove();
                    SetCookie('cart_count',0);
                }
                else {
                    cart_count--;
                    $('.cart_num').text(cart_count);
                    SetCookie('cart_count',cart_count);
                }
            }
        }
    }
}

function addCart(link){
    var url='';
    var action = 4;
    var fruits={};
    var mgoods={};
    var fruits_list=$('.fruit-list');
    var mgoods_list=$('.menu-list');
    for(var i=0;i<fruits_list.length;i++){
        var fruit=fruits_list.eq(i).find('.number-input');
        for(var j=0;j<fruit.length;j++){
            var num=fruit.eq(j).val().trim();
            var id=fruit.eq(j).parents('.number-change').parents('.num_box').siblings('.charge-type').data('id');
            if(num!=''&&num!=0){fruits[id]=Int(num)}
        }
    }
    for(var i=0;i<mgoods_list.length;i++){
        var mgood=mgoods_list.eq(i).find('.number-input');
        for(var j=0;j<mgood.length;j++){
            var num=mgood.eq(j).val().trim();
            var id=mgood.eq(j).parents('.number-change').parents('.num_box').siblings('.charge-type').data('id');
            if(num!=''&&num!=0){mgoods[id]=Int(num)}
        }
    }
    var args={
        action:action,
        fruits:fruits,
        mgoods:mgoods
    };
    if(!isEmptyObj(fruits)||!isEmptyObj(mgoods)){
        event.preventDefault();
        $.postJson(url,args,function(res){
                if(res.success)
                {
                    window.location.href=link;
                }
                else alert(res.error_text);
            },
            function(){alert('网络错误')})
    }
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
                        $this.find('.great').text(Int(num)+1).siblings('em').addClass('red-heart').attr({'data-id':'2'});
                    }
                    $('.click-great').addClass('clicked');
                });
                $('.large-img-box').modal('hide');
            }
            else alert(res.error_text);
        },
        function(){alert('网络错误')})
}

function focus(){
    var url='/customer/shopProfile';
    var action = "favour";
    var args={action: action};
    $.postJson(url,args,function(res){
        if(res.success){
            $('.focus-box').modal('hide');
            $('#if_focus').val('true');
        }
        else return alert(res.error_text);
    },
    function(){ return alert('服务器错误 ＼（～Ｏ～）／!')}
    );
}