var cur_item = null,_type="edit_address";
$(document).ready(function(){

}).on("click","#new_address",function(){
    if($(".address-lst li").size()>=5){
        return noticeBox("最多只能新建5个地址哦");
    }
    _type = "add_address";
    var name_box=new Modal('address_box');
    name_box.modal('show');
}).on("click","#addressSure",function(){
    addressEdit(_type);
}).on("click",".i-edit",function(){
    cur_item = $(this).closest("li");
    _type = "edit_address";
    $("#address_name").val(cur_item.find('.i-person').html());
    $("#address_phone").val(cur_item.find('.i-phone').html());
    $("#address_address").val(cur_item.find('.i-address').html());
    var name_box=new Modal('address_box');
    name_box.modal('show');
}).on("click",".i-del",function(){
    if(confirm("确定删除此收货地址吗？")){
        addressDel($(this),$(this).attr("data-id"));
    }
}).on("click",".i-check",function(){
    if($(this).hasClass("i-checked")){
        return false;
    }else{
        var id = $(this).attr("data-id");
        addressDefault($(this),id);
    }
});
//地址编辑&添加
function addressEdit(action){
    var url='/customer/'+$("#address_page").attr("data-code");
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
    if(action=='edit_address'){data.address_id=cur_item.find(".i-edit").attr("data-id");}
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            if(action=='edit_address'){
                cur_item.find('.i-person').html(name);
                cur_item.find('.i-phone').html(phone);
                cur_item.find('.i-address').html(address);
            }
            else if(action=='add_address'){
                var $item=$('<li><div class="address-row"><span class="c333 icon-left i-person">'+name+'</span><span class="c333 icon-left i-phone">'+phone+'</span></div>'+
                    '<div class="address-row"><p class="icon-left i-address f12 c666">'+address+'</p></div>'+
                    '<div class="address-row line-top"><div class="fr">'+
                        '<span class="c666 f12 icon-left i-edit" data-id="'+res.address_id+'">编辑</span>'+
                        '<span class="c666 f12 icon-left i-del ml10" data-id="'+res.address_id+'">删除</span>'+
                    '</div><span class="c666 icon-left i-check f12" data-id="'+res.address_id+'">默认地址</span></div></li>');
                $('.address-lst').prepend($item);
            }
            $(".modal-body").find("input").val("");
            var address_box=new Modal('address_box');
            address_box.modal('hide');
        }
        else return noticeBox(res.error_text)
    },function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')})

}
function addressDefault(target,id){
    var url='/customer/'+$("#address_page").attr("data-code");
    var action='default_address';
    var data={
        address_id:id
    };
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            $(".address-lst").find(".i-check").removeClass("i-checked");
            $(".address-lst li").removeClass("active");
            target.addClass("i-checked");
            target.closest("li").addClass("active");
        }
        else return noticeBox(res.error_text)
    },function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')})
}
function addressDel(target,id){
    var url='/customer/'+$("#address_page").attr("data-code");
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
            target.closest("li").remove();
        }
        else return noticeBox(res.error_text)
    },function(){return noticeBox('网络好像不给力呢~ ( >O< ) ~')})
}