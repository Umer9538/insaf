/**
 * INSAF - Document Generation Service
 *
 * Handles legal document template management and generation
 * Supports bilingual content (English/Urdu)
 */

import { Timestamp } from 'firebase/firestore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  documentDirectory,
  moveAsync,
  readAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import {
  COLLECTIONS,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
} from './firestore.service';
import { uploadGeneratedDocument } from './storage.service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TemplateType = 'VAKALATNAMA' | 'AFFIDAVIT' | 'LEGAL_NOTICE' | 'RENT_AGREEMENT';
export type TemplateCategory = 'POWER_OF_ATTORNEY' | 'SWORN_STATEMENT' | 'NOTICE' | 'AGREEMENT';
export type DocumentStatus = 'DRAFT' | 'GENERATED' | 'DOWNLOADED' | 'SHARED';
export type Language = 'en' | 'ur';

export interface BilingualText {
  en: string;
  ur: string;
}

export interface TemplateFieldOption {
  value: string;
  label: BilingualText;
}

export interface TemplateFieldValidation {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: BilingualText;
}

export interface TemplateField {
  id: string;
  name: string;
  label: BilingualText;
  placeholder: BilingualText;
  type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'phone' | 'cnic' | 'address';
  validation: TemplateFieldValidation;
  options?: TemplateFieldOption[];
  section?: string;
  order: number;
  defaultValue?: string;
}

export interface DocumentTemplate {
  id: string;
  templateType: TemplateType;
  name: BilingualText;
  description: BilingualText;
  icon: string;
  category: TemplateCategory;
  fields: TemplateField[];
  templateContent: BilingualText;
  requiredRole: string[] | null;
  price: number;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface GeneratedDocument {
  id?: string;
  userId: string;
  templateId: string;
  templateType: TemplateType;
  title: string;
  language: Language;
  formData: Record<string, any>;
  generatedContent: string;
  pdfUrl?: string;
  caseId?: string;
  status: DocumentStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  downloadedAt?: Timestamp;
}

// ============================================================================
// TEMPLATE CONTENT - HTML TEMPLATES WITH PLACEHOLDERS
// ============================================================================

const COMMON_STYLES = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap');

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
    }

    body.urdu {
      font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
      direction: rtl;
      text-align: right;
    }

    h1 {
      font-size: 24px;
      text-align: center;
      margin-bottom: 8px;
      color: #1a365d;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    h2 {
      font-size: 18px;
      text-align: center;
      margin-bottom: 30px;
      color: #666;
      font-weight: normal;
    }

    .header-line {
      border-bottom: 2px solid #1a365d;
      margin-bottom: 30px;
    }

    p {
      margin-bottom: 16px;
      text-align: justify;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-weight: bold;
      margin-bottom: 12px;
      color: #1a365d;
      border-bottom: 1px solid #ddd;
      padding-bottom: 4px;
    }

    .field-value {
      font-weight: bold;
      color: #000;
      text-decoration: underline;
    }

    .signature-section {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
    }

    .signature-box {
      width: 45%;
      text-align: center;
    }

    .signature-line {
      border-top: 1px solid #333;
      margin-top: 60px;
      padding-top: 8px;
    }

    .date-place {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }

    .stamp-area {
      border: 2px dashed #999;
      width: 120px;
      height: 120px;
      margin: 20px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 12px;
    }

    .terms-list {
      padding-left: 20px;
    }

    .terms-list li {
      margin-bottom: 8px;
    }

    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }

    .witnesses {
      margin-top: 40px;
    }

    .witness-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }

    .witness-box {
      width: 45%;
    }
  </style>
`;

// Vakalatnama Template (Power of Attorney)
const VAKALATNAMA_TEMPLATE: BilingualText = {
  en: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${COMMON_STYLES}
    </head>
    <body>
      <h1>VAKALATNAMA</h1>
      <h2>(Power of Attorney)</h2>
      <div class="header-line"></div>

      <div class="section">
        <p>
          I/We, <span class="field-value">{{clientName}}</span>,
          S/o / D/o / W/o <span class="field-value">{{clientParentName}}</span>,
          holding CNIC No. <span class="field-value">{{clientCnic}}</span>,
          resident of <span class="field-value">{{clientAddress}}</span>,
          do hereby appoint and authorize:
        </p>
      </div>

      <div class="section">
        <p>
          <span class="field-value">{{lawyerName}}</span>, Advocate,
          License No. <span class="field-value">{{lawyerLicense}}</span>,
          practicing at <span class="field-value">{{lawyerAddress}}</span>,
        </p>
        <p>
          as my/our lawful attorney to appear, plead, argue, and act on my/our behalf in the matter of:
        </p>
      </div>

      <div class="section">
        <p class="section-title">Case Details:</p>
        <p>
          <strong>Case Description:</strong> <span class="field-value">{{caseDescription}}</span>
        </p>
        <p>
          <strong>Court/Forum:</strong> <span class="field-value">{{courtName}}</span>
        </p>
        <p>
          <strong>Case Type:</strong> <span class="field-value">{{caseType}}</span>
        </p>
      </div>

      <div class="section">
        <p class="section-title">Powers Granted:</p>
        <p>The said attorney is hereby authorized to:</p>
        <ol class="terms-list">
          <li>File, sign, verify and present any petition, application, affidavit, or document;</li>
          <li>Appear before any court, tribunal, or authority;</li>
          <li>Make statements, give evidence, and take oaths on my/our behalf;</li>
          <li>Negotiate, compromise, and settle the matter;</li>
          <li>Receive summons, notices, and other legal documents;</li>
          <li>Engage, instruct, and discharge any other advocate or legal practitioner;</li>
          <li>Do all acts, deeds, and things as may be necessary for the proper conduct of the case.</li>
        </ol>
      </div>

      <div class="section">
        <p>
          I/We hereby agree to ratify and confirm all acts lawfully done by the said attorney in pursuance of this Vakalatnama.
        </p>
      </div>

      <div class="date-place">
        <div><strong>Date:</strong> <span class="field-value">{{date}}</span></div>
        <div><strong>Place:</strong> <span class="field-value">{{place}}</span></div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">Signature of Client/Principal</div>
          <p>{{clientName}}</p>
        </div>
        <div class="signature-box">
          <div class="signature-line">Signature of Advocate</div>
          <p>{{lawyerName}}</p>
        </div>
      </div>

      <div class="witnesses">
        <p class="section-title">Witnesses:</p>
        <div class="witness-row">
          <div class="witness-box">
            <p>1. Name: _______________________</p>
            <p>CNIC: _______________________</p>
            <p>Signature: _______________________</p>
          </div>
          <div class="witness-box">
            <p>2. Name: _______________________</p>
            <p>CNIC: _______________________</p>
            <p>Signature: _______________________</p>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This Vakalatnama is executed on <span class="field-value">{{date}}</span> at <span class="field-value">{{place}}</span></p>
        <p>Generated via INSAF Legal Services Platform</p>
      </div>
    </body>
    </html>
  `,
  ur: `
    <!DOCTYPE html>
    <html lang="ur" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${COMMON_STYLES}
    </head>
    <body class="urdu">
      <h1>وکالت نامہ</h1>
      <h2>(پاور آف اٹارنی)</h2>
      <div class="header-line"></div>

      <div class="section">
        <p>
          میں/ہم، <span class="field-value">{{clientName}}</span>،
          ولد/بنت/زوجہ <span class="field-value">{{clientParentName}}</span>،
          شناختی کارڈ نمبر <span class="field-value">{{clientCnic}}</span>،
          مقیم <span class="field-value">{{clientAddress}}</span>،
          ذریعہ ہذا مقرر اور مجاز کرتا/کرتی ہوں:
        </p>
      </div>

      <div class="section">
        <p>
          <span class="field-value">{{lawyerName}}</span>، ایڈووکیٹ،
          لائسنس نمبر <span class="field-value">{{lawyerLicense}}</span>،
          پریکٹس کرنے والے <span class="field-value">{{lawyerAddress}}</span> پر،
        </p>
        <p>
          میرے/ہماری طرف سے پیش ہونے، بحث کرنے اور عمل کرنے کے لیے میرا/ہمارا قانونی وکیل کے طور پر:
        </p>
      </div>

      <div class="section">
        <p class="section-title">مقدمے کی تفصیلات:</p>
        <p>
          <strong>مقدمے کی تفصیل:</strong> <span class="field-value">{{caseDescription}}</span>
        </p>
        <p>
          <strong>عدالت/فورم:</strong> <span class="field-value">{{courtName}}</span>
        </p>
        <p>
          <strong>مقدمے کی قسم:</strong> <span class="field-value">{{caseType}}</span>
        </p>
      </div>

      <div class="section">
        <p class="section-title">دیے گئے اختیارات:</p>
        <p>مذکورہ وکیل کو اس کا اختیار ہے:</p>
        <ol class="terms-list">
          <li>کوئی بھی درخواست، عرضی، حلف نامہ، یا دستاویز دائر کرنا، دستخط کرنا اور پیش کرنا؛</li>
          <li>کسی بھی عدالت، ٹریبونل، یا اتھارٹی کے سامنے پیش ہونا؛</li>
          <li>میری/ہماری طرف سے بیانات دینا، ثبوت دینا، اور حلف اٹھانا؛</li>
          <li>معاملے پر بات چیت، سمجھوتہ اور تصفیہ کرنا؛</li>
          <li>سمن، نوٹس، اور دیگر قانونی دستاویزات وصول کرنا؛</li>
          <li>کسی دوسرے ایڈووکیٹ یا قانونی پریکٹیشنر کو شامل کرنا یا برخاست کرنا؛</li>
          <li>مقدمے کی مناسب کارروائی کے لیے تمام ضروری کام کرنا۔</li>
        </ol>
      </div>

      <div class="date-place">
        <div><strong>تاریخ:</strong> <span class="field-value">{{date}}</span></div>
        <div><strong>مقام:</strong> <span class="field-value">{{place}}</span></div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">موکل کے دستخط</div>
          <p>{{clientName}}</p>
        </div>
        <div class="signature-box">
          <div class="signature-line">وکیل کے دستخط</div>
          <p>{{lawyerName}}</p>
        </div>
      </div>

      <div class="footer">
        <p>یہ وکالت نامہ <span class="field-value">{{date}}</span> کو <span class="field-value">{{place}}</span> میں تیار کیا گیا</p>
        <p>انصاف قانونی خدمات پلیٹ فارم کے ذریعے تیار کردہ</p>
      </div>
    </body>
    </html>
  `,
};

