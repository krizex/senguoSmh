$(document).ready(function(){
    $('goods-list').last().addClass('m-b60');
    //商品单位转换
    $('.chargeUnit').each(function(){
        var $this=$(this);
        var id=$this.data('id');
        unitText($this,id);
    });
    //商品标签转换
    $('.tagItem').each(function(){
        var $this=$(this);
        var id=$this.data('id');
        tagText($this,id);
    });
    //商品分类标签高度修正
    var item_height=$('.goods-list-item').eq(0).find('.goods-img').height();
    $('.fruit-class').each(function(){
        var $this=$(this);
        var num=$this.text().length;
        $(this).css({'height':item_height+'px','line-height':item_height/num+'px'});
    });
    //计价方式折叠/显示
    $('.charge-first').each(function(){
        var $this=$(this);
        var charge_list=$this.parents('.goods-list-item').find('.charge-list');
        $this.find('.toggle').on('click',function(){
            $(this).toggleClass('up');
            charge_list.toggle();

        })
    });
    //查看大图
    $('.check-lg-img').each(function(){
        var $this=$(this);
        var parent=$this.parents('.goods-list-item');
        var img_url=$this.find('.img').attr('src');
        var fruit_name=parent.find('.fruit-name').text();
        var bg_color=parent.find('.fruit-class').css('background');
        var fruit_intro=parent.find('.fruit_intro').val();
        $this.on('click',function(){
            var large_box=$('.large-img-box');
            large_box.modal('show');
            large_box.find('#largeImg').attr({'src':img_url});
            large_box.find('.modal-header').css({'background':bg_color});
            large_box.find('.modal-title').text(fruit_name);
            large_box.find('.intro').text(fruit_intro);
        })
    });

    $('#backTop').on('click',function(){$(document).scrollTop(0)});

    $('.fruit-list').find('.number-minus').on('click',function(){
        var $this=$(this);
        var number_input=$this.siblings('.number-input');
        if(num<=0){num=0;$this.addClass('disable');}
        else if(num>0) goodsNum($this,1,1,number_input);
    });
    $('.fruit-list').find('.number-plus').on('click',function(){
        var $this=$(this);
        var number_input=$this.siblings('.number-input');
        goodsNum($(this),2,1,number_input);
    });
});
var num=0;
function goodsNum(target,action,menu_type,item){
    var url='';
    var action=action;
    var charge_type_id=target.parents('.number-change').siblings('.charge-type').data('id');
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
                console.log(num);
            }
            else if(action==1&&num>0)
            {
                num--;
                item.val(num);
                console.log(num);
            }
        }
        else alert(res.error_text);
    },
    function(){alert('网络错误')})
}
