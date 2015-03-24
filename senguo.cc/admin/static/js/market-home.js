$(document).ready(function(){    
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
    //公告详情
    $(document).on('click','.notice-item',function(){
        var $this=$(this);
        var detail=$this.find('.notice-detail').val();
        var detail_box=new Modal('detail_box');
        detail_box.modal('show');
        $('.detail-box').find('.detail').text(detail);
    });
    $('goods-list').last().addClass('m-b60');
    //添加到购物车
    $('.bottom-nav').find('li').addClass('add_cart');
    $(document).on('click','.add_cart a',function(){
        var link=$(this).attr('href');
        addCart(link);
    });
    //分类显示
    var top_title=$('.top-title');
    $(document).on('click','.choose-classify',function(){
        var $this=$(this);
        $this.find('.icon').toggle();
        $('.goods-class-choose').toggle(100);
    });
    $(document).on('click','.goods-class-choose li',function(){
        $('.goods-class-choose').hide(100);
    });
    //分类导航置顶
    // $(window).scroll(function(){
    //     var wind_dist=$(window).scrollTop();
    //     //分类滚动监听
    //     var box=$('.classify-title');
    //     for(var i=0;i<box.length;i++){
    //         var dist=box[i].offsetTop;
    //         var classify=box[i].innerHTML;
    //         if(wind_dist>=dist){top_title.find('.classify').text(classify);}
    //     }
    // });
    //分类选择
    $(document).on('click','.goods-class-choose li',function(){
        var $this=$(this);
        var g_class=$this.data('class');
        var top=$('#'+g_class+'').offset().top;
        $('.choose-classify .icon').toggle();
        var w_height=$('#'+g_class+'').height();
        document.body.scrollTop =top-3*w_height;
        //top_title.find('.classify').text(text);
    });
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
            var large_box=$('#large_imgbox');
            var if_clicked=$this.parents('.goods-list-item').find('.great-number em').attr('data-id');
            if(if_clicked=='2') {$('.click-great').addClass('clicked')}
            else $('.click-great').removeClass('clicked');
            if(img_url!='') {
                if(img_url.indexOf('/design_img')) img_url=img_url.replace('.png','_l.png');
                img_url=img_url.replace('w/160/h/160','w/560/h/560');
            }
            var check_large=new Modal('large_imgbox');
            check_large.modal('show');
            large_box.attr({'data-id':id,'data-type':type});
            large_box.find('#largeImg').attr({'src':img_url});
            large_box.find('.modal-title').text(fruit_name);
            large_box.find('.intro').text(fruit_intro);
    });
    //关注店铺
    $(document).find('.focus-btn').on('click',function(){focus();});
    //get infomations of goods and push into html
     $.goodsList(1);
     $.scrollLoading();
      //点赞
        $(document).on('click','.click-great',function(e){
            var $this=$(this);
            $this.unbind('click');
            var large_box=$('.large-img-box');
            var type=large_box.attr('data-type');
            var id=large_box.attr('data-id'); 
            great(type,id);
            
        });
        //首次添加商品
        $(document).on('click','.to-add',function(){
            var $this=$(this);
            //是否关注店铺
            /*var if_focus=$('#if_focus').val();
            if(if_focus=='False')  $('.focus-box').modal('show');
            else{
                  goodsNum($this.siblings('.number-change').find('.number-plus'),2);
                 $this.addClass('hidden').siblings('.number-change').removeClass('hidden');
            }*/
            goodsNum($this.siblings('.number-change').find('.number-plus'),2);
            $this.addClass('hidden').siblings('.number-change').removeClass('hidden');
            //果篮显示商品种类数
            if(window.dataObj.cart_count==0) {$('.cart_num').show();}
            if($this.hasClass('add_cart_num')){
                window.dataObj.cart_count++;
                $('.cart_num').text(window.dataObj.cart_count);
                SetCookie('cart_count',window.dataObj.cart_count);
                $this.removeClass('add_cart_num');
            }
        });
        //商品数量操作
        $(document).on('click','.number-minus',function(){
            var $this=$(this);
            goodsNum($this,1);
        });
        $(document).on('click','.number-plus',function(){
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
                if(window.dataObj.cart_count==1) {
                    $('.cart_num').remove();
                    SetCookie('cart_count',0);
                }
                else {
                    window.dataObj.cart_count--;
                    $('.cart_num').text(window.dataObj.cart_count);
                    SetCookie('cart_count',window.dataObj.cart_count);
                }
            }
        });
        //计价方式折叠/显示
        $(document).on('click','.toggle',function(e){
            stopPropagation(e);
            var target  = $(e.target);
            var $this=$(this);
            var $parent=$this.parents('.goods-list-item');
            var $charge_list=$this.parents('.goods-list-item').find('.charge-list');
            if(target.closest('.forbid_click').length == 0){
                $parent.find('.back-shape').toggleClass('hidden');
                $charge_list.toggle(1);
                $parent.find('.toggle_icon').toggleClass('arrow');
                $parent.toggleClass('pr35'); 
            };          
        });    
});
//get item dom
$.getItem('/static/items/customer/market-goods-item.html?v=2015-0320',function(data){window.dataObj.goods_item=data;});    
$.getItem('/static/items/customer/charge-item.html?v=2015-0309',function(data){window.dataObj.charge_item=data;}); 
$.getItem('/static/items/customer/classify_item.html?v=2015-0309',function(data){window.dataObj.classify_item=data;}); 

