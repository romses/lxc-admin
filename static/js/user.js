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
			rendered=template({user:data,showcontainer:true});

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
				'container':$('#container').val(),
				'homedir':$('#chroot').val()
			}
		}).done(function(answer){
			$('#adduser').modal('toggle');
                        switch(answer.status.toUpperCase()){
                                case "ERROR":
                                        BootstrapDialog.alert({type:BootstrapDialog.TYPE_ERROR,title:"Error",message:answer.extstatus})
                                        break;
                                case "WARNING":
                                        BootstrapDialog.alert({type:BootstrapDialog.TYPE_WARNING,title:"Warning",message:answer.extstatus})
                                        break;
                        }
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

function preselectUser($form,data){
        $("#saveuser span").addClass("hidden","hidden");
        $form.modal('show')
        $(".username").val("");
        $(".username").removeAttr("disabled");
        $(".pwd").val("");
        $(".savebtn").attr("disabled","disabled");
	$("#chroot").val("/");
	$("#container").val("");

        $.ajax({
                url:"/api/user",
                dataType:"json",
        }).done(function(user){
                for(var i=0;i< user.length;i++){
                        if(user[i].username==data){


                                if('username' in user[i]){
                                        $(".username").val(user[i].username);
                                        $(".username").attr("disabled","disabled");
                                                $(".savebtn").removeAttr("disabled");
                                }

				if('homedir' in user[i] && user[i].homedir!=""){
					$("#chroot").val(user[i].homedir);
				}

                                if('password' in user[i]){
                                        $(".pwd").val(user[i].password);
                                }
				$("#container").val(user[i].container);
                                break;
                        }
                }

        }).error(function(data){
console.log("Error");
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

function deleteUser(data){
//	data=jQuery.parseJSON(data);
	BootstrapDialog.show({
		message: 'Delete FTP-user '+data+"?",
		buttons: [{
			label: 'Delete',
			cssClass: 'btn-danger',
			autospin: 'true',
			action: function(dialogItself){
				$.ajax({
					url:'/api/user/'+data,
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

