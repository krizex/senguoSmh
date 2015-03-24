$(document).ready(function(){
    //$('.count-box').css({'height':$(window).height()});
    //if the user is using weixin brower
    //type choose
    $('.count-list li').on('click',function(){
        var $this=$(this);
        $this.addClass('active')
        $this.find('.check').removeClass('hidden');
        $this.siblings('li').removeClass('active').find('.check').addClass('hidden');
    });
    $('#back').on('click',function(){
        $('.apply-info').addClass('hidden');
        $('.count-box').removeClass('hidden');
    });
    //下一步
    $(document).on('click','.to_next',function(){
	$('.count-box').addClass('hidden').siblings('.apply-info').removeClass('hidden');
    });
    //服务区域选择
    $('.area-choose-list li').each(function(){
        var $this=$(this);
        $this.on('click',function(){
            if($this.hasClass('active'))
                {$this.removeClass('active');}
            else $this.addClass('active');
        });
    });
    //手机验证
    $(document).on('click','#getVrify',function(){Vrify();});
    //提交
    $(document).on('click','#submitApply',function(){Apply();});
    $(document).on('click','#submitReapply',function(){reApply();});
    /*var key='';
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
                $('.apply-box').find('.filename').hide();
                $('.apply-box').find('.fileinfo').hide();
                $('.apply-box').find('.close').hide();
                alert('图像上传成功，存在由于网络问题图像无法预览的情况，请谅解！');
            }

        });
*/
    //城市转换
    var proc=$('.reProvince').data('code');
    var citc=$('.reCity').data('code');
    $('.reProvince').text(provinceArea(proc));
    if(citc!=proc){$('.reCity').text(cityArea(proc,citc));}
});

function isWeiXin(){ 
    var ua = window.navigator.userAgent.toLowerCase(); 
        if(ua.match(/MicroMessenger/i) == 'micromessenger'){ 
        return true; 
        }
        else{ 
            var height=$(document).height();
            var $notice=$('<div class="notice_bg" style="height:'+height+'px;"></div><div class="notice_box"><div class="notice_con text-center text-white"><h4 class="word">请使用手机微信扫描下方二维码进行店铺申请</h4><img src="/static/images/test_qrcode.png"><h4>*( ^ v ^ )*</h4></div></div>');
            $('body').append($notice);
    } 
} 

var wait=60;
function time(target) {
    if (wait == 0) {
        target.text("获取验证码").addClass('bg-green');
        wait = 60;
        $('.able_get').attr({'id':'getVrify'});
    }
    else {
        target.text("重新发送(" + wait + ")").removeClass('bg-green').css({'background':'#ccc'});
        wait--;
        $('.able_get').attr({'id':''});
        setTimeout(function() {
                time(target)
            },
            1000)
    }
}

function Apply(evt){
    var i=0;
    if($('#serverArea li').eq(0).hasClass('active'))
        i+=1;
    if($('#serverArea li').eq(1).hasClass('active'))
        i+=2;
    if($('#serverArea li').eq(2).hasClass('active'))
        i+=4;
    if($('#serverArea li').eq(3).hasClass('active'))
        i+=8;
    var shop_name=$('#shopName').val().trim();
    var shop_province=$('#provinceAddress').attr('data-code');
    var shop_city=$('#cityAddress').attr('data-code');
    var shop_address_detail=$('#addressDetail').val().trim();
    var have_offline_entity=$('#realShop').find('.active').data('id');
    var shop_service_area=i;
    var img_key=$('#logoImg').attr('data-key');
    var shop_intro=$('#shopIntro').val().trim();
    var realName=$('#realName').val().trim();
    var wx_Name=$('#wx_Name').val().trim();
    var code=$('#verify_code').val().trim();
    var phone=$('#phone').val().trim();
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    if(phone.length > 0 && phone.length<11 && !regPhone.test(phone)){return $.noticeBox("电话貌似有错o(╯□╰)o");}
    if(shop_name.length>15){return $.noticeBox('店铺名称请不要超过15个字符！')}
    if(shop_address_detail.length>50){return $.noticeBox('详细地址请不要超过50个字符！')}
    if(shop_intro.length>300){return $.noticeBox('店铺简介请不要超过300个字符！')}
    if (!shop_name){return $.noticeBox("请输入店铺名称！");}
    if (!shop_service_area){return $.noticeBox("请选择服务区域！");}
    if (!shop_city||!shop_province){return $.noticeBox("请选择省份城市！");}
    if (!shop_address_detail){return $.noticeBox("请输入您的详细地址！");}
    if (!shop_intro){return $.noticeBox("请输入您的店铺简介");}
    if(typeof(img_key)=='undefined') img_key='';
    var regChinese=/^[\u4e00-\u9faf]+$/;
    if(!realName){return $.noticeBox('请输入您的真实姓名！')}
    if(!regChinese.test(realName)){return $.noticeBox('请输入您的真实姓名！')}
    if(!wx_Name){return $.noticeBox('请输入您的微信号！')}
    if(!code){return $.noticeBox('请输入验证码！')}
    if(!phone){return $.noticeBox('请输入您的手机号！')}
    var args={
        shop_name:shop_name,
        shop_province:shop_province,
        shop_city:shop_city,
        shop_address_detail:shop_address_detail,
        have_offline_entity:have_offline_entity,
        shop_service_area:shop_service_area,
        shop_intro:shop_intro,
        realname:realName,
        wx_username:wx_Name,
        code:code,
        shop_phone:phone
    };
    var url="";
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                window.location.href="/fruitzone/shop/applySuccess";

            }
            else  return $.noticeBox(res.error_text);
        },
        function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')}
    );
}

