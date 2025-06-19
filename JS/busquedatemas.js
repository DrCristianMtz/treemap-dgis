var USUARIO_NIVEL_ENTIDAD = 1;
var USUARIO_NIVEL_JURISDICCION = 2;
var USUARIO_NIVEL_CLUES = 3;
var USUARIO_NIVEL_DGIS = 4;

var GA_ID = '';

$(document).ready(function(){
	if(location.href.toUpperCase().indexOf('SINBA02DES') >= 0)
	{
		//Desarrollo
		GA_ID = 'UA-146799909-1';
	}
	else if(location.href.toUpperCase().indexOf('SINAISCAP') >= 0)
	{
		//Productivo
		GA_ID = 'UA-147140302-1';
	}
	
  var idtab= buscarValorUrl("tab");
  if (idtab) {
          $('.nav-link.active').removeClass('active');
          $('.tab-pane.show.active').removeClass('active show');

          var tabs = idtab.split("|");
          for(var i=0; i<tabs.length; i++)
          {
            $('#'+tabs[i]+'-tab').addClass('active');
            $('#'+tabs[i]).addClass('active show');
          }
        }

  var url= buscarValorUrl("contenidoframe");
  var idtabmenu= buscarValorUrl("tabdestino");
  var id= buscarValorUrl("collapse");
  
  if(url)
  { 
    navegar(url,id,idtabmenu, undefined, undefined, function(){
    	$('#idPaciente').change(function(){
    		if(typeof obtenerHistoriaClinica == 'function')
			{
    			obtenerHistoriaClinica($(this).val());
			}
    	});
    	$('#id').change(function(){
    		if(typeof desplegarNotaMedica == 'function')
			{
    			desplegarNotaMedica($(this).val());
			}
    		if(typeof desplegarMedicamento == 'function')
			{
    			desplegarMedicamento($(this).val());
			}
    	});
    	$('#idPaciente').val('').change();
    	$('#id').val('').change();
    });
    obtenerNumeroRegistros(url);
    $('#mensaje_seleccionar_plantilla').hide();
    plantillaCargada = true;
  }

  enlazarListGroupItems();
  generarTitlesTruncados();
  activarEmpujeElementosMenuLateral();
  enlazarMenusDesplegablesMovil();
  
  try{
	  var modal_dia_tipico_mostrado = window.sessionStorage.getItem('MODAL_RECURSOS_SALUD_MOSTRADO');
	  if(!modal_dia_tipico_mostrado)
	  {
		  activarModal('modal_recursos_salud');
		  window.sessionStorage.setItem('MODAL_RECURSOS_SALUD_MOSTRADO', true);
	  }
  } catch(e){
	  activarModal('modal_recursos_salud');
  }
  
  try
  {
	  window.dataLayer = window.dataLayer || [];
	  function gtag(){dataLayer.push(arguments);}
	  gtag('js', new Date());
	  gtag('config', GA_ID);
	  
	  ga('create', GA_ID, 'auto');
	  ga('send', 'pageview');
  }catch(e){}
  
  $(window).resize(function(){
	  asignarAnchosScrolls(0);
  });
  
  $('.selectpicker.generico').selectpicker({actionsBox: false, width: '100%', dropupAuto: false});
});

function buscarValorUrl(parametro)
{
  var search = window.location.search;
  search = search.replace('?', '');
  var parametros = search.split('&');
  
  var valor = '';
  for(var i=0; i<parametros.length; i++)
  {
    if(parametros[i].indexOf(parametro+"=")!=-1)
    {
     
      valor = parametros[i].replace(parametro+'=', '');
    
    }
  }
  if(!valor)
  {
	  valor= $("#"+parametro).val();
  }
  return valor;
}


function navegar(url, id, idtab, idframe, animar, funcion_final) {
  if(idframe == undefined){idframe = 'frame';}
  if(animar == undefined){animar = true;}
  if(funcion_final == undefined){funcion_final = function(){};}
	
	abrirPantallaCarga();
	setTimeout(function(){
	    $.ajax({
	      type: "POST",
	      url: url,
	      xhr: controlarProgresoPeticion,
	    }).done(function(datos){
	    	$("#" + idframe).html('');
	    	
	    	if(typeof verificarExistenciaGraficas == 'function')
			{
	    		verificarExistenciaGraficas();
			}
	    	
	        $("#" + idframe).html(datos);
	        
	        if(typeof ajustarGraficas == 'function')
			{
	    		$('.nav-link').on('shown.bs.tab', function (e) {
	    			setTimeout(function(){
		    			ajustarGraficas();
	    			}, 100);
	    		});
			}
	        
	        if(animar && $('#frame').length > 0)
	        {
	          $('html,body').animate({ scrollTop:$('#frame').offset().top-420 },700);
	        }
	        
	        if (id!="" && id!=undefined && id!="#") { 
	            $('.collapse.show').removeClass('show');
	            $(id).addClass('show');
	            }
	        if (idtab!="" && idtab!=undefined && idtab !="#") {
	            $('.nav-link.active').removeClass('active');
	            $('.tab-pane.show.active').removeClass('active show');
	            $(idtab+'-tab').addClass('active');
	            $(idtab).addClass('active show');
	         }
	        
	        $('.selectpicker.generico').selectpicker({actionsBox: false, width: '100%', dropupAuto: false});
	        
	         funcion_final();
	      }).fail(function(){
	      	alert("Error de conexi\xf3n, intente nuevamente.");
	      }).always(function(){
	          cerrarPantallaCarga();
	      });
	}, 401);
  }

var plantillaCargada = false;
function cargarPlantilla(idModal, url, parametros, subsistemaDestino, saltarConfirmacion)
{
	if(saltarConfirmacion == undefined){saltarConfirmacion = false;}
	
	var subsistemaActual = $('#subsistema').val();
	var plantillaActual = $('#contenidoframe').val();
	
	if(plantillaCargada && !saltarConfirmacion)
	{
		$('#' + idModal).modalb('toggle');
	}
	else if(subsistemaActual != subsistemaDestino)
	{
		abrirPantallaCarga();
		noConfirmarSalida();
		$('#contenidoframe').val(url);
		$('#tabdestino').val(parametros);
		$('#subsistema').val(subsistemaDestino);
		$('#form_navegar').submit();
	}
	else
	{
		$('#contenidoframe').val(url);
		$('#tabdestino').val(parametros);
        $('#subsistema').val(subsistemaDestino);

        if($('#selector_panel').length > 0 && panel_actual != '2')
        {
            $('#selector_panel').dropdown('set selected', '0');
        }

        $('#modal_identificacion_unidad input, #modal_identificacion_unidad select').unbind();
        $('#modal_datos_profesional input, #modal_datos_profesional select').unbind();
        $('#modal_datos_paciente input, #modal_datos_paciente select').unbind();
        activarElemento('servicioAtencion');
        
        if(plantillaActual != url)
    	{
	        $('#contenido_buscar_profesional').html('');
	        $('#contenedor_busqueda_registros_resultados').html('');
	        $('#contenedor_busqueda_registros_elementos').html('');
	    	$('#contenedor_busqueda_registros_paginado').html('');
    	}
    
        navegar(url, '', parametros, undefined, undefined, function(){
        	if(typeof panel_actual != 'undefined')
    		{
        		$('#selector_panel').dropdown('set selected', panel_actual);
    		}
        	
        	$('#idPaciente').change(function(){
        		if(typeof obtenerHistoriaClinica == 'function')
    			{
        			obtenerHistoriaClinica($(this).val());
    			}
        	});
        	$('#id').change(function(){
        		if(typeof desplegarNotaMedica == 'function')
    			{
        			desplegarNotaMedica($(this).val());
    			}
        		if(typeof desplegarMedicamento == 'function')
    			{
        			desplegarMedicamento($(this).val());
    			}
        	});
        	$('#idPaciente').val('').change();
        	$('#id').val('').change();
        });
        
    	obtenerNumeroRegistros(url);
    	
    	$('#mensaje_seleccionar_plantilla').hide();
        
		plantillaCargada = true;
		
		if(typeof valores_actuales_desplegar_hist_clin != 'undefined')
		{
			valores_actuales_desplegar_hist_clin = '';
		}
		
		try
		{
			var ls = obtenerAlmacenamiento();
			ls.setItem(NOMBRE_VARIABLE_RECORDAR_SERVICIO, 0);
		}
		catch(e){}
	}
}

function recargarPlantilla()
{
	$('.nav-link.btn_peis.active').click();
}