window.dataObj.page_count=Int($('#page_count').val());
window.dataObj.page=1;
$.scrollLoading=function(){
    var range = 10;             //距下边界长度/单位px          //插入元素高度/单位px  
    var maxnum = window.dataObj.page_count;            //设置加载最多次数  
    var totalheight = 0;   
    var main = $(".container");                     //主体元素  
    $(window).scroll(function(){  
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)  
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);  
        if((main.height()-range) <= totalheight  && window.dataObj.page != maxnum) {  
            $('.container').append('<div class="loading text-center text-grey6 font16">~努力加载中( > < )~</div>');
            window.dataObj.page++; 
            $.goodsList(window.dataObj.page);
        }  
    });  
}   

 $.goodsList=function(page){
    var url='';
    var action = 5;
    var args={
        action:action,
        page:page
    };
    $.postJson(url,args,function(res){
        if(res.success)
        {
            window.dataObj.cart_fs=res.cart_fs;
            window.dataObj.cart_ms=res.cart_ms;
            var w_orders=res.w_orders;
            var mgoods_item=window.dataObj.mgoods_item;
            var classify_item=window.dataObj.classify_item
            var cart_fs=window.dataObj.cart_fs;
            var cart_ms=window.dataObj.cart_ms;
            for(var goods in w_orders){
                var goods_list=w_orders[goods];
                var type=goods_list[0];
                var good=goods_list[1];
                var menu_id;
                if(goods_list[2]) {menu_id=goods_list[2];}
                if(type=='fruit'){
                     fruitItem($('.fruit_goods_list'),good,'fruit');//fruits information
                    $('.fruit_cassify').show();
                }
                else if(type=='dry_fruit'){
                     fruitItem($('.dryfruit_goods_list'),good,'fruit');//fruits information
                    $('.dryfruit_classify').show();
                }
                else if(type=='mgoods'){
                    fruitItem($('.menu_goods_list'+menu_id),good,'menu');
                    $('.menu_classify'+menu_id).show();
                }
            }
            //已在购物车里的商品         
            cartNum(cart_fs,'.fruit-list');
            cartNum(cart_ms,'.menu-list');
            $('.loading').remove();
        }
        else return $.noticeBox(res.error_text);
        },function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')}
        );
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
        if(!code) code='TDSG';
        $item.attr({'data-id':id,'data-type':type,'data-num':storage}).addClass(code);
        $item.find('.fruit_intro').val(intro);
        $item.find('.fruit-name').text(name);
        if(saled>9999) $item.find('.number').text('9999+');
        else $item.find('.number').text(saled);
        $item.find('.great').text(favour).siblings('em').attr({'data-id':favour}); //if favour is not correct,should been replaced      
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
            //AndroidImg('bg_change');
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
            var $charge_item=$(charge_item);
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
            if(!img_url) $item.find('.img').attr({'data-original':'/static/design_img/'+code+'.png'});
            else $item.find('.img').attr({'data-original':img_url+'?imageView/1/w/170/h/170'});
            $('.lazy_img').lazyload({threshold:100});
            $item.find('.img').lazyload({threshold:100});
        } 
        box.append($item);
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
                        var $parent=charge.parents('.goods-list-item');
                        $parent.find('.charge-list').show();
                        $parent.find('.back-shape').toggleClass('hidden');
                        $parent.find('.toggle_icon').removeClass('arrow');
                        $parent.removeClass('pr35');
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
        if(s_num==0){
            $.noticeBox('库存不足啦！┑(￣▽ ￣)┍ ')
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
                if(window.dataObj.cart_count==1) {
                    $('.cart_num').remove();
                    SetCookie('cart_count',0);
                }
                else {
                    window.dataObj.cart_count--;
                    $('.cart_num').text(window.dataObj.cart_count);
                    SetCookie('cart_count',window.dataObj.cart_count);
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
                else return $.noticeBox(res.error_text);
            },
             function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},
             function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')}
        );
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
                var check_large=new Modal('large_imgbox');
                check_large.modal('hide');
            }
            else $.noticeBox(res.error_text);
        },
         function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},
         function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')}
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
        else return $.noticeBox(res.error_text);
    },
     function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},
     function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}
