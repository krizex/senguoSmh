$(document).ready(function(){
    //订单状态
    $('.order-status').each(function(){
        var $this=$(this);
        var text=Int($this.text());
        statusText($this,text);
    });
    //送货时间
    var date=new Date();
    var day=date.getDay();
    $('.order-list-item').each(function(){
        var $this=$(this);
        var create_time=$this.find('.create_time').val();
        var create_year=$this.find('.create_year').val();
        var create_month=$this.find('.create_month').val();
        var create_day=Int($this.find('.create_day').val());
        var send_day=$this.find('.send_day').val();
        var status=$this.find('.order_status').val();
        if(send_day==1){
            $this.find('.send_date').text('今天');
            if(status==5){
                $this.find('.send_date').text(create_year+'-'+create_month+'-'+create_day);
                $this.find('.un-arrive').text('已送达');
                $this.find('.status_notice').text('已送达');
            }
        }
        else if(send_day==2){
            if(day==create_day){
                $this.find('.send_date').text('今天');
            }//下单模式选择了“明天”，但是日期到了“明天”的情况
            else{
                $this.find('.send_date').text('明天');
            }
            if(status==5){
                $this.find('.send_date').text(create_year+'-'+create_month+'-'+(create_day+1));
                $this.find('.un-arrive').text('已送达');
                $this.find('.status_notice').text('已送达');
            }
        }
    });
    //取消订单
    $('.order-concel').each(function() {
        var $this = $(this);
        var id=$this.parents('.order-list-item').data('id');
        $this.on('click', function () {
            orderConcel($this,id);
        });
    });

});
var order_href='/customer/orders';
function statusText(target,n){
    switch (n){
        case 1:target.text('配送中').addClass('text-green');break;
        case 4:target.text('配送中').addClass('text-green');break;
        case 5:target.text('已送达').addClass('text-grey');break;
    }
}

function orderConcel(target,id){
    var url=order_href;
    var action='cancel_order';
    var data={
        order_id:id
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            target.parents('.order-list-item').remove();
        }
        else return alert(res.error_text)
    },function(){return alert('网络错误！')})
}