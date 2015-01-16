$(document).ready(function(){
    $('.edit-receipt-notice').on('click',function(){
        var $this=$(this);
        receiptEdit($this);
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
                var action="edit_recipe_img";
                var url="/admin/config";
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
                $('#logoImg').show().attr({'src':'http://shopimg.qiniudn.com/'+key+'?imageView/1/w/200/h/200'});
                $('.receipt-img img').attr({'src':'http://shopimg.qiniudn.com/'+key+'?imageView/1/w/200/h/200'});
                $('.logo-box').find('.filename').hide();
                $('.logo-box').find('.fileinfo').hide();
                $('.logo-box').find('.close').hide();
            }

        });
});
function receiptEdit(target){
    var url=link;
    var action="edit_receipt";
    var receipt_msg=$('.receipt-msg').val();
    if(!receipt_msg){ receipt_msg=''}
    if(receipt_msg.length>20){return alert('小票附加消息请不要超过20个字！');}
    var data={
        receipt_msg:receipt_msg
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $('.receipt-msg-con').text(receipt_msg);
                target.parents('.set-list-item').find('.address-show').show();
                target.parents('.set-list-item').find('.address-edit').hide();
            }
        })
}