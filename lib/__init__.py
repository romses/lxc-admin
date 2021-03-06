#!/usr/bin/python3

import lxc
import json
import urllib
import time
import pymysql
import os
import bcrypt
import shutil
import base64
import OpenSSL.crypto
import subprocess,shlex               #execute shell commands
from subprocess import Popen
import timestamp
import datetime
import tarfile
import sys


class container:
    """Container Abstraction"""
    options={}
    def __init__(self,options):
        self.options=options

    def list(self):
        try:
            a=[]
            for _container in lxc.list_containers():
                c=self.container(_container,details=False)
                a.append(c)
            return a
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def container(self,name,details):
        try:
            _container=lxc.Container(name)
            warnings=[]
            if _container.running:
                ip=_container.get_ips()
            else:
                ip=[]
            c={
               "status":_container.state,
               "extstatus":"",
               "data":{
                   "name":_container.name,
                   "ip":ip,
                   "mem":"0"
               },
               "warnings":warnings
              }
            if(details==True):
                u=user(self.options)
                d=domain(self.options)
                db=database(self.options)
                c['user']=u.list(name)
                c['domain']=d.list(name)
                c['database']=db.list(name)

            return(c)
        except Exception as e:
            return {"status":"error","extstatus":str(e)}

    def create(self,name,data):
        try:
            d=domain(self.options)

            if('.' in name):
                return{"status":"Error","extstatus":"char . not allowed in name"}
            if('type' in data):
                if(data['type'].upper()=="DOWNLOAD"):
                    c=lxc.Container(name)
                    if c.defined:
                        return {"status":"Error","extstatus":"Container already existing"}
                    else:
                        command = 'lxc-create -n {}'.format(name)
                        command += ' -t download'
                        command += ' -B btrfs'
                        command += " -- -d {}".format(data['origin[dist]'])
                        command += " -r {}".format(data['origin[version]'])
                        command += " -a {}".format(data['origin[arch]'])

                        try:
                            subprocess.check_call('{}'.format(command),shell=True)
                        except subprocess.CalledProcessError:
                            print("container:create: - Container downloading failed!")

                        f = open("/var/lib/lxc/"+name+"/config","a")
                        f.write("lxc.start.auto = 1")
                        f.close()

                        os.chmod("/var/lib/lxc/{}".format(name),0o775)
                        os.mkdir("/var/lib/lxc/{}/rootfs/var/www/".format(name))
                        os.chown("/var/lib/lxc/{}/rootfs/var/www/".format(name),1000,1000)

                        d.updateHAProxy()
    
                        if(c.defined):
                            return {"Status":"Ok","extstatus":"Container created"}
                        else:
                            return {"Status":"Error","extstatus":"Container creation failed"}
                if(data['type'].upper()=="CLONE"):
                    if('origin' in data):
                        c=lxc.Container(data['origin'])
                        if c.defined:
                            c.clone(name)
                            os.chmod("/var/lib/lxc/{}".format(name),0o775)
                            os.mkdir("/var/lib/lxc/{}/rootfs/var/www/".format(name))
                            os.chown("/var/lib/lxc/{}/rootfs/var/www/".format(name),1000,1000)
                        else:
                            return{"status":"Error","extstatus":"Origin not dound"}
                    else:
                        return{"status":"Error","extstatus":"Origin missing"}
            else:
                return{"status":"Error","extstatus":"Incomplete Request: Type (clone/download) missing"}
            return {'status':'Ok','extstatus':'Container created'}
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def delete(self,name):
        try:
            command = 'lxc-destroy -n {}'.format(name)
            out=""
            try:
                out = subprocess.check_output('{}'.format(command),shell=True)
                u=user(self.options)
                for x in u.list(name):
                    u.delete(x['username'])
                d=domain(self.options)
                for x in d.list(name):
                    d.delete(x['domain'])
                d=database(self.options)
                for x in d.list(name):
                    d.delete(x['username'])

            except subprocess.CalledProcessError:
                print("container:delete: - Deleting container failed! (Path in use or running)")
                return {"status":"Error","extstatus":"Deleting container failed! (Path in use or running)"}
        
            return {'status':'Ok','extstatus':'Container deleted'}
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def backup(self,name):
        try:
            b=backup(self.options)
            return(b.create(name))
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def restore(self,name,data):
        try:
            b=backup(self.options)
            return(b.restore(name,data))
        except Exception as e:
            return {"status":"error","extstatus":str(e)}

    def start(self,name):
        try:
            c=lxc.Container(name)
            d=domain(self.options)
            if c.defined:
                c.start()
                d.updateHAProxy()
                return {'status':'Ok','extstatus':'Container started'}
            else:
                return {'status':'Error','extstatus':'Container not existing'}
            
            return {'status':'Ok','extstatus':'Container started'}
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def stop(self,name):
        try:
            c=lxc.Container(name)
            d=domain(self.options)
            if c.defined:
                c.stop()
                d.updateHAProxy()
                return {'status':'Ok','extstatus':'Container stopped'}
            else:
                return {'status':'Error','extstatus':'Container not existing'}
            
            return {'status':'Ok','extstatus':'Container stopped'}
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def images(self):
        try:
            f=urllib.request.urlopen(self.options['IMAGE_URL'])
            lines=f.readlines()
            jsondata={}

            for line in lines:
                dist=line.decode().split(";")[0]
                release=line.decode().split(";")[1]
                arch=line.decode().split(";")[2]
                if dist not in jsondata.keys():
                    jsondata[dist]={}
                if release not in jsondata[dist].keys():
                    jsondata[dist][release]=[]
                if arch in ("amd64","i386"):
                    jsondata[dist][release].append(arch)
            return {'status':'Ok','extstatus':'','data':jsondata}
        except:
            return {'status':'Error','extstatus':'Error retrieving images from repository '+self.options['IMAGE_URL'],'data':""}

