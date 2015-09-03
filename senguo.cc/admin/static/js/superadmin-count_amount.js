//获取当前日期
var CurrentDate=new Date();
var current_year=CurrentDate.getFullYear();
var current_month=CurrentDate.getMonth()+1;

var ChooseDate1 = CurrentDate;
var choose_year1 = current_year;
var choose_month1 = current_month;
var current_sort_way1 = 1;  //当前的排列方式  1:按日排,2:按周排,3:按月排


$(document).ready(function(){
    initCharts();
}).on('click','.sell-change-list1 li',function(){
    liveInit();
    $(".year1").text(current_year);
    $(".month1").text(current_month);

    var $this = $(this);
    $this.addClass('active').siblings('li').removeClass('active');
}).on('click','.sort-date1',function(){
    $(".choose-change1").removeClass("hidden");
    current_sort_way1 = 1;
    liveInit();
    ChooseDate1 = CurrentDate;

    $(".year-span1").show();
    $(".month-span1").show();

    show_chart("amount_trend",1,ChooseDate1.getFullYear(),ChooseDate1.getMonth()+1);
}).on('click','.sort-week1',function(){
    $(".choose-change1").removeClass("hidden");
    current_sort_way1 = 2;
    liveInit();
    ChooseDate1 = CurrentDate;

    $(".month-span1").hide();
    $(".year-span1").show();

    show_chart("amount_trend",2,ChooseDate1.getFullYear(),ChooseDate1.getMonth()+1);
}).on('click','.sort-month1',function(){
    $(".choose-change1").removeClass("hidden");
    current_sort_way1 = 3;
    liveInit();
    ChooseDate1 = CurrentDate;

    $(".year-span1").show();
    $(".month-span1").hide();

    show_chart("amount_trend",3,ChooseDate1.getFullYear(),ChooseDate1.getMonth()+1);
}).on("click",".pre-item1",function(){
    switch(current_sort_way1){
        case 1:
            ChooseDate1 = new Date(ChooseDate1.getFullYear(),ChooseDate1.getMonth()-1,ChooseDate1.getDate());
            choose_year1=ChooseDate1.getFullYear();
            choose_month1=ChooseDate1.getMonth()+1;

            $(".year1").text(choose_year1);
            $(".month1").text(choose_month1);

            show_chart("amount_trend",1,choose_year1,choose_month1);
            break;
        case 2:
            choose_year1=ChooseDate1.getFullYear()-1;
            ChooseDate1 = new Date(choose_year1,ChooseDate1.getMonth(),ChooseDate1.getDate());
            $(".year1").text(choose_year1);
            show_chart("amount_trend",2,ChooseDate1.getFullYear(),ChooseDate1.getMonth());
            break;
        case 3:
            choose_year1=ChooseDate1.getFullYear()-1
            ChooseDate1 = new Date(choose_year1,ChooseDate1.getMonth(),ChooseDate1.getDate());
            $(".year1").text(choose_year1);
            
            show_chart("amount_trend",3,ChooseDate1.getFullYear(),ChooseDate1.getMonth());

            break;
    }
}).on("click",".next-item1",function(){
    switch(current_sort_way1){
        case 1:
            ChooseDate1 = new Date(ChooseDate1.getFullYear(),ChooseDate1.getMonth()+1,ChooseDate1.getDate());
            choose_year1=ChooseDate1.getFullYear();
            choose_month1=ChooseDate1.getMonth()+1;
            
            $(".year1").text(choose_year1);
            $(".month1").text(choose_month1);
            
            show_chart("amount_trend",1,choose_year1,choose_month1);
            break;
        case 2:
            choose_year1=ChooseDate1.getFullYear()+1;
            ChooseDate1 = new Date(choose_year1,ChooseDate1.getMonth(),ChooseDate1.getDate());

            $(".year1").text(choose_year1); 
            
            show_chart("amount_trend",2,ChooseDate1.getFullYear(),ChooseDate1.getMonth()+1);
            break;
        case 3:
            choose_year1=ChooseDate1.getFullYear()+1;
            ChooseDate1 = new Date(choose_year1,ChooseDate1.getMonth(),ChooseDate1.getDate());

            $(".year1").text(choose_year1); 
            
            show_chart("amount_trend",3,ChooseDate1.getFullYear(),ChooseDate1.getMonth()+1);
            break;
    }
})

function initCharts(){
    $(".year1").text(current_year);
    $(".month1").text(current_month);

    //页面加载时默认选中按天
    $(".sell-change-list1").each(function(){
        $(".choose-change1").removeClass("hidden");
        current_sort_way1 = 1;
        $(".year-span1").show();
        $(".month-span1").show();
        var $this = $(this);
        $this.find("li").eq(0).click();
    });
    //图表展示也是默认展示按天统计
    show_chart("amount_trend",1,current_year,current_month);
    
}

// 实时更新函数
function liveInit(){
    CurrentDate=new Date();
    current_year=CurrentDate.getFullYear();
    current_month=CurrentDate.getMonth()+1;
    current_date = CurrentDate.getDate();
}



