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

var ChooseDate3 = CurrentDate;
var choose_year3 = current_year;
var choose_month3 = current_month;

var ChooseDate4 = CurrentDate;
var choose_year4 = current_year;
var choose_month4 = current_month;

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
	$(".week-span11").hide();

	$(".year-span").show();
	$(".month-span").show();
	$(".date-span").show();
	show_chart('type',CurrentDate,CurrentDate);

}).on("click",".sort-week",function(){
	current_sort_way = 2;
	liveInit();
	ChooseDate = CurrentDate;
	var week_first_date = getWeekFirstDate(CurrentDate);
	var week_last_date = GetDateN(week_first_date,6);
	$(".week-month1").text(week_first_date.getMonth()+1);
	$(".week-date1").text(week_first_date.getDate());
	$(".week-month2").text(week_last_date.getMonth()+1);
	$(".week-date2").text(week_last_date.getDate());
	$(".week").text(WeekNumOfYear(ChooseDate));
	$(".month-span").hide();
	$(".date-span").hide();
	$(".year-span").show();
	$(".week-span11").removeClass("hidden").show();

	show_chart('type',week_first_date,week_last_date);

}).on("click",".sort-month",function(){
	current_sort_way = 3;
	liveInit();
	ChooseDate = CurrentDate;

	$(".date-span").hide();
	$(".week-span11").hide();

	$(".year-span").show();
	$(".month-span").show();

	var start_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),1);
	var end_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),getLastDayOfMonth(CurrentDate.getMonth()+1,CurrentDate.getFullYear()))
	show_chart('type',start_date,end_date);

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

			show_chart('type',ChooseDate,ChooseDate);
			break;
		case 2:
			ChooseDate = GetDateN(ChooseDate,-7);
			choose_year=ChooseDate.getFullYear();
			choose_week = WeekNumOfYear(ChooseDate);

			var week_first_date = getWeekFirstDate(ChooseDate);
			var week_last_date = GetDateN(week_first_date,6);

			$(".week-month1").text(week_first_date.getMonth()+1);
			$(".week-date1").text(week_first_date.getDate());
			$(".week-month2").text(week_last_date.getMonth()+1);
			$(".week-date2").text(week_last_date.getDate());

			$(".year").text(choose_year);
			$(".week").text(choose_week);

			show_chart('type',week_first_date,week_last_date);
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

			var start_date = new Date(choose_year,choose_month-1,1);
			var end_date = new Date(choose_year,choose_month-1,getLastDayOfMonth(choose_month,choose_year))
			show_chart('type',start_date,end_date);

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
			show_chart('type',ChooseDate,ChooseDate);
			break;
		case 2:
			ChooseDate = GetDateN(ChooseDate,7);
			choose_year=ChooseDate.getFullYear();
			choose_week = WeekNumOfYear(ChooseDate);

			var week_first_date = getWeekFirstDate(ChooseDate);
			var week_last_date = GetDateN(week_first_date,6);

			$(".week-month1").text(week_first_date.getMonth()+1);
			$(".week-date1").text(week_first_date.getDate());
			$(".week-month2").text(week_last_date.getMonth()+1);
			$(".week-date2").text(week_last_date.getDate());
			$(".year").text(choose_year);
			$(".week").text(choose_week);
			show_chart('type',week_first_date,week_last_date);
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

			var start_date = new Date(choose_year,choose_month-1,1);
			var end_date = new Date(choose_year,choose_month-1,getLastDayOfMonth(choose_month,choose_year))
			show_chart('type',start_date,end_date);
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
	$(".week-span22").hide();

	$(".year-span2").show();
	$(".month-span2").show();
	$(".date-span2").show();

	show_chart('name',CurrentDate,CurrentDate);
}).on("click",".sort-week2",function(){
	current_sort_way2 = 2;
	liveInit();
	ChooseDate2 = CurrentDate;
	var week_first_date = getWeekFirstDate(CurrentDate);
	var week_last_date = GetDateN(week_first_date,6);

	$(".week-month12").text(week_first_date.getMonth()+1);
	$(".week-date12").text(week_first_date.getDate());
	$(".week-month22").text(week_last_date.getMonth()+1);
	$(".week-date22").text(week_last_date.getDate());
	$(".week2").text(WeekNumOfYear(ChooseDate2));
	$(".month-span2").hide();
	$(".date-span2").hide();
	$(".year-span2").show();
	$(".week-span22").removeClass("hidden").show();

	show_chart('name',week_first_date,week_last_date);
}).on("click",".sort-month2",function(){
	current_sort_way2 = 3;
	liveInit();
	ChooseDate2 = CurrentDate;

	$(".date-span2").hide();
	$(".week-span22").hide();

	$(".year-span2").show();
	$(".month-span2").show();

	var start_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),1);
	var end_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),getLastDayOfMonth(CurrentDate.getMonth()+1,CurrentDate.getFullYear()))
	show_chart('name',start_date,end_date);

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
			show_chart('name',ChooseDate2,ChooseDate2);
			break;
		case 2:
			ChooseDate2 = GetDateN(ChooseDate2,-7);
			choose_year2=ChooseDate2.getFullYear();
			choose_week2 = WeekNumOfYear(ChooseDate2);

			var week_first_date = getWeekFirstDate(ChooseDate2);
			var week_last_date = GetDateN(week_first_date,6);

			$(".week-month12").text(week_first_date.getMonth()+1);
			$(".week-date12").text(week_first_date.getDate());
			$(".week-month22").text(week_last_date.getMonth()+1);
			$(".week-date22").text(week_last_date.getDate());

			$(".year2").text(choose_year2);
			$(".week2").text(choose_week2);
			show_chart('name',week_first_date,week_last_date);
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

			var start_date = new Date(choose_year2,choose_month2-1,1);
			var end_date = new Date(choose_year2,choose_month2-1,getLastDayOfMonth(choose_month2,choose_year2))
			show_chart('name',start_date,end_date);
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
			show_chart('name',ChooseDate2,ChooseDate2);
			break;
		case 2:
			ChooseDate2 = GetDateN(ChooseDate2,7);
			choose_year2=ChooseDate2.getFullYear();
			choose_week2 = WeekNumOfYear(ChooseDate2);

			var week_first_date = getWeekFirstDate(ChooseDate2);
			var week_last_date = GetDateN(week_first_date,6);

			$(".week-month12").text(week_first_date.getMonth()+1);
			$(".week-date12").text(week_first_date.getDate());
			$(".week-month22").text(week_last_date.getMonth()+1);
			$(".week-date22").text(week_last_date.getDate());
			$(".year2").text(choose_year2);
			$(".week2").text(choose_week2);
			show_chart('name',week_first_date,week_last_date);
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

			var start_date = new Date(choose_year2,choose_month2-1,1);
			var end_date = new Date(choose_year2,choose_month2-1,getLastDayOfMonth(choose_month2,choose_year2))
			show_chart('name',start_date,end_date);
			break;
	}
}).on("click",".pre-item3",function(){
	if(choose_month3 == 1){
		choose_month3 = 12;
		choose_year3 = choose_year3-1;
	}
	else{
		choose_month3=choose_month3-1;
	}

	$(".year3").text(choose_year3);
	$(".month3").text(choose_month3);

	var first_type = $("#first_type").text();
	var start_date = new Date(choose_year3,choose_month3-1,1);
	var end_date = new Date(choose_year3,choose_month3-1,getLastDayOfMonth(choose_month3,choose_year3))
	show_chart('single_type',start_date,end_date,first_type);
}).on("click",".next-item3",function(){
	if(choose_month3 == 12){
		choose_month3 = 1;
		choose_year3 = choose_year3+1;
	}
	else{
		choose_month3=choose_month3+1;
	}

	$(".year3").text(choose_year3);
	$(".month3").text(choose_month3);

	var first_type = $("#first_type").text();
	var start_date = new Date(choose_year3,choose_month3-1,1);
	var end_date = new Date(choose_year3,choose_month3-1,getLastDayOfMonth(choose_month3,choose_year3))
	show_chart('single_type',start_date,end_date,first_type);
}).on("click",".pre-item4",function(){
	if(choose_month4 == 1){
		choose_month4 = 12;
		choose_year4 = choose_year4-1;
	}
	else{
		choose_month4=choose_month4-1;
	}

	$(".year4").text(choose_year4);
	$(".month4").text(choose_month4);

	var first_name = $("#first_name").text();
	var start_date = new Date(choose_year4,choose_month4-1,1);
	var end_date = new Date(choose_year4,choose_month4-1,getLastDayOfMonth(choose_month4,choose_year4))
	show_chart('single_name',start_date,end_date,first_name);

}).on("click",".next-item4",function(){
	if(choose_month4 == 12){
		choose_month4 = 1;
		choose_year4 = choose_year4+1;
	}
	else{
		choose_month4=choose_month4+1;
	}

	$(".year4").text(choose_year4);
	$(".month4").text(choose_month4);

	var first_name = $("#first_name").text();
	var start_date = new Date(choose_year4,choose_month4-1,1);
	var end_date = new Date(choose_year4,choose_month4-1,getLastDayOfMonth(choose_month4,choose_year4))
	show_chart('single_name',start_date,end_date,first_name);
}).on("click","#btn_type_bigchart",function(){
	$("#type_bigchart_bg").removeClass("hidden");
	$("#type_bigchart").removeClass("hidden");
	console.log("@@@@@@@@@@@");
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

	$(".year3").text(current_year);
	$(".month3").text(current_month);

	$(".year4").text(current_year);
	$(".month4").text(current_month);

	$(".sell-change-list").each(function(){
		var $this = $(this);
		$this.find("li").eq(0).addClass("active");
	});

	$(".sell-change-list2").each(function(){
		var $this = $(this);
		$this.find("li").eq(0).addClass("active");
	});
	show_all_chart(CurrentDate,CurrentDate);

	var start_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),1);
	var end_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),getLastDayOfMonth(CurrentDate.getMonth()+1,CurrentDate.getFullYear()))
	show_all_single_chart(start_date,end_date);
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

	return week_num;
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

