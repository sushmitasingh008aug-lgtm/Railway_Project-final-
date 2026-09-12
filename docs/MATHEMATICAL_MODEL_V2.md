# AI-Powered Automatic Block Planning — Mathematical Model Specification v2.0

## 1. System Architecture & Conceptual Pipeline

The Automatic Block Planning Platform replaces legacy heuristic heuristics with a layered mathematical decision engine that couples predictive machine learning, risk optimization, and constraint programming:

$$\text{Telemetry / Defect Streams } (X_i) \longrightarrow \text{ML 30d Failure Probability } (R_i) \longrightarrow \text{Consequence Engine } (I_i, C_i)$$
$$\longrightarrow \text{Logistic Urgency } (U_i) \longrightarrow \text{Expected-Loss Priority } (Priority_i) \longrightarrow \text{Shadow-Block Bundling } (Compat_{ij})$$
$$\longrightarrow \text{CP-SAT Block Optimizer } \longrightarrow \text{Deterministic Safety Validator } \longrightarrow \text{Controller Review \& Audit}$$

Hard safety constraints are non-negotiable and deterministic: train headway clearances ($\ge 10$ minutes), electrical isolations, and crew caps are solved as absolute constraints and never traded off against business weights.

---

## 2. Predictive Failure Probability Model

For each asset $i$, we formulate maintenance failure risk as the conditional probability of functional breakdown within a forward 30-day operational horizon:

$$R_i = P(Y_i = 1 \mid X_i) \in [0, 1]$$

Where:
- $Y_i \in \{0, 1\}$: Binary failure event indicator within 30 days.
- $X_i \in \mathbb{R}^d$: Point-in-time engineered feature vector comprising:
  - Cumulative gross tonnage since last tamping/rehabilitation ($MGT$).
  - Defect escalation velocity: $\frac{\Delta \text{defect\_severity}}{\Delta t}$.
  - Track Geometry Index ($TGI$) and component age relative to design lifespan ($Age / Lifetime$).
  - Acoustic and ultrasonic flaw signatures (high-order flaw echoes, axle counter perturbation counts).
  - Ambient environmental stress indices (temperature cycling amplitude, rainfall saturation).

The inference engine employs a calibrated ensemble (LightGBM / XGBoost / Random Forest) with isotonic regression calibration ensuring empirical frequency alignment:

$$\lim_{N \to \infty} \frac{\sum_{i=1}^N \mathbb{I}(Y_i = 1 \mid R_i \approx p)}{N} = p$$

Local feature attributions are computed via TreeSHAP:

$$R_i(X_i) = \phi_0 + \sum_{m=1}^d \phi_m(X_i)$$

Where $\phi_0 = \mathbb{E}[R_i]$ and $\phi_m$ represents the marginal additive contribution of feature $m$ to the asset's risk score.

---

## 3. Engineering Criticality Formulation

Asset consequence under failure is quantified by the normalized multi-attribute Engineering Criticality metric $C_i \in [0, 1]$:

$$C_i = w_s S_i + w_o O_i + w_a A_i + w_f F_i + w_r R_i^{red} + w_t T_i$$

### Weights & Parameters
$$\mathbf{w} = [0.30, 0.20, 0.20, 0.10, 0.10, 0.10], \quad \sum w = 1.0$$

| Dimension | Symbol | Weight | Definition |
| :--- | :---: | :---: | :--- |
| **Safety Consequence** | $S_i$ | $0.30$ | Derailment risk, signal violation severity, catastrophic hazard rating |
| **Operational Impact** | $O_i$ | $0.20$ | Route throughput dependence, mainline vs. loop line classification |
| **Asset Criticality** | $A_i$ | $0.20$ | Asset hierarchy level (point switch > sleeper pad) |
| **Failure Frequency** | $F_i$ | $0.10$ | Historical MTBF degradation rate over preceding 365 days |
| **Redundancy** | $R_i^{red}$ | $0.10$ | Availability of alternate routing ($1.0 = \text{no redundancy}$, $0.0 = \text{full parallel loop}$) |
| **Traffic Density** | $T_i$ | $0.10$ | Normalized daily train volume ($GMT / \max GMT$) |

---

## 4. Continuous Bounded Logistic Urgency

To eliminate artificial step discontinuities in scheduling windows, urgency $U_i \in (0, 1)$ is modeled as a continuous logistic sigmoid over remaining lead time $d_i$ (days until due date):

$$U_i = \frac{1}{1 + \exp\Big(k \cdot (d_i - d_0)\Big)}$$

Where:
- $d_i = \text{Date}_{due} - \text{Date}_{current}$ (in operational days; $d_i < 0$ denotes overdue tasks).
- $k = 0.35$: Sigmoidal steepness parameter governing growth rate.
- $d_0 = 2.0$: Midpoint calibration day.

