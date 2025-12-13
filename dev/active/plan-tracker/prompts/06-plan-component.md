# Feature: plan-component - Plan Tracker Vue Component

## Context

The viewer uses Vue 3 components defined inline in `index.html`. We need to add a `plan-tracker-view` component and integrate it into the tab system.

## Objective

Add the plan-tracker-view Vue component to index.html with full functionality.

## Constraints

- Reference: See constraints.md for global rules
- Follow existing component patterns
- Use SSE for real-time updates
- Support expanding/collapsing plan details

## Files to Create/Modify

- `.claude/hooks/viewer/index.html` - Add component and tab

## Implementation Details

1. Add "Plans" to the tabs array in the main app:

```javascript
const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'logs', label: 'Hook Log' },
  { id: 'plans', label: 'Plans' },  // Add this
];
```

2. Add template slot for plans tab:

```html
<template #plans>
  <plan-tracker-view
    :plans="plans"
    :loading="plansLoading"
  ></plan-tracker-view>
</template>
```

3. Add state for plans in the main app setup():

```javascript
// Plans state
const plans = ref([]);
const plansLoading = ref(false);
let planEventSource = null;

// Fetch plans
async function fetchPlans() {
  try {
    plansLoading.value = plans.value.length === 0;
    const res = await fetch('/api/plans');
    if (res.ok) {
      const data = await res.json();
      plans.value = data.plans;
    }
  } catch (err) {
    console.error('Failed to fetch plans:', err);
  } finally {
    plansLoading.value = false;
  }
}

// Connect to plan SSE
function connectPlansSSE() {
  if (planEventSource) {
    planEventSource.close();
  }

  planEventSource = new EventSource('/events/plans');

  planEventSource.addEventListener('plans', (event) => {
    try {
      plans.value = JSON.parse(event.data);
    } catch (err) {
      console.error('Failed to parse plans:', err);
    }
  });

  planEventSource.addEventListener('plan_update', (event) => {
    try {
      const update = JSON.parse(event.data);
      const index = plans.value.findIndex(p => p.name === update.plan.name);
      if (index >= 0) {
        plans.value[index] = update.plan;
      } else {
        plans.value.unshift(update.plan);
      }
    } catch (err) {
      console.error('Failed to parse plan update:', err);
    }
  });

  planEventSource.onerror = () => {
    planEventSource.close();
    setTimeout(connectPlansSSE, 3000);
  };
}
```

4. Update watch on currentTab to handle plans tab:

```javascript
watch(currentTab, (newTab, oldTab) => {
  // ... existing dashboard logic ...

  if (newTab === 'plans') {
    fetchPlans();
    connectPlansSSE();
  } else if (oldTab === 'plans' && planEventSource) {
    planEventSource.close();
    planEventSource = null;
  }
});
```

5. Add the plan-tracker-view component:

```javascript
app.component('plan-tracker-view', {
  props: {
    plans: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
  },
  data() {
    return {
      showCompleted: true,
      expandedPlans: new Set(),
      expandedFeatures: new Set(),
      groupByLayer: false,
    };
  },
  computed: {
    filteredPlans() {
      if (this.showCompleted) return this.plans;
      return this.plans.filter(p => p.status === 'active');
    },
    activePlanCount() {
      return this.plans.filter(p => p.status === 'active').length;
    },
    completedPlanCount() {
      return this.plans.filter(p => p.status === 'completed').length;
    },
  },
  methods: {
    togglePlan(name) {
      if (this.expandedPlans.has(name)) {
        this.expandedPlans.delete(name);
      } else {
        this.expandedPlans.add(name);
        this.fetchPlanDetails(name);
      }
      this.$forceUpdate();
    },
    toggleFeature(featureId) {
      if (this.expandedFeatures.has(featureId)) {
        this.expandedFeatures.delete(featureId);
      } else {
        this.expandedFeatures.add(featureId);
      }
      this.$forceUpdate();
    },
    async fetchPlanDetails(name) {
      // Details are fetched via SSE/API, cached in parent
    },
    isPlanExpanded(name) {
      return this.expandedPlans.has(name);
    },
    isFeatureExpanded(featureId) {
      return this.expandedFeatures.has(featureId);
    },
    getProgressPercent(plan) {
      if (plan.featureCount === 0) return 0;
      return Math.round((plan.completedCount / plan.featureCount) * 100);
    },
    getProgressClass(plan) {
      if (plan.failedCount > 0) return 'has-failed';
      if (plan.inProgressCount > 0) return 'in-progress';
      return '';
    },
  },
  template: `
    <div class="plan-tracker">
      <div class="plan-controls">
        <label>
          <input type="checkbox" v-model="showCompleted" />
          Show completed plans
        </label>
        <label>
          <input type="checkbox" v-model="groupByLayer" />
          Group by layer
        </label>
        <span class="plan-count">
          {{ activePlanCount }} active, {{ completedPlanCount }} completed
        </span>
      </div>

      <div v-if="loading && plans.length === 0" class="plan-empty">
        <h3>Loading plans...</h3>
      </div>

      <div v-else-if="filteredPlans.length === 0" class="plan-empty">
        <h3>No plans found</h3>
        <p>Create a plan with /optimize-plan or check dev/active directory</p>
      </div>

      <div v-else class="plan-grid">
        <plan-card
          v-for="plan in filteredPlans"
          :key="plan.name"
          :plan="plan"
          :expanded="isPlanExpanded(plan.name)"
          :expanded-features="expandedFeatures"
          :group-by-layer="groupByLayer"
          @toggle="togglePlan(plan.name)"
          @toggle-feature="toggleFeature"
        ></plan-card>
      </div>
    </div>
  `,
});
```

6. Add the plan-card component:

```javascript
app.component('plan-card', {
  props: {
    plan: { type: Object, required: true },
    expanded: { type: Boolean, default: false },
    expandedFeatures: { type: Object, default: () => new Set() },
    groupByLayer: { type: Boolean, default: false },
  },
  emits: ['toggle', 'toggle-feature'],
  data() {
    return {
      details: null,
      loadingDetails: false,
    };
  },
  computed: {
    progressPercent() {
      if (this.plan.featureCount === 0) return 0;
      return Math.round((this.plan.completedCount / this.plan.featureCount) * 100);
    },
    progressClass() {
      if (this.plan.failedCount > 0) return 'has-failed';
      if (this.plan.inProgressCount > 0) return 'in-progress';
      return '';
    },
    groupedFeatures() {
      if (!this.details || !this.groupByLayer) return null;
      const groups = {};
      for (const feature of this.details.features) {
        const layer = feature.layer || 0;
        if (!groups[layer]) {
          groups[layer] = {
            name: this.details.layers?.[layer] || 'Layer ' + layer,
            features: [],
          };
        }
        groups[layer].features.push(feature);
      }
      return Object.values(groups).sort((a, b) =>
        (a.features[0]?.layer || 0) - (b.features[0]?.layer || 0)
      );
    },
  },
  watch: {
    expanded: {
      immediate: true,
      handler(isExpanded) {
        if (isExpanded && !this.details) {
          this.fetchDetails();
        }
      },
    },
  },
  methods: {
    async fetchDetails() {
      this.loadingDetails = true;
      try {
        const res = await fetch('/api/plans/' + this.plan.name);
        if (res.ok) {
          this.details = await res.json();
        }
      } catch (err) {
        console.error('Failed to fetch plan details:', err);
      } finally {
        this.loadingDetails = false;
      }
    },
    isFeatureExpanded(featureId) {
      return this.expandedFeatures.has(featureId);
    },
  },
  template: `
    <div class="plan-card" :class="'status-' + plan.status">
      <div class="plan-card-header" @click="$emit('toggle')">
        <div class="plan-title">
          <h3>{{ plan.project || plan.name }}</h3>
          <span class="plan-status-badge" :class="plan.status">
            {{ plan.status }}
          </span>
        </div>
        <p v-if="plan.description" class="plan-description">
          {{ plan.description }}
        </p>
        <div class="plan-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :class="progressClass"
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
          <div class="progress-text">
            {{ plan.completedCount }}/{{ plan.featureCount }} features
            ({{ progressPercent }}%)
            <span v-if="plan.inProgressCount > 0">
              - {{ plan.inProgressCount }} in progress
            </span>
            <span v-if="plan.failedCount > 0">
              - {{ plan.failedCount }} failed
            </span>
          </div>
        </div>
      </div>

      <div v-if="expanded" class="plan-card-content">
        <div v-if="loadingDetails" class="plan-empty">
          Loading features...
        </div>

        <template v-else-if="details">
          <!-- Grouped by layer -->
          <template v-if="groupByLayer && groupedFeatures">
            <div v-for="group in groupedFeatures" :key="group.name" class="layer-group">
              <div class="layer-header">{{ group.name }}</div>
              <ul class="feature-list">
                <feature-item
                  v-for="feature in group.features"
                  :key="feature.id"
                  :feature="feature"
                  :expanded="isFeatureExpanded(feature.id)"
                  @toggle="$emit('toggle-feature', feature.id)"
                ></feature-item>
              </ul>
            </div>
          </template>

          <!-- Flat list -->
          <ul v-else class="feature-list">
            <feature-item
              v-for="feature in details.features"
              :key="feature.id"
              :feature="feature"
              :expanded="isFeatureExpanded(feature.id)"
              @toggle="$emit('toggle-feature', feature.id)"
            ></feature-item>
          </ul>
        </template>
      </div>
    </div>
  `,
});
```

