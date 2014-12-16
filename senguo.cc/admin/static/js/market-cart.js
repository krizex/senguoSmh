$(document).ready(function(){

    $('.item_total_price').each(function(){
        var $this=$(this);
        var parent=$this.parents('.cart-list-item');
        var num=parent.find('.item_number').val();
        var price=parent.find('.item_price').text();
        var total=num*price;
        $this.text(total);
        price_list.push(total);
    });
    $('#list_total_price').text(totalPrice(price_list));
    $('.cart-list').find('.number-minus').on('click',function(){
        var $this=$(this);
        var number_input=$this.siblings('.number-input');
        if(num<=0){num=0;$this.addClass('disable');}
        else if(num>0) goodsNum($this,1,0,number_input);
    });
    $('.cart-list').find('.number-plus').on('click',function(){
        var $this=$(this);
        var number_input=$this.siblings('.number-input');
        goodsNum($(this),2,0,number_input);
    });
    $('.type-choose li').each(function(){
        var $this=$(this);
        $this.on('click',function(){$this.addClass('active').siblings().removeClass('active');})
    });
});
var price_list=[];
var total_price=0;

function totalPrice(target){
    for(var i=0;i<target.length;i++)
    {
        total_price+=parseInt(target[i]);
    }
    return total_price;
}

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
