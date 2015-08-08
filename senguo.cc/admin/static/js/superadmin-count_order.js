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
        function (ec) {
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
                // legend: {
                //     data:['下单时间']

                // },
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
            getCount('order_time',0,1,options2,myChart2);

            //下单时间统计切换
            typeChange('#order_time_change','order_time',options2,myChart2);

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
                // legend: {
                //     data:['送达时间']

                // },
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
                        name:'送达订单个数',
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
            getCount('receive_time',0,1,options3,myChart3);
            //收货时间统计切换
            typeChange('#receive_time_change','receive_time',options3,myChart3); 
        }
    );
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
            }
            else return Tip(res.error_text);
        },
        function(){
            return Tip('网络好像不给力呢~ ( >O< ) ~！');
        });
}


function getCount(action,page,type,options,myChart){

    options.xAxis[0].data=[];
    options.series[0].data=[];
    myChart.clear();
    count(action,page,type);

    for(var data_e in data){
        var clock=data_e;
        var num=data[data_e];
        if(action=='order_time'||action=='receive_time') options.xAxis[0].data.push(clock+'点');
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