// created by jyj 2015-7-8

//获取当前日期
var CurrentDate=new Date();
var current_year=CurrentDate.getFullYear();
var current_month=CurrentDate.getMonth()+1;
var current_date = CurrentDate.getDate();
var current_week = WeekNumOfYear(CurrentDate);

var ChooseDate = CurrentDate;
var choose_year = current_year;
var choose_month = current_month;
var choose_date = current_date;
var choose_week = current_week;

var ChooseDate2 = CurrentDate;
var choose_year2 = current_year;
var choose_month2 = current_month;
var choose_date2 = current_date;
var choose_week2 = current_week;

var current_sort_way = 1;  //当前的排列方式  1:按日排,2:按周排,3:按月排，默认为按日排
var current_sort_way2 = 1;

$(document).ready(function(){
	initCharts();
}).on("click",".sell-change-list li",function(){
	liveInit();
	$(".year").text(current_year);
	$(".month").text(current_month);
	$(".date").text(current_date);
	$(".week").text(current_week);

	var $this = $(this);
	$this.addClass("active").siblings("li").removeClass("active");
}).on("click",".sort-date",function(){
	current_sort_way = 1;
	liveInit();
	ChooseDate = CurrentDate;
	$(".week-span").hide();

	$(".year-span").show();
	$(".month-span").show();
	$(".date-span").show();

}).on("click",".sort-week",function(){
	current_sort_way = 2;
	liveInit();
	ChooseDate = CurrentDate;
	var week_first_date = getWeekFirstDate(CurrentDate);
	var week_last_date = getWeekLastDate(CurrentDate);

	$(".week-month1").text(week_first_date.getMonth()+1);
	$(".week-date1").text(week_first_date.getDate());
	$(".week-month2").text(week_last_date.getMonth()+1);
	$(".week-date2").text(week_last_date.getDate());
	$(".week").text(WeekNumOfYear(ChooseDate));
	$(".month-span").hide();
	$(".date-span").hide();
	$(".year-span").show();
	$(".week-span").removeClass("hidden").show();

}).on("click",".sort-month",function(){
	current_sort_way = 3;
	liveInit();
	ChooseDate = CurrentDate;

	$(".date-span").hide();
	$(".week-span").hide();

	$(".year-span").show();
	$(".month-span").show();

}).on("click",".pre-item",function(){
	switch(current_sort_way){
		case 1:
			ChooseDate = GetDateN(ChooseDate,-1);
			choose_year=ChooseDate.getFullYear();
			choose_month=ChooseDate.getMonth()+1;
			choose_date = ChooseDate.getDate();

			$(".year").text(choose_year);
			$(".month").text(choose_month);
			$(".date").text(choose_date);
			break;
		case 2:
			ChooseDate = GetDateN(ChooseDate,-7);
			choose_year=ChooseDate.getFullYear();
			choose_week = WeekNumOfYear(ChooseDate);

			var week_first_date = getWeekFirstDate(ChooseDate);
			var week_last_date = getWeekLastDate(ChooseDate);

			$(".week-month1").text(week_first_date.getMonth()+1);
			$(".week-date1").text(week_first_date.getDate());
			$(".week-month2").text(week_last_date.getMonth()+1);
			$(".week-date2").text(week_last_date.getDate());

			$(".year").text(choose_year);
			$(".week").text(choose_week);
			break;
		case 3:
			if(choose_month == 1){
				choose_month = 12;
				choose_year = choose_year-1;
			}
			else{
				choose_month=choose_month-1;
			}
						
			$(".year").text(choose_year);
			$(".month").text(choose_month);
			break;
	}
}).on("click",".next-item",function(){
	switch(current_sort_way){
		case 1:
			ChooseDate = GetDateN(ChooseDate,1);
			choose_year=ChooseDate.getFullYear();
			choose_month=ChooseDate.getMonth()+1;
			choose_date = ChooseDate.getDate();

			$(".year").text(choose_year);
			$(".month").text(choose_month);
			$(".date").text(choose_date);
			break;
		case 2:
			ChooseDate = GetDateN(ChooseDate,7);
			choose_year=ChooseDate.getFullYear();
			choose_week = WeekNumOfYear(ChooseDate);

			var week_first_date = getWeekFirstDate(ChooseDate);
			var week_last_date = getWeekLastDate(ChooseDate);

			$(".week-month1").text(week_first_date.getMonth()+1);
			$(".week-date1").text(week_first_date.getDate());
			$(".week-month2").text(week_last_date.getMonth()+1);
			$(".week-date2").text(week_last_date.getDate());
			$(".year").text(choose_year);
			$(".week").text(choose_week);
			break;
		case 3:
			if(choose_month == 12){
				choose_month = 1;
				choose_year = choose_year+1;
			}
			else{
				choose_month=choose_month+1;
			}
						
			$(".year").text(choose_year);
			$(".month").text(choose_month);
			break;
	}
}).on("click",".sell-change-list2 li",function(){
	liveInit();
	$(".year2").text(current_year);
	$(".month2").text(current_month);
	$(".date2").text(current_date);
	$(".week2").text(current_week);

	var $this = $(this);
	$this.addClass("active").siblings("li").removeClass("active");
}).on("click",".sort-date2",function(){
	current_sort_way2 = 1;
	liveInit();
	ChooseDate2 = CurrentDate;
	$(".week-span2").hide();

	$(".year-span2").show();
	$(".month-span2").show();
	$(".date-span2").show();

}).on("click",".sort-week2",function(){
	current_sort_way2 = 2;
	liveInit();
	ChooseDate2 = CurrentDate;
	var week_first_date = getWeekFirstDate(CurrentDate);
	var week_last_date = getWeekLastDate(CurrentDate);

	$(".week-month12").text(week_first_date.getMonth()+1);
	$(".week-date12").text(week_first_date.getDate());
	$(".week-month22").text(week_last_date.getMonth()+1);
	$(".week-date22").text(week_last_date.getDate());
	$(".week2").text(WeekNumOfYear(ChooseDate2));
	$(".month-span2").hide();
	$(".date-span2").hide();
	$(".year-span2").show();
	$(".week-span2").removeClass("hidden").show();

}).on("click",".sort-month2",function(){
	current_sort_way2 = 3;
	liveInit();
	ChooseDate2 = CurrentDate;

	$(".date-span2").hide();
	$(".week-span2").hide();

	$(".year-span2").show();
	$(".month-span2").show();

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
			break;
		case 2:
			ChooseDate2 = GetDateN(ChooseDate2,-7);
			choose_year2=ChooseDate2.getFullYear();
			choose_week2 = WeekNumOfYear(ChooseDate2);

			var week_first_date = getWeekFirstDate(ChooseDate2);
			var week_last_date = getWeekLastDate(ChooseDate2);

			$(".week-month12").text(week_first_date.getMonth()+1);
			$(".week-date12").text(week_first_date.getDate());
			$(".week-month22").text(week_last_date.getMonth()+1);
			$(".week-date22").text(week_last_date.getDate());

			$(".year2").text(choose_year2);
			$(".week2").text(choose_week2);
			break;
		case 3:
			if(choose_month2 == 1){
				choose_month2 = 12;
				choose_year2 = choose_year2-1;
			}
			else{
				choose_month2=choose_month2-1;
			}
						
			$(".year2").text(choose_year2);
			$(".month2").text(choose_month2);
			break;
	}
}).on("click",".next-item2",function(){
	switch(current_sort_way2){
		case 1:
			ChooseDate2 = GetDateN(ChooseDate2,1);
			choose_year2=ChooseDate2.getFullYear();
			choose_month2=ChooseDate2.getMonth()+1;
			choose_date2 = ChooseDate2.getDate();

			$(".year2").text(choose_year2);
			$(".month2").text(choose_month2);
			$(".date2").text(choose_date2);
			break;
		case 2:
			ChooseDate2 = GetDateN(ChooseDate2,7);
			choose_year2=ChooseDate2.getFullYear();
			choose_week2 = WeekNumOfYear(ChooseDate2);

			var week_first_date = getWeekFirstDate(ChooseDate2);
			var week_last_date = getWeekLastDate(ChooseDate2);

			$(".week-month12").text(week_first_date.getMonth()+1);
			$(".week-date12").text(week_first_date.getDate());
			$(".week-month22").text(week_last_date.getMonth()+1);
			$(".week-date22").text(week_last_date.getDate());
			$(".year2").text(choose_year2);
			$(".week2").text(choose_week2);
			break;
		case 3:
			if(choose_month2 == 12){
				choose_month2 = 1;
				choose_year2 = choose_year2+1;
			}
			else{
				choose_month2=choose_month2+1;
			}
						
			$(".year2").text(choose_year2);
			$(".month2").text(choose_month2);
			break;
	}
});

