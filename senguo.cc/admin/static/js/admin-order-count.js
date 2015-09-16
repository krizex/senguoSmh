//获取当前日期
var current_date=new Date();
var current_year=current_date.getFullYear();
var current_month=current_date.getMonth()+1;

var ChooseDate1 = current_date;
var choose_year1 = current_year;
var choose_month1 = current_month;

var current_addup_way1 = 'order_amount'; //当前的统计方式  order_amount.订单量，payment_mode.支付方式，order_user.下单用户，order_time.下单时间，recive_time.收货时间
var current_sort_way1 = 'day';  //当前的排序方式  day:按日排,week:按周排,month:按月排,history:历史数据累积
var current_valuation_way1 = 'count';//当前的计价方式 count.按个记，money.按元记
var current_chartSeries_data = ['总订单','按时达','立即送','自提'] //当前图表需要展示的东西,默认是用订单量的展示
var current_chartSeries_descrition = ['all','onTime','atOnce','selfGet']
var begin_date=current_year+'-'+(current_month<10?"0"+current_month:current_month)+'-'+(current_date.getDate()<10?"0"+current_date.getDate():current_date.getDate());
var end_date=current_year+'-'+(current_month<10?"0"+current_month:current_month)+'-'+(current_date.getDate()<10?"0"+current_date.getDate():current_date.getDate());

var page_sum;
var page_choose=0;

