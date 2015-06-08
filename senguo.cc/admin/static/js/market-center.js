$(document).ready(function(){
    //if is weixin brower then load wexin api 
     var shop_code=getCookie('market_shop_code');
     var shop_logo=$('#shop_imgurl').attr('data-img');
    if(isWeiXin()){
        wexin('/'+shop_code,shop_logo);
    }
    //user sex
    var sex_id=$('.user-sex').data('id');
    sex($('.user-sex'),sex_id);
    //current_point
   var point=Int($('.current_point').data('point'));
   $('.current_point').text(point);
    //收货地址add
    $(document).on('click','.address-manage',function(e){
        var $this=$(this);
        if($(e.target).closest('.forbid_click').length == 0){
            $('.address-list ').toggle();
            $this.find('.add-address ').toggle();
        }

});
    //收货地址编辑
    $(document).on('click','.edit-address',function(){
        var $this=$(this);
        var parent=$this.parents('.address-item');
        window.dataObj.item_id=parent.index();
        var name=parent.find('.item_name').text();
        var phone=parent.find('.item_phone').text();
        var address=parent.find('.item_address').text();
        window.dataObj.address_id=$this.parents('.address-item').attr('data-id');
        var address_box=new Modal('address_box');
       address_box.modal('show');
       $('.addressAdd').hide();
       $('.addressEdit').show();
       $('#address_name').val(name);
       $('#address_phone').val(phone);
       $('#address_address').val(address);
    });
    $('body').on('click','.addressEdit',function(){
        var $this=$(this);
        addressEdit($this,'edit_address');
    });
    //添加收货地址
    $('body').on('click','.add-address',function(){
        var $this=$(this);
        var max= $('.address-list').find('.address-item').length;
        if(max<5){
            var address_box=new Modal('address_box');
            address_box.modal('show');
            $('.addressAdd').show();
            $('.addressEdit').hide();
        }
       else return noticeBox('最多可添加五个收货地址！',$this);
    });
    $('body').on('click','.addressAdd',function(){
        var $this=$(this);
        addressEdit($this,'add_address');
    });
    //收货地址删除
    $(document).on('click','.delete-address',function(){
        var $this=$(this);
        var parent=$this.parents('.address-item');
        var index=parent.index();
        confirmBox('确认删除该收货地址吗？//(ㄒoㄒ)//',index);
    });
    $(document).on('click','.confriming',function(){
        var $this=$(this);
        var $item=$this.parents('#confirmBox').find('.message');
        var result=$this.attr('data-status');
        var index=$item.attr('data-index');
        if(result=='true'){
            var target=$('.address-item').eq(index);
            var id=target.attr('data-id');
            addressDel(target,id);
        }
        confirmRemove();
    });
}).on('click','.user-balance',function(){
    var status = $(this).attr('data-status');
    var statu = $(this).attr("data-auth");
    if(statu == "False"){
        noticeBox("当前店铺未认证，此功能暂不可用");
        return false;
    }
    if(status==0){
         noticeBox("当前店铺已关闭余额支付，此功能暂不可用");
         return false;
    }
});

function sex(target,id){
    switch(id) {
        case 1:target.addClass('male').text('♂');break;
        case 2:target.addClass('female').text('♀');break;
        case 0:target.addClass('other').text('!');break;
        default :break;
    }
}

function addressEdit(target,action){
    var url='';
    var action=action;
    var name=$('#address_name').val();
    var phone=$('#address_phone').val();
    var address=$('#address_address').val();
    var regPhone=/^(1)\d{10}$/;
    if(!name) {return warnNotice('请填写收货人姓名');}
    if(!phone) {return warnNotice('请填写收货人电话');}
    //if(!regPhone.test(phone)){return warnNotice('请填写正确的手机号');}
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
