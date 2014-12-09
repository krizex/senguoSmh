$(document).ready(function(){
    $('.unshelve').on('click',function(){worMode($(this))});
    $('.shelve').on('click',function(){worMode($(this))});

    $('.tag-list a').on('click',function(){$(this).addClass('active').siblings('a').removeClass('active')});
    $('.add-goods-sure').on('click',function(){addFruit($(this))});

    $('.unitlist li').on('click',function(){
        var unit_id=$(this).find('a').data('id');
        var unit=$(this).find('a').text();
        console.log(unit_id+''+unit);
        $(this).parents('.btn-group').find('.unitContent').attr({'data-id':unit_id}).text(unit);
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
                var url="/admin/shelf/0";
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
                $('.imgPreview').attr({'src':'http://goodsimg1.qiniudn.com/'+key+'?imageView/1/w/100/h/100','data-key':key});
            }

        });


});
var shop_id=$('#shopId').data('id');
var fruit_id= $.getUrlParam('id');
function addFruit(target){
    var url="/admin/shelf/"+shop_id;
    var action="add_fruit";
    var fruit_type_id=fruit_id;
    console.log(target);
    var name=target.parents('.add-goods-item').find('#goodsName').text();
    var saled=target.parents('.add-goods-item').find('#goodsSale').text();
    var storage=target.parents('.add-goods-item').find('#goodsStorage').text();
    var unit=target.parents('.add-goods-item').find('#goodsUnit').attr('data-id');
    var tag=target.parents('.add-goods-item').find('.tag-list').find('.active').data('id');
    var img_url=target.parents('.add-goods-item').find('.imgPreview').attr('data-key');
    var intro=target.parents('.add-goods-item').find('#goodsIntro').text();
    var priority=target.parents('.add-goods-item').find('#goodsPriority').text();
    var data={
        fruit_type_id:fruit_type_id,
        name:name,
        saled:saled,
        storage:storage,
        unit:unit,
        tag:tag,
        img_url:img_url,
        intro:intro,
        priority:priority
    };
    var args={
        action:action,
        data:data

    };
    $.postJson(url,args,
        function(res){
            if(res.success){

            }
    })
}