$(document).ready(function(){
    initCharts();
}).on('click','.subnav li',function(){
    var $this=$(this);
    $this.addClass('active').siblings('li').removeClass('active');
}).on('click','.order_amount',function(){
    //1.更新comment模块的内容；
    $(".order_count_comment p").text("统计不同订单模式下的订单量与订单金额");
    //2.展示或隐藏时间选择的方式和计价单位；
    $(".change-box .ordercount-change-list1").show();
    $(".change-box .ordercount-change-list2").hide();
    $(".valuation-money").removeClass("hide");
    //3.更新图表系列数据
    current_chartSeries_data= ['总订单','按时达','立即送','自提'];
    current_chartSeries_descrition = ['all','onTime','atOnce','selfGet'];

    if(current_addup_way1=='order_time' || current_addup_way1=='recive_time'){
        current_sort_way1='day';
        $(".li-sort-date").addClass("active"); 
        $(".li-sort-date").siblings('li').removeClass("active"); 
        $(".year-span1").show();
        $(".month-span1").show();
        $(".pre-item1").show();
        $(".next-item1").show();
    }

    //4.更新当前的统计方式
    current_addup_way1='order_amount';

    //5.下方图表内容的展示由多方面的内容所共同决定，包括统计方式，排序方式和计价方式
    show_chart(choose_year1,choose_month1);
    //6.更新sumup模块的内容
    show_sumup();
}).on('click','.payment_mode',function(){
    $(".order_count_comment p").text("统计不同支付方式下的订单量与订单金额");


    $(".change-box .ordercount-change-list1").show();
    $(".change-box .ordercount-change-list2").hide();
    $(".valuation-money").removeClass("hide");

    current_chartSeries_data= ['总营业额','货到付款','余额支付','在线支付','在线支付-微信','在线支付-支付宝'];
    current_chartSeries_descrition=['all','payAsArrival','payWithBalance','payOnline','payOnline-wx','payOnline-alipay'];
    
    if(current_addup_way1=='order_time' || current_addup_way1=='recive_time'){
        current_sort_way1='day';
        $(".li-sort-date").addClass("active"); 
        $(".li-sort-date").siblings('li').removeClass("active"); 
        $(".year-span1").show();
        $(".month-span1").show();
        $(".pre-item1").show();
        $(".next-item1").show();
    }
    current_addup_way1='payment_mode';

    show_chart(choose_year1,choose_month1);
    show_sumup();
}).on('click','.order_user',function(){
    $(".order_count_comment p").text("统计新用户、老用户、充值用户等的下单情况");
    
    $(".change-box .ordercount-change-list1").show();
    $(".change-box .ordercount-change-list2").hide();
    $(".valuation-money").removeClass("hide");

    current_chartSeries_data= ['总订单','新用户订单','老用户订单','充值用户订单'];
    current_chartSeries_descrition=['all','new','old','balance'];

    if(current_addup_way1=='order_time' || current_addup_way1=='recive_time'){
        current_sort_way1='day';
        $(".li-sort-date").addClass("active"); 
        $(".li-sort-date").siblings('li').removeClass("active"); 
        $(".year-span1").show();
        $(".month-span1").show();
        $(".pre-item1").show();
        $(".next-item1").show();
    }

    current_addup_way1='order_user';


    show_chart(choose_year1,choose_month1);
    show_sumup();
}).on('click','.order_time',function(){
    $(".order_count_comment p").text("发现用户的下单时间规律，有助于选择最好的商品促销时间");
    
    $(".year-span1").hide();
    $(".month-span1").hide();
    $(".pre-item1").hide();
    $(".next-item1").hide();
    $(".change-box .ordercount-change-list1").hide();
    $(".change-box .ordercount-change-list2").show();
    $(".valuation-money").addClass("hide");

    current_chartSeries_data= ['总订单','新用户订单','老用户订单','充值用户订单'];
    current_chartSeries_descrition=['all','new','old','balance'];

    current_addup_way1='order_time';
    //如果当前的计价方式"按元记",改回"按个记"
    if(current_valuation_way1=='money'){
        current_valuation_way1='count';
        $(".valuation-count").addClass("active"); 
        $(".valuation-money").removeClass("active"); 
    }
    show_chart(choose_year1,choose_month1);
    show_sumup();
}).on('click','.recive_time',function(){
    $(".order_count_comment p").text("发现用户的收货时间规律，有助于合理安排员工工作时间"); 
    
    $(".year-span1").hide();
    $(".month-span1").hide();
    $(".pre-item1").hide();
    $(".next-item1").hide();
    $(".change-box .ordercount-change-list1").hide();
    $(".change-box .ordercount-change-list2").show();
    $(".valuation-money").addClass("hide");  

    current_chartSeries_data= ['总订单','新用户订单','老用户订单','充值用户订单'];
    current_chartSeries_descrition=['all','new','old','balance'];

    current_addup_way1='recive_time';

    if(current_valuation_way1=='money'){
        current_valuation_way1='count';
        $(".valuation-count").addClass("active"); 
        $(".valuation-money").removeClass("active"); 
    }
    show_chart(choose_year1,choose_month1);
    show_sumup();
}).on('click','.ordercount-change-list1 li',function(){
    var $this=$(this);
    $this.addClass('active').siblings('li').removeClass('active');
}).on('click','.sort-date1',function(){
    //1.更新当前的排序方式
    current_sort_way1 = 'day'; 

    //2.隐藏或展示月
    $(".month-span1").show();
    //3.下方图表内容的展示由多方面的内容所共同决定，包括统计方式，排序方式和计价方式
    show_chart(choose_year1,choose_month1);
    //4.更新统计方式字段
}).on('click','.sort-week1',function(){
    current_sort_way1 = 'week';  
    $(".month-span1").hide();
    show_chart(choose_year1,choose_month1);
}).on('click','.sort-month1',function(){
    current_sort_way1 = 'month'; 
    $(".month-span1").hide();
    show_chart(choose_year1,choose_month1);
}).on('click','.val_method_change li',function(){
    var $this=$(this);
    $this.addClass('active').siblings('li').removeClass('active');
}).on('click','.valuation-count',function(){
    current_valuation_way1 = 'count';  
    show_chart(choose_year1,choose_month1);
}).on('click','.valuation-money',function(){
    current_valuation_way1 = 'money';  
    show_chart(choose_year1,choose_month1);
}).on("click",".pre-item1",function(){
    switch(current_sort_way1){
        case 'day':
            ChooseDate1 = new Date(ChooseDate1.getFullYear(),ChooseDate1.getMonth()-1,ChooseDate1.getDate());
            choose_year1=ChooseDate1.getFullYear();
            choose_month1=ChooseDate1.getMonth()+1;

            $(".year1").text(choose_year1);
            $(".month1").text(choose_month1);

            show_chart(choose_year1,choose_month1);
            break;
        case 'week':
        case 'month':
            choose_year1=ChooseDate1.getFullYear()-1;
            choose_month1=ChooseDate1.getMonth();
            ChooseDate1 = new Date(choose_year1,ChooseDate1.getMonth(),ChooseDate1.getDate());
            $(".year1").text(choose_year1);
            
            show_chart(ChooseDate1.getFullYear(),ChooseDate1.getMonth());

            break;
    }
}).on("click",".next-item1",function(){
    switch(current_sort_way1){
        case 'day':
            ChooseDate1 = new Date(ChooseDate1.getFullYear(),ChooseDate1.getMonth()+1,ChooseDate1.getDate());
            choose_year1=ChooseDate1.getFullYear();
            choose_month1=ChooseDate1.getMonth()+1;
            
            $(".year1").text(choose_year1);
            $(".month1").text(choose_month1);
            
            show_chart(choose_year1,choose_month1);
            break;
        case 'week':
        case 'month':
            choose_year1=ChooseDate1.getFullYear()+1;
            choose_month1=ChooseDate1.getMonth();
            ChooseDate1 = new Date(choose_year1,ChooseDate1.getMonth(),ChooseDate1.getDate());

            $(".year1").text(choose_year1); 
            
            show_chart(ChooseDate1.getFullYear(),ChooseDate1.getMonth());
            break;
    }
}).on("click",".dropdown-menu .item",function(){
    //列表切换排序方式,列头展示变化,以及列表信息变化
    var list_sortway = $(this).html();
    var $this = $(this);
    $this.closest("ul").prev("button").children("em").html(list_sortway).attr("data-id",$this.attr("data-id"));
    showTable(0);
}).on('click','.pre-page',function(){
    page_choose=page_choose-1;
    if(page_choose==0){
        $('.pre-page').hide();
    }
    if(page_choose>-1) {
        showTable(page_choose);
        $('.next-page').show();
        $('.page-now').text(page_choose+1);
    }
}).on('click','.next-page',function(){
    if(page_choose<page_sum){
        page_choose=page_choose+1;
        if(page_choose!=page_sum){
            $('.pre-page').show();
            $('.page-now').text(page_choose+1);
            showTable(page_choose);
        }
        if(page_choose==page_sum-1) {
            $('.next-page').hide();
        }
    }
}).on('click','.jump-to',function(){
    var page=Int($('.input-page').val());
    if(page>0){
        if(page_sum>page-1>0){
            page_choose=page-1;
            showTable(page);
            $('.pre-page').show();
            $('.page-now').text(page);
        }
        if(page==page_sum) $('.next-page').hide();
    }
});

