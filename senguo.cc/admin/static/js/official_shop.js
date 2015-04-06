$.getItem('/static/items/official/shop_item.html?v=2015-0320',function(data){window.dataObj.shop_item=data;});  
$(document).ready(function(){ 
    //shop total number
     shopTotal();
    //get top8
    getData('top');
    //map data
    var province_code;
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
	        trigger: 'item',
	        formatter: '{b}'
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
	        }
	    }
	    for(var key in area){
              	var province=area[key]['name'].substring(0,2);
	    	if(province==str){
	    		pro_code=Int(key);
	    	}
	    }
	    province_code=pro_code;
	   $('.province_name').text(str);
	   getData('filter',1,'province',pro_code);
	   $('.pagenation li').first().addClass('active');
	})
            myChart.setOption(options);
        }); 
    //page
    $(document).on('click','.pagenation li',function(){
   	var $this=$(this);
   	var id=Int($this.attr('data-id'));
   	$this.addClass('active');
   	if(id==1){
   		$('.pre_page').hide();
   		$('.next_page').show();
   	}
   	else if(id==window.dataObj.page_total){
   		$('.next_page').hide();
   		$('.pre_page').show();
   	}
   	else if(1<id<window.dataObj.page_total){
   		$('.pre_page').show().attr({'data-id':id-1});
   		$('.next_page').show().attr({'data-id':id+1});
   	}
   	getData('filter',id,'province',province_code);
	});
     $(document).on('click','.pre_page',function(){
     	var $this=$(this);
   	var id=Int($this.attr('data-id'));
   	$('.next_page').show();
   	getData('filter',id,'province',province_code);
   	
     });
     $(document).on('click','.next_page',function(){
     	var $this=$(this);
   	var id=Int($this.attr('data-id'));
   	$('.pre_page').show();
   	getData('filter',id,'province',province_code);

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
	if(res.success)
	{
		var shops=res.shoplist;
		window.dataObj.page_total=res.page_total;
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
			//province and city
			var area=window.dataObj.area;
			for(var pro in area){
				if(pro==shop_province){shop_province=area[pro]['name']}
				for(var cit in area[pro]['city']){
					if(shop_city&&cit==shop_city){shop_city=area[pro]['city'][cit]['name']}
					else if(cit==pro) {shop_city=''}
					
				}
			}
			if(!shop_trademark_url) {shop_trademark_url='/static/design_img/TDSG_l.png'}
			$item.find('.shop_link').attr({'href':'/'+shop_code});
			$item.find('.shop_log').attr({'src':shop_trademark_url+'?imageView/1/w/470/h/470'});
			$item.find('.shop_name').text(shop_name);
			$item.find('.owner').text(shop_name);
			$item.find('.area').text(shop_province+shop_city);
			$item.find('.shop_intro').text(shop_intro);
			$('.shoplist').append($item);
		}
	        }
	        else{$('.shoplist').empty().append('<h4 class="font16 text-center"> 无结果</h4>')}
	        if(window.dataObj.page_total>1&&page!=window.dataObj.page_total) {
	        	$('.pagenation').empty();
	        	$('.page_box').removeClass('hidden');
	        	for(var i=1;i<=window.dataObj.page_total;i++){
	        		$item=$('<li class="item"><a href="javascript:;"></a></li>');
	        		$item.attr({'data-id':i});
	        		$item.find('a').text(i);
	        		$('.pagenation').append($item);
	        	}
	        	$('.next_page').show().attr({'data-id':2});
	        }
	        if(page<=1){$('.pre_page').hide();}
   	        if(page>=window.dataObj.page_total){$('.next_page').hide();}	
	}
	else return $.noticeBox(res.error_text);
	},function(){return $.noticeBox('网络好像不给力呢~ ( >O< ) ~')}
	);
}