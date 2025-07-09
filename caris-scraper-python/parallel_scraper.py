#!/usr/bin/env python3
"""Parallel wrapper for scraping multiple products"""

import subprocess
import json
import sys
import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path


def scrape_single_product(product_id: str, headless: bool = True) -> dict:
    """Scrape a single product using the CLI"""
    cmd = ['uv', 'run', 'python', 'cli.py']
    
    if headless:
        cmd.append('--headless')
    else:
        cmd.append('--no-headless')
    
    cmd.append(product_id)
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,
            cwd=Path(__file__).parent
        )
        
        if result.returncode == 0:
            # Parse JSON output
            data = json.loads(result.stdout)
            return data[0] if data else {"error": "No data returned"}
        else:
            return {"error": f"CLI failed: {result.stderr}"}
            
    except subprocess.TimeoutExpired:
        return {"error": "Timeout scraping product"}
    except json.JSONDecodeError:
        return {"error": "Invalid JSON response"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}


def main():
    parser = argparse.ArgumentParser(description='Parallel Caris scraper')
    parser.add_argument('product_ids', nargs='+', help='Product IDs to scrape')
    parser.add_argument('--workers', '-w', type=int, default=4, help='Number of parallel workers (default: 4)')
    parser.add_argument('--no-headless', action='store_true', help='Run with visible browser')
    parser.add_argument('--output', '-o', required=True, help='Output JSON file path to save combined results')
    
    args = parser.parse_args()
    
    print(f"Scraping {len(args.product_ids)} products with {args.workers} workers...", file=sys.stderr)
    
    results = []
    headless = not args.no_headless
    
    with ProcessPoolExecutor(max_workers=args.workers) as executor:
        # Submit all tasks
        future_to_product = {
            executor.submit(scrape_single_product, product_id, headless): product_id 
            for product_id in args.product_ids
        }
        
        # Collect results as they complete
        for future in as_completed(future_to_product):
            product_id = future_to_product[future]
            try:
                result = future.result()
                results.append(result)
                print(f"Completed: {product_id}", file=sys.stderr)
            except Exception as e:
                error_result = {
                    "productId": product_id,
                    "error": f"Process error: {str(e)}"
                }
                results.append(error_result)
                print(f"Failed: {product_id} - {str(e)}", file=sys.stderr)
    
    # Save combined results to JSON file
    output = json.dumps(results, indent=2)
    
    with open(args.output, 'w') as f:
        f.write(output)
    
    print(f"Combined results saved to {args.output}", file=sys.stderr)
    print(f"Successfully scraped {len([r for r in results if 'error' not in r])} out of {len(results)} products", file=sys.stderr)


if __name__ == '__main__':
    main()