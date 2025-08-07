const fs = require('fs').promises;
const path = require('path');

class ProductConsolidator {
  constructor(inputDir = './output', outputPath = './consolidated-products.json') {
    this.inputDir = inputDir;
    this.outputPath = outputPath;
  }

  async readJsonFiles() {
    try {
      const files = await fs.readdir(this.inputDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      console.log(`Found ${jsonFiles.length} JSON files to process`);
      
      const categoryData = [];
      
      for (const file of jsonFiles) {
        const filePath = path.join(this.inputDir, file);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          
          if (data.category_name && data.product_ids && Array.isArray(data.product_ids)) {
            categoryData.push({
              category: data.category_name,
              products: data.product_ids,
              file: file
            });
            console.log(`✓ Processed ${file}: ${data.category_name} (${data.product_ids.length} products)`);
          } else {
            console.warn(`⚠ Skipping ${file}: Invalid structure`);
          }
        } catch (error) {
          console.error(`✗ Error reading ${file}:`, error.message);
        }
      }
      
      return categoryData;
    } catch (error) {
      throw new Error(`Error reading directory ${this.inputDir}: ${error.message}`);
    }
  }

  consolidateProducts(categoryData) {
    const productMap = new Map();
    const categoryStats = {};
    
    // Build the product to categories mapping
    categoryData.forEach(({ category, products }) => {
      categoryStats[category] = products.length;
      
      products.forEach(productId => {
        if (!productMap.has(productId)) {
          productMap.set(productId, new Set());
        }
        productMap.get(productId).add(category);
      });
    });
    
    // Convert to final format
    const consolidatedProducts = {};
    
    for (const [productId, categoriesSet] of productMap) {
      consolidatedProducts[productId] = Array.from(categoriesSet).sort();
    }
    
    // Generate statistics
    const stats = {
      total_products: productMap.size,
      total_categories: categoryData.length,
      category_product_counts: categoryStats,
      products_in_multiple_categories: 0,
      max_categories_per_product: 0
    };
    
    // Calculate cross-category statistics
    for (const categories of Object.values(consolidatedProducts)) {
      if (categories.length > 1) {
        stats.products_in_multiple_categories++;
      }
      stats.max_categories_per_product = Math.max(stats.max_categories_per_product, categories.length);
    }
    
    return {
      products: consolidatedProducts,
      statistics: stats
    };
  }

  async saveConsolidatedData(consolidatedData) {
    try {
      const output = {
        ...consolidatedData,
        generated_at: new Date().toISOString(),
        description: "Consolidated product-to-categories mapping from Caris scraper"
      };
      
      await fs.writeFile(this.outputPath, JSON.stringify(output, null, 2));
      console.log(`\n📁 Consolidated data saved to: ${this.outputPath}`);
      
      return this.outputPath;
    } catch (error) {
      throw new Error(`Error saving consolidated data: ${error.message}`);
    }
  }

  printStatistics(stats) {
    console.log('\n📊 Consolidation Statistics:');
    console.log(`├─ Total unique products: ${stats.total_products}`);
    console.log(`├─ Total categories: ${stats.total_categories}`);
    console.log(`├─ Products in multiple categories: ${stats.products_in_multiple_categories}`);
    console.log(`└─ Max categories per product: ${stats.max_categories_per_product}`);
    
    console.log('\n📈 Products per category:');
    Object.entries(stats.category_product_counts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`├─ ${category}: ${count} products`);
      });
  }

  async consolidate() {
    try {
      console.log(`🔍 Reading JSON files from: ${this.inputDir}`);
      const categoryData = await this.readJsonFiles();
      
      if (categoryData.length === 0) {
        throw new Error('No valid category JSON files found');
      }
      
      console.log('\n🔄 Consolidating product data...');
      const consolidatedData = this.consolidateProducts(categoryData);
      
      this.printStatistics(consolidatedData.statistics);
      
      const outputPath = await this.saveConsolidatedData(consolidatedData);
      
      return {
        success: true,
        outputPath,
        statistics: consolidatedData.statistics
      };
    } catch (error) {
      console.error('\n❌ Consolidation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  
  let inputDir = './output';
  let outputPath = './consolidated-products.json';
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' || args[i] === '-i') {
      inputDir = args[i + 1];
      i++;
    } else if (args[i] === '--output' || args[i] === '-o') {
      outputPath = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log('Usage: node consolidate-products.js [options]');
      console.log('');
      console.log('Options:');
      console.log('  -i, --input <dir>    Input directory containing JSON files (default: ./output)');
      console.log('  -o, --output <file>  Output file path (default: ./consolidated-products.json)');
      console.log('  -h, --help          Show this help message');
      console.log('');
      console.log('Example:');
      console.log('  node consolidate-products.js --input ./categories/output --output ./products.json');
      process.exit(0);
    }
  }
  
  const consolidator = new ProductConsolidator(inputDir, outputPath);
  const result = await consolidator.consolidate();
  
  if (result.success) {
    console.log('\n✅ Consolidation completed successfully!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Export for use as module
module.exports = ProductConsolidator;

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}