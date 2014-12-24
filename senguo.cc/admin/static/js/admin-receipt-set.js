$(document).ready(function(){
    $('.add-receipt-notice').on('click',function(){
        receiptAdd();
    });
});
function receiptAdd(){
    var url=link;
    var action="edit_receipt";
    var title=$('.new-receipt-title').val();
    var receipt_msg=$('.new-receipt-detail').val();
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
                $('#noticeBox').modal('hide');
            }
        })
}