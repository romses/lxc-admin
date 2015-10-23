var containerimages = null;

var menuitems={
	'container'	:{'template':'containertable.tmpl','selector':'#mnuContainer'},
	'user'		:{'template':'usertable.tmpl','selector':'#mnuUser'},
	'domain'	:{'template':'domaintemplate.tmpl','selector':'#mnuDomains'},
	'database'	:{'template':'databasetemplate.tmpl','selector':'#mnuDatabases'},
	'backup'	:{'template':'backuptemplate.tmpl','selector':'#mnuBackups'},
	'admin'		:{'template':'admintemplate.tmpl','selector':'#mnuAdmins'},
};

$(document).ready(function(){
	$.each(menuitems,function(k,v){
		$(v.selector).bind('click',function(){renderContent(k)});
	});
	renderContent('container');
});


// Container specific initialisations

var container = {
	init:function(){
		var req = null;
		$('#containerCreationType').bind('change', container.newContainerMode);
		$('#name').bind('input', container.newContainerName);
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
	},



	clearContainer:function(){
		$('#doublebutton2-0').removeAttr('disabled');
		$.getJSON("/api/images",function(data){
			containerimages=data.data;
			container.setSystems();
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

	},

	newContainerName:function(){
		if($("#name").val()==""){
			$("#action").attr("disabled","disabled");
		}else{
			$("#action").removeAttr("disabled");
		}
	},

	newContainerMode:function(){
		if($("#containerCreationType").val()=="download"){
			$("#download").css("display","block");
			$("#clone").css("display","none");
		}else{
			$("#download").css("display","none");
			$("#clone").css("display","block");
		}
	},



	start:function(name){
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
	},

	stop:function(name){
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
	},

	del:function(name){
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
	},

	backup:function(name){
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
	},

	setSystems:function() {
		$('#system').html('');

		$.each(containerimages, function( key, value ) {
				$('#system').append(new Option(key, key));
		});

		container.setVersions();
	},

	setVersions:function() {
		$('#version').html('');

		var system = $('#system').val();
		$.each(containerimages[system], function( key, value ) {
				$('#version').append(new Option(key, key));
		});

		container.setArchitecture();
	},

	setArchitecture:function() {
			$('#architecture').html('');
	
			var system = $('#system').val();
			var version = $('#version').val();
			$.each(containerimages[system][version], function( key, value ) {
					$('#architecture').append(new Option(value, value));
			});
	},


}


function selectMenu(item){
	$("#mnuContainer").removeClass("active");
	$("#mnuUser").removeClass("active");
	$("#mnuDomains").removeClass("active");
	$("#mnuDatabases").removeClass("active");
	$("#mnuBackups").removeClass("active");
	$("#mnuAdmins").removeClass("active");
	item.addClass("active");
}


function renderContent(name){
	selectMenu($(menuitems[name].selector));
	$.ajax({
		url:"/api/"+name,
		method:"GET",
		dataType:"json"
	}).done(function(data){
		template=$.ajax({
			url:"/static/templates/"+menuitems[name].template,
		}).done(function(cdata){
			template=_.template(cdata);
			rendered=template({items:data});
			$("#target").html(rendered);

			switch(name){
				case "container":
					container.init();
				break;
			}

		}).error(function(){
			$("#errorframe").html("Error loading Template "+menuitems[name].template);
		});
	}).error(function(error){
		$("#errorframe").html("Error loading Data /api/"+name);
	});
}
