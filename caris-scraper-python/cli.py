#!/usr/bin/env python3
import sys
import json
import argparse
from pathlib import Path
from src.scraper_with_ai import CarisScraperWithAI
from src.types import ProductInput, ScraperConfig


def parse_arguments():
    parser = argparse.ArgumentParser(
        description='Scrape Caris furniture product data',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cli.py 822 820 633
  python cli.py --output results.json 822 820
  python cli.py --no-headless 822
        """
    )
    
    parser.add_argument('product_ids', nargs='+', help='Product IDs to scrape')
    parser.add_argument('--headless', action='store_true', default=True, 
                       help='Run browser in headless mode (default)')
    parser.add_argument('--no-headless', action='store_false', dest='headless',
                       help='Run browser with visible window')
    parser.add_argument('--output', '-o', help='Output file path (default: stdout)')
    
    return parser.parse_args()


def main():
    args = parse_arguments()
    
    product_inputs = [ProductInput(product_id=pid) for pid in args.product_ids]
    
    config = ScraperConfig(headless=args.headless)
    scraper = CarisScraperWithAI(config)
    
    try:
        print("Initializing scraper...", file=sys.stderr)
        scraper.init()
        
        print(f"Scraping {len(product_inputs)} products...", file=sys.stderr)
        results = scraper.scrape_products_with_ai(product_inputs)
        
        # Convert dataclasses to dict for JSON serialization
        results_dict = []
        for product in results:
            product_dict = {
                'productId': product.product_id,
                'url': product.url,
                'productName': product.product_name,
                'images': product.images,
                'dimensionsImage': product.dimensions_image,
                'error': product.error
            }
            
            if product.dimensions:
                product_dict['dimensions'] = {
                    'width': product.dimensions.width,
                    'height': product.dimensions.height,
                    'floor_to_chair_height_cm': product.dimensions.floor_to_chair_height_cm,
                    'depth': product.dimensions.depth,
                    'weight': product.dimensions.weight,
                    'boxWidth': product.dimensions.box_width,
                    'boxHeight': product.dimensions.box_height,
                    'boxDepth': product.dimensions.box_depth,
                    'qtyPerBox': product.dimensions.qty_per_box,
                    'rawText': product.dimensions.raw_text
                }
            
            results_dict.append(product_dict)
        
        output = json.dumps(results_dict, indent=2)
        
        if args.output:
            with open(args.output, 'w') as f:
                f.write(output)
            print(f"Results saved to {args.output}", file=sys.stderr)
        else:
            print(output)
            
    except Exception as e:
        print(f"Error during scraping: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        scraper.close()


if __name__ == '__main__':
    main()