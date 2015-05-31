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
});

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