var page=0;
var item;
var action='all';
var input = $("#inputinfo");
var 
$(document).ready(function(){
    $.ajaxSetup({'async':false});
    $.getItem(item_link+'/user-item.html?v=20150808',function(data){item=data;});
    getContent('all',0);
    // classify($('.all'),'all');
    // classify($('.admin'),'admin');
    // classify($('.customer'),'customer');
    // classify($('.phone'),'phone');
    // var pre=$('#PrePage');
    // var next=$('#NextPage');

    var action_text = $(".left-choose-list").find(".active").attr("data-id");
    if (action_text == '1'){
        action = 'all';
    }
    else if (action_text == '2'){
        action = 'admin';
    }
    else if (action_text == '3'){
        action = 'customer';
    }
    else if (action_text == '4'){
        action = 'phone';
    }
    // console.log(action);
    // add by jyj 2015-6-23
    var search = $("#search");
    
    search.on('click',function(){
        page=0;
        getSearchContent('search',$("#inputinfo").val(),page);
    });
    input.on('keyup',function(){
        page=0;
        getSearchContent('search',$("#inputinfo").val(),page);
    });
    //jyj

    // added by jyj 2015-8-7
    var out_link = $.getUrlParam("out_link");
    if (out_link == "true"){
        var data_id = $.getUrlParam("data_id");
        page=0;
        getSearchContent('out_link',data_id,page);
    }
    // 
    
    // if(page==0)
    // {
    //     pre.addClass('hidden');
    // }
    // if($('.item-list').find('li').length<20)
    // {
    //     next.addClass('hidden');
    // }
    // pre.on('click',function(){
    //      if(inputinfo==""){
    //        if(page>0){
    //         page--;
    //         // var action_text = $(".left-choose-list").find(".active").attr("data-id");
    //         // if (action_text == '1'){
    //         //     action = 'all';
    //         // }
    //         // else if (action_text == '2'){
    //         //     action = 'admin';
    //         // }
    //         // else if (action_text == '3'){
    //         //     action = 'customer';
    //         // }
    //         // else if (action_text == '4'){
    //         //     action = 'phone';
    //         // }
    //         getContent(action,page);
    //        }
    //        else  return Tip("当前已经是第一页");
    //     }
    //     else{
    //           if(page>0){
    //         page--;
    //         getSearchContent('search',$("#inputinfo").val(),page);
    //        }
    //        else  return Tip("当前已经是第一页");
    //     }
    // });
    // next.on('click',function(){
    //      // if(inputinfo==""){
    //      //     page++;
    //      //    //  var action_text = $(".left-choose-list").find(".active").attr("data-id");
    //      //    // if (action_text == '1'){
    //      //    //     action = 'all';
    //      //    // }
    //      //    // else if (action_text == '2'){
    //      //    //     action = 'admin';
    //      //    // }
    //      //    // else if (action_text == '3'){
    //      //    //     action = 'customer';
    //      //    // }
    //      //    // else if (action_text == '4'){
    //      //    //     action = 'phone';
    //      //    // }
    //      //    console.log("#####################");
    //      //    getContent(action,page);
    //     }
    //     else{
    //         page++;
    //         getSearchContent('search',$("#inputinfo").val(),page);
    //     }
    // });
}).on('click','.nav_item',function(){
        var $this=$(this);
        var action_text = $this.attr("data-id");
        if (action_text == '1'){
                action = 'all';
                $this.addClass('active').siblings('.nav_item').removeClass('active');
                getContent(action,0);
            }
        else if (action_text == '2'){
            action = 'admin';
            $this.addClass('active').siblings('.nav_item').removeClass('active');
            getContent(action,0);
        }
        else if (inputinfoaction_text == '3'){
            action = 'customer';
            $this.addClass('active').siblings('.nav_item').removeClass('active');
            getContent(action,0);
        }
        else if (action_text == '4'){
            action = 'phone';
            $this.addClass('active').siblings('.nav_item').removeClass('active');
            getContent(action,0);
        }
        console.log(action);
}).on('click','#PrePage',function(){

}).on('click','#NextPage',function(){
    console.log(typeof input);
    if(input==""){
             page++;
            //  var action_text = $(".left-choose-list").find(".active").attr("data-id");
            // if (action_text == '1'){
            //     action = 'all';
            // }
            // else if (action_text == '2'){
            //     action = 'admin';
            // }
            // else if (action_text == '3'){
            //     action = 'customer';
            // }
            // else if (action_text == '4'){
            //     action = 'phone';
            // }
            console.log("#####################");
            getContent(action,page);
    }
    else{
            page++;
            getSearchContent('search',$("#inputinfo").val(),page);
        }
});

function classify(target,act){
    target.on('click',function(){getContent(act,0);action=act;page=0;});
    console.log(action);
}

