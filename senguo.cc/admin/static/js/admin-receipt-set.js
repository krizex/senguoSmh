$(document).ready(function(){
    $('.edit-receipt-notice').on('click',function(){
        receiptEdit();
    });
});
function receiptEdit(){
    var url=link;
    var action="edit_receipt";
    var title=$('.receipt-head').val();
    var receipt_msg=$('.receipt-msg').val();
    if(!title){return alert('请输入小票抬头！')}
    if(!receipt_msg){ receipt_msg=''}
    var data={
        title:title,
        receipt_msg:receipt_msg
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $('.receipt-head-con').text(title);
                $('.receipt-msg-con').text(receipt_msg);
                $('#noticeBox').modal('hide');
            }
        })
}