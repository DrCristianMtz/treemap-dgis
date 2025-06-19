var administrador_tablero = {
	ruta: '',
	estados: [],
	anio_tablero: null,
	entidad_tablero: null,
	id_anio: 'anio',
	id_entidad: 'entidad',
};

administrador_tablero.cargarEstado = function(estado, anio){
	if(!this.tieneEstado(estado))
	{
		var administrador = this;
		abrirPantallaCarga();
		setTimeout(function(){
			$.ajax({
		        type:'GET',
		        url: 'ObtenerTablaJSON',
		        data: {ruta: administrador.ruta, hoja: estado},
		        dataType: 'json',
		        xhr: controlarProgresoPeticion,
		    }).done(function(data){
		    	if(data)
				{
					var temas = [];
					for(var j=0; j<data.conjuntos.length; j++)
		    		{
						var anios = [];
						for(var k=1; k<data.conjuntos[j].valores.length; k+=2)
			    		{
				    		anios.push({
				    			anio: data.etiquetas[k],
				    			valor: data.conjuntos[j].valores[k],
				    			acotacion: data.conjuntos[j].valores[k+1],
				    		});
			    		}
						temas.push({nombre: data.conjuntos[j].etiqueta, anios: anios});
		    		}
					administrador.estados.push({nombre: estado, temas: temas});
			    	
					administrador.mostrarInformacion(estado, anio);
				}
		    }).fail(function(a, b, c){
		    	console.log(a);
		    	console.log(b);
		    	console.log(c);
		    	alert ('Error al cargar la informaci\xF3n, intente nuevamente.')
		    }).always(function(){
		    	cerrarPantallaCarga();
		    });
		}, 401);
	}
	else
	{
		this.mostrarInformacion(estado, anio);
	}
}

administrador_tablero.tieneEstado = function(estado){
	for(var i=0; i<this.estados.length; i++)
	{
		if(this.estados[i].nombre == estado)
		{
			return true;
		}
	}
	return false;
}

administrador_tablero.mostrarInformacion = function(estado, anio){
	var estado_encontrado = false;
	var anio_encontrado = false;
	for(var i=0; i<this.estados.length && !estado_encontrado; i++)
	{
		if(this.estados[i].nombre == estado)
		{
			for(var j=0; j<this.estados[i].temas.length; j++)
			{
				anio_encontrado = false;
				for(var k=0; k<this.estados[i].temas[j].anios.length && !anio_encontrado; k++)
				{
					if(this.estados[i].temas[j].anios[k].anio == anio)
					{
						var tema = eliminarAcentos(this.estados[i].temas[j].nombre.toLowerCase());
						$('[data-tema="' + tema + '"]').html(this.estados[i].temas[j].anios[k].valor);
						if(this.estados[i].temas[j].anios[k].acotacion)
						{
							$('[data-tema="' + tema + ' aco"]').html(this.estados[i].temas[j].anios[k].acotacion);
						}
						else
						{
							$('[data-tema="' + tema + ' aco"]').html('&nbsp;');
						}
						anio_encontrado = true;
					}
				}
			}
			estado_encontrado = true;
		}
	}
	
	if(!estado_encontrado)
	{
		alert ('Informaci\xF3n de la entidad no encontrada.')
		if(this.entidad_tablero)
		{
			$('#' + this.id_entidad).val(this.entidad_tablero);
		}
	}
	else if(!anio_encontrado)
	{
		alert ('Informaci\xF3n del a\xF1o no encontrada.')
		if(this.anio_tablero)
		{
			$('#' + this.id_anio).val(this.anio_tablero);
		}
	}
	else
	{
		this.anio_tablero = $('#' + this.id_anio).val();
		this.entidad_tablero = $('#' + this.id_entidad).val();
	}
}

function eliminarAcentos(cadena)
{
	while(cadena.indexOf('\xE1') >= 0 || cadena.indexOf('\xE9') >= 0 || cadena.indexOf('\xED') >= 0 || cadena.indexOf('\xF3') >= 0 || cadena.indexOf('\xFA') >= 0
			|| cadena.indexOf('\xFC') >= 0 || cadena.indexOf('\xF1') >= 0)
	{
		cadena = cadena.replace('\xE1', 'a');
		cadena = cadena.replace('\xE9', 'e');
		cadena = cadena.replace('\xED', 'i');
		cadena = cadena.replace('\xF3', 'o');
		cadena = cadena.replace('\xFA', 'u');
		cadena = cadena.replace('\xFC', 'u');
		cadena = cadena.replace('\xF1', 'n');
	}
	
	return cadena;
}

$(document).ready(function(){
	administrador_tablero.ruta = '/tablero/tablero_general_prueba.xlsx';
	administrador_tablero.anio_tablero = $('#' + administrador_tablero.id_anio).val();
	administrador_tablero.entidad_tablero = $('#' + administrador_tablero.id_entidad).val();
	
	$('#' + administrador_tablero.id_anio + ', ' + '#' + administrador_tablero.id_entidad).change(function(){
		administrador_tablero.cargarEstado($('#' + administrador_tablero.id_entidad).val(), $('#' + administrador_tablero.id_anio).val());
	});
	administrador_tablero.cargarEstado($('#' + administrador_tablero.id_entidad).val(), $('#' + administrador_tablero.id_anio).val());
});
