$(document).ready(function(){
    $('.show-info').on('click',function(){
        var $this=$(this);
        $this.siblings('.hide-info').slideToggle(100);
    });
    //用户性别
    $('.user-sex').each(function(){
        var $this=$(this);
        var sex=$this.data('id');
        if(sex==2) $this.addClass('women');
        else $this.addClass('men');
    });
    //翻页
    $('.page-now').text(page+1);
    $('.page-total').text(totalt_page);
    var user_number=$('.users-list-item').length;
    if(page===0) $('.pre-page').hide();
    else{
        $('.pre-page').on('click',function(){
            var $this=$(this);
            $this.attr({'href':'http://zone.senguo.cc/admin/follower?action=all&&order_by=time&&page='+(page-1)});
        });
    }
    if(user_number<20){
        $('.jump-to').hide();
        $('.input-page').hide();
        $('.next-page').hide();
    }
    else{
        $('.next-page').on('click',function(){
            var $this=$(this);
            $this.attr({'href':'http://zone.senguo.cc/admin/follower?action=all&&order_by=time&&page='+(page+1)});
        });
    }
    $('.jump-to').on('click',function(){
        var $this=$(this);
        var page=Int($('.input-page').val().trim());
        $this.attr({'href':'http://zone.senguo.cc/admin/follower?action=all&&order_by=time&&page='+page});
    });
    $('.search-btn').on('click',function(){
        var search=$('.search-con').val().trim();
        window.location.href='http://zone.senguo.cc/admin/follower?action=search&&order_by=time&&page=0&&wd='+search;
    });
});
var page=Int($.getUrlParam('page'));
var totalt_page=Math.ceil($('.page-total').text());