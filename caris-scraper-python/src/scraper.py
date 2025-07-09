from playwright.sync_api import sync_playwright, Browser, Page
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from .types import ProductInput, ProductData, ScraperConfig, ScraperResult


class CarisScraper:
    def __init__(self, config: Optional[ScraperConfig] = None):
        self.config = config or ScraperConfig()
        self.browser: Optional[Browser] = None
        self.playwright = None
    
    def init(self):
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=self.config.headless,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
    
    def close(self):
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
    
    def scrape_products(self, product_inputs: List[ProductInput]) -> ScraperResult:
        if not self.browser:
            raise Exception("Browser not initialized. Call init() first.")
        
        results = []
        errors = []
        
        for product_input in product_inputs:
            try:
                product_data = self._scrape_product(product_input.product_id)
                results.append(product_data)
            except Exception as e:
                error_message = f"Error scraping product {product_input.product_id}: {str(e)}"
                errors.append(error_message)
                
                results.append(ProductData(
                    product_id=product_input.product_id,
                    url=self.config.base_url + product_input.product_id,
                    product_name='',
                    images=[],
                    error=error_message
                ))
        
        return ScraperResult(
            success=len(errors) == 0,
            data=results,
            errors=errors
        )
    
    def _scrape_product(self, product_id: str) -> ProductData:
        if not self.browser:
            raise Exception("Browser not initialized")
        
        page = self.browser.new_page()
        url = self.config.base_url + product_id
        
        try:
            page.goto(url, wait_until='networkidle', timeout=self.config.timeout)
            
            # Extract product name
            product_name = page.evaluate("""
                () => {
                    const h1 = document.querySelector('h1');
                    return h1?.textContent?.trim() || '';
                }
            """)
            
            # Extract images
            images = page.evaluate("""
                () => {
                    const productImages = Array.from(document.querySelectorAll('img'))
                        .filter(img => img.src.includes('catalog/uruns/') && img.src.includes('550x550'))
                        .map(img => img.src.replace('550x550', '1000x1000'));
                    
                    return [...new Set(productImages)];
                }
            """)
            
            # Extract dimensions image
            dimensions_image = page.evaluate("""
                () => {
                    const dimensionsImg = document.querySelector('img.olcthumb');
                    return dimensionsImg ? dimensionsImg.src : undefined;
                }
            """)
            
            return ProductData(
                product_id=product_id,
                url=url,
                product_name=product_name,
                images=images,
                dimensions_image=dimensions_image
            )
            
        finally:
            page.close()