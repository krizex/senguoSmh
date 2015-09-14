 var temppage = 2;//更多店家页码数
 $(document).ready(function(){ 
    shopTotal();//shop total number
    getData('top');//get top8
    var maxnum = 200;//获取省店家最多的数量
    //map data
    require.config({
        paths: {
            echarts:'/static/js'
        }
    });
    require(
        [
            'echarts',
            'echarts/chart/map'
        ],
        function (ec) {
            var myChart = ec.init(document.getElementById('map'));
            myChart.showLoading({
                text: '正在努力的读取数据中...'
            });
            myChart.hideLoading();
            var options = {
                tooltip : {
                    trigger: 'item'
                },
                dataRange: {
                    show:false,
                    min: 0,
                    max: maxnum,
                    x: 'left',
                    y: 'bottom',
                    //text:["maxnum以上",'0'],           // 文本，默认为数值文本
                    calculable : true,
                    color:['#2c6853','#429c7c','#58d0a6','#92e0c5','#cdf1e4','#f3f3f3'],
                },
                series : [
                    {
                        name: '同行数量',
                        type: 'map',
                        mapType: 'china',
                        roam: false,//地图缩放
                        itemStyle:{
                            normal:{
                                label:{
                                    show:true,
                                    textStyle:{color:"#000"}
                                },
                                },
                            emphasis:{label:{show:true}}
                        }, 
                        data:[
                           
                        ]
                    }
                ]
            };
            var ecConfig = require('echarts/config');
            var zrEvent = require('zrender/tool/event');
            /*点击地图中省份，加载店家*/
            myChart.on(ecConfig.EVENT.CLICK, function (param){
                temppage = 2;
                $('.shoplist').empty();
                var province = param.name;
                var pro_code;
                var area=window.dataObj.area;
                if(province=='黑龙江') {province='黑龙'}
                if(province=='内蒙古') {province='内蒙'}
                for (var key in area) {
                    if (province == area[key]['name'].substring(0,2)) {
                        pro_code=Int(key);
                        window.dataObj.province_code=pro_code;
                        if(province=='黑龙') {province='黑龙江'}
                        if(province=='内蒙') {province='内蒙古'}
                        $('.province_name').text(province);
                        getData('filter',1,'province',pro_code);
                        $('body','html').animate({scrollTop:'1000px'});
                    }
                }
            });
            options.series[0].data=[];
            var area=window.dataObj.area;
            for(var key in area){
                var province=area[key]['name'];
                var pro_count=window.dataObj.province_count;
                var num=0;
                province=province.substring(0,2);
                if(province=='黑龙') {province='黑龙江'}
                if(province=='内蒙') {province='内蒙古'}
                for(var i in pro_count){
                    if(key==pro_count[i][0]){num=pro_count[i][1]}
                }
                options.series[0].data.push({name:province,value:num});
            }
            myChart.refresh();
            myChart.setOption(options);
        }
    )
});


var shopTotal=function(){
    var total_count=$('#total_count').val().toString();
    var n_length=total_count.length;
    var num_1=0;
    var num_2=0;
    var num_3=0;
    var num_4=0;
    if(n_length==1){
        num_1=0;
        num_2=0;
        num_3=0;
        num_4=total_count;
    }else if(n_length==2){
        num_1=0;
        num_2=0;
        num_3=Int(total_count.substring(0,1));
        num_4=Int(total_count.substring(1,2));
    }else if(n_length==3){
        num_1=0;
        num_2=Int(total_count.substring(0,1));
        num_3=Int(total_count.substring(1,2));
        num_4=Int(total_count.substring(2,3));
    }else if(n_length==4){
        num_1=Int(total_count.substring(0,1));
        num_2=Int(total_count.substring(1,2));
        num_3=Int(total_count.substring(2,3));
        num_4=Int(total_count.substring(3,4));
    }else{
        num_1=9;
        num_2=9;
        num_3=9;
        num_4=9;
    }
    var number=[num_1,num_2,num_3,num_4];
    number=bubbleSort(number);
    window.dataObj.time=number+1;  
    var n4=0;
    var n3=0;
    var n2=0;
    var n1=0;
    var count=function(time,num_4,num_3,num_2,num_1) {
            if (window.dataObj.time == 0) {
                window.dataObj.time =time;
            }
            else {
                window.dataObj.time--;
                var num4=$('.num4').text();
                var num3=$('.num3').text();
                var num2=$('.num2').text();
                var num1=$('.num1').text();
                if(num4!=num_4) $('.num4').text(n4++);
                else {$('.num4').text(num_4)}
                if(num3!=num_3) $('.num3').text(n3++);
                else {$('.num3').text(num_3)}
                if(num2!=num_2) $('.num2').text(n2++);
                else {$('.num2').text(num_2)}
                if(num1!=num_1) $('.num1').text(n1++);
                else {$('.num1').text(num_1)}
                setTimeout(function() {
                        count(time,num_4,num_3,num_2,num_1)
                    },
                    50)
            }
    }    
    count(number+1,num_4,num_3,num_2,num_1);
}

