$(document).ready(function(){
    $('.tag-list a').on('click',function(){$(this).addClass('active').siblings('a').removeClass('active')});

    //商品单位切换显示
    $('body').on('click','.unitlist li',function(){
        var unit_id=$(this).find('a').data('id');
        var unit=$(this).find('a').text();
        $(this).parents('.btn-group').find('.unitContent').attr({'data-id':unit_id}).text(unit);
    });


    //商品单位换算
    $('body').on('click','.goodsUnitList a',function(){
        var n=$(this).data('id');
        if(n==3)$(this).parents('.btn-group').siblings('.unit-change').removeClass('hidden');
        else $(this).parents('.btn-group').siblings('.unit-change').addClass('hidden');
    });

    //商品单位换算显示
    $('.charge-unit').each(function(){
        var n=$(this).data('id');
        if(n==3)$(this).parents('.btn-group').siblings('.unit-change').removeClass('hidden');
        else $(this).parents('.btn-group').siblings('.unit-change').addClass('hidden');
    });

    //上下架状态转换
    $('.goods-edit-active').each(function(){
        var n=$(this).data('active');
        switch (n){
            case 1:$(this).find('.shelve').show().siblings('.unshelve').hide();break;
            case 2:$(this).find('.unshelve').show().siblings('.shelve').hide();break;
        }
    });

    //商品单位转换
    $('.good-unit').each(function(){
        var n=$(this).data('id');
        switch (n){
            case 1:$(this).text('个');break;
            case 2:$(this).text('斤');break;
            case 3:$(this).text('份');break;
        }
    });

    //商品标签转换
    $('.goods-tag').each(function(){
        var n=$(this).data('id');
        switch (n){
            case 1:$(this).hide();break;
            case 2:$(this).text('SALE').addClass('bg-orange');break;
            case 3:$(this).text('HOT').addClass('bg-red');break;
            case 4:$(this).text('SALE').addClass('bg-pink');break;
            case 5:$(this).text('NEW').addClass('bg-green');break;
        }
    });

    //商品标签显示
    $('.goods-item-edit').find('.tag-list').each(function(){
        var n=$(this).data('id');
        switch (n){
            case 1:$(this).find('a').eq(0).addClass('active');
            case 2:$(this).find('a').eq(1).addClass('active');break;
            case 3:$(this).find('a').eq(2).addClass('active');break;
            case 4:$(this).find('a').eq(3).addClass('active');break;
            case 5:$(this).find('a').eq(4).addClass('active');break;
        }
    });

    //上下架操作
    $('.goods-edit-active').each(function(){
        $(this).on('click',function(){
            var n=$(this).data('active');
            var fruit_id=$(this).parents('.goods-list-item').data('id');
            editActive(fruit_id);
            switch (n){
                case 1:$(this).find('.unshelve').show().siblings('.shelve').hide();break;
                case 2:$(this).find('.shelve').show().siblings('.unshelve').hide();break;
            }
        });
    });

    var key='';
    var token='';
    //商品添加图片上传
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
                $(this).parents('.upload-img').find('.imgPreview').attr({'src':'http://goodsimg1.qiniudn.com/'+key+'?imageView/1/w/100/h/100','data-key':key});
            }

        });

    //商品编辑图片上传
    $('#edit_file_upload').uploadifive(
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
                var action="edit_img";
                var url="/admin/shelf/"+shop_id;
                var args={action: action};
                $.postJson(url,args,
                    function (res) {
                        key=res.key;
                        token=res.token;
                    },
                    function(){
                        alert('网络错误！');}
                );
                $('#edit_file_upload').data('uploadifive').settings.formData = {
                    'key':key,
                    'token':token
                };
            },
            'onUploadComplete':function(){
                $(this).parents('.upload-img').find('.imgPreview').attr({'src':'http://goodsimg1.qiniudn.com/'+key+'?imageView/1/w/100/h/100','data-key':key});
            }

        });

    //商品添加
    $('.add-goods-sure').on('click',function(){addEditFruit($(this),shop_id,'add_fruit')});

    //商品编辑
    $('.edit-goods-sure').each(function(){
        $(this).on('click',function(){
            var fruit_id=$(this).parents('.goods-list-item').data('id');
            addEditFruit($(this),fruit_id,'edit_fruit');
        })
    });

    //新增计价方式
    $('.addNewCharge').each(function(){
        $(this).on('click',function(){
            var item=' <li class="set-width-float"><span class="pull-left">价格：<input type="text" class="w4 set-right5 charge-price"/></span><span class="pull-left">数量：<input type="text" class="w4 set-right5 charge-num"/></span><span class="pull-left">单位：</span><div class="btn-group pull-left set-right5"><button type="button" class="btn btn-default dropdown-toggle w1" data-toggle="dropdown"><span data-id="1"  class="unitContent charge-unit goodsUnit">个</span><span class="caret"></span></button><ul class="dropdown-menu unitlist goodsUnitList" role="menu"><li><a href="javascript:;" data-id="1">个</a></li><li><a href="javascript:;" data-id="2">斤</a></li><li><a href="javascript:;" data-id="3">份</a></li></ul></div><div class="pull-left unit-change hidden">=<input type="text" class="w4 set-left5 set-right5 charge-unit-num"/>个</div><a href="javascript:;" class="delete-btn2 pull-right"></a></li>';
            $(this).parents('.add-charge-box').find('.add-charge-list').append(item);
        })
    });
});
var shop_id=$('#shopId').data('id');
var fruit_id= $.getUrlParam('id');