function show_all_single_chart(start_date,end_date){
	var url = "";
	var args = {
		action:'all_single',
		start_date:getDateStr(start_date),
		end_date:getDateStr(end_date)
	};
	$.postJson(url,args,
		function(res){
			if(res.success){

				var output_data = res.output_data;
				var type_max = output_data["type_max"];
				var name_max = output_data["name_max"];
				var all_type = output_data["all_type"];
				var all_goods = output_data["all_goods"] ;

				$("#first_name").text(name_max);
				$("#first_type").text(type_max);
				show_chart("single_type",start_date,end_date,type_max);
				show_chart("single_name",start_date,end_date,name_max);

				 $("#currentTypeName").empty();
				 $("#currentGoodsName").empty();

				  for(var i = 0;i < all_type.length;i++){

				 	var type_id = "type"+i;
				 	var item = '<li>'
				 	   +'<a class="item" id={{type_id}} onclick="onTypeItemClick({{type_id}})">{{type_name}}</a>'
				 	     '</li';
				 	var render = template.compile(item);

				 	var type_name = all_type[i];
				 	var list_item= render({
				 		type_id:type_id,
				 		type_name:type_name
					 });
				 	$("#currentTypeName").append(list_item);

				 }

				 for(var i = 0;i < all_goods.length;i++){

				 	var goods_id = "goods"+i;
				 	var item = '<li>'
				 	   +'<a class="item" id={{goods_id}} onclick="onNameItemClick({{goods_id}})">{{goods_name}}</a>'
				 	     '</li';
				 	var render = template.compile(item);

				 	var goods_name = all_goods[i];
				 	var list_item= render({
				 		goods_id:goods_id,
				 		goods_name:goods_name
					 });
				 	$("#currentGoodsName").append(list_item);

				 }


			}
			else{
				return Tip(res.error_text);
			}
		},
		function(){
            			return Tip('网络好像不给力呢~ ( >O< ) ~！');
            		}
            	);
}

