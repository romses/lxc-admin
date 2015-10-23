var containerimages = null;

// Container specific initialisations

function init(){
	var req = null;
	$('#name').bind('input', newContainerName);
	$('#doublebutton2-0').removeAttr('disabled');
	$('#clone').css('display','block');
	$('#action').attr('disabled','disabled');

	$('#action').click(function(){

	if($('#containerCreationType').val()=="clone"){
			req={
				"type":"clone",
				"origin":$('#clonefrom').val()
			};
		}else{
			req={
				"type":"download",
				"origin":{"dist":$("#system").val(),
					"version":$('#version').val(),
					"arch":$('#architecture').val(),
				},
			};
		}

		$("#action").attr("disabled","disabled");
		$("#doublebutton2-0").attr("disabled","disabled");
		$("#action2").addClass("glyphicon glyphicon-refresh spinning");
		$.ajax({
			url:"/api/container/"+$("#name").val(),
			method:"PUT",
			data:req,
		}).done(function(data){


			$("#action2").removeClass("glyphicon glyphicon-refresh spinning");
			$("#addContainer").modal('hide');
		}).error(function(){


			$("#action2").removeClass("glyphicon glyphicon-refresh spinning");
			$("#addContainer").modal('hide');
		});
	});

	$("#system").change(function(){
		setVersions();
	});
	$("#version").change(function(){
		setArchitecture();
	});
}


function clearContainer(){
	$('#doublebutton2-0').removeAttr('disabled');
	$.getJSON("/api/images",function(data){
		containerimages=data.data;
		setSystems();
	});

	$.ajax({
		url:"/api/container",
	}).done(function(data){
		$("#name").val("");
		$("#clonefrom").empty();
		$.each(data,function(k,v){
			$("#clonefrom").append("<option>"+v.data.name+"</option>");
		});
	}).error(function(){

	});
}

function newContainerName(){
	if($("#name").val()==""){
		$("#action").attr("disabled","disabled");
	}else{
		$("#action").removeAttr("disabled");
	}
}

function newContainerMode(){
console.log("?");
	if($("#containerCreationType").val()=="download"){
		$("#download").css("display","block");
		$("#clone").css("display","none");
	}else{
		$("#download").css("display","none");
		$("#clone").css("display","block");
	}
}


function start(name){
	$.ajax({
		url:'/api/container/'+name,
		method:'POST',
		data:{"action":"start"},
		dataType:'json'
	}).done(function(resp){
		BootstrapDialog.alert({message:"Container "+name+" started"})
		renderContent('container');
	}).error(function(resp){
		BootstrapDialog.alert({message:"Dafuq?!?"+resp.status})
		$("#errorframe").html(resp.extstatus);
		renderContent('container');
	});
}

function stop(name){
	BootstrapDialog.show({
		message: 'Stop container '+name+"?",
		buttons: [{
			label: 'Stop',
			cssClass: 'btn-danger',
			autospin: 'true',
			action: function(dialogItself){
				$.ajax({
					url:'/api/container/'+name,
					method:'POST',
					data:{"action":"stop"},
					dataType:'json'
				}).done(function(resp){
					dialogItself.close();
					renderContent('container');
				}).error(function(resp){
					dialogItself.close();
					BootstrapDialog.alert({message:"Dafuq?!?"+resp.status})
					$("#errorframe").html(resp.status);
					renderContent('container');
				});
			}
		}, {
			label: 'Cancel',
			cssClass: 'btn-primary',
			action: function(dialogItself){
				dialogItself.close();
			}
		}]
	});
}

function del(name){
	BootstrapDialog.show({
		message: 'Delete container '+name+"?",
		buttons: [{
			label: 'Delete',
			cssClass: 'btn-danger',
			autospin: 'true',
			action: function(dialogItself){
				$.ajax({
					url:'/api/container/'+name,
					method:'DELETE',
					dataType:'json'
				}).done(function(resp){
					dialogItself.close();
					BootstrapDialog.alert({message:"Container "+name+" deleted"})
					renderContent('container');
				}).error(function(resp){
					dialogItself.close();
					BootstrapDialog.alert({message:"Dafuq?!?"+resp.status})
					$("#errorframe").html(resp.status);
					renderContent('container');
				});
			}
		}, {
			label: 'Cancel',
			cssClass: 'btn-primary',
			action: function(dialogItself){
				dialogItself.close();
			}
		}]
	});
}

function backup(name){
	BootstrapDialog.show({
		message: 'Backup container '+name+"?",
		buttons: [{
			label: 'Backup',
			cssClass: 'btn-success',
			autospin: 'true',
			action: function(dialogItself){
				$.ajax({
					url:'/api/container/'+name,
					method:"POST",
					data:{"action":"backup"},
					dataType:'json'
				}).done(function(resp){
					dialogItself.close();
					BootstrapDialog.alert({message:"Container "+name+" saved"})
					renderContent('container');
				}).error(function(resp){
					dialogItself.close();
					BootstrapDialog.alert({message:"Dafuq?!?"+resp.status})
					$("#errorframe").html(resp.status);
					renderContent('container');
				});
			}
		}, {
			label: 'Cancel',
			cssClass: 'btn-primary',
			action: function(dialogItself){
				dialogItself.close();
			}
		}]
	});
}

function setSystems() {
	$('#system').html('');

	$.each(containerimages, function( key, value ) {
			$('#system').append(new Option(key, key));
	});

	setVersions();
}

function setVersions() {
	$('#version').html('');

	var system = $('#system').val();
	$.each(containerimages[system], function( key, value ) {
			$('#version').append(new Option(key, key));
	});

	setArchitecture();
}

function setArchitecture() {
		$('#architecture').html('');
	
		var system = $('#system').val();
		var version = $('#version').val();
		$.each(containerimages[system][version], function( key, value ) {
				$('#architecture').append(new Option(value, value));
		});
}

function selectMenu(item){
}

$(document).ready(function(){
	$("#mnuContainer").removeClass("active");
	$("#mnuUser").removeClass("active");
	$("#mnuDomains").removeClass("active");
	$("#mnuDatabases").removeClass("active");
	$("#mnuBackups").removeClass("active");
	$("#mnuAdmins").removeClass("active");
	$("#mnuContainer").addClass("active");

	$.ajax({
		url:"/api/container",
		method:"GET",
		dataType:"json"
	}).done(function(data){
		template=$.ajax({
			url:"/static/templates/containertable.tmpl",
		}).done(function(cdata){
			template=_.template(cdata);
			rendered=template({items:data});
			$("#target").html(rendered);

			$('#containerCreationType').bind('change', newContainerMode);

			init();

		}).error(function(){
			$("#errorframe").html("Error loading Template "+menuitems[name].template);
		});
	}).error(function(error){
		$("#errorframe").html("Error loading Data /api/"+name);
	});
});
