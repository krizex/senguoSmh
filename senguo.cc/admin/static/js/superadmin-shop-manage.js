$(document).ready(function(){
    $('.rejectApply').on('click',function(){$(this).siblings('.reject-box').modal('show');})
    $('.rejectSend').on('click',function(){Reject($(this));});
    $('.passApply').on('click',function(){Pass($(this));});
    //翻页
    $(document).on('click','#PrePage',function(){
        var action= $.getUrlParam('action');
        var page=Int($.getUrlParam('page'));
        if(page>1) window.location.href='http://zone.senguo.cc/super/shopManage?action='+action+'&&page='+(page-1);
    });
    $(document).on('click','#NextPage',function(){
        var action= $.getUrlParam('action');
        var page=Int($.getUrlParam('page'));
        window.location.href='http://zone.senguo.cc/super/shopManage?action='+action+'&&page='+(page+1);
    });
    if(localStorage.getItem("itemIndex")){
        $(".shop-manage-nav li").removeClass("active").eq(localStorage.getItem("itemIndex")).addClass("active");
    }else{
        localStorage.setItem("itemIndex",0);
        $(".shop-manage-nav li").removeClass("active").eq(0).addClass("active");
    }
}).on("click",".shop-manage-nav li",function(){
    var index = $(this).index();
    localStorage.setItem("itemIndex",index);
    $(".shop-manage-nav li").removeClass("active").eq(index).addClass("active");
}).on("click",".ok-pop",function(e){
    e.stopPropagation();
    $(".wrap-com-pop").addClass("hide");
}).on("click",".cancel-pop",function(e){
    e.stopPropagation();
    $(".wrap-com-pop").addClass("hide");
}).on("click",".cancel-btn",function(e){
    $(".wrap-com-pop").removeClass("hide");
}).on("click",".ok-btn",function(e){
    $(this).next(".super-opinion").html("已删除").addClass("green-txt").removeClass("hide");
    $(this).closest(".btn-group").removeClass("txt-ac");
    $(this).closest(".btn-group").children("a").remove();
}).on("click",".wrap-com-pop",function(e){
    e.stopPropagation();
    $(".wrap-com-pop").addClass("hide");
}).on("click",".com-pop",function(e){
    e.stopPropagation();
});

window.onbeforeunload = function(){
    localStorage.setItem("itemIndex",0);
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
