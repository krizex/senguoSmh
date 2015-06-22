page_shop=1,inputinfo=$("#inputinfo").val();
$(document).ready(function(){
    $('.rejectApply').on('click',function(){$(this).siblings('.reject-box').modal('show');})
    $('.rejectSend').on('click',function(){Reject($(this));});
    $('.passApply').on('click',function(){Pass($(this));});
    //翻页
     $(document).on('click','#PrePage',function(){
        if(inputinfo==""){
           if(page_shop>1){
            page_shop--;
            insertShop(page_shop);
           }
           else  return Tip("当前已经是第一页");
        }
        else{
              if(page_shop>1){
            page_shop--;
            searchshop(page_shop);
           }
           else  return Tip("当前已经是第一页");
        }
        /*if(page>1){
            page--;
             if(inputinfo==""){
            insertShop(page);
        }
        else{
                searchshop(page_search);
            }
        }
        else{
            return Tip("当前已经是第一页");
            }*/
    });
    $(document).on('click','#NextPage',function(){
        if(inputinfo==""){
             page_shop++;
            insertShop(page_shop);
        }
        else{
            page_shop++;
            searchshop(page_shop);
        }
    });
    if(localStorage.getItem("itemIndex")){
        $(".shop-manage-nav li").removeClass("active").eq(localStorage.getItem("itemIndex")).addClass("active");
    }else{
        localStorage.setItem("itemIndex",0);
        $(".shop-manage-nav li").removeClass("active").eq(0).addClass("active");
    }
}).on('click',"#authPrePage",function(){
    var page=Int($.getUrlParam('page'));
    if(page>0) {
        window.location.href='/super/shopauth?page='+(page-1);
    }
}).on('click',"#authNextPage",function(){
    var page=Int($.getUrlParam('page'));
    window.location.href='/super/shopauth?page='+(page+1);
}).on("click",".shop-manage-nav li",function(){
    var index = $(this).index();
    localStorage.setItem("itemIndex",index);
    $(".shop-manage-nav li").removeClass("active").eq(index).addClass("active");
}).on("click",".ok-pop",function(e){
    e.stopPropagation();
    rejectDel();
}).on("click",".cancel-pop",function(e){
    e.stopPropagation();
    $(".wrap-com-pop").addClass("hide");
}).on("click",".cancel-btn",function(e){
    $(".wrap-com-pop").removeClass("hide");
}).on("click",".ok-btn",function(e){
     var $this=$(this);
     var apply_id=$this.parents('.item').attr('data-id');
     if(confirm('确认删除该评论?')){
        delComment(apply_id,$this);   
    }
}).on("click",".wrap-com-pop",function(e){
    e.stopPropagation();
    $(".wrap-com-pop").addClass("hide");
}).on("click",".com-pop",function(e){
    e.stopPropagation();
}).on('click','.reject-del',function(){
    var $this=$(this);
    var apply_id=$this.parents('.item').attr('data-id');
    var index=$this.parents('.item').index();
    $(".wrap-com-pop").attr({'data-id':apply_id,'data-index':index});
}).on("click",".refuse",function(e){
    var $this=$(this);
    $(".wrap-com-pop").removeClass("hide");
    var apply_id=$this.parents('.shop-list-item').attr('data-id');
    var index=$this.parents('.shop-list-item').index();
    var type=$this.parents('.shop-list-item').attr('data-type');
    $(".wrap-com-pop").attr({'data-id':apply_id,'data-index':index,'data-type':type});
}).on("click",".ok",function(e){
     var $this=$(this);
     var apply_id=$this.parents('.shop-list-item').attr('data-id');
     var type=$this.parents('.shop-list-item').attr('data-type');
     if(confirm('确认通过该申请?')){
          passAuth(apply_id,$this,type);
    }
}).on('click','#submit-apply',function(){
        rejectAuth();
}).on("click","#concel-apply",function(e){
    $(".wrap-com-pop").addClass("hide");
}).on("change","#shopstatus",function(){
    page_shop=1;
     insertShop(page_shop);
}).on("change","#sortrule",function(){
    page_shop=1;
    insertShop(page_shop);
}).on("change","#renzheng",function(){
    page_shop=1;
     insertShop(page_shop);
}).on("click","#search",function(){
    page_shop=1;
    searchshop(page_shop);
}).on("keyup","#inputinfo",function(){
    page_shop=1;
    searchshop(page_shop);
}).on("change","#ifreverse",function(){
    page_shop=1;
    insertShop(page_shop);
});

