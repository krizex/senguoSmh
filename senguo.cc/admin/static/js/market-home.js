var _action=6;
var _finished=true;
var _search;
var _group_finished=true;
$(document).ready(function(){
    var width = $("#swiper-container").width();
    var height = $(window).height();
    $(".notice-item").width("100%");
    $(".swiper-wrapper").width(width*$(".swiper-slide").size());
    var swiper = new Swiper('#swiper-container',{
        mode: 'horizontal',
        loop:true,
        grabCursor: true,
        pagination: '.pagination',
        autoplay:"4000",
        autoplayDisableOnInteraction:false
    });
    if($(".swiper-slide").size()==3){
        swiper.stopAutoplay();
    }
    //分类显示
    var top_title=$('.top-title');
    //get infomations of goods and push into html
    var link_group=$.getUrlParam("group");
    var link_search=$.getUrlParam("search");
    if(link_group!= null){
        window.dataObj.page=1;
        _action=6;
        var _group_id = parseInt(link_group);
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
        if($('.classify-list li').length==0){
            $(".wrap-loading-box").addClass("hidden");
        }
         $('.classify-list li').each(function(){
            var $this=$(this);
            var id = Number($this.attr('data-id'));
            var _group_id = id;
            if(_finished==true){
                goodsList(1,6,_group_id); 
                scrollLoading(_group_id);
            }
         });    
    }
    var shop_logo=$('#shop_imgurl').attr('data-img');
    if(parseInt($("#shop_status").val())==3){
        modalNotice("店铺休息中，暂不接收新订单");
    }
    if(isWeiXin()){
        wexin('',shop_logo);
    }
    var top=$('.top-title').offset().top;
    $('goods-list').last().addClass('m-b60');
    $('.bottom-nav').find('li').addClass('add_cart');
    //$(".wrap-goods-box").height($(window).height()-50-$(".wrap-notice-box").height());
    //分类导航置顶
    $(window).scroll(function(){
        //分类滚动监听
        if($(window).scrollTop()>top){
            $('.classify-list').addClass('fix-top2');
            $('.top-title').addClass('fix-top');
        }else{
            $('.classify-list').removeClass('fix-top2');
            $('.top-title').removeClass('fix-top');
        }
        if(link_search == null){
        //分类滚动监听
            var box=$('.classify-title');
            for(var i=0;i<box.length;i++){
                var dist=box[i].offsetTop-40;
                var classify=box[i].innerHTML;
                if($(window).scrollTop()>=dist){$('#classify').text(classify);}
            }
        }
    });
    //已在购物车里的商品
    var cart_fs=window.dataObj.cart_fs;
    // var cart_ms=window.dataObj.cart_ms;
    for(var key in cart_fs) {
        window.dataObj.fruits[cart_fs[key][0]]=cart_fs[key][1];
        fruits_num();
    }
}).on('click','.notice-item',function(){
        //公告详情
    var $this=$(this);
    var _type=parseInt($this.attr("data-type"))
    if(_type==1){
        var url = $this.attr("data-url");
        if(url){
            window.location.href=url;
        }
        
    }else{
        var detail=$this.find('.notice-detail').val();
        var detail_box=new Modal('detail_box');
        detail_box.modal('show');
        $('.detail-box').find('.detail').text(detail);
    }
}).on('click','.goods-list-item',function(e){
    var $this=$(this);
    var storage=Number($this.attr('data-num'));
    var detail_no=$this.attr('data-detail');
    var id=$this.attr('data-id');
    var is_activity = parseInt($this.attr("is_activity"));
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
    if(if_favour=='True') {large_box.find('.click-great').addClass('clicked').removeClass('able_click')}
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
}).on('click','.classify-list li',function(){
    _group_finished=false;
    $('.classify-list').toggle();
    var $this=$(this);
    var text=$this.text();
    $('#classify').text(text);
    var group_id=Number($this.attr('data-id'));
    var top=$('.classify-'+group_id).offset().top;
    if(group_id==-1){
        top=$('.goods-list--1').offset().top-40;
    }
    $.scrollTo({endY:top,duration:500,callback:function(){
        setTimeout(function(){
            _group_finished=true;
        },500)
    }});
}).on('click','body',function(e){
    if($(e.target).closest('.to-hide').length == 0){
        $('.classify-list').hide();
    }
}).on('click','#all_goods',function(){
    //get all goods
    $('.goods-list').empty();
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
    var parent=$this.parents('.goods-list-item');
    //是否关注店铺
    /*var if_focus=$('#if_focus').val();
     if(if_focus=='False')  $('.focus-box').modal('show');
     else{
     goodsNum($this.siblings('.number-change').find('.number-plus'),2);
     $this.addClass('hidden').siblings('.number-change').removeClass('hidden');
     }*/
    var storage=parseFloat(parent.attr('data-storage'));
    var relate=parseFloat($this.parents('.charge-item').attr('data-relate'));
    var unit_num=parseFloat($this.parents('.num_box').siblings('.charge-type').find('.num').text());
    var change_num=relate*unit_num*1;
    var buy_today=$this.parents('.charge-item').attr('data-buy');
    var allow_num=parseInt($this.parents('.charge-item').attr('data-allow'));
    var buy_limit=parseInt(parent.attr("data-buylimit"));
    var user_limit=parseInt(parent.attr("data-userlimit"));
    if(buy_limit!=user_limit&&buy_limit!=0){
        if(buy_limit==1){
            return noticeBox("该商品仅限新用户购买");
        }else if(buy_limit==2){
            return noticeBox("该商品仅限老用户购买");
        }else if(buy_limit==3){
            return noticeBox("该商品仅限充值用户购买");
        }
    }
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
            $this.siblings('.number-change').find('.number-input').text(0);
        }else{
            $this.siblings('.number-change').find('.number-input').text(0); 
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
    else {return noticeBox('库存不足啦！┑(￣▽ ￣)┍ ',$this)} 
    parent.attr({'data-storage':storage-change_num});
}).on("click",".seckill-goods",function(){//秒杀
    var parent=$(this).closest('.goods-list-item');
    var buy_limit=parseInt(parent.attr("data-buylimit"));
    var user_limit=parseInt(parent.attr("data-userlimit"));
    if(buy_limit!=user_limit&&buy_limit!=0){
        if(buy_limit==1){
            return noticeBox("该商品仅限新用户购买");
        }else if(buy_limit==2){
            return noticeBox("该商品仅限老用户购买");
        }else if(buy_limit==3){
            return noticeBox("该商品仅限充值用户购买");
        }
    }
    var id = $(this).closest("li").attr("data-id");
    var s_goods_id =  $(this).closest("li").attr("seckill_goods_id");
    window.dataObj.fruits[id]=1;
    $(this).addClass("hidden");
    $(this).next(".seckill-btn-yes").removeClass("hidden");
    wobble($('.cart_num'));
    window.dataObj.cart_count++;
    $(".cart_num").removeClass("hidden").html(window.dataObj.cart_count);
    seckill_goods_ids.push(s_goods_id);
    noticeBox("已添加到购物篮，请在秒杀结束前支付，否则会恢复原价哦！");
}).on('click','.number-minus',function(){
    //商品数量操作
    var $this=$(this);
    pulse($this);
    goodsNum($this,1);
}).on('click','.number-plus',function(){
    var $this=$(this);
    if($this.parents('.charge-item').find('.to-add').hasClass('hidden')){
        var parent=$this.parents('.goods-list-item');
        var num=Int($this.siblings('.number-input').text());
        var storage=parseFloat(parent.attr('data-storage'));
        var regNum=/^[0-9]*$/;
        var buy_today=$this.parents('.charge-item').attr('data-buy');
        var allow_num=parseInt($this.parents('.charge-item').attr('data-allow'));
        var buy_limit=parseInt(parent.attr("data-buylimit"));
        var user_limit=parseInt(parent.attr("data-userlimit"));
        if(buy_limit!=user_limit&&buy_limit!=0){
            if(buy_limit==1){
                return noticeBox("该商品仅限新用户购买");
            }else if(buy_limit==2){
                return noticeBox("该商品仅限老用户购买");
            }else if(buy_limit==3){
                return noticeBox("该商品仅限充值用户购买");
            }
        }
        if(buy_today=='True'&&num>=allow_num){
            return noticeBox('您该商品的限购数量已达上限啦！┑(￣▽ ￣)┍ ');
        }
        if(!regNum.test(num)) {
            $this.siblings('.number-input').text(storage);
            return noticeBox('商品数量只能为整数！',$this);
        }
        if(num<999) {pulse($this);goodsNum($this,2);}
        else {
            return noticeBox('最多只能添加999哦！',$this);
        } 
    }
}).on('click','._add_cart',function(e){
    //添加到购物车
    stopDefault(e);
    var link=$(this).attr('href');
    addCart(link);
});
$('.loading').html("~努力加载中 ( > < )~").show();
var scrollLoading=function(_group_id){
    $(window).scroll(function(){
        var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
        var range = 150;             //距下边界长度/单位px          //插入元素高度/单位px
        var totalheight = 0;
        var main = $('.goods-list-'+_group_id);              //主体元素
        var nomore=$('.goods-list-'+_group_id).attr("data-nomore");
        var page=parseInt($('.goods-list-'+_group_id).attr("data-page"));
        totalheight = parseFloat($(window).height()) + parseFloat(srollPos);
        if(_finished&&(main.height()-range) <= totalheight  && nomore=='false'&&_group_finished==true) {
            _finished=false;
            page = page+1;
            $('.goods-list-'+_group_id).attr("data-page",page);
            goodsList(page,_action,_group_id);
        }else if(nomore==true){
            if(_action==9){
                $('.loading').html("~没有更多结果了 ( > < )~").show();
            }else{
                $('.loading').html("~没有更多商品了呢 ( > < )~").show();
            }
        }
    });
}

