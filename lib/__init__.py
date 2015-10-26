#!/usr/bin/python3

import lxc
import json
import urllib
import time
import pymysql
import os

class container:
    """Container Abstraction"""
    options={}
    def __init__(self,options):
        self.options=options

    def list(self):
        a=[]
        for container in lxc.list_containers():
            _container=lxc.Container(container)
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
            a.append(c)
        return json.dumps(a)

    def create(self,name,data):
        time.sleep(5)
        return json.dumps({'status':'Ok','extstatus':'Container created'})

    def delete(self,name):
        time.sleep(5)
        return json.dumps({'status':'Ok','extstatus':'Container deleted'})

    def backup(self,name):
        time.sleep(5)
        return json.dumps({'status':'Ok','extstatus':'Container saved'})

    def restore(self,name):
        time.sleep(5)
        return json.dumps({'status':'Ok','extstatus':'Container restored'})

    def start(self,name):
        time.sleep(5)
        return json.dumps({'status':'Ok','extstatus':'Container started'})

    def stop(self,name):
        time.sleep(5)
        return json.dumps({'status':'Ok','extstatus':'Container stopped'})

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
            return json.dumps({'status':'Ok','extstatus':'','data':jsondata})
        except:
            return json.dumps({'status':'Error','extstatus':'Error retrieving images from repository '+self.options['IMAGE_URL'],'data':""})

class user:
    """User Abstraction"""
    con=0
    cur=0
    def __init__(self,options):
        self.options=options
        self.con=pymysql.connect(options['DB_HOST'], options['DB_USERNAME'], options['DB_PASSWORD'], options['DB']);
        self.cur=self.con.cursor()

    def list(self):
        self.cur.execute('SELECT userid,passwd,container FROM ftpuser')
        rows = self.cur.fetchall()
        users=[]

        for row in rows:
            c={'username':row[0],
               'password':row[1],
               'container':row[2]
            }
            users.append(c)

        return json.dumps(users)

    def create(self,name,data):
        return json.dumps({})

    def delete(self,name):
        return json.dumps({})

class domain:
    """Domain Abstraction"""
    con=0
    cur=0
    def __init__(self,options):
        self.options=options
        self.con=pymysql.connect(options['DB_HOST'], options['DB_USERNAME'], options['DB_PASSWORD'], options['DB']);
        self.cur=self.con.cursor()

    def list(self):
        self.cur.execute('SELECT domain,www,container,crtfile FROM domains')
        rows = self.cur.fetchall()
        domains=[]

        for row in rows:
            c={'domain':row[0],
               'www':row[1],
               'container':row[2],
               'crtfile':row[3]
            }
            domains.append(c)

        return json.dumps(domains)

    def create(self,name,data):
        return json.dumps(data)

    def delete(self,name):
        return json.dumps({})


class database:
    con=0
    cur=0
    def __init__(self,options):
        self.options=options
        self.con=pymysql.connect(options['DB_HOST'], options['DB_USERNAME'], options['DB_PASSWORD'], options['DB']);
        self.cur=self.con.cursor()

    def list(self):
        self.cur.execute('SELECT user,password,container FROM db')
        rows = self.cur.fetchall()
        databases=[]

        for row in rows:
            c={'user':row[0],
               'password':row[1],
               'container':row[2],
            }
            databases.append(c)

        return json.dumps(databases)

    def add(self,name):
        return json.dumps({})

    def delete(self,name):
        return json.dumps({})

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

        return json.dumps(backups)

    def add(self,name):
        return json.dumps({})

    def delete(self,name):
        return json.dumps({})

    def restore(self,name,date):
        return json.dumps({})


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

        return json.dumps(user)

    def add(self,name):
        return json.dumps({})

    def delete(self,name):
        return json.dumps({})
