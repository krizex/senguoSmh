$(document).ready(function () {
    $('.edit-receipt-notice').on('click', function () {
        var $this = $(this);
        receiptEdit($this);
    });
    var key = '';
    var token = '';
    $('#file_upload').uploadifive(
        {
            buttonText: '',
            width: '150px',
            uploadScript: 'http://upload.qiniu.com/',
            uploadLimit: 10,
            multi: false,
            fileSizeLimit: '10MB',
            'fileObjName': 'file',
            'removeCompleted': true,
            'fileType': '*.gif;*.png;*.jpg;*,jpeg',
            'formData': {
                'key': '',
                'token': ''
            },
            'onFallback': function () {
                return Tip('您的浏览器不支持此插件！建议使用谷歌浏览器！');
            },
            'onUpload': function () {
                $.ajaxSetup({
                    async: false
                });
                var action = "edit_recipe_img";
                var url = "/admin/config";
                var args = {action: action};
                $.postJson(url, args,
                    function (res) {
                        key = res.key;
                        token = res.token;
                    },
                    function () {
                        Tip('网络好像不给力呢~ ( >O< ) ~！');
                    }
                );
                $('#file_upload').data('uploadifive').settings.formData = {
                    'key': key,
                    'token': token
                };
            },
            'onUploadComplete': function () {
                $('#logoImg').show().attr({'src': 'http://shopimg.qiniudn.com/' + key + '?imageView2/1/w/100/h/100'});
                $('.receipt-img img').attr({'src': 'http://shopimg.qiniudn.com/' + key + '?imageView2/1/w/100/h/100'});
                $('.logo-box').find('.filename').hide();
                $('.logo-box').find('.fileinfo').hide();
                $('.logo-box').find('.close').hide();
            }
        });
    var active = $('.action-mode').attr('data-active');
    if (active == 1) {
        $('.action-mode').find('.stop-mode').addClass('hidden').siblings('.work-mode').removeClass('hidden');
    }
    else {
        $('.action-mode').find('.stop-mode').removeClass('hidden').siblings('.work-mode').addClass('hidden');
    }
}).on('click', '.action-mode', function () {
    var $this = $(this);
    var active = $this.attr('data-active');
    receiptImgActive(active);
});

function receiptEdit(target) {
    var url = '';
    var action = "edit_receipt";
    var receipt_msg = $('.receipt-msg').val();
    if (!receipt_msg) {
        receipt_msg = ''
    }
    if (receipt_msg.length > 20) {
        return Tip('小票附加消息请不要超过20个字！');
    }
    var data = {
        receipt_msg: receipt_msg
    };
    var args = {
        action: action,
        data: data
    };
    $.postJson(url, args,
        function (res) {
            if (res.success) {
                $('.receipt-msg-con').text(receipt_msg);
                target.parents('.set-list-item').find('.address-show').show();
                target.parents('.set-list-item').find('.address-edit').hide();
            }
        })
}

function receiptImgActive(active) {
    var url = '';
    var action = "recipe_img_on";
    var args = {
        action: action,
        data: ''
    };
    $.postJson(url, args,
        function (res) {
            if (active == 1) {
                $('.action-mode').attr({'data-active': 0}).find('.stop-mode').removeClass('hidden').siblings('.work-mode').addClass('hidden');
            }
            else {
                $('.action-mode').attr({'data-active': 1}).find('.stop-mode').addClass('hidden').siblings('.work-mode').removeClass('hidden');
            }
        })
}