function reApply(evt){
    var i=0;
    if($('#serverArea li').eq(0).hasClass('active'))
        i+=1;
    if($('#serverArea li').eq(1).hasClass('active'))
        i+=2;
    if($('#serverArea li').eq(2).hasClass('active'))
        i+=4;
    if($('#serverArea li').eq(3).hasClass('active'))
        i+=8;
    var shop_name=$('#shopName').val().trim();
    var shop_province=$('#provinceAddress').attr('data-code');
    var shop_city=$('#cityAddress').attr('data-code');
    var shop_address_detail=$('#addressDetail').val().trim();
    var have_offline_entity=$('#realShop').find('.active').data('id');
    var shop_service_area=i;
    var shop_intro=$('#shopIntro').val().trim();
    var shop_id=$('#headerId').data('id');
    var img_key=$('#logoImg').attr('data-key');
    var realName=$('#realName').val().trim();
    var wx_Name=$('#wx_Name').val().trim();
    var code=$('#verify_code').val().trim();
    var phone=$('#phone').val().trim();
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    if(phone.length > 0 && phone.length<11 && !regPhone.test(phone)){return $.noticeBox("电话貌似有错o(╯□╰)o");}
    if(shop_name.length>15){return $.noticeBox('店铺名称请不要超过15个字符！')}
    if(shop_address_detail.length>50){return $.noticeBox('详细地址请不要超过50个字符！')}
    if(shop_intro.length>300){return $.noticeBox('店铺简介请不要超过300个字符！')}
    if (!shop_name){return $.noticeBox("请输入店铺名称！");}
    if (!shop_service_area){return $.noticeBox("请选择服务区域！");}
    if (!shop_city||!shop_province){return $.noticeBox("请选择省份城市！");}
    if (!shop_address_detail){return $.noticeBox("请输入您的详细地址！");}
    if (!shop_intro){return $.noticeBox("请输入您的店铺简介");}
    if(typeof(img_key)=='undefined') img_key='';
    var regChinese=/^[\u4e00-\u9faf]+$/;
    if(!realName){return $.noticeBox('请输入您的真实姓名！')}
    if(!regChinese.test(realName)){return $.noticeBox('请输入您的真实姓名！')}
    if(!wx_Name){return $.noticeBox('请输入您的微信号！')}
    if(!code){return $.noticeBox('请输入验证码！')}
    if(!phone){return $.noticeBox('请输入您的手机号！')}
    var args={
        shop_name:shop_name,
        shop_province:shop_province,
        shop_city:shop_city,
        shop_address_detail:shop_address_detail,
        have_offline_entity:have_offline_entity,
        shop_service_area:shop_service_area,
        shop_intro:shop_intro,
        shop_id:shop_id,
        realname:realName,
        wx_username:wx_Name,
        code:code,
        shop_phone:phone
    };
    var url="";
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                window.location.href="/fruitzone/shop/applySuccess";
            }
            else  $.noticeBox(res.error_text);
        },
       function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')}
    );
}

function Vrify(){
    var phone=$('#phone').val();
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    if(phone.length > 0 && phone.length<11 && !regPhone.test(phone)){return $.noticeBox("电话貌似有错o(╯□╰)o");}
    if(!phone){return $.noticeBox('手机号不能为空');}
    var action='gencode_shop_apply';
    var url="/fruitzone/phoneVerify?action=admin";
    var args={action:action,phone:phone};
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                time($('#getVrify'));
            }
            else $.noticeBox(res.error_text);
        },
       function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')},
             function(){return $.noticeBox('服务器貌似出错了~ ( >O< ) ~')}
    );
}