//展示图表
function show_chart(action,type,current_year,current_month){

    var myChart = null;
    var ChartOptions = null;

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
        function (ec) {
         //下单时间统计
           myChart = ec.init(document.getElementById(action));
           myChart.showLoading({
                        text: '数据加载中...',
                        y:200,
                        effect : "ring",
                        textStyle:{
                            baseline:'middle',
                            fontSize:16
                        }
            });
            ChartOptions={
                tooltip : {
                    trigger: 'axis'
                },
                legend: {
                    data:['总流入','支付宝','微信']
                },
                toolbox: {
                    show : true,
                    feature : {
                        mark : {show: true},
                        magicType: {show: true, type: ['line', 'bar']},
                        restore : {show: true},
                        saveAsImage : {show: true}
                    }

                },
                calculable : true,
                xAxis : [
                    {
                        type : 'category',
                        boundaryGap : false,
                        data : []
                    }
                ],
                yAxis : [
                    {
                        type : 'value',
                        name : '增长趋势',
                        axisLabel : {
                            formatter: '{value}'
                        }
                    }
                ],
                series : [
                    {
                        name:'总流入',
                        type:'line',
                        data:[],
                        markPoint : {
                            data : [
                                {type : 'max', name: '最大值'},
                                {type : 'min', name: '最小值'}
                            ]
                        },
                        markLine : {
                            data : [
                                {type : 'average', name: '平均值'}
                            ]
                        }
                    },
                    {
                        name:'支付宝',
                        type:'line',
                        data:[],
                        markPoint : {
                            data : [
                                {type : 'max', name: '最大值'},
                                {type : 'min', name: '最小值'}
                            ]
                        },
                        markLine : {
                            data : [
                                {type : 'average', name: '平均值'}
                            ]
                        }
                    },
                    {
                        name:'微信',
                        type:'line',
                        data:[],
                        markPoint : {
                            data : [
                                {type : 'max', name: '最大值'},
                                {type : 'min', name: '最小值'}
                            ]
                        },
                        markLine : {
                            data : [
                                {type : 'average', name: '平均值'}
                            ]
                        }
                    },
                ],
                color: ['#b6a2de','#2ec7c9','#5ab1ef','#ffb980','#d87a80',
                    '#8d98b3','#e5cf0d','#97b552','#95706d','#dc69aa',
                    '#07a2a4','#9a7fd1','#588dd5','#f5994e','#c05050',
                    '#59678c','#c9ab00','#7eb00a','#6f5553','#c14089']
            };
            getCount(action,type,current_year,current_month<10?"0"+current_month:current_month,ChartOptions,myChart);
            //myChart.hideLoading
        });
}

var data;
function count(action,type,current_year,current_month,myChart){
    var url='';
    var args = {};
    //按天来查看的时候需要传月份到后台去进行查询
    if(type==1){
        args={
            action:action,
            type:type,
            current_year : current_year,
            current_month : current_month
        }
    }
    //按周和按月进行查看的时候都只需要把年份传进去
    else{
        args={
            action:action,
            type:type,
            current_year : current_year
        }
    }

    $.ajaxSetup({async:false});
    $.postJson(url,args,function(res){
            if(res.success){
                data=res.data;
                myChart.hideLoading();
            }
            else return Tip(res.error_text);
        },
        function(){
            return Tip('网络好像不给力呢~ ( >O< ) ~！');
        });
}


function getCount(action,type,current_year,current_month,options,myChart){
    options.xAxis[0].data=[];
    options.series[0].data=[];
    options.series[1].data=[];
    options.series[2].data=[];
    myChart.clear();
    $('.detail-count').find('.item').remove();
    count(action,type,current_year,current_month,myChart);
    //解析返回的data，将其存储到前台的数组里面
    for(var i=0;i<data.length;i++){
        //按天
        var j=i+1;
        var date='';
        var time='';
        if(type==1){
            date=j+'号';
            time=current_year+'-'+current_month+'-'+j;
        }
        //按周
        else if(type==2){
            date='第'+j+'周';
            time=getWeekRange(j);
        }
        else{
            date=j+'月';
            time=current_year+'-'+j;
        }

        var totalAmount=data[i]['total'];
        var alipayAmount=data[i]['alipay'];
        var wechatAmount=data[i]['wechat'];

        var $item=$('<tr class="item"><td class="date"></td><td class="amount_total"></td><td class="amount_alipay"></td><td class="amount_wechat"></td></tr>');
        
        $item.find('.date').text(time);
        $item.find('.amount_total').text(commafy(totalAmount));
        $item.find('.amount_alipay').text(commafy(alipayAmount));
        $item.find('.amount_wechat').text(commafy(wechatAmount));
        $('.detail-count').append($item);
        
        options.xAxis[0].data.push(date);
        options.series[0].data.push(totalAmount);
        options.series[1].data.push(alipayAmount);
        options.series[2].data.push(wechatAmount);
    }
    myChart.refresh();
    myChart.setOption(options);
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
    var sReturn=sYear+'-'+sMonth+'-'+sDay+'～'+eYear+'-'+eMonth+'-'+eDay;
    return sReturn;
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
