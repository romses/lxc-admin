var container=null;
var templatedata=null;

$(document).ready(function(){
	$("#mnuContainer").removeClass("active");
	$("#mnuUser").removeClass("active");
	$("#mnuDomains").removeClass("active");
	$("#mnuDatabases").removeClass("active");
	$("#mnuBackups").removeClass("active");
	$("#mnuAdmins").removeClass("active");
	$("#mnuContainer").addClass("active");

	container=$("#whoami").text().trim()

	template=$.ajax({
		url:"/static/templates/containeredit.tmpl",
	}).done(function(cdata){
		templatedata=cdata;
		renderContent();
	}).error(function(error){
		$("#errorframe").html("Error loading Data /api/"+name);
	});
});

function renderContent(){
console.log("Redraw");
	$("#target").html("");
	$.ajax({
		url:"/api/container/"+container,
		dataType:"json"
	}).done(function(data){
		template=_.template(templatedata);
		rendered=template({container:data});

		$("#target").html(rendered);
		$("#www").bootstrapSwitch();

		$(".rndbutton").click(function(){
			$(".pwd").val(randomPassword(8));
		});

		$("#saveuser").click(function(){
			$.ajax({
				url:'/api/user/'+$('#adduser .username').val(),
				method:'PUT',
				data:{  'user':$('#adduser .username').val(),
					'password':$('#adduser .pwd').val(),
					'container':$("#whoami").text().trim()
				}
			}).done(function(data){
				location.href=location.href;
			}).error(function(){
			});
		});
	});
}

function preselect($form,data){
	data=jQuery.parseJSON(data);

console.log(data);

	if('username' in data){
		$("#adduser .username").val(data.username);
		$("#saveuser").removeAttr("disabled");
		$("#adduser .username").attr("disabled","disabled");
	}else{
		$("#adduser .username").val("");
		$("#saveuser").attr("disabled","disabled");
		$("#adduser .username").removeAttr("disabled");
	}

	if('password' in data){
		$(".pwd").val(data.password);
	}else{
		$(".pwd").val("");
	}

	if('domain' in data){
		$('#domain').val(data.domain);
		$("#savedomain").removeAttr("disabled");
		$("#domain").attr("disabled","disabled");
	}else{
		$('#domain').val("");
		$("#savedomain").attr("disabled","disabled");
		$("#domain").removeAttr("disabled");
	}

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
