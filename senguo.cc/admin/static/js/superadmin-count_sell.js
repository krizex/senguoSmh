// created by jyj 2015-8-3

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

var ChooseDate3 = CurrentDate;
var choose_year3 = current_year;
var choose_month3 = current_month;
var choose_date3 = current_date;
var current_sort_way3 = 1;  

var cur_selected_type_id = 1;
var cur_selected_type_name = ""

var cur_selected_group_id = 1;
var cur_selected_group_name = "水果";

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
	current_sort_way1 = 1;
	liveInit();
	ChooseDate1 = CurrentDate;

	$('.week-span1').hide();
	$(".year-span1").show();
	$(".month-span1").show();
	$(".date-span1").show();
	show_chart('type',CurrentDate,CurrentDate);

}).on('click','.sort-week1',function(){
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

	show_chart('type',week_first_date,week_last_date);
}).on('click','.sort-month1',function(){
	current_sort_way1 = 3;
	liveInit();
	ChooseDate1 = CurrentDate;

	$(".date-span1").hide();
	$(".week-span1").hide();

	$(".year-span1").show();
	$(".month-span1").show();

	var start_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),1);
	var end_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),getLastDayOfMonth(CurrentDate.getMonth()+1,CurrentDate.getFullYear()))
	show_chart('type',start_date,end_date);
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

			show_chart('type',ChooseDate1,ChooseDate1);
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

			show_chart('type',week_first_date,week_last_date);
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
			show_chart('type',start_date,end_date);

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
			show_chart('type',ChooseDate1,ChooseDate1);
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
			show_chart('type',week_first_date,week_last_date);
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
			show_chart('type',start_date,end_date);
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
	current_sort_way2 = 1;
	liveInit();
	ChooseDate2 = CurrentDate;

	$('.week-span2').hide();
	$(".year-span2").show();
	$(".month-span2").show();
	$(".date-span2").show();
	show_chart('shop',CurrentDate,CurrentDate,cur_selected_type_id);

}).on('click','.sort-week2',function(){
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

	show_chart('shop',week_first_date,week_last_date,cur_selected_type_id);
}).on('click','.sort-month2',function(){
	current_sort_way2 = 3;
	liveInit();
	ChooseDate2 = CurrentDate;

	$(".date-span2").hide();
	$(".week-span2").hide();

	$(".year-span2").show();
	$(".month-span2").show();

	var start_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),1);
	var end_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),getLastDayOfMonth(CurrentDate.getMonth()+1,CurrentDate.getFullYear()))
	show_chart('shop',start_date,end_date,cur_selected_type_id);
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

			show_chart('shop',ChooseDate2,ChooseDate2,cur_selected_type_id);
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

			show_chart('shop',week_first_date,week_last_date,cur_selected_type_id);
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
			show_chart('shop',start_date,end_date,cur_selected_type_id);

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
			show_chart('shop',ChooseDate2,ChooseDate2,cur_selected_type_id);
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
			show_chart('shop',week_first_date,week_last_date,cur_selected_type_id);
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
			show_chart('shop',start_date,end_date,cur_selected_type_id);
			break;
	}
}).on('click','.sell-change-list3 li',function(){
	liveInit();
	$(".year3").text(current_year);
	$(".month3").text(current_month);
	$(".date3").text(current_date);

	var $this = $(this);
	$this.addClass('active').siblings('li').removeClass('active');
}).on('click','.sort-date3',function(){
	current_sort_way3 = 1;
	liveInit();
	ChooseDate3 = CurrentDate;

	$('.week-span3').hide();
	$(".year-span3").show();
	$(".month-span3").show();
	$(".date-span3").show();
	show_chart('group',CurrentDate,CurrentDate,cur_selected_group_id);

}).on('click','.sort-week3',function(){
	current_sort_way3 = 2;
	liveInit();
	ChooseDate3 = CurrentDate;
	var week_first_date = getWeekFirstDate(CurrentDate);
	var week_last_date = GetDateN(week_first_date,6);
	$(".week-month3").text(week_first_date.getMonth()+1);
	$(".week-date3").text(week_first_date.getDate());
	$(".week-month3-2").text(week_last_date.getMonth()+1);
	$(".week-date3-2").text(week_last_date.getDate());

	$(".month-span3").hide();
	$(".date-span3").hide();

	$(".year-span3").show();
	$(".week-span3").removeClass("hidden").show();

	show_chart('group',week_first_date,week_last_date,cur_selected_group_id);
}).on('click','.sort-month3',function(){
	current_sort_way3 = 3;
	liveInit();
	ChooseDate3 = CurrentDate;

	$(".date-span3").hide();
	$(".week-span3").hide();

	$(".year-span3").show();
	$(".month-span3").show();

	var start_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),1);
	var end_date = new Date(CurrentDate.getFullYear(),CurrentDate.getMonth(),getLastDayOfMonth(CurrentDate.getMonth()+1,CurrentDate.getFullYear()))
	show_chart('group',start_date,end_date,cur_selected_group_id);
}).on("click",".pre-item3",function(){
	switch(current_sort_way3){
		case 1:
			ChooseDate3 = GetDateN(ChooseDate3,-1);
			choose_year3=ChooseDate3.getFullYear();
			choose_month3=ChooseDate3.getMonth()+1;
			choose_date3 = ChooseDate3.getDate();

			$(".year3").text(choose_year3);
			$(".month3").text(choose_month3);
			$(".date3").text(choose_date3);

			show_chart('group',ChooseDate3,ChooseDate3,cur_selected_group_id);
			break;
		case 2:
			ChooseDate3 = GetDateN(ChooseDate3,-7);
			choose_year3=ChooseDate3.getFullYear();

			var week_first_date = getWeekFirstDate(ChooseDate3);
			var week_last_date = GetDateN(week_first_date,6);

			$(".week-month3").text(week_first_date.getMonth()+1);
			$(".week-date3").text(week_first_date.getDate());
			$(".week-month3-2").text(week_last_date.getMonth()+1);
			$(".week-date3-2").text(week_last_date.getDate());

			$(".year3").text(choose_year3);

			show_chart('group',week_first_date,week_last_date,cur_selected_group_id);
			break;
		case 3:
			ChooseDate3 = new Date(ChooseDate3.getFullYear(),ChooseDate3.getMonth()-1,ChooseDate3.getDate());
			choose_year3=ChooseDate3.getFullYear();
			choose_month3=ChooseDate3.getMonth()+1;
			choose_date3 = ChooseDate3.getDate();

			$(".year3").text(choose_year3);
			$(".month3").text(choose_month3);

			var start_date = new Date(choose_year3,choose_month3-1,1);
			var end_date = new Date(choose_year3,choose_month3-1,getLastDayOfMonth(choose_month3,choose_year3))
			show_chart('group',start_date,end_date,cur_selected_group_id);

			break;
	}
}).on("click",".next-item3",function(){
	switch(current_sort_way3){
		case 1:
			ChooseDate3 = GetDateN(ChooseDate3,1);
			choose_year3=ChooseDate3.getFullYear();
			choose_month3=ChooseDate3.getMonth()+1;
			choose_date3 = ChooseDate3.getDate();

			$(".year3").text(choose_year3);
			$(".month3").text(choose_month3);
			$(".date3").text(choose_date3);
			show_chart('group',ChooseDate3,ChooseDate3,cur_selected_group_id);
			break;
		case 2:
			ChooseDate3 = GetDateN(ChooseDate3,7);
			choose_year3=ChooseDate3.getFullYear();

			var week_first_date = getWeekFirstDate(ChooseDate3);
			var week_last_date = GetDateN(week_first_date,6);

			$(".week-month3").text(week_first_date.getMonth()+1);
			$(".week-date3").text(week_first_date.getDate());
			$(".week-month3-2").text(week_last_date.getMonth()+1);
			$(".week-date3-2").text(week_last_date.getDate());
			$(".year3").text(choose_year3);
			show_chart('group',week_first_date,week_last_date,cur_selected_group_id);
			break;
		case 3:
			ChooseDate3 = new Date(ChooseDate3.getFullYear(),ChooseDate3.getMonth()+1,ChooseDate3.getDate());
			choose_year3=ChooseDate3.getFullYear();
			choose_month3=ChooseDate3.getMonth()+1;
			choose_date3 = ChooseDate3.getDate();

			$(".year3").text(choose_year3);
			$(".month3").text(choose_month3);

			var start_date = new Date(choose_year3,choose_month3-1,1);
			var end_date = new Date(choose_year3,choose_month3-1,getLastDayOfMonth(choose_month3,choose_year3))
			show_chart('group',start_date,end_date,cur_selected_group_id);
			break;
	}
}).on('mouseover','#type-select-fruit',function(){
	setTimeout(function(){
		$("#fruit-type").removeClass("hidden").show();
	}, 100);	
}).on('mouseout','#type-select-fruit',function(){
	setTimeout(function(){
		$("#fruit-type").addClass("hidden");
	}, 100);
}).on('mouseover','#fruit-type',function(){
	setTimeout(function(){
		$("#fruit-type").removeClass("hidden").show();;
	}, 100);
}).on('mouseout','#fruit-type',function(){
	setTimeout(function(){
		$("#fruit-type").addClass("hidden");
	}, 100);
}).on('mouseover','#type-select-dried',function(){
	setTimeout(function(){
		$("#dried-type").removeClass("hidden").show();;
	}, 100);	
}).on('mouseout','#type-select-dried',function(){
	setTimeout(function(){
		$("#dried-type").addClass("hidden");
	}, 100);
}).on('mouseover','#dried-type',function(){
	setTimeout(function(){
		$("#dried-type").removeClass("hidden").show();;
	}, 100);
}).on('mouseout','#dried-type',function(){
	setTimeout(function(){
		$("#dried-type").addClass("hidden");
	}, 100);
}).on('click','#fruit-type li',function(){
	var text  = $(this).text();
	$("#first_type").text(text);
	$("#fruit-type").addClass("hidden");
}).on('click','#dried-type li',function(){
	var text  = $(this).text();
	$("#first_type").text(text);
	$("#dried-type").addClass("hidden");
}).on('click','#type-select-other',function(){
	var text  = $(this).text();
	$("#first_type").text(text);
	var start_date = new Date();
	var end_date = new Date();
	switch(current_sort_way2){
		case 1:
			vstart_date = ChooseDate2;
			end_date = ChooseDate2;
			break;
		case 2:
			start_date = getWeekFirstDate(ChooseDate2);
			end_date = GetDateN(start_date,6);
			break;
		case 3:
			start_date = new Date(choose_year2,choose_month2-1,1);
			end_date = new Date(choose_year2,choose_month2-1,getLastDayOfMonth(choose_month2,choose_year2))
			break;
	}
	cur_selected_type_id = 2000;
	show_chart('shop',start_date,end_date,cur_selected_type_id);
}).on('click','#type-select-fruit2',function(){
	var text = $(this).text();
	$('#first_group').text(text);
	var start_date = new Date();
	var end_date = new Date();
	switch(current_sort_way3){
		case 1:
			vstart_date = ChooseDate3;
			end_date = ChooseDate3;
			break;
		case 2:
			start_date = getWeekFirstDate(ChooseDate3);
			end_date = GetDateN(start_date,6);
			break;
		case 3:
			start_date = new Date(choose_year3,choose_month3-1,1);
			end_date = new Date(choose_year3,choose_month3-1,getLastDayOfMonth(choose_month3,choose_year3))
			break;
	}
	cur_selected_group_id = 1;
	show_chart('group',start_date,end_date,cur_selected_group_id);
}).on('click','#type-select-dried2',function(){
	var text = $(this).text();
	$('#first_group').text(text);
	var start_date = new Date();
	var end_date = new Date();
	switch(current_sort_way3){
		case 1:
			vstart_date = ChooseDate3;
			end_date = ChooseDate3;
			break;
		case 2:
			start_date = getWeekFirstDate(ChooseDate3);
			end_date = GetDateN(start_date,6);
			break;
		case 3:
			start_date = new Date(choose_year3,choose_month3-1,1);
			end_date = new Date(choose_year3,choose_month3-1,getLastDayOfMonth(choose_month3,choose_year3))
			break;
	}
	cur_selected_group_id = 2;
	show_chart('group',start_date,end_date,cur_selected_group_id);
}).on('click','#type-select-other2',function(){
	var text = $(this).text();
	$('#first_group').text(text);
	var start_date = new Date();
	var end_date = new Date();
	switch(current_sort_way3){
		case 1:
			vstart_date = ChooseDate3;
			end_date = ChooseDate3;
			break;
		case 2:
			start_date = getWeekFirstDate(ChooseDate3);
			end_date = GetDateN(start_date,6);
			break;
		case 3:
			start_date = new Date(choose_year3,choose_month3-1,1);
			end_date = new Date(choose_year3,choose_month3-1,getLastDayOfMonth(choose_month3,choose_year3))
			break;
	}
	cur_selected_group_id = 0;
	show_chart('group',start_date,end_date,cur_selected_group_id);
}).on("click","#btn_type_bigchart",function(){
	$("#type_bigchart_bg").removeClass("invisiable");
	$("#type_bigchart").removeClass("invisiable");
}).on("click","#btn_type_bigchart_close",function(){
	$("#type_bigchart_bg").addClass("invisiable");
	$("#type_bigchart").addClass("invisiable");
});


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