//页面初始化
function initCharts(){
    $(".year1").text(current_year);
    $(".month1").text(current_month);
    $(".from_get_date").val(begin_date);
    $(".to_get_date").val(end_date);
    //页面加载时统计方式默认选中按订单量
    $(".order-type").each(function(){
        current_addup_way1 = 'order_amount';
        $(".order_count_comment p").text("统计不同订单模式下的订单量与订单金额");
        $(".valuation-money").removeClass("hide");
        $(".change-box .ordercount-change-list1").show();
        $(".change-box .ordercount-change-list2").hide();
        current_chartSeries_data= ['总订单','按时达','立即送','自提'];
        current_chartSeries_descrition = ['all','onTime','atOnce','selfGet']
        var $this = $(this);
        $this.find("li").eq(0).click();
    });

    //页面加载时排序方式默认选中按天
    $(".ordercount-change-list1").each(function(){
        current_sort_way1 = 'day';
        $(".year-span1").show();
        $(".month-span1").show();
        $(".pre-item1").show();
        $(".next-item1").show();
        var $this = $(this);
        $this.find("li").eq(0).click();
    });

    //页面加载时计价方式默认选中“按个”
    $(".val_method_change").each(function(){
        current_valuation_way1 = 'count';
        var $this = $(this);
        $this.find("li").eq(0).click();
    });

    show_chart(current_year,current_month);
    show_sumup();

    showTable(0);
}


//根据图表默认需要展示的数组,得到series的json对象
function getChartSeries(seriesData){
    var strRe="";
    for(var i=0;i<seriesData.length;i++){
        if(strRe!=""){
            strRe+=",";
        }
        strRe +="{'name': '"+seriesData[i]+"','type': 'line','data': [],'markPoint': {'data': [{'type': 'max', 'name': '最大值'},{'type': 'min', 'name': '最小值'}]},'markLine': {'data': [{'type': 'average', 'name': '平均值'}]}}"
    }
    strRe="["+strRe+"]";
    return eval(strRe);
}

