// add by jyj 2015-7-8

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

var current_sort_way = 1;  //当前的排列方式  1:按日排,2:按周排,3:按月排，默认为按日排
$(document).ready(function(){
	initCharts();
}).on("click",".sell-change-list li",function(){
	
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

			// console.log(ChooseDate.toString());

			$(".year").text(choose_year);
			$(".month").text(choose_month);
			$(".date").text(choose_date);

			// console.log(choose_year);
			// console.log(choose_month);
			// console.log(choose_date);	
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
});

function WeekNumOfYear(date) {   
	var date2=new Date(date.getFullYear(), 0, 1); 
	var day1=date.getDay(); 
	if(day1==0) day1=7; 
	var day2=date2.getDay(); 
	if(day2==0) day2=7; 
	d = Math.round((date.getTime() - date2.getTime()+(day2-day1)*(24*60*60*1000)) / 86400000);   
	return Math.ceil(d /7) ;   
}

function initCharts(){
	liveInit();

	$(".year").text(current_year);
	$(".month").text(current_month);
	$(".date").text(current_date);

	$(".sell-change-list").each(function(){
		var $this = $(this);
		$this.find("li").eq(0).addClass("active");
	});
	// console.log(current_year);
	// console.log(current_month);
	// console.log(current_date);
	// console.log(current_week);
	// alert(choose_week);
	var str ='2015-06-30 23:13:15';
	str = str.replace(/-/g,"/");
	var date = new Date(str );

	console.log(GetDateN(date,1).toString());


}

// 获取当前日期的前后N天日期(日期格式):
function GetDateN(date,AddDayCount) 
{ 
	var dd = new Date();
	dd.setDate(date.getDate()+AddDayCount);//获取AddDayCount天后的日期 
	var y = dd.getFullYear(); 
	var m = (dd.getMonth()+1)<10?"0"+(dd.getMonth()+1):(dd.getMonth()+1);//获取当前月份的日期，不足10补0
	var d = dd.getDate()<10?"0"+dd.getDate():dd.getDate(); //获取当前几号，不足10补0
	var str = y+"-"+m+"-"+d+" 00:00:00"; 
	str = str.replace(/-/g,"/");
	var new_date = new Date(str);
	return new_date;
}

// 实时更新函数
function liveInit(){
	CurrentDate=new Date();
	current_year=CurrentDate.getFullYear();
	current_month=CurrentDate.getMonth()+1;
	current_date = CurrentDate.getDate();
	current_week = WeekNumOfYear(CurrentDate);
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