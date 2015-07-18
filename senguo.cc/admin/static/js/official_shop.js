 $(document).ready(function(){
    //shop total number
     shopTotal();
    //get top8
    getData('top');
    //map data
    require.config({
        paths: {
            echarts:'/static/js'
        }
    });
    require(
        [
            'echarts',
            'echarts/chart/map'
        ],
        function (ec) {
            var myChart = ec.init(document.getElementById('map'));
            myChart.showLoading({
                text: '正在努力的读取数据中...'
            });
            myChart.hideLoading();
            var options={
            	      dataRange: {
            	       show:false,
	        min: 0,
	        max: 2500,
	        x: 'left',
	        y: 'bottom',
	        text:['高','低'],           // 文本，默认为数值文本
	        calculable : true,
	        color:['#fe6666','#fe6666'],
	        textStyle:{color: '#fff'}
	    },
	     tooltip : {
	        trigger: 'item'
	    },
	    series : [
	        {
	           dataRangeHoverLink:true,
	            name: '同行数量',
	            type: 'map',
	            mapType: 'china',
	            roam: false,
                          selectedMode : 'single',
	            itemStyle:{
	                normal:{label:{show:true}},
	                emphasis:{label:{show:true}}
	            },
		itemStyle: {
		        normal: {
		            borderWidth: 2,
		            borderColor: '#fff',
		            color: '#fe6666',
		            label: {
		                show: true,
		                textStyle: {
		                    color: '#fff'
		                }
		            }
		        },
		        emphasis: { // 也是选中样式
		            borderWidth: 2,
		            borderColor: '#fff',
		            color: '#FF5252',
		            label: {
		                show: true,
		                textStyle: {
		                    color: '#fff'
		                }
		            }
		        }
		    },
	            data:[
	               
	            ]
	        }
	    ]
            };
           var ecConfig = require('echarts/config');
           var zrEvent = require('zrender/tool/event');
           myChart.on(ecConfig.EVENT.MAP_SELECTED, function (param){
	    var selected = param.selected;
	    var str;
	    var pro_code;
	    var area=window.dataObj.area;
	    for (var p in selected) {
	        if (selected[p]) {
	            str = p;
	             for(var key in area){
	              	var province=area[key]['name'].substring(0,2);
	              	var province_long=area[key]['name'].substring(0,3);
		    	if(province==str||province_long==str){
		    		pro_code=Int(key);
		    	}
		    }
		 window.dataObj.province_code=pro_code;
		   $('.province_name').text(str);
		   getData('filter',1,'province',pro_code);
		   $('body','html').animate({scrollTop:'1000px'});
		}
	    }
	});
              options.series[0].data=[];
              var area=window.dataObj.area;
	 for(var key in area){
		var province=area[key]['name'];
		var pro_count=window.dataObj.province_count;
		var num=0;
		province=province.substring(0,2);
		if(province=='黑龙') {province='黑龙江'}
		if(province=='内蒙') {province='内蒙古'}
		for(var i in pro_count){
			if(key==pro_count[i][0]){num=pro_count[i][1]}
		}
		options.series[0].data.push({name:province,value:num});

	}
             myChart.refresh();
            myChart.setOption(options);
        }); 
    //page
    $(document).on('click','.pagenation li',function(){
   	var $this=$(this);
   	var id=Int($this.attr('data-id'));
   	var page_total=window.dataObj.page_total;
   	var province_code=window.dataObj.province_code;
   	$('.pagenation li').removeClass('active').eq(id-1).addClass('active');
   	if(id==1){
   		$('.pre_page').hide();
   		$('.next_page').show().attr({'data-id':id+1});;
   	}
   	else if(id==page_total){
   		$('.next_page').hide();
   		$('.pre_page').show().attr({'data-id':id-1});;
   	}
   	else if(1<id<page_total){
   		$('.pre_page').show().attr({'data-id':id-1});
   		$('.next_page').show().attr({'data-id':id+1});
   	}
   	getData('filter',id,'province',province_code);
	});
     $(document).on('click','.pre_page',function(){
     	var $this=$(this);
   	var id=Int($this.attr('data-id'));
   	var province_code=window.dataObj.province_code;
   	$('.next_page').show();
   	getData('filter',id,'province',province_code);
   	$this.attr({'data-id':id-1});
   	$('.next_page').show().attr({'data-id':id+1});
   	$('.pagenation li').removeClass('active').eq(id-1).addClass('active');
   	
     });
     $(document).on('click','.next_page',function(){
     	var $this=$(this);
   	var id=Int($this.attr('data-id'));
   	var province_code=window.dataObj.province_code;
   	$('.pre_page').show();
   	getData('filter',id,'province',province_code);
   	$this.attr({'data-id':id+1});
   	$('.pre_page').show().attr({'data-id':id-1});
   	$('.pagenation li').removeClass('active').eq(id-1).addClass('active');

     });
});
var shopTotal=function(){
	var total_count=$('#total_count').val().toString();
	var n_length=total_count.length;
	var num_2=Int(total_count.substring(0,1));
	var num_3=Int(total_count.substring(1,2));
	var num_4=Int(total_count.substring(2,3));
	var number=[num_2,num_3,num_4];
	number=bubbleSort(number);
	window.dataObj.time=number+1;  
	var n4=0;
	var n3=0;
	var n2=0;
	var n1=0;
	var count=function(time,num_4,num_3,num_2,num_1) {
		    if (window.dataObj.time == 0) {
		        window.dataObj.time =time;
		    }
		    else {
		        window.dataObj.time--;
		        var num4=$('.num4').text();
		        var num3=$('.num3').text();
		        var num2=$('.num2').text();
		        var num1=$('.num1').text();
		        if(num4!=num_4) $('.num4').text(n4++);
		        else {$('.num4').text(num_4)}
		        if(num3!=num_3) $('.num3').text(n3++);
		        else {$('.num3').text(num_3)}
		        if(num2!=num_2) $('.num2').text(n2++);
		        else {$('.num2').text(num_2)}
		        setTimeout(function() {
		                count(time,num_4,num_3,num_2,num_1)
		            },
		            50)
		    }
	}    
	count(number+1,num_4,num_3,num_2);  
}


