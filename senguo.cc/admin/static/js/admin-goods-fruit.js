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
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    var fruit_type_id=parseInt(fruit_id);
    var name=target.parents('.add-goods-item').find('#goodsName').val().trim();
    console.log(name);
    var saled=parseInt(target.parents('.add-goods-item').find('#goodsSale').val());
    var storage=parseInt(target.parents('.add-goods-item').find('#goodsStorage').val());
    var unit=parseInt(target.parents('.add-goods-item').find('#goodsUnit').attr('data-id'));
    var tag=target.parents('.add-goods-item').find('.tag-list').find('.active').data('id');
    var img_url=target.parents('.add-goods-item').find('.imgPreview').attr('data-key');
    var intro=target.parents('.add-goods-item').find('#goodsIntro').val();
    var priority=parseInt(target.parents('.add-goods-item').find('#goodsPriority').val());
    var charge_type=function(){
        this.price="";
        this.number="";
        this.unit=""
    };
    var charge_item=$('.add-charge-list').find('li');
    for(var i=0;i<charge_item.length;i++)
        {
            charge_type[this.price]=charge_item.eq[i].find('.charge_price').val();
            charge_type[this.number]=charge_item.eq[i].find('.charge_num').val();
            charge_type[this.unit]=charge_item.eq[i].find('.charge_unit').attr('data-id');
        }
    if(!name||!saled||!storage||!intro){return alert('请输入相关商品信息！');}
    if(!regNumber.test(saled)){return alert('销量只能为数字！');}
    if(!regNumber.test(storage)){return alert('库存只能为数字！');}
    if(!regNumber.test(priority)){return alert('优先级只能为数字！');}
    if(priority<1||priority>5){return alert('优先级只能为1-5！');}
    if(!charge_type){return alert('请至少填写一种计价方式！');}
    var data={
        fruit_type_id:fruit_type_id,
        name:name,
        saled:saled,
        storage:storage,
        unit:unit,
        tag:tag,
        img_url:img_url,
        intro:intro,
        priority:priority,
        charge_type:charge_type
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
