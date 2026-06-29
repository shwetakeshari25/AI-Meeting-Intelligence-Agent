import subprocess
import time
import os
import sys
import re

def kill_process_on_port(port):
    print(f"Scanning for active processes on port {port}...")
    try:
        # Run netstat to find LISTENING ports on Windows
        output = subprocess.run(["netstat", "-ano"], capture_output=True, text=True, shell=True)
        pids = set()
        
        # Capture PID
        pattern = re.compile(rf":{port}\s+.*?\s+LISTENING\s+(\d+)")
        for line in output.stdout.splitlines():
            match = pattern.search(line)
            if match:
                pid = match.group(1)
                pids.add(pid)
                
        for pid in pids:
            print(f"  Port {port} is occupied by PID {pid}. Terminating process...")
            subprocess.run(["taskkill", "/F", "/PID", pid], capture_output=True, shell=True)
    except Exception as e:
        print(f"  Error freeing port {port}: {e}")

def main():
    # Detect directories
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")
    
    # 1. Clean ports
    kill_process_on_port(5001)
    kill_process_on_port(5173)
    time.sleep(1)
    
    print("\n[STARTING] Backend Express Server (port 5001)...")
    backend_log = open(os.path.join(root_dir, "backend_server.log"), "w", encoding="utf-8")
    backend_proc = subprocess.Popen(
        ["node", "server.js"],
        cwd=backend_dir,
        stdout=backend_log,
        stderr=backend_log,
        shell=True
    )
    
    print("[STARTING] Frontend Vite Dev Server (port 5173)...")
    frontend_log = open(os.path.join(root_dir, "frontend_client.log"), "w", encoding="utf-8")
    frontend_proc = subprocess.Popen(
        ["npm.cmd", "run", "dev"],
        cwd=frontend_dir,
        stdout=frontend_log,
        stderr=frontend_log,
        shell=True
    )
    
    print("\n=======================================================")
    print("  AI MEETING RUNNER - APP BOOTED SUCCESSFULLY")
    print("  ---------------------------------------------")
    print("  1. Backend running on : http://localhost:5001")
    print("  2. Frontend running on : http://localhost:5173")
    print("  ---------------------------------------------")
    print("  --> Open http://localhost:5173 in your browser!")
    print("=======================================================\n")
    print("Monitoring outputs... Press Ctrl+C to terminate both servers.")
    
    try:
        while True:
            back_status = backend_proc.poll()
            front_status = frontend_proc.poll()
            
            if back_status is not None:
                print(f"WARNING: Backend process exited (code {back_status}). Checking backend_server.log...")
            if front_status is not None:
                print(f"WARNING: Frontend process exited (code {front_status}). Checking frontend_client.log...")
                
            time.sleep(3)
    except KeyboardInterrupt:
        print("\nStopping servers...")
    finally:
        # Shutdown
        try:
            backend_proc.terminate()
            backend_proc.wait(timeout=2)
        except:
            pass
        try:
            frontend_proc.terminate()
            frontend_proc.wait(timeout=2)
        except:
            pass
            
        backend_log.close()
        frontend_log.close()
        print("Shutdown complete. Ports are cleared.")

if __name__ == "__main__":
    main()
