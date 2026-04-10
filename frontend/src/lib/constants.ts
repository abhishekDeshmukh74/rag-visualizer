import type { StepInfo, SampleDocument } from './types';

export const PIPELINE_STEPS: StepInfo[] = [
  {
    id: 'ingestion',
    label: 'Document Ingestion',
    description: 'Load documents from company knowledge sources',
    educationalText:
      'Before retrieval can happen, documents must be ingested from their sources — knowledge bases, helpdesks, wikis, PDFs, or databases. This is the data foundation of any company chatbot.',
    deepDiveText:
      'Production RAG pipelines include ingestion pipelines that continuously crawl and sync documents from sources like Confluence, SharePoint, Notion, Zendesk, or CRM databases. Documents go through extraction (converting PDFs/HTML to plain text), deduplication, and metadata tagging. Incremental sync ensures the vector store stays current when source documents change. Ingestion quality — clean, structured, deduplicated content — directly determines what the chatbot can and cannot answer.',
    icon: 'Upload',
  },
  {
    id: 'input',
    label: 'Document Input',
    description: 'Paste or select a document to process',
    educationalText:
      'RAG starts with knowledge sources that you want the AI to reference when answering questions.',
    deepDiveText:
      'The quality of your input document directly determines what the system can retrieve. Documents should be clean, well-structured text. Noisy data (HTML tags, boilerplate, duplicates) degrades retrieval quality. In production, a preprocessing pipeline typically handles extraction, cleaning, and deduplication before documents enter the RAG system.',
    icon: 'FileText',
  },
  {
    id: 'chunking',
    label: 'Chunking',
    description: 'Split the document into smaller pieces',
    educationalText:
      'Chunking breaks large documents into smaller pieces so retrieval can search them efficiently. Bad chunking can split meaning or hide useful context. Chunk size and overlap are critical parameters.',
    educationalItems: [
      { label: 'Character / Fixed-size', description: 'Split every N characters regardless of content structure' },
      { label: 'Sentence-based', description: 'Split on sentence boundaries to preserve grammatical meaning' },
      { label: 'Recursive', description: 'Split on paragraphs → sentences → words, respecting document hierarchy' },
      { label: 'Token-based', description: 'Split by LLM token count to stay within model context windows' },
      { label: 'Semantic', description: 'Split where topic shifts occur using embedding similarity' },
      { label: 'Sliding window', description: 'Fixed-size chunks with overlap to avoid losing context at boundaries' },
    ],
    deepDiveText:
      'Common strategies include fixed-size character chunking, sentence-based splitting, and recursive chunking that respects paragraph/section boundaries. Smaller chunks improve precision but may lose context. Larger chunks preserve context but reduce retrieval specificity. Overlap (typically 10-20% of chunk size) helps avoid losing information at boundaries. Advanced methods use semantic chunking — splitting where topic shifts naturally occur.',
    icon: 'Scissors',
  },
  {
    id: 'embedding',
    label: 'Embeddings',
    description: 'Convert chunks into vector representations',
    educationalText:
      'Embeddings convert text into arrays of numbers (vectors) so the system can compare meaning instead of exact word matches. Similar meanings produce vectors that are close together in space.',
    deepDiveText:
      'Modern embedding models (like OpenAI text-embedding-3, Cohere embed, or open-source models like BGE/E5) produce dense vectors of 384-3072 dimensions. They are trained on massive text corpora using contrastive learning — pulling similar texts together and pushing dissimilar texts apart in vector space. The same model must be used for both document chunks and queries to ensure the vector spaces are compatible.',
    icon: 'Binary',
  },
  {
    id: 'vectordb',
    label: 'Vector DB',
    description: 'Store embeddings in a vector database',
    educationalText:
      'A vector database stores embeddings and enables fast similarity search at scale. Instead of comparing against every vector, it uses indexing structures (like HNSW or IVF) to find nearest neighbors efficiently — making retrieval practical even with millions of chunks.',
    deepDiveText:
      'Popular vector databases include Pinecone, Weaviate, Qdrant, Milvus, and ChromaDB. They use Approximate Nearest Neighbor (ANN) algorithms like HNSW (Hierarchical Navigable Small World), IVF (Inverted File Index), or ScaNN. These trade a small amount of accuracy for massive speed gains — searching millions of vectors in milliseconds instead of seconds. Metadata filtering, hybrid search (combining vector + keyword), and namespace isolation are key production features.',
    icon: 'Database',
  },
  {
    id: 'query',
    label: 'User Query',
    description: 'Enter a question and embed it',
    educationalText:
      'Your question is also converted into an embedding using the same model. This allows the system to compare your question against all chunks by measuring vector similarity.',
    deepDiveText:
      'Query embedding quality matters as much as document embeddings. Short or vague queries produce less distinctive vectors, leading to poor retrieval. Techniques like query expansion (rephrasing the question multiple ways), HyDE (Hypothetical Document Embeddings — generating a hypothetical answer first, then embedding that), and query decomposition (breaking complex questions into sub-queries) can significantly improve retrieval results.',
    icon: 'Search',
  },
  {
    id: 'retrieval',
    label: 'Retrieval',
    description: 'Find the most relevant chunks',
    educationalText:
      'Retrieval does not search like a keyword filter. It compares vector similarity (cosine similarity) to find chunks that are semantically closest to the question. The top-k parameter controls how many chunks are selected.',
    deepDiveText:
      'Cosine similarity measures the angle between two vectors (1.0 = identical direction, 0 = orthogonal). Top-k retrieval returns the k closest chunks. Too few chunks may miss context; too many dilute relevance and waste prompt tokens. Re-ranking (using a cross-encoder model to re-score retrieved chunks) is a common second stage that dramatically improves precision. Hybrid retrieval combines dense vectors with sparse keyword matching (BM25) for better coverage.',
    icon: 'Filter',
  },
  {
    id: 'prompt',
    label: 'Prompt Construction',
    description: 'Build the prompt sent to the LLM',
    educationalText:
      'The LLM answers from the prompt you build. Retrieved chunks are placed as context alongside your question. The model can only use the context it receives — good retrieval directly impacts answer quality.',
    deepDiveText:
      'Prompt engineering for RAG involves structuring context placement, adding system instructions ("Answer only from the provided context"), and managing token budgets. If retrieved chunks exceed the model\'s context window, you must truncate or summarize. Chain-of-thought prompting and few-shot examples can improve answer quality. Citation instructions ("cite which chunk you used") help with answer traceability and hallucination detection.',
    icon: 'MessageSquare',
  },
  {
    id: 'answer',
    label: 'Answer',
    description: 'Generate the final answer with sources',
    educationalText:
      'The quality of the final answer depends on chunking, retrieval quality, and the prompt. RAG grounds the LLM in your actual documents instead of relying on its training data alone.',
    deepDiveText:
      'Even with good retrieval, LLMs can still hallucinate or ignore context. Evaluation frameworks like RAGAS measure faithfulness (does the answer match the context?), relevancy (is the retrieved context relevant?), and correctness. Production systems add guardrails: checking if the answer is grounded in sources, flagging low-confidence responses, and falling back gracefully when retrieval finds nothing relevant.',
    icon: 'Sparkles',
  },
];

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'password-reset',
    title: 'Password Reset FAQ',
    description: 'Common questions about resetting passwords',
    text: `How do I reset my password?

To reset your password, go to the login page and click "Forgot Password". Enter the email address associated with your account. You will receive a password reset link within 5 minutes. Click the link and enter your new password. Your new password must be at least 8 characters long and include a number and a special character.

What if I don't receive the reset email?

If you don't receive the password reset email, first check your spam or junk folder. Make sure you entered the correct email address. If you still don't see the email after 10 minutes, try requesting a new reset link. If the problem persists, contact our support team at support@example.com.

Can I reset my password using my phone number?

Currently, password reset is only available via email. We are working on adding SMS-based password reset in a future update. In the meantime, make sure your email address is up to date in your account settings.

How often can I request a password reset?

You can request up to 3 password reset links within a 1-hour period. After that, you will need to wait before requesting again. This limit helps protect your account from unauthorized reset attempts.

What are the password requirements?

Your password must be at least 8 characters long. It must contain at least one uppercase letter, one lowercase letter, one number, and one special character (such as !, @, #, $, %). Passwords cannot contain your username or email address. We recommend using a password manager to generate and store strong passwords.

Does resetting my password log me out of other devices?

Yes, resetting your password will automatically log you out of all active sessions on all devices. You will need to log in again with your new password on each device. This is a security measure to ensure that no unauthorized sessions remain active.

Can I reuse an old password?

No, you cannot reuse any of your last 5 passwords. This policy helps maintain account security by ensuring you regularly create new, unique passwords.

What should I do if someone else reset my password?

If you receive a password reset email that you did not request, do not click the link. Instead, log in to your account immediately and change your password. Enable two-factor authentication for additional security. If you cannot access your account, contact our support team immediately.`,
  },
  {
    id: 'return-policy',
    title: 'Return & Refund Policy',
    description: 'E-commerce returns and refunds support doc',
    text: `How do I return an item?

To return an item, log in to your account and go to "My Orders". Find the order containing the item you want to return and click "Request Return". Select the reason for the return and choose your preferred return method. You will receive a prepaid return shipping label by email within 24 hours. Pack the item securely and drop it off at any authorized shipping location.

What is the return window?

Most items can be returned within 30 days of delivery. Electronics and software have a 15-day return window. Sale items marked as "Final Sale" cannot be returned or exchanged. Items must be in their original condition with all tags attached and original packaging intact.

How long does a refund take?

Once we receive your returned item, we inspect it within 2-3 business days. Approved refunds are processed to your original payment method within 5-7 business days. Credit card refunds may take an additional 3-5 business days to appear on your statement depending on your bank. We will send a confirmation email when the refund is processed.

Can I exchange an item instead of returning it?

Yes, you can exchange an item for a different size, color, or style. Go to "My Orders", select the item, and click "Exchange". Exchanges are processed as a return for store credit and a new order. You will receive priority shipping on your exchange order at no additional cost.

What items cannot be returned?

The following items are non-returnable: personalized or custom-made items, digital downloads and gift cards, perishable goods, items that have been used or washed, and intimate apparel for hygiene reasons. If you received a damaged or defective item, please contact customer support within 48 hours of delivery.

How do I return a gift?

If you received a gift and want to return it, you can do so without the original purchaser knowing. Use the gift return option on our website and enter your order number or gift receipt. You will receive store credit for the return value. Gift returns do not require the original payment method.

Do I need to pay for return shipping?

For standard returns, customers are responsible for return shipping costs. If the return is due to our error — wrong item, defective product, or damage during shipping — we will provide a prepaid return label at no charge. For exchanges, we cover the return shipping cost. Free returns are available to premium members.

What happens if my return is damaged in transit?

We recommend keeping proof of your return shipment until your refund is confirmed. If your return is damaged during transit, contact our support team with your tracking number and photos of the damage. We will work with the carrier to resolve the issue and ensure you receive your refund.`,
  },
  {
    id: 'leave-policy',
    title: 'Leave Policy',
    description: 'Employee leave types, eligibility, and procedures',
    text: `What types of leave are available?

The company offers several types of leave: Paid Time Off (PTO), Sick Leave, Parental Leave, Bereavement Leave, Jury Duty Leave, and Unpaid Leave of Absence. Each leave type has its own eligibility criteria, accrual rules, and approval process. Full details for each leave type are outlined in this policy document and in the employee handbook available on the HR portal.

How do I request leave?

All leave requests must be submitted through the HR portal under "Time Off Requests". For planned leave (vacations, appointments), submit requests at least 5 business days in advance. For unplanned leave (illness, emergency), notify your manager and HR as soon as possible — same day if feasible. Leave requests are subject to manager approval and team capacity considerations.

How much PTO do employees accrue?

Full-time employees accrue PTO at the following rates based on tenure: 0–2 years: 15 days per year (1.25 days/month); 2–5 years: 18 days per year (1.5 days/month); 5+ years: 22 days per year (~1.83 days/month). Part-time employees accrue PTO on a prorated basis. PTO carries over up to a maximum of 30 days at the end of each calendar year. Unused PTO above 30 days is forfeited.

What is the sick leave policy?

Employees receive 10 days of sick leave per calendar year, which does not carry over. Sick leave can be used for personal illness, medical appointments, or to care for an immediate family member. For absences longer than 3 consecutive days, a doctor's note may be required. Sick leave is separate from PTO and cannot be used interchangeably.

What is the parental leave policy?

Primary caregivers receive 16 weeks of fully paid parental leave following the birth, adoption, or foster placement of a child. Secondary caregivers receive 4 weeks of fully paid parental leave. Leave must be taken within 12 months of the child's arrival. To initiate parental leave, notify HR at least 30 days in advance when possible and complete the parental leave request form in the HR portal.

How does bereavement leave work?

Employees are entitled to up to 5 paid days of bereavement leave for the death of an immediate family member (spouse, child, parent, sibling). Up to 3 paid days are provided for the death of an extended family member (grandparent, in-law, aunt/uncle). Additional unpaid leave may be granted at manager and HR discretion. Submit bereavement leave requests through the HR portal or notify your manager directly.

Can I take unpaid leave?

Employees who have exhausted their paid leave balances may request an unpaid leave of absence for personal or medical reasons. Requests for unpaid leave longer than 2 weeks require HR and department head approval. Your position will be held for up to 12 weeks for qualifying medical or family leave under FMLA. Job protection beyond 12 weeks is not guaranteed and is subject to business needs.

What happens to my benefits during leave?

Company-sponsored health, dental, and vision benefits remain active during paid leave. During unpaid leave, employees may continue benefits coverage by paying their portion of the premium. 401(k) contributions pause during unpaid leave and resume upon return. Accrual of PTO and sick leave is paused during unpaid leave longer than 30 days.`,
  },
  {
    id: 'onboarding',
    title: 'Employee Onboarding FAQ',
    description: 'Internal HR chatbot knowledge base',
    text: `When does my first day start?

Your first day will be confirmed in the welcome email you received from HR. Plan to arrive 15 minutes early. You will be greeted by your onboarding coordinator at the main reception. Bring a valid government-issued ID for badge creation and I-9 verification. If you are onboarding remotely, check your email for video call instructions and equipment delivery confirmation.

What equipment will I receive?

You will receive a company laptop, headset, and any role-specific hardware requested by your manager. Remote employees typically receive equipment 1-2 business days before their start date. IT will send setup instructions and temporary login credentials. If there are any issues with your equipment, contact IT support at itsupport@company.com.

How do I set up my company accounts?

On your first day, IT will provide a welcome packet with your employee ID and temporary passwords. You will be required to change your password and set up multi-factor authentication (MFA) on your first login. Access to tools like Slack, Jira, Google Workspace, and department-specific systems will be provisioned within your first week. Submit additional access requests through the IT portal.

What is the benefits enrollment deadline?

You have 30 days from your start date to enroll in benefits including health insurance, dental, vision, and the 401(k) plan. Log in to the HR portal using your employee credentials to enroll. If you miss the enrollment window, you must wait until the next open enrollment period unless you have a qualifying life event. Contact hr@company.com with questions about plan options.

Who is my go-to person for questions?

Your manager is your primary contact for role-specific and team questions. Your onboarding buddy — assigned in your welcome email — is your peer resource for culture and day-to-day questions. HR business partners handle compensation, benefits, and policy questions. All contacts are listed in the company directory in the HR portal.

How does the performance review process work?

New employees complete a 90-day review with their manager — an informal check-in to discuss role expectations, initial projects, and feedback. Formal performance reviews happen company-wide in April and October. Goal-setting occurs in January and July. The performance management system is accessible through the HR portal.

What are the remote work policies?

The company operates on a hybrid model. Most roles require in-office presence 2-3 days per week, with Tuesdays and Thursdays as company-wide in-office days. Remote arrangements beyond the hybrid policy require manager and HR approval. Travel reimbursement and home office stipends are available for eligible roles — see the policy document in the HR portal for full details.

How do I request time off?

Submit time off requests through the HR portal under "Time Off". Full-time employees accrue 15 days of paid time off (PTO) per year plus 11 company holidays. New employees can use PTO after completing their first 90 days. For sick leave, notify your manager and HR on the same day. Extended leave policies for medical, parental, or bereavement situations are available in the employee handbook.`,
  },
];

export const DEFAULT_CONFIG = {
  chunkSize: 200,
  chunkOverlap: 20,
  chunkingStrategy: 'sentence' as const,
  topK: 3,
  embeddingModel: 'all-MiniLM-L6-v2',
  llmModel: 'llama-3.1-8b-instant',
};
