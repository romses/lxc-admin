var container=null;

$(document).ready(function(){
	$("#mnuContainer").removeClass("active");
	$("#mnuUser").removeClass("active");
	$("#mnuDomains").removeClass("active");
	$("#mnuDatabases").removeClass("active");
	$("#mnuBackups").removeClass("active");
	$("#mnuAdmins").removeClass("active");
	$("#mnuContainer").addClass("active");

	container=$("#whoami").text().trim()

	renderContent();
});

function renderContent(){
	template=$.ajax({
		url:"/static/templates/containeredit.tmpl",
	}).done(function(cdata){
		$.ajax({
			url:"/api/container/"+container,
			dataType:"json"
		}).done(function(data){
			template=_.template(cdata);
			rendered=template({container:data});
			$("#target").html(rendered);
		});
	}).error(function(error){
		$("#errorframe").html("Error loading Data /api/"+name);
	});

}

function preselect(data){
	$('#user').val("");
	$('#password').val("");
	$('#container').val("");
	$('#action').attr('disabled','disabled');
	$('#container option:first-child').attr("selected", "selected");

	if(data){
		if('user' in data){
			$('#user').val(data.user);
			$("#action").removeAttr('disabled');
		}
		if('password' in data){
			$('#password').val(data.password);
		}
		if('container' in data){
			$('#container').val(data.container);
		}
	}
}

function randomPassword(length){
	chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
	pass = "";
	for(x=0;x<length;x++){
		i = Math.floor(Math.random() * 62);
		pass += chars.charAt(i);
	}
	return pass;
}

function del(data){
	BootstrapDialog.show({
		message: 'Delete FTP-user '+data.username+"?",
		buttons: [{
			label: 'Delete',
			cssClass: 'btn-danger',
			autospin: 'true',
			action: function(dialogItself){
				$.ajax({
					url:'/api/user/'+data.username,
					method:'DELETE',
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
