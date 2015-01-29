$(document).ready(function(){
    $.ajaxSetup({'async':false});
    $.getItem(item_link+'/user-item.html',function(data){item=data;});
    getContent('all',0);
    classify($('.all'),'all');
    classify($('.admin'),'admin');
    classify($('.customer'),'customer');
    classify($('.phone'),'phone');
    var pre=$('#PrePage');
    var next=$('#NextPage');
    if(page==0)
    {
        pre.addClass('hidden');
    }
    if($('.item-list').find('li').length<20)
    {
        next.addClass('hidden');
    }
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
                var count=res.sum;
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
                    $item.find('.city').text(province+city);
                    $item.find('.phone').text(phone);
                    pushItem(fshop,$item,'.focus-shop');
                    pushItem(oshop,$item,'.own-shop');
                    $('.user-list').append($item);
                }
               $('.all').find('.count').text(count['all']);
               $('.admin').find('.count').text(count['admin']);
               $('.customer').find('.count').text(count['customer']);
               $('.phone').find('.count').text(count['phone']);
           }
           else return alert(res.error_text);
        },
        function(){
            alert('网络错误！');}
    );
}

function pushItem(data,item,list){
    for(var key in data){
        var $ite=$('<li><a herf=""></a></li>');
        $ite.find('a').text(data[key][1]);
        item.find(list).append($ite);
    }
}