var count_loading= 0 ;
var goodsList=function(page,action,_group_id){
    $(".wrap-loading-box").removeClass("hidden");
    var url='';
    var action = action;
    var nomore;
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
            if(res.success){
                nomore = res.nomore;
                if(nomore==true&&res.data.length>0){
                    count_loading ++;
                }
                initData(res.data);
                if(_group_id!= undefined&&$(".classify-list li").length<=count_loading&&nomore == true){
                    if(action==9){
                        $('.loading').html("~没有更多结果了 ( > < )~").show();
                    }else{
                        $('.loading').html("~没有更多商品了呢 ( > < )~").show();
                    }
                }else{
                    $('.loading').html("~努力加载中 ( > < )~").show();
                }
            }else {
                if(!res.error_text){
                    window.location.reload(true);
                } 
                noticeBox(res.error_text);
                $(".wrap-loading-box").addClass("hidden");
            }
        });
        var initData=function(data){
            var data=data;
            for(var key in data){
                $('.classify-'+data[key]['group_id']).removeClass('hidden');
                $('.goods-list-'+data[key]['group_id']).attr("data-nomore",nomore);
                fruitItem($('.goods-list-'+data[key]['group_id']),data[key]);//fruits information
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
var goods_item=' <li class="goods-list-item font10 text-grey9 {{code}}" is_activity="{{is_activity}}" data-id="{{goos_id}}" data-num="{{storage}}" data-storage="{{storage}}" data-limit="{{limit_num}}" data-favour="{{favour_today}}" end-time="{{end_time}}" data-detail="{{detail_no}}" data-buylimit="{{buylimit}}" data-userlimit="{{userlimit}}">'+
                    '<div class="clearfix box bg {{if storage<=0 }}desaturate{{/if}}">'+
                        '<div class="goods-img pull-left forbid_click">'+
                            '<a href="javascript:;" class="check-lg-img">'+
                                '<img src="/static/images/holder.png" class="img lazy_img" data-original="{{ori_img}}">'+
                                '<span class="tag text-white text-center tagItem font8 {{if is_activity==0}}{{tag}}{{/if}}"></span>'+
                                '<span class="status-goods {{if is_activity==1}}status-seckill{{else if is_activity==2}}status-discount{{else}}hidden{{/if}}"></span>'+
                            '</a>'+
                        '</div>'+
                        '<div class="goods-info pull-left">'+
                            '<span class="clearfix">'+
                                '<span class="pull-left color fruit-name font14">{{name}}</span>'+
                                '<span class="great-number font12 pull-right {{if is_activity==1 }}hidden{{/if}}">'+
                                    '<em class="bg_change heart {{heart}}" data-id="{{favour}}"></em>'+
                                    '<span class="great">{{favour}}</span>'+
                                '</span>'+
                                '<span class="pull-right text-grey sale font12 {{if is_activity==1 }}hidden{{/if}}">销量: <span class="color number">{{saled}}</span></span>'+
                                '<span class="pull-right text-grey sale font12 {{if is_activity!=1 }}hidden{{/if}}">库存: <span class="color number">{{activity_piece}}</span>份</span>'+
                            '</p>'+
                            '<p class="buylimit-box font12">'+
                                '{{if buylimit >0 }}<span class="buylimit">{{buylimit_txt}}</span>{{/if}}'+
                                '<span class="{{if is_activity==0 }}hidden{{/if}}">距结束&nbsp;<span class="day"></span><span class="hour"></span><span class="minute"></span><span class="second"></span></span>'+
                            '</p>'+
                            '<ul class="charge-list charge-style font14 color {{charge_types}}">'+
                                '{{if is_activity==1 && activity_piece>0 }}'+
                                '<li class="border-color set-w100-fle charge-item" data-id="{{charge_type_id}}" seckill_goods_id="{{seckill_id}}">'+
                                    '<span class="pull-left text-bgcolor p0 charge-type forbid_click">'+
                                    '<span class="price-bo">{{sk_price}}<span class="src-txt">{{src_price}}元{{price_unit}}</span></span><span class="price-tip">省<span class="price-dif">{{price_dif}}</span>元</span>'+
                                    '</span>'+
                                    '<span class="forbid_click pull-right num_box wrap-seckill-price-box">'+
                                        '<span class="seckill-btn seckill-goods add_cart_num {{if is_bought==1}}hidden{{/if}}" data-storage="{{activity_piece}}">抢!</span>'+
                                        '<span class="seckill-btn seckill-btn-yes {{if is_bought==0}}hidden{{/if}}">已抢</span>'+
                                    '</span>'+
                                '</li>'+
                                '{{/if}}'+
                                '{{each charge_types as key}}'+
                                '<li class="border-color set-w100-fle charge-item" data-id="{{key["id"]}}" data-relate="{{key["relate"]}}" data-buy="{{key["limit_today"]}}" data-allow="{{key["allow_num"]}}">'+
                                    '<span class="pull-left text-bgcolor p0 charge-type forbid_click">'+
                                        '<span class="price">{{key["price"]}}</span>元&nbsp;<span class="unit"><span class="market">{{if is_activity==2}}<span class="market-price">{{key["src_price"]}}元</span>{{else}}{{if key["market_price"]>0 }}<span class="market-price">{{key["market_price"]}}元</span>{{/if}}{{/if}}</span>/<span class="num">{{key["num"]}}</span><span class="chargeUnit">{{key["unit"]}}</span></span>'+
                                        '<span class="price-tip {{if key["has_discount_activity"]==0 }}hidden{{/if}}"><span class="price-dif">{{key["discount_rate"]}}</span>折</span>'+
                                    '</span>'+
                                    '<span class="forbid_click pull-right num_box">'+
                                        '<span class="to-add pull-right show forbid_click add_cart_num bg_change"></span>'+
                                        '<span class="pull-right p0 number-change hidden forbid_click">'+
                                        '<button class="minus-plus pull-right number-plus bg_change"></button>'+
                                        '<span class="number-input pull-right text-green text-center line34 height34 bg_change"></span>'+
                                        '<button class="minus-plus pull-right number-minus bg_change"></button>'+
                                        '</span>'+
                                    '</span>'+
                                '</li>'+
                                '{{/each}}'+
                            '</ul>'+
                        '</div>'+
                    '</div>'+
                    '<input type="hidden" class="fruit_intro" value="{{intro}}"/>'+
                    '{{if storage<=0 }}'+
                    '<div class="sold-out bg_change" style="background-color:rgba(0,0,0,0.1)"><div class="out"></div></div>'+
                    '{{/if}}'+
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
    var is_activity = fruits['is_activity'];
    var price_dif = fruits['price_dif'];
    var activity_piece = fruits['activity_piece'];//库存
    var charge_type_text = fruits['charge_type_text'];
    var charge_type_id = fruits['charge_type_id'];
    var seckill_id = fruits['seckill_goods_id'];
    var is_bought = fruits['is_bought'];
    var end_time = fruits['end_time'];
    var buylimit=fruits['buylimit'];
    var userlimit=fruits['userlimit'];
    var heart='';
    var sold_out='';
    var ori_img='';
    var buylimit_txt="";
    if(!code) {code='TDSG';}
    if(saled>9999){saled='9999+'}
    if(is_activity==1 && activity_piece==0 && charge_types.length==0){
        storage=0;
    }
    if(favour_today=='true'){
        heart='red-heart';
    }else{
        heart='gray-heart';
    }
    if(!img_url){
        ori_img='/static/design_img/'+code+'.png';
    }else{
        ori_img=img_url+'?imageView2/1/w/170/h/170';
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
    if(buylimit==1){
        buylimit_txt="限新用户";
    }else if(buylimit==2){
        buylimit_txt="限老用户";
    }else if(buylimit==3){
        buylimit_txt="限充值用户";
    }
    if(is_activity==1){
        var temp_prices = charge_type_text.split("元");
        var sk_price = temp_prices[0]+"元";
        var src_price = parseFloat(temp_prices[0])+parseFloat(price_dif);
        var price_unit = temp_prices[1];
    }
    var render=template.compile(goods_item);
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
        is_activity:is_activity,
        price_dif:price_dif,
        activity_piece:activity_piece,//库存
        sk_price:sk_price,
        src_price:src_price,
        price_unit:price_unit,
        charge_type_id:charge_type_id,
        seckill_id:seckill_id,
        is_bought:is_bought,
        end_time:end_time,
        buylimit:buylimit,
        buylimit_txt:buylimit_txt,
        userlimit:userlimit
    });
    var $obj = $(html);
    box.append($obj);
    if(is_activity>0){
        countTime($obj);
    }
    $('.lazy_img').lazyload({threshold:100,effect:"fadeIn"});
};
function countTime($obj){
    var time_end = parseInt($obj.attr("end-time"))*1000;
    var time_now = new Date().getTime();
    var time_distance = time_end - time_now;  // 结束时间减去当前时间
    var int_day, int_hour, int_minute, int_second;
    if(time_distance >= 0){
        // 天时分秒换算
        int_day = Math.floor(time_distance/86400000)
        time_distance -= int_day * 86400000;
        int_hour = Math.floor(time_distance/3600000)
        time_distance -= int_hour * 3600000;
        int_minute = Math.floor(time_distance/60000)
        time_distance -= int_minute * 60000;
        int_second = Math.floor(time_distance/1000)
        if(int_hour < 10)
            int_hour = "0" + int_hour;
        if(int_minute < 10)
            int_minute = "0" + int_minute;
        if(int_second < 10)
            int_second = "0" + int_second;
        // 显示时间
        if(int_day>0){
            $obj.find(".day").html(int_day+"天");
        }
        $obj.find(".hour").html(int_hour+":");
        $obj.find(".minute").html(int_minute+":");
        $obj.find(".second").html(int_second);
        setTimeout(function(){
            countTime($obj);
        },1000);
    }else{
        //noticeBox("结束了");
    }
}
window.dataObj.fruits={};
window.dataObj.mgoods={};
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
                var buy_limit=parseInt(charge.parents('.goods-list-item').attr("data-buylimit"));
                var user_limit=parseInt(charge.parents('.goods-list-item').attr("data-userlimit"));
                if(buy_limit == user_limit||buy_limit==0){
                    if (id == cart_ms[key][0]) {
                        var $parent=charge.parents('.goods-list-item');
                        var storage=$parent.attr('data-num');
                        add.addClass('hidden');
                        change.removeClass('hidden');
                        input.text(cart_ms[key][1]);
                        var relate=parseFloat(charge.parents('.charge-item').attr('data-relate'));
                        var unit_num=parseFloat(charge.find('.num').text());
                        var change_num=relate*unit_num*cart_ms[key][1];
                        if($parent.attr("is_activity")!="1"){
                            $parent.attr({'data-storage':storage-change_num});
                        }
                    }
                }
            }
        }
    }
}

function goodsNum(target,action){
    var item=target.siblings('.number-input');
    var change=target.parents('.number-change');
    var num=parseInt(item.text());
    var parent=target.parents('.goods-list-item');
    var storage=parseFloat(parent.attr('data-storage'));
    var type_list=target.parents('.goods-list');
    var id=target.parents('.charge-item').attr('data-id');
    var relate=parseFloat(target.parents('.charge-item').attr('data-relate'));
    var unit_num=parseFloat(target.parents('.num_box').siblings('.charge-type').find('.num').text());
    var change_num=relate*unit_num*1;
    var limit_num=parseInt(parent.attr('data-limit'));
    //console.log(storage);
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
        fruits:fruits,
        seckill_goods_ids:seckill_goods_ids
    };
    if(!isEmptyObj(fruits)){
        fruits={};
    }
    $.postJson(url,args,function(res){
            if(res.success)
            {
                SetCookie('cart_count',$(".cart_num").html());
                window.location.href=link;
            }
            else return noticeBox(res.error_text);
        }
    );
}
function isEmptyObj(obj){
    for(var n in obj){return false}
    return true;
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