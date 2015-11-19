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
		$("#state").html(data.status);
		$("#ip").html(data.data.ip);
		$("#mem").html(data.data.mem);

		template=$.ajax({
			url:"/static/templates/ftpuser.tmpl",
		}).done(function(cdata){
			template=_.template(cdata);
			rendered=template({container:data,user:data.user,domains:data.domains,databases:data.databases});
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
}

function preselectDomain($form,data){
	$form.modal('show')
	$('#domain').val("");
	$("#domain").removeAttr("disabled");
	$("#www").bootstrapSwitch('state', false);
	$("#certificate").val("");
	$(".savebtn").attr("disabled","disabled");

        $.ajax({
                url:"/api/domain/"+container,
                dataType:"json",
        }).done(function(domains){
		for(var i=0;i< domains.length;i++){
			if(domains[i].domain==data){
				if('domain' in domains[i]){
					$('#domain').val(domains[i].domain);
					$(".savebtn").removeAttr("disabled");
					$("#domain").attr("disabled","disabled");
				}

				if(domains[i].www==1){
					$("#www").bootstrapSwitch('state', true);
			        }

				if('crtfile' in domins[i]){
					if(domains[i].crtfile==""){
						$("#certificate").val("");
					}else{
						$("#certificate").val(domains[i].crtfile);
					}
			        }
				break;
			}
		}

	}).error(function(data){
console.log("Error");
	});

}

function preselectUser($form,data){
	$("#saveuser span").addClass("hidden","hidden");
	$form.modal('show')
	$(".username").val("");
	$(".username").removeAttr("disabled");
	$(".pwd").val("");
	$(".savebtn").attr("disabled","disabled");

        $.ajax({
                url:"/api/user/"+container,
                dataType:"json",
        }).done(function(user){
		for(var i=0;i< user.length;i++){
			if(user[i].username==data){

				if('username' in user[i]){
					$(".username").val(user[i].username);
					$(".username").attr("disabled","disabled");
						$(".savebtn").removeAttr("disabled");
				}


				if('password' in user[i]){
					$(".pwd").val(user[i].password);
				}
				break;
			}
		}

	}).error(function(data){
console.log("Error");
	});

}

function preselectDatabase($form,data){
	$("#saveuser span").addClass("hidden","hidden");
	$form.modal('show')
	$(".username").val("");
	$(".username").removeAttr("disabled");
	$(".pwd").val("");
	$('#domain').val("");
	$("#domain").removeAttr("disabled");
	$("#www").bootstrapSwitch('state', false);
	$("#certificate").val("");
	$(".savebtn").attr("disabled","disabled");

        $.ajax({
                url:"/api/domain/"+container,
                dataType:"json",
        }).done(function(domains){
		for(var i=0;i< domains.length;i++){
			if(domains[i].domain==data){

				if('username' in domains[i]){
					$(".username").val(domauns[i].username);
					$(".username").attr("disabled","disabled");
						$(".savebtn").removeAttr("disabled");
				}


				if('password' in domains[i]){
					$(".pwd").val(domains[i].password);
				}

				if('domain' in domains[i]){
					$('#domain').val(domains[i].domain);
					$(".savebtn").removeAttr("disabled");
					$("#domain").attr("disabled","disabled");
				}

				if(domains[i].www==1){
					$("#www").bootstrapSwitch('state', true);
			        }

				if('crtfile' in domins[i]){
					if(domains[i].crtfile==""){
						$("#certificate").val("");
					}else{
						$("#certificate").val(domains[i].crtfile);
					}
			        }
				break;
			}
		}

	}).error(function(data){
console.log("Error");
	});

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
                $("#savedomain span").removeClass("hidden");
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
			$('.modal').modal('hide');
			$("#savedomain span").addClass("hidden");
			renderContent();
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
					renderContent();
				}).error(function(resp){
					dialogItself.close();
					BootstrapDialog.alert({message:"Dafuq?!?"+resp.status})
					$("#errorframe").html(resp.status);
					renderContent();
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

function deleteDomain(data){
//	data=jQuery.parseJSON(data);
	BootstrapDialog.show({
		message: 'Delete domain '+data+"?",
		buttons: [{
			label: 'Delete',
			cssClass: 'btn-danger',
			autospin: 'true',
			action: function(dialogItself){
				$.ajax({
					url:'/api/domain/'+data,
					method:'DELETE',
					dataType:'json'
				}).done(function(resp){
					dialogItself.close();
					renderContent();
				}).error(function(resp){
					dialogItself.close();
					BootstrapDialog.alert({message:"Dafuq?!?"+resp.status})
					$("#errorframe").html(resp.status);
					renderContent();
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
