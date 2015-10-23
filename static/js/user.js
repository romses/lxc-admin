// User specific initialisations

function clearuser() {
		$('#user').html('');
		$('#password').html('');
	
}

//	$("#action").attr('disabled','disabled');
//	$("#action").click(function(){
		


$(document).ready(function(){
	$("#mnuContainer").removeClass("active");
	$("#mnuUser").removeClass("active");
	$("#mnuDomains").removeClass("active");
	$("#mnuDatabases").removeClass("active");
	$("#mnuBackups").removeClass("active");
	$("#mnuAdmins").removeClass("active");
	$("#mnuUser").addClass("active");

	$.ajax({
		url:"/api/user",
		method:"GET",
		dataType:"json"
	}).done(function(data){
		template=$.ajax({
			url:"/static/templates/usertable.tmpl",
		}).done(function(cdata){
			$.ajax({
			  url:"/api/container",
			  dataType:"json"
			}).done(function(container){
				template=_.template(cdata);
				rendered=template({items:data,container:container});
				$("#target").html(rendered);

				$('#userrandom').bind('click',function(){
					$("#password").val(randomPassword(8))
				});

				$("#action").attr('disabled','disabled');

				$("#user").bind('input',function(){
					if($("#user").val()==""){
						$("#action").attr("disabled","disabled");
					}else{
						$("#action").removeAttr("disabled");
					}
				});


				$("#action").bind('click',function(){
					$.ajax({
						url:'/api/user/'+$('#user').val(),
						method:'PUT',
						data:{	'user':$('#user').val(),
							'password':$('#password').val(),
							'container':$('#container').val()
						}
					}).done(function(data){
						$('#adduser').modal('toggle');
					}).error(function(){

					});
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
	$('#user').val("");
	$('#password').val("");
	$('#container').val("");

	if(data){
		if('user' in data){
			$('#user').val(data.user);
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
  for(x=0;x<length;x++)
  {
    i = Math.floor(Math.random() * 62);
    pass += chars.charAt(i);
  }
  return pass;
}

function del(data){
	$.ajax({
		url:'/api/user/'+data.username,
		method:'DELETE',

		data:{  'domain':data.domain,
			'www':data.www,
			'crtfile':data.crtfile,
			'container':data.container
		}
	}).done(function(data){
	}).error(function(){
	});
}
