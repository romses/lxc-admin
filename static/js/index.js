$(document).ready(function(){
  $("#mnuContainer").addClass("active")
  renderTable();
});

function renderTable(){
  $.ajax({
    url:"/api/container",
    method:"GET",
    dataType:"json"
  }).done(function(container){
    template=_.template($("#containertemplate").html());
    rendered=template({items:container});
    $("#target").html(rendered);
  });

}

function start(name){
  $.ajax({
    url:'/api/container/'+name,
    method:'POST',
    data:{"action":"start"},
    dataType:'json'
  }).done(function(resp){
    dialogItself.close();
    BootstrapDialog.alert({message:"Container "+name+" deleted"})
    renderTable();
  }).error(function(resp){
    dialogItself.close();
    BootstrapDialog.alert({message:"Dafuq?!?"+resp.status})
    $("#errorframe").html(resp.extstatus);
    renderTable();
  });
}

function stop(name){
  BootstrapDialog.show({
    message: 'Stop container '+name+"?",
    buttons: [{
      label: 'Stop',
      cssClass: 'btn-danger',
      autospin: 'true',
      action: function(dialogItself){
        $.ajax({
          url:'/api/container/'+name,
          method:'POST',
          data:{"action":"stop"},
          dataType:'json'
        }).done(function(resp){
          dialogItself.close();
          renderTable();
        }).error(function(resp){
          dialogItself.close();
          BootstrapDialog.alert({message:"Dafuq?!?"+resp.status})
          $("#errorframe").html(resp.status);
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

function del(name){
  BootstrapDialog.show({
    message: 'Delete container '+name+"?",
    buttons: [{
      label: 'Delete',
      cssClass: 'btn-danger',
      autospin: 'true',
      action: function(dialogItself){
        $.ajax({
          url:'/api/container/'+name,
          method:'DELETE',
          dataType:'json'
        }).done(function(resp){
          dialogItself.close();
          BootstrapDialog.alert({message:"Container "+name+" deleted"})
          renderTable();
        }).error(function(resp){
          dialogItself.close();
          BootstrapDialog.alert({message:"Dafuq?!?"+resp.status})
          $("#errorframe").html(resp.status);
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

function backup(name){
  BootstrapDialog.show({
    message: 'Backup container '+name+"?",
    buttons: [{
      label: 'Backup',
      cssClass: 'btn-success',
      autospin: 'true',
      action: function(dialogItself){
        $.ajax({
          url:'/api/container/'+name,
          method:"POST",
          data:{"action":"backup"},
          dataType:'json'
        }).done(function(resp){
          dialogItself.close();
          BootstrapDialog.alert({message:"Container "+name+" saved"})
          renderTable();
        }).error(function(resp){
          dialogItself.close();
          BootstrapDialog.alert({message:"Dafuq?!?"+resp.status})
          $("#errorframe").html(resp.status);
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