function Swipe(b,g){var c=function(){};var r=function(A){setTimeout(A||c,0)};var z={addEventListener:!!window.addEventListener,touch:("ontouchstart" in window)||window.DocumentTouch&&document instanceof DocumentTouch,transitions:(function(A){var C=["transformProperty","WebkitTransform","MozTransform","OTransform","msTransform"];for(var B in C){if(A.style[C[B]]!==undefined){return true}}return false})(document.createElement("swipe"))};if(!b){return}var i=b.children[0];var v,h,o;g=g||{};var f=parseInt(g.startSlide,10)||0;var s=g.speed||300;g.continuous=g.continuous?g.continuous:true;function m(){v=i.children;h=new Array(v.length);o=b.getBoundingClientRect().width||b.offsetWidth;i.style.width=(v.length*o)+"px";var B=v.length;while(B--){var A=v[B];A.style.width=o+"px";A.setAttribute("data-index",B);if(z.transitions){A.style.left=(B*-o)+"px";p(B,f>B?-o:(f<B?o:0),0)}}if(!z.transitions){i.style.left=(f*-o)+"px"}b.style.visibility="visible"}function l(){if(f){a(f-1)}else{if(g.continuous){a(v.length-1)}}}function n(){if(f<v.length-1){a(f+1)}else{if(g.continuous){a(0)}}}function a(D,A){if(f==D){return}if(z.transitions){var B=Math.abs(f-D)-1;var C=Math.abs(f-D)/(f-D);while(B--){p((D>f?D:f)-B-1,o*C,0)}p(f,o*C,A||s);p(D,0,A||s)}else{e(f*-o,D*-o,A||s)}f=D;r(g.callback&&g.callback(f,v[f]))}function p(A,C,B){k(A,C,B);h[A]=C}function k(B,E,D){var A=v[B];var C=A&&A.style;if(!C){return}C.webkitTransitionDuration=C.MozTransitionDuration=C.msTransitionDuration=C.OTransitionDuration=C.transitionDuration=D+"ms";C.webkitTransform="translate("+E+"px,0)translateZ(0)";C.msTransform=C.MozTransform=C.OTransform="translateX("+E+"px)"}function e(E,D,A){if(!A){i.style.left=D+"px";return}var C=+new Date;var B=setInterval(function(){var F=+new Date-C;if(F>A){i.style.left=D+"px";if(y){u()}g.transitionEnd&&g.transitionEnd.call(event,f,v[f]);clearInterval(B);return}i.style.left=(((D-E)*(Math.floor((F/A)*100)/100))+E)+"px"},4)}var y=g.auto||0;var t;function u(){t=setTimeout(n,y)}function q(){y=g.auto>0?g.auto:0;clearTimeout(t)}var d={};var w={};var x;var j={handleEvent:function(A){switch(A.type){case"touchstart":this.start(A);break;case"touchmove":this.move(A);break;case"touchend":r(this.end(A));break;case"webkitTransitionEnd":case"msTransitionEnd":case"oTransitionEnd":case"otransitionend":case"transitionend":r(this.transitionEnd(A));break;case"resize":r(m.call());break}if(g.stopPropagation){A.stopPropagation()}},start:function(A){var B=A.touches[0];d={x:B.pageX,y:B.pageY,time:+new Date};x=undefined;w={};i.addEventListener("touchmove",this,false);i.addEventListener("touchend",this,false)},move:function(A){if(A.touches.length>1||A.scale&&A.scale!==1){return}if(g.disableScroll){A.preventDefault()}var B=A.touches[0];w={x:B.pageX-d.x,y:B.pageY-d.y};if(typeof x=="undefined"){x=!!(x||Math.abs(w.x)<Math.abs(w.y))}if(!x){A.preventDefault();q();w.x=w.x/((!f&&w.x>0||f==v.length-1&&w.x<0)?(Math.abs(w.x)/o+1):1);k(f-1,w.x+h[f-1],0);k(f,w.x+h[f],0);k(f+1,w.x+h[f+1],0)}},end:function(C){var E=+new Date-d.time;var A=Number(E)<250&&Math.abs(w.x)>20||Math.abs(w.x)>o/2;var B=!f&&w.x>0||f==v.length-1&&w.x<0;var D=w.x<0;if(!x){if(A&&!B){if(D){p(f-1,-o,0);p(f,h[f]-o,s);p(f+1,h[f+1]-o,s);f+=1}else{p(f+1,o,0);p(f,h[f]+o,s);p(f-1,h[f-1]+o,s);f+=-1}g.callback&&g.callback(f,v[f])}else{p(f-1,-o,s);p(f,0,s);p(f+1,o,s)}}i.removeEventListener("touchmove",j,false);i.removeEventListener("touchend",j,false)},transitionEnd:function(A){if(parseInt(A.target.getAttribute("data-index"),10)==f){if(y){u()}g.transitionEnd&&g.transitionEnd.call(A,f,v[f])}}};m();if(y){u()}if(z.addEventListener){if(z.touch){i.addEventListener("touchstart",j,false)}if(z.transitions){i.addEventListener("webkitTransitionEnd",j,false);i.addEventListener("msTransitionEnd",j,false);i.addEventListener("oTransitionEnd",j,false);i.addEventListener("otransitionend",j,false);i.addEventListener("transitionend",j,false)}window.addEventListener("resize",j,false)}else{window.onresize=function(){m()}}return{setup:function(){m()},slide:function(B,A){a(B,A)},prev:function(){q();l()},next:function(){q();n()},getPos:function(){return f},kill:function(){q();i.style.width="auto";i.style.left=0;var B=v.length;while(B--){var A=v[B];A.style.width="100%";A.style.left=0;if(z.transitions){k(B,0,0)}}if(z.addEventListener){i.removeEventListener("touchstart",j,false);i.removeEventListener("webkitTransitionEnd",j,false);i.removeEventListener("msTransitionEnd",j,false);i.removeEventListener("oTransitionEnd",j,false);i.removeEventListener("otransitionend",j,false);i.removeEventListener("transitionend",j,false);window.removeEventListener("resize",j,false)}else{window.onresize=null}}}}if(window.jQuery||window.Zepto){(function(a){a.fn.Swipe=function(b){return this.each(function(){a(this).data("Swipe",new Swipe(a(this)[0],b))})}})(window.jQuery||window.Zepto)};