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
});

function renderTable(){
	$.ajax({
		url:"/api/admin",
		method:"GET",
		dataType:"json"
	}).done(function(data){
		template=$.ajax({
			url:"/static/templates/admintable.tmpl",
		}).done(function(cdata){
                        $.ajax({
                          url:"/api/container",
                          dataType:"json"
                        }).done(function(container){
				template=_.template(cdata);
				rendered=template({items:data,container:container});
				$("#target").html(rendered);

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
					}).done(function(data){
						renderTable();
					}).error(function(){
					});
					$('#adduser').modal('toggle');
				});


                        });

		}).error(function(){
			$("#errorframe").html("Error loading usertemplate ");
		});
	}).error(function(error){
		$("#errorframe").html("Error loading Data /api/"+name);
	});
};

function preselect(data){
	$('#user').val("");
	$('#password').val("");
	$("#action").attr("disabled","disabled");

	if(data){
		if('user' in data){
			if(data['user']!=""){
				$("#action").removeAttr("disabled")
			}
			$('#user').val(data.user);
		}
		if('password' in data){
			$('#password').val(data.password);
		}
	}
}

function del(data){
	BootstrapDialog.show({
		message:"Delete user "+data.user,
		type:BootstrapDialog.TYPE_WARNING,
		buttons:[{
			label:"Delete",
			cssClass:"btn-danger",
			action:function(dialogItself){
				$.ajax({
					url:'/api/admin/'+data.user,
					method:'DELETE',
				}).done(function(cdata){
					if(cdata.status=="Error"){
						BootstrapDialog.alert({message:"Error deleting "+data.user,type:BootstrapDialog.TYPE_WARNING});
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
