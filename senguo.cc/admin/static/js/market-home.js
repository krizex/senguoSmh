$(document).ready(function(){
    //get infomations of goods and push into html
     goodsList();
    //sale>9999
    $('.sale').each(function(){
        var $this=$(this);
        var num=Int($this.find('.number').data('id'));
        if(num>9999) $this.find('.number').text('9999+');
        else $this.find('.number').text(num);
    });
    //已在购物车里的商品
    var cart_fs=window.dataObj.cart_fs;
    var cart_ms=window.dataObj.cart_ms;
    cartNum(cart_fs,'.fruit-list');
    cartNum(cart_ms,'.menu-list');
    //添加到购物车
    $('.bottom-nav').find('li').addClass('add_cart');
    $('.add_cart a').on('click',function(){
        var link=$(this).attr('href');
        addCart(link);
    });
    //分类显示
    var top_title=$('.top-title');
    $('.choose-classify').on('click',function(){
        var $this=$(this);
        $this.find('.icon').toggle();
        $('.goods-class-choose').slideToggle(100);
    });
    $('.goods-class-choose li').on('click',function(){
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
    $('.goods-class-choose li').hammer().on('tap',function(){
        var $this=$(this);
        var g_class=$this.data('class');
        var top=$('#'+g_class+'').offset().top;
        $('html, body').animate({scrollTop:top}, 50);
        //top_title.find('.classify').text(text);
    });
    //售完状态
    $('.goods-list-item').each(function(){
        var $this=$(this);
        var num=Int($this.data('num'));
        if(num<=0){
            $this.append('<div class="sold-out bg_change"><div class="out"></div></div>').find('.box').addClass('desaturate').find('.arrow').css({'border-color':'transparent #B6B6B6 transparent transparent'});
            $this.find('.sold-out').css({'background-color':'rgba(0,0,0,0.1)'});
            $this.find('.bg').css({'background':'#FCFCFC'});
            $this.find('.color').css({'color':'#757575'});
            AndroidImg('bg_change');
        }
    });
    //公告滚动
    var notice_con=window.dataObj.notices;
    if(typeof(notice_con)!='undefined'){
        $.ajaxSetup({'async':false});
        $.getItem('/static/items/customer/notice-item.html?v=2015-0309',function(data){
            notice_item=data;
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
    }
    //公告详情
    $(document).on('click','.notice-item',function(){
        var $this=$(this);
        var detail=$this.find('.notice-detail').val();
        $('.detail-box').modal('show');
        $('.detail-box').find('.detail').text(detail);
    });
    $('goods-list').last().addClass('m-b60');
    //商品标签转换
    $('.tagItem').each(function(){
        var $this=$(this);
        var id=$this.data('id');
        tagText($this,id);
    });
    //计价方式折叠/显示
    $('.toggle').each(function(){      
        var $this=$(this);
        $this.mouseup(function(e){
            var parent=$this.parents('.goods-list-item');
            var charge_list=$this.parents('.goods-list-item').find('.charge-list');
            var forbid_click=$this.parents('.goods-list-item').find('.forbid_click');
            if(!forbid_click.is(e.target) &&forbid_click.has(e.target).length === 0){
                parent.find('.toggle_icon').toggleClass('arrow');
                parent.toggleClass('pr35');
                parent.find('.back-shape').toggle();
                charge_list.slideToggle(50);
            }
        })

    });
    $(document).on('click','.back-shape',function(){
        var $this=$(this);
        var parent=$this.parents('.goods-list-item');
        var charge_list=$this.parents('.goods-list-item').find('.charge-list');
        parent.toggleClass('pr35');
        parent.find('.toggle_icon').toggleClass('arrow');
        $this.toggle();
        charge_list.slideToggle(50);
    });
    //查看大图
    $(document).on('click','.check-lg-img',function(){
            var $this=$(this);
            var parent=$this.parents('.goods-list-item');
            var type=$this.parents('.goods-list-item').data('type');
            var id=$this.parents('.goods-list-item').data('id');
            var img_url=$this.find('.img').attr('src');
            var img_type=$this.find('.img').attr('data-img');
            var fruit_name=parent.find('.fruit-name').text();
            var fruit_intro=parent.find('.fruit_intro').val();
            var large_box=$('.large-img-box');
            var if_clicked=$this.parents('.goods-list-item').find('.great-number em').attr('data-id');
            if(if_clicked=='2') {$('.click-great').addClass('clicked')}
            else $('.click-great').removeClass('clicked');
            if(img_type!='') {
                img_url=img_url.replace('w/160/h/160','w/560/h/560');
            }
            large_box.modal('show').attr({'data-id':id,'data-type':type});
            large_box.find('#largeImg').attr({'src':img_url});
            large_box.find('.modal-title').text(fruit_name);
            large_box.find('.intro').text(fruit_intro);
    });
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
    //关注店铺
    $('.focus-btn').hammer().on('tap',function(){
            focus();
    });
    //商品输入框为0时
    $('.number-input').on('blur',function(){
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
    //商品数量操作
    $('.goods-list').find('.number-minus').hammer().on('tap',function(){
        var $this=$(this);
        goodsNum($this,1);

    });
    $('.goods-list').find('.number-plus').hammer().on('tap',function(){
        var $this=$(this);
        goodsNum($this,2);
    });
});
var notice_item;
var goodsList=function(){
    var url='';
    var action = 5;
    var args={
        action:action,
    };
    $.postJson(url,args,function(res){
        if(res.success)
        {
            var frtuis=res.fruits;
            var frtuis=res.dry_fruits;
            var frtuis=res.mgoods;
        }
        else alert(res.error_text);
        },
        function(){alert('网络错误')})
};

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