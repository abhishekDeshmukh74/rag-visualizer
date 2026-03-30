import type { StepInfo, SampleDocument } from './types';

export const PIPELINE_STEPS: StepInfo[] = [
  {
    id: 'input',
    label: 'Document Input',
    description: 'Paste or select a document to process',
    educationalText:
      'RAG starts with a knowledge source — a document, FAQ, article, or any text you want the AI to reference when answering questions.',
    icon: 'FileText',
  },
  {
    id: 'chunking',
    label: 'Chunking',
    description: 'Split the document into smaller pieces',
    educationalText:
      'Chunking breaks large documents into smaller pieces so retrieval can search them efficiently. Bad chunking can split meaning or hide useful context. Chunk size and overlap are critical parameters.',
    icon: 'Scissors',
  },
  {
    id: 'embedding',
    label: 'Embeddings',
    description: 'Convert chunks into vector representations',
    educationalText:
      'Embeddings convert text into arrays of numbers (vectors) so the system can compare meaning instead of exact word matches. Similar meanings produce vectors that are close together in space.',
    icon: 'Binary',
  },
  {
    id: 'vectordb',
    label: 'Vector DB',
    description: 'Store embeddings in a vector database',
    educationalText:
      'A vector database stores embeddings and enables fast similarity search at scale. Instead of comparing against every vector, it uses indexing structures (like HNSW or IVF) to find nearest neighbors efficiently — making retrieval practical even with millions of chunks.',
    icon: 'Database',
  },
  {
    id: 'query',
    label: 'User Query',
    description: 'Enter a question and embed it',
    educationalText:
      'Your question is also converted into an embedding using the same model. This allows the system to compare your question against all chunks by measuring vector similarity.',
    icon: 'Search',
  },
  {
    id: 'retrieval',
    label: 'Retrieval',
    description: 'Find the most relevant chunks',
    educationalText:
      'Retrieval does not search like a keyword filter. It compares vector similarity (cosine similarity) to find chunks that are semantically closest to the question. The top-k parameter controls how many chunks are selected.',
    icon: 'Filter',
  },
  {
    id: 'prompt',
    label: 'Prompt Construction',
    description: 'Build the prompt sent to the LLM',
    educationalText:
      'The LLM answers from the prompt you build. Retrieved chunks are placed as context alongside your question. The model can only use the context it receives — good retrieval directly impacts answer quality.',
    icon: 'MessageSquare',
  },
  {
    id: 'answer',
    label: 'Answer',
    description: 'Generate the final answer with sources',
    educationalText:
      'The quality of the final answer depends on chunking, retrieval quality, and the prompt. RAG grounds the LLM in your actual documents instead of relying on its training data alone.',
    icon: 'Sparkles',
  },
];

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'redis',
    title: 'Why Redis is Fast',
    description: 'A technical overview of Redis performance',
    text: `Redis is an open-source, in-memory data structure store used as a database, cache, message broker, and streaming engine. Redis provides data structures such as strings, hashes, lists, sets, sorted sets with range queries, bitmaps, hyperloglogs, geospatial indexes, and streams.

Redis achieves its remarkable speed primarily because it stores all data in memory (RAM) rather than on disk. Accessing data in memory is orders of magnitude faster than reading from a hard drive or even an SSD. This is the single most important factor behind Redis's performance.

Redis uses a single-threaded event loop model for processing commands. While this might seem like a limitation, it actually eliminates the overhead of context switching and locking that multi-threaded systems face. The single thread processes commands sequentially, which also ensures that operations are atomic without the need for locks.

The event loop in Redis is built on the I/O multiplexing model. It uses system calls like epoll (Linux), kqueue (BSD/macOS), and select to handle many client connections without creating a thread for each connection. This allows Redis to handle tens of thousands of connections simultaneously with very low overhead.

Redis uses optimized data structures internally. For example, small hashes are stored as ziplists instead of full hash tables, and small sets use intsets. These compact representations reduce memory usage and improve cache locality, which helps performance even further.

Redis supports pipelining, which allows a client to send multiple commands without waiting for the response of each one. The server processes all the commands and sends back responses in bulk. This dramatically reduces network round-trip time, especially for batch operations.

Persistence in Redis is handled through RDB snapshots and AOF (Append Only File) logging. RDB creates point-in-time snapshots of the dataset at configurable intervals using a forked child process, so the main thread is never blocked by disk writes. AOF logs every write operation and can be configured with different fsync policies.

Redis Cluster provides horizontal scaling by automatically sharding data across multiple Redis nodes. Each node handles a subset of the hash slot space (16384 slots total). This allows Redis to scale beyond the memory limits of a single machine while maintaining its performance characteristics.

For caching use cases, Redis supports configurable eviction policies like LRU (Least Recently Used), LFU (Least Frequently Used), random eviction, and TTL-based expiry. These policies allow Redis to manage memory effectively when the dataset exceeds available RAM.

Redis also supports Lua scripting, which allows you to execute complex operations atomically on the server side. This reduces network round trips and ensures that multi-step operations are performed without interruption, which is especially useful for distributed locking and rate limiting.`,
  },
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
    id: 'ml-basics',
    title: 'Machine Learning Basics',
    description: 'Introduction to core ML concepts',
    text: `Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. Instead of writing rules by hand, machine learning algorithms build models from data and use those models to make predictions or decisions.

There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning. Each type addresses different kinds of problems and uses different approaches to learn from data.

Supervised learning is the most common type. In supervised learning, the algorithm learns from labeled training data. Each training example consists of an input and the corresponding correct output. The algorithm learns to map inputs to outputs by finding patterns in the training data. Common supervised learning tasks include classification (predicting a category) and regression (predicting a number).

Unsupervised learning works with unlabeled data. The algorithm tries to find hidden patterns or structure in the data without being told what to look for. Common unsupervised learning tasks include clustering (grouping similar items), dimensionality reduction (simplifying data while preserving important information), and anomaly detection (finding unusual data points).

Reinforcement learning is inspired by behavioral psychology. An agent learns to make decisions by interacting with an environment. The agent receives rewards or penalties based on its actions and learns to maximize cumulative rewards over time. Reinforcement learning is used in robotics, game playing, and autonomous vehicles.

A machine learning model is trained through a process of optimization. The model starts with random parameters and gradually adjusts them to minimize a loss function, which measures how far the model's predictions are from the correct answers. This process is called training or fitting the model.

Overfitting is a common problem in machine learning. It occurs when a model learns the training data too well, including its noise and random fluctuations. An overfitted model performs well on training data but poorly on new, unseen data. Techniques like regularization, cross-validation, and using more training data help prevent overfitting.

Feature engineering is the process of selecting and transforming the input variables (features) used by a machine learning model. Good features can dramatically improve model performance. Feature engineering often requires domain expertise and is considered one of the most important and time-consuming parts of building a machine learning system.

Neural networks are a class of machine learning models inspired by the structure of the brain. They consist of layers of interconnected nodes (neurons) that process information. Deep learning refers to neural networks with many layers. Deep learning has achieved breakthrough results in image recognition, natural language processing, and speech recognition.

The bias-variance tradeoff is a fundamental concept in machine learning. Bias refers to errors from overly simplistic models that underfit the data. Variance refers to errors from overly complex models that overfit the data. The goal is to find the right balance between bias and variance for optimal model performance.`,
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
