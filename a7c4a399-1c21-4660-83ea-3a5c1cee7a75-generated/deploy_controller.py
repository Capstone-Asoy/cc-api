#!/usr/bin/python3
import os
import subprocess
import re
import shutil
import sys
import requests

# Note to developer: This script will be deprecated once blueprint controller is introduced, all deployments can then be done through the blueprint controller

def execute_command(command):
    p = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
    out, err = p.communicate()
    if p.returncode != 0:
        # print("bitcoin failed %d %s %s" % (p.returncode, out, err))
        lines = err.splitlines()
        for line in lines:
            print(line.decode())
        raise
    lines = out.splitlines()
    for line in lines:
        print(line.decode())

def get_priority(directory_name:str):
    if directory_name == "sql_database":
        return 1000
    else:
        return 0

def print_help_text():
    print(" \n\n \
        Looks like you have used teams and environments. Note that every team\n\
        and environment needs to maintain their own terraform states.\n \
        You can deploy these resoruces by navigating to the team/environment directory\n\
        and executing the following commands in order:\n\
        - For initializing terraform: `terraform init`\n\
        - For planning: `terraform plan`\n\
        - For deploying: `terraform apply`\n\
    ")

def execute_terraform():
    print("Executing terraform init...")
    execute_command("terraform init -no-color")
    print("Executing terraform plan...")
    execute_command("terraform plan -no-color")
    print("Executing terraform apply...")
    execute_command("terraform apply -auto-approve")

def can_skip(dirs):
    if len(dirs) == 0:
        return False
    elif len(dirs) == 1:
        if ("sql_database" in dirs) or (".terraform" in dirs):
            return False
    elif len(dirs) == 2:
        if (".terraform" in dirs and "sql_database" in dirs):
            return False
    return True

def main():
    tf_gen_backend = os.getenv("TF_GENERATION_BACKEND")
    if tf_gen_backend == None:
        print("warning: TF_GENERATION_BACKEND environment variable not set, skipping registration with analytics")
    else:
        print("registering deployment with analytics")
        try:
            r = requests.get(f"{tf_gen_backend}/analytics",timeout=5)
            if r.status_code != 200:
                print("request failed, skipping registration with analytics")
        except Exception as e:
            print("error while trying to register with analytics",e)


    for root, dirs, files in os.walk("./google", topdown=True):
        dirs = sorted(dirs, key=get_priority)
        tf_found = False

        if not can_skip(dirs):
            cwd=os.getcwd()
            print(cwd+"/"+root+"/")
            os.chdir(cwd+"/"+root+"/")
            pattern = re.compile(".*\.tf")
            for file in files:
                if pattern.match(file):
                    tf_found = True
                    break
            if tf_found:
                try:
                    execute_terraform()
                    os.chdir(cwd)
                except Exception:
                    sys.exit(1)

            print(dirs)
            if "sql_database" in dirs: 
                tf_found = False
                os.chdir(cwd+"/"+root+"/"+"sql_database")
                for r, d, f in os.walk("./", topdown=True):
                    for fi in f:
                        if pattern.match(fi):
                            tf_found = True
                            break
                if tf_found:
                    try:
                        execute_terraform()
                        os.chdir(cwd)
                    except Exception:
                        sys.exit(1)
            break
        else:
            print_help_text()
            return
        

if __name__ == "__main__":
    main()