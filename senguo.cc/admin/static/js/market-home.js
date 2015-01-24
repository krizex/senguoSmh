$(document).ready(function(){
    //商品加减
    $('.to-add').on('click',function(){
        var $this=$(this);
        $this.hide().siblings('.number-change').show();
    });
    //公告滚动
    $('#position li').first().addClass('on');
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

    $('goods-list').last().addClass('m-b60');

    var img_width=$('.img')[0].width;
    $('.great-number').each(function(){
        $(this).css({'line-height':(img_width/2-3)+'px'});
    });
    $('.show-box').each(function(){
        $(this).css({'height':(img_width+4)+'px'});
    });
    //商品标签转换
    $('.tagItem').each(function(){
        var $this=$(this);
        var id=$this.data('id');
        tagText($this,id);
    });
    //计价方式折叠/显示
    $('.toggle').each(function(){
        var $this=$(this);
        var parent=$this.parents('.goods-list-item');
        var charge_list=$this.parents('.goods-list-item').find('.charge-list');
        $this.on('click',function(){
            parent.toggleClass('arrow');
            charge_list.toggle();

        })
    });
    //查看大图
    $('.check-lg-img').each(function(){
        var $this=$(this);
        var parent=$this.parents('.goods-list-item');
        var img_url=$this.find('.img').attr('src');
        var fruit_name=parent.find('.fruit-name').text();
        var fruit_intro=parent.find('.fruit_intro').val();
        $this.on('click',function(){
            var large_box=$('.large-img-box');
            large_box.modal('show');
            large_box.find('#largeImg').attr({'src':img_url});
            large_box.find('.modal-title').text(fruit_name);
            large_box.find('.intro').text(fruit_intro);
        })
    });
    //商品数量操作
    $('.goods-list').find('.number-minus').on('click',function(){
        var $this=$(this);
        goodsNum($this,1);

    });
    $('.goods-list').find('.number-plus').on('click',function(){
        var $this=$(this);
        goodsNum($this,2);
    });
    //分类选择
    $('.goods-class-choose li').on('click',function(){
        var $this=$(this);
        var g_class=$this.data('class');
        var top=$('#'+g_class+'').offset().top;
        $('html, body').animate({scrollTop:top}, 300);
    });

});
function goodsNum(target,action){
    var url='';
    var action=action;
    var menu_type;
    var charge_type_id=target.parents('.number-change').siblings('.charge-type').data('id');
    var parent=target.parents('.goods-list');
    var item=target.siblings('.number-input');
    var num=item.val();
    if(parent.hasClass('fruit-list')){menu_type=0}
    else if(parent.hasClass('menu-list')){menu_type=1}
    if(action==1&&num<=0) {num=0;target.addClass('disable');}
    var args={
        action:action,
        charge_type_id:charge_type_id,
        menu_type:menu_type
    };
    $.postJson(url,args,function(res){
            if(res.success)
            {
                if(action==2)
                {

                    num++;
                    item.val(num);
                }
                else if(action==1)
                {
                    var val=parseInt(item.val());
                    if(val>0)
                    {
                        num--;
                        item.val(num);
                    }
                }
            }
            else alert(res.error_text);
        },
        function(){alert('网络错误')})
}
