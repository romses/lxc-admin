# LXC-Controller API

## Container
### list container
    GET /api/container

    Params: {}
    Returns: [container,container,...]

    container:{
      "name" : name,
      "status":"started|stopped|maintenance",
      "extstatus":"text",  
      "data":{15.10.2015 11:13:17 
        "ip":ip,
        "mem":mem
      },
      "warnings":["list","of","warnings"]
    }  
 
### new container
    PUT /api/container/<name>

    Params:{
      "type":"clone:{"origin":origin}|download:{"dist":dist,"release":release,"arch":arch}",
    }

    Returns:{
      "status":"Ok|Error",
      "extstatus":"text"
    }

### Delete container
    DELETE /api/container/<name>

    Params:{}

    Returns:{
      "status":"Ok|Error",
      "extstatus":"text"
    }

### container actions

    POST /api/container/<name>

    Params:{
      "action":"Start|Stop|Backup|Restore:{identifier}"
    }

    Returns:{
      "status":"Ok|Error",
      "extstatus":"text"
    }


## User
### list user
    GET /api/user

    Params: {}
    Returns: [user,user,...]

    user:{
      "username":name,  
      "password":password,
      "container":container
    }  
 
### new user
    PUT /api/user/<name>

    Params:{
        "password":"password",
        "container":"container"
    }

    Returns:{
      "status":"Ok|Error",
      "extstatus":"text"
    }

### delete user
    DELETE /api/user/<name>

    Params:{}

    Returns:{
      "status":"Ok|Error",
      "extstatus":"text"
    }


## Domains
### list domains
    GET /api/domain

    Params: {}
    Returns: [domain,domain,...]

    domain:{
      "domain":domain,  
      "www":www,
	  "ssl":ssl,
      "container":container
    }  
 
### new domain
    PUT /api/domain/<name>

    Params:{
        "www":"www",
        "ssl":"ssl",
	    "container","container"
    }

    Returns:{
      "status":"Ok|Error",
      "extstatus":"text"
    }

### delete domain
    DELETE /api/user/<name>

    Params:{}

    Returns:{
      "status":"Ok|Error",
      "extstatus":"text"
    }


## Database
### list databases
    GET /api/database

    Params: {}
    Returns: [database,database,...]

    database:{
      "database":database,  
      "password":password,
      "container":container
    }  
 
### new database
    PUT /api/database/<name>

    Params:{
      "password":password,
      "container":container
    }  

    Returns:{
      "status":"Ok|Error",
      "extstatus":"text"
    }

### delete database
    DELETE /api/database/<name>

    Params:{}

    Returns:{
      "status":"Ok|Error",
      "extstatus":"text"
    }


## Backups
### list backups
    GET /api/backup

    Params: {}
    Returns: [backup,backup,...]

    backup:{
      "container":container,  
      "date":date,
      "size":size
    }  
 
### new backup
    PUT /api/nackup/<name>

    Params:{}  

    Returns:{
      "status":"Ok|Error",
      "extstatus":"text"
    }

### delete backup
    DELETE /api/backup/<identifier>

    Params:{}

    Returns:{
      "status":"Ok|Error",
      "extstatus":"text"
    }

## Admins
### list admins
    GET /api/admin

    Params: {}
    Returns: ["admin","admin",...]
 
 
### new admin
    PUT /api/admin/<name>

    Params:{
	  "password":password
    }  

    Returns:{
      "status":"Ok|Error",
      "extstatus":"text"
    }

### delete admin
    DELETE /api/backup/<name>

    Params:{}

    Returns:{
      "status":"Ok|Error",
      "extstatus":"text"
    }
