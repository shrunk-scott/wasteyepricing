// Tender library — content from WastEye_Audit_Tender_Package.docx, structured for search + admin editing.
// Each question can have multiple "answers" of different lengths. Each answer has copy button + word count.

(function () {
  const DEFAULT_TENDER = {
    version: "1.0",
    issued: "May 2026",
    categories: [
      {
        id: "tech",
        num: "01",
        label: "Technical and methodology",
        desc: "Methodology, accuracy, hardware, capture profile, reporting, integrations.",
        questions: [
          {
            id: "methodology",
            question: "Describe your methodology",
            tags: ["methodology", "approach", "process", "how it works", "overview"],
            answers: [
              { id: "one", length: "One line", text: "WastEye captures bin imagery at 30-minute intervals over 7, 14 or 28 days, classifies every image with a trained AI model, and delivers a contamination and waste-composition report within 10 business days of camera retrieval." },
              { id: "short", length: "Short · ~80 words", text: "WastEye is an IoT-and-AI waste audit service. Cameras are installed above each bin for a defined deployment period of 7, 14 or 28 days, capturing imagery at 30-minute intervals across an 8-hour active window. Every captured image is processed by a trained classifier that identifies waste type, contamination, and bin fullness. At the end of the deployment, cameras are retrieved and a final PDF report is delivered within 10 business days, covering contamination percentages, waste composition, trend data and full photographic evidence." },
              { id: "full", length: "Full · ~200 words", text: "WastEye is a turnkey waste audit service combining IoT cameras and cloud-based AI image classification. Cameras are deployed on-site by Shrunk over a 7, 14 or 28 day period and capture imagery at 30-minute intervals across an 8-hour daily active window, producing approximately 16 images per camera per day. Each captured image is processed through a trained classifier that identifies waste type, contamination presence, and bin fullness. Classification results are aggregated into a final report covering contamination percentages, waste-type composition, daily and weekly trends, and photographic evidence backing every metric reported. The methodology is repeatable, evidence-based, and avoids the sampling bias of manual single-day audits. Confidence scores are recorded for every classification and low-confidence images receive human review before inclusion. The final report is delivered within 10 business days of camera retrieval and includes a complete copy of all captured imagery for the customer's records. Both WiFi and 4G camera variants are available and can be mixed within a single deployment to match site infrastructure availability. Site gateways for WiFi deployments are included at no additional cost." },
            ],
          },
          {
            id: "accuracy",
            question: "What is your classification accuracy?",
            tags: ["accuracy", "ai", "ml", "model", "confidence"],
            answers: [
              { id: "default", length: "Standard", text: "Our trained model achieves over 90% classification accuracy on the waste streams it has been trained on (general waste, mixed recycling, organics, paper). Confidence scores are recorded for every classification. Low-confidence images are reviewed by a human operator before inclusion in the final report. Accuracy thresholds and human review counts are disclosed in every report. Where customer-specific waste streams require additional model training, this is scoped and quoted separately." },
            ],
          },
          {
            id: "hardware",
            question: "What hardware do you deploy?",
            tags: ["hardware", "camera", "wifi", "4g", "gateway", "iot", "spec"],
            answers: [
              { id: "default", length: "Standard", text: "Two camera variants and one site gateway form the WastEye hardware family:\n\n• WiFi camera: Shrunk custom camera hardware and firmware, 3MP OmniVision OV3660 sensor, 1 x camera flash module, 1 x 18650 Li-Ion battery (4+ weeks field life), 2.4 GHz WPA2-PSK connectivity.\n\n• 4G camera: Shrunk custom hardware with integrated Cat-M1 / NB-IoT cellular modem on the Telstra network, 3MP sensor, 18650 Li-Ion battery (4+ weeks field life), Shrunk-managed eSIM with data plan included.\n\n• Site gateway: Provided one per site at no additional cost with WiFi deployments. Self-contained 4G WAN backhaul, supports up to 16 cameras, mains-powered, no customer IT integration required.\n\nAll variants can be mixed within a single deployment. Cameras are mounted at ground or step-stool level; no working-at-heights or confined-space requirements." },
            ],
          },
          {
            id: "capture",
            question: "Default capture profile and data volumes",
            tags: ["capture", "interval", "data volume", "images", "storage"],
            answers: [
              { id: "default", length: "Standard", text: "Default profile: one image every 30 minutes across an 8-hour active window, producing approximately 16 images per camera per day.\n\n• Snapshot (7 days): ~112 images per camera, ~17 MB\n• Baseline (14 days): ~224 images per camera, ~34 MB\n• Deep dive (28 days): ~448 images per camera, ~67 MB\n\nA 15-minute capture interval and 12-hour extended active window are available as add-ons. These uplift options are scoped and priced separately at the engagement stage." },
            ],
          },
          {
            id: "report-delivery",
            question: "How is the report delivered?",
            tags: ["report", "deliverable", "pdf", "delivery", "format"],
            answers: [
              { id: "default", length: "Standard", text: "The final report is delivered as a PDF document within 10 business days of camera retrieval. The report includes contamination percentages by waste stream, waste-type composition, daily and weekly trend data, and selected photographic evidence backing every metric. A complete copy of all captured imagery is provided alongside the report for the customer's records. One round of post-report clarification questions is included at no additional cost. A recommendations workshop, in which findings are discussed and intervention options proposed, is available as an add-on." },
            ],
          },
          {
            id: "uptime",
            question: "How is service uptime monitored?",
            tags: ["uptime", "monitoring", "sla", "support", "response"],
            answers: [
              { id: "default", length: "Standard", text: "All deployed cameras are monitored daily by Shrunk for connectivity and image capture rate. If a camera goes offline, Shrunk responds within 24 hours to diagnose and, where practical, replace the unit. Specific service-level commitments are documented in the engagement statement of work." },
            ],
          },
          {
            id: "integrations",
            question: "Can you integrate with our existing systems?",
            tags: ["integration", "api", "export", "bms", "fm", "csv", "json"],
            answers: [
              { id: "default", length: "Standard", text: "WastEye is delivered as a standalone audit service with a PDF report as the primary deliverable. Custom integrations with building management systems, facilities management software, or sustainability reporting platforms are not part of the standard service but can be scoped on request. Anonymised data export in structured format (CSV, JSON) is available at no additional cost." },
            ],
          },
        ],
      },
      {
        id: "privacy",
        num: "02",
        label: "Privacy, security and data handling",
        desc: "Privacy, data residency, retention, security controls, DPA, ISO 27001.",
        questions: [
          {
            id: "privacy",
            question: "How do you handle personal information and privacy?",
            tags: ["privacy", "personal information", "app", "privacy act", "people"],
            answers: [
              { id: "short", length: "Short", text: "Cameras are positioned to capture waste streams, not people. Incidental capture of individuals is flagged and excluded from reporting. Shrunk complies with the Australian Privacy Principles under the Privacy Act 1988 (Cth)." },
              { id: "full", length: "Full · ~150 words", text: "WastEye cameras are mounted and angled to capture waste streams in bins, not the people using them. Where individuals are incidentally captured at the edge of frame, those images are flagged during processing and excluded from the report. Shrunk does not perform facial recognition, behavioural analysis, or any other people-related processing of captured imagery. All captured imagery is encrypted in transit (TLS 1.2 or higher) and at rest on Shrunk's cloud infrastructure. Data is hosted on Google Cloud in the Sydney region, ensuring Australian sovereign data residency. Imagery is retained for the deployment duration plus 90 days, then deleted. Shrunk complies with the Australian Privacy Principles under the Privacy Act 1988 (Cth). A Data Processing Agreement is available on request for clients with formal vendor data requirements." },
            ],
          },
          {
            id: "residency",
            question: "Where is data stored?",
            tags: ["data residency", "sovereign", "australia", "sydney", "gcp"],
            answers: [
              { id: "default", length: "Standard", text: "All captured imagery and processed data is stored on Google Cloud infrastructure located in the Sydney (australia-southeast1) region. No data leaves Australia at any point in the deployment, processing, or reporting lifecycle." },
            ],
          },
          {
            id: "retention",
            question: "How long is data retained?",
            tags: ["retention", "data", "deletion", "training"],
            answers: [
              { id: "default", length: "Standard", text: "Imagery is retained for the deployment duration plus 90 days, after which it is deleted. A copy of all captured imagery is delivered to the customer at project close. Anonymised data may be retained for model training and improvement; this is explicit in the engagement statement of work and can be opted out of at the customer's request without affecting service delivery." },
            ],
          },
          {
            id: "security",
            question: "What security controls are in place?",
            tags: ["security", "tls", "encryption", "access control", "rbac", "incident"],
            answers: [
              { id: "default", length: "Standard", text: "Data in transit is encrypted via TLS 1.2 or higher. Data at rest is encrypted using Google Cloud's standard server-side encryption. Access to customer imagery is restricted to authorised Shrunk personnel under role-based access control. Cameras authenticate to the Shrunk cloud using device-specific credentials. Shrunk operates a documented incident response process and will notify affected customers of any data security incident within the timeframes required by Australian law." },
            ],
          },
          {
            id: "dpa",
            question: "Do you have a Data Processing Agreement?",
            tags: ["dpa", "data processing agreement", "contract"],
            answers: [
              { id: "default", length: "Standard", text: "Yes. A Data Processing Agreement covering Shrunk's handling of customer-owned data during a WastEye engagement is available on request. The agreement covers data residency, retention, security controls, subprocessor disclosure, and breach notification." },
            ],
          },
          {
            id: "iso27001",
            question: "Are you ISO 27001 certified?",
            tags: ["iso 27001", "certification", "security framework"],
            note: "If ISO 27001 is a mandatory pass-or-fail criterion in your tender, escalate to Shrunk before submitting.",
            answers: [
              { id: "default", length: "Standard", text: "Shrunk is not currently ISO 27001 certified. The company operates security controls aligned with the ISO 27001 framework and the OAIC's guidance for Australian Privacy Principles entities. Certification is on the roadmap for FY26-27. Where ISO 27001 is a mandatory tender requirement, we can discuss equivalent attestations or pursue certification on a project basis." },
            ],
          },
        ],
      },
      {
        id: "commercial",
        num: "03",
        label: "Commercial and contractual",
        desc: "Pricing model, payment terms, SLAs, hardware liability, sub-contracting, indemnity.",
        questions: [
          {
            id: "pricing-model",
            question: "Pricing model",
            tags: ["pricing", "model", "tier", "volume", "rate"],
            answers: [
              { id: "default", length: "Standard", text: "WastEye is priced per camera, with volume discounts across five tiers (Tier 1 at 4 cameras through Tier 5 at 50+ cameras). Three deployment durations are available: Snapshot (7 days), Baseline (14 days), and Deep dive (28 days). A mobilisation fee per site is added separately, banded by distance from the nearest Shrunk-supported CBD. Detailed pricing tables are included in section 08." },
            ],
          },
          {
            id: "rate-inclusions",
            question: "What is included in the per-camera rate?",
            tags: ["inclusions", "rate", "what's included", "scope"],
            answers: [
              { id: "default", length: "Standard", text: "Included in every per-camera rate:\n\n• All camera hardware (WiFi or 4G), supplied and installed by Shrunk\n• Site gateways for WiFi deployments (one per site, supporting up to 8 cameras each)\n• Cellular data plans on all 4G cameras and gateways, Shrunk-managed\n• On-site installation and end-of-deployment retrieval\n• AI classification of every captured image\n• Final PDF report within 10 business days of camera retrieval\n• One round of post-report clarification questions\n• Complete copy of all captured imagery for the customer's records" },
            ],
          },
          {
            id: "payment",
            question: "Payment terms",
            tags: ["payment", "terms", "deposit", "invoice", "eft"],
            answers: [
              { id: "default", length: "Standard", text: "Standard payment terms are 50% deposit on signed statement of work, with the 50% balance invoiced on retrieval and payable on the agreed terms. Payment is by EFT to a nominated Australian business account, with remittance advice to accounts@shrunk.ai. Quote validity is 30 days from issue. Alternative payment structures (milestone-based, monthly, post-pay) can be negotiated for engagements over $50,000 ex-GST." },
            ],
          },
          {
            id: "sla",
            question: "Service-level commitments",
            tags: ["sla", "service level", "response", "uptime", "remediation"],
            answers: [
              { id: "default", length: "Standard", text: "Service-level commitments specific to each engagement are documented in the statement of work. Standard commitments include: 24-hour response to camera offline events, 5 business day response to general support enquiries, monthly status reporting during deployment, and final report delivery within 10 business days of camera retrieval. Liquidated damages are not part of the standard service but may be negotiated for material breach of SLA." },
            ],
          },
          {
            id: "hw-damage",
            question: "How do you handle hardware damage or loss?",
            tags: ["damage", "loss", "theft", "rental", "hardware"],
            answers: [
              { id: "default", length: "Standard", text: "Cameras and gateways remain Shrunk's property and are deployed on a rental basis. Hardware damage, theft, or non-return is assessed on a per-incident basis and may be recovered through the engagement contract. Cosmetic damage and fair wear and tear are not charged. The customer is not liable for damage or loss caused by Shrunk's installation, retrieval activity, or hardware fault. Damage assessment and recovery arrangements are documented in the statement of work." },
            ],
          },
          {
            id: "camera-failure",
            question: "What happens if a camera fails during deployment?",
            tags: ["failure", "offline", "replacement", "remedy"],
            answers: [
              { id: "default", length: "Standard", text: "If a camera fails or goes offline during the deployment window, Shrunk responds within 24 hours to diagnose the issue and, where practical, replace the unit. Depending on tier and the duration of any service interruption, remedies may include device replacement, deployment extension, or pro-rata adjustment of the engagement fee. Specific remedies are documented in the engagement statement of work." },
            ],
          },
          {
            id: "subcontracting",
            question: "Sub-contracting and disclosure",
            tags: ["sub-contracting", "partner", "reseller", "channel", "telstra", "gcp"],
            answers: [
              { id: "default", length: "Standard", text: "WastEye is wholly designed, operated, and delivered by Shrunk Innovation Group. The service does not rely on sub-contractors for camera deployment, AI classification, or report production. Where this tender is being submitted via a reseller or channel partner, that relationship is disclosed transparently and Shrunk is named as the technology provider. Third-party cloud infrastructure (Google Cloud Sydney) is the only material subprocessor; cellular connectivity is supplied via Telstra under a standard commercial arrangement." },
            ],
          },
          {
            id: "liability",
            question: "Liability and indemnity",
            tags: ["liability", "indemnity", "insurance", "cap", "exclusions"],
            answers: [
              { id: "default", length: "Standard", text: "Each party's liability under the engagement is capped at the total fees paid or payable for that engagement, except in cases of wilful misconduct, fraud, breach of confidentiality obligations, or personal injury caused by negligence. Consequential, indirect and economic loss is excluded. Shrunk maintains Public Liability cover of $20M per claim, Professional Indemnity of $5M per claim, and Product Liability of $5M per claim. Certificates of currency are available on request." },
            ],
          },
          {
            id: "aus-content",
            question: "Australian content",
            tags: ["australian content", "local", "australian operations", "headquartered"],
            answers: [
              { id: "default", length: "Standard", text: "Shrunk Innovation Group is an Australian-owned and operated company headquartered in Melbourne, Victoria. All product engineering, AI model development, customer support, and reporting are performed in Australia by Australian personnel. Hardware components are sourced from international suppliers but assembled and configured in Australia. Cloud infrastructure is hosted in the Sydney region with Australian sovereign data residency." },
            ],
          },
        ],
      },
      {
        id: "references",
        num: "04",
        label: "References and track record",
        desc: "Company background, reference customers, years of operation.",
        questions: [
          {
            id: "company",
            question: "Company background",
            tags: ["company", "background", "about", "history", "shrunk"],
            answers: [
              { id: "short", length: "Short", text: "Shrunk Innovation Group is a Melbourne-based hardware and IoT company. WastEye is its waste audit service, deployed across healthcare, education and commercial property sectors in Australia and New Zealand." },
              { id: "full", length: "Full · ~150 words", text: "Shrunk Innovation Group is a Melbourne-based hardware and IoT company designing and operating end-to-end systems spanning embedded firmware, custom printed circuit boards, computer vision, and cloud backends. The company was founded in 2022 and has delivered hardware and IoT solutions across healthcare, waste management, education and smart sports verticals. WastEye is Shrunk's waste audit service, combining custom IoT cameras with trained AI classification to deliver evidence-based waste audits to commercial and institutional customers. Reference customers for WastEye and related projects include Eastern Health, The Royal Women's Hospital, the University of Melbourne, the University of Otago, Griffith University, and several commercial property and facilities management groups. The company holds Public Liability cover of $20 million, Professional Indemnity of $5 million, and Product Liability of $5 million. All engineering and operations are based in Melbourne, Australia." },
            ],
          },
          {
            id: "references",
            question: "Reference engagements",
            tags: ["references", "case studies", "clients", "customers", "track record"],
            note: "Always check with Shrunk before listing reference clients in a tender response. Some clients have not consented to being named in third-party-distributed materials.",
            answers: [
              { id: "default", length: "Standard", text: "Shrunk has delivered WastEye and related projects for the following customers. Referee contacts are provided on shortlist confirmation, subject to client consent.\n\n• Eastern Health (Healthcare) — Food waste auditing at Box Hill Hospital using AI-classified imagery. Multi-month engagement with monthly reporting cycle.\n\n• The Royal Women's Hospital (Healthcare) — Environmental management programme support including waste stream auditing and reporting infrastructure.\n\n• University of Melbourne (Education) — Multi-site waste audit deployments across campus, including building-by-building contamination measurement.\n\n• University of Otago (Education, NZ) — WastEye camera deployments with cross-region timezone handling, supporting Otago's sustainability reporting.\n\n• Griffith University (Education) — Waste auditing engagement supporting NABERS waste assessment and contractor performance benchmarking." },
            ],
          },
          {
            id: "years",
            question: "Years of operation",
            tags: ["years", "founded", "operation", "history", "established"],
            answers: [
              { id: "default", length: "Standard", text: "Shrunk Innovation Group was founded in 2022. The WastEye service has been in continuous commercial operation since 2023." },
            ],
          },
        ],
      },
      {
        id: "compliance",
        num: "05",
        label: "Compliance and workplace",
        desc: "WHS, modern slavery, indigenous engagement, sustainability, EEO, conflict of interest.",
        questions: [
          {
            id: "whs",
            question: "Workplace health and safety",
            tags: ["whs", "ohs", "safety", "white card", "swms", "ppe"],
            answers: [
              { id: "default", length: "Standard", text: "Shrunk personnel attending customer sites hold current White Card construction induction. Site-specific inductions are completed as required (healthcare facilities, restricted-access sites). All WastEye install work is performed at ground or step-stool level; no working-at-heights, confined-space, or hot-work activities are required. Shrunk supplies its own personal protective equipment, and high-visibility vests are worn on all sites by default. A site-specific safe work method statement is provided ahead of any deployment exceeding 10 cameras." },
            ],
          },
          {
            id: "modern-slavery",
            question: "Modern slavery statement",
            tags: ["modern slavery", "supplier", "ethical sourcing", "labour"],
            answers: [
              { id: "default", length: "Standard", text: "Shrunk Innovation Group does not currently meet the revenue threshold ($100 million) requiring submission of a Modern Slavery Statement under the Modern Slavery Act 2018 (Cth). The company maintains an internal supplier code of conduct addressing labour standards and ethical sourcing, and reviews material suppliers for modern slavery indicators. We are committed to expanding our modern slavery due diligence as the business grows." },
            ],
          },
          {
            id: "indigenous",
            question: "Indigenous engagement",
            tags: ["indigenous", "supply nation", "first nations", "aboriginal"],
            answers: [
              { id: "default", length: "Standard", text: "Shrunk does not currently hold Supply Nation registration. The company sources hardware components, professional services and cloud infrastructure from a mixed supplier base, and is open to incorporating Supply Nation registered suppliers in delivery where the customer requires this. Where a tender requires demonstration of indigenous engagement, this can be discussed at the qualification stage." },
            ],
          },
          {
            id: "sustainability",
            question: "Sustainability and environmental practices",
            tags: ["sustainability", "environment", "esg", "recycling", "emissions"],
            answers: [
              { id: "default", length: "Standard", text: "WastEye is itself a sustainability-enabling service. Beyond the service offering, Shrunk operates from a single Melbourne office and ships hardware on a rental-and-return basis to minimise embodied emissions per deployment. Camera batteries are 18650 Li-Ion cells with documented recycling pathways at end of life. All retrieved hardware is refurbished and redeployed where possible; end-of-life hardware is disposed of through e-waste recycling services in Victoria." },
            ],
          },
          {
            id: "eeo",
            question: "Equal opportunity employment",
            tags: ["equal opportunity", "eeo", "discrimination", "diversity"],
            answers: [
              { id: "default", length: "Standard", text: "Shrunk Innovation Group is an equal opportunity employer and complies with the Sex Discrimination Act 1984, the Racial Discrimination Act 1975, the Disability Discrimination Act 1992, and the Age Discrimination Act 2004. The company does not discriminate on the basis of race, gender, age, sexuality, disability, religion, or political belief in employment, contracting, or service delivery." },
            ],
          },
          {
            id: "coi",
            question: "Conflict of interest",
            tags: ["conflict of interest", "coi", "disclosure"],
            answers: [
              { id: "default", length: "Standard", text: "Shrunk is not aware of any conflict of interest that would affect its ability to deliver this engagement impartially. The company does not have ownership relationships with waste contractors, cleaning service providers, or sustainability consultancies that may be affected by audit findings. Any conflict identified during delivery would be disclosed immediately to the customer." },
            ],
          },
          {
            id: "whistleblower",
            question: "Whistleblower and grievance procedures",
            tags: ["whistleblower", "grievance", "complaints"],
            answers: [
              { id: "default", length: "Standard", text: "Shrunk maintains an internal grievance procedure for staff and contractors, and complies with the protections set out in the Treasury Laws Amendment (Enhancing Whistleblower Protections) Act 2019 for staff disclosures relating to misconduct. Customer-side grievance escalation contacts are documented in every engagement statement of work." },
            ],
          },
          {
            id: "cyber-incident",
            question: "Cyber security incident response",
            tags: ["cyber security", "incident response", "breach", "notification", "acsc"],
            answers: [
              { id: "default", length: "Standard", text: "Shrunk maintains a documented incident response process aligned with the Australian Cyber Security Centre's guidance. The process covers detection, containment, eradication, recovery, and post-incident review. In the event of a confirmed data security incident affecting customer data, Shrunk will notify the customer within 24 hours of confirmation and provide formal notification under the Notifiable Data Breaches scheme where applicable." },
            ],
          },
        ],
      },
      {
        id: "blocks",
        num: "06",
        label: "Standard tender blocks",
        desc: "Reusable drop-in blocks: company details, insurance, references, signatory.",
        questions: [
          {
            id: "company-details",
            question: "Company details",
            tags: ["company details", "abn", "address", "contact", "block"],
            answers: [
              { id: "default", length: "Block", text: "Legal name: Shrunk Innovation Group Pty Ltd\nABN: 15 653 930 691\nCompany type: Australian proprietary company, limited by shares\nRegistered office: Melbourne, Victoria, Australia\nFounded: 2022\nTrading name: Shrunk\nWebsite: shrunk.ai\nPrimary contact: Scott Horsnell, Director\nContact email: scott@shrunk.ai\nAccounts email: accounts@shrunk.ai" },
            ],
          },
          {
            id: "insurance",
            question: "Insurance details",
            tags: ["insurance", "public liability", "professional indemnity", "product liability", "workcover"],
            answers: [
              { id: "default", length: "Block", text: "Public Liability: $20,000,000 per claim\nProfessional Indemnity: $5,000,000 per claim\nProduct Liability: $5,000,000 per claim\nWorkers Compensation: As required under Victorian law\nCertificates: Available on request" },
            ],
          },
          {
            id: "ref-block",
            question: "Reference customers (for shortlist disclosure)",
            tags: ["reference block", "shortlist", "clients block"],
            answers: [
              { id: "default", length: "Block", text: "Direct referee contacts are provided on shortlist confirmation, subject to individual client consent.\n\n• Eastern Health (healthcare)\n• The Royal Women's Hospital (healthcare)\n• University of Melbourne (education)\n• University of Otago (education, New Zealand)\n• Griffith University (education)" },
            ],
          },
          {
            id: "signatory",
            question: "Authorised signatory",
            tags: ["signatory", "authorised", "signing authority"],
            answers: [
              { id: "default", length: "Block", text: "Name: Scott Horsnell\nRole: Founder and Director\nAuthority: Full signing authority for engagements up to and beyond standard tender thresholds\nContact: scott@shrunk.ai" },
            ],
          },
          {
            id: "banking",
            question: "Banking details for payment",
            tags: ["banking", "eft", "account", "payment"],
            note: "Banking details are provided on contract execution to the nominated finance contact only. Do not include banking details in publicly-submitted tender documents.",
            answers: [
              { id: "default", length: "Note", text: "Banking details are provided on contract execution to the nominated finance contact only. Do not include banking details in publicly-submitted tender documents.\n\nFor banking details, contact: accounts@shrunk.ai" },
            ],
          },
        ],
      },
      {
        id: "attestations",
        num: "07",
        label: "Compliance attestations",
        desc: "Drop-in yes/no attestation statements for tender forms.",
        questions: [
          {
            id: "att-privacy",
            question: "Privacy compliance attestation",
            tags: ["attestation", "privacy", "app"],
            answers: [
              { id: "default", length: "Attestation", text: "Shrunk Innovation Group Pty Ltd complies with the Australian Privacy Principles under the Privacy Act 1988 (Cth) in all handling of personal information collected, used, stored, or disclosed in connection with this engagement." },
            ],
          },
          {
            id: "att-whs",
            question: "Workplace health and safety attestation",
            tags: ["attestation", "whs", "ohs"],
            answers: [
              { id: "default", length: "Attestation", text: "Shrunk Innovation Group Pty Ltd attests to compliance with the Occupational Health and Safety Act 2004 (Vic) and equivalent state legislation in jurisdictions where services are delivered. All personnel attending customer sites hold current safety inductions and operate under documented safe work method statements where required." },
            ],
          },
          {
            id: "att-slavery",
            question: "Modern slavery attestation",
            tags: ["attestation", "modern slavery"],
            answers: [
              { id: "default", length: "Attestation", text: "Shrunk Innovation Group Pty Ltd does not meet the reporting threshold under the Modern Slavery Act 2018 (Cth) but maintains an internal supplier code of conduct addressing labour standards and ethical sourcing. The company does not knowingly engage with suppliers operating in violation of modern slavery prohibitions." },
            ],
          },
          {
            id: "att-eeo",
            question: "Equal opportunity attestation",
            tags: ["attestation", "eeo", "equal opportunity"],
            answers: [
              { id: "default", length: "Attestation", text: "Shrunk Innovation Group Pty Ltd is an equal opportunity employer and complies with all applicable Commonwealth and state anti-discrimination legislation including the Sex Discrimination Act 1984, the Racial Discrimination Act 1975, the Disability Discrimination Act 1992, and the Age Discrimination Act 2004." },
            ],
          },
          {
            id: "att-coi",
            question: "Conflict of interest attestation",
            tags: ["attestation", "coi", "conflict"],
            answers: [
              { id: "default", length: "Attestation", text: "Shrunk Innovation Group Pty Ltd is not aware of any conflict of interest that would affect its ability to deliver this engagement impartially. Should any conflict arise during engagement delivery, it will be disclosed to the customer immediately." },
            ],
          },
          {
            id: "att-cyber",
            question: "Cyber security incident notification attestation",
            tags: ["attestation", "cyber", "incident", "notification"],
            answers: [
              { id: "default", length: "Attestation", text: "Shrunk Innovation Group Pty Ltd will notify the customer of any confirmed data security incident affecting customer data within 24 hours of confirmation. Notification will include the nature of the incident, data potentially affected, containment actions taken, and remediation plan." },
            ],
          },
          {
            id: "att-tax",
            question: "Tax compliance attestation",
            tags: ["attestation", "tax", "gst", "ato"],
            answers: [
              { id: "default", length: "Attestation", text: "Shrunk Innovation Group Pty Ltd is registered for Goods and Services Tax (GST) and complies with all taxation obligations under the Income Tax Assessment Act 1997, the A New Tax System (Goods and Services Tax) Act 1999, and related Commonwealth legislation. Tax invoices are issued in compliance with ATO requirements." },
            ],
          },
          {
            id: "att-aus",
            question: "Australian operations attestation",
            tags: ["attestation", "australian operations", "local content"],
            answers: [
              { id: "default", length: "Attestation", text: "Shrunk Innovation Group Pty Ltd is an Australian-owned and operated company headquartered in Melbourne, Victoria. All engineering, customer support, data processing, and reporting are performed in Australia by Australian personnel." },
            ],
          },
        ],
      },
    ],
  };

  function defaultTender() {
    return JSON.parse(JSON.stringify(DEFAULT_TENDER));
  }

  window.TENDER_DEFAULT = DEFAULT_TENDER;
  window.tenderDefault = defaultTender;
})();
