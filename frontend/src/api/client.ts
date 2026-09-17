import axios from 'axios';

// Same-origin in Docker (Flask serves / + /api on 8765); Vite proxy forwards /api -> backend in dev.
const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

export interface HighLevelMetrics {
  total_scheduled_tasks: number;
  train_overlap_collisions: string;
  solver_runtime: string;
  planning_horizon: string;
  success_rate: string;
  planning_minutes: string;
  combined_blocks_count?: number;
  disruptions_avoided?: number;
  coordinated_tasks?: number;
}

export interface DeptWorkload {
  department: string;
  count: number;
}

export interface PriorityBucket {
  criticality: string;
  score_bucket: number;
  count: number;
}

export interface SectionAllocation {
  section_name: string;
  Engineering: number;
  Traction: number;
  'S&T': number;
  total: number;
}

export interface MetricsResponse {
  status: string;
  high_level: HighLevelMetrics;
  dept_workload: DeptWorkload[];
  priority_dist: PriorityBucket[];
  section_allocation: SectionAllocation[];
}

export interface ScheduledTask {
  task_id: string;
  asset_id: string;
  department: string;
  task_type: string;
  criticality: string;
  priority_score: number;
  section_id: string;
  section_name: string;
  duration_minutes: number;
  start_minute: number;
  end_minute: number;
  assigned_start_time: string;
  assigned_end_time: string;
  combined_group_id?: string;
  affects_line?: string;
  lat?: number;
  lon?: number;
  due_date?: string;
  days_overdue?: number;
  is_overdue?: boolean;
}

export interface Section {
  section_id: string;
  name: string;
  corridor_id: string;
  length_km: number;
  start_station: string;
  end_station: string;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  geometry?: [number, number][];
}

export interface TrainMovement {
  movement_id: number;
  train_id: string;
  section_id: string;
  train_type: string;
  direction: string;
  entry_min: number;
  exit_min: number;
}

export interface SubmitBlockRequest {
  department: string;
  target_section: string;
  task_type: string;
  criticality: string;
  duration_minutes: number;
  due_date: string;
}

export interface SubmitBlockResponse {
  status: string;
  task_id: string;
  computed_priority_score: number;
  criticality_contribution: number;
  urgency_contribution: number;
  section_id: string;
  message: string;
}

export interface TestCase {
  id: string;
  name: string;
  passed: boolean;
  type: string;
  details: string;
}

export interface TestStatusResponse {
  status: string;
  all_passed: boolean;
  total_tests: number;
  test_cases: TestCase[];
  raw_output: string;
}

export interface ImpactScenario {
  description: string;
  collision_events: number;
  trains_affected: number;
  total_delay_minutes: number;
  trains_on_time_pct: number;
}

export interface ImpactResponse {
  status: string;
  tasks_evaluated: number;
  train_movements_analyzed: number;
  baseline: ImpactScenario;
  optimized: ImpactScenario;
  impact: {
    delay_avoided_minutes: number;
    delay_avoided_hours: string;
    collision_events_avoided: number;
    avg_delay_recovered_per_train_min: number;
  };
}

// Master Plan v2 Enhanced Interfaces

export interface ModelBenchmarkItem {
  model_name: string;
  PR_AUC: number;
  ROC_AUC: number;
  Recall: number;
  Precision: number;
  F1_Score: number;
  Brier_Score: number;
  MAE: number;
  RMSE: number;
  Train_Time_ms: number;
  Inference_Latency_ms: number;
  composite_score: number;
  Confusion_Matrix: number[][];
}

export interface MLBenchmarkResponse {
  status: string;
  data: {
    model_version: string;
    champion_model: string;
    trained_at: string;
    evaluation_protocol: string;
    target_variable: string;
    feature_count: number;
    feature_names: string[];
    champion_metrics: ModelBenchmarkItem;
    benchmark_comparison: ModelBenchmarkItem[];
  };
}

export interface SHAPFeature {
  feature: string;
  contribution: number;
}