function  onTypeItemClick(type_id){
	var first_type = $("#"+type_id.id).text();
	$("#first_type").text(first_type);
	var start_date = new Date(choose_year3,choose_month3-1,1);
	var end_date = new Date(choose_year3,choose_month3-1,getLastDayOfMonth(choose_month3,choose_year3))
	show_chart('single_type',start_date,end_date,first_type);

}

function  onNameItemClick(goods_id){
	var first_name = $("#"+goods_id.id).text();
	$("#first_name").text(first_name);
	var start_date = new Date(choose_year4,choose_month4-1,1);
	var end_date = new Date(choose_year4,choose_month4-1,getLastDayOfMonth(choose_month4,choose_year4))
	show_chart('single_name',start_date,end_date,first_name);

}

function show_all_chart(start_date,end_date){
	var url = "";
	var args = {
		action:'all',
		start_date:getDateStr(start_date),
		end_date:getDateStr(end_date)
	};

	$.postJson(url,args,
		function(res){
			if(res.success){
				var output_data = res.output_data;
				$("#goods_type").css("height",output_data["type_data"].length*40+105 + "px");
				// $("#goods_type_big").css("height",output_data["type_data"].length*35+105 + "px");
				$("#goods_name").css("height",output_data["name_data"].length*40+105 + "px");
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
				              //按商品类目排序
			        		function (ec) {
			            		            var myChart1 = ec.init(document.getElementById('goods_type'));
			            		            // var myChart11 = ec.init(document.getElementById('goods_type_big'));
			            		            myChart1.showLoading({
			                	            		text: '正在努力的读取数据中...'
			            			});
			            			myChart1.hideLoading();
			            			// myChart11.showLoading({
			               //  	            		text: '正在努力的读取数据中...'
			            			// });
			            			// myChart11.hideLoading();
			            			var options = {
			            				    title : {
							        	        subtext: '数值单位：元',
							        	        x:'center',
							        	        subtextStyle: {
								            		color: '#000'          // 副标题文字颜色
								        }
							    },
							    tooltip : {
								        trigger: 'axis',
								        axisPointer : {            // 坐标轴指示器，坐标轴触发有效
								            type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
								        }
							    },
							    toolbox: {
								        show : true,
								        feature : {
								            mark : {show: true},
								            magicType : {show: true, type: []},
								            restore : {show: true},
								            saveAsImage : {show: true}
								        }
							    },
							    calculable : true,
							    xAxis : [
								        {
								            show : false,
								            type : 'value'
								        }
							    ],
							    yAxis : [
								        {
								            show : true,
								            type : 'category'
								        }
							    ],
							    series : [
								        {
								            name:'销售额',
								            type:'bar',
								            stack: '总量',
								            itemStyle : {
								            		normal: {
								            			label :
								            			{
								            				show: true,
								            				position: 'right',
								            				textStyle : {
											                            fontWeight : 'bold'
											             }
								            			}
								            		}
								            	}
								        }
							    ],
							    color: ['#b6a2de','#2ec7c9','#5ab1ef','#ffb980','#d87a80',
							                    '#8d98b3','#e5cf0d','#97b552','#95706d','#dc69aa',
							                    '#07a2a4','#9a7fd1','#588dd5','#f5994e','#c05050',
							                    '#59678c','#c9ab00','#7eb00a','#6f5553','#c14089']
						};
						getCount("type",options,myChart1,output_data["type_data"]);
						// getCount("type",options,myChart11,output_data["type_data"]);


						var myChart2 = ec.init(document.getElementById('goods_name'));
			            		             myChart2.showLoading({
			                	            		text: '正在努力的读取数据中...'
			            			});
			            			myChart2.hideLoading();
			            			getCount("name",options,myChart2,output_data["name_data"]);

					}

				);

			}
			else{
				return Tip(res.error_text);
			}
		},
		function(){
            			return Tip('网络好像不给力呢~ ( >O< ) ~！');
            		}
            	);
}