7. Add the feature-item component:

```javascript
app.component('feature-item', {
  props: {
    feature: { type: Object, required: true },
    expanded: { type: Boolean, default: false },
  },
  emits: ['toggle'],
  template: `
    <li class="feature-item" @click="$emit('toggle')">
      <span class="feature-status-dot" :class="feature.status"></span>
      <div class="feature-content">
        <div class="feature-title">{{ feature.title }}</div>
        <div class="feature-meta">
          <span class="feature-layer">L{{ feature.layer }}</span>
          <span>{{ feature.id }}</span>
        </div>
        <div v-if="expanded" class="feature-details">
          <p v-if="feature.description">{{ feature.description }}</p>

          <h4 v-if="feature.acceptanceCriteria?.length">Acceptance Criteria</h4>
          <ul v-if="feature.acceptanceCriteria?.length">
            <li v-for="(criterion, i) in feature.acceptanceCriteria" :key="i">
              {{ criterion }}
            </li>
          </ul>

          <h4 v-if="feature.files?.length">Files</h4>
          <ul v-if="feature.files?.length">
            <li v-for="(file, i) in feature.files" :key="i">{{ file }}</li>
          </ul>

          <h4 v-if="feature.dependencies?.length">Dependencies</h4>
          <ul v-if="feature.dependencies?.length">
            <li v-for="(dep, i) in feature.dependencies" :key="i">{{ dep }}</li>
          </ul>
        </div>
      </div>
    </li>
  `,
});
```

8. Return plans state in setup():

```javascript
return {
  // ... existing returns ...
  plans,
  plansLoading,
};
```

## Acceptance Criteria

- [ ] Plans tab added to tabs array
- [ ] plan-tracker-view component renders
- [ ] plan-card component shows plan summary with progress bar
- [ ] feature-item component shows feature with status dot
- [ ] Clicking plan expands/collapses feature list
- [ ] Clicking feature expands/collapses details
- [ ] Toggle for showing/hiding completed plans
- [ ] Toggle for grouping by layer
- [ ] SSE updates plans in real-time
- [ ] Loading states display correctly

## Verification

```bash
grep -q 'plan-tracker-view' .claude/hooks/viewer/index.html
```

## Commit

```bash
git add .claude/hooks/viewer/index.html
git commit -m "feat(plan-tracker): add Vue component for plan tracking"
```

## Next

Proceed to: `07-unit-tests.md`
