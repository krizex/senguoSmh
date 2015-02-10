$(document).ready(function(){
    $('.count-list li').on('click',function(){
        var $this=$(this);
        $this.addClass('active').parents('.count-box').addClass('hidden').siblings('.apply-info').removeClass('hidden');
        $this.find('.check').removeClass('hidden');
        $this.siblings('li').removeClass('active').find('.check').addClass('hidden');
    });
    $('#back').on('click',function(){
        $('.apply-info').addClass('hidden');
        $('.count-box').removeClass('hidden');
    });

    $('.area-choose-list li').each(function(){
        var $this=$(this);
        $this.on('click',function(){
            if($this.hasClass('active'))
                {$this.removeClass('active');}
            else $this.addClass('active');
        });
    });

    $('#submitApply').on('click',function(evt){Apply(evt);});
    $('#submitReapply').on('click',function(evt){reApply(evt);});
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

    var proc=$('.reProvince').data('code');
    var citc=$('.reCity').data('code');
    $('.reProvince').text(provinceArea(proc));
    if(citc!=proc)
        {$('.reCity').text(cityArea(proc,citc));}


});

function Apply(evt){
    evt.preventDefault();
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
    var have_offline_entity=$('#realShop').find('.active').find('a').data('id');
    var shop_service_area=i;
    var img_key=$('#logoImg').attr('data-key');
    var shop_intro=$('#shopIntro').val().trim();
    var realName=$('#realName').val().trim();
    var wx_Name=$('#wx_Name').val().trim();
    if(shop_name.length>20){return alert('店铺名称请不要超过20个字符！')}
    if(shop_address_detail.length>50){return alert('详细地址请不要超过500个字符！')}
    if(shop_intro.length>300){return alert('店铺简介请不要超过300个字符！')}
    if (!shop_name){return alert("请输入店铺名称！");}
    if (!shop_service_area){return alert("请选择服务区域！");}
    if (!shop_city||!shop_province){return alert("请选择省份城市！");}
    if (!shop_address_detail){return alert("请输入您的详细地址！");}
    if (!shop_intro){return alert("请输入您的店铺简介");}
    if(typeof(img_key)=='undefined') img_key='';
    var regChinese=/^[\u4e00-\u9faf]+$/;
    if(!realName){return alert('请输入您的真实姓名！')}
    if(!regChinese.test(realName)){return alert('请输入您的真实姓名！')}
    if(!wx_Name){return alert('请输入您的微信号！')}
    var args={
        shop_name:shop_name,
        shop_province:shop_province,
        shop_city:shop_city,
        shop_address_detail:shop_address_detail,
        have_offline_entity:have_offline_entity,
        shop_service_area:shop_service_area,
        shop_intro:shop_intro,
        realname:realName,
        wx_username:wx_Name
    };
    var url="";
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                window.location.href="/fruitzone/shop/applySuccess";

            }
            else  alert(res.error_text);
        },
        function(){
            alert('网络错误！');}
    );
}

function reApply(evt){
    evt.preventDefault();
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
    var have_offline_entity=$('#realShop').find('.active').find('a').data('real');
    var shop_service_area=i;
    var shop_intro=$('#shopIntro').val().trim();
    var shop_id=$('#headerId').data('id');
    var img_key=$('#logoImg').attr('data-key');
    var realName=$('#realName').val().trim();
    var wx_Name=$('#wx_Name').val().trim();
    if(shop_name.length>20){return alert('店铺名称请不要超过20个字符！')}
    if(shop_address_detail.length>50){return alert('详细地址请不要超过500个字符！')}
    if(shop_intro.length>300){return alert('店铺简介请不要超过300个字符！')}
    if (!shop_name){return alert("请输入店铺名称！");}
    if (!shop_service_area){return alert("请选择服务区域！");}
    if (!shop_city||!shop_province){return alert("请选择省份城市！");}
    if (!shop_address_detail){return alert("请输入您的详细地址！");}
    if (!shop_intro){return alert("请输入您的店铺简介");}
    if(typeof(img_key)=='undefined') img_key='';
    var regChinese=/^[\u4e00-\u9faf]+$/;
    if(!realName){return alert('请输入您的真实姓名！')}
    if(!regChinese.test(realName)){return alert('请输入您的真实姓名！')}
    if(!wx_Name){return alert('请输入您的微信号！')}
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
        wx_username:wx_Name
    };
    var url="";
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                window.location.href="/fruitzone/shop/applySuccess";
            }
            else  alert(res.error_text);
        },
        function(){
            alert('网络错误！');}
    );
}