function show_chart(action,start_date,end_date,name){
	if(name == undefined){
		name = "";
	}

	var myChartType = null;
	var TypeOptions = null;

	var myChartName = null;
	var NameOptions = null;

	var myChartSingleType = null;
	var SingleTypeOptions = null;

	var myChartSingleName = null;
	var SingleNameOptions = null;
	if(action == 'single_type'){

		$("#single_type").css("height","400px");
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
	            		            myChartSingleType = ec.init(document.getElementById('single_type'));
	            		            myChartSingleType.showLoading({
	                	            		text: '正在努力的读取数据中...',
	                	            		y:150
	            			});

	            			SingleTypeOptions = {
	            				   title : {
					        	        subtext: '数值单位：元',
					        	        x:'center',
					        	        subtextStyle: {
						            		color: '#000'          // 副标题文字颜色
						        }
					    },
					    tooltip : {
					        show: true,
					        trigger: 'item'
					    },
					    toolbox: {
					        show : true,
					        feature : {
					            mark : {show: true},
					             dataZoom : {show: true},
					            dataView : {show: false, readOnly: false},
					            magicType : {show: true, type: ['line', 'bar', 'stack', 'tiled']},
					            restore : {show: true},
					            saveAsImage : {show: true}
					        }
					    },
					    dataZoom: {
					       	show: true,
					       	handleSize:20,
					       	realtime : true

						     },
					    calculable : true,
					    legend:{
					    	show:true,
					    	data:[]
					    },
					    xAxis : [
					        {
					            type : 'category',
					            data : []
					        }
					    ],
					   yAxis : [
					        	{
					        		name: '增长趋势',
					            		type : 'value',
					            		axisLabel: {
	            									formatter: '{value}元'
	       									 }
					        	}
					    ],
					    series : [

					    ],
					    color: ['#b6a2de','#2ec7c9','#5ab1ef','#ffb980','#d87a80',
					                    '#8d98b3','#e5cf0d','#97b552','#95706d','#dc69aa',
					                    '#07a2a4','#9a7fd1','#588dd5','#f5994e','#c05050',
					                    '#59678c','#c9ab00','#7eb00a','#6f5553','#c14089']
				};

			}
		);
	}
	else if (action == 'type'){
		// $(".goods_type").css("height","400px");
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
		              //按商品类目排序
	        		function (ec) {
	            		            myChartType = ec.init(document.getElementById('goods_type'));
	            		            myChartType.showLoading({
	                	            		text: '正在努力的读取数据中...',
	                	            		y:150
	            			});
	            			// myChartType.hideLoading();
	            			TypeOptions = {
	            				    title : {
					        	        subtext: '数值单位：元',
					        	        x:'center',
					        	        subtextStyle: {
						            		color: '#000'          // 副标题文字颜色
						        }
					    },
					    tooltip : {
						        trigger: 'axis',
						        axisPointer : {            // 坐标轴指示器，坐标轴触发有效
						            type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
						        }
					    },

					    toolbox: {
						        show : true,
						        feature : {
						            mark : {show: true},
						            magicType : {show: true, type: []},
						            restore : {show: true},
						            saveAsImage : {show: true}
						        }
					    },
					    calculable : true,
					    xAxis : [
						        {
						            show : false,	
						            type : 'value'
						        }
					    ],
					    yAxis : [
						        {
						            type : 'category'
						        }
					    ],
					    series : [
						        {
						            name:'销售额',
						            type:'bar',
						            stack: '总量',
						            itemStyle : { 
						            		normal: {
						            			label : 
						            			{
						            				show: true, 
						            				position: 'right',
						            				textStyle : {
									                            fontWeight : 'bold'
									             }
						            			}
						            		}
						            	}
						        }
					    ],
					    color: ['#b6a2de','#2ec7c9','#5ab1ef','#ffb980','#d87a80',
				                    '#8d98b3','#e5cf0d','#97b552','#95706d','#dc69aa',
				                    '#07a2a4','#9a7fd1','#588dd5','#f5994e','#c05050',
				                    '#59678c','#c9ab00','#7eb00a','#6f5553','#c14089']
				};
			}	

		);
	}
	else if(action == 'name'){
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
		              //按商品类目排序
	        		function (ec) {
	            		            myChartName = ec.init(document.getElementById('goods_name'));
	            		            myChartName.showLoading({
	                	            		text: '正在努力的读取数据中...',
	                	            		y:150
	            			});
	            			// myChartName.hideLoading();
	            			NameOptions = {
	            				    title : {
					        	        subtext: '数值单位：元',
					        	        x:'center',
					        	        subtextStyle: {
						            		color: '#000'          // 副标题文字颜色
						        }
					    },
					    
					    tooltip : {
						        trigger: 'axis',
						        axisPointer : {            // 坐标轴指示器，坐标轴触发有效
						            type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
						        }
					    },
					    toolbox: {
						        show : true,
						        feature : {
						            mark : {show: true},
						            magicType : {show: true, type: []},
						            restore : {show: true},
						            saveAsImage : {show: true}
						        }
					    },
					    calculable : true,
					    xAxis : [
						        {
						            show : false,	
						            type : 'value'
						        }
					    ],
					    yAxis : [
						        {
						            type : 'category'
						        }
					    ],
					    series : [
						        {
						            name:'销售额',
						            type:'bar',
						            stack: '总量',
						            itemStyle : { 
						            		normal: {
						            			label : 
						            			{
						            				show: true, 
						            				position: 'right',
						            				textStyle : {
									                            fontWeight : 'bold'
									             }
						            			}
						            		}
						            	}
						        }
					    ],
					    color: ['#b6a2de','#2ec7c9','#5ab1ef','#ffb980','#d87a80',
				                    '#8d98b3','#e5cf0d','#97b552','#95706d','#dc69aa',
				                    '#07a2a4','#9a7fd1','#588dd5','#f5994e','#c05050',
				                    '#59678c','#c9ab00','#7eb00a','#6f5553','#c14089']
				};
			}	

		);
	}
	else if(action == 'single_name'){
		$("#single_name").css("height","400px");
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
	            		            myChartSingleName = ec.init(document.getElementById('single_name'));
	            		            myChartSingleName.showLoading({
	                	            		text: '正在努力的读取数据中...',
	                	            		y:150
	            			});
	            			// myChartSingleName.hideLoading();
	            			SingleNameOptions = {
					     title : {
					        	        subtext: '数值单位：元',
					        	        x:'center',
					        	        subtextStyle: {
						            		color: '#000'          // 副标题文字颜色
						        }
					    },
					    tooltip : {
					        	        trigger: 'axis'
					    },
					    toolbox: {
					        		show : true,
					       		 feature : {
					            			mark : {show: true},
					            			dataZoom : {show: true},
					            			dataView : {show: false, readOnly: false},
					            			magicType : {show: true, type: ['line', 'bar']},
					            			restore : {show: true},
					            			saveAsImage : {show: true}
					       		 }
					    },
					    dataZoom: {
					       	show: true,
					       	handleSize:20,
					       	realtime : true
								 
						     },
					    calculable : true,
					   
					    xAxis : [
					        	{
					            		type : 'category',
					            		boundaryGap: false,
					            		data : []
					        	}
					    ],
					    yAxis : [
					        	{
					        		name: '增长趋势',
					            		type : 'value',
					            		axisLabel: {
                									formatter: '{value}元'
           									 }
					        	}
					    ],
					    series : [
					        	       {
					            		name:'销售额',
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
						                    {type : 'average', name : '平均值'}
						                ]
						            }
					        	        }
					        	        
					   	 ],
					   	 color: ['#b6a2de','#2ec7c9','#5ab1ef','#ffb980','#d87a80',
					                    '#8d98b3','#e5cf0d','#97b552','#95706d','#dc69aa',
					                    '#07a2a4','#9a7fd1','#588dd5','#f5994e','#c05050',
					                    '#59678c','#c9ab00','#7eb00a','#6f5553','#c14089']
				};

			}
		);
	}

	var url = "";
	var args = {
		action:action,
		start_date:getDateStr(start_date),
		end_date:getDateStr(end_date),
		type_name:name,
		goods_name:name
	};
	$.postJson(url,args,
		function(res){
			if(res.success){
				var output_data = res.output_data;

				if(action == 'type'){
					myChartType.hideLoading();
					$("#goods_type").css("height",output_data.length*40+105 + "px");
					getCount("type",TypeOptions,myChartType,output_data);
				}
				else if(action == 'name'){
					myChartName.hideLoading();
					$("#goods_name").css("height",output_data.length*40+105 + "px");
					getCount("name",NameOptions,myChartName,output_data);
				}
				else if(action == 'single_type'){
					myChartSingleType.hideLoading();
					getCount("single_type",SingleTypeOptions,myChartSingleType,output_data);
				}
				else if(action == 'single_name'){
					myChartSingleName.hideLoading();
					getCount("single_name",SingleNameOptions,myChartSingleName,output_data);
				}
				else{
					return Tip(res.error_text);
				}
			}
			else{
				return Tip(res.error_text);
			}
		},
		function(){
            return Tip('网络好像不给力呢~ ( >O< ) ~！');
       	}
	);
}

