from typing import List
from .scraper import CarisScraper
from .claude_parser import ClaudeImageParser
from .types import ProductInput, ProductData, ScraperConfig


class CarisScraperWithAI(CarisScraper):
    def __init__(self, config: ScraperConfig = None):
        super().__init__(config)
        self.claude_parser = ClaudeImageParser()
    
    def scrape_products_with_ai(self, product_inputs: List[ProductInput]) -> List[ProductData]:
        result = self.scrape_products(product_inputs)
        
        # Parse dimensions images with Claude AI
        for product in result.data:
            if product.dimensions_image and not product.error:
                try:
                    product.dimensions = self.claude_parser.parse_dimensions_image(product.dimensions_image)
                except Exception as e:
                    print(f"Error parsing dimensions for product {product.product_id}: {e}")
        
        return result.data