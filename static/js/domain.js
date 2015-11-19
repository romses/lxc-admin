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

function preselectDomain($form,data){
        $form.modal('show')
        $('#domain').val("");
        $("#domain").removeAttr("disabled");
        $("#www").bootstrapSwitch('state', false);
        $("#certificate").val("");
        $(".savebtn").attr("disabled","disabled");

	$("#container").val(data);

        $.ajax({
                url:"/api/domain/"+data,
                dataType:"json",
        }).done(function(domains){
                for(var i=0;i< domains.length;i++){
                        if(domains[i].container==data){
                                if('domain' in domains[i]){
                                        $('#domain').val(domains[i].domain);
                                        $(".savebtn").removeAttr("disabled");
                                        $("#domain").attr("disabled","disabled");
                                }

                                if(domains[i].www==1){
                                        $("#www").bootstrapSwitch('state', true);
                                }

                                if('crtfile' in domains[i]){
                                        if(domains[i].crtfile==""){
                                                $("#certificate").val("");
                                        }else{
                                                $("#certificate").val(domains[i].crtfile);
                                        }
                                }
                                break;
                        }
                }

        }).error(function(data){
console.log("Error");
        });

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