//图表展示
function show_chart(current_year,current_month){  
    require.config({
        paths: {
            echarts:'/static/js'
        }
    });
    require(
        [
            'echarts',
            'echarts/chart/bar',
            'echarts/chart/line',
            'echarts/chart/pie'
        ],
        //月走势
        function (ec) {
            var myChart = ec.init(document.getElementById('ordercount_trend'));
            myChart.showLoading({
                text: '正在努力的读取数据中...'
            });
            myChart.hideLoading();
            var options = {
                tooltip: {
                    trigger: 'axis'
                },
                toolbox: {
                    show: true,
                    feature: {
                        mark: {show: true},
                        magicType: {show: true, type: ['line', 'bar']},
                        restore: {show: true},
                        saveAsImage: {show: true}
                    }

                },
                calculable: true,
                legend: {
                    data: current_chartSeries_data
                },

                xAxis: [
                    {
                        type: 'category',
                        boundaryGap: false,
                        data: []
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: '增长趋势',
                        axisLabel: {
                            formatter: '{value}'
                        }
                    }
                ],
                series:getChartSeries(current_chartSeries_data),
                color: ['#b6a2de', '#2ec7c9', '#5ab1ef', '#ffb980', '#d87a80',
                    '#8d98b3', '#e5cf0d', '#97b552', '#95706d', '#dc69aa',
                    '#07a2a4', '#9a7fd1', '#588dd5', '#f5994e', '#c05050',
                    '#59678c', '#c9ab00', '#7eb00a', '#6f5553', '#c14089']
            };
            //获取数据并绑定到前台
            switch(current_addup_way1){
                case "order_amount":
                case "payment_mode":
                case "order_user":
                    bindChart(current_year,current_month<10?"0"+current_month:current_month,options,myChart);
                    break;
                case "order_time":
                case "recive_time":
                    bindChart2(options,myChart);
                    break;
            }
        }
    );
}


var data;
//获取数据并绑定到前台,订单量,支付方式和下单用户
function bindChart(current_year,current_month,options,myChart){
    options.xAxis[0].data=[];
    for(var j=0;j<options.series.length;j++){
        options.series[j].data=[];
    }
    myChart.clear();
    getChartData(current_addup_way1,current_sort_way1,current_valuation_way1,current_year,current_month);

    for(var i=0;i<data.length;i++){
        var d=data[i];
        if(current_sort_way1=='day'){
            date=resolve(i+1)+'号';
        }
        //按周
        else if(current_sort_way1=='week'){
            date='第'+resolve(i+1)+'周';
        }
        else{
            date=resolve(i+1)+'月';
        }

        options.xAxis[0].data.push(date);
        for(var j=0;j<current_chartSeries_data.length;j++){
            var columnName=current_chartSeries_descrition[j];
            options.series[j].data.push(d[columnName]);
        }
    }
    myChart.refresh();
    myChart.setOption(options);
}


//获取图表数据,订单量,支付方式和下单用户
function getChartData(action,sortWay,valuationWay,current_year,current_month){
    var args={
        action:action,
        sortWay:sortWay,
        valuationWay:valuationWay,
        current_year:current_year,
        current_month:current_month
    };
    var url='';
    setTimeout(function(){

    }, 250);
    $.ajaxSetup({async:false});
    $.postJson(url,args,function(res){
        if(res.success){
            data=res.data;
        }
        else return Tip(res.error_text);
    },
    function(){
        return Tip('网络好像不给力呢~ ( >O< ) ~！');
    });
}