export interface TaskExplanationResponse {
  status: string;
  data: {
    prediction_id: string;
    task_id: string;
    task_type: string;
    criticality: string;
    department: string;
    asset_id: string;
    condition_score: number;
    model_version: string;
    prediction_timestamp: string;
    risk_probability: number;
    priority_score: number;
    safety_override: number;
    due_date?: string;
    days_overdue?: number;
    is_overdue?: boolean;
    top_positive_features: SHAPFeature[];
    top_negative_features: SHAPFeature[];
    shap_values: Record<string, number>;
  };
}

export interface CompatibilityPair {
  pair_id: string;
  task_id_1: string;
  task_id_2: string;
  section_id: string;
  is_compatible: number;
  spatial_compatible: number;
  possession_compatible: number;
  isolation_compatible: number;
  resource_compatible: number;
  reason_codes: string[];
  dept_1: string;
  type_1: string;
  prio_1: number;
  dept_2: string;
  type_2: string;
  prio_2: number;
  checked_at: string;
}

export interface CompatibilityResponse {
  status: string;
  summary: {
    total_pairs_evaluated: number;
    compatible_pairs: number;
    incompatible_pairs: number;
    coordination_readiness_pct: number;
  };
  data: CompatibilityPair[];
}

export interface AlternativeWindow {
  window: string;
  status: 'SELECTED' | 'REJECTED';
  reason: string;
}

export interface DetailedBlock {
  block_id: string;
  version_id: string;
  section_id: string;
  corridor_id: string;
  block_type: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  task_count: number;
  departments: string;
  utilization_pct: number;
  train_conflicts_avoided: number;
  status: string;
  explanation: {
    why_chosen: string;
    solver_objective: number;
    is_coordinated: boolean;
    departments_involved: string[];
    alternative_windows_evaluated: AlternativeWindow[];
  };
}

export interface FailureRecord {
  af_id: string;
  uims_id?: string;
  zone?: string;
  division?: string;
  department: string;
  failure_type: string;
  failure_date: string;
  failure_time?: string;
  failure_duration_min: number;
  section_id: string;
  block_section?: string;
  trains_delayed: number;
  avg_detention_min: number;
  total_detention_min: number;
  cause: string;
  subcause?: string;
  sm_remarks?: string;
  raw_description?: string;
}

export interface EvaluationReport {
  timestamp: string;
  tasks_scheduled: number;
  coordination: {
    coordinated_groups: number;
    coordinated_tasks: number;
    disruptions_avoided: number;
    multi_department_ratio: number;
  };
  baseline_uncoordinated: {
    total_blocks: number;
    total_block_hours: number;
    asset_downtime_hours: number;
    block_utilization_pct: number;
    line_closures_per_week: number;
    train_conflicts_risk: string;
  };
  optimized_cpsat: {
    total_blocks: number;
    total_block_hours: number;
    asset_downtime_hours: number;
    block_utilization_pct: number;
    line_closures_per_week: number;
    train_conflicts_risk: string;
  };
  measured_benefits: {
    blocks_saved: number;
    block_reduction_pct: number;
    block_hours_saved: number;
    downtime_reduction_pct: number;
    train_conflicts_eliminated: number;
    throughput_availability_gain_pct: number;
  };
}

export interface WhatIfResult {
  status: string;
  simulation: {
    target_block_id: string;
    section_id: string;
    original_window: string;
    shifted_window: string;
    shift_applied_minutes: number;
    train_conflicts_detected: number;
    conflicting_trains: Array<{ train_id: string; train_name: string; overlap_minutes: number }>;
    peak_window_violation: boolean;
    feasible: boolean;
    recommendation: string;
  };
}

export interface ScheduleVersion {
  version_id: string;
  created_at: string;
  horizon_days: number;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  approved_by?: string;
  approved_at?: string;
  objective_value?: number;
  notes?: string;
}

export interface AuditEntry {
  log_id: string;
  event_type: string;
  entity_id: string;
  timestamp: string;
  user_id: string;
  details: any;
  status: string;
}

export interface SectionRisk {
  section_id: string;
  name: string;
  corridor_id: string;
  length_km: number;
  open_tasks: number;
  critical_tasks: number;
  avg_condition: number;
  avg_priority: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}


// ── ABPS v4 Domain Interfaces ──

export interface AnomalyScenario {
  anomaly_scenario: string;
  department: string;
  recommended_task_types: string[];
  recommended_actions: string[];
  planning_handling: string;
}

