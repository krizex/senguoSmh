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

$(document).ready(function(){
	initCharts();
}).on('click','.sell-change-list li',function(){
	liveInit();
	$(".year1").text(current_year);
	$(".month1").text(current_month);
	$(".date1").text(current_date);

	var $this = $(this);
	$this.addClass('active').siblings('li').removeClass('active');
}).on('click','.sort-date1',function(){
	current_sort_way1 = 1;
	liveInit();
	ChooseDate = CurrentDate;

	$('.week-span1').hide();
	$(".year-span1").show();
	$(".month-span1").show();
	$(".date-span1").show();
	show_chart('type',CurrentDate,CurrentDate);

}).on('click','.sort-week1',function(){
	current_sort_way1 = 2;
	liveInit();
	ChooseDate = CurrentDate;
}).on('click','.sort-month1',function(){
	current_sort_way1 = 3;
	liveInit();
	ChooseDate = CurrentDate;
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
	$(".year1").text(current_year);
	$(".month1").text(current_month);
	$(".date1").text(current_date);

	$(".year2").text(current_year);
	$(".month2").text(current_month);
	$(".date2").text(current_date);

	$(".year3").text(current_year);
	$(".month3").text(current_month);
	$(".date3").text(current_date);

	$(".sell-change-list").each(function(){
		var $this = $(this);
		$this.find("li").eq(0).addClass("active");
	});
}

function showPostData(action,start_date,end_date,type_id){
	if (type_id == undefined){
		type_id = ''
	}
	var url = '';
	if(action == 'type'){
		var args = {
			action : action,
			start_date : start_date,
			end_date : end_date
		};
	}
	else if(action == 'shop'){
		var args = {
			action : action,
			start_date : start_date,
			end_date : end_date,
			type_id : type_id
		};
	}
	
	$.postJson(url,args,
		function(res){
			if(res.success){
				var output_data = res.output_data;
				console.log(output_data);
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