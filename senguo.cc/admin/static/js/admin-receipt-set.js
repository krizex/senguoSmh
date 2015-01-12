$(document).ready(function(){
    $('.edit-receipt-notice').on('click',function(){
        receiptEdit();
    });
    var key='';
    var token='';
    $('#file_upload').uploadifive(
        {
            buttonText    : '',
            width: '150px',
            uploadScript  : 'http://upload.qiniu.com/',
            uploadLimit     : 10,
            multi    :     false,
            fileSizeLimit   : '10MB',
            'fileObjName' : 'file',
            'removeCompleted' : true,
            'fileType':'*.gif;*.png;*.jpg;*,jpeg',
            'formData':{
                'key':'',
                'token':''
            },
            'onUpload' :function(){
                $.ajaxSetup({
                    async : false
                });
                var action="add_img";
                var url="/fruitzone/shop/apply/addImg";
                var args={action: action};
                $.postJson(url,args,
                    function (res) {
                        key=res.key;
                        token=res.token;
                    },
                    function(){
                        alert('网络错误！');}
                );
                $('#file_upload').data('uploadifive').settings.formData = {
                    'key':key,
                    'token':token
                };
            },
            'onUploadComplete':function(){
                $('#logoImg').show().attr({'src':'http://shopimg.qiniudn.com/'+key+'?imageView/1/w/200/h/200','data-key':key});
                $('.logo-box').find('.filename').hide();
                $('.logo-box').find('.fileinfo').hide();
                $('.logo-box').find('.close').hide();
            }

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