function insertShop(page){
    var action= $.getUrlParam('action');
    var v2=$('#sortrule').val();//选中的值
    var v3=$('#renzheng').val();//选中的值
    var v=$('#shopstatus').val();
    var ifreverse=$('#ifreverse').val();
    var url='/super/shopManage?action='+action+'&search&shop_auth='+v3+'&shop_status='+v+'&shop_sort_key='+v2+'&if_reverse='+ifreverse+'&page='+page+'&flag=0';
   $.ajax({
            url:url,
            type:"get",
            success:function(res){
                if(res.success){
                        var shops = res.output_data;
                        $('#list-group').empty();
                         for(var i=0; i<shops.length; i++){
                                    var shop = shops[i];
                                    var $item = $("#temp-ul").children("li").clone();
                                    if(shop.shop_trademark_url){
                                         $item.find(".shop-img").attr("src",shop.shop_trademark_url+"?imageView/1/w/100/h/100");
                                    }else{
                                        $item.find(".shop-img").attr("src","/static/images/TDSG.png");
                                    } 
                                    //delete by jyj 2015-6-22    
                                    //$item.find(".ushop_name").html(shop.shop_name);
                                    //

                                    $item.find(".uauth_type").html(shop.auth_type);
                                    $item.find(".uadmin_nickname").html(shop.admin_nickname);
                                    $item.find(".ushop_address_name").html(shop.shop_address_detail);
                                    $item.find(".ushop_code").html(shop.shop_code);
                                    $item.find(".ushop_status").html(shop.shop_shop_status);
                                    $item.find(".ucreate_date").html(shop.create_date);
                                    $item.find(".uold_msg").html(shop.old_msg);
                                    $item.find(".usatisfy").html(shop.satisfy);
                                    $item.find(".uorder_count").html(shop.order_count);
                                    $item.find(".ugoods_count").html(shop.goods_count);
                                    $item.find(".ushop_property").html(shop.shop_property);
                                    $item.find(".usingle_price").html(shop.single_price);
                                    $item.find(".uavailable_balance").html(shop.available_balance);
                                    $item.find(".ufans_count").html(shop.fans_count);
                                    $item.find(".uold_user").html(shop.old_user);

                                    // change by jyj 2015-6-22:
                                    $item.find(".ushop_code_link").attr("href",'/'+shop.shop_code);
                                    $item.find(".ushop_code_link").text(shop.shop_name);
                                    //

                                    // if(i==0){
                                    //     // alert($item.find(".ushop_code_link").text());
                                    //     alert("aaaaaaaaaa")
                                    // }
                                    $("#list-group").append($item);
                                }
                         }
           }
      });

}

window.onbeforeunload = function(){
    localStorage.setItem("itemIndex",0);
}
function passAuth(apply_id,target,type){
    var action="commit";
    var url='';
    var type=Int(type);
    var args={
        action:action,
        apply_id:apply_id,
        apply_type:type
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                target.closest('.shop-list-item').find('.box').empty().text('认证成功');
            }
        }
    )
}

function rejectAuth(){
     var action="decline";
    var url='';
    var apply_id=$(".wrap-com-pop").attr('data-id');
    var index=$(".wrap-com-pop").attr('data-index');
    var type=  Int($(".wrap-com-pop").attr('data-type'));
    var decline_reason=$('#com-cont').val();
    if(!decline_reason){
        return alert(' 输入拒绝理由');
    }
    var args={
        action:action,
        apply_id:apply_id,
        apply_type:type,
        decline_reason:decline_reason
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                $(".wrap-com-pop").addClass("hide");
                $('.shop-list-item').eq(index).find('.box').empty().text('认证拒绝:'+decline_reason);
            }
        }
    )
}



