$(document).ready(function(){
    getArea('.detail-province','province');//省份
    getArea('.detail-city','city');//城市
    //获取当前日期
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
    $('.pre-page').on('click',function(){
        n=n-1;
        if(n==0){
            $('.pre-page').hide();
        }
        if(n>-1) {
            $('.next-page').show();
            $('.page-now').text(n+1);
            gettable(-n);
        }

    });
    $('.next-page').on('click',function(){
        if(n<page_sum) {
            n = n + 1;
            if (n != page_sum) {
                $('.pre-page').show();
                $('.page-now').text(n + 1);
                gettable(-n);
            }
            if (n == page_sum - 1) {
                $('.next-page').hide();
            }
        }

    });
    $('.jump-to').on('click',function(){
        var page=Int($('.input-page').val());
        if(page>0){
            if(page_sum>page-1>0){
                n=page-1;
                $('.pre-page').show();
                $('.page-now').text(page);
                gettable(-n);
            }
            if(page==page_sum) $('.next-page').hide();
            if(page==1) $('.pre-page').hide();
        }
    });
    //店铺统计
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
                    data:['新增订单','日交易额','累计订单','累计交易额']
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
                        name:'新增订单',
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
                        name:'日交易额',
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
                        name:'累计订单',
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
                        name:'累计交易额',
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
                    '#59678c','#c9ab00','#7eb00a','#6f5553','#c14089'],
                grid: {
                    borderColor: '#eee'
                }
            };
            getnum(0,options,myChart);
            //月份切换
            $('.pre_month').on('click',function(){
                i=i-1;
                getnum(i,options,myChart);
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
                getnum(i,options,myChart);
                var year=Int($('.year').text());
                var month=Int($('.month').text());
                if(month==12)
                {
                    $('.year').text(year+1);
                    $('.month').text(1);
                }
                else $('.month').text(month+1);
            });
        }

    );
});
var data;
var page_sum;
var total;
var i=0;
var n=0;
var current_date=new Date();
var current_year=current_date.getFullYear();
var current_month=current_date.getMonth()+1;

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
                page_sum=res.page_sum;
                if(action=='province'||action=='area') total=res.total;

            }
            else return alert(res.error_text);
        },
        function(){
            return alert('网络错误！');
        });
}


function getnum(i,options,myChart){
    options.xAxis[0].data=[];
    options.series[0].data=[];
    options.series[1].data=[];
    options.series[2].data=[];
    options.series[3].data=[];
    myChart.clear();
    count('num',i);
    for(var key in data){
        var day=data[key][1];
        var new_order=data[key][2];
        var total_order=data[key][3];
        var day_money=data[key][4];
        var total_money=data[key][5];
        options.xAxis[0].data.unshift(day+'号');
        options.series[0].data.unshift(new_order);
        options.series[1].data.unshift(day_money);
        options.series[2].data.unshift(total_order);
        options.series[3].data.unshift(total_money);
    }
    myChart.refresh();
    myChart.setOption(options);
}

function gettable(page){
    $('.detail-count').find('.item').remove();
    count('num',page);
    for(var key in data){
        var date=data[key][0];
        var new_order=data[key][2];
        var day_money=data[key][3];
        var total_order=data[key][4];
        var total_money=data[key][5];
        var $item=$('<tr class="item"><td class="time"></td><td class="new_order"></td><td class="day_money"></td><td class="total_order"></td><td class="total_money"></td></tr>');
        $item.find('.time').text(date);
        $item.find('.new_order').text(new_order);
        $item.find('.day_money').text(day_money);
        $item.find('.total_order').text(total_order);
        $item.find('.total_money').text(total_money);
        $('.detail-count').append($item);
    }
    $('.page-now').text(n+1);
    $('.page-total').text(page_sum);
}

function getArea(dom,action){
    $(dom).find('.item').remove();
    count(action);
    for(var key in data){
        var area=data[key][0];
        var num=data[key][1];
        if(area=='') area='未知';
        var $item=$('<tr class="item"><td class="area"></td><td class="num"></td><td class="percent"></td></tr>');
        $item.find('.area').text(area);
        $item.find('.num').text(num);
        $item.find('.percent').text(percentNum(num,total));
        $(dom).append($item);
    }
}