function obtenerNumeroRegistros(url)
{
	var elementos_ruta = url.split('/');
	var plantilla = elementos_ruta[elementos_ruta.length - 1];
	var servicio = '';
	
	$('.ocultar-deteccion').show();
	$('.ocultar-atencion-distancia').show();
	if(plantilla)
	{
		$('#fechaConsultaInicioBRegistro').siblings('label').html('Fecha de consulta inicial');
		$('#fechaConsultaFinBRegistro').siblings('label').html('Fecha de consulta final');
		if(plantilla == ID_PLANTILLA_CE)
		{
			servicio = 'ConsultaExternaServicio';
		}
		else if(plantilla == ID_PLANTILLA_PF)
		{
			servicio = 'PlanificacionFamiliarServicio';
		}
		else if(plantilla == ID_PLANTILLA_D)
		{
			servicio = 'DeteccionServicio';
			$('.ocultar-deteccion').hide();
			$('#relacionTemporalBRegistro').val('');
			$('#codigoD1BRegistro').val('');
			$('#descripcionDiagnosticoBRegistro').val('');
			
			$('#fechaConsultaInicioBRegistro').siblings('label').html('Fecha de detecci&oacute;n inicial');
			$('#fechaConsultaFinBRegistro').siblings('label').html('Fecha de detecci&oacute;n final');
		}
		else if(plantilla == ID_PLANTILLA_SB)
		{
			servicio = 'SaludBucalServicio';
		}
		else if(plantilla == ID_PLANTILLA_SM)
		{
			servicio = 'SaludMentalServicio';
		}
		else if(plantilla == ID_PLANTILLA_TE)
		{
			servicio = 'TarjetaEmbarazoServicio';
			$('.ocultar-deteccion').hide();
			$('#relacionTemporalBRegistro').val('');
			$('#codigoD1BRegistro').val('');
			$('#descripcionDiagnosticoBRegistro').val('');
		}
		else if(plantilla == ID_PLANTILLA_AD)
		{
			servicio = 'AtencionDistanciaServicio';
			$('.ocultar-atencion-distancia').hide();
			$('#relacionTemporalBRegistro').val('');
			$('#codigoD1BRegistro').val('');
			$('#descripcionDiagnosticoBRegistro').val('');
			
			$('#fechaConsultaInicioBRegistro').siblings('label').html('Fecha de atenci&oacute;n inicial');
			$('#fechaConsultaFinBRegistro').siblings('label').html('Fecha de atenci&oacute;n final');
		}
		else if(plantilla == ID_PLANTILLA_EG)
		{
			servicio = 'EgresosServicio';
		}
		else if(plantilla == ID_PLANTILLA_LS)
		{
			servicio = 'LesionesServicio';
		}
		else if(plantilla == ID_PLANTILLA_UR)
		{
			servicio = 'UrgenciasServicio';
		}
		/*else if(plantilla == ID_PLANTILLA_OCH)
		{
			servicio = 'Servicio';
		}*/
		else if(plantilla == ID_PLANTILLA_INF)
		{
			servicio = 'InfraestructuraServicio';
		}
		/*else if(plantilla == ID_PLANTILLA_PER)
		{
			servicio = 'Servicio';
		}
		else if(plantilla == ID_PLANTILLA_INS)
		{
			servicio = 'Servicio';
		}
		else if(plantilla == ID_PLANTILLA_MED)
		{
			servicio = 'Servicio';
		}*/
	}
	
	if(servicio)
	{
		/*abrirPantallaCarga();
		setTimeout(function(){
			$.ajax({
		    	type:'GET',
			    url: servicio,
			    data: {accion: 'conteo'},
			    dataType: "json",
			    xhr: controlarProgresoPeticion,
			}).done(function(data){
				$('#contenedor_busqueda_registros_total').html(data);
			}).fail(function(){
				if(typeof mostrarMensaje == 'function')
				{
					mostrarMensaje(MSJ_ERROR_CONEXION, MENSAJE_ERROR);
				}
				else
				{
					alert("Error de conexi\xf3n, intente nuevamente.");
				}
			}).always(function(){
				cerrarPantallaCarga();
			});
		}, 401);*/
	}
}

var ctd_patallas_carga = 0;
var max_pantallas_carga = 0;
function abrirPantallaCarga()
{
	if(ctd_patallas_carga == 0)
	{
		$("#pantalla_carga").fadeIn();
	}
	ctd_patallas_carga++;
	max_pantallas_carga++;
}

function cerrarPantallaCarga()
{
	setTimeout(function(){
		ctd_patallas_carga--;
		if(ctd_patallas_carga <= 0)
		{
			ctd_patallas_carga = 0;
			max_pantallas_carga = 0;
			
			//progresos_descarga = {};
			progreso_anterior = 0;
			
			colocarValorBarraCarga(100);
			setTimeout(function(){
				ocultarBarraCarga();
				$("#pantalla_carga").fadeOut();
			}, 400);
		}
	}, 400);
}

function redireccionar(url, abrir_carga)
{
    if(abrir_carga == undefined){abrir_carga = false;}

    if(abrir_carga)
    {
        abrirPantallaCarga();
    }

    location.href = url;
}

function abrirVentana(url, ancho, alto)
{
	if(ancho == undefined){ancho = '800';}
	if(alto == undefined){alto = '500';}
	
	if(url.indexOf('GenerarTabla') >= 0 && url.search(/&hoja=.+/) >= 0)
	{
		var adicionales_titulo = '';
		var selects_visibles = $('select:visible');
		var ctd_adicionales = 0;
		for(var i=0; i<selects_visibles.length; i++)
		{
			var select = $(selects_visibles[i]);
			if(select.prop('id').indexOf('_leyendas') < 0)
			{
				if(ctd_adicionales > 0)
				{
					adicionales_titulo += '%7C';
				}
				adicionales_titulo += select.find('option:selected').text();
				ctd_adicionales++;
			}
		}
		
		url += '&adicionalesTitulo=' + adicionales_titulo;
	}
	
	window.open(url, '_blank', "width=" + ancho + ",height=" + alto);
}

function abrirPestana(url)
{
	window.open(url, '_blank');
	
	enviarHitEtiqueta(url);
}

function cambiarSrc(id, url)
{
	$('#' + id).attr('src', url);
}

function cambiarEstadoCollapse(id_collapse)
{
    $('#' + id_collapse).collapse('toggle');
}

function enlazarListGroupItems()
{
    $('.card-header[onclick^=navegar], .list-group-item').click(function(){
        $('.card-header.active').removeClass('active');
        $('.list-group-item.active').removeClass('active');
        $(this).addClass('active');
        $(this).parent().parent().siblings('.card-header').addClass('active');
        
        if($('.boton-despliegue').is(':visible') && menu_desplegado)
    	{
        	$('.boton-despliegue').click();
    	}
    });
}

function clickListGroupItem(id_padre)
{
    var bt = $('#' + id_padre);
    var fclick = bt.attr('onclick')
    if(fclick.search(/navegar/) >= 0)
    {
        $('#' + id_padre).click();
    }
    else
    {
        var id_collapse = fclick.match(/\(.*\)/)[0];
        if(id_collapse)
        {
            id_collapse = id_collapse.replace('(\'', '');
            id_collapse = id_collapse.replace('\')', '');
        }
        $('#' + id_padre).click();
        $('#' + id_collapse).find('[onclick^=navegar]').first().click();
    }
}

var menu_desplegado = false;
function desplegarMenuLateral()
{
	if(menu_desplegado)
	{
		$('#dimmer-menu-lateral').fadeOut(500);
		$('.menu_lateral').animate({left: '-90%'}, 500, function(){
			$('.boton-despliegue i').removeClass('fa-times');
			$('.boton-despliegue i').addClass('fa-bars');
			$('body').css('overflow', 'auto');
		});
		menu_desplegado = false;
	}
	else
	{
		$('#dimmer-menu-lateral').fadeIn(500);
		$('.menu_lateral').animate({left: '0%'}, 500, function(){
			$('.boton-despliegue i').removeClass('fa-bars');
			$('.boton-despliegue i').addClass('fa-times');
			$('body').css('overflow', 'hidden');
		});
		menu_desplegado = true;
	}
}

function generarTitlesTruncados()
{
	$.each($('.truncado'), function(i, v){
		var title = $(v).text();
		title = title.replace('|', '');
		  
		$(v).prop('title', title.trim());
	});
}

function generarTitlesTruncadosSelect()
{
	$.each($('.dropdown-menu span.text'), function(i, v){
		var title = $(v).text();
		$(v).parent().prop('title', title.trim());
	});
	
	$.each($('.bs-searchbox+.bs-actionsbox button'), function(i, v){
		var title = $(v).text();
		$(v).prop('title', title.trim());
	});
	
	$('.btn.dropdown-toggle').prop('title', '');
}

function activarEmpujeElementosMenuLateral()
{
	$('.menu_lateral .collapse').on('show.bs.collapse', function () {
		var top_collapse = $(this).parent().position().top;
		$('.menu_lateral').animate({ scrollTop: top_collapse}, 500);
	});
}

function enlazarMenusDesplegablesMovil()
{
	$('.navbar-toggler').click(function(){
		if($('.boton-despliegue').is(':visible') && menu_desplegado)
		{
			$('.boton-despliegue').click();
		}
	});
	$('.boton-despliegue').click(function(){
		if(!$('.navbar-toggler').hasClass('collapsed'))
		{
			$('.navbar-collapse').collapse('hide');
		}
	});
}

function activarModal(idModal)
{
	$('#' + idModal).modalb('toggle');
}

function corregirAcentos()
{
  var acentos = {
    '%BF': '\xBF',
    '%D1': '\xD1',
    '%F1': '\xF1',
    '%C1': '\xC1',
    '%C9': '\xC9',
    '%CD': '\xCD',
    '%D3': '\xD3',
    '%DA': '\xDA',
    '%DC': '\xDC',
    '%E1': '\xE1',
    '%E9': '\xE9',
    '%ED': '\xED',
    '%F3': '\xF3',
    '%FA': '\xFA',
    '%FC': '\xFC',
    '%20': '\x20',
    '%3C': '<',
    '%3E': '>',
  };
  var titulo = buscarValorUrl('titulo');
  
  var adicionales_titulo = buscarValorUrl('adicionalesTitulo');
  if(!adicionales_titulo)
  {
	  adicionales_titulo = '';
  }
  else
  {
	  while(adicionales_titulo.indexOf('%7C') >= 0)
	  {
		  adicionales_titulo = adicionales_titulo.replace('%7C', ' - ');
	  }
	  
	  if(adicionales_titulo)
	  {
		  titulo += ' - ' + adicionales_titulo;  
	  }
  }
  
  for(var k in acentos)
  {
    while(titulo.indexOf(k) >= 0)
    {
      titulo = titulo.replace(k, acentos[k]);
    }
  }
  
  $('h2').html(titulo);
  $('title').html(titulo);
}

//var progresos_descarga = {};
var progreso_anterior = 0;
function controlarProgresoPeticion()
{
	var xhr = new window.XMLHttpRequest();
	
	//Upload progress
	/*xhr.upload.addEventListener("progress", function(evt){
		if (evt.lengthComputable) {
			mostrarBarraCarga();
			var progreso = parseInt(evt.loaded / evt.total * 100);
			colocarValorBarraCarga(progreso);
		}
	}, false);*/
	
	//Download progress
	xhr.addEventListener("progress", function(evt){
		if (evt.lengthComputable) {
			mostrarBarraCarga();
			/*progresos_descarga[evt.total] = evt.loaded;
			
			var cargado = 0;
			var total = 0;
			for(var key in progresos_descarga)
			{
				cargado += progresos_descarga[key];
				total += parseInt(key);
			}
			
			var progreso = parseInt(cargado / total * 100);*/
			var progreso = parseInt((max_pantallas_carga - ctd_patallas_carga) / max_pantallas_carga * 100);
			
			if(progreso > 0)
			{
				if(progreso > progreso_anterior)
				{
					progreso_anterior = progreso;
				}
				else
				{
					progreso = progreso_anterior;
				}
			}
			
			colocarValorBarraCarga(progreso);
		}
	}, false);
	
	return xhr;
}

