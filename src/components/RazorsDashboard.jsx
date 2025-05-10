import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import DarkModeToggle from './ui/dark-mode-toggle';
import SearchBar from './ui/search-bar';
import FavoritesToggle from './ui/favorites-toggle';
import ShareDialog from './ui/share-dialog';
import UsageGuide from './UsageGuide';
import GlossaryPage from './GlossaryPage';
import {
  Brain,
  Lightbulb,
  Target,
  AlertTriangle,
  Compass,
  BookOpen,
  Activity,
  Eye,
  Scale,
  Star,
  StarOff,
  Share2,
  Grid,
  List,
  FlaskConical,
  ScrollText,
  Sigma,
  Puzzle,
  Waypoints,
  TestTube2,
  GitCompareArrows,
  ChevronDown,
  Link,
  BookMarked,
  Library
} from 'lucide-react';
import { preprocessText, getProcessedSearchTokens } from '../utils/nlpUtils.js';
import { Corpus } from 'tiny-tfidf';
import { highlightGlossaryTerms, applySearchHighlight } from '../utils/textUtils.js';
import { glossaryData } from '../glossaryData.js';

// Updated data structure without success metrics, more case studies, and new razors.
const razorsData = {
  expertiseTraps: [
    {
      title: 'Legacy Razor',
      principle:
        "The more successful a past solution was, the more likely it's blinding you to a better current solution.",
      pattern:
        'Success creates emotional attachment to methods that may no longer be optimal.',
      origin_and_evolution: "A modern heuristic reflecting cognitive inertia and the 'success trap,' especially in rapidly changing fields where past triumphs can hinder adaptation to new paradigms. This concept is often implicitly understood in fields undergoing rapid technological or methodological shifts.",
      theoretical_foundations: "Rooted in concepts like functional fixedness (limiting an object to its traditional use), the Einstellung effect (fixation on familiar solutions), and cognitive inertia (resistance to changing one's thoughts). Highlights the difficulty of unlearning previously successful patterns. It underscores how expertise, while valuable, can sometimes lead to rigid thinking if not continually challenged.",
      distinction_from_biases_heuristics: "A consciously applied corrective tool. Aims to counteract confirmation bias (favoring information confirming existing beliefs) and availability bias (over-relying on readily available, often past, examples) by promoting critical evaluation of established methods. Unlike unconsciously operating biases, it's a deliberate strategy for metacognition.",
      boundary_conditions_limitations: "Not all historically successful methods are obsolete; it's crucial to distinguish from 'shiny object syndrome' (chasing novelty without cause). Effective application requires careful contextual evaluation to determine if the old method is genuinely suboptimal or still robust. The razor's value diminishes if it leads to discarding proven methods without strong evidence for better alternatives.",
      methodological_approaches: "Used in strategic planning (challenging established strategies via scenario analysis or red teaming), technology adoption (assessing if new tech truly supersedes proven systems through pilot projects), organizational change management (identifying and addressing resistance rooted in past successes), and personal development (re-evaluating ingrained habits through journaling or feedback).",
      evidence_prioritized: "Prioritizes evidence of changing contexts, declining performance of old methods, and demonstrable benefits of new alternatives. Looks for data showing the 'old way' is less effective or efficient than it used to be, or that new methods offer significant advantages.",
      implementation_patterns: "Regularly schedule 'assumption audits.' Seek out practitioners of opposing methods. Force experimentation with new paradigms, even on a small scale. Foster a culture of 'strong opinions, weakly held.'",
      contextual_adaptations: "In stable industries, it may be applied less frequently. In fast-moving sectors like tech, it's a more critical, ongoing consideration. The 'cost' of being wrong (sticking with old vs. adopting new) also influences its application.",
      successful_applications: ["Blockbuster's failure to adapt to streaming (Netflix) is a classic example of being trapped by past success in physical rentals.", "Kodak's delayed embrace of digital photography despite inventing the first digital camera, due to its profitable film business."],
      unsuccessful_applications: ["A company prematurely abandoning a still-profitable legacy product line for an unproven new technology that fails to gain market traction.", "An individual constantly switching learning methods or tools without mastering any, always assuming the 'new' is better."],
      counter_arguments_or_anti_razors: "Misapplication can lead to prematurely discarding robust, time-tested solutions in favor of unproven novelties. Can foster instability if not balanced with appreciation for enduring principles or solutions that are still 'good enough'. The 'if it ain't broke, don't fix it' maxim can be a counter-argument when change introduces unnecessary risk or cost.",
      related_razors: ["Innovation Razor", "Simplicity Razor", "First Principles Thinking (related model)", "Anti-Sunk Cost Thinking (related concept)", "Einstellung Effect (glossary)"],
      examples: [
        {
          title: 'The Trading Expert',
          context:
            'A successful stock trader who made millions using technical analysis in the 2000s',
          blindspot:
            'Refuses to acknowledge how AI and algorithmic trading have changed market patterns',
          consequence: 'Consistently underperforms despite deep expertise',
          learning: 'Past success can become a cognitive prison.'
        },
        {
          title: 'The Software Architect',
          context: 'Built highly successful monolithic systems in the 2010s',
          blindspot: 'Dismisses microservices as unnecessary complexity',
          consequence: 'Team struggles with scaling and deployment',
          learning:
            'Expertise in an old paradigm becomes a liability in a new context.'
        },
        {
          title: 'The Academic Researcher',
          context:
            'Published a seminal paper 15 years ago, widely cited in the field',
          blindspot:
            'Holds onto the original theory even as new evidence contradicts it',
          consequence: 'Stifles emerging research directions in their lab',
          learning:
            'Past accolades can trap a researcher in outdated models.'
        }
      ],
      indicators: [
        'Defensive about traditional methods',
        'Dismissive of new approaches',
        'Overemphasis on past success'
      ],
      applications: [
        'Schedule regular assumption audits to challenge prevailing methods',
        'Seek out practitioners of opposing methods to gain new perspectives',
        'Force yourself to experiment with new paradigms, even on a small scale',
        'Cultivate a mindset of \'strong opinions, weakly held\''
      ]
    },
    {
      title: 'Simplicity Razor',
      principle:
        "If an expert can't give you a simple example where their theory fails, they've stopped thinking and started believing.",
      pattern: 'Complex models often hide unfalsifiable assumptions.',
      origin_and_evolution: "A modern heuristic emphasizing falsifiability and intellectual humility in expertise. It challenges the notion that complexity always equates to depth, suggesting that truly understood theories should have identifiable limits and potential failure points. Directly related to Popper's Falsifiability Principle, which posits that a theory is scientific only if it can be empirically refuted.",
      theoretical_foundations: "Stems from the scientific principle that a theory's strength is partly demonstrated by its testability and its ability to define conditions under which it would be proven false. Unfalsifiable complexity can mask weak assumptions or a lack of empirical grounding. If a theory makes no specific, risky predictions, it's hard to verify its actual explanatory power.",
      distinction_from_biases_heuristics: "A consciously applied tool to challenge expert overconfidence or the Dunning-Kruger effect. It prompts critical inquiry into the testability and actual predictive power of a complex claim, rather than passive acceptance of authority or intricate explanations. It encourages a skeptical stance towards claims that lack clear boundaries.",
      boundary_conditions_limitations: "Some phenomena are genuinely complex and may not have trivially simple failure examples. The razor targets *unnecessary* complexity or deliberate obfuscation, not inherent intricacy. The questioner must also be able to understand a nuanced answer about failure conditions. Not all inability to provide a simple failure example indicates dogma; the expert might struggle to simplify without losing crucial detail.",
      methodological_approaches: "Informally used in peer review processes, journalistic inquiry, evaluating expert testimony, and any scenario where complex models or theories are presented. It encourages Socratic questioning to probe the boundaries and robustness of an expert's understanding. Ask: 'Under what conditions would this theory *not* hold true?' or 'What observation would make you reconsider this model?'",
      evidence_prioritized: "Prioritizes the existence of clearly defined falsification criteria. Looks for whether an expert can articulate specific, observable conditions under which their theory would be invalidated or require significant revision.",
      implementation_patterns: "When evaluating an expert's claim, ask for failure examples or boundary conditions. Look for comfort with uncertainty and an acknowledgement of the theory's limits. Ensure that theories or explanations are presented in a testable and potentially falsifiable manner.",
      contextual_adaptations: "In fields with high abstraction (e.g., theoretical physics, philosophy), defining simple failure examples can be more challenging but still crucial. In practical fields (e.g., engineering, medicine), failure examples might relate to specific contexts or edge cases.",
      successful_applications: ["Challenging a financial advisor who presents a complex investment strategy without explaining its risks or when it might underperform.", "Pressing a software vendor on the limitations and potential failure points of their 'all-in-one' solution."],
      unsuccessful_applications: ["Dismissing a genuinely complex but accurate scientific theory because the expert struggles to provide a soundbite-sized failure example to a layperson.", "Using it to shut down discussion prematurely without attempting to understand the nuances of a complex system."],
      counter_arguments_or_anti_razors: "Could be misused to dismiss valid but inherently complex theories if the questioner demands an oversimplified 'failure' that doesn't respect the subject's nuance. An 'appeal to simplicity' can itself be a fallacy if it leads to ignoring necessary, well-justified complexity. Some complex systems have emergent properties that make simple failure points hard to isolate.",
      related_razors: ["Occam's Razor", "Popper's Falsifiability Principle (related concept)", "Hitchens's Razor", "Sagan Standard"],
      examples: [
        {
          title: 'The ML Guru',
          context: 'Renowned for intricate deep learning architectures',
          blindspot:
            "Can't discuss where the model breaks down or how it might fail",
          consequence:
            'Overpromises general solutions without addressing limitations',
          learning: 'Explanations must include weaknesses to be credible.'
        },
        {
          title: 'The Economic Forecaster',
          context: 'Claims a grand unifying theory of market behavior',
          blindspot: 'No concrete examples of unpredictability or exceptions',
          consequence: 'Investors get blindsided by unexpected downturns',
          learning: 'Real understanding requires acknowledging uncertainty.'
        },
        {
          title: 'The Theoretical Physicist',
          context: 'Offers a universal theory of everything',
          blindspot: 'Cannot name any phenomenon that would disprove their theory',
          consequence:
            'Theory becomes dogma; no progress in exploring alternative explanations',
          learning:
            'A truly scientific theory must be testable — with conditions that would invalidate it.'
        }
      ],
      indicators: [
        'Overly complicated theories',
        'No mention of edge cases',
        'Claims near-infallibility'
      ],
      applications: [
        'Ask for clear failure examples or boundary conditions for any complex theory',
        'Look for comfort with uncertainty and acknowledgment of limitations in experts',
        'Ensure theories presented are testable and falsifiable, not just narrative explanations'
      ]
    },
    {
      title: 'Confidence Razor',
      principle:
        "The more a person cites their credentials, the less they're relying on logic or evidence.",
      pattern:
        'Over-reliance on authority signals insecurity or a weak argument.',
      origin_and_evolution: "A modern, informal heuristic observing a common rhetorical tactic. It suggests skepticism when arguments lean heavily on speaker status rather than substantive reasoning. It is not formally attributed to a single originator but is a recognized pattern in critical thinking circles.",
      theoretical_foundations: "Relates to the 'Appeal to Authority' (argumentum ad verecundiam) logical fallacy, where a claim is asserted as true primarily because an authority figure stated it. Also connects to social psychology concepts of persuasion and source credibility, noting that while credibility can be a heuristic for trust, it shouldn't replace evidence-based evaluation.",
      distinction_from_biases_heuristics: "A consciously applied evaluative tool to detect when an argument might be weak or fallacious. It helps counter the 'Authority Bias,' the tendency to over-attribute accuracy to the opinion of an authority figure and be more influenced by that opinion. It encourages focusing on the argument's content over the speaker's status.",
      boundary_conditions_limitations: "Genuine experts often possess valid credentials; the razor applies when credentials are used *in place of* or to *deflect from* a lack of evidence or sound logic. It's about the *over-reliance* or *substitutive use* of credentials. Dismissing a well-reasoned argument from a credentialed expert solely due to their credentials would be a misapplication.",
      methodological_approaches: "During discussions or when evaluating claims, note the ratio of substantive arguments versus appeals to status/credentials. Ask clarifying questions that redirect to evidence: 'What data supports this claim?' or 'Can you explain the reasoning behind that conclusion, irrespective of background?'",
      evidence_prioritized: "Prioritizes the presence and quality of logical reasoning, empirical evidence, and data supporting a claim, rather than the speaker's titles, degrees, or reputation. It scrutinizes whether the argument stands on its own merits.",
      implementation_patterns: "Useful in academic discussions, evaluating media pundits, business meetings when a senior person dismisses ideas based on rank, or assessing expert testimony. It encourages a culture where ideas are judged by quality, not by the speaker's hierarchy.",
      contextual_adaptations: "In fields where authority and experience are critical (e.g., a surgeon discussing a procedure), credentials carry more weight but still don't make assertions infallible. The razor is more acutely applied when claims are broad, speculative, or counter-intuitive and primarily backed by status.",
      successful_applications: ["Questioning a high-ranking executive's strategy when it's presented with assertions of experience but lacks supporting market data.", "Being skeptical of a celebrity endorsement for a health product when they cite their fame rather than scientific evidence."],
      unsuccessful_applications: ["Ignoring crucial safety advice from a certified professional (e.g., a structural engineer on a building's safety) simply because they stated their credentials.", "Using it to unfairly dismiss all expert opinion, leading to an anti-intellectual stance."],
      counter_arguments_or_anti_razors: "Expertise and credentials do matter and often correlate with knowledge. The razor is about the *abuse* of authority in argumentation, not a dismissal of expertise itself. A counter would be 'Respect demonstrated expertise when backed by sound reasoning.'",
      related_razors: ["Simplicity Razor (is the expert clear?)", "Hitchens's Razor (claims require evidence)", "Appeal to Authority (Fallacy)"],
      examples: [
        {
          title: 'The Conference Speaker',
          context:
            'Begins each session by reciting advanced degrees and awards',
          blindspot: "Doesn't actually present new data or robust proof",
          consequence: 'Audience trusts reputation but learns little of value',
          learning:
            'Real expertise demonstrates clarity and evidence, not just credentials.'
        },
        {
          title: 'Senior Dev on a New Stack',
          context:
            'Frequently references years of experience in a legacy language',
          blindspot:
            "Resists peer suggestions because \"I've done this for 20 years\"",
          consequence:
            'Team sees outdated approaches repeated; new best practices ignored',
          learning:
            'Authority is no substitute for experimentation or updated skill.'
        }
      ],
      indicators: [
        'Frequent mention of titles, awards, degrees',
        'Dismissive of direct evidence or new data',
        'Appeals to authority over logic'
      ],
      applications: [
        'Evaluate arguments on merit, not credentials',
        'Encourage open discussion of evidence',
        'Reward clarity and demonstration over titles'
      ]
    }
  ],
  systemTraps: [
    {
      title: 'Complexity Razor',
      principle:
        "If a system requires everyone to act optimally to function, it's not a system – it's a fantasy.",
      pattern:
        'Designers often assume ideal user behavior, ignoring real-world constraints.',
      origin_and_evolution: "A modern heuristic in systems design, user experience (UX), and process management. It reflects observations that systems failing to account for human error, variance in user skill, or non-ideal conditions are prone to failure.",
      theoretical_foundations: "Rooted in Human Factors Engineering, ergonomics, and resilience engineering, which emphasize designing systems that are robust to human variability and error. Contrasts with idealized models that assume perfect compliance or understanding by all actors within a system.",
      distinction_from_biases_heuristics: "A consciously applied design principle to counteract 'optimism bias' or 'planning fallacy' in designers, who may overestimate adherence to procedures or underestimate the likelihood of errors. It prompts a more realistic assessment of system interaction.",
      boundary_conditions_limitations: "While systems should be robust, striving for a system that tolerates *any* conceivable misuse can lead to over-engineering or excessive constraints. There's a balance between designing for realism and enabling effective functionality. Some critical systems *do* require high levels of user training and adherence (e.g., airline piloting).",
      methodological_approaches: "Use techniques like Failure Mode and Effects Analysis (FMEA), user testing with diverse participants (including novices or those under stress), and designing for 'graceful failure' or 'fault tolerance'. Incorporate checklists, clear affordances, and error prevention mechanisms.",
      evidence_prioritized: "Prioritizes data from real-world usage, stress testing, observation of user behavior (especially errors and workarounds), and feedback on usability issues. It values understanding how the system performs under non-ideal conditions.",
      implementation_patterns: "Designing software interfaces that prevent common errors. Creating public services that are accessible and usable by people with varying abilities and under different circumstances. Developing safety protocols that assume occasional lapses in attention.",
      contextual_adaptations: "The degree of tolerance for non-optimal behavior varies by system criticality. A life-support system has different requirements than a casual mobile game. However, the general principle of anticipating non-ideal behavior applies broadly.",
      successful_applications: ["Automobile safety features like anti-lock brakes (ABS) that work even if the driver panics and slams the pedal.", "Well-designed websites with clear error messages and recovery paths when users make mistakes in forms."],
      unsuccessful_applications: ["A complex software rollout that assumes all employees will perfectly follow a lengthy training manual from day one, leading to widespread errors and frustration.", "A public health campaign that relies on every citizen flawlessly adhering to complex, multi-step guidelines."],
      counter_arguments_or_anti_razors: "Designing for the 'lowest common denominator' can sometimes stifle innovation or create overly simplistic systems for expert users. Some level of user responsibility and competence must be assumed for any functional system. The goal is realistic design, not necessarily foolproof for all imaginable misuse.",
      related_razors: ["Innovation Razor (don't force behavior change)", "Over-Engineering Razor (is it too complex to use?)", "Poka-yoke (mistake-proofing design principle)"],
      examples: [
        {
          title: 'The Perfect Security Protocol',
          context: "Enterprise implements an 'unbreakable' security system",
          blindspot:
            'Assumes users will never reuse passwords or fall for phishing schemes',
          consequence: 'Major breach when employees share credentials on sticky notes',
          learning:
            'Systems must assume realistic, even suboptimal, user behavior.'
        },
        {
          title: 'The Educational Reform',
          context: 'A new curriculum requires all students to study 3 hours a day at home',
          blindspot: 'Assumes stable home environments and parental support',
          consequence: 'Program fails in underprivileged districts',
          learning: 'System design must account for social realities.'
        },
        {
          title: 'The Smart City Project',
          context:
            'City planners implement a system where each citizen schedules water usage and traffic patterns precisely',
          blindspot: 'Ignores how unpredictable real human schedules can be',
          consequence:
            'Mass confusion and tech reliance that collapses under normal daily variations',
          learning:
            'Cities thrive on flexible systems, not forced precision.'
        }
      ],
      indicators: [
        'Assumes optimal behavior',
        'Ignores edge cases or outliers',
        'Lacks fault tolerance'
      ],
      applications: [
        'Design for worst case',
        'Build in redundancy',
        'Test with real user behaviors'
      ]
    },
    {
      title: 'Innovation Razor',
      principle:
        "If your solution requires people to change their basic behavior, you haven't solved the problem – you've avoided it.",
      pattern:
        'Many ideas shift burdens onto users rather than solving underlying issues.',
      origin_and_evolution: "A modern heuristic particularly relevant in product design, service innovation, and technology adoption. It highlights that the path of least resistance for users often determines an innovation's success.",
      theoretical_foundations: "Draws from behavioral economics (status quo bias, effort discounting), user-centered design principles, and diffusion of innovations theory (which notes that compatibility with existing values and practices speeds adoption). It acknowledges the high friction involved in altering established habits.",
      distinction_from_biases_heuristics: "A consciously applied principle to guide solution design, countering the 'designer's fallacy' of assuming users are as motivated or adaptable as the creator. It pushes for empathy and understanding of existing user workflows and motivations.",
      boundary_conditions_limitations: "Some transformative innovations *do* require behavior change, but they typically offer such a massive value proposition that users are willing to make the shift (e.g., adopting smartphones). The razor is most potent against solutions that impose behavior change for marginal benefits or to compensate for poor design.",
      methodological_approaches: "Employ user research (ethnography, journey mapping) to understand existing behaviors. Design for minimal disruption. Leverage existing habits or piggyback on current workflows. If behavior change is necessary, ensure the perceived benefit vastly outweighs the cost of change, and provide strong incentives or supports.",
      evidence_prioritized: "Prioritizes observations of actual user behavior, adoption rates of similar innovations, and studies on habit formation and change. It looks for evidence that the proposed solution integrates smoothly or offers compelling reasons to change.",
      implementation_patterns: "Designing software that automates tasks rather than requiring new manual processes. Creating services that fit into existing daily routines. Focusing on intrinsic motivators if behavior change is essential.",
      contextual_adaptations: "The tolerance for behavior change can vary by user group (e.g., early adopters vs. laggards) and perceived need. In crisis situations, people might be more willing to adopt new behaviors if the need is clear.",
      successful_applications: ["Subscription models that automatically deliver goods, reducing the need for active re-ordering.", "One-click purchasing that streamlines online shopping by minimizing required user actions."],
      unsuccessful_applications: ["A new social media platform that requires users to learn a complex new interaction model without a clear unique benefit over existing platforms.", "A corporate wellness app that requires extensive manual data entry from busy employees."],
      counter_arguments_or_anti_razors: "Stagnation if no behavior change is ever pursued. Sometimes, the 'problem' *is* a harmful behavior, and the solution *must* involve changing it (e.g., public health campaigns against smoking). The key is that the solution itself shouldn't be the primary driver of complex, unmotivated behavior change if an alternative exists.",
      related_razors: ["Complexity Razor (is it too hard to do?)", "Path of Least Resistance (Concept)", "User-Centered Design (Methodology)"],
      examples: [
        {
          title: 'The Privacy-Focused App',
          context: 'App with perfect encryption requiring manual key management',
          blindspot:
            'Users must manually verify all connections and remember long keys',
          consequence: 'Almost nobody uses it, despite strong security',
          learning: 'Behavior change is the hardest part of adoption.'
        },
        {
          title: 'The Eco-Friendly Product',
          context: 'Requires customers to wash or recycle specialized packaging',
          blindspot: 'Demands time and effort from busy consumers',
          consequence: 'High-minded idea with low real-world uptake',
          learning:
            'Solutions must align with existing habits or be so valuable that behavior change is worth it.'
        },
        {
          title: 'Employee Wellness Program',
          context:
            'Company expects employees to self-report stress and daily exercise logs',
          blindspot:
            'Assumes employees have bandwidth and willingness to track everything',
          consequence: 'Low participation and trivial or false data',
          learning:
            'Design interventions that integrate smoothly into existing workflows.'
        }
      ],
      indicators: [
        'Relies on large-scale behavior shifts',
        'Ignores user convenience',
        'Blames failures on "lazy" or "ignorant" users'
      ],
      applications: [
        'Design solutions that fit existing workflows',
        'Incentivize minimal behavior changes',
        'Focus on underlying root causes'
      ]
    },
    {
      title: 'Over-Engineering Razor',
      principle:
        'If a system has so many moving parts that you cannot concisely explain it, it is probably over-engineered.',
      pattern:
        'Complex designs often mask unclear requirements or lack of focus.',
      origin_and_evolution: "A common observation in engineering, software development, and systems design, reflecting the preference for simplicity and maintainability (related to the KISS principle). It suggests that excessive complexity often leads to brittleness, difficulty in understanding, and higher maintenance costs.",
      theoretical_foundations: "Connects to principles of lean thinking (eliminating waste, including complexity that doesn't add value), modular design (where complexity is encapsulated), and cognitive load theory (humans have limited capacity to process excessive information). Simpler systems are generally easier to reason about, debug, and modify.",
      distinction_from_biases_heuristics: "A consciously applied evaluative heuristic used during design and review phases. It helps to counteract tendencies like 'résumé-driven development' (choosing overly complex technologies for personal learning rather than project need) or 'gold plating' (adding unnecessary features).",
      boundary_conditions_limitations: "Some problems are inherently complex and require sophisticated solutions; the razor targets *unnecessary* or *accidental* complexity, not essential complexity. A system might be complex but well-structured and explainable by those with sufficient expertise. The key is whether the complexity serves a clear, justifiable purpose relative to the problem being solved.",
      methodological_approaches: "Employ design reviews focusing on simplicity and justification for each component. Use iterative development where complexity is added incrementally and only as needed. Ask: 'What is the simplest possible solution that works?' Regularly refactor to remove complexity that no longer adds value.",
      evidence_prioritized: "Prioritizes clarity of purpose for each system component, ease of explanation to stakeholders, and metrics related to maintainability, bug rates, and onboarding time for new team members. It questions complexity that cannot be clearly justified by requirements.",
      implementation_patterns: "Software architecture (favoring simpler, more decoupled designs unless specific performance needs dictate otherwise). Product design (avoiding feature creep). Process improvement (streamlining workflows and removing unnecessary steps).",
      contextual_adaptations: "In research or cutting-edge R&D, some initial complexity might be part of exploration. However, as solutions mature, simplification is often a goal. The definition of 'concisely explain' varies with the audience's technical depth.",
      successful_applications: ["Refactoring a complex legacy codebase into a simpler, more modular architecture, leading to fewer bugs and faster development cycles.", "Choosing a straightforward, well-understood technology stack over a newer, more complex one when the project requirements don't justify the added complexity."],
      unsuccessful_applications: ["A startup building a massively scalable microservices architecture for a product with only a handful of initial users, leading to high operational costs and slow development.", "Adding numerous configurable options to a software product that confuse most users and are rarely used."],
      counter_arguments_or_anti_razors: "'Premature optimization is the root of all evil' (Knuth) can be a caution against over-simplifying too early if genuine complexity is needed for future scaling or functionality. Some systems are necessarily complex to model complex domains (e.g., climate models, advanced financial systems). The focus should be on avoiding *gratuitous* complexity.",
      related_razors: ["Occam's Razor (prefer simpler explanations/designs)", "KISS Principle", "YAGNI (You Ain't Gonna Need It) principle"],
      examples: [
        {
          title: 'The Microservice Maze',
          context:
            'Dozens of small services each needing constant orchestration and version management',
          blindspot:
            'Team never asked if all these services were necessary in the first place',
          consequence:
            'Operational overhead dwarfs any benefits of separation',
          learning:
            'Break down complexity only where it delivers clear, measurable value.'
        },
        {
          title: 'The Plugin-Crazy Website',
          context:
            'Multiple overlapping plugins for analytics, forms, SEO, and visuals',
          blindspot:
            'Site is slow and prone to conflicts; no single dev fully understands it',
          consequence:
            'Frequent downtime, poor UX, and massive tech debt',
          learning:
            'Every plugin must serve a clear purpose. Minimalism fosters maintainability.'
        }
      ],
      indicators: [
        'Confused developers or users',
        'Frequent breakages in interconnected modules',
        "Hard to articulate system's core purpose"
      ],
      applications: [
        'Evaluate necessity of each component',
        'Refactor or remove unused modules',
        'Opt for simplicity unless complexity is clearly justified'
      ]
    }
  ],
  cognitiveTraps: [
    {
      title: 'Granularity Razor',
      principle:
        "When you can't make progress on a problem, you're probably operating at the wrong level of abstraction.",
      pattern:
        'Effort at the wrong level wastes energy while ignoring bigger or smaller contexts.',
      origin_and_evolution: "A heuristic related to problem-solving, systems thinking, and strategic analysis. It emphasizes the importance of choosing the appropriate scale or level of detail for analyzing and addressing an issue.",
      theoretical_foundations: "Draws from systems theory (understanding interactions between different levels of a system), abstraction in computer science (hiding complex details behind simpler interfaces), and hierarchical problem decomposition. Effective problem-solving often requires shifting between zooming in (details) and zooming out (big picture).",
      distinction_from_biases_heuristics: "A consciously applied metacognitive strategy to overcome fixation or unproductive effort. It helps counter 'analysis paralysis' (getting stuck in details) or overly superficial assessments (missing critical nuances) by prompting a deliberate shift in perspective.",
      boundary_conditions_limitations: "Constantly shifting levels without focused effort at any one level can also be unproductive. The skill lies in identifying when a shift is needed and then committing to analysis at the chosen new level. Some problems genuinely require deep, sustained focus at a specific level of detail.",
      methodological_approaches: "When stuck, ask: 'Am I too focused on the trees to see the forest?' (zoom out) or 'Is there a critical detail I'm missing within this component?' (zoom in). Use techniques like the '5 Whys' to drill down to root causes, or context mapping/stakeholder analysis to understand the broader system.",
      evidence_prioritized: "Prioritizes indicators of progress (or lack thereof). If efforts at the current level of detail are not yielding results, or if solutions feel like whack-a-mole, it signals a need to reassess the abstraction level.",
      implementation_patterns: "Strategic planning (shifting between high-level goals and specific operational tactics). Software debugging (moving between system architecture views and specific lines of code). Scientific research (alternating between broad theory and specific experimental details).",
      contextual_adaptations: "In rapidly changing environments, more frequent checks on the appropriate level of abstraction may be needed. In well-understood, stable problems, the optimal level might be more consistent.",
      successful_applications: ["A marketing team struggling with low campaign engagement (feature level) realizes the core issue is a misalignment with the overall brand strategy (strategic level).", "A software team stuck on a performance bug realizes the issue isn't in their micro-optimizations but in a fundamental architectural bottleneck."],
      unsuccessful_applications: ["Constantly redefining the scope of a project (strategic level) without ever executing on concrete tasks (operational level).", "Getting bogged down in perfecting tiny UI details while the core product functionality is flawed."],
      counter_arguments_or_anti_razors: "Focus and deep work at a chosen level are also essential. The razor isn't an excuse for flitting between levels without purpose. A counter-argument could be 'Master the fundamentals at the current level before blaming the abstraction.'",
      related_razors: ["First Principles Thinking (breaking down to fundamental truths)", "Systems Thinking (understanding interconnections)", "Zooming In/Out (Problem-Solving Technique)"],
      examples: [
        {
          title: 'The Feature Factory',
          context: 'Product team iterating rapidly on minor features',
          blindspot: 'Never questioning overall product-market fit',
          consequence: 'Perfect features nobody wants',
          learning: 'Excellence at the wrong level is still failure.'
        },
        {
          title: 'The Team Conflict',
          context:
            'Manager tries to resolve interpersonal tensions by focusing on daily standup protocols',
          blindspot: 'Real issue is the org structure creating competition',
          consequence:
            'Conflict remains while meeting rules become more cumbersome',
          learning:
            'Sometimes you need to move "up" or "down" a level to find the real problem.'
        },
        {
          title: 'The Data Scientist',
          context:
            'Spends weeks hyper-optimizing models, ignoring questionable data quality upstream',
          blindspot:
            'Keeps refining the model while data remains noisy or mislabeled',
          consequence:
            'Mediocre results no matter the algorithm used',
          learning:
            'Sometimes the bigger problem is not your current focus.'
        }
      ],
      indicators: [
        'Lots of activity, little progress',
        'Problems keep recurring',
        'Solutions feel incomplete'
      ],
      applications: [
        'State and test your abstraction level',
        'Experiment with bigger or smaller scope',
        "Question whether you're solving the right problem"
      ]
    },
    {
      title: 'Coherence Razor',
      principle:
        "If you can explain something clearly but can't predict what happens next, you've created a story, not an understanding.",
      pattern:
        'Narratives give the illusion of insight while failing the test of prediction.',
      origin_and_evolution: "A modern heuristic focused on distinguishing true understanding (which should have predictive power) from mere descriptive coherence or storytelling. It emphasizes the empirical test of prediction as a hallmark of robust knowledge.",
      theoretical_foundations: "Relates to the scientific method's emphasis on falsifiable hypotheses and predictive validity. A good model or theory should not only explain past events but also make testable predictions about future ones. Connects to critiques of 'narrative fallacy' (Taleb) where plausible stories are preferred over rigorous statistical understanding.",
      distinction_from_biases_heuristics: "A consciously applied evaluative principle. It serves to counteract the 'narrative bias' (our tendency to be swayed by compelling stories, even if they lack predictive accuracy) and 'hindsight bias' (seeing past events as more predictable than they were).",
      boundary_conditions_limitations: "Not all domains offer easily testable predictions (e.g., complex historical events, some social sciences). Some understanding is about interpreting meaning, not just making forecasts. However, even in such areas, the ability to anticipate patterns or potential consequences can be a sign of deeper understanding.",
      methodological_approaches: "When presented with an explanation, ask: 'What specific, testable predictions does this explanation make?' Track the accuracy of past predictions made based on this understanding. Distinguish between post-hoc explanations (fitting a story to known facts) and a-priori predictions.",
      evidence_prioritized: "Prioritizes a track record of accurate predictions or the ability to generate specific, falsifiable forecasts. Values explanations that can be prospectively tested against new data or events.",
      implementation_patterns: "Evaluating financial analysts (do their models predict market movements, or just explain past ones?). Assessing policy proposals (what are the predicted outcomes, and how will they be measured?). Critiquing historical narratives (do they offer insights that could have guided past actions or predict similar future event patterns?).",
      contextual_adaptations: "The required precision and timeframe of predictions vary by domain. In chaotic systems, precise prediction may be impossible, but understanding underlying dynamics and probabilities might still be achievable.",
      successful_applications: ["Favoring a weather forecasting model that consistently predicts rainfall accurately over one that provides eloquent explanations of past weather patterns but has poor predictive skill.", "Valuing an economic theory that successfully predicted a past recession and can articulate conditions for future ones, over one that only explains recessions in hindsight."],
      unsuccessful_applications: ["Dismissing all historical analysis because it can't make perfect point predictions about the future; historical understanding can still provide valuable context and pattern recognition.", "Over-reliance on purely statistical models that make good predictions but offer no causal understanding, potentially failing when underlying conditions change."],
      examples: [
        {
          title: 'The Market Analyst',
          context: 'Perfectly explains every past crash',
          blindspot: 'Zero predictive track record',
          consequence: 'Investors lulled by compelling but useless narratives',
          learning: 'Explanations must inform the future, not just the past.'
        },
        {
          title: 'The Start-up Retrospective',
          context: 'Leaders craft a neat story about why they succeeded',
          blindspot:
            'Ignores luck, timing, and pivot missteps that contradict the official narrative',
          consequence:
            'Next product launch fails because they believe their own sanitized origin story',
          learning:
            'True understanding requires humility and testable hypotheses.'
        },
        {
          title: 'The Political Pundit',
          context:
            'Confidently explains every election outcome after it happens',
          blindspot: 'Never accurately forecasts new political trends',
          consequence: 'Viewers mistake post-hoc storytelling for expertise',
          learning:
            'Real insight must predict or guide action, not just reframe history.'
        }
      ],
      indicators: [
        'Great narrative but no testable predictions',
        'After-the-fact explanations',
        'Failure to forecast any new events'
      ],
      applications: [
        'Distinguish story from model',
        'Demand explicit predictions',
        'Track accuracy over time'
      ]
    },
    {
      title: 'Procrastination Razor',
      principle:
        "If you've been putting something off for a long time, the mental overhead is probably greater than the task itself.",
      pattern:
        'Avoidance consumes energy and creates stress without resolution.',
      origin_and_evolution: "An informal, modern psychological heuristic based on common experiences with task avoidance and the mental burden of unfinished tasks. It highlights the often disproportionate anxiety and energy drain caused by procrastination compared to the actual effort of the task.",
      theoretical_foundations: "Relates to concepts like 'Zeigarnik effect' (tendency to remember unfinished tasks better than completed ones, leading to intrusive thoughts), decision fatigue (procrastination as a way to avoid making choices), and anxiety-avoidance cycles. The mental effort of continually remembering, rationalizing delay, and feeling guilty can be substantial.",
      distinction_from_biases_heuristics: "A self-applied motivational tool or insight. It helps to reframe the perceived cost of a task by highlighting the hidden costs of *not* doing it (i.e., the ongoing mental overhead). It counters the immediate discomfort of starting a task with the long-term relief of completion.",
      boundary_conditions_limitations: "Not all procrastinated tasks are trivial; some are genuinely large, difficult, or require specific timing/readiness. The razor applies best to tasks that are objectively manageable but are being avoided due to psychological factors (fear of failure, perfectionism, boredom). It does not apply if the task is truly low priority and the 'overhead' is minimal.",
      methodological_approaches: "When feeling the weight of a procrastinated task, estimate the actual time/effort to complete it versus the mental energy spent avoiding it. Use techniques like the 'Two-Minute Rule' (if it takes less than two minutes, do it now) or breaking the task into very small initial steps to overcome activation energy.",
      evidence_prioritized: "Relies on introspective evidence: the feeling of persistent dread, mental preoccupation with the undone task, and the relief experienced once a similar procrastinated task was finally completed in the past.",
      implementation_patterns: "Tackling overdue emails, making dreaded phone calls, starting a challenging report or project, addressing minor household repairs. It's about recognizing that the anticipation and avoidance are often worse than the execution.",
      contextual_adaptations: "More effective for tasks where the primary barrier is psychological rather than a genuine lack of time or resources. The definition of 'long time' is subjective but generally implies persistent, nagging avoidance.",
      successful_applications: ["Finally starting and completing a dreaded administrative task (e.g., taxes, organizing files) and finding it took less time and was less painful than anticipated, with significant mental relief afterwards.", "Making a difficult phone call that was put off for weeks, only to resolve the issue quickly."],
      unsuccessful_applications: ["Forcing oneself to start a massive, ill-defined project without proper planning solely based on this razor, leading to burnout or poor quality work.", "Applying it to a task that genuinely requires more information or resources that are not yet available, leading to wasted effort."],
      counter_arguments_or_anti_razors: "Sometimes, procrastination allows for important incubation of ideas or for circumstances to become more favorable ('strategic procrastination'). However, this is distinct from an anxiety-driven avoidance of manageable tasks. A counter might be, 'Ensure the task is actually worth doing and that now is the right time before forcing action.'",
      related_razors: ["Two-Minute Rule (Productivity Technique)", "Eat The Frog (Productivity Technique)", "Activation Energy (Concept)"],
      examples: [
        {
          title: 'The Delayed Doctor Visit',
          context:
            'Someone experiences mild symptoms for months, keeps avoiding checkups',
          blindspot:
            'Fears diagnosis and possible lifestyle changes',
          consequence:
            'An easily treatable condition worsens, leading to serious complications',
          learning:
            'In many cases, timely action is less burdensome than prolonged worry.'
        },
        {
          title: 'The Overdue Code Refactor',
          context:
            'A developer knows the codebase is messy but dreads the "big rewrite"',
          blindspot:
            'Assumes refactoring will be a massive, painful project',
          consequence:
            'Technical debt builds daily, making the eventual fix even worse',
          learning:
            'Steady incremental improvements are better than indefinite avoidance.'
        }
      ],
      indicators: [
        'Persistent dread about a simple task',
        'Rationalizing delay with trivial excuses',
        'Task weighs on your mind more than it would take to do'
      ],
      applications: [
        'Break tasks into small steps',
        'Set deadlines or accountability partners',
        'Focus on the relief of completion over the fear of starting'
      ]
    }
  ],
  foundationalRazors: [
    {
      title: "Occam's Razor",
      principle: "Among competing hypotheses that explain the data equally well, the one with the fewest assumptions should be selected.",
      pattern: "Entities should not be multiplied without necessity. Prefer simpler, more parsimonious explanations.",
      origin_and_evolution: "Attributed to the 14th-century Franciscan friar William of Ockham ('Pluralitas non est ponenda sine necessitate'). However, the core idea of parsimony predates Ockham, with roots in Aristotle ('Nature operates in the shortest way possible'). Later adopted by scientists like Newton, Leibniz, and Einstein. It's a long-standing principle in philosophy and science for guiding theory construction and evaluation. (Framework 1.4, 3.1, 4.2)",
      theoretical_foundations: "Based on the principle of parsimony: simpler explanations are generally preferable because each additional assumption introduces a potential point of error, making simpler theories more robust and easier to test. It's a principle of epistemic risk management: fewer unverified assumptions mean less chance of building a theory on a shaky foundation. (Framework 1.1, 1.3, 2.1, 2.3)",
      distinction_from_biases_heuristics: "A consciously applied heuristic to guide theory choice and simplify problem-solving, unlike many cognitive biases that operate automatically. It's a normative heuristic – a rule for how to reason more effectively, sometimes by countering biases towards overly complex narratives. (Framework 1.2)",
      boundary_conditions_limitations: "Simplicity should not trump accuracy or explanatory power. If a more complex theory provides a significantly better explanation of facts or has stronger empirical support, it should be preferred ('Everything should be made as simple as possible, but not simpler' - Einstein, paraphrased). Defining 'simplicity' can be subjective (fewer entities vs. fewer complex interactions). In inherently complex systems (e.g., biology, social systems), the simplest explanation might be an oversimplification. (Framework 1.5)",
      methodological_approaches: "Informal: Consciously scrutinize assumptions underlying competing explanations ('Which requires fewer unproven premises?'). Formal: Operationalized in statistical model selection (e.g., AIC, BIC) and Bayesian inference, which naturally penalize model complexity. In science, it guides development of testable, falsifiable theories. (Framework 2.1, 2.3)",
      evidence_prioritized: "Focuses on the intrinsic characteristics of an explanation or theory itself in relation to existing evidence: the number of unproven assumptions or entities. When theories equally account for observed data, it prefers structural parsimony. Bayesian interpretations prioritize how well a model predicts observed data while penalizing undue complexity. (Framework 2.2)",
      implementation_patterns: "Troubleshooting (check simplest causes first). Product design (minimalist UX). Scientific theory choice. Everyday problem-solving (e.g., if a light doesn't work, check bulb/breaker before suspecting wiring). (Framework 3.1)",
      contextual_adaptations: "In UX design, it means streamlined interfaces. In physics, fewer constants. In biology, caution is urged as systems are inherently complex (Crick). (Framework 3.2)",
      successful_applications: ["Copernican heliocentrism eventually preferred over complex Ptolemaic system. Einstein's Special Relativity eliminated the need for luminiferous ether. (Framework 3.3)", "Medical diagnosis: 'When you hear hoofbeats, think horses, not zebras' (common diseases first)."],
      unsuccessful_applications: ["Phlogiston theory became overly complex to explain new data, delaying oxygen theory. Over-reliance in medicine can delay diagnosis of rare diseases ('zebras'). (Framework 3.3)", "Dismissing complex social phenomena with overly simplistic explanations."],
      counter_arguments_or_anti_razors: "'Hickam's Dictum' in medicine: 'Patients can have as many diseases as they damn well please.' This cautions against oversimplification when multiple conditions might co-exist. The simplest theory isn't always true; it's just a good starting point. (Framework 1.5)",
      related_razors: ["Hanlon's Razor", "Sagan Standard", "KISS Principle", "Hickam's Dictum (counterpart)"],
      examples: [
        {
          title: "Medical Diagnosis (Hoofbeats)",
          context: "A patient presents with common flu-like symptoms: cough, fever, fatigue.",
          blindspot: "Immediately suspecting a rare tropical disease or a complex autoimmune disorder without first considering common viral infections like influenza or a common cold.",
          consequence: "Ordering expensive, invasive, and unnecessary tests; causing patient anxiety; delaying appropriate treatment for a simple condition.",
          learning: "Start with the simplest, most probable explanation that accounts for the core symptoms before escalating to more complex and less likely diagnoses."
        },
        {
          title: "Software Bug Investigation",
          context: "A web page fails to load correctly after a recent minor code deployment.",
          blindspot: "Assuming a sophisticated cyber-attack, a major server-side infrastructure failure, or a deep systemic issue in a core library.",
          consequence: "Wasting significant time and resources investigating complex, improbable scenarios instead of first checking the recent code changes, logs, or simple configuration errors.",
          learning: "The most recent change or the simplest component in a system is often the source of a new problem. Rule out simple explanations before diving into complexity."
        },
        {
          title: "Conspiracy Theories",
          context: "A major public event occurs (e.g., a natural disaster, an economic downturn).",
          blindspot: "Attributing the event to a secret, coordinated plot by powerful, hidden figures involving numerous intricate steps and perfect secrecy among many conspirators.",
          consequence: "Spreading misinformation, fostering distrust, and diverting attention from more plausible, albeit sometimes mundane or systemic, explanations (e.g., natural causes, human error, complex emergent system behaviors).",
          learning: "Explanations requiring many coordinated, unproven assumptions and agents acting with flawless covert precision are less likely than explanations involving fewer, more straightforward causes."
        }
      ],
      indicators: [
        "Overly complex explanations for relatively simple phenomena.",
        "Introduction of many new, unproven entities or causes without necessity.",
        "Ignoring simpler, well-established explanations that fit the facts.",
        "Explanations that require numerous precise coincidences or assumptions to hold true."
      ],
      applications: [
        "When debugging code or troubleshooting problems, check the simplest potential causes first.",
        "In scientific theory development, favor models that explain the observed data with fewer ad-hoc assumptions or parameters.",
        "When problem-solving in everyday life, try to strip away unnecessary complexity to find the core issue.",
        "Be skeptical of explanations that require a large number of 'ifs' or conjectures to be true simultaneously."
      ]
    },
    {
      title: "Hanlon's Razor",
      principle: "Never attribute to malice that which is adequately explained by stupidity, incompetence, negligence, or error.",
      pattern: "People often assume negative intent behind actions that are more likely due to oversight, lack of information, misunderstanding, or simple mistakes.",
      origin_and_evolution: "Attributed to Robert J. Hanlon (submitted for 'Murphy's Law Book Two' in 1980). Popularized in the Jargon File (1990). Precursors include Goethe (1774, 'Misunderstandings and neglect create more confusion...than trickery and malice'), Napoleon Bonaparte ('Never ascribe to malice that which is adequately explained by incompetence'), and Robert A. Heinlein (1941, 'You have attributed conditions to villainy that simply result from stupidity'). Reflects a recurring observation about the relative frequencies of error versus deliberate harm. (Framework 1.4, 3.1)",
      theoretical_foundations: "Based on the principle of charity in interpretation and establishing a default to non-malice. Functions as epistemic risk management: assuming malice too readily can inflict unnecessary damage on relationships or escalate conflict (a high cost). It filters interpretations by initially excluding negative intent when less damaging explanations (error, incompetence) suffice. (Framework 1.1, 1.3)",
      distinction_from_biases_heuristics: "A consciously applied normative heuristic. Designed to counteract cognitive biases such as the fundamental attribution error (overemphasizing personality-based explanations for others' behaviors while underemphasizing situational factors) and confirmation bias (seeking information confirming pre-existing beliefs of malice). Prompts deliberate consideration of non-malicious explanations. (Framework 1.2)",
      boundary_conditions_limitations: "Inappropriate when there's clear, repeated, or strong evidence of malicious intent or willful negligence. Over-application can lead to naivete or excusing genuinely harmful behavior. Does not absolve individuals of responsibility for the consequences of their incompetence. Most relevant when both malice and error are plausible explanations. (Framework 1.5)",
      methodological_approaches: "Primarily informal. Involves pausing before attributing to malice and systematically asking diagnostic questions: 'Could there be an alternative explanation (error, misunderstanding)?' 'Is there concrete evidence of malice?' 'What situational factors might be at play?' Encourages curiosity and search for understanding. (Framework 2.1)",
      evidence_prioritized: "Shifts evidentiary focus towards information regarding intent, motive, competence, and contextual factors surrounding an action, rather than relying solely on the negative outcome. Seeks evidence of error, misunderstanding, or situational pressures before concluding malice. (Framework 2.2)",
      implementation_patterns: "Interpersonal communication (giving benefit of doubt). Team dynamics (blameless retrospectives in software development). Conflict resolution. Customer service. (Framework 2.3, 3.1)",
      contextual_adaptations: "Workplace (consider lack of training, unclear expectations before assuming insubordination). Hubbard's Corollary: 'Never attribute to malice or stupidity that which can be explained by moderately rational individuals following incentives in a complex system of interactions' – useful for organizational dysfunction. (Framework 1.5, 3.2)",
      successful_applications: ["Software development retrospectives focusing on process flaws over individual blame. De-escalating arguments by considering misunderstanding before intentional insult. (Framework 3.3)", "A consultant realizing a team's poor code quality is due to lack of mentorship (incompetence/lack of resource) not deliberate poor work (malice)."],
      unsuccessful_applications: ["Repeatedly excusing consistently harmful or negligent behavior that does, in fact, stem from malicious intent or severe irresponsibility.", "Apple Siri's initial failure to find abortion clinics attributed by some to malice, when it was a programming error (Hanlon's would have guided correctly). (Framework 3.3)"],
      counter_arguments_or_anti_razors: "Hubbard's Corollary provides a more nuanced view for systemic issues. Repeated patterns of 'incompetence' causing harm might indeed indicate something more, like willful negligence or passive aggression, which the razor might obscure if applied too broadly. One must remain vigilant to actual malice.",
      related_razors: ["Occam's Razor", "Principle of Charity", "Grice's Razor", "Hubbard's Corollary (adaptation)"],
      examples: [
        {
          title: "Delayed Email Response",
          context: "A colleague doesn't reply to an important email for a day, holding up a critical task.",
          blindspot: "Immediately assuming the colleague is intentionally ignoring the email, being uncooperative, or trying to sabotage the project.",
          consequence: "Generating unnecessary interpersonal conflict, stress, feeling personally slighted, and misjudging the colleague's professionalism or workload.",
          learning: "Consider simpler, more common explanations: they are swamped with work, missed the email, are out of office, or dealing with a personal issue, before assuming negative intent."
        },
        {
          title: "Incorrect Food Order",
          context: "A restaurant waiter brings the wrong dish to the table after a specific order was placed.",
          blindspot: "Believing the waiter is incompetent, intentionally messing up the order due to some perceived slight, or that the kitchen staff is deliberately trying to ruin the meal.",
          consequence: "Reacting with anger or aggression, making a scene, and having a poor dining experience, when it was likely a simple human error in a busy environment.",
          learning: "Mistakes are common in service industries; malice is usually rarer and requires more substantial evidence. A calm inquiry is more productive."
        },
        {
          title: "Critical Feedback in a Code Review",
          context: "A senior developer provides direct and extensive critical feedback on a junior developer's code submission.",
          blindspot: "The junior developer perceiving the feedback as a personal attack, a sign of dislike, or an attempt to undermine them.",
          consequence: "Becoming defensive, demoralized, and less receptive to learning, potentially damaging the working relationship.",
          learning: "Assume the senior developer's intent is to improve code quality and mentor (albeit perhaps clumsily delivered), rather than to belittle. Seek clarification on the feedback's intent if unsure."
        }
      ],
      indicators: [
        "Quickly jumping to conclusions about others' negative intentions.",
        "Personalizing issues that could be systemic, accidental, or due to simple error.",
        "Lack of concrete evidence for malicious intent, yet a strong belief in it.",
        "A tendency to interpret ambiguous actions in the most negative light possible."
      ],
      applications: [
        "In workplace conflicts or disagreements, actively consider if miscommunication, misunderstanding, or error is more likely than deliberate sabotage or ill will.",
        "When interpreting social media comments or online interactions, give the benefit of the doubt before assuming hostility or intentional offense.",
        "Before accusing someone of negative intent, ask clarifying questions to understand their perspective and the possibility of an honest mistake or oversight.",
        "In team settings, promote a culture where it's safe to admit mistakes, reducing the likelihood of covering up errors that could then be misinterpreted as malice."
      ]
    },
    {
      title: "Sagan Standard (ECREE)",
      principle: "Extraordinary claims require extraordinary evidence.",
      pattern: "The more a claim deviates from well-established knowledge or common experience, the higher the burden of proof required to accept it.",
      origin_and_evolution: "Popularized by astronomer Carl Sagan (e.g., in 'Cosmos', 'Broca's Brain'). Precursors include Marcello Truzzi ('Extraordinary claims require extraordinary proof', 1975), David Hume (on miracles, 1748), Pierre-Simon Laplace, and Thomas Jefferson, who expressed similar ideas on proportionality of evidence. (Framework 1.4)",
      theoretical_foundations: "Based on principles of epistemic caution and Bayesian reasoning. An extraordinary claim has a low prior probability; therefore, very strong evidence (a high likelihood ratio) is needed to make its posterior probability significant. It manages the risk of prematurely accepting highly improbable and potentially disruptive claims. (Framework 1.1, 1.3, 2.1)",
      distinction_from_biases_heuristics: "A consciously applied evaluative principle, not an automatic bias. It serves to counteract credulity, wishful thinking, or the appeal of novelty by demanding rigorous justification for claims that challenge established understanding. (Framework 1.2)",
      boundary_conditions_limitations: "Defining 'extraordinary claim' and 'extraordinary evidence' can be subjective and context-dependent, evolving with knowledge. If applied too rigidly, it could stifle genuinely novel or paradigm-shifting ideas that initially lack overwhelming proof, especially if it affirms existing confirmation biases. Many scientific breakthroughs were initially 'extraordinary'. (Framework 1.5)",
      methodological_approaches: "Informal: Initial assessment of a claim's extraordinariness, then demanding higher quality/quantity of evidence. Formal: In hypothesis testing, requires much lower p-value for extraordinary alternative hypotheses. In Bayesian terms, assign a very low prior probability to the claim. (Framework 2.1)",
      evidence_prioritized: "Prioritizes the strength, quality, quantity, and reproducibility of empirical evidence, especially for claims contradicting established knowledge. 'Extraordinary evidence' often means an unusually large number of observations, highly rigorous methodology, replicability by independent researchers, and multiple converging lines of evidence. (Framework 2.2)",
      implementation_patterns: "Evaluating pseudoscientific claims (e.g., homeopathy, astrology, perpetual motion machines). Assessing novel scientific discoveries that challenge fundamental theories. Used in journalism and critical thinking to vet unusual assertions. (Framework 2.3, 3.1)",
      contextual_adaptations: "In well-established scientific fields, the bar for 'extraordinary' is very high. In nascent fields, it might be slightly lower but still demands robust evidence. The nature of 'extraordinary evidence' varies (e.g., 5-sigma in particle physics vs. converging historical sources). (Framework 3.2)",
      successful_applications: ["Debunking paranormal claims lacking rigorous proof. Evaluating alternative medicine (e.g., homeopathy lacks extraordinary evidence for its extraordinary claims). Assessing claims of new fundamental forces or particles in physics. (Framework 3.3)"],
      unsuccessful_applications: ["Potentially, overly skeptical rejection of early, unconventional ideas that later proved valid (e.g., initial resistance to continental drift). Defining 'extraordinary' too narrowly based on current paradigms can hinder progress. (Framework 3.3)"],
      counter_arguments_or_anti_razors: "Critics argue an overly rigid application can suppress innovation. The definition of 'extraordinary' can be biased by existing paradigms. Some argue 'ordinary claims also require ordinary evidence,' emphasizing consistent evidential standards. The challenge is balancing healthy skepticism with openness to genuine novelty.",
      related_razors: ["Occam's Razor", "Hitchens's Razor", "Falsifiability Principle"],
      examples: [
        {
          title: "Claim of Perpetual Motion",
          context: "An inventor claims to have built a machine that runs indefinitely without an external energy source, violating laws of thermodynamics.",
          blindspot: "Accepting a demonstration in uncontrolled conditions or testimonial anecdotes as sufficient proof.",
          consequence: "Investing in a fraudulent scheme, wasting resources on a physical impossibility.",
          learning: "Such a claim overturns fundamental, well-verified physics; it requires exceptionally rigorous, independently verifiable proof, not just a convincing sales pitch."
        },
        {
          title: "Alien Abduction Reports",
          context: "Individuals report being abducted by extraterrestrial beings, often with similar narrative elements.",
          blindspot: "Taking personal testimony alone as sufficient evidence for such an extraordinary event, without considering alternative psychological or neurological explanations (e.g., sleep paralysis, false memories).",
          consequence: "Widespread belief in a phenomenon lacking physical or independently verifiable evidence, potentially masking underlying psychological issues.",
          learning: "Personal testimony, especially for events that defy known reality, requires corroborating physical evidence and ruling out more conventional explanations before being accepted."
        },
        {
          title: "New 'Miracle' Diet",
          context: "A new diet program claims rapid, effortless weight loss and cures for various diseases, without exercise or medical basis.",
          blindspot: "Believing testimonials and before/after photos promoted by the diet seller, without seeking peer-reviewed scientific studies.",
          consequence: "Wasting money, potential health risks from an unproven diet, and disappointment when extraordinary results don't materialize.",
          learning: "Claims of effortless, dramatic health transformations are extraordinary and require robust clinical trial data, not just anecdotes, to be credible."
        }
      ],
      indicators: [
        "Claims that contradict well-established scientific laws or principles.",
        "Assertions of phenomena far outside typical human experience or observation.",
        "Lack of peer-reviewed, replicable evidence from credible sources.",
        "Reliance on anecdotal evidence or personal testimony for groundbreaking claims."
      ],
      applications: [
        "When encountering a claim that seems 'too good to be true' or radically challenges established knowledge, significantly increase your skepticism and demand a high level of proof.",
        "Evaluate the source of extraordinary claims: are they from reputable scientific institutions or from sources with a vested interest or history of promoting unproven ideas?",
        "Look for multiple, independent lines of evidence that corroborate an extraordinary claim, not just a single study or observation.",
        "Distinguish between claims that are merely new or surprising versus those that are truly 'extraordinary' in their implications for existing understanding."
      ]
    },
    {
      title: "Hitchens's Razor",
      principle: "What can be asserted without evidence can also be dismissed without evidence.",
      pattern: "The burden of proof lies with the person making an assertion, not with the person questioning it. Unsubstantiated claims require no rebuttal.",
      origin_and_evolution: "Popularized by author and journalist Christopher Hitchens. It's a modern articulation of the traditional philosophical principle that the onus probandi (burden of proof) rests on the claimant. If no evidence is offered for a claim, there is no need to expend effort refuting it.",
      theoretical_foundations: "Based on principles of rational discourse and epistemic responsibility. It prevents the proliferation of baseless assertions by establishing a minimum requirement for a claim to be taken seriously: it must be accompanied by some form of supporting evidence or argument. (Framework 1.1, 1.3)",
      distinction_from_biases_heuristics: "A consciously applied principle for evaluating discourse, not an unconscious bias. It serves as a filter against unsubstantiated claims, promoting efficiency in argumentation by focusing on claims that have at least some initial backing.",
      boundary_conditions_limitations: "While it allows dismissal *without evidence*, it doesn't mean the dismissed claim is necessarily false, only that it hasn't met the initial burden of proof to warrant engagement. Sometimes, even an unsubstantiated claim might be worth investigating if it comes from a generally reliable source or if the potential implications are significant (though investigation requires seeking evidence). It's primarily for claims presented as factual assertions.",
      methodological_approaches: "In debates or discussions, if a participant makes an assertion and provides no evidence when asked, one can invoke this razor to move on without needing to disprove the assertion. It's a way to manage the flow of argument and avoid getting bogged down in baseless claims. (Framework 2.1, 2.3)",
      evidence_prioritized: "Prioritizes the *mere presence or absence* of any credible evidence. The razor's primary function is to filter out entirely unsubstantiated assertions. The quality of evidence becomes relevant *after* some evidence is presented. (Framework 2.2)",
      implementation_patterns: "Responding to unsupported claims in online discussions, political debates, or everyday arguments. Useful for avoiding 'proving a negative' when someone makes a positive assertion without backing.",
      contextual_adaptations: "More strictly applied in formal debates or academic discourse. In casual conversation, one might be more lenient but still aware of the principle.",
      successful_applications: ["Dismissing conspiracy theories presented without any credible sources or logical reasoning. Ignoring marketing claims that offer no data or verifiable facts.", "In a debate, if an opponent makes a wild claim and offers no support, stating 'That's an assertion without evidence, and can be dismissed as such' allows focus on substantiated points."],
      unsuccessful_applications: ["Misusing it to shut down novel ideas that are still in the early, speculative phase before evidence has been gathered, if the context is brainstorming rather than formal assertion.", "Applying it too aggressively in personal relationships where emotional expression, not factual assertion, is primary."],
      counter_arguments_or_anti_razors: "Some might argue that certain self-evident truths or axiomatic beliefs don't require external evidence (though these are usually foundational, not specific assertions about the world). A claim being dismissed for lack of evidence doesn't inherently make it false, just unsupported.",
      related_razors: ["Sagan Standard (deals with *extraordinary* claims once evidence *is* presented)", "Burden of Proof (glossary)", "Occam's Razor"],
      examples: [
        {
          title: "Unsupported Health Claim",
          context: "Someone asserts, 'Drinking celery juice every morning cures all forms of cancer.'",
          blindspot: "Feeling obligated to research and present extensive scientific evidence to disprove this specific claim, rather than recognizing its baselessness.",
          consequence: "Wasting time and energy refuting an assertion that was never substantiated by the claimant.",
          learning: "A claim made without any supporting evidence (like peer-reviewed studies for a medical cure) can be dismissed without needing a counter-argument. The burden is on the claimant."
        },
        {
          title: "Vague Accusation",
          context: "In a discussion, someone says, 'Politician X is corrupt,' without offering any specific instances, sources, or evidence.",
          blindspot: "Engaging in a lengthy debate trying to defend Politician X or demanding specific proof that might not exist or be forthcoming.",
          consequence: "The conversation gets sidetracked by an unsubstantiated assertion, and no meaningful discussion about actual policies or actions occurs.",
          learning: "If an assertion is made without evidence, one can simply state that and request evidence, or choose to dismiss it and move on to discuss substantiated points."
        },
        {
          title: "Supernatural Assertion",
          context: "A person claims, 'My house is haunted by a ghost that rearranges the furniture at night,' but provides no photos, videos, or other verifiable proof.",
          blindspot: "Attempting to scientifically disprove the existence of this specific ghost or ghosts in general.",
          consequence: "Engaging in an unproductive argument about an unfalsifiable claim based on personal belief without evidence.",
          learning: "Claims of supernatural events asserted without any verifiable evidence can be dismissed without requiring an alternative explanation or disproof. The claimant needs to provide the evidence."
        }
      ],
      indicators: [
        "Assertions made without any supporting data, sources, or logical reasoning.",
        "Expectation that others should disprove a claim rather than the claimant proving it.",
        "Claims that are presented as fact but lack any verifiable basis."
      ],
      applications: [
        "When faced with an unsupported assertion in a debate or discussion, you can state that no evidence has been provided and therefore the claim can be dismissed until evidence is offered.",
        "Avoid the trap of trying to 'prove a negative' when someone makes a positive assertion without any backing.",
        "In critical thinking, use this as a filter: if a claim comes with no evidence, it doesn't yet warrant serious consideration or rebuttal.",
        "Encourage those making claims to provide their evidence, shifting the burden of proof appropriately."
      ]
    }
  ]
};

