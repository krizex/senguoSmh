$(document).ready(function(){
    //订单状态
    var status=Int($('.order-status').text());
    statusText($('.order-status'),status);
    $('.status').each(function(){
        var $word=$(this).find('.word');
        statusText($word,status);
    });
    //根据订单状态的一些提示
    if(status==1) $('.hint').show();
    else $('.phone-notice').show();
    //送货时间
    var date=new Date();
    var year=date.getFullYear();
    var month=date.getMonth()+1;
    var day=date.getDate();
    var create_time=$('.create_time').val();
    var create_year=$('.create_year').val();
    var create_month=$('.create_month').val();
    var create_day=Int($('.create_day').val());
    var send_day=$('.send_day').val();
    if(send_day==1){
        if(create_year==year&&create_month==month&&create_day==day) $('.send_date').text('今天');
        else $('.send_date').hide();
        if(status==5||status==6){
            $('.send_date').text(create_year+'-'+create_month+'-'+create_day);
        }
    }
    else if(send_day==2){
        if(create_year==year&&create_month==month&&create_day+1==day) $('.send_date').text('今天');
        else if(create_year==year&&create_month==month&&create_day==day) $this.find('.send_date').text('明天');//下单模式选择了“明天”，但是日期到了“明天”的情况
        else $('.send_date').hide();
        if(status==5||status==6){
            $('.send_date').text(create_year+'-'+create_month+'-'+(create_day+1));
        }
    }
    removeDom();
});
function removeDom(){
    $('.create_time').remove();
    $('.create_year').remove();
    $('.create_month').remove();
    $('.create_day').remove();
    $('.send_day').remove();
}
function statusText(target,n){
    switch (n){
        case 0:target.text('已取消');break; 
        case 1:target.text('已下单');break;
        case 4:target.text('配送中');break;
        case 5:target.text('已送达');break;
        case 6:target.text('已评价');break;
    }
}
