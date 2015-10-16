$(document).ready(function(){
        $(".yesnoswitch").bootstrapSwitch();
        $('[data-toggle="tooltip"]').tooltip();
})

function confirmDanger(msg,action){
	BootstrapDialog.show({
		message: msg,
		buttons: [{
			label: 'Delete',
			cssClass: 'btn-danger',
			action: action
		},{
			label: 'Cancel',
			cssClass: 'btn-primary',
			action: function(dialogItself){
				dialogItself.close();
			}
		}]
	});
}

function confirmSafe(msg,action){
	BootstrapDialog.show({
		message: msg,
		buttons: [{
			label: 'Delete',
			cssClass: 'btn-ok',
			action: action
		},{
			label: 'Cancel',
			cssClass: 'btn-primary',
			action: function(dialogItself){
				dialogItself.close();
			}
		}]
	});
}

function confirmbackup(msg,action){
	BootstrapDialog.show({
		message: msg,
		buttons: [{
			label: 'Backup',
			cssClass: 'btn-success',
			action: function(dialogItself){
				action();
				dialogItself.close();
                        }
		},{
			label: 'Cancel',
			cssClass: 'btn-primary',
			action: function(dialogItself){
				dialogItself.close();
			}
		}]
	});
}
