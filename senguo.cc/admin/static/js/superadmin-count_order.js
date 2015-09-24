//获取当前日期
var CurrentDate=new Date();
var current_year=CurrentDate.getFullYear();
var current_month=CurrentDate.getMonth()+1;
var current_date = CurrentDate.getDate();

var ChooseDate1 = CurrentDate;
var choose_year1 = current_year;
var choose_month1 = current_month;
var choose_date1 = current_date;
var current_sort_way1 = 1;  //当前的排列方式  1:按日排,2:按周排,3:按月排，默认为按日排

var ChooseDate2 = CurrentDate;
var choose_year2 = current_year;
var choose_month2 = current_month;
var choose_date2 = current_date;
var current_sort_way2 = 1;  

$(document).ready(function(){
    initCharts();
}).on('click','.sell-change-list1 li',function(){
    liveInit();
    $(".year1").text(current_year);
    $(".month1").text(current_month);
    $(".date1").text(current_date);

    var $this = $(this);
    $this.addClass('active').siblings('li').removeClass('active');
}).on('click','.sort-date1',function(){
    $(".choose-change1").removeClass("hidden");
    current_sort_way1 = 1;
    liveInit();
    ChooseDate1 = CurrentDate;

    $('.week-span1').hide();
    $(".year-span1").show();
    $(".month-span1").show();
    $(".date-span1").show();
    // show_chart('type',CurrentDate,CurrentDate);
    show_chart("order_time",2,CurrentDate,CurrentDate);
}).on('click','.sort-week1',function(){
    $(".choose-change1").removeClass("hidden");
    current_sort_way1 = 2;
    liveInit();
    ChooseDate1 = CurrentDate;
    var week_first_date = getWeekFirstDate(CurrentDate);
    var week_last_date = GetDateN(week_first_date,6);
    $(".week-month1").text(week_first_date.getMonth()+1);
    $(".week-date1").text(week_first_date.getDate());
    $(".week-month1-2").text(week_last_date.getMonth()+1);
    $(".week-date1-2").text(week_last_date.getDate());

    $(".month-span1").hide();
    $(".date-span1").hide();

    $(".year-span1").show();
    $(".week-span1").removeClass("hidden").show();

    // show_chart('type',week_first_date,week_last_date);
    show_chart("order_time",2,week_first_date,week_last_date);
}).on('click','.sort-month1',function(){
    $(".choose-change1").removeClass("hidden");
    current_sort_way1 = 3;
    liveInit();
    ChooseDate1 = CurrentDate;

    $(".date-span1").hide();
    $(".week-span1").hide();

    $(".year-span1").show();
    $(".month-span1").show();

    var start_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),1);
    var end_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),getLastDayOfMonth(CurrentDate.getMonth()+1,CurrentDate.getFullYear()))
    // show_chart('type',start_date,end_date);
    show_chart("order_time",2,start_date,end_date);
}).on("click",".sort-all1",function(){
    $(".choose-change1").addClass("hidden");
    show_chart("order_time",1,CurrentDate,CurrentDate);
}).on("click",".pre-item1",function(){
    switch(current_sort_way1){
        case 1:
            ChooseDate1 = GetDateN(ChooseDate1,-1);
            choose_year1=ChooseDate1.getFullYear();
            choose_month1=ChooseDate1.getMonth()+1;
            choose_date1 = ChooseDate1.getDate();

            $(".year1").text(choose_year1);
            $(".month1").text(choose_month1);
            $(".date1").text(choose_date1);

            // show_chart('type',ChooseDate1,ChooseDate1);
            show_chart("order_time",2,ChooseDate1,ChooseDate1);
            break;
        case 2:
            ChooseDate1 = GetDateN(ChooseDate1,-7);
            choose_year1=ChooseDate1.getFullYear();

            var week_first_date = getWeekFirstDate(ChooseDate1);
            var week_last_date = GetDateN(week_first_date,6);

            $(".week-month1").text(week_first_date.getMonth()+1);
            $(".week-date1").text(week_first_date.getDate());
            $(".week-month1-2").text(week_last_date.getMonth()+1);
            $(".week-date1-2").text(week_last_date.getDate());

            $(".year1").text(choose_year1);

            // show_chart('type',week_first_date,week_last_date);
            show_chart("order_time",2,week_first_date,week_last_date);
            break;
        case 3:
            ChooseDate1 = new Date(ChooseDate1.getFullYear(),ChooseDate1.getMonth()-1,ChooseDate1.getDate());
            choose_year1=ChooseDate1.getFullYear();
            choose_month1=ChooseDate1.getMonth()+1;
            choose_date1 = ChooseDate1.getDate();

            $(".year1").text(choose_year1);
            $(".month1").text(choose_month1);

            var start_date = new Date(choose_year1,choose_month1-1,1);
            var end_date = new Date(choose_year1,choose_month1-1,getLastDayOfMonth(choose_month1,choose_year1))
            // show_chart('type',start_date,end_date);
             show_chart("order_time",2,start_date,end_date);

            break;
    }
}).on("click",".next-item1",function(){
    choose_year1=ChooseDate1.getFullYear();
    choose_month1=ChooseDate1.getMonth()+1;
    choose_date1 = ChooseDate1.getDate();
    switch(current_sort_way1){
        case 1:
            ChooseDate1 = GetDateN(ChooseDate1,1);
            choose_year1=ChooseDate1.getFullYear();
            choose_month1=ChooseDate1.getMonth()+1;
            choose_date1 = ChooseDate1.getDate();

            $(".year1").text(choose_year1);
            $(".month1").text(choose_month1);
            $(".date1").text(choose_date1);
            // show_chart('type',ChooseDate1,ChooseDate1);
            show_chart("order_time",2,ChooseDate1,ChooseDate1);
            break;
        case 2:
            ChooseDate1 = GetDateN(ChooseDate1,7);
            choose_year1=ChooseDate1.getFullYear();

            var week_first_date = getWeekFirstDate(ChooseDate1);
            var week_last_date = GetDateN(week_first_date,6);

            $(".week-month1").text(week_first_date.getMonth()+1);
            $(".week-date1").text(week_first_date.getDate());
            $(".week-month1-2").text(week_last_date.getMonth()+1);
            $(".week-date1-2").text(week_last_date.getDate());
            $(".year1").text(choose_year1);
            // show_chart('type',week_first_date,week_last_date);
            show_chart("order_time",2,week_first_date,week_last_date);
            break;
        case 3:
            ChooseDate1 = new Date(ChooseDate1.getFullYear(),ChooseDate1.getMonth()+1,ChooseDate1.getDate());
            choose_year1=ChooseDate1.getFullYear();
            choose_month1=ChooseDate1.getMonth()+1;
            choose_date1 = ChooseDate1.getDate();

            $(".year1").text(choose_year1);
            $(".month1").text(choose_month1);

            var start_date = new Date(choose_year1,choose_month1-1,1);
            var end_date = new Date(choose_year1,choose_month1-1,getLastDayOfMonth(choose_month1,choose_year1))
            // show_chart('type',start_date,end_date);
            show_chart("order_time",2,start_date,end_date);
            break;
    }
}).on('click','.sell-change-list2 li',function(){
    liveInit();
    $(".year2").text(current_year);
    $(".month2").text(current_month);
    $(".date2").text(current_date);

    var $this = $(this);
    $this.addClass('active').siblings('li').removeClass('active');
}).on('click','.sort-date2',function(){
    $(".choose-change2").removeClass("hidden");
    current_sort_way2 = 1;
    liveInit();
    ChooseDate2 = CurrentDate;

    $('.week-span2').hide();
    $(".year-span2").show();
    $(".month-span2").show();
    $(".date-span2").show();
    // show_chart('type',CurrentDate,CurrentDate);
    show_chart("receive_time",2,CurrentDate,CurrentDate);
}).on('click','.sort-week2',function(){
    $(".choose-change2").removeClass("hidden");
    current_sort_way2 = 2;
    liveInit();
    ChooseDate2 = CurrentDate;
    var week_first_date = getWeekFirstDate(CurrentDate);
    var week_last_date = GetDateN(week_first_date,6);
    $(".week-month2").text(week_first_date.getMonth()+1);
    $(".week-date2").text(week_first_date.getDate());
    $(".week-month2-2").text(week_last_date.getMonth()+1);
    $(".week-date2-2").text(week_last_date.getDate());

    $(".month-span2").hide();
    $(".date-span2").hide();

    $(".year-span2").show();
    $(".week-span2").removeClass("hidden").show();

    // show_chart('type',week_first_date,week_last_date);
    show_chart("receive_time",2,week_first_date,week_last_date);
}).on('click','.sort-month2',function(){
    $(".choose-change2").removeClass("hidden");
    current_sort_way2 = 3;
    liveInit();
    ChooseDate2 = CurrentDate;

    $(".date-span2").hide();
    $(".week-span2").hide();

    $(".year-span2").show();
    $(".month-span2").show();

    var start_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),1);
    var end_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),getLastDayOfMonth(CurrentDate.getMonth()+1,CurrentDate.getFullYear()))
    // show_chart('type',start_date,end_date);
    show_chart("receive_time",2,start_date,end_date);
}).on("click",".sort-all2",function(){
    $(".choose-change2").addClass("hidden");
    show_chart("receive_time",1,CurrentDate,CurrentDate);
}).on("click",".pre-item2",function(){
    switch(current_sort_way2){
        case 1:
            ChooseDate2 = GetDateN(ChooseDate2,-1);
            choose_year2=ChooseDate2.getFullYear();
            choose_month2=ChooseDate2.getMonth()+1;
            choose_date2 = ChooseDate2.getDate();

            $(".year2").text(choose_year2);
            $(".month2").text(choose_month2);
            $(".date2").text(choose_date2);

            // show_chart('type',ChooseDate1,ChooseDate1);
            show_chart("receive_time",2,ChooseDate2,ChooseDate2);
            break;
        case 2:
            ChooseDate2 = GetDateN(ChooseDate2,-7);
            choose_year2=ChooseDate2.getFullYear();

            var week_first_date = getWeekFirstDate(ChooseDate2);
            var week_last_date = GetDateN(week_first_date,6);

            $(".week-month2").text(week_first_date.getMonth()+1);
            $(".week-date2").text(week_first_date.getDate());
            $(".week-month2-2").text(week_last_date.getMonth()+1);
            $(".week-date2-2").text(week_last_date.getDate());

            $(".year2").text(choose_year2);

            // show_chart('type',week_first_date,week_last_date);
            show_chart("receive_time",2,week_first_date,week_last_date);
            break;
        case 3:
            ChooseDate2 = new Date(ChooseDate2.getFullYear(),ChooseDate2.getMonth()-1,ChooseDate2.getDate());
            choose_year2=ChooseDate2.getFullYear();
            choose_month2=ChooseDate2.getMonth()+1;
            choose_date2 = ChooseDate2.getDate();

            $(".year2").text(choose_year2);
            $(".month2").text(choose_month2);

            var start_date = new Date(choose_year2,choose_month2-1,1);
            var end_date = new Date(choose_year2,choose_month2-1,getLastDayOfMonth(choose_month2,choose_year2))
            // show_chart('type',start_date,end_date);
             show_chart("receive_time",2,start_date,end_date);

            break;
    }
}).on("click",".next-item2",function(){
    choose_year2=ChooseDate2.getFullYear();
    choose_month2=ChooseDate2.getMonth()+1;
    choose_date2 = ChooseDate2.getDate();
    switch(current_sort_way2){
        case 1:
            ChooseDate2 = GetDateN(ChooseDate2,1);
            choose_year2=ChooseDate2.getFullYear();
            choose_month2=ChooseDate2.getMonth()+1;
            choose_date2 = ChooseDate2.getDate();

            $(".year2").text(choose_year2);
            $(".month2").text(choose_month2);
            $(".date2").text(choose_date2);
            // show_chart('type',ChooseDate1,ChooseDate1);
            show_chart("receive_time",2,ChooseDate2,ChooseDate2);
            break;
        case 2:
            ChooseDate2 = GetDateN(ChooseDate2,7);
            choose_year2=ChooseDate2.getFullYear();

            var week_first_date = getWeekFirstDate(ChooseDate2);
            var week_last_date = GetDateN(week_first_date,6);

            $(".week-month2").text(week_first_date.getMonth()+1);
            $(".week-date2").text(week_first_date.getDate());
            $(".week-month2-2").text(week_last_date.getMonth()+1);
            $(".week-date2-2").text(week_last_date.getDate());
            $(".year2").text(choose_year2);
            // show_chart('type',week_first_date,week_last_date);
            show_chart("receive_time",2,week_first_date,week_last_date);
            break;
        case 3:
            ChooseDate2 = new Date(ChooseDate2.getFullYear(),ChooseDate2.getMonth()+1,ChooseDate2.getDate());
            choose_year2=ChooseDate2.getFullYear();
            choose_month2=ChooseDate2.getMonth()+1;
            choose_date2 = ChooseDate2.getDate();

            $(".year2").text(choose_year2);
            $(".month2").text(choose_month2);

            var start_date = new Date(choose_year2,choose_month2-1,1);
            var end_date = new Date(choose_year2,choose_month2-1,getLastDayOfMonth(choose_month2,choose_year2))
            // show_chart('type',start_date,end_date);
            show_chart("receive_time",2,start_date,end_date);
            break;
    }
})

