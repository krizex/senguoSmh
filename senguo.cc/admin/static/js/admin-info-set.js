$(document).ready(function(){
    var code=$('.shop_code').val();
    var imgData;
    if(code=='not set'||code=='请设置') {
        $('.notice_word').show();
        $('.code_set').show();
    }
    else {
        $('.link_notice').show();
        //店铺二维码
        var shop_link=$('.shop_link').text();
        var shop_code=$('.shop_link').find('.code').text();
        $('#shop_link_img').qrcode({render: "canvas",width: 100,height:100,text: shop_link ,typeNumber  : -1});
	//从canvas导出图片
	var type = 'png';
	var canvas=$('#shop_link_img canvas')[0];
	imgData=canvas.toDataURL(type);
	imgData = imgData.replace(_fixType(type),'image/octet-stream');
    }
    //二维码下载 
    $('.download_img').on('click',function(){
	var filename = 'baidufe_' + (new Date()).getTime() + '.' + type;
    	saveFile(imgData,filename);
    });
   //信息转换显示
    $('.area-choose-list li').each(function(){
        $(this).on('click',function(){
            if($(this).hasClass('active'))
            {$(this).removeClass('active');}
            else $(this).addClass('active');
        });
    });
    $('.offline_entity').each(function(){
        var $this=$(this);
        var text=$this.text();
        if(text=='True') $this.text('有');
        else $this.text('没有');
    });

    $('.offline_entity-list li').on('click',function(){
        var $this=$(this);
        var val=$this.data('id');
        var text=$this.text();
        $('#offline_entity').text(text).attr({'data-id':val});

    });
    //店铺logo上传
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
                var action="edit_shop_img";
                var url="";
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

    //城市编码转换
    var proc=$('.reProvince').data('code');
    var citc=$('.reCity').data('code');
    $('.reProvince').text(provinceArea(proc));
    if(citc!=proc)
    {$('.reCity').text(cityArea(proc,citc));}
    //店铺信息编辑
    $('.info_edit').each(function(){
        var $this=$(this);
        $this.on('click',function(){
            $this.hide().siblings('.info_sure').show().parents('li').find('.info_show').hide().siblings('.info_hide').show();
        });
    });
    $('.info_sure').each(function(){
        var $this=$(this);
        $this.on('click',function(){
            if($this.hasClass('code_sure')&&confirm('店铺号用于您的商城链接，设置后将不可更改，是否确定使用该店铺号？'))
            {
                infoEdit($this);
            }
            else infoEdit($this);
        });
    });
});
//获取mimeType
var _fixType = function(type) {
    type = type.toLowerCase().replace(/jpg/i, 'jpeg');
    var r = type.match(/png|jpeg|bmp|gif/)[0];
    return 'image/' + r;
};
//在本地进行文件保存
var saveFile = function(data, filename){
    var save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
    save_link.href = data;
    save_link.download = filename;
   
    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    save_link.dispatchEvent(event);
};

function infoEdit(target){
    var url="";
    var action_name=target.data('id');
    var data={};
    var action,shop_name,shop_intro,shop_city,shop_address_detail,have_offline_entity,address,entity_text,shop_code;
    if(action_name=='name')
        {
            action='edit_shop_name';
            shop_name=$('.shop_name').val().trim();
            if(shop_name.length>20){return alert('店铺名称请不要超过20个字符！')}
            data={shop_name:shop_name};
        }
    else if(action_name=='code')
    {
        var reg=/^\w+$/;
        action='edit_shop_code';
        shop_code=$('.shop_code').val().trim();
        if(!reg.test(shop_code)){return alert('店铺号只能为字母、数字以及下划线组成！')}
        if(shop_code.length<4){return alert('店铺号至少为4位数！')}
        data={shop_code:shop_code};
    }
    else if(action_name=='intro')
    {
        action='edit_shop_intro';
        shop_intro=$('.shop_intro').val().trim();
        if(shop_intro.length>300){return alert('店铺简介请不要超过300个字符！')}
        data={shop_intro:shop_intro};
    }
    else if(action_name=='address')
    {
        action='edit_address';
        shop_city=$('#cityAddress').attr('data-code');
        address=$('#provinceAddress').text()+$('#cityAddress').text()+$('#addressDetail').val();
        shop_address_detail=$('#addressDetail').val().trim();
        if(shop_address_detail.length>50){return alert('详细地址请不要超过500个字符！')}
        data={
            shop_city:shop_city,
            shop_address_detail:shop_address_detail
        };
    }
    else if(action_name=='area')
    {
        action='edit_deliver_area';
        var deliver_area=$('.deliver-area').val().trim();
        data={
            deliver_area:deliver_area
        }
    }
    else if(action_name=='entity')
    {
        action='edit_have_offline_entity';
        var entity=$('#offline_entity').attr('data-id');
        if(entity==1) have_offline_entity=1;
        else have_offline_entity=0;
        entity_text=$('#offline_entity').text();
        data={have_offline_entity:have_offline_entity};
    }
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                if(action_name=='name')
                {
                   $('.name').text(shop_name);
                   $('#shop_name').text(shop_name).attr({'title':shop_name});
                }
                else if(action_name=='code')
                {
                    $('.code').text(shop_code);
                    $('.shop_link').attr({'href':'http://zone.senguo.cc/shop/'+shop_code});
                    $('#shop_link_img').qrcode({render: "canvas",width: 100,height:100,text: 'http://zone.senguo.cc/shop/'+shop_code ,typeNumber  : -1});
                    $('.link_notice').show();
                    $('.notice_word').hide();
                    $('.code_set').hide();
                }
                else if(action_name=='intro')
                {
                    $('.intro').text(shop_intro);
                }
                else if(action_name=='address')
                {
                    $('.address').text(address);
                }
                else if(action_name=='area')
                {
                    $('.deliver_area').text(deliver_area);
                }
                else if(action_name=='entity')
                {
                    $('.offline_entity').text(entity_text);
                }
                target.hide().siblings('.info_edit').show().parents('li').find('.info_show').show().siblings('.info_hide').hide();
            }
            else  alert(res.error_text);
        },
        function(){
            alert('网络错误！');}
    );
}