function controlarProgresoPeticionUnico()
{
	var xhr = new window.XMLHttpRequest();
	
	//Upload progress
	/*xhr.upload.addEventListener("progress", function(evt){
		if (evt.lengthComputable) {
			mostrarBarraCarga();
			var progreso = parseInt(evt.loaded / evt.total * 100);
			colocarValorBarraCarga(progreso);
		}
	}, false);*/
	
	//Download progress
	xhr.addEventListener("progress", function(evt){
		if (evt.lengthComputable) {
			mostrarBarraCarga();
			
			var progreso = parseInt(evt.loaded / evt.total * 100);
			colocarValorBarraCarga(progreso);
		}
	}, false);
	
	return xhr;
}

function mostrarBarraCarga()
{
	$('#pantalla_carga .progress').fadeIn();
}

function ocultarBarraCarga()
{
	$('#pantalla_carga .progress').fadeOut(undefined, function(){
		colocarValorBarraCarga(0);
	});
}

var CLASE_0_40_PORCIENTO = 'bg-p7420';
var CLASE_40_70_PORCIENTO = 'bg-p465';
var CLASE_70_100_PORCIENTO = 'bg-p626';
var SELECTOR_BARRA_CARGA = '#pantalla_carga .progress .progress-bar';
function colocarValorBarraCarga(valor)
{
	if(!valor || valor < 0)
	{
		valor = 0;
	}
	else if(valor > 100)
	{
		valor = 100;
	}
	
	$(SELECTOR_BARRA_CARGA).width(valor + '%');
	$(SELECTOR_BARRA_CARGA).attr("aria-valuenow", valor);
	$(SELECTOR_BARRA_CARGA).text(valor + '%');
	
	if(valor >= 0 && valor <= 40)
	{
		$(SELECTOR_BARRA_CARGA).addClass(CLASE_0_40_PORCIENTO);
		$(SELECTOR_BARRA_CARGA).removeClass(CLASE_40_70_PORCIENTO);
		$(SELECTOR_BARRA_CARGA).removeClass(CLASE_70_100_PORCIENTO);
	}
	else if(valor > 40 && valor <= 70)
	{
		$(SELECTOR_BARRA_CARGA).removeClass(CLASE_0_40_PORCIENTO);
		$(SELECTOR_BARRA_CARGA).addClass(CLASE_40_70_PORCIENTO);
		$(SELECTOR_BARRA_CARGA).removeClass(CLASE_70_100_PORCIENTO);
	}
	else
	{
		$(SELECTOR_BARRA_CARGA).removeClass(CLASE_0_40_PORCIENTO);
		$(SELECTOR_BARRA_CARGA).removeClass(CLASE_40_70_PORCIENTO);
		$(SELECTOR_BARRA_CARGA).addClass(CLASE_70_100_PORCIENTO);
	}
}

function enlazarSelectsConPostfijoId(postfijo_id)
{
	$('[id$=' + postfijo_id + ']').change(function(){
		var valor = $(this).val();
		$.each($('[id$=' + postfijo_id + ']'), function(i, e){
			var valor_anterior = $(e).val(); 
			if(valor_anterior != valor)
			{
				$(e).val(valor);
				if($(e).val())
				{
					$(e).change();
				}
				else
				{
					$(e).val(valor_anterior);
				}
			}
		});
	});
}

var usuario_login = '';
var contrasena_login = '';
function login(id_usuario, id_contrasena, id_contrasena_nueva, id_confirmar_contrasena_nueva)
{
	var usuario = $('#' + id_usuario).val();
	var contrasena = md5($('#' + id_contrasena).val());
	
	usuario_login = usuario;
	contrasena_login = contrasena;
	
	var data = {};
	
	if(id_contrasena_nueva && id_confirmar_contrasena_nueva)
	{
		var ele_contrasena_nueva = $('#' + id_contrasena_nueva);
		var msj_contrasena_nueva = ele_contrasena_nueva.siblings('.invalid-feedback');
		var ele_confirmar_contrasena_nueva = $('#' + id_confirmar_contrasena_nueva);
		var msj_confirmar_contrasena_nueva = ele_confirmar_contrasena_nueva.siblings('.invalid-feedback');
		
		var contrasena_nueva = ele_contrasena_nueva.val();
		var confirmar_contrasena_nueva = ele_confirmar_contrasena_nueva.val();
		
		var contrasena_nueva_valida = true;
		if(contrasena_nueva)
		{
			if(contrasena_nueva.length >= 8)
			{
				if(contrasena_nueva.indexOf(' ') < 0)
				{
					ele_contrasena_nueva.removeClass('is-invalid');
				}
				else
				{
					ele_contrasena_nueva.addClass('is-invalid');
					msj_contrasena_nueva.html('No se aceptan espacios');
					contrasena_nueva_valida = false;
				}
			}
			else
			{
				ele_contrasena_nueva.addClass('is-invalid');
				msj_contrasena_nueva.html('Longitud m&iacute;nima de 8 caracteres');
				contrasena_nueva_valida = false;
			}
		}
		else
		{
			ele_contrasena_nueva.addClass('is-invalid');
			msj_contrasena_nueva.html('Campo requerido');
			contrasena_nueva_valida = false;
		}
		
		if(confirmar_contrasena_nueva)
		{
			if(confirmar_contrasena_nueva === contrasena_nueva)
			{
				ele_confirmar_contrasena_nueva.removeClass('is-invalid');
			}
			else
			{
				ele_confirmar_contrasena_nueva.addClass('is-invalid');
				msj_confirmar_contrasena_nueva.html('La confirmaci&oacute;n es diferente a la contrase&ntilde;a');
				contrasena_nueva_valida = false;
			}
		}
		else
		{
			ele_confirmar_contrasena_nueva.addClass('is-invalid');
			msj_confirmar_contrasena_nueva.html('Campo requerido');
			contrasena_nueva_valida = false;
		}
		
		if(!contrasena_nueva_valida)
		{
			if($('.form-control.is-invalid').length > 0)
			{
				$('.form-control.is-invalid').first().focus();
			}
			return false;
		}
		
		data = {
			usuario: usuario,
			contrasena: contrasena,
			contrasenaNueva: md5(contrasena_nueva),
		};
	}
	else
	{
		data = {
			usuario: usuario,
			contrasena: contrasena
		};
	}
	
	abrirPantallaCarga();
	setTimeout(function(){
		$.ajax({
	    	type:'POST',
		    url: 'LoginServicio',
		    data: data,
		    dataType: "json",
		    //xhr: controlarProgresoPeticion,
		}).done(function(data){
		    if(data.resultado == '1')
	    	{
		    	depurarAlmacenamientoLocal();
		    	
		    	if(data.contrasenaCambiada)
	    		{
		    		alert("Contrase\xF1a actualizada correctamente.");
	    		}
		    	
		    	if(verificarUbicacionLogin())
		    	{
		    		if(typeof noConfirmarSalida == 'function')
		    		{
		    			noConfirmarSalida();
		    		}
		    		
		    		location.reload();
		    	}
		    	else
	    		{
		    		location.href = 'SinbaApp';
	    		}
	    	}
		    else if(data.resultado == '2')
	    	{
		    	if(data.contrasenaCambiada)
	    		{
		    		$('#' + id_contrasena).val(contrasena_nueva);
		    		alert("Contrase\xF1a actualizada correctamente.");
	    		}
		    	
		    	mostrarLogins(data.usuarios, id_usuario, id_contrasena);
		    	$('#form_login_peiis').hide();
		    	$('#contrasena_login_peiis').hide();
		    	$('#footer_login_peiis').hide();
		    	$('#list_login_peiis').show();
		    	cerrarPantallaCarga();
	    	}
		    else if(data.resultado == '3')
	    	{
		    	alert("Usuario o contrase\xF1a inv\xE1lidos.");
		    	cerrarPantallaCarga();
	    	}
		    else if(data.resultado == '4')
	    	{
		    	$('#form_login_peiis').hide();
		    	$('#btn_ingresar_login_peiis').hide();
		    	$('#btn_cancelar_login_peiis').hide();
		    	$('#contrasena_login_peiis').show();
		    	$('#btn_cambiar_login_peiis').show();
		    	cerrarPantallaCarga();
	    	}
		    else
	    	{
		    	alert("Sesi\xf3n iniciada previamente.");
		    	cerrarPantallaCarga();
	    	}
		}).fail(function(){
			alert("Error de conexi\xf3n, intente nuevamente.");
			cerrarPantallaCarga();
		});
	}, 401);
}

function mostrarLogins(usuarios, id_usuario, id_contrasena)
{
	var html = '';
	for(var i=0; i<usuarios.length; i++)
	{
		var onclick = 'onclick="seleccionUsuario(';
		onclick +=  '\'' + usuarios[i].idPersona + '\',';
		onclick +=  '\'' + usuarios[i].idEntidad + '\',';
		onclick +=  '\'' + usuarios[i].idJurisdiccion + '\',';
		onclick +=  '\'' + usuarios[i].clues + '\'';
		onclick +=  ')"';
		
		html += '<button class="list-group-item list-group-item-action" ' + onclick + '>';
		html += usuarios[i].login;
		if(usuarios[i].nivelUsuario)
		{
			if(usuarios[i].nivelUsuario == USUARIO_NIVEL_ENTIDAD)
			{
				html += ' - ENTIDAD';
			}
			else if(usuarios[i].nivelUsuario == USUARIO_NIVEL_JURISDICCION)
			{
				html += ' - JURISDICCI\xD3N';
			}
			else if(usuarios[i].nivelUsuario == USUARIO_NIVEL_CLUES)
			{
				html += ' - CLUES';
			}
			else
			{
				html += ' - DGIS';
			}
		}
		html += '</button>';
	}
	
	$('#list_login_peiis .list-group').html(html);
}

