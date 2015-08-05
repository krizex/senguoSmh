$(document).ready(function(){
    //remove type of menu's button to check all
    var now_type=$.getUrlParam('action');
    if(now_type=='menu'){
        $('.check-shelf').hide();
    } 
    //查看已上架
    $('.check-shelf').on('click',function(){
         event.preventDefault();
        var $this=$(this);
        var link_id= $.getUrlParam('id');
        if(link_id<1000) window.location.href='/admin/shelf?action=all&id=1';
        else window.location.href='/admin/shelf?action=all&id=1001';
    });
    //导航acitve样式
    var link_id= $.getUrlParam('id');
    var link_action= $.getUrlParam('action');
    if(link_id>1000) $('.dry_active').addClass('active').siblings('li').removeClass('active');
    $('.menu_active').each(function(){
        var $this=$(this);
        var name=$this.data('id');
        if(name==link_id&&link_action=='menu')
        $this.addClass('active');
    });
    //查看所有上架-不允许添加新商品
    if(link_action=='all'){
        $('.add-new-goods').hide();
    }
    //添加新的商品分类
    $('#add-new-goodsType').on('click',function(){
        var max_type_num=$('.goods-classify').find('.item').length;
        if(max_type_num<5) {
            var $box=$('.add-goodsType-box');
            $box.modal('show').find('.modal-title').text('新建商品分类');
            $box.find('.type_add').removeClass('hidden').siblings('.type_eidt').addClass('hidden');
            $box.find('#type-name').val('');
        }
        else return Tip('最多可添加5个商品分类！');
    });
    $('body').on('click','#add-goodsType',function(){addEditType($(this),'add_menu')});
    //商品分类名编辑
    $('.menu_active').hover(
        function(){
            var $this=$(this);
            $this.find('.class_name_edit').show();
        },
        function(){
            var $this=$(this);
            $this.find('.class_name_edit').hide();
    });
    $('body').on('click','.class_name_edit',function(){
        var $this=$(this);
        var $parent=$this.parents('.menu_active');
        var name=$parent.find('a').text();
        var id=$parent.data('id');
        var index=$parent.index();
        var $box=$('.add-goodsType-box');
        $box.modal('show').attr({'data-id':id,'data-index':index}).find('.modal-title').text('编辑商品分类');
	$box.find('.type_eidt').removeClass('hidden').siblings('.type_add').addClass('hidden');
        $box.find('#type-name').val(name);
    });
    $('body').on('click','#edit-goodsType',function(){addEditType($(this),'edit_menu_name')});

    $('.tag-list a').on('click',function(){$(this).addClass('active').siblings('a').removeClass('active')});
    //当前商品所在分类
    $('.type-class a').each(function(){
        var $this=$(this);
        var id=$this.data('id');
        var classify=$this.data('class');
        if(id==fruit_type_id&&classify==link_action){$this.addClass('active')}
    });
    $('.shelve-num').text($('.shelveList').find('a').length);
    $('.unshelve-num').text($('.unshelveList').find('a').length);
    $('.fruit-type').text($('.type-class .active').find('.name').text());
    $('.fruit-shelve-num').text($('.type-class .active').find('.num').text());
     if(now_type=='all'){
        var all_num=$('.shelve-num').text();
        $('.fruit-left-title').empty().text('已选择：本类全部已上架商品 共'+all_num+'种');   
    }
    //图片速选框
    $('#preview_choose').on('click',function(){
	$('.preview-shelve-list').empty();
        $.getItem('/static/items/admin/preview-item.html?v=20150613',function(data){
           var fruit_type=$('#fruit_type').val();
           fruit_type=eval("("+fruit_type+")");
           for(var key in fruit_type )
           {
               var $item=$(data);
               $item.find('.link').attr({'href':'/admin/shelf?action=fruit&id='+key});
               $item.find('.img').attr({'src':'/static/design_img/'+fruit_type[key]['code']+'.png'});
               $item.find('.name').text(fruit_type[key]['name']+'('+fruit_type[key]['sum']+')');
               //if(fruit_type[key]['sum']!==0) $item.css({'border-color':'#44b549'});
               $('.preview-shelve-list').append($item);
           }
        });
        $('#preview_box').modal('show');
    });
    $('.preview-prepage').on('click',function(){
        $('.preview-list').animate({top:'0'});
        $('.preview-prepage').hide();
        $('.preview-nextpage').show();
    });
    $('.preview-nextpage').on('click',function(){
       $('.preview-list').animate({top:'-580px'});
        $('.preview-prepage').show();
        $('.preview-nextpage').hide();
    });
    //商品单位切换显示
    $('body').on('click','.unitlist li',function(){
        var $this=$(this);
        var unit_id=$this.find('a').data('id');
        var unit=$this.find('a').text();
        $this.parents('.item-unit').find('.unitContent').attr({'data-id':unit_id}).text(unit);
    });
    //商品单位转换
    $('.good-unit').each(function(){
        var n=$(this).data('id');
        unitText($(this),n);
    });
    //商品标签转换
    $('.goods-tag').each(function(){
        var $this=$(this);
        var n=$this.data('id');
        switch (n){
            case 1:$this.hide();break;
            case 2:$this.addClass('limit_tag');break;
            case 3:$this.addClass('hot_tag');break;
            case 4:$this.addClass('sale_tag');break;
            case 5:$this.addClass('new_tag');break;
        }
    });
    //商品标签显示
    $('.goods-item-edit').find('.tag-list').each(function(){
        var $this=$(this);
        var n=$this.data('id');
        for(var i=0;i<=n;i++)
            {
                var tag=$this.find('a').eq(i);
                if(tag.data('id')==n) tag.addClass('active');
            }
    });
    //上下架状态转换
    $('.goods-edit-active').each(function(){
        var $this=$(this);
        var n=$this.data('active');
        switch (n){
            case 1:$this.find('.shelve').show().siblings('.unshelve').hide();break;
            case 2:$this.find('.unshelve').show().siblings('.shelve').hide();break;
        }
    });
    //上下架操作
    $('.goods-edit-active').on('click',function(){
            var $this=$(this);
            var fruit_id=$this.parents('.goods-list-item').data('id');
            editActive(fruit_id,$this);
            $this.find('span').toggle();
    });
    //***商品添加***
    $('.add-new-goods').on('click',function(){
        var max_goods_num=$('.goods-list').find('.goods-list-item').length;
        default_code=$('.type-class .active').data('code');
        var current_clssify=$('.type-class .active .name').text();
        var key='';
        var token='';
        add_goods_box.empty();
        if(max_goods_num<=30){
            $.getItem('/static/items/admin/add-new-goods.html?v=20150613',function(data){
                var $item=$(data);
                if(!current_clssify) {
                    $item.find('.modal-title').text('新增一种商品'); 
                }
                else {
                   $item.find('.modal-title').text('新增一种'+'“'+current_clssify+'”'); 
                }
                if(typeof(default_code)=='undefined') $item.find('.imgPreview').attr({'src':'/static/design_img/TDSG.png'});
                else $item.find('.imgPreview').attr({'src':'/static/design_img/'+default_code+'.png'});
                upload_item=$item.find('#file_upload');
                add_goods_box.append($item).modal('show');
                //商品添加-图片上传
                upload_item.uploadifive(
                    {
                        buttonText    : '',
                        width: '150px',
                        uploadScript  : 'http://upload.qiniu.com/',
                        uploadLimit     : 10,
                        multi    :     false,
                        fileSizeLimit   : '10MB',
                        'fileObjName' : 'file',
                        'removeCompleted' : true,
                        'fileType':'*.gif;*.png;*.jpg;*.jpeg;*.svg;*.JPG;*.JPEG;*.PNG;*.GIF;*.bmp;*.BMP;',
                        'onAddQueueItem' : function(file){
                            var fileName = file.name;
                            var ext = fileName.substring(fileName.lastIndexOf(".")+1,fileName.length);
                            switch (ext) {
                                case 'jpg':
                                case 'JPG':
                                case 'jpeg':
                                case 'JPEG':
                                case 'png':
                                case 'PNG':
                                case 'bmp':
                                case 'BMP':
                                case 'svg':
                                    break;
                                default:
                                    Tip("无效的文件格式！图片支持格式:png,jpg,jpeg,bmp,svg");
                                    $(this).uploadifive('cancel', file);
                                    break;
                            }
                        },
                        'formData':{
                            'key':'',
                            'token':''
                        },
                        'onFallback':function(){
                            return Tip('您的浏览器不支持此插件！建议使用谷歌浏览器！');
                        },
                        'onUpload' :function(){
                            $.ajaxSetup({
                                async : false
                            });
                            var action="add_img";
                            var url="";
                            var args={action: action};
                            $.postJson(url,args,
                                function (res) {
                                    key=res.key;
                                    token=res.token;
                                },
                                function(){
                                    Tip('网络好像不给力呢~ ( >O< ) ~！');}
                            );
                            $('#file_upload').data('uploadifive').settings.formData = {
                                'key':key,
                                'token':token
                            };
                        },
                        'onUploadComplete':function(){
                            $(this).parents('.upload-img').find('.imgPreview').attr({'src':'http://7rf3aw.com2.z0.glb.qiniucdn.com/'+key+'?imageView2/1/w/100/h/100','data-key':key});
                        }

                    });
            });
        }
        else Tip('该分类下最多可添加30种商品！如仍需添加请选择其他分类！');
        defalutChangeUnit(storage_unit_id);
     });
    $('body').on('click','.add-goods-sure',function(){
        var $this=$(this);
        var menu_type= $.getUrlParam('action');
        if(confirm('商品完成添加后商品库存将不可更改,确认添加该商品吗?╮(￣▽￣)╭（tips:商品完成添加后如需修改商品库存，建议新建商品以便使用新的库存单位!）')){
            if(menu_type=='fruit'){
                addEditFruit($this,'add_fruit')
            }
            else if (menu_type == 'menu'){
                addEditFruit($this,'add_mgoods')
            }
        }
    });
    //商品添加-标签预览
    $('body').on('click','.tag-list a',function(){
        var $this=$(this);
        $this.addClass('active').siblings('a').removeClass('active');
        var id=$this.data('id');
        var tag=$this.parents('.goods-item').find('.goods-tag');
        tag.removeClass('bg-green');
        switch (id){
            case 1:tag.hide();break;
            case 2:tag.show().removeClass('hot_tag sale_tag new_tag').addClass('limit_tag');break;
            case 3:tag.show().removeClass('limit_tag sale_tag new_tag').addClass('hot_tag');break;
            case 4:tag.show().removeClass('hot_tag limit_tag new_tag').addClass('sale_tag');break;
            case 5:tag.show().removeClass('hot_tag sale_tag limit_tag').addClass('new_tag');break;
        }
    });

    //商品添加-计价方式单位换算
    $('body').on('click','.goodsUnitList a',function(){
        var $this=$(this);
        var n=$this.data('id');
        unitChangeShow($this,n,storage_unit_id);
        if(n!=storage_unit_id){
            $this.parents('.item-unit').siblings('.unit-change').find('.unit-change-show').text(storage_unit);
        }
    });

    //商品添加-计价方式显示为库存单位
    $('body').on('click','.storage-unit-list a',function(){
        var $this=$(this);
        storage_unit_id=$this.data('id');
        storage_unit=$this.text();
        var p=$this.parents('.add-edit-item');
        p.find('.unit-change').addClass('hidden').find('.charge-unit-num').val(1).siblings('.unit-change-show').text(storage_unit);
        p.find('.charge-unit').attr({'data-id':storage_unit_id}).text(storage_unit);
    });

    //商品添加-新增计价方式
        $('body').on('click','.addNewCharge',function(){
            var $this=$(this);
            defalutChangeUnit(storage_unit_id);
            var parent=add_goods_box;
            var max_charge_num=parent.find('.add-charge-list').find('.item').length;
            if(max_charge_num<20){
                $.getItem('/static/items/admin/chargetype-item.html',function(data){
                    var $item=$(data);
                    $item.find('.charge-unit').attr('data-id',storage_unit_id).text(storage_unit);
                    parent.find('.add-charge-list').append($item);
                });
            }
            else Tip('最多只能添加20个计价方式！');
        });

    //商品添加-恢复默认图
    $('.add-recover-img').on('click',function(){
        $(this).parents('.upload-img').find('.imgPreview').attr({'data-key':'','src':'/static/design_img/'+default_code+'.png'});
    });

    //商品添加-删除计价方式
    $('.add-delete-charge').eq(0).hide();
    $('body').on('click','.add-delete-charge',function(){$(this).parents('li').remove()});

    //***商品编辑***
    //商品编辑框显示/收起
    $('.edit-goods-info').on('click',function(){
        var $this=$(this);
        var parent=$this.parents('.goods-list-item');
        parent.find('.goods-item-show').addClass('hidden').siblings('.goods-item-edit').removeClass('hidden');
        parent.siblings('.goods-list-item').find('.goods-item-show').removeClass('hidden').siblings('.goods-item-edit').addClass('hidden');
        parent.find('.upload-box').append(' <input type="file" name="file_upload" class="uploadImg" id="edit_upload"/><p>上传/修改图片</p>');
        parent.siblings('.goods-list-item').find('.upload-box').empty();
        var edit_item=parent.find('#edit_upload');
        //商品编辑-图片上传
        var key='';
        var token='';
        var fruit_id=parent.data('id');
        var link_action=parent.data('type');
        edit_item.uploadifive(
            {
                buttonText    : '',
                width: '150px',
                uploadScript  : 'http://upload.qiniu.com/',
                multi    :     false,
                'auto':true,
                fileSizeLimit   : '10MB',
                'fileObjName' : 'file',
                'removeCompleted' : true,
                'queueSizeLimit':999,
                'fileType':'*.gif;*.png;*.jpg;*.jpeg;*.svg;*.JPG;*.JPEG;*.PNG;*.GIF;*.bmp;*.BMP;',
                'onAddQueueItem' : function(file){
                    var fileName = file.name;
                    var ext = fileName.substring(fileName.lastIndexOf(".")+1,fileName.length);
                    switch (ext) {
                        case 'jpg':
                        case 'JPG':
                        case 'jpeg':
                        case 'JPEG':
                        case 'png':
                        case 'PNG':
                        case 'bmp':
                        case 'BMP':
                        case 'svg':
                            break;
                        default:
                            Tip("无效的文件格式！图片支持格式:png,jpg,jpeg,bmp,svg");
                            $(this).uploadifive('cancel', file);
                            break;
                    }
                },
                'formData':{
                    'key':'',
                    'token':''
                },
                'onFallback':function(){
                    return Tip('您的浏览器不支持此插件！建议使用谷歌浏览器！');
                },
                'onUpload' :function(){
                    var action;
                    var url="";
                    if(link_action=='fruit') action="edit_fruit_img";
                    else if(link_action=='menu') action="edit_mgoods_img";
                    var args={action: action,id:fruit_id};
                    $.ajaxSetup({
                        async : false
                    });
                    $.postJson(url,args,
                        function (res) {
                            key=res.key;
                            token=res.token;
                        },
                        function(){
                            Tip('网络好像不给力呢~ ( >O< ) ~！');}
                    );
                    $(this).data('uploadifive').settings.formData = {
                        'key':key,
                        'token':token
                    };
                },
                'onError' : function(file, fileType, data) {
                    Tip('The file ' + file.name + ' could not be uploaded: ' + data);
                },
                'onUploadComplete':function(){
                    $(this).parents('.upload-img').find('.imgPreview').attr({'src':'http://7rf3aw.com2.z0.glb.qiniucdn.com/'+key+'?imageView2/1/w/100/h/100','data-key':key});
                }

            });

    });
    $('.edit-goods-concel').on('click',function(){$(this).parents('.goods-list-item').find('.goods-item-edit').addClass('hidden').siblings('.goods-item-show').removeClass('hidden');});
    //商品信息编辑
    $('.edit-goods-sure').on('click',function(){
        var $this=$(this);
        var parent=$this.parents('.goods-item');
        var menu_type=parent.data('type');
        if(menu_type=='fruit'){
            addEditFruit($this,'edit_fruit')
        }
        else if (menu_type == 'menu'){
            addEditFruit($this,'edit_mgoods')
        }
    });
    //商品编辑-单位换算显示
    $('.charge-unit').each(function(){
        var $this=$(this);
        var sto_unit=$this.parents('.goods-item-edit').find('.storage-unit').data('id');
        var n=$this.data('id');
        unitChangeShow($this,n,sto_unit);
    });
    //商品编辑-新增计价方式
    $('.editNewCharge').on('click',function(){
        var $this=$(this);
        var parent=$this.parents('.goods-item-edit');
        var add_charge_box=$('.add-new-charge-box');
        add_charge_box.find('.unit-change').addClass('hidden');
        storage_unit_id=Int(parent.find('.storage-unit').data('id'));
        storage_unit=parent.find('.storage-unit').text();
        var max_charge_num=parent.find('.add-charge-list').find('.edit-charge-list').length;
        if(max_charge_num<20)  add_charge_box.modal('show').load('/static/items/admin/add-new-chargetype.html');
        else Tip('最多只能添加20个计价方式！');
        add_charge_box.find('.charge-unit').attr({'data-id':storage_unit_id}).text(storage_unit);
        add_charge_box.find('.unit-change-show').text(storage_unit);
        item_fruit_id=$this.parents('.goods-list-item').data('id');

    });
    $('body').on('click','.editAddNewCharge',function(){addEditCharge($(this),item_fruit_id,'add_charge_type','.add-new-charge-box');});
    //商品编辑-编辑计价方式
    $('.edit-charge-show').on('click',function(){
        var $this=$(this);
        var parent=$this.parents('.edit-charge-list');
        var parent2=$this.parents('.goods-item-edit');
        var edit_charge_box=$('.edit-charge-box');
        charge_type_id=parent.data('id');
        edit_price=parseFloat(parent.find('.edit_price').text());
        edit_num=parseFloat(parent.find('.edit_num').text());
        edit_unit_id=parseFloat(parent.find('.edit_unit').attr('data-id'));
        edit_unit_num=parseFloat(parent.find('.edit_unit_num').text());
        storage_unit=parent2.find('.storage-unit').text();
        storage_unit_id=Int(parent2.find('.storage-unit').data('id'));
        change_num=edit_unit_num;
        popUnitChangeShow(edit_charge_box,edit_unit_id,storage_unit_id);
        edit_charge_box.empty();

        $.getItem('/static/items/admin/edit-chargetype.html',function(data) {
            var $item = $(data);
            $item.find('.charge-price').val(edit_price);
            $item.find('.charge-num').val(edit_num);
            $item.find('.charge-unit').attr({'data-id': edit_unit_id});
            unitText($item.find('.charge-unit'), edit_unit_id);
            $item.find('.charge-unit-num').val(edit_unit_num);
            $item.find('.unit-change-show').text(storage_unit);
            if (edit_unit_id !== storage_unit_id) $item.find('.unit-change').removeClass('hidden');
            edit_charge_box.append($item).modal('show');

        });
    });

    $('body').on('click','.edit-charge-type',function(){addEditCharge($(this),charge_type_id,'edit_charge_type','.edit-charge-box')});

    //商品编辑-删除计价方式
    $('.delete-charge-type').on('click',function(){
        var $this=$(this);
        var max_num=$this.parents('.add-charge-list').find('li').length;
        if(max_num<2){return Tip('至少要有一种计价方式！')}
        else deleteCharge($this,$this.parents('.edit-charge-list').data('id'));
    });

    //商品编辑-恢复默认图
    $('.edit-recover-img').on('click',function(){
        var $this=$(this);
        var parent=$this.parents('.goods-item');
        var code=parent.find('.imgPreview').data('code');
        var id=parent.data('id');
        defaultImg($this,id,code);
    });
});
var item_fruit_id;
var fruit_type_id= $.getUrlParam('id');
var edit_price;
var edit_num;
var edit_unit_id;
var edit_unit_num;
var change_num;
var storage_unit_id;
var storage_unit;
var charge_type_id;
var regNumber=/^[0-9]*[1-9][0-9]*$/;
var regFloat=/^[0-9]+([.]{1}[0-9]{1,2})?$/;
var add_goods_box=$('.add-new-goods-box');
var upload_item;
var default_code;

