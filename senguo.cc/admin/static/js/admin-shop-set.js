$(document).ready(function(){

    //店铺设置导航栏链接
    $('#deliverySet').on('click',function() {window.location.href = shopUrl + "?action=delivery";});
    $('#noticeSet').on('click',function() {window.location.href = shopUrl + "?action=notice";});
    $('#receiptSet').on('click',function() {window.location.href = shopUrl + "?action=receipt";});


    $('.add-new-address1').on('click',function(){
        var item='<tr class="add-address-item"><td class="mode action-mode  col-lg-1"><a class="work-mode" href="javascript:;">已启用</a><a class="stop-mode" href="javascript:;" style="display:none;">未启用</a></td><td class="btn-box"><input type="text" class="address1-value pull-left address-input-box"/><a href="javascript:;" class="address-btn bg-green pull-left address1-sure-btn"></a><a href="javascript:;" class="address-btn bg-grey pull-left address1-cancel-btn"></a></td><td class="col-lg-6"><a href="javascript:;" class="text-green add-address2-btn">+新建二级配送地址</a><ul class="add-address2-list"><li class="btn-box"><input type="text" class="address2-value pull-left address-input-box"/><a href="javascript:;" class="address-btn bg-green pull-left address2-sure-btn">确定</a><a href="javascript:;" class="address-btn bg-grey pull-left address2-cancel-btn">取消</a></li></ul></td></tr>';
        $('.add-address-box').append(item);
    });

    $('body').on('click','.add-address-item .action-mode a',function(){
        var id=$(this).parents('.add-address-item').find('.address1-value').data("id");
        editAddres1Status($(this),id);
    });

    $('body').on('click','.add-address2-btn',function(){
        var item=' <li class="btn-box"><input type="text" class="address2-value pull-left address-input-box"/><a href="javascript:;" class="address-btn bg-green pull-left address2-sure-btn">确定</a><a href="javascript:;" class="address-btn bg-grey pull-left address2-cancel-btn">取消</a></li>';
        $(this).siblings('.add-address2-list').append(item);
    });
    $('body').on('click', '.address1-sure-btn', function(){address1Edit($(this));});
    $('body').on('click', '.address1-cancel-btn', function(){$(this).parents('tr').remove();});
    $('body').on('click', '.address2-sure-btn', function(){address2Edit($(this))});
    $('body').on('click', '.address2-cancel-btn', function(){$(this).parents('li').remove();});

    $('.set-list-item .action-mode a').each(function(){
        $(this).on('click',function(){
            var id=$(this).parents('.set-list-item').data("id");
            editAddres1Status($(this),id);
        });
    });

    $('.set-list-item .action-mode').each(function(){
        var status=$(this).data('status');
        if(status=='True')
            $(this).find('.work-mode').show();
        else if(status=='False')
            $(this).find('.stop-mode').show();

    });
});

var shopUrl =$('#shopPage').attr('data-url');

function address1Edit(target){
    var url=shopUrl;
    var data=target.siblings('.address1-value').val().trim();
    var action="add_addr1";
    if(!data) return alert('地址不能为空！');
    var args={
        action:action,
        data:data
    };
    $.ajaxSetup({async:false});
    $.postJson(url,args,
        function(res){
            if(res.success){
                target.parents('.add-address-item').find('.address1-value').attr({"data-id":res.address1_id});
                alert('一级地址添加成功');
            }
        })
}

function address2Edit(target){
    var address1_id=target.parents('.add-address-item').find('.address1-value').data("id");
    var url="/admin/config/"+address1_id;
    var data=target.siblings('.address2-value').val().trim();
    var action="add_addr2";
    if(!address1_id) return alert('请先确认添加一级地址！');
    if(!data) return alert('地址不能为空！');
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){

                alert('二级级地址添加成功');
            }
        })
}

function editAddres1Status(target,id){
    var url="/admin/config/"+id;
    var action="edit_addr1_active";
    var data="";
    if(!id) return alert('请先确认添加一级地址！');
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,
        function(res){
            if(res.success){
                worMode(target);
                alert('状态修改成功');
            }
        })
}