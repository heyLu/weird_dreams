d=document;a=function(x){var a=[];for(var i=0;i<x.length;i++){a.push(x[i]);};return a;};w=a(d.querySelectorAll("h1,h2,h3,h4,h5,h6,p")).reduce(function(a,n){a.push.apply(a,n.textContent.split(/\s+/));return a;},[]);p=0;n=function(){if(p<w.length){d.body.innerHTML="<h1 style='font-size:60pt'>"+w[p];p++;}};window.setInterval(n,150);
