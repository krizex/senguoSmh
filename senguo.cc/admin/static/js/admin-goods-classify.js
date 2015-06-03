var _type,_sub_type;
$(document).ready(function(){
	getData('fruit','color');
	_type = 'fruit';
	_sub_type = 'color';
}).on('click','.furit-type li',function(){
	var $this=$(this);
	$this.addClass('active').siblings('li').removeClass('active');
	var type = $this.attr('data-type');
	_type=type;
	getData(type,_sub_type);
}).on('click','.pro-list li',function(){
	var $this=$(this);
	var pro = $this.attr('data-pro');
	var text =$this.text();
	_sub_type = pro;
	$('.select-now').text(text);
	getData(_type,pro);
});

function getData(type,sub_type){
	 $.ajax({
	        url:'/admin/goods/classify?type='+type+'&sub_type='+sub_type,
	        type:"get",
	        success:function(res){
	            if(res.success){
	            		var data = res.data;
	            		$('.fruit-list').empty();
	            		var item='<li>'+
			'<p class="title {{property}}">{{name}}</p>'+
			'<ul class="fruit-item-list group">'+
			 	'{{each types as type}}'+
				'<li><a href="/admin/goods/all?type=classify&type_id={{type.id}}">{{type.name}}</a></li>'+
				'{{/each}}'+
			'</ul>'+
			'</li>';
			for(var d in data){
				if(data[d]['data'].length!=0){
					var render = template.compile(item);
					var html = render({
						property:data[d]['property'],
						name:data[d]['name'],
						types:data[d]['data']
					});
					$('.fruit-list').append(html);
				}
				
			}

	            }
	        }
	 });
	
}