import type { Scenario } from '../types'

export const scenarios: Scenario[] = [
  // ============================================
  // SCENARIO 1: IND SUBMISSION REVIEW (12 Agents)
  // ============================================
  {
    id: 'ind-submission-review',
    name: 'IND Submission Review',
    description: 'Comprehensive 12-agent review of first-in-human IND package covering all disciplines',
    category: 'regulatory',
    topology: {
      name: 'IND Readiness Assessment',
      description: 'Full cross-functional review of IND package for novel CNS therapeutic',
      inputNodes: [
        {
          id: 'input-ind',
          type: 'input',
          task: `IND READINESS REVIEW - PROJECT AURORA

COMPOUND: AUR-2847
MODALITY: Small molecule, oral
TARGET: Novel TREM2 agonist for neurodegenerative diseases
INDICATION: Alzheimer's disease (mild-to-moderate)
IND SUBMISSION TARGET: Q1 2026

PROGRAM STATUS:
- Discovery: Complete (4-year program)
- Lead optimization: Complete
- Candidate selection: AUR-2847 selected from 2,400 compounds
- IND-enabling studies: 90% complete

NONCLINICAL PHARMACOLOGY:
- In vitro: EC50 = 8.2 nM (human TREM2), >1000-fold selectivity panel
- Microglial activation assays: 3.5-fold increase in phagocytic activity
- Mouse 5xFAD model: 40% reduction in amyloid plaques (p<0.001)
- Tau P301S model: 28% reduction in pTau (p=0.008)
- Behavioral endpoints: Morris water maze improvement at 30 mg/kg

PHARMACOKINETICS:
- Mouse: F=62%, T1/2=4.2h, Vd=3.1 L/kg
- Rat: F=55%, T1/2=6.8h
- Dog: F=48%, T1/2=11.2h
- Monkey: F=41%, T1/2=9.5h
- Brain penetration: Kp,uu = 0.35 (adequate for CNS target)
- Human PK prediction: T1/2 = 14-18h, QD dosing feasible

TOXICOLOGY (GLP Studies):
- 28-day rat: NOAEL = 100 mg/kg/day (30x projected human exposure)
- 28-day dog: NOAEL = 30 mg/kg/day (15x projected human exposure)
- Key findings: Hepatocyte hypertrophy (reversible), lymphoid hyperplasia
- Genetic toxicology: Negative Ames, negative micronucleus
- Safety pharmacology: hERG IC50 >30 μM, no CV/CNS/respiratory flags
- Phototoxicity: Negative

CMC STATUS:
- Drug substance: 50 kg manufactured, 98.5% purity
- Process: 5-step synthesis, validated at 10 kg scale
- Impurities: All below ICH limits, mutagenic assessment complete
- Drug product: IR tablets (10, 25, 50 mg strengths)
- Stability: 12-month data available (RT), 6-month accelerated
- Analytical methods: Validated per ICH Q2

CLINICAL DEVELOPMENT PLAN:
- Phase 1a: SAD (8 cohorts, 10-800 mg)
- Phase 1b: MAD (4 cohorts, 14-day dosing)
- Phase 1c: Food effect, elderly PK
- Phase 2 design: 24-week, placebo-controlled, 3 doses
- Biomarkers: CSF TREM2, plasma NfL, sTREM2

REGULATORY INTERACTIONS:
- Pre-IND meeting: Scheduled for Month -2
- FDA guidance on TREM2 biomarkers: Requested
- Breakthrough therapy: Will assess after Phase 1

IDENTIFIED GAPS/RISKS:
1. Carcinogenicity waiver strategy for FIH
2. Pediatric study plan not yet drafted
3. CYP induction observed in vitro (1.8-fold)
4. Limited ethnic diversity in PK predictions
5. Comparator strategy for Phase 2 (aducanumab? lecanemab?)

REVIEW REQUIREMENTS:
Provide comprehensive assessment from each discipline with:
- Critical findings requiring resolution before IND
- Important findings to address but not blocking
- Recommendations for FDA questions to anticipate
- Risk mitigation strategies`
        }
      ],
      outputNodes: [
        {
          id: 'output-ind-decision',
          type: 'output',
          label: 'IND Readiness Decision'
        }
      ],
      nodes: [
        {
          id: 'pharmacology-lead',
          name: 'Pharmacology Lead',
          role: 'You are the Head of Pharmacology for CNS programs. Assess the nonclinical efficacy package: (1) target engagement evidence, (2) disease model translatability to human AD, (3) dose-response relationships, (4) PK/PD modeling adequacy. Challenge: are the animal models predictive for human efficacy?',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'dmpk-lead',
          name: 'DMPK Director',
          role: 'You are the Director of Drug Metabolism and Pharmacokinetics. Evaluate: (1) species scaling and human PK predictions, (2) brain penetration adequacy for CNS target, (3) CYP induction risk and DDI potential, (4) PK variability predictions. Recommend Phase 1 PK sampling strategy.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'tox-lead',
          name: 'Toxicology Director',
          role: 'You are the Director of Toxicology with 20+ years of IND-enabling experience. Assess: (1) NOAEL adequacy for FIH dosing, (2) hepatic and lymphoid findings clinical relevance, (3) carcinogenicity waiver justification, (4) reproductive tox timing. Is the tox package FDA-ready?',
          behaviorPreset: 'analytical',
          temperature: 0.4,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'cmc-lead',
          name: 'CMC Director',
          role: 'You are the Director of CMC with biologics and small molecule expertise. Evaluate: (1) drug substance process robustness, (2) impurity qualification strategy, (3) stability data sufficiency, (4) scale-up readiness for Phase 2. Identify any CMC-related clinical holds.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'clinical-pharmacology',
          name: 'Clinical Pharmacology Lead',
          role: 'You are the VP of Clinical Pharmacology. Design the Phase 1 program: (1) FIH starting dose calculation (MRSD), (2) dose escalation strategy, (3) PK/PD endpoints, (4) special population studies needed. Ensure alignment with FDA guidance for CNS drugs.',
          behaviorPreset: 'analytical',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'biomarker-lead',
          name: 'Biomarker Strategy Lead',
          role: 'You are the Head of Translational Biomarkers. Assess: (1) CSF TREM2 as target engagement marker, (2) plasma NfL for neurodegeneration, (3) sTREM2 for pathway activity, (4) imaging biomarker strategy (amyloid PET, tau PET). What CDx considerations exist?',
          behaviorPreset: 'analytical',
          temperature: 0.6,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'clinical-ops',
          name: 'Clinical Operations Director',
          role: 'You are the Director of Clinical Operations for CNS. Evaluate: (1) Phase 1 site selection strategy, (2) CSF sampling feasibility, (3) elderly population recruitment, (4) protocol complexity assessment. Flag operational risks for the Phase 1 program.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'regulatory-lead',
          name: 'Regulatory Affairs Director',
          role: 'You are the Director of Regulatory Affairs for CNS programs. Assess: (1) IND format and content compliance, (2) FDA Division (DPARP) expectations, (3) Pre-IND meeting strategy, (4) potential clinical hold triggers. Prepare for the most likely FDA questions.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'medical-monitor',
          name: 'Medical Monitor Lead',
          role: 'You are the Lead Medical Monitor for Phase 1. Evaluate: (1) eligibility criteria appropriateness, (2) safety monitoring plan, (3) stopping rules adequacy, (4) SAE definitions and reporting. Ensure patient safety is paramount in the protocol.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'safety-scientist',
          name: 'Drug Safety Scientist',
          role: 'You are a Drug Safety Scientist specializing in CNS compounds. Review: (1) target safety based on TREM2 biology, (2) class effects of microglial modulators, (3) immunomodulation risks, (4) DSMB charter requirements. Anticipate long-term safety signals.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'project-manager',
          name: 'Program Director',
          role: 'You are the Program Director responsible for IND timelines. Integrate assessments for: (1) critical path items, (2) resource bottlenecks, (3) timeline risks, (4) budget implications of gaps. Provide project management perspective on IND readiness.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'ind-committee-chair',
          name: 'IND Review Committee Chair',
          role: 'You are the VP of Development and Chair of the IND Review Committee. Synthesize all expert inputs into: (1) GO/NO-GO/CONDITIONAL decision, (2) critical gaps requiring immediate resolution, (3) Pre-IND meeting talking points, (4) Risk register with mitigations. Make the final recommendation to the Executive Committee.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: true,
          suspicionLevel: 'suspicious',
          rogueMode: { enabled: false }
        }
      ],
      edges: [
        // Input to first tier (parallel review)
        { id: 'e-in-1', source: 'input-ind', target: 'pharmacology-lead', relationshipType: 'informs' },
        { id: 'e-in-2', source: 'input-ind', target: 'dmpk-lead', relationshipType: 'informs' },
        { id: 'e-in-3', source: 'input-ind', target: 'tox-lead', relationshipType: 'informs' },
        { id: 'e-in-4', source: 'input-ind', target: 'cmc-lead', relationshipType: 'informs' },
        { id: 'e-in-5', source: 'input-ind', target: 'clinical-pharmacology', relationshipType: 'informs' },
        { id: 'e-in-6', source: 'input-ind', target: 'biomarker-lead', relationshipType: 'informs' },
        { id: 'e-in-7', source: 'input-ind', target: 'clinical-ops', relationshipType: 'informs' },
        { id: 'e-in-8', source: 'input-ind', target: 'regulatory-lead', relationshipType: 'informs' },
        { id: 'e-in-9', source: 'input-ind', target: 'medical-monitor', relationshipType: 'informs' },
        { id: 'e-in-10', source: 'input-ind', target: 'safety-scientist', relationshipType: 'informs' },
        // Cross-functional collaboration
        { id: 'e-cross-1', source: 'pharmacology-lead', target: 'dmpk-lead', relationshipType: 'collaborates' },
        { id: 'e-cross-2', source: 'dmpk-lead', target: 'clinical-pharmacology', relationshipType: 'validates' },
        { id: 'e-cross-3', source: 'tox-lead', target: 'safety-scientist', relationshipType: 'informs' },
        { id: 'e-cross-4', source: 'biomarker-lead', target: 'clinical-pharmacology', relationshipType: 'collaborates' },
        { id: 'e-cross-5', source: 'medical-monitor', target: 'clinical-ops', relationshipType: 'collaborates' },
        // Reports to project manager for timeline integration
        { id: 'e-pm-1', source: 'cmc-lead', target: 'project-manager', relationshipType: 'reports-to' },
        { id: 'e-pm-2', source: 'clinical-ops', target: 'project-manager', relationshipType: 'reports-to' },
        { id: 'e-pm-3', source: 'regulatory-lead', target: 'project-manager', relationshipType: 'reports-to' },
        // All report to committee chair
        { id: 'e-chair-1', source: 'pharmacology-lead', target: 'ind-committee-chair', relationshipType: 'reports-to' },
        { id: 'e-chair-2', source: 'dmpk-lead', target: 'ind-committee-chair', relationshipType: 'reports-to' },
        { id: 'e-chair-3', source: 'tox-lead', target: 'ind-committee-chair', relationshipType: 'reports-to' },
        { id: 'e-chair-4', source: 'clinical-pharmacology', target: 'ind-committee-chair', relationshipType: 'reports-to' },
        { id: 'e-chair-5', source: 'regulatory-lead', target: 'ind-committee-chair', relationshipType: 'reports-to' },
        { id: 'e-chair-6', source: 'medical-monitor', target: 'ind-committee-chair', relationshipType: 'reports-to' },
        { id: 'e-chair-7', source: 'project-manager', target: 'ind-committee-chair', relationshipType: 'reports-to' },
        { id: 'e-out', source: 'ind-committee-chair', target: 'output-ind-decision', relationshipType: 'informs' }
      ]
    }
  },

  // ============================================
  // SCENARIO 2: M&A DUE DILIGENCE (10 Agents)
  // ============================================
  {
    id: 'ma-due-diligence',
    name: 'M&A Due Diligence',
    description: '10-agent evaluation of biotech acquisition target across science, clinical, regulatory, and commercial',
    category: 'strategy',
    topology: {
      name: 'Biotech Acquisition Assessment',
      description: 'Comprehensive due diligence for $2.5B oncology biotech acquisition',
      inputNodes: [
        {
          id: 'input-target-company',
          type: 'input',
          task: `M&A DUE DILIGENCE REQUEST - CONFIDENTIAL

TARGET: OncoVant Therapeutics (NASDAQ: ONCV)
MARKET CAP: $1.8B
OFFER PRICE: $2.5B (39% premium)
THERAPEUTIC FOCUS: Solid tumor oncology
MODALITY: Antibody-drug conjugates (ADCs)

LEAD ASSET: OV-201 (HER3-targeting ADC)
- Payload: Novel topoisomerase I inhibitor (proprietary linker)
- Indication: Metastatic NSCLC (HER3-high, EGFR TKI-resistant)
- Phase: Phase 2b ongoing (n=180), topline Q3 2025
- Phase 1 results: ORR 42% (n=67), DCR 78%
- Median PFS: 7.8 months (historical control: 4.5 months)
- Safety: Grade 3+ neutropenia 18%, ILD 4% (1 fatal)
- Comparator: Patritumab deruxtecan (Daiichi Sankyo) - Phase 3 ongoing

PIPELINE:
- OV-202 (TROP2 ADC): Phase 1 (n=28), differentiated vs SG
- OV-203 (Claudin 18.2 ADC): IND filed, gastric cancer
- Discovery: 3 preclinical ADC programs

INTELLECTUAL PROPERTY:
- 42 issued patents, 78 pending applications
- Novel linker technology (composition of matter to 2038)
- Freedom to operate: Challenged by Seattle Genetics (IPR ongoing)
- Key patent expiry: 2041 (assuming pediatric extension)

MANUFACTURING:
- DS: Lonza partnership (1000L scale validated)
- DP: In-house fill-finish (capacity limited to Phase 3)
- CMC transfer: ~18 months to acquirer facilities estimated

REGULATORY STATUS:
- FDA Breakthrough Therapy: Granted (OV-201)
- EMA PRIME: Application pending
- Fast Track: Granted

FINANCIAL OVERVIEW:
- Cash runway: 18 months at current burn ($85M/quarter)
- R&D spend: $280M/year
- Commercial infrastructure: None (pre-revenue)
- Key contracts: Lonza MSA, CRO agreements
- Liabilities: $150M convertible notes (2027)

TEAM:
- 185 FTEs
- CEO: Former Genentech VP (ADC experience)
- CSO: Pioneer in ADC field, 200+ publications
- CMO: Limited late-stage experience (concern)

STRATEGIC RATIONALE:
- Fill NSCLC pipeline gap post-pembro LOE
- Acquire differentiated ADC platform
- Leverage commercial oncology infrastructure
- Synergy potential: $100M/year

DUE DILIGENCE QUESTIONS:
1. Scientific validation of HER3 as target in EGFR-resistant NSCLC?
2. Competitive positioning vs Daiichi Sankyo and others?
3. Phase 2b probability of success and Phase 3 design?
4. IP strength and FTO risks?
5. CMC readiness for pivotal and commercial?
6. Integration complexity and key person risk?
7. Recommended deal structure and milestone terms?`
        }
      ],
      outputNodes: [
        {
          id: 'output-ma-recommendation',
          type: 'output',
          label: 'M&A Committee Recommendation'
        }
      ],
      nodes: [
        {
          id: 'science-diligence',
          name: 'Scientific Due Diligence Lead',
          role: 'You are the VP of Research leading scientific diligence. Evaluate: (1) HER3 target validation in EGFR-resistant NSCLC, (2) ADC platform differentiation, (3) payload/linker competitive advantages, (4) preclinical-to-clinical translation. Assign scientific probability of success.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'clinical-diligence',
          name: 'Clinical Due Diligence Lead',
          role: 'You are the SVP of Clinical Development leading clinical diligence. Assess: (1) Phase 1 data quality and interpretation, (2) Phase 2b design adequacy, (3) Phase 3 design recommendations, (4) competitive enrollment feasibility. Consider ADC class safety signals (ILD, hematologic toxicity).',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'regulatory-diligence',
          name: 'Regulatory Due Diligence Lead',
          role: 'You are the VP Regulatory Affairs leading regulatory diligence. Evaluate: (1) Breakthrough Therapy implications, (2) accelerated approval pathway feasibility, (3) FDA/EMA/PMDA alignment strategy, (4) CMC regulatory readiness. Identify regulatory deal-breakers.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'ip-diligence',
          name: 'IP Due Diligence Lead',
          role: 'You are the Chief IP Counsel leading patent diligence. Assess: (1) patent portfolio strength, (2) IPR challenge risk assessment, (3) freedom to operate for commercial manufacture, (4) competitor patent landscape. Quantify IP risk for deal terms.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'cmc-diligence',
          name: 'CMC Due Diligence Lead',
          role: 'You are the SVP of Manufacturing leading CMC diligence. Evaluate: (1) ADC manufacturing complexity, (2) Lonza partnership terms and transferability, (3) capacity constraints for Phase 3/commercial, (4) technology transfer timeline. Flag supply risks.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'commercial-diligence',
          name: 'Commercial Due Diligence Lead',
          role: 'You are the Chief Commercial Officer leading market assessment. Evaluate: (1) addressable market size in EGFR-resistant NSCLC, (2) pricing assumptions and payer landscape, (3) competitive dynamics with patritumab deruxtecan, (4) peak sales potential. Model revenue scenarios.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'financial-diligence',
          name: 'Financial Due Diligence Lead',
          role: 'You are the CFO leading financial diligence. Assess: (1) valuation methodology and deal structure, (2) milestone-based payment feasibility, (3) integration costs, (4) synergy realization timeline. Build NPV model with risk-adjusted scenarios.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'hr-diligence',
          name: 'HR Due Diligence Lead',
          role: 'You are the CHRO leading people diligence. Evaluate: (1) key person risk (CSO, CMO), (2) retention requirements, (3) cultural integration challenges, (4) organizational design post-acquisition. Recommend retention packages.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'risk-assessment',
          name: 'Enterprise Risk Lead',
          role: 'You are the Chief Risk Officer. Aggregate all diligence findings into: (1) risk register with probability and impact, (2) deal-breaker identification, (3) risk mitigation through deal structure, (4) integration risk assessment. Be the voice of caution.',
          behaviorPreset: 'adversarial',
          temperature: 0.7,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'deal-committee-chair',
          name: 'M&A Committee Chair',
          role: 'You are the CEO chairing the M&A Committee. Synthesize all diligence into: (1) GO/NO-GO/CONDITIONAL recommendation, (2) proposed deal structure and terms, (3) required representations and warranties, (4) post-close integration priorities. Make the recommendation to the Board.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: true,
          suspicionLevel: 'suspicious',
          rogueMode: { enabled: false }
        }
      ],
      edges: [
        // Input to all diligence streams
        { id: 'e-in-1', source: 'input-target-company', target: 'science-diligence', relationshipType: 'informs' },
        { id: 'e-in-2', source: 'input-target-company', target: 'clinical-diligence', relationshipType: 'informs' },
        { id: 'e-in-3', source: 'input-target-company', target: 'regulatory-diligence', relationshipType: 'informs' },
        { id: 'e-in-4', source: 'input-target-company', target: 'ip-diligence', relationshipType: 'informs' },
        { id: 'e-in-5', source: 'input-target-company', target: 'cmc-diligence', relationshipType: 'informs' },
        { id: 'e-in-6', source: 'input-target-company', target: 'commercial-diligence', relationshipType: 'informs' },
        { id: 'e-in-7', source: 'input-target-company', target: 'financial-diligence', relationshipType: 'informs' },
        { id: 'e-in-8', source: 'input-target-company', target: 'hr-diligence', relationshipType: 'informs' },
        // Cross-stream dependencies
        { id: 'e-cross-1', source: 'science-diligence', target: 'clinical-diligence', relationshipType: 'validates' },
        { id: 'e-cross-2', source: 'clinical-diligence', target: 'commercial-diligence', relationshipType: 'informs' },
        { id: 'e-cross-3', source: 'commercial-diligence', target: 'financial-diligence', relationshipType: 'informs' },
        { id: 'e-cross-4', source: 'ip-diligence', target: 'financial-diligence', relationshipType: 'informs' },
        // All feed into risk assessment
        { id: 'e-risk-1', source: 'science-diligence', target: 'risk-assessment', relationshipType: 'reports-to' },
        { id: 'e-risk-2', source: 'clinical-diligence', target: 'risk-assessment', relationshipType: 'reports-to' },
        { id: 'e-risk-3', source: 'ip-diligence', target: 'risk-assessment', relationshipType: 'reports-to' },
        { id: 'e-risk-4', source: 'cmc-diligence', target: 'risk-assessment', relationshipType: 'reports-to' },
        // All to chair
        { id: 'e-chair-1', source: 'regulatory-diligence', target: 'deal-committee-chair', relationshipType: 'reports-to' },
        { id: 'e-chair-2', source: 'commercial-diligence', target: 'deal-committee-chair', relationshipType: 'reports-to' },
        { id: 'e-chair-3', source: 'financial-diligence', target: 'deal-committee-chair', relationshipType: 'reports-to' },
        { id: 'e-chair-4', source: 'hr-diligence', target: 'deal-committee-chair', relationshipType: 'reports-to' },
        { id: 'e-chair-5', source: 'risk-assessment', target: 'deal-committee-chair', relationshipType: 'critiques' },
        { id: 'e-out', source: 'deal-committee-chair', target: 'output-ma-recommendation', relationshipType: 'informs' }
      ]
    }
  },

  // ============================================
  // SCENARIO 3: PANDEMIC RESPONSE (11 Agents)
  // ============================================
  {
    id: 'pandemic-response',
    name: 'Pandemic Response',
    description: '11-agent rapid response team for emerging infectious disease vaccine development',
    category: 'regulatory',
    topology: {
      name: 'Pandemic Vaccine Rapid Assessment',
      description: 'Emergency evaluation of vaccine candidates for novel respiratory pathogen',
      inputNodes: [
        {
          id: 'input-pandemic',
          type: 'input',
          task: `PANDEMIC RESPONSE - PRIORITY ALPHA

SITUATION REPORT:
Novel respiratory pathogen identified - designated SARS-CoV-4
- First cases: Southeast Asia, Day 0 (6 weeks ago)
- Current global cases: ~85,000 confirmed
- CFR: Estimated 1.8-2.5% (higher in elderly)
- R0: Estimated 3.2-4.1
- WHO: PHEIC declared Day 21
- FDA: Emergency preparedness activated

PATHOGEN CHARACTERISTICS:
- Family: Betacoronavirus
- Genome: 85% identity to SARS-CoV-2
- Spike protein: Significant mutations in RBD (12 substitutions)
- ACE2 binding: Confirmed but altered affinity
- Immune evasion: Substantial escape from SARS-CoV-2 immunity
- Current vaccines: <20% efficacy expected based on pseudovirus data

COMPANY ASSETS TO EVALUATE:

CANDIDATE 1: mRNA-SC4 (mRNA platform)
- Design: Spike protein, nucleoside-modified
- Timeline to clinic: 45 days (platform validated)
- Manufacturing: 100M doses/month capacity (established)
- Prior experience: COVID-19 vaccine approved
- Early data: Strong neutralizing titers in mice (Day 28)

CANDIDATE 2: Ad26-SC4 (Viral vector)
- Design: Adenovirus 26, full spike
- Timeline to clinic: 75 days (requires new vector production)
- Manufacturing: 50M doses/month capacity
- Prior experience: COVID-19 and Ebola vaccines
- Early data: Not yet available

CANDIDATE 3: SC4-RBD (Protein subunit)
- Design: Recombinant RBD with AS03 adjuvant
- Timeline to clinic: 90 days (adjuvant available)
- Manufacturing: 30M doses/month (scale-up needed)
- Prior experience: Influenza vaccines
- Early data: Manufacturing in progress

REGULATORY LANDSCAPE:
- FDA: Emergency IND pathway available
- EMA: PRIME for pandemic response
- WHO: EUL prequalification track
- Coalition engagement: CEPI funding available ($200M)

STRATEGIC QUESTIONS:
1. Which candidate(s) should advance first?
2. What is the optimal Phase 1/2/3 strategy for speed?
3. How to balance speed vs. safety given pandemic urgency?
4. Manufacturing scale-up priorities?
5. Global access and pricing considerations?
6. Combination/booster strategy with existing COVID vaccines?
7. Variant monitoring and adaptation strategy?

TIMELINE PRESSURE:
First vaccine doses needed in 6-8 months
Full-scale deployment needed in 12-18 months`
        }
      ],
      outputNodes: [
        {
          id: 'output-pandemic-strategy',
          type: 'output',
          label: 'Pandemic Response Strategy'
        }
      ],
      nodes: [
        {
          id: 'virology-lead',
          name: 'Chief Virologist',
          role: 'You are the Chief Virologist and infectious disease expert. Assess: (1) SARS-CoV-4 pathogenesis and transmissibility, (2) immune correlates of protection, (3) antigenic stability and variant risk, (4) cross-protection potential. Predict viral evolution trajectory.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'vaccine-science',
          name: 'Vaccine Science Lead',
          role: 'You are the VP of Vaccine Research. Compare the three candidates: (1) immunogenicity predictions, (2) durability of response, (3) manufacturing complexity, (4) safety profile expectations. Recommend lead and backup candidates with scientific rationale.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'clinical-design',
          name: 'Clinical Development Lead',
          role: 'You are the SVP Clinical Development for infectious disease. Design: (1) adaptive Phase 1/2/3 master protocol, (2) immune bridging strategy, (3) interim analysis plan for EUA, (4) safety monitoring approach for accelerated timeline. Consider Operation Warp Speed lessons.',
          behaviorPreset: 'analytical',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'safety-vigilance',
          name: 'Vaccine Safety Lead',
          role: 'You are the Chief Safety Officer for vaccines. Address: (1) accelerated safety database requirements, (2) active surveillance plan, (3) VAERS integration, (4) risk communication strategy. Balance urgency with safety rigor - what are non-negotiable safety requirements?',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'manufacturing-lead',
          name: 'Manufacturing Strategy Lead',
          role: 'You are the SVP of Global Manufacturing. Assess: (1) at-risk manufacturing decisions, (2) capacity allocation across candidates, (3) fill-finish bottlenecks, (4) cold chain requirements. Build manufacturing timeline synchronized with clinical milestones.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'regulatory-emergency',
          name: 'Emergency Regulatory Lead',
          role: 'You are the VP Regulatory Affairs specializing in emergency pathways. Navigate: (1) EUA requirements and timeline, (2) rolling submission strategy, (3) WHO EUL prequalification, (4) global regulatory harmonization. Define minimum viable regulatory package.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'global-access',
          name: 'Global Access Lead',
          role: 'You are the VP of Global Health and Access. Address: (1) COVAX/Gavi allocation, (2) tiered pricing strategy, (3) technology transfer to LMICs, (4) manufacturing partnerships. Ensure equitable access while maintaining commercial viability.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'government-affairs',
          name: 'Government Affairs Lead',
          role: 'You are the VP of Government Affairs. Coordinate: (1) BARDA/CEPI funding negotiations, (2) liability protection (PREP Act), (3) government pre-purchase agreements, (4) strategic stockpile considerations. Secure public-private partnership terms.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'communications-lead',
          name: 'Communications Lead',
          role: 'You are the Chief Communications Officer. Develop: (1) public messaging on vaccine safety, (2) misinformation response strategy, (3) transparency in accelerated development, (4) healthcare provider education. Address vaccine hesitancy proactively.',
          behaviorPreset: 'creative',
          temperature: 0.7,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'ethics-advisor',
          name: 'Bioethics Advisor',
          role: 'You are the Bioethics Advisor to the pandemic response. Evaluate: (1) ethics of accelerated timelines, (2) challenge trial considerations, (3) placebo use during pandemic, (4) priority population selection. Ensure ethical framework guides all decisions.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'pandemic-commander',
          name: 'Pandemic Response Commander',
          role: 'You are the Chief Scientific Officer leading the pandemic response. Integrate all inputs into: (1) candidate prioritization and go/no-go decisions, (2) integrated development timeline, (3) resource allocation, (4) risk-benefit framework. Present unified strategy to Executive Committee and Board.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: true,
          suspicionLevel: 'suspicious',
          rogueMode: { enabled: false }
        }
      ],
      edges: [
        // Input to response team
        { id: 'e-in-1', source: 'input-pandemic', target: 'virology-lead', relationshipType: 'informs' },
        { id: 'e-in-2', source: 'input-pandemic', target: 'vaccine-science', relationshipType: 'informs' },
        { id: 'e-in-3', source: 'input-pandemic', target: 'clinical-design', relationshipType: 'informs' },
        { id: 'e-in-4', source: 'input-pandemic', target: 'safety-vigilance', relationshipType: 'informs' },
        { id: 'e-in-5', source: 'input-pandemic', target: 'manufacturing-lead', relationshipType: 'informs' },
        { id: 'e-in-6', source: 'input-pandemic', target: 'regulatory-emergency', relationshipType: 'informs' },
        { id: 'e-in-7', source: 'input-pandemic', target: 'global-access', relationshipType: 'informs' },
        { id: 'e-in-8', source: 'input-pandemic', target: 'government-affairs', relationshipType: 'informs' },
        { id: 'e-in-9', source: 'input-pandemic', target: 'ethics-advisor', relationshipType: 'informs' },
        // Scientific chain
        { id: 'e-sci-1', source: 'virology-lead', target: 'vaccine-science', relationshipType: 'informs' },
        { id: 'e-sci-2', source: 'vaccine-science', target: 'clinical-design', relationshipType: 'informs' },
        { id: 'e-sci-3', source: 'vaccine-science', target: 'manufacturing-lead', relationshipType: 'collaborates' },
        { id: 'e-sci-4', source: 'clinical-design', target: 'safety-vigilance', relationshipType: 'validates' },
        { id: 'e-sci-5', source: 'clinical-design', target: 'regulatory-emergency', relationshipType: 'collaborates' },
        // External relations
        { id: 'e-ext-1', source: 'global-access', target: 'government-affairs', relationshipType: 'collaborates' },
        { id: 'e-ext-2', source: 'communications-lead', target: 'global-access', relationshipType: 'collaborates' },
        // Ethics review
        { id: 'e-eth-1', source: 'ethics-advisor', target: 'clinical-design', relationshipType: 'critiques' },
        // All to commander
        { id: 'e-cmd-1', source: 'virology-lead', target: 'pandemic-commander', relationshipType: 'reports-to' },
        { id: 'e-cmd-2', source: 'vaccine-science', target: 'pandemic-commander', relationshipType: 'reports-to' },
        { id: 'e-cmd-3', source: 'clinical-design', target: 'pandemic-commander', relationshipType: 'reports-to' },
        { id: 'e-cmd-4', source: 'safety-vigilance', target: 'pandemic-commander', relationshipType: 'reports-to' },
        { id: 'e-cmd-5', source: 'manufacturing-lead', target: 'pandemic-commander', relationshipType: 'reports-to' },
        { id: 'e-cmd-6', source: 'regulatory-emergency', target: 'pandemic-commander', relationshipType: 'reports-to' },
        { id: 'e-cmd-7', source: 'ethics-advisor', target: 'pandemic-commander', relationshipType: 'critiques' },
        { id: 'e-out', source: 'pandemic-commander', target: 'output-pandemic-strategy', relationshipType: 'informs' }
      ]
    }
  },

  // ============================================
  // SCENARIO 4: COMPETITIVE INTELLIGENCE (9 Agents)
  // ============================================
  {
    id: 'competitive-intelligence',
    name: 'Competitive Intelligence Analysis',
    description: '9-agent analysis of competitor Phase 3 data release with strategic implications',
    category: 'strategy',
    topology: {
      name: 'Competitor Data Assessment',
      description: 'Urgent analysis of competitor\'s Phase 3 readout in shared indication',
      inputNodes: [
        {
          id: 'input-competitor-data',
          type: 'input',
          task: `COMPETITIVE INTELLIGENCE ALERT - URGENT

COMPETITOR: Nexagen Pharmaceuticals
ASSET: NXG-401 (oral GLP-1/GIP dual agonist)
EVENT: Phase 3 ACHIEVE-1 topline results released (today, 6 AM EST)
INDICATION: Type 2 diabetes with obesity

OUR COMPETING ASSET: GLX-2050 (Phase 2b complete, Phase 3 starting Q2)
STRATEGIC CONCERN: NXG-401 is 18 months ahead in development

ACHIEVE-1 TRIAL DESIGN (from ClinicalTrials.gov):
- N=1,850, 68-week treatment
- Arms: NXG-401 low dose, high dose, placebo
- Population: T2D, BMI 27-45, HbA1c 7.0-10.5%
- Primary: HbA1c change at Week 52
- Key secondary: Body weight change, % achieving HbA1c <7%

TOPLINE RESULTS ANNOUNCED (Press Release):
- HbA1c reduction: -2.1% (high dose) vs -0.3% placebo (p<0.001)
- Body weight reduction: -15.2% (high dose) vs -2.1% placebo
- 78% achieved HbA1c <7% (high dose) vs 15% placebo
- GI tolerability: Nausea 28%, vomiting 12%, discontinuation 8%
- CV safety: No signal, MACE+ pending in dedicated CVOT
- Liver safety: "Clean" - no DILI signals

MARKET CONTEXT:
- Tirzepatide (Lilly): Market leader, ~$12B revenue projected
- Semaglutide (Novo): Strong oral and injectable franchise
- Market size: $50B+ obesity/diabetes by 2030
- Our GLX-2050 differentiation: Once-weekly oral, liver-targeted

IMMEDIATE QUESTIONS:
1. How do NXG-401 results compare to tirzepatide and semaglutide?
2. What does this mean for our GLX-2050 competitive positioning?
3. Should we modify our Phase 3 program design?
4. How will this affect investor/analyst perception of GLX-2050?
5. What is Nexagen's likely regulatory and commercial timeline?
6. Strategic options: Continue, accelerate, de-prioritize, or partner?

RESPONSE TIMELINE: Board briefing required in 48 hours`
        }
      ],
      outputNodes: [
        {
          id: 'output-ci-strategy',
          type: 'output',
          label: 'Competitive Response Strategy'
        }
      ],
      nodes: [
        {
          id: 'ci-analyst',
          name: 'Competitive Intelligence Lead',
          role: 'You are the Director of Competitive Intelligence. Analyze NXG-401 data: (1) head-to-head comparison vs tirzepatide/semaglutide, (2) interpret "topline" limitations and what data is missing, (3) predict full data at medical congress, (4) timeline to FDA filing. Provide objective competitor assessment.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'medical-analyst',
          name: 'Medical Affairs Director',
          role: 'You are the Medical Affairs Director for metabolic diseases. Evaluate: (1) clinical meaningfulness of efficacy results, (2) GI tolerability relative to class, (3) missing safety data concerns, (4) target patient population. How will endocrinologists react to these data?',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'clinical-strategy',
          name: 'Clinical Strategy Lead',
          role: 'You are the VP of Clinical Development. Assess implications for GLX-2050: (1) is our Phase 3 design still adequate, (2) endpoint selection reconsideration, (3) comparator arm strategy, (4) differentiation through liver endpoints. Recommend protocol modifications if needed.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'commercial-strategy',
          name: 'Commercial Strategy Lead',
          role: 'You are the VP of Commercial Strategy. Model impact on GLX-2050: (1) launch timing implications (will we be 4th or 5th to market?), (2) pricing/reimbursement in crowded market, (3) positioning strategy against NXG-401, (4) peak sales revision. Is the commercial case still viable?',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'investor-relations',
          name: 'Investor Relations Lead',
          role: 'You are the VP of Investor Relations. Anticipate: (1) analyst questions on tomorrow\'s call, (2) stock price impact (ours and competitor), (3) messaging on GLX-2050 differentiation, (4) guidance implications. Prepare talking points for CEO.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'bd-strategy',
          name: 'Business Development Lead',
          role: 'You are the VP of Business Development. Evaluate strategic options: (1) partnership or out-licensing for GLX-2050, (2) in-licensing opportunities for differentiation, (3) M&A considerations (acquire or be acquired?), (4) collaboration with NXG competitors. What deals should we explore?',
          behaviorPreset: 'creative',
          temperature: 0.7,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'portfolio-strategist',
          name: 'Portfolio Strategy Lead',
          role: 'You are the VP of Portfolio Strategy. Consider: (1) GLX-2050 NPV revision given new competitive data, (2) resource reallocation options, (3) alternative indications (NASH?), (4) pipeline prioritization impact. Should resources shift to other programs?',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'devils-advocate',
          name: 'Strategic Challenger',
          role: 'You are a senior advisor playing devil\'s advocate. Challenge: (1) are we overreacting to one competitor readout? (2) what are NXG-401 vulnerabilities not being discussed? (3) are we underestimating GLX-2050 differentiation? Provide contrarian perspective to avoid groupthink.',
          behaviorPreset: 'adversarial',
          temperature: 0.8,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: true, profile: 'contradiction' }
        },
        {
          id: 'cso-synthesis',
          name: 'Chief Strategy Officer',
          role: 'You are the Chief Strategy Officer presenting to the Board. Synthesize all analyses into: (1) competitive landscape reassessment, (2) GLX-2050 program recommendation (continue/modify/stop), (3) strategic pivots if needed, (4) communication strategy (internal and external). Make a decisive recommendation.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: true,
          suspicionLevel: 'suspicious',
          rogueMode: { enabled: false }
        }
      ],
      edges: [
        // Input to all analysts
        { id: 'e-in-1', source: 'input-competitor-data', target: 'ci-analyst', relationshipType: 'informs' },
        { id: 'e-in-2', source: 'input-competitor-data', target: 'medical-analyst', relationshipType: 'informs' },
        { id: 'e-in-3', source: 'input-competitor-data', target: 'clinical-strategy', relationshipType: 'informs' },
        { id: 'e-in-4', source: 'input-competitor-data', target: 'commercial-strategy', relationshipType: 'informs' },
        { id: 'e-in-5', source: 'input-competitor-data', target: 'investor-relations', relationshipType: 'informs' },
        { id: 'e-in-6', source: 'input-competitor-data', target: 'bd-strategy', relationshipType: 'informs' },
        { id: 'e-in-7', source: 'input-competitor-data', target: 'portfolio-strategist', relationshipType: 'informs' },
        // CI feeds medical and commercial
        { id: 'e-flow-1', source: 'ci-analyst', target: 'medical-analyst', relationshipType: 'informs' },
        { id: 'e-flow-2', source: 'ci-analyst', target: 'commercial-strategy', relationshipType: 'informs' },
        // Medical informs clinical
        { id: 'e-flow-3', source: 'medical-analyst', target: 'clinical-strategy', relationshipType: 'validates' },
        // Commercial informs BD and portfolio
        { id: 'e-flow-4', source: 'commercial-strategy', target: 'bd-strategy', relationshipType: 'collaborates' },
        { id: 'e-flow-5', source: 'commercial-strategy', target: 'portfolio-strategist', relationshipType: 'informs' },
        { id: 'e-flow-6', source: 'commercial-strategy', target: 'investor-relations', relationshipType: 'informs' },
        // Devil's advocate challenges all
        { id: 'e-da-1', source: 'devils-advocate', target: 'clinical-strategy', relationshipType: 'critiques' },
        { id: 'e-da-2', source: 'devils-advocate', target: 'commercial-strategy', relationshipType: 'critiques' },
        // All to CSO
        { id: 'e-cso-1', source: 'ci-analyst', target: 'cso-synthesis', relationshipType: 'reports-to' },
        { id: 'e-cso-2', source: 'clinical-strategy', target: 'cso-synthesis', relationshipType: 'reports-to' },
        { id: 'e-cso-3', source: 'commercial-strategy', target: 'cso-synthesis', relationshipType: 'reports-to' },
        { id: 'e-cso-4', source: 'bd-strategy', target: 'cso-synthesis', relationshipType: 'reports-to' },
        { id: 'e-cso-5', source: 'portfolio-strategist', target: 'cso-synthesis', relationshipType: 'reports-to' },
        { id: 'e-cso-6', source: 'investor-relations', target: 'cso-synthesis', relationshipType: 'reports-to' },
        { id: 'e-cso-7', source: 'devils-advocate', target: 'cso-synthesis', relationshipType: 'critiques' },
        { id: 'e-out', source: 'cso-synthesis', target: 'output-ci-strategy', relationshipType: 'informs' }
      ]
    }
  },

  // ============================================
  // SCENARIO 5: CLINICAL TRIAL DESIGN (4 Agents - Simple)
  // ============================================
  {
    id: 'clinical-trial-design',
    name: 'Clinical Trial Protocol Review',
    description: 'Streamlined 4-agent review of Phase III oncology trial protocol',
    category: 'clinical',
    topology: {
      name: 'Clinical Trial Design Review',
      description: 'Protocol review for immuno-oncology combination therapy',
      inputNodes: [
        {
          id: 'input-protocol',
          type: 'input',
          task: `PROTOCOL REVIEW: ONCO-2024-301

COMPOUND: Pembrolizumab + ABC-2847 (novel LAG-3 inhibitor)
INDICATION: First-line metastatic NSCLC
PHASE: Phase III, randomized, double-blind

DESIGN:
- Arms: Pembro + ABC-2847 vs Pembro + Placebo (1:1)
- N=650, stratified by PD-L1 status, ECOG, histology
- Primary: PFS (RECIST 1.1)
- Key secondary: OS, ORR, DOR

STATISTICAL PLAN:
- Median PFS control: 8.5 months
- HR: 0.70, Alpha: 0.025 (one-sided), Power: 85%
- Two interim analyses (O'Brien-Fleming)

KEY QUESTIONS:
1. Is design adequate for clinical benefit demonstration?
2. Are statistical assumptions justified?
3. What regulatory risks need addressing?
4. Critical protocol amendments needed?`
        }
      ],
      outputNodes: [
        {
          id: 'output-recommendation',
          type: 'output',
          label: 'Protocol Review Decision'
        }
      ],
      nodes: [
        {
          id: 'medical-expert',
          name: 'Oncology Medical Director',
          role: 'Review protocol for medical/scientific rationale, patient population, endpoint selection, and safety monitoring. Reference KEYNOTE/CheckMate precedents.',
          behaviorPreset: 'analytical',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'regulatory-expert',
          name: 'Regulatory Strategy Lead',
          role: 'Assess FDA/EMA alignment, accelerated approval feasibility, label implications. Consider recent ODAC outcomes.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'statistician',
          name: 'Biostatistics Director',
          role: 'Evaluate sample size, interim strategy, multiplicity control, ICH E9(R1) alignment. Provide specific recommendations.',
          behaviorPreset: 'analytical',
          temperature: 0.4,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'oversight',
          name: 'Clinical Development Head',
          role: 'Synthesize inputs. Provide GO/NO-GO/CONDITIONAL recommendation with prioritized actions and risk assessment.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: true,
          suspicionLevel: 'suspicious',
          rogueMode: { enabled: false }
        }
      ],
      edges: [
        { id: 'e-in-1', source: 'input-protocol', target: 'medical-expert', relationshipType: 'informs' },
        { id: 'e-in-2', source: 'input-protocol', target: 'regulatory-expert', relationshipType: 'informs' },
        { id: 'e-in-3', source: 'input-protocol', target: 'statistician', relationshipType: 'informs' },
        { id: 'e1', source: 'medical-expert', target: 'oversight', relationshipType: 'reports-to' },
        { id: 'e2', source: 'regulatory-expert', target: 'oversight', relationshipType: 'reports-to' },
        { id: 'e3', source: 'statistician', target: 'oversight', relationshipType: 'reports-to' },
        { id: 'e-cross', source: 'statistician', target: 'regulatory-expert', relationshipType: 'validates' },
        { id: 'e-out', source: 'oversight', target: 'output-recommendation', relationshipType: 'informs' }
      ]
    }
  },

  // ============================================
  // SCENARIO 6: SAFETY SIGNAL ASSESSMENT (5 Agents)
  // ============================================
  {
    id: 'safety-signal-assessment',
    name: 'Safety Signal Assessment',
    description: '5-agent pharmacovigilance evaluation with causality and benefit-risk analysis',
    category: 'clinical',
    topology: {
      name: 'Post-Marketing Safety Evaluation',
      description: 'Multi-disciplinary safety signal assessment for marketed drug',
      inputNodes: [
        {
          id: 'input-safety-signal',
          type: 'input',
          task: `SAFETY SIGNAL EVALUATION - CONFIDENTIAL

PRODUCT: CARDIOZOLE (Zolepatril tablets)
INDICATION: Hypertension (4 years on market)
EXPOSURE: ~2.4 million patient-years

SIGNAL: Drug-induced liver injury (DILI)
- Total cases: 89 | Serious: 67 | Fatal: 2
- Reporting rate: 3.7 vs background 1.0-1.5 per 100K patient-years
- PRR: 4.2, ROR: 4.8, IC025: 1.89
- Median onset: 68 days, 80% within 6 months
- Positive dechallenge: 71%, Rechallenge: 3/4 positive

CONFOUNDERS: Alcohol 22%, Statins 45%, NAFLD 18%, Age>65 56%

REGULATORY: FDA safety update in 30 days, EMA PRAC review ongoing

REQUIRED: Causality (RUCAM), risk characterization, B-R evaluation, regulatory recommendations`
        }
      ],
      outputNodes: [
        {
          id: 'output-safety-decision',
          type: 'output',
          label: 'Safety Committee Recommendation'
        }
      ],
      nodes: [
        {
          id: 'safety-scientist',
          name: 'Drug Safety Physician',
          role: 'Perform RUCAM causality assessment. Evaluate temporal relationships, dechallenge/rechallenge, alternative causes. Assign WHO-UMC causality categories.',
          behaviorPreset: 'analytical',
          temperature: 0.4,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'epidemiologist',
          name: 'Pharmacoepidemiologist',
          role: 'Analyze reporting rates, disproportionality metrics, confounders, potential biases. Recommend additional epidemiological studies.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'devils-advocate',
          name: 'Critical Reviewer',
          role: 'Stress-test the evaluation. Challenge: Are we underestimating? What about under-reporting? Worst-case scenario? Would this survive regulatory scrutiny?',
          behaviorPreset: 'adversarial',
          temperature: 0.8,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: true, profile: 'contradiction' }
        },
        {
          id: 'benefit-risk',
          name: 'Benefit-Risk Analyst',
          role: 'Evaluate using PrOACT-URL/FDA BRF: therapeutic context, alternatives, severity/reversibility, population benefit, quantitative B-R balance.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'cso',
          name: 'Chief Safety Officer',
          role: 'Integrate assessments. Provide: causality conclusion, regulatory actions (labeling, DHCP, REMS), risk minimization, communication strategy. Clear, defensible recommendation.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: true,
          suspicionLevel: 'suspicious',
          rogueMode: { enabled: false }
        }
      ],
      edges: [
        { id: 'e-in-1', source: 'input-safety-signal', target: 'safety-scientist', relationshipType: 'informs' },
        { id: 'e-in-2', source: 'input-safety-signal', target: 'epidemiologist', relationshipType: 'informs' },
        { id: 'e-in-3', source: 'input-safety-signal', target: 'benefit-risk', relationshipType: 'informs' },
        { id: 'e1', source: 'safety-scientist', target: 'devils-advocate', relationshipType: 'informs' },
        { id: 'e2', source: 'epidemiologist', target: 'devils-advocate', relationshipType: 'informs' },
        { id: 'e3', source: 'safety-scientist', target: 'cso', relationshipType: 'reports-to' },
        { id: 'e4', source: 'epidemiologist', target: 'cso', relationshipType: 'reports-to' },
        { id: 'e5', source: 'devils-advocate', target: 'cso', relationshipType: 'critiques' },
        { id: 'e6', source: 'benefit-risk', target: 'cso', relationshipType: 'reports-to' },
        { id: 'e-out', source: 'cso', target: 'output-safety-decision', relationshipType: 'informs' }
      ]
    }
  },

  // ============================================
  // SCENARIO 7: REAL WORLD EVIDENCE STRATEGY (8 Agents)
  // ============================================
  {
    id: 'rwe-strategy',
    name: 'Real World Evidence Strategy',
    description: '8-agent team designing RWE program for label expansion and HTA support',
    category: 'evidence',
    topology: {
      name: 'RWE Program Design',
      description: 'Comprehensive RWE strategy for post-approval evidence generation',
      inputNodes: [
        {
          id: 'input-rwe-request',
          type: 'input',
          task: `RWE STRATEGY REQUEST

PRODUCT: FIBROZYME (Respaglitazar)
INDICATION: Idiopathic Pulmonary Fibrosis (IPF)
STATUS: Approved 2 years ago based on FVC decline

CURRENT LABEL:
- Slowing of FVC decline vs placebo (Phase 3: -120 mL/year vs -240 mL/year)
- No mortality benefit demonstrated (trial underpowered)
- All-severity IPF, no biomarker restriction

COMMERCIAL CHALLENGES:
- Payer resistance: "Show me mortality benefit"
- HTA negative in UK, Germany pending
- Market share: 25% (below 40% target)
- Competitor (Ofev/Esbriet) have longer track record

RWE OBJECTIVES:
1. Generate mortality evidence for label update
2. Support HTA resubmissions (NICE, G-BA)
3. Identify responder subpopulations
4. Compare effectiveness to competitors
5. Long-term safety characterization

DATA ASSETS AVAILABLE:
- Optum claims database (US, n~15K IPF patients)
- IQVIA RWD (Europe, n~8K)
- UK CPRD (n~3K)
- Company patient registry (n=2,400 on-drug, ongoing)
- Academic consortium partnership available

BUDGET: $8M over 3 years
TIMELINE: Initial results needed for NICE resubmission (18 months)

QUESTIONS:
1. What RWE studies should we prioritize?
2. Which data sources are optimal for each objective?
3. How to address confounding in observational analyses?
4. Regulatory strategy for label expansion with RWE?
5. Publication and communication plan?`
        }
      ],
      outputNodes: [
        {
          id: 'output-rwe-plan',
          type: 'output',
          label: 'RWE Strategic Plan'
        }
      ],
      nodes: [
        {
          id: 'rwe-science-lead',
          name: 'RWE Science Director',
          role: 'You are the Director of RWE Science. Design the RWE program: (1) study prioritization against objectives, (2) fit-for-purpose data source selection, (3) methodological approach for each study, (4) causal inference framework. Ensure scientific rigor meets regulatory/HTA standards.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'epidemiology-lead',
          name: 'Epidemiology Director',
          role: 'You are the Director of Epidemiology specializing in respiratory diseases. Address: (1) confounding in IPF comparative effectiveness, (2) propensity score methodology, (3) immortal time bias mitigation, (4) target trial emulation design. Define analytical specifications.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'heor-lead',
          name: 'HEOR Director',
          role: 'You are the VP of Health Economics. Design studies for HTA: (1) NICE Evidence Standards Framework compliance, (2) comparative effectiveness for G-BA, (3) economic modeling inputs from RWE, (4) PRO and quality of life data collection. Optimize for HTA success.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'regulatory-rwe',
          name: 'Regulatory Affairs RWE Lead',
          role: 'You are the RWE Regulatory Lead. Navigate: (1) FDA RWE guidance compliance, (2) EMA DARWIN-EU considerations, (3) label expansion with RWE precedents, (4) study protocol FDA/EMA interactions. What\'s the regulatory pathway for mortality claim?',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'data-partnerships',
          name: 'Data Partnerships Lead',
          role: 'You are the Data Partnerships Director. Evaluate: (1) data source quality for each objective, (2) licensing and governance requirements, (3) academic collaboration structure, (4) registry enhancement opportunities. Build optimal data access strategy.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'medical-affairs-rwe',
          name: 'Medical Affairs Lead',
          role: 'You are the VP Medical Affairs for pulmonology. Plan: (1) KOL engagement in RWE, (2) publication strategy and venues, (3) congress presentation timeline, (4) medical education integration. Ensure scientific credibility.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'commercial-insight',
          name: 'Commercial Insights Lead',
          role: 'You are the Director of Commercial Insights. Connect RWE to commercial needs: (1) payer evidence requirements, (2) market access messaging, (3) competitive differentiation, (4) segmentation insights. Translate RWE to commercial value.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'rwe-program-lead',
          name: 'RWE Program Director',
          role: 'You are the Global RWE Head. Synthesize all inputs into: (1) prioritized RWE roadmap, (2) budget allocation across studies, (3) governance and decision points, (4) integrated evidence plan. Present comprehensive strategy to Commercial and Medical leadership.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: true,
          suspicionLevel: 'trusting',
          rogueMode: { enabled: false }
        }
      ],
      edges: [
        { id: 'e-in-1', source: 'input-rwe-request', target: 'rwe-science-lead', relationshipType: 'informs' },
        { id: 'e-in-2', source: 'input-rwe-request', target: 'epidemiology-lead', relationshipType: 'informs' },
        { id: 'e-in-3', source: 'input-rwe-request', target: 'heor-lead', relationshipType: 'informs' },
        { id: 'e-in-4', source: 'input-rwe-request', target: 'regulatory-rwe', relationshipType: 'informs' },
        { id: 'e-in-5', source: 'input-rwe-request', target: 'data-partnerships', relationshipType: 'informs' },
        { id: 'e-in-6', source: 'input-rwe-request', target: 'medical-affairs-rwe', relationshipType: 'informs' },
        { id: 'e-in-7', source: 'input-rwe-request', target: 'commercial-insight', relationshipType: 'informs' },
        // Science/methods collaboration
        { id: 'e-sci-1', source: 'rwe-science-lead', target: 'epidemiology-lead', relationshipType: 'collaborates' },
        { id: 'e-sci-2', source: 'epidemiology-lead', target: 'heor-lead', relationshipType: 'validates' },
        { id: 'e-sci-3', source: 'rwe-science-lead', target: 'regulatory-rwe', relationshipType: 'collaborates' },
        { id: 'e-sci-4', source: 'data-partnerships', target: 'rwe-science-lead', relationshipType: 'informs' },
        // Commercial alignment
        { id: 'e-com-1', source: 'heor-lead', target: 'commercial-insight', relationshipType: 'informs' },
        { id: 'e-com-2', source: 'medical-affairs-rwe', target: 'commercial-insight', relationshipType: 'collaborates' },
        // All to program lead
        { id: 'e-pl-1', source: 'rwe-science-lead', target: 'rwe-program-lead', relationshipType: 'reports-to' },
        { id: 'e-pl-2', source: 'epidemiology-lead', target: 'rwe-program-lead', relationshipType: 'reports-to' },
        { id: 'e-pl-3', source: 'heor-lead', target: 'rwe-program-lead', relationshipType: 'reports-to' },
        { id: 'e-pl-4', source: 'regulatory-rwe', target: 'rwe-program-lead', relationshipType: 'reports-to' },
        { id: 'e-pl-5', source: 'data-partnerships', target: 'rwe-program-lead', relationshipType: 'reports-to' },
        { id: 'e-pl-6', source: 'medical-affairs-rwe', target: 'rwe-program-lead', relationshipType: 'reports-to' },
        { id: 'e-pl-7', source: 'commercial-insight', target: 'rwe-program-lead', relationshipType: 'reports-to' },
        { id: 'e-out', source: 'rwe-program-lead', target: 'output-rwe-plan', relationshipType: 'informs' }
      ]
    }
  },

  // ============================================
  // SCENARIO 8: MEDICAL WRITING REVIEW (4 Agents - Simple)
  // ============================================
  {
    id: 'medical-writing',
    name: 'Medical Writing Review',
    description: '4-agent CSR review workflow with QC and regulatory alignment',
    category: 'documentation',
    topology: {
      name: 'CSR Review Workflow',
      description: 'Quality review of Phase 2 proof-of-concept study report',
      inputNodes: [
        {
          id: 'input-csr',
          type: 'input',
          task: `CSR REVIEW - QUALITY CHECKPOINT

STUDY: XYZ-202 Phase 2b dose-finding in atopic dermatitis
COMPOUND: XYZ-456 (oral JAK1 inhibitor)

DESIGN: RCT, double-blind, 4 arms (15/30/45mg QD + placebo), N=320, 16 weeks

RESULTS:
- EASI-75: 41%/58%/62% vs 24% placebo (all p<0.05)
- Safety: AEs 52-61% active vs 48% placebo
- SAEs: 3 active (zoster, DVT, pneumonia) vs 1 placebo

STATUS: Draft 1.0 complete, pending medical/regulatory/QC review

OBJECTIVES:
1. Scientific accuracy
2. ICH E3 compliance
3. Cross-section consistency
4. Benefit-risk clarity
5. Submission readiness`
        }
      ],
      outputNodes: [
        {
          id: 'output-review',
          type: 'output',
          label: 'CSR Review Summary'
        }
      ],
      nodes: [
        {
          id: 'medical-reviewer',
          name: 'Medical Monitor',
          role: 'Review for accurate study conduct representation, medical interpretation, safety narrative completeness. Flag discrepancies.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'stats-reviewer',
          name: 'Study Statistician',
          role: 'Review statistical methods accuracy, results correctness, multiplicity handling, sensitivity analyses. Ensure SAP alignment.',
          behaviorPreset: 'analytical',
          temperature: 0.4,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'regulatory-reviewer',
          name: 'Regulatory Medical Writer',
          role: 'Assess ICH E3 compliance, section completeness, cross-references, appendix requirements. JAK inhibitor-specific expectations.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'qc-lead',
          name: 'QC Lead',
          role: 'Final checkpoint. Synthesize reviews: critical findings, recommended revisions, sign-off readiness, timeline risk.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: true,
          suspicionLevel: 'suspicious',
          rogueMode: { enabled: false }
        }
      ],
      edges: [
        { id: 'e-in-1', source: 'input-csr', target: 'medical-reviewer', relationshipType: 'informs' },
        { id: 'e-in-2', source: 'input-csr', target: 'stats-reviewer', relationshipType: 'informs' },
        { id: 'e-in-3', source: 'input-csr', target: 'regulatory-reviewer', relationshipType: 'informs' },
        { id: 'e1', source: 'medical-reviewer', target: 'qc-lead', relationshipType: 'reports-to' },
        { id: 'e2', source: 'stats-reviewer', target: 'qc-lead', relationshipType: 'reports-to' },
        { id: 'e3', source: 'regulatory-reviewer', target: 'qc-lead', relationshipType: 'reports-to' },
        { id: 'e4', source: 'stats-reviewer', target: 'medical-reviewer', relationshipType: 'validates' },
        { id: 'e-out', source: 'qc-lead', target: 'output-review', relationshipType: 'informs' }
      ]
    }
  },

  // ============================================
  // SCENARIO 9: TUMOR BOARD (9 Agents)
  // ============================================
  {
    id: 'tumor-board',
    name: 'Tumor Board',
    description: '9-agent multidisciplinary cancer case review simulating real tumor board meetings',
    category: 'clinical-decisions',
    topology: {
      name: 'Multidisciplinary Tumor Board',
      description: 'Comprehensive cancer case review with treatment recommendation',
      inputNodes: [
        {
          id: 'input-case',
          type: 'input',
          task: `TUMOR BOARD CASE PRESENTATION

PATIENT: 58-year-old female, former smoker (30 pack-years, quit 5 years ago)
CHIEF COMPLAINT: Persistent cough, 15-lb weight loss over 3 months

IMAGING FINDINGS:
- CT Chest: 4.2 cm spiculated mass in right upper lobe
- PET-CT: Intense FDG uptake (SUVmax 12.4) in primary mass
- Mediastinal lymph nodes: Station 4R (1.8 cm, SUV 8.2), Station 7 (2.1 cm, SUV 9.1)
- Brain MRI: No evidence of metastatic disease
- CT Abdomen/Pelvis: No distant metastases

PATHOLOGY:
- CT-guided biopsy: Adenocarcinoma of lung
- PD-L1 TPS: 75%
- Molecular testing:
  - EGFR: Wild-type
  - ALK: Negative
  - ROS1: Negative
  - KRAS G12C: POSITIVE
  - BRAF: Wild-type
  - MET amplification: Negative

STAGING: Clinical Stage IIIA (T2bN2M0) per AJCC 8th edition

PERFORMANCE STATUS: ECOG 1

COMORBIDITIES:
- Hypertension (controlled)
- Type 2 diabetes (HbA1c 7.2%)
- COPD (FEV1 68% predicted)
- No significant cardiac history

PULMONARY FUNCTION:
- FEV1: 2.1 L (68% predicted)
- DLCO: 58% predicted
- VO2 max: 15 mL/kg/min

PREVIOUS TREATMENTS: None - newly diagnosed

QUESTIONS FOR TUMOR BOARD:
1. Is this patient a surgical candidate?
2. If not surgery, what is the optimal treatment approach?
3. Role of neoadjuvant vs definitive chemoradiation?
4. Should KRAS G12C inhibitor be incorporated?
5. What clinical trials should be considered?
6. Palliative care involvement timing?`
        }
      ],
      outputNodes: [
        {
          id: 'output-recommendation',
          type: 'output',
          label: 'Treatment Recommendation'
        }
      ],
      nodes: [
        {
          id: 'medical-oncologist',
          name: 'Medical Oncologist',
          role: 'You are a thoracic medical oncologist. Evaluate systemic therapy options including immunotherapy (high PD-L1), KRAS G12C inhibitors (sotorasib, adagrasib), and chemotherapy combinations. Consider sequencing of therapies and clinical trial options. Address the role of targeted therapy in this KRAS-mutant case.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'thoracic-surgeon',
          name: 'Thoracic Surgeon',
          role: 'You are a thoracic surgeon specializing in lung cancer. Assess surgical candidacy given N2 disease, tumor location, and pulmonary function. Consider lobectomy vs pneumonectomy, mediastinal staging requirements, and role of neoadjuvant therapy before surgery. Address perioperative risk given comorbidities.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'radiation-oncologist',
          name: 'Radiation Oncologist',
          role: 'You are a radiation oncologist. Evaluate role of radiation: definitive chemoradiation for unresectable disease, neoadjuvant/adjuvant RT, or consolidation after systemic therapy. Discuss dose, fractionation, and techniques (IMRT, proton). Consider pulmonary toxicity risk given baseline DLCO.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'pathologist',
          name: 'Pathologist',
          role: 'You are a thoracic pathologist. Review the histopathology, molecular findings, and biomarker status. Clarify PD-L1 scoring methodology, discuss KRAS G12C mutation significance, and recommend any additional testing (TMB, comprehensive genomic profiling). Address tissue adequacy.',
          behaviorPreset: 'analytical',
          temperature: 0.4,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'radiologist',
          name: 'Thoracic Radiologist',
          role: 'You are a thoracic radiologist. Interpret the imaging findings, confirm staging, and assess resectability. Comment on tumor relationship to major structures, lymph node characteristics, and any imaging features that affect treatment planning. Recommend additional imaging if needed.',
          behaviorPreset: 'analytical',
          temperature: 0.4,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'pulmonologist',
          name: 'Pulmonologist',
          role: 'You are a pulmonologist. Evaluate pulmonary function for surgical candidacy and radiation tolerance. Consider COPD management optimization, perioperative risk stratification, and need for additional cardiopulmonary testing. Address post-treatment pulmonary function predictions.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'palliative-care',
          name: 'Palliative Care Specialist',
          role: 'You are a palliative care physician. Assess symptom burden, quality of life considerations, and goals of care. Discuss early palliative care integration benefits, advance care planning, and supportive care needs regardless of treatment choice. Address the weight loss and performance status.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'nurse-navigator',
          name: 'Oncology Nurse Navigator',
          role: 'You are an oncology nurse navigator. Address practical aspects: treatment logistics, patient education needs, social support assessment, and care coordination. Identify barriers to treatment adherence and resources for the patient. Consider clinical trial navigation if applicable.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'tumor-board-chair',
          name: 'Tumor Board Chair',
          role: 'You are the Tumor Board Chair (senior oncologist). Synthesize all specialist inputs into a consensus treatment recommendation. Provide: (1) Primary treatment recommendation with rationale, (2) Alternative approaches if primary not feasible, (3) Clinical trial considerations, (4) Follow-up plan. Ensure recommendation aligns with NCCN guidelines while addressing patient-specific factors.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: true,
          suspicionLevel: 'suspicious',
          rogueMode: { enabled: false }
        }
      ],
      edges: [
        { id: 'e-in-1', source: 'input-case', target: 'medical-oncologist', relationshipType: 'informs' },
        { id: 'e-in-2', source: 'input-case', target: 'thoracic-surgeon', relationshipType: 'informs' },
        { id: 'e-in-3', source: 'input-case', target: 'radiation-oncologist', relationshipType: 'informs' },
        { id: 'e-in-4', source: 'input-case', target: 'pathologist', relationshipType: 'informs' },
        { id: 'e-in-5', source: 'input-case', target: 'radiologist', relationshipType: 'informs' },
        { id: 'e-in-6', source: 'input-case', target: 'pulmonologist', relationshipType: 'informs' },
        { id: 'e-in-7', source: 'input-case', target: 'palliative-care', relationshipType: 'informs' },
        { id: 'e-in-8', source: 'input-case', target: 'nurse-navigator', relationshipType: 'informs' },
        { id: 'e-path-rad', source: 'pathologist', target: 'radiologist', relationshipType: 'validates' },
        { id: 'e-surg-pulm', source: 'thoracic-surgeon', target: 'pulmonologist', relationshipType: 'collaborates' },
        { id: 'e1', source: 'medical-oncologist', target: 'tumor-board-chair', relationshipType: 'reports-to' },
        { id: 'e2', source: 'thoracic-surgeon', target: 'tumor-board-chair', relationshipType: 'reports-to' },
        { id: 'e3', source: 'radiation-oncologist', target: 'tumor-board-chair', relationshipType: 'reports-to' },
        { id: 'e4', source: 'pathologist', target: 'tumor-board-chair', relationshipType: 'reports-to' },
        { id: 'e5', source: 'radiologist', target: 'tumor-board-chair', relationshipType: 'reports-to' },
        { id: 'e6', source: 'pulmonologist', target: 'tumor-board-chair', relationshipType: 'reports-to' },
        { id: 'e7', source: 'palliative-care', target: 'tumor-board-chair', relationshipType: 'reports-to' },
        { id: 'e8', source: 'nurse-navigator', target: 'tumor-board-chair', relationshipType: 'reports-to' },
        { id: 'e-out', source: 'tumor-board-chair', target: 'output-recommendation', relationshipType: 'informs' }
      ]
    }
  },

  // ============================================
  // SCENARIO 10: TRANSPLANT ALLOCATION BOARD (8 Agents)
  // ============================================
  {
    id: 'transplant-allocation',
    name: 'Transplant Allocation Board',
    description: '8-agent organ allocation decision-making simulation for liver transplant',
    category: 'clinical-decisions',
    topology: {
      name: 'Liver Transplant Allocation Committee',
      description: 'Multi-candidate organ allocation decision with ethics review',
      inputNodes: [
        {
          id: 'input-allocation',
          type: 'input',
          task: `LIVER TRANSPLANT ALLOCATION - URGENT

DONOR INFORMATION:
- 34-year-old male, brain death following MVA
- Blood type: O positive
- Height: 5'10", Weight: 180 lbs
- Cold ischemia time: Currently 2 hours, max acceptable 8-10 hours
- Liver function: AST 45, ALT 52, Bilirubin 0.8, INR 1.1
- Cause of death: Traumatic brain injury
- No history of liver disease, alcohol use minimal
- Hepatitis B/C: Negative, HIV: Negative
- Liver biopsy: <5% macrosteatosis, no fibrosis

CANDIDATE 1: STATUS 1A
- 42-year-old female
- Diagnosis: Acute liver failure (acetaminophen overdose, Day 4)
- MELD-Na: 40 (calculated)
- Blood type: O positive
- Current status: ICU, intubated, grade 3 hepatic encephalopathy
- Dialysis: Yes, for hepatorenal syndrome
- Time on waitlist: 3 days (listed emergently)
- Medical urgency: Expected survival <7 days without transplant
- Social: Single mother of 2 children, employed, good support system
- Psychiatric: Overdose was intentional; psychiatry cleared for transplant

CANDIDATE 2: STATUS 1B
- 58-year-old male
- Diagnosis: Hepatocellular carcinoma within Milan criteria + cirrhosis (HCV, SVR)
- MELD-Na: 28 (with HCC exception points: effective 34)
- Blood type: O positive
- Current status: Home, ECOG 1
- Time on waitlist: 18 months
- Tumor burden: Single 3.5 cm lesion, AFP 45
- Last imaging: 2 weeks ago, stable
- Social: Married, retired teacher, excellent compliance
- Comorbidities: Well-controlled diabetes, no cardiac disease

CANDIDATE 3: STATUS 1B
- 51-year-old female
- Diagnosis: Primary biliary cholangitis, decompensated cirrhosis
- MELD-Na: 32
- Blood type: O positive
- Current status: Hospitalized, ward (not ICU)
- Complications: Refractory ascites requiring weekly paracentesis
- Time on waitlist: 14 months
- Social: Married, 3 adult children, strong family support
- Compliance: Excellent, never missed appointment
- Comorbidities: Osteoporosis, no other significant issues

SIZE MATCHING:
- Donor liver estimated weight: 1600g
- Candidate 1: Would need full graft, size appropriate
- Candidate 2: Size appropriate
- Candidate 3: Slightly small recipient, may need size reduction

QUESTIONS FOR COMMITTEE:
1. Which candidate should receive this organ?
2. How do we weigh medical urgency vs time waiting vs expected outcomes?
3. Ethical considerations for Candidate 1 (intentional overdose)?
4. If Candidate 1 declined, what is backup order?
5. Documentation requirements for allocation decision?`
        }
      ],
      outputNodes: [
        {
          id: 'output-allocation',
          type: 'output',
          label: 'Allocation Decision'
        }
      ],
      nodes: [
        {
          id: 'transplant-surgeon',
          name: 'Transplant Surgeon',
          role: 'You are the transplant surgery director. Evaluate technical considerations: donor organ quality, size matching, recipient surgical risk, and expected operative outcomes for each candidate. Consider cold ischemia time constraints. Provide surgical perspective on allocation.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'hepatologist',
          name: 'Transplant Hepatologist',
          role: 'You are the transplant hepatology director. Evaluate medical suitability: disease severity, expected post-transplant outcomes, recurrence risk (HCC, disease), and medical optimization status. Assess each candidate\'s waitlist trajectory and urgency. Apply UNOS/OPTN policies.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'transplant-coordinator',
          name: 'Transplant Coordinator',
          role: 'You are the senior transplant coordinator. Review UNOS allocation policies, match run details, and documentation requirements. Ensure allocation complies with regional/national policies. Verify candidate readiness and logistics for each potential recipient.',
          behaviorPreset: 'analytical',
          temperature: 0.4,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'psychiatrist',
          name: 'Transplant Psychiatrist',
          role: 'You are the transplant psychiatry consultant. Specifically address Candidate 1\'s psychiatric evaluation, suicide risk assessment, and transplant candidacy despite intentional overdose. Evaluate psychological readiness and post-transplant compliance prediction for all candidates.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'social-worker',
          name: 'Transplant Social Worker',
          role: 'You are the transplant social worker. Assess psychosocial factors: support systems, compliance history, financial/insurance status, and post-transplant care capacity for each candidate. Consider equity and access issues in allocation.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'ethics-consultant',
          name: 'Clinical Ethicist',
          role: 'You are the hospital clinical ethicist. Address ethical dimensions: justice in allocation, utility maximization vs urgency, the ethics of transplanting after intentional overdose, and procedural fairness. Apply transplant ethics frameworks and UNOS ethical principles.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'critical-care',
          name: 'ICU Physician',
          role: 'You are the critical care physician managing Candidate 1. Provide real-time assessment of her clinical trajectory, likelihood of spontaneous recovery, and survival without transplant. Address perioperative ICU considerations for acute liver failure transplant.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'allocation-chair',
          name: 'Allocation Committee Chair',
          role: 'You are the Transplant Selection Committee Chair. Synthesize all inputs and make the allocation recommendation. Provide: (1) Primary recipient selection with justification, (2) Backup recipient order, (3) Documentation of decision rationale, (4) Any conditions or follow-up required. Ensure decision is defensible and policy-compliant.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: true,
          suspicionLevel: 'suspicious',
          rogueMode: { enabled: false }
        }
      ],
      edges: [
        { id: 'e-in-1', source: 'input-allocation', target: 'transplant-surgeon', relationshipType: 'informs' },
        { id: 'e-in-2', source: 'input-allocation', target: 'hepatologist', relationshipType: 'informs' },
        { id: 'e-in-3', source: 'input-allocation', target: 'transplant-coordinator', relationshipType: 'informs' },
        { id: 'e-in-4', source: 'input-allocation', target: 'psychiatrist', relationshipType: 'informs' },
        { id: 'e-in-5', source: 'input-allocation', target: 'social-worker', relationshipType: 'informs' },
        { id: 'e-in-6', source: 'input-allocation', target: 'ethics-consultant', relationshipType: 'informs' },
        { id: 'e-in-7', source: 'input-allocation', target: 'critical-care', relationshipType: 'informs' },
        { id: 'e-surg-hep', source: 'transplant-surgeon', target: 'hepatologist', relationshipType: 'collaborates' },
        { id: 'e-psych-eth', source: 'psychiatrist', target: 'ethics-consultant', relationshipType: 'informs' },
        { id: 'e-coord-all', source: 'transplant-coordinator', target: 'allocation-chair', relationshipType: 'validates' },
        { id: 'e1', source: 'transplant-surgeon', target: 'allocation-chair', relationshipType: 'reports-to' },
        { id: 'e2', source: 'hepatologist', target: 'allocation-chair', relationshipType: 'reports-to' },
        { id: 'e3', source: 'psychiatrist', target: 'allocation-chair', relationshipType: 'reports-to' },
        { id: 'e4', source: 'social-worker', target: 'allocation-chair', relationshipType: 'reports-to' },
        { id: 'e5', source: 'ethics-consultant', target: 'allocation-chair', relationshipType: 'critiques' },
        { id: 'e6', source: 'critical-care', target: 'allocation-chair', relationshipType: 'reports-to' },
        { id: 'e-out', source: 'allocation-chair', target: 'output-allocation', relationshipType: 'informs' }
      ]
    }
  },

  // ============================================
  // SCENARIO 11: EMERGENCY ROOM TRIAGE (7 Agents)
  // ============================================
  {
    id: 'er-triage',
    name: 'Emergency Room Triage',
    description: '7-agent ED triage simulation for multiple simultaneous patients',
    category: 'clinical-decisions',
    topology: {
      name: 'Emergency Department Triage',
      description: 'Multi-patient triage and resource allocation in busy ED',
      inputNodes: [
        {
          id: 'input-patients',
          type: 'input',
          task: `EMERGENCY DEPARTMENT TRIAGE - MULTI-PATIENT SCENARIO

CURRENT ED STATUS:
- Time: Saturday 10:30 PM
- ED capacity: 24 beds, currently 22 occupied
- Trauma bays: 2 available
- Resuscitation bay: 1 occupied (cardiac arrest in progress)
- Wait time: 2.5 hours average
- Ambulances en route: 3 additional (see below)

PATIENTS REQUIRING IMMEDIATE TRIAGE:

PATIENT A - AMBULANCE ARRIVAL (ETA 2 min):
- 67-year-old male
- Chief complaint: Crushing chest pain x 1 hour, diaphoretic
- Vitals from EMS: BP 90/60, HR 110, SpO2 94% on 4L NC
- ECG from field: ST elevations V1-V4
- History: Prior MI 2018, DM, HTN
- EMS gave aspirin 325mg, started IV

PATIENT B - WALK-IN (at triage desk now):
- 8-year-old male with mother
- Chief complaint: Fell from bike 3 hours ago, now increasingly drowsy
- Mother reports: "He seemed fine at first but now won't stay awake"
- Visible: Helmet was worn, small abrasion on forehead
- Vitals: BP 100/70, HR 60 (bradycardic for age), unequal pupils noted
- GCS: E3V4M5 = 12

PATIENT C - AMBULANCE ARRIVAL (ETA 5 min):
- 34-year-old female
- Chief complaint: "Worst headache of my life," sudden onset 45 min ago
- Vitals from EMS: BP 180/110, HR 88, GCS 14
- Neck stiffness noted, photophobia
- No trauma history
- Vomited x2 en route

PATIENT D - WALK-IN (in waiting room 30 min):
- 45-year-old male
- Chief complaint: Abdominal pain x 2 days, now with fever
- Vitals at triage: BP 130/85, HR 105, Temp 102.4°F, SpO2 98%
- Appears uncomfortable, guarding RLQ
- Last BM: 3 days ago

PATIENT E - WALK-IN (in waiting room 2 hours):
- 28-year-old female
- Chief complaint: Ankle injury, twisted playing basketball
- Visible swelling lateral ankle, can bear weight with pain
- Vitals normal, comfortable
- Requesting X-ray

AVAILABLE RESOURCES:
- Attending physicians: 2 (1 with cardiac arrest)
- Residents: 3
- Nurses: 6 (2 with cardiac arrest patient)
- CT scanner: Available (15 min wait for current patient)
- Cath lab: On standby (can activate in 20 min)
- OR: 1 team available

QUESTIONS FOR TRIAGE TEAM:
1. Priority order for these 5 patients?
2. Resource allocation (which provider/bed for each)?
3. Which patients need immediate interventions before full evaluation?
4. What is the disposition pathway for each patient?
5. Do we need to activate any emergency protocols?`
        }
      ],
      outputNodes: [
        {
          id: 'output-triage',
          type: 'output',
          label: 'Triage Plan'
        }
      ],
      nodes: [
        {
          id: 'triage-nurse',
          name: 'Triage Nurse',
          role: 'You are the senior triage nurse using the Emergency Severity Index (ESI). Assign ESI level (1-5) to each patient. Consider: vital sign abnormalities, chief complaint severity, resource needs predicted, and potential for rapid deterioration. Flag any patients requiring immediate bedding.',
          behaviorPreset: 'analytical',
          temperature: 0.4,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'emergency-physician',
          name: 'Emergency Physician',
          role: 'You are the attending emergency physician. Evaluate clinical acuity and time-sensitivity for each patient. Consider: STEMI (Patient A) door-to-balloon time, pediatric head trauma (Patient B), possible SAH (Patient C). Prioritize based on mortality risk and intervention windows.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'trauma-surgeon',
          name: 'Trauma Surgeon',
          role: 'You are the trauma surgery consultant. Evaluate Patient B (pediatric head injury) for surgical emergency. Consider: Cushing response (bradycardia, hypertension), pupillary changes, declining GCS. Recommend imaging and neurosurgery consultation. Assess need for trauma activation.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'cardiologist',
          name: 'Interventional Cardiologist',
          role: 'You are the interventional cardiologist on call. Evaluate Patient A (STEMI). Assess for cath lab activation criteria, door-to-balloon time targets, and immediate interventions needed (antiplatelet, anticoagulation). Consider cardiogenic shock management given low BP.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'charge-nurse',
          name: 'Charge Nurse',
          role: 'You are the ED charge nurse managing bed flow and staffing. Allocate beds, assign nurses, and coordinate resources. Consider current ED saturation, staff availability, and patient flow optimization. Identify if we need to call in additional staff or divert ambulances.',
          behaviorPreset: 'balanced',
          temperature: 0.5,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'resource-coordinator',
          name: 'Resource Coordinator',
          role: 'You are the hospital resource coordinator. Evaluate system-wide capacity: ICU beds, OR availability, CT/imaging queue, cath lab status. Coordinate with inpatient units for potential admissions. Consider hospital surge protocols if needed.',
          behaviorPreset: 'balanced',
          temperature: 0.5,
          model: 'gpt-5-mini',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'ed-medical-director',
          name: 'ED Medical Director',
          role: 'You are the ED Medical Director overseeing triage decisions. Synthesize all inputs and produce the final triage and resource allocation plan. Provide: (1) Patient priority order with ESI levels, (2) Bed/provider assignments, (3) Immediate interventions to initiate, (4) Protocol activations (STEMI, trauma, stroke), (5) Expected disposition pathways. Ensure life-threatening conditions are addressed first.',
          behaviorPreset: 'balanced',
          temperature: 0.6,
          model: 'gpt-5.2',
          isOversight: true,
          suspicionLevel: 'suspicious',
          rogueMode: { enabled: false }
        }
      ],
      edges: [
        { id: 'e-in-1', source: 'input-patients', target: 'triage-nurse', relationshipType: 'informs' },
        { id: 'e-in-2', source: 'input-patients', target: 'emergency-physician', relationshipType: 'informs' },
        { id: 'e-in-3', source: 'input-patients', target: 'trauma-surgeon', relationshipType: 'informs' },
        { id: 'e-in-4', source: 'input-patients', target: 'cardiologist', relationshipType: 'informs' },
        { id: 'e-in-5', source: 'input-patients', target: 'charge-nurse', relationshipType: 'informs' },
        { id: 'e-in-6', source: 'input-patients', target: 'resource-coordinator', relationshipType: 'informs' },
        { id: 'e-triage-ep', source: 'triage-nurse', target: 'emergency-physician', relationshipType: 'informs' },
        { id: 'e-charge-resource', source: 'charge-nurse', target: 'resource-coordinator', relationshipType: 'collaborates' },
        { id: 'e1', source: 'triage-nurse', target: 'ed-medical-director', relationshipType: 'reports-to' },
        { id: 'e2', source: 'emergency-physician', target: 'ed-medical-director', relationshipType: 'reports-to' },
        { id: 'e3', source: 'trauma-surgeon', target: 'ed-medical-director', relationshipType: 'reports-to' },
        { id: 'e4', source: 'cardiologist', target: 'ed-medical-director', relationshipType: 'reports-to' },
        { id: 'e5', source: 'charge-nurse', target: 'ed-medical-director', relationshipType: 'reports-to' },
        { id: 'e6', source: 'resource-coordinator', target: 'ed-medical-director', relationshipType: 'reports-to' },
        { id: 'e-out', source: 'ed-medical-director', target: 'output-triage', relationshipType: 'informs' }
      ]
    }
  },

  // ============================================
  // SCENARIO: HEMATOLOGY TUMOR BOARD (9 Agents) - hemonc-agent compatible
  // ============================================
  {
    id: 'hematology-mdt',
    name: 'Hematology Tumor Board',
    description: 'Hematological multidisciplinary tumor board with 9 specialist agents based on hemonc-agent framework',
    category: 'clinical-decisions',
    topology: {
      name: 'Hematology MDT',
      description: 'Multidisciplinary tumor board discussion for hematological malignancies',
      inputNodes: [
        {
          id: 'input-patient',
          type: 'input',
          task: `Patient History:
- Demographics: [Age, Gender]
- Diagnosis: [e.g., Diffuse Large B-Cell Lymphoma, Stage III]
- Molecular Markers: [e.g., MYC/BCL2 double-expressor]
- Prior Treatment: [if any]
- Current Status: [newly diagnosed / relapsed / refractory]

Clinical Question:
Please evaluate treatment options for this patient.`
        }
      ],
      outputNodes: [
        {
          id: 'output-mdt',
          type: 'output',
          label: 'MDT Consensus'
        }
      ],
      nodes: [
        {
          id: 'radiologist-precheck',
          name: 'Radiologist',
          role: 'You are a radiologist performing a pre-check of the patient record in the hematological multidisciplinary tumor board. Use rag_staging_uicc and rag_guideline tools to retrieve staging criteria and imaging requirements. If disease is treatment-naive with no documented stage, derive tumor stage from patient history. Evaluate if additional radiology tests are necessary. If no recommendation needed, return: "No radiological action required based on current data."',
          behaviorPreset: 'analytical',
          temperature: 0.3,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'pathologist-precheck',
          name: 'Pathologist',
          role: 'You are a pathologist in the hematological multidisciplinary tumor board. Use rag_pathology, rag_tool_who, and rag_guideline tools. If research question is about diagnosis, derive diagnosis cautiously. Evaluate if pathological information is sufficient. If additional tests needed, list them explicitly. If no recommendation needed, return: "No pathological action required based on current data."',
          behaviorPreset: 'analytical',
          temperature: 0.3,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'surgeon',
          name: 'Surgeon',
          role: 'You are a surgeon participating in a hematological multidisciplinary tumor board. Provide: 1) Surgical assessment - is surgery indicated? 2) Ongoing treatment review 3) Clinical trial consideration 4) Comorbidity management 5) Additional testing. State treatment intent (palliative/curative/unclear). Use rag_guideline and web_search_tool. Add references.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'medical-oncologist',
          name: 'Medical Oncologist',
          role: 'You are a medical oncologist participating in a hematological multidisciplinary tumor board. Provide: 1) Pharmacological/cellular therapy assessment - list suitable regimens 2) Cross-check against treatment history 3) Ongoing treatment review 4) Clinical trial consideration 5) Comorbidity management. State treatment intent. Use rag_guideline, genesearch_batch_tool, web_search_tool. Add references.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'radiation-oncologist',
          name: 'Radiation Oncologist',
          role: 'You are a radiation oncologist participating in a hematological multidisciplinary tumor board. Provide: 1) Radiotherapy assessment - is RT indicated? Specify intent (curative/palliative/consolidative) 2) Ongoing treatment review 3) Clinical trial consideration 4) Comorbidity management. State treatment intent. Use rag_guideline and web_search_tool. Add references.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'geneticist',
          name: 'Geneticist',
          role: 'You are a geneticist participating in a hematological multidisciplinary tumor board. Step 1: Identify genetic alterations; if present, call genesearch_batch_tool. If none: return "No genetic alterations identified; targeted therapy not applicable." Step 2: For each alteration, provide pharmacological recommendations with prior use check, disease match, support flags, evidence level. Group by mutation.',
          behaviorPreset: 'analytical',
          temperature: 0.3,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'general-practitioner',
          name: 'General Practitioner',
          role: 'You are a general practitioner in the hematological MDT. Your scope: non-cancer conditions, supportive care, medical optimization. Tasks: 1) Identify non-oncologic comorbidities and tumor-related complications 2) Provide supportive recommendations 3) Recommend referrals if needed 4) Include safety flags. Do NOT discuss tumor-specific treatment. Keep answer ≤200 words. If nothing needed: "No general medicine action required."',
          behaviorPreset: 'balanced',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'additional-oncologist',
          name: 'Additional Oncologist',
          role: 'You are an additional medical oncologist on the MDT. Phase 1: Independent analysis using rag_guideline. Phase 2: Review recommendations from surgeon, medical oncologist, radiation oncologist. Prioritize PubMed evidence matching patient subtype. Evaluate clinical appropriateness. Provide affirmation or specific additions. Output: recommendation + references.',
          behaviorPreset: 'analytical',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: false,
          rogueMode: { enabled: false }
        },
        {
          id: 'mdt-chair',
          name: 'MDT Chairman',
          role: 'You are the chairman of the multidisciplinary tumor board. Synthesize all specialist recommendations. Rules: 1) No new medicine 2) Priority to Surgeon, Medical Oncologist, Radiation Oncologist, Additional Oncologist 3) Filter by subtype and treatment history 4) Focus on research question 5) Preserve uncertainty language. Output format: ## Final Board Recommendation with Intent and Unified plan, ## Reference',
          behaviorPreset: 'balanced',
          temperature: 0.5,
          model: 'gpt-5.2',
          isOversight: true,
          suspicionLevel: 'suspicious',
          rogueMode: { enabled: false }
        }
      ],
      edges: [
        { id: 'e1', source: 'input-patient', target: 'radiologist-precheck', relationshipType: 'informs' },
        { id: 'e2', source: 'input-patient', target: 'pathologist-precheck', relationshipType: 'informs' },
        { id: 'e3', source: 'radiologist-precheck', target: 'surgeon', relationshipType: 'informs' },
        { id: 'e4', source: 'pathologist-precheck', target: 'surgeon', relationshipType: 'informs' },
        { id: 'e5', source: 'radiologist-precheck', target: 'medical-oncologist', relationshipType: 'informs' },
        { id: 'e6', source: 'pathologist-precheck', target: 'medical-oncologist', relationshipType: 'informs' },
        { id: 'e7', source: 'radiologist-precheck', target: 'radiation-oncologist', relationshipType: 'informs' },
        { id: 'e8', source: 'pathologist-precheck', target: 'geneticist', relationshipType: 'informs' },
        { id: 'e9', source: 'input-patient', target: 'general-practitioner', relationshipType: 'informs' },
        { id: 'e10', source: 'surgeon', target: 'additional-oncologist', relationshipType: 'informs' },
        { id: 'e11', source: 'medical-oncologist', target: 'additional-oncologist', relationshipType: 'informs' },
        { id: 'e12', source: 'radiation-oncologist', target: 'additional-oncologist', relationshipType: 'informs' },
        { id: 'e13', source: 'surgeon', target: 'mdt-chair', relationshipType: 'reports-to' },
        { id: 'e14', source: 'medical-oncologist', target: 'mdt-chair', relationshipType: 'reports-to' },
        { id: 'e15', source: 'radiation-oncologist', target: 'mdt-chair', relationshipType: 'reports-to' },
        { id: 'e16', source: 'geneticist', target: 'mdt-chair', relationshipType: 'reports-to' },
        { id: 'e17', source: 'general-practitioner', target: 'mdt-chair', relationshipType: 'reports-to' },
        { id: 'e18', source: 'additional-oncologist', target: 'mdt-chair', relationshipType: 'reports-to' },
        { id: 'e-out', source: 'mdt-chair', target: 'output-mdt', relationshipType: 'informs' }
      ]
    }
  }
]

