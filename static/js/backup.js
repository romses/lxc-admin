// User specific initialisations

$(document).ready(function(){
	$("#mnuContainer").removeClass("active");
	$("#mnuUser").removeClass("active");
	$("#mnuDomains").removeClass("active");
	$("#mnuDatabases").removeClass("active");
	$("#mnuBackups").removeClass("active");
	$("#mnuAdmins").removeClass("active");
	$("#mnuBackups").addClass("active");

	$.ajax({
		url:"/api/backup",
		method:"GET",
		dataType:"json"
	}).done(function(data){
		template=$.ajax({
			url:"/static/templates/backuptable.tmpl",
		}).done(function(cdata){
                        $.ajax({
                          url:"/api/container",
                          dataType:"json"
                        }).done(function(container){
				template=_.template(cdata);
				rendered=template({items:data,container:container});
				$("#target").html(rendered);
                        });

		}).error(function(){
			$("#errorframe").html("Error loading usertemplate ");
		});
	}).error(function(error){
		$("#errorframe").html("Error loading Data /api/"+name);
	});
});

function del(data){
	$.ajax({
		url:'/api/backup/'+data.container,
		method:'DELETE',
		data:{	'container':data.container,
			'date':data.date
		}
	}).done(function(data){
	}).error(function(){
	});
}

function restore(data){
	$.ajax({
		url:'/api/backup/'+data.container,
		method:'POST',
		data:{	'container':data.container,
			'date':data.date
		}
	}).done(function(data){
	}).error(function(){
	});
}
