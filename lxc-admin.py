#!/usr/bin/python3

# all the imports
import sqlite3
from flask import Flask, request, session, redirect, url_for, abort, render_template, flash, Response
from contextlib import closing
import pymysql as mdb
import lib
import lxc
import json
import timestamp
import datetime
import bcrypt
import logging
import urllib
import shutil                   #filecopy
import os
import subprocess,shlex               #execute shell commands
from subprocess import Popen
import time
import tempfile
from functools import wraps
import socket
import tarfile
import _thread

app = Flask(__name__)

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('logged_in') or ((timestamp()-session['last']) > options['SESSION_EXPIRE']):
            return redirect(url_for('login'))
        session['last']=timestamp()
        return f(*args, **kwargs)
    return decorated

@app.route('/')
@requires_auth
def index():
    t=[]
    t.append(time.time())

    return render_template('index.tmpl',data=duration(t))

@app.route('/api/container')
@requires_auth
def container():
    if request.method=="GET":
        l=lib.container(options)
        return Response(l.list(),mimetype="application/json")
    else:
        print("not implemented")

    return json.dumps({})

@app.route('/api/container/<name>',methods=['GET', 'POST','DELETE'])
@requires_auth
def namedcontainer(name):
    l=lib.container(options)
    if request.method=="GET":
        return render_template('container.tmpl')
    elif request.method=="DELETE":
        return Response(l.delete(name),mimetype="application/json")
    elif request.method=="POST":
        print("request.form")
        print(request.form)
        print("request.form[action]")
        print(request.form['action'])
        if request.form['action']=="backup":
            return Response(l.backup(name),mimetype="application/json")
        elif request.form['action']=="start":
            return Response(l.start(name),mimetype="application/json")
        elif request.form['action']=="stop":
            return Response(l.stop(name),mimetype="application/json")
    else:
        print(request.method+" not implemented")

    return json.dumps({})

@app.route('/login', methods=['GET', 'POST'])
def login():
    t=[]
    t.append(time.time())
    session.pop('logged_in', None)
    session.pop('last', None)
    session.pop('user',None)

    error = None
    if request.method == 'POST':
        con = mdb.connect(options['DB_HOST'], options['DB_USERNAME'], options['DB_PASSWORD'], options['DB']);
        cur = con.cursor()
        cur.execute('SELECT password FROM users where user= %s LIMIT 1',(request.form['username']))
        rows = cur.fetchall()
        if(len(rows)>0):
            session['logged_in'] = True
            session['last']=timestamp()
            session['user']=request.form['username']

            if (request.form['password']==rows[0][0]):
                logging.info('Plaintext Password for %s OK encrypting password now.',request.form['username'])
                password=bcrypt.hashpw(request.form['password'],bcrypt.gensalt())
                cur.execute('UPDATE users set password = %s where user = %s;',(password,request.form['username']))
                con.commit()
                rows = cur.fetchall()
                flash('You were logged in')
                con.close()
                return redirect(url_for('index'))
            elif(bcrypt.hashpw(request.form['password'], rows[0][0]) == rows[0][0]):
                flash('You were logged in')
                con.close()
                return redirect(url_for('index'))
            else:
                logging.info('Login error')
                session.pop('logged_in', None)
                session.pop('last',None)
                session.pop('user',None)

    return render_template('login.html', error=error,data={'durationTotal':duration(t)})

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    session.pop('last', None)
    session.pop('user',None)
    flash('You were logged out')
    return redirect(url_for('login'))

def parse_config(filename):
    COMMENT_CHAR = '#'
    OPTION_CHAR =  '='
    options = {}
    f = open(filename)
    for line in f:
        if COMMENT_CHAR in line:
            line, comment = line.split(COMMENT_CHAR, 1)
        if OPTION_CHAR in line:
            option, value = line.split(OPTION_CHAR, 1)
            option = option.strip()
            value = value.strip()
            options[option] = value
    f.close()

    defaults={'DEBUG'         :False,
              'SECRET_KEY'    :'development key',
              'DB_USERNAME'   :'lxc',
              'DB_PASSWORD'   :'secret',
              'DB_HOST'       :'localhost',
              'DB'            :'lxc',
              'SESSION_EXPIRE': 1000*3000,
              'DOMAINNAME'    : 'macftp02.macrocom.de',
              'PORT'          : 5000,
              'LOG'           : '/var/log/lxc-admin.log',
              'LOGLEVEL'      : 'WARNING',
              'IMAGE_URL'     : 'http://images.linuxcontainers.org/meta/1.0/index-system',
              'BIND'          : '127.0.0.1',
              'BACKUPPATH'    : '/var/lib/lxc-backups/',
              'CONTAINERPATH' : '/var/lib/lxc/'
              }

    for k in defaults.keys():
        options[k]=options[k] if k in options.keys() else defaults[k]

    options['SESSION_EXPIRE']=int(eval(options['SESSION_EXPIRE']))

    return options

def duration(t_):
    r={}

    t_.append(time.time())

    s=len(t_)

    if(s>2):
        for i in range(1,s):
            r[i]=round((t_[i]-t_[i-1])*1000,10)
    r['total']=round((t_[s-1]-t_[0])*1000,10)
    return json.dumps(r)

if __name__ == '__main__':
    logging.basicConfig(filename='lxcadmin.log')
    logging.warn('LXC-Controller started')
    options = parse_config('/etc/lxcadmin/config.conf')
    app.config['SECRET_KEY']=options['SECRET_KEY']
    app.run(host=options['BIND'],port=int(options['PORT']))
