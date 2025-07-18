<template>
  <div class="order-analytics">
    <div class="container">
      <div class="analytics-header mb-4">
        <h2>Order Analytics Dashboard</h2>
        <p class="text-muted">Analyze profitability, break-even points, and revenue targets for your active order</p>
      </div>
      
      <!-- Active Order Context -->
      <div v-if="activeOrder" class="order-context card mb-4">
        <div class="card-header">
          <h3>Active Order Context</h3>
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
                <div class="metric-label">Retail Margin</div>
                <div class="metric-value" :class="getMarginClass(retailMarginPercent)">
                  {{ retailMarginPercent.toFixed(1) }}%
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
              <div class="col-md-3">
                <div class="metric-card">
                  <div class="metric-label">Fixed Costs</div>
                  <div class="metric-value">€{{ settings.fixedCosts.toLocaleString() }}/month</div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="metric-card">
                  <div class="metric-label">Target Revenue</div>
                  <div class="metric-value">€{{ settings.targetRevenue.toLocaleString() }}/month</div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="metric-card">
                  <div class="metric-label">Launch Investment</div>
                  <div class="metric-value">€{{ settings.launchInvestment.toLocaleString() }}</div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="metric-card">
                  <div class="metric-label">Recovery Period</div>
                  <div class="metric-value">{{ settings.recoveryPeriod }} months</div>
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
                    <label for="targetRevenue">Monthly Target Revenue (€)</label>
                    <input 
                      id="targetRevenue"
                      v-model.number="formData.targetRevenue"
                      type="number"
                      class="form-control"
                      min="0"
                      step="1000"
                      placeholder="e.g., 50000"
                    >
                    <small class="text-muted">Your monthly revenue goal</small>
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
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="recoveryPeriod">Recovery Period (months)</label>
                    <input 
                      id="recoveryPeriod"
                      v-model.number="formData.recoveryPeriod"
                      type="number"
                      class="form-control"
                      min="1"
                      max="60"
                      placeholder="e.g., 12"
                    >
                    <small class="text-muted">Time to recover launch investment</small>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="expectedVolume">Expected Volume (units)</label>
                    <input 
                      id="expectedVolume"
                      v-model.number="formData.expectedVolume"
                      type="number"
                      class="form-control"
                      min="0"
                      step="10"
                      placeholder="e.g., 1000"
                    >
                    <small class="text-muted">Total units expected during recovery period</small>
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
      
      <!-- Key Metrics -->
      <div v-if="activeOrder" class="key-metrics mb-4">
        <div class="row">
          <div class="col-md-4">
            <div class="metric-card-large" :class="getStatusClass(isBreakEvenAchievable)">
              <div class="metric-header">
                <h4>Break-even Analysis</h4>
                <div class="metric-info" :title="explanations.breakEven.meaning">ℹ️</div>
              </div>
              <div class="metric-main">
                <div class="metric-value-large">
                  {{ breakEvenUnits === Infinity ? '∞' : breakEvenUnits.toLocaleString() }}
                </div>
                <div class="metric-unit">units/month</div>
              </div>
              <div class="metric-formula">
                {{ explanations.breakEven.formula }}
              </div>
              <div class="metric-explanation">
                {{ explanations.breakEven.meaning }}
              </div>
            </div>
          </div>
          
          <div class="col-md-4">
            <div class="metric-card-large" :class="getStatusClass(isTargetRealistic)">
              <div class="metric-header">
                <h4>Target Analysis</h4>
                <div class="metric-info" :title="explanations.targetUnits.meaning">ℹ️</div>
              </div>
              <div class="metric-main">
                <div class="metric-value-large">{{ targetUnits.toLocaleString() }}</div>
                <div class="metric-unit">units/month</div>
              </div>
              <div class="metric-formula">
                {{ explanations.targetUnits.formula }}
              </div>
              <div class="metric-explanation">
                {{ explanations.targetUnits.meaning }}
              </div>
            </div>
          </div>
          
          <div class="col-md-4">
            <div class="metric-card-large" :class="getStatusClass(isLaunchRecoverable)">
              <div class="metric-header">
                <h4>Launch Recovery</h4>
                <div class="metric-info" :title="explanations.launchRecovery.meaning">ℹ️</div>
              </div>
              <div class="metric-main">
                <div class="metric-value-large">
                  {{ timeToBreakEven === Infinity ? '∞' : timeToBreakEven }}
                </div>
                <div class="metric-unit">months</div>
              </div>
              <div class="metric-formula">
                {{ explanations.launchRecovery.formula }}
              </div>
              <div class="metric-explanation">
                {{ explanations.launchRecovery.meaning }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Detailed Analysis Table -->
      <div v-if="activeOrder" class="detailed-analysis card">
        <div class="card-header">
          <h3>Detailed Analysis</h3>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Explanation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Average Retail Price</td>
                  <td>€{{ averageRetailPrice.toFixed(2) }}</td>
                  <td>Calculated from active order items</td>
                </tr>
                <tr>
                  <td>Average Landed Cost</td>
                  <td>€{{ averageLandedCost.toFixed(2) }}</td>
                  <td>Base cost + proportional overhead</td>
                </tr>
                <tr>
                  <td>Profit per Unit</td>
                  <td class="profit-value" :class="getProfitClass(profitPerUnit)">
                    €{{ profitPerUnit.toFixed(2) }}
                  </td>
                  <td>Retail price minus landed cost</td>
                </tr>
                <tr>
                  <td>Launch Cost per Unit</td>
                  <td>€{{ launchCostPerUnit.toFixed(2) }}</td>
                  <td>Launch investment ÷ expected volume</td>
                </tr>
                <tr>
                  <td>True Profit per Unit</td>
                  <td class="profit-value" :class="getProfitClass(trueProfitPerUnit)">
                    €{{ trueProfitPerUnit.toFixed(2) }}
                  </td>
                  <td>Profit after launch cost amortization</td>
                </tr>
                <tr>
                  <td>Units per Week</td>
                  <td>{{ unitsPerWeek }}</td>
                  <td>Target units ÷ 4.33 weeks</td>
                </tr>
                <tr>
                  <td>Units per Day</td>
                  <td>{{ unitsPerDay }}</td>
                  <td>Target units ÷ 30 days</td>
                </tr>
                <tr>
                  <td>Monthly Profit</td>
                  <td class="profit-value" :class="getProfitClass(monthlyProfit)">
                    €{{ monthlyProfit.toFixed(2) }}
                  </td>
                  <td>Target units × profit per unit - fixed costs</td>
                </tr>
                <tr>
                  <td>Monthly ROI</td>
                  <td class="profit-value" :class="getProfitClass(roi)">
                    {{ roi.toFixed(1) }}%
                  </td>
                  <td>Monthly true profit ÷ launch investment</td>
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
      targetRevenue: 0,
      launchInvestment: 0,
      recoveryPeriod: 12,
      expectedVolume: 0
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
    const launchCostPerUnit = computed(() => analyticsStore.launchCostPerUnit)
    const trueProfitPerUnit = computed(() => analyticsStore.trueProfitPerUnit)
    const breakEvenUnits = computed(() => analyticsStore.breakEvenUnits)
    const targetUnits = computed(() => analyticsStore.targetUnits)
    const unitsPerWeek = computed(() => analyticsStore.unitsPerWeek)
    const unitsPerDay = computed(() => analyticsStore.unitsPerDay)
    const monthlyProfit = computed(() => analyticsStore.monthlyProfit)
    const timeToBreakEven = computed(() => analyticsStore.timeToBreakEven)
    const roi = computed(() => analyticsStore.roi)
    
    // Status indicators
    const isBreakEvenAchievable = computed(() => analyticsStore.isBreakEvenAchievable)
    const isTargetRealistic = computed(() => analyticsStore.isTargetRealistic)
    const isLaunchRecoverable = computed(() => analyticsStore.isLaunchRecoverable)
    
    // Explanations
    const explanations = {
      breakEven: {
        title: "Break-even Analysis",
        formula: "Fixed Costs ÷ Profit per Unit",
        meaning: "Units you must sell to cover fixed expenses before making profit"
      },
      targetUnits: {
        title: "Target Analysis",
        formula: "Target Revenue ÷ Average Retail Price",
        meaning: "Units needed to achieve your monthly revenue target"
      },
      launchRecovery: {
        title: "Launch Recovery",
        formula: "Launch Investment ÷ (True Profit per Unit × Target Units)",
        meaning: "Months needed to recover your launch investment"
      }
    }
    
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
    const getStatusClass = (isPositive) => {
      return isPositive ? 'status-positive' : 'status-negative'
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
      launchCostPerUnit,
      trueProfitPerUnit,
      breakEvenUnits,
      targetUnits,
      unitsPerWeek,
      unitsPerDay,
      monthlyProfit,
      timeToBreakEven,
      roi,
      isBreakEvenAchievable,
      isTargetRealistic,
      isLaunchRecoverable,
      explanations,
      updateSettings,
      cancelForm,
      resetSettings,
      getStatusClass,
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

.metric-card-large {
  padding: 1.5rem;
  border-radius: 0.75rem;
  background: white;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
  border: 2px solid #e9ecef;
}

.metric-card-large.status-positive {
  border-color: #28a745;
  background: #f8fff9;
}

.metric-card-large.status-negative {
  border-color: #dc3545;
  background: #fff8f8;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.metric-header h4 {
  margin: 0;
  color: #495057;
}

.metric-info {
  font-size: 1.2rem;
  cursor: help;
  color: #6c757d;
}

.metric-main {
  text-align: center;
  margin-bottom: 1rem;
}

.metric-value-large {
  font-size: 2.5rem;
  font-weight: bold;
  color: #007bff;
}

.metric-unit {
  font-size: 0.875rem;
  color: #6c757d;
}

.metric-formula {
  font-size: 0.75rem;
  color: #007bff;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.metric-explanation {
  font-size: 0.875rem;
  color: #6c757d;
  line-height: 1.4;
}

.settings-display .row {
  gap: 1rem;
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
  .metric-card-large {
    margin-bottom: 1rem;
  }
  
  .metric-value-large {
    font-size: 2rem;
  }
  
  .analytics-header {
    margin-bottom: 2rem;
  }
}
</style>