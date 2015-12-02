// User specific initialisations

$(document).ready(function(){
	$("#mnuContainer").removeClass("active");
	$("#mnuUser").removeClass("active");
	$("#mnuDomains").removeClass("active");
	$("#mnuDatabases").removeClass("active");
	$("#mnuBackups").removeClass("active");
	$("#mnuAdmins").removeClass("active");
	$("#mnuAdmins").addClass("active");

	renderTable();
	enableActions();
});

function renderTable(){
	$.ajax({
		url:"/api/admin",
		method:"GET",
		dataType:"json"
	}).done(function(data){
		$.ajax({
			url:"/static/templates/admintable.tmpl",
		}).done(function(cdata){
			template=_.template(cdata);
			rendered=template({admins:data});

			$("#admins tbody").html(rendered);
		});
	});

}

function enableActions(){
	$("#action").attr('disabled','disabled');

	$("#user").bind('input',function(){
		if($("#user").val()==""){
			$("#action").attr("disabled","disabled");
		}else{
			$("#action").removeAttr("disabled");
		}
	});

	$('#randompw').bind('click',function(){
		$("#password").val(randomPassword(8))
	});

	$("#action").bind('click',function(){
		$.ajax({
			url:'/api/admin/'+$('#user').val(),
			method:'PUT',
			data:{	'user':$('#user').val(),
				'password':$('#password').val()
			}
		}).done(function(answer){
			$('#addadmin').modal('toggle');
                        switch(answer.status.toUpperCase()){
                                case "ERROR":
                                        BootstrapDialog.alert({type:BootstrapDialog.TYPE_ERROR,title:"Error",message:answer.extstatus})
                                        break;
                                case "WARNING":
                                        BootstrapDialog.alert({type:BootstrapDialog.TYPE_WARNING,title:"Warning",message:answer.extstatus})
                                        break;
                        }

			renderTable();
		});
	});
}

function preselect($form,data){
	$form.modal('show');
	$('#user').val("");
	$('#password').val("");
	$("#action").attr("disabled","disabled");

        $("#saveuser span").addClass("hidden","hidden");
        $("#user").removeAttr("disabled");
        $("#password").val("");
        $(".savebtn").attr("disabled","disabled");

        $.ajax({
                url:"/api/admin",
                dataType:"json",
        }).done(function(user){
                for(var i=0;i< user.length;i++){
                        if(user[i].user==data){
                                $("#user").val(user[i].user);
                                $("#user").attr("disabled","disabled");
                                $("#action").removeAttr("disabled");

                                break;
                        }
                }

        }).error(function(data){
console.log("Error");
        });

}

function del(data){
	BootstrapDialog.show({
		message:"Delete user "+data,
		type:BootstrapDialog.TYPE_WARNING,
		buttons:[{
			label:"Delete",
			cssClass:"btn-danger",
			action:function(dialogItself){
				$.ajax({
					url:'/api/admin/'+data,
					method:'DELETE',
				}).done(function(cdata){
					switch(answer.status.toUpperCase()){
						case "ERROR":
							BootstrapDialog.alert({type:BootstrapDialog.TYPE_ERROR,title:"Error",message:answer.extstatus})
							break;
						case "WARNING":
							BootstrapDialog.alert({type:BootstrapDialog.TYPE_WARNING,title:"Warning",message:answer.extstatus})
							break;
					}
				});
				renderTable();
				dialogItself.close();
			}
		},{
			label:"Cancel",
			cssClass:"btn-primary",
			action: function(dialogItself){
				dialogItself.close();
			}
		}]
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