function getContent(action,page){
    var url="";
    var args={action: action,page:page};
    $("#inputinfo").val("");
    $.postJson(url,args,
        function (res) {
           if(res.success){
                $(".pager").show();
               $('.user-list').empty();
                var users=res.data;
                for(var i=0;i<users.length;i++){
                    var $item=$(item);
                    var user=users[i];
                    //add by jyj 2015-6-22
                    var user_id = user[0];
                    //
                    var img=user[1];
                    var name=user[2];
                    if(name.length >8){
                        name = name.slice(0,8) + '...';
                    }
                    var sex=user[3];
                    var province=user[4];
                    var city=user[5];
                    var phone=user[6];
                    var wx_username=user[8];

                    //add by jyj 2015-6-22
                    var birthday = user[9];
                    if(birthday == 0){
                        birthday = "未填写";
                    }
                    if(!wx_username){
                        wx_username = "未填写";
                    }
                    $item.find('.user-id').text(user_id);
                    $item.find('.birthday').text(birthday);
                    $item.find('.wx-username').text(wx_username);
                     //change by jyj 2015-6-24
                    var fshop=user[10];
                    if(fshop.length != 0){
                        if(fshop[0][2].length != 0){
                            for(j= 0;j< fshop.length;j++){
                                if(fshop[j][2].length >6){
                                    fshop[j][2] = fshop[j][2].slice(0,6)+'...';
                                }
                            }
                        }    
                    }
                    else{
                        var tmp1 = [];
                        var tmp2 = ["","","无"]; 
                        tmp1[0] = tmp2;
                        fshop = tmp1;
                    }
                    //
                    
                    var oshop=user[11];

                    if(!phone) phone='未绑定';
                    $item.find('.img').attr({'src':img});
                    $item.find('.name').text(name).attr({'data-sex':sex});
                    if(sex==2) sex='女';
                    else if(sex==1) sex='男';
                    else if(sex==0) sex='其他';
                    $item.find('.sex').text(sex);

                    if(city == "" && province == ""){
                        $item.find('.city').text("未填写");
                    }
                    else{
                        $item.find('.city').text(province+city);
                    }
                    
                    $item.find('.phone').text(phone);

                    pushItem(fshop,$item,'.focus-shop');
                    if(oshop.length == 0){
                        $(".own-shop").text("无");
                     }
                     else{
                         pushItem(oshop,$item,'.own-shop');
                     }
                   
                    $('.user-list').append($item);
                }
           }
           else return alert(res.error_text);
        },
        function(){
            alert('网络错误！');}
    );
}

function getSearchContent(action,inputinfo,page){
    var url="";
    var args={action: action,inputinfo:inputinfo,page:page};
    $.postJson(url,args,
        function (res) {
           if(res.success){
                if(action == "out_link"){
                    $(".pager").hide();
                }
                else{
                     $(".pager").show();
                }
               $('.user-list').empty();
                var users=res.data;
                for(var i=0;i<users.length;i++){
                    var $item=$(item);
                    var user=users[i];

                    //add by jyj 2015-6-22
                    var user_id = user[0];
                    //
                    var img=user[1];
                    var name=user[2];
                    if(name.length >8){
                        name = name.slice(0,8) + '...';
                    }
                    var sex=user[3];
                    var province=user[4];
                    var city=user[5];

                    var phone=user[6];
                    var wx_username=user[8];
                    if(!wx_username){
                        wx_username = "未填写";
                    }
                    $item.find('.wx-username').text(wx_username);

                    //add by jyj 2015-6-22
                    var birthday = user[9];
                    if(birthday == 0){
                            birthday = "未填写";
                    }
                    $item.find('.user-id').text(user_id);
                    $item.find('.birthday').text(birthday);
                    //

                    //change by jyj 2015-6-24
                    var fshop=user[10];
                    if(fshop.length != 0){
                        if(fshop[0][2].length != 0){
                            for(j= 0;j< fshop.length;j++){
                                if(fshop[j][2].length >6){
                                    fshop[j][2] = fshop[j][2].slice(0,6)+'...';
                                }
                            }
                        }    
                    }
                    else{
                        var tmp1 = [];
                        var tmp2 = ["","","无"]; 
                        tmp1[0] = tmp2;
                        fshop = tmp1;
                    }
                    //

                    var oshop=user[11];

                    if(!phone) phone='未绑定';
                    $item.find('.img').attr({'src':img});
                    $item.find('.name').text(name).attr({'data-sex':sex});
                    if(sex==2) sex='女';
                    else if(sex==1) sex='男';
                    else if(sex==0) sex='其他';
                    $item.find('.sex').text(sex);

                    if(city == "" && province == ""){
                        $item.find('.city').text("未填写");
                    }
                    else{
                        $item.find('.city').text(province+city);
                    }
                    
                    $item.find('.phone').text(phone);

                    pushItem(fshop,$item,'.focus-shop');
                    if(oshop.length == 0){
                        $(".own-shop").text("无");
                     }
                     else{
                         pushItem(oshop,$item,'.own-shop');
                     }
                   
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
        var $ite=$('<li><a href="/'+data[key][1]+'" target="_blank"></a></li>');
        $ite.find('a').text(data[key][2]);
        item.find(list).append($ite);
    }
}