function seleccionUsuario(persona, entidad, jurisdiccion, clues)
{
	abrirPantallaCarga();
	setTimeout(function(){
		$.ajax({
	    	type:'POST',
		    url: 'LoginServicio',
		    data: {
		    	accion: 'seleccionUsuario',
		    	usuario: usuario_login,
		    	contrasena: contrasena_login,
		    	idPersona: persona,
		    	idEntidad: entidad,
		    	idJurisdiccion: jurisdiccion,
		    	clues: clues
		    },
		    dataType: "json",
		    //xhr: controlarProgresoPeticion,
		}).done(function(data){
		    if(data.resultado == '1')
	    	{
		    	depurarAlmacenamientoLocal();
		    	
		    	if(verificarUbicacionLogin())
		    	{
		    		if(typeof noConfirmarSalida == 'function')
		    		{
		    			noConfirmarSalida();
		    		}
		    		
		    		location.reload();
		    	}
		    	else
	    		{
		    		location.href = 'SinbaApp';
	    		}
	    	}
		    else if(data.resultado == '2')
	    	{
		    	alert("Error al ingresar con el usuario, intente nuevamente.");
		    	cerrarPantallaCarga();
	    	}
		    else
	    	{
		    	alert("Usuario o contrase\xF1a inv\xE1lidos.");
		    	$('#form_login_peiis').show();
		    	$('#footer_login_peiis').show();
		    	$('#list_login_peiis').hide();
		    	cerrarPantallaCarga();
	    	}
		}).fail(function(){
			alert("Error de conexi\xf3n, intente nuevamente.");
			cerrarPantallaCarga();
		});
	}, 401);
}

function logout()
{
	if(typeof noConfirmarSalida == 'function')
	{
		noConfirmarSalida();
	}
	
	abrirPantallaCarga();
	setTimeout(function(){
		$.ajax({
	    	type:'GET',
		    url: '/SISindependientes/salir',
		    //dataType: "json",
		    //xhr: controlarProgresoPeticion,
		}).done(function(data){
			logoutApp();
		}).fail(function(error){
			if(error.status == 404)
			{
				logoutApp();
			}
			else
			{
				alert("Error de conexi\xf3n, intente nuevamente.");
				cerrarPantallaCarga();
			}
		});
	}, 401);
}

function logoutApp()
{
	$.ajax({
    	type:'POST',
	    url: 'LoginServicio',
	    data: {accion: 'logout'},
	    dataType: "json",
	    //xhr: controlarProgresoPeticion,
	}).done(function(data){
		depurarAlmacenamientoLocal();
		
		location.reload();
	}).fail(function(){
		alert("Error de conexi\xf3n, intente nuevamente.");
		cerrarPantallaCarga();
	});
}

function verificarUbicacionLogin()
{
	if(location.pathname.toUpperCase().indexOf('SinbaApp') >= 0
	   || location.pathname.toUpperCase().indexOf('APP') >= 0
	   || location.pathname.toUpperCase().indexOf('CONOCESINBA') >= 0
	   || location.pathname.toUpperCase().indexOf('GOBI') >= 0
	   || location.pathname.toUpperCase().indexOf('USUARIOS') >= 0
	   || location.pathname.toUpperCase().indexOf('ESTADISTICAS') >= 0
	   || location.pathname.toUpperCase().indexOf('ESTADISTICASSEUL') >= 0
	   || location.pathname.toUpperCase().indexOf('BLOQUEOCAPTURA') >= 0
	   || location.pathname.toUpperCase().indexOf('CARGAMASIVA') >= 0)
	{
		return true;
	}
	return false;
}

function depurarAlmacenamientoLocal()
{
	try
	{
		var elementos_eliminar = [];
		ls = window.localStorage;
		
		/*for(var k in ls)
		{
			if(k.indexOf('BANDEJA_ADMISION_') >= 0 || k.indexOf('PACIENTE_GENERAL_') >= 0)
			{
				elementos_eliminar.push(k);
			}
		}
		
		for(var i=0; i<elementos_eliminar.length; i++)
		{
			ls.removeItem(elementos_eliminar[i]);
		}*/
		
		ls.clear();
	}catch(e){}
}

function abrirGaleria(img, titulo, pie_pagina)
{
	if(img)
	{
		if(titulo == undefined){titulo = '';}
		if(pie_pagina == undefined){pie_pagina = '';}
		
		var src = $(img).prop('src');
		
		$('#titulo_modal_galeria').html(titulo);
		$('#img_modal_galeria').prop('src', src);
		$('#pie_pagina_modal_galeria').html(pie_pagina);
		$('#btn_descargar_modal_galeria').prop('href', src);
		
		activarModal('modal_galeria');
		
		enviarHitEtiqueta(src);
	}
}

function asignarAnchosScrolls(retraso)
{
	if(retraso == undefined){retraso = 200;}
	
	setTimeout(function(){
		var tablas = $('.table-responsive:visible');
		for(var i=0; i<tablas.length; i+=2)
		{
			asignarAncho(tablas[i]);
			enlazarScroll(tablas[i], true);
			if(tablas[i+1])
			{
				enlazarScroll(tablas[i+1], false);
			}
		}
	}, retraso);
}

function asignarAncho(sc_obj)
{
	var sc_obj_2 = $(sc_obj).next('.table-responsive');
	if(sc_obj_2.length > 0)
	{
		var tabla_1 = $(sc_obj).find('table');
		var tabla_2 = $(sc_obj_2).find('table');
		if(tabla_1.length > 0 && tabla_2.length > 0)
		{
			tabla_1.width(tabla_2.width());
			tabla_1.height(1);
		}
	}
}

function enlazarScroll(sc_obj, superior)
{
	var sc_obj_2 = null;
	if(superior)
	{
		sc_obj_2 = $(sc_obj).next('.table-responsive');
	}
	else
	{
		sc_obj_2 = $(sc_obj).prev('.table-responsive');
	}
	$(sc_obj).unbind('scroll');
	$(sc_obj).scroll(function(){
		if($(sc_obj_2).scrollLeft() != $(this).scrollLeft())
		{
			$(sc_obj_2).scrollLeft($(this).scrollLeft());
		}
	});
}

function desplegarBusqueda(seccion, apartado, tab)
{
	if(!$('#heading' + seccion).hasClass('active'))
	{
		$('#heading' + seccion).click();
	}
	$('#collapse' + seccion + '>div>a:nth-child(' + apartado + ')').click();
	
	activarModal('modal_busqueda_temas');
	
	activarTab(tab);
}

function activarTab(tab)
{
	if(ctd_patallas_carga > 0)
	{
		setTimeout(function(){
			activarTab(tab)
		}, 10);
	}
	else
	{
		$('#' + tab + '-tab').click();
	}
}

function descargarDatos(id_entidad)
{
	abrirPantallaCarga();
	setTimeout(function(){
		$.ajax({
	    	type:'POST',
		    url: 'DescargarDatosServicio',
		    data: {idEntidad: id_entidad},
		    dataType: "json",
		    //xhr: controlarProgresoPeticion,
		}).done(function(data){
			if(data.tipo == 'success')
	    	{
		    	var dataJson = JSON.parse(data.data);
		    	redireccionar('DescargarDatosServicio?uuidArchivo=' + dataJson.archivo);
		    	activarModal('modal_descarga_datos');
	    	}
		    else
	    	{
		    	alert(data.mensaje);
	    	}
		}).fail(function(){
			alert("Error de conexi\xf3n, intente nuevamente.");
		}).always(function(){
			cerrarPantallaCarga();
		});
	}, 401);
}