function Pass(evt){
    var action="updateShopStatus";
    var shop_id=evt.parents('li').data('shopid');
    var url='';
    var new_status=2;
    var args={
        action:action,
        shop_id:shop_id,
        new_status:new_status
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                evt.parents('.shop-list-item').addClass('hidden');
            }
        }

    )
}


function Reject(evt){
    var action="updateShopStatus";
    var shop_id=evt.parents('li').data('shopid');
    var declined_reason=evt.siblings('.decline-reason').val().trim();
    var url='';
    var new_status=3;
    if(!declined_reason){return alert('请输入拒绝理由！')}
    var args={
        action:action,
        shop_id:shop_id,
        new_status:new_status,
        declined_reason:declined_reason
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                alert('拒绝成功！');
                evt.parents('.modal').modal('hide');
                evt.parents('.shop-list-item').addClass('hidden');
            }
        }

    )
}

function delComment(apply_id,target){
     var action="commit";
    var url='/super/comment';
    var args={
        action:action,
        apply_id:apply_id,
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                target.next(".super-opinion").html("已删除").addClass("green-txt").removeClass("hide");
                target.closest(".btn-group").removeClass("txt-ac");
                target.closest(".btn-group").children("a").remove();
            }
        }
    )
}

function rejectDel(){
     var action="decline";
    var url='/super/comment';
    var apply_id=$(".wrap-com-pop").attr('data-id');
    var index=$(".wrap-com-pop").attr('data-index');
    var decline_reason=$('#com-cont').val();
    if(!decline_reason){
        return alert(' 输入拒绝理由');
    }
    var args={
        action:action,
        apply_id:apply_id,
        decline_reason:decline_reason
    };
    $.postJson(url,args,
        function(res){
            if(res.success)
            {
                $(".wrap-com-pop").addClass("hide");
                $('.action-box').eq(index).hide();
                $('.rejected').eq(index).removeClass('hide').find('.super-reason').text(decline_reason);
            }
        }
    )
}

function searchshop(page){
    var searchinfo=$("#inputinfo")[0].value;
    searchinfo='='+searchinfo;
    var url='/super/shopManage?action=all&search'+searchinfo+'&shop_auth=4&shop_status=5&shop_sort_key=4&if_reverse=1&page='+page+'&flag=0';
   $.ajax({
            url:url,
            type:"get",
            success:function(res){
                if(res.success){
                        var shops = res.output_data;
                        $('#list-group').empty()
                        if(shops.length==0){
                    $("#list-group").append("<p>没有查询到任何有关的商家！</p>");
                }
                else{
                         for(var i=0; i<shops.length; i++){
                                        var shop = shops[i];
                                        var $item = $("#temp-ul").children("li").clone();
                                        if(shop.shop_trademark_url){
                                             $item.find(".shop-img").attr("src",shop.shop_trademark_url+"?imageView/1/w/100/h/100");
                                        }else{
                                            $item.find(".shop-img").attr("src","/static/images/TDSG.png");
                                        }     
                                        $item.find(".ushop_name").html(shop.shop_name);
                                        $item.find(".uauth_type").html(shop.auth_type);
                                        $item.find(".uadmin_nickname").html(shop.admin_nickname);
                                        $item.find(".ushop_address_name").html(shop.shop_address_detail);
                                        $item.find(".ushop_code").html(shop.shop_code);
                                        $item.find(".ushop_status").html(shop.shop_shop_status);
                                        $item.find(".ucreate_date").html(shop.create_date);
                                        $item.find(".uold_msg").html(shop.old_msg);
                                        $item.find(".usatisfy").html(shop.satisfy);
                                        $item.find(".uorder_count").html(shop.order_count);
                                        $item.find(".ugoods_count").html(shop.goods_count);
                                        $item.find(".ushop_property").html(shop.shop_property);
                                        $item.find(".usingle_price").html(shop.single_price);
                                        $item.find(".uavailable_balance").html(shop.available_balance);
                                        $item.find(".ufans_count").html(shop.fans_count);
                                        $item.find(".uold_user").html(shop.old_user);
                                        $("#list-group").append($item);
                          }
                     }
                  }
                }
                });
}
