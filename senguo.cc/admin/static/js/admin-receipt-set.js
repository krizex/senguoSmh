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
    var active = $('.img-set').attr('data-active');
    if (active == 1) {
        $('.line-receipt').find('.stop-mode').addClass('hidden').siblings('.work-mode').removeClass('hidden');
    }
    else {
        $('.line-receipt').find('.stop-mode').removeClass('hidden').siblings('.work-mode').addClass('hidden');
    }
    if($('.type-list')){
        var _id=parseInt($('.type-list').attr('data-id'));
        $('.circle-btn').eq(_id).addClass('active');
        $("._box").eq(_id).removeClass("hidden");
    }
    
}).on("click",".yly",function(){
    $(".secket-key").show();
}).on("click",".fy",function(){
    $(".secket-key").hide();
}).on("click",".type-list li",function(){
    var $this=$(this);
    var index=$this.index();
     $("._box").eq(index).removeClass("hidden").siblings("._box").addClass("hidden");
    $this.find(".circle-btn").addClass("active")
    $this.siblings("li").find(".circle-btn").removeClass("active");
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    var status=Int($this.attr('data-status'));
    var url='';
    var action="receipt_type_set";
    var args={
        action:action,
        data:''
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $this.attr("data-flag","on");
                if(status==1){
                    $this.attr({'data-status':0}).find('.stop-mode').show().siblings('.work-mode').hide();
                }
                else if(status == 0){
                    $this.attr({'data-status':1}).find('.stop-mode').hide().siblings('.work-mode').show();
                }
            }
            else{
                Tip(res.error_text);
            }
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~');}
        );
}).on('click', '.auto-set', function () {
    var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    var status=Int($this.attr('data-status'));
    var url='';
    var action="auto_print_set";
    var args={
        action:action,
        data:''
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                $this.attr("data-flag","on");
                if(status==1){
                    $this.attr({'data-status':0}).find('.stop-mode').show().siblings('.work-mode').hide();
                }
                else if(status == 0){
                    $this.attr({'data-status':1}).find('.stop-mode').hide().siblings('.work-mode').show();
                }
            }
            else{
                Tip(res.error_text);
            }
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~');}
        );
}).on('click', '.img-set', function () {
    var $this = $(this);
    var active = $this.attr('data-active');
    receiptImgActive(active);
}).on("click",".edit-console",function(){
    var $this=$(this);
    if($this.attr("data-flag")=="off") return false;
    $this.attr("data-flag","off");
    var url='';
    var action="console_set";
    var type=parseInt($(".console-type .active").attr("data-id"));
    var key=$(".key-input").val().trim();
    var num=$(".num-input").val().trim();
    if(!num){
        $this.attr("data-flag","on");
        return Tip("请输入无线打印机终端号");
    }
    if(num.length>20){
        $this.attr("data-flag","on");
        return Tip("请不要超过20字");
    }
    if(!key){
        $this.attr("data-flag","on");
        return Tip("请输入无线打印机终端号");
    }
    if(key.length>20){
        $this.attr("data-flag","on");
        return Tip("请不要超过20字");
    }
    var args={
        action:action,
        data:{type:type,key:key,num:num}
    };
    var _url;
    var text;
    $this.attr("data-flag","on");
    if(type == 0){
        _url = "/admin/WirelessPrint";
        text="易连云";
         var _args={
            action:"ylyadd",
            data:{key:key,num:num}
        };
        $.postJson(_url,_args,
            function(res){
                if(res.success){
                    $.postJson(url,args,
                        function(res){
                            if(res.success){
                                Tip("添加成功");
                                $(".wireless-type").text(text);
                                $(".console-num").text(num);
                                $(".console-key").text(key);
                                $this.parents('.set-list-item').find('.address-show').show();
                                $this.parents('.set-list-item').find('.address-edit').hide(); 
                            }else{
                                $this.attr("data-flag","on");
                                Tip(res.error_text);
                            }
                        },
                        function(){$this.attr("data-flag","on");Tip('网络好像不给力呢~ ( >O< ) ~');}
                    );
                }else{
                Tip(res.error_text);
                }
            }
            
        );
    }else if(type==1){
        text="飞印";
        _url = "/admin/WirelessPrint";
         var _args={
            action:"fyadd",
            data:{deviceCode:num}
        };
        $.postJson(_url,_args,
            function(res){
               if(res.success){
                $.postJson(url,args,
                    function(res){
                        if(res.success){
                            Tip("添加成功");
                            $(".wireless-type").text(text);
                            $(".console-num").text(num);
                            $(".console-key").text(key);
                            $this.parents('.set-list-item').find('.address-show').show();
                            $this.parents('.set-list-item').find('.address-edit').hide(); 
                        }else{
                            $this.attr("data-flag","on");
                            Tip(res.error_text);
                        }
                    },
                    function(){$this.attr("data-flag","on");Tip('网络好像不给力呢~ ( >O< ) ~');}
                );  
              }else{
                Tip(res.error_text);
              }
            }
        );
    }

   
});

function receiptEdit(target) {
    var url = '';
    var action = "edit_receipt";
    var receipt_msg =target.parents(".set-list-item").find('.receipt-msg').val();
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