var GA_CATEGORIA_SIN_CATEGORIA = 'SIN_CATEGORIA';
var GA_CATEGORIA_TABLERO_GENERAL = 'TABLERO_GENERAL';
var GA_CATEGORIA_TABLERO_DIA_TIPICO = 'TABLERO_DIA_TIPICO';
var GA_CATEGORIA_TABLERO_RECURSOS_SALUD = 'TABLERO_RECURSOS_SALUD';
var GA_CATEGORIA_TABLERO_NACIMIENTOS_ANIO_RESIDENCIA = 'TABLERO_NACIMIENTOS_ANIO_RESIDENCIA';
var GA_CATEGORIA_TABLERO_NACIMIENTOS_ENTIDAD_RESIDENCIA = 'TABLERO_NACIMIENTOS_ENTIDAD_RESIDENCIA';
var GA_CATEGORIA_TABLERO_NACIMIENTOS_ANIO_OCURRENCIA = 'TABLERO_NACIMIENTOS_ANIO_OCURRENCIA';
var GA_CATEGORIA_TABLERO_NACIMIENTOS_ENTIDAD_OCURRENCIA = 'TABLERO_NACIMIENTOS_ENTIDAD_OCURRENCIA';
var GA_CATEGORIA_TABLERO_DEFUNCIONES_ANIO = 'TABLERO_DEFUNCIONES_ANIO';
var GA_CATEGORIA_TABLERO_DEFUNCIONES_ENTIDAD = 'TABLERO_DEFUNCIONES_ENTIDAD';
var GA_CATEGORIA_TABLERO_DEFUNCIONES_CAUSAS = 'TABLERO_DEFUNCIONES_CAUSAS';
var GA_CATEGORIA_TABLERO_DEFUNCIONES_FETALES = 'TABLERO_DEFUNCIONES_FETALES';
var GA_CATEGORIA_TABLERO_SERVICIOS_POBLACION = 'TABLERO_SERVICIOS_POBLACION';
var GA_CATEGORIA_TABLERO_SERVICIOS_ANIO = 'TABLERO_SERVICIOS_ANIO';
var GA_CATEGORIA_TABLERO_SERVICIOS_ENTIDAD = 'TABLERO_SERVICIOS_ENTIDAD';
var GA_CATEGORIA_TABLERO_SERVICIOS_CONSULTA = 'TABLERO_SERVICIOS_CONSULTA';
var GA_CATEGORIA_TABLERO_SERVICIOS_AUXILIARES_DIAGNOSTICO = 'TABLERO_SERVICIOS_AUXILIARES_DIAGNOSTICO';
var GA_CATEGORIA_TABLERO_SERVICIOS_REPRODUCTIVA = 'TABLERO_SERVICIOS_REPRODUCTIVA';
var GA_CATEGORIA_TABLERO_SERVICIOS_PLANIFICACION_FAMILIAR = 'TABLERO_SERVICIOS_PLANIFICACION_FAMILIAR';
var GA_CATEGORIA_TABLERO_SERVICIOS_MUJER = 'TABLERO_SERVICIOS_MUJER';
var GA_CATEGORIA_TABLERO_SERVICIOS_NINO = 'TABLERO_SERVICIOS_NINO';
var GA_CATEGORIA_TABLERO_SERVICIOS_ADULTO = 'TABLERO_SERVICIOS_ADULTO';
var GA_CATEGORIA_TABLERO_SERVICIOS_MICOBACTERIOSIS = 'TABLERO_SERVICIOS_MICOBACTERIOSIS';
var GA_CATEGORIA_TABLERO_SERVICIOS_BUCAL = 'TABLERO_SERVICIOS_BUCAL';
var GA_CATEGORIA_TABLERO_SERVICIOS_MENTAL = 'TABLERO_SERVICIOS_MENTAL';
var GA_CATEGORIA_TABLERO_SERVICIOS_INFORMES = 'TABLERO_SERVICIOS_INFORMES';
var GA_CATEGORIA_TABLERO_RECURSOS_PERSONAL = 'TABLERO_RECURSOS_PERSONAL';
var GA_CATEGORIA_TABLERO_RECURSOS_MEDICOS = 'TABLERO_RECURSOS_MEDICOS';
var GA_CATEGORIA_TABLERO_RECURSOS_EQUIPO = 'TABLERO_RECURSOS_EQUIPO';
var GA_CATEGORIA_TABLERO_RECURSOS_ESTABLECIMIENTOS = 'TABLERO_RECURSOS_ESTABLECIMIENTOS';
var GA_CATEGORIA_TABLERO_RECURSOS_FISICOS = 'TABLERO_RECURSOS_FISICOS';
var GA_CATEGORIA_TABLERO_EGRESOS_ANIO = 'TABLERO_EGRESOS_ANIO';
var GA_CATEGORIA_TABLERO_EGRESOS_ENTIDAD = 'TABLERO_EGRESOS_ENTIDAD';
var GA_CATEGORIA_TABLERO_EGRESOS_TIPO = 'TABLERO_EGRESOS_TIPO';
var GA_CATEGORIA_TABLERO_EGRESOS_CONSULTA = 'TABLERO_EGRESOS_CONSULTA';
var GA_CATEGORIA_TABLERO_LESIONES_ANIO = 'TABLERO_LESIONES_ANIO';
var GA_CATEGORIA_TABLERO_LESIONES_ENTIDAD = 'TABLERO_LESIONES_ENTIDAD';
var GA_CATEGORIA_TABLERO_URGENCIAS_ANIO = 'TABLERO_URGENCIAS_ANIO';
var GA_CATEGORIA_TABLERO_URGENCIAS_ENTIDAD = 'TABLERO_URGENCIAS_ENTIDAD';
var GA_CATEGORIA_TABLERO_GASTO_INDICADORES = 'TABLERO_GASTO_INDICADORES';
var GA_CATEGORIA_TABLERO_GASTO_OBJETO = 'TABLERO_GASTO_OBJETO';
var GA_CATEGORIA_TABLERO_GASTO_CFA = 'TABLERO_GASTO_CFA';
var GA_CATEGORIA_TABLERO_INDICADORES_VITALES_ENTIDAD = 'TABLERO_INDICADORES_VITALES_ENTIDAD';
var GA_CATEGORIA_TABLERO_INDICADORES_VITALES_MUNICIPIO = 'TABLERO_INDICADORES_VITALES_MUNICIPIO';
var GA_CATEGORIA_TABLERO_INDICADORES_VITALES_JURISDICCION = 'TABLERO_INDICADORES_VITALES_JURISDICCION';
var GA_CATEGORIA_TABLERO_INDICADORES_DEMOGRAFICOS = 'TABLERO_INDICADORES_DEMOGRAFICOS';
var GA_CATEGORIA_TABLERO_INDICADORES_MORTALIDAD = 'TABLERO_INDICADORES_MORTALIDAD';
var GA_CATEGORIA_TABLERO_INDICADORES_MORTALIDAD_MATERNA = 'TABLERO_INDICADORES_MORTALIDAD_MATERNA';
var GA_CATEGORIA_TABLERO_INDICADORES_MORTALIDAD_INFANTIL = 'TABLERO_INDICADORES_MORTALIDAD_INFANTIL';
var GA_CATEGORIA_TABLERO_ANALISIS_PUBLICACIONES = 'TABLERO_ANALISIS_PUBLICACIONES';
var GA_CATEGORIA_TABLERO_ANALISIS_MAPAS = 'TABLERO_ANALISIS_MAPAS';

//Datos abiertos
var GA_CATEGORIA_TABLERO_DEFUNCIONES_DA = 'TABLERO_DEFUNCIONES_DA';

//Analisis de Datos
	//DEF INEGI
var GA_CATEGORIA_TASAS_ESTANDARIZADAS = 'TASAS_ESTANDARIZADAS';
	
	//CLUES - NIVEL
var GA_CATEGORIA_CLUES_NIVEL_NAL = 'CLUES_NIVEL_NAL';

var GA_CATEGORIA_CLUES_NIVEL_AS = 'CLUES_NIVEL_AS';
var GA_CATEGORIA_CLUES_NIVEL_BC = 'CLUES_NIVEL_BC';
var GA_CATEGORIA_CLUES_NIVEL_BS = 'CLUES_NIVEL_BS';
var GA_CATEGORIA_CLUES_NIVEL_CC = 'CLUES_NIVEL_CC';
var GA_CATEGORIA_CLUES_NIVEL_CL = 'CLUES_NIVEL_CL';
var GA_CATEGORIA_CLUES_NIVEL_CM = 'CLUES_NIVEL_CM';
var GA_CATEGORIA_CLUES_NIVEL_CS = 'CLUES_NIVEL_CS';
var GA_CATEGORIA_CLUES_NIVEL_CH = 'CLUES_NIVEL_CH';
var GA_CATEGORIA_CLUES_NIVEL_DF = 'CLUES_NIVEL_DF';
var GA_CATEGORIA_CLUES_NIVEL_DG = 'CLUES_NIVEL_DG';
var GA_CATEGORIA_CLUES_NIVEL_GT = 'CLUES_NIVEL_GT';
var GA_CATEGORIA_CLUES_NIVEL_GR = 'CLUES_NIVEL_GR';
var GA_CATEGORIA_CLUES_NIVEL_HG = 'CLUES_NIVEL_HG';
var GA_CATEGORIA_CLUES_NIVEL_JC = 'CLUES_NIVEL_JC';
var GA_CATEGORIA_CLUES_NIVEL_MC = 'CLUES_NIVEL_MC';
var GA_CATEGORIA_CLUES_NIVEL_MN = 'CLUES_NIVEL_MN';
var GA_CATEGORIA_CLUES_NIVEL_MS = 'CLUES_NIVEL_MS';
var GA_CATEGORIA_CLUES_NIVEL_NT = 'CLUES_NIVEL_NT';
var GA_CATEGORIA_CLUES_NIVEL_NL = 'CLUES_NIVEL_NL';
var GA_CATEGORIA_CLUES_NIVEL_OC = 'CLUES_NIVEL_OC';
var GA_CATEGORIA_CLUES_NIVEL_PL = 'CLUES_NIVEL_PL';
var GA_CATEGORIA_CLUES_NIVEL_QT = 'CLUES_NIVEL_QT';
var GA_CATEGORIA_CLUES_NIVEL_QR = 'CLUES_NIVEL_QR';
var GA_CATEGORIA_CLUES_NIVEL_CP = 'CLUES_NIVEL_CP';
var GA_CATEGORIA_CLUES_NIVEL_SL = 'CLUES_NIVEL_SL';
var GA_CATEGORIA_CLUES_NIVEL_SR = 'CLUES_NIVEL_SR';
var GA_CATEGORIA_CLUES_NIVEL_TC = 'CLUES_NIVEL_TC';
var GA_CATEGORIA_CLUES_NIVEL_TS = 'CLUES_NIVEL_TS';
var GA_CATEGORIA_CLUES_NIVEL_TL = 'CLUES_NIVEL_TL';
var GA_CATEGORIA_CLUES_NIVEL_VZ = 'CLUES_NIVEL_VZ';
var GA_CATEGORIA_CLUES_NIVEL_YN = 'CLUES_NIVEL_YN';
var GA_CATEGORIA_CLUES_NIVEL_ZS = 'CLUES_NIVEL_ZS';

//CLUES - NIVEL INSTITUCION
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_NAL = 'CLUES_NIVEL_INSTITUCION_NAL';

var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_AS = 'CLUES_NIVEL_INSTITUCION_AS';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_BC = 'CLUES_NIVEL_INSTITUCION_BC';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_BS = 'CLUES_NIVEL_INSTITUCION_BS';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_CC = 'CLUES_NIVEL_INSTITUCION_CC';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_CL = 'CLUES_NIVEL_INSTITUCION_CL';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_CM = 'CLUES_NIVEL_INSTITUCION_CM';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_CS = 'CLUES_NIVEL_INSTITUCION_CS';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_CH = 'CLUES_NIVEL_INSTITUCION_CH';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_DF = 'CLUES_NIVEL_INSTITUCION_DF';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_DG = 'CLUES_NIVEL_INSTITUCION_DG';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_GT = 'CLUES_NIVEL_INSTITUCION_GT';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_GR = 'CLUES_NIVEL_INSTITUCION_GR';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_HG = 'CLUES_NIVEL_INSTITUCION_HG';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_JC = 'CLUES_NIVEL_INSTITUCION_JC';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_MC = 'CLUES_NIVEL_INSTITUCION_MC';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_MN = 'CLUES_NIVEL_INSTITUCION_MN';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_MS = 'CLUES_NIVEL_INSTITUCION_MS';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_NT = 'CLUES_NIVEL_INSTITUCION_NT';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_NL = 'CLUES_NIVEL_INSTITUCION_NL';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_OC = 'CLUES_NIVEL_INSTITUCION_OC';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_PL = 'CLUES_NIVEL_INSTITUCION_PL';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_QT = 'CLUES_NIVEL_INSTITUCION_QT';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_QR = 'CLUES_NIVEL_INSTITUCION_QR';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_CP = 'CLUES_NIVEL_INSTITUCION_CP';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_SL = 'CLUES_NIVEL_INSTITUCION_SL';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_SR = 'CLUES_NIVEL_INSTITUCION_SR';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_TC = 'CLUES_NIVEL_INSTITUCION_TC';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_TS = 'CLUES_NIVEL_INSTITUCION_TS';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_TL = 'CLUES_NIVEL_INSTITUCION_TL';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_VZ = 'CLUES_NIVEL_INSTITUCION_VZ';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_YN = 'CLUES_NIVEL_INSTITUCION_YN';
var GA_CATEGORIA_CLUES_NIVEL_INSTITUCION_ZS = 'CLUES_NIVEL_INSTITUCION_ZS';