class user:
    """User Abstraction"""
    con=0
    cur=0
    def __init__(self,options):
        self.options=options
        self.con=pymysql.connect(options['DB_HOST'], options['DB_USERNAME'], options['DB_PASSWORD'], options['DB']);
        self.cur=self.con.cursor()

    def list(self,name=""):
        try:
            if(name==""):
                self.cur.execute('SELECT userid,passwd,container,homedir FROM ftpuser')
            else:
                self.cur.execute('SELECT userid,passwd,container,homedir FROM ftpuser where container=%s',name)

            rows = self.cur.fetchall()
            users=[]

            for row in rows:
                c={'username':row[0],
                   'password':row[1],
                   'container':row[2],
                   'homedir':row[3].replace("/var/lib/lxc/"+row[2]+"/rootfs","")
                }
                users.append(c)

            return users
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def create(self,name,data):
        try:
            if('user' not in data):
                return {'status':'Error','extstatus':'Username missing'}
            if('password' not in data):
                return {'status':'Error','extstatus':'Password missing'}
            if('container' not in data):
                return {'status':'Error','extstatus':'Container missing'}
            if('homedir' not in data):
                return {'status':'Error','extstatus':'Homedir missing'}
            if(data['user']=="error"):
                 return {'status':'Error','extstatus':data['password']}

            homedir="/var/lib/lxc/{}/rootfs/{}".format(data['container'],data['homedir'])
            hd=""

            while (homedir!=hd):
                hd=homedir
                homedir=hd.replace('//','/')
            homedir=homedir.replace('../','')

            if not os.path.exists(homedir):
                return{"status":"Error","extstatus":data['homedir']+" not existing in container"}

            os.chmod("/var/lib/lxc/{}".format(data['container']),0o775)
            if(not os.path.exists("/var/lib/lxc/{}/rootfs/var/www/".format(data['container']))):
                os.mkdir("/var/lib/lxc/{}/rootfs/var/www/".format(data['container']))
            os.chown("/var/lib/lxc/{}/rootfs/var/www/".format(data['container']),1000,1000)

            try:
                self.cur.execute('INSERT INTO ftpuser (userid,passwd,container,homedir) VALUES (%s,%s,%s,%s) ON DUPLICATE KEY UPDATE passwd=VALUES(passwd), container=VALUES(container), homedir=VALUES(homedir)',(data['user'],data['password'],data['container'],homedir))
                self.con.commit()
            except:
                return {"status":"Error","extstatus":"Cannot add user "+data['user']+", Query failed"}

            return {"status":"Ok","extstatus":"User added"}
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def delete(self,name):
        try:
            self.cur.execute('DELETE FROM ftpuser where userid=%s',(name))
            self.con.commit()
        except:
            return {"status":"Error","extstatus":"cannot delete user "+name+", Query failed"}
        return {"status":"Ok","extstatus":"User deleted"}

