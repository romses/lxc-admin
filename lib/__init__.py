#!/usr/bin/python3

import lxc
import json
import time

class container:
    """Container Abstraction"""
    options={}
    def __init__(self,options):
        self.options=options
        print("Container Constructor")

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


class user:
    """User Abstraction"""
    def __init__(self,options):
        self.options=options
        print("User Constructor")

    def list(self):
        return json.dumps({})

    def add(self,name):
        return json.dumps({})

    def delete(self,name):
        return json.dumps({})

class domain:
    """Domain Abstraction"""
    def __init__(self,options):
        self.options=options
        print("Domain Constructor")

    def list(self):
        return json.dumps({})

    def add(self,name):
        return json.dumps({})

    def delete(self,name):
        return json.dumps({})


class database:
    """Database Abstraction"""
    def __init__(self,options):
        self.options=options
        print("Container Constructor")

    def list(self):
        return json.dumps({})

    def add(self,name):
        return json.dumps({})

    def delete(self,name):
        return json.dumps({})

class backup:
    """Backup Abstraction"""
    def __init__(self,options):
        self.options=options
        print("Container Constructor")

    def list(self):
        return json.dumps({})

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
        print("admin Constructor")

    def list(self):
        return json.dumps({})

    def add(self,name):
        return json.dumps({})

    def delete(self,name):
        return json.dumps({})