// Each Razor is displayed in a Card
const RazorCard = ({ razor, isFavorite, onToggleFavorite, searchTokens }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);
  const [showShareDialog, setShowShareDialog] = useState(false);

  if (!razor) return null;

  // Helper to apply both highlightings
  const renderHighlightedText = (text) => {
    if (!text) return '';
    const glossaryHighlighted = highlightGlossaryTerms(text, glossaryData);
    return applySearchHighlight(glossaryHighlighted, searchTokens);
  };

  const advancedContent = [
    { title: 'Origin & Evolution', content: razor.origin_and_evolution, Icon: ScrollText, color: 'text-blue-600 dark:text-blue-400' },
    { title: 'Theoretical Foundations', content: razor.theoretical_foundations, Icon: Sigma, color: 'text-green-600 dark:text-green-400' },
    { title: 'Distinction from Biases/Heuristics', content: razor.distinction_from_biases_heuristics, Icon: Puzzle, color: 'text-purple-600 dark:text-purple-400' },
    { title: 'Boundary Conditions & Limitations', content: razor.boundary_conditions_limitations, Icon: Waypoints, color: 'text-red-600 dark:text-red-400' },
    { title: 'Formal Applications (if any)', content: razor.formal_applications_if_any, Icon: TestTube2, color: 'text-yellow-600 dark:text-yellow-400' },
    { title: 'Counter Arguments / Anti-Razors', content: razor.counter_arguments_or_anti_razors, Icon: GitCompareArrows, color: 'text-orange-600 dark:text-orange-400' },
    { 
      title: 'Related Razors', 
      content: razor.related_razors && razor.related_razors.join(', '), 
      Icon: Link, 
      color: 'text-cyan-600 dark:text-cyan-400',
      isList: true,
      listItems: razor.related_razors
    },
  ].filter(item => item.content || (item.isList && item.listItems && item.listItems.length > 0));

  return (
    <>
      <Card className="mb-6 dark:bg-gray-800 dark:text-white">
      <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
          <Brain className="h-6 w-6" />
          {razor.title}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowShareDialog(true)}
                className="focus:outline-none mr-2"
                aria-label="Share this razor"
              >
                <Share2 className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>
              <button 
                onClick={() => onToggleFavorite(razor.title)}
                className="focus:outline-none"
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorite ? (
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                ) : (
                  <StarOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                )}
              </button>
            </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
          <p className="text-lg mb-4 prose dark:prose-invert max-w-none">
            {renderHighlightedText(razor.principle)}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              Pattern Recognition
            </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none">
                {renderHighlightedText(razor.pattern)}
              </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
              Warning Signs
            </h4>
              <ul className="list-none space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {razor.indicators &&
                razor.indicators.map((indicator, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="h-2 w-2 min-w-[0.5rem] rounded-full bg-red-500" />
                      <span>{renderHighlightedText(indicator)}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>

          <div className="mb-6">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Compass className="h-5 w-5 text-teal-500 dark:text-teal-400" />
              How to Apply
            </h4>
            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none">
              {razor.applications &&
                razor.applications.map((app, i) => (
                  <li key={i}>{renderHighlightedText(app)}</li>
                ))}
            </ul>
          </div>

          {razor.examples && razor.examples.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
              >
                {showDetails ? 'Hide Case Studies' : 'Show Case Studies'}
                <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}

          {showDetails && razor.examples && razor.examples.length > 0 && (
            <div className="mt-2 mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700">
              <h4 className="font-semibold mb-3 text-base flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                Case Studies
              </h4>
              <Card className="bg-white dark:bg-gray-700">
                <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <button
                        onClick={() => setCurrentExample((prev) => Math.max(0, prev - 1))}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                          disabled={currentExample === 0}
                        >
                          Previous
                        </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                          {currentExample + 1} of {razor.examples.length}
                        </span>
                        <button
                        onClick={() => setCurrentExample((prev) => Math.min(razor.examples.length - 1, prev + 1))}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                          disabled={currentExample === razor.examples.length - 1}
                        >
                          Next
                        </button>
                      </div>
                    <h5 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
                    {renderHighlightedText(razor.examples[currentExample].title)}
                      </h5>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none">
                    <p><strong>Context:</strong> {renderHighlightedText(razor.examples[currentExample].context)}</p>
                    <p><strong>Blindspot:</strong> {renderHighlightedText(razor.examples[currentExample].blindspot)}</p>
                    <p><strong>Consequence:</strong> {renderHighlightedText(razor.examples[currentExample].consequence)}</p>
                    <p><strong>Key Learning:</strong> {renderHighlightedText(razor.examples[currentExample].learning)}</p>
                      </div>
                </CardContent>
              </Card>
            </div>
        )}

          {advancedContent.length > 0 && (
            <div className="mt-6 pt-4 border-t dark:border-gray-700">
              <button
                onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
              >
                {showAdvancedDetails ? 'Hide Advanced Details' : 'Show Advanced Details'}
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedDetails ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}

          {showAdvancedDetails && advancedContent.length > 0 && (
            <div className="mt-2 space-y-6">
              {advancedContent.map((item, index) => (
                item.content && (
                  <div key={index}>
                    <h4 className={`font-semibold mb-1 flex items-center gap-2 text-base ${item.color}`}>
                      <item.Icon className="h-5 w-5 flex-shrink-0" />
                      {item.title}
          </h4>
                    {item.isList && item.listItems ? (
                      <ul className="list-disc ml-7 text-sm text-gray-700 dark:text-gray-300 space-y-1 prose dark:prose-invert max-w-none">
                        {item.listItems.map((relatedRazor, idx) => (
                          <li key={idx}>{renderHighlightedText(relatedRazor)}</li>
              ))}
          </ul>
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none">
                        {renderHighlightedText(item.content)}
                      </p>
                    )}
        </div>
                )
              ))}
            </div>
          )}

        </CardContent>
      </Card>
      <ShareDialog 
        isOpen={showShareDialog} 
        onClose={() => setShowShareDialog(false)} 
        razor={razor} 
      />
    </>
  );
};

const RazorsDashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState('foundationalRazors');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [corpus, setCorpus] = useState(null);

  // Calculate processed search tokens when searchQuery changes
  const processedSearchTokensArray = useMemo(() => {
    return getProcessedSearchTokens(searchQuery);
  }, [searchQuery]);

  // Initialize TF-IDF Corpus
  useEffect(() => {
    const documents = [];
    const documentIds = [];

    Object.keys(razorsData).forEach(categoryKey => {
      razorsData[categoryKey].forEach(razor => {
        const docId = `${categoryKey}:::${razor.title}`; 
        let searchableText = `
          ${razor.title || ''}
          ${razor.principle || ''}
          ${razor.pattern || ''}
          ${razor.origin_and_evolution || ''}
          ${razor.theoretical_foundations || ''}
          ${razor.distinction_from_biases_heuristics || ''}
          ${razor.boundary_conditions_limitations || ''}
          ${razor.formal_applications_if_any || ''}
          ${razor.counter_arguments_or_anti_razors || ''}
        `;
        
        if (razor.examples && razor.examples.length > 0) {
          searchableText += razor.examples.map(ex => `
            ${ex.title || ''}
            ${ex.context || ''}
            ${ex.blindspot || ''}
            ${ex.consequence || ''}
            ${ex.learning || ''}
          `).join(' ');
        }
        if (razor.indicators && razor.indicators.length > 0) {
          searchableText += ' ' + razor.indicators.join(' ');
        }
        if (razor.applications && razor.applications.length > 0) {
          searchableText += ' ' + razor.applications.join(' ');
        }
        if (razor.related_razors && razor.related_razors.length > 0) {
          searchableText += ' ' + razor.related_razors.join(' ');
        }

        const processedText = preprocessText(searchableText);
        if (processedText) {
          documents.push(processedText);
          documentIds.push(docId);
        }
      });
    });

    if (documents.length > 0 && documentIds.length > 0) {
      try {
        const newCorpus = new Corpus(documentIds, documents, false, []);
        setCorpus(newCorpus);
      } catch (e) {
        console.error("Error creating TF-IDF corpus:", e);
      }
    }
  }, []);

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('mentalRazorsFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    
    // Load view mode preference
    const savedViewMode = localStorage.getItem('mentalRazorsViewMode');
    if (savedViewMode) {
      setViewMode(JSON.parse(savedViewMode));
    }
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem('mentalRazorsFavorites', JSON.stringify(favorites));
  }, [favorites]);
  
  // Save view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('mentalRazorsViewMode', JSON.stringify(viewMode));
  }, [viewMode]);

  const handleToggleFavorite = (razorTitle) => {
    setFavorites(prev => {
      if (prev.includes(razorTitle)) {
        return prev.filter(title => title !== razorTitle);
      } else {
        return [...prev, razorTitle];
      }
    });
  };

  const filteredRazors = (category) => {
    let razorsInCategory = razorsData[category];
    let resultRazors = [];

    if (corpus && searchQuery) {
      const processedQuery = preprocessText(searchQuery);
      if (processedQuery) {
        try {
          const searchResults = corpus.getResultsForQuery(processedQuery);
          
          const scoredRazors = searchResults.map(([docId, score]) => {
            const [catKey, razorTitle] = docId.split(':::');
            if (catKey === category) {
              const originalRazor = razorsData[catKey]?.find(r => r.title === razorTitle);
              if (originalRazor) {
                return { ...originalRazor, searchScore: score };
              }
            }
            return null;
          }).filter(Boolean);

          resultRazors = scoredRazors.sort((a, b) => b.searchScore - a.searchScore);
        } catch(e) {
          console.error("Error during semantic search:", e);
          resultRazors = [...razorsInCategory];
        }
      } else {
        resultRazors = [...razorsInCategory];
      }
    } else {
      resultRazors = [...razorsInCategory];
    }
    
    if (showOnlyFavorites) {
      resultRazors = resultRazors.filter(razor => favorites.includes(razor.title));
    }
    
    return resultRazors;
  };

  // Simple razor card for grid view
  const RazorGridCard = ({ razor, isFavorite, onToggleFavorite, searchTokens }) => {
    const [showShareDialog, setShowShareDialog] = useState(false);
    
    // Helper to apply both highlightings
    const renderHighlightedText = (text) => {
      if (!text) return '';
      const glossaryHighlighted = highlightGlossaryTerms(text, glossaryData);
      return applySearchHighlight(glossaryHighlighted, searchTokens);
    };
    
    return (
      <>
        <Card className="h-full flex flex-col dark:bg-gray-800 dark:text-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {razor.title}
              </div>
              <div className="flex items-center gap-2">
        <button
                  onClick={() => setShowShareDialog(true)}
                  className="focus:outline-none"
                  aria-label="Share this razor"
        >
                  <Share2 className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
        </button>
                <button 
                  onClick={() => onToggleFavorite(razor.title)}
                  className="focus:outline-none"
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {isFavorite ? (
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ) : (
                    <StarOff className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <p className="flex-1 text-sm mb-4 line-clamp-4" title={razor.principle}>
              {renderHighlightedText(razor.principle)}
            </p>
            <div className="mt-auto">
              <h4 className="font-semibold mb-2 text-sm flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Warning Signs
              </h4>
              <ul className="list-none text-xs">
                {razor.indicators && razor.indicators.slice(0, 2).map((indicator, i) => (
                  <li key={i} className="flex items-center gap-1 mb-1 truncate">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    {renderHighlightedText(indicator)}
                  </li>
                ))}
                {razor.indicators && razor.indicators.length > 2 && (
                  <li className="text-gray-500 dark:text-gray-400 text-xs">+ {razor.indicators.length - 2} more</li>
                )}
              </ul>
            </div>
      </CardContent>
    </Card>
        <ShareDialog 
          isOpen={showShareDialog} 
          onClose={() => setShowShareDialog(false)} 
          razor={razor} 
        />
      </>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-2 dark:text-white">
          <Lightbulb className="h-8 w-8" />
          Mental Razors Dashboard
        </h1>
          <Alert className="dark:bg-gray-800 dark:text-white">
          <AlertTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            How to Use This Dashboard
          </AlertTitle>
            <AlertDescription className="dark:text-gray-300">
            Explore different categories of mental razors through examples,
            patterns, and analyses. These help you identify common cognitive traps
            and design flaws. Dive deeper into each razor to see real-world case
            studies and learn practical applications.
          </AlertDescription>
        </Alert>
      </div>

        <DarkModeToggle />
      </div>

      {/* New Resources Section */}
      <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">New to Mental Razors? Start Here:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedCategory('usageGuide')}
            className="flex items-center justify-center text-left p-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
          >
            <BookMarked className="h-6 w-6 mr-3 flex-shrink-0" />
            <div>
              <span className="font-semibold block">View Usage Guide</span>
              <span className="text-sm opacity-90 block">Learn how to apply these tools effectively.</span>
            </div>
          </button>
          <button
            onClick={() => setSelectedCategory('glossary')}
            className="flex items-center justify-center text-left p-4 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-400 dark:focus:ring-green-500"
          >
            <Library className="h-6 w-6 mr-3 flex-shrink-0" />
            <div>
              <span className="font-semibold block">Explore Glossary</span>
              <span className="text-sm opacity-90 block">Understand key terms and concepts.</span>
            </div>
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 flex items-center justify-center ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              aria-label="List view"
              title="List view"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 flex items-center justify-center ${
                viewMode === 'grid' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              aria-label="Grid view"
              title="Grid view"
            >
              <Grid className="h-5 w-5" />
            </button>
          </div>
        </div>
        <FavoritesToggle showOnlyFavorites={showOnlyFavorites} setShowOnlyFavorites={setShowOnlyFavorites} />
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="dark:text-white">
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="foundationalRazors" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Foundational Razors
          </TabsTrigger>
          <TabsTrigger value="expertiseTraps" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Expertise Traps
          </TabsTrigger>
          <TabsTrigger value="systemTraps" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            System Design Traps
          </TabsTrigger>
          <TabsTrigger value="cognitiveTraps" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Cognitive Blindspots
          </TabsTrigger>
        </TabsList>

        {['foundationalRazors', 'expertiseTraps', 'systemTraps', 'cognitiveTraps'].map((category) => (
          <TabsContent key={category} value={category}>
            {filteredRazors(category).length === 0 && selectedCategory === category ? (
              <p className="text-center text-gray-500 dark:text-gray-400 my-8">No razors match your search criteria in this category.</p>
            ) : viewMode === 'grid' && selectedCategory === category ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredRazors(category).map((razor, i) => (
                  <RazorGridCard 
                    key={i} 
                    razor={razor} 
                    isFavorite={favorites.includes(razor.title)}
                    onToggleFavorite={handleToggleFavorite}
                    searchTokens={processedSearchTokensArray}
                  />
                ))}
              </div>
            ) : selectedCategory === category ? (
              filteredRazors(category).map((razor, i) => (
                <RazorCard 
                  key={i} 
                  razor={razor} 
                  isFavorite={favorites.includes(razor.title)}
                  onToggleFavorite={handleToggleFavorite}
                  searchTokens={processedSearchTokensArray}
                />
              ))
            ) : null}
        </TabsContent>
          ))}
        <TabsContent value="usageGuide">
          <UsageGuide />
        </TabsContent>
        <TabsContent value="glossary">
          <GlossaryPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RazorsDashboard;