//展示结论性数据
function show_sumup(){
    var strDes ="";
    switch(current_addup_way1){
        case "order_amount":
            $(".ordercount_sumup").hide();
            $(".ordercount_sumup p").text("");
            break;
        case "payment_mode":
            $(".ordercount_sumup p").text("");
            $(".ordercount_sumup").show();
            getSumupData();
            var $item=$( '<span>累计在线支付占比:</span><span class="active">'+data2["payOnline"]+'</span>'
                       + '<span>累计余额支付占比:</span><span class="active">'+data2["payWithBalance"]+'</span>'
                       + '<span>累计货到付款占比:</span><span class="active">'+data2["payAsArrival"]+'</span>');
            $(".ordercount_sumup p").append($item);
            break;
        case "order_user":
            $(".ordercount_sumup p").text("");
            $(".ordercount_sumup").show();
            getSumupData();
            var $item=$( '<span>店铺累计重复购买率:</span><span class="active">'+data2["repeatPurRate"]+'</span>');
            $(".ordercount_sumup p").append($item);
            break;
        case "order_time":
            strDes="下单高峰期";
        case "recive_time":
            getSumupData();
            $(".ordercount_sumup p").text("");
            if (current_addup_way1=="recive_time"){
                strDes="收货高峰期";
            }
            if(typeof(data2["top"])=="undefined"){
                $(".ordercount_sumup").hide();
                $(".ordercount_sumup p").text("");
            }
            else if(typeof(data2["second"])=="undefined"){
                var $item=$( '<span>所选时间范围内,'+strDes+'为</span><span class="active">'+data2["top"]+":00-"+(parseInt(data2["top"])+1)+':00</span>');
                $(".ordercount_sumup p").append($item);
                $(".ordercount_sumup").show();
            }
            else{
                var $item=$( '<span>所选时间范围内,'+strDes+'为</span><span class="active">'+data2["top"]+":00-"+(parseInt(data2["top"])+1)+':00</span>'
                            +'<span>和</span><span class="active">'+data2["second"]+":00-"+(parseInt(data2["second"])+1)+':00</span>');
                $(".ordercount_sumup p").append($item);
                $(".ordercount_sumup").show();
            }
            break;
    }
}

var data2;
//图表下方的结论性语句,获取数据
function getSumupData(){
    var args;
    switch(current_addup_way1){
        case "order_amount":
            break;
        case "payment_mode":
        case "order_user":
            args={
                action:'getSumup',
                countfor:current_addup_way1
            }
            break;
        case "order_time":
        case "recive_time":
            args={
                action:'getSumup',
                countfor:current_addup_way1,
                begin_date:begin_date,
                end_date:end_date
            }
            break;
    }

    var url='';
    setTimeout(function(){

    }, 250);
    $.ajaxSetup({async:false});
    $.postJson(url,args,function(res){
        if(res.success){
            data2=res.data;
        }
        else return Tip(res.error_text);
    },
    function(){
        return Tip('网络好像不给力呢~ ( >O< ) ~！');
    });
}

//下单时间和收货时间绑定数据到图表上面
function bindChart2(options,myChart){
    options.xAxis[0].data=[];
    for(var j=0;j<options.series.length;j++){
        options.series[j].data=[];
    }
    myChart.clear();
    getChartData2();

    for(var i=0;i<data.length;i++){
        var d=data[i];
        time=i+'点';
        options.xAxis[0].data.push(time);
        for(var j=0;j<current_chartSeries_data.length;j++){
            var columnName=current_chartSeries_descrition[j];
            options.series[j].data.push(d[columnName]);
        }
    }
    myChart.refresh();
    myChart.setOption(options);
}


//下单时间和收货时间获取图表数据
function getChartData2(){
    var args={
        action:current_addup_way1,
        begin_date:begin_date,
        end_date:end_date
    };
    var url='';
    setTimeout(function(){

    }, 250);
    $.ajaxSetup({async:false});
    $.postJson(url,args,function(res){
        if(res.success){
            data=res.data;
        }
        else return Tip(res.error_text);
    },
    function(){
        return Tip('网络好像不给力呢~ ( >O< ) ~！');
    });
}

//下单时间和收货时间的起止日期修改后的触发事件
function timeChanged(type){
    if(type=='1'){
        if($(".from_get_date").val() != begin_date){
            begin_date=$(".from_get_date").val();
            show_chart('','');
            show_sumup();
        }
    }
    else{
        if($(".to_get_date").val() != end_date){
            end_date=$(".to_get_date").val();
            show_chart('','');
            show_sumup();
        }
    }
}


