#!/usr/bin/env python3
"""Update the product browser HTML with new JSON data"""

import json
import sys
import argparse
from pathlib import Path


def update_html_with_json(html_path: str, json_path: str, output_path: str = None):
    """Update HTML file with JSON data"""
    
    # Read JSON data
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: JSON file '{json_path}' not found", file=sys.stderr)
        return False
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in '{json_path}': {e}", file=sys.stderr)
        return False
    
    # Read HTML template
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
    except FileNotFoundError:
        print(f"Error: HTML file '{html_path}' not found", file=sys.stderr)
        return False
    
    # Find and replace the JSON data using regex to handle existing data
    import re
    
    # Pattern to match the productData assignment, whether it's empty or has data
    pattern = r'(// JSON_DATA_PLACEHOLDER - This will be replaced by the Python script\s*\n\s*const productData = )([^;]*);'
    
    if not re.search(pattern, html_content):
        print("Error: JSON placeholder not found in HTML file", file=sys.stderr)
        return False
    
    # Create the JavaScript data assignment
    js_data = json.dumps(json_data, indent=8, ensure_ascii=False)
    
    # Replace the existing productData assignment
    updated_html = re.sub(pattern, rf'\1{js_data};', html_content)
    
    # Write updated HTML
    output_file = output_path or html_path
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(updated_html)
        print(f"Successfully updated '{output_file}' with data from '{json_path}'")
        print(f"Found {len(json_data)} products in the data")
        return True
    except Exception as e:
        print(f"Error writing output file: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description='Update product browser HTML with JSON data')
    parser.add_argument('json_file', help='Path to JSON file with product data')
    parser.add_argument('--html', default='product_browser.html', help='HTML template file (default: product_browser.html)')
    parser.add_argument('--output', '-o', help='Output HTML file (default: updates the template in place)')
    
    args = parser.parse_args()
    
    # Resolve paths
    html_path = Path(args.html).resolve()
    json_path = Path(args.json_file).resolve()
    output_path = Path(args.output).resolve() if args.output else None
    
    if not html_path.exists():
        print(f"Error: HTML template '{html_path}' not found", file=sys.stderr)
        sys.exit(1)
    
    if not json_path.exists():
        print(f"Error: JSON file '{json_path}' not found", file=sys.stderr)
        sys.exit(1)
    
    success = update_html_with_json(str(html_path), str(json_path), str(output_path) if output_path else None)
    
    if success:
        print(f"Open the updated HTML file in your browser to view the products!")
    else:
        sys.exit(1)


if __name__ == '__main__':
    main()