$(document).ready(function(){
    //一级地址添加设置
    $('.add-new-address1').on('click',function(){
        var item='<tr class="add-address-item"><td class="mode action-mode  col-lg-1"><a class="work-mode" href="javascript:;">已启用</a><a class="stop-mode" href="javascript:;" style="display:none;">未启用</a></td><td class="btn-box"><input type="text" class="address1-value pull-left address-input-box"/><a href="javascript:;" class="address-btn bg-green pull-left address1-sure-btn"></a><a href="javascript:;" class="address-btn bg-grey pull-left address1-cancel-btn"></a></td><td class="col-lg-6"><a href="javascript:;" class="text-green add-address2-btn">+新建二级配送地址</a><ul class="add-address2-list"><li class="btn-box"><input type="text" class="address2-value pull-left address-input-box"/><a href="javascript:;" class="address-btn bg-green pull-left address2-sure-btn">确定</a><a href="javascript:;" class="address-btn bg-grey pull-left address2-cancel-btn">取消</a></li></ul></td></tr>';
        $('.add-address-box').append(item);
    });
    $('body').on('click', '.address1-sure-btn', function(){address1Edit($(this));});
    $('body').on('click', '.address1-cancel-btn', function(){$(this).parents('tr').remove();});

    //一级地址启用
    $('.set-list-item .action-mode a').each(function(){
        $(this).on('click',function(){
            var id=$(this).parents('.set-list-item').data("id");
            editAddres1Status($(this),id);
        });
    });

    $('body').on('click','.add-address-item .action-mode a',function(){
        var id=$(this).parents('.add-address-item').find('.address1-value').data("id");
        editAddres1Status($(this),id);
    });

    //二级地址添加设置
    $('body').on('click','.add-address2-btn',function(){
        var item='<li class="btn-box"><input type="text" class="address2-value pull-left address-input-box"/><a href="javascript:;" class="address-btn bg-green pull-left address2-sure-btn">确定</a><a href="javascript:;" class="address-btn bg-grey pull-left address2-cancel-btn">取消</a></li>';
        $(this).siblings('.add-address2-list').append(item);
    });
    $('body').on('click', '.address2-sure-btn', function(){
        var $this=$(this);
        var id=$this.parents('.add-address-item').find('.address1-value').data("id");
        var data=$this.siblings('.address2-value').val().trim();
        address2Edit(id,data);
    });
    $('body').on('click', '.address2-cancel-btn', function(){$(this).parents('li').remove();});

    $('.list-add-address2-btn').on('click',function(){
        var item=' <li class="btn-box"><input type="text" class="list-address2-value pull-left address-input-box"/><a href="javascript:;" class="address-btn bg-green pull-left list-address2-sure-btn">确定</a><a href="javascript:;" class="address-btn bg-grey pull-left list-address2-cancel-btn">取消</a></li>';
        $(this).siblings('.add-address2-list').append(item);
    });
    $('body').on('click', '.list-address2-sure-btn', function(){
        var $this=$(this);
        var id=$this.parents('.set-list-item').find('.addres1-box').data("id");
        var data=$this.siblings('.list-address2-value').val().trim();
        address2Edit(id,data);
        $('.addres2-active-box').prepend('<li class="bg-grey text-white">'+data+'</li>');
        $this.parents('li').remove();
    });
    $('body').on('click', '.list-address2-cancel-btn', function(){$(this).parents('li').remove();});

    //二级地址停用
    $('.addres2-active-box li').on('click',function(){
        var $this=$(this);
        var id=$this.data('id');
        var address=$this.text();
        editAddres2Status($this,id);
        $this.remove();
        $('.addres2-unactive-box').prepend('<li class="bg-grey text-white" data-id='+id+'>'+address+'</li>');
    });

    //二级地址停启用
    $('.addres2-unactive-box li').on('click',function(){
        var $this=$(this);
        var id=$this.data('id');
        var address=$this.text();
        editAddres2Status($this,id);
        $this.remove();
        $this.parents('.address-edit').find('.addres2-active-box').prepend('<li class="bg-green text-white" data-id='+id+'>'+address+'</li>');
    });
});

function address1Edit(target){
    var url=link;
    var data=target.siblings('.address1-value').val().trim();
    var action="add_addr1";
    if(!data) return Tip('地址不能为空！');
    var args={
        action:action,
        data:data
    };
    $.ajaxSetup({async:false});
    $.postJson(url,args,
        function(res){
            if(res.success){
                target.parents('.add-address-item').find('.address1-value').attr({"data-id":res.address1_id});
                Tip('一级地址添加成功');
            }
        })
}

function address2Edit(id,data){
    var address1_id=id;
    var url=link;
    var data={
     name:data,
     addr1_id:address1_id
    };
    var action="add_addr2";
    if(!address1_id) return Tip('请先确认添加一级地址！');
    if(!data) return Tip('地址不能为空！');
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                Tip('二级级地址添加成功');
            }
        })
}

function editAddres1Status(target,id){
    var url=link;
    var action="edit_addr1_active";
    var data={addr1_id:id};
    if(!id) return Tip('请先确认添加一级地址！');
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                worMode(target);
                Tip('状态修改成功');
            }
        })
}

function editAddres2Status(target,id){
    var url=link;
    var action="edit_addr2_active";
    var data={addr2_id:id};
    if(!id) return Tip('请先确认添加一级地址！');
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                worMode(target);
                Tip('状态修改成功');
            }
        })
}