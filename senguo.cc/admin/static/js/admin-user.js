$(document).ready(function(){
    $('.show-info').on('click',function(){
        var $this=$(this);
        $this.parents('li').find('.hide-info').slideToggle(100);
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
    getpPage(page,'/admin/follower?action=all&&order_by=time&&page=',user_number);
    $('.search-btn').on('click',function(){
        var search=$('.search-con').val().trim();
        window.location.href='follower?action=search&&order_by=time&&page=0&&wd='+search;
    });
    //导航active样式
    if(user_type=='all') $('.all_user').addClass('active');
    else if(user_type=='old') $('.old_user').addClass('active');
});
var page=Int($.getUrlParam('page'));
var user_type= $.getUrlParam('action');
var totalt_page=Math.ceil($('.page-total').text());