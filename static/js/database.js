// User specific initialisations

$(document).ready(function(){
	$("#mnuContainer").removeClass("active");
	$("#mnuUser").removeClass("active");
	$("#mnuDomains").removeClass("active");
	$("#mnuDatabases").removeClass("active");
	$("#mnuBackups").removeClass("active");
	$("#mnuAdmins").removeClass("active");
	$("#mnuDatabases").addClass("active");

	renderContent();
	enableActions();
})

function renderContent(){
	$.ajax({
		url:"/api/container",
		method:"GET"
	}).done(function(data){
		template=_.template('<% _.each(database,function(item,key,list){%><option value="<%= item.data.name %>"><%= item.data.name %></option><% }); %>');
		rendered=template({database:data});
		$("#container").html(rendered);
	}).error(function(data){

	});

	$.ajax({
		url:"/api/database",
		method:"GET",
		dataType:"json"
	}).done(function(data){
		template=$.ajax({
			url:"/static/templates/databases.tmpl",
		}).done(function(cdata){
			template=_.template(cdata);
			rendered=template({databases:data,showcontainer:true});

			$("#databases tbody").html(rendered);

		}).error(function(){
			$("#errorframe").html("Error loading usertemplate ");
		});
	}).error(function(error){
	});
}

function enableActions(){
	$('#randompw').bind('click',function(){
		$("#password").val(randomPassword(8))
	});

	$("#action").bind('click',function(){
		$.ajax({
			url:'/api/database/'+$('#username').val(),
			method:'PUT',
			data:{	'domain':$('#username').val(),
				'password':$('#password').val(),
				'container':$('#container').val()
			}
		}).done(function(data){
			$('#adddatabase').modal('toggle');
		}).error(function(){

		});
	});

	$("#action").attr('disabled','disabled');

	$("#username").bind('input',function(){
		if($("#username").val()==""){
			$(".savebtn").attr("disabled","disabled");
		}else{
			$(".savebtn").removeAttr("disabled");
		}
	});

	$("#savedatabase").click(function(){
		$("#saveuser span").removeClass("hidden");
		$.ajax({
			url:'/api/database/'+$('#username').val(),
			method:'PUT',
			data:{  'username':$('#username').val(),
				'password':$('#password').val(),
				'container':$('#container').val()
			}
		}).done(function(data){
			$('.modal').modal('hide');
			$("#saveuser span").addClass("hidden");
			renderContent();
		}).error(function(){
		});
	});



}

function preselectDatabase($form,data){
	$("#saveuser span").addClass("hidden","hidden");
	$form.modal('show')
	$(".username").val("");
	$(".username").removeAttr("disabled");
	$(".pwd").val("");
	$(".savebtn").attr("disabled","disabled");

        $.ajax({
                url:"/api/database",
                dataType:"json",
        }).done(function(databases){
		for(var i=0;i< databases.length;i++){
			if(databases[i].username==data){
				$("#username").val(databases[i].username);
				$("#username").attr("disabled","disabled");
				$(".savebtn").removeAttr("disabled");

				if('password' in databases[i]){
					$("#password").val(databases[i].password);
				}
				$("#container").val(databases[i].container);
				break;
			}
		}

	}).error(function(data){
console.log("Error");
	});

}

function deleteDatabase(data){
	BootstrapDialog.show({
		message: 'Delete Database '+data+"?",
		buttons: [{
			label: 'Delete',
			cssClass: 'btn-danger',
			autospin: 'true',
			action: function(dialogItself){
				$.ajax({
					url:'/api/database/'+data,
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

function randomPassword(length){
  chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  pass = "";
  for(x=0;x<length;x++)
  {
    i = Math.floor(Math.random() * 62);
    pass += chars.charAt(i);
  }
  return pass;
}