### Asymptotic & Boundary Properties:
$$\lim_{d_i \to -\infty} U_i = 1.0 \quad (\text{Severely overdue})$$
$$U_i\Big|_{d_i = d_0} = 0.50 \quad (2\text{ days before deadline})$$
$$\lim_{d_i \to +\infty} U_i = 0.0 \quad (\text{Distant planning horizon})$$

---

## 5. Composite Operational Impact Score

The comprehensive disruption impact $I_i \in [0, 1]$ induced by asset unavailability incorporates structural, topological, and delay factors:

$$I_i = 0.40 C_i + 0.25 D_i + 0.20 T_i^{impact} + 0.15 A_i^{impact}$$

Where:
- $C_i$: Engineering Criticality score.
- $D_i$: Normalized task execution duration: $\min\left(1.0, \frac{\text{duration\_minutes}}{360}\right)$.
- $T_i^{impact}$: Section traffic density factor based on scheduled trains per hour.
- $A_i^{impact}$: Track occupancy impact factor ($1.0$ for both tracks, $0.6$ for single track with diversion).

---

## 6. Expected-Loss Priority Engine

The mathematical synthesis of predictive failure risk, operational impact, and temporal urgency defines the Expected-Loss Priority metric:

$$Priority_i = 100 \times R_i \times I_i \times U_i \in [0, 100]$$

### Non-Negotiable Deterministic Safety Overrides
Regardless of ML regression outputs or scheduling buffers, when a field defect violates absolute railway safety standards, a deterministic override forces priority to the critical threshold:

$$\text{If } \text{DefectType}_i \in \{\text{'Broken Rail Weld'}, \text{'Track Circuit Failure'}, \text{'OHE Dropper Broken'}, \text{'Signal Blank'}\}:$$
$$Priority_i \leftarrow \max(Priority_i, 92.50), \quad \text{Band}_i \leftarrow \text{'Critical'}$$

Priority bands are strictly partitioned:
- **Critical**: $Priority_i \ge 80.0$ (or statutory safety override)
- **High**: $60.0 \le Priority_i < 80.0$
- **Medium**: $35.0 \le Priority_i < 60.0$
- **Low**: $Priority_i < 35.0$

### Comparison with Traditional Indian Railways 60/40 Rule
The legacy baseline priority is evaluated concurrently for audit and benchmark purposes:

$$Priority_i^{rule} = 0.60 C_i^{rule} + 0.40 U_i^{rule}$$

Where $C_i^{rule} \in \{1.0, 0.75, 0.50, 0.25\}$ and $U_i^{rule} \in \{1.0, 0.8, 0.5, 0.2\}$ are discrete step functions.

---

## 7. Multi-Department Shadow-Block Coordination

When multiple tasks across Engineering, Traction (OHE), and S&T require line possession on the same section, executing them sequentially multiplies traffic disruption. The coordination engine solves an 8-dimensional pairwise compatibility matrix:

$$Compat_{ij} = S_{ij} \land T_{ij} \land Iso_{ij} \land Res_{ij} \land Dir_{ij} \land Dep_{ij} \land Safety_{ij}$$

### Compatibility Dimensions:
1. **Spatial Proximity ($S_{ij}$)**: $\text{Section}_i = \text{Section}_j \land |\text{KM}_i - \text{KM}_j| \le \Delta_{km}^{safe}$
2. **Temporal Window Overlap ($T_{ij}$)**: Due dates within acceptable coordination window ($|d_i - d_j| \le 3\text{ days}$)
3. **Electrical Isolation Compatibility ($Iso_{ij}$)**: Non-conflicting power block requirements
4. **Resource Non-Interference ($Res_{ij}$)**: Disjoint or co-locatable heavy machinery (e.g., BCM and Tamping machine clearances)
5. **Directional Impact ($Dir_{ij}$)**: Affects UP line, DOWN line, or BOTH lines compatibly
6. **Departmental Rules ($Dep_{ij}$)**: Allowed cross-department pairings (e.g., Track renewal + OHE maintenance allowed; hazardous chemical spraying + high-voltage live work prohibited)
7. **Safety Clearance ($Safety_{ij}$)**: Longitudinal buffer distance $\ge 500\text{ m}$ between mobile work crews

### Combined Block Metrics:
For a coordinated block $b$ containing tasks $\mathcal{T}_b = \{i_1, i_2, \dots, i_k\}$:
- **Combined Duration**: $D_b = \max_{i \in \mathcal{T}_b}(d_i)$
- **Possession Minutes Saved**:
$$\Delta \text{Possession}_b = \sum_{i \in \mathcal{T}_b} d_i - D_b$$
- **Disruptions Avoided**: $|\mathcal{T}_b| - 1$

---

## 8. CP-SAT Integer Programming Formulation

