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

class container:
    """Container Abstraction"""
    options={}
    def __init__(self,options):
        self.options=options

    def list(self):
        a=[]
        for _container in lxc.list_containers():
            c=self.container(_container,details=False)
            a.append(c)
        return a

    def container(self,name,details):
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

    def create(self,name,data):
        time.sleep(5)
        return {'status':'Ok','extstatus':'Container created'}

    def delete(self,name):
        time.sleep(5)
        return {'status':'Ok','extstatus':'Container deleted'}

    def backup(self,name):
        time.sleep(5)
        return {'status':'Ok','extstatus':'Container saved'}

    def restore(self,name):
        time.sleep(5)
        return {'status':'Ok','extstatus':'Container restored'}

    def start(self,name):
        time.sleep(5)
        return {'status':'Ok','extstatus':'Container started'}

    def stop(self,name):
        time.sleep(5)
        return {'status':'Ok','extstatus':'Container stopped'}

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
        print("Appending user "+name)
        if(name==""):
            self.cur.execute('SELECT userid,passwd,container FROM ftpuser')
        else:
            self.cur.execute('SELECT userid,passwd,container FROM ftpuser where container=%s',name)

        rows = self.cur.fetchall()
        users=[]

        for row in rows:
            c={'username':row[0],
               'password':row[1],
               'container':row[2]
            }
            users.append(c)

        return users

    def create(self,name,data):
        if('user' not in data):
            return {'status':'Error','extstatus':'Username missing'}
        if('password' not in data):
            return {'status':'Error','extstatus':'Password missing'}
        if('container' not in data):
            return {'status':'Error','extstatus':'Container missing'}
        if(data['user']=="error"):
            return {'status':'Error','extstatus':'user triggered error'}

        homedir="/var/lib/lxc/"+data['container']+"/rootfs/var/www/html/"
        try:
            self.cur.execute('INSERT INTO ftpuser (userid,passwd,container,homedir) VALUES (%s,%s,%s,%s) ON DUPLICATE KEY UPDATE passwd=VALUES(passwd)',(data['user'],data['password'],data['container'],homedir))
            self.con.commit()
        except:
            return {"status":"Error","extstatus":"Cannot add user "+data['user']+", Query failed"}

        return {"status":"Ok","extstatus":"User added"}

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

    def create(self,name,data):

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
            if(self.checkCRT(name,data['ssl'])):
                f=open(tmpfile,"w")
                f.write(data['ssl'])
                f.close()
            else:
                return{"status":"Error","extstatus":"Certificate not matching or damaged"}

        try:
            self.cur.execute('INSERT INTO domains (domain,www,crtfile,container) VALUES (%s,%s,%s,%s) ON DUPLICATE KEY UPDATE www=VALUES(www), crtfile=VALUES(crtfile), container=VALUES(container)',(data['domain'],www,tmpfile,data['container']))
            self.con.commit()
        except pymysql.Error as e:
            return {"status":"Error","extstatus":"Query failed"}

        self.updateHAProxy()

        return {"status":"Ok","extstatus":"Domain saved"}

    def checkCRT(self,domain,crt):
        stSpam, stHam, stDump = 0, 1, 2
        startMarkers=['-----BEGIN CERTIFICATE-----']
        stopMarkers=['-----END CERTIFICATE-----']
        state = stSpam
        for line in crt.split('\n'):
            line=line.strip()
            if state == stSpam:
                if line in startMarkers:
                    certLines = []
                    state = stHam
                    continue
            if state == stHam:
                if line in stopMarkers:
                    state = stSpam
                    try:
                        x509 = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_ASN1, base64.b64decode("".join(certLines)))
                        if(self.urlmatch(x509.get_subject().CN,domain)):
                            return(True) # Match using CN
                        for i in range(0,x509.get_extension_count()):
                            extension = x509.get_extension(i)
                            if(b'subjectAltName'==extension.get_short_name()):
                                for token in str(extension).split(","):
                                    if(self.urlmatch(token.split(":")[1],domain)):
                                        return(True) # Match using DNS alternate name
                    except Exception as e:
                        return(False) # Cert not parsable

                else:
                    certLines.append(line)
        return (False) # No Match

    def urlmatch(self,a,b):
        aa = a.split('.')
        bb = b.split('.')
        if len(aa) != len(bb): return False
        for x, y in zip(aa, bb):
            if not (x == y or x == '*' or y == '*'): return False
        return True

    def delete(self,name):
        try:
            self.cur.execute('DELETE FROM domains WHERE domain=%s',name)
            self.con.commit()
        except pymysql.Error as e:
            return {"status":"Error","extstatus":"Query failed"}

        self.updateHAProxy()

        return {"status":"Ok","extstatus":"Domain "+name+" deleted"}

    def updateHAProxy(self):
        shutil.copy2('haproxy.stub', '/etc/haproxy/haproxy-test.cfg')

        self.cur.execute("SELECT domain,www,crtfile,container FROM domains")
        rows = self.cur.fetchall()

        domains={}
        ssldomains={}
        sslcerts=[]
        backends=[]

        for row in rows:
#            if(row[3] in lxclite.running()):
            if( lxc.Container(row[3]).running):
                domains[row[0]]=row[3]
                if(row[3] not in backends):
                    backends.append(row[3])
                if(row[1]):
                    domains['www.'+row[0]]=row[3]
                if(row[2]):
                    sslcerts.append(row[2])
                    ssldomains[row[0]]=row[3]
                    if(row[1]):
                        ssldomains['www.'+row[0]]=row[3]

        f=open('/etc/haproxy/domain2backend-test.map',"w")
#Generate HTTP Frontends
        for k in domains.keys():
            f.write(k+" bk_"+domains[k]+"\n")
        f.write("macftp02.macrocom.de bk_config\n")
        f.close()

        f=open("/etc/haproxy/domain2backend_ssl-test.map","w")
        for k in ssldomains:
#            print(k+" "+ssldomains[k])
            f.write(k+" bk_"+ssldomains[k]+"\n")
        f.close()

        f = open("/etc/haproxy/haproxy-test.cfg","a")

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

        return 0



class database:
    con=0
    cur=0
    def __init__(self,options):
        self.options=options
        self.con=pymysql.connect(options['DB_HOST'], options['DB_USERNAME'], options['DB_PASSWORD'], options['DB']);
        self.cur=self.con.cursor()

    def list(self,name=""):
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

    def create(self,name,data):
        time.sleep(5)
        return {}

    def delete(self,name):
        time.sleep(5)
        return {}

class backup:
    """Backup Abstraction"""
    def __init__(self,options):
        self.options=options

    def list(self):
        backups=[]
        for path in os.listdir(self.options['BACKUPPATH']):
            for file in os.listdir(self.options['BACKUPPATH']+"/"+path):
                b={'container':path,
                   'date':file.split(".")[0],
                   'size':os.stat(self.options['BACKUPPATH']+"/"+path+"/"+file).st_size,
                }
                backups.append(b)

        return backups

    def create(self,name):
        time.sleep(5)
        return {}

    def delete(self,name):
        time.sleep(5)
        return {}

    def restore(self,name,date):
        time.sleep(5)
        return {}


class admin:
    """Backup Abstraction"""
    def __init__(self,options):
        self.options=options
        self.con=pymysql.connect(options['DB_HOST'], options['DB_USERNAME'], options['DB_PASSWORD'], options['DB']);
        self.cur=self.con.cursor()

    def list(self):
        self.cur.execute('SELECT user FROM users')
        rows = self.cur.fetchall()
        user=[]

        for row in rows:
            c={'user':row[0]
            }
            user.append(c)

        return user

    def create(self,name,data):
        if('password' in data):
            password=bcrypt.hashpw(data['password'],bcrypt.gensalt())
        else:
            return json.dumps({"status":"Error", "extstatus":"Password must not be empty"})

        if('password' not in data):
            return json.dumps({"status":"Error", "extstatus":"Username must not be empty"})

        self.cur.execute('INSERT INTO users (user,password) VALUES (%s,%s) ON DUPLICATE KEY UPDATE password=VALUES(password)',(data['user'],password))
        self.con.commit()

        return {"status":"Ok","extstatus":"User "+data['user']+" added"}

    def delete(self,name):
        try:
            self.cur.execute('DELETE FROM users WHERE user=%s',(name))
            self.con.commit()
            return {"status":"Ok","extstatus":"User "+name+" deleted"}

        except pymysql.Error as e:
            return {"status":"Error","extstatus":"Error deleting "+name}
