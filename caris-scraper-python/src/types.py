from dataclasses import dataclass
from typing import Optional, List


@dataclass
class ProductInput:
    product_id: str


@dataclass
class ProductDimensions:
    width: Optional[str] = None
    height: Optional[str] = None
    floor_to_chair_height_cm: Optional[str] = None
    depth: Optional[str] = None
    weight: Optional[str] = None
    box_width: Optional[str] = None
    box_height: Optional[str] = None
    box_depth: Optional[str] = None
    qty_per_box: Optional[str] = None
    raw_text: Optional[str] = None


@dataclass
class ProductData:
    product_id: str
    url: str
    product_name: str
    images: List[str]
    dimensions_image: Optional[str] = None
    dimensions: Optional[ProductDimensions] = None
    error: Optional[str] = None


@dataclass
class ScraperConfig:
    base_url: str = "https://www.caris.com.tr/index.php?route=product/product&path=38&product_id="
    headless: bool = True
    timeout: int = 30000


@dataclass
class ScraperResult:
    success: bool
    data: List[ProductData]
    errors: List[str]