// Affidavit Template
const AFFIDAVIT_TEMPLATE: BilingualText = {
  en: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${COMMON_STYLES}
    </head>
    <body>
      <h1>AFFIDAVIT</h1>
      <h2>(Sworn Statement)</h2>
      <div class="header-line"></div>

      <div class="section">
        <p>
          I, <span class="field-value">{{declarantName}}</span>,
          S/o / D/o / W/o <span class="field-value">{{declarantParentName}}</span>,
          holding CNIC No. <span class="field-value">{{declarantCnic}}</span>,
          aged <span class="field-value">{{declarantAge}}</span> years,
          resident of <span class="field-value">{{declarantAddress}}</span>,
          do hereby solemnly affirm and declare as under:
        </p>
      </div>

      <div class="section">
        <p class="section-title">Purpose of Affidavit:</p>
        <p><span class="field-value">{{purposeOfAffidavit}}</span></p>
      </div>

      <div class="section">
        <p class="section-title">Declaration:</p>
        <p style="white-space: pre-wrap;"><span class="field-value">{{declarationContent}}</span></p>
      </div>

      <div class="section">
        <p>
          I solemnly affirm that the contents of this affidavit are true and correct to the best of my knowledge and belief, and nothing has been concealed therein.
        </p>
        <p>
          I understand that making a false statement in this affidavit is punishable under the law of Pakistan.
        </p>
      </div>

      <div class="stamp-area">
        <span>Revenue Stamp</span>
      </div>

      <div class="date-place">
        <div><strong>Date:</strong> <span class="field-value">{{date}}</span></div>
        <div><strong>Place:</strong> <span class="field-value">{{place}}</span></div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">Signature of Deponent</div>
          <p>{{declarantName}}</p>
        </div>
        <div class="signature-box">
          <div class="signature-line">Notary Public / Oath Commissioner</div>
          <p>Seal & Signature</p>
        </div>
      </div>

      <div class="section" style="margin-top: 40px;">
        <p class="section-title">Verification:</p>
        <p>
          Verified at <span class="field-value">{{place}}</span> on this <span class="field-value">{{date}}</span> that the contents of the above affidavit are true and correct to the best of my knowledge and belief.
        </p>
      </div>

      <div class="footer">
        <p>Generated via INSAF Legal Services Platform</p>
      </div>
    </body>
    </html>
  `,
  ur: `
    <!DOCTYPE html>
    <html lang="ur" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${COMMON_STYLES}
    </head>
    <body class="urdu">
      <h1>حلف نامہ</h1>
      <h2>(قسم شدہ بیان)</h2>
      <div class="header-line"></div>

      <div class="section">
        <p>
          میں، <span class="field-value">{{declarantName}}</span>،
          ولد/بنت/زوجہ <span class="field-value">{{declarantParentName}}</span>،
          شناختی کارڈ نمبر <span class="field-value">{{declarantCnic}}</span>،
          عمر <span class="field-value">{{declarantAge}}</span> سال،
          مقیم <span class="field-value">{{declarantAddress}}</span>،
          ذریعہ ہذا حلفاً بیان کرتا/کرتی ہوں:
        </p>
      </div>

      <div class="section">
        <p class="section-title">حلف نامے کا مقصد:</p>
        <p><span class="field-value">{{purposeOfAffidavit}}</span></p>
      </div>

      <div class="section">
        <p class="section-title">اعلان:</p>
        <p style="white-space: pre-wrap;"><span class="field-value">{{declarationContent}}</span></p>
      </div>

      <div class="section">
        <p>
          میں حلفاً تصدیق کرتا/کرتی ہوں کہ اس حلف نامے کے مندرجات میری معلومات اور یقین کے مطابق درست اور سچ ہیں، اور اس میں کچھ بھی نہیں چھپایا گیا۔
        </p>
      </div>

      <div class="stamp-area">
        <span>ریونیو سٹیمپ</span>
      </div>

      <div class="date-place">
        <div><strong>تاریخ:</strong> <span class="field-value">{{date}}</span></div>
        <div><strong>مقام:</strong> <span class="field-value">{{place}}</span></div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">حلف دہندہ کے دستخط</div>
          <p>{{declarantName}}</p>
        </div>
        <div class="signature-box">
          <div class="signature-line">نوٹری پبلک / اوتھ کمشنر</div>
          <p>مہر اور دستخط</p>
        </div>
      </div>

      <div class="footer">
        <p>انصاف قانونی خدمات پلیٹ فارم کے ذریعے تیار کردہ</p>
      </div>
    </body>
    </html>
  `,
};

// Legal Notice Template
const LEGAL_NOTICE_TEMPLATE: BilingualText = {
  en: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${COMMON_STYLES}
    </head>
    <body>
      <h1>LEGAL NOTICE</h1>
      <h2>Under Section 80 CPC / Relevant Law</h2>
      <div class="header-line"></div>

      <div class="section">
        <p><strong>Date:</strong> <span class="field-value">{{date}}</span></p>
      </div>

      <div class="section">
        <p class="section-title">FROM (Sender):</p>
        <p>
          <span class="field-value">{{senderName}}</span><br>
          CNIC: <span class="field-value">{{senderCnic}}</span><br>
          Address: <span class="field-value">{{senderAddress}}</span><br>
          Phone: <span class="field-value">{{senderPhone}}</span>
        </p>
      </div>

      <div class="section">
        <p class="section-title">TO (Recipient):</p>
        <p>
          <span class="field-value">{{recipientName}}</span><br>
          Address: <span class="field-value">{{recipientAddress}}</span>
        </p>
      </div>

      <div class="section">
        <p class="section-title">Subject: <span class="field-value">{{subject}}</span></p>
      </div>

      <div class="section">
        <p>Dear Sir/Madam,</p>
        <p>
          Under instructions from and on behalf of my client, <span class="field-value">{{senderName}}</span>,
          I hereby serve upon you the following Legal Notice:
        </p>
      </div>

      <div class="section">
        <p class="section-title">Facts of the Matter:</p>
        <p style="white-space: pre-wrap;"><span class="field-value">{{noticeContent}}</span></p>
      </div>

      <div class="section">
        <p class="section-title">Demand / Action Required:</p>
        <p style="white-space: pre-wrap;"><span class="field-value">{{demandedAction}}</span></p>
      </div>

      <div class="section">
        <p>
          You are hereby called upon to comply with the above demand within
          <span class="field-value">{{responseDeadlineDays}}</span> days from the receipt of this notice,
          failing which my client shall be constrained to initiate appropriate legal proceedings against you,
          civil and/or criminal, at your risk, cost, and consequences, without any further notice.
        </p>
      </div>

      <div class="section">
        <p>
          This notice is issued without prejudice to all other rights and remedies available to my client under the law.
        </p>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">Advocate for the Sender</div>
          <p>{{lawyerName}}</p>
          <p>License No: {{lawyerLicense}}</p>
        </div>
      </div>

      <div class="footer">
        <p>Generated via INSAF Legal Services Platform</p>
      </div>
    </body>
    </html>
  `,
  ur: `
    <!DOCTYPE html>
    <html lang="ur" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${COMMON_STYLES}
    </head>
    <body class="urdu">
      <h1>قانونی نوٹس</h1>
      <h2>سیکشن 80 سی پی سی / متعلقہ قانون کے تحت</h2>
      <div class="header-line"></div>

      <div class="section">
        <p><strong>تاریخ:</strong> <span class="field-value">{{date}}</span></p>
      </div>

      <div class="section">
        <p class="section-title">از (بھیجنے والا):</p>
        <p>
          <span class="field-value">{{senderName}}</span><br>
          شناختی کارڈ: <span class="field-value">{{senderCnic}}</span><br>
          پتہ: <span class="field-value">{{senderAddress}}</span><br>
          فون: <span class="field-value">{{senderPhone}}</span>
        </p>
      </div>

      <div class="section">
        <p class="section-title">بنام (وصول کنندہ):</p>
        <p>
          <span class="field-value">{{recipientName}}</span><br>
          پتہ: <span class="field-value">{{recipientAddress}}</span>
        </p>
      </div>

      <div class="section">
        <p class="section-title">موضوع: <span class="field-value">{{subject}}</span></p>
      </div>

      <div class="section">
        <p>جناب/محترمہ،</p>
        <p>
          اپنے موکل <span class="field-value">{{senderName}}</span> کی ہدایات پر اور ان کی طرف سے،
          میں ذریعہ ہذا آپ کو درج ذیل قانونی نوٹس بھیجتا/بھیجتی ہوں:
        </p>
      </div>

      <div class="section">
        <p class="section-title">معاملے کی تفصیلات:</p>
        <p style="white-space: pre-wrap;"><span class="field-value">{{noticeContent}}</span></p>
      </div>

      <div class="section">
        <p class="section-title">مطالبہ / مطلوبہ کارروائی:</p>
        <p style="white-space: pre-wrap;"><span class="field-value">{{demandedAction}}</span></p>
      </div>

      <div class="section">
        <p>
          آپ سے کہا جاتا ہے کہ اس نوٹس کی وصولی کے
          <span class="field-value">{{responseDeadlineDays}}</span> دنوں کے اندر مذکورہ مطالبے کی تعمیل کریں،
          ورنہ میرا موکل آپ کے خلاف مناسب قانونی کارروائی شروع کرنے پر مجبور ہوگا۔
        </p>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">بھیجنے والے کے وکیل</div>
          <p>{{lawyerName}}</p>
          <p>لائسنس نمبر: {{lawyerLicense}}</p>
        </div>
      </div>

      <div class="footer">
        <p>انصاف قانونی خدمات پلیٹ فارم کے ذریعے تیار کردہ</p>
      </div>
    </body>
    </html>
  `,
};