// 实时更新函数
function liveInit(){
	CurrentDate=new Date();
	current_year=CurrentDate.getFullYear();
	current_month=CurrentDate.getMonth()+1;
	current_date = CurrentDate.getDate();
	current_week = WeekNumOfYear(CurrentDate);
}

function initCharts(){
	liveInit();

	$(".year").text(current_year);
	$(".month").text(current_month);
	$(".date").text(current_date);

	$(".year2").text(current_year);
	$(".month2").text(current_month);
	$(".date2").text(current_date);

	$(".sell-change-list").each(function(){
		var $this = $(this);
		$this.find("li").eq(0).addClass("active");
	});

	$(".sell-change-list2").each(function(){
		var $this = $(this);
		$this.find("li").eq(0).addClass("active");
	});

	goods_type_chart(current_sort_way,CurrentDate,CurrentDate);
	// goods_name_chart();
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
	var now_week = WeekNumOfYear(date);
	var pre_date = GetDateN(date,-1);
	while(pre_date.getDay() != 1){
		pre_date = GetDateN(pre_date,-1);
	}
	return pre_date;
}

//获取当前指定日期所在周数的周的最后一天的日期
function getWeekLastDate(date){
	var now_week = WeekNumOfYear(date);
	var next_date = GetDateN(date,1);
	while(next_date.getDay() != 0){
		next_date = GetDateN(next_date,1);
	}
	return next_date;
}