class domain:
    """Domain Abstraction"""
    con=0
    cur=0
    def __init__(self,options):
        self.options=options
        self.con=pymysql.connect(options['DB_HOST'], options['DB_USERNAME'], options['DB_PASSWORD'], options['DB']);
        self.cur=self.con.cursor()

    def list(self,name=""):
        try:
            if(name==""):
                self.cur.execute('SELECT domain,www,container,crtfile FROM domains')
            else:
                self.cur.execute('SELECT domain,www,container,crtfile FROM domains where container =%s',name)

            rows = self.cur.fetchall()
            domains=[]

            for row in rows:
                try:
                    f=open(row[3],"r")
                    crt=f.read()
                    f.close()
                except:
                    crt=""

                c={'domain':row[0],
                   'www':row[1],
                   'container':row[2],
                   'crtfile':crt
                }
                domains.append(c)

            return domains
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def create(self,name,data):
        try:
            www=0
            if('domain' not in data):
                return {'status':'Error','extstatus':'domain missing'}
            if('container' not in data):
                return {'status':'Error','extstatus':'Container missing'}
            if(data['domain']=="error"):
                return {'status':'Error','extstatus':'user triggered error'}
            if(data['www']=="true"):
                www=1

            tmpfile='/etc/haproxy/certs/'+data['domain']+".crt"


            if(data['ssl']==""):
                if os.path.isfile(tmpfile):
                    os.remove(tmpfile)
                tmpfile=""
            else:
                c=certificate(data['ssl'])
                if(c.isUsableFor(name)):
                    f=open(tmpfile,"w")
                    f.write(data['ssl'])
                    f.close()
                else:
                    return{"status":"warning","extstatus":"Certificate not matching "+name+" or damaged"}

            try:
                self.cur.execute('INSERT INTO domains (domain,www,crtfile,container) VALUES (%s,%s,%s,%s) ON DUPLICATE KEY UPDATE www=VALUES(www), crtfile=VALUES(crtfile), container=VALUES(container)',(data['domain'],www,tmpfile,data['container']))
                self.con.commit()
            except pymysql.Error as e:
                return {"status":"Error","extstatus":"Query failed"}

            self.updateHAProxy()

            return {"status":"Ok","extstatus":"Domain saved"}
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def delete(self,name):
        try:
            self.cur.execute('DELETE FROM domains WHERE domain=%s',name)
            self.con.commit()
        except pymysql.Error as e:
            return {"status":"Error","extstatus":"Query failed"}

        self.updateHAProxy()

        return {"status":"Ok","extstatus":"Domain "+name+" deleted"}

    def updateHAProxy(self):
        try:
            shutil.copy2('/etc/lxcadmin/haproxy.stub', '/etc/haproxy/haproxy.cfg')

            self.cur.execute("SELECT domain,www,crtfile,container FROM domains")
            rows = self.cur.fetchall()

            domains={}
            ssldomains={}
            sslcerts=[]
            backends=[]

            for row in rows:
                if( lxc.Container(row[3]).running):
                    domains[row[0]]=row[3]
                    if(row[3] not in backends):
                        backends.append(row[3])
                    if(row[1]):
                        domains['www.'+row[0]]=row[3]
                    if(row[2]):
                        c=certificate()
                        c.open(row[2])
                        if(c.isUsableFor(row[0])):
                            sslcerts.append(row[2])
                            ssldomains[row[0]]=row[3]
                            if(row[1]):
                                ssldomains['www.'+row[0]]=row[3]

            f=open('/etc/haproxy/domain2backend.map',"w")
#Generate HTTP Frontends
            for k in domains.keys():
                f.write(k+" bk_"+domains[k]+"\n")
            f.write("macftp02.macrocom.de bk_config\n")
            f.close()

            f=open("/etc/haproxy/domain2backend_ssl.map","w")
            for k in ssldomains:
#                print(k+" "+ssldomains[k])
                f.write(k+" bk_"+ssldomains[k]+"\n")
            f.close()

            f = open("/etc/haproxy/haproxy.cfg","a")

#Generate HTTPS Frontends

            if(len(ssldomains)>0):
                f.write("frontend https\n")
                f.write("\tmode http\n")
                f.write("\tbind 0.0.0.0:443 ssl")
                for k in sslcerts:
                    f.write(" crt "+k)
                f.write("\n\tuse_backend %[req.hdr(host),lower,map(/etc/haproxy/domain2backend_ssl.map,bk_default)]\n\n")

#Generate Backends
   
            for k in backends:
                f.write('backend bk_'+k+"\n")
                f.write('\tmode http\n')
                f.write('\tserver '+k+' '+k+'.lxc:80 check\n')
                f.write('\n\n')
            f.write('backend bk_config\n')
            f.write('\tmode http\n')
            f.write('\tserver srvdefault 127.0.0.1:'+self.options['PORT']+' check\n\n')

            f.close()

            command = ['service', 'haproxy','restart'];
            subprocess.check_call(command, shell=False)

            return 0
        except Exception as e:
            return {"status":"error","extstatus":str(e)}

class database:
    con=0
    cur=0
    def __init__(self,options):
        self.options=options
        self.con=pymysql.connect(options['DB_HOST'], options['DB_USERNAME'], options['DB_PASSWORD'], options['DB']);
        self.cur=self.con.cursor()

    def list(self,name=""):
        try:
            if(name==""):
                self.cur.execute('SELECT user,password,container FROM db')
            else:
                self.cur.execute('SELECT user,password,container FROM db where container=%s',name)


            rows = self.cur.fetchall()
            databases=[]

            for row in rows:
                c={'username':row[0],
                   'password':row[1],
                   'container':row[2],
                }
                databases.append(c)

            return databases
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def create(self,name,data):
        try:
            if('username' not in data):
                return {'status':'Error','extstatus':'username missing'}
            if('container' not in data):
                return {'status':'Error','extstatus':'Container missing'}
            if(data['username']=="error"):
                return {'status':'Error','extstatus':'user triggered error'}
            if('password' not in data):
                return {'status':'Error','extstatus':'Password missing'}
        
            try:
                self.cur.execute('INSERT INTO db (user,password,container) VALUES (%s,%s,%s) ON DUPLICATE KEY UPDATE password=VALUES(password),container=VALUES(container)',(data['username'],data['password'],data['container']))
                self.con.commit()
            except pymysql.Error as e:
                return {"status":"Error","extstatus":"Query failed"}

            self.updateDatabases()
            return {"status":"Ok","extstatus":"Databeses created"}
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def delete(self,name):
        try:
            self.cur.execute('DELETE FROM db where user=%s',(name))
            self.con.commit()
        except pymysql.Error as e:
            print(e)

        try:
            self.cur.execute("DROP DATABASE {db}".format(db=name))
            self.con.commit()
        except pymysql.Error as e:
            print(e)
        
        return {"status":"Ok","extstatus":"Database deleted"}

    def updateDatabases(self):
        try:
            self.cur.execute("SELECT user,password,container FROM db")
            rows = self.cur.fetchall()
            for row in rows:    
                try:
                    self.cur.execute("CREATE DATABASE IF NOT EXISTS {db}".format(db=row[0]))
                    self.con.commit()
                except  mymysql.Error as e:
                    print("Creating "+row[0]+" failed")
                    print(e)

                try:
                    self.cur.execute("CREATE USER %s IDENTIFIED BY %s",(row[0],row[1]))
                    self.con.commit()
                except  pymysql.Error as e:
                    print("Warning: User existing. Trying to update password")
                    try:
                        self.cur.execute("SET PASSWORD FOR %s@'%%' = PASSWORD(%s)",(row[0],row[1]))
                        self.con.commit()
                    except pymysql.Error as e:
                        print("Cannot update Password")
                        print(e)

                try:
                    self.cur.execute("GRANT USAGE on *.* TO %s@'%%' IDENTIFIED BY %s",(row[0],row[1]))
                    self.con.commit()
                except  pymysql.Error as e:
                    print(e)

                try:
                    self.cur.execute("GRANT ALL ON {user}.* TO %s@'%%' IDENTIFIED BY %s".format(user=row[0]),(row[0],row[1]))
                    self.con.commit()
                except  pymysql.Error as e:
                    print(e)
            return 0
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


