/**
 * Created by Administrator on 2015/7/23.
 */
var type = 0,page=0;
$(document).ready(function(){
    $(".wrap-goods-groups").prev(".subnav-box").hide();
    $(".right-title").hide();
    getGoods(parseInt($(".shop_name").attr("data-id")));
}).on("click",".import-type li",function(){
    var index = $(this).index();
    if(index==1){
        return Tip("该功能还在开发中");
    }
    type = index;
    $(".import-type li").removeClass("active").eq(index).addClass("active");
    $(".wrap-tabcont .tab-item").addClass("hidden").eq(index).removeClass("hidden");
}).on("click","#commit",function(){
    if(parseInt($("#choose_txt").html())==0){
        Tip("您还未选中任何商品");
        return false;
    }
    if(type==0){
        importGoods($(this));
    }else{

    }
}).on("click",".shop-list li",function(){
    $(this).toggleClass("active");
    var size = $(".shop-list").children(".active").size();
    $("#choose_txt").html(size);
}).on("click",".prev-page",function(){

}).on("click",".next-page",function(){

}).on("click",".all-choose",function(){
    var checki = $(this).children("i");
    checki.toggleClass("checked-btn");
    var size =  $(".shop-list li").size();
    if(checki.hasClass("checked-btn")){
        $(".shop-list li").addClass("active");
        $("#choose_txt").html(size);
    }else{
        $(".shop-list li").removeClass("active");
        $("#choose_txt").html(0);
    }
}).on("click",".shop_profile_list .item",function(){
    var $this=$(this);
    var id=parseInt($this.attr("data-id"));
    $(".shop_name").attr("data-id",id).text($this.text());
    getGoods(id);
});
var goods_item='<li data-id={{id}}>'+
                    '<i class="checkbox-btn"></i>'+
                    '<img class="shop-img" src="{{logo}}" alt="店铺logo"/>'+
                    '<div class="shop-item">'+
                        '<p class="c333" title="{{name}}">{{name}}</p>'+
                        '{{ if charge_types }}<p class="c666">价格{{charge_types["price"]}}元/{{charge_types["unit"]}}</p>{{/if}}'+
                    '</div>'+
                '</li>';
function getGoods(shop_id){
    var args = {
        action:"get_goods",
        data:{
            id:shop_id,
        }
    };
    var url = "";
    $(".shop-list").empty();
    $.postJson(url,args,function(res){
         if(res.success){
             var goods_list=res.goods_list;
             for(var key in goods_list){
                var good=goods_list[key];
                var render=template.compile(goods_item);
                var html=render({
                    logo:good["imgurl"],
                    id:good["id"],
                    name:good["name"],
                    charge_types:good["charge_types"][0]
                });
                $(".shop-list").append(html);
             }
         }else{
            return Tip(res.error_text);
         }
    });
}

function importGoods($btn){
    if($btn.attr("data-flag")=="off"){
        return Tip("请勿重复提交");
    }
    var id_list=[];
    $(".shop-list .active").each(function(){
        var $this=$(this);
        var id=parseInt($this.attr("data-id"));
        id_list.push(id);
    });
    var url = "";
    var args = {
        action:"import_goods",
        data:{
            fruit_list:id_list,
        }
    };
    $btn.attr("data-flag","off");
    $.postJson(url,args,function(res){
         if(res.success){
            Tip("导入成功");
             setTimeout(function(){
                 window.location.href='/admin/goods/all';
             },1500);
         }else{
            $btn.attr("data-flag","on");
            return Tip(res.error_text);
         }
    });
}