function WeekNumOfYear(date) {   
	var yy = date.getFullYear();
	var day = date.getDay();

	var date0 = new Date(yy,0,1);
	var date_diff = DateDiff(date,date0);
	if(date_diff < 7-day){
		week_num = 1;
	}
	else{
		var week_num = Math.ceil((date_diff-(7-day))/7)+1;
	}

	return week_num + 1;
}

 //计算天数差的函数，通用  
function  DateDiff(sDate1,  sDate2){    
	var  oDate1,  oDate2,  iDays ;
	var dd1,dd2,mm1,mm2,yy1,yy2;
	dd1 = sDate1.getDate();
	mm1 = sDate1.getMonth();
	yy1 = sDate1.getFullYear();
	dd2 = sDate2.getDate();
	mm2 = sDate2.getMonth();
	yy2 = sDate2.getFullYear();

	oDate1  =  new  Date(yy1,mm1,dd1) ;   
	oDate2  =  new  Date(yy2,mm2,dd2) ; 
	iDays  =  parseInt(Math.abs(oDate1  -  oDate2)/1000/60/60/24);    //把相差的毫秒数转换为天数  
	return  iDays;  
}    

function goods_type_chart(type,start_date,end_date){
	// require.config({
	//        	paths: {
	//             		echarts:'/static/js'
	//         	}
	// });
	// require(
	//              [
	// 	            'echarts',
	// 	            'echarts/chart/bar',
	// 	            'echarts/chart/line',
	// 	            'echarts/chart/pie'
	//              ],
	//               //按商品类目排序
 //        		function (ec) {
 //            		            var myChart = ec.init(document.getElementById('goods_type'));
 //            		            myChart.showLoading({
 //                	            		text: '正在努力的读取数据中...'
 //            			});
 //            			myChart.hideLoading();
 //            			var options = {
 //            				    title : {
	// 			        	        subtext: '数值单位：元',
	// 			        	        x:'center',
	// 			        	        subtextStyle: {
	// 				            		color: '#000'          // 副标题文字颜色
	// 				        }
	// 			    },
	// 			    tooltip : {
	// 				        trigger: 'axis',
	// 				        axisPointer : {            // 坐标轴指示器，坐标轴触发有效
	// 				            type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
	// 				        }
	// 			    },
	// 			    toolbox: {
	// 				        show : true,
	// 				        feature : {
	// 				            mark : {show: true},
	// 				            magicType : {show: true, type: []},
	// 				            restore : {show: true},
	// 				            saveAsImage : {show: true}
	// 				        }
	// 			    },
	// 			    calculable : true,
	// 			    xAxis : [
	// 				        {
	// 				            show : false,	
	// 				            type : 'value'
	// 				        }
	// 			    ],
	// 			    yAxis : [
	// 				        {
	// 				            type : 'category',
	// 				            data : ['火龙果','葡萄','梨子','西瓜','苹果']
	// 				        }
	// 			    ],
	// 			    series : [
	// 				        {
	// 				            name:'直接访问',
	// 				            type:'bar',
	// 				            stack: '总量',
	// 				            itemStyle : { normal: {label : {show: true, position: 'insideRight'}}},
	// 				            data:[320, 302, 301, 334, 390, 330, 320]
	// 				        },
	// 				        {
	// 				            name:'邮件营销',
	// 				            type:'bar',
	// 				            stack: '总量',
	// 				            itemStyle : { normal: {label : {show: true, position: 'insideRight'}}},
	// 				            data:[120, 132, 101, 134, 90, 230, 210]
	// 				        },
	// 				        {
	// 				            name:'联盟广告',
	// 				            type:'bar',
	// 				            stack: '总量',
	// 				            itemStyle : { normal: {label : {show: true, position: 'insideRight'}}},
	// 				            data:[220, 182, 191, 234, 290, 330, 310]
	// 				        },
	// 				        {
	// 				            name:'视频广告',
	// 				            type:'bar',
	// 				            stack: '总量',
	// 				            itemStyle : { normal: {label : {show: true, position: 'insideRight'}}},
	// 				            data:[150, 212, 201, 154, 190, 330, 410]
	// 				        },
	// 				        {
	// 				            name:'搜索引擎',
	// 				            type:'bar',
	// 				            stack: '总量',
	// 				            itemStyle : { normal: {label : {show: true, position: 'insideRight'}}},
	// 				            data:[820, 832, 901, 934, 1290, 1330, 1320]
	// 				        }
	// 			    ]
	// 		};
	// 		myChart.refresh();
 //    			myChart.setOption(options);
	// 	});
                    
}

function goods_name_chart(){

}