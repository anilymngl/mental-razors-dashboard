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

const { categories, razors } = razorsGenerated;

const getCategoryIcon = (catId) => {
  switch (catId) {
    case 'expertise-traps':
      return Brain;
    case 'system-design-traps':
      return Scale;
    case 'cognitive-blindspots':
      return Activity;
    default:
      return Lightbulb;
  }
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
          {showDetails ? 'Hide Case Studies' : 'Show Case Studies'}
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
