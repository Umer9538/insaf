# INSAF - Product Requirements Document (PRD)

> **Version:** 1.0
> **Last Updated:** December 2024
> **Status:** Active Development Reference

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Goals](#3-product-vision--goals)
4. [User Personas](#4-user-personas)
5. [Feature Specifications](#5-feature-specifications)
6. [User Flows](#6-user-flows)
7. [Technical Architecture](#7-technical-architecture)
8. [Data Models](#8-data-models)
9. [API Structure](#9-api-structure)
10. [MVP Scope & Prioritization](#10-mvp-scope--prioritization)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Success Metrics](#12-success-metrics)
13. [Risks & Mitigations](#13-risks--mitigations)
14. [Glossary](#14-glossary)

---

## 1. Executive Summary

**INSAF** is a mobile application platform designed to revolutionize legal services in Pakistan by connecting clients (individuals and corporates) with verified lawyers through a secure, transparent, and AI-powered digital ecosystem.

### Core Value Propositions

| For Clients | For Lawyers | For Platform |
|-------------|-------------|--------------|
| Find verified, trusted lawyers | Showcase expertise with verified badges | Escrow-based secure transactions |
| AI-powered legal guidance | Receive case opportunities via bidding | End-to-end encrypted communication |
| Transparent pricing via bidding | AI tools for document analysis | Centralized case management |
| Secure escrow payments | Professional profile & portfolio | Administrative oversight |

### Platform Type
- **Primary:** Mobile Application (Flutter - Android & iOS)
- **Backend:** Cloud-based (AWS/Azure/GCP)
- **Languages:** Urdu & English (Bilingual)

---

## 2. Problem Statement

### Primary Problems

1. **Access Barriers:** Systemic inefficiencies, high costs, long distances, and socio-cultural barriers prevent citizens from accessing justice
2. **Trust Deficit:** Deep distrust in the legal system; clients struggle to find verified lawyers
3. **Fragmented Services:** No centralized platform for legal service discovery and management
4. **Transparency Issues:** Unclear pricing, hidden costs, and communication gaps between lawyers and clients
5. **Gender Barriers:** Women face additional hurdles (unfriendly courthouse environments, social taboos, fear of stigma)
6. **New Lawyer Challenges:** Fresh graduates lack platforms to showcase expertise and build credibility

### Impact Statistics (Pakistan Context)
- Millions of pending court cases
- Average case duration: Several years
- Limited legal aid accessibility in rural/semi-urban areas
- Low trust in legal professionals among general population

---

## 3. Product Vision & Goals

### Vision Statement
> *"To create an accessible, transparent, and efficient digital legal ecosystem that democratizes access to justice in Pakistan."*

### Strategic Goals

| Goal | Description | Success Indicator |
|------|-------------|-------------------|
| **G1: Accessible Justice** | Remove barriers to legal services | User acquisition across demographics |
| **G2: Trust & Verification** | Connect users with verified lawyers only | 100% lawyer verification rate |
| **G3: Financial Security** | Protect both parties via escrow | Zero payment disputes |
| **G4: AI Enhancement** | Smarter, faster legal processes | Reduced case processing time |
| **G5: Efficient Workflows** | Streamline case lifecycle | Improved case completion rates |

### Objectives

1. **Establish Secure Platform** - Unified hub linking clients with verified legal professionals
2. **Implement Escrow System** - Protected financial transactions with dual-confirmation release
3. **Integrate AI Tools** - Law Coach, Case Assistant, OCR, Summarization
4. **Enable Secure Communication** - E2E encrypted chat and video consultations
5. **Streamline Case Management** - Thread-based tracking, reminders, dashboards

---

## 4. User Personas

### 4.1 Individual Client

```
Name: Ayesha Malik
Age: 32
Occupation: School Teacher
Location: Lahore, Pakistan

GOALS:
- Find a trustworthy lawyer for property dispute
- Understand legal process without courthouse visits
- Secure and transparent payment

PAIN POINTS:
- Intimidated by courthouse environment
- Previous bad experience with unverified lawyer
- Limited legal knowledge
- Budget constraints

BEHAVIORS:
- Uses smartphone daily
- Prefers Urdu interface
- Values reviews and ratings
- Wants video consultations to avoid travel
```

### 4.2 Corporate Client

```
Name: Hassan Industries (HR Manager: Bilal Ahmed)
Type: Manufacturing Company
Size: 200+ employees
Location: Karachi, Pakistan

GOALS:
- Manage multiple ongoing legal matters
- Maintain panel of verified lawyers
- Track case progress and deadlines
- Compliance and contract management

PAIN POINTS:
- Coordinating with multiple lawyers
- Lack of centralized tracking
- Document management chaos
- Budget tracking across cases

BEHAVIORS:
- Needs dashboard analytics
- Multiple team members access
- Requires audit trails
- Prefers English interface
```

### 4.3 Lawyer (Individual)

```
Name: Advocate Fatima Hassan
Age: 28
Experience: 3 years
Specialization: Family Law
Location: Islamabad, Pakistan

GOALS:
- Build professional reputation
- Acquire new clients
- Manage cases efficiently
- Guaranteed payments

PAIN POINTS:
- Difficult to showcase expertise as new lawyer
- Payment collection issues
- Client communication management
- Document organization

BEHAVIORS:
- Active on professional networks
- Values verified badge for credibility
- Uses AI tools for efficiency
- Wants mobile-first solution
```

### 4.4 Law Firm

```
Name: Justice & Associates
Type: Mid-size Law Firm
Lawyers: 15
Location: Multiple cities, Pakistan

GOALS:
- Manage lawyer assignments
- Track all firm cases centrally
- Build firm reputation
- Analytics and reporting

PAIN POINTS:
- Workload distribution
- Case handover between lawyers
- Firm-wide performance tracking
- Client relationship management

BEHAVIORS:
- Needs admin dashboard
- Role-based access for lawyers
- Bulk case management
- Financial reporting
```

### 4.5 Platform Administrator

```
Role: INSAF Admin Team
Responsibilities:
- Lawyer verification
- Content moderation
- Dispute resolution
- Platform monitoring

GOALS:
- Maintain platform integrity
- Quick dispute resolution
- Ensure compliance
- Monitor system health

TOOLS NEEDED:
- Verification dashboard
- Moderation queue
- Dispute management
- Analytics dashboard
```

---

## 5. Feature Specifications

### 5.1 Authentication & User Management

#### F1.1: User Registration

| Attribute | Details |
|-----------|---------|
| **Priority** | P0 (Critical) |
| **Users** | All user types |
| **Description** | Multi-role registration system |

**User Stories:**
- As a client, I can register using email/phone so I can access legal services
- As a lawyer, I can register and submit credentials for verification
- As a corporate, I can register my organization and add team members

**Acceptance Criteria:**
- [ ] Email/Phone registration with OTP verification
- [ ] CNIC-based registration option
- [ ] Role selection during registration (Client/Lawyer/Corporate/Law Firm)
- [ ] Lawyer registration triggers verification workflow
- [ ] Corporate registration includes organization details
- [ ] Password strength validation
- [ ] Terms & conditions acceptance

**Registration Fields by Role:**

| Field | Client | Lawyer | Corporate | Law Firm |
|-------|--------|--------|-----------|----------|
| Name | ✓ | ✓ | ✓ | ✓ |
| Email | ✓ | ✓ | ✓ | ✓ |
| Phone | ✓ | ✓ | ✓ | ✓ |
| CNIC | Optional | ✓ | - | - |
| Bar ID | - | ✓ | - | - |
| License Docs | - | ✓ | - | ✓ |
| Organization Name | - | - | ✓ | ✓ |
| Organization Type | - | - | ✓ | - |
| Specializations | - | ✓ | - | ✓ |

---

#### F1.2: User Authentication

| Attribute | Details |
|-----------|---------|
| **Priority** | P0 (Critical) |
| **Users** | All user types |

**User Stories:**
- As a user, I can login with email/phone and password
- As a user, I can reset my password via email/SMS
- As a user, I can enable 2FA for additional security
- As a user, I can stay logged in on trusted devices

**Acceptance Criteria:**
- [ ] Email/Phone + Password login
- [ ] OTP-based login option
- [ ] Password reset flow
- [ ] Session management (JWT tokens)
- [ ] Remember me functionality
- [ ] Account lockout after failed attempts
- [ ] Biometric login (fingerprint/face) on mobile

---

#### F1.3: Profile Management

| Attribute | Details |
|-----------|---------|
| **Priority** | P0 (Critical) |
| **Users** | All user types |

**Lawyer Profile Includes:**
- Personal information
- Bar ID & verification status (Verified Badge)
- Specialization areas (Family, Criminal, Corporate, Civil, etc.)
- Experience & education
- Service areas/cities
- Hourly rate / consultation fee
- Portfolio/case highlights
- Ratings & reviews
- Languages spoken
- Availability status

**Client Profile Includes:**
- Personal information
- Contact details
- Case history
- Favorite lawyers list
- Payment methods

---

### 5.2 Lawyer Verification System

#### F2.1: Credential Submission

| Attribute | Details |
|-----------|---------|
| **Priority** | P0 (Critical) |
| **Users** | Lawyers |

**User Stories:**
- As a lawyer, I can upload my Bar ID and license documents for verification
- As a lawyer, I can track my verification status
- As a lawyer, I receive notification when verified

**Required Documents:**
1. Bar Council ID Card (front & back)
2. Law License/Certificate
3. CNIC (front & back)
4. Professional photo
5. Education certificates (optional)

**Verification Status Flow:**
```
PENDING → UNDER_REVIEW → VERIFIED / REJECTED
                              ↓
                        RESUBMIT (if rejected)
```

---

#### F2.2: Admin Verification

| Attribute | Details |
|-----------|---------|
| **Priority** | P0 (Critical) |
| **Users** | Admin |

**User Stories:**
- As an admin, I can view pending verification requests
- As an admin, I can verify documents against Bar Council database
- As an admin, I can approve or reject with reason
- As an admin, I can request additional documents

**Acceptance Criteria:**
- [ ] Verification queue with filters
- [ ] Document viewer with zoom
- [ ] Bar Council database lookup (if available)
- [ ] Approve/Reject with comments
- [ ] Request additional documents
- [ ] Verification history log
- [ ] Badge assignment on approval

---

### 5.3 Case Management

#### F3.1: Case Registration

| Attribute | Details |
|-----------|---------|
| **Priority** | P0 (Critical) |
| **Users** | Clients (Individual & Corporate) |

**User Stories:**
- As a client, I can create a new case with detailed description
- As a client, I can select the area of law and service type
- As a client, I can upload supporting documents
- As a client, I can set budget range and timeline preferences

**Case Creation Fields:**
```
- Case Title
- Case Description (detailed)
- Area of Law (dropdown):
  - Family Law
  - Criminal Law
  - Civil Law
  - Corporate/Business Law
  - Property Law
  - Labor Law
  - Tax Law
  - Constitutional Law
  - Banking Law
  - Cyber Law
  - Other

- Service Type:
  - Legal Consultation
  - Document Drafting
  - Court Representation
  - Legal Opinion
  - Contract Review
  - Full Case Handling

- Budget Range (min-max)
- Preferred Timeline
- Location/Court Jurisdiction
- Urgency Level (Normal/Urgent)
- Document Attachments
- Preferred Language (Urdu/English)
```

**Case Status Flow:**
```
DRAFT → POSTED → MATCHING → BIDDING → ASSIGNED →
IN_PROGRESS → CASE_CLEAR_PENDING → COMPLETED / DISPUTED
```

---

#### F3.2: AI Case Processing

| Attribute | Details |
|-----------|---------|
| **Priority** | P1 (High) |
| **Users** | System (Automated) |

**Components:**

1. **OCR Text Extraction**
   - Extract text from uploaded documents (PDF, images)
   - Support Urdu and English text
   - Handle scanned legal documents

2. **Case Summarization**
   - Generate concise case summary from description
   - Extract key points for lawyer review
   - Create "Case Card" for quick viewing

3. **Key Entity Extraction**
   - Names (parties involved)
   - Dates (incident dates, deadlines)
   - Monetary values
   - Locations
   - Legal references

**Output: Summarized Case Card**
```json
{
  "case_id": "CASE-2024-001",
  "title": "Property Dispute - Land Ownership",
  "summary": "Client seeks legal assistance for...",
  "key_entities": {
    "parties": ["Plaintiff Name", "Defendant Name"],
    "dates": ["2020-05-15", "2024-01-10"],
    "amounts": ["PKR 5,000,000"],
    "locations": ["Lahore", "District Court"]
  },
  "area_of_law": "Property Law",
  "urgency": "Normal",
  "ai_confidence": 0.85
}
```

---

#### F3.3: Lawyer Matching & Recommendation

| Attribute | Details |
|-----------|---------|
| **Priority** | P1 (High) |
| **Users** | Clients, System |

**User Stories:**
- As a client, I can see AI-recommended lawyers for my case
- As a client, I can search and filter lawyers manually
- As a client, I can view lawyer profiles and ratings

**AI Matching Criteria:**
1. Specialization match with case area
2. Location/jurisdiction match
3. Availability status
4. Rating and reviews
5. Price range compatibility
6. Past case success rate
7. Language preference

**Search & Filter Options:**
- Area of law
- Location/city
- Rating (4+, 3+, etc.)
- Price range
- Experience level
- Language
- Availability
- Verified only (default: true)

---

#### F3.4: Bidding System

| Attribute | Details |
|-----------|---------|
| **Priority** | P0 (Critical) |
| **Users** | Lawyers, Clients |

**Lawyer Bidding:**
- As a lawyer, I can view available cases matching my expertise
- As a lawyer, I can submit a bid with proposed fee and timeline
- As a lawyer, I can add a cover letter/proposal
- As a lawyer, I can withdraw my bid before acceptance

**Bid Structure:**
```json
{
  "bid_id": "BID-001",
  "case_id": "CASE-2024-001",
  "lawyer_id": "LAW-001",
  "proposed_fee": 50000,
  "fee_type": "fixed", // or "hourly"
  "estimated_timeline": "30 days",
  "proposal_text": "I have 5 years experience in...",
  "created_at": "2024-01-15T10:00:00Z",
  "status": "pending" // pending, accepted, rejected, withdrawn
}
```

**Client Bid Management:**
- As a client, I can view all bids on my case
- As a client, I can compare bids side by side
- As a client, I can accept a bid (triggers escrow)
- As a client, I can reject bids with optional feedback
- As a client, I can request clarification from bidders

---

#### F3.5: Direct Assignment

| Attribute | Details |
|-----------|---------|
| **Priority** | P1 (High) |
| **Users** | Clients (especially Corporate) |

**User Stories:**
- As a client, I can directly assign a case to a favorite lawyer
- As a corporate, I can assign cases to panel lawyers
- As a lawyer, I can accept or decline direct assignments

**Flow:**
```
Client selects favorite lawyer → Sends assignment request →
Lawyer accepts/rejects → If accepted → Escrow initiated
```

---

#### F3.6: Case Thread & Progress Tracking

| Attribute | Details |
|-----------|---------|
| **Priority** | P0 (Critical) |
| **Users** | Clients, Lawyers |

**User Stories:**
- As a participant, I can view the complete case timeline
- As a participant, I can see all updates in chronological order
- As a participant, I can add updates/notes to the case
- As a participant, I can set and track milestones

**Thread Components:**
- Case status updates
- Document uploads
- Messages exchanged
- Hearing dates
- Milestone completions
- Payment events
- System notifications

---

### 5.4 Payment & Escrow System

#### F4.1: Escrow Creation

| Attribute | Details |
|-----------|---------|
| **Priority** | P0 (Critical) |
| **Users** | Clients, System |

**Flow:**
```
Bid Accepted / Assignment Accepted
        ↓
System calculates 50% of agreed fee
        ↓
Client prompted to pay to escrow
        ↓
Payment processed
        ↓
Funds held in escrow
        ↓
Case status → IN_PROGRESS
```

**User Stories:**
- As a client, I am prompted to pay 50% to escrow when accepting a bid
- As a client, I can see escrow balance and status
- As a lawyer, I can see that escrow is funded before starting work

---

#### F4.2: Escrow Release (Case Clear Verification)

| Attribute | Details |
|-----------|---------|
| **Priority** | P0 (Critical) |
| **Users** | Clients, Lawyers |

**Dual Confirmation Flow:**
```
Case work completed
        ↓
Lawyer marks "Case Clear Request"
        ↓
Client receives notification
        ↓
Client reviews and confirms "Case Clear"
        ↓
BOTH confirmations received
        ↓
Escrow released to lawyer
        ↓
Remaining 50% payment prompted (if applicable)
        ↓
Case status → COMPLETED
```

**Dispute Scenario:**
```
If client disputes → Case status → DISPUTED
        ↓
Admin notified
        ↓
Dispute resolution process
        ↓
Admin decision on fund release
```

---

#### F4.3: Payment Methods

| Attribute | Details |
|-----------|---------|
| **Priority** | P1 (High) |
| **Users** | Clients |

**Supported Methods:**
- Credit/Debit Card
- Bank Transfer
- JazzCash
- EasyPaisa
- Wallet balance (future)

---

### 5.5 Communication System

#### F5.1: Secure Messaging

| Attribute | Details |
|-----------|---------|
| **Priority** | P0 (Critical) |
| **Users** | Clients, Lawyers |

**Features:**
- End-to-end encrypted text messages
- Within case thread context
- File/document sharing
- Read receipts
- Typing indicators
- Message history

**User Stories:**
- As a participant, I can send encrypted messages within a case
- As a participant, I can share documents securely
- As a participant, I can see message delivery/read status

---

#### F5.2: Video Consultation

| Attribute | Details |
|-----------|---------|
| **Priority** | P1 (High) |
| **Users** | Clients, Lawyers |

**Features:**
- Scheduled video calls
- P2P encrypted video
- Screen sharing (for document review)
- Call recording (with consent)
- Calendar integration

**User Stories:**
- As a client, I can book a video consultation slot
- As a lawyer, I can set my availability for consultations
- As a participant, I can join a scheduled video call
- As a participant, I can share my screen during call

**Technical Implementation:**
- AWS Chime / Twilio / Agora SDK
- WebRTC for P2P communication

---

#### F5.3: Notifications

| Attribute | Details |
|-----------|---------|
| **Priority** | P0 (Critical) |
| **Users** | All users |

**Notification Types:**
| Event | Recipients | Channel |
|-------|------------|---------|
| New bid on case | Client | Push, Email |
| Bid accepted | Lawyer | Push, Email |
| New message | Recipient | Push |
| Case update | Participants | Push |
| Hearing reminder | Participants | Push, SMS |
| Payment received | Lawyer | Push, Email |
| Escrow funded | Lawyer | Push |
| Case clear request | Client | Push, Email |
| Verification status | Lawyer | Push, Email |
| Document uploaded | Participants | Push |

---

### 5.6 AI-Powered Tools

#### F6.1: Law Coach (General Legal Advisor)

| Attribute | Details |
|-----------|---------|
| **Priority** | P1 (High) |
| **Users** | Clients |

**Description:**
AI-powered chatbot providing general legal guidance and information.

**Capabilities:**
- Answer general legal questions
- Explain legal processes
- Guide on document requirements
- Suggest relevant area of law
- Provide legal definitions
- NOT a replacement for lawyer advice (disclaimer required)

**User Stories:**
- As a client, I can ask general legal questions
- As a client, I get guidance on which type of lawyer I need
- As a client, I understand basic legal procedures

**Implementation:**
- LLM-based (GPT/Claude API)
- Pakistan law knowledge base
- Conversation history
- Escalation to human support

---

#### F6.2: Case Assistant (Lawyer Tool)

| Attribute | Details |
|-----------|---------|
| **Priority** | P2 (Medium) |
| **Users** | Lawyers |

**Description:**
AI assistant helping lawyers with case-specific analysis and management.

**Capabilities:**
- Document analysis and summarization
- Case law research assistance
- Deadline tracking and reminders
- Strategic suggestions
- Draft document assistance
- Key date extraction

**User Stories:**
- As a lawyer, I can get AI-generated document summaries
- As a lawyer, I receive deadline reminders
- As a lawyer, I can ask case-specific questions to AI
- As a lawyer, I get assistance in draft preparation

---

#### F6.3: Legal Document Generation

| Attribute | Details |
|-----------|---------|
| **Priority** | P2 (Medium) |
| **Users** | Lawyers, Clients |

**Supported Document Types:**
- Affidavits
- Legal Notices
- Contracts (basic templates)
- Power of Attorney
- Rental Agreements
- Employment Contracts
- NDAs
- Wills (basic)

**Flow:**
```
User selects document type
        ↓
System shows template form
        ↓
User fills required fields
        ↓
AI generates document draft
        ↓
Lawyer reviews and edits
        ↓
Final document ready for download
```

---

### 5.7 Lawyer Portfolio & Social Features

#### F7.1: Lawyer Portfolio

| Attribute | Details |
|-----------|---------|
| **Priority** | P2 (Medium) |
| **Users** | Lawyers |

**Features:**
- Post case highlights (anonymized)
- Share legal insights/articles
- Showcase achievements
- Display certifications
- Professional timeline

---

#### F7.2: Reviews & Ratings

| Attribute | Details |
|-----------|---------|
| **Priority** | P1 (High) |
| **Users** | Clients |

**User Stories:**
- As a client, I can rate my lawyer after case completion
- As a client, I can write a detailed review
- As a lawyer, I can respond to reviews
- As a user, I can report inappropriate reviews

**Rating Dimensions:**
- Overall rating (1-5 stars)
- Communication
- Professionalism
- Value for money
- Outcome satisfaction
- Would recommend (Yes/No)

---

#### F7.3: Follow System

| Attribute | Details |
|-----------|---------|
| **Priority** | P3 (Low) |
| **Users** | Clients, Lawyers |

**User Stories:**
- As a client, I can follow lawyers to see their updates
- As a lawyer, I can follow other lawyers for networking
- As a user, I see a feed of updates from followed lawyers

---

#### F7.4: News Feed

| Attribute | Details |
|-----------|---------|
| **Priority** | P3 (Low) |
| **Users** | All users |

**Content Types:**
- Lawyer posts/articles
- Legal news (curated)
- Platform announcements
- Case highlights (anonymized)

---

### 5.8 Corporate Features

#### F8.1: Team Management

| Attribute | Details |
|-----------|---------|
| **Priority** | P2 (Medium) |
| **Users** | Corporate clients |

**User Stories:**
- As a corporate admin, I can add team members
- As a corporate admin, I can assign roles (Admin, Manager, Viewer)
- As a corporate admin, I can manage permissions
- As a team member, I can view assigned cases

**Roles:**
| Role | Permissions |
|------|-------------|
| Admin | Full access, user management, billing |
| Manager | Create cases, assign, view all |
| Member | View assigned cases, communicate |
| Viewer | Read-only access |

---

#### F8.2: Lawyer Panel Management

| Attribute | Details |
|-----------|---------|
| **Priority** | P2 (Medium) |
| **Users** | Corporate clients |

**User Stories:**
- As a corporate, I can maintain a panel of preferred lawyers
- As a corporate, I can directly assign cases to panel lawyers
- As a corporate, I can track lawyer performance across cases

---

#### F8.3: Corporate Dashboard

| Attribute | Details |
|-----------|---------|
| **Priority** | P2 (Medium) |
| **Users** | Corporate clients |

**Dashboard Components:**
- Active cases overview
- Pending actions
- Budget utilization
- Team activity
- Lawyer performance metrics
- Upcoming deadlines
- Recent documents

---

### 5.9 Admin Features

#### F9.1: Lawyer Verification Dashboard

| Attribute | Details |
|-----------|---------|
| **Priority** | P0 (Critical) |
| **Users** | Admin |

**Features:**
- Pending verifications queue
- Document viewer
- Approve/Reject workflow
- Verification history
- Bulk actions

---

#### F9.2: Content Moderation

| Attribute | Details |
|-----------|---------|
| **Priority** | P1 (High) |
| **Users** | Admin |

**Moderation Targets:**
- Reviews and ratings
- Portfolio posts
- Reported content
- Inappropriate messages (if reported)

**Actions:**
- Approve
- Remove
- Warn user
- Suspend user
- Ban user

---

#### F9.3: Dispute Resolution

| Attribute | Details |
|-----------|---------|
| **Priority** | P0 (Critical) |
| **Users** | Admin |

**Dispute Flow:**
```
Dispute lodged (by client or lawyer)
        ↓
Admin reviews case details
        ↓
Admin requests evidence from both parties
        ↓
Admin may schedule mediation meeting
        ↓
Admin makes decision
        ↓
Escrow adjusted per decision
        ↓
Case marked resolved
```

**Admin Actions:**
- Release full escrow to lawyer
- Refund full escrow to client
- Partial split (specify percentages)
- Schedule meeting
- Request additional information
- Escalate (if needed)

---

#### F9.4: Analytics Dashboard

| Attribute | Details |
|-----------|---------|
| **Priority** | P2 (Medium) |
| **Users** | Admin |

**Metrics:**
- User registrations (by type)
- Cases created/completed
- Verification queue status
- Revenue/transactions
- Active users (DAU/MAU)
- Average case duration
- Dispute rate
- Top lawyers by cases
- Popular legal categories

---

### 5.10 Help & Support

#### F10.1: Help Center

| Attribute | Details |
|-----------|---------|
| **Priority** | P2 (Medium) |
| **Users** | All users |

**Components:**
- FAQs
- How-to guides
- Video tutorials
- Contact support form
- Live chat (future)

---

## 6. User Flows

### 6.1 Client Journey: Case to Resolution

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT JOURNEY                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Register │───▶│  Create  │───▶│  Review  │───▶│  Accept  │  │
│  │ /Login   │    │   Case   │    │   Bids   │    │   Bid    │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                        │                              │          │
│                        ▼                              ▼          │
│                  ┌──────────┐                   ┌──────────┐    │
│                  │    AI    │                   │   Pay    │    │
│                  │ Matching │                   │  Escrow  │    │
│                  └──────────┘                   └──────────┘    │
│                                                       │          │
│                                                       ▼          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐  ┌──────────┐    │
│  │  Rate &  │◀───│ Confirm  │◀───│ Track    │◀─│Communicate│   │
│  │  Review  │    │Case Clear│    │ Progress │  │ & Consult │   │
│  └──────────┘    └──────────┘    └──────────┘  └──────────┘    │
│                        │                                         │
│                        ▼                                         │
│                  ┌──────────┐                                    │
│                  │  Escrow  │                                    │
│                  │ Released │                                    │
│                  └──────────┘                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Lawyer Journey: Onboarding to Payment

```
┌─────────────────────────────────────────────────────────────────┐
│                     LAWYER JOURNEY                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Register │───▶│  Upload  │───▶│  Admin   │───▶│ Verified │  │
│  │          │    │  Docs    │    │  Review  │    │  Badge   │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                       │          │
│                                                       ▼          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐  ┌──────────┐    │
│  │  Browse  │───▶│  Submit  │───▶│   Bid    │──▶│  Start   │   │
│  │  Cases   │    │   Bid    │    │ Accepted │  │   Work   │    │
│  └──────────┘    └──────────┘    └──────────┘  └──────────┘    │
│                                                       │          │
│                                                       ▼          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐  ┌──────────┐    │
│  │ Receive  │◀───│  Client  │◀───│ Request  │◀─│ Complete │    │
│  │ Payment  │    │ Confirms │    │Case Clear│  │   Work   │    │
│  └──────────┘    └──────────┘    └──────────┘  └──────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Escrow Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ESCROW FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│     CLIENT                    ESCROW                   LAWYER    │
│        │                        │                        │       │
│        │   Pay 50% to Escrow    │                        │       │
│        │───────────────────────▶│                        │       │
│        │                        │   Notify: Funded       │       │
│        │                        │───────────────────────▶│       │
│        │                        │                        │       │
│        │                        │   Work on Case         │       │
│        │◀ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│       │
│        │                        │                        │       │
│        │                        │   Request Case Clear   │       │
│        │                        │◀───────────────────────│       │
│        │   Confirm Case Clear   │                        │       │
│        │───────────────────────▶│                        │       │
│        │                        │                        │       │
│        │                        │   Release 50%          │       │
│        │                        │───────────────────────▶│       │
│        │                        │                        │       │
│        │   Pay Remaining 50%    │                        │       │
│        │───────────────────────────────────────────────▶│       │
│        │                        │                        │       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Technical Architecture

### 7.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Flutter   │  │   Flutter   │  │    Web      │             │
│  │   Android   │  │     iOS     │  │   (Future)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                 │
├─────────────────────────────────────────────────────────────────┤
│  • Authentication & Authorization                                │
│  • Rate Limiting                                                 │
│  • Request Routing                                               │
│  • SSL Termination                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     User     │  │     Case     │  │   Payment    │          │
│  │   Service    │  │   Service    │  │   Service    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Chat     │  │ Notification │  │      AI      │          │
│  │   Service    │  │   Service    │  │   Service    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │    Admin     │  │   Document   │                             │
│  │   Service    │  │   Service    │                             │
│  └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │    Redis     │  │   MongoDB    │          │
│  │  (Primary)   │  │   (Cache)    │  │   (Logs)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │     S3       │  │ Elasticsearch│                             │
│  │  (Storage)   │  │  (Search)    │                             │
│  └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Firebase   │  │  AWS Chime   │  │   Payment    │          │
│  │    (Auth)    │  │   (Video)    │  │   Gateway    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   OpenAI/    │  │   Twilio     │  │  Bar Council │          │
│  │   Claude     │  │    (SMS)     │  │     API      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Mobile** | Flutter/Dart | Cross-platform mobile app |
| **Backend** | Node.js / Python FastAPI | API services |
| **Database** | PostgreSQL | Primary data store |
| **Cache** | Redis | Session, caching |
| **Search** | Elasticsearch | Lawyer search, case search |
| **Storage** | AWS S3 | Document storage |
| **Auth** | Firebase Auth | Authentication |
| **Video** | AWS Chime / Agora | Video consultations |
| **AI/ML** | OpenAI API / Hugging Face | Law Coach, summarization |
| **OCR** | Tesseract / AWS Textract | Document text extraction |
| **Push** | Firebase Cloud Messaging | Push notifications |
| **SMS** | Twilio | SMS notifications |
| **Payment** | JazzCash/EasyPaisa/Stripe | Payment processing |
| **Hosting** | AWS / GCP | Cloud infrastructure |

### 7.3 Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. TRANSPORT SECURITY                                           │
│     • TLS 1.3 for all communications                            │
│     • Certificate pinning in mobile app                         │
│                                                                  │
│  2. AUTHENTICATION                                               │
│     • JWT tokens with short expiry                              │
│     • Refresh token rotation                                     │
│     • Multi-factor authentication (optional)                     │
│     • Biometric authentication                                   │
│                                                                  │
│  3. AUTHORIZATION                                                │
│     • Role-based access control (RBAC)                          │
│     • Resource-level permissions                                 │
│     • API scope validation                                       │
│                                                                  │
│  4. DATA SECURITY                                                │
│     • Encryption at rest (AES-256)                              │
│     • End-to-end encryption for messages                        │
│     • PII data masking in logs                                  │
│     • Secure document storage                                    │
│                                                                  │
│  5. APPLICATION SECURITY                                         │
│     • Input validation & sanitization                           │
│     • SQL injection prevention                                   │
│     • XSS protection                                             │
│     • Rate limiting                                              │
│     • CORS policies                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Data Models

### 8.1 Core Entities

#### User
```
User {
  id: UUID (PK)
  email: String (unique)
  phone: String (unique)
  password_hash: String
  role: Enum [CLIENT, LAWYER, CORPORATE, LAW_FIRM, ADMIN]
  status: Enum [ACTIVE, SUSPENDED, BANNED]
  created_at: Timestamp
  updated_at: Timestamp
  last_login: Timestamp
  language_preference: Enum [EN, UR]
  notification_settings: JSON
}
```

#### Client Profile
```
ClientProfile {
  id: UUID (PK)
  user_id: UUID (FK -> User)
  full_name: String
  cnic: String (encrypted)
  address: String
  city: String
  profile_image: URL
  favorite_lawyers: [UUID] (FK -> LawyerProfile)
}
```

#### Lawyer Profile
```
LawyerProfile {
  id: UUID (PK)
  user_id: UUID (FK -> User)
  full_name: String
  cnic: String (encrypted)
  bar_id: String
  license_number: String
  specializations: [Enum]
  experience_years: Integer
  education: JSON
  service_areas: [String] (cities)
  bio: Text
  profile_image: URL
  hourly_rate: Decimal
  consultation_fee: Decimal
  languages: [Enum]
  availability_status: Enum [AVAILABLE, BUSY, UNAVAILABLE]
  verification_status: Enum [PENDING, UNDER_REVIEW, VERIFIED, REJECTED]
  verified_at: Timestamp
  verified_by: UUID (FK -> User/Admin)
  rating_average: Decimal
  total_reviews: Integer
  total_cases_completed: Integer
  documents: JSON (verification docs)
}
```

#### Corporate Profile
```
CorporateProfile {
  id: UUID (PK)
  user_id: UUID (FK -> User)
  organization_name: String
  organization_type: String
  registration_number: String
  address: String
  city: String
  logo: URL
  panel_lawyers: [UUID] (FK -> LawyerProfile)
}
```

#### Corporate Member
```
CorporateMember {
  id: UUID (PK)
  corporate_id: UUID (FK -> CorporateProfile)
  user_id: UUID (FK -> User)
  role: Enum [ADMIN, MANAGER, MEMBER, VIEWER]
  added_at: Timestamp
  added_by: UUID (FK -> User)
}
```

#### Case
```
Case {
  id: UUID (PK)
  case_number: String (unique, auto-generated)
  client_id: UUID (FK -> User)
  lawyer_id: UUID (FK -> User, nullable)
  title: String
  description: Text
  area_of_law: Enum
  service_type: Enum
  budget_min: Decimal
  budget_max: Decimal
  agreed_fee: Decimal (nullable)
  urgency: Enum [NORMAL, URGENT]
  preferred_timeline: String
  location: String
  status: Enum [DRAFT, POSTED, MATCHING, BIDDING, ASSIGNED,
                IN_PROGRESS, CASE_CLEAR_PENDING, COMPLETED,
                DISPUTED, CANCELLED]
  ai_summary: Text
  key_entities: JSON
  created_at: Timestamp
  updated_at: Timestamp
  assigned_at: Timestamp
  completed_at: Timestamp
}
```

#### Case Document
```
CaseDocument {
  id: UUID (PK)
  case_id: UUID (FK -> Case)
  uploaded_by: UUID (FK -> User)
  file_name: String
  file_url: URL
  file_type: String
  file_size: Integer
  ocr_text: Text (nullable)
  ocr_status: Enum [PENDING, PROCESSING, COMPLETED, FAILED]
  created_at: Timestamp
}
```

#### Bid
```
Bid {
  id: UUID (PK)
  case_id: UUID (FK -> Case)
  lawyer_id: UUID (FK -> User)
  proposed_fee: Decimal
  fee_type: Enum [FIXED, HOURLY]
  estimated_timeline: String
  proposal_text: Text
  status: Enum [PENDING, ACCEPTED, REJECTED, WITHDRAWN]
  created_at: Timestamp
  updated_at: Timestamp
}
```

#### Escrow
```
Escrow {
  id: UUID (PK)
  case_id: UUID (FK -> Case)
  client_id: UUID (FK -> User)
  lawyer_id: UUID (FK -> User)
  total_amount: Decimal
  escrow_amount: Decimal (50% of total)
  status: Enum [PENDING_PAYMENT, FUNDED, RELEASED, REFUNDED, DISPUTED]
  funded_at: Timestamp
  client_confirmed: Boolean
  client_confirmed_at: Timestamp
  lawyer_confirmed: Boolean
  lawyer_confirmed_at: Timestamp
  released_at: Timestamp
  release_amount: Decimal
  transaction_id: String
}
```

#### Payment
```
Payment {
  id: UUID (PK)
  escrow_id: UUID (FK -> Escrow, nullable)
  payer_id: UUID (FK -> User)
  payee_id: UUID (FK -> User)
  amount: Decimal
  payment_type: Enum [ESCROW, DIRECT, CONSULTATION, REFUND]
  payment_method: Enum [CARD, BANK, JAZZCASH, EASYPAISA]
  status: Enum [PENDING, COMPLETED, FAILED, REFUNDED]
  transaction_ref: String
  created_at: Timestamp
  completed_at: Timestamp
}
```

#### CaseThread (Timeline Entry)
```
CaseThread {
  id: UUID (PK)
  case_id: UUID (FK -> Case)
  user_id: UUID (FK -> User)
  entry_type: Enum [STATUS_CHANGE, MESSAGE, DOCUMENT, PAYMENT,
                    HEARING, MILESTONE, SYSTEM]
  content: Text
  metadata: JSON
  created_at: Timestamp
}
```

#### Message
```
Message {
  id: UUID (PK)
  case_id: UUID (FK -> Case)
  sender_id: UUID (FK -> User)
  recipient_id: UUID (FK -> User)
  content: Text (encrypted)
  message_type: Enum [TEXT, FILE, SYSTEM]
  file_url: URL (nullable)
  read_at: Timestamp (nullable)
  created_at: Timestamp
}
```

#### Consultation
```
Consultation {
  id: UUID (PK)
  case_id: UUID (FK -> Case, nullable)
  client_id: UUID (FK -> User)
  lawyer_id: UUID (FK -> User)
  scheduled_at: Timestamp
  duration_minutes: Integer
  consultation_type: Enum [VIDEO, AUDIO, CHAT]
  status: Enum [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
  meeting_link: URL
  recording_url: URL (nullable)
  notes: Text
  fee: Decimal
  payment_id: UUID (FK -> Payment)
}
```

#### Review
```
Review {
  id: UUID (PK)
  case_id: UUID (FK -> Case)
  reviewer_id: UUID (FK -> User/Client)
  reviewee_id: UUID (FK -> User/Lawyer)
  overall_rating: Integer (1-5)
  communication_rating: Integer (1-5)
  professionalism_rating: Integer (1-5)
  value_rating: Integer (1-5)
  outcome_rating: Integer (1-5)
  would_recommend: Boolean
  review_text: Text
  lawyer_response: Text (nullable)
  status: Enum [ACTIVE, HIDDEN, FLAGGED]
  created_at: Timestamp
}
```

#### Notification
```
Notification {
  id: UUID (PK)
  user_id: UUID (FK -> User)
  type: Enum [BID, CASE_UPDATE, MESSAGE, PAYMENT, REMINDER, SYSTEM]
  title: String
  body: Text
  data: JSON
  read: Boolean
  created_at: Timestamp
  read_at: Timestamp
}
```

#### Dispute
```
Dispute {
  id: UUID (PK)
  case_id: UUID (FK -> Case)
  escrow_id: UUID (FK -> Escrow)
  raised_by: UUID (FK -> User)
  reason: Text
  evidence: JSON (document URLs)
  status: Enum [OPEN, UNDER_REVIEW, RESOLVED, ESCALATED]
  admin_id: UUID (FK -> User, nullable)
  resolution: Text
  resolution_type: Enum [FAVOR_CLIENT, FAVOR_LAWYER, SPLIT, CANCELLED]
  split_client_percent: Integer (nullable)
  created_at: Timestamp
  resolved_at: Timestamp
}
```

#### LawCoachConversation
```
LawCoachConversation {
  id: UUID (PK)
  user_id: UUID (FK -> User)
  created_at: Timestamp
  updated_at: Timestamp
}

LawCoachMessage {
  id: UUID (PK)
  conversation_id: UUID (FK -> LawCoachConversation)
  role: Enum [USER, ASSISTANT]
  content: Text
  created_at: Timestamp
}
```

### 8.2 Entity Relationship Summary

```
User (1) ─────────── (1) ClientProfile
User (1) ─────────── (1) LawyerProfile
User (1) ─────────── (1) CorporateProfile
CorporateProfile (1) ── (N) CorporateMember

User/Client (1) ───── (N) Case
User/Lawyer (1) ───── (N) Case
Case (1) ─────────── (N) CaseDocument
Case (1) ─────────── (N) Bid
Case (1) ─────────── (1) Escrow
Case (1) ─────────── (N) CaseThread
Case (1) ─────────── (N) Message
Case (1) ─────────── (N) Consultation
Case (1) ─────────── (1) Review
Case (1) ─────────── (0..1) Dispute

User (1) ─────────── (N) Notification
User (1) ─────────── (N) LawCoachConversation
```

---

## 9. API Structure

### 9.1 API Endpoints Overview

#### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/verify-otp
POST   /api/v1/auth/resend-otp
```

#### Users & Profiles
```
GET    /api/v1/users/me
PUT    /api/v1/users/me
DELETE /api/v1/users/me
GET    /api/v1/users/:id/profile

# Client specific
PUT    /api/v1/clients/profile
GET    /api/v1/clients/favorites
POST   /api/v1/clients/favorites/:lawyerId
DELETE /api/v1/clients/favorites/:lawyerId

# Lawyer specific
PUT    /api/v1/lawyers/profile
PUT    /api/v1/lawyers/availability
POST   /api/v1/lawyers/verification/submit
GET    /api/v1/lawyers/verification/status
GET    /api/v1/lawyers/dashboard
GET    /api/v1/lawyers/earnings

# Corporate specific
PUT    /api/v1/corporates/profile
GET    /api/v1/corporates/members
POST   /api/v1/corporates/members
PUT    /api/v1/corporates/members/:id
DELETE /api/v1/corporates/members/:id
GET    /api/v1/corporates/panel-lawyers
POST   /api/v1/corporates/panel-lawyers/:lawyerId
DELETE /api/v1/corporates/panel-lawyers/:lawyerId
```

#### Lawyers Discovery
```
GET    /api/v1/lawyers                    # Search & filter
GET    /api/v1/lawyers/:id                # Get lawyer profile
GET    /api/v1/lawyers/:id/reviews        # Get lawyer reviews
GET    /api/v1/lawyers/recommended        # AI recommended for case
```

#### Cases
```
POST   /api/v1/cases                      # Create case
GET    /api/v1/cases                      # List my cases
GET    /api/v1/cases/:id                  # Get case details
PUT    /api/v1/cases/:id                  # Update case
DELETE /api/v1/cases/:id                  # Cancel case
GET    /api/v1/cases/:id/thread           # Get case timeline
POST   /api/v1/cases/:id/documents        # Upload document
GET    /api/v1/cases/:id/documents        # List documents
GET    /api/v1/cases/available            # For lawyers: available cases
POST   /api/v1/cases/:id/assign/:lawyerId # Direct assignment
POST   /api/v1/cases/:id/case-clear       # Request case clear
POST   /api/v1/cases/:id/confirm-clear    # Confirm case clear
```

#### Bids
```
POST   /api/v1/cases/:caseId/bids         # Create bid
GET    /api/v1/cases/:caseId/bids         # List bids on case
GET    /api/v1/bids/:id                   # Get bid details
PUT    /api/v1/bids/:id                   # Update bid
DELETE /api/v1/bids/:id                   # Withdraw bid
POST   /api/v1/bids/:id/accept            # Accept bid
POST   /api/v1/bids/:id/reject            # Reject bid
GET    /api/v1/lawyers/bids               # My bids (for lawyers)
```

#### Payments & Escrow
```
POST   /api/v1/escrow/:caseId/pay         # Pay to escrow
GET    /api/v1/escrow/:caseId             # Get escrow status
POST   /api/v1/payments                   # Make payment
GET    /api/v1/payments                   # Payment history
GET    /api/v1/payments/:id               # Payment details
```

#### Communication
```
GET    /api/v1/cases/:caseId/messages     # Get messages
POST   /api/v1/cases/:caseId/messages     # Send message
POST   /api/v1/messages/:id/read          # Mark as read

# Consultations
POST   /api/v1/consultations              # Book consultation
GET    /api/v1/consultations              # List consultations
GET    /api/v1/consultations/:id          # Get consultation details
PUT    /api/v1/consultations/:id          # Reschedule
DELETE /api/v1/consultations/:id          # Cancel
POST   /api/v1/consultations/:id/join     # Get meeting link
GET    /api/v1/lawyers/:id/availability   # Get lawyer slots
```

#### AI Services
```
POST   /api/v1/ai/law-coach               # Chat with Law Coach
GET    /api/v1/ai/law-coach/history       # Conversation history
POST   /api/v1/ai/summarize               # Summarize document/text
POST   /api/v1/ai/extract-entities        # Extract key entities
POST   /api/v1/ai/generate-document       # Generate legal document
GET    /api/v1/ai/document-templates      # Available templates
```

#### Reviews
```
POST   /api/v1/cases/:caseId/reviews      # Submit review
GET    /api/v1/reviews/:id                # Get review
PUT    /api/v1/reviews/:id/respond        # Lawyer response
POST   /api/v1/reviews/:id/report         # Report review
```

#### Notifications
```
GET    /api/v1/notifications              # List notifications
POST   /api/v1/notifications/read         # Mark as read
PUT    /api/v1/notifications/settings     # Update settings
```

#### Disputes
```
POST   /api/v1/disputes                   # Raise dispute
GET    /api/v1/disputes/:id               # Get dispute details
POST   /api/v1/disputes/:id/evidence      # Submit evidence
```

#### Admin
```
GET    /api/v1/admin/verifications        # Pending verifications
POST   /api/v1/admin/verifications/:id/approve
POST   /api/v1/admin/verifications/:id/reject
GET    /api/v1/admin/disputes             # All disputes
PUT    /api/v1/admin/disputes/:id         # Resolve dispute
GET    /api/v1/admin/moderation           # Flagged content
POST   /api/v1/admin/moderation/:id/action
GET    /api/v1/admin/users                # User management
PUT    /api/v1/admin/users/:id/status     # Suspend/ban
GET    /api/v1/admin/analytics            # Platform analytics
```

---

## 10. MVP Scope & Prioritization

### 10.1 MVP Features (Phase 1)

**Must Have - Launch Blockers**

| Feature | Priority | Complexity |
|---------|----------|------------|
| User Registration & Auth | P0 | Medium |
| Lawyer Registration & Verification | P0 | Medium |
| Client & Lawyer Profiles | P0 | Low |
| Case Creation | P0 | Medium |
| Lawyer Search & Discovery | P0 | Medium |
| Bidding System | P0 | High |
| Bid Accept/Reject | P0 | Medium |
| Escrow Payment (Basic) | P0 | High |
| Case Thread/Timeline | P0 | Medium |
| In-app Messaging | P0 | Medium |
| Notifications (Push) | P0 | Medium |
| Admin: Lawyer Verification | P0 | Medium |

### 10.2 Phase 2 Features

**Should Have - Post-MVP**

| Feature | Priority | Complexity |
|---------|----------|------------|
| AI Case Summarization | P1 | High |
| AI Lawyer Matching | P1 | High |
| OCR Document Processing | P1 | High |
| Video Consultations | P1 | High |
| Direct Case Assignment | P1 | Low |
| Client Favorites | P1 | Low |
| Reviews & Ratings | P1 | Medium |
| Admin: Dispute Resolution | P1 | Medium |
| Admin: Content Moderation | P1 | Medium |

### 10.3 Phase 3 Features

**Nice to Have - Future**

| Feature | Priority | Complexity |
|---------|----------|------------|
| Law Coach AI | P2 | High |
| Case Assistant AI | P2 | High |
| Legal Document Generation | P2 | High |
| Corporate Team Management | P2 | Medium |
| Corporate Dashboard | P2 | Medium |
| Lawyer Portfolio/Posts | P2 | Medium |
| News Feed | P3 | Medium |
| Follow System | P3 | Low |
| Advanced Analytics | P2 | Medium |
| Multi-language (Urdu) | P2 | High |

### 10.4 MVP User Stories

```
EPIC: Authentication
├── US-001: User can register with email/phone
├── US-002: User can login with credentials
├── US-003: User can reset password
└── US-004: User can logout

EPIC: Lawyer Onboarding
├── US-010: Lawyer can submit verification documents
├── US-011: Admin can review verification requests
├── US-012: Admin can approve/reject verification
└── US-013: Lawyer receives verified badge

EPIC: Case Management
├── US-020: Client can create a new case
├── US-021: Client can view their cases
├── US-022: Client can upload documents to case
├── US-023: Lawyer can view available cases
└── US-024: Both can view case timeline

EPIC: Bidding
├── US-030: Lawyer can submit bid on case
├── US-031: Client can view all bids
├── US-032: Client can accept a bid
├── US-033: Client can reject a bid
└── US-034: Lawyer can withdraw bid

EPIC: Payments
├── US-040: Client can pay to escrow after accepting bid
├── US-041: Lawyer can request case clear
├── US-042: Client can confirm case clear
└── US-043: System releases escrow on dual confirmation

EPIC: Communication
├── US-050: Users can send messages within case
├── US-051: Users receive message notifications
└── US-052: Users can view message history
```

---

## 11. Non-Functional Requirements

### 11.1 Performance

| Metric | Requirement |
|--------|-------------|
| API Response Time | < 200ms (95th percentile) |
| Page Load Time | < 3 seconds |
| Search Results | < 1 second |
| Concurrent Users | Support 10,000+ |
| Message Delivery | < 500ms |

### 11.2 Availability

| Metric | Requirement |
|--------|-------------|
| Uptime | 99.5% |
| Planned Downtime | < 4 hours/month |
| Disaster Recovery | RTO: 4 hours, RPO: 1 hour |

### 11.3 Security

| Requirement | Implementation |
|-------------|----------------|
| Data Encryption | AES-256 at rest, TLS 1.3 in transit |
| Message Encryption | End-to-end encryption |
| Authentication | JWT with refresh tokens |
| Password Storage | bcrypt hashing |
| Session Management | Secure, HttpOnly cookies |
| Audit Logging | All sensitive operations logged |

### 11.4 Scalability

| Aspect | Approach |
|--------|----------|
| Horizontal Scaling | Stateless services, load balancing |
| Database Scaling | Read replicas, connection pooling |
| File Storage | Cloud storage (S3) with CDN |
| Caching | Redis for sessions and hot data |

### 11.5 Compliance

- Pakistan Data Protection Laws
- PCI-DSS for payment handling
- GDPR principles (for future expansion)
- Bar Council regulations compliance

---

## 12. Success Metrics

### 12.1 User Acquisition

| Metric | Target (6 months) |
|--------|-------------------|
| Registered Clients | 10,000 |
| Registered Lawyers | 500 |
| Verified Lawyers | 400 (80%) |
| Corporate Accounts | 50 |

### 12.2 Engagement

| Metric | Target |
|--------|--------|
| Monthly Active Users | 5,000 |
| Cases Posted/Month | 500 |
| Bids/Case Average | 3-5 |
| Case Completion Rate | 70% |

### 12.3 Business

| Metric | Target |
|--------|--------|
| Transaction Volume/Month | PKR 5M |
| Platform Fee Revenue | PKR 500K/month |
| Average Case Value | PKR 50,000 |

### 12.4 Quality

| Metric | Target |
|--------|--------|
| Average Rating | 4.0+ stars |
| Dispute Rate | < 5% |
| User Satisfaction (NPS) | > 40 |
| App Store Rating | 4.0+ |

---

## 13. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low lawyer adoption | High | Medium | Incentive programs, marketing to Bar associations |
| Payment gateway issues | High | Low | Multiple payment providers, fallback options |
| AI accuracy concerns | Medium | Medium | Human review layer, continuous improvement |
| Regulatory changes | High | Low | Legal advisory board, compliance monitoring |
| Security breach | Critical | Low | Security audits, penetration testing, encryption |
| Scalability issues | High | Medium | Cloud-native architecture, load testing |
| Bar Council verification delays | Medium | Medium | Manual verification as backup |

---

## 14. Glossary

| Term | Definition |
|------|------------|
| **Bar ID** | Registration number issued by Pakistan Bar Council |
| **Case Clear** | Mutual confirmation that case work is completed satisfactorily |
| **Escrow** | Secure holding of funds until service delivery is confirmed |
| **Law Coach** | AI chatbot providing general legal guidance |
| **Case Assistant** | AI tool helping lawyers with case-specific tasks |
| **Verified Badge** | Visual indicator that lawyer credentials are validated |
| **Thread** | Chronological timeline of all case activities |
| **Bid** | Lawyer's proposal with fee and timeline for a case |
| **Panel Lawyer** | Lawyer pre-approved by a corporate client |
| **OCR** | Optical Character Recognition for extracting text from documents |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2024 | Development Team | Initial PRD based on SRS |

---

*This PRD serves as the single source of truth for INSAF development. All implementation decisions should reference this document.*
