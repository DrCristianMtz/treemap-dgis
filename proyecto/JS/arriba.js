
$(window).scroll(function(){
  if($(this).scrollTop() > 300){ //condiciÃ³n a cumplirse cuando el usuario aya bajado 301px a mÃ¡s.
    $("#js_up").slideDown(300); //se muestra el botÃ³n en 300 mili segundos
  }else{ // si no
    $("#js_up").slideUp(300); //se oculta el botÃ³n en 300 mili segundos
  }
});

$(document).ready(function(){
//creamos una funciÃ³n accediendo a la etiqueta i en su evento click
$("#js_up i").on('click', function (e) { 
  e.preventDefault(); //evita que se ejecute el tag ancla (<a href="#">valor</a>).
  $("body,html").animate({ // aplicamos la funciÃ³n animate a los tags body y html
    scrollTop: 0 //al colocar el valor 0 a scrollTop me volverÃ¡ a la parte inicial de la pÃ¡gina
  },700); //el valor 700 indica que lo ara en 700 mili segundos
   //rompe el bucle return false;
   
});

//creamos una funciÃ³n accediendo a la etiqueta a en su evento click
$('a.ancla').click(function(e){       
    e.preventDefault();   //evitar el eventos del enlace normal
    var strAncla=$(this).attr('href'); //id del ancla
      $('body,html').stop(true,true).animate({        
        scrollTop: $(strAncla).offset().top - window.innerHeight/2
        },700);
    
});



//creamos una funciÃ³n accediendo a la etiqueta a en su evento click
$('a.ancla2').click(function(e){       
    e.preventDefault();   //evitar el eventos del enlace normal
    	var strAncla=$(this).attr('href'); //id del ancla
     	var elemento1=$('#lista').children().first().offset().top;
     	var elemento2=$('#lista').offset().top;
     	var elemento3=$(strAncla).offset().top;
     	    $('#lista').stop(true,true).animate({        
        		scrollTop: Math.abs(elemento1-elemento2)+elemento3-elemento2
        	},700);
    

});

});






