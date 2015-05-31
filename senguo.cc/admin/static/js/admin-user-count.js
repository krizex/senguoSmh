$(document).ready(function(){
    //获取当前日期
    var current_date=new Date();
    var current_year=current_date.getFullYear();
    var current_month=current_date.getMonth()+1;
    $('.year').text(current_year);
    $('.month').text(current_month);
    //详细数据统计
    gettable(0);
    if(n==0){$('.pre-page').hide();}
    if((n+1)==page_sum){
        $('.next-page').hide();
        $('.input-page').hide();
        $('.jump-to').hide();
    }
    $('.page-now').text(n+1);
    $('.page-total').text(page_sum);
    $('.pre-page').on('click',function(){
        n=n-1;
        if(n==0){
            $('.pre-page').hide();
        }
        if(n>-1) {
            gettable(n);
            $('.next-page').show();
            $('.page-now').text(n+1);
        }
    });
    $('.next-page').on('click',function(){
        if(n<page_sum){
            n=n+1;
            if(n!=page_sum){
                $('.pre-page').show();
                $('.page-now').text(n+1);
                gettable(n);
            }
            if(n==page_sum-1) {
                $('.next-page').hide();
            }
        }


    });
    $('.jump-to').on('click',function(){
        var page=Int($('.input-page').val());
        if(page>0){
            if(page_sum>page-1>0){
                n=page-1;
                gettable(page);
                $('.pre-page').show();
                $('.page-now').text(page);
            }
            if(page==page_sum) $('.next-page').hide();
        }

    });
    //新增用户统计
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
            var myChart = ec.init(document.getElementById('user_trend'));
            myChart.showLoading({
                text: '正在努力的读取数据中...'
            });
            count('curve',0);
            myChart.hideLoading();
            var options={
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
                legend: {
                    data:['新增用户']
                },
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
                    },
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
                        name:'新增用户',
                        type:'bar',
                        data:[]
                    },
                ],
                color: ['#b6a2de','#2ec7c9','#5ab1ef','#ffb980','#d87a80',
                    '#8d98b3','#e5cf0d','#97b552','#95706d','#dc69aa',
                    '#07a2a4','#9a7fd1','#588dd5','#f5994e','#c05050',
                    '#59678c','#c9ab00','#7eb00a','#6f5553','#c14089'],
                grid: {
                    borderColor: '#eee'
                }
            };
            getcurve(0,options,myChart);
            //月份切换
            $('.pre_month').on('click',function(){
                i=i-1;
                getcurve(i,options,myChart);
                var year=Int($('.year').text());
                var month=Int($('.month').text());
                if(month==1)
                {

                    $('.year').text(year-1);
                    $('.month').text(12);
                }
                else $('.month').text(month-1);
            });
            $('.next_month').on('click',function(){
                i=i+1;
                getcurve(i,options,myChart);
                var year=Int($('.year').text());
                var month=Int($('.month').text());
                if(month==12)
                {
                    $('.year').text(year+1);
                    $('.month').text(1);
                }
                else $('.month').text(month+1);
            });

            //性别统计
            var myChart2 = ec.init(document.getElementById('user_sex'));
            myChart2.showLoading({
                text: '正在努力的读取数据中...'
            });
            count('sex',0);
            myChart2.hideLoading();
            var options2={
                title : {
                    text: '用户性别',
                    x:'center'
                },
                tooltip : {
                    trigger: 'item',
                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                },
                legend: {
                    orient : 'vertical',
                    x : 'left',
                    data:['男','女','未知']
                },
                toolbox: {
                    show : true,
                    feature : {
                        mark : {show: true},
                        magicType : {
                            show: true,
                            type: ['pie'],
                            option: {
                                funnel: {
                                    x: '25%',
                                    width: '50%',
                                    funnelAlign: 'left',
                                    max: 1548
                                }
                            }
                        },
                        restore : {show: true},
                        saveAsImage : {show: true}
                    }
                },
                calculable : true,
                series : [
                    {
                        name:'访问来源',
                        type:'pie',
                        radius : '55%',
                        center: ['50%', '60%'],
                        data:[
                            {value:male_sum, name:'男'},
                            {value:female_sum, name:'女'},
                            {value:unknow_sex, name:'未知'},
                        ]
                    }
                ],
                color: ['#b6a2de','#2ec7c9','#5ab1ef','#ffb980','#d87a80',
                    '#8d98b3','#e5cf0d','#97b552','#95706d','#dc69aa',
                    '#07a2a4','#9a7fd1','#588dd5','#f5994e','#c05050',
                    '#59678c','#c9ab00','#7eb00a','#6f5553','#c14089']
            };
            myChart2.setOption(options2);
        }
    );
});
var data;
var female_sum;
var male_sum;
var total_sex;
var unknow_sex;
var page_sum;
var i=0;
var n=0;

function count(action,page){
    var args={
        action:action,
        page:page
    };
    var url='';
    $.ajaxSetup({async:false});
    $.postJson(url,args,function(res){
            if(res.success){
                data=res.data;
                if(action=='sex'){
                    female_sum=res.female_sum;
                    male_sum=res.male_sum;
                    total_sex=res.total;
                    unknow_sex=(total_sex-male_sum-female_sum);
                }
                if(action=='table'){
                    page_sum=res.page_sum;
                }
            }
            else return alert(res.error_text);
        },
        function(){
            return alert('网络好像不给力呢~ ( >O< ) ~！');
        });
}

function gettable(page){
    count('table',page);
    $('.detail-count').find('.item').remove();
    for(var key in data){
        var $item=$('<tr class="item"><td class="time"></td><td class="new_user"></td><td class="total_user"></td></tr>');
        var date=data[key][0];
        var new_user=data[key][1];
        var total=data[key][2];
        $item.find('.time').text(date);
        $item.find('.new_user').text(new_user);
        $item.find('.total_user').text(total);
        $('.detail-count').append($item);
    }
}

function getcurve(i,options,myChart){
    options.xAxis[0].data=[];
    options.series[0].data=[];
    myChart.clear();
    count('curve',i);
    for(var date in data){
        var day=date;
        var num=data[date];
        options.xAxis[0].data.push(day+'号');
        options.series[0].data.push(num);
    }
    myChart.refresh();
    myChart.setOption(options);
}