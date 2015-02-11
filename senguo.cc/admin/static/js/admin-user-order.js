$(document).ready(function(){
    var item_url='/static/items/customer/order-item.html?v=2015-02-02';
    getOrder(item_url);
});
var orders=window.dataObj.order;
var list_item;

function getOrder(url){
    $.getItem(url,function(data){
            list_item=data;
            orderItem(orders);
        }
    );
}

function orderItem(list_item){
    for(var i=0;i<list_item.length;i++){
        var $item=$(list_item);
        var address_text=list_item[i]['address_text'];
        var create_date=list_item[i]['create_date'];
        var fruits=list_item[i]['fruits'];
        var mgoods=list_item[i]['mgoods'];
        var money_paid=list_item[i]['money_paid'];
        var pay_type=list_item[i]['pay_type'];
        var phone=list_item[i]['phone'];
        var receiver=list_item[i]['receiver'];
        var remark=list_item[i]['remark'];
        var staff_remark=list_item[i]['staff_remark'];
        var status=list_item[i]['status'];
        var tip=list_item[i]['tip'];
        var today=list_item[i]['today'];
        var totalPrice=list_item[i]['totalPrice'];
        var type=list_item[i]['type'];


        $item.find('.user-img').attr({'src':img});
        $item.find('.user-name').text(name);
        $item.find('.comment-time').text(time);
        $item.find('.comment-text').text(comment);
        if(reply!='' && reply!=null){$item.find('.reply-text').text(reply);}
        else $item.find('.comment').hide();
        $('#commnent-list').append($item);
    }
}