export interface CoverageMetric {
  dataset: string;
  metric: string;
  value: string;
  goal: string;
  status: 'PASS' | 'WARN' | 'FAIL';
}

export interface AnomalyCoverageResponse {
  status: string;
  summary: {
    total_scenarios: number;
    asset_types: number;
    failure_types: number;
    task_types: number;
    action_types: number;
    block_types: number;
    dependency_types: number;
    maintenance_outcomes: number;
    audit_event_types: number;
  };
  metrics: CoverageMetric[];
}

export interface AssetItem {
  asset_id: string;
  asset_number: string;
  asset_type: string;
  asset_subtype: string;
  department: string;
  corridor_id: string;
  section_id: string;
  chainage_km: number;
  condition_score: number;
  health_index: number;
  criticality_class: string;
  operational_status: string;
  last_maintenance_date: string;
  last_inspection_date: string;
  location_lat?: number;
  location_lon?: number;
}



export interface TaskAction {
  action_id: string;
  task_id: string;
  action_type: string;
  required_crew: string;
  required_resources: string;
  setup_minutes: number;
  work_duration_minutes: number;
  isolation_requirement: string;
  possession_requirement: string;
  verification_required: number;
  sequence_order: number;
}

export interface TaskDependency {
  dependency_id: string;
  predecessor_task_id: string;
  successor_task_id: string;
  dependency_type: string;
  min_lag_minutes: number;
}

export interface BlockWindow {
  block_id: string;
  corridor_id: string;
  section_id: string;
  block_section: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_min: number;
  block_type: string;
  availability_status: string;
  direction: string;
  line: string;
  allowed_departments: string;
  isolation_type: string;
}

export interface GoodsForecastItem {
  forecast_id: string;
  corridor_id: string;
  section_id: string;
  forecast_date: string;
  time_window_start: string;
  time_window_end: string;
  expected_goods_trains: number;
  forecast_confidence: number;
  source: string;
}

export interface ResourceItem {
  resource_id: string;
  resource_type: string;
  department: string;
  capability: string;
  section_id: string;
  capacity: number;
  available_from?: string;
  available_to?: string;
  team_size: number;
  skill: string;
  equipment: string;
  status: string;
}

export interface DataQualityDataset {
  dataset: string;
  row_count: number;
  schema_status: string;
  reference_status: string;
  semantic_status: string;
  status: string;
}

export interface DataIngestionRun {
  ingestion_id: string;
  source_system: string;
  dataset_name: string;
  source_file: string;
  file_hash: string;
  schema_version: string;
  uploaded_by: string;
  uploaded_at: string;
  rows_received: number;
  rows_accepted: number;
  rows_rejected: number;
  duplicates: number;
  validation_status: string;
  notes?: string;
}

export interface ModelBenchmarkMetric {
  model_name: string;
  pr_auc: number;
  roc_auc: number;
  f1_score: number;
  recall: number;
  precision: number;
  brier_score: number;
  training_time_s: number;
  inference_latency_ms: number;
}

export interface ModelRegistryMeta {
  model_version: string;
  dataset_version: string;
  timestamp: string;
  target_variable: string;
  training_samples: number;
  positive_samples: number;
  positive_rate: number;
  temporal_split: { train_pct: number; val_pct: number; test_pct: number };
  promotion_gate: {
    status: string;
    passed: boolean;
    threshold_pr_auc: number;
    best_candidate: string;
    best_pr_auc: number;
    reason: string;
  };
  champion_model: string;
  benchmark_metrics: ModelBenchmarkMetric[];
  feature_names: string[];
}

export interface DashboardSummaryData {
  critical_tasks: number;
  safety_overrides: number;
  open_failures: number;
  planned_blocks: number;
  total_assets: number;
  available_resources: number;
  feeds: {
    coa: { status: string; last_sync: string; records: number };
    tms: { status: string; last_sync: string; records: number };
    smms: { status: string; last_sync: string; records: number };
    tdms: { status: string; last_sync: string; records: number };
  };
}

export interface PaginatedResponse<T> {
  status: string;
  total: number;
  page: number;
  page_size?: number;
  limit?: number;
  total_pages?: number;
  data: T[];
}
