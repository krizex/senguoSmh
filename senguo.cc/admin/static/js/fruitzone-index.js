$(document).ready(function(){
	// $('.province_img').animate({
	// 	'opacity':1,
	// 	'width':'260px'
	// },600);
 	var total_count=$('#total_count').val().toString();
	var n_length=total_count.length;
	var num_2=Int(total_count.substring(0,1));
	var num_3=Int(total_count.substring(1,2));
	var num_4=Int(total_count.substring(2,3));
	var number=[num_2,num_3,num_4];
	number=bubbleSort(number);
	var wait=number+1;
              var n4=0;
              var n3=0;
              var n2=0;
              var n1=0;
              var t=3;
	function time(target) {
	    if (wait == 0) {
	        wait = number+1;
	    }
	    else {
	        wait--;
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
	                time(target)
	            },
	            90)
	    }
	};
	function count(target) {
	    if (t == 0) {
	     $('.btn').animate({'opacity':'1'});
	     $('.box').animate({'top':'60px'});
	      time();
	    }
	    else {
	        t--;
	        setTimeout(function() {
	                count(target)
	            },
	            500)
	    }
	};
	count();
});

function bubbleSort(arr){
    for(var i=0;i<arr.length;i++){
        for(var j=i;j<arr.length;j++){
            if(arr[i]<arr[j]){
                var temp=arr[i];
                arr[i]=arr[j];
                arr[j]=temp;
            }
        }
    }
    return arr[0];
}