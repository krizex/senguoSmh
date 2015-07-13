/**
 * Created by Administrator on 2015/7/6.
 */
var cur_item = null;
$(document).ready(function(){

}).on("click",".cancel-bbtn",function(){
    $(this).closest(".pop-bwin").addClass("hide");
}).on("click",".ok-bbtn",function(){
    var action = $(this).attr("data-action");
    //infoEdit(action);
}).on("click",".edit_item",function(){
    var action = $(this).attr("data-action");
    cur_item = $(this);
    if(action=="intro"){
        $("#b_title").html("店铺简介");
        $(".shop_area").val($(this).children(".fr").html()).removeClass("hide");
        $(".shop_text").addClass("hide");
    }else{
        if(action=="name"){
            $("#b_title").html("店铺名称");
        }else if(action=="phone"){
            $("#b_title").html("联系电话");
        }else if(action=="code"){
            if($(this).children(".fr").html()=="未设置"){
                $("#b_title").html("店铺号");
            }else{
                Tip("该项当前不能被编辑");
                return false;
            }
        }
        if(action=="code"){
            $(".shop_text").val("").attr("placeholder","店铺号设置后不能再被编辑").removeClass("hide");
        }else{
            if(action=="phone"){
                $(".shop_text").attr("type","tel");
            }
            $(".shop_text").val($(this).children(".fr").html()).removeClass("hide");
        }
        $(".shop_area").addClass("hide");
    }
    $(".ok-bbtn").attr("data-action",action);
    $(".pop-name").removeClass("hide");
    if(action=="intro"){
        $(".shop_area").focus();
    }else{
        $(".shop_text").focus();
    }
});

function infoEdit(action_name){
    var url="/admin/config/shop";
    var action_name=action_name;
    var data={};
    var action,shop_name,shop_intro,shop_city,shop_address_detail,have_offline_entity,address,entity_text,shop_code,shop_phone;
    if(action_name=='name'){
        action='edit_shop_name';
        shop_name= $.trim($('.shop_text').val());
        if(shop_name.length>15){return Tip('店铺名称请不要超过15个字符！')}
        data={shop_name:shop_name};
    }else if(action_name=='code'){
        var reg=/^\w+$/;
        action='edit_shop_code';
        shop_code=$.trim($('.shop_text').val());
        if(!reg.test(shop_code)){return Tip('店铺号只能为字母、数字以及下划线组成！')}
        if(shop_code.length<6){return Tip('店铺号至少为6位数！')}
        data={shop_code:shop_code};
    }else if(action_name=='intro'){
        action='edit_shop_intro';
        shop_intro=$('.shop_area').val();
        if(shop_intro.length>300){return Tip('店铺简介请不要超过300个字符！')}
        data={shop_intro:shop_intro};
    }else if(action_name=='phone'){
        action='edit_phone';
        shop_phone=$('.shop_text').val();
        if(shop_phone.length=0){return Tip('"电话不能为空o(╯□╰)o"')}
        data={shop_phone:shop_phone};
    }else if(action_name=='area'){
        action='edit_deliver_area';
        //data=area_data;
    }else if(action_name=='entity'){
        action='edit_have_offline_entity';
        var entity=$('#offline_entity').attr('data-id');
        if(entity==1) have_offline_entity=1;
        else have_offline_entity=0;
        entity_text=$('#offline_entity').text();
        data={have_offline_entity:have_offline_entity};
    }else if(action_name=='status'){
        action='shop_status';
        var status_item = $(".status-list").children(".active");
        var shop_status=status_item.attr('data-id');
        var status_text=status_item.html();
        data={shop_status:shop_status};
    }else if(action_name=='edit_shop_logo'){
        action = "edit_shop_logo";
        data={img_url:$("#shop_logo").attr("url")};
    }
    var args={
        action:action,
        data:data
    };
    $.postJson(url,args,function(res){
        if(res.success){
            if(action_name=='name'){
                cur_item.children(".fr").html(shop_name);
                $(".pop-name").addClass("hide");
                Tip("店铺名称编辑成功");
            }
            else if(action_name=='code')
            {
                cur_item.children(".fr").html(shop_code);
                cur_item.removeClass("edit_item").addClass("un_edit");
                $("#shop_link").html("http://senguo.cc/"+shop_code);
                $(".pop-code2").addClass("hidden");
                Tip("店铺号编辑成功");
                $("#big-code2").empty();
                new QRCode($("#big-code2")[0],{
                    width : 150,
                    height : 150
                }).makeCode($("#shop_link").html());
            }
            else if(action_name=='intro')
            {
                cur_item.children(".fr").html(shop_intro);
                $(".pop-name").addClass("hide");
                Tip("店铺简介编辑成功");
            }
            else if(action_name=='phone')
            {
                cur_item.children(".fr").html(shop_phone);
                $(".pop-name").addClass("hide");
                Tip("联系电话编辑成功");
            }
            else if(action_name=='area')
            {

            }
            else if(action_name=='entity'){

            }
            else if(action_name=='status'){
                $(".shop_status").html(status_text);
                $(".pop-status").addClass("hide");
                Tip("店铺状态切换成功")
            }else if(action_name=='edit_shop_logo'){
                Tip("店铺logo编辑成功");
            }
        }else{
            Tip(res.error_text);
        }
    });
}