//ATENCION MATERNA
var GA_CATEGORIA_ATENCION_MATERNA_AS = 'ATENCION_MATERNA_AS';
var GA_CATEGORIA_ATENCION_MATERNA_BC = 'ATENCION_MATERNA_BC';
var GA_CATEGORIA_ATENCION_MATERNA_BS = 'ATENCION_MATERNA_BS';
var GA_CATEGORIA_ATENCION_MATERNA_CC = 'ATENCION_MATERNA_CC';
var GA_CATEGORIA_ATENCION_MATERNA_CL = 'ATENCION_MATERNA_CL';
var GA_CATEGORIA_ATENCION_MATERNA_CM = 'ATENCION_MATERNA_CM';
var GA_CATEGORIA_ATENCION_MATERNA_CS = 'ATENCION_MATERNA_CS';
var GA_CATEGORIA_ATENCION_MATERNA_CH = 'ATENCION_MATERNA_CH';
var GA_CATEGORIA_ATENCION_MATERNA_DF = 'ATENCION_MATERNA_DF';
var GA_CATEGORIA_ATENCION_MATERNA_DG = 'ATENCION_MATERNA_DG';
var GA_CATEGORIA_ATENCION_MATERNA_GT = 'ATENCION_MATERNA_GT';
var GA_CATEGORIA_ATENCION_MATERNA_GR = 'ATENCION_MATERNA_GR';
var GA_CATEGORIA_ATENCION_MATERNA_HG = 'ATENCION_MATERNA_HG';
var GA_CATEGORIA_ATENCION_MATERNA_JC = 'ATENCION_MATERNA_JC';
var GA_CATEGORIA_ATENCION_MATERNA_MC = 'ATENCION_MATERNA_MC';
var GA_CATEGORIA_ATENCION_MATERNA_MN = 'ATENCION_MATERNA_MN';
var GA_CATEGORIA_ATENCION_MATERNA_MS = 'ATENCION_MATERNA_MS';
var GA_CATEGORIA_ATENCION_MATERNA_NT = 'ATENCION_MATERNA_NT';
var GA_CATEGORIA_ATENCION_MATERNA_NL = 'ATENCION_MATERNA_NL';
var GA_CATEGORIA_ATENCION_MATERNA_OC = 'ATENCION_MATERNA_OC';
var GA_CATEGORIA_ATENCION_MATERNA_PL = 'ATENCION_MATERNA_PL';
var GA_CATEGORIA_ATENCION_MATERNA_QT = 'ATENCION_MATERNA_QT';
var GA_CATEGORIA_ATENCION_MATERNA_QR = 'ATENCION_MATERNA_QR';
var GA_CATEGORIA_ATENCION_MATERNA_CP = 'ATENCION_MATERNA_CP';
var GA_CATEGORIA_ATENCION_MATERNA_SL = 'ATENCION_MATERNA_SL';
var GA_CATEGORIA_ATENCION_MATERNA_SR = 'ATENCION_MATERNA_SR';
var GA_CATEGORIA_ATENCION_MATERNA_TC = 'ATENCION_MATERNA_TC';
var GA_CATEGORIA_ATENCION_MATERNA_TS = 'ATENCION_MATERNA_TS';
var GA_CATEGORIA_ATENCION_MATERNA_TL = 'ATENCION_MATERNA_TL';
var GA_CATEGORIA_ATENCION_MATERNA_VZ = 'ATENCION_MATERNA_VZ';
var GA_CATEGORIA_ATENCION_MATERNA_YN = 'ATENCION_MATERNA_YN';
var GA_CATEGORIA_ATENCION_MATERNA_ZS = 'ATENCION_MATERNA_ZS';



var GA_EVENTO_SIN_EVENTO = 'SIN_EVENTO';
var GA_EVENTO_TOTALES = 'TOTALES';
var GA_EVENTO_SEXO = 'SEXO';
var GA_EVENTO_AFECCIONES = 'AFECCIONES';
var GA_EVENTO_LUGAR_NACIMIENTO = 'LUGAR_NACIMIENTO';
var GA_EVENTO_AFILIACION = 'AFILIACION';
var GA_EVENTO_SITUACION_CONYUGAL = 'SITUACION_CONYUGAL';
var GA_EVENTO_ESCOLARIDAD = 'ESCOLARIDAD';
var GA_EVENTO_INDIGENAS = 'INDIGENAS';
var GA_EVENTO_PRINCIPALES_CAUSAS = 'PRINCIPALES_CAUSAS';
var GA_EVENTO_ANIO = 'ANIO';
var GA_EVENTO_ENTIDAD = 'ENTIDAD';
var GA_EVENTO_SEXO_ANIO = 'SEXO_ANIO';
var GA_EVENTO_SEXO_ENTIDAD = 'SEXO_ENTIDAD';
var GA_EVENTO_AFILIACION_ANIO = 'AFILIACION_ANIO';
var GA_EVENTO_AFILIACION_ENTIDAD = 'AFILIACION_ENTIDAD';
var GA_EVENTO_POBLACION_USUARIA = 'POBLACION_USUARIA';
var GA_EVENTO_CONSULTA_EXTERNA = 'CONSULTA_EXTERNA';
var GA_EVENTO_TIPO_CONSULTA = 'TIPO_CONSULTA';
var GA_EVENTO_TIPO_UNIDAD = 'TIPO_UNIDAD';
var GA_EVENTO_RELACION_TEMPORAL = 'RELACION_TEMPORAL';
var GA_EVENTO_CONSULTA_GENERAL = 'CONSULTA_GENERAL';
var GA_EVENTO_CONSULTA_ESPECIALIZADA = 'CONSULTA_ESPECIALIZADA';
var GA_EVENTO_TIPO_CONSULTA_ESPECIALIZADA = 'TIPO_CONSULTA_ESPECIALIZADA';
var GA_EVENTO_ODONTOLOGICAS = 'ODONTOLOGICAS';
var GA_EVENTO_AUXILIARES_DIAGNOSTICO = 'AUXILIARES_DIAGNOSTICO';
var GA_EVENTO_PRENATAL = 'PRENATAL';
var GA_EVENTO_PRIMERA_VEZ_EMBARAZADAS_ADOLESCENTES_ALTO_RIESGO = 'PRIMERA_VEZ_EMBARAZADAS_ADOLESCENTES_ALTO_RIESGO';
var GA_EVENTO_PUERPERAS = 'PUERPERAS';
var GA_EVENTO_NACIMIENTOS_ATENDIDOS = 'NACIMIENTOS_ATENDIDOS';
var GA_EVENTO_NACIDOS_VIVOS = 'NACIDOS_VIVOS';
var GA_EVENTO_NINOS_TAMIZADOS = 'NINOS_TAMIZADOS';
var GA_EVENTO_ABORTOS_MUERTES_FETALES = 'ABORTOS_MUERTES_FETALES';
var GA_EVENTO_PLANIFICACION_FAMILIAR = 'PLANIFICACION_FAMILIAR';
var GA_EVENTO_INTERVENCIONES_QUIRURGICAS = 'INTERVENCIONES_QUIRURGICAS';
var GA_EVENTO_POSTEVENTO_OBSTETRICO = 'POSTEVENTO_OBSTETRICO';
var GA_EVENTO_NUEVAS_ACEPTANTES_ANTICONCEPTIVOS = 'NUEVAS_ACEPTANTES_ANTICONCEPTIVOS';
var GA_EVENTO_USUARIOS_ACTIVOS_ANTICONCEPTIVOS = 'USUARIOS_ACTIVOS_ANTICONCEPTIVOS';
var GA_EVENTO_CANCER = 'CANCER';
var GA_EVENTO_NINO_SANO = 'NINO_SANO';
var GA_EVENTO_NUTRICION_MENORES_CINCO_ANIOS = 'NUTRICION_MENORES_CINCO_ANIOS';
var GA_EVENTO_NINOS_CONTROL_NUTRICION = 'NINOS_CONTROL_NUTRICION';
var GA_EVENTO_APLICACION_BIOLOGICOS = 'APLICACION_BIOLOGICOS';
var GA_EVENTO_DIARREA_AGUDA_MENORES_CINCO_ANIOS = 'DIARREA_AGUDA_MENORES_CINCO_ANIOS';
var GA_EVENTO_TRATAMIENTO_DIARREA_AGUDA = 'TRATAMIENTO_DIARREA_AGUDA';
var GA_EVENTO_HIDRATACION_ORAL = 'HIDRATACION_ORAL';
var GA_EVENTO_ENFERMEDADES_RESPIRATORIAS_AGUDAS = 'ENFERMEDADES_RESPIRATORIAS_AGUDAS';
var GA_EVENTO_CANCER_MENORES_DIECIOCHO = 'CANCER_MENORES_DIECIOCHO';
var GA_EVENTO_DIABETES = 'DIABETES';
var GA_EVENTO_HIPERTENSION = 'HIPERTENSION';
var GA_EVENTO_TUBERCULOSIS = 'TUBERCULOSIS';
var GA_EVENTO_LEPRA = 'LEPRA';
var GA_EVENTO_BUCAL = 'BUCAL';
var GA_EVENTO_CONSULTAS_SALUD_MENTAL = 'EVENTO_CONSULTAS_SALUD_MENTAL';
var GA_EVENTO_CONSULTAS_SALUD_MENTAL_UNIDAD = 'EVENTO_CONSULTAS_SALUD_MENTAL_UNIDAD';
var GA_EVENTO_CONSULTAS_SALUD_MENTAL_UNIDADCEYH = 'EVENTO_CONSULTAS_SALUD_MENTAL_UNIDADCEYH';
var GA_EVENTO_CONSULTAS_SALUD_MENTAL_UNIDADPYSM = 'EVENTO_CONSULTAS_SALUD_MENTAL_UNIDADPYSM';
var GA_EVENTO_CONSULTAS_SESIONES_PSICOLOGIA = 'EVENTO_CONSULTAS_SESIONES_PSICOLOGIA';
var GA_EVENTO_CONSULTAS_SALUD_MENTAL_ADICCIONES_CEYH = 'EVENTO_CONSULTAS_SALUD_MENTAL_ADICCIONES_CEYH';
var GA_EVENTO_CONSULTAS_SALUD_MENTAL_ADICCIONES_PYSM = 'EVENTO_CONSULTAS_SALUD_MENTAL_ADICCIONES_PYSM';
var GA_EVENTO_CONSULTAS_SALUD_MENTAL_ADICCIONES_UNEMES_CAPA = 'EVENTO_CONSULTAS_SALUD_MENTAL_ADICCIONES_UNEMES_CAPA';
var GA_EVENTO_CONSULTAS_ATENCION_ADICCIONES = 'EVENTO_CONSULTAS_ATENCION_ADICCIONES';
var GA_EVENTO_CONSULTAS_HOSPITAL_PSIQUIATRICO = 'CONSULTAS_HOSPITAL_PSIQUIATRICO';
var GA_EVENTO_ADICCIONES_HOSPITAL_PSIQUIATRICO = 'ADICCIONES_HOSPITAL_PSIQUIATRICO';
var GA_EVENTO_SESIONES_REHABILITACION = 'SESIONES_REHABILITACION';
var GA_EVENTO_PERSONAL_ANIO = 'PERSONAL_ANIO';
var GA_EVENTO_PERSONAL_ENTIDAD = 'PERSONAL_ENTIDAD';
var GA_EVENTO_PERSONAL_INSTITUCION = 'PERSONAL_INSTITUCION';
var GA_EVENTO_PERSONAL_TIPO = 'PERSONAL_TIPO';
var GA_EVENTO_PERSONAL_INSTITUCION_ENTIDAD = 'PERSONAL_INSTITUCION_ENTIDAD';
var GA_EVENTO_MEDICOS_ANIO = 'MEDICOS_ANIO';
var GA_EVENTO_MEDICOS_ENTIDAD = 'MEDICOS_ENTIDAD';
var GA_EVENTO_MEDICOS_INSTITUCION = 'MEDICOS_INSTITUCION';
var GA_EVENTO_MEDICOS_TIPO = 'MEDICOS_TIPO';
var GA_EVENTO_MEDICOS_INSTITUCION_ENTIDAD = 'MEDICOS_INSTITUCION_ENTIDAD';
var GA_EVENTO_EQUIPO_ANIO = 'EQUIPO_ANIO';
var GA_EVENTO_EQUIPO_ENTIDAD = 'EQUIPO_ENTIDAD';
var GA_EVENTO_EQUIPO_INSTITUCION = 'EQUIPO_INSTITUCION';
var GA_EVENTO_EQUIPO_TIPO = 'EQUIPO_TIPO';
var GA_EVENTO_ESTABLECIMIENTOS_ANIO = 'ESTABLECIMIENTOS_ANIO';
var GA_EVENTO_ESTABLECIMIENTOS_ENTIDAD = 'ESTABLECIMIENTOS_ENTIDAD';
var GA_EVENTO_ESTABLECIMIENTOS_INSTITUCION = 'ESTABLECIMIENTOS_INSTITUCION';
var GA_EVENTO_ESTABLECIMIENTOS_TIPO = 'ESTABLECIMIENTOS_TIPO';
var GA_EVENTO_ESTABLECIMIENTOS_INSTITUCION_ENTIDAD = 'ESTABLECIMIENTOS_INSTITUCION_ENTIDAD';
var GA_EVENTO_FISICOS_ANIO = 'FISICOS_ANIO';
var GA_EVENTO_FISICOS_ENTIDAD = 'FISICOS_ENTIDAD';
var GA_EVENTO_FISICOS_INSTITUCION = 'FISICOS_INSTITUCION';
var GA_EVENTO_FISICOS_TIPO = 'FISICOS_TIPO';
var GA_EVENTO_FISICOS_INSTITUCION_ENTIDAD = 'FISICOS_INSTITUCION_ENTIDAD';
var GA_EVENTO_EDAD = 'EDAD';
var GA_EVENTO_TIPO_VIOLENCIA_SEXO = 'TIPO_VIOLENCIA_SEXO';
var GA_EVENTO_TIPO_ATENCION_SEXO = 'TIPO_ATENCION_SEXO';

