// User specific initialisations

$(document).ready(function(){
	$("#mnuContainer").removeClass("active");
	$("#mnuUser").removeClass("active");
	$("#mnuDomains").removeClass("active");
	$("#mnuDatabases").removeClass("active");
	$("#mnuBackups").removeClass("active");
	$("#mnuAdmins").removeClass("active");
	$("#mnuDatabases").addClass("active");

	$.ajax({
		url:"/api/database",
		method:"GET",
		dataType:"json"
	}).done(function(data){
		template=$.ajax({
			url:"/static/templates/databasetable.tmpl",
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
						url:'/api/database/'+$('#username').val(),
						method:'PUT',
						data:{	'domain':$('#username').val(),
							'password':$('#password').val(),
							'container':$('#container').val()
						}
					}).done(function(data){
					}).error(function(){

					});
					$('#adddatabase').modal('toggle');
				});


                        });

		}).error(function(){
			$("#errorframe").html("Error loading usertemplate ");
		});
	}).error(function(error){
		$("#errorframe").html("Error loading Data /api/"+name);
	});
});

function preselect(data){
	$('#username').val("");
	$('#password').val("");
	$('#container').val("");
	$("#action").attr("disabled","disabled");

	if(data){
		if('username' in data){
			if(data['user']!=""){
				$("#action").removeAttr("disabled")
			}
			$('#username').val(data.username);
		}
		if('password' in data){
			$('#password').val(data.password);
		}
		if('container' in data){
			$('#container').val(data.container);
		}
	}
}

function del(data){
	$.ajax({
		url:'/api/database/'+data.username,
		method:'DELETE',
		data:data
	}).done(function(data){
	}).error(function(){
	});
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
