$(document).ready(function(){

    $('.order-status').each(function(){
        var $this=$(this);
        var text=Int($this.text());
        statusText($this,text);
    });


});
function statusText(target,n){
    switch (n){
        case 1:target.text('配送中').addClass('text-green');break;
        case 4:target.text('配送中').addClass('text-green');break;
        case 5:target.text('已送达').addClass('text-grey');break;
    }
}