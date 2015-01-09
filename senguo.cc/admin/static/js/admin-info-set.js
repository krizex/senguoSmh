$(document).ready(function(){
    $('.area-choose-list li').each(function(){
        $(this).on('click',function(){
            if($(this).hasClass('active'))
            {$(this).removeClass('active');}
            else $(this).addClass('active');
        });
    });
    $('.offline_entity').each(function(){
        var $this=$(this);
        var text=$this.text;
        if(text=='True') $this.text('有');
        else $this.text('没有');
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

    //城市编码转换
    var proc=$('.reProvince').data('code');
    var citc=$('.reCity').data('code');
    $('.reProvince').text(provinceArea(proc));
    if(citc!=proc)
    {$('.reCity').text(cityArea(proc,citc));}

    $('.info_edit').each(function(){
        var $this=$(this);
        $this.on('click',function(){
            $this.hide().siblings('.info_sure').show().parents('li').find('.info_show').hide().siblings('.info_hide').show();
        });
    });
    $('.info_sure').each(function(){
        var $this=$(this);
        $this.on('click',function(){
            infoEdit($this);
        });
    });
});

function infoEdit(target){
    var url="";
    var action_name=target.data('id');
    var data={};
    var action,shop_name,shop_intro,shop_city,shop_address_detail;
    if(action_name=='name')
        {
            console.log(222);
            action='edit_shop_name';
            shop_name=$('.shop_name').val().trim();
            if(shop_name.length>20){return alert('店铺名称请不要超过20个字符！')}
            data={shop_name:shop_name};
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
        shop_address_detail=$('#addressDetail').val().trim();
        if(shop_address_detail.length>50){return alert('详细地址请不要超过500个字符！')}
        data={
            shop_city:shop_city,
            shop_address_detail:shop_address_detail
        };
    }
    //var have_offline_entity=$('#realShop').find('.active').find('a').data('real');
    //var shop_service_area=i;
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {


            }
            else  alert(res.error_text);
        },
        function(){
            alert('网络错误！');}
    );
}