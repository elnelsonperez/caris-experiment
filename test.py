
import subprocess
import os
import sys

image_path = "/Users/nelsonperez/code/puppeteertest/caris-scraper/storage/dimensions-1752091904711.png"

prompt = f"""
Analyze this furniture dimensions image and extract width, height, depth, weight, and box
dimensions. Return ONLY the json object, nothing else.

Input image path:
{image_path}

Example Response:
{{"width_cm": 60,"height_cm": 84,"floor_to_chair_height_cm": 44,"depth_cm": 64,"weight_kg": 10.5,"box_width_cm": 60, "box_height_cm": 84, "box_depth_cm": 64}}
"""

def run_with_run():
    print("\n--- Running with subprocess.run() ---")
    try:
        result = subprocess.run(
            ['claude', '--allowedTools', 'Read', '-p', prompt],
            capture_output=True,
            text=True,
            timeout=30  # avoid hanging forever
        )
        print("stdout:", result.stdout)
        print("stderr:", result.stderr)
        print("returncode:", result.returncode)
    except subprocess.TimeoutExpired:
        print("Timed out.")
    except Exception as e:
        print("Error:", e)

def run_with_popen():
    print("\n--- Running with subprocess.Popen() ---")
    try:
        process = subprocess.Popen(
            ['claude', '--allowedTools', 'Read', '-p', prompt],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        stdout, stderr = process.communicate(timeout=30)
        print("stdout:", stdout)
        print("stderr:", stderr)
        print("returncode:", process.returncode)

    except subprocess.TimeoutExpired:
        process.kill()
        print("Timed out.")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    # Comment/uncomment to test either
    run_with_run()
    # run_with_popen()
