$(document).ready(function(){
    $.ajaxSetup({'async':false});
    $.getItem(item_link+'/user-item.html?v=20150609',function(data){item=data;});
    getContent('all',0);
    classify($('.all'),'all');
    classify($('.admin'),'admin');
    classify($('.customer'),'customer');
    classify($('.phone'),'phone');
    var pre=$('#PrePage');
    var next=$('#NextPage');
    // if(page==0)
    // {
    //     pre.addClass('hidden');
    // }
    // if($('.item-list').find('li').length<20)
    // {
    //     next.addClass('hidden');
    // }
    pre.on('click',function(){
        if(page>0) {page--;getContent(action,page);}
    });
    next.on('click',function(){page++;getContent(action,page);});
});
var item;
var action='all';
var page=0;
function classify(target,act){
    target.on('click',function(){getContent(act,0);action=act;page=0;});
}

function getContent(action,page){
    var url="";
    var args={action: action,page:page};
    $.postJson(url,args,
        function (res) {
           if(res.success){
               $('.user-list').empty();
                var users=res.data;
                for(var i=0;i<users.length;i++){
                    var $item=$(item);
                    var user=users[i];
                    var img=user[1];
                    var name=user[2];
                    var sex=user[3];
                    var province=user[4];
                    var city=user[5];
                    var phone=user[6];
                    var fshop=user[7];
                    var oshop=user[8];
                    if(!phone) phone='未绑定';
                    $item.find('.img').attr({'src':img});
                    $item.find('.name').text(name).attr({'data-sex':sex});
                    if(sex==2) sex='女';
                    else if(sex==1) sex='男';
                    else if(sex==0) sex='其他';
                    $item.find('.sex').text(sex);
                    $item.find('.city').text(province+city);
                    $item.find('.phone').text(phone);
                    pushItem(fshop,$item,'.focus-shop');
                    pushItem(oshop,$item,'.own-shop');
                    $('.user-list').append($item);
                }
           }
           else return alert(res.error_text);
        },
        function(){
            alert('网络错误！');}
    );
}

function pushItem(data,item,list){
    for(var key in data){
        var $ite=$('<li><a href="http://zone.senguo.cc/shop/'+data[key][1]+'"></a></li>');
        $ite.find('a').text(data[key][2]);
        item.find(list).append($ite);
    }
}
