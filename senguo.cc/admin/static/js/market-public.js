$(document).ready(function(){
    //商品单位转换
    $('.chargeUnit').each(function(){
        var $this=$(this);
        var id=$this.data('id');
        unitText($this,id);
    });
});

function unitText(target,n){
    switch (n){
        case 1:target.text('个');break;
        case 2:target.text('斤');break;
        case 3:target.text('份');break;
    }
}

function tagText(target,n){
    switch (n){
        case 1:target.hide();break;
        case 2:target.text('SALE').addClass('bg-orange');break;
        case 3:target.text('HOT').addClass('bg-red');break;
        case 4:target.text('SALE').addClass('bg-pink');break;
        case 5:target.text('NEW').addClass('bg-green');break;
    }
}