function getDateStr(date){
	var y = date.getFullYear();
	var m = (date.getMonth()+1)<10?"0"+(date.getMonth()+1):(date.getMonth()+1);//获取当前月份的日期，不足10补0
	var d = date.getDate()<10?"0"+date.getDate():date.getDate(); //获取当前几号，不足10补0
	var str = y+"-"+m+"-"+d;
	return str;
}

function getCount(action,options,myChart,output_data){
	options.xAxis[0].data = []
	options.yAxis[0].data = [];
	myChart.clear();
	if(action == "type"){
		options.series[0].data = [];
		for(var i = 0;i < output_data.length;i++){
			var data = output_data[i];
			var price = parseFloat(data["type_total_price"]).toFixed(2);
			options.yAxis[0].data.push(data["type_name"]);
			options.series[0].data.push(price);
		}
	}
	else if(action == "name"){
		options.series[0].data = [];
		for(var i = 0;i < output_data.length;i++){
			var data = output_data[i];
			var price = parseFloat(data["total_price"]).toFixed(2);
			options.yAxis[0].data.push(data["fruit_name"]);
			options.series[0].data.push(price);
		}
	}
	else if(action == "single_type"){
		options.series = [];

		for(var i = 0;i < output_data[0].length;i++){
			options.series.push({name:output_data[0][i],stack:'总量',type:'bar',data:[]});

		}

		for(var i = 0;i < output_data[1].length;i++){
			var n = 0;
			for (var j = 0;j < output_data[1][i].length;j++){
				options.series[n].data.push(output_data[1][i][j]);
				n++;
			}
			options.xAxis[0].data.push(i+1+"号");
		}
	}
	else if(action == "single_name"){
		options.series[0].data = [];
		for(var i = 0;i < output_data.length;i++){
			var data = output_data[i];
			var price =  parseFloat(parseFloat(data).toFixed(2));
			options.xAxis[0].data.push(i+1+"号");
			options.series[0].data.push(price);
		}
	}
	else{
		return Tip('网络好像不给力呢~ ( >O< ) ~！');
	}

	myChart.refresh();
	myChart.setOption(options);

}


















