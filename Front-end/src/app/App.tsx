import "./App.css";
import { BrowserRouter as Router } from "react-router-dom";
import { AppLayout } from "./AppLayout";

function App() {
  return (
    <div className="bg-white w-fit md:min-w-7xl">
      <Router>
        <AppLayout />
      </Router>
    </div>
  );
}

export default App;
