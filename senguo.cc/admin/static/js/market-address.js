$(document).ready(function(){

}).on("click","#new_address",function(){
    $("#name-ipt").val("");
    var name_box=new Modal('nameBox');
    name_box.modal('show');
}).on("click","#addressSure",function(){

});
//地址编辑&添加
function addressEdit(target,action){
    var url='/customer/'+;
    var action=action;
    var name=$('#address_name').val();
    var phone=$('#address_phone').val();
    var address=$('#address_address').val();
    var regPhone=/^(1)\d{10}$/;
    if(!name) {return warnNotice('请填写收货人姓名');}
    if(!phone) {return warnNotice('请填写收货人电话');}
    if(!address) {return warnNotice('请填写收货人地址');}
    if(name.length>10) {return warnNotice('姓名请不要超过10个字');}
    if(address.length>50) {return warnNotice('地址请不要超过50个字');}
    var data={
        receiver:name,
        phone:phone,
        address_text:address
    };
    if(action=='edit_address'){data.address_id=window.dataObj.address_id}
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            if(action=='edit_address'){
                var tar=$('.address-item').eq(window.dataObj.item_id);
                tar.find('.item_name').text(name);
                tar.find('.item_phone').text(phone);
                tar.find('.item_address').text(address);
            }
            else if(action=='add_address'){
                var $item=$('  <li class="address-item list-group-item radius0 clearfix" data-id=""><p class="clearfix m-b0 height20"><span class="pull-left item_name"></span><span class="pull-right item_phone"></span></p><p class="clearfix item_address m-b0 height20"></p><p class="clearfix height20"><a href="javascript:;" class="delete-btn pull-right delete-address"></a><a href="javascript:;" class="edit-btn m-r10 pull-right edit-address"></a></p></li>');
                $item.attr({'data-id':res.address_id});
                $item.find('.item_name').text(name);
                $item.find('.item_phone').text(phone);
                $item.find('.item_address').text(address);
                $('.address-list').append($item);
            }
            var address_box=new Modal('address_box');
            address_box.modal('hide');
        }
        else return noticeBox(res.error_text)
    },function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')})

}
function addressDel(target,id){
    var url='';
    var action='del_address';
    var data={
        address_id:id
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            target.remove();
        }
        else return noticeBox(res.error_text)
    },function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')})
}