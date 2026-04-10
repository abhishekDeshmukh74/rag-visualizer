"""Pre-compute document-side and query-side pipeline results for sample documents.

Run once (or whenever sample docs / default config / sample questions change):
    cd backend
    python precompute.py

Generates one .txt file per sample doc in  backend/precomputed/<id>.txt
containing JSON with: document_stats, chunks, chunk_embeddings (truncated),
raw_embeddings (full numpy arrays as nested lists for similarity math),
and a queries dict with fully precomputed results (embedding, similarity,
prompt, answer) for each sample question × each document.
"""

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Ensure app package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.pipeline import (
    parse_document,
    chunk_document,
    create_all_embeddings,
    build_chunk_embeddings,
    compute_similarity,
    retrieve_top_k,
    build_prompt,
    generate_answer,
    preload_embedding_model,
    _truncate_embedding,
    GroqKeyManager,
)

OUT_DIR = Path(__file__).resolve().parent / "precomputed"
OUT_DIR.mkdir(exist_ok=True)

# Must match frontend DEFAULT_CONFIG
DEFAULT_CHUNK_SIZE = 200
DEFAULT_CHUNK_OVERLAP = 20
DEFAULT_STRATEGY = "sentence"

# Must match frontend SAMPLE_DOCUMENTS
SAMPLE_DOCUMENTS = {
    "password-reset": """How do I reset my password?

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

If you receive a password reset email that you did not request, do not click the link. Instead, log in to your account immediately and change your password. Enable two-factor authentication for additional security. If you cannot access your account, contact our support team immediately.""",
    "return-policy": """How do I return an item?

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

We recommend keeping proof of your return shipment until your refund is confirmed. If your return is damaged during transit, contact our support team with your tracking number and photos of the damage. We will work with the carrier to resolve the issue and ensure you receive your refund.""",
    "leave-policy": """What types of leave are available?

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

Company-sponsored health, dental, and vision benefits remain active during paid leave. During unpaid leave, employees may continue benefits coverage by paying their portion of the premium. 401(k) contributions pause during unpaid leave and resume upon return. Accrual of PTO and sick leave is paused during unpaid leave longer than 30 days.""",
    "onboarding": """When does my first day start?

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

Submit time off requests through the HR portal under "Time Off". Full-time employees accrue 15 days of paid time off (PTO) per year plus 11 company holidays. New employees can use PTO after completing their first 90 days. For sick leave, notify your manager and HR on the same day. Extended leave policies for medical, parental, or bereavement situations are available in the employee handbook.""",
}

# Must match frontend FIXED_QUESTIONS (StepDetailPanel.tsx)
DEFAULT_TOP_K = 3
SAMPLE_QUESTIONS = [
    "How many sick leaves available per year?",
    "How many times can I reset password?",
    "How long does a refund take?",
]


def precompute_one(doc_id: str, text: str, key_manager: GroqKeyManager | None) -> None:
    print(f"  [{doc_id}] parsing + chunking ...")
    stats = parse_document(text)
    chunks = chunk_document(text, DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP, DEFAULT_STRATEGY)

    print(f"  [{doc_id}] embedding {len(chunks)} chunks ...")
    chunk_texts = [c.text for c in chunks]
    # We only need chunk embeddings (no query yet), embed with a dummy query
    # to reuse create_all_embeddings; discard the dummy query embedding.
    raw_chunk_embs, _ = create_all_embeddings(chunk_texts, "dummy")

    # Truncated embeddings for the API response
    trunc_embs = build_chunk_embeddings(chunks, raw_chunk_embs)

    # Precompute query-side results for each sample question
    queries: dict = {}
    for question in SAMPLE_QUESTIONS:
        print(f"  [{doc_id}] query: {question!r} ...")
        _, raw_query_emb = create_all_embeddings([""], question)
        # embed the query properly (not bundled with chunks)
        from app.pipeline import get_embedding_model
        import numpy as np
        model = get_embedding_model()
        raw_query_emb = np.array(list(model.embed([question]))[0], dtype=np.float32)

        similarity = compute_similarity(raw_query_emb, raw_chunk_embs, chunks)
        top_chunks = retrieve_top_k(similarity, DEFAULT_TOP_K)
        prompt = build_prompt(question, top_chunks)

        answer: str | None = None
        if key_manager:
            try:
                answer = generate_answer(key_manager, prompt)
                print(f"  [{doc_id}]   → answer generated ({len(answer)} chars)")
            except Exception as exc:
                print(f"  [{doc_id}]   WARNING: LLM call failed: {exc}")
        else:
            print(f"  [{doc_id}]   WARNING: No GROQ_API_KEYS — skipping answer generation")

        queries[question] = {
            "query_embedding": _truncate_embedding(raw_query_emb),
            "similarity_results": [r.model_dump() for r in similarity],
            "top_chunks": [r.model_dump() for r in top_chunks],
            "prompt": prompt,
            "answer": answer,
        }

    data = {
        "sample_id": doc_id,
        "config": {
            "chunk_size": DEFAULT_CHUNK_SIZE,
            "chunk_overlap": DEFAULT_CHUNK_OVERLAP,
            "chunking_strategy": DEFAULT_STRATEGY,
        },
        "document_stats": stats.model_dump(),
        "chunks": [c.model_dump() for c in chunks],
        "chunk_embeddings": [e.model_dump() for e in trunc_embs],
        # Full-precision raw embeddings for similarity computation at query time
        "raw_embeddings": raw_chunk_embs.tolist(),
        # Fully precomputed results for sample questions
        "queries": queries,
    }

    out_path = OUT_DIR / f"{doc_id}.txt"
    out_path.write_text(json.dumps(data), encoding="utf-8")
    print(f"  [{doc_id}] saved → {out_path}")


def main() -> None:
    keys_str = os.getenv("GROQ_API_KEYS", "") or os.getenv("GROQ_API_KEY", "")
    keys = [k.strip() for k in keys_str.split(",") if k.strip()]
    key_manager = GroqKeyManager(keys) if keys else None
    if not key_manager:
        print("WARNING: GROQ_API_KEYS not set — answers will not be precomputed.")

    print("Loading embedding model ...")
    preload_embedding_model()

    print(f"Pre-computing {len(SAMPLE_DOCUMENTS)} sample documents × {len(SAMPLE_QUESTIONS)} questions ...\n")
    for doc_id, text in SAMPLE_DOCUMENTS.items():
        precompute_one(doc_id, text, key_manager)

    print(f"\nDone. Files written to {OUT_DIR}/")


if __name__ == "__main__":
    main()
