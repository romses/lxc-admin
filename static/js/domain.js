// User specific initialisations

$(document).ready(function(){
	$("#mnuContainer").removeClass("active");
	$("#mnuUser").removeClass("active");
	$("#mnuDomains").removeClass("active");
	$("#mnuDatabases").removeClass("active");
	$("#mnuBackups").removeClass("active");
	$("#mnuAdmins").removeClass("active");
	$("#mnuDomains").addClass("active");

	$.ajax({
		url:"/api/domain",
		method:"GET",
		dataType:"json"
	}).done(function(data){
		template=$.ajax({
			url:"/static/templates/domaintable.tmpl",
		}).done(function(cdata){
                        $.ajax({
                          url:"/api/container",
                          dataType:"json"
                        }).done(function(container){
				template=_.template(cdata);
				rendered=template({items:data,container:container});
				$("#target").html(rendered);

				$(".yesnoswitch").bootstrapSwitch();

				$("#action").attr('disabled','disabled');

				$("#domain").bind('input',function(){
					if($("#domain").val()==""){
						$("#action").attr("disabled","disabled");
					}else{
						$("#action").removeAttr("disabled");
					}
				});


				$("#action").bind('click',function(){
					$.ajax({
						url:'/api/domain/'+$('#domain').val(),
						method:'PUT',
						data:{	'domain':$('#domain').val(),
							'www':$("#www").prop("checked"),
							'crtfile':$('#certificate').val(),
							'container':$('#container').val()
						}
					}).done(function(data){
					}).error(function(){

					});
					$('#adddomain').modal('toggle');
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
	$('#domain').val("");
	$('#certificate').val("");
	$("#action").attr("disabled","disabled");

	if(data){
		if('domain' in data){
			if(data['domain']!=""){
				$("#action").removeAttr("disabled")
			}
			$('#domain').val(data.domain);
		}
		if('www' in data){
			$("#www").bootstrapSwitch('state', data['www']);
		}
		if('crtfile' in data){
			if(data['crtfile']!=""){
				$('#certificate').val("present");
			}
		}
	}
}

function del(data){
        BootstrapDialog.show({
                message: 'Delete Domain '+data.domain+"?",
                buttons: [{
                        label: 'Delete',
                        cssClass: 'btn-danger',
                        autospin: 'true',
                        action: function(dialogItself){
                                $.ajax({
                                        url:'/api/domain/'+data.domain,
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

