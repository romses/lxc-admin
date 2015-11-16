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

	enableActions();
	renderContent();

});

function renderContent(){
	$("#target").html("");
	$.ajax({
		url:"/api/container/"+container,
		dataType:"json",
	}).done(function(data){
		template=$.ajax({
			url:"/static/templates/ftpuser.tmpl",
		}).done(function(cdata){
			template=_.template(cdata);
			rendered=template({container:data});
			$("#ftpuser tbody").html(rendered);
		});
		template=$.ajax({
			url:"/static/templates/domains.tmpl",
		}).done(function(cdata){
			template=_.template(cdata);
			rendered=template({container:data});
			$("#domains tbody").html(rendered);
		});
		template=$.ajax({
			url:"/static/templates/databases.tmpl",
		}).done(function(cdata){
			template=_.template(cdata);
			rendered=template({container:data});
			$("#databases tbody").html(rendered);
		});

		$("#www").bootstrapSwitch();

		$(".rndbutton").click(function(){
			$(".pwd").val(randomPassword(8));
		});
	});
console.log("Redraw done");
}

function preselect($form,data){
	$("#saveuser span").addClass("hidden","hidden");
	$form.modal('show')
	data=jQuery.parseJSON(data);

	$(".savebtn").attr("disabled","disabled");
	$(".username").attr("disabled","disabled");
	$("#domain").attr("disabled","disabled");

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

	if('domain' in data){
		$('#domain').val(data.domain);
		$(".savebtn").removeAttr("disabled");
	}else{
		$('#domain').val("");
		$("#domain").removeAttr("disabled");
	}

	if(data.www==1){
		$("#www").bootstrapSwitch('state', true);
        }else{
		$("#www").bootstrapSwitch('state', false);
        }

	if('crtfile' in data){
		if(data.crtfile==""){
			$("#certificate").val("");
		}else{
			$("#certificate").val("CERT");
		}
        }else{
		$("#certificate").val("");
        }
}
function enableActions(){
	$("#adduser .username").bind('input',function(){
		if($("#adduser .username").val()==""){
			$("#saveuser").attr("disabled","disabled");
		}else{
			$("#saveuser").removeAttr("disabled");
		}

	});

	$("#domain").bind('input',function(){
		if($("#domain").val()==""){
			$("#savedomain").attr("disabled","disabled");
		}else{
			$("#savedomain").removeAttr("disabled");
		}

	});

	$("#adddatabase .username").bind('input',function(){
		if($("#adddatabase .username").val()==""){
			$("#savedatabase").attr("disabled","disabled");
		}else{
			$("#savedatabase").removeAttr("disabled");
		}

	});

	$("#saveuser").click(function(){
		$("#saveuser span").removeClass("hidden");
		$.ajax({
			url:'/api/user/'+$('#adduser .username').val(),
			method:'PUT',
			data:{  'user':$('#adduser .username').val(),
				'password':$('#adduser .pwd').val(),
				'container':$("#whoami").text().trim()
			}
		}).done(function(data){
			$('.modal').modal('hide');
			$("#saveuser span").addClass("hidden");
			renderContent();
		}).error(function(){
		});
	});

	$("#savedomain").click(function(){
		$.ajax({
			url:'/api/domain/'+$("#domain").val(),
			method:"PUT",
			data:{
				"domain":$("#domain").val(),
				"www":$("#www").bootstrapSwitch('state'),
				"ssl":$("#certificate").val(),
				"container":$("#whoami").text().trim()
			}
		}).done(function(){
			location.href=location.href;
		}).error(function(){
		});
	});

	$("#savedatabase").click(function(){
		$.ajax({
			url:'/api/database/'+$('#adddatabase .username').val(),
			method:"PUT",
			data:{
				"username":$('#adddatabase .username').val(),
				"password":$('#adddatabase .pwd').val(),
				"container":$("#whoami").text().trim()
			}
		}).done(function(){
//			location.href=location.href;
		}).error(function(){
		});
	});
console.log("Binding actions done");
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
}