class backup:
    """Backup Abstraction"""
    con=0
    cur=0
    def __init__(self,options):
        self.options=options
        self.con=pymysql.connect(self.options['DB_HOST'], self.options['DB_USERNAME'], self.options['DB_PASSWORD'], self.options['DB']);
        self.cur=self.con.cursor()

    def list(self):
        try:
            backups=[]
            for path in os.listdir(self.options['BACKUPPATH']):
                for file in os.listdir(self.options['BACKUPPATH']+"/"+path):
                    b={'container':path,
                       'date':file.split(".")[0],
                       'size':os.stat(self.options['BACKUPPATH']+"/"+path+"/"+file).st_size,
                    }
                    backups.append(b)

            return backups
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def create(self,name):
        try:
            self.cur.execute('SELECT * FROM db WHERE container = %s',(name))
            rows = self.cur.fetchall()

            command = ['mysqldump', '-u'+self.options['DB_USERNAME'],"-p"+self.options['DB_PASSWORD'],"--databases"];

            for row in rows:
                command.append(row[0])

            try:
                f=open('/var/lib/lxc/{}/databasedump.sql'.format(name),"w")
                x=Popen(command,stdout=f)
                x.wait()

                f.write("\nuse lxc;\n")
                for row in rows:
                    sql="INSERT INTO db (user,password,container) VALUES ('{}','{}','{}') ON DUPLICATE KEY UPDATE user=VALUES(user), password=VALUES(password), container=VALUES(container);\n"
                    f.write(sql.format(row[0],row[1],row[2]))
                    sql="GRANT USAGE ON *.* to '{}'@'%' IDENTIFIED BY '{}';\n"
                    f.write(sql.format(row[0],row[1]))
                    sql="GRANT ALL ON {}.* to '{}'@'%' IDENTIFIED BY '{}';\n"
                    f.write(sql.format(row[0],row[0],row[1]))

                self.cur.execute('SELECT * FROM ftpuser WHERE container = %s',(name))
                rows = self.cur.fetchall()

                for row in rows:
                    sql="INSERT INTO ftpuser (userid,passwd,container,uid,gid,homedir,shell) VALUES ('{}','{}','{}',{},{},'{}','{}') ON DUPLICATE KEY UPDATE userid=VALUES(userid), passwd=VALUES(passwd), container=VALUES(container), uid=VALUES(uid), gid=VALUES(gid),homedir=VALUES(homedir),shell=VALUES(shell);\n"
                    f.write(sql.format(row[0],row[1],row[2],row[3],row[4],row[5],row[6]))

                self.cur.execute('SELECT * FROM domains WHERE container = %s',(name))
                rows = self.cur.fetchall()

                for row in rows:
                    domain=row[0]
                    www=row[1]
                    ssl=row[2]
                    crtfile=row[3]
                    sql="INSERT INTO domains (domain,www,`ssl`,container,crtfile) VALUES ('{}',{},'{}','{}','{}') ON DUPLICATE KEY UPDATE domain=VALUES(domain), www=VALUES(www), `ssl`=VALUES(`ssl`), container=VALUES(container), crtfile=VALUES(crtfile);\n"
                    f.write(sql.format(row[0],row[1],row[2],name,row[3]))
                f.close()

            except subprocess.CalledProcessError as e:
                print(e)
                return {"status":"Error","extstatus":"Creating backup failed"}

            today = datetime.datetime.today()
            filename=self.options['BACKUPPATH']+"/"+name+"/"+today.strftime("%Y-%b-%d-%H-%M-%S")+".tar.bz2.incomplete"

            if not os.path.isdir(self.options['BACKUPPATH']+"/"+name+"/"):
                os.mkdir(self.options['BACKUPPATH']+"/"+name+"/")

            tar=tarfile.open(filename,'w:bz2')
            tar.add('/var/lib/lxc/'+name,filter=self.prefixer)
            tar.close()

            os.rename(filename,filename.replace('.incomplete','',1))
            os.remove('/var/lib/lxc/'+name+'/databasedump.sql')

            return {"status":"Ok","extstatus":"Backup completed"}
        except Exception as e:
            return {"status":"error","extstatus":str(e)}



    def prefixer(self,tarinfo):
        try:
            tarinfo.name=tarinfo.name[12:]
            tokens=tarinfo.name.split("/")
            if(len(tokens)>3):
                if(tokens[3]=="proc"):
                    return None
                if(tokens[3]=="sys"):
                    return None
                if(tokens[3]=="run"):
                    return None
            return tarinfo
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def delete(self,name,data):
        try:
            if(os.path.isfile(self.options['BACKUPPATH']+"/"+name+"/"+data['date']+".tar.bz2")):
                os.remove(self.options['BACKUPPATH']+"/"+name+"/"+data['date']+".tar.bz2")
                return {"status":"Ok","extstatus":"Backup deleted"}
            return {"status":"Error","extstatus":"File not found"}
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def restore(self,name,data):
        try:
            cmd='btrfs subvolume list /var/lib/lxc'
            subvolumes=os.popen(cmd).readlines()

            if('date' not in data):
                return{"status":"Error","extstatus":"date not provided"}
            else:
                file=data['date']

            create_subvolume=1

            for subvolume in subvolumes:
                if (subvolume.split(" ")[8].strip()) == name+"/rootfs":
                    create_subvolume=0

            if(create_subvolume):
                if not os.path.isdir("/var/lib/lxc/"+name):
                    os.makedirs("/var/lib/lxc/"+name)
                cmd="btrfs subvolume create /var/lib/lxc/"+name+"/rootfs"
                os.popen(cmd)

            today = datetime.datetime.today()

            f=open("/var/lib/lxc/"+name+"/.lockfile","w")
            f.write(today.strftime("%Y-%b-%d-%H-%M-%S"))
            f.close()

            if(os.path.isfile(self.options['BACKUPPATH']+"/"+name+"/"+file+".tar.bz2")):
                cmd='tar xf '+self.options['BACKUPPATH']+"/"+name+"/"+file+".tar.bz2 -C /var/lib/lxc/"
                os.popen(cmd).readlines()
            else:
                return {"status":"Error","extstatus":"Backup not found"}

            cmd='mysql -u'+self.options['DB_USERNAME']+' -p'+self.options['DB_PASSWORD']+" < "+"/var/lib/lxc/{}/databasedump.sql".format(name)

            os.popen(cmd).readlines()

            os.remove("/var/lib/lxc/"+container+"/databasedump.sql")
            os.remove("/var/lib/lxc/"+container+"/.lockfile")

            return {"status":"Ok","extstatus":"Container restored"}
        except Exception as e:
            return {"status":"error","extstatus":str(e)}



