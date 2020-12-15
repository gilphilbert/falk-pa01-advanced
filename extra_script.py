Import("env")

import os

def before_buildfs(source, target, env):
    os.chdir('./data/www')

    for file in os.listdir("."):
        if file.endswith(".css") or file.endswith("html") or file.endswith("js") or file.endswith("ico") or file.endswith("svg"):
            os.system('gzip -9 ' + file)
    os.chdir('./img')
    for file in os.listdir("."):
        if file.endswith(".css") or file.endswith("html") or file.endswith("js") or file.endswith("ico") or file.endswith("svg"):
            os.system('gzip -9 ' + file)
    os.chdir('../../../')


def after_buildfs(source, target, env):
    print("after buildfs")
    os.chdir('./data/www')
    print(os.getcwd())
    for file in os.listdir("."):
        if file.endswith("gz"):
            os.system('gunzip ' + file)
    os.chdir('./img')
    for file in os.listdir("."):
        if file.endswith("gz"):
            os.system('gunzip ' + file)

    os.chdir('../../../')

env.AddPreAction("${BUILD_DIR}/spiffs.bin", before_buildfs)
env.AddPostAction("${BUILD_DIR}/spiffs.bin", after_buildfs)