function initCharts(){
    $(".year1").text(current_year);
    $(".month1").text(current_month);
    $(".date1").text(current_date);

    $(".year2").text(current_year);
    $(".month2").text(current_month);
    $(".date2").text(current_date);

    $(".sell-change-list1").each(function(){
        var $this = $(this);
        $this.find("li").eq(3).addClass("active");
    });

    $(".sell-change-list2").each(function(){
        var $this = $(this);
        $this.find("li").eq(3).addClass("active");
    });

    show_chart("order_time",1,CurrentDate,CurrentDate);
     show_chart("receive_time",1,CurrentDate,CurrentDate);
    
}

// 实时更新函数
function liveInit(){
    CurrentDate=new Date();
    current_year=CurrentDate.getFullYear();
    current_month=CurrentDate.getMonth()+1;
    current_date = CurrentDate.getDate();
}

function getDateStr(date){
    var y = date.getFullYear();
    var m = (date.getMonth()+1)<10?"0"+(date.getMonth()+1):(date.getMonth()+1);//获取当前月份的日期，不足10补0
    var d = date.getDate()<10?"0"+date.getDate():date.getDate(); //获取当前几号，不足10补0
    var str = y+"-"+m+"-"+d;
    return str;
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

//获取当前指定日期所在周数的周的第一天的日期
function getWeekFirstDate(date){
    var pre_date = GetDateN(date,-1);
    while(pre_date.getDay() != 1){
        pre_date = GetDateN(pre_date,-1);
    }
    return pre_date;
}

//获取当前指定日期所在周数的周的最后一天的日期
function getWeekLastDate(date){
    var next_date = GetDateN(date,1);
    while(next_date.getDay() != 0){
        next_date = GetDateN(next_date,1);
    }
    return next_date;
}

function getLastDayOfMonth(month,year){
    if(month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12){
        return 31;
    }
    else if(month == 4 || month == 6 || month == 9 || month == 11){
        return 30;
    }
    else{
        if((year % 4 == 0 && year % 100 != 0)||(year % 400 == 0)){
            return 29;
        }
        else return 28;
    }
}


function show_chart(action,type,start_date,end_date){

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
                        name:'下单个数',
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
                    }
                ],
                color: ['#b6a2de','#2ec7c9','#5ab1ef','#ffb980','#d87a80',
                    '#8d98b3','#e5cf0d','#97b552','#95706d','#dc69aa',
                    '#07a2a4','#9a7fd1','#588dd5','#f5994e','#c05050',
                    '#59678c','#c9ab00','#7eb00a','#6f5553','#c14089']
            };
            getCount(action,type,start_date,end_date,ChartOptions,myChart);
            myChart.hideLoading
        });
}

var data;
function count(action,type,start_date,end_date,myChart){
    var url='';
    var args = {};
    if (type == 1){
        args={
            action:action,
            type:type,
        }
    }
    else{
        args={
            action:action,
            type:type,
            start_date : getDateStr(start_date),
            end_date : getDateStr(end_date)
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


function getCount(action,type,start_date,end_date,options,myChart){
    options.xAxis[0].data=[];
    options.series[0].data=[];
    myChart.clear();
    count(action,type,start_date,end_date,myChart);

    for(var data_e in data){
        var clock=data_e;
        var num=data[data_e];
        if(action=='order_time'||action=='receive_time') options.xAxis[0].data.push(clock+'点');
        options.series[0].data.push(num);
    }
    myChart.refresh();
    myChart.setOption(options);
}