class admin:
    """Backup Abstraction"""
    def __init__(self,options):
        self.options=options
        self.con=pymysql.connect(options['DB_HOST'], options['DB_USERNAME'], options['DB_PASSWORD'], options['DB']);
        self.cur=self.con.cursor()

    def list(self):
        try:
            self.cur.execute('SELECT user FROM users')
            rows = self.cur.fetchall()
            user=[]

            for row in rows:
                c={'user':row[0]
                }
                user.append(c)

            return user
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def create(self,name,data):
        try:
            if('password' in data):
                password=bcrypt.hashpw(data['password'],bcrypt.gensalt())
            else:
                return json.dumps({"status":"Error", "extstatus":"Password must not be empty"})

            if('password' not in data):
                return json.dumps({"status":"Error", "extstatus":"Username must not be empty"})

            self.cur.execute('INSERT INTO users (user,password) VALUES (%s,%s) ON DUPLICATE KEY UPDATE password=VALUES(password)',(data['user'],password))
            self.con.commit()

            return {"status":"Ok","extstatus":"User "+data['user']+" added"}
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def delete(self,name):
        try:
            self.cur.execute('DELETE FROM users WHERE user=%s',(name))
            self.con.commit()
            return {"status":"Ok","extstatus":"User "+name+" deleted"}

        except pymysql.Error as e:
            return {"status":"Error","extstatus":"Error deleting "+name}

