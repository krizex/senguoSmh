$(document).ready(function(){
    count();
    $('.sub-nav li').on('click',function(){
        var $this=$(this);
        $this.addClass('active').siblings().removeClass('active');
        var index=$this.index();
        $('.table-count').eq(index-1).show().siblings('.table-count').hide();
    });
    $('.header').on('click',function(){
        ('.table-count').show();
    })
});
function count(){
    var args={};
    var url='';
    $.postJson(url,args,function(res){
            if(res.success){
                var total=res.total;
                var sex_list=res.sex;
                var province_list=res.province;
                var city_list=res.city;
                for(var key in sex_list){
                    var $item=$('<tr class="item"><td class="sex"></td><td class="user"></td><td class="percent"></td></tr>');
                    var sex=sex_list[key][0];
                    var num=sex_list[key][1];
                    if(sex==1) sex='男';
                    else if(sex==2) sex='女';
                    else sex='未知';
                    $item.find('.sex').text(sex);
                    $item.find('.user').text(num);
                    $item.find('.percent').text(percentNum(num,total));
                    $('.detail-sex').append($item);
                }
                for(var key in province_list){
                    var $item=$('<tr class="item"><td class="province"></td><td class="user"></td><td class="percent"></td></tr>');
                    var province=province_list[key][0];
                    var num=province_list[key][1];
                    if(province=='') city='未知';
                    $item.find('.province').text(province);
                    $item.find('.user').text(num);
                    $item.find('.percent').text(percentNum(num,total));
                    $('.detail-province').append($item);
                }
                for(var key in city_list){
                    var $item=$('<tr class="item"><td class="city"></td><td class="user"></td><td class="percent"></td></tr>');
                    var city=city_list[key][0];
                    var num=city_list[key][1];
                    if(city=='') city='未知';
                    $item.find('.city').text(city);
                    $item.find('.user').text(num);
                    $item.find('.percent').text(percentNum(num,total));
                    $('.detail-city').append($item);
                }

            }
            else return alert(res.error_text);
        },
        function(){
            return alert('网络错误！');
        });
}
