import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Brain,
  Lightbulb,
  Target,
  AlertTriangle,
  Compass,
  BookOpen,
  Activity,
  Eye,
  Scale
} from 'lucide-react';

// Updated data structure without success metrics, more case studies, and new razors.
const razorsData = {
  expertiseTraps: [
    {
      title: 'Legacy Razor',
      principle:
        "The more successful a past solution was, the more likely it's blinding you to a better current solution.",
      pattern:
        'Success creates emotional attachment to methods that may no longer be optimal.',
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
          blindspot: "Dismisses microservices as 'unnecessary complexity'",
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
        'Schedule regular assumption audits',
        'Seek out practitioners of opposing methods',
        'Force yourself to experiment with new paradigms'
      ]
    },
    {
      title: 'Simplicity Razor',
      principle:
        "If an expert can't give you a simple example where their theory fails, they've stopped thinking and started believing.",
      pattern: 'Complex models often hide unfalsifiable assumptions.',
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
        'Ask for clear failure examples',
        'Look for comfort with uncertainty',
        'Ensure theories are testable and falsifiable'
      ]
    },
    {
      title: 'Confidence Razor',
      principle:
        "The more a person cites their credentials, the less they're relying on logic or evidence.",
      pattern:
        'Over-reliance on authority signals insecurity or a weak argument.',
      examples: [
        {
          title: 'The Conference Speaker',
          context:
            'Begins each session by reciting advanced degrees and awards',
          blindspot: 'Doesn’t actually present new data or robust proof',
          consequence: 'Audience trusts reputation but learns little of value',
          learning:
            'Real expertise demonstrates clarity and evidence, not just credentials.'
        },
        {
          title: 'Senior Dev on a New Stack',
          context:
            'Frequently references years of experience in a legacy language',
          blindspot:
            'Resists peer suggestions because “I’ve done this for 20 years”',
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
        'Blames failures on “lazy” or “ignorant” users'
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
        'Hard to articulate system’s core purpose'
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
            'Sometimes you need to move “up” or “down” a level to find the real problem.'
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
        'Question whether you’re solving the right problem'
      ]
    },
    {
      title: 'Coherence Razor',
      principle:
        "If you can explain something clearly but can't predict what happens next, you've created a story, not an understanding.",
      pattern:
        'Narratives give the illusion of insight while failing the test of prediction.',
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
            'A developer knows the codebase is messy but dreads the “big rewrite”',
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
  ]
};


// Each Razor is displayed in a Card
const RazorCard = ({ razor }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);

  if (!razor) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6" />
          {razor.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg mb-4">{razor.principle}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Pattern Recognition
            </h4>
            <p>{razor.pattern}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Warning Signs
            </h4>
            <ul className="list-none">
              {razor.indicators &&
                razor.indicators.map((indicator, i) => (
                  <li key={i} className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    {indicator}
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {showDetails && (
          <>
            <div className="mt-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Case Studies
              </h4>
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  {razor.examples && razor.examples.length > 0 && (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <button
                          onClick={() =>
                            setCurrentExample((prev) => Math.max(0, prev - 1))
                          }
                          className="text-blue-500 hover:text-blue-700"
                          disabled={currentExample === 0}
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-500">
                          {currentExample + 1} of {razor.examples.length}
                        </span>
                        <button
                          onClick={() =>
                            setCurrentExample((prev) =>
                              Math.min(razor.examples.length - 1, prev + 1)
                            )
                          }
                          className="text-blue-500 hover:text-blue-700"
                          disabled={currentExample === razor.examples.length - 1}
                        >
                          Next
                        </button>
                      </div>
                      <h5 className="font-semibold mb-2">
                        {razor.examples[currentExample].title}
                      </h5>
                      <div className="space-y-2">
                        <p>
                          <strong>Context:</strong>{' '}
                          {razor.examples[currentExample].context}
                        </p>
                        <p>
                          <strong>Blindspot:</strong>{' '}
                          {razor.examples[currentExample].blindspot}
                        </p>
                        <p>
                          <strong>Consequence:</strong>{' '}
                          {razor.examples[currentExample].consequence}
                        </p>
                        <p>
                          <strong>Key Learning:</strong>{' '}
                          {razor.examples[currentExample].learning}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        <div className="mt-6">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Compass className="h-4 w-4" />
            How to Apply
          </h4>
          <ul className="list-disc ml-6">
            {razor.applications &&
              razor.applications.map((app, i) => (
                <li key={i} className="mb-1">
                  {app}
                </li>
              ))}
          </ul>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-4 text-sm text-blue-500 hover:text-blue-700"
        >
          {showDetails ? 'Show Less' : 'Show More'}
        </button>
      </CardContent>
    </Card>
  );
};

const RazorsDashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState('expertiseTraps');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <Lightbulb className="h-8 w-8" />
          Mental Razors Dashboard
        </h1>
        <Alert>
          <AlertTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            How to Use This Dashboard
          </AlertTitle>
          <AlertDescription>
            Explore different categories of mental razors through examples,
            patterns, and analyses. These help you identify common cognitive traps
            and design flaws. Dive deeper into each razor to see real-world case
            studies and learn practical applications.
          </AlertDescription>
        </Alert>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="mb-6">
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

        <TabsContent value="expertiseTraps">
          {razorsData.expertiseTraps.map((razor, i) => (
            <RazorCard key={i} razor={razor} />
          ))}
        </TabsContent>
        <TabsContent value="systemTraps">
          {razorsData.systemTraps.map((razor, i) => (
            <RazorCard key={i} razor={razor} />
          ))}
        </TabsContent>
        <TabsContent value="cognitiveTraps">
          {razorsData.cognitiveTraps.map((razor, i) => (
            <RazorCard key={i} razor={razor} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RazorsDashboard;
