import subprocess
import json
import time
import requests
from pathlib import Path
from .types import ProductDimensions


class ClaudeImageParser:
    def __init__(self):
        self.storage_dir = Path(__file__).parent.parent / "storage"
        self.storage_dir.mkdir(exist_ok=True)
    
    def parse_dimensions_image(self, image_url: str) -> ProductDimensions:
        try:
            image_path = self._download_image(image_url)
            response = self._call_claude_cli(image_path)
            
            try:
                parsed_data = json.loads(response.strip())
                return ProductDimensions(
                    width=parsed_data.get("width_cm"),
                    height=parsed_data.get("height_cm"),
                    floor_to_chair_height_cm=parsed_data.get("floor_to_chair_height_cm"),
                    depth=parsed_data.get("depth_cm"),
                    qty_per_box=parsed_data.get("qty_per_box"),
                    weight=parsed_data.get("weight_kg"),
                    box_width=parsed_data.get("box_width_cm"),
                    box_height=parsed_data.get("box_height_cm"),
                    box_depth=parsed_data.get("box_depth_cm"),
                    raw_text=response.strip()
                )
            except json.JSONDecodeError:
                return ProductDimensions(raw_text=response.strip())
                
        except Exception as e:
            return ProductDimensions(raw_text=f"Error parsing image: {str(e)}")
    
    def _download_image(self, image_url: str) -> str:
        filename = f"dimensions-{int(time.time() * 1000)}.png"
        filepath = self.storage_dir / filename
        
        try:
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            return str(filepath)
            
        except Exception as e:
            raise Exception(f"Failed to download image: {str(e)}")
    
    def _call_claude_cli(self, image_path: str) -> str:
        prompt = f"""
Analyze this furniture dimensions image and extract width, height, depth, weight, and box
dimensions, including quantity per box.

Image path: {image_path}

Example Response:
{{"width_cm": 65,"height_cm": 80,"floor_to_chair_height_cm": 40,"depth_cm": 60,"weight_kg": 10.5,"box_width_cm": 55, "box_height_cm": 84, "box_depth_cm": 64, "qty_per_box": 1}}

FORBIDDEN TO RETURN ANYTHING OTHER THAN A JSON OBJECT. NO MARKDOWN, NO TEXT, NO EXPLANATIONS.
"""
        
        try:
            cmd = ['claude', '--allowedTools', 'Read', '-p', prompt]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=15,
                check=False
            )
            
            if result.stderr:
                print(f"Claude CLI stderr: {result.stderr}")
            
            return result.stdout.strip() or 'No response received'
            
        except subprocess.TimeoutExpired:
            raise Exception("Claude CLI timed out")
        except Exception as e:
            raise Exception(f"Error calling Claude CLI: {str(e)}")