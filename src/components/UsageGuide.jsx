import React from 'react';
import { BookOpen, Zap, ShieldAlert, Layers, Users, Brain, CheckCircle } from 'lucide-react';

const UsageGuide = () => {
  const sections = [
    {
      title: "Conscious Application & Self-Reflection",
      icon: BookOpen,
      color: "text-blue-500 dark:text-blue-400",
      content: [
        "**Understand Purpose & Practice Epistemic Hygiene:** Before applying a razor, understand its primary function (e.g., diagnostic, evaluative, prescriptive). The overarching goal is to improve your 'epistemic hygiene' – the practices that refine belief formation.",
        "**Identify Assumptions:** When using razors like Occam's, actively list the assumptions in each explanation. Question their necessity. Ask: 'What am I taking for granted?'",
        "**Pause Before Judgment:** For Hanlon's Razor, deliberately pause before attributing negative outcomes to malice. Systematically ask: 'Could this be a mistake, misunderstanding, or due to external pressures?'",
        "**Assess Claim Nature & Evidential Threshold:** With the Sagan Standard, consciously evaluate if a claim is truly 'extraordinary' (contradicts well-established knowledge, highly improbable). If so, explicitly raise your standard for evidence – your 'evidential threshold'.",
        "**Metacognition is Key:** Regularly reflect on your thinking processes. Are you applying razors objectively, or are your own biases (e.g., confirmation bias) influencing their application?",
        "**Iterative Learning & Feedback:** After applying a razor, reflect on the outcome. Did it lead to a better decision or understanding? Could it have been applied differently? Seek feedback on your reasoning when possible."
      ]
    },
    {
      title: "Building Your Mental Toolkit",
      icon: Layers,
      color: "text-green-500 dark:text-green-400",
      content: [
        "**Start with Core Razors:** Familiarize yourself deeply with foundational tools like Occam's, Hanlon's, and the Sagan Standard. Understand their common uses and, crucially, their limitations.",
        "**Practice Deliberately:** Make a conscious effort to apply razors in everyday situations – from interpreting news articles to troubleshooting a problem. This builds habit and intuitive understanding.",
        "**Learn from Misapplications:** Note when a razor might have led you astray (e.g., oversimplifying a truly complex issue with Occam's). Understanding boundary conditions is as important as understanding the razor itself.",
        "**Expand Gradually:** Once comfortable with core razors, explore others that address specific cognitive areas or types of problems (e.g., Hitchens's Razor for burden of proof, the Simplicity Razor for expert claims).",
        "**Integrate with Other Models:** Understand how razors fit into a broader set of mental models. They are often for filtering and evaluation, while other models might be for generation (First Principles) or system understanding (Feedback Loops)."
      ]
    },
    {
      title: "Strategies for Combining Razors",
      icon: Zap,
      color: "text-yellow-500 dark:text-yellow-400",
      content: [
        "**Layered Filtering:** Use razors sequentially. Start with Hitchens's Razor (is there *any* evidence?). If yes, and the claim is unusual, apply the Sagan Standard (is the evidence *extraordinary*?). Then, if multiple explanations persist, use Occam's Razor (which is *simplest* and well-supported?). Consider some razors as 'default' starting points.",
        "**Contextual Toolkit:** Different situations call for different primary razors. For interpersonal issues, Hanlon's Razor might be primary. For scientific theory evaluation, Occam's and Sagan Standard are key.",
        "**Cross-Check Interpretations:** Use one razor to challenge the conclusion drawn from another. If Hanlon's Razor suggests incompetence, Occam's Razor might ask if 'incompetence' is the simplest explanation or if systemic factors (per Hubbard's Corollary) are simpler.",
        "**Balance Specificity and Generality:** Some razors are very specific (e.g., Hanlon's for intent), others are general (Occam's for complexity). Understand this scope when combining them."
      ]
    },
    {
      title: "Recognizing Context, Limitations & Biases",
      icon: ShieldAlert,
      color: "text-red-500 dark:text-red-400",
      content: [
        "**Subjectivity & Context-Sensitivity:** Be aware that terms like 'simple' (Occam), 'extraordinary' (Sagan), or distinguishing 'stupidity' from 'malice' (Hanlon) can be subjective. Moreover, the applicability of a razor can be highly context-sensitive (e.g., Occam's in biology vs. physics). Discuss interpretations if in a group.",
        "**Combat Confirmation Bias:** Actively seek reasons why your initial application of a razor might be wrong. If you quickly conclude 'malice' despite Hanlon's Razor, rigorously search for evidence of error or misunderstanding.",
        "**Beware the Availability Heuristic:** Don't let recent, vivid examples (e.g., a case of actual malice) disproportionately affect how you apply razors like Hanlon's in new, unrelated situations.",
        "**Guard Against Overconfidence & Dogmatism:** Applying a razor doesn't guarantee truth. They are heuristics. Avoid the Dunning-Kruger effect by remaining humble about the certainty of your razor-guided conclusions. Do not apply them dogmatically; always consider if the context makes the razor less suitable.",
        "**Seek Diverse Perspectives:** If possible, discuss your reasoning with others. They may spot biases in your application of razors that you missed, or offer different interpretations and contextual factors."
      ]
    },
    {
      title: "Practical Group Application & Decision Making",
      icon: Users,
      color: "text-purple-500 dark:text-purple-400",
      content: [
        "**Foster Good Faith Culture:** In teams, promote an environment where Hanlon's Razor (assuming good intent) is the default to reduce defensiveness and encourage open discussion of errors.",
        "**Facilitated Application:** In meetings, a facilitator can guide the group to consciously apply relevant razors, asking: 'What are our core assumptions here?' (Occam) or 'Have we considered non-malicious interpretations?' (Hanlon).",
        "**Red Teaming Ideas:** Use critical razors (e.g., Complexity Razor, Innovation Razor, Simplicity Razor) to 'red team' proposals or solutions, proactively identifying potential weaknesses or unrealistic assumptions.",
        "**Structured Feedback:** Implement feedback mechanisms that focus on understanding root causes (potentially using razors) rather than assigning blame.",
        "**Encourage Empathy:** Help team members understand each other's contexts and pressures, making charitable interpretations (a la Hanlon's) more natural."
      ]
    },
    {
      title: "Cultivating Intellectual Rigor",
      icon: Brain,
      color: "text-teal-500 dark:text-teal-400",
      content: [
        "**Proactive Truth-Seeking:** Embrace intellectual rigor as a proactive search for truth and understanding, rather than passive acceptance of information or default conclusions.",
        "**Commitment to Continuous Learning:** View your mental toolkit as something that requires ongoing refinement. Be open to revising your understanding of razors as you gain more experience.",
        "**Intellectual Humility:** Recognize the limits of your own knowledge and the fallibility of any single heuristic. Be willing to admit when you are wrong or when a razor has been misapplied.",
        "**Ethical Reasoning:** Understand that sharpened thinking tools come with a responsibility to use them ethically, aiming for clarity, fairness, and constructive outcomes.",
        "**The Value of 'Why':** Constantly ask 'why' to delve deeper into issues, moving beyond surface-level explanations. Razors can help structure this inquiry."
      ]
    }
  ];

  return (
    <div className="p-4 md:p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-200">How to Use Mental Razors Effectively</h1>
      
      <div className="space-y-12">
        {sections.map((section, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h2 className={`text-2xl font-semibold mb-5 flex items-center ${section.color}`}>
              <section.icon className="h-7 w-7 mr-3" />
              {section.title}
            </h2>
            <ul className="space-y-3 list-inside text-gray-700 dark:text-gray-300">
              {section.content.map((point, i) => (
                <li key={i} className="flex items-start">
                  <span 
                    className={`mr-2 mt-1 h-2 w-2 min-w-[0.5rem] rounded-full ${section.color.startsWith('text-') ? section.color.replace('text-', 'bg-') : section.color} ${index === 5 ? 'dark:bg-teal-600' : ''}`} 
                    style={{ 
                      backgroundColor: section.color.startsWith('dark:text-') ? undefined : section.color.split('-')[1] ? section.color.split('-')[1] : undefined 
                    }} ></span>
                  <span dangerouslySetInnerHTML={{ __html: point.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-sky-50 dark:bg-sky-900/30 border border-sky-300 dark:border-sky-700 rounded-lg text-center">
        <h3 className="text-xl font-semibold text-sky-700 dark:text-sky-300 mb-3 flex items-center justify-center">
          <CheckCircle className="h-6 w-6 mr-2" /> Your Journey with Razors
        </h3>
        <p className="text-sky-600 dark:text-sky-400">
          The effective use of mental razors is an ongoing practice of critical thinking and self-correction. Continuously reflect on their application, learn from both successes and misjudgments, and adapt your understanding. The goal is not rigid adherence, but a more refined, rational, and ultimately, wiser approach to navigating complexity.
        </p>
      </div>
    </div>
  );
};

export default UsageGuide; 