var GA_EVENTO_CONSIDERA_INDIGENA_SEXO = 'CONSIDERA_INDIGENA_SEXO';
var GA_EVENTO_DISCAPACIDAD_SEXO = 'DISCAPACIDAD_SEXO';

var GA_EVENTO_PARENTESCO_AGRESOR_SEXO = 'PARENTESCO_AGRESOR_SEXO';
var GA_EVENTO_DIAS_ESTANCIA = 'DIAS_ESTANCIA';
var GA_EVENTO_GRUPOS_DIAS_ESTANCIA = 'GRUPOS_DIAS_ESTANCIA';
var GA_EVENTO_MOTIVO = 'MOTIVO';
var GA_EVENTO_PROCEDENCIA = 'PROCEDENCIA';
var GA_EVENTO_ANESTESIA = 'ANESTESIA';
var GA_EVENTO_SERVICIOS = 'SERVICIOS';
var GA_EVENTO_SERVICIO = 'SERVICIO';
var GA_EVENTO_PROCEDIMIENTO = 'PROCEDIMIENTO';
var GA_EVENTO_ESPECIALIDAD = 'ESPECIALIDAD';
var GA_EVENTO_ATENCION_OBSTETRICA = 'ATENCION_OBSTETRICA';
var GA_EVENTO_NACIMIENTO = 'NACIMIENTO';
var GA_EVENTO_EGRESOS_CONSULTA_EXTERNA = 'EGRESOS_CONSULTA_EXTERNA';
var GA_EVENTO_AREA_ANATOMICA = 'AREA_ANATOMICA';
var GA_EVENTO_NOTIFICACIONES_MP = 'NOTIFICACIONES_MP';
var GA_EVENTO_DESTINO_POSTERIOR = 'DESTINO_POSTERIOR';
var GA_EVENTO_INTENCIONALIDAD = 'INTENCIONALIDAD';
var GA_EVENTO_REFERENCIA = 'REFERENCIA';
var GA_EVENTO_RESPONSABLE_ATENCION = 'RESPONSABLE_ATENCION';
var GA_EVENTO_SITIO_OCURRENCIA = 'SITIO_OCURRENCIA';
var GA_EVENTO_AGENTE = 'AGENTE';
var GA_EVENTO_MAYOR_CONSECUENCIA = 'MAYOR_CONSECUENCIA';
var GA_EVENTO_CAUSAS_EXTERNAS = 'CAUSAS_EXTERNAS';
var GA_EVENTO_MUJER_FERTIL = 'MUJER_FERTIL';
var GA_EVENTO_DERECHOHABIENCIA = 'DERECHOHABIENCIA';
var GA_EVENTO_TIPO_ATENCION = 'TIPO_ATENCION';
var GA_EVENTO_GASTO_TOTAL = 'GASTO_TOTAL';
var GA_EVENTO_GASTO_PUBLICO = 'GASTO_PUBLICO';
var GA_EVENTO_GASTO_PRIVADO = 'GASTO_PRIVADO';
var GA_EVENTO_GASTO_PUBLICO_PRIVADO_BOLSILLO = 'GASTO_PUBLICO_PRIVADO_BOLSILLO';
var GA_EVENTO_GASTO_PUBLICO_PIB = 'GASTO_PUBLICO_PIB';
var GA_EVENTO_GASTO_PUBLICO_FUENTE = 'GASTO_PUBLICO_FUENTE';
var GA_EVENTO_GASTO_PUBLICO_GPT = 'GASTO_PUBLICO_GPT';
var GA_EVENTO_POBLACION_OBJETIVO = 'POBLACION_OBJETIVO';
var GA_EVENTO_POBLACION_OBJETIVO_CAPITA = 'POBLACION_OBJETIVO_CAPITA';
var GA_EVENTO_POBLACION_SIN_SEGURIDAD = 'POBLACION_SIN_SEGURIDAD';
var GA_EVENTO_CAPITULO_GASTO = 'CAPITULO_GASTO';
var GA_EVENTO_MIL_SERVICIOS_PERSONALES = 'MIL_SERVICIOS_PERSONALES';
var GA_EVENTO_POBLACION_CON_SEGURIDAD = 'POBLACION_CON_SEGURIDAD';
var GA_EVENTO_GASTO_MEDICAMENTOS = 'GASTO_MEDICAMENTOS';
var GA_EVENTO_POBLACION_OBJETIVO_MEDICAMENTOS = 'POBLACION_OBJETIVO_MEDICAMENTOS';

var GA_EVENTO_CLASIFICACION_POR_FUNCIONES_ATENCION = 'CLASIFICACION_POR_FUNCIONES_ATENCION';
var GA_EVENTO_GASTO_TOTAL_SALUD_CFA = 'GASTO_TOTAL_SALUD_CF';
var GA_EVENTO_ATENCION_CURATIVA_HOSPITALARIA = 'ATENCION_CURATIVA_HOSPITALARIA';
var GA_EVENTO_ATENCION_CURATIVA_AMBULATORIA = 'ATENCION_CURATIVA_AMBULATORIA';
var GA_EVENTO_GOBIERNO_SISTEMA_ADMINISTRACION = 'GOBIERNO_SISTEMA_ADMINISTRACION';
var GA_EVENTO_GASTO_MEDICAMENTOS_CFA = 'GASTO_MEDICAMENTOS_CFA';

