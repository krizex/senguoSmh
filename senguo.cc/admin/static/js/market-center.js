$(document).ready(function(){
    var sex_id=$('.user-sex').data('id');
    sex($('.user-sex'),sex_id);
    $('body').on('click','.address-manage',function(e){
        var $this=$(this);
        console.log('222');
        var forbid_click=$this.find('.forbid_click');
        if(!forbid_click.is(e.target) &&forbid_click.has(e.target).length === 0){
            console.log('333');
            $this.addClass('avilible_box');
            $('.address-list').show();
            //$('.add-address').toggle();
        }
    });
     $('body').on('click','.avilible_box',function(e){
        var $this=$(this);
        var forbid_click=$this.find('.forbid_click');
        if(!forbid_click.is(e.target) &&forbid_click.has(e.target).length === 0){
            $this.removeClass('avilible_box');
            $('.address-list').hide();
        }
     });
    //收货地址编辑
    $('body').on('click','.edit-address',function(){
        var $this=$(this);
        var parent=$this.parents('.address-item');
        item_id=parent.index();
        name=parent.find('.item_name').text();
        phone=parent.find('.item_phone').text();
        address=parent.find('.item_address').text();
        address_id=$this.parents('.address-item').attr('data-id');
       $('.address-box').modal('show');
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
        var max= $('.address-list').find('.address-item').length;
        if(max<5){
            $('.address-box').modal('show');
            $('.addressAdd').show();
            $('.addressEdit').hide();
        }
       else return alert('最多可添加五个收货地址！');
    });
    $('body').on('click','.addressAdd',function(){
        var $this=$(this);
        addressEdit($this,'add_address');
    });
    //收货地址删除
    $('body').on('click','.delete-address',function(){
        if(confirm('确认删除该收货地址吗？')){
            var $this=$(this);
            var id=$this.parents('.address-item').attr('data-id');
            addressDel($this,id);
        }
    });
});
var name;
var phone;
var address;
var address_id;
var item_id;
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
    var regPhone=/(\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$/;
    if(!name) {return alert('请填写收货人姓名！');}
    if(!phone) {return alert('请填写收货人电话！');}
    if(!regPhone.test(phone)){return alert('请填写正确的手机号！');}
    if(!address) {return alert('请填写收货人地址！');}
    if(name.length>10) {return alert('姓名请不要超过10个字！');}
    if(address.length>50) {return alert('地址请不要超过50个字！');}
    var data={
        receiver:name,
        phone:phone,
        address_text:address
    };
    if(action=='edit_address'){data.address_id=address_id}
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            if(action=='edit_address'){
                var tar=$('.address-item').eq(item_id);
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
            $('.address-box').modal('hide');
        }
        else return alert(res.error_text)
    },function(){return alert('网络错误！')})

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
            target.parents('.address-item').remove();
        }
        else return alert(res.error_text)
    },function(){return alert('网络错误！')})
}
