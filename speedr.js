b=document.body;w=b.textContent.split(/\s+/);p=0;setInterval(function(){p<w.length?b.innerHTML="<h1 style='font-size:60pt'>"+w[p++]:0},150)
