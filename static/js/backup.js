// User specific initialisations

$(document).ready(function(){
	$("#mnuContainer").removeClass("active");
	$("#mnuUser").removeClass("active");
	$("#mnuDomains").removeClass("active");
	$("#mnuDatabases").removeClass("active");
	$("#mnuBackups").removeClass("active");
	$("#mnuAdmins").removeClass("active");
	$("#mnuBackups").addClass("active");

	renderTable();
});

function renderTable(){
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
				$("#backups tbody").html(rendered);
                        });

		}).error(function(){
			$("#errorframe").html("Error loading usertemplate ");
		});
	}).error(function(error){
		$("#errorframe").html("Error loading Data /api/"+name);
	});

}

function del(name,date){
        BootstrapDialog.show({
		type:BootstrapDialog.TYPE_DANGER,
                message: 'Delete backup '+name+"/"+date+"?",
                buttons: [{
                        label: 'Delete',
                        cssClass: 'btn-danger',
                        autospin: 'true',
                        action: function(dialogItself){
				$.ajax({
					url:'/api/backup/'+name,
					method:'DELETE',
					data:{	'container':name,
						'date':date
					}
				}).done(function(data){
					dialogItself.close();
					renderTable();
				}).error(function(){
					dialogItself.close();
					BootstrapDialog.alert({message:"Dafuq?!?"+resp.status})
					$("#errorframe").html(resp.status);
					renderTable();
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

function restore(container,date){
        BootstrapDialog.show({
                message: 'Restore backup '+container+"/"+date+"?",
                buttons: [{
                        label: 'Restore',
                        cssClass: 'btn-danger',
                        autospin: 'true',
                        action: function(dialogItself){
				$.ajax({
					url:'/api/container/'+container,
					method:'POST',
					data:{
						'action':'restore',
						'container':container,
						'date':date
					}
				}).done(function(data){
					dialogItself.close();
					renderTable();
				}).error(function(){
					dialogItself.close();
					BootstrapDialog.alert({message:"Dafuq?!?"+resp.status})
					$("#errorframe").html(resp.status);
					renderTable();
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
