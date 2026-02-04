import { Switch, Route } from "wouter";
import Game from "@/pages/Game";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Game} />
    </Switch>
  );
}

function App() {
  return <Router />;
}

export default App;
