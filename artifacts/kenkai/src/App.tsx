import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";

// Layout
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Assessments from "@/pages/assessments";
import AssessmentDetail from "@/pages/assessment-detail";
import Sessions from "@/pages/sessions";
import SessionDetail from "@/pages/session-detail";
import Reports from "@/pages/reports";
import ReportDetail from "@/pages/report-detail";
import AiChat from "@/pages/ai-chat";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      <Route path="/dashboard">
        <AppLayout><Dashboard /></AppLayout>
      </Route>
      
      <Route path="/assessments">
        <AppLayout><Assessments /></AppLayout>
      </Route>
      <Route path="/assessments/:id">
        <AppLayout><AssessmentDetail /></AppLayout>
      </Route>
      
      <Route path="/sessions">
        <AppLayout><Sessions /></AppLayout>
      </Route>
      <Route path="/sessions/:id">
        <AppLayout><Sessions /></AppLayout>
      </Route>
      
      <Route path="/reports">
        <AppLayout><Reports /></AppLayout>
      </Route>
      <Route path="/reports/:id">
        <AppLayout><ReportDetail /></AppLayout>
      </Route>

      <Route path="/ai">
        <AppLayout><AiChat /></AppLayout>
      </Route>
      
      <Route>
        <AppLayout><NotFound /></AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
