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
                    data:['收货时间']

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
                        name:'收货时间',
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
    //详细数据
    gettable('order_table',0,'.detail-count');
    listPage('.detail-pagination',detail_page_sum,'order_table','.detail-count');
    //购买回头率
    gettable2('order_table',0,'.detail-rate');
    listPage2('.rate-pagination',detail_page_sum,'order_table','.detail-rate');
});
var data;
var detail_page_sum;
var trend=0;
var n=0;
var m=0;

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
                if(action=='order_table'){detail_page_sum=res.page_sum;}
            }
            else return alert(res.error_text);
        },
        function(){
            return alert('网络好像不给力呢~ ( >O< ) ~！');
        });
}

function gettable(action,page,dom) {
    count(action, page);
    $(dom).find('.item').remove();
    for (var key in data) {
        var $item = $('<tr class="item"><td class="time"></td><td class="day_order"></td><td class="total_order"></td><td class="day_money"></td><td class="total_money"></td><td class="price"></td></tr>');
        var date = data[key][0];
        var day_order = data[key][1];
        var total_order = data[key][2];
        var day_money = data[key][3];
        var total_money = data[key][4];
        $item.find('.time').text(date);
        $item.find('.day_order').text(day_order);
        $item.find('.total_order').text(total_order);
        $item.find('.day_money').text(day_money + '元');
        $item.find('.total_money').text(total_money + '元');
        if (day_order == 0) $item.find('.price').text(0 + '元');
        else $item.find('.price').text(mathFloat(day_money / day_order) + '元');
        $(dom).append($item);
    }
}

function gettable2(action,page,dom){
    count(action,page);
    $(dom).find('.item').remove();
    for(var key in data){
        var $item=$('<tr class="item"><td class="time"></td><td class="new_old_order"></td><td class="total_old_order"></td><td class="new_order"></td><td class="total_order"></td><td class="back_date"></td><td class="total_date"></td></tr>');
        var date=data[key][0];
        var new_old_order=data[key][5];
        var total_old_order=data[key][6];
        var new_order=data[key][1];
        var total_order=data[key][2];
        $item.find('.time').text(date);
        $item.find('.new_old_order').text(new_old_order);
        $item.find('.total_old_order').text(total_old_order);
        $item.find('.new_order').text(new_order);
        $item.find('.total_order').text(total_order);
        if(new_old_order==0) $item.find('.back_date').text(0+'%');
        else $item.find('.back_date').text(percentNum(new_old_order,new_order));
        if(total_old_order==0) $item.find('.total_date').text(0+'%');
        else $item.find('.total_date').text(percentNum(total_old_order,total_order));
        $(dom).append($item);
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
        if(action=='order_time'||action=='recive_time') options.xAxis[0].data.push(day+'点');
        else options.xAxis[0].data.push(day+'号');
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
    });

}

function listPage(dom,page_sum,action,item){
    if(n==0){$(dom).find('.pre-page').hide();}
    if((n+1)==page_sum){
        $(dom).find('.next-page').hide();
        $(dom).find('.input-page').hide();
        $(dom).find('.jump-to').hide();
    }
    $(dom).find('.page-now').text(n+1);
    $(dom).find('.page-total').text(page_sum);

    $(dom).find('.pre-page').on('click',function(){
        n=n-1;
        if(n==0){
            $(dom).find('.pre-page').hide();
        }
        if(n>-1) {
               gettable(action,n,item);
                $(dom).find('.next-page').show();
                $(dom).find('.page-now').text(n+1);
            }
    });
    $(dom).find('.next-page').on('click',function(){
        if(n<page_sum) n=n+1;
        if(n!=page_sum){
            $(dom).find('.pre-page').show();
            $(dom).find('.page-now').text(n+1);
            gettable(action,n,item);
        }
        if(n==page_sum-1) {
            $(dom).find('.next-page').hide();
        }

    });
    $(dom).find('.jump-to').on('click',function(){
        var page=Int($(dom).find('.input-page').val());
        if(page>0){
            if(page_sum>page-1>0){
                n=page-1;
                gettable(action,page-1,item);
                $(dom).find('.pre-page').show();
                $(dom).find('.page-now').text(page);
            }
            if(page==page_sum) $(dom).find('.next-page').hide();
        }

    });
}

function listPage2(dom,page_sum,action,item){
    if(m==0){$(dom).find('.pre-page').hide();}
    if((m+1)==page_sum){
        $(dom).find('.next-page').hide();
        $(dom).find('.input-page').hide();
        $(dom).find('.jump-to').hide();
    }
    $(dom).find('.page-now').text(m+1);
    $(dom).find('.page-total').text(page_sum);

    $(dom).find('.pre-page').on('click',function(){
        m=m-1;
        if(m==0){
            $(dom).find('.pre-page').hide();
        }
        if(m>-1) {
            gettable2(action,m,item);
            $(dom).find('.next-page').show();
            $(dom).find('.page-now').text(m+1);
        }
    });
    $(dom).find('.next-page').on('click',function(){
        if(m<page_sum) m=m+1;
        if(m!=page_sum){
            $(dom).find('.pre-page').show();
            $(dom).find('.page-now').text(m+1);
            gettable2(action,m,item);
        }
        if(m==page_sum-1) {
            $(dom).find('.next-page').hide();
        }

    });
    $(dom).find('.jump-to').on('click',function(){
        var page=Int($(dom).find('.input-page').val());
        if(page>0){
            if(page_sum>page-1>0){
                m=page-1;
                gettable2(action,page-1,item);
                $(dom).find('.pre-page').show();
                $(dom).find('.page-now').text(page);
            }
            if(page==page_sum) $(dom).find('.next-page').hide();
        }

    });
}