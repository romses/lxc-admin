$(document).ready(function(){
  renderContent('container');
});

var menuitems={
  'container':{'template':'containertable.tmpl','selector':'#mnuContainer'},
  'user'     :{'template':'usertable.tmpl','selector':'#mnuUser'},
  'domain'   :{'template':'domaintemplate.tmpl','selector':'#mnuDomains'},
  'database' :{'template':'databasetemplate.tmpl','selector':'#mnuDatabases'},
  'backup'   :{'template':'backuptemplate.tmpl','selector':'#mnuBackups'},
  'admin'    :{'template':'admintemplate.tmpl','selector':'#mnuAdmins'},
};

function renderContent(name){
  selectMenu($(menuitems[name].selector));
  $.ajax({
    url:"/api/"+name,
    method:"GET",
    dataType:"json"
  }).done(function(container){
    template=$.ajax({
      url:"/static/templates/"+menuitems[name].template,
    }).done(function(data){
      template=_.template(data);
      rendered=template({items:container});
      $("#target").html(rendered);
    }).error(function(){
      $("#errorframe").html("Error loading Template "+menuitems[name].template);
    });
  }).error(function(error){
    $("#errorframe").html("Error loading Data /api/"+name);
  });
}







function start(name){
  $.ajax({
    url:'/api/container/'+name,
    method:'POST',
    data:{"action":"start"},
    dataType:'json'
  }).done(function(resp){
    BootstrapDialog.alert({message:"Container "+name+" deleted"})
    renderContent('container');
  }).error(function(resp){
    BootstrapDialog.alert({message:"Dafuq?!?"+resp.status})
    $("#errorframe").html(resp.extstatus);
    renderContent('container');
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

function selectMenu(item){
  $("#mnuContainer").removeClass("active");
  $("#mnuUser").removeClass("active");
  $("#mnuDomains").removeClass("active");
  $("#mnuDatabases").removeClass("active");
  $("#mnuBackups").removeClass("active");
  $("#mnuAdmins").removeClass("active");
  item.addClass("active");
}