function addEditType(target,action){
    var url='';
    var action=action;
    var box=target.parents('.add-goodsType-box');
    var name=box.find('#type-name').val();
    //var intro=add_box.find('#type-intro').val();
    if(!name){return Tip('请输入分类名称！')}
    if(name.length>5){return Tip('请输不要超过5个字！')}
    //if(intro.length>60){return Tip('请输不要超过60个字！')}
    var args;
    var data;
    var id;
    if(action=='add_menu'){
        data={
            name:name
        };
        args={
            action:action,
            data:data

        };
    }
    else if(action=='edit_menu_name'){
        id=box.attr('data-id');
        args={
            action:action,
            data:name,
            id:id

        };
    }
    $.postJson(url,args,
        function(res){
            if(res.success){
                if(action=='add_menu'){
                    window.location.reload();
                }
                else if(action=='edit_menu_name'){
                    var index=box.attr('data-index');
                    $('.classify-nav').find('li').eq(index).find('a').text(name);
                }
                box.modal('hide');

            }
            else return Tip(res.error_text);
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~')});
}

function defalutChangeUnit(id){
    if(!id){
        storage_unit_id=1;
        storage_unit='个';
    }
}

function unitText(target,n){
    switch (n){
        case 1:target.text('个');break;
        case 2:target.text('斤');break;
        case 3:target.text('份');break;
        case 4:target.text('kg');break;
        case 5:target.text('克');break;
        case 6:target.text('升');break;
        case 7:target.text('箱');break;
        case 8:target.text('盒');break;
        case 9:target.text('件');break;
        case 10:target.text('筐');break;
        case 11:target.text('包');break;
    }
}

function unitChangeShow(target,id,unit_id){
    var unit_change=target.parents('.item-unit').siblings('.unit-change');
    if(id!=unit_id)
    {
        unit_change.removeClass('hidden');
    }
    else {
        unit_change.addClass('hidden');
    }
}

function popUnitChangeShow(target,id,unit_id){
    if(id!=unit_id){
        target.find('.unit-change').removeClass('hidden');
    }
    else {
        target.find('.unit-change').addClass('hidden');
    }
}

function addEditFruit(target,action){
    var url='';
    var action=action;
    var name=target.parents('.add-edit-item').find('.goodsName').val();
    var saled=parseFloat(target.parents('.add-edit-item').find('.goodsSale').val());
    var storage=parseFloat(target.parents('.add-edit-item').find('.goodsStorage').val());
    var unit=Int(target.parents('.add-edit-item').find('.goodsUnit').attr('data-id'));
    var tag=target.parents('.add-edit-item').find('.tag-list').find('.active').data('id');
    var img_url=target.parents('.add-edit-item').find('.imgPreview').attr('data-key');
    var intro=target.parents('.add-edit-item').find('.goodsIntro').val();
    var priority=Int(target.parents('.add-edit-item').find('.goodsPriority').val());
    var fruit_item_id=Int(target.parents('.goods-list-item').data('id'));
    var charge_types=[];
    var charge_item=target.parents('.add-edit-item').find('.add-goods-charge-list').children('li');
    var price;
    var num;
    var units;
    var unit_num;
    for(var i=0;i<charge_item.length;i++)
        {
            price=charge_item.eq(i).find('.charge-price').val();
            num=charge_item.eq(i).find('.charge-num').val();
            units=charge_item.eq(i).find('.charge-unit').attr('data-id');
            unit_num=charge_item.eq(i).find('.charge-unit-num').val();
            if(!unit_num){unit_num=1}
            var charge= {
                'price' :price,
                'num':num,
                'unit':units,
                'unit_num':unit_num
            };
            charge_types.push(charge);
        }
    if(!saled){saled=0;}
    if(!storage){storage=0}
    if(!tag){tag=1}
    if(!priority){priority=5}
    if(!intro){intro='';}
    if(!name){return Tip('请输入商品名称！');}
    if(saled!=0&&!regFloat.test(saled)){return Tip('销量只能为数字，最多为小数点后两位！');}
    if(storage!=0&&!regFloat.test(storage)){return Tip('库存只能为数字，最多为小数点后两位！');}
    if(!regNumber.test(priority)){return Tip('优先级只能为整数！');}
    if(priority<1||priority>10){return Tip('优先级只能为1-10！');}
    if(intro.length>100) {return Tip('商品简介请不要超过100个字！');}
    if(name.length>12) {return Tip('商品名称请不要超过12个字！');}
    var data={
        //fruit_type_id:parseInt(fruit_type_id),
        name:name,
        saled:saled,
        storage:storage,
        unit:unit,
        tag:tag,
        img_url:img_url,
        intro:intro,
        priority:priority
    };
    if(action=='add_fruit'){
        data.fruit_type_id=Int(fruit_type_id)
    }
    else if(action=='add_mgoods'){
        data.menu_id=Int(fruit_type_id)
    }
    var args;
    if(action=='add_fruit'||action=='add_mgoods'){
        if(!price||!num){return Tip('请至少完整填写一种计价方式！');}
        if(!regFloat.test(price)){return Tip('价格只能为数字，最多为小数点后两位！');}
        if(!regFloat.test(num)){return Tip('数量只能为数字，最多为小数点后两位！');}
        if(!unit_num) unit_num=1;
        if(!regFloat.test(unit_num)){return Tip('计价方式换算单位只能为数字，最多为小数点后两位！');}
        if(!img_url){data.img_url=''}
        data.charge_types=charge_types;
        args={
            action:action,
            data:data
        };
    }
    if(action=='edit_fruit'||action=='edit_mgoods'){
        args={
            action:action,
            data:data,
            id:fruit_item_id
        };
    }
    $.postJson(url,args,
        function(res){
            if(res.success){
                add_goods_box.modal('hide');
                window.location.reload();
            }
            else return Tip(res.error_text);
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~')});
}

function editActive(id,target){
    var url='';
    var data={};
    var parent=target.parents('.goods-item');
    var menu_type=parent.data('type');
    var action;
    if(menu_type=='fruit'){
        action='edit_active'
    }
    else if (menu_type == 'menu'){
        action='edit_m_active'
    }
    var args={
        action:action,
        data:data,
        id:id //fruit_id||mgoods_id

    };
    $.postJson(url,args,
        function(res){
            if(res.success){

            }
            else return Tip(res.error_text);
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~')});
}

function addEditCharge(target,id,action,item){
    var url='';
    var action=action;
    var charge_item=target.parents(item).find('.add-goods-charge-list');
    var price=parseFloat(charge_item.find('.charge-price').val());
    var num=parseFloat(charge_item.find('.charge-num').val());
    var units=Int(charge_item.find('.charge-unit').attr('data-id'));
    var unit_num=parseFloat(charge_item.find('.charge-unit-num').val());
    if(!price||!num) {return Tip('请输入计价方式！')}
    if(!regFloat.test(price)){return Tip('价格只能为数字，最多为小数点后两位！');}
    if(!unit_num){unit_num=1}
    if(!regFloat.test(num)){return Tip('数量只能为数字，最多为小数点后两位！');}
    if(!regFloat.test(unit_num)){return Tip('单位换算数量只能为数字，最多为小数点后两位！');}
    var data={
            price:price,
            unit:units,
            num:num,
            unit_num:unit_num
        };
    var args;
    var menu_type= $.getUrlParam('action');
    if(action=='add_charge_type'){
        if(menu_type=='menu'){action='add_mcharge_type'}
        args={
        action:action,
        data:data,
        id:id  //fruit_id 或 mgoods_id
        };
    }
    else if(action=='edit_charge_type'){
        if(menu_type=='menu'){action='edit_mcharge_type'}
        args={
        action:action,
        data:data,
        charge_type_id:id
        };
    }
    $.postJson(url,args,
        function(res){
            if(res.success){
                $('.add-new-charge-box').modal('hide');
                $('.edit-charge-box').modal('hide');
                window.location.reload();
            }
            else return Tip(res.error_text);
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~')});
}

function deleteCharge(target,id){
    var url='';
    var action='del_charge_type';
    if($.getUrlParam('action')=='menu'){action='del_mcharge_type'}
    var data={};
    var args={
        action:action,
        data:data,
        charge_type_id:id
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                target.parents('.edit-charge-list').remove();
            }
            else return Tip(res.error_text);
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~')});
}

function defaultImg(target,id,code){
    var url='';
    var action;
    var parent=target.parents('.goods-item');
    var link=parent.data('type');
    if(link=='fruit'){action='default_fruit_img'}
    else if(link=='menu'){action='default_mgoods_img'}
    var data={};
    var args={
        action:action,
        data:data,
        id:id
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                if(typeof(code)=='undefined')
                {
                    target.parents('.upload-img').find('.imgPreview').attr({'src':'/static/design_img/TDSG.png','data-key':''});
                }
                else target.parents('.upload-img').find('.imgPreview').attr({'src':'/static/design_img/'+code+'.png','data-key':''});
            }
            else return Tip(res.error_text);
        },
        function(){Tip('网络好像不给力呢~ ( >O< ) ~')});
}
