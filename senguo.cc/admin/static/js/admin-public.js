$(document).ready(function(){
if (window.screen.width=='600')
    document.write ('<body style="zoom: 55%">');
else if (window.screen.width=='800') 
    document.write ('<body style="zoom: 75%">');

    $('#currentShopChange li').on('click',function(){
        var shop_id=$(this).data('id');
        shopChnage(shop_id);
    });
    $('.developing').on('click',function(){
        alert('此功能暂未开放！');
    });
});

var shop_id=$('#currentShop').data('id');
var shop_name=$('#currentShop').text();

function worMode(target){
    target.hide().siblings().show();
}

function shopChnage(shop_id){
    var url='/admin';
    var args={shop_id:shop_id};
    $.postJson(url,args,function(res){
        if(res.success){
            window.location.reload();
        }
    });
}

function toggle(trigger,target){
    $(document).on('click',trigger,function(e){
        var $this=$(this);
        var forbid_click=$this.find('.forbid_click');
        if(!forbid_click.is(e.target) &&forbid_click.has(e.target).length === 0){
            $this.siblings(target).toggle();
        }
    })
}

function hide(trigger,target){
    $(trigger).on('click',function(){
        target.hide();
    })
}

function getpPage(page,url,list){
    if(page===0) $('.pre-page').hide();
    else{
        $('.pre-page').on('click',function(){
            var $this=$(this);
            $this.attr({'href':url+(page-1)});
        });
    }
    if(list<20){
        $('.jump-to').hide();
        $('.input-page').hide();
        $('.next-page').hide();
    }
    else{
        $('.next-page').on('click',function(){
            var $this=$(this);
            $this.attr({'href':url+(page+1)});
        });
    }
    $('.jump-to').on('click',function(){
        var $this=$(this);
        var page=Int($('.input-page').val().trim());
        $this.attr({'href':url+page});
    });
}