class certificate:
    """Certificate handler"""

    def __init__(self,data=""):
        """load Certificate by String"""
        self.crtblob=data.split("\n")
        for x in range(0,len(self.crtblob)):
            self.crtblob[x]+="\n"
        self.certs=[]
        self.keys=[]
        self.certloader()
        self.keyloader()

    def open(self,filename):
        """load certificate by filename"""
        try:
            if(os.path.isfile(filename)):
                with open(filename) as f:
                    for line in f.readlines():
                        self.crtblob.append(line)
                self.certloader()
                self.keyloader()
            return 0
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def reset(self):
        try:
            self.crtblob=""
            self.certs=[]
            self.keys=[]
            return 0
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def certloader(self):
        """Certloader"""
        try:
            stSpam, stHam, stDump = 0, 1, 2
            startMarkers=['-----BEGIN CERTIFICATE-----']
            stopMarkers=['-----END CERTIFICATE-----']
            state = stSpam
            for line in self.crtblob:
                if state == stSpam:
                    if line.strip() in startMarkers:
                        certLines = []
                        certLines.append(line)
                        state = stHam
                        continue
                if state == stHam:
                    if line.strip() in stopMarkers:
                        certLines.append(line)
                        state = stSpam
                        self.certs.append("".join(certLines))
                    else:
                        certLines.append(line)
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def keyloader(self):
        """Certloader"""
        try:
            stSpam, stHam, stDump = 0, 1, 2
            startMarkers=['-----BEGIN RSA PRIVATE KEY-----','-----BEGIN PRIVATE KEY-----']
            stopMarkers=['-----END RSA PRIVATE KEY-----','-----END PRIVATE KEY-----']
            state = stSpam
            for line in self.crtblob:
                if state == stSpam:
                    if line.strip() in startMarkers:
                        certLines = []
                        certLines.append(line)
                        state = stHam
                        continue
                if state == stHam:
                    if line.strip() in stopMarkers:
                        certLines.append(line)
                        state = stSpam
                        self.keys.append("".join(certLines))
                    else:
                        certLines.append(line)
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def matchName(self,domain):
        """certparser"""
        try:
            answer={"match":False,"pkey":False}

            for cert in self.certs:
#check, if certificate is valid
                try:
                    cert_obj = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_PEM, cert)
                except OpenSSL.crypto.Error as e:
                    return{"match":False,"pkey":False,"error":'certificate is not parsable'}

                for key in self.keys:
#check, if private key is valid
                    try:
                        private_key_obj = OpenSSL.crypto.load_privatekey(OpenSSL.crypto.FILETYPE_PEM, key)
                    except OpenSSL.crypto.Error:
                        return{"match":False,"pkey":False,"error":'private key is not parsable'}

                    context = OpenSSL.SSL.Context(OpenSSL.SSL.TLSv1_METHOD)
                    context.use_privatekey(private_key_obj)
                    context.use_certificate(cert_obj)

                    try:
#check, if certificate and key matches
                        context.check_privatekey()

                        if(self.urlmatch(cert_obj.get_subject().CN,domain)):
#if certificate matches domain
                            answer['match']=True
                            answer['pkey']=True
                            return(answer)
                        for i in range(0,cert_obj.get_extension_count()):
                            extension = cert_obj.get_extension(i)
                            if(b'subjectAltName'==extension.get_short_name()):
#if SAN matches doamin
                                for token in str(extension).split(","):
                                    if(self.urlmatch(token.split(":")[1],domain)):
                                        answer['match']=True
                                        answer['pkey']=True
                                        return(answer)
                    except OpenSSL.SSL.Error as e:
                        return{"match":False,"pkey":False,"error":"cert and pkey mismatch"}

            return(answer)
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def isUsableFor(self,domain):
        try:        
            return self.matchName(domain)['match']
        except Exception as e:
            return {"status":"error","extstatus":str(e)}


    def urlmatch(self,a,b):
        try:
#helperfunction to check, if two domains matches
            aa = a.split('.')
            bb = b.split('.')
            if len(aa) != len(bb): return False
            for x, y in zip(aa, bb):
                if not (x == y or x == '*' or y == '*'): return False
            return True
        except Exception as e:
            return {"status":"error","extstatus":str(e)}

