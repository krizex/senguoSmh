$(document).ready(function(){
    //获取当前日期
    $('.year').text(current_year);
    $('.month').text(current_month);
    //详细数据统计
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
                    data:['总用户','商城用户','卖家数','已绑定手机号']
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
                        name:'总用户',
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
                        name:'商城用户',
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
                        name:'卖家数',
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
                        name:'已绑定手机号',
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
        }

    );
});
var data;
var page_sum;
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

            }
            else return alert(res.error_text);
        },
        function(){
            return alert('网络错误！');
        });
}


function getcurve(i,options,myChart){
    options.xAxis[0].data=[];
    options.series[0].data=[];
    options.series[1].data=[];
    options.series[2].data=[];
    options.series[3].data=[];
    myChart.clear();
    $('.detail-count').find('.item').remove();
    count('curve',i);
    for(var d in data){
        var day_total_user=d[2];
        var shop_user=d[3];
        var saler=d[4];
        var tie_phone=d[5];
        var total_user=d[6];
        var date=d[0];
        var $item=$('<tr class="item"><td class="time"></td><td class="shop_user"></td><td class="saler"></td><td class="tie_phone"></td><td class="day_total_user"></td><td class="total_user"></td></tr>');
        $item.find('.time').text(date);
        $item.find('.day_total_user').text(day_total_user);
        $item.find('.shop_user').text(shop_user);
        $item.find('.saler').text(saler);
        $item.find('.tie_phone').text(tie_phone);
        $item.find('.total_user').text(total_user);
        $('.detail-count').append($item);
        options.xAxis[0].data.push(d[1]+'号');
        options.series[0].data.push(day_total_user);
        options.series[1].data.push(shop_user);
        options.series[2].data.push(saler);
        options.series[3].data.push(tie_phone);
    }
    myChart.refresh();
    myChart.setOption(options);
    $('.page-now').text(n+1);
    $('.page-total').text(page_sum);
}

function gettable(page){
    $('.detail-count').find('.item').remove();
    count('curve',page);
    for(var d in data){
        var day_total_user=d[2];
        var shop_user=d[3];
        var saler=d[4];
        var tie_phone=d[5];
        var total_user=d[6];
        var date=d[0];
        var $item=$('<tr class="item"><td class="time"></td><td class="shop_user"></td><td class="saler"></td><td class="tie_phone"></td><td class="day_total_user"></td><td class="total_user"></td></tr>');
        $item.find('.time').text(date);
        $item.find('.day_total_user').text(day_total_user);
        $item.find('.shop_user').text(shop_user);
        $item.find('.saler').text(saler);
        $item.find('.tie_phone').text(tie_phone);
        $item.find('.total_user').text(total_user);
        $('.detail-count').append($item);
    }
}