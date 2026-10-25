# Detecting Voice Phishing with Precision: Fine-Tuning Small Language Models

- 저자: Ju Yong Sim, Seong Hwan Kim
- 게시: 2025-06-06 · arXiv:2506.06180 · https://arxiv.org/abs/2506.06180

## 초록 (원문)
We develop a voice phishing (VP) detector by fine-tuning Llama3, a representative open-source, small language model (LM). In the prompt, we provide carefully-designed VP evaluation criteria and apply the Chain-of-Thought (CoT) technique. To evaluate the robustness of LMs and highlight differences in their performance, we construct an adversarial test dataset that places the models under challenging conditions. Moreover, to address the lack of VP transcripts, we create transcripts by referencing existing or new types of VP techniques. We compare cases where evaluation criteria are included, the CoT technique is applied, or both are used together. In the experiment, our results show that the Llama3-8B model, fine-tuned with a dataset that includes a prompt with VP evaluation criteria, yields the best performance among small LMs and is comparable to that of a GPT-4-based VP detector. These findings indicate that incorporating human expert knowledge into the prompt is more effective than using the CoT technique for small LMs in VP detection.