//展示列表数据
function showTable(page){
    var list_sort_way=$('em.filter').attr("data-id");
    getTableData(page,list_sort_way);
    $('.detail-rate').find('tr.item').remove();
    //for(var key in data3){
    for(var key=0;key<data3.length;key++){
    //for(var key=data3.length-1;key>-1;key--){
        var $item=$('<tr class="item">'+
                    '<td class="time"></td><td class="total_count txt-right"></td><td class="total_money txt-right"></td><td class="total_price txt-right"></td>'+
                    '<td class="addup_count txt-right"></td><td class="addup_money txt-right"></td><td class="addup_price txt-right"></td>'+
                    '</tr>');
        var time=data3[key][0];        //data[key][0];
        if(list_sort_way=="list_week"){
            time=getWeekRange(time);
        }
        var total_count=data3[key][1]; //data[key][1];
        var total_money=data3[key][3]; //data[key][2];
        var total_price=data3[key][5]; //data[key][0];
        var addup_count=data3[key][2]; //data[key][1];
        var addup_money=data3[key][4]; //data[key][2];
        var addup_price=data3[key][6]; //data[key][0];
        $item.find('.time').text(time);
        $item.find('.total_count').text(commafy(total_count));
        $item.find('.total_money').text(commafy(total_money));
        $item.find('.total_price').text(commafy(total_price));
        $item.find('.addup_count').text(commafy(addup_count));
        $item.find('.addup_money').text(commafy(addup_money));
        $item.find('.addup_price').text(commafy(addup_price));
        $('.detail-rate').append($item);
    }
    if(page==0){
        $('.next-page').show();
        $('.input-page').show();
        $('.jump-to').show();
        if(page_choose==0){$('.pre-page').hide();}
        if((page_choose+1)==page_sum){
            $('.next-page').hide();
            $('.input-page').hide();
            $('.jump-to').hide();
        }
        $('.page-now').text(page_choose+1);
        $('.page-total').text(page_sum);
    }
}

var data3;
//获取列表数据
function getTableData(page,list_sort_way){
    var args={
        action:'order_table',
        page:page,
        list_sort_way:list_sort_way
    };
    var url='';
    setTimeout(function(){

    }, 250);
    $.ajaxSetup({async:false});
    $.postJson(url,args,function(res){
        if(res.success){
            data3=res.data;
            page_sum=res.page_sum;
        }
        else return Tip(res.error_text);
    },
    function(){
        return Tip('网络好像不给力呢~ ( >O< ) ~！');
    });
}


/*根据周数得到该年这一周的起止日期。
  如果第一周或最后一周不满七天，这一周的起始日期就只算这几天*/
function getWeekRange(indexOfWeek){
    var firstDay = new Date(ChooseDate1.getFullYear(),0,1);
    var weekOfFirstDay = firstDay.getDay();
    var endOfWeek;
    var startOfWeek;
    //如果第一天是周日的话
    if(weekOfFirstDay==0){
        endOfWeek=GetDateN(firstDay,(indexOfWeek-1)*7);
        startOfWeek=GetDateN(firstDay,(indexOfWeek-1)*7-6);
    }
    else{
        endOfWeek=GetDateN(firstDay,(indexOfWeek-1)*7+(7-weekOfFirstDay));
        startOfWeek=GetDateN(firstDay,(indexOfWeek-1)*7+(1-weekOfFirstDay));
    }
    //如果得到的该周的第一天不是今年，取第一天
    if(startOfWeek.getFullYear()!=ChooseDate1.getFullYear()){
        startOfWeek=new Date(ChooseDate1.getFullYear(),0,1);
    }
    if(endOfWeek.getFullYear()!=ChooseDate1.getFullYear()){
        endOfWeek=new Date(ChooseDate1.getFullYear(),11,31);
    }
    var sYear=startOfWeek.getFullYear();
    var sMonth=startOfWeek.getMonth()+1;
    var sDay=startOfWeek.getDate();
    var eYear=endOfWeek.getFullYear();
    var eMonth=endOfWeek.getMonth()+1;
    var eDay=endOfWeek.getDate();
    var sReturn=sYear+'-'+resolve(sMonth)+'-'+resolve(sDay)+'～'+eYear+'-'+resolve(eMonth)+'-'+resolve(eDay);
    return sReturn;
}

//小于10的前面加个0
function resolve(i){
    if(i<10){
        return '0'+i;
    }
    return i;
}