var getData=function(action,page,type,data){
	var url='';
	var action =action;
	var args={
		action:action,
		page:page
	};
	if(action=='filter') {
		if(type=='province'){args.province=data}
	
	}
	$.postJson(url,args,function(res){
	if(res.success){
        if(window.dataObj.shop_item==undefined){
            $.getItem('/static/items/official/shop_item.html?v=20150613',function(data){
                window.dataObj.shop_item=data;
                initShop(res);
            });
        }else{
            initShop(res);
        }
    }else {
        $(".shop_list").css("display","none");
        //return $.noticeBox(res.error_text);
    }
	},function(){
            $(".shop_list").css("display","none");
           // return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')
        }
	);
}
function initShop(res){
    var shops=res.shoplist;
    window.dataObj.page_total=res.page_total;
    var page_total=window.dataObj.page_total;
    $('.shoplist').empty();
    if(shops.length>0) {
        for(var i in shops){
            var $item=$(window.dataObj.shop_item);
            var shop_code=shops[i]['shop_code'];
            var shop_trademark_url=shops[i]['shop_trademark_url'];
            var shop_name=shops[i]['shop_name'];
            var shop_province=shops[i]['shop_province'];
            var shop_city=shops[i]['shop_city'];
            var shop_intro=shops[i]['shop_intro'];
            var owner=shops[i]['shop_admin_name'];
            //province and city
            var area=window.dataObj.area;
            if(shop_city==shop_province) {shop_city=''}
            for(var pro in area){
                if(pro==shop_province){shop_province=area[pro]['name']}
                for(var cit in area[pro]['city']){
                    if(shop_city&&cit==shop_city){shop_city=area[pro]['city'][cit]['name']}

                }
            }
            if(!shop_trademark_url) {shop_trademark_url='/static/images/TDSG_l.png'}
            $item.find('.shop_link').attr({'href':'/'+shop_code});
            $item.find('.shop_log').attr({'src':shop_trademark_url+'?imageView2/1/w/470/h/470'});
            $item.find('.shop_name').text(shop_name);
            $item.find('.owner').text(owner);
            $item.find('.area').text(shop_province+shop_city);
            $item.find('.shop_intro').text(shop_intro);
            $('.shoplist').append($item);
        }
    }else{
        $('.shoplist').empty().append('<h4 class="font16 text-center"> 无结果</h4>')
    }
    if(page_total>1&&page!=page_total) {
        $('.pagenation').empty();
        $('.page_box').removeClass('hidden');
        for(var i=1;i<=page_total;i++){
            $item=$('<li class="item"><a href="javascript:;"></a></li>');
            $item.attr({'data-id':i});
            $item.find('a').text(i);
            $('.pagenation').append($item);
        }
        $('.next_page').show();
    }
    if(page_total==1) {
        $('.page_box').addClass('hidden');
    }
    if(page<=1){
        $('.pre_page').hide().attr({'data-id':1});
        $('.next_page').attr({'data-id':2});
    }
    if(page>=page_total){$('.next_page').hide();}
}