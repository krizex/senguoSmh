$(document).ready(function(){
    //导航acitve样式
    var link_id= $.getUrlParam('id');
    var link_action= $.getUrlParam('action');
    if(link_id==1000) $('.dry_active').addClass('active').siblings('li').removeClass('active');
    $('.menu_active').each(function(){
        var $this=$(this);
        var name=$this.data('id');
        if(name==link_id&&link_action=='menu')
        $this.addClass('active');
    });
    $('.tag-list a').on('click',function(){$(this).addClass('active').siblings('a').removeClass('active')});

    //添加新的商品分类
    $('#add-new-goodsType').on('click',function(){
        var max_type_num=$('.goods-classify').find('.item').length;
        if(max_type_num<5) $('.add-goodsType-box').modal('show');
        else return alert('最多可添加5个商品分类！');
    });
    $('#add-goodsType-sure').on('click',function(){addGoodsType($(this))});

    //商品编辑框显示/收起
    $('.edit-goods-info').on('click',function(){$(this).parents('.goods-list-item').find('.goods-item-show').addClass('hidden').siblings('.goods-item-edit').removeClass('hidden');});
    $('.edit-goods-concel').on('click',function(){$(this).parents('.goods-list-item').find('.goods-item-edit').addClass('hidden').siblings('.goods-item-show').removeClass('hidden');});

    //商品标签显示
    $('.all-fruit-type a').each(function(){
        var id=$(this).data('id');
        if(id==fruit_type_id){$(this).addClass('bg-pink')}
    });

    //商品单位切换显示
    $('body').on('click','.unitlist li',function(){
        var unit_id=$(this).find('a').data('id');
        var unit=$(this).find('a').text();
        $(this).parents('.item-unit').find('.unitContent').attr({'data-id':unit_id}).text(unit);
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
            case 2:$this.text('SALE').addClass('bg-orange');break;
            case 3:$this.text('HOT').addClass('bg-red');break;
            case 4:$this.text('SALE').addClass('bg-pink');break;
            case 5:$this.text('NEW').addClass('bg-green');break;
        }
    });

    //商品标签显示
    $('.goods-item-edit').find('.tag-list').each(function(){
        var $this=$(this);
        var n=$this.data('id');
        for(var i=1;i<=n;i++)
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
    $('.goods-edit-active').each(function(){
        var $this=$(this);
        $this.find('span').on('click',function(){
            var fruit_id=$this.parents('.goods-list-item').data('id');
            editActive(fruit_id);
            $this.hide().siblings().show();
        });
    });

    //***商品添加***
    $('.add-new-goods').on('click',function(){
        var max_goods_num=$('.goods-list').find('.goods-list-item').length;
        if(max_goods_num<5){
            add_goods_box.modal('show').load('/static/items/admin/add-new-goods.html?v=20150112').find('.unit-change').addClass('hidden');
        }
        else alert('该分类下最多可添加5种水果！如仍需添加请选择其他分类！');
        defalutChangeUnit(storage_unit_id);

     });
    $('body').on('click','.add-goods-sure',function(){
        var $this=$(this);
        var menu_type= $.getUrlParam('action');
        if(menu_type=='fruit'){
            addEditFruit($this,'add_fruit')
        }
        else if (menu_type == 'menu'){
            addEditFruit($this,'add_mgoods')
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
            case 2:tag.show().text('SALE').css({'background-color':'#e07d14'});break;
            case 3:tag.show().text('HOT').css({'background-color':'#e01445'});break;
            case 4:tag.show().text('SALE').css({'background-color':'#ff6563'});break;
            case 5:tag.show().text('NEW').css({'background-color':'#44b549'});break;
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
            if(max_charge_num<5){
                $.getItem('/static/items/admin/chargetype-item.html',function(data){
                    var $item=$(data);
                    $item.find('.charge-unit').data('id',storage_unit_id).text(storage_unit);
                    parent.find('.add-charge-list').append($item);
                });
            }
            else alert('最多只能添加5个计价方式！');
        });

    //商品添加-恢复默认图
    $('.add-recover-img').on('click',function(){
        $(this).parents('.upload-img').find('.imgPreview').attr({'data-key':'','src':'/static/design_img/TDSG.png'});
    });

    //商品添加-删除计价方式
    $('.add-delete-charge').eq(0).hide();
    $('body').on('click','.add-delete-charge',function(){$(this).parents('li').remove()});


    //***商品编辑***
    $('.edit-goods-sure').each(function(){
        var $this=$(this);
        $this.on('click',function(){
        var menu_type= $.getUrlParam('action');
        if(menu_type=='fruit'){
            addEditFruit($this,'edit_fruit')
        }
        else if (menu_type == 'menu'){
            addEditFruit($this,'edit_mgoods')
        }
        })
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
        if(max_charge_num<5)  add_charge_box.modal('show').load('/static/items/admin/add-new-chargetype.html');
        else alert('最多只能添加5个计价方式！');
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
        edit_num=Int(parent.find('.edit_num').text());
        edit_unit_id=Int(parent.find('.edit_unit').attr('data-id'));
        edit_unit_num=parseFloat(parent.find('.edit_unit_num').text());
        storage_unit=parent2.find('.storage-unit').text();
        storage_unit_id=Int(parent2.find('.storage-unit').data('id'));
        console.log(storage_unit_id);
        change_num=edit_unit_num;
        popUnitChangeShow(edit_charge_box,edit_unit_id,storage_unit_id);
        edit_charge_box.empty();

        $.getItem('/static/items/admin/edit-chargetype.html',function(data){
            var $item=$(data);
            $item.find('.charge-price').val(edit_price);
            $item.find('.charge-num').val(edit_num);
            $item.find('.charge-unit').attr({'data-id':edit_unit_id});
            unitText($item.find('.charge-unit'),edit_unit_id);
            $item.find('.charge-unit-num').val(edit_unit_num);
            $item.find('.unit-change-show').text(storage_unit);
            if(edit_unit_id!==storage_unit_id) $item.find('.unit-change').removeClass('hidden');
            else $item.find('.unit-change').addClass('hidden');
            upload_item=$item.find('#file_upload');
            edit_charge_box.append($item).modal('show');
            console.log(upload_item+'222222');
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
                    'fileType':'*.gif;*.png;*.jpg;*,jpeg',
                    'formData':{
                        'key':'',
                        'token':''
                    },
                    'onUpload' :function(){
                        console.log(22222);
                        $.ajaxSetup({
                            async : false
                        });
                        var action="add_img";
                        var url="/admin/shelf";
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
                        $(this).parents('.upload-img').find('.imgPreview').attr({'src':'http://shopimg.qiniudn.com/'+key+'?imageView/1/w/100/h/100','data-key':key});
                    }

                });
        });

    });

    $('body').on('click','.edit-charge-type',function(){addEditCharge($(this),charge_type_id,'edit_charge_type','.edit-charge-box')});

    //商品编辑-删除计价方式
    $('.delete-charge-type').on('click',function(){
        var $this=$(this);
        var max_num=$this.parents('.add-charge-list').find('li').length;
        if(max_num<2){return alert('至少要有一种计价方式！')}
        else deleteCharge($this,$this.parents('.edit-charge-list').data('id'));
    });

    //商品编辑-恢复默认图
    $('.edit-recover-img').on('click',function(){
        var $this=$(this);
        var code=$this.parents('.upload-img').find('.imgPreview').data('code');
        $this.parents('.upload-img').find('.imgPreview').attr({'src':'/static/design_img/'+code+'.png'});
    });


    var key='';
    var token='';

    //商品编辑-图片上传
   $('.edit_upload').each(function(){
       var $this=$(this);
       var fruit_id=$this.parents('.goods-item').data('id');
       var action="edit_fruit_img";
       var url="/admin/shelf";
       var args={action: action,fruit_id:fruit_id};
       $this.uploadifive(
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
                   $.postJson(url,args,
                       function (res) {
                           key=res.key;
                           token=res.token;
                       },
                       function(){
                           alert('网络错误！');}
                   );
                   $this.data('uploadifive').settings.formData = {
                       'key':key,
                       'token':token
                   };
               },
               'onUploadComplete':function(){
                   $this.parents('.upload-img').find('.imgPreview').attr({'src':'http://shopimg.qiniudn.com/'+key+'?imageView/1/w/100/h/100','data-key':key});
               }

           });
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
var link='/admin/shelf';
var regNumber=/^[0-9]*[1-9][0-9]*$/;
var regFloat=/^[0-9]+([.]{1}[0-9]{1,2})?$/;
var add_goods_box=$('.add-new-goods-box');
var upload_item;

function addGoodsType(target){
    var url=link;
    var action='add_menu';
    var add_box=target.parents('.add-goodsType-box');
    var name=add_box.find('#type-name').val();
    var intro=add_box.find('#type-intro').val();
    if(!name){return alert('请输入分类名称！')}
    if(name.length>5){return alert('请输不要超过5个字！')}
    if(intro.length>60){return alert('请输不要超过60个字！')}
    var data={
        name:name,
        intro:intro
    };
    var args={
        action:action,
        data:data

    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                alert('新分类添加成功！');
                $('.add-goodsType-box').modal('hide');
                window.location.reload();
            }
            else return alert(res.error_text);
        },
        function(){alert('网络错误')});
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
    var url=link;
    var action=action;
    var name=target.parents('.add-edit-item').find('.goodsName').val();
    var saled=Int(target.parents('.add-edit-item').find('.goodsSale').val());
    var storage=Int(target.parents('.add-edit-item').find('.goodsStorage').val());
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
    if(!priority){priority=5}
    if(!intro){intro='';}
    if(!name){return alert('请输入商品名称！');}
    if(saled!=0&&!regNumber.test(saled)){return alert('销量只能为整数！');}
    if(storage!=0&&!regNumber.test(storage)){return alert('库存只能为整数！');}
    if(!regNumber.test(priority)){return alert('优先级只能为整数！');}
    if(priority<1||priority>5){return alert('优先级只能为1-5！');}
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
        if(!price||!num){return alert('请至少完整填写一种计价方式！');}
        if(!regFloat.test(price)){return alert('价格只能为小数，至多为小数点后两位！');}
        if(!regNumber.test(num)){return alert('数量只能为数字！');}
        if(!unit_num) unit_num=1;
        if(!regFloat.test(unit_num)){return alert('计价方式换算单位只能为数字！');}
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
            else return alert(res.error_text);
        },
        function(){alert('网络错误')});
}

function editActive(id){
    var url=link;
    var data={};
    var menu_type= $.getUrlParam('action');
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
            else return alert(res.error_text);
        },
        function(){alert('网络错误')});
}

function addEditCharge(target,id,action,item){
    var url=link;
    var action=action;
    var charge_item=target.parents(item).find('.add-goods-charge-list');
    var price=parseFloat(charge_item.find('.charge-price').val());
    var num=Int(charge_item.find('.charge-num').val());
    var units=Int(charge_item.find('.charge-unit').attr('data-id'));
    var unit_num=parseFloat(charge_item.find('.charge-unit-num').val());
    if(!price||!num) {return alert('请输入计价方式！')}
    if(!regFloat.test(price)){return alert('价格只能为数字，至多为小数点后两位！');}
    if(!unit_num){unit_num=1}
    if(!regNumber.test(num)){return alert('数量只能为数字！');}
    if(!regFloat.test(unit_num)){return alert('单位换算数量只能为数字！');}
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
            else return alert(res.error_text);
        },
        function(){alert('网络错误')});
}

function deleteCharge(target,id){
    var url=link;
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
            else return alert(res.error_text);
        },
        function(){alert('网络错误')});
}