var GA_EVENTO_ESTADISTICAS_VITALES = 'ESTADISTICAS_VITALES';
var GA_EVENTO_MORTALIDAD = 'MORTALIDAD';
var GA_EVENTO_MORTALIDAD_INFANTIL = 'MORTALIDAD_INFANTIL';
var GA_EVENTO_MORTALIDAD_MENORES_CINCO_ANIOS = 'MORTALIDAD_MENORES_CINCO_ANIOS';


var GA_EVENTO_P_DGIS = 'P_DGIS';
var GA_EVENTO_P_INDICADORES	= 'P_INDICADORES';			
var GA_EVENTO_P_CARAVANAS = 'P_CARAVANAS';
var GA_EVENTO_P_NACIMIENTOS = 'P_NACIMIENTOS';
var GA_EVENTO_P_DEFUNCIONES = 'P_DEFUNCIONES';
var GA_EVENTO_P_EGRESOS = 'P_EGRESOS'; 
var GA_EVENTO_P_SICUENTAS = 'P_SICUENTAS';


var GA_EVENTO_SELECT_ANIO = 'SELECT_ANIO';
var GA_EVENTO_SELECT_ENTIDAD = 'SELECT_ENTIDAD';
var GA_EVENTO_SELECT_CAUSA = 'SELECT_CAUSA';
var GA_EVENTO_SELECT_EDAD = 'SELECT_EDAD';
var GA_EVENTO_SELECT_SEXO = 'SELECT_SEXO';
var GA_EVENTO_VISUALIZACION_ARCHIVO = 'VISUALIZACION_ARCHIVO';
var GA_EVENTO_DESCARGA_ARCHIVO = 'DESCARGA_ARCHIVO';


var GA_ETIQUETA_SIN_ETIQUETA = 'SIN_ETIQUETA';
var GA_ETIQUETA_VER_GRAFICA = 'VER_GRAFICA';
var GA_ETIQUETA_VER_CUADRO = 'VER_CUADRO';
var GA_ETIQUETA_VER_TABLA = 'VER_TABLA';
var GA_ETIQUETA_DESCARGAR_TABLA = 'DESCARGAR_TABLA';
var GA_ETIQUETA_COPIAR_TABLA = 'COPIAR_TABLA';

var ga_categoria = GA_CATEGORIA_SIN_CATEGORIA;
var ga_evento = GA_EVENTO_SIN_EVENTO;
var ga_etiqueta = GA_ETIQUETA_SIN_ETIQUETA;
function enviarHit(categoria, evento, etiqueta)
{
	if(categoria == undefined){categoria = ga_categoria;}
	if(evento == undefined){evento = ga_evento;}
	if(etiqueta == undefined){etiqueta = ga_etiqueta;}
	
	try
	{
		ga('send', {
			hitType: 'event',
			eventCategory: categoria,
			eventAction: evento,
			eventLabel: etiqueta,
			transport: 'beacon',
		});
	}catch(e){}
}

function enviarHitCategoria(categoria)
{
	if(categoria == undefined){categoria = GA_CATEGORIA_SIN_CATEGORIA;}
	
	if(categoria == GA_CATEGORIA_TABLERO_DIA_TIPICO)
	{
		enviarHit(GA_CATEGORIA_TABLERO_DIA_TIPICO, GA_EVENTO_SIN_EVENTO, GA_ETIQUETA_SIN_ETIQUETA);
	}
	else if(categoria == GA_CATEGORIA_TABLERO_RECURSOS_SALUD)
	{
		enviarHit(GA_CATEGORIA_TABLERO_RECURSOS_SALUD, GA_EVENTO_SIN_EVENTO, GA_ETIQUETA_SIN_ETIQUETA);
	}
	else
	{
		ga_categoria = categoria;
		ga_evento = GA_EVENTO_SIN_EVENTO;
		ga_etiqueta = GA_ETIQUETA_SIN_ETIQUETA;
		enviarHit();
	}
}

function enviarHitEvento(evento)
{
	if(evento == undefined){evento = GA_EVENTO_SIN_EVENTO;}
	
	ga_evento = evento;
	ga_etiqueta = GA_ETIQUETA_SIN_ETIQUETA;
	enviarHit();
}

function enviarHitEtiqueta(etiqueta)
{
	if(etiqueta == undefined){etiqueta = GA_ETIQUETA_SIN_ETIQUETA;}
	
	if(ga_evento == GA_EVENTO_SIN_EVENTO)
	{
		ga_evento = obtenerEventoPrincipal(ga_categoria);
	}
	
	ga_etiqueta = etiqueta;
	enviarHit();
}

function obtenerEventoPrincipal(categoria)
{
	if(categoria == GA_CATEGORIA_TABLERO_NACIMIENTOS_ANIO_RESIDENCIA)
	{
		return GA_EVENTO_TOTALES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_NACIMIENTOS_ENTIDAD_RESIDENCIA)
	{
		return GA_EVENTO_TOTALES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_NACIMIENTOS_ANIO_OCURRENCIA)
	{
		return GA_EVENTO_TOTALES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_NACIMIENTOS_ENTIDAD_OCURRENCIA)
	{
		return GA_EVENTO_TOTALES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_DEFUNCIONES_ANIO)
	{
		return GA_EVENTO_TOTALES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_DEFUNCIONES_ENTIDAD)
	{
		return GA_EVENTO_TOTALES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_DEFUNCIONES_FETALES)
	{
		return GA_EVENTO_ANIO;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_SERVICIOS_POBLACION)
	{
		return GA_EVENTO_POBLACION_USUARIA;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_SERVICIOS_ANIO)
	{
		return GA_EVENTO_CONSULTA_EXTERNA;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_SERVICIOS_ENTIDAD)
	{
		return GA_EVENTO_CONSULTA_EXTERNA;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_SERVICIOS_CONSULTA)
	{
		return GA_EVENTO_TIPO_UNIDAD;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_SERVICIOS_AUXILIARES_DIAGNOSTICO)
	{
		return GA_EVENTO_AUXILIARES_DIAGNOSTICO;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_SERVICIOS_REPRODUCTIVA)
	{
		return GA_EVENTO_PRENATAL;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_SERVICIOS_PLANIFICACION_FAMILIAR)
	{
		return GA_EVENTO_PLANIFICACION_FAMILIAR;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_SERVICIOS_MUJER)
	{
		return GA_EVENTO_CANCER;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_SERVICIOS_NINO)
	{
		return GA_EVENTO_NINO_SANO;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_SERVICIOS_ADULTO)
	{
		return GA_EVENTO_DIABETES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_SERVICIOS_MICOBACTERIOSIS)
	{
		return GA_EVENTO_TUBERCULOSIS;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_SERVICIOS_BUCAL)
	{
		return GA_EVENTO_BUCAL;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_SERVICIOS_MENTAL)
	{
		return GA_EVENTO_CONSULTAS_SALUD_MENTAL_UNIDADCEYH;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_RECURSOS_PERSONAL)
	{
		return GA_EVENTO_PERSONAL_ANIO;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_RECURSOS_MEDICOS)
	{
		return GA_EVENTO_MEDICOS_ANIO;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_RECURSOS_EQUIPO)
	{
		return GA_EVENTO_EQUIPO_ANIO;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_RECURSOS_ESTABLECIMIENTOS)
	{
		return GA_EVENTO_ESTABLECIMIENTOS_ANIO;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_RECURSOS_FISICOS)
	{
		return GA_EVENTO_FISICOS_ANIO;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_EGRESOS_ANIO)
	{
		return GA_EVENTO_TOTALES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_EGRESOS_ENTIDAD)
	{
		return GA_EVENTO_TOTALES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_EGRESOS_TIPO)
	{
		return GA_EVENTO_SERVICIO;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_EGRESOS_CONSULTA)
	{
		return GA_EVENTO_EGRESOS_CONSULTA_EXTERNA;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_LESIONES_ANIO)
	{
		return GA_EVENTO_TOTALES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_LESIONES_ENTIDAD)
	{
		return GA_EVENTO_TOTALES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_URGENCIAS_ANIO)
	{
		return GA_EVENTO_TOTALES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_URGENCIAS_ENTIDAD)
	{
		return GA_EVENTO_TOTALES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_GASTO_INDICADORES)
	{
		return GA_EVENTO_GASTO_TOTAL;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_GASTO_OBJETO)
	{
		return GA_EVENTO_GASTO_PUBLICO;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_GASTO_CFA)
	{
		return GA_EVENTO_CLASIFICACION_POR_FUNCIONES_ATENCION;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_INDICADORES_VITALES_ENTIDAD)
	{
		return GA_EVENTO_ESTADISTICAS_VITALES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_INDICADORES_VITALES_MUNICIPIO)
	{
		return GA_EVENTO_ESTADISTICAS_VITALES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_INDICADORES_VITALES_JURISDICCION)
	{
		return GA_EVENTO_ESTADISTICAS_VITALES;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_INDICADORES_MORTALIDAD)
	{
		return GA_EVENTO_MORTALIDAD;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_INDICADORES_MORTALIDAD_MATERNA)
	{
		return GA_EVENTO_MORTALIDAD;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_INDICADORES_MORTALIDAD_INFANTIL)
	{
		return GA_EVENTO_MORTALIDAD_INFANTIL;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_ANALISIS_PUBLICACIONES)
	{
		return GA_EVENTO_P_DGIS;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_ANALISIS_MAPAS)
	{
		return GA_EVENTO_VISUALIZACION_ARCHIVO;
	}
	else if(categoria == GA_CATEGORIA_TABLERO_SERVICIOS_INFORMES)
	{
		return GA_EVENTO_DESCARGA_ARCHIVO;
	}
	
	//DatosAbiertos
	else if(categoria == GA_CATEGORIA_TABLERO_DEFUNCIONES_DA)
	{
		return GA_EVENTO_TOTALES;
	}
	
	return GA_EVENTO_SIN_EVENTO;
}

function copiarTablaId(id)
{
	if($('#' + id).html().trim())
	{
		$(':focus').blur();
		
		for(var i=0; i<2; i++)
		{
			var elemento = document.getElementById(id);
			
			var rango = document.createRange();  
			rango.selectNode(elemento);
			window.getSelection().addRange(rango);
			document.execCommand('copy');
			window.getSelection().removeAllRanges();
		}
		
		alert('Tabla copiada correctamente.');
	}
	else
	{
		alert('No hay informaci\xF3n que copiar.');
	}
}