function initCharts(){
	$(".year1").text(current_year);
	$(".month1").text(current_month);
	$(".date1").text(current_date);

	$(".year2").text(current_year);
	$(".month2").text(current_month);
	$(".date2").text(current_date);

	$(".year3").text(current_year);
	$(".month3").text(current_month);
	$(".date3").text(current_date);

	$(".sell-change-list1").each(function(){
		var $this = $(this);
		$this.find("li").eq(0).addClass("active");
	});

	$(".sell-change-list2").each(function(){
		var $this = $(this);
		$this.find("li").eq(0).addClass("active");
	});

	$(".sell-change-list3").each(function(){
		var $this = $(this);
		$this.find("li").eq(0).addClass("active");
	});

	show_chart('type',CurrentDate,CurrentDate);
	show_chart('shop',CurrentDate,CurrentDate,cur_selected_type_id);
	show_chart('group',CurrentDate,CurrentDate,cur_selected_group_id);
	
}

function show_chart(action,start_date,end_date,id){
	if (id == undefined){
		id = '';
	}
	var args = {};

	var myChart1 = null;
	var myChart_1_big = null;
	var ChartOptions1 = null;

	var myChart2 = null;
	var ChartOptions2 = null;

	var myChart3 = null;
	var ChartOptions3 = null;

	var url = '';
	if(action == 'type'){
		args = {
			action : action,
			start_date : getDateStr(start_date),
			end_date : getDateStr(end_date)
		};

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
	            		            myChart1 = ec.init(document.getElementById('goods_type'));
	            		       
	            		            myChart1.showLoading({
	                	            		text: '数据加载中...',
	                	            		y:200,
    					effect : "ring",
    					textStyle:{
    						baseline:'middle',
    						fontSize:16
    					}
	            			});

	            		            myChart_1_big = ec.init(document.getElementById('goods_type_big'));
	            		            myChart_1_big.showLoading({
	                	            		text: '数据加载中...',
	                	            		y:200,
    					effect : "ring",
    					textStyle:{
    						baseline:'middle',
    						fontSize:16
    					}
	            			});
	            			ChartOptions1 = {
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
	else if(action == 'shop'){
		args = {
			action : action,
			start_date : getDateStr(start_date),
			end_date : getDateStr(end_date),
			id : id
		};

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
	            		            myChart2 = ec.init(document.getElementById('goods_shop'));
	
	            		            myChart2.showLoading({
	                	            		text: '数据加载中...',
	                	            		y:220,
    					effect : "ring",
    					textStyle:{
    						baseline:'middle',
    						fontSize:16
    					}
	            			});

	            			ChartOptions2 = {
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
	else if (action == 'group'){
		args = {
			action : action,
			start_date : getDateStr(start_date),
			end_date : getDateStr(end_date),
			id : id
		};

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
	            		            myChart3 = ec.init(document.getElementById('goods_group'));

	            		            myChart3.showLoading({
	                	            		text: '数据加载中...',
	                	            		y:220,
    					effect : "ring",
    					textStyle:{
    						baseline:'middle',
    						fontSize:16
    					}
	            			});

	            			ChartOptions3 = {
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
	
	$.postJson(url,args,
		function(res){
			if(res.success){

				var output_data = res.output_data;
				if(action == 'type'){
					// 显示第一个图表
					     // setTimeout(function(){
	         //    		            		  }, 2000);
				     	myChart1.hideLoading();
				     	myChart_1_big.hideLoading();
					
					
					var type_select_list = res.type_select_list;
					cur_selected_type_id = type_select_list[0][0].toString();
					cur_selected_type_name = type_select_list[0][1];
					$("#first_type").attr("data-id","cur_selected_type_id");
					$("#first_type").text(cur_selected_type_name);

					// 为第二个图表的下拉按钮添加内容和点击事件
					$("#fruit-type").empty();
					$("#dried-type").empty();
					for (var i = 0;i < type_select_list.length;i++){
						var item = type_select_list[i];

						if(item[0] < 1000){
							var li_item = '<li id={{type_id}} data-id={{data_id}} onclick="onTypeItemClick({{type_id}})">{{type_name}}</li>';
							var render = template.compile(li_item);

							var type_id = 'type' + item[0];
							var data_id = item[0].toString();
							var type_name = item[1];
							var list_item = render({
								type_id:type_id,
								data_id:data_id,
								type_name:type_name
							});
							$("#fruit-type").append(list_item);
						}
						else if (item[0] > 1000 && item[0] < 2000){
							var li_item = '<li id={{type_id}} data-id={{data_id}}>{{type_name}}</li>';
							var render = template.compile(li_item);

							var type_id = 'type' + item[0];
							var data_id = item[0].toString();
							var type_name = item[1];
							var list_item = render({
								type_id:type_id,
								data_id:data_id,
								type_name:type_name
							});
							$("#dried-type").append(list_item);
						}
					}

					if(output_data.length == 0){
						var first_words = ''
						switch(current_sort_way1){
							case 1:
								first_words = '今天';
								break;
							case 2:
								first_words = '本周';
								break;
							case 3:
								first_words = '本月';
								break;
						}

						var info = '<p class="info-wrap">'+ first_words + '所有商品总销售额为0~</p>';
						$("#goods_type").empty().append(info);
						$("#goods_type_big").empty().append(info);
						return ;
					}

					$("#goods_type").css("height",output_data.length*40+105 + "px");
					$("#goods_type_big").css("height",output_data.length*35+105 + "px");
					getCount("type",ChartOptions1,myChart1,output_data);

					myChart_1_big.refresh();
					myChart_1_big.setOption(ChartOptions1);
					

				}
				else if (action == 'shop'){
					// setTimeout(function(){
					// 	myChart2.hideLoading();
	    //         		           		 }, 2000);
					myChart2.hideLoading();
					if(output_data.length == 0){
						var goods_type = $("#first_type").text();
						var first_words = ''
						switch(current_sort_way2){
							case 1:
								first_words = '今天';
								break;
							case 2:
								first_words = '本周';
								break;
							case 3:
								first_words = '本月';
								break;
						}
						var info = '<p class="info-wrap">'+ first_words + goods_type + '的总销售额为0~</p>';
						$("#goods_shop").empty().append(info);
						return ;
					}
					
					getCount("shop",ChartOptions2,myChart2,output_data);
				}
				else if (action == 'group'){
					myChart3.hideLoading();
					// setTimeout(function(){
					// 	myChart3.hideLoading();
	    //         		            		}, 2000);
					if(output_data.length == 0){
						var goods_group = $("#first_group").text();
						var first_words = ''
						switch(current_sort_way3){
							case 1:
								first_words = '今天';
								break;
							case 2:
								first_words = '本周';
								break;
							case 3:
								first_words = '本月';
								break;
						}
						var info = '<p class="info-wrap">'+ first_words + goods_group + '的总销售额为0~</p>';
						$("#goods_group").empty().append(info);
						return ;
					}

					getCount("group",ChartOptions3,myChart3,output_data);
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
	var start_date = new Date();
	var end_date = new Date();
	switch(current_sort_way2){
		case 1:
			vstart_date = ChooseDate2;
			end_date = ChooseDate2;
			break;
		case 2:
			start_date = getWeekFirstDate(ChooseDate2);
			end_date = GetDateN(start_date,6);
			break;
		case 3:
			start_date = new Date(choose_year2,choose_month2-1,1);
			end_date = new Date(choose_year2,choose_month2-1,getLastDayOfMonth(choose_month2,choose_year2))
			break;
	}
	cur_selected_type_id = parseInt($("#"+type_id.id).attr("data-id"));
	show_chart('shop',start_date,end_date,cur_selected_type_id);
}

function getCount(action,options,myChart,output_data){

	options.xAxis[0].data = []
	options.yAxis[0].data = [];
	myChart.clear();
	if(action == "type"){
		options.series[0].data = [];
		for(var i = 0;i < output_data.length;i++){
			var data = output_data[i];
			var price = parseFloat(data[1]).toFixed(2);
			options.yAxis[0].data.push(data[0]);
			options.series[0].data.push(price);
		}
	}
	else if(action == "shop"){
		options.series[0].data = [];
		for(var i = 0;i < output_data.length;i++){
			var data = output_data[i];
			var price = parseFloat(data[2]).toFixed(2);
			// if(data[1].length > 5){
			// 	options.yAxis[0].data.push(data[1].substr(0,5) + '...');
			// }
			// else{
			options.yAxis[0].data.push(data[1]);
			// }
			options.series[0].data.push(price);
		}
	}
	else if(action == "group"){
		options.series[0].data = [];
		for(var i = 0;i < output_data.length;i++){
			var data = output_data[i];
			var price = parseFloat(data[2]).toFixed(2);
			// if(data[1].length > 5){
			// 	options.yAxis[0].data.push(data[1].substr(0,5) + '...');
			// }
			// else{
			options.yAxis[0].data.push(data[1]);
			// }
			options.series[0].data.push(price);
		}
	}
	else{
		return Tip('网络好像不给力呢~ ( >O< ) ~！');
	}

	myChart.refresh();
	myChart.setOption(options);

}