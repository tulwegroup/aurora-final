"""
Aurora OSI Background Worker

Later:
- Long-running physics inversions
- Multi-agent validation
- Batch planetary scans
"""

import time

def run_worker():
    while True:
        print("Aurora worker idle...")
        time.sleep(60)

if __name__ == "__main__":
    run_worker()
