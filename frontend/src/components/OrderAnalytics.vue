<template>
  <div class="order-analytics">
    <div class="container">
      <div class="analytics-header mb-4">
        <h2>Business Analytics Dashboard</h2>
        <p class="text-muted">Understand your margins, break-even points, and growth scenarios</p>
      </div>
      
      <!-- Active Order Context -->
      <div v-if="activeOrder" class="order-context card mb-4">
        <div class="card-header">
          <h3>Current Order Analysis</h3>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <div class="metric-card">
                <div class="metric-label">Order Name</div>
                <div class="metric-value">{{ activeOrder.name }}</div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="metric-card">
                <div class="metric-label">Total Items</div>
                <div class="metric-value">{{ orderItemCount }}</div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="metric-card">
                <div class="metric-label">Avg. Retail Price</div>
                <div class="metric-value">€{{ averageRetailPrice.toFixed(2) }}</div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="metric-card">
                <div class="metric-label">Profit per Unit</div>
                <div class="metric-value" :class="getProfitClass(profitPerUnit)">
                  €{{ profitPerUnit.toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- No Active Order State -->
      <div v-else class="no-order-state card text-center p-4 mb-4">
        <h3>No Active Order</h3>
        <p class="text-muted mb-3">Please select an active order to view analytics</p>
        <router-link to="/orders" class="btn">
          Go to Orders
        </router-link>
      </div>
      
      <!-- Margin Analysis -->
      <div v-if="activeOrder" class="margin-analysis card mb-4">
        <div class="card-header">
          <h3>Margin Analysis</h3>
        </div>
        <div class="card-body">
          <div class="margin-status" :class="getMarginStatusClass(marginAnalysis.category)">
            <div class="margin-main">
              <div class="margin-value">{{ retailMarginPercent.toFixed(1) }}%</div>
              <div class="margin-category">{{ marginAnalysis.category.toUpperCase() }}</div>
            </div>
            <div class="margin-recommendation">
              <strong>Recommendation:</strong> {{ marginAnalysis.recommendation }}
            </div>
          </div>
          
          <div class="margin-guide mt-4">
            <h5>Industry Benchmarks:</h5>
            <div class="benchmark-grid">
              <div class="benchmark-item excellent">
                <div class="benchmark-range">50%+</div>
                <div class="benchmark-label">Excellent</div>
              </div>
              <div class="benchmark-item good">
                <div class="benchmark-range">30-50%</div>
                <div class="benchmark-label">Good</div>
              </div>
              <div class="benchmark-item fair">
                <div class="benchmark-range">15-30%</div>
                <div class="benchmark-label">Fair</div>
              </div>
              <div class="benchmark-item poor">
                <div class="benchmark-range">0-15%</div>
                <div class="benchmark-label">Needs Work</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Business Settings -->
      <div class="business-settings card mb-4">
        <div class="card-header">
          <h3>Business Settings</h3>
          <button @click="showSettingsForm = !showSettingsForm" class="btn btn-sm btn-secondary">
            {{ showSettingsForm ? 'Hide' : 'Edit' }} Settings
          </button>
        </div>
        <div class="card-body">
          <!-- Settings Display -->
          <div v-if="!showSettingsForm" class="settings-display">
            <div class="row">
              <div class="col-md-6">
                <div class="metric-card">
                  <div class="metric-label">Monthly Fixed Costs</div>
                  <div class="metric-value">€{{ settings.fixedCosts.toLocaleString() }}</div>
                  <div class="metric-sublabel">Rent, salaries, utilities</div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="metric-card">
                  <div class="metric-label">Launch Investment</div>
                  <div class="metric-value">€{{ settings.launchInvestment.toLocaleString() }}</div>
                  <div class="metric-sublabel">Setup costs, showroom</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Settings Form -->
          <div v-else class="settings-form">
            <form @submit.prevent="updateSettings">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="fixedCosts">Monthly Fixed Costs (€)</label>
                    <input 
                      id="fixedCosts"
                      v-model.number="formData.fixedCosts"
                      type="number"
                      class="form-control"
                      min="0"
                      step="100"
                      placeholder="e.g., 10000"
                    >
                    <small class="text-muted">Rent, salaries, utilities, etc.</small>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="launchInvestment">Launch Investment (€)</label>
                    <input 
                      id="launchInvestment"
                      v-model.number="formData.launchInvestment"
                      type="number"
                      class="form-control"
                      min="0"
                      step="1000"
                      placeholder="e.g., 25000"
                    >
                    <small class="text-muted">Setup costs, showroom, initial marketing</small>
                  </div>
                </div>
              </div>
              <div class="flex gap-2">
                <button type="submit" class="btn">Save Settings</button>
                <button type="button" @click="cancelForm" class="btn btn-secondary">Cancel</button>
                <button type="button" @click="resetSettings" class="btn btn-outline-danger">Reset</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Break-even Analysis -->
      <div v-if="activeOrder && settings.fixedCosts > 0" class="break-even-analysis card mb-4">
        <div class="card-header">
          <h3>Break-even Analysis</h3>
        </div>
        <div class="card-body">
          <div class="break-even-main">
            <div class="break-even-value">
              {{ breakEvenUnits === Infinity ? '∞' : breakEvenUnits.toLocaleString() }}
            </div>
            <div class="break-even-unit">units/month to break even</div>
            <div class="break-even-formula">
              Fixed Costs (€{{ settings.fixedCosts.toLocaleString() }}) ÷ Profit per Unit (€{{ profitPerUnit.toFixed(2) }})
            </div>
          </div>
        </div>
      </div>
      
      <!-- Growth Scenarios -->
      <div v-if="activeOrder && settings.fixedCosts > 0 && breakEvenUnits !== Infinity" class="growth-scenarios">
        <h3 class="mb-4">Growth Scenarios</h3>
        
        <div class="row">
          <div class="col-md-4">
            <div class="scenario-card scenario-1x">
              <div class="scenario-header">
                <h4>Break-even (1x)</h4>
                <div class="scenario-subtitle">{{ scenario1x.description }}</div>
              </div>
              <div class="scenario-metrics">
                <div class="scenario-metric">
                  <div class="metric-value">{{ scenario1x.units.toLocaleString() }}</div>
                  <div class="metric-label">units/month</div>
                </div>
                <div class="scenario-metric">
                  <div class="metric-value">€{{ scenario1x.revenue.toLocaleString() }}</div>
                  <div class="metric-label">revenue</div>
                </div>
                <div class="scenario-metric">
                  <div class="metric-value">€{{ scenario1x.totalProfit.toLocaleString() }}</div>
                  <div class="metric-label">profit</div>
                </div>
                <div class="scenario-metric">
                  <div class="metric-value">{{ scenario1x.unitsPerDay }}</div>
                  <div class="metric-label">units/day</div>
                </div>
              </div>
              <div v-if="settings.launchInvestment > 0" class="scenario-recovery">
                Recovery: {{ launchRecoveryAt1x === Infinity ? '∞' : launchRecoveryAt1x }} months
              </div>
            </div>
          </div>
          
          <div class="col-md-4">
            <div class="scenario-card scenario-2x">
              <div class="scenario-header">
                <h4>Growth (2x)</h4>
                <div class="scenario-subtitle">{{ scenario2x.description }}</div>
              </div>
              <div class="scenario-metrics">
                <div class="scenario-metric">
                  <div class="metric-value">{{ scenario2x.units.toLocaleString() }}</div>
                  <div class="metric-label">units/month</div>
                </div>
                <div class="scenario-metric">
                  <div class="metric-value">€{{ scenario2x.revenue.toLocaleString() }}</div>
                  <div class="metric-label">revenue</div>
                </div>
                <div class="scenario-metric">
                  <div class="metric-value">€{{ scenario2x.totalProfit.toLocaleString() }}</div>
                  <div class="metric-label">profit</div>
                </div>
                <div class="scenario-metric">
                  <div class="metric-value">{{ scenario2x.unitsPerDay }}</div>
                  <div class="metric-label">units/day</div>
                </div>
              </div>
              <div v-if="settings.launchInvestment > 0" class="scenario-recovery">
                Recovery: {{ launchRecoveryAt2x === Infinity ? '∞' : launchRecoveryAt2x }} months
              </div>
            </div>
          </div>
          
          <div class="col-md-4">
            <div class="scenario-card scenario-3x">
              <div class="scenario-header">
                <h4>Success (3x)</h4>
                <div class="scenario-subtitle">{{ scenario3x.description }}</div>
              </div>
              <div class="scenario-metrics">
                <div class="scenario-metric">
                  <div class="metric-value">{{ scenario3x.units.toLocaleString() }}</div>
                  <div class="metric-label">units/month</div>
                </div>
                <div class="scenario-metric">
                  <div class="metric-value">€{{ scenario3x.revenue.toLocaleString() }}</div>
                  <div class="metric-label">revenue</div>
                </div>
                <div class="scenario-metric">
                  <div class="metric-value">€{{ scenario3x.totalProfit.toLocaleString() }}</div>
                  <div class="metric-label">profit</div>
                </div>
                <div class="scenario-metric">
                  <div class="metric-value">{{ scenario3x.unitsPerDay }}</div>
                  <div class="metric-label">units/day</div>
                </div>
              </div>
              <div v-if="settings.launchInvestment > 0" class="scenario-recovery">
                Recovery: {{ launchRecoveryAt3x === Infinity ? '∞' : launchRecoveryAt3x }} months
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Cost Analysis -->
      <div v-if="activeOrder" class="cost-analysis card mt-4">
        <div class="card-header">
          <h3>Cost Breakdown</h3>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Amount</th>
                  <th>Explanation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Average Retail Price</td>
                  <td>€{{ averageRetailPrice.toFixed(2) }}</td>
                  <td>What you sell the product for</td>
                </tr>
                <tr>
                  <td>Average Landed Cost</td>
                  <td>€{{ averageLandedCost.toFixed(2) }}</td>
                  <td>Base cost + shipping + overhead</td>
                </tr>
                <tr>
                  <td>Profit per Unit</td>
                  <td class="profit-value" :class="getProfitClass(profitPerUnit)">
                    €{{ profitPerUnit.toFixed(2) }}
                  </td>
                  <td>Your profit before fixed costs</td>
                </tr>
                <tr>
                  <td>Retail Margin</td>
                  <td class="profit-value" :class="getMarginClass(retailMarginPercent)">
                    {{ retailMarginPercent.toFixed(1) }}%
                  </td>
                  <td>Profit as % of landed cost</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, reactive, onMounted } from 'vue'
import { useAnalyticsStore } from '@/stores/analytics'

export default {
  name: 'OrderAnalytics',
  setup() {
    const analyticsStore = useAnalyticsStore()
    const showSettingsForm = ref(false)
    
    // Form data
    const formData = reactive({
      fixedCosts: 0,
      launchInvestment: 0
    })
    
    // Load data on mount
    onMounted(() => {
      analyticsStore.loadFromStorage()
      Object.assign(formData, analyticsStore.settings)
    })
    
    // Computed properties from store
    const activeOrder = computed(() => analyticsStore.activeOrder)
    const settings = computed(() => analyticsStore.settings)
    const orderItemCount = computed(() => analyticsStore.orderItemCount)
    const averageRetailPrice = computed(() => analyticsStore.averageRetailPrice)
    const averageLandedCost = computed(() => analyticsStore.averageLandedCost)
    const profitPerUnit = computed(() => analyticsStore.profitPerUnit)
    const retailMarginPercent = computed(() => analyticsStore.retailMarginPercent)
    const breakEvenUnits = computed(() => analyticsStore.breakEvenUnits)
    const marginAnalysis = computed(() => analyticsStore.marginAnalysis)
    
    // Scenario projections
    const scenario1x = computed(() => analyticsStore.scenario1x)
    const scenario2x = computed(() => analyticsStore.scenario2x)
    const scenario3x = computed(() => analyticsStore.scenario3x)
    const launchRecoveryAt1x = computed(() => analyticsStore.launchRecoveryAt1x)
    const launchRecoveryAt2x = computed(() => analyticsStore.launchRecoveryAt2x)
    const launchRecoveryAt3x = computed(() => analyticsStore.launchRecoveryAt3x)
    
    
    // Methods
    const updateSettings = () => {
      analyticsStore.updateSettings(formData)
      showSettingsForm.value = false
    }
    
    const cancelForm = () => {
      Object.assign(formData, analyticsStore.settings)
      showSettingsForm.value = false
    }
    
    const resetSettings = () => {
      if (confirm('Are you sure you want to reset all settings?')) {
        analyticsStore.resetSettings()
        Object.assign(formData, analyticsStore.settings)
        showSettingsForm.value = false
      }
    }
    
    // Style helpers
    const getMarginStatusClass = (category) => {
      return `margin-${category}`
    }
    
    const getMarginClass = (margin) => {
      if (margin >= 30) return 'text-success'
      if (margin >= 15) return 'text-warning'
      return 'text-danger'
    }
    
    const getProfitClass = (profit) => {
      if (profit > 0) return 'text-success'
      if (profit === 0) return 'text-warning'
      return 'text-danger'
    }
    
    return {
      analyticsStore,
      showSettingsForm,
      formData,
      activeOrder,
      settings,
      orderItemCount,
      averageRetailPrice,
      averageLandedCost,
      profitPerUnit,
      retailMarginPercent,
      breakEvenUnits,
      marginAnalysis,
      scenario1x,
      scenario2x,
      scenario3x,
      launchRecoveryAt1x,
      launchRecoveryAt2x,
      launchRecoveryAt3x,
      updateSettings,
      cancelForm,
      resetSettings,
      getMarginStatusClass,
      getMarginClass,
      getProfitClass
    }
  }
}
</script>

<style scoped>
.order-analytics {
  padding: 1rem 0;
}

.analytics-header {
  text-align: center;
}

.analytics-header h2 {
  color: #007bff;
  margin-bottom: 0.5rem;
}

.order-context {
  background: #f8f9fa;
  border-left: 4px solid #007bff;
}

.metric-card {
  text-align: center;
  padding: 1rem;
  border-radius: 0.5rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.metric-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: #495057;
}

.metric-sublabel {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

/* Margin Analysis */
.margin-analysis {
  border-left: 4px solid #28a745;
}

.margin-status {
  padding: 2rem;
  border-radius: 0.75rem;
  text-align: center;
  margin-bottom: 2rem;
}

.margin-status.margin-excellent {
  background: #d4edda;
  border: 2px solid #28a745;
}

.margin-status.margin-good {
  background: #d1ecf1;
  border: 2px solid #17a2b8;
}

.margin-status.margin-fair {
  background: #fff3cd;
  border: 2px solid #ffc107;
}

.margin-status.margin-poor {
  background: #f8d7da;
  border: 2px solid #dc3545;
}

.margin-main {
  margin-bottom: 1rem;
}

.margin-value {
  font-size: 3rem;
  font-weight: bold;
  color: #495057;
}

.margin-category {
  font-size: 1.2rem;
  font-weight: 600;
  color: #6c757d;
  margin-top: 0.5rem;
}

.margin-recommendation {
  font-size: 1rem;
  color: #495057;
  line-height: 1.5;
}

.benchmark-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.benchmark-item {
  text-align: center;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 2px solid;
}

.benchmark-item.excellent {
  background: #d4edda;
  border-color: #28a745;
}

.benchmark-item.good {
  background: #d1ecf1;
  border-color: #17a2b8;
}

.benchmark-item.fair {
  background: #fff3cd;
  border-color: #ffc107;
}

.benchmark-item.poor {
  background: #f8d7da;
  border-color: #dc3545;
}

.benchmark-range {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.benchmark-label {
  font-size: 0.875rem;
  color: #6c757d;
}

/* Break-even Analysis */
.break-even-analysis {
  border-left: 4px solid #007bff;
}

.break-even-main {
  text-align: center;
  padding: 2rem;
}

.break-even-value {
  font-size: 3rem;
  font-weight: bold;
  color: #007bff;
}

.break-even-unit {
  font-size: 1.2rem;
  color: #6c757d;
  margin: 0.5rem 0 1rem 0;
}

.break-even-formula {
  font-size: 0.875rem;
  color: #495057;
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  display: inline-block;
}

/* Scenario Cards */
.growth-scenarios {
  margin-bottom: 2rem;
}

.scenario-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  border: 2px solid #e9ecef;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.scenario-card.scenario-1x {
  border-color: #6c757d;
  background: #f8f9fa;
}

.scenario-card.scenario-2x {
  border-color: #ffc107;
  background: #fff9e6;
}

.scenario-card.scenario-3x {
  border-color: #28a745;
  background: #f0f9f0;
}

.scenario-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.scenario-header h4 {
  margin: 0 0 0.5rem 0;
  color: #495057;
}

.scenario-subtitle {
  font-size: 0.875rem;
  color: #6c757d;
}

.scenario-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-grow: 1;
}

.scenario-metric {
  text-align: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 0.5rem;
}

.scenario-metric .metric-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #495057;
}

.scenario-metric .metric-label {
  font-size: 0.75rem;
  color: #6c757d;
}

.scenario-recovery {
  text-align: center;
  font-size: 0.875rem;
  color: #6c757d;
  background: rgba(255, 255, 255, 0.7);
  padding: 0.5rem;
  border-radius: 0.25rem;
}

.settings-form {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 0.5rem;
}

.profit-value {
  font-weight: bold;
}

.no-order-state {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
}

.table th {
  background: #f8f9fa;
  border-top: none;
  font-weight: 600;
}

.table td {
  vertical-align: middle;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 1rem 1.5rem;
}

.card-header h3 {
  margin: 0;
  color: #495057;
}

@media (max-width: 768px) {
  .scenario-metrics {
    grid-template-columns: 1fr;
  }
  
  .margin-value {
    font-size: 2.5rem;
  }
  
  .break-even-value {
    font-size: 2.5rem;
  }
  
  .benchmark-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .analytics-header {
    margin-bottom: 2rem;
  }
}
</style>