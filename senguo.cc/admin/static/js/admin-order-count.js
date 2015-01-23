$(document).ready(function(){
    $('.change-list li').on('click',function(){
        var $this=$(this);
        $this.addClass('active').siblings('li').removeClass('active');
    });
    $('.change-list').each(function(){
        var $this=$(this);
        $this.find('li').eq(0).addClass('active');
    });
    //获取当前日期
    var current_date=new Date();
    var current_year=current_date.getFullYear();
    var current_month=current_date.getMonth()+1;
    $('.year').text(current_year);
    $('.month').text(current_month);

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
            var myChart = ec.init(document.getElementById('order_trend'));
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
                    data: ['单日总量', '按时达', '立即送', '货到付款', '余额支付']

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
                series: [
                    {
                        name: '单日总量',
                        type: 'line',
                        data: [],
                        markPoint: {
                            data: [
                                {type: 'max', name: '最大值'},
                                {type: 'min', name: '最小值'}
                            ]
                        },
                        markLine: {
                            data: [
                                {type: 'average', name: '平均值'}
                            ]
                        }
                    },
                    {
                        name: '按时达',
                        type: 'line',
                        data: [],
                        markPoint: {
                            data: [
                                {type: 'max', name: '最大值'},
                                {type: 'min', name: '最小值'}
                            ]
                        },
                        markLine: {
                            data: [
                                {type: 'average', name: '平均值'}
                            ]
                        }
                    },
                    {
                        name: '立即送',
                        type: 'line',
                        data: [],
                        markPoint: {
                            data: [
                                {type: 'max', name: '最大值'},
                                {type: 'min', name: '最小值'}
                            ]
                        },
                        markLine: {
                            data: [
                                {type: 'average', name: '平均值'}
                            ]
                        }
                    },
                    {
                        name: '货到付款',
                        type: 'line',
                        data: [],
                        markPoint: {
                            data: [
                                {type: 'max', name: '最大值'},
                                {type: 'min', name: '最小值'}
                            ]
                        },
                        markLine: {
                            data: [
                                {type: 'average', name: '平均值'}
                            ]
                        }
                    },
                    {
                        name: '余额支付',
                        type: 'line',
                        data: [],
                        markPoint: {
                            data: [
                                {type: 'max', name: '最大值'},
                                {type: 'min', name: '最小值'}
                            ]
                        },
                        markLine: {
                            data: [
                                {type: 'average', name: '平均值'}
                            ]
                        }
                    }
                ],
                color: ['#b6a2de', '#2ec7c9', '#5ab1ef', '#ffb980', '#d87a80',
                    '#8d98b3', '#e5cf0d', '#97b552', '#95706d', '#dc69aa',
                    '#07a2a4', '#9a7fd1', '#588dd5', '#f5994e', '#c05050',
                    '#59678c', '#c9ab00', '#7eb00a', '#6f5553', '#c14089']
            };
            getSum(0, 1, options, myChart);
            //月走势切换
            $('#order_trend_change li').on('click', function () {
                var $this = $(this);
                var type = $this.data('id');
                getSum(trend, type, options, myChart);

            });
            //月份切换
            $('.pre_month').on('click', function () {
                var type = $('#order_trend_change').find('.active').data('id');
                trend = trend - 1;
                getSum(trend, type, options, myChart);
                var year = Int($('.year').text());
                var month = Int($('.month').text());
                if (month == 1) {

                    $('.year').text(year - 1);
                    $('.month').text(12);
                }
                else $('.month').text(month - 1);
            });
            $('.next_month').on('click', function () {
                trend = trend + 1;
                var type = $('#order_trend_change').find('.active').data('id');
                getSum(trend, type, options, myChart);
                var year = Int($('.year').text());
                var month = Int($('.month').text());
                if (month == 12) {
                    $('.year').text(year + 1);
                    $('.month').text(1);
                }
                else $('.month').text(month + 1);
            });

            //下单时间统计
            var myChart2 = ec.init(document.getElementById('order_time'));
            myChart2.showLoading({
                text: '正在努力的读取数据中...'
            });
            myChart2.hideLoading();
            var options2={
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
                    data:['下单时间']

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
                    }
                ],
                series : [
                    {
                        name:'下单时间',
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
            getCount('order_time',0,1,options2,myChart2);
            //下单时间统计切换
            typeChange('#order_time_change ','order_time',options2,myChart2);

            //收货时间统计
            var myChart3 = ec.init(document.getElementById('receive_time'));
            myChart3.showLoading({
                text: '正在努力的读取数据中...'
            });
            myChart3.hideLoading();
            var options3={
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
                    data:['下单时间']

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
                    }
                ],
                series : [
                    {
                        name:'下单时间',
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
            getCount('recive_time',0,1,options3,myChart3);
            //下单时间统计切换
            typeChange('#receive_time_change ','recive_time',options3,myChart3);
        }
    );
});
var data;
var page_sum;
var trend=0;
var n=0;

function count(action,page,type){
    var args={
        action:action,
        page:page,
        type:type
    };
    var url='';
    $.ajaxSetup({async:false});
    $.postJson(url,args,function(res){
            if(res.success){
                data=res.data;
            }
            else return alert(res.error_text);
        },
        function(){
            return alert('网络错误！');
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

function getSum(page,type,options,myChart){
    options.xAxis[0].data=[];
    for(var j=0;j<options.series.length;j++){
        options.series[j].data=[];
    }
    myChart.clear();
    count('sum',page,type);
    for(var date in data){
        var day=date;
        var num1=data[date][1];
        var num2=data[date][2];
        var num3=data[date][3];
        var num4=data[date][4];
        var num5=data[date][5];
        options.xAxis[0].data.push(day+'号');
        options.series[0].data.push(num1);
        options.series[1].data.push(num2);
        options.series[2].data.push(num3);
        options.series[3].data.push(num4);
        options.series[4].data.push(num5);

    }
    myChart.refresh();
    myChart.setOption(options);
}

function getCount(action,page,type,options,myChart){
    options.xAxis[0].data=[];
    options.series[0].data=[];
    myChart.clear();
    count(action,page,type);
    for(var date in data){
        var day=date;
        var num=data[date];
        options.xAxis[0].data.push(day+'号');
        options.series[0].data.push(num);

    }
    myChart.refresh();
    myChart.setOption(options);

}

function typeChange(dom,action,options,mychart){
    $(dom).find('li').on('click', function () {
        var $this = $(this);
        var type = $this.data('id');
        getCount(action,0,type,options,mychart);
        console.log(dom)

    });

}