function addEditFruit(target,id,action){
    var url="/admin/shelf/"+id;
    var action=action;
    var regNumber=/^[0-9]*[1-9][0-9]*$/;
    var fruit_type_id=parseInt(fruit_id);
    var name=target.parents('.add-edit-item').find('.goodsName').val();
    var saled=parseInt(target.parents('.add-edit-item').find('.goodsSale').val());
    var storage=parseInt(target.parents('.add-edit-item').find('.goodsStorage').val());
    var unit=parseInt(target.parents('.add-edit-item').find('.goodsUnit').attr('data-id'));
    var tag=target.parents('.add-edit-item').find('.tag-list').find('.active').data('id');
    var img_url=target.parents('.add-edit-item').find('.imgPreview').attr('data-key');
    var intro=target.parents('.add-edit-item').find('.goodsIntro').val();
    var priority=parseInt(target.parents('.add-edit-item').find('.goodsPriority').val());
    var charge_types=[];
    var charge_item=target.parents('.add-edit-item').find('.add-goods-charge-list').children('li');
    for(var i=0;i<charge_item.length;i++)
        {
            var price=charge_item.eq(i).find('.charge-price').val();
            var num=charge_item.eq(i).find('.charge-num').val();
            var units=charge_item.eq(i).find('.charge-unit').attr('data-id');
            var unit_num=charge_item.eq(i).find('.charge-unit-num').val();
            if(!unit_num){unit_num=1}
            var charge= {
                'price' :price,
                'num':num,
                'unit':units,
                'unit_num':unit_num
            };
            charge_types.push(charge);
        }
    console.log(charge_types);
    if(!name||!saled||!storage||!intro){return alert('请输入相关商品信息！');}
    if(!regNumber.test(saled)){return alert('销量只能为数字！');}
    if(!regNumber.test(storage)){return alert('库存只能为数字！');}
    if(!regNumber.test(priority)){return alert('优先级只能为数字！');}
    if(priority<1||priority>5){return alert('优先级只能为1-5！');}
    if(!charge_types){return alert('请至少填写一种计价方式！');}
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
        charge_types:charge_types
    };
    var args={
        action:action,
        data:data

    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                alert('水果添加成功！');
                //window.location.reload();
            }
    })
}

function editActive(id){
    var url="/admin/shelf/"+id;
    var action='edit_active';
    var data={};
    var args={
        action:action,
        data:data

    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                window.location.reload();
            }
        })
}