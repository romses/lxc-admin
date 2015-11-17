// User specific initialisations

$(document).ready(function(){
	$("#mnuContainer").removeClass("active");
	$("#mnuUser").removeClass("active");
	$("#mnuDomains").removeClass("active");
	$("#mnuDatabases").removeClass("active");
	$("#mnuBackups").removeClass("active");
	$("#mnuAdmins").removeClass("active");
	$("#mnuUser").addClass("active");

	renderContent();
	enableActions();
});

function renderContent(){
	$.ajax({
		url:"/api/container",
		method:"GET"
	}).done(function(data){
		template=_.template('<% _.each(user,function(item,key,list){%><option value="<%= item.data.name %>"><%= item.data.name %></option><% }); %>');
		rendered=template({user:data});
		$("#container").html(rendered);
	}).error(function(data){

	});

	$.ajax({
		url:"/api/user",
		method:"GET",
		dataType:"json"
	}).done(function(data){
		template=$.ajax({
			url:"/static/templates/ftpuser.tmpl",
		}).done(function(cdata){
			template=_.template(cdata);
			rendered=template({user:data});

			$("#ftpuser tbody").html(rendered);

			$("#action").attr('disabled','disabled');

		}).error(function(){
			$("#errorframe").html("Error loading usertemplate ");
		});
	}).error(function(error){
		$("#errorframe").html("Error loading Data /api/"+name);
	});

}

function enableActions(){
	$('#randompw').bind('click',function(){
		$("#password").val(randomPassword(8))
	});


	$("#saveuser").bind('click',function(){
		$.ajax({
			url:'/api/user/'+$('#user').val(),
			method:'PUT',
			data:{	'user':$('#user').val(),
				'password':$('#password').val(),
				'container':$('#container').val()
			}
		}).done(function(data){
			$('#adduser').modal('toggle');
			renderContent();
		}).error(function(){
		});
	});

	$("#user").bind('input',function(){
		if($("#user").val()==""){
			$("#action").attr("disabled","disabled");
		}else{
			$("#action").removeAttr("disabled");
		}
	});

}

function preselect($form,data){
	$("#saveuser span").addClass("hidden","hidden");
	$form.modal('show')
	data=jQuery.parseJSON(data);

	$(".savebtn").attr("disabled","disabled");
	$(".username").attr("disabled","disabled");

	if('username' in data){
		$(".username").val(data.username);
		$(".savebtn").removeAttr("disabled");
	}else{
		$(".username").val("");
		$(".username").removeAttr("disabled");
	}


	if('password' in data){
		$(".pwd").val(data.password);
	}else{
		$(".pwd").val("");
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

function deleteUser(data){
	data=jQuery.parseJSON(data);
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
	renderContent();
}