### Decision Variables:
- $x_{ib} \in \{0, 1\}$: Binary variable $= 1$ if maintenance task $i$ is assigned to block window $b$.
- $s_b \in [0, H]$: Integer start minute of block $b$ within planning horizon $H$.
- $e_b \in [0, H]$: Integer end minute of block $b$, where $e_b = s_b + D_b$.
- $u_b \in \{0, 1\}$: Binary indicator $= 1$ if block $b$ is activated.

### Objective Function:
The CP-SAT model maximizes net operational value by balancing risk mitigation against traffic possessions:

$$\max \mathcal{Z} = \sum_{b \in \mathcal{B}} \sum_{i \in \mathcal{T}} Priority_i \cdot x_{ib} + \alpha \sum_{b \in \mathcal{B}} \Delta \text{Possession}_b - \beta \sum_{b \in \mathcal{B}} D_b \cdot \text{TrafficWeight}(\text{Sec}_b)$$

Where $\alpha = 1.5$ rewards multi-department bundling and $\beta = 0.8$ penalizes line possession during peak corridors.

### Hard Constraints:

1. **Single Task Assignment**:
   $$\sum_{b \in \mathcal{B}} x_{ib} \le 1 \quad \forall i \in \mathcal{T}$$

2. **Block Activation & Duration Containment**:
   $$x_{ib} \le u_b \quad \forall i, b$$
   $$D_b \ge d_i \cdot x_{ib} \quad \forall i \in \mathcal{T}, \forall b \in \mathcal{B}$$

3. **Deterministic Train Separation (Collision-Free Safety Buffer)**:
   For every block $b$ on section $s$ and every scheduled train movement $j$ on section $s$ with arrival time $A_j$ and departure time $B_j$:
   $$(e_b + \Delta_{\text{buffer}} \le A_j) \quad \lor \quad (s_b \ge B_j + \Delta_{\text{buffer}})$$
   Where $\Delta_{\text{buffer}} = 10\text{ minutes}$.

4. **Resource Capacity Constraints**:
   For each resource type $r$ (e.g., Tamping machine, Tower wagon, Specialized crew) at any minute $t \in [0, H]$:
   $$\sum_{b \in \mathcal{B}: s_b \le t < e_b} \text{Demand}(b, r) \le \text{Capacity}(r)$$

5. **Section Concurrency Limit**:
   No two conflicting blocks may occupy the same section on the same track simultaneously:
   $$(e_{b_1} \le s_{b_2}) \quad \lor \quad (e_{b_2} \le s_{b_1}) \quad \forall b_1 \ne b_2 \text{ on section } s$$

---

## 9. Post-Solve Deterministic Safety Validator

To safeguard against optimization modeling bugs or solver relaxation edge cases, an independent deterministic verification module audits every scheduled block before issuance:

$$\forall b \in \mathcal{B}_{\text{scheduled}}, \forall j \in \text{Trains}(\text{Section}_b):$$
$$\text{SafetyCondition}(b, j) = \Big(e_b \le A_j - 10\Big) \;\lor\; \Big(s_b \ge B_j + 10\Big)$$

$$\text{CertificationStatus} = \begin{cases} \text{PASS}, & \text{if } \bigwedge_{b, j} \text{SafetyCondition}(b, j) \equiv \text{True} \\ \text{FAIL}, & \text{otherwise} \end{cases}$$

If $\text{CertificationStatus} \ne \text{PASS}$, the schedule is automatically blocked from dispatch, logged to `AUDIT_EVENTS`, and held for human intervention.

---

## 10. Scenario Simulation & Operational KPIs

### Key Performance Indicators:
1. **Estimated Delay Trapped ($EDT_i$)**:
   Minutes of passenger/freight delay saved by executing task $i$ in scheduled low-density window versus unplanned reactive block:
   $$EDT_i = \text{Delay}_{\text{reactive}}(i) - \text{Delay}_{\text{scheduled}}(i)$$

2. **Expected Delay Reduction ($EDR\%$)**:
   $$EDR\% = \frac{\sum_i EDT_i}{\sum_i \text{Delay}_{\text{reactive}}(i)} \times 100\%$$

3. **Section Availability Gain ($\Delta \text{Availability}$)**:
   $$\Delta \text{Availability} = \frac{\sum_b \Delta \text{Possession}_b}{H \times |\mathcal{S}|} \times 100\%$$

4. **Multi-Department Consolidation Rate**:
   $$\text{Consolidation Rate} = \frac{|\{b \in \mathcal{B} : |\text{Departments}_b| \ge 2\}|}{|\mathcal{B}|} \times 100\%$$

5. **Window Utilization Efficiency**:
   $$\text{Utilization}_b = \frac{\max_{i \in \mathcal{T}_b} d_i}{e_b - s_b} \times 100\%$$