var page = 0;
var getData=function(action,page,type,data){
    var url='';
    var action =action;
    var args={
        action:action,
        page:page
    };
    if(action=='filter') {
        if(type=='province'){args.province=data}
    }
    $.postJson(url,args,function(res){
    if(res.success){
        if(window.dataObj.shop_item==undefined){
            $.getItem('/static/items/official/shop_item.html?v=20150613',function(data){
                window.dataObj.shop_item=data;
                initShop(res);
            });
        }else{
            initShop(res);
        }
    }else {
        $(".shop_list").css("display","none");
    }
    },function(){
            $(".shop_list").css("display","none");
        }
    );
}

function initShop(res){
    var shops=res.shoplist;
    window.dataObj.page_total=res.page_total;
    var page_total=window.dataObj.page_total;
    if(temppage == 2) {
        $('.shoplist').empty();
    }
    if(shops.length < 8) {
        $('.add-more-page').addClass('hide');
        $('.no-more').removeClass('hide');
    }
    if(shops.length>0) {
        $('.no-more').addClass('hide');
        for(var i in shops){
            var $item=$(window.dataObj.shop_item);
            var shop_code=shops[i]['shop_code'];
            var shop_trademark_url=shops[i]['shop_trademark_url'];
            var shop_name=shops[i]['shop_name'];
            var shop_province=shops[i]['shop_province'];
            var shop_city=shops[i]['shop_city'];
            var shop_intro=shops[i]['shop_intro'];
            var owner=shops[i]['shop_admin_name'];
            //province and city
            var area=window.dataObj.area;
            if(shop_city==shop_province) {shop_city=''}
            for(var pro in area){
                if(pro==shop_province){shop_province=area[pro]['name']}
                for(var cit in area[pro]['city']){
                    if(shop_city&&cit==shop_city){shop_city=area[pro]['city'][cit]['name']}
                }
            }
            if(!shop_trademark_url) {shop_trademark_url='/static/images/TDSG_l.png'}
            $item.find('.shop_link').attr({'href':'/'+shop_code});
            $item.find('.shop_log').attr({'src':shop_trademark_url+'?imageView2/1/w/470/h/470'});
            $item.find('.shop_name').text(shop_name);
            $item.find('.owner').text(owner);
            $item.find('.area').text(shop_province+shop_city);
            $item.find('.shop_intro').text(shop_intro);
            $('.shoplist').append($item);
        }
    }
}

//鼠标滚动加载更多店家
$(window).scroll(function() {
    var province =  $('.province_name').text();
    if(province == '全国') {
        $('.add-more-page').remove();
    }
    /*判断滚动条到底部*/
    if($(document).scrollTop() >= $(document).height()-$(window).height()) {
        $('.add-more-page').removeClass('hide');
        /*判断是否重复加载*/
        setTimeout(function() {
            var area=window.dataObj.area;
            for (var key in area) {
                if(province=='黑龙江') {province='黑龙'}
                if(province=='内蒙古') {province='内蒙'}
                if (province == area[key]['name'].substring(0,2)) {
                    var pro_code; 
                    pro_code=Int(key);
                    window.dataObj.province_code=pro_code;
                    getData('filter',temppage,'province',pro_code);
                    temppage++;
                }
            }
            $('.add-more-page').addClass('hide'); 
        },500);
        
    }
});
