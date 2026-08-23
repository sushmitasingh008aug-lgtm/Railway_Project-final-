import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

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
}

export interface Section {
  section_id: string;
  name: string;
  corridor_id: string;
  length_km: number;
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
