
"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";

export function AnalyticsView() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-2">AI-Powered Analytics</h1>
      <p className="text-muted-foreground mb-8">
        Unlock deeper insights into your inventory with generative AI.
      </p>

      <Card className="flex flex-col items-center justify-center text-center p-8 animated-gradient-background">
          <CardHeader>
            <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/20 rounded-full">
                    <Bot className="h-12 w-12 text-primary" />
                </div>
            </div>
            <CardTitle className="text-2xl">Coming Soon!</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              This space will soon feature AI-generated charts and reports, providing you with trends, forecasts, and actionable insights about your inventory usage, user activity, and purchasing patterns.
            </CardDescription>
          </CardHeader>
      </Card>
    </div>
  );
}