// Rent Agreement Template
const RENT_AGREEMENT_TEMPLATE: BilingualText = {
  en: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${COMMON_STYLES}
    </head>
    <body>
      <h1>RENT AGREEMENT</h1>
      <h2>(Lease Deed)</h2>
      <div class="header-line"></div>

      <div class="section">
        <p>
          This Rent Agreement is made and executed on <span class="field-value">{{agreementDate}}</span>
          at <span class="field-value">{{place}}</span>.
        </p>
      </div>

      <div class="section">
        <p class="section-title">BETWEEN:</p>
        <p>
          <strong>LANDLORD:</strong><br>
          <span class="field-value">{{landlordName}}</span>,
          CNIC No. <span class="field-value">{{landlordCnic}}</span>,
          resident of <span class="field-value">{{landlordAddress}}</span>,
          (hereinafter referred to as the "LANDLORD" / "FIRST PARTY")
        </p>
        <p style="text-align: center; margin: 20px 0;"><strong>AND</strong></p>
        <p>
          <strong>TENANT:</strong><br>
          <span class="field-value">{{tenantName}}</span>,
          CNIC No. <span class="field-value">{{tenantCnic}}</span>,
          resident of <span class="field-value">{{tenantAddress}}</span>,
          (hereinafter referred to as the "TENANT" / "SECOND PARTY")
        </p>
      </div>

      <div class="section">
        <p class="section-title">PROPERTY DETAILS:</p>
        <p>
          <strong>Property Address:</strong> <span class="field-value">{{propertyAddress}}</span><br>
          <strong>Property Type:</strong> <span class="field-value">{{propertyType}}</span>
        </p>
      </div>

      <div class="section">
        <p class="section-title">TERMS AND CONDITIONS:</p>
        <ol class="terms-list">
          <li>
            <strong>Rent Amount:</strong> The monthly rent shall be PKR <span class="field-value">{{monthlyRent}}</span>/-
            (Rupees <span class="field-value">{{monthlyRentWords}}</span> only), payable by the
            <span class="field-value">{{rentDueDay}}</span> of each month.
          </li>
          <li>
            <strong>Security Deposit:</strong> The Tenant has paid PKR <span class="field-value">{{securityDeposit}}</span>/-
            as security deposit, refundable at the end of tenancy after deducting any dues or damages.
          </li>
          <li>
            <strong>Advance Rent:</strong> <span class="field-value">{{advanceMonths}}</span> month(s) advance rent
            of PKR <span class="field-value">{{advanceAmount}}</span>/- has been paid.
          </li>
          <li>
            <strong>Agreement Period:</strong> This agreement shall commence from
            <span class="field-value">{{startDate}}</span> and shall remain valid for a period of
            <span class="field-value">{{durationMonths}}</span> months, ending on
            <span class="field-value">{{endDate}}</span>.
          </li>
          <li>
            <strong>Utilities:</strong> The Tenant shall pay all utility bills including electricity, gas, water, and other charges.
          </li>
          <li>
            <strong>Maintenance:</strong> Minor repairs shall be borne by the Tenant. Major structural repairs shall be the responsibility of the Landlord.
          </li>
          <li>
            <strong>Sub-letting:</strong> The Tenant shall not sub-let the premises or any part thereof without prior written consent of the Landlord.
          </li>
          <li>
            <strong>Termination:</strong> Either party may terminate this agreement by giving one month's written notice.
          </li>
        </ol>
      </div>

      <div class="section">
        <p class="section-title">Additional Terms:</p>
        <p style="white-space: pre-wrap;"><span class="field-value">{{additionalTerms}}</span></p>
      </div>

      <div class="section">
        <p>
          Both parties have read, understood, and agreed to the above terms and conditions.
        </p>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">Landlord's Signature</div>
          <p>{{landlordName}}</p>
          <p>CNIC: {{landlordCnic}}</p>
        </div>
        <div class="signature-box">
          <div class="signature-line">Tenant's Signature</div>
          <p>{{tenantName}}</p>
          <p>CNIC: {{tenantCnic}}</p>
        </div>
      </div>

      <div class="witnesses">
        <p class="section-title">Witnesses:</p>
        <div class="witness-row">
          <div class="witness-box">
            <p>1. Name: _______________________</p>
            <p>CNIC: _______________________</p>
            <p>Signature: _______________________</p>
          </div>
          <div class="witness-box">
            <p>2. Name: _______________________</p>
            <p>CNIC: _______________________</p>
            <p>Signature: _______________________</p>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Generated via INSAF Legal Services Platform</p>
      </div>
    </body>
    </html>
  `,
  ur: `
    <!DOCTYPE html>
    <html lang="ur" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${COMMON_STYLES}
    </head>
    <body class="urdu">
      <h1>کرایہ نامہ</h1>
      <h2>(لیز ڈیڈ)</h2>
      <div class="header-line"></div>

      <div class="section">
        <p>
          یہ کرایہ نامہ <span class="field-value">{{agreementDate}}</span> کو
          <span class="field-value">{{place}}</span> میں تحریر کیا گیا۔
        </p>
      </div>

      <div class="section">
        <p class="section-title">فریقین:</p>
        <p>
          <strong>مالک مکان:</strong><br>
          <span class="field-value">{{landlordName}}</span>،
          شناختی کارڈ نمبر <span class="field-value">{{landlordCnic}}</span>،
          مقیم <span class="field-value">{{landlordAddress}}</span>،
          (جسے آئندہ "مالک مکان" / "فریق اول" کہا جائے گا)
        </p>
        <p style="text-align: center; margin: 20px 0;"><strong>اور</strong></p>
        <p>
          <strong>کرایہ دار:</strong><br>
          <span class="field-value">{{tenantName}}</span>،
          شناختی کارڈ نمبر <span class="field-value">{{tenantCnic}}</span>،
          مقیم <span class="field-value">{{tenantAddress}}</span>،
          (جسے آئندہ "کرایہ دار" / "فریق دوم" کہا جائے گا)
        </p>
      </div>

      <div class="section">
        <p class="section-title">جائیداد کی تفصیلات:</p>
        <p>
          <strong>جائیداد کا پتہ:</strong> <span class="field-value">{{propertyAddress}}</span><br>
          <strong>جائیداد کی قسم:</strong> <span class="field-value">{{propertyType}}</span>
        </p>
      </div>

      <div class="section">
        <p class="section-title">شرائط و ضوابط:</p>
        <ol class="terms-list">
          <li>
            <strong>کرایہ:</strong> ماہانہ کرایہ <span class="field-value">{{monthlyRent}}</span> روپے ہوگا،
            جو ہر مہینے کی <span class="field-value">{{rentDueDay}}</span> تاریخ کو ادا کیا جائے گا۔
          </li>
          <li>
            <strong>سیکورٹی ڈپازٹ:</strong> کرایہ دار نے <span class="field-value">{{securityDeposit}}</span> روپے
            سیکورٹی ڈپازٹ کے طور پر جمع کرائے ہیں۔
          </li>
          <li>
            <strong>پیشگی کرایہ:</strong> <span class="field-value">{{advanceMonths}}</span> ماہ کا پیشگی کرایہ
            <span class="field-value">{{advanceAmount}}</span> روپے ادا کر دیا گیا ہے۔
          </li>
          <li>
            <strong>معاہدے کی مدت:</strong> یہ معاہدہ <span class="field-value">{{startDate}}</span> سے شروع ہوگا
            اور <span class="field-value">{{durationMonths}}</span> ماہ کے لیے <span class="field-value">{{endDate}}</span> تک جاری رہے گا۔
          </li>
          <li>
            <strong>یوٹیلیٹیز:</strong> کرایہ دار بجلی، گیس، پانی اور دیگر بلوں کا خود ذمہ دار ہوگا۔
          </li>
          <li>
            <strong>مرمت:</strong> معمولی مرمت کرایہ دار کی ذمہ داری ہوگی۔ بڑی تعمیراتی مرمت مالک مکان کی ذمہ داری ہوگی۔
          </li>
        </ol>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">مالک مکان کے دستخط</div>
          <p>{{landlordName}}</p>
          <p>شناختی کارڈ: {{landlordCnic}}</p>
        </div>
        <div class="signature-box">
          <div class="signature-line">کرایہ دار کے دستخط</div>
          <p>{{tenantName}}</p>
          <p>شناختی کارڈ: {{tenantCnic}}</p>
        </div>
      </div>

      <div class="footer">
        <p>انصاف قانونی خدمات پلیٹ فارم کے ذریعے تیار کردہ</p>
      </div>
    </body>
    </html>
  `,
};

// ============================================================================
// TEMPLATE DEFINITIONS - FIELD CONFIGURATIONS
// ============================================================================

export const DOCUMENT_TEMPLATES: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Vakalatnama Template
  {
    templateType: 'VAKALATNAMA',
    name: { en: 'Vakalatnama', ur: 'وکالت نامہ' },
    description: {
      en: 'Power of Attorney to authorize a lawyer to represent you in court',
      ur: 'عدالت میں نمائندگی کے لیے وکیل کو اختیار دینے کا دستاویز',
    },
    icon: 'document-text',
    category: 'POWER_OF_ATTORNEY',
    requiredRole: null,
    price: 0,
    isActive: true,
    templateContent: VAKALATNAMA_TEMPLATE,
    fields: [
      // Client Section
      {
        id: 'clientName',
        name: 'clientName',
        label: { en: 'Client Full Name', ur: 'موکل کا پورا نام' },
        placeholder: { en: 'Enter your full name', ur: 'اپنا پورا نام درج کریں' },
        type: 'text',
        validation: { required: true, minLength: 3, maxLength: 100 },
        section: 'client',
        order: 1,
      },
      {
        id: 'clientParentName',
        name: 'clientParentName',
        label: { en: 'Father/Husband Name', ur: 'والد/شوہر کا نام' },
        placeholder: { en: 'Enter father/husband name', ur: 'والد/شوہر کا نام درج کریں' },
        type: 'text',
        validation: { required: true, minLength: 3, maxLength: 100 },
        section: 'client',
        order: 2,
      },
      {
        id: 'clientCnic',
        name: 'clientCnic',
        label: { en: 'Client CNIC', ur: 'موکل کا شناختی کارڈ نمبر' },
        placeholder: { en: '00000-0000000-0', ur: '00000-0000000-0' },
        type: 'cnic',
        validation: {
          required: true,
          pattern: '^[0-9]{5}-[0-9]{7}-[0-9]$',
          patternMessage: { en: 'Format: 00000-0000000-0', ur: 'فارمیٹ: 00000-0000000-0' },
        },
        section: 'client',
        order: 3,
      },
      {
        id: 'clientAddress',
        name: 'clientAddress',
        label: { en: 'Client Address', ur: 'موکل کا پتہ' },
        placeholder: { en: 'Enter complete address', ur: 'مکمل پتہ درج کریں' },
        type: 'address',
        validation: { required: true, minLength: 10, maxLength: 300 },
        section: 'client',
        order: 4,
      },
      // Lawyer Section
      {
        id: 'lawyerName',
        name: 'lawyerName',
        label: { en: 'Lawyer Name', ur: 'وکیل کا نام' },
        placeholder: { en: 'Enter lawyer full name', ur: 'وکیل کا پورا نام درج کریں' },
        type: 'text',
        validation: { required: true, minLength: 3, maxLength: 100 },
        section: 'lawyer',
        order: 5,
      },
      {
        id: 'lawyerLicense',
        name: 'lawyerLicense',
        label: { en: 'Lawyer License Number', ur: 'وکیل کا لائسنس نمبر' },
        placeholder: { en: 'Enter license number', ur: 'لائسنس نمبر درج کریں' },
        type: 'text',
        validation: { required: true, minLength: 3, maxLength: 50 },
        section: 'lawyer',
        order: 6,
      },
      {
        id: 'lawyerAddress',
        name: 'lawyerAddress',
        label: { en: 'Lawyer Office Address', ur: 'وکیل کے دفتر کا پتہ' },
        placeholder: { en: 'Enter office address', ur: 'دفتر کا پتہ درج کریں' },
        type: 'address',
        validation: { required: true, minLength: 10, maxLength: 300 },
        section: 'lawyer',
        order: 7,
      },
      // Case Section
      {
        id: 'caseDescription',
        name: 'caseDescription',
        label: { en: 'Case Description', ur: 'مقدمے کی تفصیل' },
        placeholder: { en: 'Briefly describe the legal matter', ur: 'قانونی معاملے کی مختصر تفصیل' },
        type: 'textarea',
        validation: { required: true, minLength: 20, maxLength: 500 },
        section: 'case',
        order: 8,
      },
      {
        id: 'courtName',
        name: 'courtName',
        label: { en: 'Court/Forum Name', ur: 'عدالت/فورم کا نام' },
        placeholder: { en: 'e.g., Civil Court Lahore', ur: 'مثلاً سول کورٹ لاہور' },
        type: 'text',
        validation: { required: true, minLength: 5, maxLength: 150 },
        section: 'case',
        order: 9,
      },
      {
        id: 'caseType',
        name: 'caseType',
        label: { en: 'Case Type', ur: 'مقدمے کی قسم' },
        placeholder: { en: 'Select case type', ur: 'مقدمے کی قسم منتخب کریں' },
        type: 'select',
        validation: { required: true },
        options: [
          { value: 'CIVIL', label: { en: 'Civil Case', ur: 'دیوانی مقدمہ' } },
          { value: 'CRIMINAL', label: { en: 'Criminal Case', ur: 'فوجداری مقدمہ' } },
          { value: 'FAMILY', label: { en: 'Family Case', ur: 'خاندانی مقدمہ' } },
          { value: 'PROPERTY', label: { en: 'Property Case', ur: 'جائیداد کا مقدمہ' } },
          { value: 'CORPORATE', label: { en: 'Corporate/Commercial', ur: 'کارپوریٹ/تجارتی' } },
          { value: 'OTHER', label: { en: 'Other', ur: 'دیگر' } },
        ],
        section: 'case',
        order: 10,
      },
      // Document Section
      {
        id: 'date',
        name: 'date',
        label: { en: 'Date', ur: 'تاریخ' },
        placeholder: { en: 'Select date', ur: 'تاریخ منتخب کریں' },
        type: 'date',
        validation: { required: true },
        section: 'document',
        order: 11,
      },
      {
        id: 'place',
        name: 'place',
        label: { en: 'Place', ur: 'مقام' },
        placeholder: { en: 'City name', ur: 'شہر کا نام' },
        type: 'text',
        validation: { required: true, minLength: 2, maxLength: 100 },
        section: 'document',
        order: 12,
      },
    ],
  },
  // Affidavit Template
  {
    templateType: 'AFFIDAVIT',
    name: { en: 'Affidavit', ur: 'حلف نامہ' },
    description: {
      en: 'Sworn statement for legal declarations and verifications',
      ur: 'قانونی اعلانات اور تصدیق کے لیے حلفیہ بیان',
    },
    icon: 'shield-checkmark',
    category: 'SWORN_STATEMENT',
    requiredRole: null,
    price: 0,
    isActive: true,
    templateContent: AFFIDAVIT_TEMPLATE,
    fields: [
      {
        id: 'declarantName',
        name: 'declarantName',
        label: { en: 'Declarant Full Name', ur: 'حلف دہندہ کا پورا نام' },
        placeholder: { en: 'Enter your full name', ur: 'اپنا پورا نام درج کریں' },
        type: 'text',
        validation: { required: true, minLength: 3, maxLength: 100 },
        section: 'declarant',
        order: 1,
      },
      {
        id: 'declarantParentName',
        name: 'declarantParentName',
        label: { en: 'Father/Husband Name', ur: 'والد/شوہر کا نام' },
        placeholder: { en: 'Enter father/husband name', ur: 'والد/شوہر کا نام درج کریں' },
        type: 'text',
        validation: { required: true, minLength: 3, maxLength: 100 },
        section: 'declarant',
        order: 2,
      },
      {
        id: 'declarantCnic',
        name: 'declarantCnic',
        label: { en: 'CNIC Number', ur: 'شناختی کارڈ نمبر' },
        placeholder: { en: '00000-0000000-0', ur: '00000-0000000-0' },
        type: 'cnic',
        validation: {
          required: true,
          pattern: '^[0-9]{5}-[0-9]{7}-[0-9]$',
          patternMessage: { en: 'Format: 00000-0000000-0', ur: 'فارمیٹ: 00000-0000000-0' },
        },
        section: 'declarant',
        order: 3,
      },
      {
        id: 'declarantAge',
        name: 'declarantAge',
        label: { en: 'Age', ur: 'عمر' },
        placeholder: { en: 'Enter age', ur: 'عمر درج کریں' },
        type: 'number',
        validation: { required: true },
        section: 'declarant',
        order: 4,
      },
      {
        id: 'declarantAddress',
        name: 'declarantAddress',
        label: { en: 'Complete Address', ur: 'مکمل پتہ' },
        placeholder: { en: 'Enter complete address', ur: 'مکمل پتہ درج کریں' },
        type: 'address',
        validation: { required: true, minLength: 10, maxLength: 300 },
        section: 'declarant',
        order: 5,
      },
      {
        id: 'purposeOfAffidavit',
        name: 'purposeOfAffidavit',
        label: { en: 'Purpose of Affidavit', ur: 'حلف نامے کا مقصد' },
        placeholder: { en: 'e.g., For name correction, address proof', ur: 'مثلاً نام کی درستگی، پتے کا ثبوت' },
        type: 'text',
        validation: { required: true, minLength: 10, maxLength: 200 },
        section: 'declaration',
        order: 6,
      },
      {
        id: 'declarationContent',
        name: 'declarationContent',
        label: { en: 'Declaration Content', ur: 'اعلان کا متن' },
        placeholder: {
          en: 'Write your declaration here. Start with "That I..."',
          ur: 'یہاں اپنا اعلان لکھیں۔ "کہ میں..." سے شروع کریں',
        },
        type: 'textarea',
        validation: { required: true, minLength: 50, maxLength: 2000 },
        section: 'declaration',
        order: 7,
      },
      {
        id: 'date',
        name: 'date',
        label: { en: 'Date', ur: 'تاریخ' },
        placeholder: { en: 'Select date', ur: 'تاریخ منتخب کریں' },
        type: 'date',
        validation: { required: true },
        section: 'document',
        order: 8,
      },
      {
        id: 'place',
        name: 'place',
        label: { en: 'Place', ur: 'مقام' },
        placeholder: { en: 'City name', ur: 'شہر کا نام' },
        type: 'text',
        validation: { required: true, minLength: 2, maxLength: 100 },
        section: 'document',
        order: 9,
      },
    ],
  },
  // Legal Notice Template
  {
    templateType: 'LEGAL_NOTICE',
    name: { en: 'Legal Notice', ur: 'قانونی نوٹس' },
    description: {
      en: 'Formal notice demanding action or response before legal proceedings',
      ur: 'قانونی کارروائی سے پہلے کارروائی یا جواب کا مطالبہ کرنے والا رسمی نوٹس',
    },
    icon: 'alert-circle',
    category: 'NOTICE',
    requiredRole: null,
    price: 0,
    isActive: true,
    templateContent: LEGAL_NOTICE_TEMPLATE,
    fields: [
      // Sender Section
      {
        id: 'senderName',
        name: 'senderName',
        label: { en: 'Sender Name', ur: 'بھیجنے والے کا نام' },
        placeholder: { en: 'Enter sender full name', ur: 'بھیجنے والے کا پورا نام' },
        type: 'text',
        validation: { required: true, minLength: 3, maxLength: 100 },
        section: 'sender',
        order: 1,
      },
      {
        id: 'senderCnic',
        name: 'senderCnic',
        label: { en: 'Sender CNIC', ur: 'بھیجنے والے کا شناختی کارڈ' },
        placeholder: { en: '00000-0000000-0', ur: '00000-0000000-0' },
        type: 'cnic',
        validation: {
          required: true,
          pattern: '^[0-9]{5}-[0-9]{7}-[0-9]$',
          patternMessage: { en: 'Format: 00000-0000000-0', ur: 'فارمیٹ: 00000-0000000-0' },
        },
        section: 'sender',
        order: 2,
      },
      {
        id: 'senderAddress',
        name: 'senderAddress',
        label: { en: 'Sender Address', ur: 'بھیجنے والے کا پتہ' },
        placeholder: { en: 'Enter complete address', ur: 'مکمل پتہ درج کریں' },
        type: 'address',
        validation: { required: true, minLength: 10, maxLength: 300 },
        section: 'sender',
        order: 3,
      },
      {
        id: 'senderPhone',
        name: 'senderPhone',
        label: { en: 'Sender Phone', ur: 'بھیجنے والے کا فون' },
        placeholder: { en: '03XX-XXXXXXX', ur: '03XX-XXXXXXX' },
        type: 'phone',
        validation: { required: true },
        section: 'sender',
        order: 4,
      },
      // Recipient Section
      {
        id: 'recipientName',
        name: 'recipientName',
        label: { en: 'Recipient Name', ur: 'وصول کنندہ کا نام' },
        placeholder: { en: 'Enter recipient full name', ur: 'وصول کنندہ کا پورا نام' },
        type: 'text',
        validation: { required: true, minLength: 3, maxLength: 100 },
        section: 'recipient',
        order: 5,
      },
      {
        id: 'recipientAddress',
        name: 'recipientAddress',
        label: { en: 'Recipient Address', ur: 'وصول کنندہ کا پتہ' },
        placeholder: { en: 'Enter complete address', ur: 'مکمل پتہ درج کریں' },
        type: 'address',
        validation: { required: true, minLength: 10, maxLength: 300 },
        section: 'recipient',
        order: 6,
      },
      // Notice Content
      {
        id: 'subject',
        name: 'subject',
        label: { en: 'Subject', ur: 'موضوع' },
        placeholder: { en: 'Brief subject of the notice', ur: 'نوٹس کا مختصر موضوع' },
        type: 'text',
        validation: { required: true, minLength: 10, maxLength: 200 },
        section: 'notice',
        order: 7,
      },
      {
        id: 'noticeContent',
        name: 'noticeContent',
        label: { en: 'Notice Content', ur: 'نوٹس کا متن' },
        placeholder: {
          en: 'Describe the facts and grievances in detail',
          ur: 'حقائق اور شکایات کی تفصیل بیان کریں',
        },
        type: 'textarea',
        validation: { required: true, minLength: 100, maxLength: 3000 },
        section: 'notice',
        order: 8,
      },
      {
        id: 'demandedAction',
        name: 'demandedAction',
        label: { en: 'Demanded Action', ur: 'مطلوبہ کارروائی' },
        placeholder: {
          en: 'What action do you require from the recipient?',
          ur: 'آپ وصول کنندہ سے کیا کارروائی چاہتے ہیں؟',
        },
        type: 'textarea',
        validation: { required: true, minLength: 20, maxLength: 1000 },
        section: 'notice',
        order: 9,
      },
      {
        id: 'responseDeadlineDays',
        name: 'responseDeadlineDays',
        label: { en: 'Response Deadline (Days)', ur: 'جواب کی مدت (دن)' },
        placeholder: { en: 'e.g., 15', ur: 'مثلاً 15' },
        type: 'number',
        validation: { required: true },
        defaultValue: '15',
        section: 'notice',
        order: 10,
      },
      // Lawyer Details (optional)
      {
        id: 'lawyerName',
        name: 'lawyerName',
        label: { en: 'Lawyer Name (if any)', ur: 'وکیل کا نام (اگر ہو)' },
        placeholder: { en: 'Enter lawyer name', ur: 'وکیل کا نام درج کریں' },
        type: 'text',
        validation: { required: false, maxLength: 100 },
        section: 'lawyer',
        order: 11,
      },
      {
        id: 'lawyerLicense',
        name: 'lawyerLicense',
        label: { en: 'Lawyer License No.', ur: 'وکیل کا لائسنس نمبر' },
        placeholder: { en: 'Enter license number', ur: 'لائسنس نمبر درج کریں' },
        type: 'text',
        validation: { required: false, maxLength: 50 },
        section: 'lawyer',
        order: 12,
      },
      {
        id: 'date',
        name: 'date',
        label: { en: 'Date', ur: 'تاریخ' },
        placeholder: { en: 'Select date', ur: 'تاریخ منتخب کریں' },
        type: 'date',
        validation: { required: true },
        section: 'document',
        order: 13,
      },
    ],
  },
  // Rent Agreement Template
  {
    templateType: 'RENT_AGREEMENT',
    name: { en: 'Rent Agreement', ur: 'کرایہ نامہ' },
    description: {
      en: 'Lease agreement between landlord and tenant for residential/commercial property',
      ur: 'رہائشی/تجارتی جائیداد کے لیے مالک مکان اور کرایہ دار کے درمیان لیز کا معاہدہ',
    },
    icon: 'home',
    category: 'AGREEMENT',
    requiredRole: null,
    price: 0,
    isActive: true,
    templateContent: RENT_AGREEMENT_TEMPLATE,
    fields: [
      // Landlord Section
      {
        id: 'landlordName',
        name: 'landlordName',
        label: { en: 'Landlord Name', ur: 'مالک مکان کا نام' },
        placeholder: { en: 'Enter landlord full name', ur: 'مالک مکان کا پورا نام' },
        type: 'text',
        validation: { required: true, minLength: 3, maxLength: 100 },
        section: 'landlord',
        order: 1,
      },
      {
        id: 'landlordCnic',
        name: 'landlordCnic',
        label: { en: 'Landlord CNIC', ur: 'مالک مکان کا شناختی کارڈ' },
        placeholder: { en: '00000-0000000-0', ur: '00000-0000000-0' },
        type: 'cnic',
        validation: {
          required: true,
          pattern: '^[0-9]{5}-[0-9]{7}-[0-9]$',
          patternMessage: { en: 'Format: 00000-0000000-0', ur: 'فارمیٹ: 00000-0000000-0' },
        },
        section: 'landlord',
        order: 2,
      },
      {
        id: 'landlordAddress',
        name: 'landlordAddress',
        label: { en: 'Landlord Address', ur: 'مالک مکان کا پتہ' },
        placeholder: { en: 'Enter landlord address', ur: 'مالک مکان کا پتہ درج کریں' },
        type: 'address',
        validation: { required: true, minLength: 10, maxLength: 300 },
        section: 'landlord',
        order: 3,
      },
      // Tenant Section
      {
        id: 'tenantName',
        name: 'tenantName',
        label: { en: 'Tenant Name', ur: 'کرایہ دار کا نام' },
        placeholder: { en: 'Enter tenant full name', ur: 'کرایہ دار کا پورا نام' },
        type: 'text',
        validation: { required: true, minLength: 3, maxLength: 100 },
        section: 'tenant',
        order: 4,
      },
      {
        id: 'tenantCnic',
        name: 'tenantCnic',
        label: { en: 'Tenant CNIC', ur: 'کرایہ دار کا شناختی کارڈ' },
        placeholder: { en: '00000-0000000-0', ur: '00000-0000000-0' },
        type: 'cnic',
        validation: {
          required: true,
          pattern: '^[0-9]{5}-[0-9]{7}-[0-9]$',
          patternMessage: { en: 'Format: 00000-0000000-0', ur: 'فارمیٹ: 00000-0000000-0' },
        },
        section: 'tenant',
        order: 5,
      },
      {
        id: 'tenantAddress',
        name: 'tenantAddress',
        label: { en: 'Tenant Current Address', ur: 'کرایہ دار کا موجودہ پتہ' },
        placeholder: { en: 'Enter tenant current address', ur: 'کرایہ دار کا موجودہ پتہ' },
        type: 'address',
        validation: { required: true, minLength: 10, maxLength: 300 },
        section: 'tenant',
        order: 6,
      },
      // Property Section
      {
        id: 'propertyAddress',
        name: 'propertyAddress',
        label: { en: 'Property Address', ur: 'جائیداد کا پتہ' },
        placeholder: { en: 'Enter property full address', ur: 'جائیداد کا مکمل پتہ' },
        type: 'address',
        validation: { required: true, minLength: 10, maxLength: 400 },
        section: 'property',
        order: 7,
      },
      {
        id: 'propertyType',
        name: 'propertyType',
        label: { en: 'Property Type', ur: 'جائیداد کی قسم' },
        placeholder: { en: 'Select property type', ur: 'جائیداد کی قسم منتخب کریں' },
        type: 'select',
        validation: { required: true },
        options: [
          { value: 'HOUSE', label: { en: 'House', ur: 'مکان' } },
          { value: 'APARTMENT', label: { en: 'Apartment/Flat', ur: 'فلیٹ' } },
          { value: 'SHOP', label: { en: 'Shop', ur: 'دکان' } },
          { value: 'OFFICE', label: { en: 'Office', ur: 'دفتر' } },
          { value: 'WAREHOUSE', label: { en: 'Warehouse/Godown', ur: 'گودام' } },
          { value: 'OTHER', label: { en: 'Other', ur: 'دیگر' } },
        ],
        section: 'property',
        order: 8,
      },
      // Financial Section
      {
        id: 'monthlyRent',
        name: 'monthlyRent',
        label: { en: 'Monthly Rent (PKR)', ur: 'ماہانہ کرایہ (روپے)' },
        placeholder: { en: 'e.g., 25000', ur: 'مثلاً 25000' },
        type: 'number',
        validation: { required: true },
        section: 'financial',
        order: 9,
      },
      {
        id: 'monthlyRentWords',
        name: 'monthlyRentWords',
        label: { en: 'Rent in Words', ur: 'کرایہ الفاظ میں' },
        placeholder: { en: 'e.g., Twenty Five Thousand', ur: 'مثلاً پچیس ہزار' },
        type: 'text',
        validation: { required: true, maxLength: 100 },
        section: 'financial',
        order: 10,
      },
      {
        id: 'securityDeposit',
        name: 'securityDeposit',
        label: { en: 'Security Deposit (PKR)', ur: 'سیکورٹی ڈپازٹ (روپے)' },
        placeholder: { en: 'e.g., 50000', ur: 'مثلاً 50000' },
        type: 'number',
        validation: { required: true },
        section: 'financial',
        order: 11,
      },
      {
        id: 'advanceMonths',
        name: 'advanceMonths',
        label: { en: 'Advance Months', ur: 'پیشگی ماہ' },
        placeholder: { en: 'e.g., 2', ur: 'مثلاً 2' },
        type: 'number',
        validation: { required: true },
        defaultValue: '1',
        section: 'financial',
        order: 12,
      },
      {
        id: 'advanceAmount',
        name: 'advanceAmount',
        label: { en: 'Advance Amount (PKR)', ur: 'پیشگی رقم (روپے)' },
        placeholder: { en: 'Total advance amount', ur: 'کل پیشگی رقم' },
        type: 'number',
        validation: { required: true },
        section: 'financial',
        order: 13,
      },
      {
        id: 'rentDueDay',
        name: 'rentDueDay',
        label: { en: 'Rent Due Day', ur: 'کرایہ کی تاریخ' },
        placeholder: { en: 'e.g., 5th', ur: 'مثلاً 5 تاریخ' },
        type: 'text',
        validation: { required: true, maxLength: 10 },
        defaultValue: '5th',
        section: 'financial',
        order: 14,
      },
      // Agreement Period
      {
        id: 'startDate',
        name: 'startDate',
        label: { en: 'Start Date', ur: 'آغاز کی تاریخ' },
        placeholder: { en: 'Select start date', ur: 'آغاز کی تاریخ منتخب کریں' },
        type: 'date',
        validation: { required: true },
        section: 'period',
        order: 15,
      },
      {
        id: 'durationMonths',
        name: 'durationMonths',
        label: { en: 'Duration (Months)', ur: 'مدت (ماہ)' },
        placeholder: { en: 'e.g., 12', ur: 'مثلاً 12' },
        type: 'number',
        validation: { required: true },
        defaultValue: '12',
        section: 'period',
        order: 16,
      },
      {
        id: 'endDate',
        name: 'endDate',
        label: { en: 'End Date', ur: 'اختتام کی تاریخ' },
        placeholder: { en: 'Select end date', ur: 'اختتام کی تاریخ منتخب کریں' },
        type: 'date',
        validation: { required: true },
        section: 'period',
        order: 17,
      },
      // Additional Terms
      {
        id: 'additionalTerms',
        name: 'additionalTerms',
        label: { en: 'Additional Terms', ur: 'اضافی شرائط' },
        placeholder: { en: 'Any additional terms and conditions', ur: 'کوئی اضافی شرائط و ضوابط' },
        type: 'textarea',
        validation: { required: false, maxLength: 1000 },
        section: 'additional',
        order: 18,
      },
      {
        id: 'agreementDate',
        name: 'agreementDate',
        label: { en: 'Agreement Date', ur: 'معاہدے کی تاریخ' },
        placeholder: { en: 'Select date', ur: 'تاریخ منتخب کریں' },
        type: 'date',
        validation: { required: true },
        section: 'document',
        order: 19,
      },
      {
        id: 'place',
        name: 'place',
        label: { en: 'Place', ur: 'مقام' },
        placeholder: { en: 'City name', ur: 'شہر کا نام' },
        type: 'text',
        validation: { required: true, minLength: 2, maxLength: 100 },
        section: 'document',
        order: 20,
      },
    ],
  },
];

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Get all active document templates
 */
export const getDocumentTemplates = async (): Promise<DocumentTemplate[]> => {
  try {
    // For now, return the hardcoded templates with generated IDs
    // In production, these would be fetched from Firestore
    return DOCUMENT_TEMPLATES.map((template, index) => ({
      ...template,
      id: `template_${template.templateType.toLowerCase()}`,
    })) as DocumentTemplate[];
  } catch (error) {
    console.error('Error fetching document templates:', error);
    throw error;
  }
};

/**
 * Get a single template by ID
 */
export const getTemplateById = async (templateId: string): Promise<DocumentTemplate | null> => {
  try {
    const templates = await getDocumentTemplates();
    return templates.find((t) => t.id === templateId) || null;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = async (category: TemplateCategory): Promise<DocumentTemplate[]> => {
  try {
    const templates = await getDocumentTemplates();
    return templates.filter((t) => t.category === category);
  } catch (error) {
    console.error('Error fetching templates by category:', error);
    throw error;
  }
};

/**
 * Generate document content by replacing placeholders
 */
export const generateDocumentContent = (
  template: DocumentTemplate,
  formData: Record<string, any>,
  language: Language
): string => {
  let content = template.templateContent[language];

  // Replace all placeholders with form data
  Object.keys(formData).forEach((key) => {
    const value = formData[key] || '';
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(placeholder, value);
  });

  // Replace any remaining placeholders with empty string
  content = content.replace(/{{[^}]+}}/g, '');

  return content;
};

/**
 * Save a generated document to Firestore
 */
export const saveGeneratedDocument = async (
  userId: string,
  templateId: string,
  templateType: TemplateType,
  title: string,
  formData: Record<string, any>,
  generatedContent: string,
  language: Language,
  caseId?: string
): Promise<string> => {
  try {
    const documentData: Omit<GeneratedDocument, 'id'> = {
      userId,
      templateId,
      templateType,
      title,
      language,
      formData,
      generatedContent,
      caseId,
      status: 'GENERATED',
    };

    const docId = await createDocument(COLLECTIONS.GENERATED_DOCUMENTS, documentData);
    return docId;
  } catch (error) {
    console.error('Error saving generated document:', error);
    throw error;
  }
};

/**
 * Get user's generated documents
 */
export const getUserDocuments = async (userId: string): Promise<GeneratedDocument[]> => {
  try {
    const documents = await getDocuments<GeneratedDocument>(COLLECTIONS.GENERATED_DOCUMENTS, [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ]);
    return documents;
  } catch (error) {
    console.error('Error fetching user documents:', error);
    throw error;
  }
};

/**
 * Get a single generated document by ID
 */
export const getGeneratedDocumentById = async (documentId: string): Promise<GeneratedDocument | null> => {
  try {
    return await getDocument<GeneratedDocument>(COLLECTIONS.GENERATED_DOCUMENTS, documentId);
  } catch (error) {
    console.error('Error fetching generated document:', error);
    throw error;
  }
};

/**
 * Update document status
 */
export const updateDocumentStatus = async (
  documentId: string,
  status: DocumentStatus,
  pdfUrl?: string
): Promise<void> => {
  try {
    const updateData: Partial<GeneratedDocument> = { status };
    if (pdfUrl) {
      updateData.pdfUrl = pdfUrl;
    }
    if (status === 'DOWNLOADED') {
      updateData.downloadedAt = new Date() as any;
    }
    await updateDocument(COLLECTIONS.GENERATED_DOCUMENTS, documentId, updateData);
  } catch (error) {
    console.error('Error updating document status:', error);
    throw error;
  }
};

/**
 * Delete a generated document
 */
export const deleteGeneratedDocument = async (documentId: string): Promise<void> => {
  try {
    await deleteDocument(COLLECTIONS.GENERATED_DOCUMENTS, documentId);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

/**
 * Generate PDF from HTML content
 */
export const generatePDF = async (htmlContent: string, documentTitle: string): Promise<string> => {
  try {
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    // Rename the file to have a meaningful name
    const newUri = `${documentDirectory}${documentTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    await moveAsync({
      from: uri,
      to: newUri,
    });

    return newUri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Share a generated PDF
 */
export const sharePDF = async (pdfUri: string): Promise<void> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Document',
    });
  } catch (error) {
    console.error('Error sharing PDF:', error);
    throw error;
  }
};

/**
 * Upload generated PDF to Firebase Storage
 */
export const uploadPDFToStorage = async (
  userId: string,
  documentId: string,
  pdfUri: string
): Promise<string> => {
  try {
    // Read the file as base64
    const base64 = await readAsStringAsync(pdfUri, {
      encoding: EncodingType.Base64,
    });

    // Convert base64 to Uint8Array
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Firebase Storage
    const downloadUrl = await uploadGeneratedDocument(userId, documentId, bytes.buffer, 'pdf');
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading PDF to storage:', error);
    throw error;
  }
};

/**
 * Helper function to get localized text
 */
export const getLocalizedText = (textObj: BilingualText, language: Language): string => {
  return textObj[language] || textObj.en;
};

/**
 * Helper function to format CNIC
 */
export const formatCNIC = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');

  // Format as 00000-0000000-0
  if (numbers.length <= 5) {
    return numbers;
  } else if (numbers.length <= 12) {
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
  } else {
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 12)}-${numbers.slice(12, 13)}`;
  }
};

/**
 * Helper function to format date for display
 */
export const formatDateForDocument = (date: Date | string, language: Language): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return d.toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', options);
};
