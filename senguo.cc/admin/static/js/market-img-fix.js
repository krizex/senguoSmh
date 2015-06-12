function fixclass(t1,t2,t3,t4){
    var item1=document.getElementsByClassName(t1);
    var item2=document.getElementsByClassName(t2);
    var item3=document.getElementsByClassName(t3);
    var item4=document.getElementsByClassName(t4);
    for (var i = 0; i < item1.length; i++) {
        var width=item3[i].clientWidth;
        var inner=item4[i].clientHeight;
        item1[i].style.height=(width+12)+'px';
        item4[i].style.marginTop=(width-inner)/2+'px';
        item2[i].style.height=width/2+'px';
        item2[i].style.lineHeight=width/2+'px';
    }
}