// 获取当前日期的前后N天日期(返回值为Date类型)(N<=28):
function GetDateN(date,AddDayCount)
{
    var dd = new Date(2015,1,1);

    // add by jyj 2015-7-14
    var date_year = date.getFullYear();
    var date_month = date.getMonth()+1;
    var date_date = date.getDate();

    dd.setDate(date_date);
    dd.setMonth(date_month - 1);
    dd.setFullYear(date_year);

    var n_flag;
    var is_leap;

    if(AddDayCount >= 0){
        n_flag = 1;
    }
    else{
        n_flag = 0;
    }

    if((date_year % 4 == 0 && date_year % 100 != 0) || (date_year % 400 == 0)){
        is_leap = 1;
    }
    else{
        is_leap = 0;
    }

    switch(n_flag){
        case 1:
            if (date_month == 2){
                switch(is_leap){
                    case 1:
                        if(date_date + AddDayCount > 29){
                            dd.setMonth(date_month);
                            dd.setDate(date_date+AddDayCount - 29);
                        }
                        else{
                            dd.setDate(date_date + AddDayCount);
                        }
                    break;

                    case 0:
                        if(date_date + AddDayCount > 28){
                            dd.setMonth(date_month);
                            dd.setDate(date_date+AddDayCount - 28);
                        }
                        else{
                            dd.setDate(date_date + AddDayCount);
                        }

                    break;
                }
            }
            else if ((date_month == 1 || date_month == 3 || date_month == 5 || date_month == 7 || date_month == 8 || date_month == 10 ) && date_date + AddDayCount > 31){
                dd.setMonth(date_month);
                dd.setDate(date_date+AddDayCount - 31);
            }
            else if(date_month == 12 && date_date + AddDayCount > 31){
                dd.setDate(date_date+AddDayCount - 31);
                dd.setMonth(0);
                dd.setFullYear(date_year + 1);
            }
            else if ((date_month == 4|| date_month == 6 || date_month == 9 || date_month == 11) && date_date + AddDayCount > 30){
                dd.setMonth(date_month);
                dd.setDate(date_date+AddDayCount - 30);
            }
            else{
                dd.setDate(date_date + AddDayCount);
            }
        break;
        case 0:
            if ((date_month == 3) && date_date + AddDayCount <= 0){
                switch(is_leap){
                    case 1:
                        if(date_date + AddDayCount <= 0){
                            dd.setMonth(date_month - 2);
                            dd.setDate(date_date + 29 + AddDayCount);
                        }
                        else{
                            dd.setDate(date_date + AddDayCount);
                        }
                    break;

                    case 0:
                        if(date_date + AddDayCount <= 0){
                            dd.setMonth(date_month - 2);
                            dd.setDate(date_date + 28 + AddDayCount);
                        }
                        else{
                            dd.setDate(date_date + AddDayCount);
                        }

                    break;
                }
            }
            else if ((date_month == 2 || date_month == 4 || date_month == 6 || date_month == 8 || date_month == 9 || date_month == 11 ) && date_date + AddDayCount <= 0){
                dd.setMonth(date_month - 2);
                dd.setDate(date_date + 31 + AddDayCount);
            }
            else if(date_month == 1 && date_date + AddDayCount <= 0){
                dd.setFullYear(date_year - 1);
                dd.setMonth(11);
                dd.setDate(date_date + 31 + AddDayCount);
            }
            else if ((date_month == 5|| date_month == 7 || date_month == 10 || date_month == 12) && date_date + AddDayCount <= 0){
                dd.setMonth(date_month - 2);
                dd.setDate(date_date + 30 + AddDayCount);
            }
            else{
                dd.setDate(date_date + AddDayCount);
            }
        break;
    }

    //
    var y = dd.getFullYear();
    var m = (dd.getMonth()+1)<10?"0"+(dd.getMonth()+1):(dd.getMonth()+1);//获取当前月份的日期，不足10补0
    var d = dd.getDate()<10?"0"+dd.getDate():dd.getDate(); //获取当前几号，不足10补0
    var str = y+"-"+m+"-"+d+" 00:00:00";
    str = str.replace(/-/g,"/");
    var new_date = new Date(str);
    return new_date;
}