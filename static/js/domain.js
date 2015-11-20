// User specific initialisations

$(document).ready(function(){
	$("#mnuContainer").removeClass("active");
	$("#mnuUser").removeClass("active");
	$("#mnuDomains").removeClass("active");
	$("#mnuDatabases").removeClass("active");
	$("#mnuBackups").removeClass("active");
	$("#mnuAdmins").removeClass("active");
	$("#mnuDomains").addClass("active");

	enableActions();
	renderContent();

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
		url:"/api/domain",
		method:"GET",
		dataType:"json"
	}).done(function(data){
		template=$.ajax({
			url:"/static/templates/domains.tmpl",
		}).done(function(cdata){
			template=_.template(cdata);
			rendered=template({domain:data,showcontainer:true});

			$("#domains tbody").html(rendered);

			$("#action").attr('disabled','disabled');

		}).error(function(){
			$("#errorframe").html("Error loading usertemplate ");
		});
	}).error(function(error){
		$("#errorframe").html("Error loading Data /api/"+name);
	});

}

function enableActions(){
	$(".yesnoswitch").bootstrapSwitch();

	$("#action").attr('disabled','disabled');

	$("#domain").bind('input',function(){
		if($("#domain").val()==""){
			$("#savedomain").attr("disabled","disabled");
		}else{
			$("#savedomain").removeAttr("disabled");
		}
	});


	$("#savedomain").bind('click',function(){
		$.ajax({
			url:'/api/domain/'+$('#domain').val(),
			method:'PUT',
			data:{	'domain':$('#domain').val(),
				'www':$("#www").prop("checked"),
				'ssl':$('#certificate').val(),
				'container':$('#container').val()
			}
		}).done(function(data){
			$('#adddomain').modal('toggle');
			renderContent();
		}).error(function(){
		});
	});


}


function preselectDomain($form,data){
        $form.modal('show')
        $('#domain').val("");
        $("#domain").removeAttr("disabled");
        $("#www").bootstrapSwitch('state', false);
        $("#certificate").val("");
        $(".savebtn").attr("disabled","disabled");

	$("#container").val(data);

        $.ajax({
                url:"/api/domain",
                dataType:"json",
        }).done(function(domains){
                for(var i=0;i< domains.length;i++){
                        if(domains[i].domain==data){
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
				$("#container").val(domains[i].container);
                                break;
                        }
                }

        }).error(function(data){
console.log("Error");
        });

}

function deleteDomain(data){
        BootstrapDialog.show({
                message: 'Delete Domain '+data+"?",
                buttons: [{
                        label: 'Delete',
                        cssClass: 'btn-danger',
                        autospin: 'true',
                        action: function(dialogItself){
                                $.ajax({
                                        url:'/api/domain/'+data,
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

